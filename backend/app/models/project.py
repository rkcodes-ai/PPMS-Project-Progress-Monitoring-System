from datetime import datetime, timezone
import enum
from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey, Enum, UniqueConstraint
from sqlalchemy.orm import relationship
from app.models.base import Base

class ProjectStatusEnum(str, enum.Enum):
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    UNDER_REVIEW = "UNDER_REVIEW"
    APPROVED = "APPROVED"
    IN_PROGRESS = "IN_PROGRESS"
    SUBMITTED_FOR_FINAL_REVIEW = "SUBMITTED_FOR_FINAL_REVIEW"
    COMPLETED = "COMPLETED"
    REJECTED = "REJECTED"
    ARCHIVED = "ARCHIVED"

class ProjectPriorityEnum(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class ProjectHealthEnum(str, enum.Enum):
    ON_TRACK = "ON_TRACK"
    AT_RISK = "AT_RISK"
    DELAYED = "DELAYED"
    COMPLETED = "COMPLETED"

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False, index=True)
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=False)
    objectives = Column(Text, nullable=True)
    category = Column(String(100), nullable=False)                     # AI/ML, IoT, Web, Cybersecurity, etc.
    
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    academic_year_id = Column(Integer, ForeignKey("academic_years.id"), nullable=False)
    academic_period_id = Column(Integer, ForeignKey("academic_periods.id"), nullable=False)
    section_id = Column(Integer, ForeignKey("sections.id"), nullable=False)
    
    team_lead_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    mentor_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    start_date = Column(DateTime, nullable=False)
    planned_completion_date = Column(DateTime, nullable=False)
    
    priority = Column(Enum(ProjectPriorityEnum), default=ProjectPriorityEnum.MEDIUM, nullable=False)
    status = Column(Enum(ProjectStatusEnum), default=ProjectStatusEnum.DRAFT, nullable=False, index=True)
    health_status = Column(Enum(ProjectHealthEnum), default=ProjectHealthEnum.ON_TRACK, nullable=False)
    progress_percentage = Column(Float, default=0.0, nullable=False)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    department = relationship("Department", back_populates="projects")
    academic_year = relationship("AcademicYear", back_populates="projects")
    academic_period = relationship("AcademicPeriod", back_populates="projects")
    section = relationship("Section", back_populates="projects")
    team_lead = relationship("User", foreign_keys=[team_lead_id])
    mentor = relationship("User", foreign_keys=[mentor_id])

    members = relationship("ProjectMember", back_populates="project", cascade="all, delete-orphan")
    mentor_assignments = relationship("MentorAssignment", back_populates="project", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="project", cascade="all, delete-orphan")
    milestones = relationship("Milestone", back_populates="project", cascade="all, delete-orphan")
    progress_reports = relationship("ProgressReport", back_populates="project", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="project", cascade="all, delete-orphan")
    activities = relationship("ProjectActivity", back_populates="project", cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="project", cascade="all, delete-orphan")

class ProjectMember(Base):
    __tablename__ = "project_members"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role_in_team = Column(String(50), default="Member", nullable=False) # "Leader" or "Member"
    joined_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        UniqueConstraint("project_id", "user_id", name="uq_project_member"),
    )

    project = relationship("Project", back_populates="members")
    user = relationship("User", back_populates="project_memberships")

class MentorAssignment(Base):
    __tablename__ = "mentor_assignments"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    assigned_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    assigned_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    notes = Column(Text, nullable=True)

    project = relationship("Project", back_populates="mentor_assignments")
    user = relationship("User", foreign_keys=[user_id], back_populates="mentor_assignments")
    assigned_by = relationship("User", foreign_keys=[assigned_by_id])
