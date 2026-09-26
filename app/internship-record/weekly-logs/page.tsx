"use client";

// ===== Import ส่วนต่าง ๆ ที่ต้องใช้ในหน้านี้ =====
import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { useSearchParams } from "next/navigation"; // ใช้อ่าน query string จาก URL เช่น ?report_id=xxx
import { AlertCircle, Building2, CalendarDays, CheckCircle2, Eye, FileText, FileUp, Loader2, Plus, RotateCcw, X } from "lucide-react"; // ไอคอนต่าง ๆ
import InternshipTabs from "@/components/InternshipTabs"; // แถบแท็บของหน้าฝึกงาน
import StudentSidebar from "@/components/StudentSidebar"; // เมนูด้านข้างของนักศึกษา
import { getCurrentStudentId } from "@/lib/currentUser"; // ฟังก์ชันดึง id ของนักศึกษาที่ล็อกอินอยู่
import { supabase } from "@/lib/supabase"; // client เอาไว้เรียก database/storage ของ Supabase

// ===== กำหนด type ของสถานะรอบรายงาน และสถานะรายงาน =====
type PeriodStatus = "draft" | "open" | "closed"; // สถานะของ "รอบ" การส่งรายงาน (ร่าง/เปิดให้ส่ง/ปิดแล้ว)
type ReportStatus = "draft" | "submitted" | "revision_required" | "approved"; // สถานะของรายงานที่นักศึกษาส่ง

// ===== โครงสร้างข้อมูลของ "รอบ" บันทึกความก้าวหน้า (กำหนดโดยผู้ประสานงาน) =====
interface ProgressPeriod {
  id: string;
  title: string;
  sequence_no: number; // ลำดับของรอบ เช่น รอบที่ 1, 2, 3
  academic_term: string; // ภาคการศึกษา
  opens_on: string; // วันที่เริ่มเปิดให้ส่ง
  due_on: string; // วันครบกำหนดส่ง
  status: PeriodStatus;
}

// ===== โครงสร้างข้อมูลของ "รายงานความก้าวหน้า" ที่นักศึกษาส่งในแต่ละรอบ =====
interface ProgressReport {
  id: string;
  period_id: string; // อ้างอิงว่าเป็นรายงานของรอบไหน
  work_summary: string; // สรุปสิ่งที่ดำเนินการ
  assigned_tasks: string; // งานที่ได้รับมอบหมาย
  skills_learned: string; // ทักษะที่ได้เรียนรู้
  hours_worked: number; // จำนวนชั่วโมงที่ฝึกงานในรอบนี้
  attachment_paths: string[]; // path ของไฟล์ประกอบที่แนบมา (เก็บใน storage)
  project_progress: number; // % ความคืบหน้าของโปรเจกต์ (0-100)
  problems: string; // ปัญหา/สิ่งที่ต้องการความช่วยเหลือ
  next_plan: string; // แผนงานช่วงถัดไป
  status: ReportStatus;
  submitted_at: string | null; // เวลาที่ส่งล่าสุด
  advisor_feedback: string | null; // ความเห็นจากอาจารย์ที่ปรึกษา
}

// ===== ข้อมูลการฝึกงานแบบย่อ ที่ใช้แสดงบนหัวหน้า =====
interface InternshipInfo {
  id: string;
  companyName: string;
  position: string;
  project: string;
}

// ===== ข้อความและสีของแต่ละสถานะรายงาน (ใช้ map จาก status -> label/สี) =====
const statusCopy: Record<ReportStatus, { label: string; className: string }> = {
  draft: { label: "ฉบับร่าง", className: "bg-slate-100 text-slate-600" },
  submitted: { label: "รออาจารย์ตรวจ", className: "bg-amber-100 text-amber-700" },
  revision_required: { label: "ต้องแก้ไข", className: "bg-rose-100 text-rose-700" },
  approved: { label: "อนุมัติแล้ว", className: "bg-emerald-100 text-emerald-700" },
};

// แปลง string วันที่ (YYYY-MM-DD) ให้เป็นรูปแบบวันที่แบบไทย เช่น "1 ม.ค. 2569"
function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function ProgressReportsPage() {
  // อ่านค่า report_id จาก query string ของ URL (ใช้เลื่อนหน้าจอไปยังรายงานนั้นโดยอัตโนมัติ)
  const reportId = useSearchParams().get("report_id");

  // ===== State ต่าง ๆ ของหน้านี้ =====
  const [loading, setLoading] = useState(true); // สถานะกำลังโหลดข้อมูลหน้าแรก
  const [submitting, setSubmitting] = useState(false); // สถานะกำลังส่งรายงาน (submit ฟอร์ม)
  const [studentId, setStudentId] = useState<string | null>(null); // id ของนักศึกษาที่ล็อกอินอยู่
  const [studentName, setStudentName] = useState(""); // ชื่อนักศึกษา (โชว์บนหัวข้อมูล)
  const [internship, setInternship] = useState<InternshipInfo | null>(null); // ข้อมูลการฝึกงานปัจจุบัน (ถ้ามี)
  const [periods, setPeriods] = useState<ProgressPeriod[]>([]); // รายการรอบบันทึกความก้าวหน้าทั้งหมด
  const [reports, setReports] = useState<ProgressReport[]>([]); // รายงานที่นักศึกษาเคยส่งไปแล้ว (ของทุกรอบ)
  const [selectedPeriod, setSelectedPeriod] = useState<ProgressPeriod | null>(null); // รอบที่กำลังเปิดฟอร์มเขียน/แก้รายงานอยู่ (ถ้า null = ไม่มี modal เปิดอยู่)

  // ===== State ของฟอร์มกรอกรายงาน (ใช้ตอนเปิด modal) =====
  const [workSummary, setWorkSummary] = useState("");
  const [assignedTasks, setAssignedTasks] = useState("");
  const [skillsLearned, setSkillsLearned] = useState("");
  const [hoursWorked, setHoursWorked] = useState(0);
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]); // ไฟล์แนบที่เลือกใหม่ (ยังไม่ได้อัปโหลด)
  const [projectProgress, setProjectProgress] = useState(0);
  const [problems, setProblems] = useState("");
  const [nextPlan, setNextPlan] = useState("");

  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null); // ข้อความแจ้งเตือนบนหน้า

  // ===== ฟังก์ชันโหลดข้อมูลทั้งหมดที่หน้านี้ต้องใช้ =====
  const loadData = useCallback(async () => {
    setLoading(true);
    setMessage(null);

    // 1) หา id ของนักศึกษาที่ล็อกอินอยู่ก่อน ถ้าไม่พบให้หยุดทำงาน
    const currentStudentId = await getCurrentStudentId();
    if (!currentStudentId) {
      setMessage({ type: "error", text: "ไม่พบข้อมูลผู้ใช้นักศึกษา" });
      setLoading(false);
      return;
    }
    setStudentId(currentStudentId);

    // 2) ยิง query พร้อมกันทั้ง 3 อย่าง (ใช้ Promise.all เพื่อความเร็ว ไม่ต้องรอทีละอัน):
    //    - profile (ชื่อนักศึกษา)
    //    - internship_records (การฝึกงานที่กำลังดำเนินอยู่ และได้รับอนุมัติสถานที่แล้ว)
    //    - progress_periods (รอบบันทึกความก้าวหน้าทั้งหมด เรียงตามลำดับ)
    const [profileResult, recordResult, periodsResult] = await Promise.all([
      supabase.from("profiles").select("full_name").eq("id", currentStudentId).maybeSingle(),
      supabase.from("internship_records").select("id, company_name, position, project").eq("student_id", currentStudentId).eq("placement_status", "approved").eq("status", "in_progress").order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("progress_periods").select("id, title, sequence_no, academic_term, opens_on, due_on, status").order("sequence_no", { ascending: true }),
    ]);

    // ถ้า query การฝึกงาน หรือ รอบรายงาน มี error ให้แสดงข้อความผิดพลาดแล้วหยุด
    if (recordResult.error || periodsResult.error) {
      setMessage({ type: "error", text: recordResult.error?.message || periodsResult.error?.message || "โหลดข้อมูลไม่สำเร็จ" });
      setLoading(false);
      return;
    }

    // ตั้งชื่อนักศึกษา (ถ้าไม่มีชื่อใน profile ใช้คำว่า "นักศึกษา" แทน)
    setStudentName(profileResult.data?.full_name ?? "นักศึกษา");

    const record = recordResult.data;
    // แปลงข้อมูลการฝึกงานให้อยู่ในรูปแบบที่ใช้แสดงผล (ใส่ค่า default ถ้าฟิลด์ไหนยังไม่ระบุ)
    setInternship(record ? {
      id: record.id,
      companyName: record.company_name ?? "ยังไม่ระบุบริษัท",
      position: record.position ?? "ยังไม่ระบุตำแหน่ง",
      project: record.project ?? "ยังไม่ระบุหัวข้อโปรเจกต์",
    } : null);

    setPeriods((periodsResult.data ?? []) as ProgressPeriod[]);

    // 3) ถ้ามีการฝึกงานอยู่ ให้ดึงรายงานความก้าวหน้าทั้งหมดที่เคยส่งไปแล้วของการฝึกงานนี้ (ทุกรอบ)
    if (record) {
      const { data, error } = await supabase.from("progress_reports").select("id, period_id, work_summary, assigned_tasks, skills_learned, hours_worked, attachment_paths, project_progress, problems, next_plan, status, submitted_at, advisor_feedback").eq("record_id", record.id);
      if (error) setMessage({ type: "error", text: error.message });
      else setReports((data ?? []) as ProgressReport[]);
    }
    setLoading(false);
  }, []);

  // เรียก loadData ตอน component mount (ใช้ setTimeout(...,0) เพื่อดันการเรียกออกไปนอก render cycle แรก)
  useEffect(() => {
    const task = window.setTimeout(() => { void loadData(); }, 0);
    return () => window.clearTimeout(task); // เคลียร์ timeout ถ้า component ถูก unmount ก่อนครบเวลา
  }, [loadData]);

  // ถ้า URL มี ?report_id=... และรายงานนั้นมีอยู่จริงในรายการที่โหลดมา ให้เลื่อนหน้าจอไปยังการ์ดของรายงานนั้นโดยอัตโนมัติ
  useEffect(() => {
    if (!reportId || !reports.some((report) => report.id === reportId)) return;
    document.getElementById(`progress-report-${reportId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [reportId, reports]);

  // สร้าง Map เพื่อค้นหารายงานจาก period_id ได้เร็ว ๆ (key = period_id, value = รายงานของรอบนั้น)
  // หมายเหตุ: แต่ละรอบมีรายงานได้แค่ 1 ฉบับ (ไม่เหมือนไฟล์ก่อนหน้าที่มีหลายเวอร์ชัน)
  const reportByPeriod = useMemo(() => new Map(reports.map((report) => [report.period_id, report])), [reports]);

  // ===== เปิดฟอร์ม (modal) สำหรับเขียน/แก้ไขรายงานของรอบที่เลือก =====
  function openForm(period: ProgressPeriod) {
    const report = reportByPeriod.get(period.id); // ถ้ามีรายงานเดิมอยู่แล้ว (เช่นเคยบันทึกร่างไว้ หรือถูกขอให้แก้ไข) ให้เอาข้อมูลเดิมมาเติมในฟอร์ม
    setSelectedPeriod(period); // เปิด modal โดยตั้งค่ารอบที่เลือก
    setWorkSummary(report?.work_summary ?? "");
    setAssignedTasks(report?.assigned_tasks ?? "");
    setSkillsLearned(report?.skills_learned ?? "");
    setHoursWorked(report?.hours_worked ?? 0);
    setAttachmentFiles([]); // ไฟล์แนบใหม่เริ่มต้นว่างเสมอ (ไฟล์เก่ายังอยู่ใน attachment_paths ของ record เดิม)
    setProjectProgress(report?.project_progress ?? 0);
    setProblems(report?.problems ?? "");
    setNextPlan(report?.next_plan ?? "");
    setMessage(null);
  }

  // ===== ส่งรายงาน (ทั้งกรณีสร้างใหม่ครั้งแรก และกรณีแก้ไขรายงานเดิม) =====
  async function submitReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); // กันไม่ให้ฟอร์ม submit แบบปกติ (reload หน้า)
    if (!selectedPeriod || !internship || !studentId) return; // ต้องมีครบทั้งรอบที่เลือก/ข้อมูลฝึกงาน/id นักศึกษา ถึงจะส่งได้

    // ตรวจสอบฟิลด์บังคับกรอกก่อนส่ง (ฝั่ง client) ถ้าไม่ครบให้แจ้งเตือนแล้วหยุด
    if (!assignedTasks.trim() || !workSummary.trim() || !skillsLearned.trim() || !nextPlan.trim() || hoursWorked <= 0) {
      setMessage({ type: "error", text: "กรุณากรอกงานที่ได้รับมอบหมาย สิ่งที่ดำเนินการ ทักษะ ชั่วโมงฝึกงาน และแผนงานช่วงถัดไป" });
      return;
    }

    setSubmitting(true);
    const existing = reportByPeriod.get(selectedPeriod.id); // เช็คว่ารอบนี้เคยมีรายงานอยู่แล้วหรือไม่ (ถ้ามี = โหมดแก้ไข/update, ถ้าไม่มี = โหมดสร้างใหม่/insert)
    const uploadedPaths: string[] = []; // เก็บ path ของไฟล์ที่อัปโหลดสำเร็จในรอบนี้ (เผื่อต้อง rollback ถ้า error)

    // ===== วนอัปโหลดไฟล์แนบทีละไฟล์ (ถ้ามี) =====
    for (const file of attachmentFiles) {
      // ตรวจสอบขนาดไฟล์แต่ละไฟล์ ห้ามเกิน 10 MB
      if (file.size > 10 * 1024 * 1024) {
        setMessage({ type: "error", text: `ไฟล์ ${file.name} มีขนาดเกิน 10 MB` });
        setSubmitting(false);
        return;
      }
      // ทำชื่อไฟล์ให้ปลอดภัยสำหรับใช้เป็นส่วนหนึ่งของ path
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      // สร้าง path เก็บไฟล์แยกตาม นักศึกษา/การฝึกงาน/รอบ พร้อม timestamp+uuid กันชื่อซ้ำ
      const path = `${studentId}/progress/${internship.id}/${selectedPeriod.id}/${Date.now()}_${crypto.randomUUID()}_${safeName}`;
      const { error } = await supabase.storage.from("student-documents").upload(path, file, { upsert: false });
      if (error) {
        // ถ้าอัปโหลดไฟล์ใดไฟล์หนึ่งพลาด ให้ลบไฟล์ที่อัปโหลดสำเร็จไปก่อนหน้านี้ทั้งหมดออก (rollback กันไฟล์ค้าง)
        if (uploadedPaths.length) await supabase.storage.from("student-documents").remove(uploadedPaths);
        setMessage({ type: "error", text: error.message });
        setSubmitting(false);
        return;
      }
      uploadedPaths.push(path); // อัปโหลดสำเร็จ เก็บ path ไว้
    }

    // ===== เตรียมข้อมูลที่จะบันทึกลงตาราง progress_reports =====
    const values = {
      period_id: selectedPeriod.id,
      record_id: internship.id,
      student_id: studentId,
      assigned_tasks: assignedTasks.trim(),
      work_summary: workSummary.trim(),
      skills_learned: skillsLearned.trim(),
      hours_worked: hoursWorked,
      attachment_paths: [...(existing?.attachment_paths ?? []), ...uploadedPaths], // รวมไฟล์เก่าที่มีอยู่แล้ว + ไฟล์ใหม่ที่เพิ่งอัปโหลด
      project_progress: projectProgress,
      problems: problems.trim(),
      next_plan: nextPlan.trim(),
      status: "submitted" as const, // ส่งแล้วสถานะจะเปลี่ยนเป็น "รออาจารย์ตรวจ" เสมอ
      submitted_at: new Date().toISOString(),
    };

    // ถ้ามีรายงานเดิมอยู่แล้ว (existing) ให้ update แถวเดิม, ถ้าไม่มีให้ insert แถวใหม่
    const result = existing
      ? await supabase.from("progress_reports").update(values).eq("id", existing.id).select().single()
      : await supabase.from("progress_reports").insert(values).select().single();

    if (result.error) {
      // ถ้าบันทึกลง DB ไม่สำเร็จ ให้ลบไฟล์ที่เพิ่งอัปโหลดไปด้วย (กัน storage มีไฟล์กำพร้าที่ไม่มีข้อมูลอ้างอิง)
      if (uploadedPaths.length) await supabase.storage.from("student-documents").remove(uploadedPaths);
      setMessage({ type: "error", text: result.error.message });
    }
    else {
      // อัปเดต state reports: เอาของเก่าของรอบนี้ออก แล้วใส่ผลลัพธ์ใหม่ที่เพิ่งบันทึกเข้าไปแทน
      setReports((current) => [...current.filter((item) => item.period_id !== selectedPeriod.id), result.data as ProgressReport]);
      // เคลียร์ฟอร์มและปิด modal
      setSelectedPeriod(null);
      setWorkSummary("");
      setAssignedTasks("");
      setSkillsLearned("");
      setHoursWorked(0);
      setAttachmentFiles([]);
      setProjectProgress(0);
      setProblems("");
      setNextPlan("");
      setMessage({ type: "success", text: "ส่งบันทึกความก้าวหน้าให้อาจารย์เรียบร้อยแล้ว" });
    }
    setSubmitting(false);
  }

  // ===== เมื่อผู้ใช้เลือกไฟล์แนบ (เลือกได้หลายไฟล์พร้อมกัน) =====
  function selectAttachments(event: ChangeEvent<HTMLInputElement>) {
    setAttachmentFiles(Array.from(event.target.files ?? [])); // แปลง FileList เป็น array เก็บใน state
  }

  // ===== เปิดดูไฟล์แนบ โดยขอ signed URL ชั่วคราวจาก Supabase Storage (อายุ 30 นาที) =====
  async function openAttachment(path: string) {
    const { data, error } = await supabase.storage.from("student-documents").createSignedUrl(path, 60 * 30); // 60*30 วินาที = 30 นาที
    if (error || !data?.signedUrl) {
      setMessage({ type: "error", text: error?.message ?? "เปิดไฟล์ประกอบไม่สำเร็จ" });
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer"); // เปิดไฟล์ในแท็บใหม่
  }

  // ===== ระหว่างโหลดข้อมูลหน้าแรก แสดงแค่ spinner กลางจอ =====
  if (loading) return <div className="flex min-h-[calc(100vh-61px)] items-center justify-center bg-slate-100 text-sm text-slate-500"><Loader2 className="mr-2 animate-spin" size={20} />กำลังโหลดข้อมูล...</div>;

  return (
    <div className="flex min-h-[calc(100vh-61px)] bg-slate-100 text-slate-800">
      <StudentSidebar /> {/* เมนูด้านข้างของนักศึกษา */}
      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <InternshipTabs /> {/* แท็บเมนูของหน้าฝึกงาน */}
          <header><h1 className="text-2xl font-bold text-slate-900">บันทึกความก้าวหน้า</h1><p className="mt-1 text-sm text-slate-500">ส่งรายงานตามรอบที่ผู้ประสานงานกำหนดและติดตามผลตรวจจากอาจารย์</p></header>

          {/* กล่องข้อความแจ้งเตือน แสดงเมื่อมีการตั้งค่า message (สีเขียว = success, สีแดง = error) พร้อมไอคอนตามประเภท */}
          {message && <div className={`flex items-center gap-2 rounded-lg border p-4 text-sm ${message.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-700"}`} role="status">{message.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}{message.text}</div>}

          {/* ===== ส่วนแสดงข้อมูลสรุปการฝึกงาน (ถ้ามี) หรือข้อความเตือนถ้ายังไม่มีการฝึกงานที่ยืนยันแล้ว ===== */}
          {internship ? (
            <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 md:grid-cols-3">
              <div><p className="text-xs text-slate-400">นักศึกษา</p><p className="mt-1 font-semibold text-slate-900">{studentName}</p></div>
              <div><p className="text-xs text-slate-400">สถานที่ฝึกงาน</p><p className="mt-1 flex items-center gap-2 font-semibold text-slate-900"><Building2 size={16} />{internship.companyName}</p><p className="text-xs text-slate-500">{internship.position}</p></div>
              <div><p className="text-xs text-slate-400">โปรเจกต์หลัก</p><p className="mt-1 font-semibold text-slate-900">{internship.project}</p></div>
            </section>
          ) : <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">เริ่มส่งบันทึกได้หลังจากสถานที่ฝึกงานได้รับการยืนยันแล้ว</div>}

          {/* ===== ส่วนแสดงรายการ "รอบ" บันทึกความก้าวหน้าทั้งหมด ===== */}
          <section className="space-y-3">
            <div className="flex items-center justify-between"><h2 className="text-base font-bold text-slate-900">รอบรายงานทั้งหมด</h2><span className="text-xs text-slate-500">{periods.length} รอบ</span></div>

            {/* ถ้ายังไม่มีรอบเลย แสดง empty state */}
            {periods.length === 0 ? (
              <div className="rounded-lg border border-slate-200 bg-white px-6 py-14 text-center"><CalendarDays className="mx-auto text-slate-300" size={34} /><p className="mt-3 text-sm font-medium text-slate-600">ยังไม่มีรอบบันทึกความก้าวหน้า</p><p className="mt-1 text-xs text-slate-400">รอผู้ประสานงานกำหนดรอบและวันส่ง</p></div>
            ) : periods.map((period) => {
              const report = reportByPeriod.get(period.id); // หารายงานของรอบนี้ (ถ้ามี)
              // เกินกำหนด = ยังไม่มีรายงาน + รอบไม่ใช่สถานะ draft + วันที่ปัจจุบันเลยวันครบกำหนดส่งไปแล้ว
              const isOverdue = !report && period.status !== "draft" && new Date(`${period.due_on}T23:59:59`) < new Date();
              // แก้ไข/เขียนรายงานได้เมื่อ: มีการฝึกงานอยู่ + รอบเปิดให้ส่ง (open) + (ยังไม่เคยส่ง หรือเป็นฉบับร่าง หรือถูกขอให้แก้ไข)
              const canEdit = Boolean(internship) && period.status === "open" && (!report || report.status === "draft" || report.status === "revision_required");
              return (
                // ใส่ id ให้การ์ดของรายงาน เพื่อให้ useEffect ด้านบน (เลื่อนหน้าจอตาม report_id) หาเจอ
                <article id={report ? `progress-report-${report.id}` : undefined} key={period.id} className="rounded-lg border border-slate-200 bg-white p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex min-w-0 gap-4">
                      {/* วงกลมเลขลำดับของรอบ */}
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 font-bold text-indigo-800">{period.sequence_no}</span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-slate-900">{period.title}</h3>
                          {/* ป้ายสถานะ: ถ้ามีรายงานแล้วโชว์สถานะรายงาน, ถ้ายังไม่มีแต่เกินกำหนดโชว์ "เกินกำหนด", ถ้ายังไม่มีและไม่เกินกำหนดโชว์ "ยังไม่ส่ง" */}
                          {report ? <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusCopy[report.status].className}`}>{statusCopy[report.status].label}</span> : isOverdue ? <span className="rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-semibold text-red-700">เกินกำหนด</span> : <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">ยังไม่ส่ง</span>}
                        </div>
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500"><CalendarDays size={14} />เปิด {formatDate(period.opens_on)} · ส่งภายใน {formatDate(period.due_on)}</p>
                        {/* ถ้ามีรายงานแล้ว แสดงสรุปงาน + ชั่วโมง/ทักษะ */}
                        {report && <p className="mt-3 text-sm text-slate-600">{report.work_summary}</p>}
                        {report && <p className="mt-1 text-xs text-slate-500">ชั่วโมงฝึกงานรอบนี้ {report.hours_worked} ชั่วโมง · ทักษะ: {report.skills_learned || "-"}</p>}
                        {/* ถ้ามีไฟล์แนบ แสดงปุ่มให้กดเปิดดูแต่ละไฟล์ */}
                        {report && report.attachment_paths.length > 0 && <div className="mt-2 flex flex-wrap gap-2">{report.attachment_paths.map((path, index) => <button key={path} type="button" onClick={() => void openAttachment(path)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs text-indigo-800"><Eye size={13} />ไฟล์ประกอบ {index + 1}</button>)}</div>}
                        {/* ถ้าอาจารย์ให้ความเห็นไว้ แสดงกล่องความเห็น */}
                        {report?.advisor_feedback && <div className="mt-3 rounded-lg bg-indigo-50 p-3 text-sm text-indigo-900"><strong>ความเห็นอาจารย์:</strong> {report.advisor_feedback}</div>}
                      </div>
                    </div>
                    {/* ปุ่มเขียน/แก้ไขรายงาน: disable ถ้า canEdit เป็น false / ข้อความและไอคอนเปลี่ยนตามสถานะ */}
                    <button type="button" disabled={!canEdit} onClick={() => openForm(period)} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-indigo-800 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500">{report?.status === "revision_required" ? <RotateCcw size={16} /> : <Plus size={16} />}{report?.status === "revision_required" ? "แก้ไขและส่งใหม่" : report ? "กำลังรอตรวจ" : "เขียนรายงาน"}</button>
                  </div>
                  {/* แถบแสดง % ความคืบหน้าโปรเจกต์ (แสดงเฉพาะรอบที่มีรายงานแล้ว) */}
                  {report && <div className="mt-4 flex items-center gap-3 border-t border-slate-100 pt-4"><span className="text-xs text-slate-500">ความคืบหน้าโปรเจกต์</span><div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-indigo-700" style={{ width: `${report.project_progress}%` }} /></div><strong className="text-xs text-indigo-800">{report.project_progress}%</strong></div>}
                </article>
              );
            })}
          </section>
        </div>
      </main>

      {/* ===== Modal ฟอร์มเขียน/แก้ไขรายงาน แสดงเฉพาะเมื่อ selectedPeriod ไม่ใช่ null ===== */}
      {selectedPeriod && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4"><form onSubmit={submitReport} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl">
        {/* หัว modal: ชื่อรอบ + กำหนดส่ง + ปุ่มปิด (X) */}
        <div className="flex items-start justify-between border-b border-slate-200 p-5"><div><h2 className="font-bold text-slate-900">{selectedPeriod.title}</h2><p className="mt-1 text-xs text-slate-500">กำหนดส่ง {formatDate(selectedPeriod.due_on)}</p></div><button type="button" onClick={() => setSelectedPeriod(null)} className="rounded-md p-2 text-slate-500 hover:bg-slate-100" aria-label="ปิด"><X size={18} /></button></div>

        {/* ===== ฟิลด์กรอกข้อมูลต่าง ๆ ในฟอร์ม (required = บังคับกรอก) ===== */}
        <div className="space-y-5 p-5">
          <label className="block text-sm font-semibold text-slate-700">งานที่ได้รับมอบหมาย<textarea required rows={3} value={assignedTasks} onChange={(event) => setAssignedTasks(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 p-3 font-normal outline-none focus:border-indigo-600" /></label>
          <label className="block text-sm font-semibold text-slate-700">สิ่งที่ดำเนินการ<textarea required rows={4} value={workSummary} onChange={(event) => setWorkSummary(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 p-3 font-normal outline-none focus:border-indigo-600" /></label>
          {/* แถวคู่: ทักษะที่เรียนรู้ (ซ้าย) + ชั่วโมงฝึกงาน (ขวา, จำกัด 0.5-168 ชั่วโมง ขั้นละ 0.5) */}
          <div className="grid gap-4 sm:grid-cols-[1fr_180px]"><label className="block text-sm font-semibold text-slate-700">ทักษะที่ได้เรียนรู้<textarea required rows={2} value={skillsLearned} onChange={(event) => setSkillsLearned(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 p-3 font-normal outline-none focus:border-indigo-600" /></label><label className="block text-sm font-semibold text-slate-700">ชั่วโมงฝึกงาน<input required type="number" min="0.5" max="168" step="0.5" value={hoursWorked || ""} onChange={(event) => setHoursWorked(Number(event.target.value))} className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 font-normal outline-none focus:border-indigo-600" /></label></div>
          {/* แถบเลื่อน (slider) เลือก % ความคืบหน้าโปรเจกต์ 0-100 ขั้นละ 5 */}
          <label className="block text-sm font-semibold text-slate-700">ความคืบหน้าโปรเจกต์: {projectProgress}%<input type="range" min="0" max="100" step="5" value={projectProgress} onChange={(event) => setProjectProgress(Number(event.target.value))} className="mt-3 w-full accent-indigo-700" /></label>
          {/* ปัญหา/สิ่งที่ต้องการความช่วยเหลือ ไม่บังคับกรอก (ไม่มี required) */}
          <label className="block text-sm font-semibold text-slate-700">ปัญหาหรือสิ่งที่ต้องการความช่วยเหลือ<textarea rows={3} value={problems} onChange={(event) => setProblems(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 p-3 font-normal outline-none focus:border-indigo-600" /></label>
          <label className="block text-sm font-semibold text-slate-700">แผนงานช่วงถัดไป<textarea required rows={3} value={nextPlan} onChange={(event) => setNextPlan(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 p-3 font-normal outline-none focus:border-indigo-600" /></label>
          {/* ส่วนเลือกไฟล์แนบ (ไม่บังคับ, เลือกได้หลายไฟล์ - มี attribute multiple) ซ่อน input จริงแล้วใช้ label แทนปุ่ม */}
          <div><p className="text-sm font-semibold text-slate-700">รูปภาพหรือไฟล์ประกอบ</p><input id="progress-attachments" multiple type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp" onChange={selectAttachments} className="sr-only" /><label htmlFor="progress-attachments" className="mt-2 flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"><span className="inline-flex items-center gap-2 font-semibold text-indigo-800"><FileUp size={16} />เลือกไฟล์</span><span className="text-slate-500">{attachmentFiles.length ? `เลือกแล้ว ${attachmentFiles.length} ไฟล์` : "ไม่บังคับ · สูงสุด 10 MB ต่อไฟล์"}</span></label></div>
        </div>

        {/* ปุ่มท้าย modal: ยกเลิก (ปิด modal โดยไม่บันทึก) กับ ส่งให้อาจารย์ตรวจ (submit ฟอร์ม, disable ระหว่างกำลังส่ง) */}
        <div className="flex justify-end gap-3 border-t border-slate-200 p-5"><button type="button" onClick={() => setSelectedPeriod(null)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">ยกเลิก</button><button type="submit" disabled={submitting} className="inline-flex items-center gap-2 rounded-lg bg-indigo-800 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">{submitting ? <Loader2 className="animate-spin" size={16} /> : <FileText size={16} />}ส่งให้อาจารย์ตรวจ</button></div>
      </form></div>}
    </div>
  );
}
