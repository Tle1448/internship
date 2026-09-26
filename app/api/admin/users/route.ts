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
  if (!userCode || !fullName || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8 || !role) {
    return NextResponse.json({ error: "User code, name, email, password, or role is invalid" }, { status: 400 });
  }

  const { data: duplicate } = await supabaseAdmin.from("profiles").select("id").or(`user_code.eq.${userCode},email.eq.${email}`).maybeSingle();
  if (duplicate) return NextResponse.json({ error: "User code or email already exists" }, { status: 409 });

  const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email, password, email_confirm: true,
    app_metadata: { role }, user_metadata: { full_name: fullName },
  });
  if (createError || !created.user) return NextResponse.json({ error: createError?.message ?? "Unable to create account" }, { status: 400 });

  const { data: profile, error: profileError } = await supabaseAdmin.from("profiles").update({
    user_code: userCode, full_name: fullName, email, role,
    faculty: stringValue(body.faculty) || null, major: stringValue(body.major) || null,
  }).eq("id", created.user.id).select("id, user_code, full_name, email, role, faculty, major").single();
  if (profileError) {
    await supabaseAdmin.auth.admin.deleteUser(created.user.id);
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }
  return NextResponse.json({ user: profile ? { ...profile, is_active: true } : null }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admin access is required" }, { status: 403 });
  const body = await readBody(request);
  const id = stringValue(body?.id);
  const role = roleValue(body?.role);
  if (!body || !id || !role) return NextResponse.json({ error: "User id or role is invalid" }, { status: 400 });
  if (id === admin.id && body.isActive === false) return NextResponse.json({ error: "You cannot deactivate your own account" }, { status: 400 });

  const fullName = stringValue(body.fullName);
  const email = stringValue(body.email).toLowerCase();
  const userCode = stringValue(body.userCode).toUpperCase();
  if (!fullName || !userCode || !/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: "User code, name, or email is invalid" }, { status: 400 });

  const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, { email, app_metadata: { role }, user_metadata: { full_name: fullName } });
  if (authError) return NextResponse.json({ error: authError.message }, { status: 400 });
  const { data: profile, error } = await supabaseAdmin.from("profiles").update({
    user_code: userCode, full_name: fullName, email, role,
    faculty: stringValue(body.faculty) || null, major: stringValue(body.major) || null,
  }).eq("id", id).select("id, user_code, full_name, email, role, faculty, major").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ user: profile ? { ...profile, is_active: true } : null });
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
