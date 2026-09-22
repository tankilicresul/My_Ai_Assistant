"use client";

import Link from "next/link";
import {
  MessageSquare,
  Code2,
  Sparkles,
  Compass,
  Database,
  FileSpreadsheet,
  Bot,
  ShieldAlert,
  ArrowRight,
  Zap,
  Radio,
  User as UserIcon,
  LogIn,
  UserPlus,
} from "lucide-react";
import { useAuth } from "../context/auth-context";


export default function HomePage() {
  const { user, isAuthenticated } = useAuth();
  const modules = [
    {
      title: "1. Çoklu Yapay Zeka Sohbeti",
      description: "GPT-4o, Claude 3.7, Gemini 2.0, DeepSeek R1 ve Llama ile sohbet, sesli iletişim, Multi-Model Arena ve canlı Canvas.",
      icon: MessageSquare,
      href: "/chat",
      color: "from-amber-400 to-orange-500",
      badge: "Çoklu Model",
    },
    {
      title: "2. Kodlama Stüdyosu & IDE",
      description: "VS Code Monaco editörü, Linux web terminali, Claude Code otonom kod geliştirici ve otomatik test üretimi.",
      icon: Code2,
      href: "/code",
      color: "from-orange-500 to-rose-500",
      badge: "IDE & Terminal",
    },
    {
      title: "3. Sesli Asistan & Podcast",
      description: "NotebookLM tarzı 2 yapay zeka sunuculu interaktif sesli podcast üretimi ve gerçek zamanlı Türkçe sesli asistan.",
      icon: Radio,
      href: "/podcast",
      color: "from-amber-500 to-orange-600",
      badge: "Sesli AI",
    },
    {
      title: "4. Görsel & Video Stüdyosu",
      description: "FLUX 1.0, SDXL, Wan 2.1 ve CogVideo ile Higgsfield Seedance 2.0 sinematik kamera açılı görsel ve video üretimi.",
      icon: Sparkles,
      href: "/studio",
      color: "from-orange-400 to-pink-500",
      badge: "Medya AI",
    },
    {
      title: "5. Derin Web Araştırması",
      description: "Gemini Deep Research ve Perplexity tarzı çok adımlı otonom web taraması, kaynak doğrulama ve detaylı raporlama.",
      icon: Compass,
      href: "/research",
      color: "from-amber-500 to-teal-500",
      badge: "Araştırma",
    },
    {
      title: "6. Vektörel Bellek & Hafıza",
      description: "Qdrant vektör veritabanı ve Mem0 mimarisi ile kullanıcı tercihleri, deneyimler ve projelerin kalıcı hatırlanması.",
      icon: Database,
      href: "/memory",
      color: "from-emerald-400 to-teal-600",
      badge: "Hafıza",
    },
    {
      title: "7. Dosya & Doküman Analizi",
      description: "Julius AI tarzı PDF, Excel (XLSX), Word ve CSV dosyalarını doğal dille analiz etme, grafik çizdirme ve doküman üretimi.",
      icon: FileSpreadsheet,
      href: "/files",
      color: "from-amber-400 to-orange-500",
      badge: "PDF / Excel",
    },
    {
      title: "8. Yapay Zeka Ajan Pazarı",
      description: "Özelleştirilmiş yazılım mimarı, finans uzmanı, e-ticaret ve veri analizi otonom ajanlarını çalıştırma ve yönetme.",
      icon: Bot,
      href: "/marketplace",
      color: "from-orange-500 to-purple-600",
      badge: "Ajanlar",
    },
    {
      title: "9. Yönetim & Sistem Paneli",
      description: "Sistem kullanım istatistikleri, model bazında token tüketimi, tahmini API maliyetleri ve güvenlik audit logları.",
      icon: ShieldAlert,
      href: "/admin",
      color: "from-rose-500 to-orange-500",
      badge: "Yönetici",
    },
  ];

  return (
    <div className="flex-1 flex flex-col justify-between bg-[#F8F9FB] min-h-screen">
      {/* Navbar (TanCoreLab Top Bar) */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-50 shadow-xs">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#FFA200] via-[#FF7500] to-[#FF4800] flex items-center justify-center shadow-md shadow-orange-500/20">
              <Zap className="w-5 h-5 text-white fill-white" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-slate-900">
                TanCore<span className="text-orange-600">Lab</span>
              </span>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-3">


            {isAuthenticated ? (
              <>
                <Link
                  href="/profile"
                  className="px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-semibold border border-orange-200 flex items-center space-x-1.5 transition-all"
                >
                  <UserIcon className="w-3.5 h-3.5 text-orange-600" />
                  <span className="max-w-[120px] truncate">{user?.full_name || user?.email?.split("@")[0]}</span>
                </Link>
                <Link
                  href="/chat"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-xs sm:text-sm transition-all shadow-md shadow-orange-500/25 flex items-center space-x-2"
                >
                  <span>Panele Git</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-3.5 py-1.5 rounded-xl text-slate-700 hover:text-orange-600 text-xs sm:text-sm font-semibold hover:bg-orange-50 transition-all flex items-center space-x-1.5"
                >
                  <LogIn className="w-3.5 h-3.5 text-orange-600" />
                  <span>Giriş Yap</span>
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-xs sm:text-sm transition-all shadow-md shadow-orange-500/25 flex items-center space-x-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Kayıt Ol (100M Token)</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 py-12 flex-1 flex flex-col justify-center">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-xs font-bold text-orange-700 mb-6 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-orange-500" />
            <span>Tüm Yapay Zeka Güçleri TanCoreLab Çatısı Altında</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 mb-6 leading-tight">
            ChatGPT + Claude Code + Gemini <br />
            <span className="bg-gradient-to-r from-[#FFA200] via-[#FF7500] to-[#FF4800] bg-clip-text text-transparent">
              Hepsi Bir Arada
            </span>
          </h1>
          <p className="text-slate-600 text-lg sm:text-xl leading-relaxed">
            Kurumsal ölçekte birleşik yapay zeka SaaS platformu. Kod geliştirin, medya üretin, derin araştırmalar yapın ve vektör hafızanızı yönetin.
          </p>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((m, idx) => {
            const Icon = m.icon;
            return (
              <Link
                key={idx}
                href={m.href}
                className="group relative p-6 rounded-3xl bg-white border border-slate-200 hover:border-orange-300 hover:bg-orange-50/30 transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-xl hover:shadow-orange-500/10"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${m.color} flex items-center justify-center shadow-md shadow-orange-500/20 text-white`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                      {m.badge}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-orange-600 transition-colors">
                    {m.title}
                  </h3>
                  <p className="text-slate-500 text-xs leading-relaxed mb-6">
                    {m.description}
                  </p>
                </div>
                <div className="flex items-center text-xs font-bold text-orange-600 group-hover:text-orange-700 transition-colors">
                  <span>Modülü Başlat</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500 bg-white">
        <p>TanCoreLab Platform • Enterprise AI Cloud Architecture</p>
      </footer>
    </div>
  );
}
