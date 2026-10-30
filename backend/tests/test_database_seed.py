import pytest
from app.core.database import SessionLocal
from app.models import (
    Department, AcademicPeriod, AcademicYear, Section, AdvisorAssignment,
    User, Role, RoleEnum, UserRole,
    Project, ProjectMember, MentorAssignment,
    Task, Milestone, ProgressReport, Conversation, Message
)
from app.services.progress_service import calculate_project_progress

@pytest.fixture(scope="module")
def db():
    session = SessionLocal()
    yield session
    session.close()

def test_department_and_periods(db):
    dept = db.query(Department).filter_by(code="CSE").first()
    assert dept is not None
    assert dept.name == "Computer Science and Engineering"

    period = db.query(AcademicPeriod).filter_by(is_active=True).first()
    assert period is not None
    assert "2026-2027" in period.name

def test_sections_count_and_distribution(db):
    sections = db.query(Section).all()
    assert len(sections) == 13, f"Expected 13 sections, found {len(sections)}"

    y2_sections = db.query(Section).join(AcademicYear).filter(AcademicYear.year_number == 2).all()
    y3_sections = db.query(Section).join(AcademicYear).filter(AcademicYear.year_number == 3).all()
    y4_sections = db.query(Section).join(AcademicYear).filter(AcademicYear.year_number == 4).all()

    assert len(y2_sections) == 5, f"Expected 5 Second Year sections, found {len(y2_sections)}"
    assert len(y3_sections) == 4, f"Expected 4 Third Year sections, found {len(y3_sections)}"
    assert len(y4_sections) == 4, f"Expected 4 Fourth Year sections, found {len(y4_sections)}"

def test_one_active_advisor_per_section(db):
    sections = db.query(Section).all()
    for sec in sections:
        active_advisors = db.query(AdvisorAssignment).filter_by(
            section_id=sec.id,
            is_active=True
        ).all()
        assert len(active_advisors) == 1, f"Section {sec.code} has {len(active_advisors)} active advisors, expected exactly 1"

def test_projects_count_and_distribution(db):
    projects = db.query(Project).all()
    assert len(projects) == 325, f"Expected exactly 325 projects across 13 sections, found {len(projects)}"

    y2_projects = db.query(Project).join(AcademicYear).filter(AcademicYear.year_number == 2).all()
    y3_projects = db.query(Project).join(AcademicYear).filter(AcademicYear.year_number == 3).all()
    y4_projects = db.query(Project).join(AcademicYear).filter(AcademicYear.year_number == 4).all()

    assert len(y2_projects) == 125, f"Expected 125 Second Year projects (5 sections * 25), found {len(y2_projects)}"
    assert len(y3_projects) == 100, f"Expected 100 Third Year projects (4 sections * 25), found {len(y3_projects)}"
    assert len(y4_projects) == 100, f"Expected 100 Fourth Year projects (4 sections * 25), found {len(y4_projects)}"

    # Phase 10 mandatory rule: every section must have at least 25 projects
    sections = db.query(Section).all()
    assert len(sections) == 13
    for s in sections:
        sec_cnt = db.query(Project).filter_by(section_id=s.id).count()
        assert sec_cnt >= 25, f"Section {s.code} has {sec_cnt} projects, expected >= 25"

def test_project_components_and_progress_calculation(db):
    projects = db.query(Project).all()
    for p in projects:
        # Check team leader and members
        assert p.team_lead_id is not None
        assert p.mentor_id is not None
        members = db.query(ProjectMember).filter_by(project_id=p.id).all()
        assert len(members) >= 2, f"Project {p.code} has less than 2 members"

        # Check tasks
        tasks = db.query(Task).filter_by(project_id=p.id).all()
        assert len(tasks) >= 4, f"Project {p.code} has less than 4 tasks"

        # Check milestones
        milestones = db.query(Milestone).filter_by(project_id=p.id).all()
        assert len(milestones) >= 3, f"Project {p.code} has less than 3 milestones"

        # Verify progress calculation math
        computed_progress = calculate_project_progress(tasks)
        assert abs(p.progress_percentage - computed_progress) < 0.01, (
            f"Project {p.code} saved progress ({p.progress_percentage}) does not match formula ({computed_progress})"
        )

def test_roles_and_multi_role_user(db):
    # Verify HOD
    hod_role = db.query(Role).filter_by(name=RoleEnum.HOD).first()
    hod_user_role = db.query(UserRole).filter_by(role_id=hod_role.id).first()
    assert hod_user_role is not None

    # Verify multi-role advisor/mentor (Sneha Kulkarni)
    adv_3a = db.query(User).filter_by(username="adv_3a").first()
    assert adv_3a is not None
    user_roles = [ur.role.name for ur in adv_3a.user_roles]
    assert RoleEnum.ADVISOR in user_roles
    assert RoleEnum.MENTOR in user_roles
