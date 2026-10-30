from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.models.user import User, RoleEnum
from app.models.organization import Section, AcademicYear, AdvisorAssignment
from app.models.project import Project, ProjectMember, MentorAssignment, ProjectStatusEnum, ProjectHealthEnum
from app.models.task import Task, TaskStatusEnum
from app.models.milestone import Milestone, MilestoneStatusEnum
from app.models.report import ProgressReport, ReportStatusEnum
from app.models.activity import ProjectActivity
from app.schemas.analytics import (
    HODAnalyticsResponse, AdvisorAnalyticsResponse,
    MentorAnalyticsResponse, StudentAnalyticsResponse
)
from app.api.deps import (
    get_current_user_and_token, RequireRole
)
from app.core.csv_export import generate_csv_response

router = APIRouter()


@router.get("/hod", response_model=HODAnalyticsResponse)
def get_hod_analytics(
    user_and_token: tuple[User, dict] = Depends(get_current_user_and_token),
    active_role: RoleEnum = Depends(RequireRole([RoleEnum.HOD])),
    db: Session = Depends(get_db)
):
    user, _ = user_and_token
    now = datetime.now(timezone.utc)

    # Base projects query for department
    query = db.query(Project)
    if user.department_id:
        query = query.filter(Project.department_id == user.department_id)

    projects = query.all()
    total_projects = len(projects)

    in_progress = sum(1 for p in projects if p.status == ProjectStatusEnum.IN_PROGRESS)
    completed = sum(1 for p in projects if p.status == ProjectStatusEnum.COMPLETED)
    at_risk = sum(1 for p in projects if p.health_status in [ProjectHealthEnum.AT_RISK, ProjectHealthEnum.DELAYED])
    
    # Overdue projects (past planned completion date without being completed)
    overdue = sum(
        1 for p in projects 
        if p.status != ProjectStatusEnum.COMPLETED and (p.planned_completion_date.replace(tzinfo=timezone.utc) if p.planned_completion_date.tzinfo is None else p.planned_completion_date) < now
    )

    avg_prog = (sum(p.progress_percentage for p in projects) / total_projects) if total_projects > 0 else 0.0

    # Pending reviews (reports in SUBMITTED status + milestones in SUBMITTED status)
    proj_ids = [p.id for p in projects]
    pending_reports = db.query(ProgressReport).filter(
        ProgressReport.project_id.in_(proj_ids),
        ProgressReport.status == ReportStatusEnum.SUBMITTED
    ).count() if proj_ids else 0

    pending_milestones = db.query(Milestone).filter(
        Milestone.project_id.in_(proj_ids),
        Milestone.status == MilestoneStatusEnum.SUBMITTED
    ).count() if proj_ids else 0

    pending_reviews_count = pending_reports + pending_milestones

    # Projects by academic year
    years = db.query(AcademicYear).order_by(AcademicYear.year_number.asc()).all()
    projects_by_year = []
    for y in years:
        y_projs = [p for p in projects if p.academic_year_id == y.id]
        projects_by_year.append({
            "year_number": y.year_number,
            "name": y.name,
            "count": len(y_projs),
            "average_progress": round(sum(p.progress_percentage for p in y_projs) / len(y_projs), 2) if y_projs else 0.0
        })

    # Projects by section (all 13 sections)
    sections = db.query(Section).order_by(Section.code.asc()).all()
    projects_by_section = []
    section_comparisons = []
    for s in sections:
        s_projs = [p for p in projects if p.section_id == s.id]
        s_completed = sum(1 for p in s_projs if p.status == ProjectStatusEnum.COMPLETED)
        s_at_risk = sum(1 for p in s_projs if p.health_status in [ProjectHealthEnum.AT_RISK, ProjectHealthEnum.DELAYED])
        s_avg = round(sum(p.progress_percentage for p in s_projs) / len(s_projs), 2) if s_projs else 0.0
        
        sec_info = {
            "section_id": s.id,
            "section_code": s.code,
            "section_name": s.name,
            "count": len(s_projs),
            "total_projects": len(s_projs),
            "completed_projects": s_completed,
            "at_risk_projects": s_at_risk,
            "avg_progress": s_avg
        }
        projects_by_section.append(sec_info)
        section_comparisons.append(sec_info)

    # Projects by status
    projects_by_status = {}
    for st in ProjectStatusEnum:
        cnt = sum(1 for p in projects if p.status == st)
        if cnt > 0:
            projects_by_status[st.value] = cnt

    # Mentor workload
    mentor_ids = set([p.mentor_id for p in projects if p.mentor_id is not None])
    mentors = db.query(User).filter(User.id.in_(list(mentor_ids))).all() if mentor_ids else []
    mentor_workload = []
    for m in mentors:
        m_projs = [p for p in projects if p.mentor_id == m.id]
        mentor_workload.append({
            "mentor_id": m.id,
            "mentor_name": m.full_name,
            "email": m.email,
            "project_count": len(m_projs),
            "average_progress": round(sum(p.progress_percentage for p in m_projs) / len(m_projs), 2) if m_projs else 0.0
        })

    years_summary = []
    for y in years:
        y_projs = [p for p in projects if p.academic_year_id == y.id]
        y_secs = [s for s in sections if s.academic_year_id == y.id]
        y_active = sum(1 for p in y_projs if p.status in [ProjectStatusEnum.IN_PROGRESS, ProjectStatusEnum.APPROVED, ProjectStatusEnum.SUBMITTED_FOR_FINAL_REVIEW])
        y_completed = sum(1 for p in y_projs if p.status == ProjectStatusEnum.COMPLETED)
        y_at_risk = sum(1 for p in y_projs if p.health_status in [ProjectHealthEnum.AT_RISK, ProjectHealthEnum.DELAYED])
        y_pending = db.query(ProgressReport).filter(
            ProgressReport.project_id.in_([p.id for p in y_projs]),
            ProgressReport.status == ReportStatusEnum.SUBMITTED
        ).count() if y_projs else 0

        sec_cards = []
        for s in y_secs:
            s_projs = [p for p in y_projs if p.section_id == s.id]
            adv_a = db.query(AdvisorAssignment).filter(
                AdvisorAssignment.section_id == s.id,
                AdvisorAssignment.is_active == True
            ).first()
            adv_name = adv_a.user.full_name if adv_a and adv_a.user else "Unassigned"
            adv_email = adv_a.user.email if adv_a and adv_a.user else None
            s_active = sum(1 for p in s_projs if p.status in [ProjectStatusEnum.IN_PROGRESS, ProjectStatusEnum.APPROVED, ProjectStatusEnum.SUBMITTED_FOR_FINAL_REVIEW])
            s_completed = sum(1 for p in s_projs if p.status == ProjectStatusEnum.COMPLETED)
            s_at_risk = sum(1 for p in s_projs if p.health_status in [ProjectHealthEnum.AT_RISK, ProjectHealthEnum.DELAYED])
            s_avg = round(sum(p.progress_percentage for p in s_projs) / len(s_projs), 2) if s_projs else 0.0

            sec_cards.append({
                "id": s.id,
                "section_id": s.id,
                "name": s.name,
                "section_name": s.name,
                "code": s.code,
                "section_code": s.code,
                "academic_year_id": y.id,
                "academic_year_number": y.year_number,
                "academic_year_name": y.name,
                "total_projects": len(s_projs),
                "active_projects": s_active,
                "completed_projects": s_completed,
                "at_risk_projects": s_at_risk,
                "pending_reviews_count": 0,
                "average_progress": s_avg,
                "avg_progress": s_avg,
                "assigned_advisor_name": adv_name,
                "assigned_advisor": adv_name,
                "assigned_advisor_email": adv_email
            })

        years_summary.append({
            "id": y.id,
            "year_id": y.id,
            "year_number": y.year_number,
            "name": y.name,
            "sections_count": len(y_secs),
            "total_projects": len(y_projs),
            "active_projects": y_active,
            "completed_projects": y_completed,
            "at_risk_projects": y_at_risk,
            "pending_reviews_count": y_pending,
            "average_progress": round(sum(p.progress_percentage for p in y_projs) / len(y_projs), 2) if y_projs else 0.0,
            "sections": sec_cards
        })

    return HODAnalyticsResponse(
        total_projects=total_projects,
        in_progress_count=in_progress,
        completed_count=completed,
        at_risk_count=at_risk,
        overdue_count=overdue,
        pending_reviews_count=pending_reviews_count,
        average_progress=round(avg_prog, 2),
        projects_by_year=projects_by_year,
        projects_by_section=projects_by_section,
        projects_by_status=projects_by_status,
        mentor_workload=mentor_workload,
        section_comparisons=section_comparisons,
        total_academic_years=len(years),
        total_sections=len(sections),
        years_summary=years_summary
    )

@router.get("/advisor", response_model=AdvisorAnalyticsResponse)
def get_advisor_analytics(
    section_id: Optional[int] = None,
    user_and_token: tuple[User, dict] = Depends(get_current_user_and_token),
    active_role: RoleEnum = Depends(RequireRole([RoleEnum.ADVISOR])),
    db: Session = Depends(get_db)
):
    user, _ = user_and_token
    now = datetime.now(timezone.utc)

    # Find all active assignments for this advisor
    assignments = db.query(AdvisorAssignment).filter(
        AdvisorAssignment.user_id == user.id,
        AdvisorAssignment.is_active == True
    ).all()

    if not assignments:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active section assignment found for this advisor."
        )

    assigned_section_ids = [a.section_id for a in assignments]
    if section_id is not None:
        if section_id not in assigned_section_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: You are not the assigned advisor for section ID {section_id}."
            )
        target_assignment = next(a for a in assignments if a.section_id == section_id)
    else:
        target_assignment = assignments[0]

    section = target_assignment.section
    projects = db.query(Project).filter(Project.section_id == section.id).all()
    total_projects = len(projects)

    active_count = sum(1 for p in projects if p.status in [ProjectStatusEnum.IN_PROGRESS, ProjectStatusEnum.APPROVED, ProjectStatusEnum.SUBMITTED_FOR_FINAL_REVIEW])
    completed_count = sum(1 for p in projects if p.status == ProjectStatusEnum.COMPLETED)
    at_risk_count = sum(1 for p in projects if p.health_status in [ProjectHealthEnum.AT_RISK, ProjectHealthEnum.DELAYED])
    avg_prog = (sum(p.progress_percentage for p in projects) / total_projects) if total_projects > 0 else 0.0

    # Assigned sections for multi-section display
    assigned_sections = []
    for a in assignments:
        s = a.section
        p_cnt = db.query(Project).filter(Project.section_id == s.id).count()
        assigned_sections.append({
            "section_id": s.id,
            "section_code": s.code,
            "section_name": s.name,
            "academic_year_id": s.academic_year_id,
            "academic_year_number": s.academic_year.year_number if s.academic_year else 0,
            "academic_year_name": s.academic_year.name if s.academic_year else "",
            "total_projects": p_cnt
        })

    # Overdue tasks in this section
    proj_ids = [p.id for p in projects]
    overdue_tasks = []
    if proj_ids:
        all_tasks = db.query(Task).filter(Task.project_id.in_(proj_ids)).all()
        for t in all_tasks:
            t_due = t.due_date.replace(tzinfo=timezone.utc) if t.due_date.tzinfo is None else t.due_date
            if t_due < now and t.status != TaskStatusEnum.COMPLETED:
                overdue_tasks.append(t)

    # Pending reviews (reports + milestones)
    pending_reports = db.query(ProgressReport).filter(
        ProgressReport.project_id.in_(proj_ids),
        ProgressReport.status == ReportStatusEnum.SUBMITTED
    ).count() if proj_ids else 0

    pending_milestones = db.query(Milestone).filter(
        Milestone.project_id.in_(proj_ids),
        Milestone.status == MilestoneStatusEnum.SUBMITTED
    ).count() if proj_ids else 0

    projects_by_status = {}
    for st in ProjectStatusEnum:
        c = sum(1 for p in projects if p.status == st)
        if c > 0:
            projects_by_status[st.value] = c

    # Upcoming deadlines (milestones in next 30 days)
    upcoming_deadlines = []
    if proj_ids:
        milestones = db.query(Milestone).filter(
            Milestone.project_id.in_(proj_ids),
            Milestone.status.in_([MilestoneStatusEnum.PENDING, MilestoneStatusEnum.IN_PROGRESS, MilestoneStatusEnum.SUBMITTED])
        ).order_by(Milestone.planned_due_date.asc()).limit(8).all()
        for m in milestones:
            upcoming_deadlines.append({
                "type": "Milestone",
                "title": m.title,
                "project_code": m.project.code,
                "project_title": m.project.title,
                "due_date": m.planned_due_date.isoformat()
            })

    project_summaries = [
        {
            "id": p.id,
            "code": p.code,
            "title": p.title,
            "status": p.status.value,
            "health_status": p.health_status.value,
            "progress_percentage": p.progress_percentage,
            "team_lead": p.team_lead.full_name if p.team_lead else "Unassigned",
            "mentor": p.mentor.full_name if p.mentor else "Unassigned"
        }
        for p in projects
    ]

    return AdvisorAnalyticsResponse(
        section_id=section.id,
        section_code=section.code,
        section_name=section.name,
        academic_year_id=section.academic_year_id,
        academic_year_name=section.academic_year.name if section.academic_year else "",
        academic_year_number=section.academic_year.year_number if section.academic_year else 0,
        total_projects=total_projects,
        active_projects=active_count,
        completed_projects=completed_count,
        at_risk_projects=at_risk_count,
        overdue_tasks_count=len(overdue_tasks),
        pending_reviews_count=pending_reports + pending_milestones,
        section_average_progress=round(avg_prog, 2),
        projects_by_status=projects_by_status,
        upcoming_deadlines=upcoming_deadlines,
        projects=project_summaries,
        assigned_sections=assigned_sections
    )

@router.get("/mentor", response_model=MentorAnalyticsResponse)
def get_mentor_analytics(
    user_and_token: tuple[User, dict] = Depends(get_current_user_and_token),
    active_role: RoleEnum = Depends(RequireRole([RoleEnum.MENTOR])),
    db: Session = Depends(get_db)
):
    user, _ = user_and_token
    now = datetime.now(timezone.utc)

    # Assigned projects
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

    projects = db.query(Project).filter(Project.id.in_(list(assigned_proj_ids))).all() if assigned_proj_ids else []
    total_assigned = len(projects)

    at_risk = sum(1 for p in projects if p.health_status in [ProjectHealthEnum.AT_RISK, ProjectHealthEnum.DELAYED])
    completed = sum(1 for p in projects if p.status == ProjectStatusEnum.COMPLETED)
    avg_prog = (sum(p.progress_percentage for p in projects) / total_assigned) if total_assigned > 0 else 0.0

    # Pending reviews (reports + milestones)
    proj_ids = [p.id for p in projects]
    pending_reports_list = []
    if proj_ids:
        reports = db.query(ProgressReport).filter(
            ProgressReport.project_id.in_(proj_ids),
            ProgressReport.status == ReportStatusEnum.SUBMITTED
        ).all()
        for r in reports:
            pending_reports_list.append({
                "id": r.id,
                "project_code": r.project.code,
                "project_title": r.project.title,
                "reporting_period": r.reporting_period,
                "submitted_by": r.submitted_by.full_name if r.submitted_by else "Team",
                "submitted_at": r.submitted_at.isoformat() if r.submitted_at else None
            })

    # Upcoming milestones
    upcoming_milestones = []
    if proj_ids:
        milestones = db.query(Milestone).filter(
            Milestone.project_id.in_(proj_ids),
            Milestone.status.in_([MilestoneStatusEnum.PENDING, MilestoneStatusEnum.IN_PROGRESS, MilestoneStatusEnum.SUBMITTED])
        ).order_by(Milestone.planned_due_date.asc()).limit(6).all()
        for m in milestones:
            upcoming_milestones.append({
                "id": m.id,
                "title": m.title,
                "project_code": m.project.code,
                "project_title": m.project.title,
                "planned_due_date": m.planned_due_date.isoformat(),
                "status": m.status.value,
                "submission_status": m.submission_status
            })

    # Overdue tasks
    overdue_tasks = []
    if proj_ids:
        all_tasks = db.query(Task).filter(Task.project_id.in_(proj_ids)).all()
        for t in all_tasks:
            t_due = t.due_date.replace(tzinfo=timezone.utc) if t.due_date.tzinfo is None else t.due_date
            if t_due < now and t.status != TaskStatusEnum.COMPLETED:
                overdue_tasks.append({
                    "id": t.id,
                    "title": t.title,
                    "project_code": t.project.code,
                    "assignee": t.assignee.full_name if t.assignee else "Unassigned",
                    "due_date": t.due_date.isoformat(),
                    "priority": t.priority.value
                })

    assigned_summaries = [
        {
            "id": p.id,
            "code": p.code,
            "title": p.title,
            "status": p.status.value,
            "health_status": p.health_status.value,
            "progress_percentage": p.progress_percentage,
            "team_lead_name": p.team_lead.full_name if p.team_lead else "Unassigned",
            "section_code": p.section.code if p.section else "",
            "section_name": p.section.name if p.section else "",
            "academic_year_number": p.academic_year.year_number if p.academic_year else 0,
            "academic_year_name": p.academic_year.name if p.academic_year else ""
        }
        for p in projects
    ]

    # Group projects by academic year and section
    grouped = {}
    for p in projects:
        y_num = p.academic_year.year_number if p.academic_year else 0
        y_name = p.academic_year.name if p.academic_year else "Unassigned Year"
        s_id = p.section_id
        s_code = p.section.code if p.section else ""
        s_name = p.section.name if p.section else ""
        key = (y_num, y_name, s_id, s_code, s_name)
        if key not in grouped:
            grouped[key] = []
        grouped[key].append({
            "id": p.id,
            "code": p.code,
            "title": p.title,
            "status": p.status.value,
            "health_status": p.health_status.value,
            "progress_percentage": p.progress_percentage,
            "team_lead_name": p.team_lead.full_name if p.team_lead else "Unassigned",
            "section_code": s_code
        })

    projects_by_year_and_section = [
        {
            "year_number": k[0],
            "year_name": k[1],
            "section_id": k[2],
            "section_code": k[3],
            "section_name": k[4],
            "projects_count": len(v),
            "projects": v
        }
        for k, v in sorted(grouped.items(), key=lambda x: (x[0][0], x[0][3]))
    ]

    return MentorAnalyticsResponse(
        assigned_projects_count=total_assigned,
        pending_reviews_count=len(pending_reports_list),
        at_risk_count=at_risk,
        completed_count=completed,
        average_progress=round(avg_prog, 2),
        assigned_projects=assigned_summaries,
        projects_by_year_and_section=projects_by_year_and_section,
        upcoming_milestones=upcoming_milestones,
        pending_reports=pending_reports_list,
        overdue_tasks=overdue_tasks
    )

@router.get("/student", response_model=StudentAnalyticsResponse)
def get_student_analytics(
    user_and_token: tuple[User, dict] = Depends(get_current_user_and_token),
    active_role: RoleEnum = Depends(RequireRole([RoleEnum.STUDENT])),
    db: Session = Depends(get_db)
):
    user, _ = user_and_token
    now = datetime.now(timezone.utc)

    # Projects student belongs to
    member_proj_ids = [
        m.project_id for m in db.query(ProjectMember.project_id).filter(
            ProjectMember.user_id == user.id
        ).all()
    ]
    projects = db.query(Project).filter(Project.id.in_(member_proj_ids)).all() if member_proj_ids else []

    authorized_projects = [
        {
            "id": p.id,
            "code": p.code,
            "title": p.title,
            "category": p.category,
            "status": p.status.value,
            "health_status": p.health_status.value,
            "progress_percentage": p.progress_percentage,
            "mentor_name": p.mentor.full_name if p.mentor else "Unassigned",
            "planned_completion_date": p.planned_completion_date.isoformat(),
            "academic_year_id": p.academic_year_id,
            "academic_year_name": p.academic_year.name if p.academic_year else "",
            "academic_year_number": p.academic_year.year_number if p.academic_year else 0,
            "section_id": p.section_id,
            "section_code": p.section.code if p.section else "",
            "team_members": [
                {
                    "id": m.user.id,
                    "name": m.user.full_name,
                    "role": m.role_in_team or ("Leader" if m.user_id == p.team_lead_id else "Member")
                }
                for m in p.members
            ]
        }
        for p in projects
    ]

    # Tasks assigned to student or within student's projects
    my_tasks = db.query(Task).filter(Task.assignee_id == user.id).order_by(Task.due_date.asc()).all()
    assigned_tasks = [
        {
            "id": t.id,
            "title": t.title,
            "project_id": t.project_id,
            "project_code": t.project.code,
            "status": t.status.value,
            "priority": t.priority.value,
            "completion_fraction": t.completion_fraction,
            "due_date": t.due_date.isoformat()
        }
        for t in my_tasks
    ]

    overdue_tasks = []
    upcoming_deadlines = []
    for t in my_tasks:
        t_due = t.due_date.replace(tzinfo=timezone.utc) if t.due_date.tzinfo is None else t.due_date
        item = {
            "type": "Task",
            "title": t.title,
            "project_code": t.project.code,
            "due_date": t.due_date.isoformat(),
            "priority": t.priority.value
        }
        if t_due < now and t.status != TaskStatusEnum.COMPLETED:
            overdue_tasks.append(item)
        elif t.status != TaskStatusEnum.COMPLETED:
            upcoming_deadlines.append(item)

    # Project milestones
    project_milestones = []
    if member_proj_ids:
        milestones = db.query(Milestone).filter(
            Milestone.project_id.in_(member_proj_ids)
        ).order_by(Milestone.planned_due_date.asc()).all()
        for m in milestones:
            project_milestones.append({
                "id": m.id,
                "title": m.title,
                "project_code": m.project.code,
                "status": m.status.value,
                "submission_status": m.submission_status,
                "review_status": m.review_status,
                "planned_due_date": m.planned_due_date.isoformat()
            })

    # Submitted reports & review status
    report_review_status = []
    if member_proj_ids:
        reports = db.query(ProgressReport).filter(
            ProgressReport.project_id.in_(member_proj_ids)
        ).order_by(ProgressReport.created_at.desc()).all()
        for r in reports:
            latest_review = r.reviews[-1] if r.reviews else None
            report_review_status.append({
                "id": r.id,
                "project_code": r.project.code,
                "reporting_period": r.reporting_period,
                "status": r.status.value,
                "feedback": latest_review.comments if latest_review else None,
                "reviewer": latest_review.reviewer.full_name if latest_review and latest_review.reviewer else None
            })

    # Recent activities
    recent_activity = []
    if member_proj_ids:
        activities = db.query(ProjectActivity).filter(
            ProjectActivity.project_id.in_(member_proj_ids)
        ).order_by(ProjectActivity.created_at.desc()).limit(8).all()
        for a in activities:
            recent_activity.append({
                "id": a.id,
                "activity_type": a.activity_type,
                "description": a.description,
                "timestamp": a.created_at.isoformat()
            })

    return StudentAnalyticsResponse(
        authorized_projects=authorized_projects,
        assigned_tasks=assigned_tasks,
        upcoming_deadlines=upcoming_deadlines,
        overdue_tasks=overdue_tasks,
        project_milestones=project_milestones,
        report_review_status=report_review_status,
        recent_activity=recent_activity
    )

@router.get("/export/department")
def export_department_analytics_csv(
    user_and_token: tuple[User, dict] = Depends(get_current_user_and_token),
    active_role: RoleEnum = Depends(RequireRole([RoleEnum.HOD])),
    db: Session = Depends(get_db)
):
    user, _ = user_and_token
    query = db.query(Project)
    if user.department_id:
        query = query.filter(Project.department_id == user.department_id)
    projects = query.all()

    sections = db.query(Section).all()
    rows = []
    for s in sections:
        s_projs = [p for p in projects if p.section_id == s.id]
        s_completed = sum(1 for p in s_projs if p.status == ProjectStatusEnum.COMPLETED)
        s_at_risk = sum(1 for p in s_projs if p.health_status in [ProjectHealthEnum.AT_RISK, ProjectHealthEnum.DELAYED])
        s_avg = round(sum(p.progress_percentage for p in s_projs) / len(s_projs), 1) if s_projs else 0.0

        rows.append({
            "Section Code": s.code,
            "Section Name": s.name,
            "Academic Year": s.academic_year.name if s.academic_year else "",
            "Total Projects": len(s_projs),
            "Completed Projects": s_completed,
            "At Risk Projects": s_at_risk,
            "Average Progress (%)": s_avg
        })

    fieldnames = [
        "Section Code",
        "Section Name",
        "Academic Year",
        "Total Projects",
        "Completed Projects",
        "At Risk Projects",
        "Average Progress (%)"
    ]
    filename = f"ppms_department_analytics_{datetime.now(timezone.utc).strftime('%Y%m%d')}.csv"
    return generate_csv_response(rows, fieldnames, filename)

@router.get("/export/mentor-workload")
def export_mentor_workload_csv(
    user_and_token: tuple[User, dict] = Depends(get_current_user_and_token),
    active_role: RoleEnum = Depends(RequireRole([RoleEnum.HOD, RoleEnum.MENTOR])),
    db: Session = Depends(get_db)
):
    user, _ = user_and_token

    if active_role == RoleEnum.MENTOR:
        mentors = [user]
    else:
        # HOD can export all mentors
        mentors = db.query(User).filter(
            User.user_roles.any()
        ).all()
        # Filter to faculty who have mentor role
        mentors = [m for m in mentors if any(ur.role.name == RoleEnum.MENTOR for ur in m.user_roles)]

    rows = []
    for m in mentors:
        m_projs = db.query(Project).filter(Project.mentor_id == m.id).all()
        avg_prog = round(sum(p.progress_percentage for p in m_projs) / len(m_projs), 1) if m_projs else 0.0
        completed = sum(1 for p in m_projs if p.status == ProjectStatusEnum.COMPLETED)
        rows.append({
            "Mentor Name": m.full_name,
            "Email": m.email,
            "Assigned Projects Count": len(m_projs),
            "Completed Projects": completed,
            "Average Progress (%)": avg_prog
        })

    fieldnames = [
        "Mentor Name",
        "Email",
        "Assigned Projects Count",
        "Completed Projects",
        "Average Progress (%)"
    ]
    filename = f"ppms_mentor_workload_{active_role.value.lower()}_{datetime.now(timezone.utc).strftime('%Y%m%d')}.csv"
    return generate_csv_response(rows, fieldnames, filename)

@router.get("/export/section/{section_id}")
def export_section_projects_csv(
    section_id: int,
    user_and_token: tuple[User, dict] = Depends(get_current_user_and_token),
    active_role: RoleEnum = Depends(RequireRole([RoleEnum.HOD, RoleEnum.ADVISOR])),
    db: Session = Depends(get_db)
):
    user, _ = user_and_token

    # Advisor must be assigned to this section
    if active_role == RoleEnum.ADVISOR:
        assignment = db.query(AdvisorAssignment).filter(
            AdvisorAssignment.user_id == user.id,
            AdvisorAssignment.section_id == section_id,
            AdvisorAssignment.is_active == True
        ).first()
        if not assignment:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: You are not the assigned advisor for section ID {section_id}."
            )

    section = db.query(Section).filter(Section.id == section_id).first()
    if not section:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Section {section_id} not found.")

    projects = db.query(Project).filter(Project.section_id == section_id).order_by(Project.code.asc()).all()

    rows = []
    for p in projects:
        rows.append({
            "Project Code": p.code,
            "Title": p.title,
            "Category": p.category,
            "Team Lead": p.team_lead.full_name if p.team_lead else "Unassigned",
            "Mentor": p.mentor.full_name if p.mentor else "Unassigned",
            "Status": p.status.value if p.status else "",
            "Health": p.health_status.value if p.health_status else "",
            "Progress (%)": f"{p.progress_percentage:.1f}",
            "Planned Completion Date": p.planned_completion_date.strftime("%Y-%m-%d") if p.planned_completion_date else ""
        })

    fieldnames = [
        "Project Code",
        "Title",
        "Category",
        "Team Lead",
        "Mentor",
        "Status",
        "Health",
        "Progress (%)",
        "Planned Completion Date"
    ]
    filename = f"ppms_section_{section.code}_projects_{datetime.now(timezone.utc).strftime('%Y%m%d')}.csv"
    return generate_csv_response(rows, fieldnames, filename)

