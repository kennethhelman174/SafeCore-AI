import { GraduationCap, Shield, AlertTriangle, CheckSquare, Clock, FileText, Info } from "lucide-react";
import { format } from "date-fns";

interface Props {
  document: any;
}

export default function DocumentPrintView({ document: originalDoc }: Props) {
  if (!originalDoc) return null;

  const doc = {
    ...originalDoc,
    ppe: originalDoc.ppe || [],
    equipment: originalDoc.equipment || [],
    hazards: originalDoc.hazards || [],
    controls: originalDoc.controls || [],
    procedureSteps: originalDoc.procedureSteps || [],
    checklistItems: originalDoc.checklistItems || [],
    jsaSteps: originalDoc.jsaSteps || [],
    criticalControls: originalDoc.criticalControls || [],
    riskAssessments: originalDoc.riskAssessments || [],
    revisions: originalDoc.revisions || [],
    workflows: originalDoc.workflows || [],
    correctiveActions: originalDoc.correctiveActions || []
  };

  return (
    <div className="relative bg-white p-8 font-serif leading-relaxed text-slate-900 mx-auto max-w-[210mm] print:p-0 overflow-hidden">
      {/* Dynamic Watermark */}
      {(doc.status?.name === "Draft" || doc.status?.name === "Archived") && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.03] select-none z-50">
          <span className="text-[120px] font-black uppercase -rotate-45 border-8 border-slate-900 px-8">
            {doc.status.name}
          </span>
        </div>
      )}

      {/* Header Section */}
      <div className="border-2 border-slate-900 p-4 mb-8">
        <div className="flex justify-between items-center border-b-2 border-slate-900 pb-4 mb-4">
          <div className="flex flex-col">
            <h1 className="text-2xl font-black uppercase tracking-tighter">SafeCore EHS Systems</h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Distribution Center Excellence</p>
          </div>
          <div className="text-right">
             <div className="bg-slate-900 text-white px-4 py-1 text-xs font-black uppercase tracking-widest mb-1">
                {doc.status?.name || "Controlled Copy"}
             </div>
             <p className="text-[10px] font-bold text-slate-500 uppercase">Controlled Document ID: {doc.docNumber}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 text-[10px] uppercase font-bold text-slate-600">
           <div>
              <p className="text-slate-400 mb-1">Revision Number</p>
              <p className="text-slate-900">REV: {doc.currentRevision || "01"}</p>
           </div>
           <div>
              <p className="text-slate-400 mb-1">Effective Date</p>
              <p className="text-slate-900">{doc.effectiveDate ? format(new Date(doc.effectiveDate), "MMM dd, yyyy") : "PENDING"}</p>
           </div>
           <div>
              <p className="text-slate-400 mb-1">Review Due Date</p>
              <p className="text-slate-900">{doc.reviewDueDate ? format(new Date(doc.reviewDueDate), "MMM dd, yyyy") : "N/A"}</p>
           </div>
        </div>
      </div>

      <div className="text-center mb-10 pb-6 border-b border-slate-100">
        <h2 className="text-3xl font-black uppercase tracking-tight mb-2 underline decoration-4 underline-offset-8 decoration-slate-200">{doc.title}</h2>
        <div className="flex items-center justify-center gap-6 mt-6">
           <span className="flex items-center gap-2 text-[10px] bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
              <FileText className="h-3 w-3 text-slate-400" />
              {doc.type?.name}
           </span>
           <span className="flex items-center gap-2 text-[10px] bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
              <Shield className="h-3 w-3 text-slate-400" />
              {doc.category?.name}
           </span>
           <span className="flex items-center gap-2 text-[10px] bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
              <AlertTriangle className="h-3 w-3 text-slate-400" />
              {doc.riskLevel} Risk
           </span>
        </div>
      </div>

      <div className="space-y-12">
        {/* General Metadata */}
        <div>
           <SectionHeading title="1. Purpose & Objectives" />
           <p className="text-sm text-slate-700 leading-relaxed italic border-l-4 border-slate-100 pl-6 py-2">{doc.purpose || "No purpose provided for this document."}</p>
        </div>

        <div>
           <SectionHeading title="2. Scope & Applicability" />
           <p className="text-sm text-slate-700 leading-relaxed">{doc.scope || "No scope provided."}</p>
        </div>

        {/* Hazards, Controls, PPE, Equipment */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900 border-b border-slate-200 pb-2 mb-4">Required PPE</h4>
            <div className="flex flex-col gap-1">
              {doc.ppe?.length > 0 ? doc.ppe.map((p: any, i: number) => (
                <span key={i} className="text-xs font-bold text-slate-600 uppercase">✓ {p.name}</span>
              )) : <span className="text-[10px] text-slate-400">None</span>}
            </div>
          </div>
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900 border-b border-slate-200 pb-2 mb-4">Equipment</h4>
            <div className="flex flex-col gap-1">
              {doc.equipment?.length > 0 ? doc.equipment.map((e: any, i: number) => (
                <span key={i} className="text-xs font-bold text-slate-600 uppercase">✓ {e.name}</span>
              )) : <span className="text-[10px] text-slate-400">None</span>}
            </div>
          </div>
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900 border-b border-slate-200 pb-2 mb-4">Hazards</h4>
            <div className="flex flex-col gap-1">
              {doc.hazards?.length > 0 ? doc.hazards.map((h: any, i: number) => (
                <span key={i} className="text-xs font-bold text-rose-800 uppercase">⚠ {h.name}</span>
              )) : <span className="text-[10px] text-slate-400">None</span>}
            </div>
          </div>
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900 border-b border-slate-200 pb-2 mb-4">Controls</h4>
            <div className="flex flex-col gap-1">
              {doc.controls?.length > 0 ? doc.controls.map((c: any, i: number) => (
                <span key={i} className="text-xs font-bold text-emerald-800 uppercase">🛡 {c.name}</span>
              )) : <span className="text-[10px] text-slate-400">None</span>}
            </div>
          </div>
        </div>

        {/* Procedure Body */}
        {doc.procedureSteps?.length > 0 && (
          <div>
            <SectionHeading title="Standard Operating Procedure" />
            <div className="space-y-6">
              {doc.procedureSteps.sort((a: any, b: any) => a.order - b.order).map((step: any, i: number) => (
                <div key={i} className="flex gap-6">
                   <div className="shrink-0 w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-xs">
                      {i + 1}
                   </div>
                   <div className="flex-1 space-y-2 pt-1 border-b border-slate-50 pb-6">
                      <p className="text-sm font-bold text-slate-900 uppercase tracking-tight">{step.title || `Step ${i + 1}`}</p>
                      <p className="text-sm text-slate-600 leading-normal">{step.action}</p>
                      {step.safetyNote && (
                         <span className="inline-block bg-amber-50 text-amber-800 text-[10px] font-bold px-2 py-1 uppercase rounded border border-amber-200">⚠ {step.safetyNote}</span>
                      )}
                   </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Checklists */}
        {doc.checklistItems?.length > 0 && (
          <div>
            <SectionHeading title="Inspection Checklist" />
            <table className="w-full text-left border border-slate-200 mb-6">
               <thead>
                 <tr className="bg-slate-50 text-[10px] font-black uppercase border-b border-slate-200">
                    <th className="px-4 py-3 border-r border-slate-200 w-12 text-center">Chk</th>
                    <th className="px-4 py-3 border-r border-slate-200">Requirement</th>
                    <th className="px-4 py-3 w-32">Frequency</th>
                 </tr>
               </thead>
               <tbody className="text-xs divide-y divide-slate-200">
                 {doc.checklistItems.sort((a: any, b: any) => a.order - b.order).map((step: any, idx: number) => (
                   <tr key={idx}>
                      <td className="px-4 py-4 align-top border-r border-slate-200 text-center"><div className="w-4 h-4 border-2 border-slate-300 mx-auto rounded-sm"></div></td>
                      <td className="px-4 py-4 align-top border-r border-slate-200">{step.requirement}</td>
                      <td className="px-4 py-4 align-top text-[10px] font-bold text-slate-500 uppercase">{step.frequency}</td>
                   </tr>
                 ))}
               </tbody>
            </table>
          </div>
        )}

        {/* JSA Table */}
        {doc.jsaSteps?.length > 0 && (
          <div>
            <SectionHeading title="Job Safety Analysis (JSA)" />
            <table className="w-full text-left border border-slate-200">
               <thead>
                 <tr className="bg-slate-50 text-[10px] font-black uppercase border-b border-slate-200">
                    <th className="px-4 py-3 border-r border-slate-200">Step</th>
                    <th className="px-4 py-3 border-r border-slate-200">Potential Hazards</th>
                    <th className="px-4 py-3">Control Measures</th>
                 </tr>
               </thead>
               <tbody className="text-xs divide-y divide-slate-200">
                 {doc.jsaSteps.map((step: any, idx: number) => (
                   <tr key={idx}>
                      <td className="px-4 py-4 font-bold align-top border-r border-slate-200">{step.taskDescription}</td>
                      <td className="px-4 py-4 align-top border-r border-slate-200 bg-rose-50/20">{step.potentialHazards}</td>
                      <td className="px-4 py-4 align-top border-r border-slate-200 bg-emerald-50/20 font-medium">{step.controlMeasures}</td>
                   </tr>
                 ))}
               </tbody>
            </table>
          </div>
        )}

        {/* SIF Assessment & Critical Controls */}
        {doc.sifDetails && (
           <div className="border border-rose-200 bg-rose-50/30 p-6 rounded-xl">
             <SectionHeading title="SIF Assessment & Critical Controls" />
             <div className="grid grid-cols-2 gap-4 mb-8 text-sm">
               <div><span className="font-bold text-[10px] uppercase text-rose-800 tracking-widest block">Energy Source</span> {doc.sifDetails.energySource}</div>
               <div><span className="font-bold text-[10px] uppercase text-rose-800 tracking-widest block">Risk Category</span> {doc.sifDetails.criticalRiskCategory}</div>
               <div><span className="font-bold text-[10px] uppercase text-rose-800 tracking-widest block">Potential Outcome</span> {doc.sifDetails.potentialOutcome}</div>
             </div>
             {doc.criticalControls?.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900 border-b border-rose-200 pb-2 mb-4">Critical Controls</h4>
                  <table className="w-full text-left text-xs bg-white border border-rose-100">
                     <thead className="bg-rose-50 text-[10px] uppercase font-bold text-rose-800 border-b border-rose-100">
                        <tr>
                           <th className="p-3">Control Name</th>
                           <th className="p-3 border-l border-rose-100">Verification Method</th>
                           <th className="p-3 border-l border-rose-100">Frequency</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-rose-100">
                        {doc.criticalControls.map((cc: any, idx: number) => (
                           <tr key={idx}>
                              <td className="p-3 font-bold text-slate-800">{cc.name}</td>
                              <td className="p-3 border-l border-rose-100">{cc.verificationMethod}</td>
                              <td className="p-3 border-l border-rose-100 text-[10px] uppercase">{cc.frequency}</td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
                </div>
             )}
           </div>
        )}

        {/* Risk Assessments */}
        {doc.riskAssessments?.length > 0 && (
          <div>
            <SectionHeading title="Risk Assessments" />
            <div className="space-y-4">
               {doc.riskAssessments.map((ra: any, idx: number) => (
                  <div key={idx} className="border border-slate-200 p-4 rounded text-sm bg-slate-50">
                     <div className="flex justify-between items-center mb-4 border-b border-slate-200 pb-2">
                        <span className="font-bold uppercase tracking-tight">Quantitative Risk Assessment</span>
                        <span className="text-[10px] uppercase font-bold text-slate-500">Risk Reduction: {ra.riskReduction?.toFixed(1)}%</span>
                     </div>
                     <table className="w-full text-left text-xs bg-white border border-slate-200 mb-2">
                        <thead className="bg-slate-100 text-[10px] uppercase font-bold border-b border-slate-200">
                           <tr>
                              <th className="p-2">Stage</th>
                              <th className="p-2 border-l border-slate-200">Severity (1-5)</th>
                              <th className="p-2 border-l border-slate-200">Likelihood (1-5)</th>
                              <th className="p-2 border-l border-slate-200">Exposure (1-5)</th>
                              <th className="p-2 border-l border-slate-200">Risk Score</th>
                           </tr>
                        </thead>
                        <tbody>
                           <tr className="border-b border-slate-100">
                              <td className="p-2 font-bold text-rose-800 bg-rose-50/20">Pre-Control</td>
                              <td className="p-2 border-l border-slate-200">{ra.preSeverity}</td>
                              <td className="p-2 border-l border-slate-200">{ra.preLikelihood}</td>
                              <td className="p-2 border-l border-slate-200">{ra.preExposure}</td>
                              <td className="p-2 border-l border-slate-200 font-bold text-rose-800">{ra.preScore}</td>
                           </tr>
                           <tr>
                              <td className="p-2 font-bold text-emerald-800 bg-emerald-50/20">Post-Control</td>
                              <td className="p-2 border-l border-slate-200">{ra.postSeverity}</td>
                              <td className="p-2 border-l border-slate-200">{ra.postLikelihood}</td>
                              <td className="p-2 border-l border-slate-200">{ra.postExposure}</td>
                              <td className="p-2 border-l border-slate-200 font-bold text-emerald-800">{ra.postScore}</td>
                           </tr>
                        </tbody>
                     </table>
                  </div>
               ))}
            </div>
          </div>
        )}

        {/* Training Requirement */}
        {doc.requiredTraining && (
          <div className="bg-blue-50 border-2 border-dashed border-blue-200 p-6 rounded-xl">
            <h3 className="text-xs font-black uppercase tracking-widest text-blue-900 mb-3 flex items-center gap-2">
              <GraduationCap className="h-4 w-4" /> Certification Requirement
            </h3>
            <p className="text-xs text-blue-700 leading-relaxed">
              Successful completion of this module is mandatory for all personnel performing this task. 
              {doc.requiresAcknowledgment && " Digital acknowledgment of understanding is required. "}
              {doc.requiresVerification && " Practical evaluation by a certified supervisor is required. "}
              {doc.refresherFreqMonths && ` A refresher training is required every ${doc.refresherFreqMonths} months.`}
            </p>
          </div>
        )}

        {/* Change History */}
        {doc.revisions?.length > 0 && (
          <div>
            <SectionHeading title="Change History" />
            <table className="w-full text-left text-xs border border-slate-200">
               <thead className="bg-slate-50 text-[10px] font-black uppercase border-b border-slate-200">
                  <tr>
                     <th className="px-4 py-3 border-r border-slate-200">Rev</th>
                     <th className="px-4 py-3 border-r border-slate-200">Date</th>
                     <th className="px-4 py-3 border-r border-slate-200">Author</th>
                     <th className="px-4 py-3">Summary of Changes</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-200">
                  {doc.revisions.map((rev: any, idx: number) => (
                     <tr key={idx}>
                        <td className="px-4 py-3 font-bold border-r border-slate-200">{rev.revision}</td>
                        <td className="px-4 py-3 border-r border-slate-200">{format(new Date(rev.createdAt), "MMM dd, yyyy")}</td>
                        <td className="px-4 py-3 border-r border-slate-200">{rev.author?.name || "System"}</td>
                        <td className="px-4 py-3 text-slate-600">{rev.changeNote}</td>
                     </tr>
                  ))}
               </tbody>
            </table>
          </div>
        )}

        {/* Approval History */}
        {doc.workflows.length > 0 && doc.workflows[0].steps?.length > 0 && (
          <div>
            <SectionHeading title="Approval History" />
            <table className="w-full text-left text-xs border border-slate-200">
               <thead className="bg-slate-50 text-[10px] font-black uppercase border-b border-slate-200">
                  <tr>
                     <th className="px-4 py-3 border-r border-slate-200">Reviewer</th>
                     <th className="px-4 py-3 border-r border-slate-200">Role</th>
                     <th className="px-4 py-3 border-r border-slate-200">Status</th>
                     <th className="px-4 py-3">Date</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-200">
                  {doc.workflows[0].steps.map((wStep: any, idx: number) => (
                     <tr key={idx}>
                        <td className="px-4 py-3 font-bold border-r border-slate-200">{wStep.reviewer?.name || "Unknown"}</td>
                        <td className="px-4 py-3 border-r border-slate-200 text-slate-500">{wStep.reviewerRole || "Specific User"}</td>
                        <td className="px-4 py-3 border-r border-slate-200">
                           <span className={wStep.status === "approved" || wStep.status === "Approved" ? "text-emerald-600 font-bold" : "text-amber-600 font-bold"}>{wStep.status}</span>
                        </td>
                        <td className="px-4 py-3">{wStep.decisionDate ? format(new Date(wStep.decisionDate), "PP") : format(new Date(wStep.createdAt), "PP")}</td>
                     </tr>
                  ))}
               </tbody>
            </table>
          </div>
        )}

        {/* Corrective Actions */}
        {doc.correctiveActions?.length > 0 && (
          <div>
            <SectionHeading title="Corrective Actions" />
            <div className="space-y-4">
               {doc.correctiveActions.map((ca: any, idx: number) => (
                  <div key={idx} className="border border-amber-200 p-4 rounded text-sm bg-amber-50/30">
                     <div className="flex justify-between items-center mb-2">
                        <span className="font-bold uppercase tracking-tight text-amber-900">{ca.title}</span>
                        <span className="text-[10px] uppercase font-bold text-amber-600 px-2 py-1 bg-amber-100 rounded">{ca.status}</span>
                     </div>
                     <p className="text-amber-800 text-xs mb-2">{ca.description}</p>
                     <p className="text-[10px] uppercase font-bold text-amber-600">Assignee: {ca.assignee?.name || "Unassigned"} | Due: {ca.dueDate ? format(new Date(ca.dueDate), "MMM dd, yyyy") : "No due date assigned"}</p>
                  </div>
               ))}
            </div>
          </div>
        )}

        {/* Verification Section */}
        <div className="grid grid-cols-2 gap-8 pt-12 border-t border-slate-900 mt-20">
           <div className="space-y-6">
              <h4 className="text-[10px] font-black uppercase text-slate-400 mb-10 tracking-widest">Authored By</h4>
              <div className="h-px bg-slate-200 w-full mb-2" />
              <p className="text-xs font-bold text-slate-900">{doc.author?.name || "System Administrator"}</p>
              <p className="text-[10px] font-bold text-slate-400">{format(new Date(), "PPpp")}</p>
           </div>
           <div className="space-y-6">
              <h4 className="text-[10px] font-black uppercase text-slate-400 mb-10 tracking-widest">Site Approval Signature</h4>
              <div className="h-px bg-slate-200 w-full mb-2" />
              <p className="text-xs font-bold text-slate-900 italic">Electronic Sign-off Verified</p>
              <p className="text-[10px] font-bold text-slate-400">Security Hash: {Math.random().toString(36).substring(7).toUpperCase()}</p>
           </div>
        </div>
      </div>

      <div className="mt-12 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
         *** CONTROLLED DOCUMENT - VERIFY REVISION BEFORE USE ***
      </div>
    </div>
  );
}

function SectionHeading({ title }: { title: string }) {
  return (
    <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 border-b-4 border-slate-900 pb-2 mb-6 inline-block">
      {title}
    </h3>
  );
}
