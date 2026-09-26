"use client";

import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Clock3, Eye, FileText, FileUp, Loader2, RotateCcw, XCircle } from "lucide-react";
import StudentSidebar from "@/components/StudentSidebar";
import InternshipTabs from "@/components/InternshipTabs";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";

const BUCKET = "student-documents";
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const documentTypes = ["หนังสือตอบรับ", "หนังสือส่งตัว", "แผนการฝึกงาน", "รายงานกลางภาค", "รายงานฉบับสมบูรณ์", "เอกสารอื่น ๆ"];

type DocumentStatus = "pending" | "needs_edit" | "approved" | "rejected";
type InternshipRecord = { id: string; company_name: string | null; position: string | null; placement_status: string; status: string };
type InternshipDocument = {
  id: string; document_type: string; file_name: string; file_url: string; status: DocumentStatus;
  comment: string | null; submitted_at: string; reviewed_at: string | null;
  document_group_id: string; version: number; supersedes_id: string | null;
};

const statusLabels: Record<DocumentStatus, string> = { pending: "รอตรวจ", needs_edit: "ขอแก้ไข", approved: "ผ่านแล้ว", rejected: "ไม่ผ่าน" };
const statusStyles: Record<DocumentStatus, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  needs_edit: "border-orange-200 bg-orange-50 text-orange-700",
  approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
  rejected: "border-red-200 bg-red-50 text-red-700",
};

function errorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") return error.message;
  return fallback;
}
function displayDate(value: string) { return new Date(value).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" }); }
function formatFileSize(bytes: number) { return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`; }

export default function InternshipRecordPage() {
  const { user, loading: authLoading } = useAuth();
  const [record, setRecord] = useState<InternshipRecord | null>(null);
  const [documents, setDocuments] = useState<InternshipDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [documentType, setDocumentType] = useState(documentTypes[0]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [revisionTarget, setRevisionTarget] = useState<InternshipDocument | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const loadData = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true); setMessage(null);
    const { data: internship, error: recordError } = await supabase.from("internship_records")
      .select("id, company_name, position, placement_status, status").eq("student_id", user.id)
      .eq("placement_status", "approved").eq("status", "in_progress")
      .order("updated_at", { ascending: false }).limit(1).maybeSingle();
    if (recordError) { setMessage({ type: "error", text: `โหลดข้อมูลการฝึกงานไม่สำเร็จ: ${recordError.message}` }); setLoading(false); return; }
    setRecord(internship as InternshipRecord | null);
    if (!internship) { setDocuments([]); setLoading(false); return; }
    let documentResult = await supabase.from("student_documents")
      .select("id, document_type, file_name, file_url, status, comment, submitted_at, reviewed_at, document_group_id, version, supersedes_id")
      .eq("internship_record_id", internship.id).order("submitted_at", { ascending: false });
    if (documentResult.error?.message.toLowerCase().includes("object not found")) {
      await new Promise((resolve) => window.setTimeout(resolve, 600));
      documentResult = await supabase.from("student_documents")
        .select("id, document_type, file_name, file_url, status, comment, submitted_at, reviewed_at, document_group_id, version, supersedes_id")
        .eq("internship_record_id", internship.id).order("submitted_at", { ascending: false });
    }
    if (documentResult.error) setMessage({ type: "error", text: `โหลดรายการเอกสารไม่สำเร็จ: ${documentResult.error.message}` });
    setDocuments((documentResult.data ?? []) as InternshipDocument[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { if (!authLoading) void loadData(); }, [authLoading, loadData]);

  const latestDocuments = useMemo(() => {
    const latest = new Map<string, InternshipDocument>();
    for (const document of documents) {
      const current = latest.get(document.document_group_id);
      if (!current || document.version > current.version) latest.set(document.document_group_id, document);
    }
    return [...latest.values()].sort((a, b) => b.submitted_at.localeCompare(a.submitted_at));
  }, [documents]);

  function selectFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setMessage(null);
    if (!file) { setSelectedFile(null); return; }
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!extension || !["pdf", "doc", "docx", "png", "jpg", "jpeg", "webp"].includes(extension)) {
      setSelectedFile(null); event.target.value = "";
      setMessage({ type: "error", text: "รองรับเฉพาะ PDF, DOC, DOCX, PNG, JPG และ WEBP" }); return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setSelectedFile(null); event.target.value = "";
      setMessage({ type: "error", text: "ไฟล์ต้องมีขนาดไม่เกิน 10 MB" }); return;
    }
    setSelectedFile(file);
  }

  function beginRevision(document: InternshipDocument) {
    setRevisionTarget(document); setDocumentType(document.document_type); setSelectedFile(null); setMessage(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function cancelRevision() {
    setRevisionTarget(null); setSelectedFile(null); setDocumentType(documentTypes[0]);
    if (fileInput.current) fileInput.current.value = "";
  }

  async function submitDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || !record || !selectedFile) { setMessage({ type: "error", text: "กรุณาเลือกประเภทและไฟล์เอกสาร" }); return; }
    setUploading(true); setMessage(null);
    const groupId = revisionTarget?.document_group_id ?? crypto.randomUUID();
    const version = revisionTarget ? revisionTarget.version + 1 : 1;
    const safeName = selectedFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${user.id}/internship-documents/${record.id}/${groupId}/v${version}_${Date.now()}_${safeName}`;
    try {
      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, selectedFile, { upsert: false });
      if (uploadError) throw uploadError;
      const { error: insertError } = await supabase.from("student_documents").insert({
        student_id: user.id, internship_record_id: record.id, document_type: documentType,
        file_name: selectedFile.name, file_url: path, status: "pending", document_group_id: groupId,
        version, supersedes_id: revisionTarget?.id ?? null,
      });
      if (insertError) { await supabase.storage.from(BUCKET).remove([path]); throw insertError; }
      setMessage({ type: "success", text: revisionTarget ? `ส่ง ${documentType} เวอร์ชัน ${version} ให้อาจารย์ตรวจแล้ว` : `ส่ง ${documentType} ให้อาจารย์ตรวจแล้ว` });
      cancelRevision(); await loadData();
    } catch (error) { setMessage({ type: "error", text: errorMessage(error, "ส่งเอกสารไม่สำเร็จ กรุณาลองอีกครั้ง") }); }
    finally { setUploading(false); }
  }

  async function openDocument(document: InternshipDocument) {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(document.file_url, 60 * 30);
    if (error || !data?.signedUrl) { setMessage({ type: "error", text: error?.message ?? "เปิดเอกสารไม่สำเร็จ" }); return; }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-[#3D348B]" /></div>;

  return <div className="flex min-h-screen bg-slate-50 text-slate-800">
    <StudentSidebar />
    <main className="min-w-0 flex-1 px-4 py-6 md:px-8"><div className="mx-auto max-w-5xl space-y-6">
      <InternshipTabs />
      <header><h1 className="text-2xl font-bold text-slate-900">เอกสารฝึกงาน</h1><p className="mt-1 text-sm text-slate-500">ส่งเอกสาร ติดตามผลตรวจ และส่งฉบับแก้ไขให้อาจารย์ที่ปรึกษา</p></header>
      {message && <p role="status" className={`rounded-lg border px-4 py-3 text-sm ${message.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-700"}`}>{message.text}</p>}

      {!record ? <section className="rounded-lg border border-slate-200 bg-white p-8 text-center"><Clock3 className="mx-auto text-slate-300" size={32} /><h2 className="mt-3 font-semibold text-slate-800">ยังไม่สามารถส่งเอกสารฝึกงานได้</h2><p className="mt-1 text-sm text-slate-500">ระบบจะเปิดส่วนนี้หลัง Coordinator ยืนยันสถานที่ฝึกงานแล้ว</p></section> : <>
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-bold text-slate-900">{revisionTarget ? "ส่งเอกสารฉบับแก้ไข" : "ส่งเอกสารให้อาจารย์ตรวจ"}</h2><p className="mt-1 text-sm text-slate-500">{record.position || "ตำแหน่งฝึกงาน"} · {record.company_name || "สถานประกอบการ"}</p></div>{revisionTarget && <button type="button" onClick={cancelRevision} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600"><XCircle size={16} />ยกเลิกการแก้ไข</button>}</div>
          <form onSubmit={submitDocument} className="grid gap-4 md:grid-cols-[260px_minmax(0,1fr)_auto] md:items-end">
            <label className="text-sm font-semibold text-slate-700">ประเภทเอกสาร<select value={documentType} disabled={Boolean(revisionTarget)} onChange={(event) => setDocumentType(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 font-normal disabled:bg-slate-100">{documentTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
            <div><p className="text-sm font-semibold text-slate-700">ไฟล์เอกสาร</p><input ref={fileInput} id="internship-document-file" type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp" onChange={selectFile} className="sr-only" /><label htmlFor="internship-document-file" className="mt-2 flex h-11 cursor-pointer items-center justify-between gap-3 rounded-lg border border-slate-300 px-3 text-sm hover:bg-slate-50"><span className="inline-flex items-center gap-2 font-semibold text-[#3D348B]"><FileUp size={16} />เลือกไฟล์</span><span className="min-w-0 truncate text-slate-500">{selectedFile ? `${selectedFile.name} · ${formatFileSize(selectedFile.size)}` : "ยังไม่ได้เลือกไฟล์"}</span></label></div>
            <button type="submit" disabled={!selectedFile || uploading} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#3D348B] px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{uploading ? <Loader2 className="animate-spin" size={17} /> : <FileUp size={17} />}{uploading ? "กำลังส่ง..." : revisionTarget ? `ส่งเวอร์ชัน ${revisionTarget.version + 1}` : "ส่งตรวจ"}</button>
          </form><p className="mt-3 text-xs text-slate-400">รองรับ PDF, DOC, DOCX, PNG, JPG และ WEBP ขนาดไม่เกิน 10 MB</p>
        </section>

        <section><div className="mb-3 flex items-center justify-between"><div><h2 className="text-lg font-bold text-slate-900">รายการเอกสาร</h2><p className="text-sm text-slate-500">แสดงฉบับล่าสุดของเอกสารแต่ละรายการ</p></div><span className="text-sm font-medium text-slate-500">{latestDocuments.length} รายการ</span></div>
          {latestDocuments.length === 0 ? <div className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-12 text-center"><FileText className="mx-auto text-slate-300" size={32} /><p className="mt-3 text-sm font-medium text-slate-600">ยังไม่มีเอกสารที่ส่งตรวจ</p></div> : <div className="space-y-3">{latestDocuments.map((document) => {
            const versions = documents.filter((item) => item.document_group_id === document.document_group_id).sort((a, b) => b.version - a.version);
            return <article key={document.id} className="rounded-lg border border-slate-200 bg-white p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-slate-900">{document.document_type}</h3><span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyles[document.status]}`}>{statusLabels[document.status]}</span></div><p className="mt-2 truncate text-sm text-slate-600">{document.file_name}</p><p className="mt-1 text-xs text-slate-400">เวอร์ชัน {document.version} · ส่งเมื่อ {displayDate(document.submitted_at)}</p>{document.comment && <p className={`mt-3 rounded-lg px-3 py-2 text-sm ${document.status === "needs_edit" ? "bg-orange-50 text-orange-800" : "bg-slate-50 text-slate-700"}`}><strong>ความคิดเห็นอาจารย์:</strong> {document.comment}</p>}</div><div className="flex shrink-0 gap-2"><button type="button" onClick={() => void openDocument(document)} className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-700"><Eye size={15} />ดูไฟล์</button>{document.status === "needs_edit" && <button type="button" onClick={() => beginRevision(document)} className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#3D348B] px-3 text-sm font-semibold text-white"><RotateCcw size={15} />ส่งฉบับแก้ไข</button>}{document.status === "approved" && <CheckCircle2 className="mt-1 text-emerald-600" aria-label="ผ่านการตรวจแล้ว" />}</div></div>
              {versions.length > 1 && <details className="mt-4 border-t border-slate-100 pt-3"><summary className="cursor-pointer text-xs font-semibold text-[#3D348B]">ดูประวัติ {versions.length} เวอร์ชัน</summary><div className="mt-2 space-y-2">{versions.map((version) => <button key={version.id} type="button" onClick={() => void openDocument(version)} className="flex w-full items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-left text-xs text-slate-600"><span>เวอร์ชัน {version.version} · {version.file_name}</span><span>{statusLabels[version.status]}</span></button>)}</div></details>}
            </article>;
          })}</div>}
        </section>
      </>}
    </div></main>
  </div>;
}
