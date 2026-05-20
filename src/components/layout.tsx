import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, FileText, Settings, Menu, Shield, 
  ClipboardCheck, AlertTriangle, GraduationCap, BarChart3,
  FileSearch, Archive, Download, BrainCircuit, Cloud,
  LogOut, ShieldAlert, Wrench
} from "lucide-react";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import AIAssistant from "./AIAssistant";
import { useAuth } from "../contexts/AuthContext";

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Document Library", href: "/documents", icon: FileText },
  { name: "Corrective Actions", href: "/actions", icon: ClipboardCheck },
];

const trainingItems = [
  { name: "Training Dashboard", href: "/training", icon: GraduationCap },
  { name: "My Training Records", href: "/training-records", icon: GraduationCap },
  { name: "Training Matrix", href: "/training-matrix", icon: GraduationCap },
]

const reportItems = [
  { name: "Audit Readiness", href: "/audit-readiness", icon: BarChart3 },
  { name: "Compliance Reports", href: "/compliance-reports", icon: FileSearch },
  { name: "M365 Readiness", href: "/ms365-readiness", icon: Cloud },
]

const safetyItems = [
  { name: "Risk Matrix", href: "/risks", icon: AlertTriangle },
  { name: "PPE Library", href: "/ppe", icon: Shield },
  { name: "Hazard Library", href: "/hazards", icon: Shield },
  { name: "Control Library", href: "/controls", icon: Shield },
  { name: "Equipment Library", href: "/equipment", icon: Wrench },
];

export function Layout({ onLogout }: { onLogout: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isAdmin = user?.role === "Administrator";
  const [searchQuery, setSearchQuery] = useState("");

  const isNavActive = (href: string) => {
    if (href === "/") return location.pathname === "/";
    return location.pathname.startsWith(href);
  };

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      navigate(`/documents?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
    }
  };

  return (
    <div className="flex h-full w-full bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* Sidebar */}
      <aside className="hidden w-64 bg-slate-900 flex-col sm:flex">
        <div className="flex items-center gap-3 p-6 pb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-500 shadow-lg shadow-blue-500/20">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-black tracking-tighter text-white">SAFECORE</span>
        </div>
        <nav className="flex-1 space-y-1 px-4 overflow-y-auto no-scrollbar">
          <div className="px-3 pb-2 pt-2 text-[10px] font-black uppercase tracking-widest text-slate-500">Operation Center</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = isNavActive(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                  isActive 
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
          
          <div className="px-3 pb-2 pt-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Competency Tracking</div>
          {trainingItems.map((item) => {
            const Icon = item.icon;
            const isActive = isNavActive(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                  isActive 
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}

          <div className="px-3 pb-2 pt-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Enterprise Analytics</div>
          {reportItems.map((item) => {
            const Icon = item.icon;
            const isActive = isNavActive(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                  isActive 
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
          
          <div className="px-3 pb-2 pt-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Safety Assets</div>
          {safetyItems.map((item) => {
            const Icon = item.icon;
            const isActive = isNavActive(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                  isActive 
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}

          <div className="px-3 pb-2 pt-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Infrastructure</div>
          {isAdmin && (
            <Link to="/admin" className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${isNavActive('/admin') ? "bg-amber-600 text-white shadow-lg shadow-amber-600/20" : "text-amber-500 hover:text-white hover:bg-slate-800"}`}>
              <ShieldAlert className="h-4 w-4" />
              Security & Health
            </Link>
          )}
          <Link to="/ai-settings" className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${isNavActive('/ai-settings') ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}>
            <BrainCircuit className="h-4 w-4" />
            AI Systems Engine
          </Link>
        </nav>
        
        <div className="border-t border-slate-800 p-4 bg-slate-900/50">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md">
              <span className="font-black text-white text-sm">{user?.name?.charAt(0) || 'U'}</span>
            </div>
            <div className="overflow-hidden flex-1">
              <p className="truncate text-[11px] font-black text-white uppercase tracking-tight">{user?.name}</p>
              <p className="truncate text-[9px] font-bold text-slate-500 uppercase">{user?.role}</p>
            </div>
            <button 
              onClick={onLogout}
              className="p-2 text-slate-500 hover:text-rose-500 transition-colors rounded-lg hover:bg-rose-500/10"
              title="End Secure Session"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-8 shadow-sm z-10">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-black tracking-tighter text-slate-800 uppercase">Enterprise Warehouse Safety</h1>
            <div className="h-5 w-[1px] bg-slate-200"></div>
            <span className="rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-600 flex items-center gap-1.5 shadow-sm">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
              {user?.department || 'SECURE NODE'}
            </span>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search protocols..." 
                className="w-72 rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-inner"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
              />
              <div className="absolute left-3 top-2.5 text-xs text-slate-400 font-black">/</div>
            </div>
            <Button 
               onClick={() => navigate("/documents/new")}
               className="bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-[10px] px-6 rounded-xl shadow-lg shadow-blue-600/20"
            >
              + DEPLOY NEW PROTOCOL
            </Button>
          </div>
        </header>

        {/* Dashboard Viewport / Page Content */}
        <div className="flex-1 overflow-auto p-4 sm:p-8 bg-slate-50/50">
          <Outlet />
          <AIAssistant />
        </div>
        
        {/* Footer Status Bar */}
        <footer className="flex h-10 items-center justify-between border-t border-slate-200 bg-white px-8 text-[9px] font-black uppercase tracking-widest text-slate-400">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500"></div> 
              Environment: {process.env.NODE_ENV === "production" ? "Production Secure" : "Development Build"}
            </span>
            <span className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-blue-500"></div> AI Mesh: llama3.1-8b</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">Session: {user?.id?.substring(0,8)}</span>
            <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">Role: {user?.role}</span>
            <span className="text-blue-600 font-bold tracking-widest">BUILD 2026.05.19</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
