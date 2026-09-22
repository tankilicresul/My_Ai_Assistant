"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../../context/auth-context";
import { Lock, Sparkles, ArrowRight, LogIn, UserPlus } from "lucide-react";
import Link from "next/link";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, isAuthenticated, router, pathname]);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-[#090d16] text-white">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
          <Sparkles className="w-6 h-6 text-indigo-400 absolute animate-pulse" />
        </div>
        <p className="mt-4 text-sm text-slate-400 font-medium">Oturum bilgileri doğrulanıyor...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-[#090d16] p-6 text-white">
        <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900/90 border border-slate-800 text-center shadow-2xl backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl pointer-events-none rounded-full" />
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-5 border border-indigo-500/30 shadow-lg shadow-indigo-500/10">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-extrabold text-white mb-2">Giriş Yapılması Gerekiyor</h2>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            Bu modülü ve yapay zeka araçlarını kullanabilmek için lütfen e-posta adresinizle giriş yapın veya ücretsiz hesap oluşturun.
          </p>
          <div className="space-y-3">
            <Link
              href={`/login?redirect=${encodeURIComponent(pathname)}`}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:opacity-95 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center space-x-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Giriş Yap</span>
            </Link>
            <Link
              href={`/register?redirect=${encodeURIComponent(pathname)}`}
              className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm transition-all border border-slate-700/80 flex items-center justify-center space-x-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Ücretsiz Kayıt Ol</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
