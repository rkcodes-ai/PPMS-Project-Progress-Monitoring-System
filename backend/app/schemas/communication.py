from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator, ConfigDict
from app.models.communication import ConversationTypeEnum

class MessageCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000, description="Message text content")
    related_task_id: Optional[int] = Field(None, description="Optional linked task ID")
    related_milestone_id: Optional[int] = Field(None, description="Optional linked milestone ID")
    related_report_id: Optional[int] = Field(None, description="Optional linked progress report ID")

    @field_validator("content")
    @classmethod
    def validate_content_not_empty(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("Message content cannot be empty or only whitespace.")
        return stripped

class MessageResponse(BaseModel):
    id: int
    conversation_id: int
    sender_id: int
    sender_name: str
    sender_role: Optional[str] = None
    content: str
    related_task_id: Optional[int] = None
    related_milestone_id: Optional[int] = None
    related_report_id: Optional[int] = None
    created_at: datetime
    is_own_message: bool = False

    model_config = ConfigDict(from_attributes=True)

class ConversationCreate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    conversation_type: ConversationTypeEnum = ConversationTypeEnum.PROJECT_DISCUSSION

class ConversationParticipantResponse(BaseModel):
    user_id: int
    user_name: str
    joined_at: datetime
    last_read_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class ConversationResponse(BaseModel):
    id: int
    title: Optional[str] = None
    conversation_type: ConversationTypeEnum
    project_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    message_count: int = 0
    unread_count: int = 0
    last_message: Optional[MessageResponse] = None

    model_config = ConfigDict(from_attributes=True)

class ConversationUnreadResponse(BaseModel):
    conversation_id: int
    unread_count: int

class MarkReadResponse(BaseModel):
    conversation_id: int
    marked_read_at: datetime
    unread_count: int = 0
