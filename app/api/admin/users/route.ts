import { NextRequest, NextResponse } from "next/server";
import { isSameOrigin } from "@/lib/auth/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const allowedRoles = new Set(["student", "advisor", "coordinator", "admin"]);

type UserPayload = {
  id?: unknown;
  userCode?: unknown;
  fullName?: unknown;
  email?: unknown;
  password?: unknown;
  role?: unknown;
  faculty?: unknown;
  major?: unknown;
  isActive?: unknown;
};

async function requireAdmin() {
  const sessionClient = await createSupabaseServerClient();
  const { data: { user } } = await sessionClient.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabaseAdmin.from("profiles").select("role").eq("id", user.id).maybeSingle();
  return profile?.role === "admin" ? user : null;
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function roleValue(value: unknown) {
  const role = stringValue(value).toLowerCase();
  return allowedRoles.has(role) ? role : null;
}

async function readBody(request: NextRequest): Promise<UserPayload | null> {
  try { return await request.json() as UserPayload; } catch { return null; }
}

function validCode(code: string, role: string) {
  const patterns: Record<string, RegExp> = { student: /^[0-9]{8}$/, advisor: /^ADV[0-9]{4,6}$/, admin: /^ADM[0-9]{4,6}$/, coordinator: /^COR[0-9]{4,6}$/ };
  return patterns[role]?.test(code) ?? false;
}

async function checkDuplicate(code: string, email: string, excludeId?: string) {
  for (const [column, value] of [["user_code", code], ["email", email]]) {
    if (!value) continue;
    let query = supabaseAdmin.from("profiles").select("id").eq(column, value);
    if (excludeId) query = query.neq("id", excludeId);
    const { data, error } = await query.limit(1);
    if (error) return NextResponse.json({ error: "ตรวจสอบข้อมูลซ้ำไม่สำเร็จ กรุณาลองใหม่" }, { status: 503 });
    if (data?.length) return NextResponse.json({ error: column === "user_code" ? "รหัสนี้มีบัญชีอยู่แล้ว กรุณาค้นหาบัญชีเดิมในหน้าจัดการผู้ใช้งาน" : "อีเมลนี้มีบัญชีอยู่แล้ว", field: column === "user_code" ? "userCode" : "email" }, { status: 409 });
  }
  return null;
}

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: "Admin access is required" }, { status: 403 });
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id, user_code, full_name, email, role, faculty, major, created_at")
    .order("full_name", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ users: (data ?? []).map((user) => ({ ...user, is_active: true })) });
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  if (!await requireAdmin()) return NextResponse.json({ error: "Admin access is required" }, { status: 403 });
  const body = await readBody(request);
  if (!body) return NextResponse.json({ error: "Invalid request body" }, { status: 400 });

  const userCode = stringValue(body.userCode).toUpperCase();
  const fullName = stringValue(body.fullName);
  const email = stringValue(body.email).toLowerCase();
  const password = typeof body.password === "string" ? body.password : "";
  const role = roleValue(body.role);
  if (!fullName || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8 || !role) {
    return NextResponse.json({ error: "User code, name, email, password, or role is invalid" }, { status: 400 });
  }

  if (role === "student" && !validCode(userCode, role)) return NextResponse.json({ error: "กรุณากรอกรหัสนักศึกษาเป็นตัวเลข 8 หลัก", field: "userCode" }, { status: 400 });
  if (role !== "student" && userCode) return NextResponse.json({ error: "ระบบจะกำหนดรหัสบัญชีสำหรับบทบาทนี้เมื่อบันทึก", field: "userCode" }, { status: 400 });
  const duplicate = await checkDuplicate(userCode, email);
  if (duplicate) return duplicate;

  const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email, password, email_confirm: true,
    app_metadata: { role }, user_metadata: { full_name: fullName },
  });
  if (createError || !created.user) return NextResponse.json({ error: createError?.message ?? "Unable to create account" }, { status: 400 });

  const { data: profile, error: profileError } = await supabaseAdmin.from("profiles").update({
    ...(role === "student" ? { user_code: userCode } : {}), full_name: fullName, email, role,
    faculty: stringValue(body.faculty) || null, major: stringValue(body.major) || null,
  }).eq("id", created.user.id).select("id, user_code, full_name, email, role, faculty, major").single();
  if (profileError) {
    const { error: cleanupError } = await supabaseAdmin.auth.admin.deleteUser(created.user.id);
    if (cleanupError) return NextResponse.json({ error: "สร้างบัญชีไม่สมบูรณ์ กรุณาตรวจสอบรายชื่อผู้ใช้งานก่อนลองใหม่" }, { status: 500 });
    return NextResponse.json({ error: profileError.code === "23505" ? "รหัสนี้มีบัญชีอยู่แล้ว กรุณาค้นหาบัญชีเดิมในหน้าจัดการผู้ใช้งาน" : profileError.message, field: profileError.code === "23505" ? "userCode" : undefined }, { status: profileError.code === "23505" ? 409 : 400 });
  }
  return NextResponse.json({ user: profile ? { ...profile, is_active: true } : profile }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admin access is required" }, { status: 403 });
  const body = await readBody(request);
  const id = stringValue(body?.id);
  const role = roleValue(body?.role);
  if (!body || !id || !role) return NextResponse.json({ error: "User id or role is invalid" }, { status: 400 });

  const fullName = stringValue(body.fullName);
  const email = stringValue(body.email).toLowerCase();
  const userCode = stringValue(body.userCode).toUpperCase();
  if (!fullName || !userCode || !/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: "User code, name, or email is invalid" }, { status: 400 });

  const { data: original, error: originalError } = await supabaseAdmin.from("profiles").select("user_code, role").eq("id", id).maybeSingle();
  if (originalError) return NextResponse.json({ error: "โหลดบัญชีผู้ใช้ไม่สำเร็จ" }, { status: 503 });
  if (!original) return NextResponse.json({ error: "ไม่พบบัญชีผู้ใช้" }, { status: 404 });
  if ((userCode !== original.user_code || role !== original.role) && !validCode(userCode, role)) return NextResponse.json({ error: role === "student" ? "กรุณากรอกรหัสนักศึกษาเป็นตัวเลข 8 หลัก" : "รหัสต้องตรงกับบทบาท: ADV, ADM หรือ COR ตามด้วยตัวเลข 4–6 หลัก", field: "userCode" }, { status: 400 });
  const duplicate = await checkDuplicate(userCode, email, id);
  if (duplicate) return duplicate;

  const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, { email, app_metadata: { role }, user_metadata: { full_name: fullName } });
  if (authError) return NextResponse.json({ error: authError.message }, { status: 400 });
  const { data: profile, error } = await supabaseAdmin.from("profiles").update({
    user_code: userCode, full_name: fullName, email, role,
    faculty: stringValue(body.faculty) || null, major: stringValue(body.major) || null,
  }).eq("id", id).select("id, user_code, full_name, email, role, faculty, major").single();
  if (error) return NextResponse.json({ error: error.code === "23505" ? "รหัสนี้มีบัญชีอยู่แล้ว กรุณาค้นหาบัญชีเดิมในหน้าจัดการผู้ใช้งาน" : error.message, field: error.code === "23505" ? "userCode" : undefined }, { status: error.code === "23505" ? 409 : 400 });
  return NextResponse.json({ user: profile ? { ...profile, is_active: true } : profile });
}

export async function DELETE(request: NextRequest) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admin access is required" }, { status: 403 });
  const id = new URL(request.url).searchParams.get("id")?.trim() ?? "";
  if (!id || id === admin.id) return NextResponse.json({ error: "A different user id is required" }, { status: 400 });
  const { error } = await supabaseAdmin.auth.admin.updateUserById(id, { ban_duration: "876000h" });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
