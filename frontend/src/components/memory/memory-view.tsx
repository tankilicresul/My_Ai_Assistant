"use client";

import React, { useState, useEffect } from "react";
import {
  Database,
  Search,
  Plus,
  Trash2,
  Brain,
  Star,
  CheckCircle2,
  Sparkles
} from "lucide-react";
import { ApiClient } from "../../lib/api-client";
import { cn } from "../../lib/utils";

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
    <div className="p-6 sm:p-8 max-w-6xl mx-auto space-y-8 text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600">
              <Database className="w-5 h-5" />
            </div>
            <span>Kişisel Vektör Hafıza Motoru</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Qdrant Vector DB destekli uzun vadeli hafıza. Tüm AI sohbetleriniz ve ajanlarınız bu hafızaya anlık erişir.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-xs flex items-center space-x-2 shadow-md shadow-orange-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Hafıza Kaydı</span>
        </button>
      </div>

      {/* Add Memory Drawer / Modal */}
      {isAdding && (
        <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200 space-y-4 shadow-xl">
          <h3 className="text-sm font-black text-slate-900 flex items-center space-x-2">
            <Brain className="w-4 h-4 text-orange-600" />
            <span>Yeni Vektörel Hafıza Ekle</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Kategori</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-orange-500"
              >
                <option value="preference">Kullanıcı Tercihi</option>
                <option value="project">Aktif Proje / Teknoloji</option>
                <option value="career">Kariyer & İş Deneyimi</option>
                <option value="education">Eğitim & Yetkinlik</option>
                <option value="conversation">Özel Not</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Anahtar / Başlık (Opsiyonel)</label>
              <input
                type="text"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="Örn: Frontend Tercihi, Şirket Pozisyonu..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Önem Derecesi (1.0 - 5.0)</label>
              <input
                type="number"
                step="0.5"
                min="1.0"
                max="5.0"
                value={importance}
                onChange={(e) => setImportance(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-2.5 text-xs text-slate-800 font-mono font-bold focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Hafıza İçeriği / Açıklama</label>
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Örn: Next.js 14 App Router ve TailwindCSS kullanmayı tercih ediyorum. Backend olarak FastAPI ve PostgreSQL mimarilerine odaklanıyorum."
              rows={3}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-800 focus:outline-none focus:border-orange-500 resize-none leading-relaxed"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
            >
              İptal
            </button>
            <button
              onClick={handleAddMemory}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-xs shadow-md shadow-orange-500/20"
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
            className="w-full bg-white border border-slate-200 focus:border-orange-500 rounded-2xl pl-11 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none shadow-xs"
          />
        </div>
        <button
          onClick={handleSearch}
          className="px-5 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200 shadow-xs"
        >
          {loading ? "Aranıyor..." : "Semantik Ara"}
        </button>
      </div>

      {/* Categories Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-3 overflow-x-auto">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
              selectedCategory === cat.id
                ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50"
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
            className="p-5 rounded-3xl bg-white border border-slate-200 hover:border-orange-400 hover:shadow-sm transition-all flex flex-col justify-between space-y-3 group"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200 font-bold uppercase">
                  {m.category}
                </span>
                <div className="flex items-center space-x-2">
                  {m.similarity_score && (
                    <span className="text-[10px] font-mono text-emerald-700 font-bold">
                      Benzerlik: %{(m.similarity_score * 100).toFixed(0)}
                    </span>
                  )}
                  <button
                    onClick={() => handleDelete(m.id)}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 transition-opacity p-1 rounded-lg"
                    title="Sil"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {m.key && <h4 className="text-xs font-black text-slate-900 mb-1">{m.key}</h4>}
              <p className="text-xs text-slate-600 leading-relaxed">{m.content}</p>
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-3 border-t border-slate-100">
              <span className="font-bold text-amber-600">Önem: {m.importance_score}★</span>
              <span>{new Date(m.created_at).toLocaleDateString("tr-TR")}</span>
            </div>
          </div>
        ))}
      </div>

      {filteredMemories.length === 0 && (
        <div className="p-12 text-center text-slate-400 italic text-xs bg-white rounded-3xl border border-slate-200">
          Kayıtlı hafıza girdisi bulunamadı.
        </div>
      )}
    </div>
  );
}
