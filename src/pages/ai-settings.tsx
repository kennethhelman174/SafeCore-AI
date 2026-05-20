
import React, { useState, useEffect } from "react";
import { 
  BrainCircuit, Database, Cpu, Settings as SettingsIcon, 
  RefreshCw, CheckCircle2, AlertCircle, Save,
  ShieldCheck, History, Code, Zap
} from "lucide-react";
import { aiService } from "../services/aiService";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";

import { apiRequest } from "../lib/api";

export default function AISettings() {
  const { token } = useAuth();
  const [ollamaStatus, setOllamaStatus] = useState<"checking" | "online" | "offline">("checking");
  const [models, setModels] = useState<any[]>([]);
  const [config, setConfig] = useState({
    endpoint: "http://localhost:11434",
    defaultModel: "llama3.1:8b",
    temperature: 0.7,
    maxTokens: 2048,
    enableLogging: true
  });
  const [usage, setUsage] = useState<any[]>([]);

  useEffect(() => {
    checkOllama();
    fetchUsage();
  }, []);

  const checkOllama = async () => {
    setOllamaStatus("checking");
    try {
      const data = await aiService.getModels();
      setModels(data.models || []);
      setOllamaStatus("online");
    } catch (e) {
      setOllamaStatus("offline");
    }
  };

  const fetchUsage = async () => {
    try {
      const data = await apiRequest("/api/ai/usage");
      setUsage(data || []);
    } catch (e) {
      console.error("Failed to load AI usage", e);
    }
  };

  const handleSave = () => {
    localStorage.setItem("ai_config", JSON.stringify(config));
    toast.success("AI Configuration saved locally");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between border-b pb-6">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900 flex items-center gap-3">
            <BrainCircuit className="h-8 w-8 text-indigo-600" /> AI Systems Engine
          </h1>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Configure local EHS document intelligence</p>
        </div>
        <button 
          onClick={handleSave}
          className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-lg text-xs font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-100"
        >
          <Save className="h-4 w-4" /> Save Configuration
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Connection Status */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 flex items-center gap-2">
                <Database className="h-4 w-4" /> Ollama Integration
              </h3>
              <div className="flex items-center gap-2">
                 {ollamaStatus === "online" ? (
                   <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase">
                     <CheckCircle2 className="h-3 w-3" /> Online
                   </span>
                 ) : ollamaStatus === "offline" ? (
                   <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 text-[10px] font-black uppercase">
                     <AlertCircle className="h-3 w-3" /> Offline
                   </span>
                 ) : (
                   <RefreshCw className="h-3 w-3 text-slate-400 animate-spin" />
                 )}
                 <button onClick={checkOllama} className="p-1 hover:bg-slate-100 rounded">
                    <RefreshCw className="h-3 w-3 text-slate-400" />
                 </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ollama API Endpoint</label>
                  <input 
                    type="text" 
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    value={config.endpoint}
                    onChange={e => setConfig({...config, endpoint: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Default Writing Model</label>
                  <select 
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    value={config.defaultModel}
                    onChange={e => setConfig({...config, defaultModel: e.target.value})}
                  >
                    <option value="llama3.1:8b">llama3.1:8b (Recommended)</option>
                    <option value="mistral:7b">mistral:7b</option>
                    <option value="qwen2.5-coder:7b">qwen2.5-coder:7b</option>
                    {models.map(m => (
                      <option key={m.name} value={m.name}>{m.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Temperature (Creativity)</label>
                    <input 
                      type="range" min="0" max="1" step="0.1"
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 mt-2" 
                      value={config.temperature}
                      onChange={e => setConfig({...config, temperature: parseFloat(e.target.value)})}
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                       <span>STRICT</span>
                       <span>{config.temperature}</span>
                       <span>CREATIVE</span>
                    </div>
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Max Tokens</label>
                    <input 
                      type="number" 
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      value={config.maxTokens}
                      onChange={e => setConfig({...config, maxTokens: parseInt(e.target.value)})}
                    />
                 </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
             <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 flex items-center gap-2 mb-6">
                <ShieldCheck className="h-4 w-4" /> Safety Rules & Constraints
             </h3>
             <ul className="space-y-3">
                <li className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                   <Zap className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                   <div>
                      <p className="text-xs font-bold text-slate-700">Advisory Only</p>
                      <p className="text-[10px] text-slate-500 font-medium">AI must always state that it does not provide legal guarantees.</p>
                   </div>
                </li>
                <li className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                   <ShieldCheck className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                   <div>
                      <p className="text-xs font-bold text-slate-700">No Auto-Approval</p>
                      <p className="text-[10px] text-slate-500 font-medium">AI cannot approve documents or close corrective actions.</p>
                   </div>
                </li>
             </ul>
          </div>
        </div>

        {/* Info Column */}
        <div className="space-y-6">
           <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-xl shadow-indigo-100">
              <Cpu className="h-10 w-10 opacity-20 mb-4" />
              <h4 className="text-sm font-black uppercase tracking-widest mb-2">Private & Secure</h4>
              <p className="text-[11px] leading-relaxed opacity-90">
                 All data stays on your hardware. SafeCore AI uses local Ollama instances and never transmits your documents to the cloud.
              </p>
           </div>

           <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm overflow-hidden">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 flex items-center gap-2 mb-6">
                <History className="h-4 w-4 text-slate-400" /> Usage Analysis
              </h3>
              <div className="space-y-4">
                 {usage.map((u, i) => (
                    <div key={i} className="flex items-center justify-between border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                       <div>
                          <p className="text-[10px] font-black uppercase text-slate-600">{u.action}</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase">{u.model}</p>
                       </div>
                       <div className="text-right">
                          <p className="text-[10px] font-black text-slate-800">{u.totalTokens || 'N/A'}</p>
                          <p className="text-[8px] text-slate-400 font-bold uppercase">Tokens</p>
                       </div>
                    </div>
                 ))}
                 {usage.length === 0 && <p className="text-[10px] text-slate-400 font-bold uppercase text-center py-4">No recent activity</p>}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
