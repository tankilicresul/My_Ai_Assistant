"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  FileSpreadsheet,
  UploadCloud,
  FileText,
  FileJson,
  FileCode,
  HelpCircle,
  Send,
  Table,
  Download,
  Trash2,
  Wand2,
  Zap,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles
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

  // Resizable sidebar state
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const [isResizing, setIsResizing] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const resizeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = Math.max(200, Math.min(480, e.clientX));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

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
        return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
      case "pdf":
        return <FileText className="w-5 h-5 text-rose-500" />;
      case "docx":
      case "doc":
        return <FileText className="w-5 h-5 text-blue-500" />;
      case "json":
        return <FileJson className="w-5 h-5 text-amber-500" />;
      default:
        return <FileCode className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8F9FB] text-slate-800">
      {/* Sidebar: Documents list, Uploader & AI Generator CTA */}
      {!sidebarCollapsed && (
        <div
          style={{ width: `${sidebarWidth}px` }}
          className="border-r border-slate-200 bg-white flex flex-col justify-between shrink-0 p-4 space-y-4 shadow-xs relative select-none"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <h2 className="text-xs font-black text-slate-900">Dosyalarım ({documents.length})</h2>
              </div>
              <button
                onClick={() => setSidebarCollapsed(true)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                title="Paneli Daralt"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>

            {/* Action Buttons: Generate & Upload */}
            <div className="space-y-2 mb-4">
              <button
                onClick={() => setIsGenerating(true)}
                className="w-full py-2.5 px-3 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-md shadow-orange-500/20 transition-all"
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
                className="w-full p-2.5 rounded-2xl border border-slate-200 hover:bg-slate-50 bg-white flex items-center justify-center space-x-2 text-xs font-bold text-slate-700 transition-all shadow-xs"
              >
                <UploadCloud className="w-4 h-4 text-orange-600" />
                <span>{uploading ? "Ayrıştırılıyor..." : "Dosya Yükle (PDF/Excel)"}</span>
              </button>
            </div>

            {/* Doc list */}
            <div className="space-y-1.5 overflow-y-auto max-h-[calc(100vh-270px)] pr-1">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => {
                    setSelectedDoc(doc);
                    setAiAnswer("");
                  }}
                  className={cn(
                    "p-2.5 rounded-2xl border text-xs cursor-pointer transition-all flex items-center justify-between group",
                    selectedDoc?.id === doc.id
                      ? "bg-orange-50 border-orange-300 text-slate-900 font-medium shadow-xs"
                      : "bg-white border-slate-200/80 text-slate-600 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-50"
                  )}
                >
                  <div className="flex items-center space-x-2.5 overflow-hidden flex-1">
                    {getFileIcon(doc.file_type)}
                    <div className="overflow-hidden flex-1">
                      <p className="break-all font-bold text-slate-900 leading-tight">{doc.filename}</p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {formatBytes(doc.file_size_bytes)} • {doc.file_type.toUpperCase()} {doc.status === 'generated' ? '• AI' : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a
                      href={ApiClient.getDownloadUrl(doc.id)}
                      download
                      onClick={(e) => e.stopPropagation()}
                      className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900"
                      title="İndir"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={(e) => handleDeleteDoc(doc.id, e)}
                      className="p-1 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600"
                      title="Sil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              {documents.length === 0 && (
                <p className="text-xs text-slate-400 italic text-center py-8">
                  Henüz doküman yüklenmedi veya oluşturulmadı.
                </p>
              )}
            </div>
          </div>

          <div className="p-3 border border-slate-200 bg-slate-50 rounded-2xl text-[11px] text-slate-600">
            <p className="font-bold text-slate-900 mb-1">Analiz & Üretim Motoru</p>
            <p className="text-[10px] leading-relaxed text-slate-500">
              PDF, Word, Excel, CSV ve JSON dosyalarını analiz edin veya AI ile sıfırdan oluşturup indirin.
            </p>
          </div>
        </div>
      )}

      {/* Resizer Handle */}
      {!sidebarCollapsed && (
        <div
          ref={resizeRef}
          onMouseDown={() => setIsResizing(true)}
          className={cn(
            "w-1.5 hover:w-2 bg-transparent hover:bg-orange-400 cursor-col-resize transition-all shrink-0 z-20 flex items-center justify-center group",
            isResizing && "bg-orange-500 w-2"
          )}
        >
          <div className="h-8 w-0.5 bg-slate-300 group-hover:bg-white rounded-full" />
        </div>
      )}

      {/* Main Document Inspector & Generator Arena */}
      <div className="flex-1 flex flex-col h-screen min-w-0 p-6 sm:p-8 overflow-y-auto space-y-6">
        {sidebarCollapsed && (
          <div>
            <button
              onClick={() => setSidebarCollapsed(false)}
              className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 shadow-xs inline-flex items-center space-x-2 text-xs font-bold"
            >
              <PanelLeftOpen className="w-4 h-4" />
              <span>Dosyaları Göster</span>
            </button>
          </div>
        )}

        {/* Document Generator Drawer / Modal */}
        {isGenerating && (
          <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200 shadow-xl space-y-4 max-w-4xl mx-auto w-full">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600">
                  <Wand2 className="w-4 h-4" />
                </div>
                <span>Yapay Zeka ile Dosya Oluşturucu (PDF, Word, Excel, CSV, JSON)</span>
              </h3>
              <button onClick={() => setIsGenerating(false)} className="text-slate-400 hover:text-slate-700 font-bold">✕</button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-700 block mb-1.5 font-bold">Oluşturulacak Dosya Türü</label>
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
                          ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white border-orange-500 shadow-xs"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      )}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-700 block mb-1.5 font-bold">Doküman Başlığı (Opsiyonel)</label>
                <input
                  type="text"
                  value={genTitle}
                  onChange={(e) => setGenTitle(e.target.value)}
                  placeholder="Örn: 2026 Q1 Finansal Bütçe Planı"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs text-slate-700 font-bold">İçerik İsteminiz (Prompt)</label>
                <div className="flex space-x-2 text-[10px] text-orange-600 font-bold">
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
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-800 focus:outline-none focus:border-orange-500 resize-none leading-relaxed"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setIsGenerating(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
              >
                İptal
              </button>
              <button
                onClick={handleGenerateDoc}
                disabled={generating || !genPrompt.trim()}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 disabled:opacity-40 text-white font-bold text-xs flex items-center space-x-2 shadow-md shadow-orange-500/20"
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
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-center">
                  {getFileIcon(selectedDoc.file_type)}
                </div>
                <div>
                  <h1 className="text-xl font-black text-slate-900">{selectedDoc.filename}</h1>
                  <p className="text-xs text-slate-500 font-mono">
                    {formatBytes(selectedDoc.file_size_bytes)} • {new Date(selectedDoc.created_at).toLocaleString("tr-TR")} • Durum: {selectedDoc.status.toUpperCase()}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <a
                  href={ApiClient.getDownloadUrl(selectedDoc.id)}
                  download
                  className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-orange-500/20 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Dosyayı İndir ({selectedDoc.file_type.toUpperCase()})</span>
                </a>
              </div>
            </div>

            {/* AI Summary Card */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center space-x-2 text-xs font-bold text-orange-600 uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>Yapay Zeka Doküman Özeti & Analiz Bulguları</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {selectedDoc.summary || "Doküman özeti bulunamadı."}
              </p>
            </div>

            {/* Tabular data Preview if XLSX/CSV */}
            {selectedDoc.analysis_results?.sheets && (
              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center space-x-2 text-xs font-bold text-emerald-700 uppercase tracking-wider">
                  <Table className="w-4 h-4" />
                  <span>Tablo ve Sütun Yapısı (Excel / CSV)</span>
                </div>
                {Object.entries(selectedDoc.analysis_results.sheets).map(([sheetName, meta]: [string, any]) => (
                  <div key={sheetName} className="space-y-3">
                    <p className="text-xs font-bold text-slate-900">
                      Sayfa: {sheetName} ({meta.rows} satır, {meta.columns?.length} sütun)
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {meta.columns?.map((col: string, idx: number) => (
                        <span key={idx} className="px-2.5 py-0.5 rounded-full bg-slate-100 text-[11px] font-mono text-slate-700 font-bold border border-slate-200">
                          {col}
                        </span>
                      ))}
                    </div>

                    {/* Sample Records Table */}
                    {meta.sample && meta.sample.length > 0 && (
                      <div className="overflow-x-auto rounded-2xl border border-slate-200 mt-3">
                        <table className="w-full text-left text-[11px] font-mono">
                          <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold">
                            <tr>
                              {meta.columns?.map((col: string, i: number) => (
                                <th key={i} className="p-2.5 whitespace-nowrap">{col}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {meta.sample.slice(0, 5).map((row: any, rIdx: number) => (
                              <tr key={rIdx} className="hover:bg-slate-50">
                                {meta.columns?.map((col: string, cIdx: number) => (
                                  <td key={cIdx} className="p-2.5 text-slate-800 whitespace-nowrap">
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
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center space-x-2 text-xs font-bold text-orange-600 uppercase tracking-wider">
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
                  className="flex-1 bg-slate-50 border border-slate-200 focus:border-orange-500 focus:bg-white rounded-2xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition-all"
                />
                <button
                  onClick={handleQueryDocument}
                  disabled={answering || !question.trim()}
                  className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 disabled:opacity-40 text-white font-bold text-xs flex items-center space-x-1.5 shadow-md shadow-orange-500/20 transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{answering ? "Analiz Ediliyor..." : "Sor"}</span>
                </button>
              </div>

              {aiAnswer && (
                <div className="p-5 rounded-2xl bg-orange-50/50 border border-orange-200 text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                  <p className="font-bold text-orange-600 mb-1">Analiz Sonucu:</p>
                  {aiAnswer}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto py-16">
            <div className="w-16 h-16 rounded-3xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 mb-4">
              <FileSpreadsheet className="w-8 h-8" />
            </div>
            <p className="text-base font-black text-slate-900">Dosya Yükleyin veya Oluşturun</p>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Soldaki paneli kullanarak PDF, Excel, Word, CSV veya JSON yükleyebilir ya da "AI ile Doküman Oluştur" butonuna basarak sıfırdan dosya üretebilirsiniz.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
