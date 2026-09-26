import { NextRequest, NextResponse } from "next/server";
import { isSameOrigin } from "@/lib/auth/server";
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
  const [{ data: companies, error: companiesError }, { data: jobs, error: jobsError }, { data: records, error: recordsError }] = await Promise.all([
    supabaseAdmin.from("companies").select("id, name, contact_name, contact_email, contact_phone, location, status").order("name"),
    supabaseAdmin.from("jobs").select("company_id"),
    supabaseAdmin.from("internship_records").select("company_id"),
  ]);
  const error = companiesError ?? jobsError ?? recordsError;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const jobCounts = new Map<string, number>();
  for (const job of jobs ?? []) if (job.company_id) jobCounts.set(job.company_id, (jobCounts.get(job.company_id) ?? 0) + 1);
  const studentCounts = new Map<string, number>();
  for (const record of records ?? []) if (record.company_id) studentCounts.set(record.company_id, (studentCounts.get(record.company_id) ?? 0) + 1);
  const statuses: Record<string, string> = { approved: "อนุมัติแล้ว", pending: "รออนุมัติ", rejected: "ระงับ" };
  return NextResponse.json({ companies: (companies ?? []).map((company) => ({ id: company.id, name: company.name, industry: "-", contact: company.contact_name ?? "-", email: company.contact_email ?? "-", phone: company.contact_phone ?? "-", address: company.location ?? "-", positions: jobCounts.get(company.id) ?? 0, students: studentCounts.get(company.id) ?? 0, status: statuses[company.status] ?? "รออนุมัติ" })) });
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request) || !await requireAdmin()) return NextResponse.json({ error: "Admin access is required" }, { status: 403 });
  const body = await request.json() as Record<string, unknown>;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) return NextResponse.json({ error: "Company name is required" }, { status: 400 });
  const { error } = await supabaseAdmin.from("companies").insert({ name, contact_name: typeof body.contact === "string" ? body.contact.trim() : null, contact_email: typeof body.email === "string" ? body.email.trim() || null : null, contact_phone: typeof body.phone === "string" ? body.phone.trim() || null : null, location: typeof body.address === "string" ? body.address.trim() || null : null, status: "pending" });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  if (!isSameOrigin(request) || !await requireAdmin()) return NextResponse.json({ error: "Admin access is required" }, { status: 403 });
  const body = await request.json() as Record<string, unknown>;
  const id = typeof body.id === "string" ? body.id : "";
  if (!id) return NextResponse.json({ error: "Company id is required" }, { status: 400 });
  const status = body.status === "อนุมัติแล้ว" ? "approved" : body.status === "ระงับ" ? "rejected" : "pending";
  const { error } = await supabaseAdmin.from("companies").update({ name: typeof body.name === "string" ? body.name.trim() : undefined, contact_name: typeof body.contact === "string" ? body.contact.trim() : undefined, contact_email: typeof body.email === "string" ? body.email.trim() || null : undefined, contact_phone: typeof body.phone === "string" ? body.phone.trim() || null : undefined, location: typeof body.address === "string" ? body.address.trim() || null : undefined, status }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
