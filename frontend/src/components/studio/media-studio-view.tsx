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
  Zap,
  Camera,
  Compass,
  Film,
  Eye
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

  // Higgsfield Seedance 2.0 Controls
  const [selectedCamera, setSelectedCamera] = useState("360-orbit");
  const [selectedStyle, setSelectedStyle] = useState("cinematic-35mm");

  const imageModels = [
    { id: "flux-1-schnell", name: "Flux.1 Schnell", badge: "Hızlı & Keskin" },
    { id: "flux-pro", name: "Flux.1 Pro", badge: "Fotogerçekçi" },
    { id: "flux-dev", name: "Flux.1 Dev", badge: "Yüksek Detay" },
    { id: "sd-xl", name: "SDXL 1.0", badge: "Stability" },
  ];

  const videoModels = [
    { id: "wan-2.1", name: "Wan 2.1 Video", badge: "1080p Sinematik" },
    { id: "cogvideox-5b", name: "CogVideoX 5B", badge: "Open Source" },
    { id: "kling-v1.5", name: "Kling 1.5 Pro", badge: "Akıcı Hareket" },
    { id: "veo-2", name: "Google Veo 2", badge: "DeepMind" },
  ];

  const cameraMovements = [
    { id: "360-orbit", name: "360° Orbit", desc: "Nesne etrafında 3D sinematik dönüş" },
    { id: "dolly-zoom", name: "Dolly Zoom", desc: "Vertigo arka plan derinlik efekti" },
    { id: "fpv-drone", name: "FPV Drone", desc: "Hızlı ve dinamik hava takibi" },
    { id: "crane-shot", name: "Crane Up", desc: "Aşağıdan gökyüzüne vinç hareketi" },
    { id: "bullet-time", name: "Bullet Time", desc: "Zamanı donduran Matrix 3D açısı" },
    { id: "pan-smooth", name: "Smooth Pan", desc: "Yumuşak yatay sinema kaydırması" },
  ];

  const stylePresets = [
    { id: "cinematic-35mm", name: "Hollywood 35mm", promptAdd: "cinematic 35mm film grain, anamorphic lens, masterpiece lighting" },
    { id: "cyberpunk-neon", name: "Cyberpunk 2077", promptAdd: "cyberpunk aesthetic, vibrant neon reflections, volumetric rain" },
    { id: "studio-product", name: "Studio Minimal", promptAdd: "clean studio lighting, soft shadows, 8k commercial photography" },
    { id: "anime-shinkai", name: "Anime Dream", promptAdd: "Makoto Shinkai style, vibrant sky, ultra detailed anime art" },
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

    // Apply Higgsfield camera and style modifiers
    const chosenStyle = stylePresets.find((s) => s.id === selectedStyle);
    const chosenCam = cameraMovements.find((c) => c.id === selectedCamera);
    const enrichedPrompt = `${prompt}, ${chosenStyle?.promptAdd || ""}, camera motion: ${chosenCam?.name || ""}`;

    try {
      let result;
      if (activeTab === "image") {
        result = await ApiClient.generateImage({
          prompt: enrichedPrompt,
          negative_prompt: negativePrompt || undefined,
          model: selectedModel,
          aspect_ratio: aspectRatio,
        });
      } else {
        result = await ApiClient.generateVideo({
          prompt: enrichedPrompt,
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

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#090d16]">
      {/* Top Header */}
      <div className="h-16 border-b border-slate-800/80 px-8 flex items-center justify-between bg-slate-950/40 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-pink-500 to-rose-600 flex items-center justify-center shadow-md">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white">Higgsfield & FLUX Medya Stüdyosu</h1>
            <p className="text-[10px] text-slate-400">Flux.1 Schnell/Dev • Wan 2.1 & CogVideoX • Seedance 2.0 Sinematik Kamera</p>
          </div>
        </div>

        <div className="flex p-1 rounded-xl bg-slate-900 border border-slate-800">
          <button
            onClick={() => {
              setActiveTab("image");
              setSelectedModel("flux-1-schnell");
            }}
            className={cn(
              "flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
              activeTab === "image" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-slate-200"
            )}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Görsel Stüdyosu</span>
          </button>
          <button
            onClick={() => {
              setActiveTab("video");
              setSelectedModel("wan-2.1");
            }}
            className={cn(
              "flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
              activeTab === "video" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-slate-200"
            )}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Video & Animasyon</span>
          </button>
        </div>
      </div>

      {/* Main Studio Workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Left Controls Panel */}
        <div className="lg:col-span-5 border-r border-slate-800/80 bg-slate-950/30 p-6 overflow-y-auto space-y-5">
          {/* Prompt Box */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>Prompt (Sahne Açıklaması)</span>
              <span className="text-[10px] text-pink-400 font-mono">Türkçe / İngilizce</span>
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Örn: Yağmurlu Tokyo sokaklarında yürüyen sibernetik samuray, neon ışıkları yansıması, 8k..."
              rows={3}
              className="w-full bg-slate-900 border border-slate-800 focus:border-pink-500 rounded-xl px-3 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none resize-none"
            />
          </div>

          {/* Higgsfield Seedance 2.0 Camera Controls */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
              <Camera className="w-3.5 h-3.5 text-pink-400" />
              <span>Higgsfield Kamera Hareketi (Seedance 2.0)</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {cameraMovements.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCamera(c.id)}
                  className={cn(
                    "p-2 rounded-xl text-left border transition-all flex flex-col justify-between",
                    selectedCamera === c.id
                      ? "bg-pink-600/20 border-pink-500/50 text-pink-300"
                      : "bg-slate-900/80 border-slate-800/80 text-slate-400 hover:text-slate-200"
                  )}
                >
                  <span className="text-[11px] font-bold">{c.name}</span>
                  <span className="text-[9px] text-slate-500 line-clamp-1">{c.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Cinematic Style Presets */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
              <Film className="w-3.5 h-3.5 text-indigo-400" />
              <span>Sinematik Stil Presetleri</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {stylePresets.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedStyle(s.id)}
                  className={cn(
                    "p-2 rounded-xl text-xs font-medium border text-left transition-all",
                    selectedStyle === s.id
                      ? "bg-indigo-600/20 border-indigo-500/40 text-indigo-300"
                      : "bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white"
                  )}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          {/* Model Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Yapay Zeka Modeli</label>
            <div className="grid grid-cols-2 gap-2">
              {(activeTab === "image" ? imageModels : videoModels).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedModel(m.id)}
                  className={cn(
                    "p-2.5 rounded-xl border text-left transition-all flex items-center justify-between",
                    selectedModel === m.id
                      ? "bg-pink-600/15 border-pink-500/40 text-pink-300"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                  )}
                >
                  <span className="text-xs font-medium">{m.name}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 font-mono text-slate-300">
                    {m.badge}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Aspect Ratio */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">En-Boy Oranı</label>
            <div className="grid grid-cols-4 gap-2">
              {aspectRatios.map((ar) => (
                <button
                  key={ar.id}
                  type="button"
                  onClick={() => setAspectRatio(ar.id)}
                  className={cn(
                    "py-1.5 rounded-lg border text-center text-xs font-medium transition-all",
                    aspectRatio === ar.id
                      ? "bg-pink-600/20 border-pink-500 text-pink-300"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                  )}
                >
                  {ar.label}
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:opacity-95 text-white font-semibold text-xs shadow-lg shadow-pink-500/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-40"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span>Üretim Yapılıyor (FLUX.1 / Wan)...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                <span>{activeTab === "image" ? "FLUX.1 Görsel Üret" : "Higgsfield Video Üret"}</span>
              </>
            )}
          </button>
        </div>

        {/* Right Preview & Canvas Screen */}
        <div className="lg:col-span-7 bg-slate-950 flex flex-col p-6 overflow-y-auto">
          {/* Main Visual Frame */}
          <div className="flex-1 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-center relative overflow-hidden group shadow-2xl min-h-[380px]">
            {selectedAsset ? (
              <div className="w-full h-full flex flex-col items-center justify-center p-4">
                <img
                  src={selectedAsset.file_url}
                  alt={selectedAsset.meta_info?.prompt || "Üretilen Medya"}
                  className="max-h-[460px] max-w-full rounded-xl object-contain shadow-2xl border border-slate-800"
                />
                <div className="mt-4 flex items-center justify-between w-full max-w-lg px-2 text-xs text-slate-400">
                  <span className="truncate pr-4 font-mono text-[11px] text-slate-300">
                    {selectedAsset.meta_info?.prompt || "Medya"}
                  </span>
                  <a
                    href={selectedAsset.file_url}
                    download
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center space-x-1 font-medium transition-colors shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>İndir</span>
                  </a>
                </div>
              </div>
            ) : (
              <div className="text-center p-6 space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center mx-auto text-slate-500">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h3 className="text-sm font-semibold text-slate-300">Medya Önizleme Ekranı</h3>
                <p className="text-xs text-slate-500 max-w-sm">
                  Sol panelden sahne açıklamasını yazın ve kamera hareketini seçin. Üretilen yüksek çözünürlüklü görsel veya video burada canlı görüntülenecektir.
                </p>
              </div>
            )}
          </div>

          {/* History Gallery */}
          <div className="mt-6">
            <h3 className="text-xs font-semibold text-slate-400 mb-3 flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Üretim Geçmişi ({history.length})</span>
            </h3>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
              {history.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedAsset(item)}
                  className={cn(
                    "aspect-square rounded-xl bg-slate-900 border overflow-hidden cursor-pointer transition-all hover:scale-105",
                    selectedAsset === item ? "border-pink-500 ring-2 ring-pink-500/20" : "border-slate-800"
                  )}
                >
                  <img src={item.file_url} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
