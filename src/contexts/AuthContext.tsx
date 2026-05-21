import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";
import { processSyncQueue } from "../lib/offlineSync";
import { aiService } from "../services/aiService";
import { setGlobalAuthDisabled } from "../lib/api";

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
  authDisabled: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authDisabled, setAuthDisabled] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [isLoading, setIsLoading] = useState(true);

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
      let isConfigDisabled = false;
      try {
        const configRes = await fetch("/api/config");
        if (configRes.ok) {
          const configData = await configRes.json();
          isConfigDisabled = configData.authDisabled;
          setAuthDisabled(isConfigDisabled);
          setGlobalAuthDisabled(isConfigDisabled);
        }
      } catch (err) {
        console.error("Failed to load runtime config:", err);
      }

      if (isConfigDisabled) {
        setUser({
          id: "dev-admin-id",
          email: "admin@warehouse.local",
          name: "Dev Admin",
          role: "Administrator",
          department: "Management",
        });
        setToken("dev-bypass-token");
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
      if (!authDisabled) {
        await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "include",
        });
      }
    } catch (e) {
      console.warn("Logout request failed", e);
    }

    if (authDisabled) {
      setUser({
        id: "dev-admin-id",
        email: "admin@warehouse.local",
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
    <AuthContext.Provider value={{ user, token, login, logout, isLoading, authDisabled }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
