"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { type SessionUser, type UserRole } from "@/lib/auth/types";
import { supabase } from "@/lib/supabase";

type AuthContextValue = { user: SessionUser | null; loading: boolean; login: (username: string, password: string, remember: boolean) => Promise<SessionUser>; logout: () => Promise<void> };
const AuthContext = createContext<AuthContextValue | null>(null);

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const revision = useRef(0);
  const loadUser = useCallback(async (userId: string, email: string | undefined): Promise<SessionUser> => {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("full_name, student_code, role")
      .eq("id", userId)
      .single();

    if (error) throw new Error("ไม่พบข้อมูลผู้ใช้ในระบบ กรุณาติดต่อผู้ดูแลระบบ");

    const allowedRoles: UserRole[] = ["admin", "student", "coordinator", "advisor"];
    if (!allowedRoles.includes(profile.role as UserRole)) {
      throw new Error("บัญชีผู้ใช้ไม่มีสิทธิ์เข้าใช้งานระบบ");
    }

    return {
      id: userId,
      username: profile.student_code || email || userId,
      name: profile.full_name || email || "ผู้ใช้งาน",
      role: profile.role as UserRole,
    };
  }, []);

  const refresh = useCallback(async () => {
    const current = ++revision.current;
    try {
      const { data: { user: authUser }, error } = await supabase.auth.getUser();
      if (error || !authUser) {
        if (current === revision.current) setUser(null);
        return;
      }
      const sessionUser = await loadUser(authUser.id, authUser.email);
      if (current === revision.current) setUser(sessionUser);
    } catch { if (current === revision.current) setUser(null); }
    finally { if (current === revision.current) setLoading(false); }
  }, [loadUser]);

  useEffect(() => {
    const initialRefresh = window.setTimeout(() => void refresh(), 0);
    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      window.setTimeout(() => void refresh(), 0);
    });
    const onVisible = () => { if (document.visibilityState === "visible") void refresh(); };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", onVisible);
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") void refresh(); }, 60000);
    return () => { window.clearTimeout(initialRefresh); authListener.subscription.unsubscribe(); window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", onVisible); window.clearInterval(timer); };
  }, [refresh]);

  async function login(username: string, password: string, remember: boolean) {
    void remember;
    const { data, error } = await supabase.auth.signInWithPassword({ email: username, password });
    if (error || !data.user) throw new Error("อีเมลหรือรหัสผ่านไม่ถูกต้อง");

    let sessionUser: SessionUser;
    try {
      sessionUser = await loadUser(data.user.id, data.user.email);
    } catch (profileError) {
      await supabase.auth.signOut();
      throw profileError;
    }
    revision.current++;
    setUser(sessionUser); setLoading(false);
    return sessionUser;
  }

  async function logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error("ออกจากระบบไม่สำเร็จ กรุณาลองอีกครั้ง");
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
