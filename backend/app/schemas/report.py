from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from app.models.report import ReportStatusEnum

class ReportCreateRequest(BaseModel):
    reporting_period: str
    work_completed: str
    current_challenges: Optional[str] = None
    planned_next_steps: str
    supporting_evidence: Optional[str] = None

class ReportReviewRequest(BaseModel):
    status: ReportStatusEnum  # APPROVED, NEEDS_REVISION, REJECTED
    comments: str

class ReportReviewResponse(BaseModel):
    id: int
    report_id: int
    reviewer_id: int
    reviewer_name: str
    status: ReportStatusEnum
    comments: str
    reviewed_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ReportResponse(BaseModel):
    id: int
    project_id: int
    submitted_by_id: int
    submitted_by_name: str
    reporting_period: str
    work_completed: str
    current_challenges: Optional[str] = None
    planned_next_steps: str
    supporting_evidence: Optional[str] = None
    version: int
    status: ReportStatusEnum
    submitted_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    reviews: List[ReportReviewResponse] = []

    model_config = ConfigDict(from_attributes=True)
