from typing import Optional, List
from pydantic import BaseModel

class SectionSummary(BaseModel):
    id: int
    name: str
    code: str
    academic_year_id: int
    academic_year_number: int
    academic_year_name: str
    total_projects: int
    active_projects: int
    completed_projects: int
    at_risk_projects: int
    pending_reviews_count: int
    average_progress: float
    assigned_advisor_name: Optional[str] = None
    assigned_advisor_email: Optional[str] = None

class AcademicYearDetail(BaseModel):
    id: int
    year_number: int
    name: str
    sections_count: int
    total_projects: int
    active_projects: int
    completed_projects: int
    at_risk_projects: int
    pending_reviews_count: int
    average_progress: float
    sections: List[SectionSummary]

class DepartmentOverviewResponse(BaseModel):
    total_academic_years: int
    total_sections: int
    total_projects: int
    active_projects: int
    completed_projects: int
    at_risk_projects: int
    pending_reviews_count: int
    average_progress: float
    years: List[AcademicYearDetail]
