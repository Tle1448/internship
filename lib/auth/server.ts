import type { SupabaseClient, User } from "@supabase/supabase-js";
import { roleLabels, type SessionUser, type UserRole } from "./types";

export function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return origin === new URL(request.url).origin;
}

export async function sessionUserForAuthUser(
  supabase: SupabaseClient,
  authUser: User,
): Promise<SessionUser | null> {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("full_name, user_code, role")
    .eq("id", authUser.id)
    .single();

  if (error || !profile || !Object.hasOwn(roleLabels, profile.role)) return null;

  return {
    id: authUser.id,
    userCode: profile.user_code || authUser.id,
    name: profile.full_name || authUser.email || "ผู้ใช้งาน",
    role: profile.role as UserRole,
  };
}
