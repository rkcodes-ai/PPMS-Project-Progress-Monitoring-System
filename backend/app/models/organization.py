from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.models.base import Base

class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(20), unique=True, nullable=False, index=True)  # e.g., "CSE"
    name = Column(String(100), nullable=False)                         # Computer Science and Engineering
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    sections = relationship("Section", back_populates="department")
    users = relationship("User", back_populates="department")
    projects = relationship("Project", back_populates="department")

class AcademicPeriod(Base):
    __tablename__ = "academic_periods"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)             # e.g., "2026-2027 Academic Year"
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    sections = relationship("Section", back_populates="academic_period")
    advisor_assignments = relationship("AdvisorAssignment", back_populates="academic_period")
    projects = relationship("Project", back_populates="academic_period")

class AcademicYear(Base):
    __tablename__ = "academic_years"

    id = Column(Integer, primary_key=True, index=True)
    year_number = Column(Integer, unique=True, nullable=False)         # 2, 3, 4
    name = Column(String(50), nullable=False)                          # "Second Year", "Third Year", "Fourth Year"
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    sections = relationship("Section", back_populates="academic_year")
    projects = relationship("Project", back_populates="academic_year")

class Section(Base):
    __tablename__ = "sections"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(20), nullable=False)                          # "CSE-A", "CSE-B", etc.
    code = Column(String(50), unique=True, nullable=False, index=True) # e.g. "Y2-CSE-A", "Y3-CSE-B"
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    academic_year_id = Column(Integer, ForeignKey("academic_years.id"), nullable=False)
    academic_period_id = Column(Integer, ForeignKey("academic_periods.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        UniqueConstraint("name", "academic_year_id", "academic_period_id", name="uq_section_year_period"),
    )

    department = relationship("Department", back_populates="sections")
    academic_year = relationship("AcademicYear", back_populates="sections")
    academic_period = relationship("AcademicPeriod", back_populates="sections")
    advisor_assignments = relationship("AdvisorAssignment", back_populates="section")
    students = relationship("User", back_populates="section")
    projects = relationship("Project", back_populates="section")

class AdvisorAssignment(Base):
    __tablename__ = "advisor_assignments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    section_id = Column(Integer, ForeignKey("sections.id"), nullable=False)
    academic_period_id = Column(Integer, ForeignKey("academic_periods.id"), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    assigned_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    assigned_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    user = relationship("User", foreign_keys=[user_id], back_populates="advisor_assignments")
    assigned_by = relationship("User", foreign_keys=[assigned_by_id])
    section = relationship("Section", back_populates="advisor_assignments")
    academic_period = relationship("AcademicPeriod", back_populates="advisor_assignments")
