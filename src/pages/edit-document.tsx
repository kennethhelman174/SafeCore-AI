import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { DocumentBuilder } from "../components/DocumentBuilder";
import { useAuth } from "../contexts/AuthContext";

export function EditDocument() {
  const { id } = useParams();
  const { token } = useAuth();
  const [doc, setDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/documents/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setDoc(data);
        setLoading(false);
      })
      .catch(console.error);
  }, [id]);

  if (loading) return <div className="p-8 text-center uppercase text-xs font-bold text-slate-400">Loading Record...</div>;
  if (!doc) return <div className="p-8 text-center uppercase text-xs font-bold text-red-400">Document Not Found</div>;

  const isLocked = doc.status?.name === "Published" || doc.status?.name === "Archived" || doc.status?.name === "In Review" || doc.status?.name === "Submitted for Review" || doc.status?.name === "Approved";
  
  if (isLocked) {
     return <div className="p-8 text-center uppercase text-sm font-bold text-red-600">This document is locked for editing ({doc.status?.name}). Please open from view mode to request a revision.</div>;
  }

  return <DocumentBuilder mode="edit" docId={id} initialData={doc} />;
}
