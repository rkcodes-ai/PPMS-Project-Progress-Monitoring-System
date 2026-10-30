from datetime import datetime, timezone
import enum
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.models.base import Base

class ReportStatusEnum(str, enum.Enum):
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    APPROVED = "APPROVED"
    NEEDS_REVISION = "NEEDS_REVISION"
    REJECTED = "REJECTED"

class ProgressReport(Base):
    __tablename__ = "progress_reports"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    submitted_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    reporting_period = Column(String(100), nullable=False)             # e.g., "Week 4 / Month 1"
    work_completed = Column(Text, nullable=False)
    current_challenges = Column(Text, nullable=True)
    planned_next_steps = Column(Text, nullable=False)
    supporting_evidence = Column(Text, nullable=True)                  # e.g., link or notes
    version = Column(Integer, default=1, nullable=False)
    
    status = Column(Enum(ReportStatusEnum), default=ReportStatusEnum.DRAFT, nullable=False, index=True)
    submitted_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    project = relationship("Project", back_populates="progress_reports")
    submitted_by = relationship("User", foreign_keys=[submitted_by_id], back_populates="submitted_reports")
    reviews = relationship("ReportReview", back_populates="report", cascade="all, delete-orphan")

class ReportReview(Base):
    __tablename__ = "report_reviews"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("progress_reports.id"), nullable=False)
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(Enum(ReportStatusEnum), nullable=False)            # APPROVED, NEEDS_REVISION, REJECTED
    comments = Column(Text, nullable=False)
    reviewed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    report = relationship("ProgressReport", back_populates="reviews")
    reviewer = relationship("User", foreign_keys=[reviewer_id], back_populates="report_reviews")
