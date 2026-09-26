"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { isSessionUser, type SessionUser, type UserRole } from "@/lib/auth/types";
import { supabase } from "@/lib/supabase";

type AuthContextValue = { user: SessionUser | null; loading: boolean; login: (userCode: string, password: string, remember: boolean) => Promise<SessionUser>; logout: () => Promise<void> };
const AuthContext = createContext<AuthContextValue | null>(null);

function isBrowserSession(value: unknown): value is { access_token: string; refresh_token: string } {
  if (!value || typeof value !== "object") return false;
  const session = value as Record<string, unknown>;
  return typeof session.access_token === "string" && typeof session.refresh_token === "string";
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const revision = useRef(0);
  const loadUser = useCallback(async (userId: string, email: string | undefined): Promise<SessionUser> => {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("full_name, user_code, role")
      .eq("id", userId)
      .single();

    if (error) throw new Error("ไม่พบข้อมูลผู้ใช้ในระบบ กรุณาติดต่อผู้ดูแลระบบ");

    const allowedRoles: UserRole[] = ["admin", "student", "coordinator", "advisor"];
    if (!allowedRoles.includes(profile.role as UserRole)) {
      throw new Error("บัญชีผู้ใช้ไม่มีสิทธิ์เข้าใช้งานระบบ");
    }

    return {
      id: userId,
      userCode: profile.user_code || email || userId,
      name: profile.full_name || email || "ผู้ใช้งาน",
      role: profile.role as UserRole,
    };
  }, []);

  const refresh = useCallback(async () => {
    const current = ++revision.current;
    try {
      const { data: { user: authUser }, error } = await supabase.auth.getUser();
      if (error || !authUser) {
        // A temporary network/Auth API failure must not discard a valid local
        // session. Supabase emits SIGNED_OUT when the session is truly removed.
        if (!error && current === revision.current) setUser(null);
        return;
      }
      const sessionUser = await loadUser(authUser.id, authUser.email);
      if (current === revision.current) setUser(sessionUser);
    } catch (refreshError) {
      console.warn("Unable to refresh the current user; keeping the existing session.", refreshError);
    }
    finally { if (current === revision.current) setLoading(false); }
  }, [loadUser]);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || (event === "INITIAL_SESSION" && !session)) {
        revision.current++;
        setUser(null);
        setLoading(false);
        return;
      }
      if (event === "INITIAL_SESSION" || event === "SIGNED_IN" || event === "USER_UPDATED") {
        window.setTimeout(() => void refresh(), 0);
      }
    });
    return () => authListener.subscription.unsubscribe();
  }, [refresh]);

  async function login(userCode: string, password: string, remember: boolean) {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userCode, password, remember }),
    });
    const data: unknown = await response.json();
    const result = data as { user?: unknown; session?: unknown; error?: string };
    if (!response.ok || !isSessionUser(result.user) || !isBrowserSession(result.session)) {
      throw new Error(result.error || "เข้าสู่ระบบไม่สำเร็จ");
    }

    const { error: sessionError } = await supabase.auth.setSession(result.session);
    if (sessionError) {
      throw new Error("ไม่สามารถยืนยัน session บนเบราว์เซอร์ได้");
    }

    const sessionUser = result.user;
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
