from datetime import datetime, timezone
import enum
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.models.base import Base

class NotificationEventTypeEnum(str, enum.Enum):
    PROPOSAL_DECISION = "PROPOSAL_DECISION"
    TASK_ASSIGNED = "TASK_ASSIGNED"
    UPCOMING_DEADLINE = "UPCOMING_DEADLINE"
    OVERDUE_TASK = "OVERDUE_TASK"
    NEW_PROGRESS_REPORT = "NEW_PROGRESS_REPORT"
    REVIEW_REQUEST = "REVIEW_REQUEST"
    MENTOR_FEEDBACK = "MENTOR_FEEDBACK"
    CORRECTION_REQUESTED = "CORRECTION_REQUESTED"
    MILESTONE_DECISION = "MILESTONE_DECISION"
    NEW_MESSAGE = "NEW_MESSAGE"
    PROJECT_COMPLETED = "PROJECT_COMPLETED"

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    recipient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    event_type = Column(Enum(NotificationEventTypeEnum), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    resource_type = Column(String(50), nullable=True)                  # "project", "task", "milestone", "report", "message"
    resource_id = Column(Integer, nullable=True)
    is_read = Column(Boolean, default=False, nullable=False, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    recipient = relationship("User", back_populates="notifications")
