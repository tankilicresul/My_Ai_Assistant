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
  Terminal,
  Cpu,
  Radio,
} from "lucide-react";

export default function HomePage() {
  const modules = [
    {
      title: "1. Çoklu Yapay Zeka Sohbeti",
      description: "GPT-4o, Claude 3.7, Gemini 2.0, DeepSeek R1 ve Llama ile sohbet, sesli iletişim, Multi-Model Arena ve canlı Canvas.",
      icon: MessageSquare,
      href: "/chat",
      color: "from-blue-500 to-indigo-600",
      badge: "Çoklu Model",
    },
    {
      title: "2. Kodlama Stüdyosu & IDE",
      description: "VS Code Monaco editörü, Linux web terminali, Claude Code otonom kod geliştirici ve otomatik test üretimi.",
      icon: Code2,
      href: "/code",
      color: "from-purple-500 to-pink-600",
      badge: "IDE & Terminal",
    },
    {
      title: "3. Sesli Asistan & Podcast",
      description: "NotebookLM tarzı 2 yapay zeka sunuculu interaktif sesli podcast üretimi ve gerçek zamanlı Türkçe sesli asistan.",
      icon: Radio,
      href: "/podcast",
      color: "from-amber-500 to-rose-600",
      badge: "Sesli Yapay Zeka",
    },
    {
      title: "4. Görsel & Video Stüdyosu",
      description: "FLUX 1.0, SDXL, Wan 2.1 ve CogVideo ile Higgsfield Seedance 2.0 sinematik kamera açılı görsel ve video üretimi.",
      icon: Sparkles,
      href: "/studio",
      color: "from-pink-500 to-rose-600",
      badge: "Medya & Video",
    },
    {
      title: "5. Derin Web Araştırması",
      description: "Gemini Deep Research ve Perplexity tarzı çok adımlı otonom web taraması, kaynak doğrulama ve detaylı raporlama.",
      icon: Compass,
      href: "/research",
      color: "from-cyan-500 to-blue-600",
      badge: "Otonom Araştırma",
    },
    {
      title: "6. Vektörel Bellek & Hafıza",
      description: "Qdrant vektör veritabanı ve Mem0 mimarisi ile kullanıcı tercihleri, deneyimler ve projelerin kalıcı hatırlanması.",
      icon: Database,
      href: "/memory",
      color: "from-emerald-500 to-teal-600",
      badge: "Akıllı Hafıza",
    },
    {
      title: "7. Dosya & Doküman Analizi",
      description: "Julius AI tarzı PDF, Excel (XLSX), Word ve CSV dosyalarını doğal dille analiz etme, grafik çizdirme ve doküman üretimi.",
      icon: FileSpreadsheet,
      href: "/files",
      color: "from-amber-500 to-orange-600",
      badge: "PDF / Excel / CSV",
    },
    {
      title: "8. Yapay Zeka Ajan Pazarı",
      description: "Özelleştirilmiş yazılım mimarı, finans uzmanı, e-ticaret ve veri analizi otonom ajanlarını çalıştırma ve yönetme.",
      icon: Bot,
      href: "/marketplace",
      color: "from-violet-500 to-purple-700",
      badge: "Otonom Ajanlar",
    },
    {
      title: "9. Yönetim & Sistem Paneli",
      description: "Sistem kullanım istatistikleri, model bazında token tüketimi, tahmini API maliyetleri ve güvenlik audit logları.",
      icon: ShieldAlert,
      href: "/admin",
      color: "from-red-500 to-orange-600",
      badge: "Yönetici Paneli",
    },
  ];

  return (
    <div className="flex-1 flex flex-col justify-between">
      {/* Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
                NexusAI
              </span>
              <span className="text-[10px] ml-2 px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
                v1.0 Enterprise
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href="/chat"
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-md shadow-indigo-600/25 flex items-center space-x-2"
            >
              <span>Platformu Aç</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 py-12 flex-1 flex flex-col justify-center">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-800/60 border border-slate-700/60 text-xs font-mono text-slate-300 mb-6">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Tüm Yapay Zeka Güçleri Tek Bir Çatı Altında</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6">
            ChatGPT + Claude Code + Gemini + Higgsfield <br />
            <span className="gradient-text">Hepsi Bir Arada</span>
          </h1>
          <p className="text-slate-400 text-lg sm:text-xl leading-relaxed">
            Kurumsal ölçekte tasarlanmış birleşik yapay zeka SaaS platformu. Kod geliştirin, medya üretin, derin araştırmalar yapın, vektör hafızanızı yönetin ve özel agentlarınızı çalıştırın.
          </p>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {modules.map((m, idx) => {
            const Icon = m.icon;
            return (
              <Link
                key={idx}
                href={m.href}
                className="group relative p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-indigo-500/50 hover:bg-slate-900/90 transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-xl hover:shadow-indigo-500/10"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Icon className="w-24 h-24 text-white" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${m.color} flex items-center justify-center shadow-md`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                      {m.badge}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors">
                    {m.title}
                  </h3>
                  <p className="text-slate-400 text-xs leading-relaxed mb-6">
                    {m.description}
                  </p>
                </div>
                <div className="flex items-center text-xs font-semibold text-indigo-400 group-hover:text-indigo-300 transition-colors">
                  <span>Modülü Başlat</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-6 text-center text-xs text-slate-500">
        <p>NexusAI Platform • Full Stack Architecture (Next.js 14, FastAPI, PostgreSQL, Redis, Qdrant, LiteLLM, Celery, K8s)</p>
      </footer>
    </div>
  );
}
