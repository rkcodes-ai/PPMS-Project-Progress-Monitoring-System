from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.models.notification import NotificationEventTypeEnum

class NotificationResponse(BaseModel):
    id: int
    recipient_id: int
    event_type: NotificationEventTypeEnum
    title: str
    message: str
    resource_type: Optional[str] = None
    resource_id: Optional[int] = None
    is_read: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class NotificationUnreadCountResponse(BaseModel):
    unread_count: int

class NotificationMarkAllResponse(BaseModel):
    detail: str
    marked_count: int
