"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Video,
  Image as ImageIcon,
  Sliders,
  Layers,
  Download,
  Maximize2,
  Clock,
  PlayCircle,
  Wand2,
  Zap
} from "lucide-react";
import { ApiClient } from "../../lib/api-client";
import { cn } from "../../lib/utils";


export function MediaStudioView() {
  const [activeTab, setActiveTab] = useState<"image" | "video">("image");
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState("flux-1-schnell");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [duration, setDuration] = useState(5);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<any | null>(null);

  const imageModels = [
    { id: "flux-1-schnell", name: "Flux.1 Schnell", badge: "Hızlı" },
    { id: "flux-pro", name: "Flux.1 Pro", badge: "Fotogerçekçi" },
    { id: "flux-dev", name: "Flux.1 Dev", badge: "Detaylı" },
    { id: "sd-xl", name: "SDXL 1.0", badge: "Stability" },
  ];

  const videoModels = [
    { id: "wan-2.1", name: "Wan 2.1 Video", badge: "1080p Sinematik" },
    { id: "cogvideox-5b", name: "CogVideoX 5B", badge: "Open Video" },
    { id: "kling-v1.5", name: "Kling 1.5 Pro", badge: "Akıcı Hareket" },
    { id: "veo-2", name: "Google Veo 2", badge: "DeepMind" },
  ];

  const aspectRatios = [
    { id: "1:1", label: "1:1 Kare" },
    { id: "16:9", label: "16:9 Yatay" },
    { id: "9:16", label: "9:16 Dikey" },
    { id: "4:3", label: "4:3 Klasik" },
  ];

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await ApiClient.getMediaHistory();
      setHistory(data);
      if (data.length > 0 && !selectedAsset) {
        setSelectedAsset(data[0]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);

    try {
      let result;
      if (activeTab === "image") {
        result = await ApiClient.generateImage({
          prompt,
          negative_prompt: negativePrompt || undefined,
          model: selectedModel,
          aspect_ratio: aspectRatio,
        });
      } else {
        result = await ApiClient.generateVideo({
          prompt,
          negative_prompt: negativePrompt || undefined,
          model: selectedModel,
          aspect_ratio: aspectRatio,
          duration_seconds: duration,
        });
      }

      setHistory([result, ...history]);
      setSelectedAsset(result);
    } catch (e: any) {
      alert("Üretim sırasında hata oluştu: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const enhancePrompt = () => {
    if (!prompt) return;
    const enhancements = [
      "cinematic lighting, ultra-detailed, 8k resolution, octane render, photorealistic, masterpiece",
      "hyper-realistic photography, 35mm lens, golden hour sunlight, sharp focus, award winning composition",
      "cyberpunk neon aesthetic, highly detailed volumetric lighting, unreal engine 5 render, raytracing"
    ];
    const picked = enhancements[Math.floor(Math.random() * enhancements.length)];
    setPrompt((prev) => `${prev.trim()}, ${picked}`);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#090d16] text-slate-200">
      {/* Control Panel / Form Sidebar */}
      <div className="w-80 md:w-96 border-r border-slate-800/80 bg-slate-950/60 flex flex-col justify-between shrink-0 overflow-y-auto p-6 space-y-6">
        <div>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-lg font-bold text-white flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-pink-500" />
              <span>Medya Stüdyosu</span>
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-400 border border-pink-500/20">
              Higgsfield AI Engine
            </span>
          </div>

          {/* Mode Tabs */}
          <div className="grid grid-cols-2 p-1 bg-slate-900 rounded-xl border border-slate-800 mb-6">
            <button
              onClick={() => {
                setActiveTab("image");
                setSelectedModel("flux-1-schnell");
              }}
              className={cn(
                "flex items-center justify-center space-x-2 py-2 rounded-lg text-xs font-semibold transition-all",
                activeTab === "image"
                  ? "bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              )}
            >
              <ImageIcon className="w-4 h-4" />
              <span>Görsel (Flux/SD)</span>
            </button>
            <button
              onClick={() => {
                setActiveTab("video");
                setSelectedModel("wan-2.1");
              }}
              className={cn(
                "flex items-center justify-center space-x-2 py-2 rounded-lg text-xs font-semibold transition-all",
                activeTab === "video"
                  ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              )}
            >
              <Video className="w-4 h-4" />
              <span>Video (Wan/Kling)</span>
            </button>
          </div>

          {/* Prompt input */}
          <div className="space-y-2 mb-5">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <label className="font-semibold">Prompt (İstem)</label>
              <button
                onClick={enhancePrompt}
                className="flex items-center space-x-1 text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                <Wand2 className="w-3 h-3" />
                <span>Geliştir (Enhance)</span>
              </button>
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                activeTab === "image"
                  ? "Örn: Siberpunk sokakta yürüyen samuray, neon ışıklar, fotogerçekçi 8k..."
                  : "Örn: Dağların üzerinden gün batımında süzülen drone çekimi, sinematik 60fps..."
              }
              rows={4}
              className="w-full bg-slate-900 border border-slate-800 focus:border-pink-500 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 resize-none focus:outline-none"
            />
          </div>

          {/* Model Selector */}
          <div className="space-y-2 mb-5">
            <label className="text-xs font-semibold text-slate-300">Model Seçimi</label>
            <div className="grid grid-cols-2 gap-2">
              {(activeTab === "image" ? imageModels : videoModels).map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedModel(m.id)}
                  className={cn(
                    "p-2.5 rounded-xl border text-left text-xs transition-all",
                    selectedModel === m.id
                      ? "bg-pink-500/10 border-pink-500/60 text-white font-semibold"
                      : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700"
                  )}
                >
                  <p className="truncate">{m.name}</p>
                  <p className="text-[10px] text-pink-400/80 font-mono mt-0.5">{m.badge}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Aspect Ratio Selector */}
          <div className="space-y-2 mb-5">
            <label className="text-xs font-semibold text-slate-300">En/Boy Oranı (Aspect Ratio)</label>
            <div className="grid grid-cols-4 gap-2">
              {aspectRatios.map((ar) => (
                <button
                  key={ar.id}
                  onClick={() => setAspectRatio(ar.id)}
                  className={cn(
                    "p-2 rounded-xl border text-center text-xs font-mono transition-all",
                    aspectRatio === ar.id
                      ? "bg-indigo-600/20 border-indigo-500 text-indigo-300 font-bold"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                  )}
                >
                  {ar.id}
                </button>
              ))}
            </div>
          </div>

          {/* Video Duration (if video) */}
          {activeTab === "video" && (
            <div className="space-y-2 mb-5">
              <div className="flex justify-between text-xs text-slate-300">
                <label className="font-semibold">Süre (Saniye)</label>
                <span className="font-mono text-purple-400">{duration}s</span>
              </div>
              <input
                type="range"
                min="3"
                max="10"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full accent-purple-500 bg-slate-800"
              />
            </div>
          )}
        </div>

        {/* Generate Button */}
        <div className="pt-4 border-t border-slate-800">
          <button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className={cn(
              "w-full py-3 rounded-xl font-bold text-xs text-white flex items-center justify-center space-x-2 transition-all shadow-lg",
              activeTab === "image"
                ? "bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 shadow-pink-600/25"
                : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-purple-600/25",
              loading && "opacity-50 cursor-not-allowed"
            )}
          >
            <Zap className="w-4 h-4" />
            <span>{loading ? "Üretiliyor..." : activeTab === "image" ? "Görseli Üret" : "Videoyu Oluştur"}</span>
          </button>
        </div>
      </div>

      {/* Main Preview Canvas & History Grid */}
      <div className="flex-1 flex flex-col h-screen min-w-0 p-6 overflow-y-auto space-y-6">
        {/* Active Asset Focus Card */}
        <div className="flex-1 min-h-[400px] rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col items-center justify-center p-6 relative overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 rounded-full border-4 border-pink-500/20 border-t-pink-500 animate-spin" />
              <p className="text-sm font-semibold text-white">Yapay Zeka Medyayı Render Ediyor...</p>
              <p className="text-xs text-slate-400 font-mono">Model: {selectedModel} • {aspectRatio}</p>
            </div>
          ) : selectedAsset ? (
            <div className="flex flex-col items-center max-w-2xl w-full">
              <div className="relative rounded-xl overflow-hidden border border-slate-700/60 shadow-2xl bg-black">
                {selectedAsset.file_url && (
                  <img
                    src={selectedAsset.file_url}
                    alt={selectedAsset.prompt}
                    className="max-h-[500px] w-auto object-contain"
                  />
                )}
              </div>
              <div className="w-full mt-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs">
                <div className="space-y-1">
                  <p className="font-semibold text-white truncate max-w-md">{selectedAsset.prompt}</p>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {selectedAsset.model} • {selectedAsset.aspect_ratio} • {selectedAsset.generation_time_sec}s
                  </p>
                </div>
                {selectedAsset.file_url && (
                  <a
                    href={selectedAsset.file_url}
                    download
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center space-x-1 font-mono transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>İndir</span>
                  </a>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center space-y-2">
              <Sparkles className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-400">Henüz medya üretilmedi</p>
              <p className="text-xs text-slate-500">Soldaki panelden isteminizi girin ve üretimi başlatın.</p>
            </div>
          )}
        </div>

        {/* History Gallery */}
        <div>
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center space-x-2">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Üretim Geçmişi ({history.length})</span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {history.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedAsset(item)}
                className={cn(
                  "group relative rounded-xl overflow-hidden border cursor-pointer aspect-square bg-slate-900 transition-all",
                  selectedAsset?.id === item.id ? "border-pink-500 ring-2 ring-pink-500/20" : "border-slate-800 hover:border-slate-700"
                )}
              >
                {item.file_url && (
                  <img src={item.file_url} alt={item.prompt} className="w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-between text-[10px]">
                  <span className="font-mono text-pink-400 uppercase">{item.media_type}</span>
                  <p className="line-clamp-2 text-white">{item.prompt}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
