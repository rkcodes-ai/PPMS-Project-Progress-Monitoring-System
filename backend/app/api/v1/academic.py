from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.organization import Section, AcademicYear, AdvisorAssignment
from app.models.project import Project, ProjectStatusEnum, ProjectHealthEnum
from app.models.milestone import Milestone, MilestoneStatusEnum
from app.models.report import ProgressReport, ReportStatusEnum
from app.models.user import User, RoleEnum
from app.schemas.academic import (
    DepartmentOverviewResponse, AcademicYearDetail, SectionSummary
)
from app.api.deps import get_current_user_and_token

router = APIRouter()


def compute_section_summary(s: Section, db: Session) -> SectionSummary:
    projs = db.query(Project).filter(Project.section_id == s.id).all()
    total = len(projs)
    active = sum(1 for p in projs if p.status in [ProjectStatusEnum.IN_PROGRESS, ProjectStatusEnum.APPROVED, ProjectStatusEnum.SUBMITTED_FOR_FINAL_REVIEW])
    completed = sum(1 for p in projs if p.status == ProjectStatusEnum.COMPLETED)
    at_risk = sum(1 for p in projs if p.health_status in [ProjectHealthEnum.AT_RISK, ProjectHealthEnum.DELAYED])
    avg_prog = round(sum(p.progress_percentage for p in projs) / total, 2) if total > 0 else 0.0

    p_ids = [p.id for p in projs]
    pending_reps = db.query(ProgressReport).filter(
        ProgressReport.project_id.in_(p_ids),
        ProgressReport.status == ReportStatusEnum.SUBMITTED
    ).count() if p_ids else 0

    pending_ms = db.query(Milestone).filter(
        Milestone.project_id.in_(p_ids),
        Milestone.status == MilestoneStatusEnum.SUBMITTED
    ).count() if p_ids else 0

    adv_assign = db.query(AdvisorAssignment).filter(
        AdvisorAssignment.section_id == s.id,
        AdvisorAssignment.is_active == True
    ).first()

    adv_name = adv_assign.user.full_name if adv_assign and adv_assign.user else None
    adv_email = adv_assign.user.email if adv_assign and adv_assign.user else None

    return SectionSummary(
        id=s.id,
        name=s.name,
        code=s.code,
        academic_year_id=s.academic_year_id,
        academic_year_number=s.academic_year.year_number if s.academic_year else 0,
        academic_year_name=s.academic_year.name if s.academic_year else "",
        total_projects=total,
        active_projects=active,
        completed_projects=completed,
        at_risk_projects=at_risk,
        pending_reviews_count=pending_reps + pending_ms,
        average_progress=avg_prog,
        assigned_advisor_name=adv_name,
        assigned_advisor_email=adv_email
    )


def compute_year_detail(ay: AcademicYear, db: Session) -> AcademicYearDetail:
    sections = db.query(Section).filter(Section.academic_year_id == ay.id).order_by(Section.code.asc()).all()
    section_summaries = [compute_section_summary(s, db) for s in sections]

    total_projs = sum(ss.total_projects for ss in section_summaries)
    active_projs = sum(ss.active_projects for ss in section_summaries)
    completed_projs = sum(ss.completed_projects for ss in section_summaries)
    at_risk_projs = sum(ss.at_risk_projects for ss in section_summaries)
    pending_revs = sum(ss.pending_reviews_count for ss in section_summaries)
    avg_prog = round(sum(ss.average_progress * ss.total_projects for ss in section_summaries) / total_projs, 2) if total_projs > 0 else 0.0

    return AcademicYearDetail(
        id=ay.id,
        year_number=ay.year_number,
        name=ay.name,
        sections_count=len(sections),
        total_projects=total_projs,
        active_projects=active_projs,
        completed_projects=completed_projs,
        at_risk_projects=at_risk_projs,
        pending_reviews_count=pending_revs,
        average_progress=avg_prog,
        sections=section_summaries
    )


@router.get("/overview", response_model=DepartmentOverviewResponse)
def get_department_overview(
    user_and_token: tuple[User, dict] = Depends(get_current_user_and_token),
    db: Session = Depends(get_db)
):
    """
    Department-wide academic hierarchy overview:
    Department -> Academic Years -> Sections -> Project Summaries.
    All figures calculated dynamically from actual database records.
    """
    years = db.query(AcademicYear).order_by(AcademicYear.year_number.asc()).all()
    year_details = [compute_year_detail(ay, db) for ay in years]

    total_years = len(years)
    total_sections = sum(yd.sections_count for yd in year_details)
    total_projects = sum(yd.total_projects for yd in year_details)
    active_projects = sum(yd.active_projects for yd in year_details)
    completed_projects = sum(yd.completed_projects for yd in year_details)
    at_risk_projects = sum(yd.at_risk_projects for yd in year_details)
    pending_reviews = sum(yd.pending_reviews_count for yd in year_details)
    avg_prog = round(sum(yd.average_progress * yd.total_projects for yd in year_details) / total_projects, 2) if total_projects > 0 else 0.0

    return DepartmentOverviewResponse(
        total_academic_years=total_years,
        total_sections=total_sections,
        total_projects=total_projects,
        active_projects=active_projects,
        completed_projects=completed_projects,
        at_risk_projects=at_risk_projects,
        pending_reviews_count=pending_reviews,
        average_progress=avg_prog,
        years=year_details
    )


@router.get("/years", response_model=List[AcademicYearDetail])
def list_academic_years(
    user_and_token: tuple[User, dict] = Depends(get_current_user_and_token),
    db: Session = Depends(get_db)
):
    """Returns summaries for all academic years with nested section cards."""
    years = db.query(AcademicYear).order_by(AcademicYear.year_number.asc()).all()
    return [compute_year_detail(ay, db) for ay in years]


@router.get("/years/{year_id}", response_model=AcademicYearDetail)
def get_academic_year(
    year_id: int,
    user_and_token: tuple[User, dict] = Depends(get_current_user_and_token),
    db: Session = Depends(get_db)
):
    """Returns academic year dashboard data including that year's section cards."""
    ay = db.query(AcademicYear).filter(
        (AcademicYear.id == year_id) | (AcademicYear.year_number == year_id)
    ).first()
    if not ay:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Academic year '{year_id}' not found."
        )
    return compute_year_detail(ay, db)


@router.get("/sections/{section_id}", response_model=SectionSummary)
def get_section(
    section_id: int,
    user_and_token: tuple[User, dict] = Depends(get_current_user_and_token),
    db: Session = Depends(get_db)
):
    """Returns section dashboard summary including total projects and advisor info."""
    sec = db.query(Section).filter(Section.id == section_id).first()
    if not sec:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Section with id '{section_id}' not found."
        )
    return compute_section_summary(sec, db)


@router.get("/sections", response_model=List[SectionSummary])
def list_sections(
    academic_year_id: Optional[int] = None,
    user_and_token: tuple[User, dict] = Depends(get_current_user_and_token),
    db: Session = Depends(get_db)
):
    """Returns sections, optionally filtered by academic year."""
    query = db.query(Section)
    if academic_year_id:
        ay = db.query(AcademicYear).filter(
            (AcademicYear.id == academic_year_id) | (AcademicYear.year_number == academic_year_id)
        ).first()
        target_id = ay.id if ay else academic_year_id
        query = query.filter(Section.academic_year_id == target_id)
    sections = query.order_by(Section.code.asc()).all()
    return [compute_section_summary(s, db) for s in sections]
