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
    created_at: datetime

    class Config:
        from_attributes = True

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
