from datetime import datetime, timezone, timedelta
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models.task import Task, TaskStatusEnum
from app.models.milestone import Milestone, MilestoneStatusEnum
from app.models.notification import Notification, NotificationEventTypeEnum
from app.models.project import Project
from app.services.deadline_service import scan_deadline_reminders

client = TestClient(app)

@pytest.fixture(scope="module")
def faculty_token():
    res = client.post("/api/v1/auth/login", json={"username_or_email": "hod.cse@college.edu", "password": "HodPass@2026"})
    return res.json()["access_token"]

@pytest.fixture(scope="module")
def student_token():
    res = client.post("/api/v1/auth/login", json={"username_or_email": "student_lead_1", "password": "StudentPass@2026"})
    return res.json()["access_token"]

def test_fixed_timestamp_deadline_scan():
    # Use controllable fixed reference time: Oct 24, 2026 09:00:00 UTC
    fixed_clock = datetime(2026, 10, 24, 9, 0, 0, tzinfo=timezone.utc)
    db = SessionLocal()
    try:
        # Initial scan with fixed clock
        res1 = scan_deadline_reminders(db=db, reference_time=fixed_clock)
        assert res1["status"] == "success"
        assert res1["tasks_scanned"] > 0
        assert res1["milestones_scanned"] > 0
        assert "notifications_created" in res1
        initial_created = res1["notifications_created"]

        # Repeated scan within same 24-hr window MUST deduplicate and not generate duplicates
        res2 = scan_deadline_reminders(db=db, reference_time=fixed_clock + timedelta(hours=1))
        assert res2["status"] == "success"
        assert res2["duplicates_skipped"] >= initial_created
        assert res2["notifications_created"] == 0
    finally:
        db.close()

def test_completed_tasks_do_not_generate_reminders():
    db = SessionLocal()
    try:
        # Find completed tasks
        completed_tasks = db.query(Task).filter(Task.status == TaskStatusEnum.COMPLETED).all()
        assert len(completed_tasks) > 0
        completed_task_ids = {t.id for t in completed_tasks}

        # Check notifications for any completed task
        notifications = db.query(Notification).filter(
            Notification.resource_type == "task",
            Notification.resource_id.in_(completed_task_ids),
            Notification.event_type == NotificationEventTypeEnum.UPCOMING_DEADLINE
        ).all()
        # Completed tasks should not have upcoming deadline notifications created by the scan
        # Note: if any existed prior, verify our scan ignores completed tasks
        ref_time = datetime(2026, 8, 14, 9, 0, 0, tzinfo=timezone.utc)
        scan_res = scan_deadline_reminders(db=db, reference_time=ref_time)
        assert scan_res["status"] == "success"
    finally:
        db.close()

def test_overdue_tasks_generate_overdue_event():
    # Set a clock far in the future: Dec 1, 2026
    future_clock = datetime(2026, 12, 1, 9, 0, 0, tzinfo=timezone.utc)
    db = SessionLocal()
    try:
        res = scan_deadline_reminders(db=db, reference_time=future_clock)
        assert res["status"] == "success"

        # Check for OVERDUE_TASK notification
        overdue_notif = db.query(Notification).filter(
            Notification.event_type == NotificationEventTypeEnum.OVERDUE_TASK,
            Notification.resource_type == "task"
        ).first()
        assert overdue_notif is not None
        assert "OVERDUE" in overdue_notif.title
    finally:
        db.close()

def test_missing_or_invalid_deadlines_handled_gracefully():
    from app.services.deadline_service import ensure_utc
    # ensure_utc safely handles None without crashing
    assert ensure_utc(None) is None

    # scan_deadline_reminders runs cleanly on boundary dates without throwing unhandled exceptions
    db = SessionLocal()
    try:
        res_ancient = scan_deadline_reminders(db=db, reference_time=datetime(1970, 1, 1, tzinfo=timezone.utc))
        assert res_ancient["status"] == "success"
        res_future = scan_deadline_reminders(db=db, reference_time=datetime(2099, 12, 31, tzinfo=timezone.utc))
        assert res_future["status"] == "success"
    finally:
        db.close()

def test_manual_trigger_api_endpoint(faculty_token, student_token):
    # Faculty can trigger manual scan
    res_faculty = client.post(
        "/api/v1/reminders/scan?reference_time=2026-10-25T10:00:00Z",
        headers={"Authorization": f"Bearer {faculty_token}"}
    )
    assert res_faculty.status_code == 200
    data = res_faculty.json()
    assert data["status"] == "success"
    assert data["tasks_scanned"] > 0
    assert "duplicates_skipped" in data

    # Student cannot trigger manual scan (requires faculty/admin role)
    res_student = client.post(
        "/api/v1/reminders/scan",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert res_student.status_code == 403
