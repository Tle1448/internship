import { supabase } from "./supabase";

async function getAuthenticatedUserId(): Promise<string | null> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) return null;
  return user?.id ?? null;
}

export async function getCurrentStudentId(): Promise<string | null> {
  return getAuthenticatedUserId();
}

export async function getCurrentAdvisorId(): Promise<string | null> {
  return getAuthenticatedUserId();
}
