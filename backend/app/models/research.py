import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, JSON, Integer
from sqlalchemy.orm import relationship
from app.core.database import Base

class ResearchTask(Base):
    __tablename__ = "research_tasks"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    query = Column(Text, nullable=False)
    depth_level = Column(String(50), default="deep")  # quick, standard, deep
    status = Column(String(50), default="pending")  # pending, searching, synthesizing, completed, failed
    progress_percentage = Column(Integer, default=0)
    current_step = Column(String(255), nullable=True)
    summary = Column(Text, nullable=True)
    full_report_markdown = Column(Text, nullable=True)
    sources = Column(JSON, default=list)  # list of {title, url, snippet, reliability_score}
    pdf_report_path = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="research_tasks")
