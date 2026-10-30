from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from app.models.milestone import MilestoneStatusEnum

class MilestoneCreateRequest(BaseModel):
    title: str
    description: Optional[str] = None
    planned_due_date: datetime
    completion_criteria: Optional[str] = None
    task_ids: Optional[List[int]] = []

class MilestoneUpdateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    planned_due_date: Optional[datetime] = None
    completion_criteria: Optional[str] = None
    task_ids: Optional[List[int]] = None

class MilestoneSubmitRequest(BaseModel):
    submission_notes: Optional[str] = None

class MilestoneReviewRequest(BaseModel):
    decision: str  # "Approved" or "Revision Requested"
    comments: Optional[str] = None

class MilestoneResponse(BaseModel):
    id: int
    project_id: int
    title: str
    description: Optional[str] = None
    planned_due_date: datetime
    completion_criteria: Optional[str] = None
    status: MilestoneStatusEnum
    submission_status: str
    review_status: str
    reviewer_id: Optional[int] = None
    reviewer_name: Optional[str] = None
    reviewer_comments: Optional[str] = None
    completed_at: Optional[datetime] = None
    linked_task_ids: List[int] = []
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
