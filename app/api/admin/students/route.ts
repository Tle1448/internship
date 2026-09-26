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

async function requireAdmin() {
  const sessionClient = await createSupabaseServerClient();
  const { data: { user } } = await sessionClient.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabaseAdmin.from("profiles").select("role").eq("id", user.id).maybeSingle();
  return profile?.role === "admin" ? user : null;
}

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: "Admin access is required" }, { status: 403 });
  const [{ data: profiles, error: profilesError }, { data: records, error: recordsError }, { data: documents, error: documentsError }] = await Promise.all([
    supabaseAdmin.from("profiles").select("id, user_code, full_name, email, faculty, major, year").eq("role", "student").order("user_code"),
    supabaseAdmin.from("internship_records").select("student_id, advisor_id, company_name, position, province, started_at, ended_at, status, placement_status"),
    supabaseAdmin.from("student_documents").select("id, student_id, document_type, file_path, status, comment, submitted_at").order("submitted_at", { ascending: false }),
  ]);
  const error = profilesError ?? recordsError ?? documentsError;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const advisorIds = [...new Set((records ?? []).map((record) => record.advisor_id).filter((id): id is string => Boolean(id)))];
  const { data: advisors, error: advisorsError } = advisorIds.length ? await supabaseAdmin.from("profiles").select("id, full_name").in("id", advisorIds) : { data: [], error: null };
  if (advisorsError) return NextResponse.json({ error: advisorsError.message }, { status: 400 });
  const recordsByStudent = new Map((records ?? []).map((record) => [record.student_id, record]));
  const advisorsById = new Map((advisors ?? []).map((advisor) => [advisor.id, advisor.full_name]));
  return NextResponse.json({ students: (profiles ?? []).map((profile) => ({ ...profile, record: recordsByStudent.get(profile.id) ?? null, advisorName: recordsByStudent.get(profile.id)?.advisor_id ? advisorsById.get(recordsByStudent.get(profile.id)!.advisor_id) ?? null : null, documents: (documents ?? []).filter((document) => document.student_id === profile.id) })) });
}

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
