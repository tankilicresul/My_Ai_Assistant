"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  Plus,
  Bot,
  User,
  Sparkles,
  Mic,
  MicOff,
  Volume2,
  Trash2,
  Brain,
  Globe,
  Paperclip,
  ChevronDown,
  Copy,
  Check,
  Columns,
  Layers,
  Code,
  Maximize2,
  Minimize2,
  Play,
  RotateCcw,
  Zap,
  ChevronLeft,
  ChevronRight,
  GripVertical,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ApiClient } from "../../lib/api-client";
import { cn } from "../../lib/utils";

export function ChatView() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState("gpt-4o");
  const [models, setModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [enableMemory, setEnableMemory] = useState(true);
  const [enableWebSearch, setEnableWebSearch] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Arena Mode & Canvas Studio
  const [isArenaMode, setIsArenaMode] = useState(false);
  const [arenaResults, setArenaResults] = useState<any[]>([]);
  const [arenaLoading, setArenaLoading] = useState(false);
  const [isCanvasOpen, setIsCanvasOpen] = useState(false);
  const [canvasCode, setCanvasCode] = useState<string>(
    `<div style="font-family: system-ui; text-align: center; padding: 40px; background: #fff8f2; color: #1e293b; border-radius: 16px; border: 1px solid #ffe2cc;">
  <h2 style="color: #ea580c; margin-bottom: 8px;">🚀 TanCoreLab Live Canvas</h2>
  <p style="color: #64748b; font-size: 14px;">Yapay zekanın ürettiği HTML, React ve interaktif bileşenler burada canlı çalışır.</p>
  <button style="padding: 10px 20px; background: linear-gradient(135deg, #ffa000, #ff5500); color: white; border: none; border-radius: 10px; cursor: pointer; margin-top: 14px; font-weight: bold;" onclick="alert('TanCoreLab Canvas Aktif!')">Bana Tıkla</button>
</div>`
  );

  // Resizable Panel Widths
  const [subSidebarWidth, setSubSidebarWidth] = useState(260);
  const [isSubSidebarCollapsed, setIsSubSidebarCollapsed] = useState(false);
  const [canvasWidth, setCanvasWidth] = useState(460);

  const isResizingSubSidebarRef = useRef(false);
  const isResizingCanvasRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const savedSubWidth = localStorage.getItem("tancore_chat_subsidebar_width");
      if (savedSubWidth) {
        const w = parseInt(savedSubWidth, 10);
        if (w >= 180 && w <= 500) setSubSidebarWidth(w);
      }
      const savedCanvasWidth = localStorage.getItem("tancore_canvas_width");
      if (savedCanvasWidth) {
        const cw = parseInt(savedCanvasWidth, 10);
        if (cw >= 280 && cw <= 800) setCanvasWidth(cw);
      }
    } catch {}
  }, []);

  useEffect(() => {
    loadModels();
    loadConversations();
  }, []);

  useEffect(() => {
    if (activeConvId && !isArenaMode) {
      try {
        const cached = localStorage.getItem(`nexus_chat_${activeConvId}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMessages(parsed);
          }
        }
      } catch (err) {
        console.error("Local cache read error", err);
      }
      localStorage.setItem("nexus_active_conv_id", activeConvId);
      loadConversationMessages(activeConvId);
    }
  }, [activeConvId, isArenaMode]);

  useEffect(() => {
    if (activeConvId && messages.length > 0) {
      try {
        localStorage.setItem(`nexus_chat_${activeConvId}`, JSON.stringify(messages));
      } catch (err) {
        console.error("Local cache write error", err);
      }
    }
  }, [messages, activeConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, arenaResults]);

  // Resizing logic for SubSidebar
  const startResizingSubSidebar = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizingSubSidebarRef.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const handleMouseMove = (event: MouseEvent) => {
      if (!isResizingSubSidebarRef.current) return;
      // Offset from left sidebar
      const newWidth = Math.max(180, Math.min(480, event.clientX - 240));
      setSubSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      isResizingSubSidebarRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      try {
        localStorage.setItem("tancore_chat_subsidebar_width", subSidebarWidth.toString());
      } catch {}
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  // Resizing logic for Canvas
  const startResizingCanvas = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizingCanvasRef.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const handleMouseMove = (event: MouseEvent) => {
      if (!isResizingCanvasRef.current) return;
      const newWidth = Math.max(280, Math.min(750, window.innerWidth - event.clientX));
      setCanvasWidth(newWidth);
    };

    const handleMouseUp = () => {
      isResizingCanvasRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      try {
        localStorage.setItem("tancore_canvas_width", canvasWidth.toString());
      } catch {}
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const loadModels = async () => {
    try {
      const data = await ApiClient.getModels();
      setModels(data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadConversations = async () => {
    try {
      const data = await ApiClient.getConversations();
      setConversations(data);
      const savedConvId = typeof window !== "undefined" ? localStorage.getItem("nexus_active_conv_id") : null;
      if (savedConvId && data.some((c: any) => c.id === savedConvId)) {
        setActiveConvId(savedConvId);
      } else if (data.length > 0 && !activeConvId) {
        setActiveConvId(data[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadConversationMessages = async (id: string) => {
    try {
      const data = await ApiClient.getConversation(id);
      if (data && data.messages) {
        setMessages(data.messages);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleNewChat = async () => {
    setIsArenaMode(false);
    try {
      const newConv = await ApiClient.createConversation({
        title: "Yeni Sohbet",
        model: selectedModel,
      });
      setConversations((prev) => [newConv, ...prev]);
      setActiveConvId(newConv.id);
      setMessages([]);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteChat = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await ApiClient.deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConvId === id) {
        setActiveConvId(null);
        setMessages([]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput("");

    // Arena Mode Flow
    if (isArenaMode) {
      setArenaLoading(true);
      setArenaResults([]);
      try {
        const arenaRes = await ApiClient.runArena({
          prompt: userText,
          models: ["gpt-4o", "claude-3-7-sonnet-latest", "deepseek-ai/DeepSeek-R1"],
        });
        if (arenaRes && arenaRes.evaluations) {
          setArenaResults(arenaRes.evaluations);
        }
      } catch (err: any) {
        setArenaResults([
          {
            model: "Hata",
            response: `Arena çalıştırma hatası: ${err.message || "Bilinmeyen hata"}`,
            duration_sec: 0,
            tokens: 0,
            score: 0,
          },
        ]);
      } finally {
        setArenaLoading(false);
      }
      return;
    }

    // Classic Chat Flow
    const tempUserMsg = {
      id: "temp-" + Date.now(),
      role: "user",
      content: userText,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setLoading(true);

    try {
      const response = await ApiClient.sendMessage({
        conversation_id: activeConvId,
        content: userText,
        model: selectedModel,
        enable_memory: enableMemory,
        enable_web_search: enableWebSearch,
      });

      if (!activeConvId && response.conversation_id) {
        setActiveConvId(response.conversation_id);
        loadConversations();
      }

      setMessages((prev) => [...prev.filter((m) => m.id !== tempUserMsg.id), tempUserMsg, response]);

      if (response.content.includes("```html") || response.content.includes("<div")) {
        const match = response.content.match(/```html([\s\S]*?)```/);
        if (match && match[1]) {
          setCanvasCode(match[1]);
        }
      }

      if (isRecording && typeof window !== "undefined" && "speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(response.content.slice(0, 200));
        utterance.lang = "tr-TR";
        window.speechSynthesis.speak(utterance);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: "err-" + Date.now(),
          role: "assistant",
          content: `⚠️ Yanıt: ${err.message || "İşlendi."}`,
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const speakMessage = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "tr-TR";
    utterance.rate = 1.05;
    window.speechSynthesis.speak(utterance);
  };

  const effectiveSubSidebarWidth = isSubSidebarCollapsed ? 0 : subSidebarWidth;

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8F9FB] text-slate-800">
      {/* 1. Sub-Sidebar: Conversation History */}
      <div
        style={{ width: `${effectiveSubSidebarWidth}px` }}
        className={cn(
          "border-r border-slate-200 bg-white flex flex-col justify-between shrink-0 relative transition-[width] duration-75 select-none",
          isSubSidebarCollapsed && "hidden"
        )}
      >
        <div className="p-3 space-y-2">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-xs font-bold shadow-md shadow-orange-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Sohbet</span>
          </button>

          {/* Arena Mode Button */}
          <button
            onClick={() => setIsArenaMode(!isArenaMode)}
            className={cn(
              "w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-xl text-xs font-bold border transition-all",
              isArenaMode
                ? "bg-orange-50 border-orange-300 text-orange-700 shadow-xs"
                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-orange-50/50 hover:text-slate-900"
            )}
          >
            <Columns className="w-3.5 h-3.5 text-orange-500" />
            <span>{isArenaMode ? "⚔️ Arena (Açık)" : "Multi-Model Arena"}</span>
          </button>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          <div className="flex items-center justify-between px-3 py-1.5 text-[10px] font-bold uppercase text-slate-400 tracking-wider">
            <span>Geçmiş Sohbetler</span>
            <span className="text-[10px] font-mono font-normal">{conversations.length}</span>
          </div>
          {conversations.map((c) => (
            <div
              key={c.id}
              onClick={() => {
                setIsArenaMode(false);
                setActiveConvId(c.id);
              }}
              className={cn(
                "group flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-all",
                activeConvId === c.id && !isArenaMode
                  ? "bg-orange-50 text-orange-700 font-bold border border-orange-200 shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent"
              )}
            >
              <span className="truncate pr-2">{c.title || "İsimsiz Sohbet"}</span>
              <button
                onClick={(e) => handleDeleteChat(c.id, e)}
                className="opacity-0 group-hover:opacity-100 hover:text-rose-600 p-1 transition-opacity"
                title="Sohbeti Sil"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Status Info */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/70 text-[11px] text-slate-500 space-y-1">
          <div className="flex items-center justify-between">
            <span>Model Durumu</span>
            <span className="text-emerald-600 font-bold font-mono">Aktif & Hazır</span>
          </div>
        </div>

        {/* Resizer Handle on Right Edge */}
        <div
          onMouseDown={startResizingSubSidebar}
          title="Sohbet Listesi Genişliğini Ayarlayın"
          className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-orange-500/40 active:bg-orange-600 transition-colors z-30 group flex items-center justify-center"
        >
          <div className="w-0.5 h-8 bg-slate-300 group-hover:bg-orange-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      {/* 2. Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#F8F9FB]">
        {/* Top Header Bar */}
        <div className="h-14 border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between bg-white/90 backdrop-blur-md">
          <div className="flex items-center space-x-3">
            {/* Toggle SubSidebar */}
            <button
              onClick={() => setIsSubSidebarCollapsed(!isSubSidebarCollapsed)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-orange-600 hover:bg-orange-50 border border-slate-200 transition-colors"
              title={isSubSidebarCollapsed ? "Geçmiş Sohbetleri Göster" : "Geçmiş Sohbetleri Gizle"}
            >
              <Columns className="w-4 h-4" />
            </button>

            {!isArenaMode ? (
              <div className="relative">
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="appearance-none bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold px-3 py-1.5 pr-8 rounded-xl focus:outline-none focus:border-orange-500 cursor-pointer shadow-xs"
                >
                  <option value="gpt-4o">GPT-4o (OpenAI Omni)</option>
                  <option value="claude-3-7-sonnet-latest">Claude 3.7 Sonnet (Anthropic)</option>
                  <option value="deepseek-ai/DeepSeek-R1">DeepSeek-R1 (Reasoning)</option>
                  <option value="gemini-2.0-flash">Gemini 2.0 Flash (Google)</option>
                  <option value="qwen/qwen-2.5-coder-32b-instruct">Qwen 2.5 Coder (Alibaba)</option>
                  <option value="meta-llama/Llama-3.3-70B-Instruct">Llama 3.3 70B (Meta)</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-1 rounded-lg bg-orange-50 text-orange-700 border border-orange-200 text-xs font-bold font-mono">
                  ⚔️ ARENA: GPT-4o vs Claude 3.7 vs DeepSeek-R1
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setEnableMemory(!enableMemory)}
              className={cn(
                "flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all",
                enableMemory ? "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-xs" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
              )}
              title="Qdrant Vektör Hafıza"
            >
              <Brain className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Hafıza</span>
            </button>

            <button
              onClick={() => setIsCanvasOpen(!isCanvasOpen)}
              className={cn(
                "flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all",
                isCanvasOpen
                  ? "bg-orange-50 text-orange-700 border-orange-300 shadow-xs"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900"
              )}
              title="Canlı Canvas Önizleyici"
            >
              <Code className="w-3.5 h-3.5 text-orange-600" />
              <span className="hidden sm:inline">Live Canvas</span>
            </button>
          </div>
        </div>

        {/* Content Area with optional Canvas Split */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Left Messages / Stream Container */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {isArenaMode ? (
                /* Arena Results Grid */
                <div className="space-y-6 max-w-5xl mx-auto">
                  <div className="p-4 rounded-2xl bg-orange-50 border border-orange-200 text-center">
                    <h2 className="text-sm font-bold text-orange-800">Multi-Model Arena Kıyaslama Modu</h2>
                    <p className="text-xs text-slate-600 mt-1">
                      Aşağıdaki kutuya sorunuzu yazın; GPT-4o, Claude 3.7 ve DeepSeek-R1 aynı anda paralel cevaplasın.
                    </p>
                  </div>

                  {arenaResults.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {arenaResults.map((evalItem, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-2xl bg-white border border-slate-200 flex flex-col justify-between space-y-3 shadow-sm"
                        >
                          <div>
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                              <span className="font-bold text-xs text-orange-600 font-mono">
                                {evalItem.model}
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                                ⭐ {evalItem.score}/10
                              </span>
                            </div>
                            <div className="text-xs text-slate-700 leading-relaxed max-h-96 overflow-y-auto pr-1">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {evalItem.response}
                              </ReactMarkdown>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-2 border-t border-slate-100">
                            <span>Süre: {evalItem.duration_sec}s</span>
                            <span>{evalItem.tokens} tokens</span>
                            <button
                              onClick={() => speakMessage(evalItem.response)}
                              className="hover:text-slate-700 transition-colors"
                              title="Seslendir"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {arenaLoading && (
                    <div className="p-8 text-center text-xs font-bold text-orange-600 animate-pulse">
                      ⚔️ 3 Model Aynı Anda Yanıt Üretiyor (GPT-4o, Claude 3.7, DeepSeek-R1)...
                    </div>
                  )}
                </div>
              ) : (
                /* Classic Chat Message Stream */
                <>
                  {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto p-6 space-y-4">
                      <div className="w-16 h-16 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 shadow-sm">
                        <Zap className="w-8 h-8 fill-orange-500 text-orange-500" />
                      </div>
                      <h2 className="text-xl font-bold text-slate-900">Nasıl yardımcı olabilirim?</h2>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        GPT-4o, Claude 3.7, DeepSeek-R1 ve Gemini 2.0 modelleriyle dilediğiniz konuda sohbet edin, kod geliştirin veya analiz yapın.
                      </p>
                      <div className="grid grid-cols-2 gap-2 w-full text-left pt-2">
                        {[
                          "FastAPI mikroservisi tasarla",
                          "DeepSeek vs Claude 3.7 kıyasla",
                          "Canlı HTML5 web oyunu yaz",
                          "Qdrant vektör hafıza mimarisi",
                        ].map((s, idx) => (
                          <button
                            key={idx}
                            onClick={() => setInput(s)}
                            className="p-3 rounded-2xl bg-white border border-slate-200 hover:border-orange-300 hover:bg-orange-50/50 text-xs text-slate-700 hover:text-orange-700 transition-all text-left shadow-xs"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {messages.map((m, idx) => {
                    const isUser = m.role === "user";
                    return (
                      <div
                        key={m.id || idx}
                        className={cn("flex space-x-3 max-w-4xl mx-auto", isUser ? "justify-end" : "justify-start")}
                      >
                        {!isUser && (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#FFA200] to-[#FF4800] flex items-center justify-center shrink-0 shadow-sm text-white">
                            <Bot className="w-4 h-4" />
                          </div>
                        )}

                        <div
                          className={cn(
                            "relative group px-4 py-3 rounded-2xl text-xs sm:text-sm leading-relaxed max-w-[85%]",
                            isUser
                              ? "bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 text-white rounded-tr-none shadow-md shadow-orange-500/15"
                              : "bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-xs"
                          )}
                        >
                          {!isUser && (
                            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-2 border-b border-slate-100 pb-1">
                              <span className="font-semibold text-orange-600">{m.model_name || selectedModel}</span>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => speakMessage(m.content)}
                                  className="hover:text-slate-700 transition-colors"
                                  title="Seslendir"
                                >
                                  <Volume2 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleCopy(m.content, m.id)}
                                  className="hover:text-slate-700 transition-colors"
                                  title="Kopyala"
                                >
                                  {copiedId === m.id ? (
                                    <Check className="w-3 h-3 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            </div>
                          )}

                          <div className={cn("prose prose-xs max-w-none", isUser ? "text-white prose-invert" : "text-slate-800")}>
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {m.content}
                            </ReactMarkdown>
                          </div>
                        </div>

                        {isUser && (
                          <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center shrink-0 text-slate-700">
                            <User className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {loading && (
                    <div className="flex space-x-3 max-w-4xl mx-auto items-center">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#FFA200] to-[#FF4800] flex items-center justify-center shrink-0 text-white animate-pulse">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div className="px-4 py-3 rounded-2xl bg-white border border-slate-200 text-xs text-slate-500 flex items-center space-x-2 shadow-xs">
                        <div className="w-2 h-2 rounded-full bg-orange-500 animate-bounce" />
                        <div className="w-2 h-2 rounded-full bg-orange-500 animate-bounce [animation-delay:0.2s]" />
                        <div className="w-2 h-2 rounded-full bg-orange-500 animate-bounce [animation-delay:0.4s]" />
                        <span className="text-[11px] font-mono ml-2 text-slate-600">Yapay zeka yanıtı hazırlıyor...</span>
                      </div>
                    </div>
                  )}
                </>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-4 bg-white/80 backdrop-blur-md border-t border-slate-200">
              <div className="max-w-4xl mx-auto relative rounded-2xl bg-white border border-slate-200 focus-within:border-orange-500 shadow-sm transition-all">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  rows={2}
                  placeholder="Bir mesaj yazın veya soru sorun... (Shift + Enter: yeni satır)"
                  className="w-full pl-4 pr-24 py-3 bg-transparent text-slate-900 text-xs sm:text-sm placeholder-slate-400 focus:outline-none resize-none"
                />

                <div className="absolute right-2 bottom-2 flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={!input.trim() || loading}
                    className="p-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-orange-500/20 transition-all flex items-center space-x-1 px-3"
                  >
                    <span className="text-xs font-bold">Gönder</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Resizable Live Canvas Split Pane */}
          {isCanvasOpen && (
            <div
              style={{ width: `${canvasWidth}px` }}
              className="border-l border-slate-200 bg-white flex flex-col justify-between shrink-0 relative transition-[width] duration-75 shadow-lg select-none"
            >
              {/* Canvas Resizer Handle on Left Edge */}
              <div
                onMouseDown={startResizingCanvas}
                title="Canvas Genişliğini Ayarlayın"
                className="absolute top-0 left-0 w-1.5 h-full cursor-col-resize hover:bg-orange-500/40 active:bg-orange-600 transition-colors z-30 group flex items-center justify-center"
              >
                <div className="w-0.5 h-8 bg-slate-300 group-hover:bg-orange-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              {/* Canvas Header */}
              <div className="h-12 border-b border-slate-200 px-4 flex items-center justify-between bg-slate-50/80">
                <div className="flex items-center space-x-2">
                  <Code className="w-4 h-4 text-orange-600" />
                  <span className="text-xs font-bold text-slate-800">Canlı Canvas & Önizleyici</span>
                </div>
                <button
                  onClick={() => setIsCanvasOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
                  title="Kapat"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Canvas Preview Iframe */}
              <div className="flex-1 p-3 overflow-hidden bg-slate-100">
                <iframe
                  title="Canvas Live Preview"
                  srcDoc={canvasCode}
                  sandbox="allow-scripts allow-modals"
                  className="w-full h-full rounded-xl bg-white border border-slate-200 shadow-inner"
                />
              </div>

              {/* Canvas Code Editor Box */}
              <div className="h-40 border-t border-slate-200 p-2 bg-slate-50">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pb-1 px-1">
                  <span>HTML / JS Kaynak Kodu</span>
                  <button
                    onClick={() => {
                      setCanvasCode(
                        `<div style="font-family: system-ui; text-align: center; padding: 40px; background: #fff8f2; color: #1e293b; border-radius: 16px; border: 1px solid #ffe2cc;">
  <h2 style="color: #ea580c; margin-bottom: 8px;">🚀 TanCoreLab Canlı Tasarım</h2>
  <p style="color: #64748b; font-size: 14px;">Anlık HTML ve React test alanı.</p>
</div>`
                      );
                    }}
                    className="hover:text-orange-600 flex items-center space-x-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Sıfırla</span>
                  </button>
                </div>
                <textarea
                  value={canvasCode}
                  onChange={(e) => setCanvasCode(e.target.value)}
                  className="w-full h-28 p-2 rounded-lg bg-white border border-slate-200 font-mono text-[11px] text-slate-800 focus:outline-none focus:border-orange-500 resize-none shadow-xs"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
