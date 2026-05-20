import { useState, useEffect } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from "recharts";
import { 
  Shield, CheckCircle, AlertTriangle, FileText, Download, 
  TrendingUp, Users, Activity, ExternalLink, Clock
} from "lucide-react";
import { format } from "date-fns";
import { exportToPDF, exportToCSV } from "../lib/exportUtils";
import { useAuth } from "../contexts/AuthContext";

const COLORS = ["#10B981", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6"];

export default function AuditDashboard() {
  const { token } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exportHistory, setExportHistory] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/reports/audit-readiness", { headers: { Authorization: `Bearer ${token}` } }).then(res => res.json()),
      fetch("/api/reports/training-compliance", { headers: { Authorization: `Bearer ${token}` } }).then(res => res.json()),
      fetch("/api/exports/history", { headers: { Authorization: `Bearer ${token}` } }).then(res => res.json())
    ]).then(([audit, training, history]) => {
      setData({ audit, training });
      setExportHistory(history);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [token]);

  if (loading || !data) return <div className="p-8 text-center text-xs font-bold text-slate-400">Loading Report Intelligence...</div>;

  const { audit, training } = data;

  const complianceData = [
    { name: "Compliant", value: audit.metrics.trainingCompliance },
    { name: "Non-Compliant", value: 100 - audit.metrics.trainingCompliance }
  ];

  return (
    <div id="audit-dashboard" className="space-y-6 max-w-7xl mx-auto p-2">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6 print:hidden">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">Audit Readiness & Compliance</h1>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Real-time facility EHS metrics and document control</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => exportToPDF("audit-dashboard", `Audit_Summary_${format(new Date(), 'yyyy-MM-dd')}`)}
            className="flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 border border-slate-200 hover:bg-slate-200 transition"
          >
            <Download className="h-4 w-4" /> Export PDF
          </button>
          <button 
            onClick={() => exportToCSV(training, "Training_Compliance")}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
          >
            <Shield className="h-4 w-4" /> Download audit data
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPIItem 
          label="Training Compliance" 
          value={`${audit.metrics.trainingCompliance}%`} 
          sub="Target: 95%" 
          color={audit.metrics.trainingCompliance >= 95 ? "text-emerald-600" : "text-amber-600"} 
          icon={Users}
        />
        <KPIItem 
          label="Open Corrective Actions" 
          value={audit.metrics.openCorrectiveActions} 
          sub={`${audit.metrics.overdueCorrectiveActions} Overdue`} 
          color="text-rose-600" 
          icon={AlertTriangle}
        />
        <KPIItem 
          label="Published Documents" 
          value={audit.metrics.publishedDocuments} 
          sub="Controlled Copies" 
          color="text-blue-600" 
          icon={FileText}
        />
        <KPIItem 
          label="Review Overdue Docs" 
          value={audit.metrics.overdueReviews} 
          sub="Requires Revision" 
          color={audit.metrics.overdueReviews > 0 ? "text-rose-600" : "text-emerald-600"} 
          icon={Clock}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compliance Visualization */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" /> Training Compliance by Role
          </h3>
          <div className="h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={training}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="roleName" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} unit="%" />
                  <Tooltip 
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                    cursor={{fill: '#f8fafc'}}
                  />
                  <Bar dataKey="compliance" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                </BarChart>
             </ResponsiveContainer>
          </div>
        </div>

        {/* Global Compliance */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-6">Aggregate Readiness</h3>
          <div className="flex-1 flex items-center justify-center">
            <div className="relative h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={complianceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {complianceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? "#10B981" : "#F1F5F9"} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-black text-slate-900">{audit.metrics.trainingCompliance}%</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Compliance</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
             <div className="text-center p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                <p className="text-[10px] font-black uppercase text-emerald-600">Compliant</p>
                <p className="text-lg font-black text-emerald-900">{audit.metrics.trainingCompliance}%</p>
             </div>
             <div className="text-center p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-[10px] font-black uppercase text-slate-500">Deficit</p>
                <p className="text-lg font-black text-slate-900">{100 - audit.metrics.trainingCompliance}%</p>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Department Table */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
           <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">Operational Compliance by Dept</h3>
              <div className="flex gap-1">
                 <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                 <div className="h-2 w-2 rounded-full bg-slate-200"></div>
              </div>
           </div>
           <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-6 py-3 text-[10px] font-black uppercase text-slate-400">Department</th>
                  <th className="px-6 py-3 text-[10px] font-black uppercase text-slate-400">Published Docs</th>
                  <th className="px-6 py-3 text-[10px] font-black uppercase text-slate-400">Compliance Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {audit.departmentCompliance.map((dept: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-xs font-bold text-slate-700">{dept.name}</td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-900">{dept._count.documents}</td>
                    <td className="px-6 py-4">
                       <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-indigo-600" 
                            style={{ width: `${Math.min(100, (dept._count.documents / 10) * 100)}%` }}
                          ></div>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
           </table>
        </div>

        {/* Export Log */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
           <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">Recent Audit Exports</h3>
           </div>
           <div className="divide-y divide-slate-100 overflow-y-auto max-h-[400px]">
              {exportHistory.map((item) => (
                <div key={item.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                   <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{item.fileName}</p>
                      <p className="text-[10px] text-slate-400 uppercase font-bold mt-0.5">{item.format} • {format(new Date(item.createdAt), 'MMM d, p')}</p>
                   </div>
                   <span className="shrink-0 px-2 py-0.5 rounded-full bg-slate-100 text-[9px] font-black uppercase text-slate-500">Logged</span>
                </div>
              ))}
              {exportHistory.length === 0 && <div className="p-8 text-center text-[10px] font-bold text-slate-400 uppercase">No history</div>}
           </div>
        </div>
      </div>
    </div>
  );
}

function KPIItem({ label, value, sub, color, icon: Icon }: any) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-slate-300 transition-all">
       <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity`}>
          <Icon className="h-12 w-12" />
       </div>
       <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1">{label}</p>
       <p className={`text-2xl font-black ${color}`}>{value}</p>
       <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">{sub}</p>
    </div>
  );
}
