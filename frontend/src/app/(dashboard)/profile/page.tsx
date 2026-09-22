"use client";

import React, { useState, useEffect } from "react";
import {
  User as UserIcon,
  ShieldCheck,
  KeyRound,
  Save,
  LogOut,
  Sparkles,
  Zap,
  Cpu,
  Sliders,
  Code2,
  Terminal,
  Database,
  Compass,
  MessageSquare,
  Key,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  Activity,
  Layers,
  Bot,
  RefreshCw
} from "lucide-react";
import { useAuth } from "../../../context/auth-context";
import { cn } from "../../../lib/utils";

type ProfileTab = "overview" | "ai_preferences" | "api_keys" | "security";

export default function ProfilePage() {
  const { user, updateProfile, changePassword, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<ProfileTab>("overview");

  // Profile Information Form
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Password Change Form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // AI Preferences State (with Local Storage Persistence)
  const [defaultModel, setDefaultModel] = useState("claude-3-7-sonnet-latest");
  const [customInstructions, setCustomInstructions] = useState(
    "Sen kıdemli bir yazılım mimarı ve yapay zeka uzmanısın. Cevaplarını her zaman yapılandırılmış, net, yüksek doğruluklu ve üretime hazır kod örnekleriyle destekleyerek ver."
  );
  const [reasoningLevel, setReasoningLevel] = useState("high");
  const [codeLanguage, setCodeLanguage] = useState("typescript");
  const [autoMemory, setAutoMemory] = useState(true);
  const [savingAiPrefs, setSavingAiPrefs] = useState(false);
  const [aiPrefsMsg, setAiPrefsMsg] = useState<string | null>(null);

  // API Key State
  const [apiKey, setApiKey] = useState("tcl_live_98a72b5f6e104c99e23a45bd802");
  const [copiedKey, setCopiedKey] = useState(false);
  const [customOpenAiKey, setCustomOpenAiKey] = useState("");
  const [customAnthropicKey, setCustomAnthropicKey] = useState("");
  const [customGeminiKey, setCustomGeminiKey] = useState("");
  const [savingCustomKeys, setSavingCustomKeys] = useState(false);
  const [customKeysMsg, setCustomKeysMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user?.full_name) {
      setFullName(user.full_name);
    } else if (user?.email) {
      setFullName(user.email.split("@")[0]);
    }
    if (user?.email) {
      setEmail(user.email);
    }

    // Load AI preferences from localStorage if exists
    try {
      const savedModel = localStorage.getItem("tancore_default_model");
      if (savedModel) setDefaultModel(savedModel);

      const savedInstructions = localStorage.getItem("tancore_custom_instructions");
      if (savedInstructions) setCustomInstructions(savedInstructions);

      const savedReasoning = localStorage.getItem("tancore_reasoning_level");
      if (savedReasoning) setReasoningLevel(savedReasoning);

      const savedLang = localStorage.getItem("tancore_code_lang");
      if (savedLang) setCodeLanguage(savedLang);
    } catch {}
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    setSavingProfile(true);
    try {
      await updateProfile(fullName);
      setProfileMsg({ type: "success", text: "Profil bilgileriniz başarıyla güncellendi." });
    } catch (err: any) {
      setProfileMsg({ type: "error", text: err?.message || "Profil güncellenirken bir hata oluştu." });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword.length < 6) {
      setPasswordMsg({ type: "error", text: "Yeni şifre en az 6 karakter olmalıdır." });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "Yeni şifreler eşleşmiyor." });
      return;
    }

    setSavingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      setPasswordMsg({ type: "success", text: "Şifreniz başarıyla değiştirildi." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordMsg({ type: "error", text: err?.message || "Şifre değiştirilemedi. Lütfen mevcut şifrenizi kontrol edin." });
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSaveAiPreferences = () => {
    setSavingAiPrefs(true);
    try {
      localStorage.setItem("tancore_default_model", defaultModel);
      localStorage.setItem("tancore_custom_instructions", customInstructions);
      localStorage.setItem("tancore_reasoning_level", reasoningLevel);
      localStorage.setItem("tancore_code_lang", codeLanguage);
      setAiPrefsMsg("Yapay zeka tercihleri ve sistem talimatları kaydedildi.");
      setTimeout(() => setAiPrefsMsg(null), 3000);
    } catch {
      setAiPrefsMsg("Tercihler kaydedilirken hata oluştu.");
    } finally {
      setSavingAiPrefs(false);
    }
  };

  const handleSaveCustomKeys = () => {
    setSavingCustomKeys(true);
    try {
      if (customOpenAiKey) localStorage.setItem("tancore_byok_openai", customOpenAiKey);
      if (customAnthropicKey) localStorage.setItem("tancore_byok_anthropic", customAnthropicKey);
      if (customGeminiKey) localStorage.setItem("tancore_byok_gemini", customGeminiKey);
      setCustomKeysMsg("Özel API anahtarlarınız güvenli yerel depolamaya kaydedildi.");
      setTimeout(() => setCustomKeysMsg(null), 3000);
    } finally {
      setSavingCustomKeys(false);
    }
  };

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const generateNewApiKey = () => {
    const randomHex = Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
    setApiKey(`tcl_live_${randomHex}`);
  };

  const usedTokens = user?.used_tokens || 0;
  const quotaTokens = user?.quota_tokens || 100_000_000;
  const remainingTokens = Math.max(0, quotaTokens - usedTokens);
  const usagePercentage = Math.min(100, Math.max(0, (usedTokens / quotaTokens) * 100));

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("tr-TR").format(num);
  };

  const displayName = fullName || user?.full_name || "TanCoreLab Kullanıcısı";
  const displayRole = user?.role === "admin" ? "Süper Yönetici (Root)" : "Kurumsal Pro Plan";

  return (
    <div className="flex-1 p-4 md:p-8 space-y-6 max-w-5xl mx-auto w-full text-slate-800">
      {/* 1. Hero Profile Banner */}
      <div className="relative rounded-[28px] bg-gradient-to-r from-[#FFA200] via-[#FF7500] to-[#FF4800] p-6 md:p-8 text-white shadow-xl shadow-orange-500/20 overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center space-x-5">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-white/20 p-1 ring-4 ring-white/90 shadow-lg flex items-center justify-center overflow-hidden bg-amber-100">
                <div className="w-full h-full rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-white text-2xl md:text-3xl font-black">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              </div>
            </div>

            {/* User Details */}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-black tracking-tight drop-shadow-xs">
                  {displayName}
                </h1>
                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-xs font-bold backdrop-blur-xs border border-white/30">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                  <span>{displayRole}</span>
                </span>
              </div>

              <p className="mt-1 text-xs md:text-sm text-white/90 font-mono font-medium">
                {email || "hesap@tancorelab.com"}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                <span className="px-2.5 py-1 rounded-xl bg-black/20 text-white/95 font-bold font-mono">
                  100M Token Kotası
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-emerald-500/30 text-emerald-100 font-bold flex items-center space-x-1 border border-emerald-400/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                  <span>Tüm LLM Motorları Aktif</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
            <button
              onClick={logout}
              className="px-4 py-2 rounded-2xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold backdrop-blur-xs border border-white/30 shadow-xs transition-all flex items-center space-x-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Oturumu Kapat</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {[
          { id: "overview", label: "Genel Bakış & AI Kullanımı", icon: Activity },
          { id: "ai_preferences", label: "Yapay Zeka & Sistem Talimatları", icon: Sliders },
          { id: "api_keys", label: "Geliştirici & API Anahtarları", icon: Key },
          { id: "security", label: "Hesap & Güvenlik Ayarları", icon: KeyRound },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ProfileTab)}
              className={cn(
                "flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all",
                isActive
                  ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-orange-500/20"
                  : "bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 shadow-xs"
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* TAB 1: OVERVIEW & AI USAGE METRICS */}
      {/* ========================================================= */}
      {activeTab === "overview" && (
        <div className="space-y-6 animate-fadeIn">
          {/* AI Token Quota Card */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5 font-bold text-slate-900 text-sm">
                <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600">
                  <Zap className="w-4 h-4 fill-orange-500" />
                </div>
                <div>
                  <h3>Aylık Yapay Zeka Token Kotası</h3>
                  <p className="text-xs text-slate-500 font-normal">GPT-4o, Claude 3.7, Gemini 2.0 ve DeepSeek R1 ortak havuzu</p>
                </div>
              </div>
              <span className="font-mono text-orange-600 font-black text-sm">
                %{usagePercentage.toFixed(3)}
              </span>
            </div>

            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
              <div
                className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-orange-600 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(1, usagePercentage)}%` }}
              />
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono pt-1">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-slate-500 text-[10px] uppercase font-bold">Kullanılan</p>
                <p className="font-bold text-slate-900 mt-0.5">{formatNumber(usedTokens)}</p>
              </div>
              <div className="p-3 rounded-2xl bg-orange-50/60 border border-orange-100">
                <p className="text-orange-700 text-[10px] uppercase font-bold">Kalan Bakiye</p>
                <p className="font-bold text-orange-600 mt-0.5">{formatNumber(remainingTokens)}</p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-slate-500 text-[10px] uppercase font-bold">Toplam Kota</p>
                <p className="font-bold text-slate-900 mt-0.5">{formatNumber(quotaTokens)}</p>
              </div>
            </div>
          </div>

          {/* AI Features & Active Engines Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-bold">Çoklu Model Sohbet</p>
                <h4 className="text-lg font-black text-slate-900 mt-0.5">Sınırsız</h4>
                <span className="text-[10px] text-emerald-600 font-bold">GPT-4o & Claude 3.7</span>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600">
                <MessageSquare className="w-5 h-5" />
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-bold">Kod Stüdyosu & IDE</p>
                <h4 className="text-lg font-black text-slate-900 mt-0.5">Linux Terminal</h4>
                <span className="text-[10px] text-orange-600 font-bold">Claude Code Entegre</span>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600">
                <Code2 className="w-5 h-5" />
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-bold">Görsel & Video Üretim</p>
                <h4 className="text-lg font-black text-slate-900 mt-0.5">FLUX & Wan 2.1</h4>
                <span className="text-[10px] text-purple-600 font-bold">Ultra HD Çıktı</span>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
                <Sparkles className="w-5 h-5" />
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-bold">Vektör Bağlam Belleği</p>
                <h4 className="text-lg font-black text-slate-900 mt-0.5">Qdrant DB</h4>
                <span className="text-[10px] text-teal-600 font-bold">Kalıcı Proje Hafızası</span>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
                <Database className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: AI PREFERENCES & CUSTOM INSTRUCTIONS */}
      {/* ========================================================= */}
      {activeTab === "ai_preferences" && (
        <div className="space-y-6 animate-fadeIn">
          <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
                <Sliders className="w-5 h-5 text-orange-600" />
                <span>Yapay Zeka Yanıt & Davranış Kişiselleştirmesi</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Tüm sohbetlerde, kod stüdyosunda ve otonom ajanlarda geçerli olacak küresel AI tercihleriniz.
              </p>
            </div>

            {aiPrefsMsg && (
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{aiPrefsMsg}</span>
              </div>
            )}

            {/* Model & Reasoning selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Varsayılan Birincil AI Modeli
                </label>
                <select
                  value={defaultModel}
                  onChange={(e) => setDefaultModel(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-orange-500"
                >
                  <option value="claude-3-7-sonnet-latest">Anthropic Claude 3.7 Sonnet (Önerilen)</option>
                  <option value="gpt-4o">OpenAI GPT-4o (Omni Çoklu Model)</option>
                  <option value="gemini-2.0-flash">Google Gemini 2.0 Flash</option>
                  <option value="deepseek-ai/DeepSeek-R1">DeepSeek R1 (Derin Akıl Yürütme)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Mantık Yürütme & Derinlik Düzeyi (Reasoning Effort)
                </label>
                <select
                  value={reasoningLevel}
                  onChange={(e) => setReasoningLevel(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-orange-500"
                >
                  <option value="high">Yüksek Mantık & Zincirleme Düşünce (CoT Thinking)</option>
                  <option value="balanced">Dengeli & Hızlı Üretim (Balanced)</option>
                  <option value="creative">Yaratıcı & Geniş Perspektif (Creative)</option>
                </select>
              </div>
            </div>

            {/* Code language & Memory toggle */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Öncelikli Kodlama Dili / Framework
                </label>
                <select
                  value={codeLanguage}
                  onChange={(e) => setCodeLanguage(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-orange-500"
                >
                  <option value="typescript">TypeScript & Next.js 14</option>
                  <option value="python">Python & FastAPI / PyTorch</option>
                  <option value="golang">Go (Golang)</option>
                  <option value="rust">Rust</option>
                  <option value="react_native">React Native / Mobile</option>
                </select>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-slate-900">Otomatik Vektör Hafıza Kaydı</h4>
                  <p className="text-[10px] text-slate-500">Önemli tercihlerinizi Qdrant DB'ye otomatik işler.</p>
                </div>
                <input
                  type="checkbox"
                  checked={autoMemory}
                  onChange={(e) => setAutoMemory(e.target.checked)}
                  className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* Custom System Prompt / Instructions */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Özel Sistem Talimatı (Custom System Instructions)
                </label>
                <span className="text-[10px] text-slate-400 font-mono">Tüm modellere enjekte edilir</span>
              </div>
              <textarea
                rows={4}
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder="Örn: Bana kıdemli bir sistem mimarı gibi hitap et. Yanıtlarında doğrudan sonuca odaklan ve kodları açıklamalarıyla ver..."
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-orange-500 leading-relaxed resize-none"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleSaveAiPreferences}
                disabled={savingAiPrefs}
                className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-xs shadow-md shadow-orange-500/20 flex items-center space-x-2 transition-all"
              >
                <Save className="w-4 h-4" />
                <span>{savingAiPrefs ? "Kaydediliyor..." : "AI Tercihlerini Kaydet"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: DEVELOPER & API KEYS */}
      {/* ========================================================= */}
      {activeTab === "api_keys" && (
        <div className="space-y-6 animate-fadeIn">
          {/* TanCoreLab Platform API Key */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
                <Key className="w-5 h-5 text-orange-600" />
                <span>TanCoreLab Platform API Anahtarı</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Uygulamanızı harici Python/Node.js betiklerinizden veya Cursor/VS Code eklentilerinden çağırmak için bu anahtarı kullanın.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <div className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 font-mono text-xs font-bold text-slate-800 truncate">
                {apiKey}
              </div>
              <button
                onClick={handleCopyApiKey}
                className="px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 flex items-center space-x-1.5 shadow-xs transition-colors"
              >
                {copiedKey ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copiedKey ? "Kopyalandı" : "Kopyala"}</span>
              </button>
              <button
                onClick={generateNewApiKey}
                className="px-3.5 py-2.5 rounded-2xl bg-slate-100 hover:bg-orange-50 text-slate-600 hover:text-orange-700 border border-slate-200 text-xs font-bold transition-colors"
                title="Yeni Anahtar Üret"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* BYOK - Bring Your Own Keys */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
                <Cpu className="w-5 h-5 text-orange-600" />
                <span>Özel Sağlayıcı Anahtarlarınız (BYOK - Opsiyonel)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Kendi OpenAI, Anthropic veya Gemini API anahtarlarınızı girerek platform limitlerinden bağımsız doğrudan faturalandırma kullanabilirsiniz.
              </p>
            </div>

            {customKeysMsg && (
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{customKeysMsg}</span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">OpenAI API Key (sk-...)</label>
                <input
                  type="password"
                  placeholder="sk-proj-..."
                  value={customOpenAiKey}
                  onChange={(e) => setCustomOpenAiKey(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Anthropic Claude API Key (sk-ant-...)</label>
                <input
                  type="password"
                  placeholder="sk-ant-api03-..."
                  value={customAnthropicKey}
                  onChange={(e) => setCustomAnthropicKey(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Google Gemini API Key (AIzaSy...)</label>
                <input
                  type="password"
                  placeholder="AIzaSy..."
                  value={customGeminiKey}
                  onChange={(e) => setCustomGeminiKey(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleSaveCustomKeys}
                disabled={savingCustomKeys}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-xs shadow-md shadow-orange-500/20 flex items-center space-x-2 transition-all"
              >
                <Save className="w-4 h-4" />
                <span>{savingCustomKeys ? "Kaydediliyor..." : "Özel Anahtarları Kaydet"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: ACCOUNT & SECURITY SETTINGS */}
      {/* ========================================================= */}
      {activeTab === "security" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
          {/* Profile Details Card */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
              <div className="p-2 rounded-xl bg-orange-50 text-orange-600">
                <UserIcon className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-black text-slate-900">Hesap & Profil Bilgileri</h2>
            </div>

            {profileMsg && (
              <div
                className={cn(
                  "p-3 rounded-2xl border text-xs font-bold flex items-start space-x-2",
                  profileMsg.type === "success"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : "bg-rose-50 border-rose-200 text-rose-800"
                )}
              >
                {profileMsg.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                )}
                <span>{profileMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ad Soyad
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Adınız Soyadınız"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-orange-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  E-posta Adresi (Birincil Giriş)
                </label>
                <input
                  type="email"
                  disabled
                  value={email}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 text-xs font-mono cursor-not-allowed"
                />
              </div>

              <button
                type="submit"
                disabled={savingProfile}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-xs transition-all shadow-md shadow-orange-500/20 flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{savingProfile ? "Kaydediliyor..." : "Profili Güncelle"}</span>
              </button>
            </form>
          </div>

          {/* Security & Password Change */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
              <div className="p-2 rounded-xl bg-orange-50 text-orange-600">
                <KeyRound className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-black text-slate-900">Güvenlik & Şifre Değiştir</h2>
            </div>

            {passwordMsg && (
              <div
                className={cn(
                  "p-3 rounded-2xl border text-xs font-bold flex items-start space-x-2",
                  passwordMsg.type === "success"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : "bg-rose-50 border-rose-200 text-rose-800"
                )}
              >
                {passwordMsg.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                )}
                <span>{passwordMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mevcut Şifreniz
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Yeni Şifre
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="En az 6 karakter"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Yeni Şifre Tekrar
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-orange-500"
                />
              </div>

              <button
                type="submit"
                disabled={savingPassword}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-xs transition-all shadow-md shadow-orange-500/20 flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <KeyRound className="w-4 h-4" />
                <span>{savingPassword ? "Güncelleniyor..." : "Şifreyi Değiştir"}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
