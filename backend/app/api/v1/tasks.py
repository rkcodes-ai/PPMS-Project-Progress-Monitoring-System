from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User, RoleEnum
from app.models.project import Project, ProjectMember
from app.models.task import Task, TaskStatusEnum, TaskPriorityEnum
from app.models.activity import ProjectActivity
from app.schemas.task import (
    TaskCreateRequest, TaskUpdateRequest, TaskSubmitReviewRequest,
    TaskReviewRequest, TaskResponse
)
from app.services.progress_service import calculate_project_progress, evaluate_project_health
from app.api.deps import (
    get_current_user_and_token, check_project_access, check_task_access
)
from app.core.notifications import send_notification
from app.models.notification import NotificationEventTypeEnum

router = APIRouter()


def sync_project_progress_and_health(project: Project, db: Session):
    tasks = db.query(Task).filter(Task.project_id == project.id).all()
    milestones = project.milestones
    new_progress = calculate_project_progress(tasks)
    health, _ = evaluate_project_health(
        progress=new_progress,
        start_date=project.start_date,
        planned_completion_date=project.planned_completion_date,
        tasks=tasks,
        milestones=milestones,
        now=datetime.now(timezone.utc)
    )
    project.progress_percentage = new_progress
    project.health_status = health
    db.flush()

def format_task_response(task: Task) -> TaskResponse:
    return TaskResponse(
        id=task.id,
        project_id=task.project_id,
        title=task.title,
        description=task.description,
        assignee_id=task.assignee_id,
        assignee_name=task.assignee.full_name if task.assignee else None,
        priority=task.priority,
        start_date=task.start_date,
        due_date=task.due_date,
        estimated_effort=task.estimated_effort,
        status=task.status,
        completion_fraction=task.completion_fraction,
        submission_details=task.submission_details,
        review_status=task.review_status,
        created_at=task.created_at,
        updated_at=task.updated_at
    )

@router.get("/projects/{project_id}/tasks", response_model=List[TaskResponse])
def list_project_tasks(
    project_id: int,
    user_and_token: tuple[User, dict] = Depends(get_current_user_and_token),
    db: Session = Depends(get_db)
):
    user, payload = user_and_token
    active_role = RoleEnum(payload.get("active_role"))

    # Security check: ensures project access is authorized
    project = check_project_access(project_id, user, active_role, db)
    tasks = db.query(Task).filter(Task.project_id == project.id).order_by(Task.due_date.asc()).all()
    return [format_task_response(t) for t in tasks]

@router.post("/projects/{project_id}/tasks", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_project_task(
    project_id: int,
    req: TaskCreateRequest,
    user_and_token: tuple[User, dict] = Depends(get_current_user_and_token),
    db: Session = Depends(get_db)
):
    user, payload = user_and_token
    active_role = RoleEnum(payload.get("active_role"))

    project = check_project_access(project_id, user, active_role, db)

    # Validate assignee if provided
    if req.assignee_id:
        member = db.query(ProjectMember).filter(
            ProjectMember.project_id == project.id,
            ProjectMember.user_id == req.assignee_id
        ).first()
        if not member:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"User ID {req.assignee_id} is not a member of project {project.code}."
            )

    task = Task(
        project_id=project.id,
        title=req.title,
        description=req.description,
        assignee_id=req.assignee_id,
        priority=req.priority,
        start_date=req.start_date,
        due_date=req.due_date,
        estimated_effort=req.estimated_effort,
        status=TaskStatusEnum.TO_DO,
        completion_fraction=0.0
    )
    db.add(task)
    db.flush()

    sync_project_progress_and_health(project, db)

    db.add(ProjectActivity(
        project_id=project.id,
        user_id=user.id,
        activity_type="TASK_CREATED",
        description=f"Task '{task.title}' created with effort weight {task.estimated_effort}."
    ))

    # Notify assignee if assigned to someone else
    if task.assignee_id and task.assignee_id != user.id:
        send_notification(
            db=db,
            recipient_id=task.assignee_id,
            event_type=NotificationEventTypeEnum.TASK_ASSIGNED,
            title=f"New Task Assigned: {task.title}",
            message=f"You were assigned to task '{task.title}' in project '{project.title}'.",
            resource_type="task",
            resource_id=task.id
        )

    db.commit()
    db.refresh(task)


    return format_task_response(task)

@router.get("/tasks/{task_id}", response_model=TaskResponse)
def get_task(
    task_id: int,
    user_and_token: tuple[User, dict] = Depends(get_current_user_and_token),
    db: Session = Depends(get_db)
):
    user, payload = user_and_token
    active_role = RoleEnum(payload.get("active_role"))

    task, _ = check_task_access(task_id, user, active_role, db)
    return format_task_response(task)

@router.patch("/tasks/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: int,
    req: TaskUpdateRequest,
    user_and_token: tuple[User, dict] = Depends(get_current_user_and_token),
    db: Session = Depends(get_db)
):
    user, payload = user_and_token
    active_role = RoleEnum(payload.get("active_role"))

    task, project = check_task_access(task_id, user, active_role, db)

    # Student update restrictions: students cannot self-complete review tasks or change effort weights
    if active_role == RoleEnum.STUDENT:
        if req.status == TaskStatusEnum.COMPLETED and task.status != TaskStatusEnum.COMPLETED:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Students cannot mark tasks directly as COMPLETED. Please submit for review."
            )
        if req.estimated_effort is not None and req.estimated_effort != task.estimated_effort:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Students cannot modify task weights / estimated effort."
            )
        if req.assignee_id is not None and req.assignee_id != task.assignee_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Students cannot reassign tasks."
            )
    else:
        # Faculty / Admin updates
        if req.title is not None:
            task.title = req.title
        if req.description is not None:
            task.description = req.description
        if req.priority is not None:
            task.priority = req.priority
        if req.start_date is not None:
            task.start_date = req.start_date
        if req.due_date is not None:
            task.due_date = req.due_date
        if req.estimated_effort is not None:
            task.estimated_effort = req.estimated_effort
        if req.assignee_id is not None:
            task.assignee_id = req.assignee_id

    if req.status is not None:
        task.status = req.status
        if req.status == TaskStatusEnum.COMPLETED:
            task.completion_fraction = 1.0
            task.review_status = "Approved"

    if req.completion_fraction is not None:
        task.completion_fraction = req.completion_fraction

    if req.submission_details is not None:
        task.submission_details = req.submission_details

    sync_project_progress_and_health(project, db)

    db.add(ProjectActivity(
        project_id=project.id,
        user_id=user.id,
        activity_type="TASK_UPDATED",
        description=f"Task '{task.title}' updated. Status: {task.status.value}, Completion: {round(task.completion_fraction * 100, 1)}%."
    ))
    db.commit()
    db.refresh(task)

    return format_task_response(task)

@router.post("/tasks/{task_id}/submit-review", response_model=TaskResponse)
def submit_task_for_review(
    task_id: int,
    req: TaskSubmitReviewRequest,
    user_and_token: tuple[User, dict] = Depends(get_current_user_and_token),
    db: Session = Depends(get_db)
):
    user, payload = user_and_token
    active_role = RoleEnum(payload.get("active_role"))

    task, project = check_task_access(task_id, user, active_role, db)

    task.status = TaskStatusEnum.SUBMITTED_FOR_REVIEW
    task.submission_details = req.submission_details
    task.review_status = "Pending Review"
    task.completion_fraction = max(task.completion_fraction, 0.9)

    sync_project_progress_and_health(project, db)

    db.add(ProjectActivity(
        project_id=project.id,
        user_id=user.id,
        activity_type="TASK_SUBMITTED_FOR_REVIEW",
        description=f"Task '{task.title}' submitted for faculty review by {user.full_name}."
    ))

    # Notify project mentor of pending task review
    if project.mentor_id:
        send_notification(
            db=db,
            recipient_id=project.mentor_id,
            event_type=NotificationEventTypeEnum.REVIEW_REQUEST,
            title=f"Task Review Requested: {task.title}",
            message=f"Task '{task.title}' in project '{project.title}' was submitted for review by {user.full_name}.",
            resource_type="task",
            resource_id=task.id
        )

    db.commit()
    db.refresh(task)


    return format_task_response(task)

@router.post("/tasks/{task_id}/review", response_model=TaskResponse)
def review_task(
    task_id: int,
    req: TaskReviewRequest,
    user_and_token: tuple[User, dict] = Depends(get_current_user_and_token),
    db: Session = Depends(get_db)
):
    user, payload = user_and_token
    active_role = RoleEnum(payload.get("active_role"))

    if active_role == RoleEnum.STUDENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Students cannot review or approve tasks."
        )

    task, project = check_task_access(task_id, user, active_role, db)

    if req.decision.lower() in ["approved", "approve"]:
        task.status = TaskStatusEnum.COMPLETED
        task.completion_fraction = 1.0
        task.review_status = "Approved"
        action_desc = f"Task '{task.title}' approved by {user.full_name} ({active_role.value})."
    elif req.decision.lower() in ["changes requested", "revision"]:
        task.status = TaskStatusEnum.CHANGES_REQUESTED
        task.review_status = "Changes Requested"
        task.completion_fraction = min(task.completion_fraction, 0.5)
        action_desc = f"Task '{task.title}' returned for revisions by {user.full_name}: {req.comments or ''}"
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid review decision. Must be 'Approved' or 'Changes Requested'."
        )

    sync_project_progress_and_health(project, db)

    db.add(ProjectActivity(
        project_id=project.id,
        user_id=user.id,
        activity_type="TASK_REVIEWED",
        description=action_desc
    ))

    # Notify task assignee of review outcome
    if task.assignee_id:
        ev_type = (
            NotificationEventTypeEnum.MENTOR_FEEDBACK
            if req.decision.lower() in ["approved", "approve"]
            else NotificationEventTypeEnum.CORRECTION_REQUESTED
        )
        send_notification(
            db=db,
            recipient_id=task.assignee_id,
            event_type=ev_type,
            title=f"Task Reviewed: {task.title} ({task.review_status})",
            message=action_desc,
            resource_type="task",
            resource_id=task.id
        )

    db.commit()
    db.refresh(task)


    return format_task_response(task)
