import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

@pytest.fixture(scope="module")
def tokens():
    hod_res = client.post("/api/v1/auth/login", json={"username_or_email": "hod.cse@college.edu", "password": "HodPass@2026"})
    adv2a_res = client.post("/api/v1/auth/login", json={"username_or_email": "advisor.2a@college.edu", "password": "AdvisorPass@2026"})
    mentor_res = client.post("/api/v1/auth/login", json={"username_or_email": "mentor.sharma@college.edu", "password": "MentorPass@2026"})
    student1_res = client.post("/api/v1/auth/login", json={"username_or_email": "student_lead_1", "password": "StudentPass@2026"})
    student2_res = client.post("/api/v1/auth/login", json={"username_or_email": "student_lead_2", "password": "StudentPass@2026"})

    return {
        "hod": hod_res.json()["access_token"],
        "adv_2a": adv2a_res.json()["access_token"],
        "mentor": mentor_res.json()["access_token"],
        "student_1": student1_res.json()["access_token"],
        "student_2": student2_res.json()["access_token"],
    }

def test_notification_listing_and_unread_count(tokens):
    # Student 1 fetches notifications
    res = client.get(
        "/api/v1/notifications",
        headers={"Authorization": f"Bearer {tokens['student_1']}"}
    )
    assert res.status_code == 200
    notifications = res.json()
    assert isinstance(notifications, list)

    # Fetch unread count
    count_res = client.get(
        "/api/v1/notifications/unread-count",
        headers={"Authorization": f"Bearer {tokens['student_1']}"}
    )
    assert count_res.status_code == 200
    assert "unread_count" in count_res.json()
    assert isinstance(count_res.json()["unread_count"], int)

def test_mark_single_notification_read(tokens):
    # Fetch notifications to get an ID
    res = client.get(
        "/api/v1/notifications",
        headers={"Authorization": f"Bearer {tokens['student_1']}"}
    )
    notifications = res.json()
    if notifications:
        notif_id = notifications[0]["id"]
        patch_res = client.patch(
            f"/api/v1/notifications/{notif_id}/read",
            headers={"Authorization": f"Bearer {tokens['student_1']}"}
        )
        assert patch_res.status_code == 200
        assert patch_res.json()["is_read"] is True

def test_mark_all_notifications_read(tokens):
    res = client.post(
        "/api/v1/notifications/mark-all-read",
        headers={"Authorization": f"Bearer {tokens['student_1']}"}
    )
    assert res.status_code == 200
    data = res.json()
    assert "marked_count" in data

    # Check that unread count is now 0
    count_res = client.get(
        "/api/v1/notifications/unread-count",
        headers={"Authorization": f"Bearer {tokens['student_1']}"}
    )
    assert count_res.json()["unread_count"] == 0

def test_cross_user_notification_access_denied(tokens):
    # Student 1 gets a notification ID
    res = client.get(
        "/api/v1/notifications",
        headers={"Authorization": f"Bearer {tokens['student_1']}"}
    )
    notifications = res.json()
    if notifications:
        s1_notif_id = notifications[0]["id"]

        # Student 2 attempts to mark Student 1's notification as read
        patch_res = client.patch(
            f"/api/v1/notifications/{s1_notif_id}/read",
            headers={"Authorization": f"Bearer {tokens['student_2']}"}
        )
        # 404 prevents guessing user's notifications
        assert patch_res.status_code == 404

def test_workflow_events_generate_notifications(tokens):
    # Student 1 creates and submits a task for review in Project 1
    task_res = client.post(
        "/api/v1/projects/1/tasks",
        json={
            "title": "Phase 5 Pipeline Test Task",
            "description": "Integration testing notification generation",
            "priority": "HIGH",
            "due_date": "2026-11-15T18:00:00Z",
            "estimated_effort": 3
        },
        headers={"Authorization": f"Bearer {tokens['student_1']}"}
    )
    assert task_res.status_code == 201

    task_id = task_res.json()["id"]

    # Student 1 submits task for review
    submit_res = client.post(
        f"/api/v1/tasks/{task_id}/submit-review",
        json={"submission_details": "Completed all unit and integration criteria."},
        headers={"Authorization": f"Bearer {tokens['student_1']}"}
    )
    assert submit_res.status_code == 200

    # Mentor (Prof. Sharma, who supervises Project 1) checks notifications
    mentor_notifs = client.get(
        "/api/v1/notifications",
        headers={"Authorization": f"Bearer {tokens['mentor']}"}
    )
    assert mentor_notifs.status_code == 200
    notif_list = mentor_notifs.json()
    assert any("Task Review Requested" in n["title"] or "Phase 5 Pipeline Test Task" in n["title"] or "Phase 5 Pipeline Test Task" in n["message"] for n in notif_list)

    # Clean up test task to prevent duplicate accumulation in project
    from app.core.database import SessionLocal
    from app.models import Task, Project, ProjectActivity, Notification
    from app.api.v1.tasks import sync_project_progress_and_health
    db = SessionLocal()
    try:
        db.query(Task).filter(Task.id == task_id).delete()
        db.query(Notification).filter(Notification.title.like("%Phase 5 Pipeline Test Task%") | Notification.message.like("%Phase 5 Pipeline Test Task%")).delete(synchronize_session=False)
        db.query(ProjectActivity).filter(ProjectActivity.description.like("%Phase 5 Pipeline Test Task%")).delete(synchronize_session=False)
        p1 = db.query(Project).filter(Project.id == 1).first()
        if p1:
            sync_project_progress_and_health(p1, db)
        db.commit()
    finally:
        db.close()
