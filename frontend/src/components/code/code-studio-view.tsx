"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Folder,
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
  Zap
} from "lucide-react";
import { ApiClient } from "../../lib/api-client";
import { cn } from "../../lib/utils";

export function CodeStudioView() {
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [activeWsId, setActiveWsId] = useState<string>("");
  const [fileTree, setFileTree] = useState<any[]>([]);
  const [selectedFilePath, setSelectedFilePath] = useState<string>("");
  const [fileContent, setFileContent] = useState<string>("");
  const [isModified, setIsModified] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState<string>("$ TanCoreLab Claude Code IDE Hazır.\n$ Dosyalarınızı soldaki panelden açabilir veya terminal komutları çalıştırabilirsiniz.\n");
  const [terminalInput, setTerminalInput] = useState("");
  const [termLoading, setTermLoading] = useState(false);
  const [aiInstruction, setAiInstruction] = useState("");
  const [aiMode, setAiMode] = useState("edit");
  const [aiLoading, setAiLoading] = useState(false);
  const [gitStatus, setGitStatus] = useState<string>("");

  // Resizable Panes
  const [explorerWidth, setExplorerWidth] = useState(250);
  const [editorHeightPercent, setEditorHeightPercent] = useState(55);
  const isResizingExplorerRef = useRef(false);
  const isResizingSplitRef = useRef(false);

  useEffect(() => {
    loadWorkspaces();
  }, []);

  useEffect(() => {
    if (activeWsId) {
      loadTree(activeWsId);
    }
  }, [activeWsId]);

  const startResizingExplorer = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizingExplorerRef.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const handleMouseMove = (event: MouseEvent) => {
      if (!isResizingExplorerRef.current) return;
      const newWidth = Math.max(160, Math.min(420, event.clientX - 240));
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
      const percent = Math.max(25, Math.min(80, (event.clientY / containerHeight) * 100));
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

  const loadWorkspaces = async () => {
    try {
      const data = await ApiClient.getWorkspaces();
      setWorkspaces(data);
      if (data.length > 0) {
        setActiveWsId(data[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadTree = async (wsId: string) => {
    try {
      const tree = await ApiClient.getWorkspaceTree(wsId);
      setFileTree(tree);
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenFile = async (path: string) => {
    try {
      const res = await ApiClient.readFile(activeWsId, path);
      setSelectedFilePath(path);
      setFileContent(res.content || "");
      setIsModified(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveFile = async () => {
    if (!selectedFilePath || !activeWsId) return;
    try {
      await ApiClient.writeFile(activeWsId, selectedFilePath, fileContent);
      setIsModified(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRunTerminal = async () => {
    if (!terminalInput.trim() || !activeWsId) return;
    const cmd = terminalInput.trim();
    setTerminalInput("");
    setTermLoading(true);
    setTerminalOutput((prev) => prev + `\n$ ${cmd}\n`);

    try {
      const res = await ApiClient.executeTerminal(activeWsId, cmd);
      setTerminalOutput((prev) => prev + (res.stdout || "") + (res.stderr || "") + "\n");
    } catch (e: any) {
      setTerminalOutput((prev) => prev + `Hata: ${e.message}\n`);
    } finally {
      setTermLoading(false);
    }
  };

  const handleGitAction = async (action: string) => {
    if (!activeWsId) return;
    try {
      const res = await ApiClient.executeGit(activeWsId, { action, message: "Workspace sync" });
      setGitStatus(res.output || "İşlem başarılı.");
      setTerminalOutput((prev) => prev + `\n[Git ${action}]:\n${res.output || "Tamamlandı"}\n`);
    } catch (e: any) {
      setTerminalOutput((prev) => prev + `Git Hatası: ${e.message}\n`);
    }
  };

  const handleClaudeAssist = async () => {
    if (!aiInstruction.trim() || !activeWsId) return;
    setAiLoading(true);
    setTerminalOutput((prev) => prev + `\n[TanCoreLab AI İşleniyor]: ${aiInstruction}\n`);

    try {
      const res = await ApiClient.codeAssist({
        workspace_id: activeWsId,
        path: selectedFilePath,
        instruction: aiInstruction,
        mode: aiMode,
        model: "claude-3-7-sonnet-latest",
      });
      setTerminalOutput((prev) => prev + `\n[TanCoreLab AI Çıktısı]:\n${res.result}\n`);
    } catch (e: any) {
      setTerminalOutput((prev) => prev + `AI Asistan Hatası: ${e.message}\n`);
    } finally {
      setAiLoading(false);
      setAiInstruction("");
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8F9FB] text-slate-800">
      {/* 1. Workspace & File Explorer Sidebar */}
      <div
        style={{ width: `${explorerWidth}px` }}
        className="border-r border-slate-200 bg-white flex flex-col justify-between shrink-0 relative select-none shadow-xs"
      >
        <div>
          <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
              <Folder className="w-3.5 h-3.5 text-orange-600" />
              <span>Gezgin</span>
            </span>
            <button
              onClick={() => activeWsId && loadTree(activeWsId)}
              className="p-1 hover:bg-orange-50 rounded text-slate-400 hover:text-orange-600 transition-colors"
              title="Yenile"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Tree items */}
          <div className="p-2 space-y-0.5 overflow-y-auto max-h-[calc(100vh-200px)]">
            {fileTree.map((item) => (
              <div
                key={item.path}
                onClick={() => !item.is_dir && handleOpenFile(item.path)}
                className={cn(
                  "flex items-center space-x-2 px-2.5 py-1.5 rounded-xl text-xs cursor-pointer transition-colors",
                  selectedFilePath === item.path
                    ? "bg-orange-50 text-orange-700 font-bold border border-orange-200 shadow-xs"
                    : "hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-transparent"
                )}
              >
                {item.is_dir ? (
                  <Folder className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                ) : (
                  <FileCode className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                )}
                <span className="break-all leading-tight">{item.name}</span>
              </div>
            ))}
            {fileTree.length === 0 && (
              <div className="p-4 text-center text-xs text-slate-400 italic">
                Dosya yok veya yükleniyor...
              </div>
            )}
          </div>
        </div>

        {/* Quick Git Control Bar */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/70 space-y-2">
          <div className="text-[10px] uppercase font-bold text-slate-500 flex items-center space-x-1">
            <GitBranch className="w-3 h-3 text-orange-600" />
            <span>Git Kontrol</span>
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
        <div className="h-10 border-b border-slate-200 bg-white px-4 flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold text-slate-800 flex items-center space-x-1.5">
              <FileText className="w-3.5 h-3.5 text-orange-600" />
              <span>{selectedFilePath || "Dosya seçilmedi"}</span>
            </span>
            {isModified && <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" title="Kaydedilmemiş değişiklikler" />}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleSaveFile}
              disabled={!selectedFilePath}
              className="px-3 py-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 disabled:opacity-40 text-white text-xs font-bold flex items-center space-x-1 shadow-sm shadow-orange-500/20 transition-all"
            >
              <Save className="w-3 h-3" />
              <span>Kaydet</span>
            </button>
          </div>
        </div>

        {/* Vertical Split Container */}
        <div className="flex-1 flex flex-col min-h-0 relative">
          {/* Top Half: Code Editor */}
          <div
            style={{ height: `${editorHeightPercent}%` }}
            className="relative bg-white overflow-hidden flex flex-col min-h-0"
          >
            <textarea
              value={fileContent}
              onChange={(e) => {
                setFileContent(e.target.value);
                setIsModified(true);
              }}
              className="w-full h-full p-4 font-mono text-xs sm:text-sm bg-white text-slate-900 resize-none focus:outline-none leading-relaxed selection:bg-orange-500 selection:text-white"
              spellCheck={false}
              placeholder="// TanCoreLab Kodlama Stüdyosu: Kodunuzu buraya yazın veya soldaki gezginden bir dosya açın..."
            />
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
            <div className="p-2.5 border-b border-slate-200 bg-white flex items-center space-x-2 shadow-xs">
              <div className="w-7 h-7 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0 text-orange-600">
                <TerminalIcon className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={aiInstruction}
                onChange={(e) => setAiInstruction(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleClaudeAssist()}
                placeholder="TanCoreLab AI'ya talimat ver: 'Hataları ayıkla', 'Birim testler üret', 'Refactor et'..."
                className="flex-1 bg-slate-50 border border-slate-200 text-xs px-3.5 py-1.5 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
              />
              <select
                value={aiMode}
                onChange={(e) => setAiMode(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-3 py-1.5 focus:outline-none focus:border-orange-500"
              >
                <option value="edit">Düzenle / Kod Üret</option>
                <option value="debug">Hata Ayıkla</option>
                <option value="test_generate">Birim Test Üret</option>
                <option value="explain">Kodu Açıkla</option>
              </select>
              <button
                onClick={handleClaudeAssist}
                disabled={aiLoading || !aiInstruction.trim()}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 disabled:opacity-40 text-white text-xs font-bold flex items-center space-x-1 transition-all shadow-sm shadow-orange-500/20"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{aiLoading ? "İşleniyor..." : "Uygula"}</span>
              </button>
            </div>

            {/* Terminal Console */}
            <div className="flex-1 p-4 font-mono text-xs overflow-y-auto text-slate-800 bg-[#F8F9FB] whitespace-pre-wrap leading-relaxed select-text">
              {terminalOutput}
            </div>

            {/* Terminal Command Input */}
            <div className="p-2.5 border-t border-slate-200 bg-white flex items-center space-x-2 shadow-xs">
              <span className="text-xs font-mono font-bold text-orange-600 pl-2">$</span>
              <input
                type="text"
                value={terminalInput}
                onChange={(e) => setTerminalInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleRunTerminal()}
                placeholder="Terminal komutu çalıştır (örn: ls -la, python script.py, git status)..."
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
  );
}
