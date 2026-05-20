import { useState, useEffect, useMemo } from "react";
import { CheckCircle, AlertCircle, Clock, Search, ArrowRight, Shield } from "lucide-react";
import { format, isPast } from "date-fns";
import { toast } from "sonner";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { apiRequest } from "../lib/api";

export default function TrainingRecords() {
  const { token, user: authUser } = useAuth();
  const [searchParams] = useSearchParams();
  const viewFilter = searchParams.get("view"); // pending, overdue, etc.

  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUser] = useState({ name: authUser?.name || "Admin", role: authUser?.role || "Supervisor" });

  useEffect(() => {
    apiRequest("/api/users")
      .then(data => {
        if (Array.isArray(data)) {
          setUsers(data);
          const associate = data.find((u: any) => u.role?.name === "Associate" || u.role === "Associate");
          if (associate) {
             setSelectedUserId(associate.id);
          } else if (data.length > 0) {
             setSelectedUserId(data[0].id);
          }
        }
      })
      .catch((err) => {
        console.error("Users load failed", err);
        toast.error("Could not load users list");
      });
  }, [token]);

  useEffect(() => {
    if (selectedUserId) {
      setLoading(true);
      apiRequest(`/api/training/records/${selectedUserId}`)
        .then(data => {
          setAssignments(Array.isArray(data) ? data : []);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setAssignments([]);
          setLoading(false);
          toast.error("Could not load employee training assignments");
        });
    }
  }, [selectedUserId, token]);

  const filteredAssignments = useMemo(() => {
    const list = Array.isArray(assignments) ? assignments : [];
    if (!viewFilter) return list;
    
    return list.filter(a => {
      if (viewFilter === "pending") return a.status === "pending_verification";
      if (viewFilter === "overdue") return a.status === "assigned" && a.dueDate && isPast(new Date(a.dueDate));
      return true;
    });
  }, [assignments, viewFilter]);

  const handleAcknowledge = async (assignmentId: string) => {
    try {
      const data = await apiRequest(`/api/training/acknowledge/${assignmentId}`, {
         method: "POST",
         body: { userId: selectedUserId }
      });
      toast.success(data?.status === "pending_verification" ? "Sent for supervisor verification" : "Training completed");
      
      // refresh
      apiRequest(`/api/training/records/${selectedUserId}`)
        .then(data => setAssignments(Array.isArray(data) ? data : []))
        .catch(console.error);
    } catch(err: any) {
      toast.error(`Failed to acknowledge training: ${err.message}`);
    }
  };

  const handleVerify = async (assignmentId: string) => {
    try {
      await apiRequest(`/api/training/verify/${assignmentId}`, {
         method: "POST",
         body: { supervisorName: currentUser.name, notes: "Verified competency in field" }
      });
      toast.success("Competency verified");
      
      // refresh
      apiRequest(`/api/training/records/${selectedUserId}`)
        .then(data => setAssignments(Array.isArray(data) ? data : []))
        .catch(console.error);
    } catch(err: any) {
      toast.error(`Failed to verify training: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black uppercase tracking-tight text-slate-900">Training Records</h1>
          <p className="text-xs font-bold text-slate-500">View and complete assigned training</p>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
         <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Act As Employee:</span>
         <select 
            className="flex-1 rounded-lg border border-slate-200 p-2 text-sm focus:border-indigo-600 outline-none font-medium"
            value={selectedUserId}
            onChange={e => setSelectedUserId(e.target.value)}
          >
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.name} ({u.role?.name})</option>
            ))}
         </select>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs font-bold text-slate-400">Loading...</div>
      ) : (
        <div className="space-y-4">
           <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">Assigned Courses</h3>
              {viewFilter && (
                <Link to="/training-records" className="text-[10px] font-bold text-blue-600 hover:underline">Clear Filter: {viewFilter}</Link>
              )}
           </div>
           {filteredAssignments.map(a => (
             <div key={a.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                   <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${
                         a.status === 'completed' ? 'bg-green-100 text-green-700' :
                         a.status === 'pending_verification' ? 'bg-orange-100 text-orange-700' :
                         a.status === 'expired' || a.status === 'overdue' ? 'bg-red-100 text-red-700' :
                         'bg-blue-100 text-blue-700'
                      }`}>
                         {a.status.replace("_", " ")}
                      </span>
                      {a.document.requiresVerification && <span className="text-[9px] font-black uppercase text-slate-400 border border-slate-200 px-1 rounded">Eval Required</span>}
                   </div>
                   <h4 className="font-bold text-slate-800">{a.document.docNumber} - {a.document.title}</h4>
                   <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-4">
                      {a.dueDate && <span><Clock className="w-3 h-3 inline mr-1" />Due: {format(new Date(a.dueDate), "MMM d, y")}</span>}
                      {a.expiresAt && <span>Expires: {format(new Date(a.expiresAt), "MMM d, y")}</span>}
                      {a.completedAt && <span>Completed: {format(new Date(a.completedAt), "MMM d, y")}</span>}
                   </div>
                </div>
                
                <div className="flex gap-2 shrink-0">
                  <Link to={`/documents/${a.documentId}`} className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-200 hover:bg-slate-200 transition">
                     View Document
                  </Link>
                  {a.status === "assigned" && (
                     <button onClick={() => handleAcknowledge(a.id)} className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition">
                       Acknowledge
                     </button>
                  )}
                  {a.status === "pending_verification" && (
                     <button onClick={() => handleVerify(a.id)} className="px-4 py-2 bg-orange-500 text-white text-xs font-bold rounded-lg hover:bg-orange-600 transition flex items-center gap-1">
                       <Shield className="w-3 h-3" /> Approve Eval
                     </button>
                  )}
                </div>
             </div>
           ))}
           {filteredAssignments.length === 0 && <div className="text-center p-8 text-xs font-bold text-slate-400">No training found {viewFilter ? `for "${viewFilter}" filter` : "assigned"}</div>}
        </div>
      )}
    </div>
  );
}
