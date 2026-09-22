"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Video,
  Image as ImageIcon,
  Download,
  Maximize2,
  Clock,
  Wand2,
  Camera,
  Film,
  Copy,
  Check,
  Trash2,
  RefreshCw,
  ExternalLink,
  Layers,
  X,
  Play
} from "lucide-react";
import { ApiClient } from "../../lib/api-client";
import { cn } from "../../lib/utils";

interface MediaAsset {
  id?: string;
  media_type: "image" | "video";
  prompt: string;
  model: string;
  aspect_ratio: string;
  file_url: string;
  status: string;
  generation_time_sec?: number;
  meta_info?: Record<string, any>;
  created_at?: string;
}

export function MediaStudioView() {
  const [activeTab, setActiveTab] = useState<"image" | "video">("image");
  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState("flux-1-schnell");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<MediaAsset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null);
  const [copied, setCopied] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [imageErrorMap, setImageErrorMap] = useState<Record<string, boolean>>({});

  // Seedance / Motion Controls
  const [selectedCamera, setSelectedCamera] = useState("360-orbit");
  const [selectedStyle, setSelectedStyle] = useState("cinematic-35mm");

  const imageModels = [
    { id: "flux-1-schnell", name: "Flux.1 Schnell", badge: "Hızlı & Keskin", provider: "Black Forest" },
    { id: "flux-pro", name: "Flux.1 Pro", badge: "Fotogerçekçi", provider: "Black Forest" },
    { id: "flux-dev", name: "Flux.1 Dev", badge: "Yüksek Detay", provider: "Black Forest" },
    { id: "sd-xl", name: "SDXL 1.0", badge: "Stability", provider: "Stability AI" },
    { id: "dall-e-3", name: "DALL-E 3", badge: "OpenAI", provider: "OpenAI" },
  ];

  const videoModels = [
    { id: "wan-2.1", name: "Wan 2.1 Video", badge: "1080p Sinematik", provider: "Wan AI" },
    { id: "cogvideox-5b", name: "CogVideoX 5B", badge: "Open Source", provider: "THUDM" },
    { id: "kling-v1.5", name: "Kling 1.5 Pro", badge: "Akıcı Hareket", provider: "Kuaishou" },
    { id: "veo-2", name: "Google Veo 2", badge: "DeepMind", provider: "Google" },
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
    { id: "cinematic-35mm", name: "Hollywood 35mm", promptAdd: "cinematic 35mm film grain, anamorphic lens, masterpiece lighting, 8k resolution" },
    { id: "cyberpunk-neon", name: "Cyberpunk 2077", promptAdd: "cyberpunk aesthetic, vibrant neon reflections, volumetric fog, futuristic details" },
    { id: "studio-product", name: "Studio Minimal", promptAdd: "clean studio lighting, soft shadows, 8k commercial photography, minimalist backdrop" },
    { id: "anime-shinkai", name: "Anime Dream", promptAdd: "Makoto Shinkai style, vibrant cloud sky, ultra detailed anime art, emotional lighting" },
    { id: "photorealistic-hdr", name: "Ultra Realizm", promptAdd: "hyperrealistic 8k, raw photograph, natural lighting, highly detailed skin texture" },
  ];

  const aspectRatios = [
    { id: "1:1", label: "1:1 Kare" },
    { id: "16:9", label: "16:9 Yatay" },
    { id: "9:16", label: "9:16 Dikey" },
    { id: "4:3", label: "4:3 Klasik" },
  ];

  const promptSuggestions = [
    { title: "Neon Samuray", text: "Yağmurlu fütüristik Tokyo sokaklarında yürüyen sibernetik bir samuray, ıslak zemin yansımaları, neon ışıkları" },
    { title: "Gökadası Portresi", text: "Gözlerinde dönen galaksi nebulaları olan büyüleyici bir kadın portresi, mistik altın parçacıklar, derin uzay ışığı" },
    { title: "Fütüristik Süperspor", text: "Dağ virajlarında gün batımında hızla süzülen aero karbon fiber fütüristik hiper araba, hareket bulanıklığı" },
    { title: "Minyatür Orman Köyü", text: "Dev bir meşe ağacının gövdesine oyulmuş parlayan minyatür peri köyü, cam teraryum içi, makro lens" },
  ];

  const promptTags = ["8K UHD", "Masterpiece", "Photorealistic", "Cinematic Lighting", "Octane Render", "Unreal Engine 5", "Volumetric Fog"];

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await ApiClient.getMediaHistory();
      setHistory(data || []);
      if (data && data.length > 0 && !selectedAsset) {
        setSelectedAsset(data[0]);
      }
    } catch (e) {
      console.error("Error loading media history:", e);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);

    const chosenStyle = stylePresets.find((s) => s.id === selectedStyle);
    const chosenCam = cameraMovements.find((c) => c.id === selectedCamera);
    const enrichedPrompt = `${prompt}, ${chosenStyle?.promptAdd || ""}, camera motion: ${chosenCam?.name || ""}`;

    try {
      let res: any;
      if (activeTab === "image") {
        res = await ApiClient.generateImage({
          prompt: enrichedPrompt,
          model: selectedModel,
          aspect_ratio: aspectRatio,
          seedance_camera: selectedCamera,
        });
      } else {
        res = await ApiClient.generateVideo({
          prompt: enrichedPrompt,
          model: selectedModel,
          duration_seconds: 5,
          camera_motion: selectedCamera,
          aspect_ratio: aspectRatio,
        });
      }

      if (res) {
        setSelectedAsset(res);
        setHistory((prev) => [res, ...prev]);
      }
    } catch (e) {
      console.error("Generation error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (asset: MediaAsset, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!asset.id) return;
    try {
      await ApiClient.deleteMedia(asset.id);
      setHistory((prev) => prev.filter((item) => item.id !== asset.id));
      if (selectedAsset?.id === asset.id) {
        const remaining = history.filter((item) => item.id !== asset.id);
        setSelectedAsset(remaining.length > 0 ? remaining[0] : null);
      }
    } catch (err) {
      console.error("Failed to delete media:", err);
    }
  };

  const handleCopyPrompt = () => {
    if (!selectedAsset) return;
    navigator.clipboard.writeText(selectedAsset.prompt || selectedAsset.meta_info?.prompt || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const appendTag = (tag: string) => {
    if (!prompt.includes(tag)) {
      setPrompt((prev) => (prev ? `${prev}, ${tag}` : tag));
    }
  };

  const getMediaUrl = (asset: MediaAsset): string => {
    if (!asset || !asset.file_url) return "";
    const key = asset.id || asset.file_url;
    // If local URL errored, try CDN fallback URL from meta_info
    if (imageErrorMap[key]) {
      if (asset.meta_info?.cdn_fallback_url) return asset.meta_info.cdn_fallback_url;
      if (asset.meta_info?.keyframe_preview_url) return asset.meta_info.keyframe_preview_url;
      if (asset.meta_info?.cdn_url) return asset.meta_info.cdn_url;
    }
    return ApiClient.resolveMediaUrl(asset.file_url);
  };

  const isVideoAsset = (asset: MediaAsset | null) => {
    if (!asset) return false;
    return (
      asset.media_type === "video" ||
      asset.file_url?.endsWith(".mp4") ||
      asset.file_url?.endsWith(".webm") ||
      asset.model?.includes("video") ||
      asset.model?.includes("wan") ||
      asset.model?.includes("cog") ||
      asset.model?.includes("kling") ||
      asset.model?.includes("veo")
    );
  };

  const isRealVideoFile = (url: string) => {
    return url.endsWith(".mp4") || url.endsWith(".webm");
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#F8F9FB] text-slate-800">
      {/* Top Header */}
      <div className="h-16 border-b border-slate-200 px-6 sm:px-8 flex items-center justify-between bg-white/90 backdrop-blur-md shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-xs border border-orange-200 bg-orange-50 p-1 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <span>Görsel & Video Medya Stüdyosu</span>
              <span className="px-2 py-0.5 rounded-md bg-orange-100 text-orange-700 text-[10px] font-bold">
                FLUX 1.0 • WAN 2.1
              </span>
            </h1>
            <p className="text-[11px] text-slate-500">Yapay Zeka Görsel Üretimi, Video Motoru ve Sinematik Kamera Kontrolleri</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 rounded-2xl bg-slate-100 border border-slate-200 shadow-inner">
          <button
            onClick={() => {
              setActiveTab("image");
              setSelectedModel("flux-1-schnell");
            }}
            className={cn(
              "flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all",
              activeTab === "image"
                ? "bg-white text-orange-700 shadow-xs border border-slate-200/50"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            <ImageIcon className="w-3.5 h-3.5 text-orange-600" />
            <span>Görsel Üret</span>
          </button>
          <button
            onClick={() => {
              setActiveTab("video");
              setSelectedModel("wan-2.1");
            }}
            className={cn(
              "flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all",
              activeTab === "video"
                ? "bg-white text-orange-700 shadow-xs border border-slate-200/50"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            <Video className="w-3.5 h-3.5 text-orange-600" />
            <span>Video & Animasyon</span>
          </button>
        </div>
      </div>

      {/* Main Studio Workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Left Controls Panel */}
        <div className="lg:col-span-5 border-r border-slate-200 bg-white p-5 overflow-y-auto space-y-4 shadow-xs">
          {/* Prompt Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Wand2 className="w-3.5 h-3.5 text-orange-600" />
                <span>Sahne Açıklaması (Prompt)</span>
              </label>
              <span className="text-[10px] text-orange-600 font-semibold px-2 py-0.5 rounded-full bg-orange-50 border border-orange-200">
                Türkçe / İngilizce
              </span>
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Örn: Yağmurlu Tokyo sokaklarında yürüyen sibernetik samuray, neon ışıkları yansıması, 8k..."
              rows={3}
              className="w-full bg-slate-50 border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none resize-none transition-all"
            />
            {/* Quick Enhancement Tags */}
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {promptTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => appendTag(tag)}
                  className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-slate-100 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200 border border-slate-200 text-slate-600 transition-colors"
                >
                  +{tag}
                </button>
              ))}
            </div>
          </div>

          {/* Prompt Inspiration Presets */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>İlham Verici Şablonlar</span>
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {promptSuggestions.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPrompt(item.text)}
                  className="text-left p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-orange-50/60 hover:border-orange-300 transition-all text-slate-700"
                >
                  <p className="text-[11px] font-bold text-slate-800">{item.title}</p>
                  <p className="text-[9px] text-slate-400 line-clamp-1 mt-0.5">{item.text}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Camera Controls */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
              <Camera className="w-3.5 h-3.5 text-orange-600" />
              <span>Sinematik Kamera Açısı</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {cameraMovements.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCamera(c.id)}
                  className={cn(
                    "p-2 rounded-xl text-left border transition-all flex flex-col justify-between shadow-xs",
                    selectedCamera === c.id
                      ? "bg-orange-50 border-orange-400 text-orange-900 font-bold ring-2 ring-orange-500/20"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-white"
                  )}
                >
                  <span className="text-[11px] font-bold leading-tight">{c.name}</span>
                  <span className="text-[9px] text-slate-400 mt-1 line-clamp-1">{c.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Cinematic Style Presets */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
              <Film className="w-3.5 h-3.5 text-orange-600" />
              <span>Stil Presetleri</span>
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {stylePresets.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedStyle(s.id)}
                  className={cn(
                    "p-2 rounded-xl text-xs font-semibold border text-center transition-all shadow-xs",
                    selectedStyle === s.id
                      ? "bg-orange-50 border-orange-400 text-orange-900 font-bold ring-2 ring-orange-500/20"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-white"
                  )}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          {/* Model Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>Yapay Zeka Modeli</span>
              <span className="text-[10px] text-slate-400">Üretim Motoru</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(activeTab === "image" ? imageModels : videoModels).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedModel(m.id)}
                  className={cn(
                    "p-2.5 rounded-xl border text-left transition-all flex items-center justify-between shadow-xs",
                    selectedModel === m.id
                      ? "bg-orange-50 border-orange-400 text-orange-900 font-bold ring-2 ring-orange-500/20"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-white"
                  )}
                >
                  <div>
                    <p className="text-xs font-bold leading-none">{m.name}</p>
                    <p className="text-[9px] text-slate-400 mt-1">{m.provider}</p>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-white border border-slate-200 font-mono text-slate-600">
                    {m.badge}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Aspect Ratio */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">En-Boy Oranı</label>
            <div className="grid grid-cols-4 gap-2">
              {aspectRatios.map((ar) => (
                <button
                  key={ar.id}
                  type="button"
                  onClick={() => setAspectRatio(ar.id)}
                  className={cn(
                    "py-2 rounded-xl border text-center text-xs font-bold transition-all shadow-xs",
                    aspectRatio === ar.id
                      ? "bg-orange-50 border-orange-400 text-orange-900 ring-2 ring-orange-500/20"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-white"
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
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-xs shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Medya Üretiliyor ({selectedModel})...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                <span>{activeTab === "image" ? "FLUX Görsel Üret" : "Sinematik Video Üret"}</span>
              </>
            )}
          </button>
        </div>

        {/* Right Preview Screen */}
        <div className="lg:col-span-7 bg-[#F8F9FB] flex flex-col p-6 overflow-y-auto space-y-6">
          {/* Main Visual Frame */}
          <div className="flex-1 min-h-[420px] rounded-3xl bg-white border border-slate-200 flex flex-col items-center justify-center relative overflow-hidden group shadow-sm">
            {selectedAsset ? (
              <div className="w-full h-full flex flex-col items-center justify-center p-4">
                <div className="relative max-h-[440px] max-w-full flex items-center justify-center rounded-2xl overflow-hidden bg-slate-900 shadow-md border border-slate-200">
                  {isRealVideoFile(getMediaUrl(selectedAsset)) ? (
                    <video
                      src={getMediaUrl(selectedAsset)}
                      controls
                      autoPlay
                      loop
                      playsInline
                      className="max-h-[420px] max-w-full rounded-2xl object-contain"
                    />
                  ) : (
                    <img
                      src={getMediaUrl(selectedAsset)}
                      alt={selectedAsset.prompt || "Üretilen Medya"}
                      onError={() => {
                        const key = selectedAsset.id || selectedAsset.file_url;
                        setImageErrorMap((prev) => ({ ...prev, [key]: true }));
                      }}
                      className="max-h-[420px] max-w-full rounded-2xl object-contain"
                    />
                  )}

                  {/* Top Badges Overlay */}
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-xl bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold border border-white/10 flex items-center gap-1.5 shadow-sm">
                      {isVideoAsset(selectedAsset) ? <Video className="w-3 h-3 text-orange-400" /> : <ImageIcon className="w-3 h-3 text-orange-400" />}
                      <span>{selectedAsset.model || "FLUX 1.0"}</span>
                    </span>
                    <span className="px-2 py-1 rounded-xl bg-slate-900/80 backdrop-blur-md text-slate-300 text-[10px] font-mono border border-white/10 shadow-sm">
                      {selectedAsset.aspect_ratio || "1:1"}
                    </span>
                  </div>

                  {/* Lightbox / Zoom Button */}
                  <button
                    onClick={() => setLightboxOpen(true)}
                    className="absolute top-3 right-3 p-2 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-white backdrop-blur-md border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                    title="Büyüt"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Bottom Asset Details & Actions Bar */}
                <div className="mt-4 flex flex-col sm:flex-row items-center justify-between w-full max-w-2xl px-2 text-xs text-slate-600 gap-3">
                  <div className="flex-1 leading-relaxed">
                    <p className="text-xs font-semibold text-slate-800 line-clamp-2">
                      {selectedAsset.prompt || selectedAsset.meta_info?.prompt || "Medya Üretimi"}
                    </p>
                    {selectedAsset.meta_info?.camera_angle && (
                      <p className="text-[10px] text-orange-600 font-medium mt-0.5">
                        Kamera: {selectedAsset.meta_info.camera_angle}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={handleCopyPrompt}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center space-x-1.5 font-bold text-xs transition-colors border border-slate-200 shadow-xs"
                      title="Prompt Kopyala"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                      <span>{copied ? "Kopyalandı" : "Prompt"}</span>
                    </button>

                    <a
                      href={getMediaUrl(selectedAsset)}
                      download={`nexus_media_${selectedAsset.id || "render"}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white flex items-center space-x-1.5 font-bold text-xs transition-colors shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>İndir</span>
                    </a>

                    {selectedAsset.id && (
                      <button
                        onClick={(e) => handleDelete(selectedAsset, e)}
                        className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-colors"
                        title="Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center p-8 space-y-3">
                <div className="w-16 h-16 rounded-3xl bg-orange-50 border border-orange-200 flex items-center justify-center mx-auto text-orange-600 shadow-xs">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">Medya Önizleme Ekranı</h3>
                <p className="text-xs text-slate-500 max-w-md leading-relaxed">
                  Sol panelden sahne açıklamasını yazın ve istediğiniz modeli seçin. Üretilen yüksek çözünürlüklü görsel veya sinematik video burada görüntülenecektir.
                </p>
              </div>
            )}
          </div>

          {/* History Gallery */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-orange-600" />
                <span>Üretim Geçmişi ({history.length})</span>
              </h3>
              {history.length > 0 && (
                <button
                  onClick={loadHistory}
                  className="text-[11px] font-medium text-slate-500 hover:text-orange-600 flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Yenile</span>
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="p-6 rounded-2xl bg-white border border-slate-200 text-center text-xs text-slate-400">
                Henüz üretilmiş bir medya kaydı bulunmuyor. Sol panelden ilk medyanızı oluşturun!
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {history.map((item, idx) => {
                  const itemUrl = getMediaUrl(item);
                  const isSelected = selectedAsset?.id === item.id || selectedAsset?.file_url === item.file_url;
                  const isVid = isVideoAsset(item);

                  return (
                    <div
                      key={item.id || idx}
                      onClick={() => setSelectedAsset(item)}
                      className={cn(
                        "group relative aspect-square rounded-2xl bg-slate-900 border overflow-hidden cursor-pointer transition-all hover:scale-105 shadow-xs flex items-center justify-center",
                        isSelected ? "border-orange-500 ring-2 ring-orange-500/30" : "border-slate-200"
                      )}
                    >
                      {isRealVideoFile(itemUrl) ? (
                        <video src={itemUrl} className="w-full h-full object-cover pointer-events-none" muted />
                      ) : (
                        <img
                          src={itemUrl}
                          alt=""
                          onError={() => {
                            const key = item.id || item.file_url;
                            setImageErrorMap((prev) => ({ ...prev, [key]: true }));
                          }}
                          className="w-full h-full object-cover"
                        />
                      )}

                      {/* Type Badge */}
                      <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-md text-white text-[9px] font-bold flex items-center gap-1 border border-white/10">
                        {isVid ? <Play className="w-2.5 h-2.5 fill-orange-400 text-orange-400" /> : <ImageIcon className="w-2.5 h-2.5 text-orange-400" />}
                      </div>

                      {/* Delete button on hover */}
                      {item.id && (
                        <button
                          onClick={(e) => handleDelete(item, e)}
                          className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-rose-600/90 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-700"
                          title="Sil"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fullscreen Lightbox Modal */}
      {lightboxOpen && selectedAsset && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-lg flex items-center justify-center p-4 sm:p-8"
          onClick={() => setLightboxOpen(false)}
        >
          <div className="relative max-w-5xl max-h-full flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute -top-12 right-0 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            {isRealVideoFile(getMediaUrl(selectedAsset)) ? (
              <video
                src={getMediaUrl(selectedAsset)}
                controls
                autoPlay
                loop
                playsInline
                className="max-h-[80vh] max-w-full rounded-2xl shadow-2xl"
              />
            ) : (
              <img
                src={getMediaUrl(selectedAsset)}
                alt={selectedAsset.prompt}
                className="max-h-[80vh] max-w-full rounded-2xl object-contain shadow-2xl"
              />
            )}
            <div className="mt-4 text-center max-w-2xl px-4">
              <p className="text-white text-xs sm:text-sm font-medium">{selectedAsset.prompt}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
