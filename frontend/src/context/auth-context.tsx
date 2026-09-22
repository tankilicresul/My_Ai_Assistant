"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { ApiClient } from "../lib/api-client";

export interface User {
  id: string;
  email: string;
  full_name?: string | null;
  role: string;
  quota_tokens: number;
  used_tokens: number;
  is_active: boolean;
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName?: string) => Promise<void>;
  logout: () => void;
  updateProfile: (fullName: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const storedToken = localStorage.getItem("nexus_auth_token");
      if (storedToken) {
        setToken(storedToken);
        const userData = await ApiClient.getMe();
        setUser(userData);
      } else {
        setUser(null);
        setToken(null);
      }
    } catch (err) {
      console.error("Failed to load user session:", err);
      ApiClient.removeToken();
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await ApiClient.login({ email, password });
      if (res && res.access_token) {
        ApiClient.setToken(res.access_token);
        setToken(res.access_token);
        setUser(res.user);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, fullName?: string) => {
    setIsLoading(true);
    try {
      const res = await ApiClient.register({
        email,
        password,
        full_name: fullName || undefined,
      });
      if (res && res.access_token) {
        ApiClient.setToken(res.access_token);
        setToken(res.access_token);
        setUser(res.user);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    ApiClient.removeToken();
    setUser(null);
    setToken(null);
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  };

  const updateProfile = async (fullName: string) => {
    const updatedUser = await ApiClient.updateProfile({ full_name: fullName });
    setUser(updatedUser);
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    await ApiClient.changePassword({
      current_password: currentPassword,
      new_password: newPassword,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        changePassword,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
