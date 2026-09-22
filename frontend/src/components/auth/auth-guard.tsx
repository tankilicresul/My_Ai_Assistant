"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../../context/auth-context";
import { Lock, LogIn, UserPlus } from "lucide-react";
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
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-[#F8F9FB] text-slate-800">
        <div className="relative flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-4 border-orange-200 border-t-orange-500 animate-spin" />
        </div>
        <p className="mt-4 text-xs text-slate-500 font-medium">Oturum bilgileri doğrulanıyor...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-[#F8F9FB] p-6 text-slate-800">
        <div className="max-w-md w-full p-8 rounded-3xl bg-white border border-slate-200 text-center shadow-xl relative overflow-hidden">
          <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mx-auto mb-5 border border-orange-100 shadow-sm">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Giriş Yapılması Gerekiyor</h2>
          <p className="text-slate-500 text-xs mb-6 leading-relaxed">
            Bu modülü ve yapay zeka araçlarını kullanabilmek için lütfen e-posta adresinizle giriş yapın veya ücretsiz hesap oluşturun.
          </p>
          <div className="space-y-3">
            <Link
              href={`/login?redirect=${encodeURIComponent(pathname)}`}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-xs transition-all shadow-md shadow-orange-500/20 flex items-center justify-center space-x-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Giriş Yap</span>
            </Link>
            <Link
              href={`/register?redirect=${encodeURIComponent(pathname)}`}
              className="w-full py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-all border border-slate-200 flex items-center justify-center space-x-2"
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
