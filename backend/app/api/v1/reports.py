from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.models.user import User, RoleEnum
from app.models.report import ProgressReport, ReportReview, ReportStatusEnum
from app.models.activity import ProjectActivity
from app.schemas.report import (
    ReportCreateRequest, ReportReviewRequest, ReportResponse, ReportReviewResponse
)
from app.api.deps import (
    get_current_user_and_token, check_project_access, check_report_access
)
from app.core.notifications import send_notification
from app.models.notification import NotificationEventTypeEnum

router = APIRouter()


def format_report_response(report: ProgressReport) -> ReportResponse:
    reviews = [
        ReportReviewResponse(
            id=r.id,
            report_id=r.report_id,
            reviewer_id=r.reviewer_id,
            reviewer_name=r.reviewer.full_name if r.reviewer else "Faculty Reviewer",
            status=r.status,
            comments=r.comments,
            reviewed_at=r.reviewed_at
        )
        for r in report.reviews
    ]
    return ReportResponse(
        id=report.id,
        project_id=report.project_id,
        submitted_by_id=report.submitted_by_id,
        submitted_by_name=report.submitted_by.full_name if report.submitted_by else "Team Member",
        reporting_period=report.reporting_period,
        work_completed=report.work_completed,
        current_challenges=report.current_challenges,
        planned_next_steps=report.planned_next_steps,
        supporting_evidence=report.supporting_evidence,
        version=report.version,
        status=report.status,
        submitted_at=report.submitted_at,
        created_at=report.created_at,
        updated_at=report.updated_at,
        reviews=reviews
    )

@router.get("/projects/{project_id}/reports", response_model=List[ReportResponse])
def list_project_reports(
    project_id: int,
    user_and_token: tuple[User, dict] = Depends(get_current_user_and_token),
    db: Session = Depends(get_db)
):
    user, payload = user_and_token
    active_role = RoleEnum(payload.get("active_role"))

    project = check_project_access(project_id, user, active_role, db)
    reports = db.query(ProgressReport).filter(
        ProgressReport.project_id == project.id
    ).order_by(ProgressReport.created_at.desc()).all()

    return [format_report_response(r) for r in reports]

@router.post("/projects/{project_id}/reports", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
def submit_progress_report(
    project_id: int,
    req: ReportCreateRequest,
    user_and_token: tuple[User, dict] = Depends(get_current_user_and_token),
    db: Session = Depends(get_db)
):
    user, payload = user_and_token
    active_role = RoleEnum(payload.get("active_role"))

    project = check_project_access(project_id, user, active_role, db)

    # Determine next version for this project's reporting period
    current_max_version = db.query(func.max(ProgressReport.version)).filter(
        ProgressReport.project_id == project.id,
        ProgressReport.reporting_period == req.reporting_period
    ).scalar() or 0
    version = current_max_version + 1

    report = ProgressReport(
        project_id=project.id,
        submitted_by_id=user.id,
        reporting_period=req.reporting_period,
        work_completed=req.work_completed,
        current_challenges=req.current_challenges,
        planned_next_steps=req.planned_next_steps,
        supporting_evidence=req.supporting_evidence,
        version=version,
        status=ReportStatusEnum.SUBMITTED,
        submitted_at=datetime.now(timezone.utc)
    )
    db.add(report)
    db.flush()

    db.add(ProjectActivity(
        project_id=project.id,
        user_id=user.id,
        activity_type="REPORT_SUBMITTED",
        description=f"Progress report for '{report.reporting_period}' (v{version}) submitted by {user.full_name}."
    ))

    # Notify project mentor
    if project.mentor_id:
        send_notification(
            db=db,
            recipient_id=project.mentor_id,
            event_type=NotificationEventTypeEnum.NEW_PROGRESS_REPORT,
            title=f"New Progress Report: {project.code}",
            message=f"Team {project.code} submitted progress report v{version} for {report.reporting_period}.",
            resource_type="report",
            resource_id=report.id
        )

    db.commit()
    db.refresh(report)


    return format_report_response(report)

@router.get("/reports/{report_id}", response_model=ReportResponse)
def get_report(
    report_id: int,
    user_and_token: tuple[User, dict] = Depends(get_current_user_and_token),
    db: Session = Depends(get_db)
):
    user, payload = user_and_token
    active_role = RoleEnum(payload.get("active_role"))

    report, _ = check_report_access(report_id, user, active_role, db)
    return format_report_response(report)

@router.post("/reports/{report_id}/reviews", response_model=ReportResponse)
def review_progress_report(
    report_id: int,
    req: ReportReviewRequest,
    user_and_token: tuple[User, dict] = Depends(get_current_user_and_token),
    db: Session = Depends(get_db)
):
    user, payload = user_and_token
    active_role = RoleEnum(payload.get("active_role"))

    # Security check: Students cannot approve or review their own reports
    if active_role == RoleEnum.STUDENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Students cannot review or approve progress reports."
        )

    report, project = check_report_access(report_id, user, active_role, db)

    # Record review decision
    review = ReportReview(
        report_id=report.id,
        reviewer_id=user.id,
        status=req.status,
        comments=req.comments,
        reviewed_at=datetime.now(timezone.utc)
    )
    db.add(review)

    # Update report status
    report.status = req.status

    db.add(ProjectActivity(
        project_id=project.id,
        user_id=user.id,
        activity_type="REPORT_REVIEWED",
        description=f"Progress report for '{report.reporting_period}' reviewed by {user.full_name} ({active_role.value}): {req.status.value}."
    ))

    # Notify submitter
    send_notification(
        db=db,
        recipient_id=report.submitted_by_id,
        event_type=NotificationEventTypeEnum.MENTOR_FEEDBACK,
        title=f"Progress Report Evaluated: {report.reporting_period}",
        message=f"Your progress report received evaluation '{req.status.value}' from {user.full_name}: {req.comments or ''}",
        resource_type="report",
        resource_id=report.id
    )

    db.commit()
    db.refresh(report)


    return format_report_response(report)
