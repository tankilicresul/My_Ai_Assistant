"use client";

import React, { useState, useEffect, useRef } from "react";
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
  GripVertical,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useAuth } from "../../context/auth-context";

export const navigationItems = [
  { name: "Sohbet & Model Arena", href: "/chat", iconSrc: "/icons/chat.jpg", icon: MessageSquare, badge: "Çoklu LLM" },
  { name: "Kodlama Stüdyosu & IDE", href: "/code", iconSrc: "/icons/code.jpg", icon: Code2, badge: "Terminal" },
  { name: "Sesli Asistan & Podcast", href: "/podcast", iconSrc: "/icons/podcast.jpg", icon: Radio, badge: "Sesli AI" },
  { name: "Görsel & Video Stüdyosu", href: "/studio", iconSrc: "/icons/studio.png", icon: Sparkles, badge: "Medya" },
  { name: "Derin Web Araştırması", href: "/research", iconSrc: "/icons/research.jpg", icon: Compass, badge: "Araştırma" },
  { name: "Vektörel Bellek & Hafıza", href: "/memory", iconSrc: "/icons/memory.jpg", icon: Database, badge: "Hafıza" },
  { name: "Belge & Veri Analizi", href: "/files", iconSrc: "/icons/files.jpg", icon: FileSpreadsheet, badge: "PDF & Excel" },
  { name: "Yapay Zeka Ajan Pazarı", href: "/marketplace", iconSrc: "/icons/marketplace.jpg", icon: Bot, badge: "Ajanlar" },
  { name: "Yönetim & Sistem Paneli", href: "/admin", iconSrc: "/icons/admin.jpg", icon: ShieldAlert, badge: "Yönetici" },
  { name: "Profil & Hesap Ayarları", href: "/profile", iconSrc: "/icons/profile.jpg", icon: UserIcon, badge: "Profil" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();

  // Resizable sidebar width
  const [width, setWidth] = useState(256);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isResizingRef = useRef(false);

  useEffect(() => {
    try {
      const savedWidth = localStorage.getItem("tancore_sidebar_width");
      if (savedWidth) {
        const w = parseInt(savedWidth, 10);
        if (w >= 180 && w <= 400) setWidth(w);
      }
      const savedCollapsed = localStorage.getItem("tancore_sidebar_collapsed");
      if (savedCollapsed === "true") setIsCollapsed(true);
    } catch {}
  }, []);

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizingRef.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const handleMouseMove = (event: MouseEvent) => {
      if (!isResizingRef.current) return;
      const newWidth = Math.max(180, Math.min(380, event.clientX));
      setWidth(newWidth);
      if (isCollapsed && newWidth > 180) setIsCollapsed(false);
    };

    const handleMouseUp = () => {
      isResizingRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      try {
        localStorage.setItem("tancore_sidebar_width", width.toString());
      } catch {}
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const toggleCollapse = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    try {
      localStorage.setItem("tancore_sidebar_collapsed", nextState ? "true" : "false");
    } catch {}
  };

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

  const effectiveWidth = isCollapsed ? 72 : width;

  return (
    <aside
      style={{ width: `${effectiveWidth}px` }}
      className="border-r border-slate-200 bg-white flex flex-col justify-between shrink-0 h-screen sticky top-0 shadow-sm z-40 relative transition-[width] duration-75 select-none"
    >
      {/* Brand Header */}
      <div>
        <div className="h-16 px-4 border-b border-slate-100 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2.5 overflow-hidden group">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#FFA200] via-[#FF7500] to-[#FF4800] flex items-center justify-center shrink-0 shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
              <Zap className="w-5 h-5 text-white fill-white" />
            </div>
            {!isCollapsed && (
              <span className="font-extrabold text-lg tracking-tight text-slate-900 whitespace-nowrap">
                TanCore<span className="text-orange-600">Lab</span>
              </span>
            )}
          </Link>
          {!isCollapsed && (
            <div className="flex items-center space-x-1">
              <Link
                href="/"
                className="text-slate-400 hover:text-orange-600 p-1.5 rounded-lg hover:bg-orange-50 transition-colors"
                title="Ana Sayfa"
              >
                <Home className="w-4 h-4" />
              </Link>
              <button
                onClick={toggleCollapse}
                className="text-slate-400 hover:text-orange-600 p-1.5 rounded-lg hover:bg-orange-50 transition-colors"
                title="Menüyü Daralt"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          )}
          {isCollapsed && (
            <button
              onClick={toggleCollapse}
              className="text-slate-400 hover:text-orange-600 p-1.5 rounded-lg hover:bg-orange-50 transition-colors mx-auto"
              title="Menüyü Genişlet"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation links */}
        <nav className="p-2 space-y-1 overflow-y-auto max-h-[calc(100vh-190px)]">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.name}
                className={cn(
                  "flex items-center rounded-xl text-xs font-medium transition-all group",
                  isCollapsed ? "justify-center p-2" : "justify-between px-2.5 py-2",
                  isActive
                    ? "bg-orange-50 text-orange-600 border border-orange-200 font-semibold shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent"
                )}
              >
                <div className="flex items-center space-x-2.5 overflow-hidden">
                  <div
                    className={cn(
                      "w-6 h-6 rounded-lg overflow-hidden shrink-0 border transition-transform p-0.5 bg-amber-50/60",
                      isActive
                        ? "border-orange-400 shadow-xs shadow-orange-500/20 scale-105"
                        : "border-slate-200/80 opacity-85 group-hover:opacity-100 group-hover:scale-105"
                    )}
                  >
                    <img
                      src={item.iconSrc}
                      alt={item.name}
                      className="w-full h-full object-cover rounded-[5px]"
                    />
                  </div>
                  {!isCollapsed && <span className="break-words leading-tight">{item.name}</span>}
                </div>
                {!isCollapsed && (
                  <span
                    className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded font-mono shrink-0",
                      isActive
                        ? "bg-orange-100 text-orange-700 font-semibold"
                        : "bg-slate-100 text-slate-500"
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User / Quota Footer */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/60">
        {isAuthenticated ? (
          <>
            <div className={cn("flex items-center mb-2", isCollapsed ? "justify-center" : "justify-between")}>
              <Link href="/profile" className="flex items-center space-x-2.5 overflow-hidden group">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#FFA200] via-[#FF7500] to-[#FF4800] flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm shadow-orange-500/20 group-hover:ring-2 ring-orange-400 transition-all">
                  {initials}
                </div>
                {!isCollapsed && (
                  <div className="overflow-hidden">
                    <p className="text-xs font-semibold text-slate-800 break-words group-hover:text-orange-600 transition-colors">
                      {displayName}
                    </p>
                    <p className="text-[10px] text-orange-600 font-medium break-words">{displayRole}</p>
                  </div>
                )}
              </Link>
              {!isCollapsed && (
                <button
                  onClick={logout}
                  title="Oturumu Kapat"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {!isCollapsed && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>AI Kotası</span>
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
            )}
          </>
        ) : (
          <div className="space-y-2">
            <Link
              href="/login"
              className={cn(
                "w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-xs font-semibold flex items-center justify-center space-x-2 transition-all shadow-md shadow-orange-500/20",
                isCollapsed && "p-2"
              )}
            >
              <LogIn className="w-3.5 h-3.5" />
              {!isCollapsed && <span>Giriş Yap</span>}
            </Link>
          </div>
        )}
      </div>

      {/* Draggable Resizer Bar on Right Edge */}
      {!isCollapsed && (
        <div
          onMouseDown={startResizing}
          title="Genişliği Ayarlamak İçin Sürükleyin"
          className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-orange-500/40 active:bg-orange-600 transition-colors z-50 group flex items-center justify-center"
        >
          <div className="w-0.5 h-8 bg-slate-300 group-hover:bg-orange-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      )}
    </aside>
  );
}
