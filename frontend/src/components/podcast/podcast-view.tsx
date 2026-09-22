"use client";

import React, { useState } from "react";
import {
  Mic,
  Volume2,
  Play,
  Pause,
  Sparkles,
  Radio,
  FileText,
  Headphones,
  RotateCcw,
  FastForward,
  Share2,
  Download
} from "lucide-react";
import { ApiClient } from "../../lib/api-client";
import { cn } from "../../lib/utils";

export function PodcastView() {
  const [topic, setTopic] = useState("");
  const [sourceText, setSourceText] = useState("");
  const [loading, setLoading] = useState(false);
  const [podcastData, setPodcastData] = useState<any>(null);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    try {
      const data = await ApiClient.generatePodcast({
        topic,
        source_text: sourceText,
        language: "tr",
        duration_minutes: 3
      });
      setPodcastData(data);
      setPlayingIndex(0);
      setIsPlaying(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const playSpeech = (text: string, voiceName: string, index: number) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    
    window.speechSynthesis.cancel();
    setPlayingIndex(index);
    setIsPlaying(true);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "tr-TR";
    utterance.rate = 1.05;
    
    // Select different pitch/voice characteristics for Ece vs Kaan
    if (voiceName.includes("Standard-A") || voiceName.includes("Ece")) {
      utterance.pitch = 1.2;
    } else {
      utterance.pitch = 0.85;
    }

    utterance.onend = () => {
      if (podcastData && index < podcastData.segments.length - 1) {
        // Auto play next speaker
        const nextIdx = index + 1;
        const nextSeg = podcastData.segments[nextIdx];
        playSpeech(nextSeg.text, nextSeg.voice, nextIdx);
      } else {
        setIsPlaying(false);
        setPlayingIndex(null);
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  const togglePlayAll = () => {
    if (!podcastData || !podcastData.segments.length) return;

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      const startIdx = playingIndex !== null ? playingIndex : 0;
      const seg = podcastData.segments[startIdx];
      playSpeech(seg.text, seg.voice, startIdx);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-y-auto bg-[#090d16] text-slate-100 p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto w-full mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center shadow-lg shadow-rose-500/20">
            <Radio className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-slate-200 to-rose-300 bg-clip-text text-transparent">
              Voice AI & Podcast Stüdyosu
            </h1>
            <p className="text-xs text-slate-400">
              NotebookLM Audio Overview Stili • 2 Yapay Zeka Sunuculu İnteraktif Sesli Tartışma ve Podcast Üretici
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
        {/* Left Form */}
        <div className="lg:col-span-5 flex flex-col space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl shadow-xl space-y-4">
            <h2 className="text-sm font-semibold text-white flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-rose-400" />
              <span>Podcast Konusu & Kaynak</span>
            </h2>

            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-300 mb-1 block">
                  Tartışılacak Ana Konu
                </label>
                <input
                  type="text"
                  placeholder="Örn: Quantum Bilgisayarlar ve Yapay Zekanın Geleceği"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 mb-1 block">
                  Kaynak Notlar veya Doküman Metni (Opsiyonel)
                </label>
                <textarea
                  rows={6}
                  placeholder="Podcast için kullanılmasını istediğiniz makale, not veya PDF içeriğini buraya yapıştırın..."
                  value={sourceText}
                  onChange={(e) => setSourceText(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 resize-none font-sans"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Sunucular: <strong>Ece</strong> (Stratejist) & <strong>Kaan</strong> (Teknoloji)</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 text-[10px] font-mono">
                  Türkçe Kokoro TTS
                </span>
              </div>

              <button
                type="submit"
                disabled={loading || !topic.trim()}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-500 via-purple-600 to-indigo-600 hover:opacity-95 text-white font-medium text-sm shadow-lg shadow-rose-500/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span>Podcast Üretiliyor...</span>
                  </>
                ) : (
                  <>
                    <Headphones className="w-4 h-4" />
                    <span>2 Kişilik Podcast Oluştur</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Quick Ideas */}
          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60 text-xs text-slate-400 space-y-2">
            <span className="font-semibold text-slate-300">Örnek Podcast Fikirleri:</span>
            <div className="flex flex-wrap gap-2 pt-1">
              {[
                "Yapay Zeka ve Yazılımın Geleceği",
                "DeepSeek vs OpenAI 2026",
                "Kripto Para ve Web3 Analizi",
                "Uzay Kolonizasyonu ve Mars"
              ].map((idea) => (
                <button
                  key={idea}
                  type="button"
                  onClick={() => setTopic(idea)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                >
                  {idea}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Podcast Player & Transcript */}
        <div className="lg:col-span-7 flex flex-col space-y-6">
          {podcastData ? (
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl shadow-xl flex flex-col h-full">
              {/* Player Bar */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between mb-6 shadow-inner">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={togglePlayAll}
                    className="w-12 h-12 rounded-full bg-rose-500 hover:bg-rose-400 text-white flex items-center justify-center shadow-lg shadow-rose-500/30 transition-transform active:scale-95"
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                  </button>
                  <div>
                    <h3 className="text-sm font-bold text-white line-clamp-1">{podcastData.title}</h3>
                    <p className="text-xs text-slate-400 flex items-center space-x-2">
                      <span>Tahmini Süre: {podcastData.duration_est}</span>
                      <span>•</span>
                      <span className="text-emerald-400">Canlı Ses Senkronizasyonu</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-slate-400">
                  <button
                    onClick={() => {
                      if (typeof window !== "undefined") window.speechSynthesis?.cancel();
                      setIsPlaying(false);
                      setPlayingIndex(0);
                    }}
                    className="p-2 rounded-lg hover:bg-slate-800 text-slate-300 transition-colors"
                    title="Başa Sar"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Transcript Dialogue List */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-2 max-h-[500px]">
                {podcastData.segments.map((seg: any, idx: number) => {
                  const isCurrent = playingIndex === idx && isPlaying;
                  const isEce = seg.speaker === "Ece";

                  return (
                    <div
                      key={idx}
                      onClick={() => playSpeech(seg.text, seg.voice, idx)}
                      className={cn(
                        "p-4 rounded-xl border transition-all cursor-pointer",
                        isCurrent
                          ? "bg-rose-500/10 border-rose-500/40 shadow-md shadow-rose-500/5"
                          : "bg-slate-950/40 border-slate-800/60 hover:border-slate-700 hover:bg-slate-950/80"
                      )}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{seg.avatar}</span>
                          <span className={cn("text-xs font-bold font-mono", isEce ? "text-pink-400" : "text-indigo-400")}>
                            {seg.speaker}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            ({isEce ? "Baş Araştırmacı" : "Teknoloji Mimarı"})
                          </span>
                        </div>
                        {isCurrent && (
                          <span className="flex items-center space-x-1 text-rose-400 text-[10px] font-mono animate-pulse">
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>Konuşuyor...</span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed font-sans">
                        {seg.text}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[380px] rounded-2xl border border-dashed border-slate-800/80 bg-slate-900/20 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-800/40 border border-slate-700/60 flex items-center justify-center mb-4">
                <Radio className="w-8 h-8 text-slate-500" />
              </div>
              <h3 className="text-base font-semibold text-slate-300 mb-1">
                Podcast Stüdyosu Hazır
              </h3>
              <p className="text-xs text-slate-500 max-w-sm">
                Sol taraftan bir konu belirleyin veya bir doküman yapıştırın; yapay zeka sunucuları anında iki kişilik interaktif sesli podcast hazırlasın.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
