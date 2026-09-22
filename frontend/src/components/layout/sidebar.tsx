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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useAuth } from "../../context/auth-context";

export const navigationItems = [
  { name: "Sohbet & Model Arena", href: "/chat", iconSrc: "/icons/chat.jpg", icon: MessageSquare },
  { name: "Kodlama Stüdyosu & IDE", href: "/code", iconSrc: "/icons/code.jpg", icon: Code2 },
  { name: "Sesli Asistan & Podcast", href: "/podcast", iconSrc: "/icons/podcast.jpg", icon: Radio },
  { name: "Görsel & Video Stüdyosu", href: "/studio", iconSrc: "/icons/studio.png", icon: Sparkles },
  { name: "Derin Web Araştırması", href: "/research", iconSrc: "/icons/research.jpg", icon: Compass },
  { name: "Vektörel Bellek & Hafıza", href: "/memory", iconSrc: "/icons/memory.jpg", icon: Database },
  { name: "Belge & Veri Analizi", href: "/files", iconSrc: "/icons/files.jpg", icon: FileSpreadsheet },
  { name: "Yapay Zeka Ajan Pazarı", href: "/marketplace", iconSrc: "/icons/marketplace.jpg", icon: Bot },
  { name: "Yönetim & Sistem Paneli", href: "/admin", iconSrc: "/icons/admin.jpg", icon: ShieldAlert },
  { name: "Profil & Hesap Ayarları", href: "/profile", iconSrc: "/icons/profile.jpg", icon: UserIcon },
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
  const displayRole = user?.role === "admin" ? "Yönetici" : "Standart Üye";
  const initials = user?.full_name
    ? user.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email
    ? user.email[0].toUpperCase()
    : "T";

  const effectiveWidth = isCollapsed ? 72 : width;

  return (
    <aside
      style={{ width: `${effectiveWidth}px` }}
      className="border-r border-[#27272a] bg-[#16161a] text-[#E4E4E7] flex flex-col justify-between shrink-0 h-screen sticky top-0 shadow-lg z-40 relative transition-[width] duration-75 select-none"
    >
      {/* Brand Header */}
      <div>
        <div className="h-14 px-3.5 border-b border-[#27272a] flex items-center justify-between">
          <Link href="/chat" className="flex items-center space-x-2.5 overflow-hidden group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#d97706] to-[#ea580c] flex items-center justify-center shrink-0 shadow-md shadow-orange-950/40 group-hover:scale-105 transition-transform">
              <span className="text-white text-base font-serif font-black">✳</span>
            </div>
            {!isCollapsed && (
              <span className="font-semibold text-sm tracking-tight text-[#f4f4f5] whitespace-nowrap">
                Claude <span className="text-amber-500 font-mono text-xs font-normal">Hub</span>
              </span>
            )}
          </Link>
          {!isCollapsed && (
            <div className="flex items-center space-x-1">
              <Link
                href="/chat"
                className="text-zinc-400 hover:text-amber-400 p-1 rounded-lg hover:bg-zinc-800/60 transition-colors"
                title="Yeni Sohbet"
              >
                <MessageSquare className="w-3.5 h-3.5" />
              </Link>
              <button
                onClick={toggleCollapse}
                className="text-zinc-400 hover:text-amber-400 p-1 rounded-lg hover:bg-zinc-800/60 transition-colors"
                title="Menüyü Daralt"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          {isCollapsed && (
            <button
              onClick={toggleCollapse}
              className="text-zinc-400 hover:text-amber-400 p-1 rounded-lg hover:bg-zinc-800/60 transition-colors mx-auto"
              title="Menüyü Genişlet"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Quick New Chat Button */}
        <div className="p-2.5">
          <Link
            href="/chat"
            className={cn(
              "flex items-center justify-center space-x-2 rounded-xl bg-[#222228] hover:bg-[#2a2a32] border border-[#33333e] text-[#f4f4f5] text-xs font-medium py-2 px-3 transition-all hover:border-amber-500/40 shadow-xs",
              isCollapsed && "p-2"
            )}
          >
            <span className="text-amber-400 font-bold text-sm leading-none">+</span>
            {!isCollapsed && <span>New chat</span>}
          </Link>
        </div>

        {/* Navigation links */}
        <nav className="px-2 space-y-0.5 overflow-y-auto max-h-[calc(100vh-230px)]">
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
                  isCollapsed ? "justify-center p-2" : "px-2.5 py-2",
                  isActive
                    ? "bg-[#272730] text-[#fafafa] font-semibold border border-[#3f3f4e] shadow-xs"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-[#1f1f26] border border-transparent"
                )}
              >
                <div className="flex items-center space-x-2.5 overflow-hidden">
                  <div
                    className={cn(
                      "w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-transform",
                      isActive
                        ? "bg-amber-500/20 text-amber-400"
                        : "text-zinc-400 group-hover:text-amber-400"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  {!isCollapsed && <span className="truncate leading-tight text-[11.5px]">{item.name}</span>}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User / Free Plan Footer */}
      <div className="p-3 border-t border-[#27272a] bg-[#141418]">
        {isAuthenticated ? (
          <>
            <div className={cn("flex items-center", isCollapsed ? "justify-center" : "justify-between")}>
              <Link href="/profile" className="flex items-center space-x-2.5 overflow-hidden group">
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#d97706] to-[#ea580c] flex items-center justify-center text-[10px] font-bold text-white shrink-0 shadow-xs ring-1 ring-amber-500/30">
                  {initials}
                </div>
                {!isCollapsed && (
                  <div className="overflow-hidden">
                    <p className="text-xs font-medium text-zinc-200 truncate group-hover:text-amber-400 transition-colors">
                      {displayName}
                    </p>
                    <p className="text-[10px] text-amber-500 font-mono">Free Plan</p>
                  </div>
                )}
              </Link>
              {!isCollapsed && (
                <button
                  onClick={logout}
                  title="Oturumu Kapat"
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="space-y-2">
            <Link
              href="/login"
              className={cn(
                "w-full py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium flex items-center justify-center space-x-2 transition-all shadow-xs",
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
          className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-amber-500/50 active:bg-amber-500 transition-colors z-50 group flex items-center justify-center"
        >
          <div className="w-0.5 h-8 bg-zinc-700 group-hover:bg-amber-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      )}
    </aside>
  );
}
