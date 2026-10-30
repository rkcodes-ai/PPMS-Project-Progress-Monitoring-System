from datetime import datetime, timezone
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.api.deps import (
    get_current_user_and_token,
    RequireRole
)
from app.models.user import User, RoleEnum
from app.services.deadline_service import scan_deadline_reminders

router = APIRouter()

class ReminderScanResponse(BaseModel):
    status: str
    reference_time: str
    tasks_scanned: int
    milestones_scanned: int
    notifications_created: int
    duplicates_skipped: int
    sample_notifications: list[Dict[str, Any]]

@router.post("/reminders/scan", response_model=ReminderScanResponse)
def trigger_deadline_reminder_scan(
    reference_time: Optional[datetime] = Query(
        None, 
        description="Optional fixed reference timestamp for deterministic testing (defaults to UTC now)"
    ),
    user_and_token: tuple[User, dict] = Depends(get_current_user_and_token),
    active_role: RoleEnum = Depends(RequireRole([RoleEnum.HOD, RoleEnum.ADVISOR, RoleEnum.MENTOR])),
    db: Session = Depends(get_db)
):
    """
    Manually triggers an idempotent deadline reminder scan.
    Accessible to authorized faculty and academic administrators.
    """
    result = scan_deadline_reminders(db=db, reference_time=reference_time)
    return result
