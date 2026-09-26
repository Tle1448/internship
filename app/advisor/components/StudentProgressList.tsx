"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { placementStatusLabels, progressHealthLabels, progressPercent, useAdvisorStudents } from "../data";
import FilterSelect from "./FilterSelect";
import Icon from "./Icon";

<<<<<<< HEAD
const initialVisibleCount = 5;

export default function StudentProgressList() {
  const { students, loading, error } = useAdvisorStudents();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [company, setCompany] = useState("all");
  const [progress, setProgress] = useState("all");
  const [showAll, setShowAll] = useState(false);
  const companies = useMemo(() => [...new Set(students.map((student) => student.company).filter((value) => value !== "-"))], [students]);
  const visible = useMemo(() => students.filter((student) => (
    (!query || `${student.name} ${student.id} ${student.company}`.toLowerCase().includes(query.toLowerCase()))
    && (status === "all" || student.placementStatus === status)
    && (company === "all" || student.company === company)
    && (progress === "all" || student.progressHealth === progress)
  )), [company, progress, query, status, students]);
  const displayed = showAll ? visible : visible.slice(0, initialVisibleCount);

  function resetVisible() { setShowAll(false); }

  return <section className="advisor-list-page" aria-labelledby="progress-list-title">
    <div className="list-heading"><div><h1 id="progress-list-title">นักศึกษาในความดูแล</h1><p>ค้นหานักศึกษาและเข้าสู่พื้นที่ติดตามงานของแต่ละคน</p></div><span className="list-count">{loading ? "..." : visible.length} คน</span></div>
    {error && <p className="feedback">ไม่สามารถโหลดข้อมูลได้: {error}</p>}
    <div className="list-filters">
      <label className="list-search"><Icon name="search" size={18} /><input value={query} onChange={(event) => { setQuery(event.target.value); resetVisible(); }} placeholder="ค้นหาชื่อหรือรหัสนักศึกษา" /></label>
      <FilterSelect label="สถานะเอกสาร" value={status} options={[{ value: "all", label: "ทั้งหมด" }, { value: "approved", label: "อนุมัติครบถ้วน" }, { value: "pending", label: "รอตรวจสอบ" }]} onChange={(value) => { setStatus(value); resetVisible(); }} />
      <FilterSelect label="สถานประกอบการ" value={company} options={[{ value: "all", label: "ทุกบริษัท" }, ...companies.map((value) => ({ value, label: value }))]} onChange={(value) => { setCompany(value); resetVisible(); }} />
      <FilterSelect label="ความก้าวหน้า" value={progress} options={[{ value: "all", label: "ทั้งหมด" }, { value: "on_track", label: "ตามแผน" }, { value: "attention", label: "ต้องติดตาม" }]} onChange={(value) => { setProgress(value); resetVisible(); }} />
    </div>
    <div className="student-progress-list">{displayed.map((student) => <article className="detail-card student-progress-item" key={student.recordId}><div className="list-avatar" aria-hidden="true">{student.name.replace(/^(นาย|นางสาว)/, "").slice(0, 2)}</div><div className="student-list-copy"><h2>{student.name}</h2><p>{student.id} · {student.company}</p><small>{student.role}</small></div><div className="student-list-progress"><span>สัปดาห์ {student.currentWeek} / 16</span><strong>{progressPercent(student)}%</strong><progress value={student.progress} max={100} aria-label={`ความก้าวหน้าของ ${student.name}`} /></div><div className="student-list-actions"><div className="list-statuses"><span className={`attention-badge ${student.placementStatus === "approved" ? "document-approved" : "pending"}`}>{placementStatusLabels[student.placementStatus]}</span><span className={`attention-badge ${student.progressHealth === "attention" ? "followup" : "on-track"}`}>{progressHealthLabels[student.progressHealth]}</span></div><Link className="button secondary" href={`/advisor/students/${student.id}`}>เปิดพื้นที่นักศึกษา<Icon name="chevron" size={16} /></Link></div></article>)}</div>
    {!loading && !visible.length && <p className="detail-card empty-state">ไม่พบรายชื่อนักศึกษาตามตัวกรองที่เลือก</p>}
    {visible.length > initialVisibleCount && <button className="show-records" type="button" onClick={() => setShowAll((current) => !current)}>{showAll ? "แสดงเฉพาะ 5 คนแรก" : `แสดงเพิ่มอีก ${visible.length - initialVisibleCount} คน`}</button>}
=======
export default function StudentProgressList() {
  const { students, loading, error } = useAdvisorStudents();
  const [query, setQuery] = useState("");
  const [health, setHealth] = useState("all");
  const visible = useMemo(() => students.filter((student) => (!query || `${student.name} ${student.id} ${student.company}`.toLowerCase().includes(query.toLowerCase())) && (health === "all" || student.progressHealth === health)), [students, query, health]);
  return <section className="advisor-list-page" aria-labelledby="progress-list-title">
    <div className="list-heading"><div><h1 id="progress-list-title">My students</h1><p>Student records assigned to the signed-in advisor.</p></div><span className="list-count">{loading ? "..." : visible.length} students</span></div>
    {error && <p className="feedback">Unable to load data: {error}</p>}
    <div className="list-filters"><label className="list-search"><Icon name="search" size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search student or company" /></label><FilterSelect label="Progress" value={health} options={[{ value: "all", label: "All" }, { value: "on_track", label: "On track" }, { value: "attention", label: "Needs attention" }]} onChange={setHealth} /></div>
    <div className="student-progress-list">{visible.map((student) => <article className="detail-card student-progress-item" key={student.recordId}><div className="list-avatar">{student.name.slice(0, 2)}</div><div className="student-list-copy"><h2>{student.name}</h2><p>{student.id} · {student.company}</p><small>{student.role}</small></div><div className="student-list-progress"><span>Week {student.currentWeek} / 16</span><strong>{progressPercent(student)}%</strong><progress value={student.progress} max={100} /></div><div className="student-list-actions"><div className="list-statuses"><span className={`attention-badge ${student.progressHealth === "attention" ? "followup" : "on-track"}`}>{progressHealthLabels[student.progressHealth]}</span><span className={`attention-badge ${student.placementStatus === "approved" ? "document-approved" : "pending"}`}>{placementStatusLabels[student.placementStatus]}</span></div><Link className="button secondary" href={`/advisor/students/${student.id}`}>Open workspace<Icon name="chevron" size={16} /></Link></div></article>)}</div>
    {!loading && !visible.length && <p className="detail-card empty-state">No students match the selected filter.</p>}
>>>>>>> 390feae (Connect Advisor with database)
  </section>;
}
