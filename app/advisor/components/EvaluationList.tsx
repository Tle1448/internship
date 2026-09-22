"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { students, type Student } from "../data";
import { advisorDataEvent, readWeeklyRecords, readWorkflowStatus } from "../advisor-store";
import Icon from "./Icon";

type TaskType = "weekly" | "supervision" | "evaluation";
type TaskFilter = "all" | TaskType | "followup";
type AdvisorTask = { id: string; student: Student; type: TaskType; title: string; due: string; status: "pending" | "late"; href: string; action: string };

const filters: { key: TaskFilter; label: string }[] = [
  { key: "all", label: "ทั้งหมด" },
  { key: "weekly", label: "Weekly Log" },
  { key: "supervision", label: "รอนิเทศ" },
  { key: "evaluation", label: "รอประเมิน" },
  { key: "followup", label: "ต้องติดตาม" },
];
const pageSize = 5;

function tasksFor(student: Student, index: number): AdvisorTask[] {
  const tasks: AdvisorTask[] = [];
  const weeklyRecords = readWeeklyRecords(student);
  const weeklyNeedsReview = weeklyRecords.some(record => record.status === "pending" || record.status === "revision");
  const hasRevision = weeklyRecords.some(record => record.status === "revision");
  const workflow = readWorkflowStatus(student);
  if (weeklyNeedsReview) tasks.push({ id: `${student.id}-weekly`, student, type: "weekly", title: hasRevision ? "ติดตามบันทึกที่ส่งกลับแก้ไข" : "ตรวจบันทึกประจำสัปดาห์", due: `${23 + index} ต.ค. 2567`, status: hasRevision ? "late" : "pending", href: `/advisor/students/${student.id}/progress`, action: "ตรวจบันทึก" });
  if (workflow.supervisionStatus === "pending") tasks.push({ id: `${student.id}-supervision`, student, type: "supervision", title: "บันทึกการนิเทศครั้งที่ 1", due: `${25 + index} ต.ค. 2567`, status: student.progressHealth === "attention" ? "late" : "pending", href: `/advisor/students/${student.id}/supervision`, action: "เริ่มบันทึก" });
  if (workflow.evaluationStatus === "pending" && workflow.supervisionStatus === "completed") tasks.push({ id: `${student.id}-evaluation`, student, type: "evaluation", title: "แบบประเมินผลการฝึกงาน", due: `${27 + index} ต.ค. 2567`, status: "pending", href: `/advisor/students/${student.id}/evaluation`, action: "เริ่มประเมิน" });
  return tasks;
}

export default function EvaluationList() {
  const [filter, setFilter] = useState<TaskFilter>("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [, setDataVersion] = useState(0);
  useEffect(() => {
    const refresh = () => setDataVersion(version => version + 1);
    window.addEventListener(advisorDataEvent, refresh);
    return () => window.removeEventListener(advisorDataEvent, refresh);
  }, []);
  const tasks = students.flatMap(tasksFor);
  const visible = tasks.filter(task => (filter === "all" || (filter === "followup" ? task.status === "late" : task.type === filter)) && (!query || `${task.student.name} ${task.student.id} ${task.title}`.toLowerCase().includes(query.toLowerCase())));
  const pageCount = Math.max(1, Math.ceil(visible.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageTasks = visible.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const firstItem = visible.length ? (currentPage - 1) * pageSize + 1 : 0;
  const lastItem = Math.min(currentPage * pageSize, visible.length);

  return <section className="advisor-list-page task-inbox" aria-labelledby="task-list-title">
    <div className="list-heading"><div><h1 id="task-list-title">งานที่ต้องดำเนินการ</h1><p>รวมรายการรอตรวจ รอนิเทศ และรอประเมินจากนักศึกษาทุกคน</p></div><span className="list-count">{visible.length} งาน</span></div>
    <div className="task-toolbar">
      <label className="list-search"><Icon name="search" size={18} /><input value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} placeholder="ค้นหานักศึกษาหรืองาน" /></label>
      <nav className="detail-tabs task-filters" aria-label="กรองประเภทงาน">{filters.map(item => <button key={item.key} className={filter === item.key ? "active" : ""} aria-pressed={filter === item.key} onClick={() => { setFilter(item.key); setPage(1); }}>{item.label}<span>{item.key === "all" ? tasks.length : item.key === "followup" ? tasks.filter(task => task.status === "late").length : tasks.filter(task => task.type === item.key).length}</span></button>)}</nav>
    </div>
    <div className="evaluation-task-list">{pageTasks.map(task => <article className="detail-card evaluation-task-item" key={task.id}>
      <span className="task-icon"><Icon name={task.type === "weekly" ? "file" : task.type === "supervision" ? "calendar" : "checklist"} size={21} /></span>
      <div><span className="task-kind">{task.type === "weekly" ? "WEEKLY LOG" : task.type === "supervision" ? "SUPERVISION" : "EVALUATION"}</span><h2>{task.student.name}</h2><p>{task.title}</p><small>{task.student.id} · กำหนดส่ง {task.due}</small></div>
      <span className={`badge ${task.status}`}>{task.status === "late" ? "ต้องติดตาม" : "รอดำเนินการ"}</span>
      <Link className="button primary" href={task.href}>{task.action}<Icon name="chevron" size={16} /></Link>
    </article>)}</div>
    {!visible.length && <p className="detail-card empty-state">ไม่มีงานตามตัวกรองที่เลือก</p>}
    {visible.length > pageSize && <div className="task-pagination" aria-label="เปลี่ยนหน้ารายการงาน"><span>แสดง {firstItem}–{lastItem} จาก {visible.length} งาน</span><div><button className="button secondary" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>ก่อนหน้า</button><span>{currentPage} / {pageCount}</span><button className="button secondary" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}>ถัดไป</button></div></div>}
  </section>;
}
