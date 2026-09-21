"use client";

import React, { useState, useEffect } from "react";
import {
  Folder,
  FileCode,
  Terminal as TerminalIcon,
  Play,
  Save,
  GitBranch,
  GitCommit,
  Sparkles,
  RefreshCw,
  Bug,
  CheckCircle,
  FileText,
  ChevronRight,
  ChevronDown
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
  const [terminalOutput, setTerminalOutput] = useState<string>("$ NexusAI Claude Code Environment Ready.\n$ Type a command or use quick git actions below.\n");
  const [terminalInput, setTerminalInput] = useState("");
  const [termLoading, setTermLoading] = useState(false);
  const [aiInstruction, setAiInstruction] = useState("");
  const [aiMode, setAiMode] = useState("edit");
  const [aiLoading, setAiLoading] = useState(false);
  const [gitStatus, setGitStatus] = useState<string>("");

  useEffect(() => {
    loadWorkspaces();
  }, []);

  useEffect(() => {
    if (activeWsId) {
      loadTree(activeWsId);
    }
  }, [activeWsId]);

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
      // Auto open README or first file
      if (tree.length > 0 && !selectedFilePath) {
        const firstFile = tree.find((t) => !t.is_dir) || tree[0];
        if (!firstFile.is_dir) {
          handleOpenFile(firstFile.path);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenFile = async (path: string) => {
    try {
      const res = await ApiClient.readFile(activeWsId, path);
      setSelectedFilePath(path);
      setFileContent(res.content);
      setIsModified(false);
    } catch (e: any) {
      console.error(e);
    }
  };

  const handleSaveFile = async () => {
    if (!selectedFilePath || !activeWsId) return;
    try {
      await ApiClient.writeFile(activeWsId, selectedFilePath, fileContent);
      setIsModified(false);
      setTerminalOutput((prev) => prev + `[Editor] Dosya kaydedildi: ${selectedFilePath}\n`);
    } catch (e: any) {
      setTerminalOutput((prev) => prev + `[Hata] Kaydetme başarısız: ${e.message}\n`);
    }
  };

  const handleRunTerminal = async (cmdToRun?: string) => {
    const cmd = cmdToRun || terminalInput;
    if (!cmd.trim() || !activeWsId) return;

    setTerminalInput("");
    setTermLoading(true);
    setTerminalOutput((prev) => prev + `$ ${cmd}\n`);

    try {
      const res = await ApiClient.executeTerminal(activeWsId, cmd);
      if (res.stdout) setTerminalOutput((prev) => prev + res.stdout + "\n");
      if (res.stderr) setTerminalOutput((prev) => prev + `[stderr] ${res.stderr}\n`);
      setTerminalOutput((prev) => prev + `(Çıkış kodu: ${res.exit_code} • ${res.execution_time_ms}ms)\n`);
    } catch (e: any) {
      setTerminalOutput((prev) => prev + `Hata: ${e.message}\n`);
    } finally {
      setTermLoading(false);
    }
  };

  const handleGitAction = async (action: string) => {
    if (!activeWsId) return;
    setTermLoading(true);
    try {
      const res = await ApiClient.executeGit(activeWsId, { action, message: "Claude Code Auto Update" });
      setTerminalOutput((prev) => prev + `$ git ${action}\n` + (res.stdout || res.stderr || "Tamamlandı.") + "\n");
      loadTree(activeWsId);
    } catch (e: any) {
      setTerminalOutput((prev) => prev + `Git Hatası: ${e.message}\n`);
    } finally {
      setTermLoading(false);
    }
  };

  const handleClaudeAssist = async () => {
    if (!aiInstruction.trim() || !activeWsId) return;
    setAiLoading(true);
    try {
      const res = await ApiClient.codeAssist({
        workspace_id: activeWsId,
        file_path: selectedFilePath || undefined,
        instruction: aiInstruction,
        mode: aiMode,
        model: "claude-3-7-sonnet-latest"
      });
      setTerminalOutput((prev) => prev + `\n[Claude Code AI Çıktısı]:\n${res.result}\n`);
    } catch (e: any) {
      setTerminalOutput((prev) => prev + `AI Asistan Hatası: ${e.message}\n`);
    } finally {
      setAiLoading(false);
      setAiInstruction("");
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#090d16] text-slate-200">
      {/* Workspace & File Explorer Sidebar */}
      <div className="w-60 border-r border-slate-800/80 bg-slate-950/60 flex flex-col justify-between shrink-0">
        <div>
          <div className="p-3 border-b border-slate-800/80 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-1.5">
              <Folder className="w-3.5 h-3.5 text-indigo-400" />
              <span>Gezgin</span>
            </span>
            <button
              onClick={() => activeWsId && loadTree(activeWsId)}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
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
                  "flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors",
                  selectedFilePath === item.path
                    ? "bg-indigo-600/20 text-indigo-300 font-medium"
                    : "hover:bg-slate-900 text-slate-400 hover:text-slate-200"
                )}
              >
                {item.is_dir ? (
                  <Folder className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                ) : (
                  <FileCode className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                )}
                <span className="truncate">{item.name}</span>
              </div>
            ))}
            {fileTree.length === 0 && (
              <div className="p-4 text-center text-xs text-slate-500 italic">
                Dosya yok veya yükleniyor...
              </div>
            )}
          </div>
        </div>

        {/* Quick Git Control Bar */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-900/30 space-y-2">
          <div className="text-[10px] uppercase font-mono text-slate-500 flex items-center space-x-1">
            <GitBranch className="w-3 h-3 text-indigo-400" />
            <span>Git Entegrasyonu</span>
          </div>
          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={() => handleGitAction("status")}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-[10px] font-mono rounded text-slate-300"
            >
              Status
            </button>
            <button
              onClick={() => handleGitAction("diff")}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-[10px] font-mono rounded text-slate-300"
            >
              Diff
            </button>
            <button
              onClick={() => handleGitAction("commit")}
              className="px-2 py-1 bg-indigo-600/30 hover:bg-indigo-600/50 text-[10px] font-mono rounded text-indigo-300"
            >
              Commit
            </button>
          </div>
        </div>
      </div>

      {/* Center & Right Split: Editor, Terminal & Claude AI Assistant */}
      <div className="flex-1 flex flex-col h-screen min-w-0">
        {/* Editor Tab Header */}
        <div className="h-10 border-b border-slate-800/80 bg-slate-950/40 px-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono text-slate-300 flex items-center space-x-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              <span>{selectedFilePath || "Dosya seçilmedi"}</span>
            </span>
            {isModified && <span className="w-2 h-2 rounded-full bg-amber-400" title="Kaydedilmemiş değişiklikler" />}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleSaveFile}
              disabled={!selectedFilePath}
              className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-medium flex items-center space-x-1 transition-all"
            >
              <Save className="w-3 h-3" />
              <span>Kaydet (Ctrl+S)</span>
            </button>
          </div>
        </div>

        {/* Code Area & Claude Assistant Grid */}
        <div className="flex-1 grid grid-rows-2 min-h-0">
          {/* Top Half: Code Editor */}
          <div className="relative bg-[#0d1117] overflow-hidden flex flex-col">
            <textarea
              value={fileContent}
              onChange={(e) => {
                setFileContent(e.target.value);
                setIsModified(true);
              }}
              className="w-full h-full p-4 font-mono text-xs sm:text-sm bg-transparent text-slate-100 resize-none focus:outline-none leading-relaxed selection:bg-indigo-600/40"
              spellCheck={false}
              placeholder="// Claude Code IDE: Kodunuzu buraya yazın veya soldaki gezginden bir dosya açın..."
            />
          </div>

          {/* Bottom Half: Terminal & Claude Code AI Task bar */}
          <div className="border-t border-slate-800/80 bg-slate-950/80 flex flex-col min-h-0">
            {/* Claude Code Prompt Bar */}
            <div className="p-2 border-b border-slate-800/80 bg-slate-900/60 flex items-center space-x-2">
              <div className="w-6 h-6 rounded bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <input
                type="text"
                value={aiInstruction}
                onChange={(e) => setAiInstruction(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleClaudeAssist()}
                placeholder="Claude Code'a talimat ver: 'Hataları ayıkla', 'Birim testler üret', 'Refactor et'..."
                className="flex-1 bg-slate-900 border border-slate-800 text-xs px-3 py-1.5 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
              />
              <select
                value={aiMode}
                onChange={(e) => setAiMode(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none"
              >
                <option value="edit">Düzenle / Kod Üret</option>
                <option value="debug">Hata Ayıkla</option>
                <option value="test_generate">Birim Test Üret</option>
                <option value="explain">Kodu Açıkla</option>
              </select>
              <button
                onClick={handleClaudeAssist}
                disabled={aiLoading || !aiInstruction.trim()}
                className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-xs font-semibold flex items-center space-x-1"
              >
                <span>{aiLoading ? "İşleniyor..." : "Uygula"}</span>
              </button>
            </div>

            {/* Terminal Console */}
            <div className="flex-1 p-3 font-mono text-xs overflow-y-auto text-emerald-400 bg-slate-950 whitespace-pre-wrap selection:bg-emerald-900">
              {terminalOutput}
            </div>

            {/* Terminal Command Input */}
            <div className="p-2 border-t border-slate-800/80 bg-slate-950 flex items-center space-x-2">
              <span className="text-xs font-mono text-slate-500 pl-2">$</span>
              <input
                type="text"
                value={terminalInput}
                onChange={(e) => setTerminalInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleRunTerminal()}
                placeholder="Terminal komutu çalıştır (örn: ls -la, python script.py, git status)..."
                className="flex-1 bg-transparent text-xs font-mono text-slate-200 focus:outline-none"
              />
              <button
                onClick={() => handleRunTerminal()}
                disabled={termLoading}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono"
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
