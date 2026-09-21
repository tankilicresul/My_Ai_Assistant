from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel

class ResearchCreateRequest(BaseModel):
    query: str
    depth_level: str = "deep"  # quick, standard, deep
    focus_areas: Optional[List[str]] = None
    language: str = "tr"

class ResearchSource(BaseModel):
    title: str
    url: str
    snippet: str
    reliability_score: float = 0.95

class ResearchTaskResponse(BaseModel):
    id: str
    user_id: str
    query: str
    depth_level: str
    status: str
    progress_percentage: int
    current_step: Optional[str] = None
    summary: Optional[str] = None
    full_report_markdown: Optional[str] = None
    sources: List[ResearchSource] = []
    pdf_report_path: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
