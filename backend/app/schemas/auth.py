from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, ConfigDict
from app.models.user import RoleEnum

class LoginRequest(BaseModel):
    username_or_email: str
    password: str

class RoleResponse(BaseModel):
    id: int
    name: RoleEnum
    description: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class UserProfileResponse(BaseModel):
    id: int
    email: str
    username: str
    full_name: str
    is_active: bool
    department_id: Optional[int] = None
    department_code: Optional[str] = None
    section_id: Optional[int] = None
    section_code: Optional[str] = None
    active_role: RoleEnum
    available_roles: List[RoleEnum]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfileResponse

class RoleSwitchRequest(BaseModel):
    target_role: RoleEnum

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
    confirm_new_password: str

class ChangePasswordResponse(BaseModel):
    message: str
    access_token: Optional[str] = None
    token_type: Optional[str] = "bearer"

