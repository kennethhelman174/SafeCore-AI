
import React, { useState } from "react";
import { 
  Cloud, Share2, Database, LayoutTemplate, Workflow, PieChart, 
  Download, FileSpreadsheet, Search, Filter, ArrowRight,
  ExternalLink, CheckCircle2, ChevronRight, Info
} from "lucide-react";
import { MS365_MAPPINGS, POWER_APPS_SCREENS, POWER_AUTOMATE_WORKFLOWS, TableMapping } from "../constants/ms365Mappings";
import { exportToCSV } from "../lib/exportUtils";
import { toast } from "sonner";

export default function MS365Readiness() {
  const [activeTab, setActiveTab] = useState<"sharepoint" | "dataverse" | "powerapps" | "workflows" | "powerbi">("sharepoint");
  const [searchTerm, setSearchTerm] = useState("");

  const handleExportMappings = (mapping: TableMapping) => {
    const data = mapping.fields.map(f => ({
      "DB Field": f.dbField,
      "SharePoint Column": f.spColumn,
      "Dataverse Column": f.dvColumn,
      "Data Type": f.dataType,
      "Required": f.required ? "TRUE" : "FALSE",
      "Control": f.controlType,
      "Lookup Table": f.lookup || "",
      "Implementation Notes": f.notes
    }));
    exportToCSV(data, `${mapping.name.replace(/\s+/g, '_')}_M365_Map`);
    toast.success(`Exported mapping for ${mapping.name}`);
  };

  const handleExportScreens = () => {
    const data = POWER_APPS_SCREENS.map(s => ({
      "Screen Name": s.name,
      "Description": s.description,
      "Planned Components": s.components.join(", ")
    }));
    exportToCSV(data, "PowerApps_Screen_Plan");
    toast.success("Exported Power Apps screen plan");
  };

  const handleExportWorkflows = () => {
    const data = POWER_AUTOMATE_WORKFLOWS.map(w => ({
      "Workflow Name": w.name,
      "Trigger": w.trigger,
      "Step Chain": w.actions.join(" -> "),
      "Escalation Logic": w.escalation
    }));
    exportToCSV(data, "PowerAutomate_Workflow_Plan");
    toast.success("Exported Power Automate workflow plan");
  };

  const handleExportPowerBI = () => {
    const data = [
      { Table: "FactCorrectiveActions", Type: "Fact", Source: "SharePoint / SQL", Refresh: "Scheduled (Daily)" },
      { Table: "FactTrainingRecords", Type: "Fact", Source: "SharePoint / SQL", Refresh: "Scheduled (Hourly)" },
      { Table: "DimEmployees", Type: "Dimension", Source: "Dataverse", Refresh: "Real-time" },
      { Table: "DimDocuments", Type: "Dimension", Source: "SharePoint Library", Refresh: "Scheduled (Daily)" }
    ];
    exportToCSV(data, "PowerBI_Dataset_Connectivity_Map");
    toast.success("Exported Power BI dataset mapping");
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-200 pb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900 flex items-center gap-3">
            <Cloud className="h-8 w-8 text-blue-600" /> Microsoft 365 Readiness
          </h1>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Migration Planning & Ecosystem Integration Engine</p>
        </div>
        <div className="flex gap-2">
          <button 
             onClick={() => {
               const allFields = MS365_MAPPINGS.flatMap(m => m.fields.map(f => ({ Table: m.name, ...f })));
               exportToCSV(allFields, "Full_M365_Schema_Migration_Plan");
             }}
             className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition shadow-sm"
          >
            <Download className="h-4 w-4" /> Export Migration Plan
          </button>
        </div>
      </div>

      {/* Stats / Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         <SummaryCard title="Compatible Tables" value={MS365_MAPPINGS.length.toString()} sub="Auto-mapped to SP/DV" icon={Database} color="text-blue-600" />
         <SummaryCard title="Ready Screens" value={POWER_APPS_SCREENS.length.toString()} sub="Canvas App Blueprints" icon={LayoutTemplate} color="text-indigo-600" />
         <SummaryCard title="Workflow Logic" value={POWER_AUTOMATE_WORKFLOWS.length.toString()} sub="Cloud Flow Triggers" icon={Workflow} color="text-emerald-600" />
         <SummaryCard title="Unified Schema" value="100%" sub="Mapping Coverage" icon={CheckCircle2} color="text-amber-600" />
      </div>

      {/* Navigation Tabs */}
      <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm overflow-x-auto no-scrollbar">
         <TabButton active={activeTab === 'sharepoint'} onClick={() => setActiveTab('sharepoint')} label="SharePoint Lists" icon={Share2} />
         <TabButton active={activeTab === 'dataverse'} onClick={() => setActiveTab('dataverse')} label="Dataverse" icon={Database} />
         <TabButton active={activeTab === 'powerapps'} onClick={() => setActiveTab('powerapps')} label="Power Apps" icon={LayoutTemplate} />
         <TabButton active={activeTab === 'workflows'} onClick={() => setActiveTab('workflows')} label="Power Automate" icon={Workflow} />
         <TabButton active={activeTab === 'powerbi'} onClick={() => setActiveTab('powerbi')} label="Power BI" icon={PieChart} />
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            className="w-full bg-slate-50 border border-slate-100 rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder={`Search ${activeTab} components...`}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Content Area */}
      <div className="grid grid-cols-1 gap-6">
        {/* Mapping Views (SharePoint / Dataverse) */}
        {(activeTab === "sharepoint" || activeTab === "dataverse") && (
          <div className="space-y-6">
            {MS365_MAPPINGS.filter(m => 
              m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              m.description.toLowerCase().includes(searchTerm.toLowerCase())
            ).map((mapping) => (
              <section key={mapping.name} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:border-blue-200 transition">
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">{mapping.name}</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">{mapping.description}</p>
                  </div>
                  <button 
                    onClick={() => handleExportMappings(mapping)}
                    className="flex items-center gap-1.5 text-[10px] font-black uppercase text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 transition"
                  >
                    <FileSpreadsheet className="h-4 w-4" /> {activeTab === 'sharepoint' ? 'Export List Schema' : 'Export DB Table Map'}
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50/50 text-[10px] font-black uppercase tracking-tighter text-slate-400">
                      <tr>
                        <th className="px-6 py-3 border-b">DB Property</th>
                        <th className="px-6 py-3 border-b">{activeTab === 'sharepoint' ? 'SharePoint List Name' : 'Dataverse Schema Name'}</th>
                        <th className="px-6 py-3 border-b">Data Type</th>
                        <th className="px-6 py-3 border-b">Control</th>
                        <th className="px-6 py-3 border-b">Relation</th>
                        <th className="px-6 py-3 border-b">Requirement</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs">
                      {mapping.fields.map((f, i) => (
                        <tr key={i} className="hover:bg-slate-50/50 transition border-b last:border-0 border-slate-100">
                          <td className="px-6 py-4 font-mono text-blue-700">{f.dbField}</td>
                          <td className="px-6 py-4 font-mono font-bold text-slate-800">
                            {activeTab === 'sharepoint' ? f.spColumn : f.dvColumn}
                          </td>
                          <td className="px-6 py-4">
                             <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-bold text-[9px] uppercase">{f.dataType}</span>
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-500">{f.controlType}</td>
                          <td className="px-6 py-4">
                             {f.lookup ? (
                               <span className="text-[10px] text-indigo-600 font-black uppercase flex items-center gap-1">
                                 <ChevronRight className="h-3 w-3" /> {f.lookup}
                               </span>
                             ) : <span className="text-slate-300">None</span>}
                          </td>
                          <td className="px-6 py-4">
                             {f.required ? (
                               <span className="text-rose-600 font-black text-[9px] uppercase tracking-tighter">Required</span>
                             ) : <span className="text-slate-400 font-bold text-[9px] uppercase tracking-tighter">Optional</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ))}
          </div>
        )}

        {/* Power Apps Views */}
        {activeTab === "powerapps" && (
           <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                 <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Power Apps Screen Blueprints</h2>
                 <button 
                    onClick={handleExportScreens}
                    className="flex items-center gap-1.5 text-[10px] font-black uppercase text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 transition"
                 >
                    <Download className="h-4 w-4" /> Export Screen Map
                 </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {POWER_APPS_SCREENS.filter(s => 
                  s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                  s.description.toLowerCase().includes(searchTerm.toLowerCase())
                ).map((screen, i) => (
                  <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                         <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                            <LayoutTemplate className="h-6 w-6" />
                         </div>
                         <div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">{screen.name}</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">{screen.description}</p>
                         </div>
                      </div>
                      <div className="space-y-2">
                         <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-b pb-1 mb-2">Planned Components</p>
                         <div className="flex flex-wrap gap-2">
                            {screen.components.map((c, j) => (
                               <span key={j} className="px-2 py-1 rounded-lg bg-indigo-50/50 text-indigo-700 text-[9px] font-black uppercase border border-indigo-100">
                                  {c}
                               </span>
                            ))}
                         </div>
                      </div>
                    </div>
                    <div className="mt-6 flex gap-2">
                       <button className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition">View Screen Logic</button>
                       <button className="p-2 border border-slate-200 rounded-lg text-slate-400 hover:bg-slate-50 transition"><ExternalLink className="h-4 w-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
           </div>
        )}

        {/* Workflow Views */}
        {activeTab === "workflows" && (
           <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                 <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Power Automate Cloud Flows</h2>
                 <button 
                    onClick={handleExportWorkflows}
                    className="flex items-center gap-1.5 text-[10px] font-black uppercase text-emerald-600 hover:bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 transition"
                 >
                    <Download className="h-4 w-4" /> Export Workflow Map
                 </button>
              </div>
              <div className="space-y-4">
                {POWER_AUTOMATE_WORKFLOWS.filter(w => 
                  w.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                  w.trigger.toLowerCase().includes(searchTerm.toLowerCase())
                ).map((wf, i) => (
                  <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6">
                     <div className="md:w-1/3">
                        <div className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
                           <Workflow className="h-8 w-8" />
                        </div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">{wf.name}</h3>
                        <div className="mt-4 flex items-center gap-2 p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl">
                           <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                           <p className="text-[9px] font-black text-emerald-700 uppercase leading-none">Ready for Mapping</p>
                        </div>
                     </div>
                     <div className="flex-1 space-y-4">
                        <div>
                           <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1 flex items-center gap-1">
                              <ArrowRight className="h-3 w-3" /> Trigger Event
                           </p>
                           <p className="text-xs font-bold text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100 italic">"{wf.trigger}"</p>
                        </div>
                        <div>
                           <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 flex items-center gap-1">
                              <LayoutTemplate className="h-3 w-3" /> Logical Step Chain
                           </p>
                           <div className="space-y-2">
                              {wf.actions.map((act, j) => (
                                 <div key={j} className="flex items-center gap-2 group">
                                    <div className="h-5 w-5 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200 text-[10px] font-black text-slate-500 group-hover:bg-emerald-500 group-hover:text-white group-hover:border-emerald-600 transition">
                                       {j+1}
                                    </div>
                                    <p className="text-xs text-slate-600 font-medium">{act}</p>
                                 </div>
                              ))}
                           </div>
                        </div>
                     </div>
                     <div className="md:w-1/4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <h4 className="text-[10px] font-black uppercase text-slate-400 mb-2">Escalation Logic</h4>
                        <p className="text-[11px] font-bold text-slate-600 bg-white p-3 rounded-lg shadow-sm border border-slate-100 flex items-start gap-2">
                           <Info className="h-4 w-4 text-emerald-500 shrink-0" />
                           {wf.escalation}
                        </p>
                     </div>
                  </div>
                ))}
              </div>
           </div>
        )}

        {/* Power BI Placeholder View */}
        {activeTab === "powerbi" && (
           <div className="bg-white p-12 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center text-center">
              <div className="h-20 w-20 bg-amber-50 text-amber-500 rounded-3xl flex items-center justify-center mb-6">
                 <PieChart className="h-10 w-10" />
              </div>
              <h2 className="text-xl font-black uppercase tracking-tighter text-slate-800">Dataset Connectivity Map</h2>
              <p className="max-w-md text-sm text-slate-500 mt-2 font-medium">
                 Connect your SafeCore backend to Power BI Desktop via the OData feed or SharePoint List connector.
              </p>
              <div className="mt-8 grid grid-cols-2 gap-4 w-full max-w-lg">
                 <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left">
                    <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Recommended Table</p>
                    <p className="text-xs font-bold text-slate-800">FactCorrectiveActions</p>
                 </div>
                 <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left">
                    <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Recommended Table</p>
                    <p className="text-xs font-bold text-slate-800">FactTrainingRecords</p>
                 </div>
              </div>
              <button 
                onClick={handleExportPowerBI}
                className="mt-8 flex items-center gap-2 bg-amber-600 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-amber-700 transition shadow-lg"
              >
                <Download className="h-4 w-4" /> Export Dataset Mapping
              </button>
           </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ title, value, sub, icon: Icon, color }: any) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 group hover:border-blue-300 transition">
       <div className={`h-12 w-12 rounded-xl bg-slate-50 ${color} flex items-center justify-center transition-transform group-hover:scale-110`}>
          <Icon className="h-6 w-6" />
       </div>
       <div>
          <p className="text-2xl font-black text-slate-900 tracking-tighter leading-none">{value}</p>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-0.5">{title}</p>
          <p className="text-[9px] font-bold text-slate-400 italic">{sub}</p>
       </div>
    </div>
  );
}

function TabButton({ active, onClick, label, icon: Icon }: any) {
  return (
    <button 
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-all rounded-lg whitespace-nowrap ${
        active 
          ? "bg-slate-900 text-white shadow-lg" 
          : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
