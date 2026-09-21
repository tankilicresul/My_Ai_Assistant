import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, JSON, Boolean, Integer
from sqlalchemy.orm import relationship
from app.core.database import Base

class Agent(Base):
    __tablename__ = "agents"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    slug = Column(String(120), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=False)
    avatar_url = Column(String(500), nullable=True)
    category = Column(String(50), default="general")  # coding, finance, research, sales, procurement, accounting
    system_prompt = Column(Text, nullable=False)
    model = Column(String(100), default="claude-3-7-sonnet-latest")
    temperature = Column(String(20), default="0.7")
    tools_enabled = Column(JSON, default=list)  # ["web_search", "python_repl", "file_reader", "database_query"]
    is_public = Column(Boolean, default=False)
    usage_count = Column(Integer, default=0)
    rating = Column(String(20), default="5.0")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="agents")
