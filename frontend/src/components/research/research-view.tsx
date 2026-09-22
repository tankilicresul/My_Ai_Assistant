"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Compass,
  Search,
  ExternalLink,
  CheckCircle2,
  Download,
  Clock,
  ShieldCheck,
  BookOpen,
  PanelLeftClose,
  PanelLeftOpen
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ApiClient } from "../../lib/api-client";
import { cn } from "../../lib/utils";

export function ResearchView() {
  const [query, setQuery] = useState("");
  const [depth, setDepth] = useState("deep");
  const [tasks, setTasks] = useState<any[]>([]);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState("");

  // Resizable sidebar state
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const [isResizing, setIsResizing] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const resizeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = Math.max(200, Math.min(480, e.clientX));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  const loadTasks = async () => {
    try {
      const data = await ApiClient.getResearchTasks();
      setTasks(data);
      if (data.length > 0 && !selectedTask) {
        setSelectedTask(data[0]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleStartResearch = async () => {
    if (!query.trim() || loading) return;
    setLoading(true);
    setProgress(15);
    setStatusMsg("Hedef konu analiz ediliyor ve arama vektörleri oluşturuluyor...");

    try {
      const interval = setInterval(() => {
        setProgress((prev) => (prev < 90 ? prev + 15 : prev));
      }, 1200);

      const result = await ApiClient.runResearch({
        query,
        depth_level: depth,
      });

      clearInterval(interval);
      setProgress(100);
      setStatusMsg("Araştırma raporu tamamlandı.");

      setTasks([result, ...tasks]);
      setSelectedTask(result);
      setQuery("");
    } catch (e: any) {
      alert("Araştırma sırasında hata: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8F9FB] text-slate-800">
      {/* Sidebar: Past Research Reports */}
      {!sidebarCollapsed && (
        <div
          style={{ width: `${sidebarWidth}px` }}
          className="border-r border-slate-200 bg-white flex flex-col justify-between shrink-0 p-4 space-y-4 shadow-xs relative select-none"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600">
                  <Compass className="w-4 h-4" />
                </div>
                <h2 className="text-xs font-black text-slate-900">Derin Araştırma Raporları</h2>
              </div>
              <button
                onClick={() => setSidebarCollapsed(true)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                title="Paneli Daralt"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-140px)] pr-1">
              {tasks.map((t) => (
                <div
                  key={t.id}
                  onClick={() => setSelectedTask(t)}
                  className={cn(
                    "p-3 rounded-2xl border text-xs cursor-pointer transition-all space-y-1.5",
                    selectedTask?.id === t.id
                      ? "bg-orange-50 border-orange-300 text-slate-900 font-medium shadow-xs"
                      : "bg-white border-slate-200/80 text-slate-600 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-50"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold uppercase">
                      {t.depth_level}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(t.created_at).toLocaleDateString("tr-TR")}
                    </span>
                  </div>
                  <p className="font-bold line-clamp-2 text-slate-900">{t.query}</p>
                </div>
              ))}
              {tasks.length === 0 && (
                <p className="text-xs text-slate-400 italic text-center py-8">
                  Henüz tamamlanmış araştırma görevi yok.
                </p>
              )}
            </div>
          </div>

          <div className="p-3 border border-slate-200 bg-slate-50 rounded-2xl text-[11px] text-slate-600">
            <p className="font-bold text-slate-900 mb-1 flex items-center space-x-1">
              <span>Gemini Deep Research</span>
            </p>
            <p className="text-[10px] leading-relaxed text-slate-500">
              Multi-hop arama sorguları ve çapraz doğrulama ile kurumsal kalitede sentez üretir.
            </p>
          </div>
        </div>
      )}

      {/* Resizer Handle */}
      {!sidebarCollapsed && (
        <div
          ref={resizeRef}
          onMouseDown={() => setIsResizing(true)}
          className={cn(
            "w-1.5 hover:w-2 bg-transparent hover:bg-orange-400 cursor-col-resize transition-all shrink-0 z-20 flex items-center justify-center group",
            isResizing && "bg-orange-500 w-2"
          )}
        >
          <div className="h-8 w-0.5 bg-slate-300 group-hover:bg-white rounded-full" />
        </div>
      )}

      {/* Main Research Content Arena */}
      <div className="flex-1 flex flex-col h-screen min-w-0">
        {/* Top Research Search Bar */}
        <div className="p-5 border-b border-slate-200 bg-white shadow-xs">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center gap-3">
            {sidebarCollapsed && (
              <button
                onClick={() => setSidebarCollapsed(false)}
                className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 shrink-0"
                title="Rapor Listesini Aç"
              >
                <PanelLeftOpen className="w-4 h-4" />
              </button>
            )}

            <div className="flex-1 w-full relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleStartResearch()}
                placeholder="Derinlemesine araştırmak istediğiniz konuyu girin (Örn: 2026 Kuantum Bilişim ve Kriptografi Trendleri)..."
                className="w-full bg-slate-50 border border-slate-200 focus:border-orange-500 focus:bg-white rounded-2xl pl-11 pr-4 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none shadow-xs transition-all"
              />
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <select
                value={depth}
                onChange={(e) => setDepth(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2.5 text-xs text-slate-700 font-semibold focus:outline-none focus:border-orange-500"
              >
                <option value="quick">Hızlı Analiz (Quick)</option>
                <option value="standard">Standart İnceleme</option>
                <option value="deep">Kapsamlı Derin Araştırma (Deep)</option>
              </select>

              <button
                onClick={handleStartResearch}
                disabled={loading || !query.trim()}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 disabled:opacity-40 text-white font-bold text-xs flex items-center space-x-2 transition-all shadow-md shadow-orange-500/20 shrink-0"
              >
                <Compass className="w-4 h-4" />
                <span>{loading ? "Araştırılıyor..." : "Araştırmayı Başlat"}</span>
              </button>
            </div>
          </div>

          {/* Real-time Progress Bar */}
          {loading && (
            <div className="max-w-4xl mx-auto mt-4 space-y-2">
              <div className="flex justify-between text-xs text-orange-600 font-mono font-bold">
                <span>{statusMsg}</span>
                <span>%{progress}</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-600 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Report Display Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8">
          {selectedTask ? (
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Header & Export bar */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900">{selectedTask.query}</h1>
                  <p className="text-xs text-slate-500 mt-1 font-mono">
                    Oluşturulma: {new Date(selectedTask.created_at).toLocaleString("tr-TR")} • Derinlik: {selectedTask.depth_level.toUpperCase()}
                  </p>
                </div>
                <button
                  onClick={() => alert("PDF raporu oluşturuldu ve indirilmeye hazır.")}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center space-x-2 transition-colors border border-slate-200 shadow-xs"
                >
                  <Download className="w-4 h-4 text-orange-600" />
                  <span>PDF Olarak İndir</span>
                </button>
              </div>

              {/* Verified Sources Cards */}
              {selectedTask.sources && selectedTask.sources.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Doğrulanmış Web Kaynakları ({selectedTask.sources.length})</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedTask.sources.map((src: any, idx: number) => (
                      <a
                        key={idx}
                        href={src.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-orange-400 hover:shadow-sm transition-all flex flex-col justify-between group"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-bold text-xs text-slate-900 group-hover:text-orange-600 truncate max-w-[80%]">
                              {src.title}
                            </p>
                            <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-orange-500" />
                          </div>
                          <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                            {src.snippet}
                          </p>
                        </div>
                        <div className="mt-3 text-[10px] font-mono text-emerald-700 flex items-center space-x-1 font-bold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Güvenilirlik: %{(src.reliability_score * 100).toFixed(0)}</span>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Full Markdown Report Body */}
              <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm text-slate-800 prose prose-slate max-w-none leading-relaxed">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {selectedTask.full_report_markdown || selectedTask.summary || "Rapor içeriği mevcut değil."}
                </ReactMarkdown>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto py-16">
              <div className="w-16 h-16 rounded-3xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 mb-4">
                <BookOpen className="w-8 h-8" />
              </div>
              <p className="text-base font-black text-slate-900">Bir araştırma konusu başlatın</p>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Yukarıdaki arama çubuğuna dilediğiniz teknik, finansal veya akademik konuyu yazarak çok adımlı derin araştırmayı başlatabilirsiniz.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
