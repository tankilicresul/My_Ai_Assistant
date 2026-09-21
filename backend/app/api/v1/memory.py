from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.user import User
from app.models.memory import UserMemory
from app.schemas.memory import MemoryCreateRequest, MemoryQueryRequest, MemoryResponse
from app.api.deps import get_current_user
from app.services.vector_memory import vector_memory_service

router = APIRouter(prefix="/memory", tags=["Vector Memory"])

@router.get("/list", response_model=List[MemoryResponse])
async def list_memories(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(UserMemory).where(UserMemory.user_id == user.id).order_by(UserMemory.created_at.desc())
    res = await db.execute(stmt)
    return res.scalars().all()

@router.post("/add", response_model=MemoryResponse)
async def add_memory(
    req: MemoryCreateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Store in Qdrant Vector Store
    point_id = await vector_memory_service.store_memory(
        user_id=user.id,
        content=req.content,
        category=req.category,
        key=req.key,
        importance_score=req.importance_score,
        meta_info=req.meta_info
    )

    # Store in relational database
    mem = UserMemory(
        user_id=user.id,
        category=req.category,
        key=req.key,
        content=req.content,
        importance_score=req.importance_score,
        vector_id=point_id,
        meta_info=req.meta_info or {}
    )
    db.add(mem)
    await db.commit()
    await db.refresh(mem)
    return mem

@router.post("/search", response_model=List[MemoryResponse])
async def search_memories(
    req: MemoryQueryRequest,
    user: User = Depends(get_current_user)
):
    results = await vector_memory_service.search_memories(
        user_id=user.id,
        query=req.query,
        category=req.category,
        limit=req.limit,
        min_score=req.min_score
    )
    return results

@router.delete("/{memory_id}")
async def delete_memory(
    memory_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(UserMemory).where(UserMemory.id == memory_id, UserMemory.user_id == user.id)
    res = await db.execute(stmt)
    mem = res.scalar_one_or_none()
    if not mem:
        raise HTTPException(status_code=404, detail="Hafıza kaydı bulunamadı.")
    await db.delete(mem)
    await db.commit()
    return {"status": "deleted"}
