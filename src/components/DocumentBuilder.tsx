import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  ArrowLeft, Save, Plus, Trash2, GripVertical, Shield, 
  AlertTriangle, Settings, Wrench, Sparkles, BrainCircuit, 
  RefreshCw, MousePointerClick, Zap
} from "lucide-react";
import { toast } from "sonner";
import { aiService } from "../services/aiService";
import { useAuth } from "../contexts/AuthContext";
import { apiRequest, ApiError } from "../lib/api";

interface BuilderProps {
  initialData?: any;
  mode: "create" | "edit";
  docId?: string;
}

export function DocumentBuilder({ initialData, mode, docId }: BuilderProps) {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [masterData, setMasterData] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  // AI Hazard Suggestion States
  const [suggestedHazards, setSuggestedHazards] = useState<string[]>([]);
  const [showAiHazardsModal, setShowAiHazardsModal] = useState(false);
  const [selectedSuggestedHazards, setSelectedSuggestedHazards] = useState<string[]>([]);


  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    docNumber: initialData?.docNumber || "",
    typeId: initialData?.typeId || "",
    categoryId: initialData?.categoryId || "",
    departmentId: initialData?.departmentId || "",
    riskLevel: initialData?.riskLevel || "low",
    sifPotential: initialData?.sifPotential || false,
    requiredTraining: initialData?.requiredTraining || false,
    requiresAcknowledgment: initialData?.requiresAcknowledgment || false,
    requiresVerification: initialData?.requiresVerification || false,
    refresherFreqMonths: initialData?.refresherFreqMonths || 12,
    effectiveDate: initialData?.effectiveDate ? new Date(initialData.effectiveDate).toISOString().split('T')[0] : "",
    reviewDueDate: initialData?.reviewDueDate ? new Date(initialData.reviewDueDate).toISOString().split('T')[0] : "",
    ownerId: initialData?.ownerId || "",
    purpose: initialData?.purpose || "",
    scope: initialData?.scope || "",
    responsibilities: initialData?.responsibilities || "",
    definitions: initialData?.definitions || "",
    references: initialData?.references || "",
    // Library selections (ids)
    ppeIds: initialData?.ppe?.map((p: any) => p.id) || [],
    hazardIds: initialData?.hazards?.map((p: any) => p.id) || [],
    controlIds: initialData?.controls?.map((p: any) => p.id) || [],
    equipmentIds: initialData?.equipment?.map((p: any) => p.id) || [],
    // Structured content
    procedureSteps: initialData?.procedureSteps || [],
    jsaSteps: initialData?.jsaSteps || [],
    checklistItems: initialData?.checklistItems || [],
    sifDetails: initialData?.sifDetails || {
      energySource: "",
      criticalRiskCategory: "",
      potentialOutcome: "",
      missingControls: "",
      controlVerification: "",
      fatalityPotential: false,
      lifeAlteringPotential: false
    },
    riskAssessments: initialData?.riskAssessments || [{
      preSeverity: 1, preLikelihood: 1, preExposure: 1, preScore: 1,
      postSeverity: 1, postLikelihood: 1, postExposure: 1, postScore: 1,
      riskReduction: 0
    }],
    criticalControls: initialData?.criticalControls || []
  });

  const [aiLoading, setAiLoading] = useState<string | null>(null);

  const findClosestHazardId = (suggestion: string): string | null => {
    if (!masterData?.hazards) return null;
    const sugLower = suggestion.toLowerCase();
    const match = masterData.hazards.find((h: any) => 
      sugLower.includes(h.name.toLowerCase()) || h.name.toLowerCase().includes(sugLower)
    );
    return match ? match.id : null;
  };

  const applySelectedAiHazards = () => {
    const matchedIds: string[] = [];
    selectedSuggestedHazards.forEach(sug => {
      const matchId = findClosestHazardId(sug);
      if (matchId && !matchedIds.includes(matchId)) {
        matchedIds.push(matchId);
      }
    });

    if (matchedIds.length === 0) {
      toast.warning("No matching master library hazards found for your selections. You can link them manually below.");
    } else {
      setFormData(f => {
        const next = [...f.hazardIds];
        matchedIds.forEach(id => {
          if (!next.includes(id)) {
            next.push(id);
          }
        });
        return { ...f, hazardIds: next };
      });
      toast.success(`Linked ${matchedIds.length} hazards to document!`);
    }
    setShowAiHazardsModal(false);
  };

  const handleAIHazards = async () => {
    if (!formData.title) return toast.error("Title required before AI analysis");
    setAiLoading("hazards");
    try {
      const res = await aiService.identifyHazards(formData.title);
      if (res?.message?.content) {
        const content = res.message.content;
        const lines = content.split('\n')
          .map((l: string) => l.trim().replace(/^[\d+.\-*\s]+/, '').trim())
          .filter((l: string) => l.length > 3);

        if (lines.length > 0) {
          setSuggestedHazards(lines);
          setSelectedSuggestedHazards(lines);
          setShowAiHazardsModal(true);
          toast.success("AI suggested hazard landscape loaded!");
        } else {
          toast.info("AI returned no scannable hazard lines. Please try again.");
        }
      }
    } catch (e) {
      toast.error("AI Suggestion Unavailable: The AI modeling server (Ollama) is currently unreachable. Please make sure the service is running or check your AI Settings.");
    } finally {
      setAiLoading(null);
    }
  };

  const handleAIControls = async () => {
    if (!formData.title) return toast.error("Title required");
    setAiLoading("controls");
    try {
       const res = await aiService.suggestControls(formData.title);
       if (res?.message?.content) {
          const content = res.message.content;
          const lines = content.split('\n').filter((l: string) => l.includes('Control:'));
          const newControls = lines.map((l: string, i: number) => ({
             order: i+1,
             name: l.replace('Control:', '').trim(),
             frequency: "Every Shift",
             verificationMethod: "Visual Check",
             status: "active"
          }));
          setFormData(f => ({ ...f, criticalControls: [...f.criticalControls, ...newControls] }));
          toast.success("AI Controls added");
       }
    } catch (e) {
       toast.error("AI Error");
    } finally {
       setAiLoading(null);
    }
  };

  const handleAIDraft = async (type: "purpose" | "scope" | "jsa" | "sop") => {
    if (!formData.title) {
       toast.error("Please enter a document title first");
       return;
    }
    setAiLoading(type);
    try {
      let res;
      if (type === "purpose") res = await aiService.chat([{ role: "user", content: `Write a 1-sentence professional safety purpose for an SOP titled "${formData.title}".` }]);
      else if (type === "scope") res = await aiService.chat([{ role: "user", content: `Define the scope for a safety document titled "${formData.title}" in a warehouse environment.` }]);
      else if (type === "sop") res = await aiService.generateSOP(formData.title, "Warehouse Operations");
      else if (type === "jsa") res = await aiService.analyzeJSA(formData.title);
      
      if (res?.message?.content) {
        const content = res.message.content;
        if (type === "purpose") setFormData(f => ({ ...f, purpose: content }));
        if (type === "scope") setFormData(f => ({ ...f, scope: content }));
        if (type === "jsa") {
          const lines = content.split('\n').filter((l: string) => l.includes('|'));
          const newSteps = lines.map((l: string, i: number) => {
            const parts = l.split('|').map(p => p.trim());
            return {
              order: i + 1,
              taskDescription: parts[0] || "AI Task",
              potentialHazards: parts[1] || "AI Hazard",
              controlMeasures: parts[2] || "AI Control",
              postRiskRating: "low" as const
            };
          });
          if (newSteps.length > 0) setFormData(f => ({ ...f, jsaSteps: [...f.jsaSteps, ...newSteps] }));
        }
        if (type === "sop") {
           const lines = content.split('\n').filter((l: string) => /^\d+\./.test(l.trim()));
           if (lines.length > 0) {
              const newSteps = lines.map((l: string, i: number) => ({
                order: i + 1,
                title: `Task Step`,
                action: l.replace(/^\d+\.\s*/, ''),
                safetyNote: "Ensure area is clear.",
                qualityNote: ""
              }));
              setFormData(f => ({ ...f, procedureSteps: [...f.procedureSteps, ...newSteps] }));
           } else {
              setFormData(f => ({ ...f, responsibilities: content }));
           }
        }
        toast.success(`AI successfully drafted ${type}`);
      }
    } catch (e) {
      toast.error("Ollama connection failed. Check AI Settings.");
    } finally {
      setAiLoading(null);
    }
  };

  useEffect(() => {
    fetch("/api/master-data", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setMasterData(data);
        if (mode === "create") {
          if (data.types?.length && !formData.typeId) setFormData(f => ({ ...f, typeId: data.types[0].id }));
          if (data.categories?.length && !formData.categoryId) setFormData(f => ({ ...f, categoryId: data.categories[0].id }));
          if (data.departments?.length && !formData.departmentId) setFormData(f => ({ ...f, departmentId: data.departments[0].id }));
        }
      })
      .catch(console.error);

    fetch("/api/users", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(setUsers)
      .catch(console.error);
  }, [mode, token]);

  const selectedTypeName = masterData?.types?.find((t: any) => t.id === formData.typeId)?.name || "";

  const calculateRisk = (field: string, value: number, isPre: boolean) => {
    const current = { ...formData.riskAssessments[0] };
    if (isPre) {
      if (field === "severity") current.preSeverity = value;
      if (field === "likelihood") current.preLikelihood = value;
      if (field === "exposure") current.preExposure = value;
      current.preScore = current.preSeverity * current.preLikelihood * current.preExposure;
    } else {
      if (field === "severity") current.postSeverity = value;
      if (field === "likelihood") current.postLikelihood = value;
      if (field === "exposure") current.postExposure = value;
      current.postScore = current.postSeverity * current.postLikelihood * current.postExposure;
    }
    
    current.riskReduction = current.preScore > 0 
      ? Math.round(((current.preScore - current.postScore) / current.preScore) * 100) 
      : 0;

    // Automatic thresholds
    const postLevel = current.postScore >= 81 ? "critical" : current.postScore >= 46 ? "high" : current.postScore >= 16 ? "medium" : "low";

    const isSifPotential = postLevel === "critical" || postLevel === "high" || formData.sifDetails.fatalityPotential || formData.sifDetails.lifeAlteringPotential;
    
    setFormData({
      ...formData,
      riskLevel: postLevel,
      sifPotential: formData.sifPotential || isSifPotential,
      riskAssessments: [current]
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic Validation
    if (!formData.title.trim()) {
      toast.error("Document Title is required");
      setActiveTab("general");
      return;
    }
    if (!formData.docNumber.trim()) {
      toast.error("Document ID is required");
      setActiveTab("general");
      return;
    }

    setLoading(true);
    try {
      const url = mode === "create" ? "/api/documents" : `/api/documents/${docId}`;
      const method = mode === "create" ? "POST" : "PUT";
      
      const res = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        const data = await res.json();
        toast.success(mode === "create" ? "Document created successfully" : "Document updated successfully");
        // Clear flag before navigating
        window.onbeforeunload = null;
        navigate(`/documents/${data.id || docId}`);
      } else {
        toast.error("Failed to save document");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Helper to add steps
  const addStep = (type: "procedure" | "jsa" | "checklist" | "controls") => {
    if (type === "procedure") {
      setFormData({
        ...formData,
        procedureSteps: [
          ...formData.procedureSteps,
          { order: formData.procedureSteps.length + 1, action: "", safetyNote: "", qualityNote: "" }
        ]
      });
    } else if (type === "jsa") {
      setFormData({
        ...formData,
        jsaSteps: [
          ...formData.jsaSteps,
          { order: formData.jsaSteps.length + 1, taskDescription: "", potentialHazards: "", controlMeasures: "", preRiskRating: "low", postRiskRating: "low" }
        ]
      });
    } else if (type === "checklist") {
      setFormData({
        ...formData,
        checklistItems: [
          ...formData.checklistItems,
          { order: formData.checklistItems.length + 1, requirement: "", frequency: "daily" }
        ]
      });
    } else if (type === "controls") {
      setFormData({
        ...formData,
        criticalControls: [
          ...formData.criticalControls,
          { name: "", verificationMethod: "", frequency: "Weekly", status: "active" }
        ]
      });
    }
  };

  const removeStep = (type: "procedure" | "jsa" | "checklist" | "controls", index: number) => {
    if (type === "procedure") {
      const news = formData.procedureSteps.filter((_: any, i: number) => i !== index);
      setFormData({ ...formData, procedureSteps: news.map((s: any, i: number) => ({ ...s, order: i + 1 })) });
    } else if (type === "jsa") {
      const news = formData.jsaSteps.filter((_: any, i: number) => i !== index);
      setFormData({ ...formData, jsaSteps: news.map((s: any, i: number) => ({ ...s, order: i + 1 })) });
    } else if (type === "checklist") {
      const news = formData.checklistItems.filter((_: any, i: number) => i !== index);
      setFormData({ ...formData, checklistItems: news.map((s: any, i: number) => ({ ...s, order: i + 1 })) });
    } else if (type === "controls") {
      const news = formData.criticalControls.filter((_: any, i: number) => i !== index);
      setFormData({ ...formData, criticalControls: news });
    }
  };

  const toggleLibraryItem = (lib: "ppeIds" | "hazardIds" | "controlIds" | "equipmentIds", id: string) => {
    const current = formData[lib] as string[];
    if (current.includes(id)) {
      setFormData({ ...formData, [lib]: current.filter(i => i !== id) });
    } else {
      setFormData({ ...formData, [lib]: [...current, id] });
    }
  };

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  return (
    <div className="flex h-full flex-col">
      {/* AI Hazard Suggestions Modal */}
      {showAiHazardsModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4" id="ai-hazards-modal">
          <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 flex flex-col max-h-[85vh]">
            <div className="bg-red-600 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-300 animate-pulse" />
                <h3 className="font-black uppercase tracking-wider text-sm">AI Hazard Analysis</h3>
              </div>
              <button 
                onClick={() => setShowAiHazardsModal(false)}
                className="text-white hover:text-red-100 font-bold text-xs"
              >
                ✕ Close
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <p className="text-xs text-slate-500">
                The AI analyzed your task <strong className="text-slate-800">"{formData.title}"</strong> and identified the following hazard candidates. Select which hazards you want to link to your safety document:
              </p>
              
              <div className="space-y-2">
                {suggestedHazards.map((suggestion, index) => {
                  const matchedId = findClosestHazardId(suggestion);
                  const dbMatch = masterData?.hazards?.find((h: any) => h.id === matchedId);
                  const isSelected = selectedSuggestedHazards.includes(suggestion);
                  
                  return (
                    <div 
                      key={index}
                      onClick={() => {
                        setSelectedSuggestedHazards(prev => 
                          prev.includes(suggestion) 
                            ? prev.filter(s => s !== suggestion) 
                            : [...prev, suggestion]
                        );
                      }}
                      className={`p-3 rounded-lg border text-xs cursor-pointer transition-all flex items-start gap-3 ${
                        isSelected 
                          ? "bg-red-50 border-red-200 text-red-900 shadow-sm" 
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => {}} // Click handler on card handles state
                        className="mt-0.5 rounded border-slate-300 text-red-600 focus:ring-red-500"
                      />
                      <div className="flex-1 space-y-1">
                        <span className="font-semibold block">{suggestion}</span>
                        {dbMatch ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[9px] font-extrabold tracking-wide uppercase px-1.5 py-0.5 rounded-full">
                            ✓ Matches master library: "{dbMatch.name}"
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-[9px] font-extrabold tracking-wide uppercase px-1.5 py-0.5 rounded-full">
                            ⚠ No direct master library match
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="bg-slate-50 p-4 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setShowAiHazardsModal(false)}
                className="px-4 py-2 text-xs font-black uppercase text-slate-500 hover:text-slate-800"
              >
                Dismiss
              </button>
              
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAIHazards}
                  disabled={!!aiLoading}
                  className="px-3 py-2 text-xs font-black uppercase border border-slate-200 text-slate-600 hover:bg-slate-100 rounded flex items-center gap-1"
                >
                  <RefreshCw className={`h-3 w-3 ${aiLoading ? "animate-spin" : ""}`} />
                  Retry
                </button>
                
                <button
                  type="button"
                  onClick={applySelectedAiHazards}
                  className="px-4 py-2 text-xs font-black uppercase bg-red-600 hover:bg-red-700 text-white rounded shadow-md"
                >
                  Add Selected
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between border-b pb-4 mb-4">
        <div className="flex items-center gap-4">
          <Link to="/documents" className="rounded-full p-2 hover:bg-slate-100 transition-colors">
            <ArrowLeft className="h-5 w-5 text-slate-500" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-800">{mode === "create" ? "New Document Builder" : "Editing Document"}</h1>
            <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">{selectedTypeName || "Document Setup"}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {loading && <span className="text-[10px] font-bold text-blue-600 animate-pulse">SAVING REVISIONS...</span>}
          <button 
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 rounded bg-slate-900 px-6 py-2 text-xs font-black uppercase tracking-widest text-white shadow-lg transition-all hover:bg-black active:scale-[0.98]"
          >
            <Save className="h-4 w-4" /> {loading ? "Saving..." : "Save Record"}
          </button>
        </div>
      </div>

      <div className="flex flex-1 gap-6 overflow-hidden">
        {/* Navigation Sidebar for Sections */}
        <div className="w-48 space-y-1">
          <button onClick={() => setActiveTab("general")} className={`w-full rounded px-4 py-2 text-left text-xs font-bold uppercase tracking-tight transition-colors ${activeTab === "general" ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "text-slate-500 hover:bg-slate-100"}`}>General Info</button>
          <button onClick={() => setActiveTab("requirements")} className={`w-full rounded px-4 py-2 text-left text-xs font-bold uppercase tracking-tight transition-colors ${activeTab === "requirements" ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "text-slate-500 hover:bg-slate-100"}`}>PPE & Hazards</button>
          <button onClick={() => setActiveTab("training")} className={`w-full rounded px-4 py-2 text-left text-xs font-bold uppercase tracking-tight transition-colors ${activeTab === "training" ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "text-slate-500 hover:bg-slate-100"}`}>Training Config</button>
          
          {(selectedTypeName === "SOP" || selectedTypeName === "Work Instruction") && (
            <button onClick={() => setActiveTab("procedure")} className={`w-full rounded px-4 py-2 text-left text-xs font-bold uppercase tracking-tight transition-colors ${activeTab === "procedure" ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "text-slate-500 hover:bg-slate-100"}`}>{selectedTypeName === "SOP" ? "Procedure Steps" : "Work Steps"}</button>
          )}
          
          {selectedTypeName === "JSA" && (
            <button onClick={() => setActiveTab("jsa")} className={`w-full rounded px-4 py-2 text-left text-xs font-bold uppercase tracking-tight transition-colors ${activeTab === "jsa" ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "text-slate-500 hover:bg-slate-100"}`}>JSA Worksheet</button>
          )}
          
          {(selectedTypeName === "Inspection Checklist" || selectedTypeName === "Checklist") && (
            <button onClick={() => setActiveTab("checklist")} className={`w-full rounded px-4 py-2 text-left text-xs font-bold uppercase tracking-tight transition-colors ${activeTab === "checklist" ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "text-slate-500 hover:bg-slate-100"}`}>Checklist Items</button>
          )}

          {selectedTypeName === "Safety Policy" && (
            <button onClick={() => setActiveTab("policy")} className={`w-full rounded px-4 py-2 text-left text-xs font-bold uppercase tracking-tight transition-colors ${activeTab === "policy" ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "text-slate-500 hover:bg-slate-100"}`}>Policy Details</button>
          )}

          {selectedTypeName === "Emergency Procedure" && (
            <button onClick={() => setActiveTab("emergency")} className={`w-full rounded px-4 py-2 text-left text-xs font-bold uppercase tracking-tight transition-colors ${activeTab === "emergency" ? "bg-red-600 text-white shadow-md shadow-red-200" : "text-red-600 hover:bg-red-50"}`}>Response Plan</button>
          )}

          {formData.sifPotential && (
            <button onClick={() => setActiveTab("sif")} className={`w-full rounded px-4 py-2 text-left text-xs font-bold uppercase tracking-tight transition-colors ${activeTab === "sif" ? "bg-red-600 text-white shadow-md shadow-red-200" : "text-red-600 hover:bg-red-50"}`}>SIF Assessment</button>
          )}

          <button onClick={() => setActiveTab("risk")} className={`w-full rounded px-4 py-2 text-left text-xs font-bold uppercase tracking-tight transition-colors ${activeTab === "risk" ? "bg-amber-600 text-white shadow-md shadow-amber-200" : "text-amber-600 hover:bg-amber-50"}`}>Risk Engine</button>
          <button onClick={() => setActiveTab("controls")} className={`w-full rounded px-4 py-2 text-left text-xs font-bold uppercase tracking-tight transition-colors ${activeTab === "controls" ? "bg-green-600 text-white shadow-md shadow-green-200" : "text-green-600 hover:bg-green-50"}`}>Critical Controls</button>
          
          <button onClick={() => setActiveTab("details")} className={`w-full rounded px-4 py-2 text-left text-xs font-bold uppercase tracking-tight transition-colors ${activeTab === "details" ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "text-slate-500 hover:bg-slate-100"}`}>Extended Info</button>
        </div>

        {/* Builder Canvas */}
        <div className="flex-1 overflow-auto rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          {activeTab === "general" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2 space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Document Title</label>
                  <input 
                    type="text" 
                    value={formData.title} 
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    className="w-full border-b border-slate-200 py-2 text-xl font-bold focus:border-blue-600 focus:outline-none"
                    placeholder="Enter descriptive title..."
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Document Number</label>
                  <input 
                    type="text" 
                    value={formData.docNumber} 
                    onChange={e => setFormData({...formData, docNumber: e.target.value})}
                    className="w-full border-b border-slate-200 py-1 font-mono text-sm focus:border-blue-600 focus:outline-none"
                    placeholder="SOP-123"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Type</label>
                  <select 
                    value={formData.typeId} 
                    onChange={e => setFormData({...formData, typeId: e.target.value})}
                    className="w-full border-b border-slate-200 py-1 text-sm focus:border-blue-600 focus:outline-none"
                  >
                    {masterData?.types?.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Department</label>
                  <select 
                    value={formData.departmentId} 
                    onChange={e => setFormData({...formData, departmentId: e.target.value})}
                    className="w-full border-b border-slate-200 py-1 text-sm focus:border-blue-600 focus:outline-none"
                  >
                    {masterData?.departments?.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Risk Level</label>
                  <select 
                    value={formData.riskLevel} 
                    onChange={e => setFormData({...formData, riskLevel: e.target.value})}
                    className="w-full border-b border-slate-200 py-1 text-sm focus:border-blue-600 focus:outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="sif">SIF Risk</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Document Owner</label>
                  <select 
                    value={formData.ownerId} 
                    onChange={e => setFormData({...formData, ownerId: e.target.value})}
                    className="w-full border-b border-slate-200 py-1 text-sm focus:border-blue-600 focus:outline-none"
                  >
                    <option value="">Select Owner...</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Effective Date</label>
                  <input 
                    type="date"
                    value={formData.effectiveDate} 
                    onChange={e => setFormData({...formData, effectiveDate: e.target.value})}
                    className="w-full border-b border-slate-200 py-1 text-sm focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Review Due Date</label>
                  <input 
                    type="date"
                    value={formData.reviewDueDate} 
                    onChange={e => setFormData({...formData, reviewDueDate: e.target.value})}
                    className="w-full border-b border-slate-200 py-1 text-sm focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-8 border-t pt-6">
                <label className="flex cursor-pointer items-center gap-3">
                  <input 
                    type="checkbox" 
                    checked={formData.sifPotential} 
                    onChange={e => setFormData({...formData, sifPotential: e.target.checked})}
                    className="h-5 w-5 rounded border-slate-300 text-red-600 focus:ring-red-500" 
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-black uppercase tracking-tighter text-red-600">SIF Potential ⚠️</span>
                    <span className="text-[10px] text-slate-500">Activates Serious Injury & Fatality assessment metadata</span>
                  </div>
                </label>
              </div>

              <div className="space-y-4 pt-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Purpose Statement</label>
                    <button 
                      onClick={() => handleAIDraft("purpose")}
                      disabled={!!aiLoading}
                      className="text-[10px] font-black uppercase text-indigo-600 flex items-center gap-1 hover:underline disabled:opacity-50"
                    >
                      {aiLoading === "purpose" ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                      Draft with AI
                    </button>
                  </div>
                  <textarea 
                    value={formData.purpose} 
                    onChange={e => setFormData({...formData, purpose: e.target.value})}
                    className="min-h-[80px] w-full rounded-lg border border-slate-200 p-3 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    placeholder="Describe why this procedure exists..."
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Scope</label>
                    <button 
                      onClick={() => handleAIDraft("scope")}
                      disabled={!!aiLoading}
                      className="text-[10px] font-black uppercase text-indigo-600 flex items-center gap-1 hover:underline disabled:opacity-50"
                    >
                      {aiLoading === "scope" ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                      Identify Scope
                    </button>
                  </div>
                  <textarea 
                    value={formData.scope} 
                    onChange={e => setFormData({...formData, scope: e.target.value})}
                    className="min-h-[80px] w-full rounded-lg border border-slate-200 p-3 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    placeholder="Who does this apply to? What activities are included?"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "requirements" && (
            <div className="space-y-8">
              <section>
                <div className="mb-4 flex items-center justify-between border-b pb-2">
                  <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-800">
                    <Shield className="h-4 w-4" /> Required PPE Library
                  </h3>
                  <span className="text-[10px] font-bold text-slate-400">{formData.ppeIds.length} SELECTED</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {masterData?.ppe?.map((p: any) => (
                    <button
                      key={p.id}
                      onClick={() => toggleLibraryItem("ppeIds", p.id)}
                      className={`rounded px-3 py-2 text-[10px] font-bold transition-all ${
                        formData.ppeIds.includes(p.id)
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                          : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </section>

              <section>
                <div className="mb-4 flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-4">
                    <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-800 text-red-600">
                      <AlertTriangle className="h-4 w-4" /> Hazard Landscape
                    </h3>
                    <button 
                      onClick={handleAIHazards}
                      disabled={!!aiLoading}
                      className="text-[10px] font-black uppercase text-red-600 flex items-center gap-1 hover:underline disabled:opacity-50"
                    >
                      {aiLoading === "hazards" ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                      IDENTIFY HAZARDS
                    </button>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">{formData.hazardIds.length} SELECTED</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {masterData?.hazards?.map((h: any) => (
                    <button
                      key={h.id}
                      onClick={() => toggleLibraryItem("hazardIds", h.id)}
                      className={`rounded px-3 py-2 text-[10px] font-bold transition-all ${
                        formData.hazardIds.includes(h.id)
                          ? "bg-red-600 text-white shadow-lg shadow-red-200"
                          : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {h.name}
                    </button>
                  ))}
                </div>
              </section>

              <section>
                <div className="mb-4 flex items-center justify-between border-b pb-2">
                  <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-800">
                    <Wrench className="h-4 w-4" /> Equipment & Tools
                  </h3>
                  <span className="text-[10px] font-bold text-slate-400">{formData.equipmentIds.length} SELECTED</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {masterData?.equipment?.map((e: any) => (
                    <button
                      key={e.id}
                      onClick={() => toggleLibraryItem("equipmentIds", e.id)}
                      className={`rounded px-3 py-2 text-[10px] font-bold transition-all ${
                        formData.equipmentIds.includes(e.id)
                          ? "bg-slate-800 text-white shadow-lg shadow-slate-200"
                          : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {e.name}
                    </button>
                  ))}
                </div>
              </section>
            </div>
          )}

          {activeTab === "training" && (
            <div className="space-y-6">
               <div className="border-b pb-4 mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">Training & Compliance Setup</h3>
                    <p className="text-xs text-slate-500 font-medium mt-1">Configure how operators are trained and verified on this document.</p>
                  </div>
                  <button 
                    onClick={() => handleAIDraft("purpose")} // Placeholder logic for now, could be specific handleAIQuiz
                    disabled={!!aiLoading}
                    className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg border border-indigo-100 hover:bg-indigo-100 transition text-[10px] font-black uppercase disabled:opacity-50"
                  >
                    {aiLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <BrainCircuit className="h-4 w-4" />}
                    AI QUIZ GENERATOR
                  </button>
               </div>
               
               <div className="space-y-6 max-w-2xl">
                 <label className="flex items-start gap-4 p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition">
                   <div className="mt-1">
                     <input 
                       type="checkbox" 
                       checked={formData.requiredTraining} 
                       onChange={e => setFormData({...formData, requiredTraining: e.target.checked})}
                       className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" 
                     />
                   </div>
                   <div className="flex flex-col">
                     <span className="text-sm font-black uppercase tracking-tight text-slate-800">Enable Training Tracking</span>
                     <span className="text-xs text-slate-500 mt-1">If enabled, this document will be included in the training matrix and tracked for completion.</span>
                   </div>
                 </label>
                 
                 {formData.requiredTraining && (
                   <div className="pl-6 space-y-4 border-l-2 border-blue-100 ml-2">
                     <label className="flex items-center gap-3 cursor-pointer">
                       <input 
                         type="checkbox" 
                         checked={formData.requiresAcknowledgment} 
                         onChange={e => setFormData({...formData, requiresAcknowledgment: e.target.checked})}
                         className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" 
                       />
                       <span className="text-xs font-bold text-slate-700">Require Digital Acknowledgment (Read & Understood)</span>
                     </label>
                     <label className="flex items-center gap-3 cursor-pointer">
                       <input 
                         type="checkbox" 
                         checked={formData.requiresVerification} 
                         onChange={e => setFormData({...formData, requiresVerification: e.target.checked})}
                         className="h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500" 
                       />
                       <span className="text-xs font-bold text-slate-700">Require Supervisor Practical Verification</span>
                     </label>
                     
                     <div className="space-y-2 mt-4 pt-4 border-t border-slate-100">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Refresher Frequency (Months)</label>
                        <select 
                          className="w-full border-b border-slate-200 py-2 text-sm focus:border-blue-600 focus:outline-none"
                          value={formData.refresherFreqMonths || ""}
                          onChange={e => setFormData({...formData, refresherFreqMonths: e.target.value ? parseInt(e.target.value, 10) : 0})}
                        >
                          <option value="">No Refresher Required</option>
                          <option value="6">6 Months</option>
                          <option value="12">12 Months (Annual)</option>
                          <option value="24">24 Months (Bi-Annual)</option>
                          <option value="36">36 Months</option>
                        </select>
                        <p className="text-[10px] text-slate-400">How often operators must re-validate their competency.</p>
                     </div>
                   </div>
                 )}
               </div>
            </div>
          )}

          {activeTab === "procedure" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2 text-xs font-black uppercase tracking-widest text-slate-800">
                <div className="flex items-center gap-4">
                  <span>Standard Operating Procedure Steps</span>
                  <button 
                    onClick={() => handleAIDraft("sop")}
                    disabled={!!aiLoading}
                    className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100 hover:bg-indigo-100 transition disabled:opacity-50"
                  >
                    {aiLoading === "sop" ? <RefreshCw className="h-3 w-3 animate-spin" /> : <BrainCircuit className="h-3 w-3" />}
                    AUTOGENERATE STEPS
                  </button>
                </div>
                <button 
                  onClick={() => addStep("procedure")}
                  className="flex items-center gap-1.5 text-blue-600 hover:underline"
                >
                  <Plus className="h-3 w-3" /> ADD STEP
                </button>
              </div>

              {formData.procedureSteps.length === 0 ? (
                <div className="flex h-32 flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-100">
                  <p className="text-[10px] font-bold uppercase text-slate-400">No steps defined. Click Add Step to begin.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {formData.procedureSteps.map((step: any, idx: number) => (
                    <div key={idx} className="group flex gap-4 rounded-lg bg-slate-50/50 p-4 transition-colors hover:bg-slate-50">
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded bg-slate-800 text-[10px] font-black text-white">
                          {idx + 1}
                        </div>
                        <GripVertical className="h-4 w-4 cursor-grab text-slate-300 active:cursor-grabbing" />
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <input 
                            placeholder="Step Title (Optional)" 
                            className="w-full border-b border-transparent bg-transparent py-1 text-xs font-bold uppercase tracking-tight focus:border-blue-600 focus:outline-none"
                            value={step.title || ""}
                            onChange={e => {
                              const news = [...formData.procedureSteps];
                              news[idx].title = e.target.value;
                              setFormData({...formData, procedureSteps: news});
                            }}
                          />
                          <button 
                            onClick={() => removeStep("procedure", idx)}
                            className="flex items-center justify-end text-slate-300 transition-colors hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <textarea 
                          placeholder="What is the required action?"
                          className="min-h-[60px] w-full rounded border border-slate-200 bg-white p-2 text-sm focus:border-blue-600 focus:outline-none"
                          value={step.action}
                          onChange={e => {
                            const news = [...formData.procedureSteps];
                            news[idx].action = e.target.value;
                            setFormData({...formData, procedureSteps: news});
                          }}
                        />
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-1">
                              <label className="text-[10px] font-bold uppercase text-red-600">⚠️ Safety Notes</label>
                              <input 
                                className="w-full rounded border border-red-100 bg-red-50/30 px-2 py-1 text-xs focus:border-red-600 focus:outline-none"
                                value={step.safetyNote || ""}
                                onChange={e => {
                                  const news = [...formData.procedureSteps];
                                  news[idx].safetyNote = e.target.value;
                                  setFormData({...formData, procedureSteps: news});
                                }}
                              />
                           </div>
                           <div className="space-y-1">
                              <label className="text-[10px] font-bold uppercase text-blue-600">✓ Quality Check</label>
                              <input 
                                className="w-full rounded border border-blue-100 bg-blue-50/30 px-2 py-1 text-xs focus:border-blue-600 focus:outline-none"
                                value={step.qualityNote || ""}
                                onChange={e => {
                                  const news = [...formData.procedureSteps];
                                  news[idx].qualityNote = e.target.value;
                                  setFormData({...formData, procedureSteps: news});
                                }}
                              />
                           </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "jsa" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2 text-xs font-black uppercase tracking-widest text-slate-800">
                <div className="flex items-center gap-4">
                  <span>Job Safety Analysis Matrix</span>
                  <button 
                    onClick={() => handleAIDraft("jsa")}
                    className="flex items-center gap-1.5 bg-orange-50 text-orange-700 px-2 py-0.5 rounded border border-orange-100 hover:bg-orange-100 transition"
                  >
                    <Sparkles className="h-3 w-3" /> AI GENERATE JSA
                  </button>
                </div>
                <button 
                  onClick={() => addStep("jsa")}
                  className="flex items-center gap-1.5 text-blue-600 hover:underline"
                >
                  <Plus className="h-3 w-3" /> ADD TASK
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-2 w-12 text-center">#</th>
                      <th className="px-3 py-2">Job Step / Task</th>
                      <th className="px-3 py-2">Potential Hazards</th>
                      <th className="px-3 py-2">Control Measures</th>
                      <th className="px-3 py-2 w-20 text-center">Risk</th>
                      <th className="px-3 py-2 w-12"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.jsaSteps.map((step: any, idx: number) => (
                      <tr key={idx} className="border-b transition-colors hover:bg-slate-50">
                        <td className="px-3 py-4 text-center font-black text-slate-300">{idx + 1}</td>
                        <td className="px-3 py-4">
                          <textarea 
                            className="w-full bg-transparent p-0 text-xs focus:outline-none focus:ring-0" 
                            rows={2}
                            value={step.taskDescription}
                            onChange={e => {
                              const news = [...formData.jsaSteps];
                              news[idx].taskDescription = e.target.value;
                              setFormData({...formData, jsaSteps: news});
                            }}
                          />
                        </td>
                        <td className="px-3 py-4">
                          <textarea 
                            className="w-full bg-transparent p-0 text-[10px] text-red-600 placeholder:text-red-200 focus:outline-none" 
                            rows={2}
                            placeholder="e.g. Pinch points, falling loads..."
                            value={step.potentialHazards}
                            onChange={e => {
                              const news = [...formData.jsaSteps];
                              news[idx].potentialHazards = e.target.value;
                              setFormData({...formData, jsaSteps: news});
                            }}
                          />
                        </td>
                        <td className="px-3 py-4">
                          <textarea 
                            className="w-full bg-transparent p-0 text-[10px] text-green-700 placeholder:text-green-200 focus:outline-none" 
                            rows={2}
                            placeholder="e.g. Ensure clear path, two person lift..."
                            value={step.controlMeasures}
                            onChange={e => {
                              const news = [...formData.jsaSteps];
                              news[idx].controlMeasures = e.target.value;
                              setFormData({...formData, jsaSteps: news});
                            }}
                          />
                        </td>
                        <td className="px-3 py-4">
                          <select 
                            className="rounded border border-slate-200 p-1 text-[10px] focus:outline-none"
                            value={step.postRiskRating || "low"}
                            onChange={e => {
                              const news = [...formData.jsaSteps];
                              news[idx].postRiskRating = e.target.value;
                              setFormData({...formData, jsaSteps: news});
                            }}
                          >
                            <option value="low">L</option>
                            <option value="mod">M</option>
                            <option value="high">H</option>
                          </select>
                        </td>
                        <td className="px-3 py-4 text-right">
                           <button onClick={() => removeStep("jsa", idx)}>
                              <Trash2 className="h-3 w-3 text-slate-300 hover:text-red-600" />
                           </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "checklist" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2 text-xs font-black uppercase tracking-widest text-slate-800">
                <span>Inspection Items</span>
                <button 
                  onClick={() => addStep("checklist")}
                  className="flex items-center gap-1.5 text-blue-600 hover:underline"
                >
                  <Plus className="h-3 w-3" /> ADD ITEM
                </button>
              </div>

              {formData.checklistItems.length === 0 ? (
                <div className="flex h-32 flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-100">
                  <p className="text-[10px] font-bold uppercase text-slate-400">No items defined.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {formData.checklistItems.map((item: any, idx: number) => (
                    <div key={idx} className="flex gap-4 rounded border border-slate-100 p-3 items-center">
                      <div className="text-[10px] font-black text-slate-300 w-6">{idx + 1}</div>
                      <div className="flex-1 grid grid-cols-4 gap-4">
                        <div className="col-span-3">
                           <input 
                              placeholder="Requirement / Inspection Point" 
                              className="w-full border-b border-slate-100 bg-transparent py-1 text-sm focus:border-blue-600 focus:outline-none"
                              value={item.requirement}
                              onChange={e => {
                                const news = [...formData.checklistItems];
                                news[idx].requirement = e.target.value;
                                setFormData({...formData, checklistItems: news});
                              }}
                           />
                        </div>
                        <div>
                           <select 
                              className="w-full text-[10px] font-bold uppercase p-1 border-b focus:outline-none"
                              value={item.frequency || "daily"}
                              onChange={e => {
                                const news = [...formData.checklistItems];
                                news[idx].frequency = e.target.value;
                                setFormData({...formData, checklistItems: news});
                              }}
                           >
                              <option value="daily">Daily</option>
                              <option value="weekly">Weekly</option>
                              <option value="monthly">Monthly</option>
                              <option value="quarterly">Quarterly</option>
                           </select>
                        </div>
                      </div>
                      <button onClick={() => removeStep("checklist", idx)}>
                        <Trash2 className="h-4 w-4 text-slate-300 hover:text-red-600" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "policy" && (
            <div className="space-y-6">
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Policy Statement</label>
                  <textarea 
                    value={formData.purpose} 
                    onChange={e => setFormData({...formData, purpose: e.target.value})}
                    className="min-h-[120px] w-full rounded-lg border border-slate-200 p-3 text-sm font-medium focus:border-blue-600 focus:outline-none"
                    placeholder="Enter the primary policy statement / commitment..."
                  />
               </div>
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Enforcement & Compliance</label>
                  <textarea 
                    className="min-h-[100px] w-full rounded-lg border border-slate-200 p-3 text-sm focus:border-blue-600 focus:outline-none"
                    placeholder="Describe how this policy is enforced and the consequences for non-compliance..."
                    value={formData.responsibilities}
                    onChange={e => setFormData({...formData, responsibilities: e.target.value})}
                  />
               </div>
            </div>
          )}

          {activeTab === "emergency" && (
            <div className="space-y-6">
               <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Alarm / Notification Method</label>
                    <input 
                      className="w-full border-b border-slate-200 py-2 text-sm focus:border-red-600 focus:outline-none"
                      placeholder="e.g. Foghorn, Radio Channel 1..."
                      value={formData.definitions}
                      onChange={e => setFormData({...formData, definitions: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Immediate Actions</label>
                    <textarea 
                      className="w-full rounded border border-slate-200 p-3 text-sm focus:border-red-600 focus:outline-none"
                      rows={3}
                      placeholder="What should be done in the first 60 seconds?"
                      value={formData.purpose}
                      onChange={e => setFormData({...formData, purpose: e.target.value})}
                    />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Evacuation & Muster Point</label>
                    <textarea 
                      className="w-full rounded border border-slate-200 p-3 text-sm focus:border-red-600 focus:outline-none"
                      rows={2}
                      placeholder="Explain where to go and who to report to..."
                      value={formData.scope}
                      onChange={e => setFormData({...formData, scope: e.target.value})}
                    />
                  </div>
               </div>
            </div>
          )}

          {activeTab === "sif" && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="flex items-center gap-3 border-b-2 border-red-600 pb-2">
                <Shield className="h-5 w-5 text-red-600" />
                <h2 className="text-sm font-black uppercase tracking-widest text-slate-800">SIF Potential Assessment</h2>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="rounded-lg bg-red-50 p-4 border border-red-100">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-red-800 mb-3">SIF Potential Indicators</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700">Does this task have FATALITY potential?</label>
                        <input 
                          type="checkbox" 
                          checked={formData.sifDetails.fatalityPotential}
                          onChange={e => setFormData({
                            ...formData, 
                            sifDetails: { ...formData.sifDetails, fatalityPotential: e.target.checked },
                            sifPotential: e.target.checked || formData.sifDetails.lifeAlteringPotential
                          })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700">Does this have LIFE-ALTERING potential?</label>
                        <input 
                          type="checkbox" 
                          checked={formData.sifDetails.lifeAlteringPotential}
                          onChange={e => setFormData({
                            ...formData, 
                            sifDetails: { ...formData.sifDetails, lifeAlteringPotential: e.target.checked },
                            sifPotential: formData.sifDetails.fatalityPotential || e.target.checked
                          })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Primary Energy Source / Hazard Type</label>
                    <select 
                      value={formData.sifDetails.energySource}
                      onChange={e => setFormData({...formData, sifDetails: {...formData.sifDetails, energySource: e.target.value}})}
                      className="w-full rounded border border-slate-200 p-2 text-sm focus:border-red-600 focus:outline-none"
                    >
                      <option value="">Select Category...</option>
                      <option value="Gravity (Fall from height)">Gravity (Fall from height)</option>
                      <option value="Mechanical (Pinch points)">Mechanical (Pinch points)</option>
                      <option value="Electrical">Electrical</option>
                      <option value="Chemical">Chemical</option>
                      <option value="Pressure">Pressure</option>
                      <option value="Thermal">Thermal</option>
                    </select>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Critical Risk Framework</label>
                    <input 
                      className="w-full rounded border border-slate-200 p-2 text-sm focus:border-red-600 focus:outline-none"
                      placeholder="e.g. Line of Fire, LOTO..."
                      value={formData.sifDetails.criticalRiskCategory}
                      onChange={e => setFormData({...formData, sifDetails: {...formData.sifDetails, criticalRiskCategory: e.target.value}})}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Potential SIF Outcome</label>
                    <textarea 
                      className="w-full rounded border border-slate-200 p-2 text-sm focus:border-red-600 focus:outline-none"
                      rows={3}
                      placeholder="Describe the worst-case scenario..."
                      value={formData.sifDetails.potentialOutcome}
                      onChange={e => setFormData({...formData, sifDetails: {...formData.sifDetails, potentialOutcome: e.target.value}})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Control Gaps & Identified Needs</label>
                    <textarea 
                      className="w-full rounded border border-slate-200 p-2 text-sm focus:border-red-600 focus:outline-none"
                      rows={3}
                      placeholder="Leadership comments or identified gaps..."
                      value={formData.sifDetails.controlVerification}
                      onChange={e => setFormData({...formData, sifDetails: {...formData.sifDetails, controlVerification: e.target.value}})}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "risk" && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="flex items-center gap-3 border-b-2 border-amber-600 pb-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <h2 className="text-sm font-black uppercase tracking-widest text-slate-800">Advanced Risk Matrix Engine</h2>
              </div>

              <div className="grid grid-cols-2 gap-12">
                {/* Pre-Control */}
                <div className="space-y-6 rounded-xl bg-slate-50 p-6 border border-slate-100">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b pb-2">Pre-Control Assessment (Inherit)</h3>
                  <div className="space-y-4">
                    {[
                      { label: "Severity (Inherent)", field: "severity", value: formData.riskAssessments[0].preSeverity },
                      { label: "Likelihood (Exposure Probability)", field: "likelihood", value: formData.riskAssessments[0].preLikelihood },
                      { label: "ExposureFrequency", field: "exposure", value: formData.riskAssessments[0].preExposure }
                    ].map(row => (
                      <div key={row.field} className="space-y-1.5">
                        <div className="flex justify-between text-[10px] font-bold">
                          <label className="uppercase text-slate-600">{row.label}</label>
                          <span className="text-blue-600">{row.value}</span>
                        </div>
                        <input 
                          type="range" min="1" max="5" step="1"
                          value={row.value}
                          onChange={e => calculateRisk(row.field, parseInt(e.target.value), true)}
                          className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t">
                    <span className="text-[10px] font-black uppercase text-slate-400">Total Score</span>
                    <span className="text-2xl font-black text-slate-800">{formData.riskAssessments[0].preScore}</span>
                  </div>
                </div>

                {/* Post-Control */}
                <div className="space-y-6 rounded-xl bg-blue-50/30 p-6 border border-blue-100">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-400 border-b pb-2">Post-Control Assessment (Residual)</h3>
                  <div className="space-y-4">
                    {[
                      { label: "Residual Severity", field: "severity", value: formData.riskAssessments[0].postSeverity },
                      { label: "Residual Likelihood", field: "likelihood", value: formData.riskAssessments[0].postLikelihood },
                      { label: "Residual Exposure", field: "exposure", value: formData.riskAssessments[0].postExposure }
                    ].map(row => (
                      <div key={row.field} className="space-y-1.5">
                        <div className="flex justify-between text-[10px] font-bold">
                          <label className="uppercase text-slate-600">{row.label}</label>
                          <span className="text-blue-600">{row.value}</span>
                        </div>
                        <input 
                          type="range" min="1" max="5" step="1"
                          value={row.value}
                          onChange={e => calculateRisk(row.field, parseInt(e.target.value), false)}
                          className="w-full h-1.5 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t">
                    <span className="text-[10px] font-black uppercase text-blue-400">Residual Score</span>
                    <span className="text-2xl font-black text-blue-900">{formData.riskAssessments[0].postScore}</span>
                  </div>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-6">
                <div className="rounded-lg border border-slate-100 p-4 text-center">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Risk Reduction</p>
                  <p className="text-3xl font-black text-green-600">{formData.riskAssessments[0].riskReduction}%</p>
                </div>
                <div className="rounded-lg border border-slate-100 p-4 text-center">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Risk Level</p>
                  <p className={`text-xl font-black uppercase tracking-widest ${
                    formData.riskLevel === "critical" ? "text-red-700" :
                    formData.riskLevel === "high" ? "text-red-600" :
                    formData.riskLevel === "medium" ? "text-amber-600" : "text-green-600"
                  }`}>
                    {formData.riskLevel}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-100 p-4 text-center">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Automatic SIF Flag</p>
                  <p className={`text-xl font-black uppercase tracking-widest ${formData.riskLevel === "critical" || formData.riskLevel === "high" ? "text-red-600" : "text-slate-300"}`}>
                    { (formData.riskLevel === "critical" || formData.riskLevel === "high") ? "POTENTIAL" : "NO FLAG" }
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "controls" && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-green-600" />
                  <h2 className="text-sm font-black uppercase tracking-widest text-slate-800">Critical Controls</h2>
                  <button 
                    onClick={handleAIControls}
                    disabled={!!aiLoading}
                    className="flex items-center gap-1.5 bg-green-50 text-green-700 px-2 py-0.5 rounded border border-green-100 hover:bg-green-100 transition disabled:opacity-50"
                  >
                    {aiLoading === "controls" ? <RefreshCw className="h-3 w-3 animate-spin" /> : <BrainCircuit className="h-3 w-3" />}
                    AI SUGGEST CONTROLS
                  </button>
                </div>
                <button 
                  onClick={() => addStep("controls")}
                  className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline"
                >
                  <Plus className="h-3 w-3" /> ADD CONTROL
                </button>
              </div>

              {formData.criticalControls.length === 0 ? (
                <div className="flex h-48 flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-100">
                  <Shield className="mb-2 h-8 w-8 text-slate-200" />
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">No critical controls defined yet.</p>
                  <p className="mt-1 text-[10px] text-slate-400">Add controls to prevent SIF energy release.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.criticalControls.map((control: any, idx: number) => (
                    <div key={idx} className="group relative rounded-xl border border-slate-100 bg-slate-50/50 p-6 transition-all hover:border-green-200 hover:bg-white hover:shadow-sm">
                      <button 
                        onClick={() => removeStep("controls", idx)}
                        className="absolute right-4 top-4 text-slate-300 opacity-0 transition-opacity hover:text-red-600 group-hover:opacity-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      
                      <div className="grid grid-cols-12 gap-6">
                        <div className="col-span-6 space-y-1.5">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Control Name</label>
                          <input 
                            className="w-full border-b border-slate-200 bg-transparent py-1 text-sm font-bold focus:border-green-600 focus:outline-none"
                            placeholder="e.g. LOTO Verification, Fall Arrest Harness..."
                            value={control.name}
                            onChange={e => {
                              const news = [...formData.criticalControls];
                              news[idx].name = e.target.value;
                              setFormData({...formData, criticalControls: news});
                            }}
                          />
                        </div>
                        <div className="col-span-4 space-y-1.5">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Verification Method</label>
                          <input 
                            className="w-full border-b border-slate-200 bg-transparent py-1 text-sm focus:border-green-600 focus:outline-none"
                            placeholder="e.g. Visual Inspection, Pull Test..."
                            value={control.verificationMethod}
                            onChange={e => {
                              const news = [...formData.criticalControls];
                              news[idx].verificationMethod = e.target.value;
                              setFormData({...formData, criticalControls: news});
                            }}
                          />
                        </div>
                        <div className="col-span-2 space-y-1.5">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Frequency</label>
                          <select 
                            className="w-full border-b border-slate-200 bg-transparent py-1 text-xs font-bold uppercase focus:outline-none"
                            value={control.frequency}
                            onChange={e => {
                              const news = [...formData.criticalControls];
                              news[idx].frequency = e.target.value;
                              setFormData({...formData, criticalControls: news});
                            }}
                          >
                            <option>Daily</option>
                            <option>Weekly</option>
                            <option>Monthly</option>
                            <option>Shiftly</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "details" && (
            <div className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Responsibilities</label>
                <textarea 
                  value={formData.responsibilities} 
                  onChange={e => setFormData({...formData, responsibilities: e.target.value})}
                  className="min-h-[100px] w-full rounded-lg border border-slate-200 p-3 text-sm focus:border-blue-600 focus:outline-none"
                  placeholder="Define keys roles and the duties assigned to each for this procedure..."
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Definitions</label>
                <textarea 
                  value={formData.definitions} 
                  onChange={e => setFormData({...formData, definitions: e.target.value})}
                  className="min-h-[100px] w-full rounded-lg border border-slate-200 p-3 text-sm focus:border-blue-600 focus:outline-none"
                  placeholder="Uncommon terms, acronyms, or specific warehouse vocabulary used in this doc..."
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">External References</label>
                <textarea 
                  value={formData.references} 
                  onChange={e => setFormData({...formData, references: e.target.value})}
                  className="min-h-[100px] w-full rounded-lg border border-slate-200 p-3 text-sm focus:border-blue-600 focus:outline-none"
                  placeholder="OSHA standards, company policies, or equipment manuals..."
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
