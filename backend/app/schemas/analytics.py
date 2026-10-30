from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class HODAnalyticsResponse(BaseModel):
    total_projects: int
    in_progress_count: int
    completed_count: int
    at_risk_count: int
    overdue_count: int
    pending_reviews_count: int
    average_progress: float
    projects_by_year: List[Dict[str, Any]]
    projects_by_section: List[Dict[str, Any]]
    projects_by_status: Dict[str, int]
    mentor_workload: List[Dict[str, Any]]
    section_comparisons: List[Dict[str, Any]]
    total_academic_years: int = 3
    total_sections: int = 13
    years_summary: List[Dict[str, Any]] = []

class AdvisorAnalyticsResponse(BaseModel):
    section_id: int
    section_code: str
    section_name: str
    academic_year_id: int = 0
    academic_year_name: str = ""
    academic_year_number: int = 0
    total_projects: int
    active_projects: int
    completed_projects: int
    at_risk_projects: int
    overdue_tasks_count: int
    pending_reviews_count: int
    section_average_progress: float
    projects_by_status: Dict[str, int]
    upcoming_deadlines: List[Dict[str, Any]]
    projects: List[Dict[str, Any]]
    assigned_sections: List[Dict[str, Any]] = []

class MentorAnalyticsResponse(BaseModel):
    assigned_projects_count: int
    pending_reviews_count: int
    at_risk_count: int
    completed_count: int
    average_progress: float
    assigned_projects: List[Dict[str, Any]]
    projects_by_year_and_section: List[Dict[str, Any]] = []
    upcoming_milestones: List[Dict[str, Any]]
    pending_reports: List[Dict[str, Any]]
    overdue_tasks: List[Dict[str, Any]]

class StudentAnalyticsResponse(BaseModel):
    authorized_projects: List[Dict[str, Any]]
    assigned_tasks: List[Dict[str, Any]]
    upcoming_deadlines: List[Dict[str, Any]]
    overdue_tasks: List[Dict[str, Any]]
    project_milestones: List[Dict[str, Any]]
    report_review_status: List[Dict[str, Any]]
    recent_activity: List[Dict[str, Any]]
