import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Mail, Loader2, ShieldCheck, Warehouse } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
import { motion } from "motion/react";

export default function LoginPage() {
  const [email, setEmail] = useState("admin@warehouse.local");
  const [password, setPassword] = useState("SafeCore2026!");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const trimmedEmail = email.trim();
      const trimmedPassword = password.trim();

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: trimmedEmail, password: trimmedPassword })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");

      login(data.token, data.user);
      navigate("/");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
      >
        <div className="p-8 bg-slate-900 text-white text-center">
          <div className="h-16 w-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20">
             <Warehouse className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tighter">SafeCore Enterprise</h1>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">Warehouse Safety Management System</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
           <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                 <Mail className="h-3 w-3" /> Email Address
              </label>
              <input 
                type="email"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                placeholder="e.g. admin@warehouse.local"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
           </div>

           <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                 <Lock className="h-3 w-3" /> Password
              </label>
              <input 
                type="password"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
           </div>

           <button 
             type="submit"
             disabled={isSubmitting}
             className="w-full bg-blue-600 text-white py-4 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-blue-700 transition shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
           >
             {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
             Secure Access Login
           </button>

           <div className="pt-4 border-t border-slate-100">
              <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest">
                 Authorized Personnel Only • IP Logged
              </p>
           </div>
        </form>
      </motion.div>
    </div>
  );
}
