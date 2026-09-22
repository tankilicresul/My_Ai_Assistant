from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr

class UserRegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None

class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None

class UserPasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    role: str
    quota_tokens: int
    used_tokens: int
    is_active: bool
    is_banned: bool = False
    ban_reason: Optional[str] = None
    can_chat: bool = True
    can_code_studio: bool = True
    can_deep_research: bool = True
    can_media_gen: bool = True
    can_voice: bool = True
    can_upload_files: bool = True
    can_create_agents: bool = True
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

