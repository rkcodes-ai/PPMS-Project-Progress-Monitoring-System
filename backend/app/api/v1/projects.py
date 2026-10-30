from datetime import datetime, timezone
import math
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status, Request
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from app.core.database import get_db
from app.models.user import User, RoleEnum
from app.models.organization import Section, AcademicYear, AcademicPeriod, Department, AdvisorAssignment
from app.models.project import Project, ProjectMember, MentorAssignment, ProjectStatusEnum, ProjectHealthEnum, ProjectPriorityEnum
from app.models.activity import ProjectActivity, AuditEvent
from app.models.task import Task
from app.models.milestone import Milestone
from app.models.report import ProgressReport
from app.schemas.project import (
    ProjectCreateRequest, ProjectUpdateRequest, ProjectActionRequest,
    ProjectListItemResponse, ProjectDetailResponse, PaginatedProjectsResponse, ProjectMemberItem
)
from app.api.deps import (
    get_current_user_and_token, get_authorized_project_query, check_project_access
)
from app.core.notifications import send_notification
from app.models.notification import NotificationEventTypeEnum
from app.core.csv_export import generate_csv_response

router = APIRouter()


def format_project_item(p: Project) -> ProjectListItemResponse:
    mentor_name = p.mentor.full_name if p.mentor else None
    team_lead_name = p.team_lead.full_name if p.team_lead else "Unassigned"
    return ProjectListItemResponse(
        id=p.id,
        code=p.code,
        title=p.title,
        category=p.category,
        department_id=p.department_id,
        academic_year_id=p.academic_year_id,
        academic_year_name=p.academic_year.name if p.academic_year else "",
        section_id=p.section_id,
        section_code=p.section.code if p.section else "",
        section_name=p.section.name if p.section else "",
        team_lead_id=p.team_lead_id,
        team_lead_name=team_lead_name,
        mentor_id=p.mentor_id,
        mentor_name=mentor_name,
        priority=p.priority,
        status=p.status,
        health_status=p.health_status,
        progress_percentage=p.progress_percentage,
        start_date=p.start_date,
        planned_completion_date=p.planned_completion_date,
        created_at=p.created_at
    )

@router.get("", response_model=PaginatedProjectsResponse)
def list_projects(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    academic_year_id: Optional[int] = None,
    section_id: Optional[int] = None,
    category: Optional[str] = None,
    status: Optional[ProjectStatusEnum] = None,
    mentor_id: Optional[int] = None,
    search: Optional[str] = None,
    user_and_token: tuple[User, dict] = Depends(get_current_user_and_token),
    db: Session = Depends(get_db)
):
    user, payload = user_and_token
    active_role = RoleEnum(payload.get("active_role"))

    # Security: Query automatically scoped by active role permissions
    query = get_authorized_project_query(user, active_role, db)

    if academic_year_id:
        ay = db.query(AcademicYear).filter(
            (AcademicYear.id == academic_year_id) | (AcademicYear.year_number == academic_year_id)
        ).first()
        target_id = ay.id if ay else academic_year_id
        query = query.filter(Project.academic_year_id == target_id)
    if section_id:
        query = query.filter(Project.section_id == section_id)
    if category:
        query = query.filter(Project.category.ilike(f"%{category}%"))
    if status:
        query = query.filter(Project.status == status)
    if mentor_id:
        query = query.filter(Project.mentor_id == mentor_id)
    if search:
        search_filter = or_(
            Project.title.ilike(f"%{search}%"),
            Project.code.ilike(f"%{search}%"),
            Project.description.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)

    total = query.count()
    offset = (page - 1) * size
    projects = query.order_by(Project.id.asc()).offset(offset).limit(size).all()

    items = [format_project_item(p) for p in projects]
    total_pages = math.ceil(total / size) if total > 0 else 1

    return PaginatedProjectsResponse(
        items=items,
        total=total,
        page=page,
        size=size,
        total_pages=total_pages
    )

@router.post("", response_model=ProjectDetailResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    req: ProjectCreateRequest,
    request: Request,
    user_and_token: tuple[User, dict] = Depends(get_current_user_and_token),
    db: Session = Depends(get_db)
):
    user, payload = user_and_token
    active_role = RoleEnum(payload.get("active_role"))

    # Verify section and academic year exist
    section = db.query(Section).filter(Section.id == req.section_id).first()
    if not section:
        raise HTTPException(status_code=400, detail="Invalid section ID.")

    # Role-based restriction on creation
    if active_role == RoleEnum.ADVISOR:
        # Check advisor is assigned to this section
        assignment = db.query(AdvisorAssignment).filter(
            AdvisorAssignment.user_id == user.id,
            AdvisorAssignment.section_id == req.section_id,
            AdvisorAssignment.is_active == True
        ).first()
        if not assignment:
            raise HTTPException(status_code=403, detail="Advisors can only create projects in their assigned section.")

    lead_id = req.team_lead_id if (req.team_lead_id and active_role in [RoleEnum.HOD, RoleEnum.ADVISOR]) else user.id

    # Generate sequential unique code
    max_id = db.query(func.max(Project.id)).scalar() or 0
    next_idx = max_id + 1
    code = f"PRJ-{datetime.now().year}-{next_idx:03d}"

    project = Project(
        code=code,
        title=req.title,
        description=req.description,
        objectives=req.objectives,
        category=req.category,
        department_id=section.department_id,
        academic_year_id=req.academic_year_id,
        academic_period_id=section.academic_period_id,
        section_id=req.section_id,
        team_lead_id=lead_id,
        start_date=req.start_date,
        planned_completion_date=req.planned_completion_date,
        priority=req.priority,
        status=ProjectStatusEnum.DRAFT,
        health_status=ProjectHealthEnum.ON_TRACK,
        progress_percentage=0.0
    )
    db.add(project)
    db.flush()

    # Add team leader as member
    db.add(ProjectMember(project_id=project.id, user_id=lead_id, role_in_team="Leader"))

    # Add other members if provided
    if req.member_user_ids:
        for m_uid in req.member_user_ids:
            if m_uid != lead_id:
                db.add(ProjectMember(project_id=project.id, user_id=m_uid, role_in_team="Member"))

    db.add(ProjectActivity(
        project_id=project.id,
        user_id=user.id,
        activity_type="PROJECT_CREATED",
        description=f"Project proposal created in draft status by {user.full_name}."
    ))
    db.commit()
    db.refresh(project)

    # Return detail
    return get_project(project.id, user_and_token, db)

@router.get("/export")
def export_projects_csv(
    user_and_token: tuple[User, dict] = Depends(get_current_user_and_token),
    db: Session = Depends(get_db)
):
    user, payload = user_and_token
    active_role = RoleEnum(payload.get("active_role"))

    # Strictly query only authorized projects for this role and user
    projects = get_authorized_project_query(user, active_role, db).order_by(Project.code.asc()).all()

    fieldnames = [
        "Project Code",
        "Title",
        "Category",
        "Priority",
        "Section",
        "Academic Year",
        "Team Lead",
        "Mentor",
        "Status",
        "Health",
        "Progress (%)",
        "Planned Completion Date"
    ]

    rows = []
    for p in projects:
        rows.append({
            "Project Code": p.code,
            "Title": p.title,
            "Category": p.category,
            "Priority": p.priority.value if p.priority else "",
            "Section": p.section.code if p.section else "",
            "Academic Year": p.academic_year.name if p.academic_year else "",
            "Team Lead": p.team_lead.full_name if p.team_lead else "Unassigned",
            "Mentor": p.mentor.full_name if p.mentor else "Unassigned",
            "Status": p.status.value if p.status else "",
            "Health": p.health_status.value if p.health_status else "",
            "Progress (%)": f"{p.progress_percentage:.1f}",
            "Planned Completion Date": p.planned_completion_date.strftime("%Y-%m-%d") if p.planned_completion_date else ""
        })

    filename = f"ppms_projects_{active_role.value.lower()}_{datetime.now(timezone.utc).strftime('%Y%m%d')}.csv"
    return generate_csv_response(rows, fieldnames, filename)

@router.get("/{project_id}", response_model=ProjectDetailResponse)

def get_project(
    project_id: int,
    user_and_token: tuple[User, dict] = Depends(get_current_user_and_token),
    db: Session = Depends(get_db)
):
    user, payload = user_and_token
    active_role = RoleEnum(payload.get("active_role"))

    # Security check: Raises 404 or 403 based on authorization
    project = check_project_access(project_id, user, active_role, db)

    members = [
        ProjectMemberItem(
            id=m.id,
            user_id=m.user_id,
            full_name=m.user.full_name,
            email=m.user.email,
            role_in_team=m.role_in_team
        )
        for m in project.members
    ]

    base_item = format_project_item(project)
    return ProjectDetailResponse(
        **base_item.model_dump(),
        description=project.description,
        objectives=project.objectives,
        members=members,
        task_count=len(project.tasks),
        milestone_count=len(project.milestones),
        report_count=len(project.progress_reports)
    )

@router.patch("/{project_id}", response_model=ProjectDetailResponse)
def update_project(
    project_id: int,
    req: ProjectUpdateRequest,
    user_and_token: tuple[User, dict] = Depends(get_current_user_and_token),
    db: Session = Depends(get_db)
):
    user, payload = user_and_token
    active_role = RoleEnum(payload.get("active_role"))

    project = check_project_access(project_id, user, active_role, db)

    # Student cannot change mentor or modify after draft without authorization
    if active_role == RoleEnum.STUDENT and req.mentor_id is not None:
        raise HTTPException(status_code=403, detail="Students cannot assign or change mentors.")

    if req.title is not None:
        project.title = req.title
    if req.description is not None:
        project.description = req.description
    if req.objectives is not None:
        project.objectives = req.objectives
    if req.category is not None:
        project.category = req.category
    if req.priority is not None:
        project.priority = req.priority
    if req.planned_completion_date is not None:
        project.planned_completion_date = req.planned_completion_date
    if req.mentor_id is not None and active_role in [RoleEnum.HOD, RoleEnum.ADVISOR]:
        project.mentor_id = req.mentor_id
        db.add(MentorAssignment(
            project_id=project.id,
            user_id=req.mentor_id,
            assigned_by_id=user.id,
            is_active=True,
            notes="Assigned via project update."
        ))

    db.add(ProjectActivity(
        project_id=project.id,
        user_id=user.id,
        activity_type="PROJECT_UPDATED",
        description=f"Project details updated by {user.full_name} ({active_role.value})."
    ))
    db.commit()
    db.refresh(project)

    return get_project(project.id, user_and_token, db)

@router.post("/{project_id}/submit", response_model=ProjectDetailResponse)
def submit_project_proposal(
    project_id: int,
    req: ProjectActionRequest = None,
    user_and_token: tuple[User, dict] = Depends(get_current_user_and_token),
    db: Session = Depends(get_db)
):
    user, payload = user_and_token
    active_role = RoleEnum(payload.get("active_role"))

    project = check_project_access(project_id, user, active_role, db)

    if project.status != ProjectStatusEnum.DRAFT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot submit project with status '{project.status.value}'. Only DRAFT projects can be submitted."
        )

    project.status = ProjectStatusEnum.SUBMITTED
    db.add(ProjectActivity(
        project_id=project.id,
        user_id=user.id,
        activity_type="PROPOSAL_SUBMITTED",
        description="Project proposal submitted for formal academic review."
    ))

    # Notify active section advisor if assigned
    advisor_assignment = db.query(AdvisorAssignment).filter(
        AdvisorAssignment.section_id == project.section_id,
        AdvisorAssignment.is_active == True
    ).first()
    if advisor_assignment:
        send_notification(
            db=db,
            recipient_id=advisor_assignment.user_id,
            event_type=NotificationEventTypeEnum.REVIEW_REQUEST,
            title=f"New Proposal Submitted: {project.code}",
            message=f"Team {project.code} ('{project.title}') submitted their proposal for review.",
            resource_type="project",
            resource_id=project.id
        )

    db.commit()
    db.refresh(project)

    return get_project(project.id, user_and_token, db)

@router.post("/{project_id}/approve", response_model=ProjectDetailResponse)
def approve_project(
    project_id: int,
    req: ProjectActionRequest = None,
    user_and_token: tuple[User, dict] = Depends(get_current_user_and_token),
    db: Session = Depends(get_db)
):
    user, payload = user_and_token
    active_role = RoleEnum(payload.get("active_role"))

    if active_role == RoleEnum.STUDENT:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Students are not authorized to approve projects.")

    project = check_project_access(project_id, user, active_role, db)

    # Valid transitions: SUBMITTED / UNDER_REVIEW -> APPROVED, or SUBMITTED_FOR_FINAL_REVIEW -> COMPLETED
    if project.status in [ProjectStatusEnum.SUBMITTED, ProjectStatusEnum.UNDER_REVIEW]:
        project.status = ProjectStatusEnum.APPROVED
        activity_msg = f"Project proposal approved by {user.full_name} ({active_role.value})."
    elif project.status == ProjectStatusEnum.SUBMITTED_FOR_FINAL_REVIEW:
        project.status = ProjectStatusEnum.COMPLETED
        project.health_status = ProjectHealthEnum.COMPLETED
        activity_msg = f"Final project deliverables approved and marked completed by {user.full_name} ({active_role.value})."
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid transition: Cannot approve project in status '{project.status.value}'."
        )

    db.add(ProjectActivity(
        project_id=project.id,
        user_id=user.id,
        activity_type="PROJECT_APPROVED",
        description=activity_msg
    ))
    db.add(AuditEvent(
        user_id=user.id,
        action="APPROVE_PROJECT",
        resource_type="project",
        resource_id=project.id,
        details=activity_msg
    ))

    # Notify all project members
    for member in project.members:
        send_notification(
            db=db,
            recipient_id=member.user_id,
            event_type=NotificationEventTypeEnum.PROPOSAL_DECISION,
            title=f"Project Approved: {project.code}",
            message=f"Project '{project.title}' was approved by {user.full_name} ({active_role.value}).",
            resource_type="project",
            resource_id=project.id
        )

    db.commit()
    db.refresh(project)

    return get_project(project.id, user_and_token, db)

@router.post("/{project_id}/reject", response_model=ProjectDetailResponse)
def reject_project(
    project_id: int,
    req: ProjectActionRequest = None,
    user_and_token: tuple[User, dict] = Depends(get_current_user_and_token),
    db: Session = Depends(get_db)
):
    user, payload = user_and_token
    active_role = RoleEnum(payload.get("active_role"))

    if active_role not in [RoleEnum.HOD, RoleEnum.ADVISOR]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only HOD or section Advisor can reject proposals.")

    project = check_project_access(project_id, user, active_role, db)

    if project.status not in [ProjectStatusEnum.SUBMITTED, ProjectStatusEnum.UNDER_REVIEW]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot reject project with status '{project.status.value}'."
        )

    project.status = ProjectStatusEnum.REJECTED
    reason = req.comments if req and req.comments else "Requirements criteria not met."
    db.add(ProjectActivity(
        project_id=project.id,
        user_id=user.id,
        activity_type="PROPOSAL_REJECTED",
        description=f"Project proposal rejected by {user.full_name}: {reason}"
    ))
    db.add(AuditEvent(
        user_id=user.id,
        action="REJECT_PROJECT",
        resource_type="project",
        resource_id=project.id,
        details=f"Project proposal rejected: {reason}"
    ))

    # Notify team members of rejection and feedback
    for member in project.members:
        send_notification(
            db=db,
            recipient_id=member.user_id,
            event_type=NotificationEventTypeEnum.PROPOSAL_DECISION,
            title=f"Proposal Returned for Revision: {project.code}",
            message=f"Proposal returned for revisions: {reason}",
            resource_type="project",
            resource_id=project.id
        )

    db.commit()
    db.refresh(project)

    return get_project(project.id, user_and_token, db)

