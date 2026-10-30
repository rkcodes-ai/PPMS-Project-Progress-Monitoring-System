from datetime import datetime, timezone
import enum
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum, UniqueConstraint
from sqlalchemy.orm import relationship
from app.models.base import Base

class MilestoneStatusEnum(str, enum.Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    SUBMITTED = "SUBMITTED"
    REVISION_REQUESTED = "REVISION_REQUESTED"
    APPROVED = "APPROVED"
    COMPLETED = "COMPLETED"

class Milestone(Base):
    __tablename__ = "milestones"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    planned_due_date = Column(DateTime, nullable=False)
    completion_criteria = Column(Text, nullable=True)
    
    status = Column(Enum(MilestoneStatusEnum), default=MilestoneStatusEnum.PENDING, nullable=False)
    submission_status = Column(String(50), default="Not Submitted", nullable=False)
    review_status = Column(String(50), default="Pending", nullable=False)
    
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    reviewer_comments = Column(Text, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    project = relationship("Project", back_populates="milestones")
    reviewer = relationship("User", foreign_keys=[reviewer_id])
    task_links = relationship("MilestoneTask", back_populates="milestone", cascade="all, delete-orphan")

class MilestoneTask(Base):
    __tablename__ = "milestone_tasks"

    id = Column(Integer, primary_key=True, index=True)
    milestone_id = Column(Integer, ForeignKey("milestones.id"), nullable=False)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False)

    __table_args__ = (
        UniqueConstraint("milestone_id", "task_id", name="uq_milestone_task"),
    )

    milestone = relationship("Milestone", back_populates="task_links")
    task = relationship("Task", back_populates="milestone_links")
