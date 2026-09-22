from typing import List
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.user import User
from app.models.workspace import Workspace
from app.schemas.code_studio import (
    WorkspaceCreateRequest, WorkspaceResponse, FileTreeNode,
    FileContentRequest, FileContentResponse, GitOperationRequest,
    TerminalExecRequest, TerminalExecResponse, CodeAssistRequest
)
from app.api.deps import get_current_user
from app.services.code_sandbox import code_sandbox_service
from app.services.llm_gateway import llm_gateway

router = APIRouter(prefix="/code", tags=["Claude Code Studio"])

@router.get("/workspaces", response_model=List[WorkspaceResponse])
async def list_workspaces(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Workspace).where(Workspace.user_id == user.id).order_by(Workspace.updated_at.desc())
    res = await db.execute(stmt)
    workspaces = res.scalars().all()
    if not workspaces:
        # Create default workspace for user
        ws = Workspace(
            user_id=user.id,
            name="Default Project",
            description="Varsayılan çalışma alanı",
            local_path=code_sandbox_service.get_workspace_dir(f"{user.id}_default")
        )
        db.add(ws)
        await db.commit()
        await db.refresh(ws)
        code_sandbox_service.create_workspace(ws.id)
        return [ws]
    return workspaces

@router.post("/workspaces", response_model=WorkspaceResponse)
async def create_workspace(
    req: WorkspaceCreateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    ws = Workspace(
        user_id=user.id,
        name=req.name,
        description=req.description,
        repo_url=req.repo_url,
        branch=req.branch or "main",
        local_path=""
    )
    db.add(ws)
    await db.commit()
    await db.refresh(ws)

    local_path = code_sandbox_service.create_workspace(ws.id, req.repo_url, req.branch or "main")
    ws.local_path = local_path
    await db.commit()
    await db.refresh(ws)
    return ws

@router.get("/workspaces/{workspace_id}/tree", response_model=List[FileTreeNode])
async def get_workspace_tree(
    workspace_id: str,
    user: User = Depends(get_current_user)
):
    tree = code_sandbox_service.get_file_tree(workspace_id)
    return tree

@router.get("/workspaces/{workspace_id}/file", response_model=FileContentResponse)
async def read_file(
    workspace_id: str,
    path: str,
    user: User = Depends(get_current_user)
):
    try:
        data = code_sandbox_service.read_file(workspace_id, path)
        return data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/workspaces/{workspace_id}/file", response_model=FileContentResponse)
async def write_file(
    workspace_id: str,
    req: FileContentRequest,
    user: User = Depends(get_current_user)
):
    try:
        data = code_sandbox_service.write_file(workspace_id, req.path, req.content)
        return data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/workspaces/{workspace_id}")
async def delete_workspace(
    workspace_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Workspace).where(Workspace.id == workspace_id, Workspace.user_id == user.id)
    res = await db.execute(stmt)
    ws = res.scalar_one_or_none()
    if not ws:
        raise HTTPException(status_code=404, detail="Çalışma alanı bulunamadı.")

    await db.delete(ws)
    await db.commit()
    code_sandbox_service.delete_workspace(workspace_id)
    return {"message": "Çalışma alanı başarıyla silindi.", "id": workspace_id}

@router.delete("/workspaces/{workspace_id}/file")
async def delete_file_or_folder(
    workspace_id: str,
    path: str,
    user: User = Depends(get_current_user)
):
    try:
        res = code_sandbox_service.delete_item(workspace_id, path)
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/workspaces/{workspace_id}/folder")
async def create_folder(
    workspace_id: str,
    req: FileContentRequest,
    user: User = Depends(get_current_user)
):
    try:
        res = code_sandbox_service.create_folder(workspace_id, req.path)
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/workspaces/{workspace_id}/template")
async def load_template(
    workspace_id: str,
    template_type: str,
    user: User = Depends(get_current_user)
):
    try:
        res = code_sandbox_service.load_template(workspace_id, template_type)
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/workspaces/{workspace_id}/git")
async def git_operation(
    workspace_id: str,
    req: GitOperationRequest,
    user: User = Depends(get_current_user)
):
    try:
        res = code_sandbox_service.execute_git(workspace_id, req.action, req.message, req.branch)
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/workspaces/{workspace_id}/terminal", response_model=TerminalExecResponse)
async def execute_terminal(
    workspace_id: str,
    req: TerminalExecRequest,
    user: User = Depends(get_current_user)
):
    res = await code_sandbox_service.execute_command(
        workspace_id=workspace_id,
        command=req.command,
        timeout_seconds=req.timeout_seconds or 30
    )
    return res

@router.post("/assist")
async def code_assist(
    req: CodeAssistRequest,
    user: User = Depends(get_current_user)
):
    """
    Claude Code AI assistant for editing, debugging, unit test generation and refactoring.
    """
    context_file = ""
    if req.file_path:
        try:
            f_data = code_sandbox_service.read_file(req.workspace_id, req.file_path)
            context_file = f"\nDosya Yolu: {req.file_path}\nİçerik:\n```\n{f_data['content']}\n```\n"
        except Exception:
            pass

    selected_code_snippet = f"Seçili Kod Parçası:\n```{req.selected_code}```" if req.selected_code else ""

    prompt = f"""Sen Claude Code seviyesinde uzman bir Kıdemli Yazılım Mühendisisin.
GÖREV: {req.instruction}
MOD: {req.mode}
{context_file}
{selected_code_snippet}

Doğrudan uygulanabilir, eksiksiz, üretim kalitesinde kod ve açıklama üret."""


    res = await llm_gateway.generate_response(
        messages=[
            {"role": "system", "content": "You are Claude Code, an expert autonomous coding agent."},
            {"role": "user", "content": prompt}
        ],
        model=req.model or "claude-3-7-sonnet-latest",
        temperature=0.2,
        max_tokens=4000
    )
    return {"result": res.get("content", ""), "model": req.model}
