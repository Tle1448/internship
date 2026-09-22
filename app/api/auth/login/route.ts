import { NextRequest, NextResponse } from "next/server";
import { isSameOrigin, sessionUserForAuthUser } from "@/lib/auth/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "ไม่อนุญาตคำขอจากเว็บไซต์อื่น" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const credentials = body as Record<string, unknown> | null;
  if (
    !credentials ||
    typeof credentials.username !== "string" ||
    typeof credentials.password !== "string" ||
    !credentials.username.trim() ||
    !credentials.password ||
    credentials.username.length > 200 ||
    credentials.password.length > 200
  ) {
    return NextResponse.json({ error: "กรุณากรอกอีเมลและรหัสผ่านให้ถูกต้อง" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: credentials.username.trim().toLowerCase(),
    password: credentials.password,
  });

  if (error || !data.user) {
    return NextResponse.json({ error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 });
  }

  const user = await sessionUserForAuthUser(supabase, data.user);
  if (!user) {
    await supabase.auth.signOut();
    return NextResponse.json({ error: "ไม่พบข้อมูลผู้ใช้ กรุณาติดต่อผู้ดูแลระบบ" }, { status: 403 });
  }

  return NextResponse.json({ user }, { headers: { "Cache-Control": "no-store" } });
}
