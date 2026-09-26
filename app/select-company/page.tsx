"use client";

import { ChangeEvent, FormEvent, useCallback, useEffect, useState } from "react";
import { Building2, CheckCircle2, Clock3, FileText, FileUp, Loader2, Send, X, XCircle } from "lucide-react";
import StudentSidebar from "@/components/StudentSidebar";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";

type ApplicationStatus = "draft" | "submitted" | "interview" | "offer_received" | "rejected" | "withdrawn";
type PlacementRequestStatus = "not_requested" | "pending_verification" | "confirmed" | "declined";
type ReviewStatus = "pending" | "approved" | "rejected";
type SelectionOutcome = "undecided" | "selected" | "not_selected";
type Job = { id: string; title: string; company_name: string; location: string | null; tags: string[] | null };
type ExternalRequest = { id: string; company_name: string; position: string; location: string; status: "pending" | "approved" | "rejected"; review_note: string | null };
type StatusUpdate = { id: string; previous_status: ApplicationStatus; new_status: ApplicationStatus; evidence_files: string[]; note: string | null; created_at: string; review_status: ReviewStatus; review_note: string | null; reviewed_at: string | null };
type Application = { id: string; job_id: string | null; external_submission_id: string | null; company_name: string; job_title: string; application_status: ApplicationStatus; placement_request_status: PlacementRequestStatus; placement_verification_note: string | null; selection_outcome: SelectionOutcome; offer_evidence_files: string[]; status_updates: StatusUpdate[] };

const MAX_EVIDENCE_FILE_SIZE = 10 * 1024 * 1024;
const EVIDENCE_EXTENSIONS = ["pdf", "doc", "docx", "png", "jpg", "jpeg", "webp"];

function getErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  return fallback;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const applicationLabels: Record<ApplicationStatus, string> = {
  draft: "ยังไม่ยืนยันการสมัคร", submitted: "สมัครแล้ว", interview: "ได้รับเรียกสัมภาษณ์", offer_received: "ได้รับข้อเสนอ", rejected: "ไม่ผ่าน", withdrawn: "ถอนการสมัคร",
};
const allowedStatusTransitions: Record<ApplicationStatus, ApplicationStatus[]> = {
  draft: ["submitted"],
  submitted: ["interview", "offer_received", "rejected", "withdrawn"],
  interview: ["offer_received", "rejected", "withdrawn"],
  offer_received: ["withdrawn"],
  rejected: [],
  withdrawn: [],
};
const placementLabels: Record<PlacementRequestStatus, string> = {
  not_requested: "ยังไม่ได้เลือกเป็นที่ฝึกงาน", pending_verification: "รอ Coordinator ยืนยันบริษัทที่เลือก", confirmed: "ยืนยันที่ฝึกงานแล้ว", declined: "คำขอเลือกบริษัทถูกส่งกลับ",
};
const reviewLabels: Record<ReviewStatus, string> = { pending: "รอตรวจ", approved: "อนุมัติแล้ว", rejected: "ขอแก้ไข" };
const reviewStyles: Record<ReviewStatus, string> = { pending: "bg-amber-50 text-amber-700", approved: "bg-emerald-50 text-emerald-700", rejected: "bg-red-50 text-red-700" };

export default function SelectCompanyPage() {
  const { user, loading: authLoading } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [externalRequests, setExternalRequests] = useState<ExternalRequest[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingStatusUpdate, setPendingStatusUpdate] = useState<{ application: Application; status: ApplicationStatus } | null>(null);
  const [statusEvidenceFiles, setStatusEvidenceFiles] = useState<File[]>([]);
  const [statusNote, setStatusNote] = useState("");
  const [statusUpdateError, setStatusUpdateError] = useState<string | null>(null);
  const [uploadingFileNumber, setUploadingFileNumber] = useState<number | null>(null);
  const [fileUrls, setFileUrls] = useState<Record<string, string>>({});

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    const [jobResult, applicationResult, externalResult] = await Promise.all([
      supabase.from("jobs").select("id, title, company_name, location, tags").eq("status", "open").is("archived_at", null).order("created_at", { ascending: false }),
      supabase.from("job_applications").select("id, job_id, external_submission_id, company_name, job_title, application_status, placement_request_status, placement_verification_note, selection_outcome, offer_evidence_files, status_updates:application_status_updates(id, previous_status, new_status, evidence_files, note, created_at, review_status, review_note, reviewed_at)").eq("student_id", user.id).order("submitted_at", { ascending: false }),
      supabase.from("external_company_submissions").select("id, company_name, position, location, status, review_note").eq("student_id", user.id).order("created_at", { ascending: false }),
    ]);
    if (jobResult.error || applicationResult.error || externalResult.error) {
      setError(jobResult.error?.message ?? applicationResult.error?.message ?? externalResult.error?.message ?? "โหลดข้อมูลไม่สำเร็จ");
    }
    setJobs((jobResult.data ?? []) as Job[]);
    setApplications(((applicationResult.data ?? []) as Application[]).map((application) => ({
      ...application,
      offer_evidence_files: application.offer_evidence_files ?? [],
      status_updates: [...(application.status_updates ?? [])].sort((a, b) => b.created_at.localeCompare(a.created_at)),
    })));
    setExternalRequests((externalResult.data ?? []) as ExternalRequest[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!authLoading && user) void loadData();
      if (!authLoading && !user) setLoading(false);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [authLoading, loadData, user]);

  const startApplication = async (source: Job | ExternalRequest) => {
    if (!user) return;
    const isJob = "title" in source;
    const existing = applications.find((application) =>
      (application.application_status === "draft" || application.application_status === "submitted" || application.application_status === "interview" || application.application_status === "offer_received")
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
      setMessage("เพิ่มรายการแล้ว กรุณาเลือกสถานะ “สมัครแล้ว” และแนบหลักฐานเพื่อส่งให้ Coordinator ตรวจสอบ");
      await loadData();
    }
    setBusyId(null);
  };

  const changeStatus = (application: Application, status: ApplicationStatus) => {
    if (status === application.application_status) return;
    setError(null);
    setMessage(null);
    setStatusEvidenceFiles([]);
    setStatusNote("");
    setStatusUpdateError(null);
    setUploadingFileNumber(null);
    setPendingStatusUpdate({ application, status });
  };

  const selectStatusEvidence = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    setStatusUpdateError(null);

    const invalidFile = files.find((file) => {
      const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
      return !EVIDENCE_EXTENSIONS.includes(extension);
    });
    if (invalidFile) {
      setStatusEvidenceFiles([]);
      event.target.value = "";
      setStatusUpdateError(`ไฟล์ ${invalidFile.name} ไม่รองรับ กรุณาใช้ PDF, DOC, DOCX, PNG, JPG หรือ WEBP`);
      return;
    }

    const oversizedFile = files.find((file) => file.size > MAX_EVIDENCE_FILE_SIZE);
    if (oversizedFile) {
      setStatusEvidenceFiles([]);
      event.target.value = "";
      setStatusUpdateError(`ไฟล์ ${oversizedFile.name} มีขนาดเกิน 10 MB`);
      return;
    }

    setStatusEvidenceFiles(files);
  };

  const submitStatusUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!pendingStatusUpdate || !user) return;
    if (statusEvidenceFiles.length === 0) {
      setStatusUpdateError("กรุณาเลือกไฟล์หลักฐานอย่างน้อย 1 ไฟล์");
      return;
    }
    const { application, status } = pendingStatusUpdate;
    setBusyId(application.id);
    setError(null);
    setStatusUpdateError(null);
    const uploadedPaths: string[] = [];
    try {
      for (const [index, file] of statusEvidenceFiles.entries()) {
        setUploadingFileNumber(index + 1);
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const uniqueId = typeof crypto.randomUUID === "function" ? crypto.randomUUID() : Math.random().toString(36).slice(2);
        const path = `${user.id}/status-updates/${application.id}/${Date.now()}_${uniqueId}_${safeName}`;
        const { error: uploadError } = await supabase.storage.from("internship-evidence").upload(path, file, { upsert: false });
        if (uploadError) throw uploadError;
        uploadedPaths.push(path);
      }
      const { error: updateError } = await supabase.rpc("update_application_status_with_evidence", {
        application_id: application.id,
        new_status: status,
        evidence_files: uploadedPaths,
        update_note: statusNote.trim() || null,
      });
      if (updateError) throw updateError;
      setMessage(`ส่งคำขอเปลี่ยนเป็น “${applicationLabels[status]}” ให้ Coordinator ตรวจสอบแล้ว`);
      setPendingStatusUpdate(null);
      setStatusEvidenceFiles([]);
      setStatusNote("");
      setStatusUpdateError(null);
      await loadData();
    } catch (updateError) {
      console.error("Status evidence update failed:", updateError);
      if (uploadedPaths.length > 0) {
        await supabase.storage.from("internship-evidence").remove(uploadedPaths);
      }
      setStatusUpdateError(getErrorMessage(updateError, "อัปเดตสถานะพร้อมหลักฐานไม่สำเร็จ กรุณาลองอีกครั้ง"));
    } finally {
      setUploadingFileNumber(null);
      setBusyId(null);
    }
  };

  const openEvidence = async (path: string) => {
    if (fileUrls[path]) {
      window.open(fileUrls[path], "_blank", "noopener,noreferrer");
      return;
    }
    const { data, error: signedUrlError } = await supabase.storage.from("internship-evidence").createSignedUrl(path, 60 * 30);
    if (signedUrlError || !data?.signedUrl) {
      setError(signedUrlError?.message ?? "เปิดไฟล์หลักฐานไม่สำเร็จ");
      return;
    }
    setFileUrls((current) => ({ ...current, [path]: data.signedUrl }));
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  const selectInternshipCompany = async (application: Application) => {
    if (!window.confirm(`ยืนยันเลือก ${application.company_name} เป็นสถานที่ฝึกงานหรือไม่`)) return;
    setBusyId(application.id); setError(null); setMessage(null);
    const { error: selectionError } = await supabase.rpc("select_internship_company", { application_id: application.id });
    if (selectionError) setError(selectionError.message);
    else { setMessage(`ส่งคำขอเลือก ${application.company_name} ให้ Coordinator ยืนยันแล้ว`); await loadData(); }
    setBusyId(null);
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="animate-spin text-[#3D348B]" /></div>;

  return <div className="flex min-h-screen bg-slate-50 text-slate-800">
    <StudentSidebar />
    <main className="min-w-0 flex-1 p-6 md:p-8"><div className="mx-auto max-w-6xl space-y-7">
      <header><h1 className="text-2xl font-bold text-slate-900">สมัครและติดตามการฝึกงาน</h1><p className="mt-1 text-sm text-slate-500">สมัครผ่านช่องทางบริษัทด้วยตนเอง แล้วรายงานความคืบหน้าตามความจริง</p></header>
      {message && <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</p>}
      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-4"><h2 className="font-bold">รายการที่กำลังสมัคร</h2></div>
        {applications.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate-500">ยังไม่มีรายการสมัคร</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {applications.map((application) => {
              const pendingUpdate = application.status_updates.find((update) => update.review_status === "pending");
              const hasConfirmedPlacement = applications.some((item) => item.placement_request_status === "confirmed");
              const statusLocked = Boolean(pendingUpdate) || hasConfirmedPlacement || application.placement_request_status === "pending_verification" || application.application_status === "rejected" || application.application_status === "withdrawn" || application.selection_outcome === "not_selected";
              return <div key={application.id} className="grid gap-4 p-5 lg:grid-cols-[1fr_240px_auto] lg:items-start">
                <div>
                  <p className="font-semibold text-slate-900">{application.company_name}</p>
                  <p className="mt-1 text-sm text-slate-600">{application.job_title}</p>
                  <p className="mt-2 text-xs text-slate-500">สถานะยืนยันแล้ว: <strong>{applicationLabels[application.application_status]}</strong></p>
                  {pendingUpdate && <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700"><Clock3 size={13} />รอตรวจเปลี่ยนเป็น “{applicationLabels[pendingUpdate.new_status]}”</p>}
                  {application.selection_outcome === "not_selected" ? <p className="mt-2 text-xs font-semibold text-slate-500">ไม่ได้เลือกเป็นสถานที่ฝึกงาน</p> : application.application_status === "offer_received" && <p className="mt-2 text-xs text-slate-500">{placementLabels[application.placement_request_status]}</p>}
                  {application.placement_request_status === "declined" && application.placement_verification_note && <p className="mt-2 text-xs font-medium text-amber-700">เหตุผล: {application.placement_verification_note}</p>}
                  {application.status_updates.length > 0 && (
                    <details className="mt-3 text-xs text-slate-600">
                      <summary className="cursor-pointer font-medium text-[#3D348B]">ประวัติการอัปเดต ({application.status_updates.length})</summary>
                      <div className="mt-2 space-y-3 border-l-2 border-slate-100 pl-3">
                        {application.status_updates.map((update) => (
                          <div key={update.id}>
                            <div className="flex flex-wrap items-center gap-2"><p className="font-medium text-slate-700">{applicationLabels[update.previous_status]} → {applicationLabels[update.new_status]}</p><span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${reviewStyles[update.review_status]}`}>{reviewLabels[update.review_status]}</span></div>
                            <p className="mt-0.5 text-slate-400">{new Date(update.created_at).toLocaleString("th-TH")}</p>
                            {update.note && <p className="mt-1">หมายเหตุ: {update.note}</p>}
                            {update.review_note && <p className="mt-1 font-medium text-red-700">ผลตรวจ: {update.review_note}</p>}
                            <div className="mt-1 flex flex-wrap gap-2">
                              {update.evidence_files.map((path) => (
                                <button key={path} type="button" onClick={() => void openEvidence(path)} className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[#3D348B] hover:bg-[#F4F3FC]">
                                  <FileText size={13} />{path.split("/").at(-1)?.replace(/^\d+_[^_]+_/, "")}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
                <select aria-label="ขออัปเดตสถานะการสมัคร" disabled={busyId === application.id || statusLocked || allowedStatusTransitions[application.application_status].length === 0} value={application.application_status} onChange={(event) => changeStatus(application, event.target.value as ApplicationStatus)} className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm disabled:bg-slate-100">
                  {[application.application_status, ...allowedStatusTransitions[application.application_status]].map((value) => <option key={value} value={value}>{applicationLabels[value]}</option>)}
                </select>
                <div className="flex items-center gap-2">
                  {application.application_status === "offer_received" && application.selection_outcome !== "not_selected" && (application.placement_request_status === "not_requested" || application.placement_request_status === "declined") && !hasConfirmedPlacement && <button onClick={() => void selectInternshipCompany(application)} disabled={busyId === application.id || Boolean(pendingUpdate)} className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#3D348B] px-3 text-sm font-semibold text-white disabled:opacity-50"><CheckCircle2 size={16} />เลือกบริษัทนี้</button>}
                  {application.placement_request_status === "pending_verification" && <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700"><Clock3 size={15} />รอยืนยัน</span>}
                  {application.placement_request_status === "confirmed" && <CheckCircle2 className="text-emerald-600" aria-label="ยืนยันแล้ว" />}
                  {application.selection_outcome === "not_selected" && <XCircle className="text-slate-400" aria-label="ไม่ได้เลือก" />}
                </div>
              </div>;
            })}
          </div>
        )}
      </section>
      {externalRequests.length > 0 && <section className="rounded-lg border border-slate-200 bg-white"><div className="border-b border-slate-100 px-5 py-4"><h2 className="font-bold">สถานะคำขอบริษัทภายนอก</h2></div><div className="divide-y divide-slate-100">{externalRequests.map((request) => <div key={request.id} className="flex flex-col justify-between gap-2 px-5 py-4 sm:flex-row sm:items-center"><div><p className="font-semibold text-slate-900">{request.company_name}</p><p className="mt-1 text-sm text-slate-500">{request.position}</p>{request.review_note && <p className="mt-2 text-xs text-amber-700">เหตุผล/หมายเหตุ: {request.review_note}</p>}</div><span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${request.status === "approved" ? "bg-emerald-50 text-emerald-700" : request.status === "rejected" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>{request.status === "approved" ? "อนุมัติแล้ว" : request.status === "rejected" ? "ไม่อนุมัติ" : "รอพิจารณา"}</span></div>)}</div></section>}
      <section><div className="mb-3"><h2 className="text-lg font-bold">ประกาศจาก Coordinator</h2><p className="text-sm text-slate-500">เมื่อเลือกแล้ว ให้ไปสมัครผ่านช่องทางที่บริษัทประกาศ</p></div><div className="grid gap-4 md:grid-cols-2">{jobs.map((job) => <JobCard key={job.id} company={job.company_name} title={job.title} location={job.location} tags={job.tags} busy={busyId === job.id} onStart={() => void startApplication(job)} />)}</div></section>
      {externalRequests.some((request) => request.status === "approved") && <section><div className="mb-3"><h2 className="text-lg font-bold">บริษัทภายนอกที่อนุมัติแล้ว</h2><p className="text-sm text-slate-500">เริ่มติดตามการสมัครได้หลังได้รับอนุมัติ</p></div><div className="grid gap-4 md:grid-cols-2">{externalRequests.filter((request) => request.status === "approved").map((company) => <JobCard key={company.id} company={company.company_name} title={company.position} location={company.location} tags={null} busy={busyId === company.id} onStart={() => void startApplication(company)} />)}</div></section>}
    </div></main>
    {pendingStatusUpdate && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={() => busyId !== pendingStatusUpdate.application.id && setPendingStatusUpdate(null)}>
        <form onSubmit={submitStatusUpdate} onClick={(event) => event.stopPropagation()} className="w-full max-w-lg rounded-lg bg-white shadow-xl">
          <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
            <div><h2 className="font-bold text-slate-900">ส่งคำขออัปเดตสถานะ</h2><p className="mt-1 text-sm text-slate-500">{pendingStatusUpdate.application.company_name} · ขอเปลี่ยนเป็น {applicationLabels[pendingStatusUpdate.status]}</p></div>
            <button type="button" aria-label="ปิด" disabled={busyId === pendingStatusUpdate.application.id} onClick={() => setPendingStatusUpdate(null)} className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-50"><X size={20} /></button>
          </div>
          <div className="space-y-4 p-5">
            <div>
              <p className="text-sm font-medium text-slate-700">ไฟล์หลักฐาน <span className="text-red-600">*</span></p>
              <input id="status-evidence-files" multiple type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp" onChange={selectStatusEvidence} className="sr-only" />
              <label htmlFor="status-evidence-files" className="mt-2 flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50">
                <span className="inline-flex items-center gap-2 rounded-md bg-[#EFEEFC] px-3 py-2 font-semibold text-[#3D348B]"><FileUp size={16} />เลือกไฟล์</span>
                <span className="min-w-0 truncate text-right text-slate-500">{statusEvidenceFiles.length > 0 ? `เลือกแล้ว ${statusEvidenceFiles.length} ไฟล์` : "ยังไม่ได้เลือกไฟล์"}</span>
              </label>
            </div>
            <p className="text-xs text-slate-500">รองรับ PDF, DOC, DOCX, PNG, JPG และ WEBP ขนาดไม่เกิน 10 MB ต่อไฟล์</p>
            {statusEvidenceFiles.length > 0 && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="mb-2 text-xs font-semibold text-slate-700">เลือกแล้ว {statusEvidenceFiles.length} ไฟล์</p>
                <ul className="space-y-1.5">
                  {statusEvidenceFiles.map((file) => (
                    <li key={`${file.name}-${file.lastModified}`} className="flex min-w-0 items-center justify-between gap-3 text-xs text-slate-600">
                      <span className="min-w-0 truncate" title={file.name}>{file.name}</span>
                      <span className="shrink-0 text-slate-400">{formatFileSize(file.size)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {statusUpdateError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{statusUpdateError}</p>}
            {uploadingFileNumber !== null && <p role="status" className="text-sm font-medium text-[#3D348B]">กำลังอัปโหลดไฟล์ {uploadingFileNumber} จาก {statusEvidenceFiles.length}...</p>}
            <label className="block text-sm font-medium text-slate-700">หมายเหตุ<textarea value={statusNote} onChange={(event) => setStatusNote(event.target.value)} placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)" className="mt-2 min-h-24 w-full rounded-lg border border-slate-300 p-3 text-sm" /></label>
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4">
            <button type="button" disabled={busyId === pendingStatusUpdate.application.id} onClick={() => setPendingStatusUpdate(null)} className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-medium text-slate-700 disabled:opacity-50">ยกเลิก</button>
            <button type="submit" disabled={busyId === pendingStatusUpdate.application.id || statusEvidenceFiles.length === 0} className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#3D348B] px-4 text-sm font-semibold text-white disabled:opacity-50">{busyId === pendingStatusUpdate.application.id ? <Loader2 className="animate-spin" size={16} /> : <FileUp size={16} />}{busyId === pendingStatusUpdate.application.id ? "กำลังส่ง..." : "ส่งให้ Coordinator ตรวจ"}</button>
          </div>
        </form>
      </div>
    )}
  </div>;
}

function JobCard({ company, title, location, tags, busy, onStart }: { company: string; title: string; location: string | null; tags: string[] | null; busy: boolean; onStart: () => void }) {
  return <article className="rounded-lg border border-slate-200 bg-white p-5"><Building2 className="mb-3 text-[#3D348B]" size={22} /><h3 className="font-bold text-slate-900">{company}</h3><p className="mt-1 text-sm text-slate-600">{title}</p><p className="mt-2 text-xs text-slate-500">{location || "ไม่ระบุสถานที่"}</p>{tags?.length ? <p className="mt-2 text-xs text-slate-500">{tags.join(" · ")}</p> : null}<button disabled={busy} onClick={onStart} className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg border border-[#3D348B] px-3 text-sm font-semibold text-[#3D348B] hover:bg-[#F4F3FC] disabled:opacity-50"><Send size={15} />เริ่มติดตามการสมัคร</button></article>;
}
