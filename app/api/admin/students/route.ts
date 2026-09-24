import { NextRequest, NextResponse } from "next/server";
import { isSameOrigin } from "@/lib/auth/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

type CreateStudentBody = {
  userCode?: unknown;
  fullName?: unknown;
  email?: unknown;
  password?: unknown;
};

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });

  const sessionClient = await createSupabaseServerClient();
  const { data: { user } } = await sessionClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: admin } = await supabaseAdmin.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (admin?.role !== "admin") return NextResponse.json({ error: "Admin access is required" }, { status: 403 });

  let body: CreateStudentBody;
  try {
    body = await request.json() as CreateStudentBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const userCode = typeof body.userCode === "string" ? body.userCode.trim() : "";
  const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!/^\d{8}$/.test(userCode) || !fullName || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8) {
    return NextResponse.json({ error: "Student code, name, email, or password is invalid" }, { status: 400 });
  }

  const { data: existing } = await supabaseAdmin.from("profiles").select("id").eq("user_code", userCode).maybeSingle();
  if (existing) return NextResponse.json({ studentId: existing.id, created: false });

  const { data: createdUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role: "student" },
    user_metadata: { full_name: fullName },
  });
  if (createError || !createdUser.user) return NextResponse.json({ error: createError?.message ?? "Unable to create account" }, { status: 400 });

  const { error: profileError } = await supabaseAdmin.from("profiles").update({ user_code: userCode, full_name: fullName, email, role: "student" }).eq("id", createdUser.user.id);
  if (profileError) {
    await supabaseAdmin.auth.admin.deleteUser(createdUser.user.id);
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  const { error: recordError } = await supabaseAdmin.from("internship_records").insert({ student_id: createdUser.user.id, status: "in_progress", placement_status: "pending", evaluation_status: "pending" });
  if (recordError) return NextResponse.json({ studentId: createdUser.user.id, created: true, warning: recordError.message });

  return NextResponse.json({ studentId: createdUser.user.id, created: true }, { status: 201 });
}
