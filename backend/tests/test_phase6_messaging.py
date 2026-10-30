import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models.communication import Conversation, ConversationTypeEnum, ConversationParticipant, Message

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
        "student_1_id": student1_res.json()["user"]["id"],
        "mentor_id": mentor_res.json()["user"]["id"],
    }

def test_list_project_conversations_authorized(tokens):
    # HOD can list project 1 conversations
    res_hod = client.get(
        "/api/v1/projects/1/conversations",
        headers={"Authorization": f"Bearer {tokens['hod']}"}
    )
    assert res_hod.status_code == 200
    convs_hod = res_hod.json()
    assert len(convs_hod) >= 1
    assert convs_hod[0]["project_id"] == 1

    # Assigned advisor 2a can list project 1 conversations
    res_adv = client.get(
        "/api/v1/projects/1/conversations",
        headers={"Authorization": f"Bearer {tokens['adv_2a']}"}
    )
    assert res_adv.status_code == 200

    # Assigned mentor can list project 1 conversations
    res_mentor = client.get(
        "/api/v1/projects/1/conversations",
        headers={"Authorization": f"Bearer {tokens['mentor']}"}
    )
    assert res_mentor.status_code == 200

    # Project 1 student lead can list project 1 conversations
    res_student = client.get(
        "/api/v1/projects/1/conversations",
        headers={"Authorization": f"Bearer {tokens['student_1']}"}
    )
    assert res_student.status_code == 200

def test_advisor_cross_section_discussion_denied(tokens):
    # Advisor 2b is assigned to Section 2B, not Section 2A (Project 1)
    res = client.get(
        "/api/v1/projects/1/conversations",
        headers={"Authorization": f"Bearer {tokens['adv_2b']}"}
    )
    assert res.status_code == 403
    assert "Access denied" in res.json()["detail"]

def test_student_cross_team_discussion_denied(tokens):
    # Student 2 belongs to Project 2, cannot access Project 1 conversations
    res = client.get(
        "/api/v1/projects/1/conversations",
        headers={"Authorization": f"Bearer {tokens['student_2']}"}
    )
    assert res.status_code == 403
    assert "Access denied" in res.json()["detail"]

def test_send_and_retrieve_message_with_pagination(tokens):
    # Get project 1 conversation ID
    conv_res = client.get(
        "/api/v1/projects/1/conversations",
        headers={"Authorization": f"Bearer {tokens['student_1']}"}
    )
    conv_id = conv_res.json()[0]["id"]

    # Student 1 sends message
    test_content = "Hello team, here is the updated system architecture diagram."
    send_res = client.post(
        f"/api/v1/conversations/{conv_id}/messages",
        headers={"Authorization": f"Bearer {tokens['student_1']}"},
        json={"content": test_content}
    )
    assert send_res.status_code == 201
    msg_data = send_res.json()
    assert msg_data["conversation_id"] == conv_id
    assert msg_data["content"] == test_content
    assert msg_data["sender_id"] == tokens["student_1_id"]
    assert msg_data["is_own_message"] is True

    # Mentor fetches all messages
    get_res = client.get(
        f"/api/v1/conversations/{conv_id}/messages",
        headers={"Authorization": f"Bearer {tokens['mentor']}"}
    )
    assert get_res.status_code == 200
    msgs = get_res.json()
    assert any(m["content"] == test_content for m in msgs)

    # Check pagination limit=1
    page_res = client.get(
        f"/api/v1/conversations/{conv_id}/messages?limit=1&skip=0",
        headers={"Authorization": f"Bearer {tokens['mentor']}"}
    )
    assert page_res.status_code == 200
    page_msgs = page_res.json()
    assert len(page_msgs) == 1

    # Check that for mentor, student's message has is_own_message == False
    for m in msgs:
        if m["sender_id"] == tokens["student_1_id"]:
            assert m["is_own_message"] is False

    # Clean up test message so conversation thread remains neat without duplicates
    from app.core.database import SessionLocal
    from app.models import Message
    db = SessionLocal()
    try:
        db.query(Message).filter(Message.id == msg_data["id"]).delete()
        db.commit()
    finally:
        db.close()

def test_empty_message_rejected(tokens):
    conv_res = client.get(
        "/api/v1/projects/1/conversations",
        headers={"Authorization": f"Bearer {tokens['student_1']}"}
    )
    conv_id = conv_res.json()[0]["id"]

    # Reject empty string
    res_empty = client.post(
        f"/api/v1/conversations/{conv_id}/messages",
        headers={"Authorization": f"Bearer {tokens['student_1']}"},
        json={"content": ""}
    )
    assert res_empty.status_code in [400, 422]

    # Reject whitespace only
    res_ws = client.post(
        f"/api/v1/conversations/{conv_id}/messages",
        headers={"Authorization": f"Bearer {tokens['student_1']}"},
        json={"content": "   \n\t  "}
    )
    assert res_ws.status_code in [400, 422]

def test_unauthorized_user_cannot_send_message(tokens):
    # Student 2 tries to send message to project 1 conversation
    conv_res = client.get(
        "/api/v1/projects/1/conversations",
        headers={"Authorization": f"Bearer {tokens['student_1']}"}
    )
    conv_id = conv_res.json()[0]["id"]

    res = client.post(
        f"/api/v1/conversations/{conv_id}/messages",
        headers={"Authorization": f"Bearer {tokens['student_2']}"},
        json={"content": "Malicious cross-project message injection"}
    )
    assert res.status_code == 403

def test_invalid_conversation_id_returns_404(tokens):
    res = client.get(
        "/api/v1/conversations/99999/messages",
        headers={"Authorization": f"Bearer {tokens['hod']}"}
    )
    assert res.status_code == 404

def test_mark_conversation_as_read_and_unread_count(tokens):
    conv_res = client.get(
        "/api/v1/projects/1/conversations",
        headers={"Authorization": f"Bearer {tokens['student_1']}"}
    )
    conv_id = conv_res.json()[0]["id"]

    # Mark as read
    read_res = client.post(
        f"/api/v1/conversations/{conv_id}/read",
        headers={"Authorization": f"Bearer {tokens['student_1']}"}
    )
    assert read_res.status_code == 200
    assert read_res.json()["unread_count"] == 0

    # Check unread count endpoint
    unread_res = client.get(
        f"/api/v1/conversations/{conv_id}/unread-count",
        headers={"Authorization": f"Bearer {tokens['student_1']}"}
    )
    assert unread_res.status_code == 200
    assert unread_res.json()["unread_count"] == 0

def test_hod_cannot_access_private_direct_message(tokens):
    # Create a private direct message between Student 1 and Mentor
    db = SessionLocal()
    dm_conv = Conversation(
        title="Private Peer Consultation",
        conversation_type=ConversationTypeEnum.DIRECT_MESSAGE,
        project_id=None
    )
    db.add(dm_conv)
    db.flush()

    db.add(ConversationParticipant(
        conversation_id=dm_conv.id,
        user_id=tokens["student_1_id"]
    ))
    db.add(ConversationParticipant(
        conversation_id=dm_conv.id,
        user_id=tokens["mentor_id"]
    ))
    db.commit()
    dm_id = dm_conv.id
    db.close()

    # Participant (Student 1) can access
    res_student = client.get(
        f"/api/v1/conversations/{dm_id}/messages",
        headers={"Authorization": f"Bearer {tokens['student_1']}"}
    )
    assert res_student.status_code == 200

    # HOD is NOT a participant, so HOD must be denied access (403)
    res_hod = client.get(
        f"/api/v1/conversations/{dm_id}/messages",
        headers={"Authorization": f"Bearer {tokens['hod']}"}
    )
    assert res_hod.status_code == 403
