from datetime import datetime, timezone
import enum
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey, Enum, UniqueConstraint
from sqlalchemy.orm import relationship
from app.models.base import Base

class TaskStatusEnum(str, enum.Enum):
    TO_DO = "TO_DO"
    IN_PROGRESS = "IN_PROGRESS"
    BLOCKED = "BLOCKED"
    SUBMITTED_FOR_REVIEW = "SUBMITTED_FOR_REVIEW"
    CHANGES_REQUESTED = "CHANGES_REQUESTED"
    COMPLETED = "COMPLETED"

class TaskPriorityEnum(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    assignee_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    priority = Column(Enum(TaskPriorityEnum), default=TaskPriorityEnum.MEDIUM, nullable=False)
    
    start_date = Column(DateTime, nullable=True)
    due_date = Column(DateTime, nullable=False)
    
    # Weight w_i in progress formula (e.g. estimated effort hours or weight points)
    estimated_effort = Column(Float, default=1.0, nullable=False)
    
    status = Column(Enum(TaskStatusEnum), default=TaskStatusEnum.TO_DO, nullable=False, index=True)
    
    # Completion fraction c_i (0.0 to 1.0)
    completion_fraction = Column(Float, default=0.0, nullable=False)
    
    submission_details = Column(Text, nullable=True)
    review_status = Column(String(50), nullable=True)  # "Pending", "Approved", "Changes Requested"
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    project = relationship("Project", back_populates="tasks")
    assignee = relationship("User", back_populates="assigned_tasks")
    
    milestone_links = relationship("MilestoneTask", back_populates="task", cascade="all, delete-orphan")
    dependencies = relationship(
        "TaskDependency", 
        foreign_keys="[TaskDependency.task_id]", 
        back_populates="task", 
        cascade="all, delete-orphan"
    )

class TaskDependency(Base):
    __tablename__ = "task_dependencies"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False)
    depends_on_task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        UniqueConstraint("task_id", "depends_on_task_id", name="uq_task_dependency"),
    )

    task = relationship("Task", foreign_keys=[task_id], back_populates="dependencies")
    depends_on = relationship("Task", foreign_keys=[depends_on_task_id])
