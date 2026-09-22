"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MessageSquare,
  Code2,
  Sparkles,
  Compass,
  Database,
  FileSpreadsheet,
  Bot,
  ShieldAlert,
  Zap,
  Home,
  LogOut,
  User as UserIcon,
  ChevronRight,
  HardDrive,
  Radio,
  LogIn,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useAuth } from "../../context/auth-context";

export const navigationItems = [
  { name: "Yapay Zeka Sohbeti", href: "/chat", icon: MessageSquare, badge: "Çoklu LLM" },
  { name: "Kodlama Stüdyosu & IDE", href: "/code", icon: Code2, badge: "Terminal" },
  { name: "Sesli Asistan & Podcast", href: "/podcast", icon: Radio, badge: "Sesli AI" },
  { name: "Görsel & Video Stüdyosu", href: "/studio", icon: Sparkles, badge: "Medya AI" },
  { name: "Derin Web Araştırması", href: "/research", icon: Compass, badge: "Araştırma" },
  { name: "Vektörel Bellek & Hafıza", href: "/memory", icon: Database, badge: "Hafıza" },
  { name: "Dosya & Doküman Analizi", href: "/files", icon: FileSpreadsheet, badge: "PDF & Excel" },
  { name: "Yapay Zeka Ajan Pazarı", href: "/marketplace", icon: Bot, badge: "Ajanlar" },
  { name: "Yönetim & Sistem Paneli", href: "/admin", icon: ShieldAlert, badge: "Yönetici" },
  { name: "Profil & Hesap Ayarları", href: "/profile", icon: UserIcon, badge: "Hesap" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();

  const usedTokens = user?.used_tokens || 0;
  const quotaTokens = user?.quota_tokens || 100_000_000;
  const usagePercentage = Math.min(100, Math.max(0, (usedTokens / quotaTokens) * 100));

  const formatTokens = (val: number) => {
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000) return `${(val / 1_000).toFixed(0)}k`;
    return `${val}`;
  };

  const displayName = user?.full_name || (user?.email ? user.email.split("@")[0] : "Misafir");
  const displayRole = user?.role === "admin" ? "Yönetici Plan" : "Standart Plan";
  const initials = user?.full_name
    ? user.full_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email
    ? user.email[0].toUpperCase()
    : "U";

  return (
    <aside className="w-64 border-r border-slate-800/80 bg-slate-950/80 flex flex-col justify-between shrink-0 h-screen sticky top-0">
      {/* Brand Header */}
      <div>
        <div className="h-16 px-6 border-b border-slate-800/80 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              NexusAI
            </span>
          </Link>
          <Link href="/" className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors" title="Ana Sayfa">
            <Home className="w-4 h-4" />
          </Link>
        </div>

        {/* Navigation links */}
        <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-180px)]">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group",
                  isActive
                    ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-semibold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent"
                )}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={cn("w-4 h-4 transition-colors", isActive ? "text-indigo-400" : "text-slate-400 group-hover:text-slate-200")} />
                  <span>{item.name}</span>
                </div>
                <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-mono", isActive ? "bg-indigo-500/20 text-indigo-300" : "bg-slate-800/60 text-slate-400")}>
                  {item.badge}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User / Quota Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-900/30">
        {isAuthenticated ? (
          <>
            <div className="flex items-center justify-between mb-2.5">
              <Link href="/profile" className="flex items-center space-x-2.5 overflow-hidden group">
                <div className="w-7 h-7 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center text-xs font-bold text-white shrink-0 group-hover:ring-2 ring-indigo-500/50 transition-all">
                  {initials}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-medium text-slate-200 truncate group-hover:text-indigo-300 transition-colors">
                    {displayName}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono truncate">{displayRole}</p>
                </div>
              </Link>
              <button
                onClick={logout}
                title="Oturumu Kapat"
                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>Kullanılan Token</span>
                <span>{formatTokens(usedTokens)} / {formatTokens(quotaTokens)}</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(1, usagePercentage)}%` }}
                />
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-2">
            <Link
              href="/login"
              className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center justify-center space-x-2 transition-all shadow-md shadow-indigo-600/20"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Giriş Yap</span>
            </Link>
            <Link
              href="/register"
              className="w-full py-1.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs font-medium flex items-center justify-center space-x-2 border border-slate-700/60 transition-all text-center block"
            >
              <span>Hesap Oluştur</span>
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}

