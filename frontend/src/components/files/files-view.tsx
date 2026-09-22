"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  FileSpreadsheet,
  UploadCloud,
  FileText,
  FileJson,
  FileCode,
  Send,
  Table,
  Download,
  Trash2,
  Wand2,
  Zap,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Sparkles,
  Paperclip,
  Plus,
  Bot,
  User,
  CheckCircle2,
  RefreshCw,
  Search,
  ExternalLink,
  ChevronRight,
  Layers,
  FileCheck
} from "lucide-react";
import { ApiClient } from "../../lib/api-client";
import { formatBytes, cn } from "../../lib/utils";

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  attachments?: string[];
  generatedDoc?: any;
  timestamp: string;
}

export function FilesView() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [activeDocIds, setActiveDocIds] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  // Selected model
  const [selectedModel, setSelectedModel] = useState("gpt-4o");

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-1",
      role: "assistant",
      content:
        "Merhaba! **Belge & Veri Analizi Çalışma Alanı**na hoş geldiniz. 🚀\n\nBurada tıpkı ChatGPT veya Claude ile olduğu gibi bir konu üzerinde uzun uzun konuşabilir, fikir alışverişi yapabilir, ekleme ve çıkarmalar yapabilirsiniz. İstediğiniz anda bana **PDF, Excel, Word, CSV veya JSON** dosyaları yükleyebilir ve ardından:\n\n> *\"Şimdi tüm bu konuştuklarımızı profesyonel bir Excel tablosuna veya PDF raporuna dönüştür\"*\n\ndiyebilirsiniz. Hangi konu üzerinde çalışmak istersiniz?",
      timestamp: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [inputContent, setInputContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatAttachRef = useRef<HTMLInputElement>(null);

  // Document Synthesis Drawer/Modal state
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [synthFileType, setSynthFileType] = useState("xlsx");
  const [synthTitle, setSynthTitle] = useState("");
  const [synthInstruction, setSynthInstruction] = useState("");
  const [synthesizing, setSynthesizing] = useState(false);

  // Panel collapse states
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
  const [activeRightTab, setActiveRightTab] = useState<"preview" | "summary" | "data">("preview");

  useEffect(() => {
    loadDocuments();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadDocuments = async () => {
    try {
      const data = await ApiClient.getDocuments();
      setDocuments(data);
      if (data.length > 0 && !selectedDoc) {
        setSelectedDoc(data[0]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, autoAttachToChat: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const doc = await ApiClient.uploadDocument(file);
      setDocuments((prev) => [doc, ...prev]);
      setSelectedDoc(doc);
      setRightSidebarOpen(true);

      // Auto add to active chat context
      if (!activeDocIds.includes(doc.id)) {
        setActiveDocIds((prev) => [...prev, doc.id]);
      }

      if (autoAttachToChat) {
        // Post a message in the chat that document has been uploaded and parsed
        const systemMsg: ChatMessage = {
          id: `upload-${Date.now()}`,
          role: "assistant",
          content: `📁 **${doc.filename}** (${doc.file_type.toUpperCase()}, ${formatBytes(doc.file_size_bytes)}) yüklendi ve çalışma alanına eklendi.\n\n${
            doc.summary ? `**Özet:** ${doc.summary}\n\n` : ""
          }Bu dosya hakkındaki sorularınızı yanıtlayabilir veya bu verileri kullanarak yeni bir rapor/tablo oluşturabilirim.`,
          attachments: [doc.id],
          timestamp: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, systemMsg]);
      }
    } catch (err: any) {
      alert("Yükleme hatası: " + err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (chatAttachRef.current) chatAttachRef.current.value = "";
    }
  };

  const handleToggleDocActive = (docId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveDocIds((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  };

  const handleSendMessage = async (textToSend?: string) => {
    const prompt = (textToSend || inputContent).trim();
    if (!prompt || isSending) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: prompt,
      attachments: activeDocIds.length > 0 ? [...activeDocIds] : undefined,
      timestamp: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputContent("");
    setIsSending(true);

    try {
      // Format messages payload for backend
      const payloadMessages = newMessages.map((m) => ({
        role: m.role,
        content: m.content,
        attachments: m.attachments,
      }));

      const response = await ApiClient.workspaceChat({
        messages: payloadMessages,
        active_document_ids: activeDocIds,
        model: selectedModel,
      });

      const asstMsg: ChatMessage = {
        id: `asst-${Date.now()}`,
        role: "assistant",
        content: response.message?.content || "Yanıt oluşturulamadı.",
        timestamp: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, asstMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: `⚠️ Bir hata oluştu: ${err.message}`,
        timestamp: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
    }
  };

  const handleSynthesizeDocument = async (customType?: string) => {
    const fileType = customType || synthFileType;
    if (synthesizing) return;
    setSynthesizing(true);

    try {
      const payloadMessages = messages.map((m) => ({
        role: m.role,
        content: m.content,
        attachments: m.attachments,
      }));

      const newDoc = await ApiClient.workspaceSynthesize({
        messages: payloadMessages,
        active_document_ids: activeDocIds,
        file_type: fileType,
        title: synthTitle || `${fileType.toUpperCase()} Dokümanı`,
        custom_instruction: synthInstruction || undefined,
        model: selectedModel,
      });

      setDocuments((prev) => [newDoc, ...prev]);
      setSelectedDoc(newDoc);
      setRightSidebarOpen(true);
      setIsSynthesizing(false);
      setSynthTitle("");
      setSynthInstruction("");

      // Add success message in chat with artifact card
      const asstMsg: ChatMessage = {
        id: `doc-${Date.now()}`,
        role: "assistant",
        content: `🎉 **${newDoc.filename}** başarıyla oluşturuldu ve hazırlandı! Sağ panelden inceleyebilir veya aşağıdaki butondan doğrudan indirebilirsiniz.`,
        generatedDoc: newDoc,
        timestamp: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, asstMsg]);
    } catch (err: any) {
      alert("Doküman sentezleme hatası: " + err.message);
    } finally {
      setSynthesizing(false);
    }
  };

  const handleDeleteDoc = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Bu dokümanı silmek istediğinize emin misiniz?")) return;
    try {
      await ApiClient.deleteDocument(id);
      const remaining = documents.filter((d) => d.id !== id);
      setDocuments(remaining);
      setActiveDocIds((prev) => prev.filter((docId) => docId !== id));
      if (selectedDoc?.id === id) {
        setSelectedDoc(remaining.length > 0 ? remaining[0] : null);
      }
    } catch (err: any) {
      alert("Silme hatası: " + err.message);
    }
  };

  const handleStartNewSession = () => {
    setMessages([
      {
        id: `new-${Date.now()}`,
        role: "assistant",
        content:
          "Yeni çalışma alanı başlatıldı. 📝\n\nÜzerinde çalışmak istediğiniz konuyu yazabilir, dosya yükleyebilir veya analiz etmek istediğiniz verileri paylaşabilirsiniz.",
        timestamp: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  const getFileIcon = (type: string, className: string = "w-4 h-4") => {
    switch (type) {
      case "xlsx":
      case "xls":
      case "csv":
        return <FileSpreadsheet className={cn("text-emerald-600", className)} />;
      case "pdf":
        return <FileText className={cn("text-rose-500", className)} />;
      case "docx":
      case "doc":
        return <FileText className={cn("text-blue-500", className)} />;
      case "json":
        return <FileJson className={cn("text-amber-500", className)} />;
      default:
        return <FileCode className={cn("text-slate-500", className)} />;
    }
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.filename.toLowerCase().includes(searchFilter.toLowerCase());
    if (typeFilter === "all") return matchesSearch;
    if (typeFilter === "excel") return matchesSearch && ["xlsx", "xls", "csv"].includes(doc.file_type);
    if (typeFilter === "pdf") return matchesSearch && doc.file_type === "pdf";
    if (typeFilter === "word") return matchesSearch && ["docx", "doc"].includes(doc.file_type);
    if (typeFilter === "json") return matchesSearch && doc.file_type === "json";
    return matchesSearch;
  });

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8F9FB] text-slate-800">
      {/* ----------------- LEFT PANEL: Document Library & Hub ----------------- */}
      {leftSidebarOpen ? (
        <div className="w-80 border-r border-slate-200 bg-white flex flex-col justify-between shrink-0 shadow-xs z-10 select-none">
          {/* Top Header */}
          <div className="p-4 border-b border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-black text-slate-900">Materyaller & Dosyalar</h2>
                  <p className="text-[10px] text-slate-400 font-medium">Toplam {documents.length} doküman</p>
                </div>
              </div>
              <button
                onClick={() => setLeftSidebarOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                title="Paneli Gizle"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Upload Action */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleFileUpload(e, true)}
              className="hidden"
              accept=".pdf,.docx,.doc,.xlsx,.xls,.csv,.json,.txt"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full py-2.5 px-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-sm transition-all"
            >
              <UploadCloud className="w-4 h-4" />
              <span>{uploading ? "Ayrıştırılıyor..." : "Dosya / Materyal Yükle"}</span>
            </button>

            {/* Search & Filter */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Dosyalarda ara..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex space-x-1 overflow-x-auto pb-1 text-[11px]">
                {[
                  { id: "all", label: "Tümü" },
                  { id: "excel", label: "Excel/CSV" },
                  { id: "pdf", label: "PDF" },
                  { id: "word", label: "Word" },
                  { id: "json", label: "JSON" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setTypeFilter(tab.id)}
                    className={cn(
                      "px-2 py-0.5 rounded-lg font-medium whitespace-nowrap transition-colors",
                      typeFilter === tab.id
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Doc List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
            {filteredDocuments.map((doc) => {
              const isActive = activeDocIds.includes(doc.id);
              const isSelected = selectedDoc?.id === doc.id;

              return (
                <div
                  key={doc.id}
                  onClick={() => {
                    setSelectedDoc(doc);
                    setRightSidebarOpen(true);
                  }}
                  className={cn(
                    "p-2.5 rounded-2xl border text-xs cursor-pointer transition-all flex items-center justify-between group",
                    isSelected
                      ? "bg-orange-50/70 border-orange-300 text-slate-900 font-medium shadow-xs"
                      : "bg-white border-slate-200/80 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                  )}
                >
                  <div className="flex items-center space-x-2.5 overflow-hidden flex-1">
                    {getFileIcon(doc.file_type, "w-4 h-4 shrink-0")}
                    <div className="overflow-hidden flex-1">
                      <p className="truncate font-bold text-slate-900 leading-tight">{doc.filename}</p>
                      <p className="text-[10px] text-slate-400 font-mono flex items-center space-x-1">
                        <span>{formatBytes(doc.file_size_bytes)}</span>
                        <span>•</span>
                        <span className="uppercase">{doc.file_type}</span>
                        {doc.status === "generated" && <span className="text-orange-600 font-bold">• AI</span>}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={(e) => handleToggleDocActive(doc.id, e)}
                      title={isActive ? "Sohbet bağlamından çıkar" : "Sohbet bağlamına ekle"}
                      className={cn(
                        "p-1 rounded-lg transition-colors text-[10px] font-bold flex items-center space-x-1",
                        isActive
                          ? "bg-emerald-100 text-emerald-700"
                          : "text-slate-400 hover:bg-slate-100 group-hover:text-slate-600"
                      )}
                    >
                      <CheckCircle2 className={cn("w-3.5 h-3.5", isActive ? "text-emerald-600" : "opacity-30")} />
                    </button>
                    <button
                      onClick={(e) => handleDeleteDoc(doc.id, e)}
                      className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-all"
                      title="Sil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredDocuments.length === 0 && (
              <div className="text-center py-10 px-4 text-xs text-slate-400 space-y-2">
                <FileCheck className="w-8 h-8 mx-auto text-slate-300" />
                <p>Henüz doküman bulunmuyor.</p>
                <p className="text-[11px]">Üstteki butondan dosya yükleyebilir veya sohbette AI'dan oluşturmasını isteyebilirsiniz.</p>
              </div>
            )}
          </div>

          {/* Active Context Footer */}
          <div className="p-3 border-t border-slate-100 bg-slate-50/80 text-[11px] text-slate-600 flex items-center justify-between">
            <span className="font-medium">Aktif Sohbet Bağlamı:</span>
            <span className="font-bold text-orange-600 font-mono">{activeDocIds.length} Dosya</span>
          </div>
        </div>
      ) : null}

      {/* ----------------- CENTER PANEL: Interactive Chat & Co-Pilot Workspace ----------------- */}
      <div className="flex-1 flex flex-col h-screen min-w-0 bg-[#F8F9FB] relative">
        {/* Workspace Top Navigation Bar */}
        <div className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-4 sm:px-6 shrink-0 z-10 shadow-2xs">
          <div className="flex items-center space-x-3">
            {!leftSidebarOpen && (
              <button
                onClick={() => setLeftSidebarOpen(true)}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600"
                title="Materyal Panelini Aç"
              >
                <PanelLeftOpen className="w-4 h-4" />
              </button>
            )}
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-xs">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div>
                <h1 className="text-xs sm:text-sm font-black text-slate-900 leading-none">
                  Belge & Veri Analizi Çalışma Alanı
                </h1>
                <p className="text-[10px] text-slate-400 mt-0.5">İnteraktif Sohbet, Analiz & Belge Üretim Co-pilot'u</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Model Selector */}
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 font-bold focus:outline-none focus:border-orange-500"
            >
              <option value="gpt-4o">GPT-4o (Önerilen)</option>
              <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
              <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
              <option value="deepseek-r1">DeepSeek R1</option>
            </select>

            {/* New Session Button */}
            <button
              onClick={handleStartNewSession}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold flex items-center space-x-1"
              title="Yeni Sohbet Başlat"
            >
              <Plus className="w-3.5 h-3.5 text-orange-600" />
              <span className="hidden sm:inline">Yeni Sohbet</span>
            </button>

            {/* Right Inspector Toggle */}
            <button
              onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
              className={cn(
                "p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border text-xs font-bold flex items-center space-x-1 transition-all",
                rightSidebarOpen
                  ? "bg-orange-50 border-orange-300 text-orange-600"
                  : "border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
              )}
              title="Doküman Önizleyiciyi Aç/Kapat"
            >
              {rightSidebarOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
              <span className="hidden sm:inline">Doküman Önizleme</span>
            </button>
          </div>
        </div>

        {/* Active Context Bar (if any documents attached) */}
        {activeDocIds.length > 0 && (
          <div className="bg-orange-50/80 border-b border-orange-100 px-4 py-1.5 flex items-center space-x-2 text-[11px] overflow-x-auto shrink-0">
            <span className="font-bold text-orange-800 shrink-0 flex items-center space-x-1">
              <Layers className="w-3 h-3" />
              <span>Aktif Materyaller:</span>
            </span>
            <div className="flex items-center space-x-1.5">
              {activeDocIds.map((id) => {
                const doc = documents.find((d) => d.id === id);
                if (!doc) return null;
                return (
                  <span
                    key={id}
                    className="inline-flex items-center space-x-1 bg-white border border-orange-200 rounded-full px-2 py-0.5 text-[10px] text-slate-700 font-bold shadow-2xs"
                  >
                    {getFileIcon(doc.file_type, "w-3 h-3")}
                    <span className="max-w-[120px] truncate">{doc.filename}</span>
                    <button
                      onClick={() => handleToggleDocActive(id)}
                      className="hover:text-rose-600 text-slate-400 font-bold ml-1"
                    >
                      ×
                    </button>
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {messages.map((msg) => {
            const isUser = msg.role === "user";

            return (
              <div
                key={msg.id}
                className={cn("flex space-x-3 max-w-4xl mx-auto", isUser ? "justify-end" : "justify-start")}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white shrink-0 shadow-xs mt-1">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={cn(
                    "max-w-[85%] sm:max-w-[75%] rounded-3xl p-4 sm:p-5 shadow-xs transition-all space-y-2.5",
                    isUser
                      ? "bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-br-xs"
                      : "bg-white border border-slate-200 text-slate-800 rounded-tl-xs"
                  )}
                >
                  {/* Content */}
                  <div className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans">
                    {msg.content}
                  </div>

                  {/* Generated Document / Artifact Card */}
                  {msg.generatedDoc && (
                    <div className="mt-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-slate-800">
                      <div className="flex items-center space-x-3 overflow-hidden">
                        <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center shrink-0">
                          {getFileIcon(msg.generatedDoc.file_type, "w-5 h-5")}
                        </div>
                        <div className="overflow-hidden">
                          <p className="font-bold text-xs text-slate-900 truncate">{msg.generatedDoc.filename}</p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {formatBytes(msg.generatedDoc.file_size_bytes)} • {msg.generatedDoc.file_type.toUpperCase()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                        <button
                          onClick={() => {
                            setSelectedDoc(msg.generatedDoc);
                            setRightSidebarOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-[11px] font-bold text-slate-700 transition-colors"
                        >
                          İncele
                        </button>
                        <a
                          href={ApiClient.getDownloadUrl(msg.generatedDoc.id)}
                          download
                          className="p-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white shadow-2xs transition-colors"
                          title="İndir"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  )}

                  <div
                    className={cn(
                      "text-[10px] text-right font-mono opacity-60",
                      isUser ? "text-orange-100" : "text-slate-400"
                    )}
                  >
                    {msg.timestamp}
                  </div>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-2xl bg-slate-800 text-white flex items-center justify-center shrink-0 shadow-xs mt-1">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {isSending && (
            <div className="flex space-x-3 max-w-4xl mx-auto justify-start">
              <div className="w-8 h-8 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white shrink-0 shadow-xs mt-1 animate-pulse">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="bg-white border border-slate-200 rounded-3xl rounded-tl-xs p-4 text-xs text-slate-500 flex items-center space-x-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-orange-500" />
                <span>Çalışma alanı analiz ediyor ve düşünüyor...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Floating Quick Action Conversion Bar */}
        <div className="px-4 sm:px-6 py-2 bg-transparent max-w-4xl mx-auto w-full">
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-[11px] text-slate-600">
            <span className="font-bold text-slate-400 shrink-0 text-[10px]">Hızlı Belgeye Dönüştür:</span>
            <button
              onClick={() => {
                setSynthFileType("xlsx");
                setIsSynthesizing(true);
              }}
              className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 text-slate-700 font-bold flex items-center space-x-1 shrink-0 shadow-2xs transition-all"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Excel Tablosu Yap</span>
            </button>
            <button
              onClick={() => {
                setSynthFileType("pdf");
                setIsSynthesizing(true);
              }}
              className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 hover:border-rose-400 hover:bg-rose-50 text-slate-700 font-bold flex items-center space-x-1 shrink-0 shadow-2xs transition-all"
            >
              <FileText className="w-3.5 h-3.5 text-rose-500" />
              <span>PDF Raporu Yap</span>
            </button>
            <button
              onClick={() => {
                setSynthFileType("docx");
                setIsSynthesizing(true);
              }}
              className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-slate-700 font-bold flex items-center space-x-1 shrink-0 shadow-2xs transition-all"
            >
              <FileText className="w-3.5 h-3.5 text-blue-500" />
              <span>Word Dokümanı</span>
            </button>
            <button
              onClick={() => {
                setSynthFileType("csv");
                setIsSynthesizing(true);
              }}
              className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 hover:border-amber-400 hover:bg-amber-50 text-slate-700 font-bold flex items-center space-x-1 shrink-0 shadow-2xs transition-all"
            >
              <Table className="w-3.5 h-3.5 text-amber-500" />
              <span>CSV Veriseti</span>
            </button>
            <button
              onClick={() => {
                setSynthFileType("json");
                setIsSynthesizing(true);
              }}
              className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 text-slate-700 font-bold flex items-center space-x-1 shrink-0 shadow-2xs transition-all"
            >
              <FileJson className="w-3.5 h-3.5 text-indigo-500" />
              <span>JSON Çıkar</span>
            </button>
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-4 sm:p-6 pt-0 bg-[#F8F9FB] max-w-4xl mx-auto w-full">
          <div className="bg-white border border-slate-200 rounded-3xl p-2.5 shadow-md shadow-slate-200/50 flex flex-col space-y-2 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/10 transition-all">
            <textarea
              value={inputContent}
              onChange={(e) => setInputContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Bir konu hakkında konuşun, ekleme/çıkarma yapın veya 'Şimdi bunu Excel/PDF haline getir' deyin..."
              rows={2}
              className="w-full bg-transparent px-2.5 pt-1 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none resize-none leading-relaxed"
            />

            <div className="flex items-center justify-between border-t border-slate-100 pt-2 px-1">
              <div className="flex items-center space-x-1.5">
                <input
                  type="file"
                  ref={chatAttachRef}
                  onChange={(e) => handleFileUpload(e, true)}
                  className="hidden"
                  accept=".pdf,.docx,.doc,.xlsx,.xls,.csv,.json,.txt"
                />
                <button
                  onClick={() => chatAttachRef.current?.click()}
                  disabled={uploading}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-orange-600 hover:bg-orange-50 transition-colors flex items-center space-x-1 text-xs font-bold"
                  title="Sohbete Dosya/Materyal Ekle"
                >
                  <Paperclip className="w-4 h-4" />
                  <span className="hidden sm:inline">{uploading ? "Yükleniyor..." : "Dosya Ekle"}</span>
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsSynthesizing(true)}
                  className="px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-bold flex items-center space-x-1.5 transition-colors"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>Belge Sentezle</span>
                </button>

                <button
                  onClick={() => handleSendMessage()}
                  disabled={isSending || !inputContent.trim()}
                  className="px-4 py-2 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 disabled:opacity-30 text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm shadow-orange-500/20 transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Gönder</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Document Synthesis Modal */}
        {isSynthesizing && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 max-w-xl w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600">
                    <Wand2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Sohbeti Belgeye Dönüştür</h3>
                    <p className="text-[11px] text-slate-400">Tüm konuşulanları ve materyalleri sentezler</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsSynthesizing(false)}
                  className="text-slate-400 hover:text-slate-700 font-bold"
                >
                  ✕
                </button>
              </div>

              {/* File Type Selection */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Hedef Dosya Türü</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {[
                    { id: "xlsx", label: "Excel (.xlsx)" },
                    { id: "pdf", label: "PDF (.pdf)" },
                    { id: "docx", label: "Word (.docx)" },
                    { id: "csv", label: "CSV (.csv)" },
                    { id: "json", label: "JSON (.json)" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSynthFileType(t.id)}
                      className={cn(
                        "py-2 px-1 rounded-xl border text-[11px] font-bold transition-all text-center",
                        synthFileType === t.id
                          ? "bg-orange-500 text-white border-orange-500 shadow-xs"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Document Title */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Doküman Başlığı</label>
                <input
                  type="text"
                  value={synthTitle}
                  onChange={(e) => setSynthTitle(e.target.value)}
                  placeholder="Örn: 2026 Q1 Finansal Projeksiyon Tablosu"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Custom Extra Instruction */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Ekstra Vurgulanmasını İstediğiniz Kriterler (Opsiyonel)
                </label>
                <textarea
                  value={synthInstruction}
                  onChange={(e) => setSynthInstruction(e.target.value)}
                  placeholder="Örn: Kar marjı sütununu ekle ve 3 yıllık karşılaştırma tablosu yap..."
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-orange-500 resize-none leading-relaxed"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setIsSynthesizing(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
                >
                  İptal
                </button>
                <button
                  onClick={() => handleSynthesizeDocument()}
                  disabled={synthesizing}
                  className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 disabled:opacity-40 text-white font-bold text-xs flex items-center space-x-2 shadow-sm shadow-orange-500/20"
                >
                  <Zap className="w-4 h-4" />
                  <span>{synthesizing ? "Belge Derleniyor & Oluşturuluyor..." : "Belgeyi Oluştur & İndir"}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ----------------- RIGHT PANEL: Live Document & Artifact Inspector ----------------- */}
      {rightSidebarOpen && selectedDoc ? (
        <div className="w-96 border-l border-slate-200 bg-white flex flex-col justify-between shrink-0 shadow-xs z-10 animate-in slide-in-from-right duration-200 select-none">
          {/* Top Header */}
          <div className="p-4 border-b border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5 overflow-hidden">
                <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0">
                  {getFileIcon(selectedDoc.file_type, "w-5 h-5")}
                </div>
                <div className="overflow-hidden">
                  <h3 className="text-xs font-black text-slate-900 truncate">{selectedDoc.filename}</h3>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {formatBytes(selectedDoc.file_size_bytes)} • {selectedDoc.file_type.toUpperCase()}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-1">
                <a
                  href={ApiClient.getDownloadUrl(selectedDoc.id)}
                  download
                  className="p-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white shadow-2xs transition-colors"
                  title="İndir"
                >
                  <Download className="w-3.5 h-3.5" />
                </a>
                <button
                  onClick={() => setRightSidebarOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                  title="Kapat"
                >
                  <PanelRightClose className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Inspector Navigation Tabs */}
            <div className="flex rounded-xl bg-slate-100 p-0.5 text-xs font-bold">
              <button
                onClick={() => setActiveRightTab("preview")}
                className={cn(
                  "flex-1 py-1.5 rounded-lg transition-colors text-center",
                  activeRightTab === "preview" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                )}
              >
                Önizleme
              </button>
              <button
                onClick={() => setActiveRightTab("summary")}
                className={cn(
                  "flex-1 py-1.5 rounded-lg transition-colors text-center",
                  activeRightTab === "summary" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                )}
              >
                Özet & Analiz
              </button>
            </div>
          </div>

          {/* Inspector Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {activeRightTab === "preview" && (
              <div className="space-y-4">
                {/* Tabular Preview if Excel / CSV */}
                {selectedDoc.analysis_results?.sheets && (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 text-xs font-bold text-emerald-700">
                      <Table className="w-4 h-4" />
                      <span>Tablo Sütunları & Örnek Veriler</span>
                    </div>

                    {Object.entries(selectedDoc.analysis_results.sheets).map(([sheetName, meta]: [string, any]) => (
                      <div key={sheetName} className="space-y-2 border border-slate-200 rounded-2xl p-3 bg-slate-50">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                          <span>Sayfa: {sheetName}</span>
                          <span className="font-mono text-[10px] text-slate-400">
                            {meta.rows} satır, {meta.columns?.length} sütun
                          </span>
                        </div>

                        {meta.sample && meta.sample.length > 0 && (
                          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                            <table className="w-full text-left text-[10px] font-mono">
                              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                                <tr>
                                  {meta.columns?.map((col: string, i: number) => (
                                    <th key={i} className="p-1.5 whitespace-nowrap">{col}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {meta.sample.slice(0, 5).map((row: any, rIdx: number) => (
                                  <tr key={rIdx}>
                                    {meta.columns?.map((col: string, cIdx: number) => (
                                      <td key={cIdx} className="p-1.5 text-slate-800 whitespace-nowrap">
                                        {String(row[col] ?? "")}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Extracted Text Content Preview */}
                {selectedDoc.extracted_text && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-700">Doküman İçerik Metni:</p>
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-[11px] font-mono text-slate-700 leading-relaxed max-h-72 overflow-y-auto whitespace-pre-wrap">
                      {selectedDoc.extracted_text}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeRightTab === "summary" && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-orange-50/50 border border-orange-100 space-y-2">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-orange-700">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Yapay Zeka Özeti</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {selectedDoc.summary || "Doküman özeti bulunamadı."}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <p className="font-bold text-slate-800">Dosya Metaverileri</p>
                  <div className="space-y-1 text-slate-600 text-[11px]">
                    <p>Oluşturulma: {new Date(selectedDoc.created_at).toLocaleString("tr-TR")}</p>
                    <p>Format: {selectedDoc.file_type.toUpperCase()}</p>
                    <p>Boyut: {formatBytes(selectedDoc.file_size_bytes)}</p>
                    <p>Durum: {selectedDoc.status.toUpperCase()}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Revise Action in chat */}
          <div className="p-3 border-t border-slate-100 bg-slate-50 space-y-2">
            <button
              onClick={() => {
                if (!activeDocIds.includes(selectedDoc.id)) {
                  setActiveDocIds([...activeDocIds, selectedDoc.id]);
                }
                setInputContent(`"${selectedDoc.filename}" dokümanı üzerinde revize yapmak istiyorum: `);
              }}
              className="w-full py-2 px-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 flex items-center justify-center space-x-1.5 shadow-2xs transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-orange-600" />
              <span>Bu Dokümanı Sohbette Revize Et</span>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
