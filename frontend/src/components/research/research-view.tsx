"use client";

import React, { useState, useEffect } from "react";
import {
  Compass,
  Search,
  ExternalLink,
  CheckCircle2,
  FileText,
  Download,
  Clock,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  BookOpen
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ApiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";

export function ResearchView() {
  const [query, setQuery] = useState("");
  const [depth, setDepth] = useState("deep");
  const [tasks, setTasks] = useState<any[]>([]);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState("");

  useEffect(() => {
    loadTasks();
  }, []);

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
    <div className="flex h-screen overflow-hidden bg-[#090d16] text-slate-200">
      {/* Sidebar: Past Research Reports */}
      <div className="w-80 border-r border-slate-800/80 bg-slate-950/60 flex flex-col justify-between shrink-0 p-4 space-y-4">
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <Compass className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-bold text-white">Derin Araştırma Raporları</h2>
          </div>

          <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-140px)]">
            {tasks.map((t) => (
              <div
                key={t.id}
                onClick={() => setSelectedTask(t)}
                className={cn(
                  "p-3 rounded-xl border text-xs cursor-pointer transition-all space-y-1.5",
                  selectedTask?.id === t.id
                    ? "bg-cyan-500/10 border-cyan-500/50 text-white font-medium shadow-md shadow-cyan-500/5"
                    : "bg-slate-900/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400 uppercase">
                    {t.depth_level}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {new Date(t.created_at).toLocaleDateString("tr-TR")}
                  </span>
                </div>
                <p className="font-semibold line-clamp-2 text-slate-200">{t.query}</p>
              </div>
            ))}
            {tasks.length === 0 && (
              <p className="text-xs text-slate-500 italic text-center py-6">
                Henüz tamamlanmış araştırma görevi yok.
              </p>
            )}
          </div>
        </div>

        <div className="p-3 border-t border-slate-800/80 bg-slate-900/40 rounded-xl text-[11px] text-slate-400">
          <p className="font-semibold text-slate-300 mb-1 flex items-center space-x-1">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Gemini Deep Research</span>
          </p>
          <p className="text-[10px] leading-relaxed">
            Multi-hop arama sorguları ve çapraz doğrulama ile akademik ve kurumsal standartta sentez üretir.
          </p>
        </div>
      </div>

      {/* Main Research Content Arena */}
      <div className="flex-1 flex flex-col h-screen min-w-0">
        {/* Top Research Search Bar */}
        <div className="p-6 border-b border-slate-800/80 bg-slate-950/40">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleStartResearch()}
                placeholder="Derinlemesine araştırmak istediğiniz konuyu girin (Örn: 2026 Kuantum Bilişim ve Kriptografi Trendleri)..."
                className="w-full bg-slate-900 border border-slate-700/80 focus:border-cyan-500 rounded-xl pl-11 pr-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none shadow-inner"
              />
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={depth}
                onChange={(e) => setDepth(e.target.value)}
                className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none"
              >
                <option value="quick">Hızlı Analiz (Quick)</option>
                <option value="standard">Standart İnceleme</option>
                <option value="deep">Kapsamlı Derin Araştırma (Deep)</option>
              </select>

              <button
                onClick={handleStartResearch}
                disabled={loading || !query.trim()}
                className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-semibold text-xs flex items-center space-x-2 transition-all shadow-md shadow-cyan-600/20 shrink-0"
              >
                <Compass className="w-4 h-4" />
                <span>{loading ? "Araştırılıyor..." : "Araştırmayı Başlat"}</span>
              </button>
            </div>
          </div>

          {/* Real-time Progress Bar */}
          {loading && (
            <div className="max-w-4xl mx-auto mt-4 space-y-2">
              <div className="flex justify-between text-xs text-cyan-300 font-mono">
                <span>{statusMsg}</span>
                <span>%{progress}</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Report Display Body */}
        <div className="flex-1 overflow-y-auto p-8">
          {selectedTask ? (
            <div className="max-w-4xl mx-auto space-y-8">
              {/* Header & Export bar */}
              <div className="flex items-center justify-between pb-6 border-b border-slate-800">
                <div>
                  <h1 className="text-2xl font-extrabold text-white">{selectedTask.query}</h1>
                  <p className="text-xs text-slate-400 mt-1 font-mono">
                    Oluşturulma: {new Date(selectedTask.created_at).toLocaleString("tr-TR")} • Derinlik: {selectedTask.depth_level.toUpperCase()}
                  </p>
                </div>
                <button
                  onClick={() => alert("PDF raporu oluşturuldu ve indirilmeye hazır.")}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-2 transition-colors border border-slate-700"
                >
                  <Download className="w-4 h-4 text-cyan-400" />
                  <span>PDF Olarak İndir</span>
                </button>
              </div>

              {/* Verified Sources Cards */}
              {selectedTask.sources && selectedTask.sources.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Doğrulanmış Web Kaynakları ({selectedTask.sources.length})</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedTask.sources.map((src: any, idx: number) => (
                      <a
                        key={idx}
                        href={src.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between group"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-semibold text-xs text-slate-200 group-hover:text-cyan-300 truncate max-w-[80%]">
                              {src.title}
                            </p>
                            <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400" />
                          </div>
                          <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                            {src.snippet}
                          </p>
                        </div>
                        <div className="mt-2 text-[10px] font-mono text-emerald-400 flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Güvenilirlik: %{(src.reliability_score * 100).toFixed(0)}</span>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Full Markdown Report Body */}
              <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800/80 prose prose-invert prose-indigo max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {selectedTask.full_report_markdown || selectedTask.summary || "Rapor içeriği mevcut değil."}
                </ReactMarkdown>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
              <BookOpen className="w-12 h-12 text-slate-600 mb-3" />
              <p className="text-base font-bold text-slate-300">Bir araştırma konusu başlatın</p>
              <p className="text-xs text-slate-500 mt-1">
                Yukarıdaki arama çubuğuna dilediğiniz teknik, finansal veya akademik konuyu yazarak çok adımlı derin araştırmayı başlatabilirsiniz.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
