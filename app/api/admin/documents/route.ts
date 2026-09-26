import { NextRequest, NextResponse } from "next/server";
import { isSameOrigin } from "@/lib/auth/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const documentStatuses = new Set(["pending", "approved", "needs_edit"]);

async function requireAdmin() {
  const sessionClient = await createSupabaseServerClient();
  const { data: { user } } = await sessionClient.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabaseAdmin.from("profiles").select("role").eq("id", user.id).maybeSingle();
  return profile?.role === "admin" ? user : null;
}

function text(value: unknown) { return typeof value === "string" ? value.trim() : ""; }

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: "Admin access is required" }, { status: 403 });
  const { data: documents, error } = await supabaseAdmin.from("student_documents").select("id, student_id, document_type, file_path:file_name, file_url, status, comment, submitted_at, reviewed_at").order("submitted_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const studentIds = [...new Set((documents ?? []).map((document) => document.student_id))];
  const { data: students, error: studentsError } = studentIds.length ? await supabaseAdmin.from("profiles").select("id, full_name, user_code, email").in("id", studentIds) : { data: [], error: null };
  if (studentsError) return NextResponse.json({ error: studentsError.message }, { status: 400 });
  const { data: records, error: recordsError } = studentIds.length ? await supabaseAdmin.from("internship_records").select("student_id, company_id").in("student_id", studentIds) : { data: [], error: null };
  if (recordsError) return NextResponse.json({ error: recordsError.message }, { status: 400 });
  const companyIds = [...new Set((records ?? []).map((record) => record.company_id).filter(Boolean))];
  const { data: companies, error: companiesError } = companyIds.length ? await supabaseAdmin.from("companies").select("id, name").in("id", companyIds) : { data: [], error: null };
  if (companiesError) return NextResponse.json({ error: companiesError.message }, { status: 400 });

  const studentsById = new Map((students ?? []).map((student) => [student.id, student]));
  const companiesById = new Map((companies ?? []).map((company) => [company.id, company.name]));
  const companyByStudentId = new Map((records ?? []).map((record) => [record.student_id, companiesById.get(record.company_id) ?? "-"]));
  return NextResponse.json({ documents: (documents ?? []).map((document) => ({ ...document, student: studentsById.get(document.student_id) ?? null, companyName: companyByStudentId.get(document.student_id) ?? "-" })) });
}

export async function PATCH(request: NextRequest) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  if (!await requireAdmin()) return NextResponse.json({ error: "Admin access is required" }, { status: 403 });
  let body: { id?: unknown; status?: unknown; comment?: unknown };
  try { body = await request.json() as { id?: unknown; status?: unknown; comment?: unknown }; } catch { return NextResponse.json({ error: "Invalid request body" }, { status: 400 }); }
  const id = text(body.id);
  const status = text(body.status);
  if (!id || !documentStatuses.has(status)) return NextResponse.json({ error: "Document id or status is invalid" }, { status: 400 });
  const { data, error } = await supabaseAdmin.from("student_documents").update({ status, comment: text(body.comment) || null }).eq("id", id).select("id, status, comment, reviewed_at").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ document: data });
}
