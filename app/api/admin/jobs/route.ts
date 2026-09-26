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
  const [{ data: companies, error: companiesError }, { data: jobs, error: jobsError }, { data: applications, error: applicationsError }] = await Promise.all([
    supabaseAdmin.from("companies").select("id, name"),
    supabaseAdmin.from("jobs").select("id, company_id, title, location, department, positions, work_type, description, qualifications, end_date, status").order("created_at", { ascending: false }),
    supabaseAdmin.from("applications").select("job_id"),
  ]);
  const error = companiesError ?? jobsError ?? applicationsError;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const companyNames = new Map((companies ?? []).map((company) => [company.id, company.name]));
  const applicationCounts = new Map<string, number>();
  for (const application of applications ?? []) if (application.job_id) applicationCounts.set(application.job_id, (applicationCounts.get(application.job_id) ?? 0) + 1);
  return NextResponse.json({ jobs: (jobs ?? []).map((job) => ({ ...job, company: companyNames.get(job.company_id ?? "") ?? "-", applicants: applicationCounts.get(job.id) ?? 0 })) });
}
