"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { type Student, useAdvisorStudents } from "../data";
import Icon from "./Icon";

type TaskType = "progress" | "supervision" | "evaluation";
type TaskFilter = "all" | TaskType | "followup";
type Task = { id: string; student: Student; kind: TaskType; title: string; urgent: boolean; href: string; action: string };

const pageSize = 5;
const filters: { key: TaskFilter; label: string }[] = [
  { key: "all", label: "ทั้งหมด" },
  { key: "progress", label: "บันทึกความก้าวหน้า" },
  { key: "supervision", label: "รอนิเทศ" },
  { key: "evaluation", label: "รอประเมิน" },
  { key: "followup", label: "ต้องติดตาม" },
];

export default function EvaluationList() {
  const { students, loading } = useAdvisorStudents();
  const [pendingLogs, setPendingLogs] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<TaskFilter>("all");
  const [page, setPage] = useState(1);

  useEffect(() => { void (async () => {
    if (!students.length) { setPendingLogs(new Set()); return; }
    const { data } = await supabase.from("progress_reports").select("record_id").in("record_id", students.map((student) => student.recordId)).eq("status", "submitted");
    setPendingLogs(new Set((data || []).map((row) => row.record_id)));
  })(); }, [students]);

  const tasks = useMemo(() => students.flatMap((student): Task[] => {
    const next: Task[] = [];
    if (pendingLogs.has(student.recordId)) next.push({ id: `${student.recordId}-progress`, student, kind: "progress", title: "ตรวจบันทึกความก้าวหน้า", urgent: student.progressHealth === "attention", href: `/advisor/students/${student.id}/progress`, action: "ตรวจบันทึก" });
    if (student.supervisionStatus === "pending") next.push({ id: `${student.recordId}-supervision`, student, kind: "supervision", title: "บันทึกการนิเทศ", urgent: student.progressHealth === "attention", href: `/advisor/students/${student.id}/supervision`, action: "เริ่มบันทึก" });
    if (student.supervisionStatus === "completed" && student.evaluationStatus === "pending") next.push({ id: `${student.recordId}-evaluation`, student, kind: "evaluation", title: "แบบประเมินผลการฝึกงาน", urgent: false, href: `/advisor/students/${student.id}/evaluation`, action: "เริ่มประเมิน" });
    return next;
  }), [students, pendingLogs]);
  const visible = useMemo(() => tasks.filter((task) => (
    (filter === "all" || (filter === "followup" ? task.urgent : task.kind === filter))
    && (!query || `${task.student.name} ${task.student.id} ${task.title}`.toLowerCase().includes(query.toLowerCase()))
  )), [filter, query, tasks]);
  const pageCount = Math.max(1, Math.ceil(visible.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageTasks = visible.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const firstItem = visible.length ? (currentPage - 1) * pageSize + 1 : 0;
  const lastItem = Math.min(currentPage * pageSize, visible.length);

  return <section className="advisor-list-page task-inbox" aria-labelledby="task-list-title">
    <div className="list-heading"><div><h1 id="task-list-title">งานที่ต้องดำเนินการ</h1><p>รวมรายการรอตรวจ รอนิเทศ และรอประเมินจากข้อมูลจริงในระบบ</p></div><span className="list-count">{loading ? "..." : visible.length} งาน</span></div>
    <div className="task-toolbar"><label className="list-search"><Icon name="search" size={18} /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="ค้นหานักศึกษาหรืองาน" /></label><nav className="detail-tabs task-filters" aria-label="กรองประเภทงาน">{filters.map((item) => <button key={item.key} className={filter === item.key ? "active" : ""} aria-pressed={filter === item.key} onClick={() => { setFilter(item.key); setPage(1); }}>{item.label}<span>{item.key === "all" ? tasks.length : item.key === "followup" ? tasks.filter((task) => task.urgent).length : tasks.filter((task) => task.kind === item.key).length}</span></button>)}</nav></div>
    <div className="evaluation-task-list">{pageTasks.map((task) => <article className="detail-card evaluation-task-item" key={task.id}><span className="task-icon"><Icon name={task.kind === "progress" ? "file" : task.kind === "supervision" ? "calendar" : "checklist"} size={21} /></span><div><span className="task-kind">{task.kind === "progress" ? "PROGRESS REPORT" : task.kind === "supervision" ? "SUPERVISION" : "EVALUATION"}</span><h2>{task.student.name}</h2><p>{task.title}</p><small>{task.student.id} · {task.student.company}</small></div><span className={`badge ${task.urgent ? "late" : "pending"}`}>{task.urgent ? "ต้องติดตาม" : "รอดำเนินการ"}</span><Link className="button primary" href={task.href}>{task.action}<Icon name="chevron" size={16} /></Link></article>)}</div>
    {!loading && !visible.length && <p className="detail-card empty-state">ไม่มีงานตามตัวกรองที่เลือก</p>}
    {visible.length > pageSize && <div className="task-pagination" aria-label="เปลี่ยนหน้ารายการงาน"><span>แสดง {firstItem}–{lastItem} จาก {visible.length} งาน</span><div><button className="button secondary" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>ก่อนหน้า</button><span>{currentPage} / {pageCount}</span><button className="button secondary" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}>ถัดไป</button></div></div>}
  </section>;
}
