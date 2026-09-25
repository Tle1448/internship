"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { AlertCircle, Building2, CalendarDays, CheckCircle2, FileText, Loader2, Plus, RotateCcw, X } from "lucide-react";
import InternshipTabs from "@/components/InternshipTabs";
import StudentSidebar from "@/components/StudentSidebar";
import { getCurrentStudentId } from "@/lib/currentUser";
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
}

interface ProgressReport {
  id: string;
  period_id: string;
  work_summary: string;
  project_progress: number;
  problems: string;
  next_plan: string;
  status: ReportStatus;
  submitted_at: string | null;
  advisor_feedback: string | null;
}

interface InternshipInfo {
  id: string;
  companyName: string;
  position: string;
  project: string;
}

const statusCopy: Record<ReportStatus, { label: string; className: string }> = {
  draft: { label: "ฉบับร่าง", className: "bg-slate-100 text-slate-600" },
  submitted: { label: "รออาจารย์ตรวจ", className: "bg-amber-100 text-amber-700" },
  revision_required: { label: "ต้องแก้ไข", className: "bg-rose-100 text-rose-700" },
  approved: { label: "อนุมัติแล้ว", className: "bg-emerald-100 text-emerald-700" },
};

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function ProgressReportsPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [studentName, setStudentName] = useState("");
  const [internship, setInternship] = useState<InternshipInfo | null>(null);
  const [periods, setPeriods] = useState<ProgressPeriod[]>([]);
  const [reports, setReports] = useState<ProgressReport[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<ProgressPeriod | null>(null);
  const [workSummary, setWorkSummary] = useState("");
  const [projectProgress, setProjectProgress] = useState(0);
  const [problems, setProblems] = useState("");
  const [nextPlan, setNextPlan] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    const currentStudentId = await getCurrentStudentId();
    if (!currentStudentId) {
      setMessage({ type: "error", text: "ไม่พบข้อมูลผู้ใช้นักศึกษา" });
      setLoading(false);
      return;
    }
    setStudentId(currentStudentId);

    const [profileResult, recordResult, periodsResult] = await Promise.all([
      supabase.from("profiles").select("full_name").eq("id", currentStudentId).maybeSingle(),
      supabase.from("internship_records").select("id, company_name, position, project").eq("student_id", currentStudentId).eq("placement_status", "approved").eq("status", "in_progress").order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("progress_periods").select("id, title, sequence_no, academic_term, opens_on, due_on, status").order("sequence_no", { ascending: true }),
    ]);

    if (recordResult.error || periodsResult.error) {
      setMessage({ type: "error", text: recordResult.error?.message || periodsResult.error?.message || "โหลดข้อมูลไม่สำเร็จ" });
      setLoading(false);
      return;
    }

    setStudentName(profileResult.data?.full_name ?? "นักศึกษา");
    const record = recordResult.data;
    setInternship(record ? {
      id: record.id,
      companyName: record.company_name ?? "ยังไม่ระบุบริษัท",
      position: record.position ?? "ยังไม่ระบุตำแหน่ง",
      project: record.project ?? "ยังไม่ระบุหัวข้อโปรเจกต์",
    } : null);
    setPeriods((periodsResult.data ?? []) as ProgressPeriod[]);

    if (record) {
      const { data, error } = await supabase.from("progress_reports").select("id, period_id, work_summary, project_progress, problems, next_plan, status, submitted_at, advisor_feedback").eq("record_id", record.id);
      if (error) setMessage({ type: "error", text: error.message });
      else setReports((data ?? []) as ProgressReport[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const task = window.setTimeout(() => { void loadData(); }, 0);
    return () => window.clearTimeout(task);
  }, [loadData]);

  const reportByPeriod = useMemo(() => new Map(reports.map((report) => [report.period_id, report])), [reports]);

  function openForm(period: ProgressPeriod) {
    const report = reportByPeriod.get(period.id);
    setSelectedPeriod(period);
    setWorkSummary(report?.work_summary ?? "");
    setProjectProgress(report?.project_progress ?? 0);
    setProblems(report?.problems ?? "");
    setNextPlan(report?.next_plan ?? "");
    setMessage(null);
  }

  async function submitReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedPeriod || !internship || !studentId) return;
    if (!workSummary.trim() || !nextPlan.trim()) {
      setMessage({ type: "error", text: "กรุณากรอกงานที่ทำและแผนงานช่วงถัดไป" });
      return;
    }

    setSubmitting(true);
    const existing = reportByPeriod.get(selectedPeriod.id);
    const values = {
      period_id: selectedPeriod.id,
      record_id: internship.id,
      student_id: studentId,
      work_summary: workSummary.trim(),
      project_progress: projectProgress,
      problems: problems.trim(),
      next_plan: nextPlan.trim(),
      status: "submitted" as const,
      submitted_at: new Date().toISOString(),
    };
    const result = existing
      ? await supabase.from("progress_reports").update(values).eq("id", existing.id).select().single()
      : await supabase.from("progress_reports").insert(values).select().single();

    if (result.error) setMessage({ type: "error", text: result.error.message });
    else {
      setReports((current) => [...current.filter((item) => item.period_id !== selectedPeriod.id), result.data as ProgressReport]);
      setSelectedPeriod(null);
      setWorkSummary("");
      setProjectProgress(0);
      setProblems("");
      setNextPlan("");
      setMessage({ type: "success", text: "ส่งบันทึกความก้าวหน้าให้อาจารย์เรียบร้อยแล้ว" });
    }
    setSubmitting(false);
  }

  if (loading) return <div className="flex min-h-[calc(100vh-61px)] items-center justify-center bg-slate-100 text-sm text-slate-500"><Loader2 className="mr-2 animate-spin" size={20} />กำลังโหลดข้อมูล...</div>;

  return (
    <div className="flex min-h-[calc(100vh-61px)] bg-slate-100 text-slate-800">
      <StudentSidebar />
      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <InternshipTabs />
          <header><h1 className="text-2xl font-bold text-slate-900">บันทึกความก้าวหน้า</h1><p className="mt-1 text-sm text-slate-500">ส่งรายงานตามรอบที่ผู้ประสานงานกำหนดและติดตามผลตรวจจากอาจารย์</p></header>

          {message && <div className={`flex items-center gap-2 rounded-lg border p-4 text-sm ${message.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-700"}`} role="status">{message.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}{message.text}</div>}

          {internship ? (
            <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 md:grid-cols-3">
              <div><p className="text-xs text-slate-400">นักศึกษา</p><p className="mt-1 font-semibold text-slate-900">{studentName}</p></div>
              <div><p className="text-xs text-slate-400">สถานที่ฝึกงาน</p><p className="mt-1 flex items-center gap-2 font-semibold text-slate-900"><Building2 size={16} />{internship.companyName}</p><p className="text-xs text-slate-500">{internship.position}</p></div>
              <div><p className="text-xs text-slate-400">โปรเจกต์หลัก</p><p className="mt-1 font-semibold text-slate-900">{internship.project}</p></div>
            </section>
          ) : <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">เริ่มส่งบันทึกได้หลังจากสถานที่ฝึกงานได้รับการยืนยันแล้ว</div>}

          <section className="space-y-3">
            <div className="flex items-center justify-between"><h2 className="text-base font-bold text-slate-900">รอบรายงานทั้งหมด</h2><span className="text-xs text-slate-500">{periods.length} รอบ</span></div>
            {periods.length === 0 ? (
              <div className="rounded-lg border border-slate-200 bg-white px-6 py-14 text-center"><CalendarDays className="mx-auto text-slate-300" size={34} /><p className="mt-3 text-sm font-medium text-slate-600">ยังไม่มีรอบบันทึกความก้าวหน้า</p><p className="mt-1 text-xs text-slate-400">รอผู้ประสานงานกำหนดรอบและวันส่ง</p></div>
            ) : periods.map((period) => {
              const report = reportByPeriod.get(period.id);
              const isOverdue = !report && period.status !== "draft" && new Date(`${period.due_on}T23:59:59`) < new Date();
              const canEdit = Boolean(internship) && period.status === "open" && (!report || report.status === "draft" || report.status === "revision_required");
              return (
                <article key={period.id} className="rounded-lg border border-slate-200 bg-white p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex min-w-0 gap-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 font-bold text-indigo-800">{period.sequence_no}</span><div>
                      <div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-slate-900">{period.title}</h3>{report ? <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusCopy[report.status].className}`}>{statusCopy[report.status].label}</span> : isOverdue ? <span className="rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-semibold text-red-700">เกินกำหนด</span> : <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">ยังไม่ส่ง</span>}</div>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500"><CalendarDays size={14} />เปิด {formatDate(period.opens_on)} · ส่งภายใน {formatDate(period.due_on)}</p>
                      {report && <p className="mt-3 text-sm text-slate-600">{report.work_summary}</p>}
                      {report?.advisor_feedback && <div className="mt-3 rounded-lg bg-indigo-50 p-3 text-sm text-indigo-900"><strong>ความเห็นอาจารย์:</strong> {report.advisor_feedback}</div>}
                    </div></div>
                    <button type="button" disabled={!canEdit} onClick={() => openForm(period)} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-indigo-800 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500">{report?.status === "revision_required" ? <RotateCcw size={16} /> : <Plus size={16} />}{report?.status === "revision_required" ? "แก้ไขและส่งใหม่" : report ? "กำลังรอตรวจ" : "เขียนรายงาน"}</button>
                  </div>
                  {report && <div className="mt-4 flex items-center gap-3 border-t border-slate-100 pt-4"><span className="text-xs text-slate-500">ความคืบหน้าโปรเจกต์</span><div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-indigo-700" style={{ width: `${report.project_progress}%` }} /></div><strong className="text-xs text-indigo-800">{report.project_progress}%</strong></div>}
                </article>
              );
            })}
          </section>
        </div>
      </main>

      {selectedPeriod && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4"><form onSubmit={submitReport} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-slate-200 p-5"><div><h2 className="font-bold text-slate-900">{selectedPeriod.title}</h2><p className="mt-1 text-xs text-slate-500">กำหนดส่ง {formatDate(selectedPeriod.due_on)}</p></div><button type="button" onClick={() => setSelectedPeriod(null)} className="rounded-md p-2 text-slate-500 hover:bg-slate-100" aria-label="ปิด"><X size={18} /></button></div>
        <div className="space-y-5 p-5">
          <label className="block text-sm font-semibold text-slate-700">งานที่ทำในช่วงนี้<textarea required rows={4} value={workSummary} onChange={(event) => setWorkSummary(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 p-3 font-normal outline-none focus:border-indigo-600" /></label>
          <label className="block text-sm font-semibold text-slate-700">ความคืบหน้าโปรเจกต์: {projectProgress}%<input type="range" min="0" max="100" step="5" value={projectProgress} onChange={(event) => setProjectProgress(Number(event.target.value))} className="mt-3 w-full accent-indigo-700" /></label>
          <label className="block text-sm font-semibold text-slate-700">ปัญหาหรือสิ่งที่ต้องการความช่วยเหลือ<textarea rows={3} value={problems} onChange={(event) => setProblems(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 p-3 font-normal outline-none focus:border-indigo-600" /></label>
          <label className="block text-sm font-semibold text-slate-700">แผนงานช่วงถัดไป<textarea required rows={3} value={nextPlan} onChange={(event) => setNextPlan(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 p-3 font-normal outline-none focus:border-indigo-600" /></label>
        </div>
        <div className="flex justify-end gap-3 border-t border-slate-200 p-5"><button type="button" onClick={() => setSelectedPeriod(null)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">ยกเลิก</button><button type="submit" disabled={submitting} className="inline-flex items-center gap-2 rounded-lg bg-indigo-800 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">{submitting ? <Loader2 className="animate-spin" size={16} /> : <FileText size={16} />}ส่งให้อาจารย์ตรวจ</button></div>
      </form></div>}
    </div>
  );
}
