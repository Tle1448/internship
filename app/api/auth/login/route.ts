import { NextRequest, NextResponse } from "next/server";
import { isSameOrigin, sessionUserForAuthUser } from "@/lib/auth/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import type { UserRole } from "@/lib/auth/types";

export const runtime = "nodejs";

function roleForUserCode(userCode: string): UserRole | null {
  if (/^\d{8}$/.test(userCode)) return "student";
  if (/^ADV\d{4,6}$/.test(userCode)) return "advisor";
  if (/^ADM\d{4,6}$/.test(userCode)) return "admin";
  if (/^COR\d{4,6}$/.test(userCode)) return "coordinator";
  return null;
}

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
    typeof credentials.userCode !== "string" ||
    typeof credentials.password !== "string" ||
    !credentials.userCode.trim() ||
    !credentials.password ||
    credentials.userCode.length > 200 ||
    credentials.password.length > 200
  ) {
    return NextResponse.json({ error: "กรุณากรอกรหัสผู้ใช้งานและรหัสผ่านให้ถูกต้อง" }, { status: 400 });
  }

  const userCode = credentials.userCode.trim().toUpperCase();
  const expectedRole = roleForUserCode(userCode);
  if (!expectedRole) {
    return NextResponse.json({ error: "รูปแบบรหัสผู้ใช้งานไม่ถูกต้อง" }, { status: 400 });
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("id, role")
    .ilike("user_code", userCode)
    .maybeSingle();

  if (profileError) {
    console.error("Unable to resolve login user code:", profileError.message);
    return NextResponse.json({ error: "ระบบเข้าสู่ระบบไม่พร้อมใช้งาน" }, { status: 503 });
  }

  if (!profile || profile.role !== expectedRole) {
    return NextResponse.json({ error: "รหัสผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 });
  }

  const { data: authRecord, error: authRecordError } = await supabaseAdmin.auth.admin.getUserById(profile.id);
  const email = authRecord.user?.email;
  if (authRecordError || !email) {
    console.error("Unable to resolve Supabase Auth user:", authRecordError?.message ?? "Missing email");
    return NextResponse.json({ error: "ระบบเข้าสู่ระบบไม่พร้อมใช้งาน" }, { status: 503 });
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: credentials.password });

  if (error || !data.user || data.user.id !== profile.id) {
    return NextResponse.json({ error: "รหัสผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 });
  }

  const user = await sessionUserForAuthUser(supabase, data.user);
  if (!user) {
    await supabase.auth.signOut();
    return NextResponse.json({ error: "ไม่พบข้อมูลผู้ใช้ กรุณาติดต่อผู้ดูแลระบบ" }, { status: 403 });
  }

  return NextResponse.json({ user }, { headers: { "Cache-Control": "no-store" } });
}
