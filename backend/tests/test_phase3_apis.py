import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

@pytest.fixture(scope="module")
def tokens():
    # Login credentials
    hod_res = client.post("/api/v1/auth/login", json={"username_or_email": "hod.cse@college.edu", "password": "HodPass@2026"})
    adv2a_res = client.post("/api/v1/auth/login", json={"username_or_email": "advisor.2a@college.edu", "password": "AdvisorPass@2026"})
    adv2b_res = client.post("/api/v1/auth/login", json={"username_or_email": "advisor.2b@college.edu", "password": "AdvisorPass@2026"})
    mentor_res = client.post("/api/v1/auth/login", json={"username_or_email": "mentor.sharma@college.edu", "password": "MentorPass@2026"})
    student1_res = client.post("/api/v1/auth/login", json={"username_or_email": "student_lead_1", "password": "StudentPass@2026"})
    student2_res = client.post("/api/v1/auth/login", json={"username_or_email": "student_lead_2", "password": "StudentPass@2026"})

    return {
        "hod": hod_res.json()["access_token"],
        "adv_2a": adv2a_res.json()["access_token"],
        "adv_2b": adv2b_res.json()["access_token"],
        "mentor": mentor_res.json()["access_token"],
        "student_1": student1_res.json()["access_token"],
        "student_2": student2_res.json()["access_token"],
    }

# ----------------- POSITIVE TESTS -----------------

def test_hod_lists_all_projects(tokens):
    res = client.get("/api/v1/projects?size=100", headers={"Authorization": f"Bearer {tokens['hod']}"})
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 325
    assert len(data["items"]) == 100

def test_advisor_scoped_to_assigned_section(tokens):
    # adv_2a is assigned to Second Year CSE-A (which has exactly 25 projects in Phase 10)
    res = client.get("/api/v1/projects", headers={"Authorization": f"Bearer {tokens['adv_2a']}"})
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 25
    for item in data["items"]:
        assert item["section_name"] == "CSE-A"
        assert item["academic_year_name"] == "Second Year"

def test_student_scoped_to_membership(tokens):
    # student_1 belongs only to PRJ-2026-001
    res = client.get("/api/v1/projects", headers={"Authorization": f"Bearer {tokens['student_1']}"})
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 1
    assert data["items"][0]["code"] == "PRJ-2026-001"

def test_task_lifecycle_and_progress_recalculation(tokens):
    # Get tasks for project 1
    tasks_res = client.get("/api/v1/projects/1/tasks", headers={"Authorization": f"Bearer {tokens['student_1']}"})
    assert tasks_res.status_code == 200
    tasks = tasks_res.json()
    assert len(tasks) > 0
    target_task = tasks[0]

    # Student submits task for review
    submit_res = client.post(
        f"/api/v1/tasks/{target_task['id']}/submit-review",
        json={"submission_details": "Implemented automated model checkpoints and unit tests."},
        headers={"Authorization": f"Bearer {tokens['student_1']}"}
    )
    assert submit_res.status_code == 200
    assert submit_res.json()["status"] == "SUBMITTED_FOR_REVIEW"

    # Mentor reviews and approves
    review_res = client.post(
        f"/api/v1/tasks/{target_task['id']}/review",
        json={"decision": "Approved", "comments": "Excellent execution and thorough test coverage."},
        headers={"Authorization": f"Bearer {tokens['mentor']}"}
    )
    assert review_res.status_code == 200
    assert review_res.json()["status"] == "COMPLETED"
    assert review_res.json()["completion_fraction"] == 1.0

    # Verify project progress was dynamically recalculated
    proj_res = client.get("/api/v1/projects/1", headers={"Authorization": f"Bearer {tokens['student_1']}"})
    assert proj_res.status_code == 200
    assert proj_res.json()["progress_percentage"] > 0.0

def test_milestone_submission_and_review(tokens):
    milestones_res = client.get("/api/v1/projects/1/milestones", headers={"Authorization": f"Bearer {tokens['student_1']}"})
    assert milestones_res.status_code == 200
    milestones = milestones_res.json()
    assert len(milestones) > 0
    m = milestones[0]

    # Student submits milestone
    sub_res = client.post(
        f"/api/v1/milestones/{m['id']}/submit",
        json={"submission_notes": "All phase deliverables packaged with documentation."},
        headers={"Authorization": f"Bearer {tokens['student_1']}"}
    )
    assert sub_res.status_code == 200
    assert sub_res.json()["submission_status"] == "Submitted"

    # Mentor reviews milestone
    rev_res = client.post(
        f"/api/v1/milestones/{m['id']}/review",
        json={"decision": "Approved", "comments": "Milestone criteria satisfied with distinction."},
        headers={"Authorization": f"Bearer {tokens['mentor']}"}
    )
    assert rev_res.status_code == 200
    assert rev_res.json()["status"] == "APPROVED"
    assert rev_res.json()["review_status"] == "Approved"

def test_progress_report_submission_and_review(tokens):
    # Student submits report
    rep_res = client.post(
        "/api/v1/projects/1/reports",
        json={
            "reporting_period": "Cycle 2 / Sprint 3",
            "work_completed": "Completed backend services and database migrations.",
            "current_challenges": "Integrating realtime telemetry feeds.",
            "planned_next_steps": "Design and build frontend dashboard UI.",
            "supporting_evidence": "Test log reports attached."
        },
        headers={"Authorization": f"Bearer {tokens['student_1']}"}
    )
    assert rep_res.status_code == 201
    report = rep_res.json()
    assert report["status"] == "SUBMITTED"

    # Mentor reviews report
    rev_res = client.post(
        f"/api/v1/reports/{report['id']}/reviews",
        json={"status": "APPROVED", "comments": "Good progress made. Proceed to dashboard layout."},
        headers={"Authorization": f"Bearer {tokens['mentor']}"}
    )
    assert rev_res.status_code == 200
    assert rev_res.json()["status"] == "APPROVED"
    assert len(rev_res.json()["reviews"]) >= 1

    # Clean up test report and reviews so database remains neat without duplicate reports
    from app.core.database import SessionLocal
    from app.models import ProgressReport, ReportReview, ProjectActivity
    db = SessionLocal()
    try:
        db.query(ReportReview).filter(ReportReview.report_id == report["id"]).delete()
        db.query(ProgressReport).filter(ProgressReport.id == report["id"]).delete()
        db.query(ProjectActivity).filter(ProjectActivity.description.like(f"%{report['reporting_period']}%")).delete(synchronize_session=False)
        db.commit()
    finally:
        db.close()

# ----------------- ANALYTICS POSITIVE TESTS -----------------

def test_hod_analytics(tokens):
    res = client.get("/api/v1/analytics/hod", headers={"Authorization": f"Bearer {tokens['hod']}"})
    assert res.status_code == 200
    data = res.json()
    assert data["total_projects"] == 325
    assert len(data["projects_by_year"]) == 3
    assert len(data["projects_by_section"]) == 13
    assert "in_progress_count" in data
    assert "completed_count" in data
    assert "average_progress" in data

def test_advisor_analytics(tokens):
    res = client.get("/api/v1/analytics/advisor", headers={"Authorization": f"Bearer {tokens['adv_2a']}"})
    assert res.status_code == 200
    data = res.json()
    assert data["section_code"] == "Y2-CSE-A"
    assert data["total_projects"] == 25
    assert "section_average_progress" in data
    assert "upcoming_deadlines" in data

def test_mentor_analytics(tokens):
    res = client.get("/api/v1/analytics/mentor", headers={"Authorization": f"Bearer {tokens['mentor']}"})
    assert res.status_code == 200
    data = res.json()
    assert data["assigned_projects_count"] > 0
    assert "upcoming_milestones" in data

def test_student_analytics(tokens):
    res = client.get("/api/v1/analytics/student", headers={"Authorization": f"Bearer {tokens['student_1']}"})
    assert res.status_code == 200
    data = res.json()
    assert len(data["authorized_projects"]) >= 1
    assert "assigned_tasks" in data
    assert "upcoming_deadlines" in data

# ----------------- REQUIRED NEGATIVE SECURITY TESTS (Section 12) -----------------

def test_negative_1_advisor_cross_section_project_access_denied(tokens):
    # adv_2a assigned to Y2 CSE-A (Project 1, 2). Project 3 belongs to Y2 CSE-B (adv_2b).
    res = client.get("/api/v1/projects/3", headers={"Authorization": f"Bearer {tokens['adv_2a']}"})
    assert res.status_code in [403, 404]

def test_negative_2_advisor_modify_unrelated_project_task_denied(tokens):
    # adv_2a attempts to modify task belonging to Project 3 (Y2 CSE-B)
    # First get a task from project 3 as HOD
    tasks_res = client.get("/api/v1/projects/3/tasks", headers={"Authorization": f"Bearer {tokens['hod']}"})
    task_id = tasks_res.json()[0]["id"]

    res = client.patch(
        f"/api/v1/tasks/{task_id}",
        json={"title": "Hacked Task Title"},
        headers={"Authorization": f"Bearer {tokens['adv_2a']}"}
    )
    assert res.status_code in [403, 404]

def test_negative_3_mentor_unassigned_project_read_denied(tokens):
    # Find a project NOT assigned to mentor.sharma
    all_projs = client.get("/api/v1/projects?size=100", headers={"Authorization": f"Bearer {tokens['hod']}"}).json()["items"]
    mentor_user_id = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {tokens['mentor']}"}).json()["id"]
    unassigned = next(p for p in all_projs if p["mentor_id"] != mentor_user_id)

    res = client.get(f"/api/v1/projects/{unassigned['id']}", headers={"Authorization": f"Bearer {tokens['mentor']}"})
    assert res.status_code in [403, 404]

def test_negative_4_mentor_review_unassigned_project_report_denied(tokens):
    # Find a report from an unassigned project
    all_projs = client.get("/api/v1/projects?size=100", headers={"Authorization": f"Bearer {tokens['hod']}"}).json()["items"]
    mentor_user_id = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {tokens['mentor']}"}).json()["id"]
    unassigned = next(p for p in all_projs if p["mentor_id"] != mentor_user_id)

    reports_res = client.get(f"/api/v1/projects/{unassigned['id']}/reports", headers={"Authorization": f"Bearer {tokens['hod']}"})
    if reports_res.json():
        report_id = reports_res.json()[0]["id"]
        res = client.post(
            f"/api/v1/reports/{report_id}/reviews",
            json={"status": "APPROVED", "comments": "Unauthorized approval attempt"},
            headers={"Authorization": f"Bearer {tokens['mentor']}"}
        )
        assert res.status_code in [403, 404]

def test_negative_5_student_read_another_team_project_denied(tokens):
    # student_1 belongs to Project 1. Attempt to read Project 2.
    res = client.get("/api/v1/projects/2", headers={"Authorization": f"Bearer {tokens['student_1']}"})
    assert res.status_code in [403, 404]

def test_negative_6_student_access_another_team_private_report_denied(tokens):
    # Get a report from Project 2
    reports_res = client.get("/api/v1/projects/2/reports", headers={"Authorization": f"Bearer {tokens['hod']}"})
    report_id = reports_res.json()[0]["id"]

    res = client.get(f"/api/v1/reports/{report_id}", headers={"Authorization": f"Bearer {tokens['student_1']}"})
    assert res.status_code in [403, 404]

def test_negative_7_student_cannot_approve_own_report(tokens):
    # student_1 attempts to review their own report on Project 1
    reports_res = client.get("/api/v1/projects/1/reports", headers={"Authorization": f"Bearer {tokens['student_1']}"})
    report_id = reports_res.json()[0]["id"]

    res = client.post(
        f"/api/v1/reports/{report_id}/reviews",
        json={"status": "APPROVED", "comments": "Self-approval attempt"},
        headers={"Authorization": f"Bearer {tokens['student_1']}"}
    )
    assert res.status_code == 403

def test_negative_8_update_resource_with_guessed_id_fails(tokens):
    res = client.patch(
        "/api/v1/tasks/999999",
        json={"title": "Non-existent task"},
        headers={"Authorization": f"Bearer {tokens['hod']}"}
    )
    assert res.status_code == 404

def test_negative_9_unauthorized_analytics_access_denied(tokens):
    # Student attempts to access HOD analytics
    res = client.get("/api/v1/analytics/hod", headers={"Authorization": f"Bearer {tokens['student_1']}"})
    assert res.status_code == 403

    # Advisor attempts to access Mentor analytics
    res2 = client.get("/api/v1/analytics/mentor", headers={"Authorization": f"Bearer {tokens['adv_2a']}"})
    assert res2.status_code == 403

def test_negative_10_invalid_project_status_transition_rejected(tokens):
    # Find a completed project
    all_projs = client.get("/api/v1/projects?size=100", headers={"Authorization": f"Bearer {tokens['hod']}"}).json()["items"]
    completed_proj = next((p for p in all_projs if p["status"] == "COMPLETED"), None)

    if completed_proj:
        # Attempting to submit or re-approve a completed project
        res = client.post(
            f"/api/v1/projects/{completed_proj['id']}/submit",
            headers={"Authorization": f"Bearer {tokens['hod']}"}
        )
        assert res.status_code == 400
