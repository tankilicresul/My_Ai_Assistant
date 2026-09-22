import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.models.user import User
from app.models.conversation import Conversation, Message
from app.models.audit import AuditLog
from app.schemas.chat import (
    ConversationCreateRequest, ConversationResponse,
    MessageCreateRequest, MessageResponse, ModelOption
)
from app.api.deps import get_current_user
from app.services.llm_gateway import llm_gateway, SUPPORTED_MODELS
from app.services.vector_memory import vector_memory_service

router = APIRouter(prefix="/chat", tags=["Chat"])

@router.get("/models", response_model=List[ModelOption])
async def list_models():
    """List all supported models across GPT, Claude, Gemini, DeepSeek, Qwen and Llama."""
    return SUPPORTED_MODELS

@router.get("/conversations", response_model=List[ConversationResponse])
async def list_conversations(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(Conversation)
        .options(selectinload(Conversation.messages))
        .where(Conversation.user_id == user.id)
        .order_by(Conversation.updated_at.desc())
    )
    res = await db.execute(stmt)
    conversations = res.scalars().all()
    return conversations

@router.post("/conversations", response_model=ConversationResponse)
async def create_conversation(
    req: ConversationCreateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    conv = Conversation(
        user_id=user.id,
        title=req.title or "Yeni Sohbet",
        model=req.model or "gpt-4o",
        system_prompt=req.system_prompt
    )
    db.add(conv)
    await db.commit()
    stmt = (
        select(Conversation)
        .options(selectinload(Conversation.messages))
        .where(Conversation.id == conv.id)
    )
    res = await db.execute(stmt)
    return res.scalar_one()

@router.get("/conversations/{conversation_id}", response_model=ConversationResponse)
async def get_conversation(
    conversation_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(Conversation)
        .options(selectinload(Conversation.messages))
        .where(Conversation.id == conversation_id, Conversation.user_id == user.id)
    )
    res = await db.execute(stmt)
    conv = res.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Sohbet bulunamadı.")
    return conv


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Conversation).where(Conversation.id == conversation_id, Conversation.user_id == user.id)
    res = await db.execute(stmt)
    conv = res.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Sohbet bulunamadı.")
    await db.delete(conv)
    await db.commit()
    return {"status": "deleted"}

@router.post("/messages", response_model=MessageResponse)
async def send_message(
    req: MessageCreateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Retrieve or create conversation
    conv_id = req.conversation_id
    if not conv_id:
        conv = Conversation(
            user_id=user.id,
            title=req.content[:30] + ("..." if len(req.content) > 30 else ""),
            model=req.model,
            system_prompt=req.system_prompt
        )
        db.add(conv)
        await db.commit()
        conv_id = conv.id
    else:
        stmt = select(Conversation).where(Conversation.id == conv_id, Conversation.user_id == user.id)
        res = await db.execute(stmt)
        conv = res.scalar_one_or_none()
        if not conv:
            raise HTTPException(status_code=404, detail="Sohbet bulunamadı.")

    # Save user message
    user_msg = Message(
        conversation_id=conv_id,
        role="user",
        content=req.content,
        model_name=req.model,
        meta_info={"attachments": req.attachments or []}
    )
    db.add(user_msg)
    await db.commit()

    # Load context history
    msg_stmt = select(Message).where(Message.conversation_id == conv_id).order_by(Message.created_at)
    msg_res = await db.execute(msg_stmt)
    history = msg_res.scalars().all()

    llm_messages = []
    
    # Check vector memory if enabled
    memory_context = ""
    if req.enable_memory:
        memories = await vector_memory_service.search_memories(user.id, req.content, limit=3)
        if memories:
            memory_context = "\nKullanıcı Hakkında Bilinenler:\n" + "\n".join([f"- {m['content']}" for m in memories])

    system_content = conv.system_prompt or "Sen gelişmiş, yardımcı, profesyonel bir AI asistanısın."
    if memory_context:
        system_content += f"\n{memory_context}"

    llm_messages.append({"role": "system", "content": system_content})

    for m in history:
        llm_messages.append({"role": m.role, "content": m.content})

    # Call LLM Gateway
    ai_result = await llm_gateway.generate_response(
        messages=llm_messages,
        model=req.model,
        temperature=0.7
    )

    # Save assistant message
    asst_msg = Message(
        conversation_id=conv_id,
        role="assistant",
        content=ai_result.get("content", ""),
        model_name=req.model,
        tokens_used=ai_result.get("total_tokens", 0),
        meta_info={"tool_calls": ai_result.get("tool_calls")}
    )
    db.add(asst_msg)

    # Update user quota & audit log
    user.used_tokens += ai_result.get("total_tokens", 0)
    audit = AuditLog(
        user_id=user.id,
        action="chat_completion",
        model=req.model,
        prompt_tokens=ai_result.get("prompt_tokens", 0),
        completion_tokens=ai_result.get("completion_tokens", 0),
        total_tokens=ai_result.get("total_tokens", 0),
        estimated_cost_usd=ai_result.get("estimated_cost_usd", 0.0)
    )
    db.add(audit)
    await db.commit()
    await db.refresh(asst_msg)

    return asst_msg

@router.post("/stream")
async def stream_chat(
    req: MessageCreateRequest,
    user: User = Depends(get_current_user)
):
    """
    SSE stream endpoint for real-time word-by-word ChatGPT experience.
    """
    messages = [
        {"role": "system", "content": req.system_prompt or "Sen gelişmiş bir AI asistanısın."},
        {"role": "user", "content": req.content}
    ]

    async def event_generator():
        async for chunk in llm_gateway.stream_response(messages=messages, model=req.model):
            yield f"data: {json.dumps(chunk)}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
