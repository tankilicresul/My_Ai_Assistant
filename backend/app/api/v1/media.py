import os
import mimetypes
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
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

@router.delete("/{asset_id}")
async def delete_media_asset(
    asset_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(MediaAsset).where(MediaAsset.id == asset_id, MediaAsset.user_id == user.id)
    res = await db.execute(stmt)
    asset = res.scalar_one_or_none()
    if not asset:
        raise HTTPException(status_code=404, detail="Medya varlığı bulunamadı.")

    # Remove local file if exists
    if asset.local_path and os.path.exists(asset.local_path):
        try:
            os.remove(asset.local_path)
        except Exception:
            pass

    await db.delete(asset)
    await db.commit()
    return {"status": "success", "message": "Medya silindi."}

@router.get("/file/{filename}")
async def serve_media_file(filename: str):
    # Prevent directory traversal
    clean_filename = os.path.basename(filename)
    file_path = os.path.join(settings.MEDIA_STORAGE_DIR, clean_filename)
    if not os.path.isfile(file_path):
        raise HTTPException(status_code=404, detail="Medya dosyası bulunamadı.")

    # Accurate MIME type detection
    if clean_filename.endswith(".svg"):
        media_type = "image/svg+xml"
    elif clean_filename.endswith(".png"):
        media_type = "image/png"
    elif clean_filename.endswith((".jpg", ".jpeg")):
        media_type = "image/jpeg"
    elif clean_filename.endswith(".webp"):
        media_type = "image/webp"
    elif clean_filename.endswith(".gif"):
        media_type = "image/gif"
    elif clean_filename.endswith(".mp4"):
        media_type = "video/mp4"
    elif clean_filename.endswith(".webm"):
        media_type = "video/webm"
    else:
        guess, _ = mimetypes.guess_type(clean_filename)
        media_type = guess or "application/octet-stream"

    return FileResponse(
        file_path,
        media_type=media_type,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "public, max-age=86400",
        }
    )
