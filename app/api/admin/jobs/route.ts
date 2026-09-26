import { NextRequest, NextResponse } from "next/server";
import { isSameOrigin } from "@/lib/auth/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

async function isAdmin() {
  const client = await createSupabaseServerClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return false;
  const { data } = await supabaseAdmin.from("profiles").select("role").eq("id", user.id).maybeSingle();
  return data?.role === "admin";
}

const text = (value: unknown) => typeof value === "string" ? value.trim() : "";

export async function PATCH(request: NextRequest) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  if (!await isAdmin()) return NextResponse.json({ error: "Admin access is required" }, { status: 403 });
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; } catch { return NextResponse.json({ error: "Invalid request body" }, { status: 400 }); }
  const id = text(body.id);
  const status = text(body.status);
  if (!id || !["open", "draft", "closed"].includes(status)) return NextResponse.json({ error: "Job id or status is invalid" }, { status: 400 });
  const positions = Number(body.positions);
  if (!Number.isInteger(positions) || positions < 0) return NextResponse.json({ error: "Positions is invalid" }, { status: 400 });
  const qualifications = Array.isArray(body.qualifications) ? body.qualifications.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean) : [];
  const { error } = await supabaseAdmin.from("jobs").update({ title: text(body.title), location: text(body.location) || null, department: text(body.department) || null, positions, work_type: text(body.workType) || null, description: text(body.description) || null, qualifications, status }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
