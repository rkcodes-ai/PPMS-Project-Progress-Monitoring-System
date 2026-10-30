from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import (
    get_current_user_and_token,
    check_project_access,
    check_milestone_access
)
from app.models.user import User, RoleEnum
from app.models.project import ProjectStatusEnum
from app.models.milestone import MilestoneStatusEnum
from app.services.certificate_service import (
    generate_project_certificate_pdf,
    generate_milestone_certificate_pdf
)

router = APIRouter()

@router.get("/projects/{project_id}/certificate")
def download_project_certificate(
    project_id: int,
    user_and_token: tuple[User, dict] = Depends(get_current_user_and_token),
    db: Session = Depends(get_db)
):
    """
    Downloads the Project Completion Certificate in PDF format.
    Strict eligibility check: Project status must be COMPLETED.
    """
    user, payload = user_and_token
    active_role = RoleEnum(payload.get("active_role"))

    project = check_project_access(project_id, user, active_role, db)

    # STRICT ELIGIBILITY CHECK: Do not issue completion certificate merely because progress percentage is 100%
    if project.status != ProjectStatusEnum.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Project completion certificate is only issued when project status is formally 'COMPLETED'. "
                f"Current status is '{project.status.value}'."
            )
        )

    pdf_bytes = generate_project_certificate_pdf(project)
    safe_code = "".join(c for c in project.code if c.isalnum() or c in ("-", "_"))
    filename = f"Certificate_{safe_code}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "no-cache"
        }
    )

@router.get("/milestones/{milestone_id}/certificate")
def download_milestone_certificate(
    milestone_id: int,
    user_and_token: tuple[User, dict] = Depends(get_current_user_and_token),
    db: Session = Depends(get_db)
):
    """
    Downloads the Milestone Completion Certificate in PDF format.
    Strict eligibility check: Milestone status must be APPROVED or COMPLETED.
    """
    user, payload = user_and_token
    active_role = RoleEnum(payload.get("active_role"))

    milestone, project = check_milestone_access(milestone_id, user, active_role, db)

    if milestone.status not in (MilestoneStatusEnum.APPROVED, MilestoneStatusEnum.COMPLETED):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Milestone completion certificate requires formal approved status. "
                f"Current status is '{milestone.status.value}'."
            )
        )

    pdf_bytes = generate_milestone_certificate_pdf(milestone)
    filename = f"Milestone_Certificate_{milestone.id}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "no-cache"
        }
    )
