import os
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.config import settings
from app.models.user import User
from app.models.media import MediaAsset
from app.schemas.media import ImageGenerateRequest, VideoGenerateRequest, MediaAssetResponse
from app.api.deps import get_current_user
from app.services.media_generator import media_generator_service

router = APIRouter(prefix="/media", tags=["Media Studio"])

@router.get("/models")
async def list_media_models():
    return {
        "image_models": media_generator_service.SUPPORTED_IMAGE_MODELS,
        "video_models": media_generator_service.SUPPORTED_VIDEO_MODELS
    }

@router.get("/history", response_model=List[MediaAssetResponse])
async def list_media_history(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(MediaAsset).where(MediaAsset.user_id == user.id).order_by(MediaAsset.created_at.desc())
    res = await db.execute(stmt)
    return res.scalars().all()

@router.post("/generate/image", response_model=MediaAssetResponse)
async def generate_image(
    req: ImageGenerateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Call image generator service
    gen_result = await media_generator_service.generate_image(
        prompt=req.prompt,
        negative_prompt=req.negative_prompt,
        model=req.model,
        aspect_ratio=req.aspect_ratio,
        num_inference_steps=req.num_inference_steps or 30,
        guidance_scale=req.guidance_scale or 7.5,
        seed=req.seed,
        source_image_url=req.source_image_url,
        mode=req.mode
    )

    asset = MediaAsset(
        user_id=user.id,
        media_type="image",
        prompt=req.prompt,
        negative_prompt=req.negative_prompt,
        model=req.model,
        aspect_ratio=req.aspect_ratio,
        file_url=gen_result.get("file_url"),
        local_path=gen_result.get("local_path"),
        status=gen_result.get("status", "completed"),
        generation_time_sec=gen_result.get("generation_time_sec", 1),
        meta_info=gen_result.get("meta_info", {})
    )
    db.add(asset)
    await db.commit()
    await db.refresh(asset)
    return asset

@router.post("/generate/video", response_model=MediaAssetResponse)
async def generate_video(
    req: VideoGenerateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    gen_result = await media_generator_service.generate_video(
        prompt=req.prompt,
        negative_prompt=req.negative_prompt,
        model=req.model,
        aspect_ratio=req.aspect_ratio,
        duration_seconds=req.duration_seconds or 5,
        fps=req.fps or 24,
        source_image_url=req.source_image_url,
        mode=req.mode
    )

    asset = MediaAsset(
        user_id=user.id,
        media_type="video",
        prompt=req.prompt,
        negative_prompt=req.negative_prompt,
        model=req.model,
        aspect_ratio=req.aspect_ratio,
        file_url=gen_result.get("file_url"),
        local_path=gen_result.get("local_path"),
        status=gen_result.get("status", "completed"),
        generation_time_sec=gen_result.get("generation_time_sec", 3),
        meta_info=gen_result.get("meta_info", {})
    )
    db.add(asset)
    await db.commit()
    await db.refresh(asset)
    return asset

@router.get("/file/{filename}")
async def serve_media_file(filename: str):
    file_path = os.path.join(settings.MEDIA_STORAGE_DIR, filename)
    if not os.path.isfile(file_path):
        raise HTTPException(status_code=404, detail="Medya dosyası bulunamadı.")
    
    media_type = "image/svg+xml" if filename.endswith((".svg", ".png")) else "video/mp4"
    return FileResponse(file_path, media_type=media_type)
