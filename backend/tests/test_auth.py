import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_login_hod_success():
    response = client.post("/api/v1/auth/login", json={
        "username_or_email": "hod.cse@college.edu",
        "password": "HodPass@2026"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "hod.cse@college.edu"
    assert data["user"]["active_role"] == "HOD"
    assert "HOD" in data["user"]["available_roles"]

def test_login_advisor_success():
    response = client.post("/api/v1/auth/login", json={
        "username_or_email": "advisor.2a@college.edu",
        "password": "AdvisorPass@2026"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["active_role"] == "ADVISOR"

def test_login_mentor_success():
    response = client.post("/api/v1/auth/login", json={
        "username_or_email": "mentor.sharma@college.edu",
        "password": "MentorPass@2026"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["active_role"] == "MENTOR"

def test_login_student_success():
    response = client.post("/api/v1/auth/login", json={
        "username_or_email": "student_lead_1",
        "password": "StudentPass@2026"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["active_role"] == "STUDENT"

def test_login_invalid_password():
    response = client.post("/api/v1/auth/login", json={
        "username_or_email": "hod.cse@college.edu",
        "password": "WrongPassword!"
    })
    assert response.status_code == 401
    assert "Incorrect username/email or password" in response.json()["detail"]

def test_login_unknown_user():
    response = client.post("/api/v1/auth/login", json={
        "username_or_email": "nonexistent@college.edu",
        "password": "SomePassword"
    })
    assert response.status_code == 401

def test_get_me_authenticated():
    # Login as HOD
    login_res = client.post("/api/v1/auth/login", json={
        "username_or_email": "hod.cse@college.edu",
        "password": "HodPass@2026"
    })
    token = login_res.json()["access_token"]

    response = client.get("/api/v1/auth/me", headers={
        "Authorization": f"Bearer {token}"
    })
    assert response.status_code == 200
    user_data = response.json()
    assert user_data["username"] == "hod_cse"
    assert user_data["active_role"] == "HOD"

def test_get_me_unauthenticated():
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401

def test_role_switch_allowed_for_multi_role_user():
    # adv_3a has both ADVISOR and MENTOR roles
    login_res = client.post("/api/v1/auth/login", json={
        "username_or_email": "advisor.3a@college.edu",
        "password": "AdvisorPass@2026"
    })
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    assert login_res.json()["user"]["active_role"] == "ADVISOR"
    assert "MENTOR" in login_res.json()["user"]["available_roles"]

    # Switch to MENTOR
    switch_res = client.post("/api/v1/auth/switch-role", json={
        "target_role": "MENTOR"
    }, headers={"Authorization": f"Bearer {token}"})

    assert switch_res.status_code == 200
    new_data = switch_res.json()
    assert new_data["user"]["active_role"] == "MENTOR"
    new_token = new_data["access_token"]

    # Verify /me with new token shows MENTOR
    me_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {new_token}"})
    assert me_res.status_code == 200
    assert me_res.json()["active_role"] == "MENTOR"

def test_negative_role_switch_denied():
    # Student attempting to switch to HOD
    login_res = client.post("/api/v1/auth/login", json={
        "username_or_email": "student_lead_1",
        "password": "StudentPass@2026"
    })
    token = login_res.json()["access_token"]

    switch_res = client.post("/api/v1/auth/switch-role", json={
        "target_role": "HOD"
    }, headers={"Authorization": f"Bearer {token}"})

    assert switch_res.status_code == 403
    assert "Cannot switch to role 'HOD'" in switch_res.json()["detail"]
