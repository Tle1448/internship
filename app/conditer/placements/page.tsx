"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, FileText, Loader2, RotateCcw, Users } from "lucide-react";
import ConditerSidebar from "@/components/ConditerSidebar";
import { supabase } from "@/lib/supabase";

type Advisor = { id: string; full_name: string | null; user_code: string; skills: string[]; activeCount: number };
type Placement = {
  id: string; company_name: string; job_title: string; offer_note: string | null; offer_evidence_files: string[];
  job: { tags: string[] | null } | null;
  student: { full_name: string | null; user_code: string; faculty: string | null; major: string | null } | null;
};

function relation<T>(value: T | T[] | null): T | null { return Array.isArray(value) ? value[0] ?? null : value; }

export default function PlacementsPage() {
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [successRecordId, setSuccessRecordId] = useState<string | null>(null);
  const [fileUrls, setFileUrls] = useState<Record<string, string>>({});

  const loadData = async () => {
    setLoading(true); setError(null);
    const [placementResult, advisorResult, recordResult] = await Promise.all([
      supabase.from("job_applications").select("id, company_name, job_title, offer_note, offer_evidence_files, student:profiles!job_applications_student_id_fkey(full_name, user_code, faculty, major), job:jobs!job_applications_job_id_fkey(tags)").eq("application_status", "offer_received").eq("placement_request_status", "pending_verification").order("placement_requested_at", { ascending: true }),
      supabase.from("profiles").select("id, full_name, user_code, skills").eq("role", "advisor").order("full_name"),
      supabase.from("internship_records").select("advisor_id").eq("status", "in_progress").not("advisor_id", "is", null),
    ]);
    if (placementResult.error || advisorResult.error || recordResult.error) setError(placementResult.error?.message ?? advisorResult.error?.message ?? recordResult.error?.message ?? "โหลดข้อมูลไม่สำเร็จ");
    const activeCounts = new Map<string, number>();
    (recordResult.data ?? []).forEach((record) => activeCounts.set(record.advisor_id, (activeCounts.get(record.advisor_id) ?? 0) + 1));
    const advisorRows = (advisorResult.data ?? []).map((advisor) => ({ ...advisor, skills: advisor.skills ?? [], activeCount: activeCounts.get(advisor.id) ?? 0 })) as Advisor[];
    const placementRows = (placementResult.data ?? []).map((row) => ({ ...row, student: relation(row.student), job: relation(row.job), offer_evidence_files: row.offer_evidence_files ?? [] })) as Placement[];
    setAdvisors(advisorRows); setPlacements(placementRows);
    setSelected((current) => {
      const next = { ...current };
      placementRows.forEach((placement) => { if (!next[placement.id]) next[placement.id] = recommend(placement, advisorRows)[0]?.id ?? ""; });
      return next;
    });
    setLoading(false);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => void loadData(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const openEvidence = async (path: string) => {
    if (fileUrls[path]) { window.open(fileUrls[path], "_blank", "noopener,noreferrer"); return; }
    const { data, error: signedUrlError } = await supabase.storage.from("internship-evidence").createSignedUrl(path, 60 * 30);
    if (signedUrlError || !data?.signedUrl) { setError(signedUrlError?.message ?? "เปิดไฟล์หลักฐานไม่สำเร็จ"); return; }
    setFileUrls((current) => ({ ...current, [path]: data.signedUrl }));
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  const confirm = async (placement: Placement) => {
    const advisorId = selected[placement.id];
    if (!advisorId) { setError("กรุณาเลือก Advisor"); return; }
    setBusyId(placement.id); setError(null); setSuccess(null);
    const { data: recordId, error: rpcError } = await supabase.rpc("confirm_placement_and_assign_advisor", { application_id: placement.id, advisor_id: advisorId, verification_note: notes[placement.id] || null });
    if (rpcError) setError(rpcError.message); else { setSuccess("ยืนยันสถานที่ฝึกงานและมอบหมายอาจารย์ที่ปรึกษาเรียบร้อยแล้ว"); setSuccessRecordId(recordId ?? null); await loadData(); }
    setBusyId(null);
  };

  const requestRevision = async (placement: Placement) => {
    const note = notes[placement.id]?.trim();
    if (!note) { setError("กรุณาระบุเหตุผลที่ต้องแก้ไขหลักฐาน"); return; }
    setBusyId(placement.id); setError(null);
    const { error: rpcError } = await supabase.rpc("decline_placement_verification", { application_id: placement.id, verification_note: note });
    if (rpcError) setError(rpcError.message); else await loadData();
    setBusyId(null);
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="animate-spin text-[#3D348B]" /></div>;
  return <div className="min-h-screen bg-[#F7F6FB]"><ConditerSidebar /><main className="lg:ml-[235px]"><div className="mx-auto max-w-[1500px] px-5 py-6 lg:px-8">
    <header className="mb-6"><h1 className="text-2xl font-bold text-[#29263E]">ยืนยันที่ฝึกงานและมอบ Advisor</h1><p className="mt-1 text-sm text-[#777287]">ตรวจหลักฐานข้อเสนอ เลือก Advisor ที่เหมาะสม แล้วระบบจะบันทึกและแจ้งเตือนทั้งสองฝ่ายพร้อมกัน</p></header>
    {error && <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
    {success && <p role="status" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{success}{successRecordId && <Link className="font-semibold underline" href={`/conditer/students/${successRecordId}`}>เปิดข้อมูลนักศึกษารายนี้</Link>}</p>}
    {placements.length === 0 ? <section className="rounded-lg border border-[#E7E4EF] bg-white py-16 text-center"><CheckCircle2 className="mx-auto mb-3 text-emerald-500" /><p className="font-semibold">ไม่มีคำขอที่รอตรวจสอบ</p></section> : <div className="space-y-5">{placements.map((placement) => {
      const recommended = recommend(placement, advisors);
      return <section key={placement.id} className="rounded-lg border border-[#E7E4EF] bg-white p-5"><div className="grid gap-6 xl:grid-cols-[1fr_420px]"><div><p className="text-xs text-[#777287]">นักศึกษา</p><h2 className="mt-1 text-lg font-bold">{placement.student?.full_name || "-"}</h2><p className="text-sm text-[#777287]">{placement.student?.user_code || "-"} · {[placement.student?.faculty, placement.student?.major].filter(Boolean).join(" · ") || "ไม่ระบุสาขา"}</p><div className="mt-5 rounded-lg bg-[#F8F7FB] p-4"><p className="font-semibold">{placement.company_name}</p><p className="mt-1 text-sm text-[#555063]">{placement.job_title}</p>{placement.job?.tags?.length ? <p className="mt-2 text-xs text-[#777287]">ทักษะงาน: {placement.job.tags.join(" · ")}</p> : null}</div>{placement.offer_note && <p className="mt-4 text-sm text-[#555063]">หมายเหตุจากนักศึกษา: {placement.offer_note}</p>}<div className="mt-4"><p className="mb-2 text-sm font-semibold">หลักฐานข้อเสนอ</p>{placement.offer_evidence_files.length ? <div className="flex flex-wrap gap-2">{placement.offer_evidence_files.map((path) => <button key={path} onClick={() => void openEvidence(path)} className="inline-flex items-center gap-2 rounded-lg border border-[#DDD9E8] px-3 py-2 text-xs text-[#3D348B] hover:bg-[#F4F3FC]"><FileText size={15} />{path.split("/").at(-1)?.replace(/^\d+_/, "")}</button>)}</div> : <p className="text-sm text-red-600">ไม่พบไฟล์หลักฐาน</p>}</div></div><div className="border-t border-[#ECE9F1] pt-5 xl:border-l xl:border-t-0 xl:pl-6 xl:pt-0"><div className="flex items-center gap-2"><Users size={18} className="text-[#3D348B]" /><h3 className="font-bold">เลือก Advisor</h3></div><p className="mt-1 text-xs text-[#777287]">เรียงจากทักษะที่ตรงกับประกาศงาน แล้วพิจารณาจำนวนนักศึกษาปัจจุบัน</p><select value={selected[placement.id] ?? ""} onChange={(event) => setSelected((current) => ({ ...current, [placement.id]: event.target.value }))} className="mt-4 h-11 w-full rounded-lg border border-[#DCD8E8] bg-white px-3 text-sm">{recommended.map((advisor) => <option key={advisor.id} value={advisor.id}>{advisor.full_name || advisor.user_code} · ตรง {matchScore(placement, advisor)} · ดูแลอยู่ {advisor.activeCount} คน</option>)}</select><textarea value={notes[placement.id] ?? ""} onChange={(event) => setNotes((current) => ({ ...current, [placement.id]: event.target.value }))} placeholder="บันทึกการยืนยัน หรือเหตุผลที่ต้องแก้ไข" className="mt-3 min-h-24 w-full rounded-lg border border-[#DCD8E8] p-3 text-sm" /><div className="mt-3 grid gap-2 sm:grid-cols-2"><button disabled={busyId === placement.id} onClick={() => void requestRevision(placement)} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 text-sm font-semibold text-amber-800 disabled:opacity-50">{busyId === placement.id ? <Loader2 className="animate-spin" size={16} /> : <RotateCcw size={16} />}ขอหลักฐานเพิ่มเติม</button><button disabled={busyId === placement.id || !selected[placement.id]} onClick={() => void confirm(placement)} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#3D348B] px-3 text-sm font-semibold text-white disabled:opacity-50">{busyId === placement.id ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}ยืนยันและมอบ Advisor</button></div></div></div></section>;
    })}</div>}
  </div></main></div>;
}

function matchScore(placement: Placement, advisor: Advisor) {
  const tags = placement.job?.tags?.map((tag) => tag.toLowerCase()) ?? [];
  const skills = advisor.skills.map((skill) => skill.toLowerCase());
  const matches = tags.filter((tag) => skills.some((skill) => skill.includes(tag) || tag.includes(skill))).length;
  return `${matches}/${tags.length || 0}`;
}
function recommend(placement: Placement, advisors: Advisor[]) {
  return [...advisors].sort((a, b) => Number(matchScore(placement, b).split("/")[0]) - Number(matchScore(placement, a).split("/")[0]) || a.activeCount - b.activeCount || (a.full_name || "").localeCompare(b.full_name || ""));
}
