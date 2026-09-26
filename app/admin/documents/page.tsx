"use client";

import AdminBreadcrumb from "@/components/AdminBreadcrumb";
import AdminSidebar from "@/components/AdminSidebar";
import { useCallback, useEffect, useMemo, useState } from "react";

type Status = "pending" | "approved" | "needs_edit";
type Document = { id: string; document_type: string; file_path: string | null; status: Status; comment: string | null; submitted_at: string; companyName: string; student: { full_name: string | null; user_code: string | null; email: string | null } | null };

const labels: Record<Status, string> = { pending: "รอตรวจสอบ", approved: "อนุมัติแล้ว", needs_edit: "ส่งแก้ไข" };
const styles: Record<Status, string> = { pending: "bg-[#FFF4D8] text-[#A16207]", approved: "bg-[#E5FAED] text-[#16A34A]", needs_edit: "bg-[#FEE2E2] text-[#DC2626]" };
const formatDate = (value: string) => new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
const fileName = (path: string | null) => path?.split("/").pop() || "ไม่มีไฟล์แนบ";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selected, setSelected] = useState<Document | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<Status | "all">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    setLoading(true);
    const response = await fetch("/api/admin/documents", { cache: "no-store" });
    const data = await response.json() as { documents?: Document[]; error?: string };
    if (response.ok) { setDocuments(data.documents ?? []); setError(null); } else setError(data.error ?? "ไม่สามารถโหลดเอกสารได้");
    setLoading(false);
  }, []);
  useEffect(() => { void Promise.resolve().then(load); }, [load]);
  const filtered = useMemo(() => documents.filter((item) => {
    const text = [item.student?.full_name, item.student?.user_code, item.student?.email, item.document_type, item.companyName].filter(Boolean).join(" ").toLowerCase();
    return (status === "all" || item.status === status) && text.includes(query.trim().toLowerCase());
  }), [documents, query, status]);
  const counts = useMemo(() => ({ pending: documents.filter((item) => item.status === "pending").length, approved: documents.filter((item) => item.status === "approved").length, needs_edit: documents.filter((item) => item.status === "needs_edit").length }), [documents]);

  return <div lang="th" className="min-h-screen bg-[#F8F9FA] text-black md:flex"><AdminSidebar active="documents" /><div className="min-w-0 flex-1 md:ml-[260px]"><header className="px-5 py-6 lg:px-10"><AdminBreadcrumb current="ตรวจสอบเอกสาร" /><div className="mt-5"><h1 className="text-2xl font-bold lg:text-[30px]">ตรวจสอบเอกสาร</h1><p className="mt-1 text-[#555]">เอกสารที่ส่งจากผู้ใช้ทุกบทบาทในระบบ</p></div></header><main className="space-y-6 p-5 lg:p-10"><section className="grid gap-4 sm:grid-cols-3">{(["pending", "approved", "needs_edit"] as const).map((key) => <article key={key} className="rounded-xl border border-[#EAEAEA] bg-white p-5 shadow-sm"><p className="text-sm text-gray-500">{labels[key]}</p><p className="mt-2 font-mono text-3xl font-bold">{counts[key]}</p></article>)}</section><section className="grid gap-3 rounded-xl border border-[#EAEAEA] bg-white p-4 shadow-sm md:grid-cols-[1fr_220px_auto]"><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ค้นหาชื่อ รหัส ประเภทเอกสาร หรือสถานประกอบการ" className="rounded-lg border border-[#EAEAEA] px-4 py-2.5 outline-none focus:border-[#7678ED]" /><select value={status} onChange={(event) => setStatus(event.target.value as Status | "all")} className="rounded-lg border border-[#EAEAEA] bg-white px-4 py-2.5"><option value="all">ทุกสถานะ</option>{(Object.keys(labels) as Status[]).map((key) => <option key={key} value={key}>{labels[key]}</option>)}</select><button type="button" onClick={() => void load()} className="rounded-lg border border-[#3D348B] px-4 py-2.5 text-sm font-semibold text-[#3D348B]">รีเฟรช</button></section>{error && <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</p>}<section className="overflow-x-auto rounded-xl border border-[#EAEAEA] bg-white shadow-sm"><table className="w-full min-w-[950px] text-left text-sm"><thead className="bg-[#FAFAFA] text-[#555]"><tr>{["นักศึกษา", "ประเภทเอกสาร", "สถานประกอบการ", "วันที่ส่ง", "สถานะ", "จัดการ"].map((heading) => <th key={heading} className="border-b border-[#EAEAEA] px-4 py-4 text-xs">{heading}</th>)}</tr></thead><tbody>{loading ? <tr><td colSpan={6} className="p-10 text-center text-gray-500">กำลังโหลดเอกสาร…</td></tr> : filtered.map((item) => <tr key={item.id} className="border-b border-gray-100 hover:bg-[#FAFAFF]"><td className="px-4 py-4"><p className="font-semibold">{item.student?.full_name ?? "ไม่พบข้อมูลผู้ส่ง"}</p><p className="mt-1 font-mono text-xs text-gray-500">{item.student?.user_code ?? "-"} · {item.student?.email ?? "-"}</p></td><td className="px-4 py-4"><p>{item.document_type}</p><p className="mt-1 text-xs text-gray-500">{fileName(item.file_path)}</p></td><td className="px-4 py-4">{item.companyName}</td><td className="px-4 py-4">{formatDate(item.submitted_at)}</td><td className="px-4 py-4"><span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${styles[item.status]}`}>{labels[item.status]}</span></td><td className="px-4 py-4"><button type="button" onClick={() => setSelected(item)} className="rounded-lg border border-[#EAEAEA] px-3 py-2 text-xs font-semibold text-[#3D348B]">ตรวจสอบ</button></td></tr>)}{!loading && !filtered.length && <tr><td colSpan={6} className="p-10 text-center text-gray-500">ไม่พบเอกสาร</td></tr>}</tbody></table></section></main></div>{selected && <DocumentDialog document={selected} onClose={() => setSelected(null)} onSaved={() => { setSelected(null); void load(); }} />}</div>;
}

function DocumentDialog({ document, onClose, onSaved }: { document: Document; onClose: () => void; onSaved: () => void }) {
  const [comment, setComment] = useState(document.comment ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const save = async (status: Status) => {
    setSaving(true); setError(null);
    const response = await fetch("/api/admin/documents", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: document.id, status, comment }) });
    const data = await response.json() as { error?: string };
    setSaving(false);
    if (!response.ok) return setError(data.error ?? "ไม่สามารถบันทึกผลการตรวจได้");
    onSaved();
  };
  return <div role="dialog" aria-modal="true" aria-labelledby="document-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><section className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl"><header className="flex items-start justify-between gap-4 bg-[#4B42B5] px-6 py-5 text-white"><div><p className="text-sm text-white/80">{document.student?.full_name ?? "ไม่พบข้อมูลผู้ส่ง"} · {document.student?.user_code ?? "-"}</p><h2 id="document-title" className="mt-2 text-xl font-bold">{document.document_type}</h2><p className="mt-2 text-sm text-white/80">ไฟล์: {fileName(document.file_path)}</p></div><button type="button" onClick={onClose} aria-label="ปิด" className="text-2xl">×</button></header><div className="space-y-5 p-6"><dl className="grid gap-4 text-sm sm:grid-cols-2"><div><dt className="text-gray-500">สถานประกอบการ</dt><dd className="mt-1 font-semibold">{document.companyName}</dd></div><div><dt className="text-gray-500">ส่งเมื่อ</dt><dd className="mt-1 font-semibold">{formatDate(document.submitted_at)}</dd></div></dl><label className="block text-sm font-semibold">หมายเหตุถึงผู้ส่ง<textarea value={comment} onChange={(event) => setComment(event.target.value)} rows={4} className="mt-2 w-full rounded-xl border border-[#EAEAEA] p-3 font-normal outline-none focus:border-[#7678ED]" placeholder="ระบุข้อเสนอแนะหรือเหตุผลการส่งกลับแก้ไข" /></label>{error && <p role="alert" className="text-sm text-red-600">{error}</p>}</div><footer className="flex flex-wrap justify-end gap-3 border-t border-[#EAEAEA] bg-[#FAFAFA] p-5"><button type="button" disabled={saving} onClick={() => void save("needs_edit")} className="rounded-xl bg-[#F18701] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">ส่งกลับแก้ไข</button><button type="button" disabled={saving} onClick={() => void save("approved")} className="rounded-xl bg-[#3D348B] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">อนุมัติเอกสาร</button></footer></section></div>;
}
