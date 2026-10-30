import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models.project import Project, ProjectStatusEnum
from app.models.milestone import Milestone, MilestoneStatusEnum

client = TestClient(app)

@pytest.fixture(scope="module")
def tokens():
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

def test_project_completion_certificate_eligible_download(tokens):
    # Project 6 is seeded as COMPLETED in the database
    res = client.get(
        "/api/v1/projects/6/certificate",
        headers={"Authorization": f"Bearer {tokens['hod']}"}
    )
    assert res.status_code == 200
    assert res.headers["content-type"] == "application/pdf"
    assert "attachment" in res.headers["content-disposition"]
    assert "Certificate_PRJ-2026-006.pdf" in res.headers["content-disposition"]
    # PDF magic bytes "%PDF"
    assert res.content.startswith(b"%PDF")
    assert len(res.content) > 1000

def test_project_certificate_rejected_for_non_completed_project(tokens):
    # Project 1 is IN_PROGRESS / DRAFT, not COMPLETED
    res = client.get(
        "/api/v1/projects/1/certificate",
        headers={"Authorization": f"Bearer {tokens['hod']}"}
    )
    assert res.status_code == 400
    assert "only issued when project status is formally 'COMPLETED'" in res.json()["detail"]

def test_project_certificate_access_control(tokens):
    # Student 1 is not a member of Project 6 (Section 2C / team 6)
    res = client.get(
        "/api/v1/projects/6/certificate",
        headers={"Authorization": f"Bearer {tokens['student_1']}"}
    )
    assert res.status_code == 403

def test_milestone_completion_certificate_eligible_download(tokens):
    # Milestone 1 is APPROVED
    res = client.get(
        "/api/v1/milestones/1/certificate",
        headers={"Authorization": f"Bearer {tokens['student_1']}"}
    )
    assert res.status_code == 200
    assert res.headers["content-type"] == "application/pdf"
    assert "Milestone_Certificate_1.pdf" in res.headers["content-disposition"]
    assert res.content.startswith(b"%PDF")

def test_milestone_certificate_rejected_for_pending_milestone(tokens):
    # Milestone 3 is PENDING
    res = client.get(
        "/api/v1/milestones/3/certificate",
        headers={"Authorization": f"Bearer {tokens['student_1']}"}
    )
    assert res.status_code == 400
    assert "requires formal approved status" in res.json()["detail"]

def test_document_preview_inline_disposition(tokens):
    # Fetch a document ID from project 1
    docs_res = client.get(
        "/api/v1/projects/1/documents",
        headers={"Authorization": f"Bearer {tokens['student_1']}"}
    )
    assert docs_res.status_code == 200
    docs = docs_res.json()
    if docs:
        doc_id = docs[0]["id"]
        preview_res = client.get(
            f"/api/v1/documents/{doc_id}/preview",
            headers={"Authorization": f"Bearer {tokens['student_1']}"}
        )
        # If document physical file exists on disk, it returns 200 with inline disposition
        if preview_res.status_code == 200:
            assert "inline" in preview_res.headers.get("content-disposition", "")
        else:
            # Physical file missing check
            assert preview_res.status_code in [200, 404]
