from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel

class WorkspaceCreateRequest(BaseModel):
    name: str
    description: Optional[str] = None
    repo_url: Optional[str] = None
    branch: Optional[str] = "main"

class WorkspaceResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    repo_url: Optional[str] = None
    branch: str
    local_path: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class FileTreeNode(BaseModel):
    name: str
    path: str
    is_dir: bool
    size: Optional[int] = None
    children: Optional[List["FileTreeNode"]] = None

FileTreeNode.update_forward_refs()

class FileContentRequest(BaseModel):
    path: str
    content: str

class FileContentResponse(BaseModel):
    path: str
    content: str
    size: int
    modified_at: float

class GitOperationRequest(BaseModel):
    action: str  # status, commit, push, pull, branch, diff, log
    message: Optional[str] = None
    branch: Optional[str] = None

class TerminalExecRequest(BaseModel):
    command: str
    timeout_seconds: Optional[int] = 30

class TerminalExecResponse(BaseModel):
    command: str
    exit_code: int
    stdout: str
    stderr: str
    execution_time_ms: float

class CodeAssistRequest(BaseModel):
    workspace_id: str
    file_path: Optional[str] = None
    selected_code: Optional[str] = None
    instruction: str
    model: Optional[str] = "claude-3-7-sonnet-latest"
    mode: str = "edit"  # edit, explain, debug, test_generate, refactor
