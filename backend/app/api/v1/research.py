from typing import List
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.user import User
from app.models.research import ResearchTask
from app.schemas.research import ResearchCreateRequest, ResearchTaskResponse
from app.api.deps import get_current_user
from app.services.deep_research import deep_research_service

router = APIRouter(prefix="/research", tags=["Deep Research"])

@router.get("/tasks", response_model=List[ResearchTaskResponse])
async def list_research_tasks(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(ResearchTask).where(ResearchTask.user_id == user.id).order_by(ResearchTask.created_at.desc())
    res = await db.execute(stmt)
    return res.scalars().all()

@router.get("/tasks/{task_id}", response_model=ResearchTaskResponse)
async def get_research_task(
    task_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(ResearchTask).where(ResearchTask.id == task_id, ResearchTask.user_id == user.id)
    res = await db.execute(stmt)
    task = res.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Araştırma görevi bulunamadı.")
    return task

@router.post("/run", response_model=ResearchTaskResponse)
async def run_research_task(
    req: ResearchCreateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Create DB entry
    task = ResearchTask(
        user_id=user.id,
        query=req.query,
        depth_level=req.depth_level,
        status="synthesizing",
        progress_percentage=30,
        current_step="Kaynaklar taranıyor..."
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)

    # Run research synthesis
    result = await deep_research_service.run_deep_research(
        query=req.query,
        depth_level=req.depth_level,
        focus_areas=req.focus_areas,
        language=req.language
    )

    task.status = result.get("status", "completed")
    task.progress_percentage = 100
    task.current_step = "Tamamlandı"
    task.summary = result.get("summary")
    task.full_report_markdown = result.get("full_report_markdown")
    task.sources = result.get("sources", [])

    await db.commit()
    await db.refresh(task)
    return task
