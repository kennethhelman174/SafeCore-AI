import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Plus, CheckCircle2, Clock, AlertCircle, Calendar, 
  User as UserIcon, Search, Filter, ArrowRight, Sparkles, RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { aiService } from "../services/aiService";
import { useAuth } from "../contexts/AuthContext";

import { apiRequest } from "../lib/api";

export default function CorrectiveActionsPage() {
  const { token } = useAuth();
  const [actions, setActions] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [selectedAction, setSelectedAction] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium",
    dueDate: "",
    assigneeId: "",
    documentId: ""
  });

  const [aiLoading, setAiLoading] = useState(false);

  const handleAISuggest = async () => {
    if (!formData.title) {
       toast.error("Enter a title or issue first for context");
       return;
    }
    setAiLoading(true);
    try {
      const resp = await aiService.chat([{ 
        role: "user", 
        content: `Suggest a detailed corrective action description for a safety issue titled: "${formData.title}". Include specific steps to prevent recurrence.` 
      }]);
      if (resp?.message?.content) {
        setFormData(prev => ({ ...prev, description: resp.message.content }));
        toast.success("AI recommendation applied");
      }
    } catch (err) {
      toast.error("Ollama connection failed. Check AI Settings.");
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    fetchActions();
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const data = await apiRequest("/api/documents/options");
      setDocuments(data || []);
    } catch (err: any) {
      console.error(err);
      toast.error(`Could not load related document options: ${err.message}`);
    }
  };

  const fetchActions = async () => {
    setLoading(true);
    try {
      const data = await apiRequest("/api/corrective-actions");
      setActions(data || []);
    } catch (err: any) {
      toast.error(`Failed to load corrective actions: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest("/api/corrective-actions", {
        method: "POST",
        body: formData
      });
      toast.success("Corrective action created");
      setIsAdding(false);
      fetchActions();
      setFormData({ title: "", description: "", priority: "medium", dueDate: "", assigneeId: "", documentId: "" });
    } catch (err: any) {
      toast.error(`Error creating action: ${err.message}`);
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await apiRequest(`/api/corrective-actions/${id}`, {
        method: "PUT",
        body: { status }
      });
      toast.success(`Action marked as ${status}`);
      fetchActions();
      if (selectedAction?.id === id) setSelectedAction(null);
    } catch (err: any) {
      toast.error(`Error updating status: ${err.message}`);
    }
  };

  const filteredActions = actions.filter(a => {
    const matchesFilter = filter === "all" || a.status === filter;
    const matchesSearch = a.title.toLowerCase().includes(search.toLowerCase()) || 
                          a.description?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getPriorityColor = (p: string) => {
    switch (p) {
      case "urgent": return "bg-red-100 text-red-700 border-red-200";
      case "high": return "bg-orange-100 text-orange-700 border-orange-200";
      case "medium": return "bg-blue-100 text-blue-700 border-blue-200";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "closed": return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "overdue": return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-amber-600" />;
    }
  };

  return (
    <div className="flex flex-col gap-8 h-full overflow-hidden">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">Corrective Action Tracker</h1>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Manage safety improvements and risk controls</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-blue-100 transition-all hover:bg-blue-700 active:scale-95"
        >
          <Plus className="h-4 w-4" /> New Action
        </button>
      </div>

      <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input 
            placeholder="Search actions..."
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-4 text-xs font-medium focus:border-blue-600 focus:outline-none"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select 
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold uppercase focus:outline-none"
          value={filter}
          onChange={e => setFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="pending_verification">Pending Verification</option>
          <option value="closed">Closed</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      <div className="flex flex-1 gap-8 overflow-hidden">
        <div className="flex-1 space-y-3 overflow-auto pr-2">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            </div>
          ) : filteredActions.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-100 bg-slate-50/30">
              <CheckCircle2 className="mb-2 h-8 w-8 text-slate-300" />
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">No actions found matching your criteria</p>
            </div>
          ) : (
            filteredActions.map(action => (
              <motion.div 
                layoutId={action.id}
                key={action.id}
                onClick={() => setSelectedAction(action)}
                className={`group cursor-pointer rounded-xl border p-4 transition-all hover:shadow-md ${selectedAction?.id === action.id ? "border-blue-600 bg-blue-50/30 shadow-md ring-1 ring-blue-600" : "border-slate-100 bg-white"}`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(action.status)}
                      <h3 className="text-sm font-black uppercase text-slate-800">{action.title}</h3>
                    </div>
                    <p className="line-clamp-1 text-[11px] font-medium text-slate-500">{action.description}</p>
                  </div>
                  <span className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase ${getPriorityColor(action.priority)}`}>
                    {action.priority}
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-slate-50 pt-3">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase">
                      <Calendar className="h-3 w-3" />
                      {action.dueDate ? new Date(action.dueDate).toLocaleDateString() : "No Date"}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase">
                      <UserIcon className="h-3 w-3" />
                      {action.assignee?.name || "Unassigned"}
                    </div>
                  </div>
                  <div className="text-[9px] font-black uppercase text-slate-300 group-hover:text-blue-600">Details <ArrowRight className="inline h-2 w-2" /></div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Side Panel: Form or Detail */}
        <div className="w-96 overflow-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-100">
          <AnimatePresence mode="wait">
            {isAdding ? (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between border-b pb-4">
                  <h2 className="text-sm font-black uppercase tracking-widest text-slate-800">New Corrective Action</h2>
                  <button onClick={() => setIsAdding(false)} className="text-[10px] font-bold text-slate-400 hover:text-slate-600">CANCEL</button>
                </div>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Action Title</label>
                    <input 
                      required
                      className="w-full rounded-lg border border-slate-200 p-2 text-sm focus:border-blue-600 focus:outline-none"
                      placeholder="What needs to be done?"
                      value={formData.title}
                      onChange={e => setFormData({...formData, title: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Description</label>
                      <button 
                        type="button"
                        onClick={handleAISuggest}
                        disabled={aiLoading}
                        className="text-[10px] font-black uppercase text-indigo-600 flex items-center gap-1 hover:underline disabled:opacity-50"
                      >
                        {aiLoading ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                        AI Recommendation
                      </button>
                    </div>
                    <textarea 
                      className="w-full rounded-lg border border-slate-200 p-2 text-sm focus:border-blue-600 focus:outline-none"
                      rows={4}
                      placeholder="Detailed explanation..."
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Priority</label>
                      <select 
                        className="w-full rounded-lg border border-slate-200 p-2 text-sm focus:outline-none"
                        value={formData.priority}
                        onChange={e => setFormData({...formData, priority: e.target.value})}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Due Date</label>
                      <input 
                        type="date"
                        className="w-full rounded-lg border border-slate-200 p-2 text-sm focus:outline-none"
                        value={formData.dueDate}
                        onChange={e => setFormData({...formData, dueDate: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Related Document (Optional)</label>
                    <select 
                      className="w-full rounded-lg border border-slate-200 p-2 text-sm focus:border-blue-600 focus:outline-none"
                      value={formData.documentId}
                      onChange={e => setFormData({...formData, documentId: e.target.value})}
                    >
                      <option value="">No Related Document</option>
                      {documents.map((doc: any) => (
                        <option key={doc.id} value={doc.id}>
                          {doc.docNumber} - {doc.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button className="w-full rounded-xl bg-blue-600 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-blue-100 transition-all hover:bg-blue-700">
                    Register Action
                  </button>
                </form>
              </motion.div>
            ) : selectedAction ? (
              <motion.div 
                key={selectedAction.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between border-b pb-4">
                   <span className={`rounded-lg border px-2 py-0.5 text-[9px] font-black uppercase ${getPriorityColor(selectedAction.priority)}`}>
                    {selectedAction.priority} Priority
                  </span>
                  <button onClick={() => setSelectedAction(null)} className="text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase">Close</button>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-black uppercase text-slate-900 leading-tight">{selectedAction.title}</h3>
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-slate-400">
                    <Clock className="h-3 w-3" /> Status: <span className="text-blue-600">{selectedAction.status.replace("_", " ")}</span>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs font-medium text-slate-600 leading-relaxed">{selectedAction.description || "No description provided."}</p>
                </div>

                {selectedAction.document && (
                  <Link to={`/documents/${selectedAction.documentId}`} className="flex items-center justify-between rounded-lg border border-slate-100 p-3 transition-colors hover:border-blue-200 hover:bg-blue-50/30">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded bg-white shadow-sm">
                        <AlertCircle className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase text-slate-400">Related Document</p>
                        <p className="text-[11px] font-bold text-slate-700">{selectedAction.document.title}</p>
                      </div>
                    </div>
                    <ArrowRight className="h-3 w-3 text-slate-400" />
                  </Link>
                )}

                <div className="grid grid-cols-2 gap-4 border-t pt-6">
                  {selectedAction.status !== "closed" && (
                     <button 
                      onClick={() => handleStatusUpdate(selectedAction.id, "closed")}
                      className="col-span-2 flex items-center justify-center gap-2 rounded-xl bg-green-600 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-green-100 hover:bg-green-700"
                    >
                      <CheckCircle2 className="h-4 w-4" /> Mark as Completed
                    </button>
                  )}
                  {selectedAction.status === "open" && (
                    <button 
                      onClick={() => handleStatusUpdate(selectedAction.id, "in_progress")}
                      className="w-full rounded-lg border border-slate-200 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50"
                    >
                      Start Work
                    </button>
                  )}
                   <button 
                    onClick={() => handleStatusUpdate(selectedAction.id, "cancelled")}
                    className="w-full rounded-lg border border-slate-200 py-2 text-[10px] font-black uppercase tracking-widest text-red-600 hover:bg-red-50"
                  >
                    Cancel Action
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <Search className="mb-4 h-12 w-12 text-slate-100" />
                <h3 className="text-sm font-black uppercase text-slate-800">Select an Action</h3>
                <p className="mt-1 text-[10px] font-bold uppercase text-slate-400">to view details and status history</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
