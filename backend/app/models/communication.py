from datetime import datetime, timezone
import enum
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum, UniqueConstraint
from sqlalchemy.orm import relationship
from app.models.base import Base

class ConversationTypeEnum(str, enum.Enum):
    PROJECT_DISCUSSION = "PROJECT_DISCUSSION"
    DIRECT_MESSAGE = "DIRECT_MESSAGE"

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=True)
    conversation_type = Column(Enum(ConversationTypeEnum), default=ConversationTypeEnum.PROJECT_DISCUSSION, nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    project = relationship("Project", back_populates="conversations")
    participants = relationship("ConversationParticipant", back_populates="conversation", cascade="all, delete-orphan")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")

class ConversationParticipant(Base):
    __tablename__ = "conversation_participants"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    joined_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    last_read_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        UniqueConstraint("conversation_id", "user_id", name="uq_conv_participant"),
    )

    conversation = relationship("Conversation", back_populates="participants")
    user = relationship("User", back_populates="conversation_participants")

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    
    related_task_id = Column(Integer, ForeignKey("tasks.id"), nullable=True)
    related_milestone_id = Column(Integer, ForeignKey("milestones.id"), nullable=True)
    related_report_id = Column(Integer, ForeignKey("progress_reports.id"), nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    conversation = relationship("Conversation", back_populates="messages")
    sender = relationship("User", back_populates="messages")
    related_task = relationship("Task", foreign_keys=[related_task_id])
    related_milestone = relationship("Milestone", foreign_keys=[related_milestone_id])
    related_report = relationship("ProgressReport", foreign_keys=[related_report_id])
