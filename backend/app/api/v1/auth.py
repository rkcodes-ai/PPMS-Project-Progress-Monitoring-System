from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, create_access_token, get_password_hash
from app.models.user import User, RoleEnum
from app.models.activity import AuditEvent
from app.schemas.auth import (
    LoginRequest, TokenResponse, UserProfileResponse,
    RoleSwitchRequest, RoleResponse, ChangePasswordRequest,
    ChangePasswordResponse
)
from app.api.deps import (
    get_current_user, get_current_user_and_token,
    get_current_active_role
)

router = APIRouter()

ROLE_PRIORITY = [
    RoleEnum.HOD,
    RoleEnum.ADVISOR,
    RoleEnum.MENTOR,
    RoleEnum.STUDENT
]

def build_user_profile(user: User, active_role: RoleEnum) -> UserProfileResponse:
    assigned_roles = [ur.role.name for ur in user.user_roles]
    return UserProfileResponse(
        id=user.id,
        email=user.email,
        username=user.username,
        full_name=user.full_name,
        is_active=user.is_active,
        department_id=user.department_id,
        department_code=user.department.code if user.department else None,
        section_id=user.section_id,
        section_code=user.section.code if user.section else None,
        active_role=active_role,
        available_roles=assigned_roles,
        created_at=user.created_at
    )

# Canonical aliases for streamlined login across all 3 academic years and 13 sections
DEMO_LOGIN_ALIASES = {
    # Year 2 Students (5 sections: CSE-A to CSE-E)
    "student.2a@college.edu": "student_lead_1",
    "student.2a": "student_lead_1",
    "student_2a": "student_lead_1",
    "student.2b@college.edu": "student_lead_3",
    "student.2b": "student_lead_3",
    "student_2b": "student_lead_3",
    "student.2c@college.edu": "student_lead_5",
    "student.2c": "student_lead_5",
    "student_2c": "student_lead_5",
    "student.2d@college.edu": "student_lead_7",
    "student.2d": "student_lead_7",
    "student_2d": "student_lead_7",
    "student.2e@college.edu": "student_lead_9",
    "student.2e": "student_lead_9",
    "student_2e": "student_lead_9",

    # Year 3 Students (4 sections: CSE-A to CSE-D)
    "student.3a@college.edu": "student_lead_11",
    "student.3a": "student_lead_11",
    "student_3a": "student_lead_11",
    "student.3b@college.edu": "student_lead_13",
    "student.3b": "student_lead_13",
    "student_3b": "student_lead_13",
    "student.3c@college.edu": "student_lead_15",
    "student.3c": "student_lead_15",
    "student_3c": "student_lead_15",
    "student.3d@college.edu": "student_lead_17",
    "student.3d": "student_lead_17",
    "student_3d": "student_lead_17",

    # Year 4 Students (4 sections: CSE-A to CSE-D)
    "student.4a@college.edu": "student_lead_19",
    "student.4a": "student_lead_19",
    "student_4a": "student_lead_19",
    "student.4b@college.edu": "student_lead_21",
    "student.4b": "student_lead_21",
    "student_4b": "student_lead_21",
    "student.4c@college.edu": "student_lead_23",
    "student.4c": "student_lead_23",
    "student_4c": "student_lead_23",
    "student.4d@college.edu": "student_lead_25",
    "student.4d": "student_lead_25",
    "student_4d": "student_lead_25",

    # Advisor shortcuts without domain
    "advisor.2a": "advisor.2a@college.edu",
    "advisor_2a": "advisor.2a@college.edu",
    "advisor.2b": "advisor.2b@college.edu",
    "advisor_2b": "advisor.2b@college.edu",
    "advisor.2c": "advisor.2c@college.edu",
    "advisor_2c": "advisor.2c@college.edu",
    "advisor.2d": "advisor.2d@college.edu",
    "advisor_2d": "advisor.2d@college.edu",
    "advisor.2e": "advisor.2e@college.edu",
    "advisor_2e": "advisor.2e@college.edu",
    "advisor.3a": "advisor.3a@college.edu",
    "advisor_3a": "advisor.3a@college.edu",
    "advisor.3b": "advisor.3b@college.edu",
    "advisor_3b": "advisor.3b@college.edu",
    "advisor.3c": "advisor.3c@college.edu",
    "advisor_3c": "advisor.3c@college.edu",
    "advisor.3d": "advisor.3d@college.edu",
    "advisor_3d": "advisor.3d@college.edu",
    "advisor.4a": "advisor.4a@college.edu",
    "advisor_4a": "advisor.4a@college.edu",
    "advisor.4b": "advisor.4b@college.edu",
    "advisor_4b": "advisor.4b@college.edu",
    "advisor.4c": "advisor.4c@college.edu",
    "advisor_4c": "advisor.4c@college.edu",
    "advisor.4d": "advisor.4d@college.edu",
    "advisor_4d": "advisor.4d@college.edu",
}

@router.post("/login", response_model=TokenResponse)
def login(
    req: LoginRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    raw_ident = req.username_or_email.strip()
    norm_ident = raw_ident.lower()
    resolved_ident = DEMO_LOGIN_ALIASES.get(norm_ident, raw_ident)

    # Lookup by username or email (checking both resolved and raw identifiers)
    user = db.query(User).filter(
        (User.username == resolved_ident) |
        (User.email == resolved_ident) |
        (User.username == raw_ident) |
        (User.email == raw_ident)
    ).first()

    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive. Please contact the CSE department administrator."
        )

    assigned_roles = [ur.role.name for ur in user.user_roles]
    if not assigned_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No roles assigned to this account."
        )

    # Pick highest priority role as default active role
    active_role = assigned_roles[0]
    for r in ROLE_PRIORITY:
        if r in assigned_roles:
            active_role = r
            break

    access_token = create_access_token(
        subject=user.id,
        roles=[r.value for r in assigned_roles],
        active_role=active_role.value,
        token_version=user.token_version or 1
    )

    # Record login audit event
    client_ip = request.client.host if request.client else None
    db.add(AuditEvent(
        user_id=user.id,
        action="LOGIN",
        resource_type="auth",
        resource_id=user.id,
        ip_address=client_ip,
        details=f"Successful authentication. Initial active role: {active_role.value}"
    ))
    db.commit()

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=build_user_profile(user, active_role)
    )

@router.get("/me", response_model=UserProfileResponse)
def get_current_user_profile(
    user_and_token: tuple[User, dict] = Depends(get_current_user_and_token)
):
    user, payload = user_and_token
    active_role = RoleEnum(payload.get("active_role"))
    return build_user_profile(user, active_role)

@router.get("/roles", response_model=list[RoleResponse])
def get_user_roles(
    current_user: User = Depends(get_current_user)
):
    return [ur.role for ur in current_user.user_roles]

@router.post("/switch-role", response_model=TokenResponse)
def switch_active_role(
    req: RoleSwitchRequest,
    request: Request,
    user_and_token: tuple[User, dict] = Depends(get_current_user_and_token),
    db: Session = Depends(get_db)
):
    user, _ = user_and_token
    assigned_roles = [ur.role.name for ur in user.user_roles]

    if req.target_role not in assigned_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Cannot switch to role '{req.target_role.value}'. It is not assigned to your account."
        )

    # Issue new token with updated active_role
    new_token = create_access_token(
        subject=user.id,
        roles=[r.value for r in assigned_roles],
        active_role=req.target_role.value,
        token_version=user.token_version or 1
    )

    client_ip = request.client.host if request.client else None
    db.add(AuditEvent(
        user_id=user.id,
        action="ROLE_SWITCH",
        resource_type="auth",
        resource_id=user.id,
        ip_address=client_ip,
        details=f"Switched active role to {req.target_role.value}"
    ))
    db.commit()

    return TokenResponse(
        access_token=new_token,
        token_type="bearer",
        user=build_user_profile(user, req.target_role)
    )

@router.post("/logout")
def logout(
    request: Request,
    user_and_token: tuple[User, dict] = Depends(get_current_user_and_token),
    db: Session = Depends(get_db)
):
    user, payload = user_and_token
    client_ip = request.client.host if request.client else None
    db.add(AuditEvent(
        user_id=user.id,
        action="LOGOUT",
        resource_type="auth",
        resource_id=user.id,
        ip_address=client_ip,
        details=f"User logged out from active role {payload.get('active_role')}"
    ))
    db.commit()
    return {"message": "Successfully logged out."}

@router.post("/change-password", response_model=ChangePasswordResponse)
def change_password(
    req: ChangePasswordRequest,
    request: Request,
    user_and_token: tuple[User, dict] = Depends(get_current_user_and_token),
    db: Session = Depends(get_db)
):
    """
    Securely updates the authenticated user's password.
    Requires current password verification, enforces minimum length of 8 characters,
    verifies confirmation matching, and prevents reusing the identical password.
    Immediately invalidates all prior sessions by incrementing token_version.
    """
    current_user, payload = user_and_token

    if not verify_password(req.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password verification failed."
        )

    if len(req.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 8 characters long."
        )

    if req.new_password != req.confirm_new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password and confirmation password do not match."
        )

    if verify_password(req.new_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password cannot be identical to current password."
        )

    # Update password and increment token_version to invalidate prior session tokens
    current_user.hashed_password = get_password_hash(req.new_password)
    current_user.token_version = (current_user.token_version or 1) + 1

    assigned_roles = [ur.role.name for ur in current_user.user_roles]
    active_role_str = payload.get("active_role") if payload else (assigned_roles[0].value if assigned_roles else "STUDENT")

    new_token = create_access_token(
        subject=current_user.id,
        roles=[r.value for r in assigned_roles],
        active_role=active_role_str,
        token_version=current_user.token_version
    )

    client_ip = request.client.host if request.client else None
    db.add(AuditEvent(
        user_id=current_user.id,
        action="PASSWORD_CHANGE",
        resource_type="user",
        resource_id=current_user.id,
        ip_address=client_ip,
        details="User password successfully updated with bcrypt salt rounds=12. Prior sessions invalidated."
    ))
    db.commit()

    return ChangePasswordResponse(
        message="Password updated successfully.",
        access_token=new_token,
        token_type="bearer"
    )
