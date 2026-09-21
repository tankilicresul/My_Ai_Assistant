from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel

class ImageGenerateRequest(BaseModel):
    prompt: str
    negative_prompt: Optional[str] = None
    model: str = "flux-1-schnell"  # flux-pro, flux-dev, flux-1-schnell, sd-xl
    aspect_ratio: str = "1:1"  # 1:1, 16:9, 9:16, 4:3, 3:4
    num_inference_steps: Optional[int] = 30
    guidance_scale: Optional[float] = 7.5
    seed: Optional[int] = None
    source_image_url: Optional[str] = None  # img2img
    mode: str = "text2image"  # text2image, img2img, background_remove, upscale

class VideoGenerateRequest(BaseModel):
    prompt: str
    negative_prompt: Optional[str] = None
    model: str = "wan-2.1"  # wan-2.1, cogvideox-5b, kling-v1.5, veo-2
    aspect_ratio: str = "16:9"  # 16:9, 9:16, 1:1
    duration_seconds: int = 5
    fps: int = 24
    source_image_url: Optional[str] = None  # img2video
    mode: str = "text2video"  # text2video, img2video, video_upscale

class MediaAssetResponse(BaseModel):
    id: str
    user_id: str
    media_type: str
    prompt: str
    model: str
    aspect_ratio: str
    file_url: Optional[str] = None
    status: str
    error_message: Optional[str] = None
    generation_time_sec: int = 0
    meta_info: Dict[str, Any] = {}
    created_at: datetime

    class Config:
        from_attributes = True
