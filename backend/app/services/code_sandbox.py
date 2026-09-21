import os
import shutil
import subprocess
import asyncio
import time
from typing import List, Dict, Any, Optional
from app.core.config import settings

class CodeSandboxService:
    """
    Claude Code Development Environment Sandbox:
    - Workspace isolation & file tree exploration
    - File reading / editing
    - Git commands (clone, status, commit, diff, branch, log)
    - Subprocess terminal execution with timeout and security boundaries
    """

    def get_workspace_dir(self, workspace_id: str) -> str:
        path = os.path.abspath(os.path.join(settings.SANDBOX_STORAGE_DIR, workspace_id))
        os.makedirs(path, exist_ok=True)
        return path

    def create_workspace(self, workspace_id: str, repo_url: Optional[str] = None, branch: str = "main") -> str:
        ws_dir = self.get_workspace_dir(workspace_id)
        if repo_url:
            # Clone repo
            try:
                subprocess.run(
                    ["git", "clone", "--branch", branch, repo_url, "."],
                    cwd=ws_dir,
                    check=True,
                    capture_output=True,
                    text=True
                )
            except Exception as e:
                # If clone fails, initialize a git repo
                subprocess.run(["git", "init"], cwd=ws_dir, capture_output=True)
        else:
            # Initialize empty project structure with starter template
            subprocess.run(["git", "init"], cwd=ws_dir, capture_output=True)
            readme_path = os.path.join(ws_dir, "README.md")
            if not os.path.exists(readme_path):
                with open(readme_path, "w", encoding="utf-8") as f:
                    f.write(f"# Workspace {workspace_id}\n\nNexusAI Claude Code Environment.")

        return ws_dir

    def get_file_tree(self, workspace_id: str, subpath: str = "") -> List[Dict[str, Any]]:
        ws_dir = self.get_workspace_dir(workspace_id)
        target_dir = os.path.abspath(os.path.join(ws_dir, subpath))

        # Security check: prevent directory traversal
        if not target_dir.startswith(ws_dir):
            target_dir = ws_dir

        items = []
        try:
            entries = sorted(os.scandir(target_dir), key=lambda e: (not e.is_dir(), e.name.lower()))
            for entry in entries:
                # Ignore .git folder in general tree listing
                if entry.name == ".git":
                    continue
                rel_path = os.path.relpath(entry.path, ws_dir).replace("\\", "/")
                is_dir = entry.is_dir()
                size = None if is_dir else entry.stat().st_size
                node = {
                    "name": entry.name,
                    "path": rel_path,
                    "is_dir": is_dir,
                    "size": size,
                    "children": self.get_file_tree(workspace_id, rel_path) if is_dir else None
                }
                items.append(node)
        except Exception as e:
            print(f"[CodeSandbox] Error building file tree: {e}")

        return items

    def read_file(self, workspace_id: str, file_path: str) -> Dict[str, Any]:
        ws_dir = self.get_workspace_dir(workspace_id)
        target_file = os.path.abspath(os.path.join(ws_dir, file_path))

        if not target_file.startswith(ws_dir):
            raise ValueError("Güvenlik hatası: Çalışma alanı dışına erişilemez.")

        if not os.path.isfile(target_file):
            raise FileNotFoundError(f"Dosya bulunamadı: {file_path}")

        stat = os.stat(target_file)
        with open(target_file, "r", encoding="utf-8", errors="replace") as f:
            content = f.read()

        return {
            "path": file_path,
            "content": content,
            "size": stat.st_size,
            "modified_at": stat.st_mtime
        }

    def write_file(self, workspace_id: str, file_path: str, content: str) -> Dict[str, Any]:
        ws_dir = self.get_workspace_dir(workspace_id)
        target_file = os.path.abspath(os.path.join(ws_dir, file_path))

        if not target_file.startswith(ws_dir):
            raise ValueError("Güvenlik hatası: Çalışma alanı dışına yazılamaz.")

        os.makedirs(os.path.dirname(target_file), exist_ok=True)
        with open(target_file, "w", encoding="utf-8") as f:
            f.write(content)

        stat = os.stat(target_file)
        return {
            "path": file_path,
            "content": content,
            "size": stat.st_size,
            "modified_at": stat.st_mtime
        }

    def execute_git(self, workspace_id: str, action: str, message: Optional[str] = None, branch: Optional[str] = None) -> Dict[str, Any]:
        ws_dir = self.get_workspace_dir(workspace_id)
        cmd = ["git"]

        if action == "status":
            cmd.extend(["status", "--short", "--branch"])
        elif action == "commit":
            subprocess.run(["git", "add", "."], cwd=ws_dir, capture_output=True)
            commit_msg = message or "NexusAI Claude Code Auto Commit"
            cmd.extend(["commit", "-m", commit_msg])
        elif action == "diff":
            cmd.extend(["diff", "HEAD"])
        elif action == "branch":
            if branch:
                cmd.extend(["checkout", "-b", branch])
            else:
                cmd.extend(["branch", "-a"])
        elif action == "log":
            cmd.extend(["log", "-n", "10", "--oneline"])
        else:
            raise ValueError(f"Desteklenmeyen git eylemi: {action}")

        result = subprocess.run(cmd, cwd=ws_dir, capture_output=True, text=True)
        return {
            "action": action,
            "exit_code": result.returncode,
            "stdout": result.stdout,
            "stderr": result.stderr
        }

    async def execute_command(self, workspace_id: str, command: str, timeout_seconds: int = 30) -> Dict[str, Any]:
        """
        Execute terminal command in workspace asynchronously with timeout.
        """
        ws_dir = self.get_workspace_dir(workspace_id)
        start_time = time.time()

        try:
            proc = await asyncio.create_subprocess_shell(
                command,
                cwd=ws_dir,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )

            try:
                stdout_data, stderr_data = await asyncio.wait_for(proc.communicate(), timeout=float(timeout_seconds))
                stdout = stdout_data.decode("utf-8", errors="replace")
                stderr = stderr_data.decode("utf-8", errors="replace")
                exit_code = proc.returncode or 0
            except asyncio.TimeoutError:
                proc.kill()
                stdout = ""
                stderr = f"Komut zaman aşımına uğradı ({timeout_seconds}s)."
                exit_code = 124
        except Exception as e:
            stdout = ""
            stderr = str(e)
            exit_code = 1

        exec_time = round((time.time() - start_time) * 1000, 2)

        return {
            "command": command,
            "exit_code": exit_code,
            "stdout": stdout,
            "stderr": stderr,
            "execution_time_ms": exec_time
        }

code_sandbox_service = CodeSandboxService()
