from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user_and_token
from app.models.user import User
from app.models.notification import Notification
from app.schemas.notification import (
    NotificationResponse,
    NotificationUnreadCountResponse,
    NotificationMarkAllResponse
)

router = APIRouter()

@router.get("/notifications", response_model=List[NotificationResponse])
def list_user_notifications(
    unread_only: bool = Query(False, description="Filter for unread notifications only"),
    limit: int = Query(50, ge=1, le=100),
    skip: int = Query(0, ge=0),
    user_and_token: tuple[User, dict] = Depends(get_current_user_and_token),
    db: Session = Depends(get_db)
):
    user, _ = user_and_token

    # Strictly restricted to authenticated recipient
    query = db.query(Notification).filter(Notification.recipient_id == user.id)
    if unread_only:
        query = query.filter(Notification.is_read == False)

    notifications = query.order_by(Notification.id.desc()).offset(skip).limit(limit).all()
    return notifications

@router.get("/notifications/unread-count", response_model=NotificationUnreadCountResponse)
def get_unread_notification_count(
    user_and_token: tuple[User, dict] = Depends(get_current_user_and_token),
    db: Session = Depends(get_db)
):
    user, _ = user_and_token
    count = db.query(Notification).filter(
        Notification.recipient_id == user.id,
        Notification.is_read == False
    ).count()

    return NotificationUnreadCountResponse(unread_count=count)

@router.patch("/notifications/{notification_id}/read", response_model=NotificationResponse)
def mark_notification_as_read(
    notification_id: int,
    user_and_token: tuple[User, dict] = Depends(get_current_user_and_token),
    db: Session = Depends(get_db)
):
    user, _ = user_and_token

    # Ensure recipient ownership; return 404 to prevent guessing ID attacks
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.recipient_id == user.id
    ).first()

    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Notification with ID {notification_id} not found."
        )

    notification.is_read = True
    db.commit()
    db.refresh(notification)

    return notification

@router.post("/notifications/mark-all-read", response_model=NotificationMarkAllResponse)
def mark_all_notifications_as_read(
    user_and_token: tuple[User, dict] = Depends(get_current_user_and_token),
    db: Session = Depends(get_db)
):
    user, _ = user_and_token

    updated_count = db.query(Notification).filter(
        Notification.recipient_id == user.id,
        Notification.is_read == False
    ).update({"is_read": True}, synchronize_session=False)

    db.commit()

    return NotificationMarkAllResponse(
        detail="All notifications marked as read.",
        marked_count=updated_count
    )
