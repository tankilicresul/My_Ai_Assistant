import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NexusAI - Enterprise AI Super-Platform",
  description: "Unified AI Platform: ChatGPT + Claude Code + Gemini Deep Research + Higgsfield Studio + Vector Memory + Agent Marketplace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="dark">
      <body className="bg-[#090d16] text-slate-100 min-h-screen antialiased flex flex-col">
        {children}
      </body>
    </html>
  );
}
