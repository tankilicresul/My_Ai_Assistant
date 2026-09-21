"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  FileSpreadsheet,
  UploadCloud,
  FileText,
  FileJson,
  FileCode,
  Sparkles,
  BarChart2,
  HelpCircle,
  Send,
  CheckCircle2,
  Table,
  Plus,
  Download,
  Trash2,
  Wand2,
  FileDown,
  Layers,
  Zap
} from "lucide-react";
import { ApiClient } from "../../lib/api-client";
import { formatBytes, cn } from "../../lib/utils";


export function FilesView() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [uploading, setUploading] = useState(false);
  const [question, setQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");
  const [answering, setAnswering] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Document Generator state
  const [isGenerating, setIsGenerating] = useState(false);
  const [genPrompt, setGenPrompt] = useState("");
  const [genFileType, setGenFileType] = useState("pdf");
  const [genTitle, setGenTitle] = useState("");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const data = await ApiClient.getDocuments();
      setDocuments(data);
      if (data.length > 0 && !selectedDoc) {
        setSelectedDoc(data[0]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const doc = await ApiClient.uploadDocument(file);
      setDocuments([doc, ...documents]);
      setSelectedDoc(doc);
    } catch (err: any) {
      alert("Yükleme hatası: " + err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleGenerateDoc = async () => {
    if (!genPrompt.trim() || generating) return;
    setGenerating(true);

    try {
      const newDoc = await ApiClient.generateDocument({
        prompt: genPrompt,
        file_type: genFileType,
        title: genTitle || undefined,
        model: "gpt-4o"
      });
      setDocuments([newDoc, ...documents]);
      setSelectedDoc(newDoc);
      setIsGenerating(false);
      setGenPrompt("");
      setGenTitle("");
    } catch (err: any) {
      alert("Doküman üretme hatası: " + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteDoc = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await ApiClient.deleteDocument(id);
      const remaining = documents.filter((d) => d.id !== id);
      setDocuments(remaining);
      if (selectedDoc?.id === id) {
        setSelectedDoc(remaining.length > 0 ? remaining[0] : null);
        setAiAnswer("");
      }
    } catch (err: any) {
      alert("Silme hatası: " + err.message);
    }
  };

  const handleQueryDocument = async () => {
    if (!question.trim() || !selectedDoc || answering) return;
    setAnswering(true);
    setAiAnswer("");

    try {
      const res = await ApiClient.queryDocument({
        document_id: selectedDoc.id,
        question: question.trim(),
      });
      setAiAnswer(res.answer);
    } catch (err: any) {
      setAiAnswer("Hata: " + err.message);
    } finally {
      setAnswering(false);
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case "xlsx":
      case "xls":
      case "csv":
        return <FileSpreadsheet className="w-5 h-5 text-emerald-400" />;
      case "pdf":
        return <FileText className="w-5 h-5 text-rose-400" />;
      case "docx":
      case "doc":
        return <FileText className="w-5 h-5 text-blue-400" />;
      case "json":
        return <FileJson className="w-5 h-5 text-amber-400" />;
      default:
        return <FileCode className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#090d16] text-slate-200">
      {/* Sidebar: Documents list, Uploader & AI Generator CTA */}
      <div className="w-80 border-r border-slate-800/80 bg-slate-950/60 flex flex-col justify-between shrink-0 p-4 space-y-4">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white flex items-center space-x-2">
              <FileSpreadsheet className="w-4 h-4 text-amber-400" />
              <span>Dosyalarım ({documents.length})</span>
            </h2>
          </div>

          {/* Action Buttons: Generate & Upload */}
          <div className="space-y-2 mb-4">
            <button
              onClick={() => setIsGenerating(true)}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-semibold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-orange-500/20 transition-all"
            >
              <Wand2 className="w-4 h-4" />
              <span>AI ile Doküman Oluştur</span>
            </button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept=".pdf,.docx,.doc,.xlsx,.xls,.csv,.json,.txt"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full p-2.5 rounded-xl border border-slate-700/80 hover:border-indigo-500 bg-slate-900/60 hover:bg-slate-900 flex items-center justify-center space-x-2 text-xs font-semibold text-slate-300 transition-all"
            >
              <UploadCloud className="w-4 h-4 text-indigo-400" />
              <span>{uploading ? "Ayrıştırılıyor..." : "Dosya Yükle (PDF/Excel)"}</span>
            </button>
          </div>

          {/* Doc list */}
          <div className="space-y-1.5 overflow-y-auto max-h-[calc(100vh-270px)]">
            {documents.map((doc) => (
              <div
                key={doc.id}
                onClick={() => {
                  setSelectedDoc(doc);
                  setAiAnswer("");
                }}
                className={cn(
                  "p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between group",
                  selectedDoc?.id === doc.id
                    ? "bg-amber-500/15 border-amber-500/50 text-white font-medium shadow-md shadow-amber-500/10"
                    : "bg-slate-900/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                )}
              >
                <div className="flex items-center space-x-2.5 overflow-hidden flex-1">
                  {getFileIcon(doc.file_type)}
                  <div className="overflow-hidden flex-1">
                    <p className="truncate font-semibold text-slate-200">{doc.filename}</p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      {formatBytes(doc.file_size_bytes)} • {doc.file_type.toUpperCase()} {doc.status === 'generated' ? '• AI' : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <a
                    href={ApiClient.getDownloadUrl(doc.id)}
                    download
                    onClick={(e) => e.stopPropagation()}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                    title="İndir"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={(e) => handleDeleteDoc(doc.id, e)}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-red-400"
                    title="Sil"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
            {documents.length === 0 && (
              <p className="text-xs text-slate-500 italic text-center py-6">
                Henüz doküman yüklenmedi veya oluşturulmadı.
              </p>
            )}
          </div>
        </div>

        <div className="p-3 border-t border-slate-800/80 bg-slate-900/40 rounded-xl text-[11px] text-slate-400">
          <p className="font-semibold text-slate-300 mb-1">Analiz & Üretim Motoru</p>
          <p className="text-[10px]">
            PDF, Word, Excel, CSV ve JSON dosyalarını analiz edin veya AI ile sıfırdan oluşturup indirin.
          </p>
        </div>
      </div>

      {/* Main Document Inspector & Generator Arena */}
      <div className="flex-1 flex flex-col h-screen min-w-0 p-8 overflow-y-auto space-y-6">
        {/* Document Generator Drawer / Modal */}
        {isGenerating && (
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl space-y-4 max-w-4xl mx-auto w-full">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <span>Yapay Zeka ile Dosya Oluşturucu (PDF, Word, Excel, CSV, JSON)</span>
              </h3>
              <button onClick={() => setIsGenerating(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-300 block mb-1.5 font-semibold">Oluşturulacak Dosya Türü</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {[
                    { id: "pdf", label: "PDF" },
                    { id: "docx", label: "Word" },
                    { id: "xlsx", label: "Excel" },
                    { id: "csv", label: "CSV" },
                    { id: "json", label: "JSON" }
                  ].map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setGenFileType(type.id)}
                      className={cn(
                        "py-2 rounded-xl border text-xs font-bold font-mono transition-all",
                        genFileType === type.id
                          ? "bg-amber-500/20 border-amber-500 text-amber-300 shadow-md"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                      )}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1.5 font-semibold">Doküman Başlığı (Opsiyonel)</label>
                <input
                  type="text"
                  value={genTitle}
                  onChange={(e) => setGenTitle(e.target.value)}
                  placeholder="Örn: 2026 Q1 Finansal Bütçe Planı"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs text-slate-300 font-semibold">İçerik İsteminiz (Prompt)</label>
                <div className="flex space-x-2 text-[10px] text-amber-400">
                  <button
                    type="button"
                    onClick={() => {
                      setGenFileType("xlsx");
                      setGenTitle("Aylık Şirket Gelir Gider Bütçesi");
                      setGenPrompt("12 aylık departman bazlı bütçe, ciro, pazarlama, Ar-Ge ve net kar satırlarını içeren profesyonel bir Excel tablosu oluştur.");
                    }}
                    className="hover:underline"
                  >
                    + Örnek Excel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setGenFileType("pdf");
                      setGenTitle("Stratejik İş Planı");
                      setGenPrompt("Şirket genel bakışı, pazar büyüklüğü, gelir projeksiyonları ve risk matrisi içeren profesyonel bir iş planı raporu oluştur.");
                    }}
                    className="hover:underline"
                  >
                    + Örnek PDF
                  </button>
                </div>
              </div>
              <textarea
                value={genPrompt}
                onChange={(e) => setGenPrompt(e.target.value)}
                placeholder="Örn: Satış ekibi için 20 adet örnek müşteri verisi, satın alma geçmişi, potansiyel lead skoru ve şehir sütunları içeren bir Excel tablosu oluştur..."
                rows={4}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500 resize-none"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setIsGenerating(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white text-xs"
              >
                İptal
              </button>
              <button
                onClick={handleGenerateDoc}
                disabled={generating || !genPrompt.trim()}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 disabled:opacity-40 text-white font-bold text-xs flex items-center space-x-2 shadow-lg shadow-orange-500/20"
              >
                <Zap className="w-4 h-4" />
                <span>{generating ? "Doküman Oluşturuluyor & Formatlanıyor..." : "Dosyayı Oluştur"}</span>
              </button>
            </div>
          </div>
        )}

        {selectedDoc ? (
          <div className="max-w-4xl mx-auto space-y-6 w-full">
            {/* Header & Meta & Download button */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                  {getFileIcon(selectedDoc.file_type)}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">{selectedDoc.filename}</h1>
                  <p className="text-xs text-slate-400 font-mono">
                    {formatBytes(selectedDoc.file_size_bytes)} • {new Date(selectedDoc.created_at).toLocaleString("tr-TR")} • Durum: {selectedDoc.status.toUpperCase()}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <a
                  href={ApiClient.getDownloadUrl(selectedDoc.id)}
                  download
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-md shadow-indigo-600/20 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Dosyayı İndir ({selectedDoc.file_type.toUpperCase()})</span>
                </a>
              </div>
            </div>

            {/* AI Summary Card */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="flex items-center space-x-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>Yapay Zeka Doküman Özeti & Analiz Bulguları</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                {selectedDoc.summary || "Doküman özeti bulunamadı."}
              </p>
            </div>

            {/* Tabular data Preview if XLSX/CSV */}
            {selectedDoc.analysis_results?.sheets && (
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  <Table className="w-4 h-4" />
                  <span>Tablo ve Sütun Yapısı (Excel / CSV)</span>
                </div>
                {Object.entries(selectedDoc.analysis_results.sheets).map(([sheetName, meta]: [string, any]) => (
                  <div key={sheetName} className="space-y-3">
                    <p className="text-xs font-semibold text-white">
                      Sayfa: {sheetName} ({meta.rows} satır, {meta.columns?.length} sütun)
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {meta.columns?.map((col: string, idx: number) => (
                        <span key={idx} className="px-2 py-0.5 rounded bg-slate-800 text-[11px] font-mono text-slate-300 border border-slate-700">
                          {col}
                        </span>
                      ))}
                    </div>

                    {/* Sample Records Table */}
                    {meta.sample && meta.sample.length > 0 && (
                      <div className="overflow-x-auto rounded-xl border border-slate-800 mt-3">
                        <table className="w-full text-left text-[11px] font-mono">
                          <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                            <tr>
                              {meta.columns?.map((col: string, i: number) => (
                                <th key={i} className="p-2 whitespace-nowrap">{col}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                            {meta.sample.slice(0, 5).map((row: any, rIdx: number) => (
                              <tr key={rIdx} className="hover:bg-slate-800/40">
                                {meta.columns?.map((col: string, cIdx: number) => (
                                  <td key={cIdx} className="p-2 text-slate-300 whitespace-nowrap">
                                    {String(row[col] ?? "")}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Ask AI Questions about document */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <div className="flex items-center space-x-2 text-xs font-bold text-cyan-400 uppercase tracking-wider">
                <HelpCircle className="w-4 h-4" />
                <span>Dokümana Soru Sorun</span>
              </div>

              <div className="flex space-x-2">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleQueryDocument()}
                  placeholder="Örn: Toplam ciro nedir? En yüksek maliyet kalemi hangisidir?..."
                  className="flex-1 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
                />
                <button
                  onClick={handleQueryDocument}
                  disabled={answering || !question.trim()}
                  className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-semibold text-xs flex items-center space-x-1.5 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{answering ? "Analiz Ediliyor..." : "Sor"}</span>
                </button>
              </div>

              {aiAnswer && (
                <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/30 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                  <p className="font-semibold text-cyan-400 mb-1">Analiz Sonucu:</p>
                  {aiAnswer}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
            <FileSpreadsheet className="w-12 h-12 text-slate-600 mb-3" />
            <p className="text-base font-bold text-slate-300">Dosya Yükleyin veya Oluşturun</p>
            <p className="text-xs text-slate-500 mt-1">
              Soldaki paneli kullanarak PDF, Excel, Word, CSV veya JSON yükleyebilir ya da "AI ile Doküman Oluştur" butonuna basarak sıfırdan dosya üretebilirsiniz.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
