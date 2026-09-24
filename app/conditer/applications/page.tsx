"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, ExternalLink, Loader2, Search, X } from "lucide-react";
import ConditerSidebar from "@/components/ConditerSidebar";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";

type Progress = "submitted" | "interview" | "offer_received" | "rejected" | "withdrawn";
type External = { id: string; company_name: string; position: string; location: string; status: "pending" | "approved" | "rejected"; review_note: string | null; student: { full_name: string | null; user_code: string | null } | null };
type Application = { id: string; company_name: string; job_title: string; application_status: Progress; placement_request_status: string; submitted_at: string; student: { full_name: string | null; user_code: string | null } | null };
const labels: Record<Progress, string> = { submitted: "สมัครแล้ว", interview: "สัมภาษณ์", offer_received: "ได้รับข้อเสนอ", rejected: "ไม่ผ่าน", withdrawn: "ถอนการสมัคร" };

export default function ApplicationsPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [externalRequests, setExternalRequests] = useState<External[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  const loadData = async () => {
    setLoading(true); setError(null);
    const [applicationsResult, externalResult] = await Promise.all([
      supabase.from("job_applications").select("id, company_name, job_title, application_status, placement_request_status, submitted_at, student:profiles!job_applications_student_id_fkey(full_name, user_code)").order("submitted_at", { ascending: false }),
      supabase.from("external_company_submissions").select("id, company_name, position, location, status, review_note, student:profiles!external_company_submissions_student_id_fkey(full_name, user_code)").order("created_at", { ascending: false }),
    ]);
    if (applicationsResult.error || externalResult.error) setError(applicationsResult.error?.message ?? externalResult.error?.message ?? "โหลดข้อมูลไม่สำเร็จ");
    setApplications((applicationsResult.data ?? []).map((row) => ({ ...row, student: Array.isArray(row.student) ? row.student[0] ?? null : row.student })) as Application[]);
    setExternalRequests((externalResult.data ?? []).map((row) => ({ ...row, student: Array.isArray(row.student) ? row.student[0] ?? null : row.student })) as External[]);
    setLoading(false);
  };

  useEffect(() => { void loadData(); }, []);

  const reviewExternal = async (request: External, status: "approved" | "rejected") => {
    if (!user) return;
    const note = reviewNotes[request.id]?.trim() || null;
    if (status === "rejected" && !note) { setError("กรุณาระบุเหตุผลที่ไม่อนุมัติบริษัท"); return; }
    setBusyId(request.id); setError(null);
    const { error: updateError } = await supabase.rpc("review_external_company_submission", { submission_id: request.id, decision: status, review_note: note });
    if (updateError) setError(updateError.message); else await loadData();
    setBusyId(null);
  };

  const filteredApplications = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return applications.filter((item) => !keyword || [item.company_name, item.job_title, item.student?.full_name, item.student?.user_code].some((value) => value?.toLowerCase().includes(keyword)));
  }, [applications, search]);

  return <div className="min-h-screen bg-[#F7F6FB]"><ConditerSidebar /><main className="lg:ml-[235px]"><div className="mx-auto max-w-[1500px] px-5 py-6 lg:px-8">
    <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><h1 className="text-2xl font-bold text-[#29263E]">ติดตามการสมัครและอนุมัติบริษัทภายนอก</h1><p className="mt-1 text-sm text-[#777287]">Coordinator อนุมัติเฉพาะบริษัทภายนอก ส่วนผลสมัครเป็นข้อมูลที่นักศึกษารายงาน</p></div><Link href="/conditer/placements" className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#3D348B] px-4 text-sm font-semibold text-white"><ExternalLink size={16} />ยืนยันที่ฝึกงานและมอบ Advisor</Link></div>
    {error && <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
    <section className="mb-6 overflow-hidden rounded-lg border border-[#E7E4EF] bg-white"><div className="flex items-center justify-between border-b border-[#ECE9F1] px-5 py-4"><div><h2 className="font-bold">คำขอบริษัทภายนอก</h2><p className="mt-1 text-xs text-[#777287]">อนุมัติแล้ว นักศึกษาจึงเริ่มสมัครกับบริษัทนั้นได้</p></div><span className="text-sm text-[#3D348B]">รอพิจารณา {externalRequests.filter((item) => item.status === "pending").length}</span></div>
      {loading ? <div className="flex justify-center py-10"><Loader2 className="animate-spin" /></div> : <div className="divide-y divide-[#F0EDF4]">{externalRequests.length === 0 ? <p className="px-5 py-10 text-center text-sm text-[#777287]">ไม่มีคำขอบริษัทภายนอก</p> : externalRequests.map((request) => <div key={request.id} className="grid gap-3 px-5 py-4 lg:grid-cols-[1fr_360px] lg:items-center"><div><p className="font-semibold">{request.company_name}</p><p className="mt-1 text-sm text-[#777287]">{request.position} · {request.location || "ไม่ระบุสถานที่"}</p><p className="mt-1 text-xs text-[#9691A5]">{request.student?.full_name || "ไม่ระบุชื่อ"} ({request.student?.user_code || "-"})</p>{request.review_note && <p className="mt-2 text-xs text-[#777287]">เหตุผล/หมายเหตุ: {request.review_note}</p>}</div>{request.status === "pending" ? <div><input value={reviewNotes[request.id] ?? ""} onChange={(event) => setReviewNotes((current) => ({ ...current, [request.id]: event.target.value }))} placeholder="เหตุผลเมื่อไม่อนุมัติ หรือหมายเหตุเพิ่มเติม" className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" /><div className="mt-2 flex justify-end gap-2"><button disabled={busyId === request.id} onClick={() => void reviewExternal(request, "approved")} className="inline-flex h-9 items-center gap-1 rounded-lg bg-[#E8F8EF] px-3 text-xs font-semibold text-[#159447]"><Check size={15} />อนุมัติ</button><button disabled={busyId === request.id} onClick={() => void reviewExternal(request, "rejected")} className="inline-flex h-9 items-center gap-1 rounded-lg bg-[#FDECEC] px-3 text-xs font-semibold text-[#E94B4B]"><X size={15} />ไม่อนุมัติ</button></div></div> : <div className="flex justify-end"><span className="rounded-full bg-slate-100 px-3 py-1 text-xs">{request.status === "approved" ? "อนุมัติแล้ว" : "ไม่อนุมัติ"}</span></div>}</div>)}</div>}
    </section>
    <section className="overflow-hidden rounded-lg border border-[#E7E4EF] bg-white"><div className="flex flex-col justify-between gap-3 border-b border-[#ECE9F1] px-5 py-4 md:flex-row md:items-center"><div><h2 className="font-bold">สถานะการสมัครงาน</h2><p className="mt-1 text-xs text-[#777287]">แสดงผลที่นักศึกษารายงานจากบริษัท</p></div><label className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ค้นหานักศึกษา หรือบริษัท" className="h-10 rounded-lg border border-slate-200 pl-9 pr-3 text-sm" /></label></div><div className="overflow-x-auto"><table className="w-full min-w-[760px]"><thead className="bg-[#FBFAFD] text-left text-xs text-[#777287]"><tr><th className="px-5 py-3">นักศึกษา</th><th className="px-5 py-3">บริษัท / ตำแหน่ง</th><th className="px-5 py-3">สถานะสมัคร</th><th className="px-5 py-3">ยืนยันที่ฝึกงาน</th></tr></thead><tbody>{filteredApplications.map((application) => <tr key={application.id} className="border-t border-[#F0EDF4]"><td className="px-5 py-4 text-sm"><p className="font-semibold">{application.student?.full_name || "-"}</p><p className="text-xs text-[#777287]">{application.student?.user_code || "-"}</p></td><td className="px-5 py-4 text-sm"><p className="font-semibold">{application.company_name}</p><p className="text-xs text-[#777287]">{application.job_title}</p></td><td className="px-5 py-4"><span className="rounded-full bg-[#EFEEFC] px-3 py-1 text-xs text-[#3D348B]">{labels[application.application_status]}</span></td><td className="px-5 py-4 text-sm">{application.placement_request_status === "pending_verification" ? <span className="font-semibold text-[#D99500]">รอตรวจสอบ</span> : application.placement_request_status === "confirmed" ? <span className="font-semibold text-[#159447]">ยืนยันแล้ว</span> : "-"}</td></tr>)}</tbody></table></div></section>
  </div></main></div>;
}
