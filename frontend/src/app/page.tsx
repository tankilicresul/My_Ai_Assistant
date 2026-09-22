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
      title: "Sohbet & Model Arena",
      description: "GPT-4o, Claude 3.7, Gemini 2.0 ve DeepSeek R1 ile çoklu model karşılaştırması ve canlı sohbet.",
      icon: MessageSquare,
      href: "/chat",
      color: "from-amber-400 to-orange-500",
      badge: "Çoklu Model",
    },
    {
      title: "Kodlama Stüdyosu & IDE",
      description: "Monaco editör, Linux terminali ve Claude Code ile tam otonom yazılım geliştirme.",
      icon: Code2,
      href: "/code",
      color: "from-orange-500 to-rose-500",
      badge: "Geliştirici",
    },
    {
      title: "Sesli Asistan & Podcast",
      description: "NotebookLM tarzı çift sunuculu podcast üretimi ve gerçek zamanlı sesli diyalog.",
      icon: Radio,
      href: "/podcast",
      color: "from-amber-500 to-orange-600",
      badge: "Ses & Seslendirme",
    },
    {
      title: "Görsel & Video Stüdyosu",
      description: "FLUX, Wan 2.1 ve Higgsfield motorlarıyla yüksek çözünürlüklü görsel ve sinematik video üretimi.",
      icon: Sparkles,
      href: "/studio",
      color: "from-orange-400 to-pink-500",
      badge: "Medya",
    },
    {
      title: "Derin Web Araştırması",
      description: "Çok kaynaklı otonom web taraması, akademik doğrulama ve yapılandırılmış raporlama.",
      icon: Compass,
      href: "/research",
      color: "from-amber-500 to-teal-500",
      badge: "Araştırma",
    },
    {
      title: "Vektör Bellek & Hafıza",
      description: "Qdrant ve Mem0 altyapısıyla kullanıcı tercihleri ve uzun vadeli proje bağlam hafızası.",
      icon: Database,
      href: "/memory",
      color: "from-emerald-400 to-teal-600",
      badge: "Hafıza",
    },
    {
      title: "Belge & Veri Analizi",
      description: "PDF, Excel ve dokümanları doğal dille sorgulama, tablo çıkarma ve grafik üretimi.",
      icon: FileSpreadsheet,
      href: "/files",
      color: "from-amber-400 to-orange-500",
      badge: "Doküman",
    },
    {
      title: "Otonom Ajan Pazarı",
      description: "Yazılım mimarı, finans uzmanı ve veri analisti gibi hedefe odaklı otonom yapay zeka ajanları.",
      icon: Bot,
      href: "/marketplace",
      color: "from-orange-500 to-purple-600",
      badge: "Ajanlar",
    },
    {
      title: "Sistem & Kullanım Paneli",
      description: "Token tüketimi, model bazlı maliyet takibi ve güvenlik audit logları.",
      icon: ShieldAlert,
      href: "/admin",
      color: "from-rose-500 to-orange-500",
      badge: "Yönetim",
    },
  ];

  return (
    <div className="flex-1 flex flex-col justify-between bg-[#F8F9FB] min-h-screen">
      {/* Navbar (TanCoreLab Top Bar) */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-50 shadow-xs">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FFA200] via-[#FF7500] to-[#FF4800] flex items-center justify-center shadow-md shadow-orange-500/20">
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
                  <span>Kayıt Ol</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 py-14 flex-1 flex flex-col justify-center">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 mb-6 leading-tight">
            ALL-IN-ONE <br />
            <span className="bg-gradient-to-r from-[#FFA200] via-[#FF7500] to-[#FF4800] bg-clip-text text-transparent">
              AI PLATFORM
            </span>
          </h1>
          <p className="text-slate-600 text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto">
            Sohbet, kodlama stüdyosu, medya üretimi, derin araştırma ve otonom ajanlar tek bir çatı altında.
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
                className="group relative p-6 rounded-2xl bg-white border border-slate-200/90 hover:border-orange-300 hover:shadow-lg hover:shadow-orange-500/5 transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${m.color} flex items-center justify-center shadow-sm text-white`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200/80 group-hover:border-orange-200 group-hover:bg-orange-50 group-hover:text-orange-700 transition-colors">
                      {m.badge}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2 group-hover:text-orange-600 transition-colors">
                    {m.title}
                  </h3>
                  <p className="text-slate-500 text-xs leading-relaxed mb-6">
                    {m.description}
                  </p>
                </div>
                <div className="flex items-center text-xs font-semibold text-slate-500 group-hover:text-orange-600 transition-colors">
                  <span>Modüle Git</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500 bg-white">
        <p>TanCoreLab • All-in-One AI Platform</p>
      </footer>
    </div>
  );
}
