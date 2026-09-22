"use client";

import React, { useState, useEffect, useRef } from "react";
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
  Play,
  Pause,
  RotateCcw,
  Sliders,
  X,
  Radio,
  Eye
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
  const [activeTab, setActiveTab] = useState<"image" | "video">("video");
  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState("wan-2.1");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [history, setHistory] = useState<MediaAsset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null);
  const [copied, setCopied] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [imageErrorMap, setImageErrorMap] = useState<Record<string, boolean>>({});

  // Video Player state
  const [isPlaying, setIsPlaying] = useState(true);
  const [videoProgress, setVideoProgress] = useState(0);
  const [activeMotion, setActiveMotion] = useState("360-orbit");
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const animationFrameRef = useRef<number | null>(null);

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
    { id: "veo-2", name: "Google Veo 2", badge: "DeepMind Ultra", provider: "Google" },
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
    { id: "16:9", label: "16:9 Sinematik" },
    { id: "9:16", label: "9:16 Dikey" },
    { id: "1:1", label: "1:1 Kare" },
    { id: "4:3", label: "4:3 Klasik" },
  ];

  const promptSuggestions = [
    {
      title: "Endüstriyel Tahliye",
      text: "Immediately after an explosion, three supervisors rush toward an industrial separator tank from a nearby contractor office, helping three frightened but conscious workers safely down from the tank roof using proper emergency access procedures. Camera follows with controlled handheld movement, realistic industrial emergency response, professional corporate safety training film, no blood, no graphic injuries, 16:9.",
    },
    {
      title: "Siberpunk Samuray",
      text: "Yağmurlu fütüristik Tokyo sokaklarında yürüyen sibernetik bir samuray, ıslak zemin yansımaları, neon ışıkları, 8k sinematik kamera",
    },
    {
      title: "Gökadası Portresi",
      text: "Gözlerinde dönen galaksi nebulaları olan büyüleyici bir kadın portresi, mistik altın parçacıklar, derin uzay ışığı, dramatik aydınlatma",
    },
    {
      title: "Fütüristik Süperspor",
      text: "Dağ virajlarında gün batımında hızla süzülen aero karbon fiber fütüristik hiper araba, hareket bulanıklığı, 4k araba çekimi",
    },
  ];

  const promptTags = ["8K UHD", "Masterpiece", "Photorealistic", "Cinematic Lighting", "Octane Render", "Unreal Engine 5", "Volumetric Fog"];

  useEffect(() => {
    loadHistory();
  }, []);

  // Video progress playback loop
  useEffect(() => {
    if (!isPlaying) return;
    const duration = 5000 / playbackSpeed;
    const startTime = Date.now() - videoProgress * duration;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = (elapsed % duration) / duration;
      setVideoProgress(progress);
    }, 50);

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, videoProgress]);

  // Loading steps animation
  useEffect(() => {
    if (!loading) {
      setLoadingStep(0);
      return;
    }
    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev < 3 ? prev + 1 : 0));
    }, 2200);
    return () => clearInterval(interval);
  }, [loading]);

  const loadHistory = async () => {
    try {
      const data = await ApiClient.getMediaHistory();
      setHistory(data || []);
      if (data && data.length > 0 && !selectedAsset) {
        setSelectedAsset(data[0]);
        if (data[0].meta_info?.camera_motion) {
          setActiveMotion(data[0].meta_info.camera_motion);
        }
      }
    } catch (e) {
      console.error("Error loading media history:", e);
    }
  };

  const handleTabChange = (tab: "image" | "video") => {
    setActiveTab(tab);
    if (tab === "image") {
      setSelectedModel("flux-1-schnell");
      setAspectRatio("1:1");
    } else {
      setSelectedModel("wan-2.1");
      setAspectRatio("16:9");
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
        setActiveMotion(selectedCamera);
        setIsPlaying(true);
        setVideoProgress(0);
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
    if (imageErrorMap[key]) {
      if (asset.meta_info?.cdn_fallback_url) return asset.meta_info.cdn_fallback_url;
      if (asset.meta_info?.frame_url) return asset.meta_info.frame_url;
      if (asset.meta_info?.keyframe_preview_url) return asset.meta_info.keyframe_preview_url;
      if (asset.meta_info?.cdn_url) return asset.meta_info.cdn_url;
    }
    return ApiClient.resolveMediaUrl(asset.file_url);
  };

  const isVideoAsset = (asset: MediaAsset | null) => {
    if (!asset) return false;
    return (
      asset.media_type === "video" ||
      asset.meta_info?.is_cinematic_motion ||
      asset.file_url?.endsWith(".mp4") ||
      asset.file_url?.endsWith(".webm") ||
      asset.model?.includes("video") ||
      asset.model?.includes("wan") ||
      asset.model?.includes("cog") ||
      asset.model?.includes("kling") ||
      asset.model?.includes("veo")
    );
  };

  const isRealMp4File = (url: string) => {
    return url.endsWith(".mp4") || url.endsWith(".webm");
  };

  // Dynamic Camera Transform based on selected camera motion
  const getCameraMotionStyle = (motion: string, progress: number, playing: boolean) => {
    if (!playing) return {};

    const p = progress * Math.PI * 2;
    switch (motion) {
      case "360-orbit":
        const scale = 1.06 + Math.sin(p) * 0.04;
        const rotateY = Math.sin(p) * 3.5;
        const transX = Math.cos(p) * 8;
        return {
          transform: `scale(${scale}) translateX(${transX}px) rotate(${rotateY}deg)`,
          transition: "transform 0.1s linear",
        };
      case "dolly-zoom":
        const zoomScale = 1.0 + progress * 0.14;
        return {
          transform: `scale(${zoomScale})`,
          transition: "transform 0.1s linear",
        };
      case "fpv-drone":
        const droneX = Math.sin(p * 1.5) * 12;
        const droneY = Math.cos(p) * 6;
        const droneRot = Math.sin(p * 1.5) * 2;
        return {
          transform: `scale(1.08) translate(${droneX}px, ${droneY}px) rotate(${droneRot}deg)`,
          transition: "transform 0.1s linear",
        };
      case "crane-shot":
        const craneY = (0.5 - progress) * 18;
        return {
          transform: `scale(1.06) translateY(${craneY}px)`,
          transition: "transform 0.1s linear",
        };
      case "bullet-time":
        const bRot = (progress - 0.5) * 6;
        return {
          transform: `scale(1.1) rotate(${bRot}deg)`,
          transition: "transform 0.1s linear",
        };
      case "pan-smooth":
        const panX = (0.5 - progress) * 24;
        return {
          transform: `scale(1.08) translateX(${panX}px)`,
          transition: "transform 0.1s linear",
        };
      default:
        return {
          transform: `scale(${1.04 + Math.sin(p) * 0.02})`,
          transition: "transform 0.1s linear",
        };
    }
  };

  const loadingMessages = [
    "Sahne açıklaması ve kamera açısı analiz ediliyor...",
    "FLUX / Wan 2.1 Sinematik Render alınıyor...",
    "Kamera hareketi & film greni işleniyor...",
    "4K Sinematik Sahne hazırlanıyor...",
  ];

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
                WAN 2.1 • FLUX 1.0 • SEEDANCE 2.0
              </span>
            </h1>
            <p className="text-[11px] text-slate-500">Yapay Zeka Görsel Üretimi, Video Motoru ve Sinematik Kamera Kontrolleri</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 rounded-2xl bg-slate-100 border border-slate-200 shadow-inner">
          <button
            onClick={() => handleTabChange("image")}
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
            onClick={() => handleTabChange("video")}
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
              placeholder="Örn: Immediately after an explosion, supervisors rush toward an industrial tank, helping workers down safely, cinematic handheld camera, 8k..."
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
              <span>Hazır Şablonlar & Senaryolar</span>
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
                  onClick={() => {
                    setSelectedCamera(c.id);
                    setActiveMotion(c.id);
                  }}
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
              <span>Yapay Zeka Modeli ({activeTab === "video" ? "Video Motoru" : "Görsel Motoru"})</span>
              <span className="text-[10px] text-slate-400 font-mono">
                {activeTab === "video" ? "Wan 2.1 / Kling / Veo" : "FLUX / SDXL"}
              </span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(activeTab === "video" ? videoModels : imageModels).map((m) => (
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
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-xs shadow-lg shadow-orange-500/25 transition-all flex flex-col items-center justify-center space-y-1 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>{loadingMessages[loadingStep]}</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Wand2 className="w-4 h-4" />
                <span>{activeTab === "video" ? "🎬 Wan 2.1 Video & Sinematik Sahne Üret" : "🎨 FLUX Görsel Üret"}</span>
              </div>
            )}
          </button>
        </div>

        {/* Right Preview Screen */}
        <div className="lg:col-span-7 bg-[#F8F9FB] flex flex-col p-6 overflow-y-auto space-y-6">
          {/* Main Visual Frame */}
          <div className="flex-1 min-h-[460px] rounded-3xl bg-white border border-slate-200 flex flex-col items-center justify-center relative overflow-hidden group shadow-sm">
            {selectedAsset ? (
              <div className="w-full h-full flex flex-col items-center justify-between p-4">
                {/* Cinematic Motion Video Stage */}
                <div className="relative w-full flex-1 max-h-[440px] flex items-center justify-center rounded-2xl overflow-hidden bg-slate-950 shadow-md border border-slate-200">
                  {isRealMp4File(getMediaUrl(selectedAsset)) ? (
                    <video
                      src={getMediaUrl(selectedAsset)}
                      controls
                      autoPlay
                      loop
                      playsInline
                      className="max-h-[420px] max-w-full rounded-2xl object-contain"
                    />
                  ) : (
                    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                      {/* Photorealistic AI Scene Frame with Live Cinematic Camera Motion */}
                      <img
                        src={getMediaUrl(selectedAsset)}
                        alt={selectedAsset.prompt || "Üretilen Sinematik Sahne"}
                        style={getCameraMotionStyle(activeMotion, videoProgress, isPlaying)}
                        onError={() => {
                          const key = selectedAsset.id || selectedAsset.file_url;
                          setImageErrorMap((prev) => ({ ...prev, [key]: true }));
                        }}
                        className="max-h-[430px] max-w-full rounded-2xl object-contain select-none"
                      />

                      {/* Film Grain & Cinematic Vignette Overlay */}
                      <div className="absolute inset-0 pointer-events-none bg-radial-vignette opacity-40" />

                      {/* Camera HUD Overlay */}
                      <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none">
                        <span className="px-2.5 py-1 rounded-xl bg-slate-950/80 backdrop-blur-md text-white text-[10px] font-bold border border-white/10 flex items-center gap-1.5 shadow-sm">
                          <span className={cn("w-2 h-2 rounded-full", isPlaying ? "bg-red-500 animate-ping" : "bg-slate-500")} />
                          <span>REC • 4K UHD</span>
                        </span>
                        <span className="px-2.5 py-1 rounded-xl bg-slate-950/80 backdrop-blur-md text-amber-400 text-[10px] font-mono border border-white/10 shadow-sm">
                          🎥 {activeMotion}
                        </span>
                      </div>

                      <div className="absolute top-3 right-3 flex items-center gap-2">
                        {/* Camera Motion Switcher */}
                        <div className="flex bg-slate-900/80 backdrop-blur-md rounded-xl p-0.5 border border-white/10">
                          {["360-orbit", "dolly-zoom", "fpv-drone"].map((m) => (
                            <button
                              key={m}
                              onClick={() => setActiveMotion(m)}
                              className={cn(
                                "px-2 py-0.5 text-[9px] font-bold rounded-lg transition-colors",
                                activeMotion === m ? "bg-orange-500 text-white" : "text-slate-400 hover:text-white"
                              )}
                            >
                              {m === "360-orbit" ? "Orbit" : m === "dolly-zoom" ? "Dolly" : "Drone"}
                            </button>
                          ))}
                        </div>

                        {/* Lightbox / Zoom */}
                        <button
                          onClick={() => setLightboxOpen(true)}
                          className="p-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-white backdrop-blur-md border border-white/10 transition-colors shadow-sm"
                          title="Tam Ekran"
                        >
                          <Maximize2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Bottom Floating Video Scrubber & Play Controls */}
                      <div className="absolute bottom-3 inset-x-3 bg-slate-950/85 backdrop-blur-md rounded-2xl p-2.5 border border-white/10 flex flex-col gap-1.5 shadow-lg">
                        {/* Progress Bar */}
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden cursor-pointer">
                          <div
                            className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full transition-all duration-75"
                            style={{ width: `${videoProgress * 100}%` }}
                          />
                        </div>

                        {/* Controls Bar */}
                        <div className="flex items-center justify-between text-white text-[11px] px-1">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setIsPlaying(!isPlaying)}
                              className="p-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white transition-colors"
                            >
                              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-white" />}
                            </button>
                            <span className="font-mono text-slate-300">
                              00:0{Math.floor(videoProgress * 5)} / 00:05
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-slate-400 text-[10px]">
                            <span>Model: <b className="text-slate-200">{selectedAsset.model}</b></span>
                            <span>Açı: <b className="text-orange-400">{activeMotion}</b></span>
                            <button
                              onClick={() => setPlaybackSpeed(playbackSpeed === 1 ? 1.5 : playbackSpeed === 1.5 ? 0.5 : 1)}
                              className="px-1.5 py-0.5 rounded bg-slate-800 text-white font-mono"
                            >
                              {playbackSpeed}x
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Asset Details & Actions Bar */}
                <div className="mt-4 flex flex-col sm:flex-row items-center justify-between w-full max-w-2xl px-2 text-xs text-slate-600 gap-3">
                  <div className="flex-1 leading-relaxed">
                    <p className="text-xs font-semibold text-slate-800 line-clamp-2">
                      {selectedAsset.prompt || selectedAsset.meta_info?.prompt || "Medya Üretimi"}
                    </p>
                    <p className="text-[10px] text-orange-600 font-medium mt-0.5 flex items-center gap-2">
                      <span>Kamera: {activeMotion}</span>
                      <span>•</span>
                      <span>En-Boy: {selectedAsset.aspect_ratio || "16:9"}</span>
                    </p>
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
                <h3 className="text-sm font-bold text-slate-800">Medya & Video Önizleme Sahnesi</h3>
                <p className="text-xs text-slate-500 max-w-md leading-relaxed">
                  Sol panelden sahne açıklamasını yazın ve kamera hareketini seçerek <b>Wan 2.1 Video & Sinematik Sahne Üret</b> butonuna basın. Gerçekçi sinematik sahneniz ve hareket animasyonu burada oynatılacaktır.
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
                      onClick={() => {
                        setSelectedAsset(item);
                        if (item.meta_info?.camera_motion) {
                          setActiveMotion(item.meta_info.camera_motion);
                        }
                        setIsPlaying(true);
                      }}
                      className={cn(
                        "group relative aspect-square rounded-2xl bg-slate-900 border overflow-hidden cursor-pointer transition-all hover:scale-105 shadow-xs flex items-center justify-center",
                        isSelected ? "border-orange-500 ring-2 ring-orange-500/30" : "border-slate-200"
                      )}
                    >
                      {isRealMp4File(itemUrl) ? (
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
            {isRealMp4File(getMediaUrl(selectedAsset)) ? (
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
                style={getCameraMotionStyle(activeMotion, videoProgress, isPlaying)}
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
