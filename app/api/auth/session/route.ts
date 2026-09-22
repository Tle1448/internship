import { NextResponse } from "next/server";
import { sessionUserForAuthUser } from "@/lib/auth/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export const runtime = "nodejs";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  const user = authUser ? await sessionUserForAuthUser(supabase, authUser) : null;
  return NextResponse.json({ user }, { headers: { "Cache-Control": "no-store" } });
}
