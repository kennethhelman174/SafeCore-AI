
import React, { useState, useEffect, useRef } from "react";
import { 
  Bot, Send, X, Minimize2, Maximize2, Sparkles, 
  RefreshCw, Copy, Check, MessageSquare, BrainCircuit,
  Terminal, ShieldAlert
} from "lucide-react";
import { aiService, AIMessage } from "../services/aiService";
import { toast } from "sonner";

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<AIMessage[]>([
    { role: "assistant", content: "Hello! I'm your SafeCore AI Assistant. How can I help you with your safety documentation today?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [models, setModels] = useState<any[]>([]);
  const [selectedModel, setSelectedModel] = useState("llama3.1:8b");
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      aiService.getModels().then(data => {
        if (data.models) setModels(data.models);
      }).catch(() => {
        // Silently fail, using default model
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: AIMessage = { role: "user", content: input };
    const initialAssistantMsg: AIMessage = { role: "assistant", content: "" };
    
    setMessages(prev => [...prev, userMsg, initialAssistantMsg]);
    setInput("");
    setIsLoading(true);

    let accumulatedResponse = "";

    try {
      await aiService.chatStream([...messages, userMsg], { model: selectedModel }, (chunk) => {
        accumulatedResponse += chunk;
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMsg = newMessages[newMessages.length - 1];
          if (lastMsg.role === "assistant") {
            lastMsg.content = accumulatedResponse;
          }
          return newMessages;
        });
      });
    } catch (err) {
      toast.error("AI service error. Is Ollama running?");
      setMessages(prev => {
        const next = [...prev];
        next[next.length - 1].content = "I'm having trouble connecting to my local brain (Ollama). Please make sure it's running on your machine.";
        return next;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-indigo-600 text-white shadow-2xl flex items-center justify-center hover:scale-110 transition-all z-50 group border-4 border-white"
      >
        <Sparkles className="h-6 w-6 group-hover:rotate-12 transition-transform" />
        <div className="absolute -top-1 -right-1 h-4 w-4 bg-emerald-500 rounded-full border-2 border-white"></div>
      </button>
    );
  }

  return (
    <div className={`fixed transition-all z-50 shadow-2xl border border-slate-200 bg-white flex flex-col ${
      isMinimized 
        ? "bottom-6 right-6 w-72 h-14 rounded-xl" 
        : "bottom-6 right-6 w-[400px] h-[600px] rounded-2xl"
    }`}>
      {/* Header */}
      <div className={`px-4 flex items-center justify-between bg-slate-900 text-white rounded-t-2xl ${isMinimized ? 'h-full rounded-2xl' : 'h-14'}`}>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-indigo-500 rounded-lg flex items-center justify-center">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-widest leading-none">SafeCore AI</p>
            {!isMinimized && <p className="text-[10px] text-indigo-300 font-bold uppercase mt-0.5">Local Assistant</p>}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 hover:bg-slate-800 rounded transition"
          >
            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </button>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-1.5 hover:bg-slate-800 rounded transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Models Selector */}
          <div className="px-4 py-2 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="h-3 w-3 text-slate-400" />
              <select 
                className="bg-transparent text-[10px] font-bold text-slate-600 focus:outline-none cursor-pointer uppercase"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
              >
                <option value="llama3.1:8b">llama3.1:8b (Default)</option>
                <option value="mistral:7b">mistral:7b (Fast)</option>
                <option value="qwen2.5-coder:7b">qwen2.5-coder:7b</option>
                {models.filter(m => !['llama3.1:8b', 'mistral:7b', 'qwen2.5-coder:7b'].includes(m.name)).map(m => (
                  <option key={m.name} value={m.name}>{m.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Ollama Ready</span>
            </div>
          </div>

          {/* Messages */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 scroll-smooth"
          >
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                  msg.role === 'user' 
                    ? "bg-indigo-600 text-white rounded-tr-none" 
                    : "bg-white text-slate-700 border border-slate-200 rounded-tl-none"
                }`}>
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  {msg.role === 'assistant' && idx !== 0 && (
                     <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                        <button 
                          onClick={() => copyToClipboard(msg.content)}
                          className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-indigo-600 transition"
                        >
                          <Copy className="h-3 w-3" /> Copy Result
                        </button>
                        <ShieldAlert className="h-3 w-3 text-slate-300" />
                     </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2">
                   <RefreshCw className="h-4 w-4 text-indigo-500 animate-spin" />
                   <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Thinking...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-slate-100">
            <div className="relative group">
              <textarea 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all min-h-[44px] max-h-32 resize-none"
                placeholder="Ask me to draft an SOP, analyze a risk..."
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <button 
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className={`absolute right-2 bottom-2 p-2 rounded-lg transition-all ${
                  input.trim() && !isLoading 
                    ? "text-indigo-600 hover:bg-white shadow-sm" 
                    : "text-slate-300"
                }`}
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
            <p className="text-[10px] text-center text-slate-400 font-bold uppercase mt-3 tracking-tighter">
              AI recommendations must be reviewed by an EHS professional
            </p>
          </div>
        </>
      )}
    </div>
  );
}
