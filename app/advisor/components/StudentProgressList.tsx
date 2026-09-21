"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { placementStatusLabels, progressPercent, students } from "../data";
import FilterSelect from "./FilterSelect";
import Icon from "./Icon";

const totalWeeks = 16;
const initialVisibleCount = 5;

export default function StudentProgressList() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [company, setCompany] = useState("all");
  const [progress, setProgress] = useState("all");
  const [showAll, setShowAll] = useState(false);
  const companies = [...new Set(students.map(student => student.company))];
  const visible = useMemo(() => students.filter(student => {
    return (!query || `${student.name} ${student.id} ${student.company}`.toLowerCase().includes(query.toLowerCase()))
      && (status === "all" || student.placementStatus === status)
      && (company === "all" || student.company === company)
      && (progress === "all" || student.progressHealth === progress);
  }), [company, progress, query, status]);
  const displayed = showAll ? visible : visible.slice(0, initialVisibleCount);

  return <section className="advisor-list-page" aria-labelledby="progress-list-title">
    <div className="list-heading"><div><h1 id="progress-list-title">นักศึกษาในความดูแล</h1><p>ค้นหานักศึกษาและเข้าสู่พื้นที่ติดตามงานของแต่ละคน</p></div><span className="list-count">{visible.length} คน</span></div>
    <div className="list-filters">
      <label className="list-search"><Icon name="search" size={18} /><input value={query} onChange={event => { setQuery(event.target.value); setShowAll(false); }} placeholder="ค้นหาชื่อหรือรหัสนักศึกษา" /></label>
      <FilterSelect label="สถานะเอกสาร" value={status} options={[{ value: "all", label: "ทั้งหมด" }, { value: "approved", label: "อนุมัติครบถ้วน" }, { value: "pending", label: "รอตรวจสอบ" }]} onChange={value => { setStatus(value); setShowAll(false); }} />
      <FilterSelect label="สถานประกอบการ" value={company} options={[{ value: "all", label: "ทุกบริษัท" }, ...companies.map(value => ({ value, label: value }))]} onChange={value => { setCompany(value); setShowAll(false); }} />
      <FilterSelect label="ความก้าวหน้า" value={progress} options={[{ value: "all", label: "ทั้งหมด" }, { value: "on-track", label: "ตามแผน" }, { value: "attention", label: "ต้องติดตาม" }]} onChange={value => { setProgress(value); setShowAll(false); }} />
    </div>
    <div className="student-progress-list">{displayed.map((student) => {
      const percent = progressPercent(student);
      const needsAttention = student.progressHealth === "attention";
      return <article className="detail-card student-progress-item" key={student.id}>
        <div className="list-avatar" aria-hidden="true">{student.name.replace(/^(นาย|นางสาว)/, "").slice(0, 2)}</div>
        <div className="student-list-copy"><h2>{student.name}</h2><p>{student.id} · {student.company}</p><small>{student.role}</small></div>
        <div className="student-list-progress"><span>สัปดาห์ {student.currentWeek} / {totalWeeks}</span><strong>{percent}%</strong><progress value={student.currentWeek} max={totalWeeks} aria-label={`ความก้าวหน้าของ ${student.name}`} /></div>
        <div className="student-list-actions"><div className="list-statuses">
          <span className={`attention-badge ${student.placementStatus === "approved" ? "document-approved" : "pending"}`}>{placementStatusLabels[student.placementStatus]}</span>
          <span className={`attention-badge ${needsAttention ? "followup" : "on-track"}`}>{needsAttention ? "ต้องติดตาม" : "ตามแผน"}</span>
        </div><Link className="button secondary" href={`/advisor/students/${student.id}`}>เปิดพื้นที่นักศึกษา<Icon name="chevron" size={16} /></Link></div>
      </article>;
    })}</div>
    {!visible.length && <p className="detail-card empty-state">ไม่พบรายชื่อนักศึกษาตามตัวกรองที่เลือก</p>}
    {visible.length > initialVisibleCount && <button className="show-records" type="button" onClick={() => setShowAll(!showAll)}>{showAll ? "แสดงเฉพาะ 5 คนแรก" : `แสดงเพิ่มอีก ${visible.length - initialVisibleCount} คน`}</button>}
  </section>;
}
