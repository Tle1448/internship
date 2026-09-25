"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { CalendarRange, CheckCircle2, Clock3, FilePenLine, Loader2, Plus, X } from "lucide-react";
import ConditerSidebar from "@/components/ConditerSidebar";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";

type PeriodStatus = "draft" | "open" | "closed";
type ReportStatus = "draft" | "submitted" | "revision_required" | "approved";

interface ProgressPeriod {
  id: string;
  title: string;
  sequence_no: number;
  academic_term: string;
  opens_on: string;
  due_on: string;
  status: PeriodStatus;
  progress_reports: { status: ReportStatus }[];
}

const statusCopy: Record<PeriodStatus, { label: string; className: string }> = {
  draft: { label: "ฉบับร่าง", className: "bg-slate-100 text-slate-600" },
  open: { label: "เปิดรับรายงาน", className: "bg-emerald-100 text-emerald-700" },
  closed: { label: "ปิดรอบแล้ว", className: "bg-indigo-100 text-indigo-700" },
};

const emptyForm = {
  title: "",
  sequence_no: 1,
  academic_term: "",
  opens_on: "",
  due_on: "",
  status: "draft" as PeriodStatus,
};

export default function ProgressPeriodsPage() {
  const { user } = useAuth();
  const [periods, setPeriods] = useState<ProgressPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState("");

  const loadPeriods = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("progress_periods")
      .select("id, title, sequence_no, academic_term, opens_on, due_on, status, progress_reports(status)")
      .order("sequence_no", { ascending: true });
    if (error) setMessage(error.message);
    else setPeriods((data ?? []) as ProgressPeriod[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    const task = window.setTimeout(() => { void loadPeriods(); }, 0);
    return () => window.clearTimeout(task);
  }, [loadPeriods]);

  const totals = useMemo(() => ({
    open: periods.filter((period) => period.status === "open").length,
    submitted: periods.flatMap((period) => period.progress_reports).filter((report) => report.status === "submitted").length,
    approved: periods.flatMap((period) => period.progress_reports).filter((report) => report.status === "approved").length,
  }), [periods]);

  function startCreate() {
    setEditingId(null);
    setForm({ ...emptyForm, sequence_no: periods.length + 1 });
    setFormOpen(true);
    setMessage("");
  }

  function startEdit(period: ProgressPeriod) {
    setEditingId(period.id);
    setForm({ title: period.title, sequence_no: period.sequence_no, academic_term: period.academic_term, opens_on: period.opens_on, due_on: period.due_on, status: period.status });
    setFormOpen(true);
    setMessage("");
  }

  async function savePeriod(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    if (form.due_on < form.opens_on) {
      setMessage("วันครบกำหนดต้องไม่อยู่ก่อนวันเปิดรอบ");
      return;
    }
    setSaving(true);
    const result = editingId
      ? await supabase.from("progress_periods").update(form).eq("id", editingId)
      : await supabase.from("progress_periods").insert({ ...form, created_by: user.id });
    if (result.error) setMessage(result.error.message);
    else {
      setFormOpen(false);
      setMessage(editingId ? "บันทึกการแก้ไขรอบแล้ว" : "สร้างรอบรายงานแล้ว");
      await loadPeriods();
    }
    setSaving(false);
  }

  return (
    <div className="min-h-screen bg-[#FAFAFC]">
      <ConditerSidebar />
      <main className="lg:pl-[235px]">
        <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 md:px-8">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="text-2xl font-bold text-[#2E2A4A]">รอบติดตามความก้าวหน้า</h1><p className="mt-1 text-sm text-[#8A879A]">กำหนดรอบเปิดรับรายงานระหว่างการฝึกงาน โดยไม่ผูกกับจำนวนสัปดาห์ตายตัว</p></div><button type="button" onClick={startCreate} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#3D348B] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#302873]"><Plus size={17} />สร้างรอบรายงาน</button></header>

          {message && <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-800" role="status">{message}</div>}

          <section className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-[#E8E6F0] bg-white p-5"><div className="flex items-center justify-between"><div><p className="text-xs text-[#9995A9]">รอบที่เปิดอยู่</p><p className="mt-2 text-3xl font-bold text-[#2E2A4A]">{totals.open}</p></div><CalendarRange className="text-[#3D348B]" /></div></div>
            <div className="rounded-lg border border-[#E8E6F0] bg-white p-5"><div className="flex items-center justify-between"><div><p className="text-xs text-[#9995A9]">รายงานรอตรวจ</p><p className="mt-2 text-3xl font-bold text-[#2E2A4A]">{totals.submitted}</p></div><Clock3 className="text-amber-600" /></div></div>
            <div className="rounded-lg border border-[#E8E6F0] bg-white p-5"><div className="flex items-center justify-between"><div><p className="text-xs text-[#9995A9]">รายงานอนุมัติแล้ว</p><p className="mt-2 text-3xl font-bold text-[#2E2A4A]">{totals.approved}</p></div><CheckCircle2 className="text-emerald-600" /></div></div>
          </section>

          <section className="overflow-hidden rounded-lg border border-[#E8E6F0] bg-white">
            {loading ? <div className="flex justify-center py-16 text-[#8A879A]"><Loader2 className="mr-2 animate-spin" />กำลังโหลด...</div> : periods.length === 0 ? <div className="py-16 text-center"><CalendarRange className="mx-auto text-[#C8C5D1]" size={34} /><p className="mt-3 text-sm text-[#8A879A]">ยังไม่มีรอบติดตามความก้าวหน้า</p></div> : <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b border-[#E8E6F0] bg-[#FAFAFC] text-xs text-[#8A879A]"><tr><th className="px-5 py-3">ลำดับ / รอบ</th><th className="px-5 py-3">ช่วงเวลาส่ง</th><th className="px-5 py-3">ภาคการศึกษา</th><th className="px-5 py-3">รายงาน</th><th className="px-5 py-3">สถานะ</th><th className="px-5 py-3 text-right">จัดการ</th></tr></thead><tbody>{periods.map((period) => {
              const submitted = period.progress_reports.filter((report) => report.status === "submitted").length;
              const approved = period.progress_reports.filter((report) => report.status === "approved").length;
              return <tr key={period.id} className="border-b border-[#F0EEF4] last:border-b-0"><td className="px-5 py-4"><p className="font-semibold text-[#2E2A4A]">{period.sequence_no}. {period.title}</p></td><td className="px-5 py-4 text-[#68657A]">{new Date(`${period.opens_on}T00:00:00`).toLocaleDateString("th-TH")} - {new Date(`${period.due_on}T00:00:00`).toLocaleDateString("th-TH")}</td><td className="px-5 py-4 text-[#68657A]">{period.academic_term || "-"}</td><td className="px-5 py-4 text-[#68657A]">รอตรวจ {submitted} · อนุมัติ {approved}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusCopy[period.status].className}`}>{statusCopy[period.status].label}</span></td><td className="px-5 py-4 text-right"><button type="button" onClick={() => startEdit(period)} className="inline-flex items-center gap-1.5 rounded-md border border-[#D8D5E2] px-3 py-2 text-xs font-semibold text-[#3D348B] hover:bg-[#F2F1FC]"><FilePenLine size={14} />แก้ไข</button></td></tr>;
            })}</tbody></table></div>}
          </section>
        </div>
      </main>

      {formOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4"><form onSubmit={savePeriod} className="w-full max-w-lg rounded-lg bg-white shadow-xl"><div className="flex items-center justify-between border-b border-slate-200 p-5"><h2 className="font-bold text-slate-900">{editingId ? "แก้ไขรอบรายงาน" : "สร้างรอบรายงาน"}</h2><button type="button" onClick={() => setFormOpen(false)} className="rounded-md p-2 text-slate-500 hover:bg-slate-100" aria-label="ปิด"><X size={18} /></button></div><div className="grid gap-4 p-5 sm:grid-cols-2">
        <label className="sm:col-span-2 text-sm font-semibold text-slate-700">ชื่อรอบ<input required value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="เช่น ความก้าวหน้าเดือนที่ 1" className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal" /></label>
        <label className="text-sm font-semibold text-slate-700">ลำดับ<input required min="1" type="number" value={form.sequence_no} onChange={(event) => setForm((current) => ({ ...current, sequence_no: Number(event.target.value) }))} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal" /></label>
        <label className="text-sm font-semibold text-slate-700">ภาคการศึกษา<input value={form.academic_term} onChange={(event) => setForm((current) => ({ ...current, academic_term: event.target.value }))} placeholder="เช่น 1/2569" className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal" /></label>
        <label className="text-sm font-semibold text-slate-700">วันเปิดรอบ<input required type="date" value={form.opens_on} onChange={(event) => setForm((current) => ({ ...current, opens_on: event.target.value }))} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal" /></label>
        <label className="text-sm font-semibold text-slate-700">วันครบกำหนด<input required type="date" value={form.due_on} onChange={(event) => setForm((current) => ({ ...current, due_on: event.target.value }))} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal" /></label>
        <label className="sm:col-span-2 text-sm font-semibold text-slate-700">สถานะ<select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as PeriodStatus }))} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal"><option value="draft">ฉบับร่าง</option><option value="open">เปิดรับรายงาน</option><option value="closed">ปิดรอบ</option></select></label>
      </div><div className="flex justify-end gap-3 border-t border-slate-200 p-5"><button type="button" onClick={() => setFormOpen(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">ยกเลิก</button><button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-[#3D348B] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving && <Loader2 className="animate-spin" size={16} />}บันทึก</button></div></form></div>}
    </div>
  );
}
