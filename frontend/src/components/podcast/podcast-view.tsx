"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Radio,
  Play,
  Pause,
  RotateCcw,
  Download,
  Copy,
  Check,
  Headphones,
  Volume2,
  VolumeX,
  Sparkles,
  Sliders,
  Share2,
  FileText,
  Clock,
  Zap,
} from "lucide-react";
import { ApiClient } from "../../lib/api-client";
import { cn } from "../../lib/utils";

export function PodcastView() {
  const [topic, setTopic] = useState("");
  const [sourceText, setSourceText] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [podcastData, setPodcastData] = useState<any>(null);

  // Audio Playback State
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [copied, setCopied] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    setLoadingStep("🎙️ NotebookLM formatında 2 kişilik diyalog kurgulanıyor...");

    const timer1 = setTimeout(() => {
      setLoadingStep("🔊 ElevenLabs & Neural HD stüdyo sesleri sentezleniyor...");
    }, 2500);

    const timer2 = setTimeout(() => {
      setLoadingStep("🎧 Podcast master MP3 miksi tamamlanıyor...");
    }, 6000);

    try {
      const data = await ApiClient.generatePodcast({
        topic,
        source_text: sourceText,
        language: "tr",
        duration_minutes: 3,
      });

      setPodcastData(data);
      setActiveSegmentIndex(0);
      setIsPlaying(false);
      setCurrentTime(0);

      // Auto-load audio if master exists
      if (audioRef.current && data.full_audio_url) {
        audioRef.current.src = ApiClient.resolveMediaUrl(data.full_audio_url);
        audioRef.current.load();
      }
    } catch (err: any) {
      console.error(err);
      alert("Podcast oluşturulurken bir hata oluştu: " + (err.message || "Bilinmeyen hata"));
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setLoading(false);
      setLoadingStep("");
    }
  };

  // Master Audio Controls
  const togglePlayMaster = () => {
    if (!podcastData) return;

    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      const fullUrl = ApiClient.resolveMediaUrl(podcastData.full_audio_url);
      if (audioRef.current.src !== fullUrl) {
        audioRef.current.src = fullUrl;
      }
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((e) => {
        console.error("Audio playback error:", e);
      });
    }
  };

  // Play Specific Segment Audio
  const playSegmentAudio = (seg: any, index: number) => {
    if (!audioRef.current) return;

    const audioUrl = seg.audio_url ? ApiClient.resolveMediaUrl(seg.audio_url) : null;
    if (audioUrl) {
      audioRef.current.src = audioUrl;
      audioRef.current.play().then(() => {
        setActiveSegmentIndex(index);
        setIsPlaying(true);
      }).catch(console.error);
    } else if (typeof window !== "undefined" && "speechSynthesis" in window) {
      // Browser fallback if no audio file
      window.speechSynthesis.cancel();
      setActiveSegmentIndex(index);
      setIsPlaying(true);
      const utterance = new SpeechSynthesisUtterance(seg.text);
      utterance.lang = "tr-TR";
      utterance.pitch = seg.speaker === "Ece" ? 1.15 : 0.9;
      utterance.onend = () => {
        setIsPlaying(false);
      };
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);

      // Estimate active segment based on playback progress
      if (podcastData?.segments?.length && audioRef.current.duration) {
        const progressRatio = audioRef.current.currentTime / audioRef.current.duration;
        const currentIdx = Math.min(
          Math.floor(progressRatio * podcastData.segments.length),
          podcastData.segments.length - 1
        );
        setActiveSegmentIndex(currentIdx);
      }
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const restartAudio = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      if (!isPlaying) {
        audioRef.current.play().then(() => setIsPlaying(true));
      }
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const copyScript = () => {
    if (!podcastData?.full_script) return;
    navigator.clipboard.writeText(podcastData.full_script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-y-auto bg-[#F8F9FB] text-slate-800 p-6 md:p-8">
      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleTimeUpdate}
        onEnded={handleAudioEnded}
        muted={isMuted}
      />

      {/* Header */}
      <div className="max-w-6xl mx-auto w-full mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-md border border-orange-200 bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  Sesli Asistan & Podcast Stüdyosu
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <Sparkles className="w-2.5 h-2.5 mr-1" />
                  ElevenLabs / Neural HD
                </span>
              </div>
              <p className="text-xs text-slate-500">
                NotebookLM kalitesinde 2 yapay zeka sunuculu interaktif ve stüdyo sesli podcast üretici
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-2xl border border-slate-200 shadow-xs text-xs font-semibold text-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping mr-1" />
            <span>Sunucular: </span>
            <span className="text-orange-600 font-bold">👩‍💼 Ece</span>
            <span>&</span>
            <span className="text-slate-900 font-bold">👨‍💻 Kaan</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        {/* Left Form */}
        <div className="lg:col-span-5 flex flex-col space-y-6">
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Radio className="w-4 h-4 text-orange-600" />
              <span>Podcast Konusu & Kaynak</span>
            </h2>

            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">
                  Tartışılacak Ana Konu
                </label>
                <input
                  type="text"
                  placeholder="Örn: Kedilerin sağlık sorunları ve Türkiye'de veterinerlik hizmetleri"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white transition-all shadow-inner"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">
                  Kaynak Notlar veya Doküman Metni (Opsiyonel)
                </label>
                <textarea
                  rows={4}
                  placeholder="Podcast için kullanılmasını istediğiniz makale, klinik raporu, not veya doküman metnini buraya yapıştırın..."
                  value={sourceText}
                  onChange={(e) => setSourceText(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white resize-none font-sans transition-all shadow-inner"
                />
              </div>

              {/* Studio Voice Engine Info Box */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-orange-50/80 to-amber-50/80 border border-orange-200/80 flex flex-col space-y-1.5 text-xs text-orange-950">
                <div className="flex items-center justify-between">
                  <span className="font-bold flex items-center space-x-1.5">
                    <Headphones className="w-3.5 h-3.5 text-orange-600" />
                    <span>Stüdyo Ses Sentez Motoru</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-white border border-orange-200 text-orange-700 text-[10px] font-bold shadow-xs">
                    HD Neural Audio
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-slate-600">
                  <div className="bg-white/80 p-2 rounded-xl border border-orange-100 flex items-center space-x-2">
                    <span className="text-base">👩‍💼</span>
                    <div>
                      <div className="font-bold text-slate-800">Ece</div>
                      <div className="text-[9px] text-slate-500">Stüdyo Neural Kadın</div>
                    </div>
                  </div>
                  <div className="bg-white/80 p-2 rounded-xl border border-orange-100 flex items-center space-x-2">
                    <span className="text-base">👨‍💻</span>
                    <div>
                      <div className="font-bold text-slate-800">Kaan</div>
                      <div className="text-[9px] text-slate-500">Stüdyo Neural Erkek</div>
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !topic.trim()}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-sm shadow-lg shadow-orange-500/25 transition-all flex flex-col items-center justify-center space-y-0.5 disabled:opacity-50 active:scale-[0.99]"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span className="text-xs">{loadingStep || "Podcast Üretiliyor..."}</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Headphones className="w-4 h-4" />
                    <span>2 Kişilik Stüdyo Podcasti Oluştur</span>
                  </div>
                )}
              </button>
            </form>
          </div>

          {/* Quick Ideas */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 text-xs text-slate-600 space-y-2 shadow-xs">
            <span className="font-bold text-slate-800">Hızlı Podcast Konuları:</span>
            <div className="flex flex-wrap gap-2 pt-1">
              {[
                "Kedilerin Sağlık Sorunları ve Veterinerlik",
                "Yapay Zeka ve Yazılımın Geleceği",
                "DeepSeek vs OpenAI Kıyaslaması",
                "Kripto Para ve Web3 Analizi",
                "Uzay Kolonizasyonu ve Mars",
              ].map((idea) => (
                <button
                  key={idea}
                  type="button"
                  onClick={() => setTopic(idea)}
                  className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-orange-50 border border-slate-200 hover:border-orange-200 text-slate-700 hover:text-orange-700 transition-colors font-medium text-xs shadow-2xs"
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
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col h-full space-y-5">
              {/* Studio Master Player Bar */}
              <div className="p-5 rounded-3xl bg-gradient-to-br from-[#FFF8F2] to-[#FFF0E6] border border-[#FFE2CC] shadow-sm flex flex-col space-y-4">
                {/* Title and Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-orange-100 text-orange-800 text-[10px] font-mono font-bold mb-1">
                      {podcastData.engine || "ElevenLabs / Neural HD"}
                    </span>
                    <h3 className="text-base font-black text-slate-900 leading-tight">
                      {podcastData.title}
                    </h3>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    {podcastData.full_audio_url && (
                      <a
                        href={ApiClient.resolveMediaUrl(podcastData.full_audio_url)}
                        download={`podcast_${Date.now()}.mp3`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl bg-white hover:bg-orange-100 text-slate-700 hover:text-orange-700 border border-slate-200 shadow-2xs transition-colors flex items-center space-x-1 text-xs font-semibold"
                        title="Master MP3 İndir"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">MP3 İndir</span>
                      </a>
                    )}
                    <button
                      onClick={copyScript}
                      className="p-2 rounded-xl bg-white hover:bg-orange-100 text-slate-700 hover:text-orange-700 border border-slate-200 shadow-2xs transition-colors"
                      title="Metni Kopyala"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Scrubber Progress Bar */}
                <div className="space-y-1.5">
                  <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    step={0.1}
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full h-1.5 bg-orange-200/80 rounded-lg appearance-none cursor-pointer accent-orange-600 focus:outline-none"
                  />
                  <div className="flex justify-between text-[11px] font-mono text-slate-500">
                    <span>{formatTime(currentTime)}</span>
                    <div className="flex items-center space-x-1 text-orange-600 font-semibold">
                      {isPlaying && (
                        <div className="flex items-center space-x-0.5">
                          <span className="w-1 h-3 bg-orange-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                          <span className="w-1 h-4 bg-orange-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
                          <span className="w-1 h-2 bg-orange-400 rounded-full animate-bounce" />
                        </div>
                      )}
                      <span>{isPlaying ? "Stüdyo Canlı Çalıyor" : "Hazır"}</span>
                    </div>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Player Controls Bar */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={togglePlayMaster}
                      className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/30 transition-transform active:scale-95"
                    >
                      {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                    </button>

                    <button
                      onClick={restartAudio}
                      className="p-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/80 shadow-2xs transition-colors"
                      title="Başa Sar"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className="p-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/80 shadow-2xs transition-colors"
                      title={isMuted ? "Sesi Aç" : "Sessize Al"}
                    >
                      {isMuted ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Playback Speed Switcher */}
                  <div className="flex items-center space-x-1 bg-white p-1 rounded-xl border border-slate-200/80 shadow-2xs">
                    {[1.0, 1.25, 1.5].map((rate) => (
                      <button
                        key={rate}
                        onClick={() => setPlaybackRate(rate)}
                        className={cn(
                          "px-2 py-1 rounded-lg text-[10px] font-bold transition-all",
                          playbackRate === rate
                            ? "bg-orange-600 text-white shadow-xs"
                            : "text-slate-600 hover:bg-slate-100"
                        )}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Transcript Dialogue List */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-2 max-h-[460px]">
                {podcastData.segments.map((seg: any, idx: number) => {
                  const isCurrent = activeSegmentIndex === idx && isPlaying;
                  const isEce = seg.speaker === "Ece";

                  return (
                    <div
                      key={idx}
                      onClick={() => playSegmentAudio(seg, idx)}
                      className={cn(
                        "p-4 rounded-2xl border transition-all cursor-pointer relative group",
                        isCurrent
                          ? "bg-orange-50/90 border-orange-400 shadow-md ring-2 ring-orange-400/20"
                          : "bg-slate-50/70 border-slate-200/90 hover:border-orange-200 hover:bg-white shadow-2xs"
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2.5">
                          <span className="text-xl p-1 bg-white rounded-xl shadow-2xs border border-slate-100">
                            {seg.avatar || (isEce ? "👩‍💼" : "👨‍💻")}
                          </span>
                          <div>
                            <span className={cn("text-xs font-bold font-mono", isEce ? "text-orange-600" : "text-slate-900")}>
                              {seg.speaker}
                            </span>
                            <span className="text-[10px] text-slate-400 ml-1.5 font-medium">
                              ({isEce ? "Baş Araştırmacı" : "Teknoloji Mimarı"})
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          {isCurrent ? (
                            <span className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-[10px] font-bold font-mono">
                              <span className="w-1.5 h-1.5 rounded-full bg-orange-600 animate-ping" />
                              <span>Konuşuyor</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-orange-600 hover:border-orange-300 transition-all text-[11px] flex items-center space-x-1 font-semibold"
                            >
                              <Play className="w-3 h-3" />
                              <span>Dinle</span>
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-slate-800 leading-relaxed font-sans pl-1">
                        {seg.text}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[380px] rounded-3xl border border-dashed border-slate-300 bg-white flex flex-col items-center justify-center p-8 text-center shadow-xs">
              <div className="w-16 h-16 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center mb-4 text-orange-600 shadow-sm">
                <Radio className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-1">
                Podcast Stüdyosu Hazır
              </h3>
              <p className="text-xs text-slate-500 max-w-sm leading-relaxed mb-4">
                Sol taraftan bir konu belirleyin veya doküman metni girin; <strong>Ece</strong> ve <strong>Kaan</strong> ElevenLabs / Neural HD kalitesinde 2 kişilik stüdyo podcastinizi seslendirsin.
              </p>
              <div className="flex items-center space-x-3 text-[11px] text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                <span>✨ Canlı Diyalog Sentezi</span>
                <span>•</span>
                <span>🎧 Doğal İnsan Tonlaması</span>
                <span>•</span>
                <span>📥 MP3 İndirme</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
