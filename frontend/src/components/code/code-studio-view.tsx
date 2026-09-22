"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Folder,
  FolderOpen,
  FileCode,
  Terminal as TerminalIcon,
  Play,
  Save,
  GitBranch,
  GitCommit,
  RefreshCw,
  Bug,
  CheckCircle,
  FileText,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Send,
  Zap,
  Plus,
  Trash2,
  FolderPlus,
  FilePlus,
  Code2,
  Copy,
  Layers,
  Check,
  X,
  Boxes,
  HelpCircle
} from "lucide-react";
import { ApiClient } from "../../lib/api-client";
import { cn } from "../../lib/utils";

interface TreeNode {
  name: string;
  path: string;
  is_dir: boolean;
  size?: number | null;
  children?: TreeNode[];
}

// Helper to choose file icon based on extension
function getFileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "py") return <span className="text-[10px] font-bold text-blue-500 font-mono">PY</span>;
  if (ext === "js" || ext === "jsx") return <span className="text-[10px] font-bold text-amber-500 font-mono">JS</span>;
  if (ext === "ts" || ext === "tsx") return <span className="text-[10px] font-bold text-sky-500 font-mono">TS</span>;
  if (ext === "json") return <span className="text-[10px] font-bold text-emerald-500 font-mono">{}</span>;
  if (ext === "html") return <span className="text-[10px] font-bold text-orange-600 font-mono">&lt;&gt;</span>;
  if (ext === "css") return <span className="text-[10px] font-bold text-indigo-500 font-mono">#</span>;
  if (ext === "md") return <span className="text-[10px] font-bold text-slate-500 font-mono">MD</span>;
  return <FileCode className="w-3.5 h-3.5 text-slate-500 shrink-0" />;
}

export function CodeStudioView() {
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [activeWsId, setActiveWsId] = useState<string>("");
  const [fileTree, setFileTree] = useState<TreeNode[]>([]);
  const [selectedFilePath, setSelectedFilePath] = useState<string>("");
  const [fileContent, setFileContent] = useState<string>("");
  const [isModified, setIsModified] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // Terminal & Execution
  const [terminalOutput, setTerminalOutput] = useState<string>(
    "🚀 TanCoreLab AI & Claude Code IDE Hazır.\n$ Dosyalarınızı soldaki Gezginden açabilir, yeni dosya/klasör ekleyebilir ve terminalde çalıştırabilirsiniz.\n"
  );
  const [terminalInput, setTerminalInput] = useState("");
  const [termLoading, setTermLoading] = useState(false);

  // AI Assistant
  const [aiInstruction, setAiInstruction] = useState("");
  const [aiMode, setAiMode] = useState("edit");
  const [aiModel, setAiModel] = useState("claude-3-7-sonnet-latest");
  const [aiLoading, setAiLoading] = useState(false);
  const [lastAiResult, setLastAiResult] = useState<string | null>(null);

  // Modals & New Items
  const [showNewWorkspaceModal, setShowNewWorkspaceModal] = useState(false);
  const [newWsName, setNewWsName] = useState("");
  const [newWsRepo, setNewWsRepo] = useState("");
  const [isCreatingWs, setIsCreatingWs] = useState(false);

  const [isAddingFile, setIsAddingFile] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  // Resizable Panes
  const [explorerWidth, setExplorerWidth] = useState(260);
  const [editorHeightPercent, setEditorHeightPercent] = useState(55);
  const isResizingExplorerRef = useRef(false);
  const isResizingSplitRef = useRef(false);
  const terminalEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    loadWorkspaces();
  }, []);

  useEffect(() => {
    if (activeWsId) {
      loadTree(activeWsId);
    }
  }, [activeWsId]);

  // Keyboard shortcut Ctrl+S / Cmd+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSaveFile();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedFilePath, fileContent, activeWsId]);

  const loadWorkspaces = async () => {
    try {
      const data = await ApiClient.getWorkspaces();
      setWorkspaces(data || []);
      if (data && data.length > 0) {
        setActiveWsId(data[0].id);
      }
    } catch (e: any) {
      console.error("Workspace yükleme hatası:", e);
    }
  };

  const loadTree = async (wsId: string) => {
    try {
      const tree = await ApiClient.getWorkspaceTree(wsId);
      setFileTree(tree || []);
    } catch (e: any) {
      console.error("Ağaç yükleme hatası:", e);
    }
  };

  const handleCreateWorkspace = async () => {
    if (!newWsName.trim()) return;
    setIsCreatingWs(true);
    try {
      const res = await ApiClient.createWorkspace({
        name: newWsName.trim(),
        repo_url: newWsRepo.trim() || undefined,
        branch: "main"
      });
      setShowNewWorkspaceModal(false);
      setNewWsName("");
      setNewWsRepo("");
      await loadWorkspaces();
      if (res?.id) {
        setActiveWsId(res.id);
      }
    } catch (e: any) {
      alert("Proje oluşturulamadı: " + e.message);
    } finally {
      setIsCreatingWs(false);
    }
  };

  const handleDeleteWorkspace = async (wsId: string) => {
    if (!confirm("Bu çalışma alanını silmek istediğinize emin misiniz?")) return;
    try {
      await ApiClient.deleteWorkspace(wsId);
      await loadWorkspaces();
      setSelectedFilePath("");
      setFileContent("");
    } catch (e: any) {
      alert("Silinemedi: " + e.message);
    }
  };

  const handleOpenFile = async (path: string) => {
    try {
      const res = await ApiClient.readFile(activeWsId, path);
      setSelectedFilePath(path);
      setFileContent(res.content || "");
      setIsModified(false);
    } catch (e: any) {
      alert("Dosya açılamadı: " + e.message);
    }
  };

  const handleSaveFile = async () => {
    if (!selectedFilePath || !activeWsId) return;
    setIsSaving(true);
    try {
      await ApiClient.writeFile(activeWsId, selectedFilePath, fileContent);
      setIsModified(false);
      setTerminalOutput((prev) => prev + `[Sistem]: '${selectedFilePath}' kaydedildi.\n`);
    } catch (e: any) {
      alert("Kaydedilemedi: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateNewFile = async () => {
    if (!newFileName.trim() || !activeWsId) return;
    const cleanPath = newFileName.trim();
    try {
      await ApiClient.writeFile(activeWsId, cleanPath, "");
      setNewFileName("");
      setIsAddingFile(false);
      await loadTree(activeWsId);
      await handleOpenFile(cleanPath);
    } catch (e: any) {
      alert("Dosya oluşturulamadı: " + e.message);
    }
  };

  const handleCreateNewFolder = async () => {
    if (!newFolderName.trim() || !activeWsId) return;
    const cleanPath = newFolderName.trim();
    try {
      await ApiClient.createFolder(activeWsId, cleanPath);
      setNewFolderName("");
      setIsAddingFolder(false);
      await loadTree(activeWsId);
    } catch (e: any) {
      alert("Klasör oluşturulamadı: " + e.message);
    }
  };

  const handleDeleteItem = async (path: string, isDir: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`'${path}' ${isDir ? "klasörünü ve tüm içeriğini" : "dosyasını"} silmek istediğinize emin misiniz?`)) {
      return;
    }
    try {
      await ApiClient.deleteFile(activeWsId, path);
      if (selectedFilePath === path) {
        setSelectedFilePath("");
        setFileContent("");
      }
      await loadTree(activeWsId);
    } catch (e: any) {
      alert("Silinemedi: " + e.message);
    }
  };

  const handleLoadTemplate = async (templateType: string) => {
    if (!activeWsId) return;
    try {
      await ApiClient.loadTemplate(activeWsId, templateType);
      await loadTree(activeWsId);
      setTerminalOutput((prev) => prev + `[Şablon]: '${templateType}' başlangıç dosyaları başarıyla yüklendi.\n`);
      if (templateType === "python") handleOpenFile("main.py");
      else if (templateType === "web") handleOpenFile("index.html");
      else if (templateType === "node") handleOpenFile("index.js");
    } catch (e: any) {
      alert("Şablon yüklenemedi: " + e.message);
    }
  };

  const handleRunCurrentFile = async () => {
    if (!selectedFilePath || !activeWsId) return;
    if (isModified) {
      await handleSaveFile();
    }

    let cmd = "";
    if (selectedFilePath.endsWith(".py")) {
      cmd = `python "${selectedFilePath}"`;
    } else if (selectedFilePath.endsWith(".js")) {
      cmd = `node "${selectedFilePath}"`;
    } else if (selectedFilePath.endsWith(".sh")) {
      cmd = `bash "${selectedFilePath}"`;
    } else {
      cmd = `cat "${selectedFilePath}"`;
    }

    setTerminalInput("");
    setTermLoading(true);
    setTerminalOutput((prev) => prev + `\n$ ${cmd}\n`);

    try {
      const res = await ApiClient.executeTerminal(activeWsId, cmd);
      setTerminalOutput((prev) => prev + (res.stdout || "") + (res.stderr || "") + `\n[Çıkış Kodu: ${res.exit_code} (${res.execution_time_ms}ms)]\n`);
    } catch (e: any) {
      setTerminalOutput((prev) => prev + `Hata: ${e.message}\n`);
    } finally {
      setTermLoading(false);
    }
  };

  const handleRunTerminal = async (customCmd?: string) => {
    const cmd = customCmd || terminalInput.trim();
    if (!cmd || !activeWsId) return;
    setTerminalInput("");
    setTermLoading(true);
    setTerminalOutput((prev) => prev + `\n$ ${cmd}\n`);

    try {
      const res = await ApiClient.executeTerminal(activeWsId, cmd);
      setTerminalOutput((prev) => prev + (res.stdout || "") + (res.stderr || "") + `\n[Çıkış Kodu: ${res.exit_code} (${res.execution_time_ms}ms)]\n`);
    } catch (e: any) {
      setTerminalOutput((prev) => prev + `Hata: ${e.message}\n`);
    } finally {
      setTermLoading(false);
    }
  };

  const handleGitAction = async (action: string) => {
    if (!activeWsId) return;
    let msg: string | undefined = undefined;
    if (action === "commit") {
      const promptMsg = prompt("Commit mesajınızı girin:", "feat: update codebase");
      if (!promptMsg) return;
      msg = promptMsg;
    }

    try {
      const res = await ApiClient.executeGit(activeWsId, { action, message: msg });
      setTerminalOutput((prev) => prev + `\n[Git ${action.toUpperCase()}]:\n${res.stdout || res.stderr || "Tamamlandı."}\n`);
    } catch (e: any) {
      setTerminalOutput((prev) => prev + `Git Hatası: ${e.message}\n`);
    }
  };

  const handleClaudeAssist = async (presetPrompt?: string) => {
    const instruction = presetPrompt || aiInstruction;
    if (!instruction.trim() || !activeWsId) return;
    setAiLoading(true);
    setTerminalOutput((prev) => prev + `\n[TanCoreLab AI (${aiModel})]: Görev İşleniyor: "${instruction}"...\n`);

    try {
      const res = await ApiClient.codeAssist({
        workspace_id: activeWsId,
        file_path: selectedFilePath || undefined,
        selected_code: undefined,
        instruction: instruction,
        mode: aiMode,
        model: aiModel,
      });

      const aiText = res.result || "";
      setLastAiResult(aiText);
      setTerminalOutput((prev) => prev + `\n[TanCoreLab AI Yanıtı]:\n${aiText}\n-----------------------------------\n`);

      // If AI mode is edit and we have active file, check if code block can be extracted
      if (aiMode === "edit" && aiText.includes("```")) {
        const matches = aiText.match(/```(?:[a-zA-Z]*\n)?([\s\S]*?)```/);
        if (matches && matches[1]) {
          const suggestedCode = matches[1];
          if (confirm("AI tarafından üretilen kodu editöre aktarmak ister misiniz?")) {
            setFileContent(suggestedCode);
            setIsModified(true);
          }
        }
      }
    } catch (e: any) {
      setTerminalOutput((prev) => prev + `AI Asistan Hatası: ${e.message}\n`);
    } finally {
      setAiLoading(false);
      setAiInstruction("");
    }
  };

  const copyEditorContent = () => {
    navigator.clipboard.writeText(fileContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Resizing handlers
  const startResizingExplorer = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizingExplorerRef.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const handleMouseMove = (event: MouseEvent) => {
      if (!isResizingExplorerRef.current) return;
      const newWidth = Math.max(180, Math.min(480, event.clientX - 240));
      setExplorerWidth(newWidth);
    };

    const handleMouseUp = () => {
      isResizingExplorerRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const startResizingSplit = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizingSplitRef.current = true;
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";

    const handleMouseMove = (event: MouseEvent) => {
      if (!isResizingSplitRef.current) return;
      const containerHeight = window.innerHeight - 56;
      const percent = Math.max(20, Math.min(80, (event.clientY / containerHeight) * 100));
      setEditorHeightPercent(percent);
    };

    const handleMouseUp = () => {
      isResizingSplitRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  // Recursive Tree Item Component
  const TreeItem = ({ item, depth = 0 }: { item: TreeNode; depth?: number }) => {
    const [isOpen, setIsOpen] = useState(true);

    if (item.is_dir) {
      return (
        <div>
          <div
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center justify-between px-2 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-slate-100 text-slate-700 transition-colors group select-none"
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
          >
            <div className="flex items-center space-x-1.5 min-w-0">
              {isOpen ? (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              )}
              {isOpen ? (
                <FolderOpen className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              ) : (
                <Folder className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              )}
              <span className="font-semibold truncate">{item.name}</span>
            </div>
            <button
              onClick={(e) => handleDeleteItem(item.path, true, e)}
              className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-600 text-slate-400 rounded transition-opacity"
              title="Klasörü Sil"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
          {isOpen && item.children && (
            <div className="space-y-0.5">
              {item.children.map((child) => (
                <TreeItem key={child.path} item={child} depth={depth + 1} />
              ))}
            </div>
          )}
        </div>
      );
    }

    const isSelected = selectedFilePath === item.path;
    return (
      <div
        onClick={() => handleOpenFile(item.path)}
        className={cn(
          "flex items-center justify-between px-2 py-1.5 rounded-lg text-xs cursor-pointer transition-colors group select-none",
          isSelected
            ? "bg-orange-50 text-orange-700 font-bold border border-orange-200 shadow-xs"
            : "hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-transparent"
        )}
        style={{ paddingLeft: `${depth * 12 + 16}px` }}
      >
        <div className="flex items-center space-x-1.5 min-w-0">
          {getFileIcon(item.name)}
          <span className="truncate">{item.name}</span>
        </div>
        <button
          onClick={(e) => handleDeleteItem(item.path, false, e)}
          className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-600 text-slate-400 rounded transition-opacity"
          title="Dosyayı Sil"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    );
  };

  const lineCount = fileContent ? fileContent.split("\n").length : 1;

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8F9FB] text-slate-800">
      {/* 1. Workspace & File Explorer Sidebar */}
      <div
        style={{ width: `${explorerWidth}px` }}
        className="border-r border-slate-200 bg-white flex flex-col justify-between shrink-0 relative select-none shadow-xs"
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Workspace Switcher Header */}
          <div className="p-2.5 border-b border-slate-100 bg-slate-50/70 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider flex items-center space-x-1">
                <Boxes className="w-3 h-3 text-orange-600" />
                <span>Çalışma Alanı</span>
              </span>
              <button
                onClick={() => setShowNewWorkspaceModal(true)}
                className="p-1 hover:bg-orange-50 text-orange-600 rounded text-xs flex items-center space-x-0.5 font-bold transition-colors"
                title="Yeni Çalışma Alanı"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="text-[10px]">Yeni</span>
              </button>
            </div>

            <div className="flex items-center space-x-1">
              <select
                value={activeWsId}
                onChange={(e) => setActiveWsId(e.target.value)}
                className="flex-1 text-xs font-semibold bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-800 focus:outline-none focus:border-orange-500 truncate"
              >
                {workspaces.map((ws) => (
                  <option key={ws.id} value={ws.id}>
                    {ws.name}
                  </option>
                ))}
              </select>
              {workspaces.length > 1 && (
                <button
                  onClick={() => handleDeleteWorkspace(activeWsId)}
                  className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50"
                  title="Aktif Çalışma Alanını Sil"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Gezgin Header & Quick Action Buttons */}
          <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between bg-white">
            <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
              <Folder className="w-3.5 h-3.5 text-orange-600" />
              <span>Gezgin</span>
            </span>

            <div className="flex items-center space-x-0.5">
              <button
                onClick={() => {
                  setIsAddingFile(!isAddingFile);
                  setIsAddingFolder(false);
                }}
                className={cn(
                  "p-1 rounded transition-colors",
                  isAddingFile ? "bg-orange-100 text-orange-700" : "hover:bg-slate-100 text-slate-500 hover:text-slate-800"
                )}
                title="Yeni Dosya Ekle"
              >
                <FilePlus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  setIsAddingFolder(!isAddingFolder);
                  setIsAddingFile(false);
                }}
                className={cn(
                  "p-1 rounded transition-colors",
                  isAddingFolder ? "bg-orange-100 text-orange-700" : "hover:bg-slate-100 text-slate-500 hover:text-slate-800"
                )}
                title="Yeni Klasör Ekle"
              >
                <FolderPlus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => activeWsId && loadTree(activeWsId)}
                className="p-1 hover:bg-orange-50 rounded text-slate-400 hover:text-orange-600 transition-colors"
                title="Yenile"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Inline Add File Input */}
          {isAddingFile && (
            <div className="p-2 border-b border-orange-100 bg-orange-50/50 flex items-center space-x-1">
              <input
                type="text"
                autoFocus
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateNewFile();
                  if (e.key === "Escape") setIsAddingFile(false);
                }}
                placeholder="Dosya adı (örn: app.py)..."
                className="flex-1 text-xs px-2 py-1 bg-white border border-orange-300 rounded focus:outline-none text-slate-800"
              />
              <button
                onClick={handleCreateNewFile}
                className="p-1 bg-orange-600 hover:bg-orange-500 text-white rounded"
                title="Oluştur"
              >
                <Check className="w-3 h-3" />
              </button>
              <button
                onClick={() => setIsAddingFile(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Inline Add Folder Input */}
          {isAddingFolder && (
            <div className="p-2 border-b border-orange-100 bg-orange-50/50 flex items-center space-x-1">
              <input
                type="text"
                autoFocus
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateNewFolder();
                  if (e.key === "Escape") setIsAddingFolder(false);
                }}
                placeholder="Klasör adı (örn: src)..."
                className="flex-1 text-xs px-2 py-1 bg-white border border-orange-300 rounded focus:outline-none text-slate-800"
              />
              <button
                onClick={handleCreateNewFolder}
                className="p-1 bg-orange-600 hover:bg-orange-500 text-white rounded"
                title="Oluştur"
              >
                <Check className="w-3 h-3" />
              </button>
              <button
                onClick={() => setIsAddingFolder(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Starter Template Bar */}
          <div className="px-2.5 py-1.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="font-semibold text-[10px] uppercase">Şablon Yükle:</span>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => handleLoadTemplate("python")}
                className="px-1.5 py-0.5 rounded bg-white hover:bg-orange-50 hover:text-orange-600 border border-slate-200 text-[10px] font-bold"
              >
                Python
              </button>
              <button
                onClick={() => handleLoadTemplate("web")}
                className="px-1.5 py-0.5 rounded bg-white hover:bg-orange-50 hover:text-orange-600 border border-slate-200 text-[10px] font-bold"
              >
                Web
              </button>
              <button
                onClick={() => handleLoadTemplate("node")}
                className="px-1.5 py-0.5 rounded bg-white hover:bg-orange-50 hover:text-orange-600 border border-slate-200 text-[10px] font-bold"
              >
                Node
              </button>
            </div>
          </div>

          {/* Tree items */}
          <div className="flex-1 p-2 space-y-0.5 overflow-y-auto">
            {fileTree.map((item) => (
              <TreeItem key={item.path} item={item} />
            ))}
            {fileTree.length === 0 && (
              <div className="p-4 text-center text-xs text-slate-400 italic">
                Dosya yok. Yukarıdan '+ Dosya' veya 'Şablon' ile başlayın.
              </div>
            )}
          </div>

          {/* Quick Git Control Bar */}
          <div className="p-2.5 border-t border-slate-100 bg-slate-50/80 space-y-2">
            <div className="text-[10px] uppercase font-bold text-slate-500 flex items-center justify-between">
              <span className="flex items-center space-x-1">
                <GitBranch className="w-3 h-3 text-orange-600" />
                <span>Git Kontrol</span>
              </span>
              <span className="text-[9px] font-mono text-slate-400">main</span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              <button
                onClick={() => handleGitAction("status")}
                className="px-2 py-1 bg-white hover:bg-orange-50 border border-slate-200 text-[10px] font-bold rounded-lg text-slate-700 transition-colors shadow-xs"
              >
                Status
              </button>
              <button
                onClick={() => handleGitAction("diff")}
                className="px-2 py-1 bg-white hover:bg-orange-50 border border-slate-200 text-[10px] font-bold rounded-lg text-slate-700 transition-colors shadow-xs"
              >
                Diff
              </button>
              <button
                onClick={() => handleGitAction("commit")}
                className="px-2 py-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-[10px] font-bold rounded-lg transition-all shadow-xs"
              >
                Commit
              </button>
            </div>
          </div>
        </div>

        {/* Explorer Resizer Handle on Right Edge */}
        <div
          onMouseDown={startResizingExplorer}
          title="Dosya Gezgini Genişliğini Ayarlayın"
          className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-orange-500/40 active:bg-orange-600 transition-colors z-30 group flex items-center justify-center"
        >
          <div className="w-0.5 h-8 bg-slate-300 group-hover:bg-orange-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      {/* 2. Center & Right Split: Editor, Terminal & AI Task Bar */}
      <div className="flex-1 flex flex-col h-screen min-w-0">
        {/* Editor Tab Header */}
        <div className="h-11 border-b border-slate-200 bg-white px-4 flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-2 min-w-0">
            <span className="text-xs font-mono font-bold text-slate-800 flex items-center space-x-1.5 truncate">
              <FileText className="w-3.5 h-3.5 text-orange-600 shrink-0" />
              <span className="truncate">{selectedFilePath || "Dosya seçilmedi"}</span>
            </span>
            {isModified && (
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse shrink-0" title="Kaydedilmemiş değişiklikler" />
            )}
          </div>

          <div className="flex items-center space-x-2">
            {selectedFilePath && (
              <>
                <button
                  onClick={copyEditorContent}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-semibold flex items-center space-x-1 transition-colors"
                  title="Kodu Kopyala"
                >
                  {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                  <span className="text-[11px]">{copied ? "Kopyalandı" : "Kopyala"}</span>
                </button>

                <button
                  onClick={handleRunCurrentFile}
                  className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold flex items-center space-x-1 transition-all shadow-xs"
                  title="Bu dosyayı terminalde çalıştır"
                >
                  <Play className="w-3 h-3 text-emerald-400 fill-emerald-400" />
                  <span>Çalıştır</span>
                </button>

                <button
                  onClick={handleSaveFile}
                  disabled={isSaving}
                  className="px-3 py-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-xs font-bold flex items-center space-x-1 shadow-sm shadow-orange-500/20 transition-all"
                  title="Ctrl + S"
                >
                  <Save className="w-3 h-3" />
                  <span>{isSaving ? "Kaydediliyor..." : "Kaydet"}</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Vertical Split Container */}
        <div className="flex-1 flex flex-col min-h-0 relative">
          {/* Top Half: Code Editor */}
          <div
            style={{ height: `${editorHeightPercent}%` }}
            className="relative bg-white overflow-hidden flex min-h-0"
          >
            {selectedFilePath ? (
              <div className="w-full h-full flex overflow-hidden">
                {/* Line Numbers Gutter */}
                <div className="w-10 bg-slate-50/80 border-r border-slate-100 py-4 select-none font-mono text-[11px] text-slate-400 text-right pr-2 overflow-hidden shrink-0 leading-relaxed">
                  {Array.from({ length: Math.max(1, lineCount) }).map((_, i) => (
                    <div key={i}>{i + 1}</div>
                  ))}
                </div>

                {/* Actual Editor TextArea */}
                <textarea
                  value={fileContent}
                  onChange={(e) => {
                    setFileContent(e.target.value);
                    setIsModified(true);
                  }}
                  className="flex-1 h-full p-4 font-mono text-xs sm:text-sm bg-white text-slate-900 resize-none focus:outline-none leading-relaxed selection:bg-orange-500 selection:text-white"
                  spellCheck={false}
                  placeholder="// TanCoreLab Kodlama Stüdyosu: Kodunuzu buraya yazın..."
                />
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-slate-50/50">
                <div className="w-14 h-14 rounded-2xl bg-orange-100/70 border border-orange-200 flex items-center justify-center text-orange-600 mb-3 shadow-xs">
                  <Code2 className="w-7 h-7" />
                </div>
                <h3 className="text-sm font-bold text-slate-800 mb-1">Kod Editörü Hazır</h3>
                <p className="text-xs text-slate-500 max-w-sm mb-4">
                  Sol taraftaki gezginden bir dosya seçin veya hızlı bir başlangıç şablonu yükleyin.
                </p>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleLoadTemplate("python")}
                    className="px-3 py-1.5 bg-white hover:bg-orange-50 border border-slate-200 text-xs font-bold text-slate-700 rounded-xl transition-all shadow-xs"
                  >
                    🐍 Python Projesi Başlat
                  </button>
                  <button
                    onClick={() => handleLoadTemplate("web")}
                    className="px-3 py-1.5 bg-white hover:bg-orange-50 border border-slate-200 text-xs font-bold text-slate-700 rounded-xl transition-all shadow-xs"
                  >
                    🌐 Web Projesi Başlat
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Draggable Row Resizer Splitter */}
          <div
            onMouseDown={startResizingSplit}
            title="Editör ve Terminal Yüksekliğini Ayarlayın"
            className="h-2 bg-slate-100 hover:bg-orange-400 border-y border-slate-200 cursor-row-resize flex items-center justify-center transition-colors z-20 group"
          >
            <div className="w-8 h-0.5 bg-slate-300 group-hover:bg-white rounded-full" />
          </div>

          {/* Bottom Half: TanCoreLab Light Terminal & AI Task Bar */}
          <div
            style={{ height: `${100 - editorHeightPercent}%` }}
            className="bg-[#F8F9FB] flex flex-col min-h-0 text-slate-800 border-t border-slate-200"
          >
            {/* Claude Code Prompt Bar */}
            <div className="p-2 border-b border-slate-200 bg-white flex flex-col space-y-1.5 shadow-xs">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0 text-orange-600">
                  <Sparkles className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={aiInstruction}
                  onChange={(e) => setAiInstruction(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleClaudeAssist()}
                  placeholder="AI Asistana talimat ver: 'Hataları ayıkla', 'Birim testler üret', 'Refactor et'..."
                  className="flex-1 bg-slate-50 border border-slate-200 text-xs px-3.5 py-1.5 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
                />
                <select
                  value={aiMode}
                  onChange={(e) => setAiMode(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-orange-500"
                >
                  <option value="edit">Düzenle / Kod Üret</option>
                  <option value="debug">Hata Ayıkla</option>
                  <option value="test_generate">Birim Test Üret</option>
                  <option value="explain">Kodu Açıkla</option>
                </select>
                <select
                  value={aiModel}
                  onChange={(e) => setAiModel(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-orange-500 hidden sm:block"
                >
                  <option value="claude-3-7-sonnet-latest">Claude 3.7 Sonnet</option>
                  <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                  <option value="gpt-4o">GPT-4o</option>
                </select>
                <button
                  onClick={() => handleClaudeAssist()}
                  disabled={aiLoading || !aiInstruction.trim()}
                  className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 disabled:opacity-40 text-white text-xs font-bold flex items-center space-x-1 transition-all shadow-sm shadow-orange-500/20"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{aiLoading ? "İşleniyor..." : "Uygula"}</span>
                </button>
              </div>

              {/* Quick AI Chips */}
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-0.5 text-[11px]">
                <span className="text-[10px] text-slate-400 font-bold uppercase shrink-0">Hızlı İstekler:</span>
                <button
                  onClick={() => handleClaudeAssist("Bu koddaki olası hataları ve güvenlik açıklarını ayıkla")}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-orange-50 hover:text-orange-700 rounded-full text-slate-600 text-[10px] transition-colors shrink-0"
                >
                  🐛 Hataları Ayıkla
                </button>
                <button
                  onClick={() => handleClaudeAssist("Bu dosya için kapsamlı birim testler (pytest/jest) oluştur")}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-orange-50 hover:text-orange-700 rounded-full text-slate-600 text-[10px] transition-colors shrink-0"
                >
                  🧪 Unit Test Yaz
                </button>
                <button
                  onClick={() => handleClaudeAssist("Kodu temiz kod (Clean Code) standartlarına göre optimize et ve refactor yap")}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-orange-50 hover:text-orange-700 rounded-full text-slate-600 text-[10px] transition-colors shrink-0"
                >
                  ⚡ Refactor & Optimize
                </button>
                <button
                  onClick={() => handleClaudeAssist("Bu koda detaylı docstring ve satır içi açıklamalar ekle")}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-orange-50 hover:text-orange-700 rounded-full text-slate-600 text-[10px] transition-colors shrink-0"
                >
                  📝 Açıklama Ekle
                </button>
              </div>
            </div>

            {/* Terminal Console */}
            <div className="flex-1 p-3 font-mono text-xs overflow-y-auto text-slate-800 bg-[#F8F9FB] whitespace-pre-wrap leading-relaxed select-text">
              {terminalOutput}
              <div ref={terminalEndRef} />
            </div>

            {/* Terminal Command Input & Quick Chips */}
            <div className="p-2 border-t border-slate-200 bg-white flex flex-col space-y-1.5 shadow-xs">
              <div className="flex items-center space-x-1 text-[11px] overflow-x-auto">
                <span className="text-[10px] text-slate-400 font-bold uppercase shrink-0">Hızlı Komutlar:</span>
                <button
                  onClick={() => handleRunTerminal("python main.py")}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded font-mono text-[10px] text-slate-700 shrink-0"
                >
                  python main.py
                </button>
                <button
                  onClick={() => handleRunTerminal("node index.js")}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded font-mono text-[10px] text-slate-700 shrink-0"
                >
                  node index.js
                </button>
                <button
                  onClick={() => handleRunTerminal("ls -la")}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded font-mono text-[10px] text-slate-700 shrink-0"
                >
                  ls -la
                </button>
                <button
                  onClick={() => handleRunTerminal("git status")}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded font-mono text-[10px] text-slate-700 shrink-0"
                >
                  git status
                </button>
                <button
                  onClick={() => setTerminalOutput("")}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded font-mono text-[10px] text-slate-500 hover:text-slate-800 shrink-0 ml-auto"
                >
                  Temizle
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-bold text-orange-600 pl-1">$</span>
                <input
                  type="text"
                  value={terminalInput}
                  onChange={(e) => setTerminalInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleRunTerminal()}
                  placeholder="Terminal komutu çalıştır (örn: ls -la, python main.py, pip install requests)..."
                  className="flex-1 bg-transparent text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none"
                />
                <button
                  onClick={() => handleRunTerminal()}
                  disabled={termLoading}
                  className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-orange-50 hover:text-orange-700 border border-slate-200 text-slate-700 text-xs font-mono font-bold transition-colors"
                >
                  {termLoading ? "Çalışıyor..." : "Çalıştır"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New Workspace Modal */}
      {showNewWorkspaceModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Boxes className="w-4 h-4 text-orange-600" />
                <span>Yeni Çalışma Alanı (Workspace)</span>
              </h3>
              <button
                onClick={() => setShowNewWorkspaceModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Proje Adı</label>
                <input
                  type="text"
                  value={newWsName}
                  onChange={(e) => setNewWsName(e.target.value)}
                  placeholder="örn: AI Web Scraper, Finans API..."
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Git Repo URL (Opsiyonel)</label>
                <input
                  type="text"
                  value={newWsRepo}
                  onChange={(e) => setNewWsRepo(e.target.value)}
                  placeholder="https://github.com/kullanici/repo.git"
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 focus:bg-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowNewWorkspaceModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleCreateWorkspace}
                disabled={isCreatingWs || !newWsName.trim()}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
              >
                {isCreatingWs ? "Oluşturuluyor..." : "Oluştur"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
