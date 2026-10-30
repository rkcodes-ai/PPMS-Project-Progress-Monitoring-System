import pytest
from pathlib import Path
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings
from app.core.database import SessionLocal
from app.models.user import User
from app.core.security import verify_password
from app.services.email_service import EmailService
from scripts.db_backup_restore import backup_database, verify_sqlite_integrity, compute_sha256
from scripts.cleanup_orphans import find_orphaned_files

client = TestClient(app)

@pytest.fixture
def test_tokens():
    res = client.post("/api/v1/auth/login", json={"username_or_email": "student_lead_1", "password": "StudentPass@2026"})
    return {
        "student_token": res.json()["access_token"],
        "student_user_id": res.json()["user"]["id"]
    }

def test_system_status_endpoint():
    """Verify system status reports zero-cost compliance, 13 sections, and 325 projects."""
    res = client.get("/api/v1/system/status")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "operational"
    assert data["zero_cost_policy"]["compliant"] is True
    assert data["zero_cost_policy"]["mandatory_cost"] == "₹0.00"
    assert data["database"]["engine"] == "SQLite"
    assert data["database"]["sections_count"] == 13
    assert data["database"]["projects_count"] == 325
    assert data["email_service"]["zero_cost_compliant"] is True

def test_password_change_success_and_revert(test_tokens):
    """Verify successful password change, login verification, and reversion."""
    token = test_tokens["student_token"]

    # 1. Change password to new password
    change_res = client.post(
        "/api/v1/auth/change-password",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "current_password": "StudentPass@2026",
            "new_password": "NewStudentPass@2026",
            "confirm_new_password": "NewStudentPass@2026"
        }
    )
    assert change_res.status_code == 200
    assert "Password updated successfully" in change_res.json()["message"]

    # 2. Verify new password can authenticate
    new_login_res = client.post(
        "/api/v1/auth/login",
        json={"username_or_email": "student_lead_1", "password": "NewStudentPass@2026"}
    )
    assert new_login_res.status_code == 200
    new_token = new_login_res.json()["access_token"]

    # 3. Revert password back to original for test repeatability
    revert_res = client.post(
        "/api/v1/auth/change-password",
        headers={"Authorization": f"Bearer {new_token}"},
        json={
            "current_password": "NewStudentPass@2026",
            "new_password": "StudentPass@2026",
            "confirm_new_password": "StudentPass@2026"
        }
    )
    assert revert_res.status_code == 200

def test_password_change_invalid_current_password(test_tokens):
    """Verify rejection when current password is wrong."""
    token = test_tokens["student_token"]
    res = client.post(
        "/api/v1/auth/change-password",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "current_password": "WrongPassword@2026",
            "new_password": "ValidNewPassword@2026",
            "confirm_new_password": "ValidNewPassword@2026"
        }
    )
    assert res.status_code == 400
    assert "Current password verification failed" in res.json()["detail"]

def test_password_change_validation_rules(test_tokens):
    """Verify minimum length, password confirmation match, and same-password rejection."""
    token = test_tokens["student_token"]

    # Less than 8 characters
    short_res = client.post(
        "/api/v1/auth/change-password",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "current_password": "StudentPass@2026",
            "new_password": "short",
            "confirm_new_password": "short"
        }
    )
    assert short_res.status_code == 400
    assert "at least 8 characters" in short_res.json()["detail"]

    # Confirmation mismatch
    mismatch_res = client.post(
        "/api/v1/auth/change-password",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "current_password": "StudentPass@2026",
            "new_password": "ValidPassword@2026",
            "confirm_new_password": "DifferentPassword@2026"
        }
    )
    assert mismatch_res.status_code == 400
    assert "do not match" in mismatch_res.json()["detail"]

    # Identical to current
    identical_res = client.post(
        "/api/v1/auth/change-password",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "current_password": "StudentPass@2026",
            "new_password": "StudentPass@2026",
            "confirm_new_password": "StudentPass@2026"
        }
    )
    assert identical_res.status_code == 400
    assert "cannot be identical" in identical_res.json()["detail"]

def test_email_service_zero_cost_fallback():
    """Verify email service operates safely without throwing when unconfigured."""
    status_info = EmailService.get_status()
    assert status_info["zero_cost_compliant"] is True

    # Send email in disabled mode
    result = EmailService.send_email(
        to_email="test.student@college.edu",
        subject="Test Academic Notice",
        body_text="Test message body"
    )
    assert result["delivered"] is False
    assert result["status"] == "skipped"
    assert "SMTP is disabled or not configured" in result["reason"]

    # Notification email in disabled mode
    notif_result = EmailService.send_notification_email(
        recipient_email="test.student@college.edu",
        recipient_name="Test Student",
        title="Milestone Notice",
        message="Milestone due soon",
        event_type="UPCOMING_DEADLINE"
    )
    assert notif_result["delivered"] is False
    assert notif_result["status"] == "skipped"

def test_database_backup_creation_and_integrity():
    """Verify online backup generation and cryptographic verification."""
    backend_dir = Path(__file__).resolve().parent.parent
    db_path = backend_dir / "ppms.db"
    backup_dir = backend_dir / "backups"

    backup_file = backup_database(db_path, backup_dir)
    try:
        assert backup_file.exists()
        assert backup_file.stat().st_size > 100_000
        assert verify_sqlite_integrity(backup_file) is True

        # Check sha256 companion
        sha_file = backup_file.with_suffix(".sha256")
        assert sha_file.exists()
        recorded_sha = sha_file.read_text().split()[0].strip()
        computed_sha = compute_sha256(backup_file)
        assert recorded_sha == computed_sha
    finally:
        # Cleanup test backup files
        backup_file.unlink(missing_ok=True)
        backup_file.with_suffix(".sha256").unlink(missing_ok=True)

def test_orphaned_file_cleanup_detector(tmp_path):
    """Verify orphaned file detection when an unlinked file exists in uploads."""
    backend_dir = Path(__file__).resolve().parent.parent
    db_path = backend_dir / "ppms.db"

    # Create dummy upload directory with an orphaned file
    dummy_uploads = tmp_path / "uploads"
    dummy_uploads.mkdir()
    dummy_orphan = dummy_uploads / "abandoned_file_123.pdf"
    dummy_orphan.write_text("dummy orphaned content")

    orphans = find_orphaned_files(db_path, dummy_uploads)
    assert len(orphans) == 1
    assert orphans[0].name == "abandoned_file_123.pdf"
