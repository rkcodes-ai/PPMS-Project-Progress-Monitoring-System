from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.api.deps import (
    get_current_user_and_token,
    check_project_access,
    check_conversation_access
)
from app.core.notifications import send_notification
from app.models.user import User, RoleEnum
from app.models.project import Project, ProjectMember
from app.models.communication import (
    Conversation, ConversationTypeEnum, ConversationParticipant, Message
)
from app.models.notification import NotificationEventTypeEnum
from app.schemas.communication import (
    ConversationResponse,
    ConversationCreate,
    MessageResponse,
    MessageCreate,
    MarkReadResponse,
    ConversationUnreadResponse
)

router = APIRouter()

def get_user_primary_role(user: User) -> str:
    if user.user_roles:
        return user.user_roles[0].role.name.value
    return "Member"

def format_message_response(msg: Message, current_user_id: int) -> MessageResponse:
    sender_name = msg.sender.full_name if msg.sender else "Academic User"
    sender_role = get_user_primary_role(msg.sender) if msg.sender else "Member"
    return MessageResponse(
        id=msg.id,
        conversation_id=msg.conversation_id,
        sender_id=msg.sender_id,
        sender_name=sender_name,
        sender_role=sender_role,
        content=msg.content,
        related_task_id=msg.related_task_id,
        related_milestone_id=msg.related_milestone_id,
        related_report_id=msg.related_report_id,
        created_at=msg.created_at,
        is_own_message=(msg.sender_id == current_user_id)
    )

def format_conversation_response(
    conv: Conversation,
    current_user_id: int,
    db: Session
) -> ConversationResponse:
    total_messages = db.query(Message).filter(Message.conversation_id == conv.id).count()

    participant = db.query(ConversationParticipant).filter(
        ConversationParticipant.conversation_id == conv.id,
        ConversationParticipant.user_id == current_user_id
    ).first()

    last_read = participant.last_read_at if participant else datetime.min.replace(tzinfo=timezone.utc)
    
    # Unread count: messages sent after last_read by other users
    unread_query = db.query(Message).filter(
        Message.conversation_id == conv.id,
        Message.sender_id != current_user_id
    )
    if participant and participant.last_read_at:
        unread_query = unread_query.filter(Message.created_at > participant.last_read_at)
    unread_count = unread_query.count()

    last_msg = db.query(Message).filter(
        Message.conversation_id == conv.id
    ).order_by(Message.created_at.desc()).first()

    last_msg_response = format_message_response(last_msg, current_user_id) if last_msg else None

    return ConversationResponse(
        id=conv.id,
        title=conv.title or f"Discussion #{conv.id}",
        conversation_type=conv.conversation_type,
        project_id=conv.project_id,
        created_at=conv.created_at,
        updated_at=conv.updated_at,
        message_count=total_messages,
        unread_count=unread_count,
        last_message=last_msg_response
    )

@router.get("/projects/{project_id}/conversations", response_model=List[ConversationResponse])
def list_project_conversations(
    project_id: int,
    user_and_token: tuple[User, dict] = Depends(get_current_user_and_token),
    db: Session = Depends(get_db)
):
    user, payload = user_and_token
    active_role = RoleEnum(payload.get("active_role"))

    # Authorize project access
    project = check_project_access(project_id, user, active_role, db)

    conversations = db.query(Conversation).filter(
        Conversation.project_id == project.id,
        Conversation.conversation_type == ConversationTypeEnum.PROJECT_DISCUSSION
    ).order_by(Conversation.created_at.asc()).all()

    # If no conversation exists for the project yet, create the default one
    if not conversations:
        default_conv = Conversation(
            title=f"{project.code} Technical Discussion",
            conversation_type=ConversationTypeEnum.PROJECT_DISCUSSION,
            project_id=project.id,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        db.add(default_conv)
        db.flush()

        # Add initial participants
        participant_ids = {project.team_lead_id}
        if project.mentor_id:
            participant_ids.add(project.mentor_id)
        for member in project.members:
            participant_ids.add(member.user_id)
        participant_ids.add(user.id)

        for p_id in participant_ids:
            db.add(ConversationParticipant(
                conversation_id=default_conv.id,
                user_id=p_id,
                joined_at=datetime.now(timezone.utc),
                last_read_at=datetime.now(timezone.utc)
            ))
        db.commit()
        db.refresh(default_conv)
        conversations = [default_conv]

    return [format_conversation_response(c, user.id, db) for c in conversations]

@router.post("/projects/{project_id}/conversations", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
def create_project_conversation(
    project_id: int,
    body: ConversationCreate,
    user_and_token: tuple[User, dict] = Depends(get_current_user_and_token),
    db: Session = Depends(get_db)
):
    user, payload = user_and_token
    active_role = RoleEnum(payload.get("active_role"))

    project = check_project_access(project_id, user, active_role, db)

    conv_title = body.title.strip() if body.title and body.title.strip() else f"{project.code} Discussion"

    conversation = Conversation(
        title=conv_title,
        conversation_type=ConversationTypeEnum.PROJECT_DISCUSSION,
        project_id=project.id,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    db.add(conversation)
    db.flush()

    # Automatically enroll relevant members
    participant_ids = {project.team_lead_id}
    if project.mentor_id:
        participant_ids.add(project.mentor_id)
    for m in project.members:
        participant_ids.add(m.user_id)
    participant_ids.add(user.id)

    for p_id in participant_ids:
        db.add(ConversationParticipant(
            conversation_id=conversation.id,
            user_id=p_id,
            joined_at=datetime.now(timezone.utc),
            last_read_at=datetime.now(timezone.utc)
        ))

    db.commit()
    db.refresh(conversation)

    return format_conversation_response(conversation, user.id, db)

@router.get("/conversations/{conversation_id}/messages", response_model=List[MessageResponse])
def get_conversation_messages(
    conversation_id: int,
    limit: int = Query(100, ge=1, le=200),
    skip: int = Query(0, ge=0),
    auto_mark_read: bool = Query(True),
    user_and_token: tuple[User, dict] = Depends(get_current_user_and_token),
    db: Session = Depends(get_db)
):
    user, payload = user_and_token
    active_role = RoleEnum(payload.get("active_role"))

    conversation, _ = check_conversation_access(conversation_id, user, active_role, db)

    messages = db.query(Message).filter(
        Message.conversation_id == conversation.id
    ).order_by(Message.created_at.asc()).offset(skip).limit(limit).all()

    # Automatically update user's read timestamp if requested
    if auto_mark_read:
        participant = db.query(ConversationParticipant).filter(
            ConversationParticipant.conversation_id == conversation.id,
            ConversationParticipant.user_id == user.id
        ).first()

        now = datetime.now(timezone.utc)
        if participant:
            participant.last_read_at = now
        else:
            db.add(ConversationParticipant(
                conversation_id=conversation.id,
                user_id=user.id,
                joined_at=now,
                last_read_at=now
            ))
        db.commit()

    return [format_message_response(m, user.id) for m in messages]

@router.post("/conversations/{conversation_id}/messages", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
def send_message(
    conversation_id: int,
    body: MessageCreate,
    user_and_token: tuple[User, dict] = Depends(get_current_user_and_token),
    db: Session = Depends(get_db)
):
    user, payload = user_and_token
    active_role = RoleEnum(payload.get("active_role"))

    conversation, project = check_conversation_access(conversation_id, user, active_role, db)

    now = datetime.now(timezone.utc)

    # Content length & sanitization is already handled by Pydantic validator,
    # but re-verify non-empty text
    cleaned_content = body.content.strip()
    if not cleaned_content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message content cannot be blank or whitespace."
        )

    # SENDER IDENTITY IS STRICTLY DERIVED FROM AUTHENTICATED USER
    message = Message(
        conversation_id=conversation.id,
        sender_id=user.id,
        content=cleaned_content,
        related_task_id=body.related_task_id,
        related_milestone_id=body.related_milestone_id,
        related_report_id=body.related_report_id,
        created_at=now
    )
    db.add(message)

    # Update conversation updated_at
    conversation.updated_at = now

    # Ensure sender is participant and update last_read_at
    participant = db.query(ConversationParticipant).filter(
        ConversationParticipant.conversation_id == conversation.id,
        ConversationParticipant.user_id == user.id
    ).first()

    if participant:
        participant.last_read_at = now
    else:
        db.add(ConversationParticipant(
            conversation_id=conversation.id,
            user_id=user.id,
            joined_at=now,
            last_read_at=now
        ))

    # Dispatch notifications to other participants/stakeholders
    if project:
        recipient_ids = set()
        if project.team_lead_id and project.team_lead_id != user.id:
            recipient_ids.add(project.team_lead_id)
        if project.mentor_id and project.mentor_id != user.id:
            recipient_ids.add(project.mentor_id)
        for member in project.members:
            if member.user_id != user.id:
                recipient_ids.add(member.user_id)

        preview = cleaned_content if len(cleaned_content) <= 80 else f"{cleaned_content[:77]}..."
        for r_id in recipient_ids:
            send_notification(
                db=db,
                recipient_id=r_id,
                event_type=NotificationEventTypeEnum.NEW_MESSAGE,
                title=f"New Message from {user.full_name}",
                message=f"[{project.code}] {preview}",
                resource_type="conversation",
                resource_id=conversation.id
            )

    db.commit()
    db.refresh(message)

    return format_message_response(message, user.id)

@router.post("/conversations/{conversation_id}/read", response_model=MarkReadResponse)
def mark_conversation_as_read(
    conversation_id: int,
    user_and_token: tuple[User, dict] = Depends(get_current_user_and_token),
    db: Session = Depends(get_db)
):
    user, payload = user_and_token
    active_role = RoleEnum(payload.get("active_role"))

    conversation, _ = check_conversation_access(conversation_id, user, active_role, db)

    now = datetime.now(timezone.utc)
    participant = db.query(ConversationParticipant).filter(
        ConversationParticipant.conversation_id == conversation.id,
        ConversationParticipant.user_id == user.id
    ).first()

    if participant:
        participant.last_read_at = now
    else:
        db.add(ConversationParticipant(
            conversation_id=conversation.id,
            user_id=user.id,
            joined_at=now,
            last_read_at=now
        ))

    db.commit()

    return MarkReadResponse(
        conversation_id=conversation.id,
        marked_read_at=now,
        unread_count=0
    )

@router.get("/conversations/{conversation_id}/unread-count", response_model=ConversationUnreadResponse)
def get_conversation_unread_count(
    conversation_id: int,
    user_and_token: tuple[User, dict] = Depends(get_current_user_and_token),
    db: Session = Depends(get_db)
):
    user, payload = user_and_token
    active_role = RoleEnum(payload.get("active_role"))

    conversation, _ = check_conversation_access(conversation_id, user, active_role, db)

    participant = db.query(ConversationParticipant).filter(
        ConversationParticipant.conversation_id == conversation.id,
        ConversationParticipant.user_id == user.id
    ).first()

    query = db.query(Message).filter(
        Message.conversation_id == conversation.id,
        Message.sender_id != user.id
    )
    if participant and participant.last_read_at:
        query = query.filter(Message.created_at > participant.last_read_at)

    count = query.count()

    return ConversationUnreadResponse(
        conversation_id=conversation.id,
        unread_count=count
    )
