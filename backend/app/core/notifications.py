from datetime import datetime, timezone, timedelta
from typing import Optional
from sqlalchemy.orm import Session
from app.models.notification import Notification, NotificationEventTypeEnum
from app.models.user import User
from app.services.email_service import EmailService

def send_notification(
    db: Session,
    recipient_id: int,
    event_type: NotificationEventTypeEnum,
    title: str,
    message: str,
    resource_type: Optional[str] = None,
    resource_id: Optional[int] = None
) -> Optional[Notification]:
    """
    Creates a persistent database-backed notification for a specific recipient.
    De-duplicates if an identical unread notification was issued in the last 60 seconds.
    Optionally dispatches an email notification if SMTP is configured.
    """
    now = datetime.now(timezone.utc)
    recent_cutoff = now - timedelta(seconds=60)
    
    # Check for recent duplicate
    dup = db.query(Notification).filter(
        Notification.recipient_id == recipient_id,
        Notification.event_type == event_type,
        Notification.resource_type == resource_type,
        Notification.resource_id == resource_id,
        Notification.is_read == False,
        Notification.created_at >= recent_cutoff
    ).first()
    
    if dup:
        return dup

    notification = Notification(
        recipient_id=recipient_id,
        event_type=event_type,
        title=title,
        message=message,
        resource_type=resource_type,
        resource_id=resource_id,
        is_read=False,
        created_at=now
    )
    db.add(notification)

    # Optional email dispatch (safe, non-blocking to DB transaction)
    try:
        recipient = db.query(User).filter_by(id=recipient_id).first()
        if recipient and recipient.email:
            EmailService.send_notification_email(
                recipient_email=recipient.email,
                recipient_name=recipient.full_name or recipient.username,
                title=title,
                message=message,
                event_type=event_type.value if hasattr(event_type, "value") else str(event_type),
                resource_type=resource_type,
                resource_id=resource_id
            )
    except Exception:
        # Non-fatal: email failure must never impede in-app notification creation
        pass

    return notification
