import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

async function requireAdmin() {
  const sessionClient = await createSupabaseServerClient();
  const { data: { user } } = await sessionClient.auth.getUser();
  if (!user) return false;
  const { data } = await supabaseAdmin.from("profiles").select("role").eq("id", user.id).maybeSingle();
  return data?.role === "admin";
}

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: "Admin access is required" }, { status: 403 });
  const [{ data: documents, error: documentsError }, { data: profiles, error: profilesError }, { data: records, error: recordsError }] = await Promise.all([
    supabaseAdmin.from("student_documents").select("id, student_id, document_type, file_path, status, submitted_at").order("submitted_at", { ascending: false }),
    supabaseAdmin.from("profiles").select("id, user_code, full_name, email"),
    supabaseAdmin.from("internship_records").select("student_id, company_name"),
  ]);
  const error = documentsError ?? profilesError ?? recordsError;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const students = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  const companies = new Map((records ?? []).map((record) => [record.student_id, record.company_name]));
  const statuses: Record<string, string> = { approved: "อนุมัติแล้ว", revision: "ส่งแก้ไข", rejected: "ส่งแก้ไข", pending: "รอตรวจสอบ", submitted: "รอตรวจสอบ" };
  return NextResponse.json({ documents: (documents ?? []).map((document) => {
    const student = students.get(document.student_id);
    const submittedAt = document.submitted_at ? new Date(document.submitted_at).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" }) : "-";
    const fileName = document.file_path?.split("/").pop() || "-";
    return { id: document.id, student: student?.full_name ?? "-", studentId: student?.user_code ?? document.student_id, email: student?.email ?? "-", type: document.document_type ?? "เอกสารประกอบการฝึกงาน", company: companies.get(document.student_id) ?? "-", submittedAt, fileName, size: "-", status: statuses[document.status] ?? "รอตรวจสอบ" };
  }) });
}
