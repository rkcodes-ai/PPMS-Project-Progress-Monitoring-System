import io
import pytest
from fastapi.testclient import TestClient
from app.main import app

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

def test_document_upload_and_download_flow(tokens):
    # Student 1 uploads a valid document to Project 1
    file_content = b"%PDF-1.4 Mock Software Architecture Document Body"
    files = {
        "file": ("system_architecture.pdf", io.BytesIO(file_content), "application/pdf")
    }
    data = {
        "title": "System Architecture Specification",
        "document_type": "DESIGN"
    }

    upload_res = client.post(
        "/api/v1/projects/1/documents",
        data=data,
        files=files,
        headers={"Authorization": f"Bearer {tokens['student_1']}"}
    )
    assert upload_res.status_code == 201
    doc_data = upload_res.json()
    doc_id = doc_data["id"]
    assert doc_data["title"] == "System Architecture Specification"
    assert doc_data["document_type"] == "DESIGN"
    assert doc_data["file_name"] == "system_architecture.pdf"
    assert doc_data["file_size_bytes"] == len(file_content)

    # List documents
    list_res = client.get(
        "/api/v1/projects/1/documents",
        headers={"Authorization": f"Bearer {tokens['student_1']}"}
    )
    assert list_res.status_code == 200
    docs = list_res.json()
    assert any(d["id"] == doc_id for d in docs)

    # Get metadata
    meta_res = client.get(
        f"/api/v1/documents/{doc_id}",
        headers={"Authorization": f"Bearer {tokens['student_1']}"}
    )
    assert meta_res.status_code == 200
    assert meta_res.json()["id"] == doc_id

    # Download file
    dl_res = client.get(
        f"/api/v1/documents/{doc_id}/download",
        headers={"Authorization": f"Bearer {tokens['student_1']}"}
    )
    assert dl_res.status_code == 200
    assert dl_res.content == file_content

    # Authorized deletion by uploader
    del_res = client.delete(
        f"/api/v1/documents/{doc_id}",
        headers={"Authorization": f"Bearer {tokens['student_1']}"}
    )
    assert del_res.status_code == 200

    # Ensure document is gone
    check_res = client.get(
        f"/api/v1/documents/{doc_id}",
        headers={"Authorization": f"Bearer {tokens['student_1']}"}
    )
    assert check_res.status_code == 404

def test_document_upload_rejected_for_disallowed_extension(tokens):
    files = {
        "file": ("malicious_script.sh", io.BytesIO(b"#!/bin/bash\nrm -rf /"), "text/plain")
    }
    data = {
        "title": "Shell Script",
        "document_type": "OTHER"
    }

    res = client.post(
        "/api/v1/projects/1/documents",
        data=data,
        files=files,
        headers={"Authorization": f"Bearer {tokens['student_1']}"}
    )
    assert res.status_code == 400
    assert "Disallowed file extension" in res.json()["detail"]

def test_document_upload_rejected_for_oversized_file(tokens):
    # 16 MB mock payload (> 15 MB limit)
    large_payload = b"0" * (16 * 1024 * 1024)
    files = {
        "file": ("huge_dataset.zip", io.BytesIO(large_payload), "application/zip")
    }
    data = {
        "title": "Oversized Archive",
        "document_type": "OTHER"
    }

    res = client.post(
        "/api/v1/projects/1/documents",
        data=data,
        files=files,
        headers={"Authorization": f"Bearer {tokens['student_1']}"}
    )
    assert res.status_code == 400
    assert "File size exceeds maximum allowed limit" in res.json()["detail"]

def test_document_access_control_and_cross_project_isolation(tokens):
    # Upload document to Project 1 as Student 1
    files = {
        "file": ("project1_notes.docx", io.BytesIO(b"Confidential Project 1 Notes"), "application/octet-stream")
    }
    upload_res = client.post(
        "/api/v1/projects/1/documents",
        data={"title": "Team 1 Private Notes", "document_type": "OTHER"},
        files=files,
        headers={"Authorization": f"Bearer {tokens['student_1']}"}
    )
    assert upload_res.status_code == 201
    doc_id = upload_res.json()["id"]

    # Student 2 (belongs only to Project 2) cannot list Project 1 documents
    res_list = client.get(
        "/api/v1/projects/1/documents",
        headers={"Authorization": f"Bearer {tokens['student_2']}"}
    )
    assert res_list.status_code == 403

    # Student 2 cannot download Project 1 document
    res_dl = client.get(
        f"/api/v1/documents/{doc_id}/download",
        headers={"Authorization": f"Bearer {tokens['student_2']}"}
    )
    assert res_dl.status_code == 403

    # Student 2 cannot delete Project 1 document
    res_del = client.delete(
        f"/api/v1/documents/{doc_id}",
        headers={"Authorization": f"Bearer {tokens['student_2']}"}
    )
    assert res_del.status_code == 403

    # Advisor 2b (assigned to Section 2B, while Project 1 is in Section 2A) denied access
    res_adv2b = client.get(
        f"/api/v1/documents/{doc_id}",
        headers={"Authorization": f"Bearer {tokens['adv_2b']}"}
    )
    assert res_adv2b.status_code == 403

    # Advisor 2a (assigned to Section 2A) HAS access
    res_adv2a = client.get(
        f"/api/v1/documents/{doc_id}",
        headers={"Authorization": f"Bearer {tokens['adv_2a']}"}
    )
    assert res_adv2a.status_code == 200

    # HOD has department-wide access
    res_hod = client.get(
        f"/api/v1/documents/{doc_id}",
        headers={"Authorization": f"Bearer {tokens['hod']}"}
    )
    assert res_hod.status_code == 200

    # Cleanup
    client.delete(f"/api/v1/documents/{doc_id}", headers={"Authorization": f"Bearer {tokens['student_1']}"})
