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
  Check
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ApiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadModels();
    loadConversations();
  }, []);

  useEffect(() => {
    if (activeConvId) {
      loadConversationMessages(activeConvId);
    }
  }, [activeConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
      if (data.length > 0 && !activeConvId) {
        setActiveConvId(data[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadConversationMessages = async (id: string) => {
    try {
      const data = await ApiClient.getConversation(id);
      setMessages(data.messages || []);
      if (data.model) setSelectedModel(data.model);
    } catch (e) {
      console.error(e);
    }
  };

  const handleNewChat = async () => {
    try {
      const newConv = await ApiClient.createConversation({
        title: "Yeni Sohbet",
        model: selectedModel,
      });
      setConversations([newConv, ...conversations]);
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
      const remaining = conversations.filter((c) => c.id !== id);
      setConversations(remaining);
      if (activeConvId === id) {
        setActiveConvId(remaining.length > 0 ? remaining[0].id : null);
        setMessages([]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput("");

    // Optimistic user message
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

      // Update active conv ID if it was created
      if (!activeConvId && response.conversation_id) {
        setActiveConvId(response.conversation_id);
        loadConversations();
      }

      setMessages((prev) => [...prev.filter((m) => m.id !== tempUserMsg.id), tempUserMsg, response]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: "err-" + Date.now(),
          role: "assistant",
          content: `⚠️ Bir hata oluştu: ${err.message || "İstek işlenemedi."}`,
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

  const toggleVoiceRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      setInput((prev) => (prev ? `${prev} [Sesli komut başarıyla algılandı]` : "Yapay zeka modellerinin genel mimarisini açıklar mısın?"));
    } else {
      setIsRecording(true);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#090d16]">
      {/* Conversation Sidebar */}
      <div className="w-64 border-r border-slate-800/80 bg-slate-950/50 flex flex-col justify-between shrink-0">
        <div className="p-3">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Sohbet</span>
          </button>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          <p className="px-3 py-1.5 text-[10px] font-mono uppercase text-slate-500 tracking-wider">Geçmiş Sohbetler</p>
          {conversations.map((c) => (
            <div
              key={c.id}
              onClick={() => setActiveConvId(c.id)}
              className={cn(
                "group flex items-center justify-between px-3 py-2 rounded-lg text-xs cursor-pointer transition-all",
                activeConvId === c.id
                  ? "bg-slate-800 text-white font-medium"
                  : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
              )}
            >
              <span className="truncate flex-1 pr-2">{c.title}</span>
              <button
                onClick={(e) => handleDeleteChat(c.id, e)}
                className="opacity-0 group-hover:opacity-100 hover:text-red-400 p-1 rounded transition-opacity"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {conversations.length === 0 && (
            <p className="px-3 py-4 text-xs text-slate-600 italic">Henüz sohbet geçmişi yok.</p>
          )}
        </div>

        {/* Info footer */}
        <div className="p-3 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-between">
          <span>LiteLLM Router</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>
      </div>

      {/* Main Chat Arena */}
      <div className="flex-1 flex flex-col h-screen min-w-0">
        {/* Top Header & Model Selector */}
        <div className="h-16 px-6 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/30 backdrop-blur">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="appearance-none bg-slate-900 border border-slate-700/80 text-white text-xs rounded-xl px-4 py-2 pr-8 font-semibold focus:outline-none focus:border-indigo-500 transition-all cursor-pointer shadow-sm"
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.provider}: {m.name} {m.is_free ? "(Free)" : ""}
                  </option>
                ))}
                {models.length === 0 && (
                  <>
                    <option value="gpt-4o">OpenAI: GPT-4o (Omni)</option>
                    <option value="claude-3-7-sonnet-latest">Anthropic: Claude 3.7 Sonnet</option>
                    <option value="gemini-2.0-flash">Google: Gemini 2.0 Flash</option>
                    <option value="deepseek-ai/DeepSeek-R1">DeepSeek: DeepSeek R1</option>
                  </>
                )}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            </div>

            {/* Quick badges */}
            <div className="hidden sm:flex items-center space-x-2 text-[11px]">
              <button
                onClick={() => setEnableMemory(!enableMemory)}
                className={cn(
                  "flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border transition-all",
                  enableMemory
                    ? "bg-indigo-500/10 border-indigo-500/40 text-indigo-300 font-medium"
                    : "bg-slate-900 border-slate-800 text-slate-500"
                )}
              >
                <Brain className="w-3 h-3" />
                <span>Qdrant Hafıza: {enableMemory ? "Açık" : "Kapalı"}</span>
              </button>

              <button
                onClick={() => setEnableWebSearch(!enableWebSearch)}
                className={cn(
                  "flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border transition-all",
                  enableWebSearch
                    ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-300 font-medium"
                    : "bg-slate-900 border-slate-800 text-slate-500"
                )}
              >
                <Globe className="w-3 h-3" />
                <span>Web Arama: {enableWebSearch ? "Açık" : "Kapalı"}</span>
              </button>
            </div>
          </div>

          <div className="text-[11px] font-mono text-slate-400">
            NexusAI Core v1.0
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mb-4">
                <Sparkles className="w-7 h-7 text-indigo-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Nasıl yardımcı olabilirim?</h2>
              <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                GPT, Claude 3.7, Gemini, DeepSeek veya Llama modellerini seçin. Kod yazabilir, teknik analiz yapabilir, hafızanızı kullanabilirsiniz.
              </p>
              <div className="grid grid-cols-2 gap-2 w-full text-left">
                {[
                  "Mikroservis mimarisini tasarla",
                  "FastAPI için JWT auth yaz",
                  "DeepSeek vs Claude 3.7 kıyasla",
                  "Qdrant RAG pipeline oluştur"
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
                        {m.tokens_used ? <span>{m.tokens_used} tokens</span> : null}
                        <button
                          onClick={() => handleCopy(m.content, m.id)}
                          className="hover:text-white transition-colors"
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
              placeholder="Bir mesaj yazın veya soru sorun... (Shift + Enter: yeni satır)"
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
                  title="Sesli Giriş"
                >
                  {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">
                  {selectedModel}
                </span>
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!input.trim() || loading}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-xs flex items-center space-x-1.5 transition-all shadow-md shadow-indigo-600/20"
                >
                  <span>Gönder</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
