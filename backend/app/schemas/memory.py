from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel

class MemoryCreateRequest(BaseModel):
    category: str = "preference"  # preference, project, career, education, conversation
    key: Optional[str] = None
    content: str
    importance_score: float = 1.0
    meta_info: Optional[Dict[str, Any]] = None

class MemoryQueryRequest(BaseModel):
    query: str
    category: Optional[str] = None
    limit: int = 5
    min_score: float = 0.5

class MemoryResponse(BaseModel):
    id: str
    user_id: str
    category: str
    key: Optional[str] = None
    content: str
    importance_score: float
    similarity_score: Optional[float] = None
    meta_info: Dict[str, Any] = {}
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
