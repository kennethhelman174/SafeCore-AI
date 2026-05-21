/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/layout";
import { Dashboard } from "./pages/dashboard";
import { DocumentLibrary } from "./pages/document-library";
import { ViewDocument } from "./pages/view-document";
import { CreateDocument } from "./pages/create-document";
import { EditDocument } from "./pages/edit-document";
import LoginPage from "./pages/login";
import CorrectiveActionsPage from "./pages/corrective-actions";
import TrainingDashboard from "./pages/training-dashboard";
import TrainingRecords from "./pages/training-records";
import TrainingMatrix from "./pages/training-matrix";
import AuditDashboard from "./pages/audit-dashboard";
import ComplianceReports from "./pages/compliance-reports";
import MS365Readiness from "./pages/ms365-readiness";
import RiskMatrixPage from "./pages/risk-matrix";
import AISettings from "./pages/ai-settings";
import AdminDashboard from "./pages/admin-dashboard";
import { LibraryPage } from "./components/library-template";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

function AppContent() {
  const { user, isLoading, logout, authDisabled } = useAuth();
  const isAuthenticated = !!user;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Securing Session...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Toaster position="top-right" />
      {authDisabled && (
        <div className="bg-amber-500 text-black text-center font-bold text-xs py-1 tracking-wider uppercase z-50 relative">
          Authentication Disabled — Development/Test Mode
        </div>
      )}
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <LoginPage />} />
        
        <Route 
          path="/" 
          element={isAuthenticated ? <Layout onLogout={logout} /> : <Navigate to="/login" />}
        >
          <Route index element={<Dashboard />} />
          <Route path="documents" element={<DocumentLibrary />} />
          <Route path="documents/new" element={<CreateDocument />} />
          <Route path="documents/:id/edit" element={<EditDocument />} />
          <Route path="documents/:id" element={<ViewDocument />} />
          <Route path="ppe" element={<LibraryPage title="PPE Master Library" endpoint="/api/library/ppe" description="Personal Protective Equipment master list for warehouse safety." />} />
          <Route path="hazards" element={<LibraryPage title="Hazard Master Library" endpoint="/api/library/hazards" description="Standard warehouse hazard definitions and potential outcomes." />} />
          <Route path="controls" element={<LibraryPage title="Control Master Library" endpoint="/api/library/controls" description="Standard safety control measures and hierarchy of mitigations." />} />
          <Route path="equipment" element={<LibraryPage title="Equipment Master Library" endpoint="/api/library/equipment" description="Facility equipment inventory and inspection frequencies." />} />
          <Route path="actions" element={<CorrectiveActionsPage />} />
          <Route path="training" element={<TrainingDashboard />} />
          <Route path="training-records" element={<TrainingRecords />} />
          <Route path="training-matrix" element={<TrainingMatrix />} />
          <Route path="audit-readiness" element={<AuditDashboard />} />
          <Route path="compliance-reports" element={<ComplianceReports />} />
          <Route path="ms365-readiness" element={<MS365Readiness />} />
          <Route path="risks" element={<RiskMatrixPage />} />
          <Route path="ai-settings" element={<AISettings />} />
          <Route 
            path="admin" 
            element={user?.role === "Administrator" ? <AdminDashboard /> : <Navigate to="/" />} 
          />
          <Route 
            path="settings" 
            element={user?.role === "Administrator" ? <AdminDashboard /> : <Navigate to="/" />} 
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
