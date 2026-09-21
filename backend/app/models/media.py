import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, JSON, Integer
from sqlalchemy.orm import relationship
from app.core.database import Base

class MediaAsset(Base):
    __tablename__ = "media_assets"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    media_type = Column(String(50), nullable=False)  # 'image' or 'video'
    prompt = Column(Text, nullable=False)
    negative_prompt = Column(Text, nullable=True)
    model = Column(String(100), nullable=False)  # flux-pro, sd-xl, wan-2.1, cogvideox, kling-v1, veo-2
    aspect_ratio = Column(String(20), default="1:1")
    file_url = Column(String(500), nullable=True)
    local_path = Column(String(500), nullable=True)
    status = Column(String(50), default="pending")  # pending, processing, completed, failed
    error_message = Column(Text, nullable=True)
    generation_time_sec = Column(Integer, default=0)
    meta_info = Column(JSON, default=dict)  # seed, steps, resolution, source_image_url
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="media_assets")
