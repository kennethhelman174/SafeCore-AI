import { useState, useEffect } from "react";
import { GraduationCap, AlertCircle, CheckCircle, Clock, Search, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { apiRequest } from "../lib/api";
import { toast } from "sonner";

export default function TrainingDashboard() {
  const { token } = useAuth();
  const [data, setData] = useState<any>({
    stats: {
      totalAssigned: 0,
      completed: 0,
      overdue: 0,
      expired: 0,
      pendingVerification: 0,
      expiringSoon: 0
    },
    recentCompletions: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest("/api/training/dashboard")
      .then(d => {
        if (d && !d.error) {
          setData({
            stats: d.stats || {
              totalAssigned: 0,
              completed: 0,
              overdue: 0,
              expired: 0,
              pendingVerification: 0,
              expiringSoon: 0
            },
            recentCompletions: d.recentCompletions || []
          });
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Training dashboard data failed", err);
        toast.error(`Error loading training dashboard: ${err.message}`);
        setLoading(false);
      });
  }, [token]);

  if (loading) return <div className="p-8 text-center text-xs font-bold text-slate-400">Loading...</div>;

  const stats = data?.stats || { totalAssigned: 0, completed: 0, overdue: 0, expired: 0, pendingVerification: 0, expiringSoon: 0 };
  const recentCompletions = data?.recentCompletions || [];
  const completionRate = stats.totalAssigned > 0 ? Math.round((stats.completed / (stats.totalAssigned)) * 100) : 100;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black uppercase tracking-tight text-slate-900">Training Management</h1>
          <p className="text-xs font-bold text-slate-500">Facility Training Compliance & Records</p>
        </div>
        <div className="flex gap-3">
           <Link to="/training-records" className="rounded bg-indigo-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-indigo-700">My Records</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase text-slate-500">Compliance Rate</p>
          <p className={`text-2xl font-black mt-1 ${completionRate < 90 ? 'text-red-500' : 'text-green-500'}`}>{completionRate}%</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase text-slate-500">Assigned</p>
          <p className="text-2xl font-black text-slate-800 mt-1">{stats.totalAssigned}</p>
        </div>
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase text-orange-600">Pending Verification</p>
          <p className="text-2xl font-black text-orange-700 mt-1">{stats.pendingVerification}</p>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase text-red-600">Overdue</p>
          <p className="text-2xl font-black text-red-700 mt-1">{stats.overdue}</p>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase text-red-600">Expired</p>
          <p className="text-2xl font-black text-red-700 mt-1">{stats.expired}</p>
        </div>
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase text-yellow-600">Expiring soon</p>
          <p className="text-2xl font-black text-yellow-700 mt-1">{stats.expiringSoon}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
           <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">Recent Completions</h3>
              <GraduationCap className="h-4 w-4 text-slate-400" />
           </div>
           <div className="divide-y divide-slate-100">
             {recentCompletions.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 font-bold uppercase">No records</div>
             ) : (
                recentCompletions.map((r: any) => (
                  <div key={r.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
                     <div>
                        <p className="text-sm font-bold text-slate-800">{r.assignment.user.name}</p>
                        <p className="text-xs text-slate-500 font-medium">{r.assignment.document.docNumber} - {r.assignment.document.title}</p>
                     </div>
                     <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-1 rounded border border-slate-200 shadow-sm">{format(new Date(r.createdAt), "MMM d, y")}</span>
                  </div>
                ))
             )}
           </div>
        </div>
        
        <div className="rounded-xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden text-white flex flex-col justify-between">
            <div className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-indigo-400" />
                <h3 className="text-xs font-black uppercase tracking-widest">Training Actions Required</h3>
              </div>
              <p className="text-sm text-slate-400 mb-6 font-medium leading-relaxed">
                 There are pending competency verifications and overdue training assignments that require supervisor attention.
              </p>
              
              <div className="space-y-3">
                 <Link to="/training-records?view=pending" className="group border border-slate-700 bg-slate-800 rounded p-4 flex gap-4 items-center hover:bg-slate-700 transition">
                    <div className="h-2 w-2 rounded-full bg-orange-500 shrink-0"></div>
                    <div className="flex-1">
                      <p className="text-xs font-black uppercase tracking-wider text-white">Pending Competency Sign-Offs ({stats.pendingVerification})</p>
                      <p className="text-[10px] text-slate-400 font-medium">Verify employee practical knowledge</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-white" />
                 </Link>
                 <Link to="/training-records?view=overdue" className="group border border-slate-700 bg-slate-800 rounded p-4 flex gap-4 items-center hover:bg-slate-700 transition">
                    <div className="h-2 w-2 rounded-full bg-red-500 shrink-0"></div>
                    <div className="flex-1">
                      <p className="text-xs font-black uppercase tracking-wider text-white">Overdue Trainings ({stats.overdue})</p>
                      <p className="text-[10px] text-slate-400 font-medium">Follow up with employees</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-white" />
                 </Link>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
}
