"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { isSessionUser, type SessionUser } from "@/lib/auth/types";

type AuthContextValue = { user: SessionUser | null; loading: boolean; login: (username: string, password: string, remember: boolean) => Promise<SessionUser>; logout: () => Promise<void> };
const AuthContext = createContext<AuthContextValue | null>(null);

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const revision = useRef(0);
  const refresh = useCallback(async () => {
    const current = ++revision.current;
    try {
      const response = await fetch("/api/auth/session", { cache: "no-store" });
      if (!response.ok) throw new Error();
      const data = await response.json();
      if (current === revision.current) setUser(isSessionUser(data.user) ? data.user : null);
    } catch { if (current === revision.current) setUser(null); }
    finally { if (current === revision.current) setLoading(false); }
  }, []);

  useEffect(() => {
    void refresh();
    const onVisible = () => { if (document.visibilityState === "visible") void refresh(); };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", onVisible);
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") void refresh(); }, 60000);
    return () => { revision.current++; window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", onVisible); window.clearInterval(timer); };
  }, [refresh]);

  async function login(username: string, password: string, remember: boolean) {
    const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password, remember }) });
    const data = await response.json();
    if (!response.ok || !isSessionUser(data.user)) throw new Error(data.error || "เข้าสู่ระบบไม่สำเร็จ");
    revision.current++;
    setUser(data.user); setLoading(false);
    return data.user as SessionUser;
  }

  async function logout() {
    const response = await fetch("/api/auth/logout", { method: "POST" });
    if (!response.ok) throw new Error("ออกจากระบบไม่สำเร็จ กรุณาลองอีกครั้ง");
    revision.current++;
    setUser(null); setLoading(false);
  }

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be inside AuthProvider");
  return context;
}
