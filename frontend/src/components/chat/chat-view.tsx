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
  Zap
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

  // New Super Features: Arena Mode & Canvas Studio
  const [isArenaMode, setIsArenaMode] = useState(false);
  const [arenaResults, setArenaResults] = useState<any[]>([]);
  const [arenaLoading, setArenaLoading] = useState(false);
  const [isCanvasOpen, setIsCanvasOpen] = useState(false);
  const [canvasCode, setCanvasCode] = useState<string>(
    `<div style="font-family: system-ui; text-align: center; padding: 40px; background: #0f172a; color: #fff; border-radius: 16px;">
  <h2 style="color: #6366f1;">🚀 NexusAI Live Canvas</h2>
  <p style="color: #94a3b8;">Yapay zekanın yazdığı HTML, React veya SVG kodları burada canlı çalışır.</p>
  <button style="padding: 10px 20px; background: #4f46e5; color: white; border: none; border-radius: 8px; cursor: pointer; margin-top: 12px;" onclick="alert('Canvas Aktif!')">Bana Tıkla</button>
</div>`
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadModels();
    loadConversations();
  }, []);

  useEffect(() => {
    if (activeConvId && !isArenaMode) {
      // First load from localStorage cache for instant UI if available
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
        try {
          localStorage.setItem(`nexus_chat_${id}`, JSON.stringify(data.messages));
        } catch (e) {}
      }
      if (data && data.model) setSelectedModel(data.model);
    } catch (e) {
      console.error(e);
    }
  };

  const handleNewChat = async () => {
    try {
      setIsArenaMode(false);
      const newConv = await ApiClient.createConversation({
        title: "Yeni Sohbet",
        model: selectedModel,
      });
      setConversations([newConv, ...conversations]);
      setActiveConvId(newConv.id);
      setMessages([]);
      localStorage.setItem("nexus_active_conv_id", newConv.id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteChat = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await ApiClient.deleteConversation(id);
      try {
        localStorage.removeItem(`nexus_chat_${id}`);
      } catch (e) {}
      const remaining = conversations.filter((c) => c.id !== id);
      setConversations(remaining);
      if (activeConvId === id) {
        const nextId = remaining.length > 0 ? remaining[0].id : null;
        setActiveConvId(nextId);
        setMessages([]);
        if (nextId) {
          localStorage.setItem("nexus_active_conv_id", nextId);
        } else {
          localStorage.removeItem("nexus_active_conv_id");
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading || arenaLoading) return;

    const userText = input.trim();
    setInput("");

    // If Arena Mode is ON, execute parallel comparison
    if (isArenaMode) {
      setArenaLoading(true);
      try {
        const res = await ApiClient.runArena({
          prompt: userText,
          models: ["gpt-4o", "claude-3-7-sonnet-latest", "deepseek-ai/DeepSeek-R1"]
        });
        setArenaResults(res.evaluations || []);
      } catch (err) {
        console.error(err);
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

      // Check if response has HTML/code block to display in Canvas
      if (response.content.includes("```html") || response.content.includes("<div")) {
        const match = response.content.match(/```html([\s\S]*?)```/);
        if (match && match[1]) {
          setCanvasCode(match[1]);
        }
      }

      // Voice TTS feedback if recording was used
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

  const toggleVoiceRecording = () => {
    if (typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = "tr-TR";
      recognition.interimResults = false;

      if (!isRecording) {
        setIsRecording(true);
        recognition.start();
        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInput(transcript);
          setIsRecording(false);
        };
        recognition.onerror = () => setIsRecording(false);
        recognition.onend = () => setIsRecording(false);
      } else {
        setIsRecording(false);
        recognition.stop();
      }
    } else {
      setIsRecording(!isRecording);
      if (!isRecording) {
        setInput("Yapay zeka modellerinin genel mimarisini açıklar mısın?");
      }
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#090d16]">
      {/* Sidebar */}
      <div className="w-64 border-r border-slate-800/80 bg-slate-950/50 flex flex-col justify-between shrink-0">
        <div className="p-3 space-y-2">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Sohbet</span>
          </button>

          {/* Arena Mode Button */}
          <button
            onClick={() => setIsArenaMode(!isArenaMode)}
            className={cn(
              "w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-xl text-xs font-semibold border transition-all",
              isArenaMode
                ? "bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-md shadow-amber-500/10"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
            )}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>{isArenaMode ? "⚔️ Arena Modu (Açık)" : "Multi-Model Arena"}</span>
          </button>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          <p className="px-3 py-1.5 text-[10px] font-mono uppercase text-slate-500 tracking-wider">Geçmiş Sohbetler</p>
          {conversations.map((c) => (
            <div
              key={c.id}
              onClick={() => {
                setIsArenaMode(false);
                setActiveConvId(c.id);
              }}
              className={cn(
                "group flex items-center justify-between px-3 py-2 rounded-lg text-xs cursor-pointer transition-all",
                activeConvId === c.id && !isArenaMode
                  ? "bg-indigo-600/15 text-indigo-300 font-medium border border-indigo-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
              )}
            >
              <span className="truncate pr-2">{c.title || "İsimsiz Sohbet"}</span>
              <button
                onClick={(e) => handleDeleteChat(c.id, e)}
                className="opacity-0 group-hover:opacity-100 hover:text-red-400 p-1 transition-opacity"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>

        {/* Status Info */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-900/20 text-[11px] text-slate-500 space-y-1">
          <div className="flex items-center justify-between">
            <span>Model Motoru</span>
            <span className="text-emerald-400 font-mono">Sıfır API Key (Free)</span>
          </div>
        </div>
      </div>

      {/* Main Chat / Arena View */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#090d16]">
        {/* Top bar */}
        <div className="h-14 border-b border-slate-800/80 px-6 flex items-center justify-between bg-slate-950/40 backdrop-blur-md">
          <div className="flex items-center space-x-3">
            {!isArenaMode ? (
              <div className="relative">
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="appearance-none bg-slate-900 border border-slate-700/80 text-white text-xs font-semibold px-3 py-1.5 pr-8 rounded-xl focus:outline-none focus:border-indigo-500 cursor-pointer"
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
                <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-bold font-mono">
                  ⚔️ ARENA: GPT-4o vs Claude 3.7 vs DeepSeek-R1
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setEnableMemory(!enableMemory)}
              className={cn(
                "flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors",
                enableMemory ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "text-slate-500 border-slate-800"
              )}
              title="Qdrant Vektör Hafıza"
            >
              <Brain className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Hafıza</span>
            </button>

            <button
              onClick={() => setIsCanvasOpen(!isCanvasOpen)}
              className={cn(
                "flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors",
                isCanvasOpen ? "bg-purple-500/20 text-purple-300 border-purple-500/40" : "text-slate-400 border-slate-800 hover:text-white"
              )}
              title="Canlı Canvas & Artifacts Önizleyici"
            >
              <Code className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Live Canvas</span>
            </button>
          </div>
        </div>

        {/* Content Area with optional Canvas split */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Messages / Arena */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Messages / Arena Container */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {isArenaMode ? (
                /* Multi-Model Arena Split Columns */
                <div className="space-y-6">
                  <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-center">
                    <h2 className="text-sm font-bold text-amber-300">Multi-Model Arena Kıyaslama Modu</h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Aşağıdaki kutuya sorunuzu yazın; GPT-4o, Claude 3.7 ve DeepSeek-R1 aynı anda paralel cevaplasın.
                    </p>
                  </div>

                  {arenaResults.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {arenaResults.map((evalItem, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between space-y-3 shadow-lg"
                        >
                          <div>
                            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                              <span className="font-bold text-xs text-indigo-400 font-mono">
                                {evalItem.model}
                              </span>
                              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-mono">
                                ⭐ {evalItem.score}/10
                              </span>
                            </div>
                            <div className="text-xs text-slate-300 leading-relaxed font-sans max-h-96 overflow-y-auto pr-1">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {evalItem.response}
                              </ReactMarkdown>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-2 border-t border-slate-800/60">
                            <span>Süre: {evalItem.duration_sec}s</span>
                            <span>{evalItem.tokens} tokens</span>
                            <button
                              onClick={() => speakMessage(evalItem.response)}
                              className="hover:text-white transition-colors"
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
                    <div className="p-8 text-center text-xs text-amber-300 animate-pulse">
                      ⚔️ 3 Model Aynı Anda Yanıt Üretiyor (GPT-4o, Claude 3.7, DeepSeek-R1)...
                    </div>
                  )}
                </div>
              ) : (
                /* Classic Chat Message Stream */
                <>
                  {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto p-6 space-y-4">
                      <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-xl shadow-indigo-600/10">
                        <Sparkles className="w-8 h-8 animate-pulse" />
                      </div>
                      <h2 className="text-lg font-bold text-white">Nasıl yardımcı olabilirim?</h2>
                      <p className="text-xs text-slate-400">
                        GPT-4o, Claude 3.7, DeepSeek-R1 ve Gemini 2.0 ile dilediğiniz konuda sohbet edin, kod yazın veya analiz isteyin.
                      </p>
                      <div className="grid grid-cols-2 gap-2 w-full text-left pt-2">
                        {[
                          "FastAPI mikroservisi tasarla",
                          "DeepSeek vs Claude 3.7 kıyasla",
                          "Canlı HTML5 web oyunu yaz",
                          "Qdrant vektör hafıza mimarisi"
                        ].map((s, idx) => (
                          <button
                            key={idx}
                            onClick={() => setInput(s)}
                            className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 text-xs text-slate-300 hover:text-white transition-all text-left"
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
                          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0 shadow-md">
                            <Bot className="w-4 h-4 text-white" />
                          </div>
                        )}

                        <div
                          className={cn(
                            "relative group px-4 py-3 rounded-2xl text-xs sm:text-sm leading-relaxed max-w-[85%]",
                            isUser
                              ? "bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-600/15"
                              : "bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none"
                          )}
                        >
                          {!isUser && (
                            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-2 border-b border-slate-800/80 pb-1">
                              <span>{m.model_name || selectedModel}</span>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => speakMessage(m.content)}
                                  className="hover:text-white transition-colors"
                                  title="Seslendir"
                                >
                                  <Volume2 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleCopy(m.content, m.id)}
                                  className="hover:text-white transition-colors"
                                  title="Kopyala"
                                >
                                  {copiedId === m.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                </button>
                              </div>
                            </div>
                          )}

                          <div className="prose prose-invert prose-xs max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {m.content}
                            </ReactMarkdown>
                          </div>
                        </div>

                        {isUser && (
                          <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                            <User className="w-4 h-4 text-slate-300" />
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {loading && (
                    <div className="flex space-x-3 max-w-4xl mx-auto items-center">
                      <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0 animate-pulse">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="px-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-400 flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" />
                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]" />
                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.4s]" />
                        <span className="text-[11px] font-mono ml-2">Yapay zeka yanıtı üretiyor...</span>
                      </div>
                    </div>
                  )}
                </>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-4 bg-slate-950/60 border-t border-slate-800/80">
              <div className="max-w-4xl mx-auto relative rounded-2xl bg-slate-900 border border-slate-700/80 focus-within:border-indigo-500 shadow-xl transition-all">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder={
                    isArenaMode
                      ? "Arena sorunuzu yazın (GPT-4o vs Claude 3.7 vs DeepSeek)..."
                      : "Bir mesaj yazın veya soru sorun... (Shift + Enter: yeni satır)"
                  }
                  rows={2}
                  className="w-full bg-transparent text-slate-100 text-xs sm:text-sm px-4 py-3 rounded-2xl focus:outline-none resize-none placeholder-slate-500"
                />

                <div className="flex items-center justify-between px-3 pb-2 pt-1 border-t border-slate-800/60 text-slate-400 text-xs">
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={toggleVoiceRecording}
                      className={cn(
                        "p-1.5 rounded-lg transition-colors",
                        isRecording ? "bg-rose-500/20 text-rose-400 animate-pulse" : "hover:bg-slate-800 hover:text-slate-200"
                      )}
                      title="Canlı Sesli Konuşma (Microphone)"
                    >
                      {isRecording ? <MicOff className="w-4 h-4 text-rose-400" /> : <Mic className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={handleSend}
                      disabled={!input.trim() || loading || arenaLoading}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-xs flex items-center space-x-1.5 transition-all shadow-md shadow-indigo-600/20"
                    >
                      <span>{isArenaMode ? "Arena Başlat" : "Gönder"}</span>
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Live Canvas / Artifacts Studio */}
          {isCanvasOpen && (
            <div className="w-[450px] border-l border-slate-800 bg-slate-950 flex flex-col shrink-0 shadow-2xl transition-all">
              <div className="h-12 border-b border-slate-800 px-4 flex items-center justify-between bg-slate-900/60">
                <div className="flex items-center space-x-2 text-xs font-bold text-white">
                  <Code className="w-4 h-4 text-purple-400" />
                  <span>Canlı Canvas & Artifacts</span>
                </div>
                <button
                  onClick={() => setIsCanvasOpen(false)}
                  className="text-slate-400 hover:text-white text-xs p-1"
                >
                  ✕
                </button>
              </div>

              {/* Code Sandbox Preview iFrame */}
              <div className="flex-1 p-3 flex flex-col space-y-3">
                <div className="flex-1 rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow-inner flex flex-col">
                  <div className="p-2 border-b border-slate-800 bg-slate-950/80 text-[10px] font-mono text-slate-400 flex items-center justify-between">
                    <span>Live Sandbox Preview</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <iframe
                    srcDoc={canvasCode}
                    className="w-full flex-1 border-0 bg-white"
                    title="Live Canvas Sandbox"
                    sandbox="allow-scripts allow-modals"
                  />
                </div>

                <div className="h-36 rounded-xl border border-slate-800 bg-slate-900/50 p-2 flex flex-col">
                  <span className="text-[10px] font-mono text-slate-500 mb-1">Kaynak HTML / JS Kodu</span>
                  <textarea
                    value={canvasCode}
                    onChange={(e) => setCanvasCode(e.target.value)}
                    className="w-full flex-1 bg-slate-950 border border-slate-800 rounded-lg text-[10px] font-mono text-indigo-300 p-2 focus:outline-none resize-none"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
