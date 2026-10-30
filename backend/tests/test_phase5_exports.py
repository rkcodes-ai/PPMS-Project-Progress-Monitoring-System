import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.csv_export import sanitize_csv_value

client = TestClient(app)

@pytest.fixture(scope="module")
def tokens():
    hod_res = client.post("/api/v1/auth/login", json={"username_or_email": "hod.cse@college.edu", "password": "HodPass@2026"})
    adv2a_res = client.post("/api/v1/auth/login", json={"username_or_email": "advisor.2a@college.edu", "password": "AdvisorPass@2026"})
    adv2b_res = client.post("/api/v1/auth/login", json={"username_or_email": "advisor.2b@college.edu", "password": "AdvisorPass@2026"})
    mentor_res = client.post("/api/v1/auth/login", json={"username_or_email": "mentor.sharma@college.edu", "password": "MentorPass@2026"})
    student1_res = client.post("/api/v1/auth/login", json={"username_or_email": "student_lead_1", "password": "StudentPass@2026"})

    return {
        "hod": hod_res.json()["access_token"],
        "adv_2a": adv2a_res.json()["access_token"],
        "adv_2b": adv2b_res.json()["access_token"],
        "mentor": mentor_res.json()["access_token"],
        "student_1": student1_res.json()["access_token"],
    }

def test_formula_injection_sanitization():
    assert sanitize_csv_value("=1+1") == "'=1+1"
    assert sanitize_csv_value("+CMD|' /C calc'!A0") == "'+CMD|' /C calc'!A0"
    assert sanitize_csv_value("-5+10") == "'-5+10"
    assert sanitize_csv_value("@SUM(1,2)") == "'@SUM(1,2)"
    assert sanitize_csv_value("Normal Text") == "Normal Text"
    assert sanitize_csv_value(None) == ""

def test_hod_exports_department_analytics_csv(tokens):
    res = client.get(
        "/api/v1/analytics/export/department",
        headers={"Authorization": f"Bearer {tokens['hod']}"}
    )
    assert res.status_code == 200
    assert "text/csv" in res.headers["content-type"]
    assert "attachment; filename=" in res.headers["content-disposition"]
    
    content = res.content.decode("utf-8-sig")
    assert "Section Code,Section Name,Academic Year,Total Projects" in content
    # Check that secrets are not leaked
    assert "password" not in content.lower()
    assert "secret" not in content.lower()

def test_unauthorized_role_denied_department_export(tokens):
    # Student denied
    res_student = client.get(
        "/api/v1/analytics/export/department",
        headers={"Authorization": f"Bearer {tokens['student_1']}"}
    )
    assert res_student.status_code == 403

    # Advisor denied
    res_adv = client.get(
        "/api/v1/analytics/export/department",
        headers={"Authorization": f"Bearer {tokens['adv_2a']}"}
    )
    assert res_adv.status_code == 403

def test_section_export_authorization_and_cross_section_denial(tokens):
    # Advisor 2a is assigned to section 1 (Second Year CSE-A)
    res_ok = client.get(
        "/api/v1/analytics/export/section/1",
        headers={"Authorization": f"Bearer {tokens['adv_2a']}"}
    )
    assert res_ok.status_code == 200
    assert "text/csv" in res_ok.headers["content-type"]
    content = res_ok.content.decode("utf-8-sig")
    assert "Project Code,Title,Category,Team Lead" in content

    # Advisor 2b attempting to export section 1 (assigned to section 2) is denied
    res_denied = client.get(
        "/api/v1/analytics/export/section/1",
        headers={"Authorization": f"Bearer {tokens['adv_2b']}"}
    )
    assert res_denied.status_code == 403

def test_projects_export_role_scoping(tokens):
    # HOD exports all 25 projects
    res_hod = client.get(
        "/api/v1/projects/export",
        headers={"Authorization": f"Bearer {tokens['hod']}"}
    )
    assert res_hod.status_code == 200
    content_hod = res_hod.content.decode("utf-8-sig")
    lines_hod = [line for line in content_hod.strip().split("\r\n") if line]
    # Header + 325 projects = 326 lines
    assert len(lines_hod) == 326

    # Advisor 2a exports assigned section only (25 projects in Phase 10)
    res_adv = client.get(
        "/api/v1/projects/export",
        headers={"Authorization": f"Bearer {tokens['adv_2a']}"}
    )
    assert res_adv.status_code == 200
    content_adv = res_adv.content.decode("utf-8-sig")
    lines_adv = [line for line in content_adv.strip().split("\r\n") if line]
    assert len(lines_adv) == 26  # Header + 25 projects

    # Student 1 exports only their team project (1 project)
    res_student = client.get(
        "/api/v1/projects/export",
        headers={"Authorization": f"Bearer {tokens['student_1']}"}
    )
    assert res_student.status_code == 200
    content_student = res_student.content.decode("utf-8-sig")
    lines_student = [line for line in content_student.strip().split("\r\n") if line]
    assert len(lines_student) == 2  # Header + 1 project
