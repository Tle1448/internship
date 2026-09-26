"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Eye, FileText, Loader2, RotateCcw } from "lucide-react";
import type { Student } from "../../data";
import AdvisorShell from "../../components/AdvisorShell";
import StudentHeader from "../../components/StudentHeader";
import { supabase } from "@/lib/supabase";

type DocumentStatus = "pending" | "needs_edit" | "approved" | "rejected";
type StudentDocument = {
  id: string; document_type: string; file_name: string; file_url: string; status: DocumentStatus;
  comment: string | null; submitted_at: string; document_group_id: string; version: number;
};

const labels: Record<DocumentStatus, string> = { pending: "รอตรวจ", needs_edit: "ขอแก้ไข", approved: "ผ่านแล้ว", rejected: "ไม่ผ่าน" };
const styles: Record<DocumentStatus, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-700", needs_edit: "border-orange-200 bg-orange-50 text-orange-700",
  approved: "border-emerald-200 bg-emerald-50 text-emerald-700", rejected: "border-red-200 bg-red-50 text-red-700",
};

export default function StudentDocuments({ student }: { student: Student }) {
  const [documents, setDocuments] = useState<StudentDocument[]>([]);
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("student_documents")
      .select("id, document_type, file_name, file_url, status, comment, submitted_at, document_group_id, version")
      .eq("internship_record_id", student.recordId).order("submitted_at", { ascending: false });
    if (error) setMessage(`โหลดเอกสารไม่สำเร็จ: ${error.message}`);
    setDocuments((data ?? []) as StudentDocument[]);
    setLoading(false);
  }, [student.recordId]);

  useEffect(() => { void loadDocuments(); }, [loadDocuments]);

  const latestDocuments = useMemo(() => {
    const latest = new Map<string, StudentDocument>();
    for (const document of documents) {
      const current = latest.get(document.document_group_id);
      if (!current || document.version > current.version) latest.set(document.document_group_id, document);
    }
    return [...latest.values()];
  }, [documents]);

  async function openDocument(document: StudentDocument) {
    const { data, error } = await supabase.storage.from("student-documents").createSignedUrl(document.file_url, 60 * 30);
    if (error || !data?.signedUrl) { setMessage(error?.message ?? "เปิดเอกสารไม่สำเร็จ"); return; }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  async function review(document: StudentDocument, status: "approved" | "needs_edit") {
    const comment = (feedback[document.id] ?? document.comment ?? "").trim();
    if (status === "needs_edit" && !comment) { setMessage("กรุณาระบุสิ่งที่ต้องแก้ไข"); return; }
    setBusyId(document.id); setMessage("");
    const { error } = await supabase.from("student_documents").update({ status, comment: comment || null }).eq("id", document.id).eq("internship_record_id", student.recordId);
    if (error) setMessage(`บันทึกผลตรวจไม่สำเร็จ: ${error.message}`);
    else {
      setDocuments((current) => current.map((item) => item.id === document.id ? { ...item, status, comment: comment || null } : item));
      setMessage(status === "approved" ? "อนุมัติเอกสารแล้ว" : "ส่งเอกสารกลับให้นักศึกษาแก้ไขแล้ว");
    }
    setBusyId(null);
  }

  return <AdvisorShell student={student} active="students" studentSection="documents">
    <StudentHeader student={student} />
    {message && <p role="status" className="mb-4 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-900">{message}</p>}
    <section className="mb-4"><h2 className="text-xl font-bold text-slate-900">เอกสารฝึกงาน</h2><p className="mt-1 text-sm text-slate-500">ตรวจไฟล์ล่าสุด ให้ความคิดเห็น และอนุมัติหรือส่งกลับแก้ไข</p></section>
    {loading ? <div className="detail-card empty-state"><Loader2 className="mx-auto animate-spin" />กำลังโหลดเอกสาร...</div> : latestDocuments.length === 0 ? <div className="detail-card empty-state">ยังไม่มีเอกสารฝึกงานที่ส่งตรวจ</div> : <div className="space-y-4">{latestDocuments.map((document) => <article key={document.id} className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div><div className="flex flex-wrap items-center gap-2"><FileText className="text-indigo-800" size={20} /><h3 className="font-bold text-slate-900">{document.document_type}</h3><span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[document.status]}`}>{labels[document.status]}</span></div><p className="mt-2 text-sm text-slate-600">{document.file_name}</p><p className="mt-1 text-xs text-slate-400">เวอร์ชัน {document.version} · {new Date(document.submitted_at).toLocaleString("th-TH")}</p></div><button type="button" onClick={() => void openDocument(document)} className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-700"><Eye size={15} />เปิดเอกสาร</button></div>
      {document.status === "pending" ? <div className="mt-4 border-t border-slate-100 pt-4"><label className="block text-sm font-semibold text-slate-700">ความคิดเห็นถึงนักศึกษา<textarea rows={3} value={feedback[document.id] ?? document.comment ?? ""} onChange={(event) => setFeedback((current) => ({ ...current, [document.id]: event.target.value }))} placeholder="ระบุข้อเสนอแนะ หรือสิ่งที่ต้องแก้ไข" className="mt-2 w-full rounded-lg border border-slate-300 p-3 font-normal outline-none focus:border-indigo-600" /></label><div className="mt-3 flex justify-end gap-2"><button type="button" disabled={busyId === document.id} onClick={() => void review(document, "needs_edit")} className="inline-flex items-center gap-2 rounded-lg border border-orange-300 px-4 py-2 text-sm font-semibold text-orange-700 disabled:opacity-50"><RotateCcw size={15} />ขอแก้ไข</button><button type="button" disabled={busyId === document.id} onClick={() => void review(document, "approved")} className="inline-flex items-center gap-2 rounded-lg bg-indigo-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busyId === document.id ? <Loader2 className="animate-spin" size={15} /> : <CheckCircle2 size={15} />}อนุมัติ</button></div></div> : document.comment && <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700"><strong>ความคิดเห็น:</strong> {document.comment}</p>}
    </article>)}</div>}
  </AdvisorShell>;
}
