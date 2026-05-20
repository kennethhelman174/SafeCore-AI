import { useState, useEffect } from "react";
import { 
  FileText, Shield, GraduationCap, CheckSquare, 
  Download, Filter, Search, ChevronRight, 
  Calendar, RotateCw, AlertTriangle
} from "lucide-react";
import { format } from "date-fns";
import { exportToCSV, exportToExcel, exportToPDF } from "../lib/exportUtils";
import { useAuth } from "../contexts/AuthContext";
import { apiRequest } from "../lib/api";
import { toast } from "sonner";

export default function ComplianceReports() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState("training");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  const tabs = [
    { id: "training", name: "Training Compliance", icon: GraduationCap },
    { id: "actions", name: "Corrective Actions", icon: CheckSquare },
    { id: "documents", name: "Controlled Documents", icon: FileText },
  ];

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    let endpoint = "";
    if (activeTab === "training") endpoint = "/api/reports/training-all";
    if (activeTab === "actions") endpoint = "/api/corrective-actions";
    if (activeTab === "documents") endpoint = "/api/documents?limit=1000";

    try {
      const json = await apiRequest(endpoint);
      // Handle paginated documents wrapper
      const actualData = (activeTab === "documents" && json?.data) ? json.data : json;
      setData(Array.isArray(actualData) ? actualData : []);
    } catch (e: any) {
      console.error(e);
      toast.error(`Could not retrieve compliance intelligence data: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = data.filter(item => {
    const text = JSON.stringify(item).toLowerCase();
    return text.includes(filter.toLowerCase());
  });

  const handleExport = (exportFormat: "csv" | "excel") => {
     const fileName = `${activeTab}_report_${format(new Date(), "yyyy-MM-dd")}`;
     if (exportFormat === "csv") exportToCSV(filteredData, fileName);
     else exportToExcel(filteredData, fileName);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4">
      <div className="mb-8">
        <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900 flex items-center gap-2">
          <Shield className="h-6 w-6 text-indigo-600" /> Compliance Intelligence Center
        </h1>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Generate regulatory ready reports and audit trails</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-px">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 text-xs font-black uppercase tracking-widest transition-all relative ${
                isActive ? "text-indigo-600 border-b-2 border-indigo-600" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.name}
              {isActive && <div className="absolute inset-x-0 bottom-0 h-0.5 bg-indigo-600 rounded-full" />}
            </button>
          )
        })}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Filter report records..." 
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <button 
             onClick={() => handleExport("csv")}
             className="px-4 py-2 border border-slate-200 rounded-lg text-[10px] font-black uppercase tracking-tight text-slate-600 hover:bg-slate-50 flex items-center gap-2 transition"
          >
            <Download className="h-3 w-3" /> CSV Export (Raw Data)
          </button>
          <button 
             onClick={() => handleExport("excel")}
             className="px-4 py-2 border border-slate-200 rounded-lg text-[10px] font-black uppercase tracking-tight text-slate-600 hover:bg-slate-50 flex items-center gap-2 transition"
          >
            <Download className="h-3 w-3" /> CSV Export (Standard)
          </button>
          <button 
             onClick={() => fetchData()}
             className="p-2 border border-slate-200 rounded-lg text-slate-400 hover:bg-slate-50 transition"
          >
            <RotateCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden min-h-[400px]">
        {loading ? (
           <div className="flex flex-col items-center justify-center h-96 gap-4">
              <div className="h-10 w-10 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin"></div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Aggregating Data...</p>
           </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest">Detail</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest">Status / Info</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest">Date / Time</th>
                  <th className="px-6 py-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-20 text-center flex flex-col items-center gap-2">
                      <Filter className="h-8 w-8 text-slate-200" />
                      <p className="text-xs font-bold text-slate-400 uppercase">No matching compliance records found</p>
                    </td>
                  </tr>
                ) : filteredData.map((item: any, idx: number) => (
                  <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                     <td className="px-6 py-4">
                        {activeTab === "training" && (
                          <div className="flex items-center gap-3">
                             <div className="h-8 w-8 bg-indigo-50 text-indigo-600 rounded flex items-center justify-center font-black text-xs">
                                {item.assignment?.user?.name?.charAt(0)}
                             </div>
                             <div>
                                <p className="text-sm font-bold text-slate-800">{item.assignment?.user?.name}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase">{item.assignment?.document?.title}</p>
                             </div>
                          </div>
                        )}
                        {activeTab === "actions" && (
                          <div>
                            <p className="text-sm font-bold text-slate-800">{item.title}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">{item.owner?.name}</p>
                          </div>
                        )}
                        {activeTab === "documents" && (
                          <div>
                            <p className="text-sm font-bold text-slate-800">{item.docNumber} - {item.title}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">{item.type?.name}</p>
                          </div>
                        )}
                     </td>
                     <td className="px-6 py-4">
                        <StatusBadge status={item.status} tab={activeTab} />
                     </td>
                     <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
                           <Calendar className="h-3 w-3" />
                           {format(new Date(item.createdAt || item.updatedAt || new Date()), "MMM dd, yyyy")}
                        </div>
                     </td>
                     <td className="px-6 py-4 text-right">
                        <button className="p-2 text-slate-300 hover:text-indigo-600 transition">
                           <ChevronRight className="h-4 w-4" />
                        </button>
                     </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status, tab }: any) {
  const s = (typeof status === 'object' ? status.name : status) || (tab === "training" ? "Completed" : "Open");
  
  const colors: any = {
    "Completed": "bg-emerald-50 text-emerald-600 border-emerald-100",
    "completed": "bg-emerald-50 text-emerald-600 border-emerald-100",
    "Published": "bg-blue-50 text-blue-600 border-blue-100",
    "Open": "bg-amber-50 text-amber-600 border-amber-100",
    "open": "bg-amber-50 text-amber-600 border-amber-100",
    "Overdue": "bg-rose-50 text-rose-600 border-rose-100",
    "Resolved": "bg-slate-50 text-slate-600 border-slate-100",
  };

  const style = colors[s] || "bg-slate-50 text-slate-500 border-slate-100";

  return (
    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter border ${style}`}>
      {s}
    </span>
  );
}
