from typing import Optional, List
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User, RoleEnum
from app.models.project import Project, ProjectMember, MentorAssignment
from app.models.organization import AdvisorAssignment

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login",
    auto_error=False
)

def get_current_user_and_token(
    db: Session = Depends(get_db),
    token: Optional[str] = Depends(oauth2_scheme)
) -> tuple[User, dict]:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials or session expired.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception

    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    user_id: str = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is inactive or not found."
        )

    # Invalidate tokens from previous sessions if token_version is mismatched
    token_v = payload.get("token_version")
    if token_v is not None and user.token_version is not None:
        if token_v != user.token_version:
            raise credentials_exception

    return user, payload

def get_current_user(
    user_and_token: tuple[User, dict] = Depends(get_current_user_and_token)
) -> User:
    user, _ = user_and_token
    return user

def get_current_active_role(
    user_and_token: tuple[User, dict] = Depends(get_current_user_and_token)
) -> RoleEnum:
    user, payload = user_and_token
    active_role_str = payload.get("active_role")
    if not active_role_str:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No active role specified in session context."
        )
    
    try:
        active_role = RoleEnum(active_role_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Invalid active role '{active_role_str}'."
        )

    # Re-verify that user still holds this role in database
    user_roles = [ur.role.name for ur in user.user_roles]
    if active_role not in user_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"User is not authorized for role {active_role.value}."
        )

    return active_role

class RequireRole:
    def __init__(self, allowed_roles: List[RoleEnum]):
        self.allowed_roles = allowed_roles

    def __call__(
        self,
        active_role: RoleEnum = Depends(get_current_active_role)
    ) -> RoleEnum:
        if active_role not in self.allowed_roles:
            role_names = ", ".join([r.value for r in self.allowed_roles])
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: Requires one of [{role_names}], but current active role is '{active_role.value}'."
            )
        return active_role

def check_project_access(
    project_id: int,
    user: User,
    active_role: RoleEnum,
    db: Session
) -> Project:
    """
    Enforces strict resource-based access control:
    - HOD: Any CSE department project
    - Advisor: Only projects belonging to advisor's assigned section
    - Mentor: Only projects explicitly assigned to mentor
    - Student: Only projects where user is an authorized team member
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID {project_id} not found."
        )

    if active_role == RoleEnum.HOD:
        # HOD has access to all department projects
        if user.department_id and project.department_id != user.department_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Project is outside your department."
            )
        return project

    elif active_role == RoleEnum.ADVISOR:
        # Check active advisor assignment for project's section
        assignment = db.query(AdvisorAssignment).filter(
            AdvisorAssignment.user_id == user.id,
            AdvisorAssignment.section_id == project.section_id,
            AdvisorAssignment.is_active == True
        ).first()
        if not assignment:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: You are not the assigned advisor for section '{project.section.name}'."
            )
        return project

    elif active_role == RoleEnum.MENTOR:
        # Mentor must be explicitly assigned
        is_assigned = (project.mentor_id == user.id)
        if not is_assigned:
            mentor_assignment = db.query(MentorAssignment).filter(
                MentorAssignment.project_id == project.id,
                MentorAssignment.user_id == user.id,
                MentorAssignment.is_active == True
            ).first()
            is_assigned = bool(mentor_assignment)

        if not is_assigned:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: You are not assigned to supervise this project."
            )
        return project

    elif active_role == RoleEnum.STUDENT:
        # Student must be a member of the project team
        membership = db.query(ProjectMember).filter(
            ProjectMember.project_id == project.id,
            ProjectMember.user_id == user.id
        ).first()
        if not membership:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: You are not an authorized member of this project team."
            )
        return project

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Unauthorized access attempt."
    )

def get_authorized_project_query(user: User, active_role: RoleEnum, db: Session):
    """
    Returns a SQLAlchemy query for projects filtered by the user's role-based authorization scope.
    """
    query = db.query(Project)
    if active_role == RoleEnum.HOD:
        if user.department_id:
            query = query.filter(Project.department_id == user.department_id)
        return query

    elif active_role == RoleEnum.ADVISOR:
        assigned_section_ids = [
            a.section_id for a in db.query(AdvisorAssignment).filter(
                AdvisorAssignment.user_id == user.id,
                AdvisorAssignment.is_active == True
            ).all()
        ]
        return query.filter(Project.section_id.in_(assigned_section_ids))

    elif active_role == RoleEnum.MENTOR:
        assigned_proj_ids = set([
            p.id for p in db.query(Project.id).filter(Project.mentor_id == user.id).all()
        ])
        assigned_via_mentor_table = [
            m.project_id for m in db.query(MentorAssignment.project_id).filter(
                MentorAssignment.user_id == user.id,
                MentorAssignment.is_active == True
            ).all()
        ]
        assigned_proj_ids.update(assigned_via_mentor_table)
        return query.filter(Project.id.in_(list(assigned_proj_ids)))

    elif active_role == RoleEnum.STUDENT:
        member_proj_ids = [
            m.project_id for m in db.query(ProjectMember.project_id).filter(
                ProjectMember.user_id == user.id
            ).all()
        ]
        return query.filter(Project.id.in_(member_proj_ids))

    return query.filter(Project.id == -1)

def check_task_access(task_id: int, user: User, active_role: RoleEnum, db: Session):
    from app.models.task import Task
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Task with ID {task_id} not found.")
    project = check_project_access(task.project_id, user, active_role, db)
    return task, project

def check_milestone_access(milestone_id: int, user: User, active_role: RoleEnum, db: Session):
    from app.models.milestone import Milestone
    milestone = db.query(Milestone).filter(Milestone.id == milestone_id).first()
    if not milestone:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Milestone with ID {milestone_id} not found.")
    project = check_project_access(milestone.project_id, user, active_role, db)
    return milestone, project

def check_report_access(report_id: int, user: User, active_role: RoleEnum, db: Session):
    from app.models.report import ProgressReport
    report = db.query(ProgressReport).filter(ProgressReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Report with ID {report_id} not found.")
    project = check_project_access(report.project_id, user, active_role, db)
    return report, project

def check_document_access(document_id: int, user: User, active_role: RoleEnum, db: Session):
    from app.models.document import Document
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Document with ID {document_id} not found.")
    project = check_project_access(document.project_id, user, active_role, db)
    return document, project

def check_conversation_access(conversation_id: int, user: User, active_role: RoleEnum, db: Session):
    from app.models.communication import Conversation, ConversationTypeEnum, ConversationParticipant
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conversation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Conversation with ID {conversation_id} not found.")

    if conversation.conversation_type == ConversationTypeEnum.DIRECT_MESSAGE:
        # Private direct message: only explicitly enrolled participants have access.
        # HOD does not have automatic access to private direct messages.
        participant = db.query(ConversationParticipant).filter(
            ConversationParticipant.conversation_id == conversation.id,
            ConversationParticipant.user_id == user.id
        ).first()
        if not participant:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied: You are not an authorized participant in this private conversation.")
        return conversation, None

    # Project discussion
    if not conversation.project_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Conversation has no associated project.")

    project = check_project_access(conversation.project_id, user, active_role, db)
    return conversation, project


