"use client";

import React, { useState, useEffect } from "react";
import {
  Bot,
  Plus,
  Play,
  Star,
  Zap,
  Search,
  Layers,
  Code2,
  Calculator,
  Briefcase,
  BookOpen,
  X
} from "lucide-react";
import { ApiClient } from "../../lib/api-client";
import { cn } from "../../lib/utils";

export function MarketplaceView() {
  const [agents, setAgents] = useState<any[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<any | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [activeExecAgent, setActiveExecAgent] = useState<any | null>(null);
  const [agentInput, setAgentInput] = useState("");
  const [execResult, setExecResult] = useState<any | null>(null);
  const [executing, setExecuting] = useState(false);

  // New Agent Form state
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCategory, setNewCategory] = useState("general");
  const [newPrompt, setNewPrompt] = useState("");
  const [newModel, setNewModel] = useState("claude-3-7-sonnet-latest");
  const [toolsEnabled, setToolsEnabled] = useState<string[]>(["web_search", "calculate_math"]);

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      const data = await ApiClient.getMarketplaceAgents();
      setAgents(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateAgent = async () => {
    if (!newName.trim() || !newPrompt.trim()) return;
    try {
      const res = await ApiClient.createCustomAgent({
        name: newName,
        description: newDesc,
        category: newCategory,
        system_prompt: newPrompt,
        model: newModel,
        tools_enabled: toolsEnabled,
        is_public: true,
      });
      setAgents([res, ...agents]);
      setIsCreating(false);
      setNewName("");
      setNewDesc("");
      setNewPrompt("");
    } catch (e: any) {
      alert("Hata: " + e.message);
    }
  };

  const handleExecuteAgent = async () => {
    if (!agentInput.trim() || !activeExecAgent || executing) return;
    setExecuting(true);
    setExecResult(null);

    try {
      const res = await ApiClient.executeAgent({
        agent_id: activeExecAgent.id,
        input_text: agentInput,
      });
      setExecResult(res);
    } catch (e: any) {
      alert("Çalıştırma hatası: " + e.message);
    } finally {
      setExecuting(false);
    }
  };

  const toggleTool = (tool: string) => {
    setToolsEnabled((prev) =>
      prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool]
    );
  };

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-8 text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600">
              <Bot className="w-5 h-5" />
            </div>
            <span>Agent Marketplace & Studio</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Özelleştirilmiş otonom iş ajanlarını keşfedin veya kendi kurumsal ajanınızı tanımlayın.
          </p>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-xs flex items-center space-x-2 shadow-md shadow-orange-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Agent Oluştur</span>
        </button>
      </div>

      {/* Create Agent Modal */}
      {isCreating && (
        <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200 space-y-4 shadow-xl">
          <h3 className="text-sm font-black text-slate-900 flex items-center space-x-2">
            <Bot className="w-4 h-4 text-orange-600" />
            <span>Yeni Özel Agent Tanımla</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Agent Adı</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Örn: E-Ticaret Fiyatlandırma Uzmanı"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Kategori</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-orange-500"
              >
                <option value="procurement">Satın Alma & Tedarik</option>
                <option value="accounting">Muhasebe & Finans</option>
                <option value="data_analysis">Veri Analitiği</option>
                <option value="coding">Yazılım Geliştirme</option>
                <option value="research">Akademik Araştırma</option>
                <option value="general">Genel Amaçlı</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Model Tabanı</label>
              <select
                value={newModel}
                onChange={(e) => setNewModel(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-orange-500"
              >
                <option value="claude-3-7-sonnet-latest">Claude 3.7 Sonnet (Tavsiye)</option>
                <option value="gpt-4o">GPT-4o</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                <option value="deepseek-ai/DeepSeek-R1">DeepSeek R1</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Açıklama</label>
            <input
              type="text"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Örn: Rakip fiyatlarını analiz eder, marj optimizasyonu yapar..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Sistem Rolü ve Talimatları (System Prompt)</label>
            <textarea
              value={newPrompt}
              onChange={(e) => setNewPrompt(e.target.value)}
              placeholder="Sen kıdemli bir e-ticaret fiyatlama danışmanısın. Verilen ürün verileri ve pazar koşullarına göre en karlı fiyat stratejisini belirlersin..."
              rows={4}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-800 focus:outline-none focus:border-orange-500 resize-none leading-relaxed"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">Aktif Edilecek Yetenekler (Tools)</label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: "web_search", label: "Web Araması" },
                { id: "calculate_math", label: "Matematik & Formül Motoru" },
                { id: "code_sandbox", label: "Kod & Terminal Çalıştırma" },
                { id: "file_reader", label: "Doküman & Excel Okuma" },
              ].map((tool) => (
                <button
                  type="button"
                  key={tool.id}
                  onClick={() => toggleTool(tool.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-mono border transition-all",
                    toolsEnabled.includes(tool.id)
                      ? "bg-orange-50 border-orange-400 text-orange-700 font-bold"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  )}
                >
                  {toolsEnabled.includes(tool.id) ? "✓ " : "+ "}
                  {tool.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
            >
              İptal
            </button>
            <button
              onClick={handleCreateAgent}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-xs shadow-md shadow-orange-500/20"
            >
              Agentı Yayınla
            </button>
          </div>
        </div>
      )}

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className="p-6 rounded-3xl bg-white border border-slate-200 hover:border-orange-400 hover:shadow-sm transition-all flex flex-col justify-between space-y-4 group"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center overflow-hidden text-orange-600">
                  {agent.avatar_url ? (
                    <img src={agent.avatar_url} alt={agent.name} className="w-full h-full object-cover" />
                  ) : (
                    <Bot className="w-6 h-6" />
                  )}
                </div>
                <div className="flex items-center space-x-1.5 text-xs font-mono text-amber-500 font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-500" />
                  <span>{agent.rating || "5.0"}</span>
                  <span className="text-slate-400 text-[10px]">({agent.usage_count || 0})</span>
                </div>
              </div>

              <h3 className="text-base font-black text-slate-900 group-hover:text-orange-600 transition-colors">
                {agent.name}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mt-1.5 break-words">
                {agent.description}
              </p>
            </div>

            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div className="flex flex-wrap gap-1">
                {agent.tools_enabled?.map((tool: string, idx: number) => (
                  <span key={idx} className="px-2.5 py-0.5 rounded-full bg-slate-100 text-[10px] font-mono text-slate-700 font-bold border border-slate-200">
                    {tool}
                  </span>
                ))}
              </div>

              <button
                onClick={() => {
                  setActiveExecAgent(agent);
                  setExecResult(null);
                  setAgentInput("");
                }}
                className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-xs font-bold flex items-center justify-center space-x-2 transition-all shadow-md shadow-orange-500/20"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Agent'ı Çalıştır</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Execution Drawer / Modal */}
      {activeExecAgent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 sm:p-7 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">{activeExecAgent.name}</h3>
                  <p className="text-xs text-slate-500 font-mono">Model: {activeExecAgent.model}</p>
                </div>
              </div>
              <button
                onClick={() => setActiveExecAgent(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-xs text-slate-700 block mb-1 font-bold">Görevinizi Girin</label>
              <textarea
                value={agentInput}
                onChange={(e) => setAgentInput(e.target.value)}
                placeholder={`Örn: Bu ürün için 3 farklı tedarikçiden teklif aldık: A: 120₺, B: 110₺ (%5 ıskonto), C: 115₺ (ücretsiz kargo). Hangisi avantajlı?`}
                rows={3}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-800 focus:outline-none focus:border-orange-500 resize-none leading-relaxed"
              />
            </div>

            <button
              onClick={handleExecuteAgent}
              disabled={executing || !agentInput.trim()}
              className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 disabled:opacity-40 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-md shadow-orange-500/20"
            >
              <Zap className="w-4 h-4" />
              <span>{executing ? "Agent Akıl Yürütüyor & Çalışıyor..." : "Görevi Yürüt"}</span>
            </button>

            {execResult && (
              <div className="space-y-3 pt-2">
                <div className="p-4 bg-orange-50/50 rounded-2xl border border-orange-200 text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                  <p className="font-bold text-orange-600 mb-1">Agent Çıktısı:</p>
                  {execResult.output}
                </div>
                <div className="flex justify-between text-[10px] font-mono text-slate-400 font-bold">
                  <span>Kullanılan Token: {execResult.tokens_used}</span>
                  <span>Maliyet: ${execResult.estimated_cost_usd}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
