from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel

class MessageCreateRequest(BaseModel):
    conversation_id: Optional[str] = None
    role: str = "user"
    content: str
    model: str = "gpt-4o"
    enable_memory: bool = True
    enable_web_search: bool = False
    system_prompt: Optional[str] = None
    attachments: Optional[List[Dict[str, Any]]] = None

class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    role: str
    content: str
    model_name: Optional[str] = None
    tokens_used: int = 0
    meta_info: Dict[str, Any] = {}
    created_at: datetime

    class Config:
        from_attributes = True

class ConversationCreateRequest(BaseModel):
    title: Optional[str] = "Yeni Sohbet"
    model: Optional[str] = "gpt-4o"
    system_prompt: Optional[str] = None

class ConversationResponse(BaseModel):
    id: str
    title: str
    model: str
    system_prompt: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    messages: Optional[List[MessageResponse]] = []

    class Config:
        from_attributes = True

class ModelOption(BaseModel):
    id: str
    name: str
    provider: str
    description: str
    context_window: int
    supports_vision: bool
    supports_tools: bool
    is_free: bool = False
