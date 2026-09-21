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
  ChevronRight,
  HardDrive
} from "lucide-react";
import { cn } from "../../lib/utils";


export const navigationItems = [
  { name: "Sohbet (ChatGPT)", href: "/chat", icon: MessageSquare, badge: "Multi-LLM" },
  { name: "Claude Code IDE", href: "/code", icon: Code2, badge: "Terminal" },
  { name: "Medya Stüdyosu", href: "/studio", icon: Sparkles, badge: "Flux & Wan" },
  { name: "Deep Research", href: "/research", icon: Compass, badge: "Gemini" },
  { name: "Vektör Hafıza", href: "/memory", icon: Database, badge: "Qdrant" },
  { name: "Dosya & Veri Analizi", href: "/files", icon: FileSpreadsheet, badge: "PDF/Excel" },
  { name: "Agent Marketplace", href: "/marketplace", icon: Bot, badge: "Custom" },
  { name: "Yönetim & Maliyet", href: "/admin", icon: ShieldAlert, badge: "Admin" },
];

export function Sidebar() {
  const pathname = usePathname();

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
          <Link href="/" className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors">
            <Home className="w-4 h-4" />
          </Link>
        </div>

        {/* Navigation links */}
        <nav className="p-3 space-y-1">
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
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center text-xs font-bold text-white">
              D
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-medium text-slate-200 truncate">Demo Developer</p>
              <p className="text-[10px] text-slate-500 font-mono truncate">Admin Plan</p>
            </div>
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>Kullanılan Token</span>
            <span>125k / 5M</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" style={{ width: "2.5%" }} />
          </div>
        </div>
      </div>
    </aside>
  );
}
