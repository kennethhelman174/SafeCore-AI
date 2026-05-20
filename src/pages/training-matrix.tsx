import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Shield } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { apiRequest } from "../lib/api";

export default function TrainingMatrix() {
  const { token } = useAuth();
  const [matrix, setMatrix] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiRequest("/api/training/matrix"),
      apiRequest("/api/users")
    ])
    .then(([mResponse, _]) => {
      if (mResponse && !mResponse.error) {
        setMatrix(mResponse.matrix || []);
        setRoles(mResponse.roles || []);
      }
      setLoading(false);
    })
    .catch(err => {
      console.error(err);
      toast.error("Failed to load training matrix data");
      setLoading(false);
    });
  }, [token]);

  const toggleRequirement = async (roleId: string, documentId: string, currentlyRequired: boolean) => {
    try {
      await apiRequest("/api/training/matrix/toggle", {
        method: "POST",
        body: { roleId, documentId, required: !currentlyRequired }
      });
      // Refresh
      const m = await apiRequest("/api/training/matrix");
      if (m && !m.error) {
        setMatrix(m.matrix || []);
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to update requirement");
    }
  };

  if (loading) return <div className="p-8 text-center text-xs font-bold text-slate-400">Loading...</div>;

  return (
    <div className="space-y-6 max-w-full overflow-x-auto">
      <div className="flex items-center justify-between sticky left-0">
        <div>
          <h1 className="text-xl font-black uppercase tracking-tight text-slate-900">Training Matrix</h1>
          <p className="text-xs font-bold text-slate-500">Configure required documents per role</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-left whitespace-nowrap">
           <thead className="bg-slate-50">
             <tr>
                <th className="px-4 py-3 text-xs font-black uppercase text-slate-500 sticky left-0 bg-slate-50 z-10 border-r border-slate-200">Role</th>
                {matrix.map(doc => (
                  <th key={doc.id} className="px-4 py-3 text-[10px] font-bold text-slate-700 min-w-[200px] border-b border-slate-200" title={doc.title}>
                     <div className="flex items-center gap-1">
                        <Shield className="w-3 h-3 text-blue-500" />
                        <span className="truncate">{doc.docNumber} - {doc.title}</span>
                     </div>
                  </th>
                ))}
             </tr>
           </thead>
           <tbody className="divide-y divide-slate-100">
             {roles.map(role => (
               <tr key={role.id} className="hover:bg-slate-50/50">
                 <td className="px-4 py-3 text-xs font-bold text-slate-800 sticky left-0 bg-white group-hover:bg-slate-50/50 z-10 border-r border-slate-200">
                    {role.name}
                 </td>
                 {matrix.map(doc => {
                    const isRequired = doc.roleRequirements?.some((r: any) => r.roleId === role.id) || false;
                    return (
                      <td key={`${role.id}-${doc.id}`} className="px-4 py-3 text-center border-r border-dashed border-slate-100">
                        <input
                          type="checkbox"
                          checked={isRequired}
                          onChange={() => toggleRequirement(role.id, doc.id, isRequired)}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                    );
                 })}
               </tr>
             ))}
           </tbody>
        </table>
      </div>
    </div>
  );
}
