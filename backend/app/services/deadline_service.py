from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, List
import logging
from sqlalchemy.orm import Session

from app.models.task import Task, TaskStatusEnum
from app.models.milestone import Milestone, MilestoneStatusEnum
from app.models.project import Project
from app.models.notification import Notification, NotificationEventTypeEnum

logger = logging.getLogger(__name__)

def ensure_utc(dt: Optional[datetime]) -> Optional[datetime]:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)

def is_duplicate_reminder(
    db: Session,
    recipient_id: int,
    event_type: NotificationEventTypeEnum,
    resource_type: str,
    resource_id: int,
    window_start: datetime,
    window_end: datetime
) -> bool:
    """
    Checks if a matching reminder was already issued within the deduplication window (last 24 hours)
    or is currently pending unread in the user's notification inbox.
    """
    existing = db.query(Notification).filter(
        Notification.recipient_id == recipient_id,
        Notification.event_type == event_type,
        Notification.resource_type == resource_type,
        Notification.resource_id == resource_id
    ).filter(
        (Notification.created_at >= window_start) | (Notification.is_read == False)
    ).first()
    return existing is not None

def scan_deadline_reminders(
    db: Session,
    reference_time: Optional[datetime] = None
) -> Dict[str, Any]:
    """
    Idempotent deadline scanner:
    - Scans tasks & milestones due within next 3 days (or overdue).
    - Excludes completed tasks and approved/completed milestones.
    - Dispatches notifications to assigned students, team leads, and faculty mentors.
    - Prevents duplicate reminders within a 24-hour reminder window.
    """
    ref_time = ensure_utc(reference_time) if reference_time else datetime.now(timezone.utc)
    upcoming_limit = ref_time + timedelta(days=3)
    dedup_window_start = ref_time - timedelta(hours=24)

    tasks_scanned = 0
    milestones_scanned = 0
    notifications_created = 0
    duplicates_skipped = 0
    created_records: List[Dict[str, Any]] = []

    # 1. SCAN TASKS
    all_tasks = db.query(Task).join(Project).filter(
        Task.status != TaskStatusEnum.COMPLETED,
        Task.due_date.isnot(None)
    ).all()

    for task in all_tasks:
        tasks_scanned += 1
        due_utc = ensure_utc(task.due_date)
        if not due_utc:
            continue

        is_overdue = due_utc < ref_time
        is_upcoming = (ref_time <= due_utc <= upcoming_limit)

        if not (is_overdue or is_upcoming):
            continue

        project = task.project
        if not project:
            continue

        event_type = NotificationEventTypeEnum.OVERDUE_TASK if is_overdue else NotificationEventTypeEnum.UPCOMING_DEADLINE

        if is_overdue:
            overdue_days = max(1, (ref_time - due_utc).days)
            title = f"OVERDUE TASK: {task.title}"
            message = (
                f"Task '{task.title}' in project {project.code} was due on "
                f"{due_utc.strftime('%Y-%m-%d')} ({overdue_days} days overdue). "
                f"Immediate review or submission required."
            )
        else:
            days_left = max(0, (due_utc - ref_time).days)
            hours_left = max(1, int((due_utc - ref_time).total_seconds() // 3600))
            time_str = f"{days_left} days" if days_left > 0 else f"{hours_left} hours"
            title = f"Upcoming Deadline: {task.title}"
            message = (
                f"Task '{task.title}' in project {project.code} is scheduled for completion "
                f"on {due_utc.strftime('%Y-%m-%d')} (~{time_str} remaining)."
            )

        # Target recipients: assignee, team lead, mentor
        recipient_ids = set()
        if task.assignee_id:
            recipient_ids.add(task.assignee_id)
        if project.team_lead_id:
            recipient_ids.add(project.team_lead_id)
        if project.mentor_id:
            recipient_ids.add(project.mentor_id)

        for r_id in recipient_ids:
            if is_duplicate_reminder(
                db=db,
                recipient_id=r_id,
                event_type=event_type,
                resource_type="task",
                resource_id=task.id,
                window_start=dedup_window_start,
                window_end=ref_time
            ):
                duplicates_skipped += 1
                continue

            notif = Notification(
                recipient_id=r_id,
                event_type=event_type,
                title=title,
                message=message,
                resource_type="task",
                resource_id=task.id,
                is_read=False,
                created_at=ref_time
            )
            db.add(notif)
            notifications_created += 1
            created_records.append({
                "recipient_id": r_id,
                "event_type": event_type.value,
                "resource_type": "task",
                "resource_id": task.id,
                "title": title
            })

    # 2. SCAN MILESTONES
    all_milestones = db.query(Milestone).join(Project).filter(
        ~Milestone.status.in_([MilestoneStatusEnum.APPROVED, MilestoneStatusEnum.COMPLETED]),
        Milestone.planned_due_date.isnot(None)
    ).all()

    for ms in all_milestones:
        milestones_scanned += 1
        ms_due_utc = ensure_utc(ms.planned_due_date)
        if not ms_due_utc:
            continue

        is_overdue = ms_due_utc < ref_time
        is_upcoming = (ref_time <= ms_due_utc <= upcoming_limit)

        if not (is_overdue or is_upcoming):
            continue

        project = ms.project
        if not project:
            continue

        event_type = NotificationEventTypeEnum.OVERDUE_TASK if is_overdue else NotificationEventTypeEnum.UPCOMING_DEADLINE

        if is_overdue:
            overdue_days = max(1, (ref_time - ms_due_utc).days)
            title = f"OVERDUE MILESTONE: {ms.title}"
            message = (
                f"Formal milestone '{ms.title}' for project {project.code} was due on "
                f"{ms_due_utc.strftime('%Y-%m-%d')} ({overdue_days} days overdue). "
                f"Stage gate evaluation pending."
            )
        else:
            days_left = max(0, (ms_due_utc - ref_time).days)
            title = f"Upcoming Milestone Gate: {ms.title}"
            message = (
                f"Milestone '{ms.title}' for project {project.code} is scheduled for "
                f"{ms_due_utc.strftime('%Y-%m-%d')} (~{days_left} days remaining)."
            )

        # Recipients: team lead, all project members, mentor
        recipient_ids = set()
        if project.team_lead_id:
            recipient_ids.add(project.team_lead_id)
        if project.mentor_id:
            recipient_ids.add(project.mentor_id)
        for member in project.members:
            recipient_ids.add(member.user_id)

        for r_id in recipient_ids:
            if is_duplicate_reminder(
                db=db,
                recipient_id=r_id,
                event_type=event_type,
                resource_type="milestone",
                resource_id=ms.id,
                window_start=dedup_window_start,
                window_end=ref_time
            ):
                duplicates_skipped += 1
                continue

            notif = Notification(
                recipient_id=r_id,
                event_type=event_type,
                title=title,
                message=message,
                resource_type="milestone",
                resource_id=ms.id,
                is_read=False,
                created_at=ref_time
            )
            db.add(notif)
            notifications_created += 1
            created_records.append({
                "recipient_id": r_id,
                "event_type": event_type.value,
                "resource_type": "milestone",
                "resource_id": ms.id,
                "title": title
            })

    db.commit()

    logger.info(
        f"Deadline reminder scan finished. Ref: {ref_time.isoformat()} | "
        f"Tasks: {tasks_scanned}, Milestones: {milestones_scanned} | "
        f"Created: {notifications_created}, Skipped Duplicates: {duplicates_skipped}"
    )

    return {
        "status": "success",
        "reference_time": ref_time.isoformat(),
        "tasks_scanned": tasks_scanned,
        "milestones_scanned": milestones_scanned,
        "notifications_created": notifications_created,
        "duplicates_skipped": duplicates_skipped,
        "sample_notifications": created_records[:10]
    }
