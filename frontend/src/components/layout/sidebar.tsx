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
  { name: "Profil & Hesap Ayarları", href: "/profile", icon: UserIcon, badge: "Profil" },
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
  const displayRole = user?.role === "admin" ? "Yönetici Plan" : "Plus Üye";
  const initials = user?.full_name
    ? user.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email
    ? user.email[0].toUpperCase()
    : "T";

  return (
    <aside className="w-64 border-r border-slate-200 bg-white flex flex-col justify-between shrink-0 h-screen sticky top-0 shadow-sm z-40">
      {/* Brand Header */}
      <div>
        <div className="h-16 px-5 border-b border-slate-100 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2.5 group">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#FFA200] via-[#FF7500] to-[#FF4800] flex items-center justify-center shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
              <Zap className="w-5 h-5 text-white fill-white" />
            </div>
            <span className="font-extrabold text-lg tracking-tight text-slate-900">
              TanCore<span className="text-orange-600">Lab</span>
            </span>
          </Link>
          <Link
            href="/"
            className="text-slate-400 hover:text-orange-600 p-1.5 rounded-lg hover:bg-orange-50 transition-colors"
            title="Ana Sayfa"
          >
            <Home className="w-4 h-4" />
          </Link>
        </div>

        {/* Navigation links */}
        <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-190px)]">
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
                    ? "bg-orange-50 text-orange-600 border border-orange-200 font-semibold shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent"
                )}
              >
                <div className="flex items-center space-x-3">
                  <Icon
                    className={cn(
                      "w-4 h-4 transition-colors",
                      isActive ? "text-orange-600" : "text-slate-400 group-hover:text-slate-700"
                    )}
                  />
                  <span>{item.name}</span>
                </div>
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded font-mono",
                    isActive
                      ? "bg-orange-100 text-orange-700 font-semibold"
                      : "bg-slate-100 text-slate-500"
                  )}
                >
                  {item.badge}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User / Quota Footer */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/60">
        {isAuthenticated ? (
          <>
            <div className="flex items-center justify-between mb-2.5">
              <Link href="/profile" className="flex items-center space-x-2.5 overflow-hidden group">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#FFA200] via-[#FF7500] to-[#FF4800] flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm shadow-orange-500/20 group-hover:ring-2 ring-orange-400 transition-all">
                  {initials}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-semibold text-slate-800 truncate group-hover:text-orange-600 transition-colors">
                    {displayName}
                  </p>
                  <p className="text-[10px] text-orange-600 font-medium truncate">{displayRole}</p>
                </div>
              </Link>
              <button
                onClick={logout}
                title="Oturumu Kapat"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>AI Token Kotası</span>
                <span className="font-semibold text-slate-700">
                  {formatTokens(usedTokens)} / {formatTokens(quotaTokens)}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-orange-600 rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(1, usagePercentage)}%` }}
                />
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-2">
            <Link
              href="/login"
              className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-xs font-semibold flex items-center justify-center space-x-2 transition-all shadow-md shadow-orange-500/20"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Giriş Yap</span>
            </Link>
            <Link
              href="/register"
              className="w-full py-1.5 px-3 rounded-xl bg-white hover:bg-orange-50 text-orange-600 text-xs font-semibold flex items-center justify-center space-x-2 border border-orange-200 transition-all text-center block"
            >
              <span>Hesap Oluştur</span>
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
