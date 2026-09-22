"use client";

import React, { useState, useEffect } from "react";
import {
  User as UserIcon,
  Mail,
  Shield,
  KeyRound,
  Zap,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  LogOut,
  Save,
  RotateCcw,
  Cpu,
  Layers,
} from "lucide-react";
import { useAuth } from "../../../context/auth-context";

export default function ProfilePage() {
  const { user, updateProfile, changePassword, logout, refreshUser, isLoading } = useAuth();

  // Profile form state
  const [fullName, setFullName] = useState("");
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (user?.full_name) {
      setFullName(user.full_name);
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    setSavingProfile(true);
    try {
      await updateProfile(fullName);
      setProfileMsg({ type: "success", text: "Profil bilgileriniz başarıyla güncellendi." });
    } catch (err: any) {
      setProfileMsg({ type: "error", text: err?.message || "Profil güncellenirken bir hata oluştu." });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword.length < 6) {
      setPasswordMsg({ type: "error", text: "Yeni şifre en az 6 karakter olmalıdır." });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "Yeni şifreler eşleşmiyor." });
      return;
    }

    setSavingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      setPasswordMsg({ type: "success", text: "Şifreniz başarıyla değiştirildi." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordMsg({ type: "error", text: err?.message || "Şifre değiştirilemedi. Lütfen mevcut şifrenizi kontrol edin." });
    } finally {
      setSavingPassword(false);
    }
  };

  const usedTokens = user?.used_tokens || 0;
  const quotaTokens = user?.quota_tokens || 100_000_000;
  const remainingTokens = Math.max(0, quotaTokens - usedTokens);
  const usagePercentage = Math.min(100, Math.max(0, (usedTokens / quotaTokens) * 100));

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("tr-TR").format(num);
  };

  const initials = user?.full_name
    ? user.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user?.email
    ? user.email[0].toUpperCase()
    : "U";

  return (
    <div className="flex-1 p-6 md:p-8 space-y-8 max-w-6xl mx-auto w-full">
      {/* Header Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800/80 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center space-x-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center text-2xl font-bold text-white shadow-xl shadow-indigo-600/30 ring-4 ring-slate-800">
              {initials}
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                  {user?.full_name || "NexusAI Kullanıcısı"}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
                  {user?.role === "admin" ? "Yönetici" : "Standart Hesap"}
                </span>
              </div>
              <p className="text-slate-400 text-sm mt-1 flex items-center space-x-2">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                <span>{user?.email || "Hesap e-postası"}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 w-full md:w-auto">
            <button
              onClick={() => refreshUser()}
              className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs font-medium border border-slate-700/60 transition-all flex items-center space-x-2 shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Yenile</span>
            </button>
            <button
              onClick={logout}
              className="px-4 py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 text-xs font-medium border border-rose-500/30 transition-all flex items-center space-x-2 shadow-sm"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Oturumu Kapat</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quota & AI Resources Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Token Balance Card */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Toplam AI Token Kotası</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {formatNumber(quotaTokens)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Platform başlangıç bakiyesi</p>
        </div>

        {/* Used Tokens */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Tüketilen Token</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-purple-300 font-mono">
            {formatNumber(usedTokens)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Sohbet, kod ve medya üretimlerinde kullanılan</p>
        </div>

        {/* Remaining Tokens */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Kalan Kullanılabilir Bakiye</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">
            {formatNumber(remainingTokens)}
          </div>
          <p className="text-[11px] text-emerald-500/80 mt-1 font-mono">%{ (100 - usagePercentage).toFixed(2) } Kullanılabilir</p>
        </div>
      </div>

      {/* Token Progress Bar Detailed */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 font-medium text-slate-300">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>Genel Kaynak Kullanım Oranı</span>
          </div>
          <span className="font-mono text-indigo-400 font-semibold">
            %{usagePercentage.toFixed(3)}
          </span>
        </div>
        <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-500"
            style={{ width: `${Math.max(1, usagePercentage)}%` }}
          />
        </div>
        <div className="flex justify-between text-[11px] text-slate-500 font-mono pt-1">
          <span>0 Token</span>
          <span>50M Token</span>
          <span>100M Token</span>
        </div>
      </div>

      {/* Two Column Settings: Profile & Security */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Information Form */}
        <div className="p-6 md:p-8 rounded-3xl bg-slate-900/80 border border-slate-800/80 space-y-6">
          <div className="flex items-center space-x-3 pb-4 border-b border-slate-800/60">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Profil Bilgileri</h2>
              <p className="text-xs text-slate-400">Kişisel bilgilerinizi güncelleyin</p>
            </div>
          </div>

          {profileMsg && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-start space-x-2.5 ${
                profileMsg.type === "success"
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-red-500/10 border-red-500/30 text-red-400"
              }`}
            >
              {profileMsg.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span>{profileMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Ad Soyad
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Adınız Soyadınız"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                E-posta Adresi
              </label>
              <input
                type="email"
                disabled
                value={user?.email || ""}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950/30 border border-slate-800/60 text-slate-400 text-sm cursor-not-allowed font-mono"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                E-posta adresi hesap güvenliği nedeniyle sabittir.
              </span>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingProfile}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-all shadow-md shadow-indigo-600/25 flex items-center space-x-2 disabled:opacity-50"
              >
                {savingProfile ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Değişiklikleri Kaydet</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Security & Password Change Form */}
        <div className="p-6 md:p-8 rounded-3xl bg-slate-900/80 border border-slate-800/80 space-y-6">
          <div className="flex items-center space-x-3 pb-4 border-b border-slate-800/60">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Güvenlik & Şifre Değiştir</h2>
              <p className="text-xs text-slate-400">Hesap şifrenizi güvenli şekilde yenileyin</p>
            </div>
          </div>

          {passwordMsg && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-start space-x-2.5 ${
                passwordMsg.type === "success"
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-red-500/10 border-red-500/30 text-red-400"
              }`}
            >
              {passwordMsg.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span>{passwordMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Mevcut Şifreniz
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Yeni Şifre (En az 6 karakter)
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Yeni Şifre Tekrar
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingPassword}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs transition-all shadow-md shadow-purple-600/25 flex items-center space-x-2 disabled:opacity-50"
              >
                {savingPassword ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    <span>Şifreyi Güncelle</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Account Info Details */}
      <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/60 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
        <div className="flex items-center space-x-2">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span>Hesap Durumu: <strong className="text-emerald-400 font-normal">Aktif & Doğrulanmış</strong></span>
        </div>
        <div className="font-mono text-[11px] text-slate-500">
          Kullanıcı ID: {user?.id || "N/A"}
        </div>
      </div>
    </div>
  );
}
