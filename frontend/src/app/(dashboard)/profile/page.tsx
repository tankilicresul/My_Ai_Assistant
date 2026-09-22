"use client";

import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  AlertCircle,
  Building2,
  GraduationCap,
  ShieldCheck,
  User as UserIcon,
  KeyRound,
  Save,
  LogOut,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../../../context/auth-context";

export default function ProfilePage() {
  const { user, updateProfile, changePassword, logout } = useAuth();

  // Profile form state
  const [fullName, setFullName] = useState("");
  const [university, setUniversity] = useState("Koç Üniversitesi");
  const [department, setDepartment] = useState("Endüstri Mühendisliği 3. Sınıf");
  const [isEditing, setIsEditing] = useState(false);
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
    } else if (user?.email) {
      setFullName(user.email.split("@")[0]);
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    setSavingProfile(true);
    try {
      await updateProfile(fullName);
      setProfileMsg({ type: "success", text: "Profil bilgileriniz başarıyla güncellendi." });
      setIsEditing(false);
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

  const displayName = fullName || user?.full_name || "Resul Tankılıç";

  return (
    <div className="flex-1 p-4 md:p-8 space-y-6 max-w-4xl mx-auto w-full">
      {/* Main Profile Hero Card */}
      <div className="relative rounded-[28px] bg-gradient-to-r from-[#FFA200] via-[#FF7500] to-[#FF4800] p-6 md:p-8 text-white shadow-xl shadow-orange-500/20 overflow-hidden">
        {/* Subtle background glow effect */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex items-start justify-between">
          <div className="flex items-center space-x-5">
            {/* Avatar with circular white ring */}
            <div className="relative">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-white/20 p-1 ring-4 ring-white/90 shadow-lg flex items-center justify-center overflow-hidden bg-amber-100">
                <div className="w-full h-full rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-white text-2xl font-black">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              </div>
            </div>

            {/* Name and verified badge */}
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight drop-shadow-xs">
                  {displayName}
                </h1>
                <div className="text-[#34D399] bg-white/20 p-1 rounded-full backdrop-blur-xs shadow-xs" title="Doğrulanmış Hesap">
                  <ShieldCheck className="w-5 h-5 text-emerald-300 fill-emerald-300" />
                </div>
              </div>

              {/* Subtitle / Department Info */}
              <div className="mt-2 space-y-1 text-white/95 text-xs md:text-sm font-medium">
                <div className="flex items-center space-x-2">
                  <Building2 className="w-4 h-4 opacity-90" />
                  <span>{university}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <GraduationCap className="w-4 h-4 opacity-90" />
                  <span>{department}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Token Quota & Resource Progress Bar Card */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 font-bold text-slate-800">
            <Sparkles className="w-4 h-4 text-orange-500" />
            <span>AI Token Kullanım Durumu</span>
          </div>
          <span className="font-mono text-orange-600 font-bold">
            %{usagePercentage.toFixed(3)}
          </span>
        </div>
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
          <div
            className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-orange-600 rounded-full transition-all duration-500"
            style={{ width: `${Math.max(1, usagePercentage)}%` }}
          />
        </div>
        <div className="flex justify-between text-[11px] text-slate-500 font-mono pt-1">
          <span>Kullanılan: {formatNumber(usedTokens)}</span>
          <span>Kalan: {formatNumber(remainingTokens)}</span>
          <span>Kota: {formatNumber(quotaTokens)}</span>
        </div>
      </div>

      {/* Edit Profile & Password Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Information */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
            <div className="p-2 rounded-xl bg-orange-50 text-orange-600">
              <UserIcon className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-slate-900">Profil Bilgileri</h2>
          </div>

          {profileMsg && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-start space-x-2 ${
                profileMsg.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-red-50 border-red-200 text-red-600"
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

          <form onSubmit={handleUpdateProfile} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ad Soyad
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Adınız Soyadınız"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Üniversite
              </label>
              <input
                type="text"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                placeholder="Üniversite"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Bölüm / Sınıf
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Bölüm / Sınıf"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-xs transition-all shadow-md shadow-orange-500/20 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {savingProfile ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Profili Kaydet</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Security & Password Change */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
            <div className="p-2 rounded-xl bg-orange-50 text-orange-600">
              <KeyRound className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-slate-900">Güvenlik & Şifre Değiştir</h2>
          </div>

          {passwordMsg && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-start space-x-2 ${
                passwordMsg.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-red-50 border-red-200 text-red-600"
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

          <form onSubmit={handleChangePassword} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mevcut Şifreniz
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Yeni Şifre
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Yeni Şifre Tekrar
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={savingPassword}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-xs transition-all shadow-md shadow-orange-500/20 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {savingPassword ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Şifreyi Güncelle</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Logout button */}
      <div className="flex justify-end pt-2">
        <button
          onClick={logout}
          className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold text-xs border border-rose-200 transition-all flex items-center space-x-2"
        >
          <LogOut className="w-4 h-4" />
          <span>Oturumu Kapat</span>
        </button>
      </div>
    </div>
  );
}
