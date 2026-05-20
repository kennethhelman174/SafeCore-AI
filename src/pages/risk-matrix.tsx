import { useState } from "react";
import { AlertTriangle, ShieldCheck, Zap, Info } from "lucide-react";

export default function RiskMatrixPage() {
  const [selectedRisk, setSelectedRisk] = useState<any>(null);

  const risks = [
    { id: 1, title: "Forklift Collision", severity: 5, likelihood: 2, score: 10, category: "Traffic" },
    { id: 2, title: "Manual Handling", severity: 3, likelihood: 4, score: 12, category: "Ergonomics" },
    { id: 3, title: "Product Fall", severity: 4, likelihood: 3, score: 12, category: "Storage" },
    { id: 4, title: "Conveyor Jam", severity: 2, likelihood: 5, score: 10, category: "Machinery" },
  ];

  const getColor = (score: number) => {
    if (score >= 15) return "bg-red-500";
    if (score >= 10) return "bg-orange-500";
    if (score >= 5) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">Enterprise Risk Matrix</h1>
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Dynamic visualization of site hazards and control effectiveness</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Heatmap Grid */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-800">Probability vs Severity</h2>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-red-500" />
                <span className="text-[9px] font-bold text-slate-400 uppercase">Critical</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-orange-500" />
                <span className="text-[9px] font-bold text-slate-400 uppercase">High</span>
              </div>
            </div>
          </div>

          <div className="relative mt-8">
            <div className="absolute -left-10 top-1/2 -rotate-90 text-[10px] font-black uppercase tracking-widest text-slate-400">Probability</div>
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase tracking-widest text-slate-400">Severity</div>
            
            <div className="grid grid-cols-5 gap-1 aspect-square">
              {[5, 4, 3, 2, 1].map(row => (
                [1, 2, 3, 4, 5].map(col => {
                  const score = row * col;
                  const active = risks.filter(r => r.severity === col && r.likelihood === row);
                  return (
                    <div 
                      key={`${row}-${col}`}
                      className={`relative flex items-center justify-center rounded transition-all hover:scale-105 ${getColor(score)} bg-opacity-20 border border-white`}
                    >
                      {active.length > 0 && (
                        <div className={`h-4 w-4 rounded-full ${getColor(score)} shadow-lg flex items-center justify-center text-[8px] font-black text-white cursor-pointer hover:ring-2 hover:ring-offset-2 ring-blue-600`}
                             onClick={() => setSelectedRisk(active[0])}>
                          {active.length}
                        </div>
                      )}
                    </div>
                  );
                })
              ))}
            </div>
          </div>
        </div>

        {/* Risk List */}
        <div className="space-y-4">
          {risks.map(risk => (
            <div 
              key={risk.id}
              onClick={() => setSelectedRisk(risk)}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${selectedRisk?.id === risk.id ? 'border-blue-600 bg-blue-50/30' : 'border-slate-100 bg-white hover:border-slate-200'}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-1.5 w-1.5 rounded-full ${getColor(risk.score)}`} />
                  <h3 className="text-sm font-black uppercase text-slate-800">{risk.title}</h3>
                </div>
                <span className="text-[10px] font-black uppercase text-slate-400">Score: {risk.score}</span>
              </div>
            </div>
          ))}
          
          {selectedRisk && (
            <div className="mt-8 p-6 rounded-2xl border border-blue-100 bg-blue-50/50 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase text-blue-900">{selectedRisk.title}</h3>
                <ShieldCheck className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-xs font-medium text-blue-800 leading-relaxed">
                This risk is currently rated as <span className="font-bold uppercase underline">Moderate</span>. 
                Recommended controls include engineering safeguards and regular SOP refresher training.
              </p>
              <div className="flex items-center gap-4 pt-2">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-white rounded-full border border-blue-100">
                  <Zap className="h-3 w-3 text-amber-500" />
                  <span className="text-[10px] font-black uppercase text-slate-700">SIF Potential: No</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-white rounded-full border border-blue-100">
                  <Info className="h-3 w-3 text-blue-500" />
                  <span className="text-[10px] font-black uppercase text-slate-700">Controls: Active</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
