from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from app.models.project import ProjectStatusEnum, ProjectPriorityEnum, ProjectHealthEnum

class ProjectMemberItem(BaseModel):
    id: int
    user_id: int
    full_name: str
    email: str
    role_in_team: str

    model_config = ConfigDict(from_attributes=True)

class ProjectCreateRequest(BaseModel):
    title: str
    description: str
    objectives: Optional[str] = None
    category: str
    academic_year_id: int
    section_id: int
    start_date: datetime
    planned_completion_date: datetime
    priority: ProjectPriorityEnum = ProjectPriorityEnum.MEDIUM
    team_lead_id: Optional[int] = None
    member_user_ids: Optional[List[int]] = []

class ProjectUpdateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    objectives: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[ProjectPriorityEnum] = None
    planned_completion_date: Optional[datetime] = None
    mentor_id: Optional[int] = None

class ProjectActionRequest(BaseModel):
    comments: Optional[str] = None

class ProjectListItemResponse(BaseModel):
    id: int
    code: str
    title: str
    category: str
    department_id: int
    academic_year_id: int
    academic_year_name: str
    section_id: int
    section_code: str
    section_name: str
    team_lead_id: int
    team_lead_name: str
    mentor_id: Optional[int] = None
    mentor_name: Optional[str] = None
    priority: ProjectPriorityEnum
    status: ProjectStatusEnum
    health_status: ProjectHealthEnum
    progress_percentage: float
    start_date: datetime
    planned_completion_date: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ProjectDetailResponse(ProjectListItemResponse):
    description: str
    objectives: Optional[str] = None
    members: List[ProjectMemberItem] = []
    task_count: int = 0
    milestone_count: int = 0
    report_count: int = 0

class PaginatedProjectsResponse(BaseModel):
    items: List[ProjectListItemResponse]
    total: int
    page: int
    size: int
    total_pages: int
