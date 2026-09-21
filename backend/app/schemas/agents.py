from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel

class AgentCreateRequest(BaseModel):
    name: str
    description: str
    avatar_url: Optional[str] = None
    category: str = "general"
    system_prompt: str
    model: Optional[str] = "claude-3-7-sonnet-latest"
    temperature: Optional[str] = "0.7"
    tools_enabled: Optional[List[str]] = ["web_search", "python_repl", "file_reader"]
    is_public: bool = False

class AgentUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    avatar_url: Optional[str] = None
    category: Optional[str] = None
    system_prompt: Optional[str] = None
    model: Optional[str] = None
    temperature: Optional[str] = None
    tools_enabled: Optional[List[str]] = None
    is_public: Optional[bool] = None

class AgentResponse(BaseModel):
    id: str
    user_id: str
    name: str
    slug: str
    description: str
    avatar_url: Optional[str] = None
    category: str
    system_prompt: str
    model: str
    temperature: str
    tools_enabled: List[str] = []
    is_public: bool
    usage_count: int
    rating: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class AgentExecuteRequest(BaseModel):
    agent_id: str
    input_text: str
    context: Optional[dict] = None
