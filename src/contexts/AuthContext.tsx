import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";
import { processSyncQueue } from "../lib/offlineSync";
import { aiService } from "../services/aiService";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  department: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Temporary development-only bypass detection
  const isBypass = import.meta.env.VITE_AUTH_BYPASS === "true";

  const [user, setUser] = useState<User | null>(
    isBypass
      ? {
          id: "dev-admin-id",
          email: "dev.admin@safecore.local",
          name: "Dev Admin",
          role: "Administrator",
          department: "Management",
        }
      : null
  );
  const [token, setToken] = useState<string | null>(
    isBypass ? "dev-bypass-token" : localStorage.getItem("token")
  );
  const [isLoading, setIsLoading] = useState(!isBypass);

  // Sync token with AIService
  useEffect(() => {
    aiService.setToken(token);
  }, [token]);

  useEffect(() => {
    const handleOnline = () => {
      if (token) processSyncQueue(token);
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [token]);

  useEffect(() => {
    const checkAuth = async () => {
      // Temporary development-only auth bypass guard
      if (import.meta.env.VITE_AUTH_BYPASS === "true") {
        setIsLoading(false);
        return;
      }
      const storedToken = localStorage.getItem("token");
      if (storedToken) {
        try {
          const res = await fetch("/api/auth/me", {
            headers: { Authorization: `Bearer ${storedToken}` },
            credentials: "include",
          });
          if (res.ok) {
            const userData = await res.json();
            setUser(userData);
            setToken(storedToken);
            aiService.setToken(storedToken); // Immediate sync
            // Process queue on bootstrap if online
            if (navigator.onLine) processSyncQueue(storedToken);
          } else {
            localStorage.removeItem("token");
            setToken(null);
            setUser(null);
            aiService.setToken(null);
          }
        } catch (error) {
          console.error("Auth check failed", error);
        }
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    setUser(newUser);
    aiService.setToken(newToken);
    toast.success(`Welcome back, ${newUser.name}`);
    if (navigator.onLine) processSyncQueue(newToken);
  };

  const logout = async () => {
    try {
      if (import.meta.env.VITE_AUTH_BYPASS !== "true") {
        await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "include",
        });
      }
    } catch (e) {
      console.warn("Logout request failed", e);
    }

    // Temporary development-only auth bypass logout behavior (skip redirecting to login)
    if (import.meta.env.VITE_AUTH_BYPASS === "true") {
      setUser({
        id: "dev-admin-id",
        email: "dev.admin@safecore.local",
        name: "Dev Admin",
        role: "Administrator",
        department: "Management"
      });
      setToken("dev-bypass-token");
      toast.info("Development Auth Bypass active: Resetting sandbox session");
      return;
    }

    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    aiService.setToken(null);
    toast.info("Logged out successfully");
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
