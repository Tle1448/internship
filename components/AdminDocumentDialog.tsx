"use client";

import { useState } from "react";

type Status = "pending" | "approved" | "needs_edit";
type DocumentItem = {
  id: string;
  document_type: string;
  file_path: string | null;
  status: Status;
  comment: string | null;
  submitted_at: string;
  companyName: string;
  student: { full_name: string | null; user_code: string | null } | null;
};

const fileName = (path: string | null) => path?.split("/").pop() || "ไม่มีไฟล์แนบ";
const formatDate = (value: string) => new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

export default function DocumentDialog({ document, onClose, onSaved }: { document: DocumentItem; onClose: () => void; onSaved: () => void }) {
  const [comment, setComment] = useState(document.comment ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (status: Status) => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/documents", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: document.id, status, comment }) });
      const data = await response.json() as { error?: string };
      if (!response.ok) { setError(data.error ?? "ไม่สามารถบันทึกผลการตรวจได้"); return; }
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return <div role="dialog" aria-modal="true" aria-labelledby="document-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"><header className="shrink-0 bg-[#4B42B5] px-6 py-5 text-white"><p className="text-sm text-white/80">{document.student?.full_name ?? "ไม่พบข้อมูลผู้ส่ง"} · {document.student?.user_code ?? "-"}</p><h2 id="document-title" className="mt-2 text-xl font-bold">{document.document_type}</h2><p className="mt-2 text-sm text-white/80">ไฟล์: {fileName(document.file_path)}</p></header><div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-6"><dl className="grid gap-4 text-sm sm:grid-cols-2"><div><dt className="text-gray-500">สถานประกอบการ</dt><dd className="mt-1 font-semibold">{document.companyName}</dd></div><div><dt className="text-gray-500">ส่งเมื่อ</dt><dd className="mt-1 font-semibold">{formatDate(document.submitted_at)}</dd></div></dl><label className="block text-sm font-semibold">หมายเหตุถึงผู้ส่ง<textarea value={comment} onChange={(event) => setComment(event.target.value)} rows={4} className="mt-2 w-full rounded-xl border border-[#EAEAEA] p-3 font-normal outline-none focus:border-[#7678ED]" placeholder="ระบุข้อเสนอแนะหรือเหตุผลการส่งกลับแก้ไข" /></label>{error && <p role="alert" className="text-sm text-red-600">{error}</p>}</div><footer className="flex flex-wrap justify-end gap-3 border-t border-[#EAEAEA] bg-[#FAFAFA] p-5"><button type="button" disabled={saving} onClick={onClose} className="rounded-xl border border-[#EAEAEA] bg-white px-5 py-3 text-sm font-semibold">ปิด</button><button type="button" disabled={saving} onClick={() => void save("needs_edit")} className="rounded-xl bg-[#F18701] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">ส่งกลับแก้ไข</button><button type="button" disabled={saving} onClick={() => void save("approved")} className="rounded-xl bg-[#3D348B] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">อนุมัติเอกสาร</button></footer></section></div>;
}
