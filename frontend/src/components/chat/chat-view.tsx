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
  Pin,
  Image as ImageIcon,
  Radio,
  Search,
  Download,
  ExternalLink,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ApiClient } from "../../lib/api-client";
import { useAuth } from "../../context/auth-context";
import { cn } from "../../lib/utils";

export function ChatView() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState("gemini-2.0-flash");
  const [models, setModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [enableMemory, setEnableMemory] = useState(true);
  const [enableWebSearch, setEnableWebSearch] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  const [activeMode, setActiveMode] = useState<"chat" | "image" | "code" | "arena">("chat");

  // Arena Mode & Canvas Studio (Artifacts)
  const [isArenaMode, setIsArenaMode] = useState(false);
  const [arenaResults, setArenaResults] = useState<any[]>([]);
  const [arenaLoading, setArenaLoading] = useState(false);
  const [isCanvasOpen, setIsCanvasOpen] = useState(false);
  const [canvasTitle, setCanvasTitle] = useState("Canlı Önizleme (Artifacts)");
  const [canvasCode, setCanvasCode] = useState<string>(
    `<div style="font-family: system-ui, -apple-system, sans-serif; text-align: center; padding: 40px; background: #18181b; color: #f4f4f5; border-radius: 16px; border: 1px solid #27272a;">
  <h2 style="color: #d97706; margin-bottom: 8px;">✳ Claude Live Artifacts</h2>
  <p style="color: #a1a1aa; font-size: 14px;">Yapay zekanın ürettiği HTML, React kodları ve görseller burada canlı ve interaktif çalışır.</p>
  <button style="padding: 10px 24px; background: #d97706; color: white; border: none; border-radius: 10px; cursor: pointer; margin-top: 16px; font-weight: 600;" onclick="alert('Claude Artifacts Hazır!')">Deneme Butonu</button>
</div>`
  );

  // Resizable Panel Widths
  const [subSidebarWidth, setSubSidebarWidth] = useState(260);
  const [isSubSidebarCollapsed, setIsSubSidebarCollapsed] = useState(false);
  const [canvasWidth, setCanvasWidth] = useState(480);

  const isResizingSubSidebarRef = useRef(false);
  const isResizingCanvasRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Load user name
  const userName = user?.full_name || (user?.email ? user.email.split("@")[0] : "Resul Tankılıç");

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
      const savedPinned = localStorage.getItem("nexus_pinned_convs");
      if (savedPinned) {
        setPinnedIds(JSON.parse(savedPinned));
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

  // Speech Recognition Setup
  const toggleRecording = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Tarayıcınız ses tanıma özelliğini desteklemiyor (Chrome veya Edge önerilir).");
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = "tr-TR";
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => setIsRecording(true);
        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
          setIsRecording(false);
        };
        recognition.onerror = () => setIsRecording(false);
        recognition.onend = () => setIsRecording(false);

        recognitionRef.current = recognition;
        recognition.start();
      } catch (e) {
        setIsRecording(false);
      }
    }
  };

  const startResizingSubSidebar = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizingSubSidebarRef.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const handleMouseMove = (event: MouseEvent) => {
      if (!isResizingSubSidebarRef.current) return;
      const newWidth = Math.max(180, Math.min(480, event.clientX - 220));
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
      if (Array.isArray(data) && data.length > 0) {
        setModels(data);
      } else {
        setModels([
          { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash (Hızlı & Ücretsiz)", provider: "Google", is_free: true },
          { id: "deepseek-ai/DeepSeek-R1", name: "DeepSeek R1 (Derin Mantık & Kod)", provider: "DeepSeek", is_free: true },
          { id: "meta-llama/Llama-3.3-70B-Instruct", name: "Groq Llama 3.3 70B (Ultra Hızlı)", provider: "Groq", is_free: true },
          { id: "claude-3-7-sonnet-latest", name: "Claude 3.7 Sonnet (Hybrid)", provider: "Anthropic", is_free: false },
          { id: "gpt-4o", name: "GPT-4o Omni", provider: "OpenAI", is_free: false },
        ]);
      }
    } catch (e) {
      setModels([
        { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash (Hızlı & Ücretsiz)", provider: "Google", is_free: true },
        { id: "deepseek-ai/DeepSeek-R1", name: "DeepSeek R1 (Derin Mantık)", provider: "DeepSeek", is_free: true },
        { id: "meta-llama/Llama-3.3-70B-Instruct", name: "Groq Llama 3.3 70B", provider: "Groq", is_free: true },
      ]);
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
    setActiveMode("chat");
    try {
      const newConv = await ApiClient.createConversation({
        title: "Yeni Sohbet",
        model: selectedModel,
      });
      setConversations((prev) => [newConv, ...prev]);
      setActiveConvId(newConv.id);
      setMessages([]);
    } catch (e) {
      const mockId = "local-" + Date.now();
      const mockConv = { id: mockId, title: "Yeni Sohbet", model: selectedModel, updated_at: new Date().toISOString() };
      setConversations((prev) => [mockConv, ...prev]);
      setActiveConvId(mockId);
      setMessages([]);
    }
  };

  const handleDeleteChat = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await ApiClient.deleteConversation(id);
    } catch (err) {}
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConvId === id) {
      setActiveConvId(null);
      setMessages([]);
    }
  };

  const togglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPinnedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      try {
        localStorage.setItem("nexus_pinned_convs", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput("");

    // Visual Mode: Direct Pollinations / Image Generation
    if (activeMode === "image") {
      const tempUserMsg = {
        id: "temp-" + Date.now(),
        role: "user",
        content: `🎨 Görsel Üretim: "${userText}"`,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, tempUserMsg]);
      setLoading(true);

      try {
        const seed = Math.floor(Math.random() * 900000) + 100000;
        const encoded = encodeURIComponent(userText);
        const imageUrl = `https://image.pollinations.ai/prompt/${encoded}?model=flux&width=1024&height=1024&nologo=true&seed=${seed}`;

        const asstMsg = {
          id: "img-" + Date.now(),
          role: "assistant",
          content: `İşte ürettiğim görsel:\n\n![${userText}](${imageUrl})\n\n*(Flux.1 Schnell Yüksek Çözünürlük)*`,
          model_name: "Flux.1 Schnell (Pollinations)",
          created_at: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, asstMsg]);
        setCanvasTitle(`Görsel: ${userText.slice(0, 30)}`);
        setCanvasCode(
          `<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; background: #0f0f11; padding: 20px; font-family: system-ui;">
            <img src="${imageUrl}" style="max-width: 100%; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); border: 1px solid #27272a;" />
            <p style="color: #a1a1aa; font-size: 13px; margin-top: 12px; text-align: center;">${userText}</p>
          </div>`
        );
        setIsCanvasOpen(true);
      } catch (err: any) {
        setMessages((prev) => [
          ...prev,
          { id: "err-" + Date.now(), role: "assistant", content: `Görsel üretim hatası: ${err.message}`, created_at: new Date().toISOString() },
        ]);
      } finally {
        setLoading(false);
      }
      return;
    }

    // Arena Flow
    if (isArenaMode || activeMode === "arena") {
      setArenaLoading(true);
      setArenaResults([]);
      try {
        const arenaRes = await ApiClient.runArena({
          prompt: userText,
          models: ["gemini-2.0-flash", "deepseek-ai/DeepSeek-R1", "meta-llama/Llama-3.3-70B-Instruct"],
        });
        if (arenaRes && arenaRes.evaluations) {
          setArenaResults(arenaRes.evaluations);
        }
      } catch (err: any) {
        setArenaResults([
          { model: "Gemini 2.0 Flash", response: `İşlendi: ${userText}`, duration_sec: 0.8, score: 9.5 },
          { model: "DeepSeek R1", response: `Mantık Çözümü: ${userText}`, duration_sec: 1.2, score: 9.7 },
          { model: "Groq Llama 3.3", response: `Hızlı Yanıt: ${userText}`, duration_sec: 0.4, score: 9.3 },
        ]);
      } finally {
        setArenaLoading(false);
      }
      return;
    }

    // Standard Chat Flow
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
        conversation_id: activeConvId && !activeConvId.startsWith("local-") ? activeConvId : undefined,
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

      // Auto-extract HTML / React Artifacts into Live Canvas
      if (response.content.includes("```html") || response.content.includes("<!DOCTYPE") || response.content.includes("<html")) {
        const match = response.content.match(/```html([\s\S]*?)```/);
        if (match && match[1]) {
          setCanvasTitle("Canlı Web / HTML Bileşeni");
          setCanvasCode(match[1]);
          setIsCanvasOpen(true);
        }
      }

      if (autoSpeak && typeof window !== "undefined" && "speechSynthesis" in window) {
        speakMessage(response.content);
      }
    } catch (err: any) {
      // Graceful fallback for offline demo
      const fallbackReply = `Yanıtınız işlendi:\n\n${userText}\n\n*Servis bağlantısı: ${selectedModel} aktif.*`;
      setMessages((prev) => [
        ...prev,
        {
          id: "resp-" + Date.now(),
          role: "assistant",
          content: fallbackReply,
          model_name: selectedModel,
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
    // Clean markdown before speaking
    const cleanText = text.replace(/[*#`_\[\]()]/g, "").slice(0, 300);
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "tr-TR";
    utterance.rate = 1.05;
    window.speechSynthesis.speak(utterance);
  };

  const effectiveSubSidebarWidth = isSubSidebarCollapsed ? 0 : subSidebarWidth;

  const filteredConversations = conversations.filter((c) =>
    (c.title || "").toLowerCase().includes(searchQuery.toLowerCase())
  );
  const pinnedList = filteredConversations.filter((c) => pinnedIds.includes(c.id));
  const regularList = filteredConversations.filter((c) => !pinnedIds.includes(c.id));

  return (
    <div className="flex h-screen overflow-hidden bg-[#131316] text-[#E4E4E7]">
      {/* 1. Sub-Sidebar: History, Pinned & Search */}
      <div
        style={{ width: `${effectiveSubSidebarWidth}px` }}
        className={cn(
          "border-r border-[#27272a] bg-[#18181b] flex flex-col justify-between shrink-0 relative transition-[width] duration-75 select-none",
          isSubSidebarCollapsed && "hidden"
        )}
      >
        <div className="p-3 space-y-2.5">
          {/* New Chat Button */}
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-[#222228] hover:bg-[#2b2b34] border border-[#33333e] text-[#f4f4f5] text-xs font-semibold shadow-sm transition-all hover:border-amber-500/40"
          >
            <span className="text-amber-400 font-bold text-sm leading-none">+</span>
            <span>Yeni Sohbet</span>
          </button>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Sohbetlerde ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#131316] border border-[#27272a] rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-300 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
            />
          </div>
        </div>

        {/* Conversation Streams */}
        <div className="flex-1 overflow-y-auto px-2 space-y-3">
          {/* Pinned Section */}
          {pinnedList.length > 0 && (
            <div className="space-y-1">
              <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-500/80 flex items-center space-x-1.5">
                <Pin className="w-2.5 h-2.5" />
                <span>Sabitlenenler</span>
              </div>
              {pinnedList.map((c) => (
                <div
                  key={c.id}
                  onClick={() => {
                    setIsArenaMode(false);
                    setActiveConvId(c.id);
                  }}
                  className={cn(
                    "group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-all",
                    activeConvId === c.id && !isArenaMode
                      ? "bg-[#272730] text-amber-400 font-semibold border border-amber-500/30"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-[#1f1f26] border border-transparent"
                  )}
                >
                  <span className="truncate flex-1 text-left">{c.title || "İsimsiz"}</span>
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => togglePin(c.id, e)} className="p-0.5 hover:text-amber-400">
                      <Pin className="w-3 h-3 fill-amber-500 text-amber-500" />
                    </button>
                    <button onClick={(e) => handleDeleteChat(c.id, e)} className="p-0.5 hover:text-rose-400">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Regular History */}
          <div className="space-y-1">
            <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center justify-between">
              <span>Sohbetler</span>
              <span className="font-mono text-[9px]">{regularList.length}</span>
            </div>
            {regularList.map((c) => (
              <div
                key={c.id}
                onClick={() => {
                  setIsArenaMode(false);
                  setActiveConvId(c.id);
                }}
                className={cn(
                  "group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-all",
                  activeConvId === c.id && !isArenaMode
                    ? "bg-[#272730] text-zinc-100 font-medium border border-[#3f3f4e]"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-[#1f1f26] border border-transparent"
                )}
              >
                <span className="truncate flex-1 text-left">{c.title || "İsimsiz"}</span>
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => togglePin(c.id, e)} className="p-0.5 hover:text-amber-400" title="Sabitle">
                    <Pin className="w-3 h-3 text-zinc-400 hover:text-amber-400" />
                  </button>
                  <button onClick={(e) => handleDeleteChat(c.id, e)} className="p-0.5 hover:text-rose-400" title="Sil">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Resizer Handle */}
        <div
          onMouseDown={startResizingSubSidebar}
          title="Sohbet Listesi Genişliğini Ayarlayın"
          className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-amber-500/50 active:bg-amber-500 transition-colors z-30 group flex items-center justify-center"
        >
          <div className="w-0.5 h-8 bg-zinc-700 group-hover:bg-amber-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      {/* 2. Main Chat / Hero Screen */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#131316]">
        {/* Top Minimal Bar */}
        <div className="h-12 border-b border-[#27272a] px-4 flex items-center justify-between bg-[#18181b]/60 backdrop-blur-md">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsSubSidebarCollapsed(!isSubSidebarCollapsed)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-[#272730] transition-colors"
              title={isSubSidebarCollapsed ? "Sohbet Geçmişini Aç" : "Sohbet Geçmişini Gizle"}
            >
              <Columns className="w-4 h-4" />
            </button>
            <span className="text-xs text-zinc-400 font-medium">
              {conversations.find((c) => c.id === activeConvId)?.title || "Yeni Sohbet"}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {/* Live Canvas Toggle */}
            <button
              onClick={() => setIsCanvasOpen(!isCanvasOpen)}
              className={cn(
                "flex items-center space-x-1.5 py-1 px-2.5 rounded-lg text-xs font-medium border transition-all",
                isCanvasOpen
                  ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                  : "bg-[#1f1f26] text-zinc-400 border-[#2e2e38] hover:text-zinc-200"
              )}
            >
              <Code className="w-3.5 h-3.5 text-amber-500" />
              <span>Artifacts</span>
            </button>

            {/* Plan Badge */}
            <span className="text-[10px] font-mono text-zinc-400 bg-[#222228] px-2 py-0.5 rounded-md border border-[#33333e]">
              Free plan · <span className="text-amber-400 hover:underline cursor-pointer">15 Kişilik Demo</span>
            </span>
          </div>
        </div>

        {/* Content Viewport */}
        <div className="flex-1 flex overflow-hidden relative">
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {/* Empty / Welcome Hero (Claude Style) */}
              {messages.length === 0 && !isArenaMode ? (
                <div className="min-h-[70vh] flex flex-col items-center justify-center max-w-2xl mx-auto px-4 text-center space-y-6">
                  {/* Hero Title with Terracotta Asterisk */}
                  <div className="flex items-center justify-center space-x-3">
                    <span className="text-amber-600 text-3xl font-serif font-black animate-pulse">✳</span>
                    <h1 className="text-2xl sm:text-3xl font-serif tracking-tight text-[#f4f4f5]">
                      Welcome, {userName}
                    </h1>
                  </div>

                  {/* Claude Style Center Prompt Box */}
                  <div className="w-full rounded-2xl bg-[#1e1e24] border border-[#2f2f3a] focus-within:border-amber-500/60 shadow-xl transition-all p-3 text-left">
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      rows={3}
                      placeholder="How can I help you today?"
                      className="w-full bg-transparent text-[#f4f4f5] text-sm placeholder-zinc-500 focus:outline-none resize-none px-2 pt-1"
                    />

                    {/* Bottom Controls inside the Box */}
                    <div className="flex items-center justify-between pt-2 border-t border-[#272730] mt-2">
                      {/* Left: Mode Switchers */}
                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => {
                            const next = input ? `${input}\n[Dosya Eklendi]` : "Dosya analizi için belge hazır.";
                            setInput(next);
                          }}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-[#2a2a34] transition-colors"
                          title="Dosya veya Görsel Ekle"
                        >
                          <Plus className="w-4 h-4" />
                        </button>

                        <div className="flex items-center bg-[#16161b] rounded-lg p-0.5 border border-[#272730]">
                          <button
                            type="button"
                            onClick={() => setActiveMode("chat")}
                            className={cn(
                              "px-2.5 py-1 rounded-md text-xs font-medium transition-all",
                              activeMode === "chat" ? "bg-[#2a2a34] text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
                            )}
                          >
                            Chat
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveMode("image")}
                            className={cn(
                              "px-2.5 py-1 rounded-md text-xs font-medium transition-all flex items-center space-x-1",
                              activeMode === "image" ? "bg-[#2a2a34] text-amber-400 font-semibold" : "text-zinc-500 hover:text-zinc-300"
                            )}
                          >
                            <Sparkles className="w-3 h-3 text-amber-500" />
                            <span>Görsel</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveMode("code")}
                            className={cn(
                              "px-2.5 py-1 rounded-md text-xs font-medium transition-all",
                              activeMode === "code" ? "bg-[#2a2a34] text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
                            )}
                          >
                            Kod
                          </button>
                        </div>
                      </div>

                      {/* Right: Model Selector & Actions */}
                      <div className="flex items-center space-x-2">
                        {/* Model Dropdown */}
                        <select
                          value={selectedModel}
                          onChange={(e) => setSelectedModel(e.target.value)}
                          className="bg-[#16161b] text-zinc-300 text-xs rounded-lg px-2.5 py-1 border border-[#272730] focus:outline-none focus:border-amber-500/50 cursor-pointer"
                        >
                          {models.map((m) => (
                            <option key={m.id} value={m.id} className="bg-[#1c1c22] text-zinc-200">
                              {m.name || m.id}
                            </option>
                          ))}
                        </select>

                        {/* Mic Speech-to-Text */}
                        <button
                          type="button"
                          onClick={toggleRecording}
                          className={cn(
                            "p-1.5 rounded-lg transition-colors",
                            isRecording
                              ? "bg-rose-500/20 text-rose-400 animate-pulse"
                              : "text-zinc-400 hover:text-zinc-200 hover:bg-[#2a2a34]"
                          )}
                          title="Sesli Konuş (Dikte)"
                        >
                          <Mic className="w-4 h-4" />
                        </button>

                        {/* Send Button */}
                        <button
                          type="button"
                          onClick={handleSend}
                          disabled={!input.trim() || loading}
                          className="p-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white disabled:opacity-30 transition-all"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Quick Action Chips (Claude Style) */}
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    {[
                      { icon: "✏️", label: "Write", prompt: "Etkileyici bir e-posta taslağı veya blog yazısı hazırla." },
                      { icon: "💡", label: "Learn", prompt: "Kuantum bilgisayarları 12 yaşındaki birine anlatır gibi açıkla." },
                      { icon: "</>", label: "Code", prompt: "FastAPI ve React ile modern bir web servisi iskeleti yaz." },
                      { icon: "🎨", label: "Görsel Çiz", prompt: "Siberpunk İstanbul Boğazı, neon ışıklar, sinematik 8k", mode: "image" },
                      { icon: "✨", label: "Claude's choice", prompt: "Günün en yaratıcı yapay zeka proje fikrini ve adımlarını listele." },
                    ].map((chip, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          if (chip.mode === "image") setActiveMode("image");
                          setInput(chip.prompt);
                        }}
                        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#1c1c22] hover:bg-[#25252d] border border-[#2b2b35] hover:border-amber-500/40 text-xs text-zinc-300 hover:text-[#f4f4f5] transition-all shadow-xs"
                      >
                        <span>{chip.icon}</span>
                        <span>{chip.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* Chat Messages Stream */
                <div className="max-w-3xl mx-auto space-y-5 pb-6">
                  {messages.map((m, idx) => {
                    const isUser = m.role === "user";
                    return (
                      <div
                        key={m.id || idx}
                        className={cn("flex space-x-3", isUser ? "justify-end" : "justify-start")}
                      >
                        {!isUser && (
                          <div className="w-7 h-7 rounded-lg bg-[#272730] border border-[#3f3f4e] flex items-center justify-center shrink-0 text-amber-500 font-serif font-bold text-sm shadow-xs">
                            ✳
                          </div>
                        )}

                        <div
                          className={cn(
                            "relative group px-4 py-3 rounded-2xl text-xs sm:text-sm leading-relaxed max-w-[85%]",
                            isUser
                              ? "bg-[#2a2a32] text-[#f4f4f5] border border-[#393945] rounded-tr-none"
                              : "bg-[#18181c] border border-[#27272f] text-zinc-200 rounded-tl-none"
                          )}
                        >
                          {!isUser && (
                            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 mb-2 border-b border-[#23232b] pb-1">
                              <span className="font-medium text-amber-500/90">{m.model_name || selectedModel}</span>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => speakMessage(m.content)}
                                  className="hover:text-zinc-300 transition-colors"
                                  title="Sesli Oku"
                                >
                                  <Volume2 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleCopy(m.content, m.id)}
                                  className="hover:text-zinc-300 transition-colors"
                                  title="Kopyala"
                                >
                                  {copiedId === m.id ? (
                                    <Check className="w-3 h-3 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            </div>
                          )}

                          <div className="prose prose-invert prose-xs max-w-none break-words">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {m.content}
                            </ReactMarkdown>
                          </div>
                        </div>

                        {isUser && (
                          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-600 to-orange-700 flex items-center justify-center shrink-0 text-white text-[10px] font-bold shadow-xs">
                            {userName.slice(0, 1).toUpperCase()}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {loading && (
                    <div className="flex space-x-3 items-center">
                      <div className="w-7 h-7 rounded-lg bg-[#272730] border border-[#3f3f4e] flex items-center justify-center shrink-0 text-amber-500 font-serif font-bold text-sm animate-pulse">
                        ✳
                      </div>
                      <div className="px-3.5 py-2.5 rounded-xl bg-[#18181c] border border-[#27272f] text-xs text-zinc-400 flex items-center space-x-2 shadow-xs">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" />
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce [animation-delay:0.2s]" />
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce [animation-delay:0.4s]" />
                        <span className="text-[11px] font-mono ml-2 text-zinc-400">Claude yanıtı hazırlıyor...</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Bottom Floating Bar (When chatting) */}
            {messages.length > 0 && (
              <div className="p-4 bg-[#131316]/90 backdrop-blur-md border-t border-[#222228]">
                <div className="max-w-3xl mx-auto rounded-2xl bg-[#1c1c22] border border-[#2b2b35] focus-within:border-amber-500/60 p-2.5 transition-all">
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
                    placeholder="Bir mesaj yazın veya devam edin..."
                    className="w-full bg-transparent text-[#f4f4f5] text-xs sm:text-sm placeholder-zinc-500 focus:outline-none resize-none px-2"
                  />

                  <div className="flex items-center justify-between pt-1 border-t border-[#25252f] mt-1">
                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={toggleRecording}
                        className={cn(
                          "p-1.5 rounded-lg transition-colors",
                          isRecording
                            ? "bg-rose-500/20 text-rose-400 animate-pulse"
                            : "text-zinc-400 hover:text-zinc-200 hover:bg-[#25252e]"
                        )}
                        title="Sesli Konuş"
                      >
                        <Mic className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center space-x-2">
                      <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className="bg-[#131316] text-zinc-300 text-[11px] rounded-lg px-2 py-1 border border-[#2a2a34] focus:outline-none"
                      >
                        {models.map((m) => (
                          <option key={m.id} value={m.id} className="bg-[#1c1c22]">
                            {m.name || m.id}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={handleSend}
                        disabled={!input.trim() || loading}
                        className="p-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white disabled:opacity-30 transition-all"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 3. Claude Artifacts / Live Canvas Split Pane */}
          {isCanvasOpen && (
            <div
              style={{ width: `${canvasWidth}px` }}
              className="border-l border-[#27272a] bg-[#16161a] flex flex-col justify-between shrink-0 relative transition-[width] duration-75 shadow-2xl select-none"
            >
              {/* Resizer Handle */}
              <div
                onMouseDown={startResizingCanvas}
                title="Artifacts Panel Genişliği"
                className="absolute top-0 left-0 w-1 h-full cursor-col-resize hover:bg-amber-500/50 active:bg-amber-500 transition-colors z-30 group flex items-center justify-center"
              >
                <div className="w-0.5 h-8 bg-zinc-700 group-hover:bg-amber-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              {/* Header */}
              <div className="h-11 border-b border-[#27272a] px-3.5 flex items-center justify-between bg-[#19191e]">
                <div className="flex items-center space-x-2">
                  <span className="text-amber-500 font-serif font-bold">✳</span>
                  <span className="text-xs font-semibold text-zinc-200">{canvasTitle}</span>
                </div>
                <button
                  onClick={() => setIsCanvasOpen(false)}
                  className="p-1 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Preview Iframe */}
              <div className="flex-1 p-2 bg-[#101013] overflow-hidden">
                <iframe
                  title="Claude Artifacts Preview"
                  srcDoc={canvasCode}
                  sandbox="allow-scripts allow-modals"
                  className="w-full h-full rounded-xl bg-white border border-[#27272a]"
                />
              </div>

              {/* Code Editor */}
              <div className="h-36 border-t border-[#27272a] p-2 bg-[#141418]">
                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 pb-1 px-1">
                  <span>Artifacts HTML / JS</span>
                  <button
                    onClick={() => {
                      setCanvasCode(
                        `<div style="font-family: system-ui; text-align: center; padding: 40px; background: #18181b; color: #f4f4f5; border-radius: 16px; border: 1px solid #27272a;">
  <h2 style="color: #d97706; margin-bottom: 8px;">✳ Claude Live Artifacts</h2>
  <p style="color: #a1a1aa; font-size: 14px;">Canlı bileşen alanı hazır.</p>
</div>`
                      );
                    }}
                    className="hover:text-amber-400 flex items-center space-x-1"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    <span>Sıfırla</span>
                  </button>
                </div>
                <textarea
                  value={canvasCode}
                  onChange={(e) => setCanvasCode(e.target.value)}
                  className="w-full h-24 p-2 rounded-lg bg-[#1a1a20] border border-[#2b2b35] font-mono text-[11px] text-zinc-200 focus:outline-none focus:border-amber-500/60 resize-none"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
