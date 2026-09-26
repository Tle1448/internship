import { NextRequest, NextResponse } from "next/server";
import { isSameOrigin } from "@/lib/auth/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

async function isAdmin() {
  const sessionClient = await createSupabaseServerClient();
  const { data: { user } } = await sessionClient.auth.getUser();
  if (!user) return false;
  const { data } = await supabaseAdmin.from("profiles").select("role").eq("id", user.id).maybeSingle();
  return data?.role === "admin";
}

export async function GET() {
  if (!await isAdmin()) return NextResponse.json({ error: "Admin access is required" }, { status: 403 });

  const [{ data: profiles, error: profilesError }, { data: records, error: recordsError }, { data: documents, error: documentsError }, { data: advisors, error: advisorsError }] = await Promise.all([
    supabaseAdmin.from("profiles").select("id, user_code, full_name, email, faculty, major, year").eq("role", "student").order("user_code"),
    supabaseAdmin.from("internship_records").select("student_id, advisor_id, placement_status, status"),
    supabaseAdmin.from("student_documents").select("student_id, status"),
    supabaseAdmin.from("profiles").select("id, full_name").eq("role", "advisor"),
  ]);
  const error = profilesError ?? recordsError ?? documentsError ?? advisorsError;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const recordsByStudent = new Map((records ?? []).map((record) => [record.student_id, record]));
  const advisorNames = new Map((advisors ?? []).map((advisor) => [advisor.id, advisor.full_name ?? "ยังไม่ระบุอาจารย์ที่ปรึกษา"]));
  const documentsByStudent = new Map<string, string[]>();
  for (const document of documents ?? []) documentsByStudent.set(document.student_id, [...(documentsByStudent.get(document.student_id) ?? []), document.status]);

  return NextResponse.json({ students: (profiles ?? []).map((profile) => {
    const record = recordsByStudent.get(profile.id);
    const placement = record?.placement_status ?? "pending";
    const status = placement === "approved" || placement === "placed" || record?.status === "completed" ? "ได้ที่ฝึกงานแล้ว" : placement === "reviewing" || placement === "submitted" ? "รอการอนุมัติ" : "กำลังหาที่ฝึกงาน";
    return {
      id: profile.user_code ?? profile.id,
      name: profile.full_name ?? "-",
      email: profile.email ?? "-",
      school: profile.faculty ?? "ยังไม่ระบุสำนักวิชา",
      program: profile.major ?? "ยังไม่ระบุหลักสูตร",
      year: profile.year ? `ชั้นปีที่ ${profile.year}` : "ยังไม่ระบุชั้นปี",
      status,
      advisor: record?.advisor_id ? advisorNames.get(record.advisor_id) ?? "ยังไม่ระบุอาจารย์ที่ปรึกษา" : "ยังไม่ระบุอาจารย์ที่ปรึกษา",
      c1Status: (documentsByStudent.get(profile.id) ?? []).includes("approved") ? "ผ่าน C1" : "รอตรวจ C1",
    };
  }) });
}

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
