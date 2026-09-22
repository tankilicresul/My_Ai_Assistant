from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel

class SystemStatsResponse(BaseModel):
    total_users: int
    active_users_today: int
    total_conversations: int
    total_tokens_consumed: int
    total_estimated_cost_usd: float
    total_media_generated: int
    total_research_tasks: int
    total_agents_created: int

class TokenUsageByModel(BaseModel):
    model: str
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    estimated_cost_usd: float
    call_count: int

class UserAdminView(BaseModel):
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
    created_at: datetime

    class Config:
        from_attributes = True

class UserPermissionUpdateRequest(BaseModel):
    role: Optional[str] = None
    quota_tokens: Optional[int] = None
    is_active: Optional[bool] = None
    is_banned: Optional[bool] = None
    ban_reason: Optional[str] = None
    can_chat: Optional[bool] = None
    can_code_studio: Optional[bool] = None
    can_deep_research: Optional[bool] = None
    can_media_gen: Optional[bool] = None
    can_voice: Optional[bool] = None
    can_upload_files: Optional[bool] = None
    can_create_agents: Optional[bool] = None

class UserCreateAdminRequest(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = None
    role: str = "user"
    quota_tokens: int = 100_000_000

class UserPasswordResetAdminRequest(BaseModel):
    new_password: str

class SystemSettingsSchema(BaseModel):
    maintenance_mode: bool
    allow_registration: bool
    system_announcement_title: Optional[str] = None
    system_announcement_message: Optional[str] = None
    system_announcement_type: str = "info"
    system_announcement_active: bool = False
    default_user_quota: int = 100_000_000
    default_ai_model: str = "gpt-4o"

    class Config:
        from_attributes = True

class SystemSettingsUpdateRequest(BaseModel):
    maintenance_mode: Optional[bool] = None
    allow_registration: Optional[bool] = None
    system_announcement_title: Optional[str] = None
    system_announcement_message: Optional[str] = None
    system_announcement_type: Optional[str] = None
    system_announcement_active: Optional[bool] = None
    default_user_quota: Optional[int] = None
    default_ai_model: Optional[str] = None

class ProviderHealth(BaseModel):
    name: str
    category: str
    status: str  # 'operational', 'configured', 'active'
    latency_ms: int
    models: List[str]

class PublicConfigResponse(BaseModel):
    maintenance_mode: bool
    allow_registration: bool
    announcement: Optional[Dict[str, Any]] = None
    default_model: str

class AuditLogResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    user_email: Optional[str] = None
    action: str
    model: Optional[str] = None
    total_tokens: int
    estimated_cost_usd: float
    status_code: int
    error_message: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True
