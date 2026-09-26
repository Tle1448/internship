"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Student } from "../../data";
import AdvisorShell from "../../components/AdvisorShell";
import Icon from "../../components/Icon";
import StudentHeader from "../../components/StudentHeader";
import { supabase } from "@/lib/supabase";

type ReportStatus = "draft" | "submitted" | "revision_required" | "approved";
type ReportFilter = "all" | ReportStatus;

interface ProgressReport {
  id: string;
  period_id: string;
  work_summary: string;
  assigned_tasks: string;
  skills_learned: string;
  hours_worked: number;
  attachment_paths: string[];
  project_progress: number;
  problems: string;
  next_plan: string;
  status: ReportStatus;
  submitted_at: string | null;
  advisor_feedback: string | null;
  period: {
    title: string;
    sequence_no: number;
    opens_on: string;
    due_on: string;
  } | null;
}

type ProgressReportQueryRow = Omit<ProgressReport, "period"> & {
  progress_periods: ProgressReport["period"] | ProgressReport["period"][];
};

const labels: Record<ReportStatus, string> = {
  draft: "ฉบับร่าง",
  submitted: "รอตรวจ",
  revision_required: "รอนักศึกษาแก้ไข",
  approved: "อนุมัติแล้ว",
};

function displayDate(value: string | null) {
  if (!value) return "ยังไม่ส่ง";
  return new Date(value).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
}

export default function StudentProgress({ student, embedded = false }: { student: Student; embedded?: boolean }) {
  const reportId = useSearchParams().get("report_id");
  const [reports, setReports] = useState<ProgressReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ReportFilter>("all");
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const loadReports = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("progress_reports")
      .select("id, period_id, work_summary, assigned_tasks, skills_learned, hours_worked, attachment_paths, project_progress, problems, next_plan, status, submitted_at, advisor_feedback, progress_periods(title, sequence_no, opens_on, due_on)")
      .eq("record_id", student.recordId)
      .order("submitted_at", { ascending: false });

    if (error) {
      setMessage(`โหลดบันทึกความก้าวหน้าไม่สำเร็จ: ${error.message}`);
      setReports([]);
    } else {
      setReports(((data ?? []) as ProgressReportQueryRow[]).map((row) => ({
        ...row,
        period: Array.isArray(row.progress_periods) ? row.progress_periods[0] ?? null : row.progress_periods ?? null,
      })) as ProgressReport[]);
    }
    setLoading(false);
  }, [student.recordId]);

  useEffect(() => {
    const task = window.setTimeout(() => { void loadReports(); }, 0);
    return () => window.clearTimeout(task);
  }, [loadReports]);

  useEffect(() => {
    if (!reportId || !reports.some((report) => report.id === reportId)) return;
    document.getElementById(`advisor-report-${reportId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [reportId, reports]);

  async function review(report: ProgressReport, status: "approved" | "revision_required") {
    const note = (feedback[report.id] ?? report.advisor_feedback ?? "").trim();
    if (status === "revision_required" && !note) {
      setMessage("กรุณาระบุสิ่งที่ต้องการให้นักศึกษาแก้ไข");
      return;
    }
    setBusyId(report.id);
    setMessage("");
    const { error } = await supabase
      .from("progress_reports")
      .update({ status, advisor_feedback: note || null })
      .eq("id", report.id)
      .eq("record_id", student.recordId);

    if (error) setMessage(`บันทึกผลไม่สำเร็จ: ${error.message}`);
    else {
      setReports((current) => current.map((item) => item.id === report.id ? { ...item, status, advisor_feedback: note || null } : item));
      setMessage(status === "approved" ? "อนุมัติบันทึกความก้าวหน้าแล้ว" : "ส่งกลับให้นักศึกษาแก้ไขแล้ว");
    }
    setBusyId(null);
  }

  async function openAttachment(path: string) {
    const { data, error } = await supabase.storage.from("student-documents").createSignedUrl(path, 60 * 30);
    if (error || !data?.signedUrl) {
      setMessage(error?.message ?? "เปิดไฟล์ประกอบไม่สำเร็จ");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  const visible = useMemo(() => reports.filter((report) => filter === "all" || report.status === filter), [filter, reports]);
  const filters: { key: ReportFilter; label: string }[] = [
    { key: "all", label: "ทั้งหมด" },
    { key: "submitted", label: "รอตรวจ" },
    { key: "revision_required", label: "รอแก้ไข" },
    { key: "approved", label: "อนุมัติแล้ว" },
  ];

  const content = (
    <>
      <StudentHeader student={student} />
      {message && <p className="feedback" role="status">{message}</p>}
      <section className="detail-card placement-card">
        <div className="placement-top"><span className="detail-icon"><Icon name="home" size={24} /></span><div className="placement-heading"><h3>{student.company}</h3><h2>{student.role}</h2><p>โปรเจกต์หลัก: {student.project || "ยังไม่ระบุ"}</p></div></div>
      </section>

      <section className="weekly-section" aria-labelledby="progress-title">
        <div className="weekly-heading"><div><h2 id="progress-title">บันทึกความก้าวหน้า</h2><p>ตรวจรายงานตามรอบที่ผู้ประสานงานกำหนดและส่งความคิดเห็นกลับนักศึกษา</p></div><div className="detail-tabs" aria-label="กรองสถานะรายงาน">{filters.map((item) => <button key={item.key} type="button" className={filter === item.key ? "active" : ""} onClick={() => setFilter(item.key)}>{item.label} <span>{item.key === "all" ? reports.length : reports.filter((report) => report.status === item.key).length}</span></button>)}</div></div>

        {loading ? <div className="detail-card empty-state">กำลังโหลดบันทึกความก้าวหน้า...</div> : visible.length === 0 ? <div className="detail-card empty-state">ยังไม่มีบันทึกความก้าวหน้าในสถานะนี้</div> : <div className="weekly-list">{visible.map((report) => (
          <article id={`advisor-report-${report.id}`} className="detail-card weekly-card is-open" key={report.id}>
            <div className="weekly-toggle"><span className="week-number">{report.period?.sequence_no ?? "-"}</span><span className="weekly-summary"><strong>{report.period?.title ?? "รอบรายงาน"}</strong><small>ส่งเมื่อ {displayDate(report.submitted_at)}</small></span><span className={`badge ${report.status === "revision_required" ? "revision" : report.status === "submitted" ? "pending" : report.status}`}>{labels[report.status]}</span></div>
            <div className="weekly-details">
              <div className="student-overview-grid"><div className="log-summary"><strong>งานที่ได้รับมอบหมาย</strong><p>{report.assigned_tasks || "-"}</p></div><div className="log-summary"><strong>สิ่งที่ดำเนินการ</strong><p>{report.work_summary || "-"}</p></div></div>
              <div className="student-overview-grid"><div className="log-summary"><strong>ทักษะที่ได้เรียนรู้</strong><p>{report.skills_learned || "-"}</p></div><div className="log-summary"><strong>ชั่วโมงฝึกงาน</strong><p>{report.hours_worked} ชั่วโมง</p></div></div>
              {report.attachment_paths.length > 0 && <div className="log-summary"><strong>ไฟล์ประกอบ</strong><div className="review-actions">{report.attachment_paths.map((path, index) => <button key={path} type="button" className="button" onClick={() => void openAttachment(path)}>เปิดไฟล์ {index + 1}</button>)}</div></div>}
              <div className="progress-snapshot"><div className="snapshot-stats"><span>ความคืบหน้าโปรเจกต์</span><strong>{report.project_progress}%</strong></div><progress value={report.project_progress} max={100} /></div>
              <div className="student-overview-grid"><div className="log-summary"><strong>ปัญหา/สิ่งที่ต้องการความช่วยเหลือ</strong><p>{report.problems || "ไม่มี"}</p></div><div className="log-summary"><strong>แผนงานช่วงถัดไป</strong><p>{report.next_plan || "-"}</p></div></div>
              {report.advisor_feedback && <div className="weekly-comment"><Icon name="file" size={18} /><div><strong>ความเห็นล่าสุด</strong><p>{report.advisor_feedback}</p></div></div>}
              {report.status === "submitted" && <div className="weekly-review"><label>ความคิดเห็นถึงนักศึกษา<textarea rows={3} value={feedback[report.id] ?? report.advisor_feedback ?? ""} onChange={(event) => setFeedback((current) => ({ ...current, [report.id]: event.target.value }))} placeholder="ระบุข้อเสนอแนะ หรือสิ่งที่ต้องแก้ไข" /></label><div className="review-actions"><button type="button" className="button revision" disabled={busyId === report.id} onClick={() => void review(report, "revision_required")}>ขอแก้ไข</button><button type="button" className="button primary" disabled={busyId === report.id} onClick={() => void review(report, "approved")}>อนุมัติ</button></div></div>}
            </div>
          </article>
        ))}</div>}
      </section>
    </>
  );

  return embedded ? content : <AdvisorShell student={student} active="students" studentSection="progress">{content}</AdvisorShell>;
}
