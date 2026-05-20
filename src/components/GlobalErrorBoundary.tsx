import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCcw, ShieldAlert } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
          <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden">
            <div className="p-8 bg-rose-600 text-white text-center">
              <div className="h-20 w-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/20">
                <ShieldAlert className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-xl font-black uppercase tracking-tighter">System Critical Error</h1>
              <p className="text-[10px] font-bold uppercase tracking-widest text-rose-100 mt-1">Fault Isolation Engine Triggered</p>
            </div>
            <div className="p-8 space-y-6 text-center">
              <div className="space-y-2">
                <p className="text-sm font-bold text-slate-800">The application encountered an unexpected state.</p>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-left font-mono text-[10px] text-slate-500 overflow-auto max-h-32">
                   {this.state.error?.message}
                   <br/>
                   {this.state.error?.stack}
                </div>
              </div>
              
              <button 
                onClick={() => window.location.reload()}
                className="w-full bg-slate-900 text-white py-4 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition flex items-center justify-center gap-2"
              >
                <RefreshCcw className="h-4 w-4" /> Reset Application State
              </button>
              
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest border-t border-slate-100 pt-4">
                 Technical Support: safety-tech@warehouse.local
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
