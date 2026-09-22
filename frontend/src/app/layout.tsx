import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "../context/auth-context";

export const metadata: Metadata = {
  title: "TanCoreLab - All-in-One AI Platform",
  description: "Unified All-in-One AI Super-Platform: Chat, Code Studio, Media Generator, Deep Research, Vector Memory & Autonomous Agents",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icons/logo.png", type: "image/png" },
    ],
    shortcut: "/icon.svg",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="light">
      <body className="bg-[#F8F9FB] text-slate-800 min-h-screen antialiased flex flex-col selection:bg-orange-500 selection:text-white">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
