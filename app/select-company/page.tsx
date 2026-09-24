"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { Building2, CheckCircle2, FileUp, Loader2, Send } from "lucide-react";
import StudentSidebar from "@/components/StudentSidebar";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";

type ApplicationStatus = "submitted" | "interview" | "offer_received" | "rejected" | "withdrawn";
type PlacementRequestStatus = "not_requested" | "pending_verification" | "confirmed" | "declined";
type Job = { id: string; title: string; company_name: string; location: string | null; tags: string[] | null };
type ExternalRequest = { id: string; company_name: string; position: string; location: string; status: "pending" | "approved" | "rejected"; review_note: string | null };
type Application = { id: string; job_id: string | null; external_submission_id: string | null; company_name: string; job_title: string; application_status: ApplicationStatus; placement_request_status: PlacementRequestStatus; placement_verification_note: string | null; offer_evidence_files: string[] };

const applicationLabels: Record<ApplicationStatus, string> = {
  submitted: "สมัครแล้ว", interview: "ได้รับเรียกสัมภาษณ์", offer_received: "ได้รับข้อเสนอ", rejected: "ไม่ผ่าน", withdrawn: "ถอนการสมัคร",
};
const placementLabels: Record<PlacementRequestStatus, string> = {
  not_requested: "ยังไม่ยื่นยืนยันที่ฝึกงาน", pending_verification: "รอ Coordinator ตรวจสอบ", confirmed: "ยืนยันที่ฝึกงานแล้ว", declined: "ขอหลักฐานเพิ่มเติม",
};

export default function SelectCompanyPage() {
  const { user, loading: authLoading } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [externalRequests, setExternalRequests] = useState<ExternalRequest[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const uploadForId = useRef<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    const [jobResult, applicationResult, externalResult] = await Promise.all([
      supabase.from("jobs").select("id, title, company_name, location, tags").eq("status", "open").is("archived_at", null).order("created_at", { ascending: false }),
      supabase.from("job_applications").select("id, job_id, external_submission_id, company_name, job_title, application_status, placement_request_status, placement_verification_note, offer_evidence_files").eq("student_id", user.id).order("submitted_at", { ascending: false }),
      supabase.from("external_company_submissions").select("id, company_name, position, location, status, review_note").eq("student_id", user.id).order("created_at", { ascending: false }),
    ]);
    if (jobResult.error || applicationResult.error || externalResult.error) {
      setError(jobResult.error?.message ?? applicationResult.error?.message ?? externalResult.error?.message ?? "โหลดข้อมูลไม่สำเร็จ");
    }
    setJobs((jobResult.data ?? []) as Job[]);
    setApplications((applicationResult.data ?? []) as Application[]);
    setExternalRequests((externalResult.data ?? []) as ExternalRequest[]);
    setLoading(false);
  };

  useEffect(() => {
    if (!authLoading && user) void loadData();
    if (!authLoading && !user) setLoading(false);
  }, [authLoading, user]);

  const startApplication = async (source: Job | ExternalRequest) => {
    if (!user) return;
    const isJob = "title" in source;
    const existing = applications.find((application) =>
      (application.application_status === "submitted" || application.application_status === "interview" || application.application_status === "offer_received")
      && (isJob ? application.job_id === source.id : application.external_submission_id === source.id)
    );
    if (existing) {
      setMessage("มีรายการสมัครนี้อยู่แล้วในรายการติดตาม");
      return;
    }
    setBusyId(source.id);
    setError(null);
    const { error: insertError } = await supabase.rpc("start_job_application", {
      job_id: isJob ? source.id : null,
      external_submission_id: isJob ? null : source.id,
    });
    if (insertError) setError(insertError.message);
    else {
      setMessage("เพิ่มรายการแล้ว โปรดสมัครผ่านช่องทางของบริษัท และกลับมาอัปเดตผลที่นี่");
      await loadData();
    }
    setBusyId(null);
  };

  const changeStatus = async (application: Application, status: ApplicationStatus) => {
    setBusyId(application.id);
    setError(null);
    const { error: updateError } = await supabase.from("job_applications").update({ application_status: status }).eq("id", application.id);
    if (updateError) setError(updateError.message);
    else await loadData();
    setBusyId(null);
  };

  const chooseEvidence = (applicationId: string) => {
    uploadForId.current = applicationId;
    fileInput.current?.click();
  };

  const submitEvidence = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const applicationId = uploadForId.current;
    event.target.value = "";
    if (!file || !applicationId || !user) return;
    setBusyId(applicationId);
    setError(null);
    try {
      const path = `${user.id}/offers/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from("internship-evidence").upload(path, file, { upsert: false });
      if (uploadError) throw uploadError;
      const { error: requestError } = await supabase.rpc("request_placement_verification", { application_id: applicationId, evidence_files: [path], offer_note: null });
      if (requestError) throw requestError;
      setMessage("ส่งหลักฐานให้ Coordinator ตรวจสอบแล้ว");
      await loadData();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "ส่งหลักฐานไม่สำเร็จ");
    } finally {
      setBusyId(null);
      uploadForId.current = null;
    }
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="animate-spin text-[#3D348B]" /></div>;

  return <div className="flex min-h-screen bg-slate-50 text-slate-800">
    <StudentSidebar />
    <main className="min-w-0 flex-1 p-6 md:p-8"><div className="mx-auto max-w-6xl space-y-7">
      <header><h1 className="text-2xl font-bold text-slate-900">สมัครและติดตามการฝึกงาน</h1><p className="mt-1 text-sm text-slate-500">สมัครผ่านช่องทางบริษัทด้วยตนเอง แล้วรายงานความคืบหน้าตามความจริง</p></header>
      {message && <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</p>}
      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      <input ref={fileInput} className="hidden" type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={submitEvidence} />
      <section className="rounded-lg border border-slate-200 bg-white"><div className="border-b border-slate-100 px-5 py-4"><h2 className="font-bold">รายการที่กำลังสมัคร</h2></div>
        {applications.length === 0 ? <p className="px-5 py-10 text-center text-sm text-slate-500">ยังไม่มีรายการสมัคร</p> : <div className="divide-y divide-slate-100">{applications.map((application) => <div key={application.id} className="grid gap-4 p-5 lg:grid-cols-[1fr_220px_auto] lg:items-center">
          <div><p className="font-semibold text-slate-900">{application.company_name}</p><p className="mt-1 text-sm text-slate-600">{application.job_title}</p><p className="mt-2 text-xs text-slate-500">{placementLabels[application.placement_request_status]}</p>{application.placement_request_status === "declined" && application.placement_verification_note && <p className="mt-2 text-xs font-medium text-amber-700">เหตุผล: {application.placement_verification_note}</p>}</div>
          <select aria-label="สถานะการสมัคร" disabled={busyId === application.id || application.placement_request_status !== "not_requested" || application.application_status === "rejected" || application.application_status === "withdrawn"} value={application.application_status} onChange={(event) => void changeStatus(application, event.target.value as ApplicationStatus)} className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm disabled:bg-slate-100">
            {Object.entries(applicationLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <div className="flex items-center gap-2">{application.application_status === "offer_received" && (application.placement_request_status === "not_requested" || application.placement_request_status === "declined") && <button onClick={() => chooseEvidence(application.id)} disabled={busyId === application.id} className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#3D348B] px-3 text-sm font-semibold text-white disabled:opacity-50"><FileUp size={16} />{application.placement_request_status === "declined" ? "ส่งหลักฐานใหม่" : "ยื่นหลักฐาน"}</button>}{application.placement_request_status === "confirmed" && <CheckCircle2 className="text-emerald-600" aria-label="ยืนยันแล้ว" />}</div>
        </div>)}</div>}
      </section>
      {externalRequests.length > 0 && <section className="rounded-lg border border-slate-200 bg-white"><div className="border-b border-slate-100 px-5 py-4"><h2 className="font-bold">สถานะคำขอบริษัทภายนอก</h2></div><div className="divide-y divide-slate-100">{externalRequests.map((request) => <div key={request.id} className="flex flex-col justify-between gap-2 px-5 py-4 sm:flex-row sm:items-center"><div><p className="font-semibold text-slate-900">{request.company_name}</p><p className="mt-1 text-sm text-slate-500">{request.position}</p>{request.review_note && <p className="mt-2 text-xs text-amber-700">เหตุผล/หมายเหตุ: {request.review_note}</p>}</div><span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${request.status === "approved" ? "bg-emerald-50 text-emerald-700" : request.status === "rejected" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>{request.status === "approved" ? "อนุมัติแล้ว" : request.status === "rejected" ? "ไม่อนุมัติ" : "รอพิจารณา"}</span></div>)}</div></section>}
      <section><div className="mb-3"><h2 className="text-lg font-bold">ประกาศจาก Coordinator</h2><p className="text-sm text-slate-500">เมื่อเลือกแล้ว ให้ไปสมัครผ่านช่องทางที่บริษัทประกาศ</p></div><div className="grid gap-4 md:grid-cols-2">{jobs.map((job) => <JobCard key={job.id} company={job.company_name} title={job.title} location={job.location} tags={job.tags} busy={busyId === job.id} onStart={() => void startApplication(job)} />)}</div></section>
      {externalRequests.some((request) => request.status === "approved") && <section><div className="mb-3"><h2 className="text-lg font-bold">บริษัทภายนอกที่อนุมัติแล้ว</h2><p className="text-sm text-slate-500">เริ่มติดตามการสมัครได้หลังได้รับอนุมัติ</p></div><div className="grid gap-4 md:grid-cols-2">{externalRequests.filter((request) => request.status === "approved").map((company) => <JobCard key={company.id} company={company.company_name} title={company.position} location={company.location} tags={null} busy={busyId === company.id} onStart={() => void startApplication(company)} />)}</div></section>}
    </div></main>
  </div>;
}

function JobCard({ company, title, location, tags, busy, onStart }: { company: string; title: string; location: string | null; tags: string[] | null; busy: boolean; onStart: () => void }) {
  return <article className="rounded-lg border border-slate-200 bg-white p-5"><Building2 className="mb-3 text-[#3D348B]" size={22} /><h3 className="font-bold text-slate-900">{company}</h3><p className="mt-1 text-sm text-slate-600">{title}</p><p className="mt-2 text-xs text-slate-500">{location || "ไม่ระบุสถานที่"}</p>{tags?.length ? <p className="mt-2 text-xs text-slate-500">{tags.join(" · ")}</p> : null}<button disabled={busy} onClick={onStart} className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg border border-[#3D348B] px-3 text-sm font-semibold text-[#3D348B] hover:bg-[#F4F3FC] disabled:opacity-50"><Send size={15} />เริ่มติดตามการสมัคร</button></article>;
}
