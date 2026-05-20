import { AlertCircle, ShieldAlert, ClipboardCheck, ArrowRight, Activity } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { apiRequest } from "../lib/api";
import { toast } from "sonner";

export function Dashboard() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [recentDocs, setRecentDocs] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalDocs: 0,
    draftDocs: 0,
    approvedDocs: 0,
    needingReview: 0,
    highRiskDocs: 0,
    openActions: 0,
    overdueActions: 0,
    sifPotentialDocs: 0,
    pendingVerifications: 0,
    docsAwaitingReview: 0,
    revisionRequests: 0,
    publishedDocs: 0
  });

  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoadingAudits, setIsLoadingAudits] = useState(true);

  useEffect(() => {
    // Basic stats from docs
    apiRequest('/api/documents')
      .then(data => {
        if (data && Array.isArray(data.data)) {
          setRecentDocs(data.data.slice(0, 5));
        }
      })
      .catch(err => {
        console.error("Dashboard docs load failed:", err);
        toast.error(`Could not load recent documents: ${err.message}`);
      });

    // Advanced Phase 3 stats
    apiRequest('/api/dashboard/stats')
      .then(data => {
        if (data) setStats(s => ({ ...s, ...data }));
      })
      .catch(err => {
        console.error("Dashboard stats load failed:", err);
        toast.error(`Could not load statistics dashboard: ${err.message}`);
      });

    // Fetch Audit Logs
    apiRequest('/api/audits/recent')
      .then(data => {
        if (Array.isArray(data)) setAuditLogs(data);
        setIsLoadingAudits(false);
      })
      .catch(err => {
        console.error("Dashboard audits load failed:", err);
        setIsLoadingAudits(false);
      });
  }, [token]);

  const getTimeAgo = (dateStr: string) => {
    const now = new Date();
    const then = new Date(dateStr);
    const diffMs = now.getTime() - then.getTime();
    const diffMin = Math.round(diffMs / 60000);
    
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin} min ago`;
    const diffHours = Math.round(diffMin / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${Math.round(diffHours / 24)} days ago`;
  };

  const getActionColor = (action: string) => {
    if (action.includes('PUBLISH') || action.includes('APPROVE') || action.includes('VERIFIED')) return 'bg-green-500';
    if (action.includes('SUBMIT') || action.includes('CREATE')) return 'bg-blue-500';
    if (action.includes('REJECT') || action.includes('FAILED') || action.includes('OVERDUE')) return 'bg-red-500';
    return 'bg-slate-400';
  };

  const formatAction = (action: string) => {
    return action.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ');
  };

  const getStatusBadge = (status: string) => {
    switch(status.toLowerCase()) {
      case 'published':
      case 'approved':
        return <span className="flex items-center gap-1.5 font-bold text-green-600 uppercase tracking-tighter">● {status}</span>;
      case 'review':
        return <span className="flex items-center gap-1.5 font-bold text-orange-500 uppercase tracking-tighter">● Review</span>;
      case 'draft':
        return <span className="flex items-center gap-1.5 font-bold text-blue-600 uppercase tracking-tighter">● Draft</span>;
      default:
        return <span className="flex items-center gap-1.5 font-bold text-slate-500 uppercase tracking-tighter">● {status}</span>;
    }
  };

  const getRiskBadge = (level: string) => {
    switch(level.toLowerCase()) {
      case 'critical':
      case 'sif':
        return <span className="rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-black text-red-700 uppercase">CRITICAL</span>;
      case 'high':
        return <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[9px] font-black text-orange-700 uppercase">HIGH</span>;
      case 'medium':
        return <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-[9px] font-black text-yellow-700 uppercase">MEDIUM</span>;
      default:
        return <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-black text-slate-700 uppercase">LOW</span>;
    }
  };

  return (
    <div className="flex flex-col gap-6 h-full overflow-y-auto pr-2">
      {/* Top KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 shrink-0" role="region" aria-label="Safety Performance Summary">
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">SIF Potential Exposure</p>
            <p className="text-4xl font-black leading-none text-red-600">{stats.sifPotentialDocs < 10 ? `0${stats.sifPotentialDocs}` : stats.sifPotentialDocs}</p>
          </div>
          <div className="flex items-center justify-between mt-4">
             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Life-Altering Risks Identified</p>
             <ShieldAlert className="h-5 w-5 text-red-100" />
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Open Corrective Actions</p>
            <p className="text-4xl font-black leading-none text-slate-800">{stats.openActions < 10 ? `0${stats.openActions}` : stats.openActions}</p>
          </div>
          <div className="mt-4">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 mb-2">
              <div className="h-full bg-blue-600 rounded-full" style={{ width: `${Math.min(100, (stats.openActions / (stats.totalDocs || 1)) * 100)}%` }}></div>
            </div>
            <p className="text-[10px] font-black uppercase text-red-500 tracking-tighter">{stats.overdueActions} IMPACTING COMPLIANCE</p>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Safe-Behavior Audits</p>
            <p className="text-4xl font-black leading-none text-green-600">{stats.pendingVerifications < 10 ? `0${stats.pendingVerifications}` : stats.pendingVerifications}</p>
          </div>
          <p className="text-[10px] font-bold uppercase text-slate-400 mt-4 tracking-tight">Active Field Verifications</p>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-amber-50/50 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-amber-600 mb-1">Critical Risk Specs</p>
            <p className="text-4xl font-black leading-none text-amber-700">{stats.highRiskDocs < 10 ? `0${stats.highRiskDocs}` : stats.highRiskDocs}</p>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase text-amber-600/60 mt-4 tracking-widest">
             <AlertCircle className="h-4 w-4" /> HIGH VIGILANCE ZONE
          </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">
        {/* Main Middle Section: Review Pipeline */}
        <div className="col-span-12 lg:col-span-8 flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-50 px-6 py-5">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">Critical Control & Review Pipeline</h3>
            <Link to="/documents" className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-800 transition-colors">Registry Access →</Link>
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/70 text-[10px] font-black uppercase tracking-widest text-slate-400 sticky top-0 relative z-10 backdrop-blur-sm">
                <tr>
                  <th className="border-b border-slate-50 px-6 py-4">Security ID</th>
                  <th className="border-b border-slate-50 px-6 py-4">Managed Record Title</th>
                  <th className="border-b border-slate-50 px-6 py-4 text-center">Inherent Risk</th>
                  <th className="border-b border-slate-50 px-6 py-4 text-center">Lifecycle</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {recentDocs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="h-40 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest">Scanning Registry Database...</td>
                  </tr>
                ) : (
                  recentDocs.map(doc => (
                    <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors cursor-pointer border-b border-slate-50 last:border-0 group" onClick={() => navigate(`/documents/${doc.id}`)}>
                      <td className="px-6 py-4 font-mono text-[10px] font-bold text-slate-400 group-hover:text-blue-500 transition-colors">{doc.docNumber}</td>
                      <td className="px-6 py-4">
                         <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 group-hover:text-black">{doc.title}</span>
                            {doc.sifPotential && <span className="rounded px-1.5 py-0.5 text-[8px] font-black text-rose-600 bg-rose-50 border border-rose-100 uppercase tracking-tighter">SIF POTENTIAL</span>}
                         </div>
                      </td>
                      <td className="px-6 py-4 text-center">{getRiskBadge(doc.riskLevel)}</td>
                      <td className="px-6 py-4">{getStatusBadge(doc.status.name)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Risk Matrix Heatmap Area */}
        <div 
          onClick={() => navigate("/risks")}
          className="col-span-12 lg:col-span-4 flex flex-col rounded-2xl border border-slate-200 bg-white p-8 shadow-sm cursor-pointer hover:border-blue-300 transition-all group"
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
               <Activity className="h-4 w-4 text-slate-300" /> Site Risk Distribution Heatmap
            </h3>
            <ArrowRight className="h-3 w-3 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
          </div>
          <div className="relative flex-1 grid grid-cols-5 grid-rows-5 gap-2 border-b-2 border-l-2 border-slate-200/60 pb-2 pl-2">
            {[...Array(25)].map((_, i) => {
              let color = "bg-green-100";
              if (i < 5 || i % 5 === 4) color = "bg-rose-500/80 shadow-inner";
              else if (i < 10 || i % 5 === 3) color = "bg-orange-500/80 shadow-inner";
              else if (i < 15 || i % 5 === 2) color = "bg-amber-400/80 shadow-inner";
              else color = "bg-emerald-400/80 shadow-inner";
              
              return (
                <div key={i} className={`rounded-md transition-all group-hover:scale-95 hover:!scale-110 active:scale-90 ${color}`}></div>
              );
            })}
            
            <div className="absolute -left-10 top-1/2 -rotate-90 text-[7px] font-black uppercase tracking-widest text-slate-400">Hazard Gravity</div>
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[7px] font-black uppercase tracking-widest text-slate-400">Probabilistic Outcome</div>
          </div>
          <div className="mt-10 flex flex-col gap-3 border-t border-slate-50 pt-6">
             <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em]">Risk Remediation Engine</p>
             <div className="flex items-center justify-between rounded-xl bg-slate-900 p-3 shadow-lg shadow-slate-900/10">
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tight">Active Critical Mitigation</span>
                <span className="text-[10px] font-black text-rose-400 uppercase bg-rose-500/10 px-2 py-0.5 rounded-lg">{stats.highRiskDocs} SHIELDS ACTIVE</span>
             </div>
          </div>
        </div>

        {/* Bottom Section: Audit Trail and Workflow */}
        <div className="col-span-12 lg:col-span-4 flex flex-col rounded-2xl bg-amber-950 p-8 text-white shadow-xl shadow-slate-200/50">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-amber-400" />
              <h3 className="text-xs font-black uppercase tracking-widest">Control Workflow</h3>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-md">
               <p className="text-[9px] font-black uppercase text-white/40 tracking-widest mb-1">Live Records</p>
               <p className="text-3xl font-black text-amber-400">{stats.publishedDocs}</p>
            </div>
            <div className="bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-md">
               <p className="text-[9px] font-black uppercase text-white/40 tracking-widest mb-1">Awaiting Sign</p>
               <p className="text-3xl font-black text-orange-400">{stats.docsAwaitingReview}</p>
            </div>
          </div>
          <button 
            onClick={() => navigate("/documents")}
            className="group flex w-full items-center justify-between rounded-xl bg-amber-600 p-4 transition-all hover:bg-amber-500 hover:translate-y-[-2px] tracking-widest mt-auto shadow-lg shadow-amber-950/40 font-black uppercase text-[10px]"
          >
            <div className="text-left">
              <p>Review Pipeline</p>
              <p className="opacity-60 text-[8px] font-bold">{stats.revisionRequests} Critical Feedback Loops</p>
            </div>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        <div className="col-span-12 lg:col-span-8 flex flex-col rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
               <Activity className="h-4 w-4 text-blue-500" /> Site Security Audit Trail
            </h3>
            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Real-time Synchronization</span>
          </div>
          <div className="space-y-6 overflow-y-auto max-h-[300px] pr-4 custom-scrollbar">
            {isLoadingAudits ? (
              <div className="flex h-32 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-blue-500"></div>
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 opacity-30 gap-2">
                 <ShieldAlert className="h-8 w-8 text-slate-400" />
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Quiet in the security sector</p>
              </div>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-5 group">
                  <div className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${getActionColor(log.action)} ring-4 ring-slate-50 group-hover:scale-125 transition-transform`}></div>
                  <div className="flex-1 border-b border-slate-50 pb-4 group-last:border-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[11px] font-black uppercase text-slate-900 tracking-tight">{formatAction(log.action)}</p>
                      <span className="text-[9px] font-bold text-slate-400 uppercase bg-slate-50 px-2 py-0.5 rounded-md">{getTimeAgo(log.createdAt)}</span>
                    </div>
                    <p className="text-[11px] font-semibold text-slate-500 leading-tight mb-2">
                      <span className="text-slate-400 font-bold">{log.entity}:</span> {log.entityId.substring(0, 8)} - System Mutation Logged
                    </p>
                    <div className="flex items-center gap-2">
                       <div className="h-4 w-4 rounded-full bg-slate-100 flex items-center justify-center text-[7px] font-black text-slate-500">
                          {log.userId.charAt(0).toUpperCase()}
                       </div>
                       <p className="text-[9px] font-black uppercase text-slate-400 tracking-tighter transition-colors group-hover:text-slate-600">Operator ID: {log.userId.substring(0, 12)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
