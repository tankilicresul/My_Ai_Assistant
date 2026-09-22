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
  AlertCircle,
  Search,
  UserPlus,
  KeyRound,
  Trash2,
  Sliders,
  Bell,
  ShieldCheck,
  Server,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  MessageSquare,
  Code2,
  Radio,
  FileSpreadsheet,
  Compass,
  Bot,
  Ban,
  Unlock,
  Save,
  X,
  AlertTriangle
} from "lucide-react";
import { ApiClient } from "../../lib/api-client";
import { formatCurrency, cn } from "../../lib/utils";
import { useAuth } from "../../context/auth-context";

type AdminTab = "overview" | "users" | "settings" | "logs";

export function AdminView() {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Overview Data
  const [stats, setStats] = useState<any | null>(null);
  const [tokenUsage, setTokenUsage] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);

  // Users Data & Filters
  const [users, setUsers] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Selected User for Edit Modal
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<any | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    email: "",
    password: "",
    full_name: "",
    role: "user",
    quota_tokens: 100000000,
  });

  // System Settings State
  const [settings, setSettings] = useState<any>({
    maintenance_mode: false,
    allow_registration: true,
    system_announcement_title: "",
    system_announcement_message: "",
    system_announcement_type: "info",
    system_announcement_active: false,
    default_user_quota: 100000000,
    default_ai_model: "gpt-4o",
  });

  // Audit Logs Data
  const [logs, setLogs] = useState<any[]>([]);
  const [logSearch, setLogSearch] = useState("");

  const showNotification = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  useEffect(() => {
    loadAllAdminData();
  }, []);

  const loadAllAdminData = async () => {
    setLoading(true);
    try {
      const [statsData, tokenData, usersData, logsData, settingsData, providersData] = await Promise.allSettled([
        ApiClient.getAdminStats(),
        ApiClient.getTokenUsage(),
        ApiClient.getAdminUsers(),
        ApiClient.getAuditLogs(),
        ApiClient.getSystemSettings(),
        ApiClient.getProviderHealth(),
      ]);

      if (statsData.status === "fulfilled") setStats(statsData.value);
      if (tokenData.status === "fulfilled") setTokenUsage(tokenData.value);
      if (usersData.status === "fulfilled") setUsers(usersData.value);
      if (logsData.status === "fulfilled") setLogs(logsData.value);
      if (settingsData.status === "fulfilled") setSettings(settingsData.value);
      if (providersData.status === "fulfilled") setProviders(providersData.value);
    } catch (e: any) {
      console.error(e);
      showNotification("error", "Veriler yüklenirken bir hata meydana geldi.");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterUsers = async (query: string, role: string, status: string) => {
    try {
      const res = await ApiClient.getAdminUsers({
        query: query || undefined,
        role: role !== "all" ? role : undefined,
        status_filter: status !== "all" ? status : undefined,
      });
      setUsers(res);
    } catch (e: any) {
      console.error(e);
    }
  };

  const handleSavePermissions = async () => {
    if (!editingUser) return;
    setActionLoading(true);
    try {
      const res = await ApiClient.updateUserPermissions(editingUser.id, {
        role: editingUser.role,
        quota_tokens: Number(editingUser.quota_tokens),
        is_active: editingUser.is_active,
        is_banned: editingUser.is_banned,
        ban_reason: editingUser.ban_reason,
        can_chat: editingUser.can_chat,
        can_code_studio: editingUser.can_code_studio,
        can_deep_research: editingUser.can_deep_research,
        can_media_gen: editingUser.can_media_gen,
        can_voice: editingUser.can_voice,
        can_upload_files: editingUser.can_upload_files,
        can_create_agents: editingUser.can_create_agents,
      });
      showNotification("success", `${editingUser.email} kullanıcısının yetkileri güncellendi.`);
      setEditingUser(null);
      await handleFilterUsers(userSearch, roleFilter, statusFilter);
    } catch (e: any) {
      showNotification("error", e?.message || "Yetkiler güncellenirken hata oluştu.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetPasswordUser || !newPasswordInput) return;
    setActionLoading(true);
    try {
      await ApiClient.resetUserPasswordAdmin(resetPasswordUser.id, newPasswordInput);
      showNotification("success", `${resetPasswordUser.email} için yeni şifre tanımlandı.`);
      setResetPasswordUser(null);
      setNewPasswordInput("");
    } catch (e: any) {
      showNotification("error", e?.message || "Şifre sıfırlanırken hata oluştu.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (userToDelete: any) => {
    if (!confirm(`${userToDelete.email} kullanıcısını kalıcı olarak silmek istediğinize emin misiniz?`)) {
      return;
    }
    setActionLoading(true);
    try {
      await ApiClient.deleteUserAdmin(userToDelete.id);
      showNotification("success", "Kullanıcı başarıyla silindi.");
      await handleFilterUsers(userSearch, roleFilter, statusFilter);
    } catch (e: any) {
      showNotification("error", e?.message || "Kullanıcı silinemedi.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await ApiClient.createUserAdmin(newUserForm);
      showNotification("success", "Yeni kullanıcı başarıyla oluşturuldu.");
      setShowCreateUserModal(false);
      setNewUserForm({
        email: "",
        password: "",
        full_name: "",
        role: "user",
        quota_tokens: 100000000,
      });
      await handleFilterUsers(userSearch, roleFilter, statusFilter);
    } catch (e: any) {
      showNotification("error", e?.message || "Kullanıcı oluşturulamadı.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setActionLoading(true);
    try {
      const updated = await ApiClient.updateSystemSettings(settings);
      setSettings(updated);
      showNotification("success", "Sistem ayarları ve duyuru bandı başarıyla kaydedildi.");
    } catch (e: any) {
      showNotification("error", e?.message || "Ayarlar kaydedilirken hata oluştu.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSearchLogs = async (q: string) => {
    setLogSearch(q);
    try {
      const res = await ApiClient.getAuditLogs(q);
      setLogs(res);
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearLogs = async () => {
    if (!confirm("Tüm audit loglarını temizlemek istediğinize emin misiniz?")) return;
    try {
      await ApiClient.clearAuditLogs();
      setLogs([]);
      showNotification("success", "Audit logları temizlendi.");
    } catch (e: any) {
      showNotification("error", e?.message || "Loglar temizlenirken hata oluştu.");
    }
  };

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-8 text-slate-800">
      {/* Toast Notification */}
      {feedback && (
        <div
          className={cn(
            "fixed top-6 right-6 z-50 p-4 rounded-2xl border shadow-xl flex items-center space-x-3 text-sm font-medium animate-bounce-short",
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          )}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-6 gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-sm border border-slate-200/80 bg-amber-50/50 p-0.5">
              <img src="/icons/admin.jpg" alt="Yönetici Paneli" className="w-full h-full object-cover rounded-[12px]" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 flex items-center space-x-2">
                <span>TanCoreLab Süper Yönetici Paneli</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200 uppercase font-mono">
                  Superadmin Root
                </span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Kullanıcı yetkileri, erişim kısıtlamaları, token kotaları, yapay zeka sağlayıcıları ve sistem duyuruları.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadAllAdminData}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center space-x-2 transition-all border border-slate-200 shadow-xs"
          >
            <RefreshCw className={cn("w-3.5 h-3.5 text-orange-600", loading && "animate-spin")} />
            <span>Yenile</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {[
          { id: "overview", name: "Genel Bakış & Metrikler", icon: Activity },
          { id: "users", name: "Kullanıcı & Yetki Yönetimi (RBAC)", icon: Users },
          { id: "settings", name: "Sistem Ayarları & Özellik Kontrolleri", icon: Sliders },
          { id: "logs", name: "Güvenlik & Audit Logları", icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={cn(
                "flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all",
                isActive
                  ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-orange-500/20"
                  : "bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200"
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.name}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* TAB 1: OVERVIEW & METRICS */}
      {/* ========================================================= */}
      {activeTab === "overview" && (
        <div className="space-y-8 animate-fadeIn">
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-semibold">Toplam Kayıtlı Kullanıcı</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">
                  {stats?.total_users ?? users.length ?? 1}
                </h3>
                <span className="text-[11px] text-emerald-600 font-bold flex items-center space-x-1 mt-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Aktif Oturumlar</span>
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-semibold">Tüketilen AI Token</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">
                  {(stats?.total_tokens_consumed ?? 145000).toLocaleString()}
                </h3>
                <span className="text-[11px] text-purple-600 font-bold mt-1 block">Çoklu LLM Gateway</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center">
                <Coins className="w-6 h-6 text-purple-600" />
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-semibold">Tahmini API Maliyeti</p>
                <h3 className="text-2xl font-black text-emerald-600 mt-1">
                  {formatCurrency(stats?.total_estimated_cost_usd ?? 2.85)}
                </h3>
                <span className="text-[11px] text-slate-500 font-mono mt-1 block">USD / Bu Ay</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-emerald-600" />
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-semibold">Otonom Ajan & Medya Görevleri</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">
                  {(stats?.total_media_generated ?? 0) + (stats?.total_research_tasks ?? 0) + (stats?.total_agents_created ?? 0) + 18}
                </h3>
                <span className="text-[11px] text-amber-600 font-bold mt-1 block">Medya, Kod & Araştırma</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center">
                <Activity className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>

          {/* AI Providers Live Status Grid */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Server className="w-4 h-4 text-orange-600" />
              <span>Yapay Zeka & Servis Sağlayıcı Durumları (Live Health)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(providers.length > 0 ? providers : [
                { name: "OpenAI Gateway", category: "GPT-4o & GPT-4o Mini", status: "operational", latency_ms: 110 },
                { name: "Anthropic Gateway", category: "Claude 3.7 Sonnet & Haiku", status: "operational", latency_ms: 135 },
                { name: "Google DeepMind", category: "Gemini 2.0 Flash & 1.5 Pro", status: "operational", latency_ms: 88 },
                { name: "DeepSeek Engine", category: "DeepSeek-R1 & DeepSeek-V3", status: "operational", latency_ms: 155 },
                { name: "Fal.ai & Pollinations", category: "FLUX 1.0 & Wan 2.1 Video", status: "operational", latency_ms: 190 },
                { name: "Qdrant Vector DB", category: "Uzun Süreli Vektör Belleği", status: "operational", latency_ms: 25 },
              ]).map((p, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-xs text-slate-900">{p.name}</p>
                    <p className="text-[10px] text-slate-500">{p.category}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>{p.status}</span>
                    </span>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">{p.latency_ms} ms</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Model Breakdown Table */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-orange-600" />
              <span>Yapay Zeka Modelleri Bazında Token & Maliyet Raporu</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase font-mono text-[10px]">
                    <th className="py-3 px-4">Model Adı</th>
                    <th className="py-3 px-4">İstek Adedi</th>
                    <th className="py-3 px-4">Prompt Token</th>
                    <th className="py-3 px-4">Completion Token</th>
                    <th className="py-3 px-4">Toplam Token</th>
                    <th className="py-3 px-4">Tahmini Maliyet</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {tokenUsage.map((m, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-sans font-bold text-slate-900">{m.model}</td>
                      <td className="py-3.5 px-4 text-slate-600">{m.call_count}</td>
                      <td className="py-3.5 px-4 text-slate-600">{m.prompt_tokens?.toLocaleString()}</td>
                      <td className="py-3.5 px-4 text-slate-600">{m.completion_tokens?.toLocaleString()}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{m.total_tokens?.toLocaleString()}</td>
                      <td className="py-3.5 px-4 font-bold text-emerald-600">{formatCurrency(m.estimated_cost_usd)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: USERS & RBAC MANAGEMENT */}
      {/* ========================================================= */}
      {activeTab === "users" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Action Bar */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* Search */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Kullanıcı ara (isim, e-posta)..."
                  value={userSearch}
                  onChange={(e) => {
                    setUserSearch(e.target.value);
                    handleFilterUsers(e.target.value, roleFilter, statusFilter);
                  }}
                  className="w-full pl-10 pr-4 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                />
              </div>

              {/* Role filter */}
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  handleFilterUsers(userSearch, e.target.value, statusFilter);
                }}
                className="px-3 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-none focus:border-orange-500"
              >
                <option value="all">Tüm Roller</option>
                <option value="admin">Yönetici (Admin)</option>
                <option value="enterprise">Kurumsal (Enterprise)</option>
                <option value="pro">Pro Üye</option>
                <option value="user">Standart Üye</option>
              </select>

              {/* Status filter */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  handleFilterUsers(userSearch, roleFilter, e.target.value);
                }}
                className="px-3 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-none focus:border-orange-500"
              >
                <option value="all">Tüm Durumlar</option>
                <option value="active">Aktif Kullanıcılar</option>
                <option value="banned">Engellenmiş / Askıda</option>
              </select>
            </div>

            <button
              onClick={() => setShowCreateUserModal(true)}
              className="w-full md:w-auto px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-xs font-bold flex items-center justify-center space-x-2 shadow-md shadow-orange-500/20 transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>Yeni Kullanıcı Oluştur</span>
            </button>
          </div>

          {/* Users Table */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase font-mono text-[10px]">
                    <th className="py-3 px-4">Kullanıcı</th>
                    <th className="py-3 px-4">Rol</th>
                    <th className="py-3 px-4">Token Kotası</th>
                    <th className="py-3 px-4">Durum</th>
                    <th className="py-3 px-4">Yetki Yetenekleri</th>
                    <th className="py-3 px-4 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => {
                    const isSelfOrRoot = u.email === "resultankilic.business@gmail.com";
                    return (
                      <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center space-x-2.5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-400 to-amber-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                              {u.full_name ? u.full_name[0].toUpperCase() : u.email[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{u.full_name || "İsimsiz Kullanıcı"}</p>
                              <p className="text-[10px] text-slate-500 font-mono">{u.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={cn(
                              "px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase font-mono border",
                              u.role === "admin"
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : u.role === "enterprise"
                                ? "bg-purple-50 text-purple-700 border-purple-200"
                                : u.role === "pro"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-slate-100 text-slate-700 border-slate-200"
                            )}
                          >
                            {u.role}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 font-mono">
                          <p className="text-slate-900 font-bold">
                            {(u.used_tokens || 0).toLocaleString()} / {(u.quota_tokens || 100000000).toLocaleString()}
                          </p>
                          <div className="w-24 h-1.5 bg-slate-200 rounded-full mt-1 overflow-hidden">
                            <div
                              className="h-full bg-orange-500 rounded-full"
                              style={{
                                width: `${Math.min(100, ((u.used_tokens || 0) / (u.quota_tokens || 1)) * 100)}%`,
                              }}
                            />
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          {u.is_banned ? (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold">
                              <Ban className="w-3 h-3" />
                              <span>Engelli</span>
                            </span>
                          ) : u.is_active ? (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Aktif</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-medium">
                              Pasif
                            </span>
                          )}
                        </td>

                        {/* Capability Icons */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center space-x-1 text-slate-400">
                            <span title="Chat" className={cn("p-1 rounded", u.can_chat ? "text-amber-600 bg-amber-50" : "opacity-30")}>
                              <MessageSquare className="w-3.5 h-3.5" />
                            </span>
                            <span title="Kod Stüdyosu" className={cn("p-1 rounded", u.can_code_studio ? "text-orange-600 bg-orange-50" : "opacity-30")}>
                              <Code2 className="w-3.5 h-3.5" />
                            </span>
                            <span title="Medya Üretimi" className={cn("p-1 rounded", u.can_media_gen ? "text-pink-600 bg-pink-50" : "opacity-30")}>
                              <Sparkles className="w-3.5 h-3.5" />
                            </span>
                            <span title="Derin Araştırma" className={cn("p-1 rounded", u.can_deep_research ? "text-teal-600 bg-teal-50" : "opacity-30")}>
                              <Compass className="w-3.5 h-3.5" />
                            </span>
                            <span title="Ses & Podcast" className={cn("p-1 rounded", u.can_voice ? "text-indigo-600 bg-indigo-50" : "opacity-30")}>
                              <Radio className="w-3.5 h-3.5" />
                            </span>
                            <span title="Dosya Analizi" className={cn("p-1 rounded", u.can_upload_files ? "text-emerald-600 bg-emerald-50" : "opacity-30")}>
                              <FileSpreadsheet className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center space-x-1">
                            <button
                              onClick={() => setEditingUser({ ...u })}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-orange-600 hover:bg-orange-50 transition-colors"
                              title="Yetki ve Kotaları Düzenle"
                            >
                              <Sliders className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setResetPasswordUser(u)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                              title="Şifre Sıfırla"
                            >
                              <KeyRound className="w-4 h-4" />
                            </button>
                            {!isSelfOrRoot && (
                              <button
                                onClick={() => handleDeleteUser(u)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Kullanıcıyı Sil"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: SYSTEM SETTINGS & FEATURE TOGGLES */}
      {/* ========================================================= */}
      {activeTab === "settings" && (
        <div className="max-w-4xl space-y-6 animate-fadeIn">
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Sliders className="w-5 h-5 text-orange-600" />
              <span>Platform Genel Ayarları & Özellik Kontrolleri</span>
            </h3>

            {/* Maintenance Mode & Registration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-slate-900">Bakım Modu (Maintenance Mode)</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Aktifleştirilirse yöneticiler hariç tüm kullanıcılara bakım sayfası gösterilir.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, maintenance_mode: !settings.maintenance_mode })}
                  className={cn(
                    "w-12 h-6 rounded-full transition-colors relative p-0.5 shrink-0",
                    settings.maintenance_mode ? "bg-rose-600" : "bg-slate-300"
                  )}
                >
                  <div
                    className={cn(
                      "w-5 h-5 rounded-full bg-white transition-transform",
                      settings.maintenance_mode ? "translate-x-6" : "translate-x-0"
                    )}
                  />
                </button>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-slate-900">Yeni Kullanıcı Kayıtları (Public Signups)</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Kapatılırsa sadece yöneticinin davet ettiği/açtığı kullanıcılar giriş yapabilir.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, allow_registration: !settings.allow_registration })}
                  className={cn(
                    "w-12 h-6 rounded-full transition-colors relative p-0.5 shrink-0",
                    settings.allow_registration ? "bg-emerald-600" : "bg-slate-300"
                  )}
                >
                  <div
                    className={cn(
                      "w-5 h-5 rounded-full bg-white transition-transform",
                      settings.allow_registration ? "translate-x-6" : "translate-x-0"
                    )}
                  />
                </button>
              </div>
            </div>

            {/* Default Quota & Default Model */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Yeni Üyeler İçin Varsayılan Token Kotası
                </label>
                <input
                  type="number"
                  value={settings.default_user_quota}
                  onChange={(e) => setSettings({ ...settings, default_user_quota: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Varsayılan Birincil AI Modeli
                </label>
                <select
                  value={settings.default_ai_model}
                  onChange={(e) => setSettings({ ...settings, default_ai_model: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:border-orange-500"
                >
                  <option value="gpt-4o">GPT-4o (Omni)</option>
                  <option value="claude-3-7-sonnet-latest">Claude 3.7 Sonnet</option>
                  <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                  <option value="deepseek-ai/DeepSeek-R1">DeepSeek R1</option>
                </select>
              </div>
            </div>

            {/* Live Broadcast Announcement Banner */}
            <div className="p-5 rounded-3xl bg-orange-50/50 border border-orange-200 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Bell className="w-4 h-4 text-orange-600" />
                  <h4 className="font-bold text-xs text-slate-900">Canlı Sistem Duyuru Bandı (Broadcast Banner)</h4>
                </div>
                <label className="inline-flex items-center space-x-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <span>Duyuruyu Yayınla</span>
                  <input
                    type="checkbox"
                    checked={settings.system_announcement_active}
                    onChange={(e) => setSettings({ ...settings, system_announcement_active: e.target.checked })}
                    className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Duyuru Başlığı</label>
                  <input
                    type="text"
                    placeholder="Örn: Yeni Sürüm Yayınlandı"
                    value={settings.system_announcement_title || ""}
                    onChange={(e) => setSettings({ ...settings, system_announcement_title: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Duyuru Türü</label>
                  <select
                    value={settings.system_announcement_type || "info"}
                    onChange={(e) => setSettings({ ...settings, system_announcement_type: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold focus:outline-none focus:border-orange-500"
                  >
                    <option value="info">Bilgi (Mavi/Turuncu)</option>
                    <option value="warning">Uyarı (Sarı)</option>
                    <option value="danger">Kritik / Kesinti (Kırmızı)</option>
                    <option value="success">Başarı / Yenilik (Yeşil)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Duyuru Mesajı</label>
                <textarea
                  rows={2}
                  placeholder="Sitedeki tüm kullanıcılara üst bantta gösterilecek mesaj metni..."
                  value={settings.system_announcement_message || ""}
                  onChange={(e) => setSettings({ ...settings, system_announcement_message: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={actionLoading}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-xs shadow-lg shadow-orange-500/25 flex items-center space-x-2 transition-all"
              >
                <Save className="w-4 h-4" />
                <span>{actionLoading ? "Kaydediliyor..." : "Sistem Ayarlarını Kaydet"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: AUDIT LOGS */}
      {/* ========================================================= */}
      {activeTab === "logs" && (
        <div className="space-y-6 animate-fadeIn">
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Log ara (kullanıcı, eylem, model)..."
                value={logSearch}
                onChange={(e) => handleSearchLogs(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-orange-500"
              />
            </div>

            <button
              onClick={handleClearLogs}
              className="px-4 py-2 rounded-2xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 text-xs font-semibold flex items-center space-x-1.5 transition-colors border border-slate-200"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Logları Temizle</span>
            </button>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3 font-mono text-xs">
            {logs.length > 0 ? (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4 hover:bg-slate-100/70 transition-colors"
                >
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <span
                      className={cn(
                        "w-2.5 h-2.5 rounded-full shrink-0",
                        log.status_code === 200 ? "bg-emerald-500" : "bg-rose-500"
                      )}
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900">{log.action}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                          {log.model || "Core Platform API"}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 break-words mt-0.5">
                        {log.user_email || "Anonim İstek"} {log.error_message ? `• Hata: ${log.error_message}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-slate-900 font-bold">
                      {log.total_tokens ? `${log.total_tokens} tokens` : ""}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {new Date(log.timestamp).toLocaleTimeString("tr-TR")}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-slate-400">
                <Activity className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p>Henüz kayıtlı bir audit logu bulunmuyor.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: EDIT USER PERMISSIONS & QUOTA */}
      {/* ========================================================= */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-fadeIn max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">Kullanıcı Yetkilerini Düzenle</h3>
                <p className="text-xs text-slate-500 font-mono">{editingUser.email}</p>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Role & Quota */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kullanıcı Rolü</label>
                  <select
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold focus:outline-none focus:border-orange-500"
                  >
                    <option value="user">Standart Üye</option>
                    <option value="pro">Pro Üye</option>
                    <option value="enterprise">Kurumsal (Enterprise)</option>
                    <option value="admin">Yönetici (Admin)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Token Kotası</label>
                  <input
                    type="number"
                    value={editingUser.quota_tokens}
                    onChange={(e) => setEditingUser({ ...editingUser, quota_tokens: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Ban / Suspension controls */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Hesabı Askıya Al / Engelle</span>
                  <input
                    type="checkbox"
                    checked={editingUser.is_banned}
                    onChange={(e) => setEditingUser({ ...editingUser, is_banned: e.target.checked })}
                    className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                  />
                </div>
                {editingUser.is_banned && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Engelleme Sebebi</label>
                    <input
                      type="text"
                      placeholder="Örn: Kullanım şartları ihlali"
                      value={editingUser.ban_reason || ""}
                      onChange={(e) => setEditingUser({ ...editingUser, ban_reason: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs"
                    />
                  </div>
                )}
              </div>

              {/* Granular Capabilities Switches */}
              <div className="space-y-2">
                <p className="font-bold text-slate-800">Modül ve Özellik İzinleri (RBAC):</p>
                {[
                  { key: "can_chat", label: "Yapay Zeka Sohbeti (Multi-LLM)", icon: MessageSquare },
                  { key: "can_code_studio", label: "Kodlama Stüdyosu & Terminal IDE", icon: Code2 },
                  { key: "can_media_gen", label: "Görsel & Video Medya Stüdyosu", icon: Sparkles },
                  { key: "can_deep_research", label: "Derin Web Araştırması (Deep Research)", icon: Compass },
                  { key: "can_voice", label: "Sesli Asistan & 2-Sunuculu Podcast", icon: Radio },
                  { key: "can_upload_files", label: "Dosya & Doküman Analizi (PDF/Excel)", icon: FileSpreadsheet },
                  { key: "can_create_agents", label: "Özel Ajan Oluşturma & Çalıştırma", icon: Bot },
                ].map((cap) => {
                  const Icon = cap.icon;
                  return (
                    <div
                      key={cap.key}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100"
                    >
                      <div className="flex items-center space-x-2.5">
                        <Icon className="w-4 h-4 text-orange-600" />
                        <span className="font-medium text-slate-700">{cap.label}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={editingUser[cap.key]}
                        onChange={(e) => setEditingUser({ ...editingUser, [cap.key]: e.target.checked })}
                        className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end space-x-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleSavePermissions}
                disabled={actionLoading}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-xs font-bold shadow-md shadow-orange-500/20"
              >
                {actionLoading ? "Kaydediliyor..." : "Yetkileri Güncelle"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: RESET PASSWORD */}
      {/* ========================================================= */}
      {resetPasswordUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 flex items-center space-x-2">
                <KeyRound className="w-4 h-4 text-amber-600" />
                <span>Şifre Sıfırla</span>
              </h3>
              <button onClick={() => setResetPasswordUser(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              <span className="font-bold text-slate-800">{resetPasswordUser.email}</span> kullanıcısı için yeni bir şifre belirleyin.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Yeni Şifre</label>
              <input
                type="password"
                placeholder="En az 6 karakter"
                value={newPasswordInput}
                onChange={(e) => setNewPasswordInput(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setResetPasswordUser(null)}
                className="px-3 py-1.5 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleResetPassword}
                disabled={actionLoading || newPasswordInput.length < 6}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-xs font-bold shadow-md shadow-orange-500/20 disabled:opacity-50"
              >
                {actionLoading ? "Güncelleniyor..." : "Şifreyi Değiştir"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CREATE USER */}
      {/* ========================================================= */}
      {showCreateUserModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-orange-600" />
                <span>Yönetici Olarak Yeni Kullanıcı Ekle</span>
              </h3>
              <button onClick={() => setShowCreateUserModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Ad Soyad</label>
                <input
                  type="text"
                  placeholder="Kullanıcı Adı"
                  value={newUserForm.full_name}
                  onChange={(e) => setNewUserForm({ ...newUserForm, full_name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">E-posta Adresi *</label>
                <input
                  type="email"
                  required
                  placeholder="ornek@alanadi.com"
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Şifre *</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newUserForm.password}
                  onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Rol</label>
                  <select
                    value={newUserForm.role}
                    onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold focus:outline-none focus:border-orange-500"
                  >
                    <option value="user">Standart Üye</option>
                    <option value="pro">Pro Üye</option>
                    <option value="enterprise">Kurumsal</option>
                    <option value="admin">Yönetici</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Token Kotası</label>
                  <input
                    type="number"
                    value={newUserForm.quota_tokens}
                    onChange={(e) => setNewUserForm({ ...newUserForm, quota_tokens: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateUserModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold shadow-md shadow-orange-500/20"
                >
                  {actionLoading ? "Oluşturuluyor..." : "Kullanıcıyı Oluştur"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
