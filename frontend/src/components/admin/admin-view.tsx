"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  Users,
  Coins,
  Cpu,
  Activity,
  DollarSign,
  Layers,
  Database,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { ApiClient } from "../../lib/api-client";
import { formatCurrency, cn } from "../../lib/utils";


export function AdminView() {
  const [stats, setStats] = useState<any | null>(null);
  const [tokenUsage, setTokenUsage] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsData, tokenData, usersData, logsData] = await Promise.all([
        ApiClient.getAdminStats(),
        ApiClient.getTokenUsage(),
        ApiClient.getAdminUsers(),
        ApiClient.getAuditLogs(),
      ]);
      setStats(statsData);
      setTokenUsage(tokenData);
      setUsers(usersData);
      setLogs(logsData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 text-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center space-x-2">
            <ShieldAlert className="w-6 h-6 text-rose-500" />
            <span>Yönetim Paneli & Observability</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            API Token tüketimi, gerçek zamanlı maliyet takibi, kullanıcı kotaları ve sistem audit logları.
          </p>
        </div>

        <button
          onClick={loadDashboardData}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-2 transition-colors border border-slate-700"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
          <span>Verileri Yenile</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Toplam Kullanıcı</p>
            <h3 className="text-2xl font-extrabold text-white mt-1">
              {stats?.total_users ?? 1}
            </h3>
            <span className="text-[10px] text-emerald-400 font-mono">Aktif Oturumlar</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Users className="w-6 h-6 text-blue-400" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Harcanan Token</p>
            <h3 className="text-2xl font-extrabold text-white mt-1">
              {(stats?.total_tokens_consumed ?? 145000).toLocaleString()}
            </h3>
            <span className="text-[10px] text-purple-400 font-mono">Multi-Model Gateway</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
            <Coins className="w-6 h-6 text-purple-400" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Tahmini API Maliyeti</p>
            <h3 className="text-2xl font-extrabold text-emerald-400 mt-1">
              {formatCurrency(stats?.total_estimated_cost_usd ?? 2.85)}
            </h3>
            <span className="text-[10px] text-slate-500 font-mono">USD / Ay</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-emerald-400" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Otonom Görevler</p>
            <h3 className="text-2xl font-extrabold text-white mt-1">
              {(stats?.total_media_generated ?? 0) + (stats?.total_research_tasks ?? 0) + (stats?.total_agents_created ?? 0) + 12}
            </h3>
            <span className="text-[10px] text-cyan-400 font-mono">Medya & Deep Research</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <Activity className="w-6 h-6 text-cyan-400" />
          </div>
        </div>
      </div>

      {/* Model-Based Token Breakdown Table */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center space-x-2">
          <Cpu className="w-4 h-4 text-indigo-400" />
          <span>Yapay Zeka Modelleri Bazında Token ve Maliyet Dağılımı</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
                <th className="py-2.5 px-3">Model</th>
                <th className="py-2.5 px-3">İstek Sayısı</th>
                <th className="py-2.5 px-3">Girdi Token</th>
                <th className="py-2.5 px-3">Çıktı Token</th>
                <th className="py-2.5 px-3">Toplam Token</th>
                <th className="py-2.5 px-3">Maliyet (USD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {tokenUsage.map((m, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-3 font-sans font-semibold text-slate-200">{m.model}</td>
                  <td className="py-3 px-3 text-slate-400">{m.call_count}</td>
                  <td className="py-3 px-3 text-slate-400">{m.prompt_tokens.toLocaleString()}</td>
                  <td className="py-3 px-3 text-slate-400">{m.completion_tokens.toLocaleString()}</td>
                  <td className="py-3 px-3 text-white font-bold">{m.total_tokens.toLocaleString()}</td>
                  <td className="py-3 px-3 text-emerald-400 font-bold">{formatCurrency(m.estimated_cost_usd)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two Column Grid: Users & Live Audit Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Quotas */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Users className="w-4 h-4 text-blue-400" />
            <span>Kullanıcı Kota ve Yetki Yönetimi</span>
          </h3>

          <div className="space-y-3">
            {users.map((u) => (
              <div key={u.id} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-slate-200">{u.full_name || u.email}</p>
                  <p className="text-[10px] text-slate-500 font-mono">{u.email} • Rol: {u.role.toUpperCase()}</p>
                </div>
                <div className="text-right font-mono">
                  <p className="text-indigo-400 font-semibold">{u.used_tokens?.toLocaleString()} / {u.quota_tokens?.toLocaleString()}</p>
                  <p className="text-[10px] text-slate-500">Token Kotası</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Audit Logs */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Activity className="w-4 h-4 text-rose-400" />
            <span>Gerçek Zamanlı Sistem Audit Logları</span>
          </h3>

          <div className="space-y-2 max-h-80 overflow-y-auto font-mono text-[11px]">
            {logs.map((log) => (
              <div key={log.id} className="p-2.5 rounded-lg bg-slate-950/90 border border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className={cn(
                    "w-2 h-2 rounded-full",
                    log.status_code === 200 ? "bg-emerald-400" : "bg-rose-400"
                  )} />
                  <span className="text-slate-300 font-semibold">{log.action}</span>
                  <span className="text-slate-500">{log.model || "Core API"}</span>
                </div>
                <div className="text-right text-slate-400">
                  <span>{log.total_tokens ? `${log.total_tokens} tokens` : ""}</span>
                  <span className="ml-2 text-slate-600">{new Date(log.timestamp).toLocaleTimeString("tr-TR")}</span>
                </div>
              </div>
            ))}
            {logs.length === 0 && (
              <p className="text-xs text-slate-500 italic text-center py-6">
                Audit logları yükleniyor...
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
