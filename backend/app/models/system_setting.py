import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, Integer, Text
from app.core.database import Base

class SystemSetting(Base):
    __tablename__ = "system_settings"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    maintenance_mode = Column(Boolean, default=False)
    allow_registration = Column(Boolean, default=True)
    
    # Broadcast announcement
    system_announcement_title = Column(String(255), nullable=True)
    system_announcement_message = Column(Text, nullable=True)
    system_announcement_type = Column(String(50), default="info")  # 'info', 'warning', 'danger', 'success'
    system_announcement_active = Column(Boolean, default=False)

    # Defaults
    default_user_quota = Column(Integer, default=100_000_000)
    default_ai_model = Column(String(100), default="gpt-4o")
    
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
