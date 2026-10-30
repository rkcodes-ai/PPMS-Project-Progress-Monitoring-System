from datetime import datetime, timezone
import enum
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum, UniqueConstraint
from sqlalchemy.orm import relationship
from app.models.base import Base

class RoleEnum(str, enum.Enum):
    HOD = "HOD"
    ADVISOR = "ADVISOR"
    MENTOR = "MENTOR"
    STUDENT = "STUDENT"

class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(Enum(RoleEnum), unique=True, nullable=False, index=True)
    description = Column(String(255), nullable=True)

    user_roles = relationship("UserRole", back_populates="role")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    section_id = Column(Integer, ForeignKey("sections.id"), nullable=True)
    token_version = Column(Integer, default=1, nullable=False, server_default="1")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    department = relationship("Department", back_populates="users")
    section = relationship("Section", back_populates="students")
    
    user_roles = relationship("UserRole", back_populates="user", cascade="all, delete-orphan")
    advisor_assignments = relationship("AdvisorAssignment", foreign_keys="[AdvisorAssignment.user_id]", back_populates="user")
    project_memberships = relationship("ProjectMember", back_populates="user")
    mentor_assignments = relationship("MentorAssignment", foreign_keys="[MentorAssignment.user_id]", back_populates="user")
    assigned_tasks = relationship("Task", foreign_keys="[Task.assignee_id]", back_populates="assignee")
    submitted_reports = relationship("ProgressReport", back_populates="submitted_by")
    report_reviews = relationship("ReportReview", back_populates="reviewer")
    messages = relationship("Message", back_populates="sender")
    conversation_participants = relationship("ConversationParticipant", back_populates="user")
    notifications = relationship("Notification", back_populates="recipient")

class UserRole(Base):
    __tablename__ = "user_roles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        UniqueConstraint("user_id", "role_id", name="uq_user_role"),
    )

    user = relationship("User", back_populates="user_roles")
    role = relationship("Role", back_populates="user_roles")
