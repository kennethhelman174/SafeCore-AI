import React, { useState, useEffect } from "react";
import { 
  ShieldAlert, Activity, FileText, Users, Lock, 
  Database, Cpu, Clock, AlertCircle, CheckCircle2,
  Download, RefreshCcw, Search, Filter, Trash2
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
import { exportToCSV } from "../lib/exportUtils";
import { apiRequest } from "../lib/api";

export default function AdminDashboard() {
  const { token } = useAuth();
  const [health, setHealth] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [healthData, logsData] = await Promise.all([
        apiRequest("/api/admin/system-health"),
        apiRequest("/api/admin/audit-logs")
      ]);
      
      if (healthData) setHealth(healthData);
      if (logsData) setLogs(logsData);
    } catch (error: any) {
      toast.error(`Failed to fetch admin data: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleExportLogs = () => {
    exportToCSV(logs, `SafeCore_Audit_Logs_${new Date().toISOString().split('T')[0]}`);
    toast.success("Security logs exported as CSV successfully");
  };

  const filteredLogs = logs.filter(l => 
    l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.entity.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-200 pb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900 flex items-center gap-3">
            <ShieldAlert className="h-8 w-8 text-amber-600" /> Security & System Health
          </h1>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Enterprise Infrastructure Governance Hub</p>
        </div>
        <div className="flex gap-2">
          <button 
             onClick={fetchData}
             className="flex items-center gap-2 bg-slate-100 text-slate-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition border border-slate-200"
          >
            <RefreshCcw className="h-4 w-4" /> Refresh Diagnostics
          </button>
          <button 
             onClick={handleExportLogs}
             className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition shadow-lg shadow-slate-900/20"
          >
            <Download className="h-4 w-4" /> CSV Export Security Logs
          </button>
        </div>
      </div>

      {/* Health Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <HealthCard 
          title="Database Status" 
          status={health?.database || "Checking..."} 
          icon={Database} 
          color={health?.database === "Running" ? "text-emerald-500" : "text-amber-500"} 
        />
        <HealthCard 
          title="AI Mesh Status" 
          status={health?.aiService || "Checking..."} 
          icon={Cpu} 
          color={health?.aiService === "Connected" ? "text-blue-500" : "text-rose-500"} 
        />
        <HealthCard 
          title="System Version" 
          status={health?.version || "1.9.0"} 
          icon={Activity} 
          color="text-indigo-500" 
        />
        <HealthCard 
          title="Process Uptime" 
          status={health ? `${Math.floor(health.uptime / 3600)}h ${Math.floor((health.uptime % 3600) / 60)}m` : "Checking..."} 
          icon={Clock} 
          color="text-slate-500" 
        />
      </div>

      {/* Audit Logs */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-8 py-6 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-800">Security Audit Trail</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Immutable Record of System Actions (Last 100 entries)</p>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
               className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-bold focus:ring-2 focus:ring-blue-500 transition-all outline-none"
               placeholder="Filter by action, entity or user..."
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 text-[10px] font-black uppercase tracking-tighter text-slate-400 border-b border-slate-100">
               <tr>
                 <th className="px-8 py-4">Timestamp</th>
                 <th className="px-8 py-4">Action Event</th>
                 <th className="px-8 py-4">Security Principal</th>
                 <th className="px-8 py-4">Resource Target</th>
                 <th className="px-8 py-4">Payload/Details</th>
               </tr>
            </thead>
            <tbody className="text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center text-slate-400 font-bold uppercase tracking-widest">
                    <RefreshCcw className="h-8 w-8 animate-spin mx-auto mb-2 opacity-20" />
                    Scanning Audit Trail...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center text-slate-400 font-bold uppercase tracking-widest">
                    No matching audit entries found
                  </td>
                </tr>
              ) : filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition border-b border-slate-50 last:border-0 group">
                  <td className="px-8 py-4 font-mono text-slate-400 text-[10px]">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-8 py-4">
                    <span className={`px-2 py-0.5 rounded-lg font-black text-[9px] uppercase border ${
                      log.action.includes('FAILED') ? 'bg-rose-50 text-rose-600 border-rose-100' : 
                      log.action.includes('LOGIN') ? 'bg-blue-50 text-blue-600 border-blue-100' :
                      'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-8 py-4 font-bold text-slate-700">
                    {log.userId}
                  </td>
                  <td className="px-8 py-4">
                     <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase text-slate-400">{log.entity}:</span>
                        <span className="font-mono text-blue-600 text-[10px]">{log.entityId}</span>
                     </div>
                  </td>
                  <td className="px-8 py-4">
                     <p className="text-[10px] text-slate-500 italic max-w-xs truncate" title={log.details}>
                        {log.details || "None"}
                     </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>


    </div>
  );
}

function HealthCard({ title, status, icon: Icon, color }: any) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between group hover:border-blue-300 transition-all">
       <div className="flex items-center justify-between mb-4">
          <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:scale-110 transition-transform">
             <Icon className="h-6 w-6" />
          </div>
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
       </div>
       <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{title}</p>
          <p className={`text-xl font-black tracking-tight ${color}`}>{status}</p>
       </div>
    </div>
  );
}

function ActionButton({ title, desc, icon: Icon, onClick, variant }: any) {
  return (
    <button 
      onClick={onClick}
      className={`p-4 rounded-2xl border text-left transition-all hover:shadow-md flex items-start gap-3 group ${
        variant === 'danger' ? 'border-rose-100 hover:bg-rose-50' : 'border-slate-100 hover:bg-slate-50'
      }`}
    >
       <div className={`p-2 rounded-xl shrink-0 ${variant === 'danger' ? 'bg-rose-100 text-rose-500' : 'bg-slate-100 text-slate-500'}`}>
          <Icon className="h-4 w-4" />
       </div>
       <div>
          <p className="text-[11px] font-black uppercase tracking-tight text-slate-800">{title}</p>
          <p className="text-[9px] font-bold text-slate-400 uppercase leading-tight mt-0.5">{desc}</p>
       </div>
    </button>
  );
}
