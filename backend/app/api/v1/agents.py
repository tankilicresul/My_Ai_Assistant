import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from app.core.database import get_db
from app.models.user import User
from app.models.agent import Agent
from app.schemas.agents import AgentCreateRequest, AgentUpdateRequest, AgentResponse, AgentExecuteRequest
from app.api.deps import get_current_user
from app.services.agent_runtime import agent_runtime_service

router = APIRouter(prefix="/agents", tags=["Agent Marketplace"])

DEFAULT_MARKETPLACE_AGENTS = [
    {
        "name": "Satın Alma ve Tedarik Uzmanı (Procurement Agent)",
        "slug": "procurement-specialist",
        "description": "Tedarikçi tekliflerini karşılaştırır, maliyet optimizasyonu ve RFQ analizi yapar.",
        "avatar_url": "https://api.dicebear.com/7.x/bottts/svg?seed=procurement",
        "category": "procurement",
        "system_prompt": "Sen kurumsal bir satın alma ve stratejik tedarik direktörüsün. Tedarikçi tekliflerini, sözleşme şartlarını ve birim maliyet analizlerini titizlikle değerlendirirsin.",
        "model": "claude-3-7-sonnet-latest",
        "tools_enabled": ["web_search", "calculate_math"],
        "is_public": True,
        "rating": "4.9",
        "usage_count": 1240
    },
    {
        "name": "Mali Müşavir ve Muhasebe Analisti",
        "slug": "accounting-finance-agent",
        "description": "Gelir-gider tabloları, vergi mevzuatı, KDV/stopaj hesaplama ve bilanço analizi.",
        "avatar_url": "https://api.dicebear.com/7.x/bottts/svg?seed=accounting",
        "category": "accounting",
        "system_prompt": "Sen uluslararası standartlarda uzman bir mali müşavir ve finans analistisin. Vergi hesaplamaları, nakit akış tahminleri ve finansal raporlamada rehberlik edersin.",
        "model": "gpt-4o",
        "tools_enabled": ["calculate_math"],
        "is_public": True,
        "rating": "5.0",
        "usage_count": 2890
    },
    {
        "name": "Veri Analitiği ve BI Danışmanı",
        "slug": "data-analytics-bi",
        "description": "Büyük veri setlerini analiz eder, regresyon, cohort analizi ve SQL sorguları üretir.",
        "avatar_url": "https://api.dicebear.com/7.x/bottts/svg?seed=data",
        "category": "data_analysis",
        "system_prompt": "Sen kıdemli bir Data Scientist ve BI mimarısın. İstatistiksel modeller, EDA ve veri odaklı kararlar üzerine odaklanırsın.",
        "model": "claude-3-7-sonnet-latest",
        "tools_enabled": ["python_repl", "calculate_math"],
        "is_public": True,
        "rating": "4.8",
        "usage_count": 3120
    },
    {
        "name": "Full Stack Yazılım Mimarı",
        "slug": "full-stack-architect",
        "description": "Mikroservis mimarileri, React/FastAPI kod üretimi, refactoring ve CI/CD pipeline tasarımı.",
        "avatar_url": "https://api.dicebear.com/7.x/bottts/svg?seed=coding",
        "category": "coding",
        "system_prompt": "Sen kıdemli bir Principal Full Stack Yazılım Mimarısın. Clean Code, TDD, Domain Driven Design ve yüksek ölçeklenebilirlik prensiplerini uygularsın.",
        "model": "claude-3-7-sonnet-latest",
        "tools_enabled": ["code_sandbox", "web_search"],
        "is_public": True,
        "rating": "5.0",
        "usage_count": 4500
    },
    {
        "name": "Akademik Araştırma ve Literatür Asistanı",
        "slug": "academic-research-fellow",
        "description": "IEEE, Arxiv ve Nature standartlarında akademik makale taraması ve sentez.",
        "avatar_url": "https://api.dicebear.com/7.x/bottts/svg?seed=academic",
        "category": "research",
        "system_prompt": "Sen saygın bir üniversitede görev yapan Senior Research Fellow'sun. Metodoloji, literatür taraması ve akademik dil konusunda uzmansın.",
        "model": "gemini-1.5-pro",
        "tools_enabled": ["web_search"],
        "is_public": True,
        "rating": "4.9",
        "usage_count": 1820
    }
]

@router.get("/marketplace", response_model=List[AgentResponse])
async def list_marketplace_agents(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Agent).where(or_(Agent.is_public == True, Agent.user_id == user.id))
    res = await db.execute(stmt)
    agents = res.scalars().all()

    if not agents:
        # Seed default marketplace agents
        for default_ag in DEFAULT_MARKETPLACE_AGENTS:
            ag = Agent(
                user_id=user.id,
                name=default_ag["name"],
                slug=default_ag["slug"],
                description=default_ag["description"],
                avatar_url=default_ag["avatar_url"],
                category=default_ag["category"],
                system_prompt=default_ag["system_prompt"],
                model=default_ag["model"],
                tools_enabled=default_ag["tools_enabled"],
                is_public=default_ag["is_public"],
                rating=default_ag["rating"],
                usage_count=default_ag["usage_count"]
            )
            db.add(ag)
        await db.commit()
        
        stmt = select(Agent).where(or_(Agent.is_public == True, Agent.user_id == user.id))
        res = await db.execute(stmt)
        agents = res.scalars().all()

    return agents

@router.post("/custom", response_model=AgentResponse)
async def create_custom_agent(
    req: AgentCreateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    slug = f"{req.name.lower().replace(' ', '-')[:30]}-{uuid.uuid4().hex[:6]}"
    agent = Agent(
        user_id=user.id,
        name=req.name,
        slug=slug,
        description=req.description,
        avatar_url=req.avatar_url or f"https://api.dicebear.com/7.x/bottts/svg?seed={slug}",
        category=req.category,
        system_prompt=req.system_prompt,
        model=req.model or "claude-3-7-sonnet-latest",
        temperature=req.temperature or "0.7",
        tools_enabled=req.tools_enabled or [],
        is_public=req.is_public,
        usage_count=0
    )
    db.add(agent)
    await db.commit()
    await db.refresh(agent)
    return agent

@router.post("/execute")
async def execute_agent_runtime(
    req: AgentExecuteRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Agent).where(Agent.id == req.agent_id)
    res = await db.execute(stmt)
    agent = res.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent bulunamadı.")

    # Increment usage
    agent.usage_count += 1
    await db.commit()

    result = await agent_runtime_service.execute_agent(
        agent_name=agent.name,
        system_prompt=agent.system_prompt,
        user_input=req.input_text,
        tools_enabled=agent.tools_enabled or [],
        model=agent.model
    )
    return result
