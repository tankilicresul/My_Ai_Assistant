"use client";

import React, { useState, useEffect } from "react";
import {
  Bot,
  Plus,
  Play,
  Star,
  Zap,
  CheckCircle,
  Search,
  Sparkles,
  Layers,
  Code2,
  Calculator,
  Briefcase,
  BookOpen
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
    <div className="p-8 max-w-7xl mx-auto space-y-8 text-slate-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center space-x-2">
            <Bot className="w-6 h-6 text-purple-400" />
            <span>Agent Marketplace & Studio</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Özelleştirilmiş otonom iş agentlarını keşfedin veya kendi kurumsal agentınızı tanımlayın.
          </p>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center space-x-2 shadow-lg shadow-purple-600/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Agent Oluştur</span>
        </button>
      </div>

      {/* Create Agent Modal */}
      {isCreating && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-700 space-y-4 shadow-2xl">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>Yeni Özel Agent Tanımla</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Agent Adı</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Örn: E-Ticaret Fiyatlandırma Uzmanı"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Kategori</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none"
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
              <label className="text-xs text-slate-400 block mb-1">Model Tabanı</label>
              <select
                value={newModel}
                onChange={(e) => setNewModel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none"
              >
                <option value="claude-3-7-sonnet-latest">Claude 3.7 Sonnet (Tavsiye)</option>
                <option value="gpt-4o">GPT-4o</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                <option value="deepseek-ai/DeepSeek-R1">DeepSeek R1</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Açıklama</label>
            <input
              type="text"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Örn: Rakip fiyatlarını analiz eder, marj optimizasyonu yapar..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Sistem Rolü ve Talimatları (System Prompt)</label>
            <textarea
              value={newPrompt}
              onChange={(e) => setNewPrompt(e.target.value)}
              placeholder="Sen kıdemli bir e-ticaret fiyatlama danışmanısın. Verilen ürün verileri ve pazar koşullarına göre en karlı fiyat stratejisini belirlersin..."
              rows={4}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none resize-none"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-2">Aktif Edilecek Yetenekler (Tools)</label>
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
                    "px-3 py-1.5 rounded-lg text-xs font-mono border transition-all",
                    toolsEnabled.includes(tool.id)
                      ? "bg-purple-600/20 border-purple-500 text-purple-300 font-semibold"
                      : "bg-slate-950 border-slate-800 text-slate-400"
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
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white text-xs"
            >
              İptal
            </button>
            <button
              onClick={handleCreateAgent}
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-md shadow-purple-600/20"
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
            className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-purple-500/40 transition-all flex flex-col justify-between space-y-4 group shadow-md"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden">
                  {agent.avatar_url ? (
                    <img src={agent.avatar_url} alt={agent.name} className="w-full h-full object-cover" />
                  ) : (
                    <Bot className="w-6 h-6 text-purple-400" />
                  )}
                </div>
                <div className="flex items-center space-x-1.5 text-xs font-mono text-amber-400">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span>{agent.rating || "5.0"}</span>
                  <span className="text-slate-500 text-[10px]">({agent.usage_count || 0})</span>
                </div>
              </div>

              <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors">
                {agent.name}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mt-1.5 line-clamp-3">
                {agent.description}
              </p>
            </div>

            <div className="space-y-3 pt-3 border-t border-slate-800/80">
              <div className="flex flex-wrap gap-1">
                {agent.tools_enabled?.map((tool: string, idx: number) => (
                  <span key={idx} className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-purple-300 border border-slate-700">
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
                className="w-full py-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600 border border-purple-500/40 text-purple-300 hover:text-white text-xs font-semibold flex items-center justify-center space-x-2 transition-all"
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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{activeExecAgent.name}</h3>
                  <p className="text-xs text-slate-400 font-mono">Model: {activeExecAgent.model}</p>
                </div>
              </div>
              <button
                onClick={() => setActiveExecAgent(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="text-xs text-slate-300 block mb-1 font-semibold">Görevinizi Girin</label>
              <textarea
                value={agentInput}
                onChange={(e) => setAgentInput(e.target.value)}
                placeholder={`Örn: Bu ürün için 3 farklı tedarikçiden teklif aldık: A: 120₺, B: 110₺ (%5 ıskonto), C: 115₺ (ücretsiz kargo). Hangisi avantajlı?`}
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none resize-none"
              />
            </div>

            <button
              onClick={handleExecuteAgent}
              disabled={executing || !agentInput.trim()}
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-md shadow-purple-600/20"
            >
              <Zap className="w-4 h-4" />
              <span>{executing ? "Agent Akıl Yürütüyor & Çalışıyor..." : "Görevi Yürüt"}</span>
            </button>

            {execResult && (
              <div className="space-y-3 pt-2">
                <div className="p-3 bg-slate-950 rounded-xl border border-purple-500/30 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                  <p className="font-semibold text-purple-400 mb-1">Agent Çıktısı:</p>
                  {execResult.output}
                </div>
                <div className="flex justify-between text-[10px] font-mono text-slate-500">
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
