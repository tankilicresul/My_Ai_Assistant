"use client";

import React, { useState, useEffect } from "react";
import {
  Database,
  Search,
  Plus,
  Trash2,
  Brain,
  Star,
  Tag,
  Layers,
  Sparkles,
  CheckCircle2
} from "lucide-react";
import { ApiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";

export function MemoryView() {
  const [memories, setMemories] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [newContent, setNewContent] = useState("");
  const [newKey, setNewKey] = useState("");
  const [newCategory, setNewCategory] = useState("preference");
  const [importance, setImportance] = useState(1.0);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);

  const categories = [
    { id: "all", label: "Tümü" },
    { id: "preference", label: "Tercihler" },
    { id: "project", label: "Projeler" },
    { id: "career", label: "İş Deneyimi" },
    { id: "education", label: "Eğitim / Kurs" },
    { id: "conversation", label: "Kişisel Notlar" },
  ];

  useEffect(() => {
    loadMemories();
  }, []);

  const loadMemories = async () => {
    try {
      const data = await ApiClient.getMemories();
      setMemories(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadMemories();
      return;
    }
    setLoading(true);
    try {
      const results = await ApiClient.searchMemories({
        query: searchQuery,
        category: selectedCategory === "all" ? undefined : selectedCategory,
      });
      setMemories(results);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMemory = async () => {
    if (!newContent.trim()) return;
    try {
      const res = await ApiClient.addMemory({
        content: newContent,
        category: newCategory,
        key: newKey || undefined,
        importance_score: importance,
      });
      setMemories([res, ...memories]);
      setNewContent("");
      setNewKey("");
      setIsAdding(false);
    } catch (e: any) {
      alert("Hata: " + e.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await ApiClient.deleteMemory(id);
      setMemories(memories.filter((m) => m.id !== id));
    } catch (e: any) {
      alert("Hata: " + e.message);
    }
  };

  const filteredMemories = selectedCategory === "all"
    ? memories
    : memories.filter((m) => m.category === selectedCategory);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 text-slate-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center space-x-2">
            <Database className="w-6 h-6 text-emerald-400" />
            <span>Kişisel Vektör Hafıza Motoru</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Qdrant Vector DB destekli uzun vadeli hafıza. Tüm AI sohbetleriniz ve agentlarınız bu hafızaya anlık erişir.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center space-x-2 shadow-lg shadow-emerald-600/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Hafıza Kaydı</span>
        </button>
      </div>

      {/* Add Memory Drawer / Modal */}
      {isAdding && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-700 space-y-4 shadow-xl">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Brain className="w-4 h-4 text-emerald-400" />
            <span>Yeni Vektörel Hafıza Ekle</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Kategori</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none"
              >
                <option value="preference">Kullanıcı Tercihi</option>
                <option value="project">Aktif Proje / Teknoloji</option>
                <option value="career">Kariyer & İş Deneyimi</option>
                <option value="education">Eğitim & Yetkinlik</option>
                <option value="conversation">Özel Not</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Anahtar / Başlık (Opsiyonel)</label>
              <input
                type="text"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="Örn: Frontend Tercihi, Şirket Pozisyonu..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Önem Derecesi (1.0 - 5.0)</label>
              <input
                type="number"
                step="0.5"
                min="1.0"
                max="5.0"
                value={importance}
                onChange={(e) => setImportance(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Hafıza İçeriği / Açıklama</label>
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Örn: Next.js 14 App Router ve TailwindCSS kullanmayı tercih ediyorum. Backend olarak FastAPI ve PostgreSQL mimarilerine odaklanıyorum."
              rows={3}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none resize-none"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white text-xs"
            >
              İptal
            </button>
            <button
              onClick={handleAddMemory}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs"
            >
              Vektör Veritabanına Kaydet
            </button>
          </div>
        </div>
      )}

      {/* Semantic Search & Category Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Qdrant semantik araması yapın (Örn: 'Frontend tercihlerim neler?')..."
            className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl pl-11 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
          />
        </div>
        <button
          onClick={handleSearch}
          className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
        >
          {loading ? "Aranıyor..." : "Semantik Ara"}
        </button>
      </div>

      {/* Categories Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 overflow-x-auto">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap",
              selectedCategory === cat.id
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Memories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMemories.map((m) => (
          <div
            key={m.id}
            className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-emerald-500/30 transition-all flex flex-col justify-between space-y-3 group"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                  {m.category}
                </span>
                <div className="flex items-center space-x-2">
                  {m.similarity_score && (
                    <span className="text-[10px] font-mono text-cyan-400">
                      Benzerlik: %{(m.similarity_score * 100).toFixed(0)}
                    </span>
                  )}
                  <button
                    onClick={() => handleDelete(m.id)}
                    className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {m.key && <h4 className="text-xs font-bold text-white mb-1">{m.key}</h4>}
              <p className="text-xs text-slate-300 leading-relaxed">{m.content}</p>
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-2 border-t border-slate-800/60">
              <span>Önem: {m.importance_score}★</span>
              <span>{new Date(m.created_at).toLocaleDateString("tr-TR")}</span>
            </div>
          </div>
        ))}
      </div>

      {filteredMemories.length === 0 && (
        <div className="p-12 text-center text-slate-500 italic text-xs bg-slate-900/30 rounded-2xl border border-slate-800">
          Kayıtlı hafıza girdisi bulunamadı.
        </div>
      )}
    </div>
  );
}
