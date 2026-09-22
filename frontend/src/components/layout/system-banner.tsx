"use client";

import React, { useEffect, useState } from "react";
import { Bell, AlertTriangle, AlertCircle, CheckCircle2, X } from "lucide-react";
import { ApiClient } from "../../lib/api-client";
import { cn } from "../../lib/utils";

export function SystemBanner() {
  const [announcement, setAnnouncement] = useState<any | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    async function checkPublicConfig() {
      try {
        const config = await ApiClient.getPublicConfig();
        if (config && config.announcement) {
          setAnnouncement(config.announcement);
        }
      } catch (e) {
        // Silently continue
      }
    }
    checkPublicConfig();
  }, []);

  if (!announcement || dismissed) return null;

  const type = announcement.type || "info";
  const styles = {
    info: "bg-gradient-to-r from-amber-500 to-orange-600 text-white border-orange-600",
    warning: "bg-amber-500 text-slate-900 border-amber-600 font-semibold",
    danger: "bg-rose-600 text-white border-rose-700",
    success: "bg-emerald-600 text-white border-emerald-700",
  }[type as "info" | "warning" | "danger" | "success"] || "bg-orange-600 text-white border-orange-700";

  return (
    <div className={cn("px-4 py-2.5 flex items-center justify-between text-xs border-b shadow-sm relative z-30 transition-all", styles)}>
      <div className="flex items-center space-x-2.5 max-w-5xl mx-auto flex-1">
        <Bell className="w-4 h-4 shrink-0 animate-bounce-short" />
        <div>
          <span className="font-bold mr-2">[{announcement.title}]</span>
          <span>{announcement.message}</span>
        </div>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="p-1 rounded-lg hover:bg-black/10 transition-colors shrink-0 ml-3"
        title="Kapat"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
