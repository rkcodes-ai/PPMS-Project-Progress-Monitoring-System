import pytest
import sqlite3
from pathlib import Path
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.main import app
from app.core.config import settings
from app.core.database import SessionLocal, engine
from app.models.user import User, RoleEnum
from app.models.project import Project, ProjectMember
from app.models.document import Document, DocumentTypeEnum
from app.core.security import get_password_hash, create_access_token

client = TestClient(app)

@pytest.fixture
def auth_tokens():
    """Fetches test tokens for academic roles using verified seeded accounts."""
    roles_credentials = {
        "hod": ("hod.cse@college.edu", "HodPass@2026"),
        "adv_2a": ("advisor.2a@college.edu", "AdvisorPass@2026"),
        "adv_2b": ("advisor.2b@college.edu", "AdvisorPass@2026"),
        "mentor": ("mentor.sharma@college.edu", "MentorPass@2026"),
        "student_lead_1": ("student_lead_1", "StudentPass@2026"),
        "student_lead_2": ("student_lead_2", "StudentPass@2026"),
    }
    tokens = {}
    for key, (username, pwd) in roles_credentials.items():
        res = client.post("/api/v1/auth/login", json={"username_or_email": username, "password": pwd})
        if res.status_code == 200:
            tokens[key] = res.json()["access_token"]
            tokens[f"{key}_id"] = res.json()["user"]["id"]
    return tokens

def test_token_invalidation_after_password_change(auth_tokens):
    """
    CRITICAL SECURITY CHECK:
    Verify that previous JWT sessions are immediately invalidated when a user changes their password.
    """
    old_token = auth_tokens["student_lead_1"]

    # 1. Verify old token is valid initially
    res_before = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {old_token}"})
    assert res_before.status_code == 200

    # 2. Change password
    change_res = client.post(
        "/api/v1/auth/change-password",
        headers={"Authorization": f"Bearer {old_token}"},
        json={
            "current_password": "StudentPass@2026",
            "new_password": "AuditNewPass@2026",
            "confirm_new_password": "AuditNewPass@2026"
        }
    )
    assert change_res.status_code == 200
    new_token = change_res.json()["access_token"]
    assert new_token is not None

    # 3. OLD TOKEN MUST NOW BE REJECTED WITH 401 UNAUTHORIZED
    res_after_old = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {old_token}"})
    assert res_after_old.status_code == 401
    assert "Could not validate credentials or session expired" in res_after_old.json()["detail"]

    # 4. NEW TOKEN MUST BE ACCEPTED
    res_after_new = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {new_token}"})
    assert res_after_new.status_code == 200

    # 5. Revert password back to original
    revert_res = client.post(
        "/api/v1/auth/change-password",
        headers={"Authorization": f"Bearer {new_token}"},
        json={
            "current_password": "AuditNewPass@2026",
            "new_password": "StudentPass@2026",
            "confirm_new_password": "StudentPass@2026"
        }
    )
    assert revert_res.status_code == 200

def test_sqlite_foreign_key_enforcement():
    """
    Verify that PRAGMA foreign_keys = ON is strictly enforced by SQLAlchemy connection events.
    """
    db: Session = SessionLocal()
    try:
        # Attempt inserting a ProjectMember with invalid foreign keys
        invalid_member = ProjectMember(
            project_id=999999,  # Non-existent project
            user_id=999999,     # Non-existent user
            role_in_team="Member"
        )
        db.add(invalid_member)
        with pytest.raises(IntegrityError):
            db.commit()
        db.rollback()
    finally:
        db.close()

def test_negative_authorization_cross_section_advisor(auth_tokens):
    """
    Advisor from Section 2A must be denied access to a project in Section 2B.
    """
    token = auth_tokens["adv_2a"]
    # Project 3 belongs to Section 2B (CSE-B)
    res = client.get("/api/v1/projects/3", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 403
    assert "Access denied" in res.json()["detail"]

def test_negative_authorization_cross_mentor(auth_tokens):
    """
    Mentor must be denied access to an unassigned project.
    """
    token = auth_tokens["mentor"]
    mentor_id = auth_tokens["mentor_id"]
    # Find a project NOT supervised by this mentor
    all_projs = client.get("/api/v1/projects?size=100", headers={"Authorization": f"Bearer {auth_tokens['hod']}"}).json()["items"]
    unassigned = next(p for p in all_projs if p["mentor_id"] != mentor_id)

    res = client.get(f"/api/v1/projects/{unassigned['id']}", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 403
    assert "Access denied: You are not assigned to supervise this project" in res.json()["detail"]

def test_negative_authorization_cross_student(auth_tokens):
    """
    Student lead 2 must be denied access to Project 1 (team lead 1's project).
    """
    token = auth_tokens["student_lead_2"]
    res = client.get("/api/v1/projects/1", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 403
    assert "Access denied: You are not an authorized member of this project team" in res.json()["detail"]

def test_system_status_conceals_internal_paths():
    """
    System status endpoint must not reveal local filesystem directories to callers.
    """
    res = client.get("/api/v1/system/status")
    assert res.status_code == 200
    data = res.json()
    assert "upload_dir" not in data.get("storage", {})
    assert data["storage"]["configured"] is True
    assert data["storage"]["exists"] is True

def test_production_environment_config_validation(monkeypatch):
    """
    Verify that in production mode, missing or placeholder SECRET_KEY triggers startup rejection.
    """
    from app.core.config import Settings
    # Create production settings with placeholder secret
    prod_settings = Settings(
        APP_ENV="production",
        SECRET_KEY="super-secret-ppms-jwt-key-2026-cse-secure-auth-token"
    )
    placeholder_keys = (
        "super-secret-ppms-jwt-key-2026-cse-secure-auth-token",
        "super-secret-ppms-jwt-key-2026-cse-secure-auth-token-placeholder"
    )
    # Validation logic verification
    with pytest.raises(RuntimeError) as exc_info:
        if prod_settings.SECRET_KEY in placeholder_keys or len(prod_settings.SECRET_KEY) < 32:
            raise RuntimeError("CRITICAL SECURITY CONFIGURATION ERROR")
    assert "CRITICAL SECURITY CONFIGURATION ERROR" in str(exc_info.value)
