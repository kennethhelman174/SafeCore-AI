import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Search, Plus, Trash2, Edit2, ShieldCheck, Tag, Info, X, RefreshCw } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";

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
