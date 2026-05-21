import { useState, useEffect } from "react";
import { format } from "date-fns";
import { 
  Search, Plus, Trash2, Edit2, ShieldCheck, Tag, Info, X, RefreshCw,
  BookOpen, GraduationCap, CheckCircle2, AlertTriangle, Printer, Wand2, Award, Sparkles, Check, ChevronRight, AlertCircle
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

interface MasterItem {
  id: string;
  name: string;
  description?: string;
  category?: string;
  isSystemDefault: boolean;
}

export function LibraryPage({ title, endpoint, description }: { title: string, endpoint: string, description: string }) {
  const { token, user } = useAuth();
  const [items, setItems] = useState<MasterItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MasterItem | null>(null);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // --- ONE POINT LESSONS STATE ---
  const sourceType = endpoint.split("/").pop() || "ppe";
  const [isOPLModalOpen, setIsOPLModalOpen] = useState(false);
  const [oplTargetItem, setOplTargetItem] = useState<MasterItem | null>(null);
  const [oplLessons, setOplLessons] = useState<any[]>([]);
  const [isLoadingLessons, setIsLoadingLessons] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<any | null>(null);

  // AI Generator States
  const [isGenerating, setIsGenerating] = useState(false);
  const [customInstruction, setCustomInstruction] = useState("");
  const [draftLesson, setDraftLesson] = useState<any | null>(null);

  // Validation Quiz State
  const [activeQuizQuestionIdx, setActiveQuizQuestionIdx] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [selectedAnswerIdx, setSelectedAnswerIdx] = useState<number | null>(null);
  const [quizCompleted, setQuizCompleted] = useState(false);

  // Draft Editable Fields
  const [editableTitle, setEditableTitle] = useState("");
  const [editableObjective, setEditableObjective] = useState("");
  const [editableMethod, setEditableMethod] = useState("");
  const [editableGood, setEditableGood] = useState("");
  const [editableBad, setEditableBad] = useState("");
  const [editableSixSigma, setEditableSixSigma] = useState("");
  const [editableSafety, setEditableSafety] = useState("");

  useEffect(() => {
    if (draftLesson) {
      setEditableTitle(draftLesson.title || "");
      setEditableObjective(draftLesson.objective || "");
      setEditableMethod(draftLesson.standardMethod || "");
      setEditableGood(draftLesson.goodPractice || "");
      setEditableBad(draftLesson.badPractice || "");
      setEditableSixSigma(draftLesson.sixSigmaTools || "");
      setEditableSafety(draftLesson.keySafetyRules || "");
    }
  }, [draftLesson]);

  const fetchLessonsForItem = async (itemId: string) => {
    setIsLoadingLessons(true);
    try {
      const res = await fetch(`/api/one-point-lessons?sourceType=${sourceType}&sourceId=${itemId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOplLessons(data);
        if (data.length > 0) {
          setSelectedLesson(data[0]);
          // Reset quiz
          setActiveQuizQuestionIdx(0);
          setQuizScore(0);
          setSelectedAnswerIdx(null);
          setQuizCompleted(false);
        } else {
          setSelectedLesson(null);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load OPL training lessons");
    } finally {
      setIsLoadingLessons(false);
    }
  };

  const resetQuizState = () => {
    setActiveQuizQuestionIdx(0);
    setQuizScore(0);
    setSelectedAnswerIdx(null);
    setQuizCompleted(false);
  };

  const handleAnswerSubmit = (idx: number, correctIndex: number) => {
    if (selectedAnswerIdx !== null) return;
    setSelectedAnswerIdx(idx);
    if (idx === correctIndex) {
      setQuizScore(prev => prev + 1);
    }
  };

  const handleNextQuestion = (lesson: any) => {
    const rawQuiz = lesson.validationQuiz;
    const questions = rawQuiz
      ? (typeof rawQuiz === 'string' ? JSON.parse(rawQuiz) : rawQuiz)
      : [];
    if (activeQuizQuestionIdx < questions.length - 1) {
      setActiveQuizQuestionIdx(prev => prev + 1);
      setSelectedAnswerIdx(null);
    } else {
      setQuizCompleted(true);
    }
  };

  const handleOpenOPL = (item: MasterItem) => {
    setOplTargetItem(item);
    setDraftLesson(null);
    setCustomInstruction("");
    setIsOPLModalOpen(true);
    fetchLessonsForItem(item.id);
  };

  const handleGenerateAIOPL = async () => {
    if (!oplTargetItem) return;
    setIsGenerating(true);
    setDraftLesson(null);
    try {
      const res = await fetch("/api/one-point-lessons/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          sourceType,
          sourceId: oplTargetItem.id,
          customInstruction
        })
      });
      if (res.ok) {
        const data = await res.json();
        setDraftLesson(data);
        toast.success("AI successfully drafted One Point Lesson!");
      } else {
        const err = await res.json();
        toast.error(err.error || "Gemini was unable to complete the schema generation.");
      }
    } catch (err: any) {
      toast.error("Service communication error.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublishOPL = async () => {
    if (!draftLesson || !oplTargetItem) return;
    try {
      const payload = {
        title: editableTitle,
        lessonType: "basic_knowledge",
        sourceType,
        sourceId: oplTargetItem.id,
        sourceName: oplTargetItem.name,
        objective: editableObjective,
        standardMethod: editableMethod,
        goodPractice: editableGood,
        badPractice: editableBad,
        sixSigmaTools: editableSixSigma,
        keySafetyRules: editableSafety,
        validationQuiz: draftLesson.validationQuiz,
        isAIGenerated: true
      };
      const res = await fetch("/api/one-point-lessons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        toast.success("One Point Lesson successfully published to library!");
        setDraftLesson(null);
        fetchLessonsForItem(oplTargetItem.id);
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to publish OPL record.");
      }
    } catch (err) {
      toast.error("Database connection failed.");
    }
  };

  const handleDeleteOPL = async (lessonId: string) => {
    if (!confirm("Are you sure you want to delete this One Point Lesson?")) return;
    try {
      const res = await fetch(`/api/one-point-lessons/${lessonId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success("One Point Lesson deleted.");
        if (oplTargetItem) fetchLessonsForItem(oplTargetItem.id);
      }
    } catch (err) {
      toast.error("Failed to delete lesson.");
    }
  };

  const handlePrintOPL = () => {
    if (!oplTargetItem) return;
    const printContents = document.getElementById("opl-printable-sheet")?.innerHTML;
    if (!printContents) return;
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>One Point Lesson - ${oplTargetItem.name}</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1e293b; padding: 30px; line-height: 1.5; }
              .header { border-bottom: 2px solid #10b981; padding-bottom: 12px; margin-bottom: 20px; }
              .opl-title { text-transform: uppercase; font-size: 20px; font-weight: 800; color: #0f766e; margin: 0; }
              .opl-meta { font-size: 10px; color: #64748b; font-family: monospace; text-transform: uppercase; margin-top: 5px; }
              .section-title { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #475569; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-top: 15px; margin-bottom: 8px; }
              .grid-practice { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px; }
              .practice-box { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; }
              .good-box { background-color: #f0fdf4; border-color: #bbf7d0; color: #14532d; }
              .bad-box { background-color: #fff1f2; border-color: #fecdd3; color: #7f1d1d; }
              .lead-text { font-size: 12px; font-weight: 500; color: #334155; margin-bottom: 8px; }
              ul, ol { padding-left: 20px; margin: 0; font-size: 11px; }
              li { margin-bottom: 4px; }
              .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; background-color: #cbd5e1; color: #334155; font-size: 8px; font-weight: bold; text-transform: uppercase; }
              .badge-six-sigma { background-color: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
              .footer { border-top: 1px solid #e2e8f0; margin-top: 30px; padding-top: 10px; text-align: center; font-size: 8px; color: #94a3b8; font-family: monospace; text-transform: uppercase; }
            </style>
          </head>
          <body>
            ${printContents}
            <div class="footer">SafeCore Enterprise Lean EHS Continuous 6S Improvement Tool</div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  };

  const fetchItems = () => {
    setIsLoading(true);
    fetch(endpoint, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setItems(Array.isArray(data) ? data : []))
      .catch(err => {
        console.error(err);
        toast.error("Failed to load library items");
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchItems();
  }, [endpoint, token]);

  const handleDelete = async (id: string, isSystem: boolean) => {
    if (isSystem) return toast.error("System defaults cannot be deleted.");
    if (!confirm("Are you sure you want to delete this library item?")) return;

    try {
      const res = await fetch(`${endpoint}/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success("Item removed from library");
        fetchItems();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to delete");
      }
    } catch (err) {
      toast.error("An error occurred during deletion");
    }
  };

  const handleStartAdd = () => {
    setEditingItem(null);
    setFormName("");
    setFormDesc("");
    setFormCategory("");
    setIsModalOpen(true);
  };

  const handleStartEdit = (item: MasterItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormDesc(item.description || "");
    setFormCategory(item.category || "");
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error("Name is required");
      return;
    }
    setIsSaving(true);
    try {
      const url = editingItem ? `${endpoint}/${editingItem.id}` : endpoint;
      const method = editingItem ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formName,
          description: formDesc,
          category: formCategory
        })
      });

      if (res.ok) {
        toast.success(editingItem ? "Record updated successfully" : "Record created successfully");
        setIsModalOpen(false);
        fetchItems();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to save record");
      }
    } catch (err) {
      toast.error("An error occurred during save operations");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredItems = items.filter(i => 
    i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (i.description?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const isAdmin = user?.role === "Administrator";

  return (
    <div className="flex h-full flex-col gap-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-200 pb-6 gap-4">
        <div>
           <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900">{title}</h2>
              <span className={`px-2 py-0.5 rounded-lg font-black text-[9px] uppercase border bg-slate-100 text-slate-500 border-slate-200`}>
                Enterprise Library
              </span>
           </div>
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{description}</p>
        </div>
        <div className="flex gap-2">
           <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                className="w-full bg-slate-100 border-transparent rounded-xl pl-10 pr-4 py-2 text-xs font-bold focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                placeholder="Search library..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
           </div>
           {isAdmin && (
             <button 
               onClick={handleStartAdd}
               className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition shadow-lg shadow-slate-900/20 active:scale-95 cursor-pointer"
             >
               <Plus className="h-4 w-4" /> Add Master Item
             </button>
           )}
        </div>
      </div>

      {/* Content Section */}
      <div className="flex-1 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm flex flex-col">
        <div className="overflow-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-slate-50/90 backdrop-blur-sm text-[10px] font-black uppercase tracking-widest text-slate-400 z-10 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Master Item Name</th>
                <th className="px-6 py-4">Attributes / Description</th>
                <th className="px-6 py-4 text-right">Management</th>
              </tr>
            </thead>
            <tbody className="text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="h-32 text-center text-slate-400 font-bold uppercase tracking-widest animate-pulse">
                    Synchronizing Library...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={4} className="h-48 text-center">
                    <div className="flex flex-col items-center gap-2 opacity-50">
                       <Search className="h-8 w-8 text-slate-300" />
                       <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No records matching your query</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="group border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                       {item.isSystemDefault ? (
                         <div className="flex items-center gap-1.5 text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg w-fit border border-blue-100/50" title="System provided master record">
                            <ShieldCheck className="h-3 w-3" />
                            <span className="text-[8px] font-black uppercase tracking-tighter">System Default</span>
                         </div>
                       ) : (
                         <div className="flex items-center gap-1.5 text-slate-400 bg-slate-50 px-2 py-0.5 rounded-lg w-fit border border-slate-100" title="User defined record">
                            <Tag className="h-3 w-3" />
                            <span className="text-[8px] font-black uppercase tracking-tighter">Custom</span>
                         </div>
                       )}
                    </td>
                    <td className="px-6 py-4">
                       <span className="font-bold text-slate-800 text-sm">{item.name}</span>
                        <div className="mt-1 flex items-center gap-1.5">
                           <button
                             onClick={() => handleOpenOPL(item)}
                             className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/50 text-emerald-700 hover:text-emerald-800 rounded-lg text-[9px] font-bold uppercase transition cursor-pointer"
                           >
                             <BookOpen className="h-3.5 w-3.5 text-emerald-500" /> One Point Lesson (OPL)
                           </button>
                        </div>
                       <div className="font-mono text-slate-300 text-[10px] mt-0.5">{item.id.slice(0, 8)}</div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="max-w-md">
                          <p className={`text-[11px] leading-relaxed ${item.description ? 'text-slate-600' : 'text-slate-300 italic'}`}>
                             {item.description || "No detailed metadata provided."}
                          </p>
                          {item.category && (
                             <span className="inline-block mt-2 px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-bold uppercase tracking-tight">
                                {item.category}
                             </span>
                          )}
                       </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         {isAdmin && (
                           <>
                             <button 
                                onClick={() => handleStartEdit(item)}
                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                title="Edit Master Record"
                             >
                               <Edit2 className="h-4 w-4" />
                             </button>
                             <button 
                                onClick={() => handleDelete(item.id, item.isSystemDefault)}
                                className={`p-2 transition-colors rounded-lg cursor-pointer ${item.isSystemDefault ? 'text-slate-200 cursor-not-allowed' : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'}`}
                                title={item.isSystemDefault ? "System defaults cannot be deleted" : "Delete Record"}
                             >
                               <Trash2 className="h-4 w-4" />
                             </button>
                           </>
                         )}
                         {!isAdmin && (
                           <button className="p-2 text-slate-300 cursor-default">
                              <Info className="h-4 w-4" />
                           </button>
                         )}
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Footer info */}
        <div className="bg-slate-50 p-4 border-t border-slate-100 flex items-center justify-between">
           <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Database className="h-3 w-3" /> Records synchronized with SafeCore Master Library
           </p>
           <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              Total Entries: {filteredItems.length}
           </p>
        </div>
      </div>

      {/* Visual Modal Dialog Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-800">
                {editingItem ? "Edit Master Item" : "Add Master Item"}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="space-y-4 mt-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Item Name</label>
                <input 
                  required
                  placeholder="e.g. High-Visibility Safety Vest"
                  className="w-full rounded-lg border border-slate-200 p-2.5 text-xs font-semibold focus:border-blue-600 focus:outline-none"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Category / Label</label>
                <input 
                  placeholder="e.g. Body Protection"
                  className="w-full rounded-lg border border-slate-200 p-2.5 text-xs font-semibold focus:border-blue-600 focus:outline-none"
                  value={formCategory}
                  onChange={e => setFormCategory(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Description / Specifications</label>
                <textarea 
                  rows={4}
                  placeholder="Provide precise sizing, compliance standards (such as ANSI/ISEA), or storage details..."
                  className="w-full rounded-lg border border-slate-200 p-2.5 text-xs font-semibold focus:border-blue-600 focus:outline-none"
                  value={formDesc}
                  onChange={e => setFormDesc(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSaving ? <RefreshCw className="h-3 w-3 animate-spin" /> : null}
                  {editingItem ? "Save Changes" : "Create Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ONE POINT LESSON (OPL) MODAL OVERLAY */}
      {isOPLModalOpen && oplTargetItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-4xl bg-white rounded-2xl border border-slate-200 outline-none shadow-2xl flex flex-col my-8 overflow-hidden max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between bg-slate-900 px-6 py-4 border-b border-slate-800 text-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-500/10 text-emerald-400 p-2 rounded-lg border border-emerald-500/20">
                  <BookOpen className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[9px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/10">
                      Lean Six Sigma (6S)
                    </span>
                    <span className="font-mono text-[9px] font-black uppercase tracking-widest bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                      OPL Training Sheet
                    </span>
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-100 mt-1">
                    One Point Lesson: {oplTargetItem.name}
                  </h3>
                </div>
              </div>
              <button 
                onClick={() => setIsOPLModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                title="Close Lesson Builder"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Scrollable Content Container */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
              {isLoadingLessons ? (
                <div className="flex flex-col items-center justify-center h-96 gap-4">
                  <RefreshCw className="h-8 w-8 text-emerald-500 animate-spin" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading published lesson sheets...</p>
                </div>
              ) : isGenerating ? (
                <div className="flex flex-col items-center justify-center h-96 gap-4 text-center">
                  <div className="relative flex items-center justify-center">
                    <div className="h-16 w-16 border-4 border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin"></div>
                    <Sparkles className="h-6 w-6 text-emerald-500 absolute animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-800 animate-pulse">Consulting SafeCore EHS Engine...</h4>
                    <p className="text-[10px] text-slate-400 mt-1 max-w-sm">Generating visual safety standards, Good/Bad practices, continuous Six Sigma tools and comprehension validation quiz.</p>
                  </div>
                </div>
              ) : selectedLesson ? (
                // --- LESSON VIEWER MODE ---
                <div className="space-y-6">
                  {/* Print View Wrapper */}
                  <div id="opl-printable-sheet" className="p-1">
                    <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 shadow-sm border-t-8 border-t-emerald-500 relative text-left">
                      
                      {/* Certified Stamp */}
                      {quizCompleted && quizScore === 3 && (
                        <div className="absolute right-6 top-6 border-4 border-dashed border-emerald-500 text-emerald-600 rounded-2xl px-4 py-2 font-black uppercase text-xs rotate-12 tracking-widest bg-emerald-50/50 flex flex-col items-center gap-0.5 pointer-events-none select-none">
                          <Award className="h-5 w-5 animate-bounce" />
                          <span>Knowledge Verified</span>
                          <span className="text-[7px] font-black">6S Compliant</span>
                        </div>
                      )}

                      <div className="header border-b border-slate-200 pb-4 mb-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="badge badge-six-sigma inline-block px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[8px] font-black uppercase">
                            Six Sigma: {selectedLesson.sixSigmaTools || "5S Standardized Work"}
                          </span>
                          <span className="badge inline-block px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-600 text-[8px] font-black uppercase">
                            Type: Basic Knowledge
                          </span>
                        </div>
                        <h2 className="text-xl font-bold uppercase tracking-tight text-slate-900 mt-2">
                          {selectedLesson.title}
                        </h2>
                        <div className="opl-meta flex flex-wrap gap-4 font-mono text-[9px] text-slate-400 mt-2 uppercase tracking-wide">
                          <span>Topic ID: {selectedLesson.sourceId?.slice(0, 8)}</span>
                          <span>Source Class: {selectedLesson.sourceType}</span>
                          <span>Author: {selectedLesson.createdBy}</span>
                          <span>Published: {format(new Date(selectedLesson.createdAt), "yyyy-MM-dd")}</span>
                        </div>
                      </div>

                      {/* Training Objective */}
                      <div className="my-4">
                        <div className="section-title text-[9px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1 mb-2">Training Objective</div>
                        <p className="text-xs font-bold text-slate-700 italic leading-relaxed">
                          "{selectedLesson.objective}"
                        </p>
                      </div>

                      {/* Two Column Good vs Bad Practice (TPS Style) */}
                      <div className="grid-practice grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
                        
                        {/* DO / GOOD PRACTICE */}
                        <div className="practice-box good-box bg-emerald-50/70 border border-emerald-200/50 rounded-xl p-4 text-emerald-950">
                          <div className="flex items-center gap-2 mb-2 text-emerald-800 border-b border-emerald-250/30 pb-2">
                            <span className="h-5 w-5 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[10px] font-black">✓</span>
                            <span className="text-[10px] font-black uppercase tracking-widest">GOOD PRACTICE / DO</span>
                          </div>
                          <ul className="list-disc pl-5 space-y-1.5 text-[11px] font-semibold leading-relaxed">
                            {selectedLesson.goodPractice.split("\n").filter(Boolean).map((line: string, i: number) => (
                              <li key={i}>{line.replace(/^-\s*/, '')}</li>
                            ))}
                          </ul>
                        </div>

                        {/* DON'T / BAD PRACTICE */}
                        <div className="practice-box bad-box bg-rose-50/70 border border-rose-200/50 rounded-xl p-4 text-rose-950">
                          <div className="flex items-center gap-2 mb-2 text-rose-800 border-b border-rose-250/30 pb-2">
                            <span className="h-5 w-5 bg-rose-500 text-white rounded-full flex items-center justify-center text-[10px] font-black">✕</span>
                            <span className="text-[10px] font-black uppercase tracking-widest">BAD PRACTICE / DON'T</span>
                          </div>
                          <ul className="list-disc pl-5 space-y-1.5 text-[11px] font-semibold leading-relaxed">
                            {selectedLesson.badPractice.split("\n").filter(Boolean).map((line: string, i: number) => (
                              <li key={i}>{line.replace(/^-\s*/, '')}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Standard Method Section */}
                      <div className="my-4">
                        <div className="section-title text-[9px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1 mb-2">Standard Operating Method & Steps</div>
                        <ol className="space-y-2 pl-4 list-decimal text-xs font-bold text-slate-700 leading-relaxed">
                          {selectedLesson.standardMethod.split("\n").filter(Boolean).map((line: string, i: number) => (
                            <li key={i} className="pl-1">{line.replace(/^\d+\.\s*/, '')}</li>
                          ))}
                        </ol>
                      </div>

                      {/* Key Safety Rules and Warnings */}
                      {selectedLesson.keySafetyRules && (
                        <div className="my-4 pt-4 border-t border-slate-100">
                          <div className="flex items-start gap-2 bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
                            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                            <div>
                              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-800">Critical Core Safety Bulletins</h4>
                              <p className="text-[11px] text-slate-600 mt-1 font-semibold whitespace-pre-line leading-relaxed">
                                {selectedLesson.keySafetyRules}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                    </div>
                  </div>

                  {/* INTERACTIVE COMPREHENSION QUIZ MODULE */}
                  <div className="bg-slate-900 rounded-3xl p-6 text-white border border-slate-800 shadow-xl overflow-hidden mt-6 text-left">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-5 w-5 text-emerald-400" />
                        <div>
                          <h4 className="text-xs font-black uppercase tracking-widest text-slate-100">Interactive Validation Check</h4>
                          <p className="text-[10px] text-slate-400">Complete the quiz below to verify training comprehension</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1 rounded-full text-[10px] font-bold text-emerald-400 font-mono border border-slate-700">
                        Score: {quizScore}/3
                      </div>
                    </div>

                    {(() => {
                      const quizQuestions = selectedLesson.validationQuiz 
                        ? (typeof selectedLesson.validationQuiz === 'string' ? JSON.parse(selectedLesson.validationQuiz) : selectedLesson.validationQuiz)
                        : [];

                      if (!quizQuestions || quizQuestions.length === 0) {
                        return <p className="text-xs font-mono text-slate-500 text-center py-4">No validation exercises registered for this lesson.</p>;
                      }

                      if (quizCompleted) {
                        const allCorrect = quizScore === 3;
                        return (
                          <div className="flex flex-col items-center text-center py-6 gap-3 animate-in fade-in duration-300">
                            <div className={`h-14 w-14 rounded-full flex items-center justify-center border-2 ${allCorrect ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-amber-500/10 border-amber-500 text-amber-400'}`}>
                              <Award className="h-7 w-7" />
                            </div>
                            <div>
                              <h5 className="text-sm font-black uppercase tracking-widest">
                                {allCorrect ? "6S Safety Certification Passed" : "Comprehension Review Required"}
                              </h5>
                              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
                                {allCorrect 
                                  ? "Perfect score! You have successfully completed the One Point Lesson validation check. Your safety comprehension is recorded as current." 
                                  : `You scored ${quizScore} out of ${quizQuestions.length}. Review the visual do's and don'ts guidelines and retake the validation check to verify full compliance.`}
                              </p>
                            </div>
                            <button
                              onClick={resetQuizState}
                              className="mt-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-[10px] uppercase tracking-wider px-4 py-2 rounded-xl transition cursor-pointer border border-slate-700 active:scale-95"
                            >
                              Restart Exercises
                            </button>
                          </div>
                        );
                      }

                      const activeQuestion = quizQuestions[activeQuizQuestionIdx];
                      if (!activeQuestion) return null;

                      return (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest bg-slate-800/40 px-3 py-1.5 rounded-lg border border-slate-800/60">
                            <span>Question {activeQuizQuestionIdx + 1} of {quizQuestions.length}</span>
                            <span className="text-emerald-400">Section Validation</span>
                          </div>
                          
                          <p className="text-xs font-bold text-slate-200 leading-relaxed pl-1">
                            {activeQuestion.question}
                          </p>

                          <div className="grid grid-cols-1 gap-2 mt-2">
                            {activeQuestion.options.map((option: string, idx: number) => {
                              const isSelected = selectedAnswerIdx === idx;
                              const isCorrect = idx === activeQuestion.correctIndex;
                              
                              let btnClass = "bg-slate-800/50 hover:bg-slate-800 border-slate-800 hover:border-slate-700 text-slate-300 animate-transition";
                              if (selectedAnswerIdx !== null) {
                                if (isCorrect) {
                                  btnClass = "bg-emerald-500/20 border-emerald-500 text-emerald-300";
                                } else if (isSelected) {
                                  btnClass = "bg-rose-500/25 border-rose-500 text-rose-300";
                                } else {
                                  btnClass = "opacity-45 bg-slate-800/20 border-slate-800 text-slate-500";
                                }
                              }

                              const handleQuizClick = () => {
                                handleAnswerSubmit(idx, activeQuestion.correctIndex);
                              };

                              return (
                                <button
                                  key={idx}
                                  disabled={selectedAnswerIdx !== null}
                                  onClick={handleQuizClick}
                                  className={`w-full text-left p-3 rounded-xl border text-xs font-semibold leading-relaxed transition-all duration-150 ${btnClass} flex items-center justify-between ${selectedAnswerIdx === null ? 'cursor-pointer active:scale-[0.995]' : 'cursor-default'}`}
                                >
                                  <span>{option}</span>
                                  {selectedAnswerIdx !== null && isCorrect && <Check className="h-4 w-4 text-emerald-400 shrink-0" />}
                                  {selectedAnswerIdx !== null && isSelected && !isCorrect && <X className="h-4 w-4 text-rose-400 shrink-0" />}
                                </button>
                              );
                            })}
                          </div>

                          {selectedAnswerIdx !== null && (
                            <button
                              onClick={() => handleNextQuestion(selectedLesson)}
                              className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase tracking-wider py-2.5 rounded-xl transition cursor-pointer active:scale-95 text-center flex items-center justify-center gap-1.5"
                            >
                              {activeQuizQuestionIdx < quizQuestions.length - 1 ? (
                                <>Next Exercise Question <CheckCircle2 className="h-3.5 w-3.5" /></>
                              ) : (
                                <>Verify Completion <CheckCircle2 className="h-3.5 w-3.5" /></>
                              )}
                            </button>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Lesson Actions */}
                  <div className="flex items-center justify-between border-t border-slate-200/60 pt-6">
                    <button
                      onClick={() => handleDeleteOPL(selectedLesson.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-50 border border-rose-100 hover:bg-rose-100 text-rose-700 rounded-xl text-[10px] font-black uppercase tracking-wider transition cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Permanent Delete Lesson
                    </button>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedLesson(null)} // go back to AI trigger or editor
                        className="rounded-xl border border-slate-200 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 bg-white transition cursor-pointer"
                      >
                        Create / Reset Layout
                      </button>
                      <button
                        onClick={handlePrintOPL}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white hover:bg-emerald-700 transition cursor-pointer"
                      >
                        <Printer className="h-3.5 w-3.5" /> Print Lesson (OPL Template)
                      </button>
                    </div>
                  </div>
                </div>
              ) : draftLesson ? (
                // --- AI DRAFT EDITOR WORKBENCH MODE ---
                <div className="space-y-6 text-left">
                  <div className="bg-amber-50/85 border border-amber-200/60 rounded-2xl p-4 flex items-start gap-2.5">
                    <Sparkles className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-amber-800">AI Workbench — Review Drafting</h4>
                      <p className="text-[10px] text-amber-900/80 mt-0.5 leading-relaxed font-semibold">
                        Gemini has generated a fully complete draft lesson card aligned with Six Sigma practices. Review spelling, visual cues, and procedures below. You can modify any text before finalizing.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    {/* Title */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">OPL Safety Title</label>
                      <input 
                        className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-bold text-slate-800 focus:border-emerald-600 focus:outline-none"
                        value={editableTitle}
                        onChange={e => setEditableTitle(e.target.value)}
                      />
                    </div>

                    {/* Objective */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Lesson Training Objective</label>
                      <textarea 
                        rows={2}
                        className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-bold text-slate-700 focus:border-emerald-600 focus:outline-none"
                        value={editableObjective}
                        onChange={e => setEditableObjective(e.target.value)}
                      />
                    </div>

                    {/* Left & Right - Good and Bad practices editing */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                          <span className="h-3 w-3 bg-emerald-500 rounded-full inline-block"></span> Good Practice Visual DOs (newlines)
                        </label>
                        <textarea 
                          rows={6}
                          className="w-full rounded-xl border border-emerald-200 p-2.5 font-bold text-xs text-slate-700 bg-emerald-50/20 focus:bg-white focus:border-emerald-600 focus:outline-none"
                          value={editableGood}
                          onChange={e => setEditableGood(e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                          <span className="h-3 w-3 bg-rose-500 rounded-full inline-block"></span> Bad Practice Visual DONTs (newlines)
                        </label>
                        <textarea 
                          rows={6}
                          className="w-full rounded-xl border border-rose-200 p-2.5 font-bold text-xs text-slate-700 bg-rose-50/20 focus:bg-white focus:border-rose-600 focus:outline-none"
                          value={editableBad}
                          onChange={e => setEditableBad(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Standard Method Steps */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Standard Operating Method Steps (1 per line)</label>
                      <textarea 
                        rows={5}
                        className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-700 focus:border-emerald-600 focus:outline-none font-bold"
                        value={editableMethod}
                        onChange={e => setEditableMethod(e.target.value)}
                      />
                    </div>

                    {/* Six Sigma Tools & Key Safety Rules */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Continuous Improvement / 6S reference</label>
                        <input 
                          className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-700 focus:border-emerald-600 focus:outline-none font-bold"
                          value={editableSixSigma}
                          onChange={e => setEditableSixSigma(e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Critical Core Safety Bulletins</label>
                        <textarea 
                          rows={2}
                          className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-700 focus:border-emerald-600 focus:outline-none font-bold"
                          value={editableSafety}
                          onChange={e => setEditableSafety(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 border-t border-slate-200/60 pt-4 shrink-0">
                    <button
                      onClick={() => setDraftLesson(null)}
                      className="rounded-xl border border-slate-200 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 bg-white transition cursor-pointer"
                    >
                      Refuse Draft
                    </button>
                    <button
                      onClick={handlePublishOPL}
                      className="rounded-xl bg-emerald-600 hover:bg-emerald-700 border-transparent px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-white shadow-lg transition cursor-pointer"
                    >
                      Publish OPL To Training Database
                    </button>
                  </div>
                </div>
              ) : (
                // --- EMPTY GENERATOR INTRO STATE ---
                <div className="flex flex-col items-center justify-center p-8 text-center gap-6 h-96">
                  <div className="max-w-md mx-auto">
                    <div className="h-12 w-12 bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-100 inline-block mx-auto mb-3">
                      <Wand2 className="h-6 w-6 text-emerald-500" />
                    </div>
                    
                    <h4 className="text-sm font-black uppercase tracking-wider text-slate-800">
                      AI One Point Lesson (OPL) Builder
                    </h4>
                    
                    <p className="text-xs text-slate-400 mt-1 pb-4 leading-relaxed">
                      EHS warehouse departments use OPL training sheets for micro-learning. Build a visual DO and DON'T card for this master item, based on continuous Six Sigma visual management standards.
                    </p>
                  </div>

                  <div className="w-full max-w-lg space-y-3 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm text-left">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Custom Focus / Context Directions (Optional)</label>
                      <textarea
                        rows={2}
                        placeholder="e.g. Focus on hand safety pinch points, check gloves for fatigue, and proper storage bin alignment."
                        className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-700 focus:border-emerald-600 focus:outline-none font-bold shadow-inner"
                        value={customInstruction}
                        onChange={e => setCustomInstruction(e.target.value)}
                      />
                    </div>

                    <button
                      onClick={handleGenerateAIOPL}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 border-transparent hover:bg-black text-white text-[10px] font-black uppercase tracking-widest py-3 hover:-translate-y-0.5 active:translate-y-0 transition cursor-pointer shadow-lg shadow-slate-900/10"
                    >
                      <Sparkles className="h-4 w-4 text-emerald-400" /> Draft OPL Sheet with Gemini
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Modal Bottom Footer bar */}
            <div className="shrink-0 bg-slate-100 border-t border-slate-200 px-6 py-3.5 flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              <span>Verified 6S visual training template</span>
              <span>SafeCore EHS Platform</span>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

function Database({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <ellipse cx="12" cy="5" rx="9" ry="3"/>
      <path d="M3 5V19A9 3 0 0 0 21 19V5"/>
      <path d="M3 12A9 3 0 0 0 21 12"/>
    </svg>
  );
}
