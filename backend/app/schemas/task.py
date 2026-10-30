from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict
from app.models.task import TaskStatusEnum, TaskPriorityEnum

class TaskCreateRequest(BaseModel):
    title: str
    description: Optional[str] = None
    assignee_id: Optional[int] = None
    priority: TaskPriorityEnum = TaskPriorityEnum.MEDIUM
    start_date: Optional[datetime] = None
    due_date: datetime
    estimated_effort: float = Field(default=1.0, gt=0, description="Task weight (w_i), must be greater than 0")

class TaskUpdateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    assignee_id: Optional[int] = None
    priority: Optional[TaskPriorityEnum] = None
    start_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    estimated_effort: Optional[float] = Field(default=None, gt=0)
    status: Optional[TaskStatusEnum] = None
    completion_fraction: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    submission_details: Optional[str] = None

class TaskSubmitReviewRequest(BaseModel):
    submission_details: str

class TaskReviewRequest(BaseModel):
    decision: str = Field(description="'Approved' or 'Changes Requested'")
    comments: Optional[str] = None

class TaskResponse(BaseModel):
    id: int
    project_id: int
    title: str
    description: Optional[str] = None
    assignee_id: Optional[int] = None
    assignee_name: Optional[str] = None
    priority: TaskPriorityEnum
    start_date: Optional[datetime] = None
    due_date: datetime
    estimated_effort: float
    status: TaskStatusEnum
    completion_fraction: float
    submission_details: Optional[str] = None
    review_status: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
