import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models import AcademicYear, Section, Project, User

client = TestClient(app)

@pytest.fixture(scope="module")
def db():
    session = SessionLocal()
    yield session
    session.close()

@pytest.fixture(scope="module")
def tokens():
    login_data = [
        ("hod", "hod.cse@college.edu", "HodPass@2026", "HOD"),
        ("adv_2a", "advisor.2a@college.edu", "AdvisorPass@2026", "ADVISOR"),
        ("adv_3a", "advisor.3a@college.edu", "AdvisorPass@2026", "ADVISOR"),
        ("mentor", "mentor.sharma@college.edu", "MentorPass@2026", "MENTOR"),
        ("student_1", "student_lead_1", "StudentPass@2026", "STUDENT"),
    ]
    toks = {}
    for key, email, pwd, role in login_data:
        res = client.post("/api/v1/auth/login", json={"username_or_email": email, "password": pwd})
        assert res.status_code == 200, f"Failed login for {email}: {res.text}"
        toks[key] = res.json()["access_token"]
    return toks

def test_academic_hierarchy_structure(db):
    """Verify Department -> 3 Academic Years -> 13 Sections -> 325 Projects."""
    years = db.query(AcademicYear).order_by(AcademicYear.year_number).all()
    assert len(years) == 3, f"Expected 3 academic years, found {len(years)}"

    expected_sections = {
        2: 5,  # Year 2 has 5 sections: CSE-A through CSE-E
        3: 4,  # Year 3 has 4 sections: CSE-A through CSE-D
        4: 4,  # Year 4 has 4 sections: CSE-A through CSE-D
    }

    total_sections = 0
    total_projects = 0

    for yr in years:
        secs = db.query(Section).filter_by(academic_year_id=yr.id).all()
        assert len(secs) == expected_sections[yr.year_number], (
            f"Year {yr.year_number} has {len(secs)} sections, expected {expected_sections[yr.year_number]}"
        )
        total_sections += len(secs)

        yr_projects = db.query(Project).filter_by(academic_year_id=yr.id).all()
        expected_yr_projects = expected_sections[yr.year_number] * 25
        assert len(yr_projects) == expected_yr_projects, (
            f"Year {yr.year_number} has {len(yr_projects)} projects, expected {expected_yr_projects}"
        )
        total_projects += len(yr_projects)

    assert total_sections == 13, f"Total sections should be 13, got {total_sections}"
    assert total_projects == 325, f"Total projects should be 325, got {total_projects}"

def test_every_section_contains_at_least_25_projects(db):
    """Strictly verify every single section has >= 25 projects."""
    sections = db.query(Section).all()
    assert len(sections) == 13

    for s in sections:
        projs = db.query(Project).filter_by(section_id=s.id).all()
        assert len(projs) >= 25, f"Section {s.code} has {len(projs)} projects, expected >= 25"
        # Verify year consistency
        for p in projs:
            assert p.academic_year_id == s.academic_year_id, (
                f"Project {p.code} academic_year_id ({p.academic_year_id}) does not match section academic_year_id ({s.academic_year_id})"
            )

def test_department_overview_endpoint(tokens):
    """GET /api/v1/academic/overview returns full academic hierarchy."""
    res = client.get("/api/v1/academic/overview", headers={"Authorization": f"Bearer {tokens['hod']}"})
    assert res.status_code == 200
    data = res.json()

    assert data["total_academic_years"] == 3
    assert data["total_sections"] == 13
    assert data["total_projects"] == 325
    assert len(data["years"]) == 3

    # Check Year 2
    y2 = next(y for y in data["years"] if y["year_number"] == 2)
    assert y2["sections_count"] == 5
    assert y2["total_projects"] == 125
    assert len(y2["sections"]) == 5

    # Check Year 3
    y3 = next(y for y in data["years"] if y["year_number"] == 3)
    assert y3["sections_count"] == 4
    assert y3["total_projects"] == 100
    assert len(y3["sections"]) == 4

    # Check Year 4
    y4 = next(y for y in data["years"] if y["year_number"] == 4)
    assert y4["sections_count"] == 4
    assert y4["total_projects"] == 100
    assert len(y4["sections"]) == 4

def test_academic_years_and_sections_isolation(tokens):
    """Verify that filtering sections by academic year strictly isolates records."""
    # Get Academic Years first
    res_years = client.get("/api/v1/academic/years", headers={"Authorization": f"Bearer {tokens['hod']}"})
    assert res_years.status_code == 200
    years_data = res_years.json()
    y2_id = next(y["id"] for y in years_data if y["year_number"] == 2)
    y3_id = next(y["id"] for y in years_data if y["year_number"] == 3)

    # Fetch Year 2 sections
    res_y2 = client.get(f"/api/v1/academic/sections?academic_year_id={y2_id}", headers={"Authorization": f"Bearer {tokens['hod']}"})
    assert res_y2.status_code == 200
    y2_secs = res_y2.json()
    assert len(y2_secs) == 5
    for s in y2_secs:
        assert s["academic_year_number"] == 2
        assert s["total_projects"] >= 25

    # Fetch Year 3 sections
    res_y3 = client.get(f"/api/v1/academic/sections?academic_year_id={y3_id}", headers={"Authorization": f"Bearer {tokens['hod']}"})
    assert res_y3.status_code == 200
    y3_secs = res_y3.json()
    assert len(y3_secs) == 4
    for s in y3_secs:
        assert s["academic_year_number"] == 3
        assert s["total_projects"] >= 25

def test_advisor_analytics_hierarchy_context(tokens):
    """Verify Advisor analytics returns enriched year and section context with 25 projects."""
    res = client.get("/api/v1/analytics/advisor", headers={"Authorization": f"Bearer {tokens['adv_2a']}"})
    assert res.status_code == 200
    data = res.json()

    assert data["section_code"] == "Y2-CSE-A"
    assert data["academic_year_name"] == "Second Year"
    assert data["total_projects"] == 25
    assert len(data["projects"]) == 25
    assert len(data["assigned_sections"]) >= 1

def test_mentor_analytics_grouped_by_year_and_section(tokens):
    """Verify Mentor analytics returns projects grouped by academic year and section."""
    res = client.get("/api/v1/analytics/mentor", headers={"Authorization": f"Bearer {tokens['mentor']}"})
    assert res.status_code == 200
    data = res.json()

    assert data["assigned_projects_count"] > 0
    assert "projects_by_year_and_section" in data
    cohort_groups = data["projects_by_year_and_section"]
    assert len(cohort_groups) > 0
    for grp in cohort_groups:
        assert "year_name" in grp
        assert "section_code" in grp
        assert grp["projects_count"] > 0

def test_project_codes_uniqueness_and_integrity(db):
    """Verify all 325 project codes are unique and properly formatted."""
    projects = db.query(Project).all()
    assert len(projects) == 325
    codes = [p.code for p in projects]
    assert len(set(codes)) == 325, "Project codes must be unique across all 325 projects"
    for code in codes:
        assert code.startswith("PRJ-2026-"), f"Unexpected code format: {code}"
