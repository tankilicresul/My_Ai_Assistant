import os
import uuid
import shutil
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.config import settings
from app.models.user import User
from app.models.document import Document
from app.schemas.files import DocumentResponse, DocumentQueryRequest
from app.api.deps import get_current_user
from app.services.file_parser import file_parser_service
from app.services.llm_gateway import llm_gateway

import mimetypes
from fastapi.responses import FileResponse

from app.schemas.files import (
    DocumentResponse,
    DocumentQueryRequest,
    DocumentGenerateRequest,
    DirectFileCreateRequest,
    DocumentChatMessage,
    DocumentWorkspaceChatRequest,
    DocumentWorkspaceChatResponse,
    DocumentWorkspaceSynthesizeRequest,
)
from app.services.document_creator import document_creator_service

router = APIRouter(prefix="/files", tags=["File Analysis & Generation"])

@router.get("/list", response_model=List[DocumentResponse])
async def list_documents(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Document).where(Document.user_id == user.id).order_by(Document.created_at.desc())
    res = await db.execute(stmt)
    return res.scalars().all()

@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    ext = os.path.splitext(file.filename)[1].lower().replace(".", "")
    allowed_exts = ["pdf", "docx", "doc", "xlsx", "xls", "csv", "json", "txt", "pptx"]
    if ext not in allowed_exts:
        raise HTTPException(
            status_code=400,
            detail=f"Desteklenmeyen dosya formatı. Desteklenenler: {', '.join(allowed_exts)}"
        )

    file_id = f"doc_{uuid.uuid4().hex[:12]}_{file.filename}"
    save_path = os.path.join(settings.DOCUMENT_STORAGE_DIR, file_id)

    with open(save_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_size = os.path.getsize(save_path)

    # Parse and extract structure / charts
    parsed = await file_parser_service.parse_and_analyze(save_path, file.filename)

    doc = Document(
        user_id=user.id,
        filename=file.filename,
        file_type=ext,
        file_size_bytes=file_size,
        storage_path=save_path,
        summary=parsed.get("summary"),
        extracted_text=parsed.get("extracted_text"),
        analysis_results=parsed.get("analysis_results", {}),
        status="analyzed"
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)
    return doc

@router.post("/generate", response_model=DocumentResponse)
async def generate_document(
    req: DocumentGenerateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    AI-driven document generation: generates PDF, DOCX, XLSX, CSV or JSON from a natural language prompt.
    """
    ext = req.file_type.lower().replace(".", "")
    allowed_exts = ["pdf", "docx", "xlsx", "csv", "json"]
    if ext not in allowed_exts:
        raise HTTPException(
            status_code=400,
            detail=f"Geçersiz dosya türü. Üretilebilecek türler: {', '.join(allowed_exts)}"
        )

    # Use document creator service to draft and build physical file
    gen_result = await document_creator_service.ai_draft_and_create(
        prompt=req.prompt,
        file_type=ext,
        title=req.title,
        model=req.model or "gpt-4o"
    )

    file_path = gen_result.get("file_path")
    file_size = os.path.getsize(file_path) if os.path.exists(file_path) else 0

    # Auto parse for metadata
    parsed = await file_parser_service.parse_and_analyze(file_path, gen_result.get("filename"))

    doc = Document(
        user_id=user.id,
        filename=gen_result.get("filename"),
        file_type=ext,
        file_size_bytes=file_size,
        storage_path=file_path,
        summary=f"Yapay Zeka tarafından '{req.prompt[:100]}' istemiyle otomatik oluşturuldu.",
        extracted_text=parsed.get("extracted_text", ""),
        analysis_results=parsed.get("analysis_results", {}),
        status="generated"
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)
    return doc

@router.post("/create", response_model=DocumentResponse)
async def direct_create_document(
    req: DirectFileCreateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Directly create a formatted file from structured JSON parameters.
    """
    ext = req.file_type.lower().replace(".", "")
    if ext == "pdf":
        file_path = document_creator_service.create_pdf(req.title, req.sections or [], filename=req.filename)
    elif ext == "docx":
        file_path = document_creator_service.create_docx(req.title, req.sections or [], filename=req.filename)
    elif ext == "xlsx":
        file_path = document_creator_service.create_excel(req.title, req.columns or [], req.rows or [], filename=req.filename)
    elif ext == "csv":
        file_path = document_creator_service.create_csv(req.columns or [], req.rows or [], filename=req.filename)
    elif ext == "json":
        file_path = document_creator_service.create_json(req.data or {}, filename=req.filename)
    else:
        raise HTTPException(status_code=400, detail="Desteklenmeyen dosya türü.")

    filename = os.path.basename(file_path)
    file_size = os.path.getsize(file_path) if os.path.exists(file_path) else 0
    parsed = await file_parser_service.parse_and_analyze(file_path, filename)

    doc = Document(
        user_id=user.id,
        filename=filename,
        file_type=ext,
        file_size_bytes=file_size,
        storage_path=file_path,
        summary=f"{req.title} dokümanı oluşturuldu.",
        extracted_text=parsed.get("extracted_text", ""),
        analysis_results=parsed.get("analysis_results", {}),
        status="created"
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)
    return doc

@router.get("/download/{document_id}")
async def download_document(
    document_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Document).where(Document.id == document_id, Document.user_id == user.id)
    res = await db.execute(stmt)
    doc = res.scalar_one_or_none()
    if not doc or not os.path.exists(doc.storage_path):
        raise HTTPException(status_code=404, detail="Doküman dosyası bulunamadı.")

    mime_type, _ = mimetypes.guess_type(doc.storage_path)
    if not mime_type:
        mime_type = "application/octet-stream"

    return FileResponse(
        path=doc.storage_path,
        filename=doc.filename,
        media_type=mime_type
    )

@router.delete("/{document_id}")
async def delete_document(
    document_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Document).where(Document.id == document_id, Document.user_id == user.id)
    res = await db.execute(stmt)
    doc = res.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Doküman bulunamadı.")

    if os.path.exists(doc.storage_path):
        try:
            os.remove(doc.storage_path)
        except Exception:
            pass

    await db.delete(doc)
    await db.commit()
    return {"status": "deleted"}

@router.post("/query")
async def query_document(
    req: DocumentQueryRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Document).where(Document.id == req.document_id, Document.user_id == user.id)
    res = await db.execute(stmt)
    doc = res.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Doküman bulunamadı.")

    prompt = f"""DOKÜMAN ADI: {doc.filename} ({doc.file_type})
ANALİZ METAVERİSİ:
{str(doc.analysis_results)[:2000]}

DOKÜMAN İÇERİĞİ / VERİ:
{doc.extracted_text[:6000]}

KULLANICI SORUSU: {req.question}

Yukarıdaki doküman verisine dayanarak kullanıcı sorusuna net, detaylı ve gerekirse hesaplamaları göstererek yanıt ver."""

    llm_res = await llm_gateway.generate_response(
        messages=[
            {"role": "system", "content": "You are a professional document analysis and data science assistant."},
            {"role": "user", "content": prompt}
        ],
        model="gpt-4o",
        temperature=0.3
    )

    return {
        "document_id": doc.id,
        "filename": doc.filename,
        "answer": llm_res.get("content", ""),
        "tokens_used": llm_res.get("total_tokens", 0)
    }


@router.post("/workspace/chat", response_model=DocumentWorkspaceChatResponse)
async def workspace_chat(
    req: DocumentWorkspaceChatRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Multi-turn interactive conversational workspace for discussing, refining,
    and collaborating on documents, data, and ideas with attached file context.
    """
    doc_context = ""
    if req.active_document_ids:
        stmt = select(Document).where(Document.id.in_(req.active_document_ids), Document.user_id == user.id)
        res = await db.execute(stmt)
        docs = res.scalars().all()
        if docs:
            doc_context_parts = []
            for d in docs:
                part = f"--- DOKÜMAN / MATERYAL: {d.filename} ({d.file_type.upper()}) ---\n"
                if d.summary:
                    part += f"Özet: {d.summary}\n"
                if d.analysis_results:
                    part += f"Analiz Bilgileri: {json.dumps(d.analysis_results, ensure_ascii=False)[:1500]}\n"
                if d.extracted_text:
                    part += f"İçerik Metni:\n{d.extracted_text[:4000]}\n"
                doc_context_parts.append(part)
            doc_context = "\n\n".join(doc_context_parts)

    system_prompt = (
        "Sen TanCoreLab Akıllı Doküman ve Veri Analizi Çalışma Alanı (Workspace Co-pilot) asistanısın. "
        "Tıpkı Claude Projects/Artifacts ve ChatGPT Canvas gibi çalışırsın.\n\n"
        "GÖREVLERİN:\n"
        "1. Kullanıcıyla fikirler, iş planları, raporlar, bütçeler, veriler ve projeler üzerinde uzun uzun konuş, tartış, ekleme/çıkarma önerilerinde bulun.\n"
        "2. Kullanıcının sağladığı/yüklediği dokümanları ve materyalleri derinlemesine anla ve konuşmanda referans göster.\n"
        "3. Kullanıcı hazır olduğunda konuşulanları PDF, Word, Excel, CSV veya JSON formatında bir dokümana/tabloya dönüştürmek için önerilerde bulun.\n"
        "4. Her zaman profesyonel, net, Türkçe, iyi yapılandırılmış ve vizyoner yanıtlar ver."
    )

    if doc_context:
        system_prompt += f"\n\nAKTİF DOKÜMAN VE MATERYALLER BAĞLAMI:\n{doc_context}"

    llm_messages = [{"role": "system", "content": system_prompt}]
    for m in req.messages:
        llm_messages.append({"role": m.role, "content": m.content})

    llm_res = await llm_gateway.generate_response(
        messages=llm_messages,
        model=req.model or "gpt-4o",
        temperature=0.6
    )

    suggested_actions = [
        "📄 PDF Raporu Oluştur",
        "📊 Excel Tablosu Çıkar",
        "📝 Word Dokümanı Yap",
        "⚡ CSV Veri Seti",
        "🧩 JSON Çıktısı"
    ]

    return DocumentWorkspaceChatResponse(
        message=DocumentChatMessage(
            role="assistant",
            content=llm_res.get("content", "")
        ),
        suggested_actions=suggested_actions,
        tokens_used=llm_res.get("total_tokens", 0)
    )


@router.post("/workspace/synthesize", response_model=DocumentResponse)
async def workspace_synthesize(
    req: DocumentWorkspaceSynthesizeRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Synthesize conversation history + attached documents into a final downloadable document (PDF, DOCX, XLSX, CSV, JSON).
    """
    ext = req.file_type.lower().replace(".", "")
    allowed_exts = ["pdf", "docx", "xlsx", "csv", "json"]
    if ext not in allowed_exts:
        raise HTTPException(
            status_code=400,
            detail=f"Geçersiz dosya türü. Üretilebilecek türler: {', '.join(allowed_exts)}"
        )

    # Gather conversation flow
    chat_summary = ""
    for m in req.messages[-10:]:  # Last 10 messages
        role_label = "Kullanıcı" if m.role == "user" else "Asistan"
        chat_summary += f"{role_label}: {m.content}\n\n"

    doc_context = ""
    if req.active_document_ids:
        stmt = select(Document).where(Document.id.in_(req.active_document_ids), Document.user_id == user.id)
        res = await db.execute(stmt)
        docs = res.scalars().all()
        if docs:
            for d in docs:
                doc_context += f"Ek Doküman: {d.filename} ({d.file_type}) - {d.summary or ''}\nMetin: {d.extracted_text[:2000] if d.extracted_text else ''}\n\n"

    full_prompt = f"""KULLANICIYLA YAPILAN DİYALOG VE GEREKSİNİMLER:
{chat_summary}

{f'KULLANICININ YÜKLEDİĞİ MATERYALLER BAĞLAMI:' if doc_context else ''}
{doc_context}

{f'ÖZEL İSTEK / REVİZE TALİMATI: {req.custom_instruction}' if req.custom_instruction else ''}

Lütfen yukarıdaki tüm diyalog, materyal ve detayları eksiksiz sentezleyerek profesyonel, yayın kalitesinde bir {ext.upper()} dokümanı/tablosu hazırla."""

    doc_title = req.title or f"{ext.upper()} Çalışma Raporu"

    gen_result = await document_creator_service.ai_draft_and_create(
        prompt=full_prompt,
        file_type=ext,
        title=doc_title,
        model=req.model or "gpt-4o"
    )

    file_path = gen_result.get("file_path")
    file_size = os.path.getsize(file_path) if os.path.exists(file_path) else 0

    parsed = await file_parser_service.parse_and_analyze(file_path, gen_result.get("filename"))

    doc = Document(
        user_id=user.id,
        filename=gen_result.get("filename"),
        file_type=ext,
        file_size_bytes=file_size,
        storage_path=file_path,
        summary=f"Çalışma Alanı (Workspace) sohbetinden sentezlenerek '{doc_title}' başlığıyla otomatik oluşturuldu.",
        extracted_text=parsed.get("extracted_text", ""),
        analysis_results=parsed.get("analysis_results", {}),
        status="generated"
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)
    return doc


