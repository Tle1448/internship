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

type UpdateStudentBody = {
  studentId?: unknown;
  fullName?: unknown;
  email?: unknown;
  faculty?: unknown;
  major?: unknown;
  companyName?: unknown;
  position?: unknown;
  province?: unknown;
  startedAt?: unknown;
  endedAt?: unknown;
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

const textValue = (value: unknown) => typeof value === "string" ? value.trim() : "";

export async function PATCH(request: NextRequest) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  if (!await requireAdmin()) return NextResponse.json({ error: "Admin access is required" }, { status: 403 });

  let body: UpdateStudentBody;
  try { body = await request.json() as UpdateStudentBody; } catch { return NextResponse.json({ error: "Invalid request body" }, { status: 400 }); }

  const studentId = textValue(body.studentId);
  const fullName = textValue(body.fullName);
  const email = textValue(body.email).toLowerCase();
  const startedAt = textValue(body.startedAt);
  const endedAt = textValue(body.endedAt);
  if (!studentId || !fullName || !/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: "ชื่อหรืออีเมลไม่ถูกต้อง" }, { status: 400 });
  if ((startedAt && !/^\d{4}-\d{2}-\d{2}$/.test(startedAt)) || (endedAt && !/^\d{4}-\d{2}-\d{2}$/.test(endedAt)) || (startedAt && endedAt && startedAt > endedAt)) {
    return NextResponse.json({ error: "วันเริ่มและสิ้นสุดฝึกงานไม่ถูกต้อง" }, { status: 400 });
  }

  const { data: student, error: studentError } = await supabaseAdmin.from("profiles").select("id").eq("id", studentId).eq("role", "student").maybeSingle();
  if (studentError) return NextResponse.json({ error: "โหลดข้อมูลนักศึกษาไม่สำเร็จ" }, { status: 503 });
  if (!student) return NextResponse.json({ error: "ไม่พบบัญชีนักศึกษา" }, { status: 404 });

  const { data: emailOwner, error: emailError } = await supabaseAdmin.from("profiles").select("id").eq("email", email).neq("id", studentId).maybeSingle();
  if (emailError) return NextResponse.json({ error: "ตรวจสอบอีเมลซ้ำไม่สำเร็จ" }, { status: 503 });
  if (emailOwner) return NextResponse.json({ error: "อีเมลนี้มีบัญชีอยู่แล้ว" }, { status: 409 });

  const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(studentId, { email, user_metadata: { full_name: fullName } });
  if (authError) return NextResponse.json({ error: authError.message }, { status: 400 });
  const { data: profile, error: profileError } = await supabaseAdmin.from("profiles").update({ full_name: fullName, email, faculty: textValue(body.faculty) || null, major: textValue(body.major) || null }).eq("id", studentId).select("id, full_name, email, faculty, major").single();
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 400 });

  const recordPayload = { company_name: textValue(body.companyName) || null, position: textValue(body.position) || null, province: textValue(body.province) || null, started_at: startedAt || null, ended_at: endedAt || null };
  const { data: record, error: recordError } = await supabaseAdmin.from("internship_records").update(recordPayload).eq("student_id", studentId).select("student_id, company_name, position, province, started_at, ended_at").maybeSingle();
  if (recordError) return NextResponse.json({ error: recordError.message }, { status: 400 });
  if (!record) return NextResponse.json({ profile, record: null, warning: "บันทึกข้อมูลนักศึกษาแล้ว แต่ยังไม่มีรายการฝึกงานสำหรับแก้ไข" });
  return NextResponse.json({ profile, record });
}
