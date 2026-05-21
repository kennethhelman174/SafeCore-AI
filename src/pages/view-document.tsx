import { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  ArrowLeft,
  Edit,
  Shield,
  AlertTriangle,
  FileCheck2,
  User,
  Clock,
  CheckCircle2,
  FileX2,
  History,
  Download,
  Printer,
} from "lucide-react";
import { toast } from "sonner";
import { exportToPDF } from "../lib/exportUtils";
import DocumentPrintView from "../components/DocumentPrintView";
import { apiRequest } from "../lib/api";

import { useAuth } from "../contexts/AuthContext";

export function ViewDocument() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user: currentUser } = useAuth();
  const printRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const [doc, setDoc] = useState<any>(null);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedReviewers, setSelectedReviewers] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [isCreatingRevision, setIsCreatingRevision] = useState(false);

  const handlePrint = () => {
    if (!doc) {
      toast.error("Document is missing, cannot print");
      return;
    }
    const originalTitle = document.title;
    document.title = `${doc.docNumber}_${doc.title.replace(/\s+/g, "_")}`;
    window.print();
    document.title = originalTitle;
    toast.success("Print dialog opened");
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const docData = await apiRequest(`/api/documents/${id}`);
      setDoc(docData);
    } catch (e: any) {
      console.error(e);
      toast.error(`Failed to load document: ${e.message}`);
    }

    try {
      const wfData = await apiRequest(`/api/documents/${id}/workflows`);
      setWorkflows(wfData || []);
    } catch (e) {
      console.warn("Workflow fetch failed", e);
    }

    try {
      const userData = await apiRequest("/api/users");
      setUsers(userData || []);
    } catch (e) {
      console.warn("Users fetch failed", e);
    }
  };

  const handleSubmitReview = async () => {
    if (selectedReviewers.length === 0)
      return toast.error("Select at least one reviewer");
    try {
      await apiRequest(`/api/documents/${id}/submit-review`, {
        method: "POST",
        body: { reviewerIds: selectedReviewers },
      });
      toast.success("Submitted for review");
      fetchData();
    } catch (e: any) {
      toast.error(e.message || "Failed to submit");
    }
  };

  const handleAction = async (stepId: string, action: string) => {
    if ((action === "reject" || action === "revision") && !comment.trim()) {
      return toast.error(
        "A comment is required to reject or request revision.",
      );
    }
    try {
      await apiRequest(`/api/workflows/step/${stepId}/action`, {
        method: "POST",
        body: {
          action,
          comment,
        },
      });
      toast.success(`Action: ${action} recorded`);
      setComment("");
      fetchData();
    } catch (e: any) {
      toast.error(e.message || "Action failed");
    }
  };

  const handlePublish = async () => {
    try {
      await apiRequest(`/api/documents/${id}/publish`, {
        method: "POST",
        body: { effectiveDate: new Date() },
      });
      toast.success("Document published");
      fetchData();
    } catch (e: any) {
      toast.error(e.message || "Publish failed");
    }
  };

  const handleArchive = async () => {
    try {
      await apiRequest(`/api/documents/${id}/archive`, {
        method: "POST",
      });
      toast.success("Document archived");
      fetchData();
    } catch (e: any) {
      toast.error(e.message || "Archive failed");
    }
  };

  const handleCreateRevision = async () => {
    const changeSummary = prompt("Enter change summary for new revision:");
    if (!changeSummary) return;

    setIsCreatingRevision(true);
    try {
      const data = await apiRequest(`/api/documents/${id}/create-revision`, {
        method: "POST",
        body: {
          changeSummary,
        },
      });
      toast.success("Revision created successfully");
      const targetId = data?.id || data?.document?.id || data?.newDocument?.id;
      if (targetId) {
        navigate(`/documents/${targetId}/edit`);
      } else {
        fetchData();
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to create revision");
    } finally {
      setIsCreatingRevision(false);
    }
  };

  if (!doc) return <div className="p-8 text-center">Loading document...</div>;

  const isLocked =
    doc.status?.name === "Published" ||
    doc.status?.name === "Archived" ||
    doc.status?.name === "In Review" ||
    doc.status?.name === "Submitted for Review";
  const activeWorkflow = workflows.length > 0 ? workflows[0] : null;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to="/documents"
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Library
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={async () => {
              const fileName = `${doc.docNumber}_${doc.title.replace(/\s+/g, "_")}`;
              toast.info("Exporting PDF...");
              try {
                await exportToPDF("printable-doc-content", fileName);
                toast.success("PDF exported successfully");
              } catch (e: any) {
                toast.error(e.message || "PDF export failed");
              }
            }}
            className="flex items-center gap-2 rounded bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-200 border border-slate-200"
          >
            <Download className="h-4 w-4" /> EXPORT PDF
          </button>
          <button
            onClick={() => {
              if (!doc) {
                toast.error("Document is missing, cannot print");
                return;
              }
              if (!printRef.current) {
                toast.error("Print target element not found");
                return;
              }
              handlePrint();
            }}
            className="flex items-center gap-2 rounded bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-200 border border-slate-200"
          >
            <Printer className="h-4 w-4" /> PRINT
          </button>
          {(doc.status?.name === "Published" || doc.status?.name === "Approved") &&
            currentUser &&
            ["Administrator", "EHS Manager", "EHS Engineer", "Operations Manager", "Warehouse Manager", "Site Leader"].includes(currentUser.role) && (
              <button
                onClick={handleCreateRevision}
                disabled={isCreatingRevision}
                className="flex items-center gap-2 rounded bg-amber-500 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <History className={`h-4 w-4 ${isCreatingRevision ? "animate-spin" : ""}`} /> {isCreatingRevision ? "CREATING..." : "CREATE REVISION"}
              </button>
            )}
          {!isLocked && (
            <button
              onClick={() => navigate(`/documents/${id}/edit`)}
              className="flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-blue-700"
            >
              <Edit className="h-4 w-4" /> EDIT DOCUMENT
            </button>
          )}
        </div>
      </div>

      {doc.status?.name === "Revision Requested" && (
        <div className="rounded-lg border-2 border-orange-100 bg-orange-50 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-orange-800">
            <AlertTriangle className="h-5 w-5" />
            <div>
              <p className="font-bold text-sm uppercase tracking-wider">
                Revision Requested
              </p>
              <p className="text-xs">
                Review comments below and edit document, then re-submit.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Approval & Workflow Section */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm mb-6">
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 border-b border-slate-100 pb-3 mb-4">
          Lifecycle & Approvals
        </h3>

        {doc.status?.name === "Draft" ||
        doc.status?.name === "Revision Requested" ? (
          <div className="space-y-4">
            <p className="text-xs text-slate-600">
              Add reviewers to submit this document for review.
            </p>
            <div className="text-[10px] uppercase text-slate-500 font-bold mb-2">
              Required Approvals:
              {doc.sifPotential
                ? " EHS Engineer, Site Leader"
                : doc.riskLevel === "high" || doc.riskLevel === "critical"
                  ? " EHS Engineer"
                  : doc.type?.name === "Emergency Procedure"
                    ? " Site Leader"
                    : " Supervisor"}
              {doc.requiredTraining && ", Training Coordinator"}
            </div>
            <div className="flex gap-4 items-center">
              <select
                className="rounded border p-2 text-xs flex-1"
                onChange={(e) => {
                  const val = e.target.value;
                  if (val && !selectedReviewers.includes(val))
                    setSelectedReviewers([...selectedReviewers, val]);
                }}
                value=""
              >
                <option value="">+ Add a Reviewer...</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role?.name})
                  </option>
                ))}
              </select>
              <button
                onClick={handleSubmitReview}
                className="rounded bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
                disabled={selectedReviewers.length === 0}
              >
                Submit for Review
              </button>
            </div>
            {selectedReviewers.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {selectedReviewers.map((rId) => {
                  const usr = users.find((u) => u.id === rId);
                  return usr ? (
                    <span
                      key={rId}
                      className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-[10px] font-bold border border-slate-200"
                    >
                      {usr.name} ({usr.role?.name})
                    </span>
                  ) : null;
                })}
              </div>
            )}
          </div>
        ) : doc.status?.name === "Approved" ? (
          <div className="space-y-4 text-center py-4 bg-green-50 rounded border border-green-100">
            <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto" />
            <div>
              <p className="font-bold text-green-800">
                Document Fully Approved
              </p>
              <p className="text-xs text-green-600 mt-1">
                Ready for controlled publication
              </p>
            </div>
            <button
              onClick={handlePublish}
              className="bg-green-600 px-6 py-2 rounded text-white text-xs font-bold uppercase tracking-wider hover:bg-green-700"
            >
              Publish Document
            </button>
          </div>
        ) : doc.status?.name === "Published" ? (
          <div className="space-y-4 text-center py-4 bg-blue-50 rounded border border-blue-100">
            <FileCheck2 className="h-8 w-8 text-blue-500 mx-auto" />
            <div>
              <p className="font-bold text-blue-800 uppercase tracking-widest text-sm">
                Active & Controlled
              </p>
              <p className="text-xs text-blue-600 mt-1">
                This document is live and read-only
              </p>
            </div>
            <button
              onClick={handleArchive}
              className="bg-slate-200 text-slate-700 px-4 py-1.5 rounded text-[10px] font-bold uppercase hover:bg-slate-300"
            >
              Archive Document
            </button>
          </div>
        ) : null}

        {activeWorkflow && (
          <div className="mt-6 pt-6 border-t border-slate-100">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">
              Current Workflow Status
            </h4>
            <div className="space-y-4">
              {activeWorkflow.steps.map((step: any) => (
                <div
                  key={step.id}
                  className="rounded border border-slate-200 p-4 flex gap-4"
                >
                  <div className="w-12 h-12 shrink-0 rounded bg-slate-100 flex items-center justify-center text-slate-400">
                    <User className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <p className="font-bold text-sm text-slate-800">
                        {step.reviewer?.name || "Unknown"}{" "}
                        <span className="text-xs text-slate-400 font-normal ml-2">
                          Step {step.order}
                        </span>
                      </p>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          step.status === "approved"
                            ? "bg-green-100 text-green-700"
                            : step.status === "rejected"
                              ? "bg-red-100 text-red-700"
                              : step.status === "revision_requested"
                                ? "bg-orange-100 text-orange-700"
                                : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {step.status}
                      </span>
                    </div>

                    {step.comments?.length > 0 && (
                      <div className="mt-3 bg-slate-50 border-l-2 border-indigo-200 pl-3 py-1 space-y-2 text-xs">
                        {step.comments.map((c: any) => (
                          <div key={c.id}>
                            <span className="font-bold text-slate-600">
                              {c.authorName}:{" "}
                            </span>
                            <span className="text-slate-500">{c.comment}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {step.status === "pending" &&
                      (doc.status?.name === "In Review" ||
                        doc.status?.name === "Submitted for Review") && (
                        <div className="mt-4 border-t pt-4 border-slate-100">
                          <textarea
                            placeholder="Add approval comment..."
                            className="w-full rounded border p-2 text-xs mb-2"
                            rows={2}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAction(step.id, "approve")}
                              className="bg-green-600 text-white px-3 py-1.5 rounded text-[10px] font-bold uppercase"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleAction(step.id, "revision")}
                              className="bg-orange-600 text-white px-3 py-1.5 rounded text-[10px] font-bold uppercase"
                            >
                              Request Revision
                            </button>
                            <button
                              onClick={() => handleAction(step.id, "reject")}
                              className="bg-red-600 text-white px-3 py-1.5 rounded text-[10px] font-bold uppercase"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm print:hidden">
        <div className="flex items-start justify-between border-b pb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
                {doc.title}
              </h1>
              {doc.sifPotential && (
                <span className="rounded bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white">
                  SIF POTENTIAL
                </span>
              )}
            </div>
            <p className="mt-1 font-mono text-sm text-slate-400">
              {doc.docNumber} • {doc.type?.name} • v{doc.currentRevision}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Current Status
            </p>
            <p className="font-bold text-green-600">{doc.status?.name}</p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-3 gap-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Department
            </p>
            <p className="text-sm font-medium text-slate-800">
              {doc.department?.name}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Risk Level
            </p>
            <p className="text-sm font-medium text-slate-800 uppercase">
              {doc.riskLevel}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Effective Date
            </p>
            <p className="text-sm font-medium text-slate-800">
              {doc.effectiveDate
                ? format(new Date(doc.effectiveDate), "MMM d, yyyy")
                : "Pending Approval"}
            </p>
          </div>
        </div>

        <div className="mt-8 space-y-8">
          {/* Active Version Ribbon */}
          {doc.isArchived ? (
            <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-4 text-rose-700">
              <Shield className="h-6 w-6 shrink-0" />
              <div>
                <p className="text-xs font-black uppercase tracking-widest">
                  Historical Archive
                </p>
                <p className="text-[10px] font-bold opacity-80 uppercase">
                  This protocol is no longer effective for warehouse operations.
                </p>
              </div>
            </div>
          ) : (
            doc.status?.name === "Published" && (
              <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-4 text-emerald-700">
                <FileCheck2 className="h-6 w-6 shrink-0" />
                <div>
                  <p className="text-xs font-black uppercase tracking-widest">
                    Authorized Execution Copy
                  </p>
                  <p className="text-[10px] font-bold opacity-80 uppercase">
                    Effective Date:{" "}
                    {doc.effectiveDate
                      ? format(new Date(doc.effectiveDate), "MMM d, yyyy")
                      : "Immediate"}
                  </p>
                </div>
              </div>
            )
          )}

          {/* Revision Context */}
          {doc.changeSummary && (
            <div className="bg-blue-50/50 border border-blue-100 p-6 rounded-2xl">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-700 mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4" /> REVISION CHANGE NOTE
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                {doc.changeSummary}
              </p>
            </div>
          )}

          <section>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-800 border-b pb-1">
              Purpose & Scope
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 mb-1">
                  Purpose
                </p>
                <p className="text-sm text-slate-600 leading-relaxed italic">
                  "{doc.purpose || "No purpose statement provided."}"
                </p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 mb-1">
                  Scope
                </p>
                <p className="text-sm text-slate-600 leading-relaxed italic">
                  "{doc.scope || "No scope provided."}"
                </p>
              </div>
            </div>
          </section>

          {/* Procedure Steps Rendering */}
          {(doc.type?.name === "SOP" ||
            doc.type?.name === "Work Instruction") &&
            doc.procedureSteps?.length > 0 && (
              <section>
                <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-800 border-b pb-1">
                  {doc.type?.name === "SOP"
                    ? "Standard Operating Procedure"
                    : "Work Instruction Steps"}
                </h3>
                <div className="space-y-4">
                  {doc.procedureSteps.map((step: any) => (
                    <div
                      key={step.id}
                      className="flex gap-4 rounded-lg bg-slate-50 p-4 border border-slate-100"
                    >
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-slate-800 text-[10px] font-black text-white">
                        {step.order}
                      </div>
                      <div className="flex-1">
                        {step.title && (
                          <h4 className="text-[10px] font-black uppercase text-slate-800 mb-1">
                            {step.title}
                          </h4>
                        )}
                        <p className="text-sm text-slate-700 font-medium">
                          {step.action}
                        </p>
                        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                          {step.safetyNote && (
                            <div className="rounded border border-red-100 bg-red-50/50 px-2 py-1 text-[10px] text-red-700">
                              <strong>SAFETY:</strong> {step.safetyNote}
                            </div>
                          )}
                          {step.qualityNote && (
                            <div className="rounded border border-blue-100 bg-blue-50/50 px-2 py-1 text-[10px] text-blue-700">
                              <strong>QUALITY:</strong> {step.qualityNote}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

          {/* Checklist Rendering */}
          {(doc.type?.name === "Inspection Checklist" ||
            doc.type?.name === "Checklist") &&
            doc.checklistItems?.length > 0 && (
              <section>
                <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-800 border-b pb-1">
                  Inspection Checklist
                </h3>
                <div className="space-y-2">
                  {doc.checklistItems.map((item: any) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 border-b border-slate-100 pb-2 last:border-0"
                    >
                      <div className="h-4 w-4 rounded border border-slate-300"></div>
                      <div className="flex-1 text-sm text-slate-700 font-medium">
                        {item.requirement}
                      </div>
                      <div className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-black uppercase text-slate-500">
                        {item.frequency}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

          {/* JSA Steps Rendering */}
          {doc.type?.name === "JSA" && doc.jsaSteps?.length > 0 && (
            <section>
              <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-800 border-b pb-1 text-orange-600">
                Job Safety Analysis Matrix
              </h3>
              <div className="overflow-hidden rounded-lg border border-slate-200">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-500 border-b">
                    <tr>
                      <th className="px-4 py-2 w-12 text-center">#</th>
                      <th className="px-4 py-2">Task Description</th>
                      <th className="px-4 py-2">Potential Hazards</th>
                      <th className="px-4 py-2">Control Measures</th>
                      <th className="px-4 py-2 w-16 text-center">Risk</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs">
                    {doc.jsaSteps.map((step: any) => (
                      <tr key={step.id} className="border-b last:border-0">
                        <td className="px-4 py-3 text-center font-bold text-slate-400">
                          {step.order}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-800">
                          {step.taskDescription}
                        </td>
                        <td className="px-4 py-3 text-red-600 font-semibold">
                          {step.potentialHazards}
                        </td>
                        <td className="px-4 py-3 text-green-700 font-semibold">
                          {step.controlMeasures}
                        </td>
                        <td className="px-4 py-3 text-center uppercase font-bold text-slate-500">
                          {step.postRiskRating || "low"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* SIF Metadata Section */}
          {doc.sifPotential && doc.sifDetails && (
            <section className="rounded-lg border-2 border-red-100 bg-red-50/30 p-6">
              <h3 className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-red-600">
                <Shield className="h-4 w-4" /> Critical SIF Prevention Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-1">
                    Energy Source / Hazard
                  </p>
                  <p className="text-sm font-bold text-slate-800">
                    {doc.sifDetails.energySource || "Not Specified"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-1">
                    Critical Risk Category
                  </p>
                  <p className="text-sm font-bold text-slate-800">
                    {doc.sifDetails.criticalRiskCategory || "Not Specified"}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-1">
                    Potential Outcome
                  </p>
                  <p className="text-sm text-slate-700">
                    {doc.sifDetails.potentialOutcome || "Not Specified"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-1">
                    Identified Gaps
                  </p>
                  <p className="text-sm text-slate-700">
                    {doc.sifDetails.missingControls || "No gaps identified"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-1">
                    Verification Plan
                  </p>
                  <p className="text-sm text-slate-700">
                    {doc.sifDetails.controlVerification ||
                      "No verification plan"}
                  </p>
                </div>
              </div>
            </section>
          )}

          {doc.riskAssessments?.length > 0 && (
            <section className="rounded-lg border border-slate-100 bg-slate-50 p-6">
              <h3 className="mb-4 text-xs font-black uppercase tracking-widest text-slate-800">
                Risk Assessment Summary
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-1">
                    Pre-Control Score
                  </p>
                  <p className="text-xl font-black text-slate-800">
                    {doc.riskAssessments[0].preScore}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-1">
                    Residual Score
                  </p>
                  <p className="text-xl font-black text-blue-600">
                    {doc.riskAssessments[0].postScore}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-1">
                    Risk Reduction
                  </p>
                  <p className="text-xl font-black text-green-600">
                    {doc.riskAssessments[0].riskReduction}%
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-1">
                    Risk Level
                  </p>
                  <p className="text-xl font-black uppercase text-slate-800">
                    {doc.riskLevel}
                  </p>
                </div>
              </div>
            </section>
          )}

          {doc.criticalControls?.length > 0 && (
            <section>
              <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-green-700 border-b pb-1">
                Critical Controls
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {doc.criticalControls.map((c: any) => (
                  <div
                    key={c.id}
                    className="rounded-lg border border-green-100 bg-green-50/50 p-4"
                  >
                    <h4 className="text-sm font-bold text-slate-800">
                      {c.name}
                    </h4>
                    <div className="mt-2 text-xs text-slate-600 border-t border-green-100/50 pt-2">
                      <span className="font-bold text-slate-500 mr-2">
                        Verification:
                      </span>
                      {c.verificationMethod || "None"}
                    </div>
                    <div className="mt-1 text-xs text-slate-600">
                      <span className="font-bold text-slate-500 mr-2">
                        Frequency:
                      </span>
                      {c.frequency || "None"}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-800 border-b pb-1">
              Safety Requirements
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="rounded border border-slate-100 bg-slate-50 p-3">
                <p className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase text-slate-500">
                  <Shield className="h-3 w-3" /> Required PPE
                </p>
                <div className="flex flex-wrap gap-1">
                  {doc.ppe?.length > 0 ? (
                    doc.ppe.map((p: any) => (
                      <span
                        key={p.id}
                        className="rounded bg-white px-2 py-0.5 text-[10px] border border-slate-200"
                      >
                        {p.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-slate-400 italic">
                      None specified
                    </span>
                  )}
                </div>
              </div>
              <div className="rounded border border-red-50 bg-red-50/30 p-3">
                <p className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase text-red-600">
                  <AlertTriangle className="h-3 w-3" /> Critical Hazards
                </p>
                <div className="flex flex-wrap gap-1">
                  {doc.hazards?.length > 0 ? (
                    doc.hazards.map((h: any) => (
                      <span
                        key={h.id}
                        className="rounded bg-white px-2 py-0.5 text-[10px] border border-red-100 text-red-700"
                      >
                        {h.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-red-400 italic">
                      None specified
                    </span>
                  )}
                </div>
              </div>
              <div className="rounded border border-slate-100 bg-slate-50 p-3">
                <p className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase text-slate-500">
                  🔧 Tools/Equipment
                </p>
                <div className="flex flex-wrap gap-1">
                  {doc.equipment?.length > 0 ? (
                    doc.equipment.map((e: any) => (
                      <span
                        key={e.id}
                        className="rounded bg-white px-2 py-0.5 text-[10px] border border-slate-200"
                      >
                        {e.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-slate-400 italic">
                      None specified
                    </span>
                  )}
                </div>
              </div>
            </div>
          </section>

          {(doc.responsibilities || doc.definitions || doc.references) && (
            <section className="space-y-6 pt-4">
              {doc.responsibilities && (
                <div>
                  <h4 className="text-[10px] font-black uppercase text-slate-800 mb-1">
                    Responsibilities
                  </h4>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">
                    {doc.responsibilities}
                  </p>
                </div>
              )}
              {doc.definitions && (
                <div>
                  <h4 className="text-[10px] font-black uppercase text-slate-800 mb-1">
                    Definitions
                  </h4>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">
                    {doc.definitions}
                  </p>
                </div>
              )}
              {doc.references && (
                <div>
                  <h4 className="text-[10px] font-black uppercase text-slate-800 mb-1">
                    References
                  </h4>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">
                    {doc.references}
                  </p>
                </div>
              )}
            </section>
          )}

          {doc.revisions?.length > 0 && (
            <section className="pt-8 mt-8 border-t border-slate-100">
              <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-800 border-b pb-1">
                Revision History
              </h3>
              <div className="space-y-3">
                {doc.revisions.map((rev: any) => (
                  <div
                    key={rev.id}
                    className="flex gap-4 items-start text-xs border border-slate-100 p-3 rounded-lg bg-slate-50"
                  >
                    <span className="font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                      v{rev.revision}
                    </span>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-700">
                        {rev.changeNote}
                      </p>
                      <p className="text-slate-400 mt-1">
                        By {rev.author?.name} on{" "}
                        {format(new Date(rev.createdAt), "MMM d, y")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      <div 
        ref={printRef}
        className="print-source"
      >
        <DocumentPrintView document={doc} />
      </div>

      <div 
        ref={exportRef}
        className="export-only" 
        id="printable-doc-content"
      >
        <DocumentPrintView document={doc} />
      </div>
    </div>
  );
}
