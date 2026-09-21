from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel

class DocumentResponse(BaseModel):
    id: str
    user_id: str
    filename: str
    file_type: str
    file_size_bytes: int
    summary: Optional[str] = None
    extracted_text: Optional[str] = None
    analysis_results: Dict[str, Any] = {}
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class DocumentQueryRequest(BaseModel):
    document_id: str
    question: str
    generate_chart: bool = False

class DocumentAnalysisSummary(BaseModel):
    document_id: str
    filename: str
    file_type: str
    summary: str
    key_metrics: Dict[str, Any] = {}
    chart_recommendations: List[Dict[str, Any]] = []
    sample_data: Optional[List[Dict[str, Any]]] = None

class DocumentGenerateRequest(BaseModel):
    prompt: str
    file_type: str  # pdf, docx, xlsx, csv, json
    title: Optional[str] = None
    model: Optional[str] = "gpt-4o"

class DirectFileCreateRequest(BaseModel):
    file_type: str  # pdf, docx, xlsx, csv, json
    title: str
    filename: Optional[str] = None
    # For PDF/Docx
    sections: Optional[List[Dict[str, Any]]] = None
    # For Excel/CSV
    columns: Optional[List[str]] = None
    rows: Optional[List[List[Any]]] = None
    # For JSON
    data: Optional[Any] = None

