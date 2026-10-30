from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User, RoleEnum
from app.models.milestone import Milestone, MilestoneTask, MilestoneStatusEnum
from app.models.task import Task
from app.models.activity import ProjectActivity
from app.schemas.milestone import (
    MilestoneCreateRequest, MilestoneUpdateRequest, MilestoneSubmitRequest,
    MilestoneReviewRequest, MilestoneResponse
)
from app.services.progress_service import evaluate_project_health
from app.api.deps import (
    get_current_user_and_token, check_project_access, check_milestone_access
)
from app.core.notifications import send_notification
from app.models.notification import NotificationEventTypeEnum

router = APIRouter()


def format_milestone_response(m: Milestone) -> MilestoneResponse:
    task_ids = [tl.task_id for tl in m.task_links]
    return MilestoneResponse(
        id=m.id,
        project_id=m.project_id,
        title=m.title,
        description=m.description,
        planned_due_date=m.planned_due_date,
        completion_criteria=m.completion_criteria,
        status=m.status,
        submission_status=m.submission_status,
        review_status=m.review_status,
        reviewer_id=m.reviewer_id,
        reviewer_name=m.reviewer.full_name if m.reviewer else None,
        reviewer_comments=m.reviewer_comments,
        completed_at=m.completed_at,
        linked_task_ids=task_ids,
        created_at=m.created_at,
        updated_at=m.updated_at
    )

@router.get("/projects/{project_id}/milestones", response_model=List[MilestoneResponse])
def list_project_milestones(
    project_id: int,
    user_and_token: tuple[User, dict] = Depends(get_current_user_and_token),
    db: Session = Depends(get_db)
):
    user, payload = user_and_token
    active_role = RoleEnum(payload.get("active_role"))

    project = check_project_access(project_id, user, active_role, db)
    milestones = db.query(Milestone).filter(Milestone.project_id == project.id).order_by(Milestone.planned_due_date.asc()).all()
    return [format_milestone_response(m) for m in milestones]

@router.post("/projects/{project_id}/milestones", response_model=MilestoneResponse, status_code=status.HTTP_201_CREATED)
def create_project_milestone(
    project_id: int,
    req: MilestoneCreateRequest,
    user_and_token: tuple[User, dict] = Depends(get_current_user_and_token),
    db: Session = Depends(get_db)
):
    user, payload = user_and_token
    active_role = RoleEnum(payload.get("active_role"))

    project = check_project_access(project_id, user, active_role, db)

    milestone = Milestone(
        project_id=project.id,
        title=req.title,
        description=req.description,
        planned_due_date=req.planned_due_date,
        completion_criteria=req.completion_criteria,
        status=MilestoneStatusEnum.PENDING,
        submission_status="Not Submitted",
        review_status="Pending"
    )
    db.add(milestone)
    db.flush()

    if req.task_ids:
        for tid in req.task_ids:
            task = db.query(Task).filter(Task.id == tid, Task.project_id == project.id).first()
            if task:
                db.add(MilestoneTask(milestone_id=milestone.id, task_id=task.id))

    db.add(ProjectActivity(
        project_id=project.id,
        user_id=user.id,
        activity_type="MILESTONE_CREATED",
        description=f"Milestone '{milestone.title}' added with target date {milestone.planned_due_date.strftime('%Y-%m-%d')}."
    ))
    db.commit()
    db.refresh(milestone)

    return format_milestone_response(milestone)

@router.get("/milestones/{milestone_id}", response_model=MilestoneResponse)
def get_milestone(
    milestone_id: int,
    user_and_token: tuple[User, dict] = Depends(get_current_user_and_token),
    db: Session = Depends(get_db)
):
    user, payload = user_and_token
    active_role = RoleEnum(payload.get("active_role"))

    milestone, _ = check_milestone_access(milestone_id, user, active_role, db)
    return format_milestone_response(milestone)

@router.patch("/milestones/{milestone_id}", response_model=MilestoneResponse)
def update_milestone(
    milestone_id: int,
    req: MilestoneUpdateRequest,
    user_and_token: tuple[User, dict] = Depends(get_current_user_and_token),
    db: Session = Depends(get_db)
):
    user, payload = user_and_token
    active_role = RoleEnum(payload.get("active_role"))

    milestone, project = check_milestone_access(milestone_id, user, active_role, db)

    if active_role == RoleEnum.STUDENT and req.planned_due_date is not None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Students cannot modify formal milestone deadlines."
        )

    if req.title is not None:
        milestone.title = req.title
    if req.description is not None:
        milestone.description = req.description
    if req.planned_due_date is not None:
        milestone.planned_due_date = req.planned_due_date
    if req.completion_criteria is not None:
        milestone.completion_criteria = req.completion_criteria

    if req.task_ids is not None:
        db.query(MilestoneTask).filter(MilestoneTask.milestone_id == milestone.id).delete()
        for tid in req.task_ids:
            task = db.query(Task).filter(Task.id == tid, Task.project_id == project.id).first()
            if task:
                db.add(MilestoneTask(milestone_id=milestone.id, task_id=task.id))

    db.add(ProjectActivity(
        project_id=project.id,
        user_id=user.id,
        activity_type="MILESTONE_UPDATED",
        description=f"Milestone '{milestone.title}' updated."
    ))
    db.commit()
    db.refresh(milestone)

    return format_milestone_response(milestone)

@router.post("/milestones/{milestone_id}/submit", response_model=MilestoneResponse)
def submit_milestone(
    milestone_id: int,
    req: MilestoneSubmitRequest = None,
    user_and_token: tuple[User, dict] = Depends(get_current_user_and_token),
    db: Session = Depends(get_db)
):
    user, payload = user_and_token
    active_role = RoleEnum(payload.get("active_role"))

    milestone, project = check_milestone_access(milestone_id, user, active_role, db)

    milestone.submission_status = "Submitted"
    milestone.status = MilestoneStatusEnum.SUBMITTED
    milestone.review_status = "Pending Review"

    notes = f": {req.submission_notes}" if req and req.submission_notes else ""
    db.add(ProjectActivity(
        project_id=project.id,
        user_id=user.id,
        activity_type="MILESTONE_SUBMITTED",
        description=f"Milestone '{milestone.title}' submitted for faculty sign-off{notes}."
    ))

    # Notify project mentor
    if project.mentor_id:
        send_notification(
            db=db,
            recipient_id=project.mentor_id,
            event_type=NotificationEventTypeEnum.REVIEW_REQUEST,
            title=f"Milestone Sign-off Requested: {milestone.title}",
            message=f"Milestone '{milestone.title}' in project '{project.title}' was submitted for evaluation by {user.full_name}.",
            resource_type="milestone",
            resource_id=milestone.id
        )

    db.commit()
    db.refresh(milestone)


    return format_milestone_response(milestone)

@router.post("/milestones/{milestone_id}/review", response_model=MilestoneResponse)
def review_milestone(
    milestone_id: int,
    req: MilestoneReviewRequest,
    user_and_token: tuple[User, dict] = Depends(get_current_user_and_token),
    db: Session = Depends(get_db)
):
    user, payload = user_and_token
    active_role = RoleEnum(payload.get("active_role"))

    if active_role == RoleEnum.STUDENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Students cannot review or evaluate milestone deliverables."
        )

    milestone, project = check_milestone_access(milestone_id, user, active_role, db)

    milestone.reviewer_id = user.id
    milestone.reviewer_comments = req.comments

    if req.decision.lower() in ["approved", "approve"]:
        milestone.status = MilestoneStatusEnum.APPROVED
        milestone.review_status = "Approved"
        milestone.completed_at = datetime.now(timezone.utc)
        action_msg = f"Milestone '{milestone.title}' approved by {user.full_name} ({active_role.value})."
    elif req.decision.lower() in ["revision requested", "revision", "reject"]:
        milestone.status = MilestoneStatusEnum.REVISION_REQUESTED
        milestone.review_status = "Revision Requested"
        action_msg = f"Milestone '{milestone.title}' returned for revisions by {user.full_name}."
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid review decision. Must be 'Approved' or 'Revision Requested'."
        )

    # Re-evaluate health after milestone status changes
    tasks = project.tasks
    all_milestones = project.milestones
    health, _ = evaluate_project_health(
        progress=project.progress_percentage,
        start_date=project.start_date,
        planned_completion_date=project.planned_completion_date,
        tasks=tasks,
        milestones=all_milestones,
        now=datetime.now(timezone.utc)
    )
    project.health_status = health

    db.add(ProjectActivity(
        project_id=project.id,
        user_id=user.id,
        activity_type="MILESTONE_REVIEWED",
        description=action_msg
    ))

    # Notify project team members
    for member in project.members:
        send_notification(
            db=db,
            recipient_id=member.user_id,
            event_type=NotificationEventTypeEnum.MILESTONE_DECISION,
            title=f"Milestone Evaluated: {milestone.title}",
            message=action_msg,
            resource_type="milestone",
            resource_id=milestone.id
        )

    db.commit()
    db.refresh(milestone)


    return format_milestone_response(milestone)
