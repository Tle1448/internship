"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { students } from "../data";
import Icon from "./Icon";

const totalWeeks = 16;

function progressFor(index: number) {
  const currentWeek = 5 + (index % 5);
  return { currentWeek, percent: Math.round((currentWeek / totalWeeks) * 100) };
}

export default function StudentProgressList() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [company, setCompany] = useState("all");
  const [progress, setProgress] = useState("all");
  const companies = [...new Set(students.map(student => student.company))];
  const visible = useMemo(() => students.filter((student, index) => {
    const itemProgress = progressFor(index).percent;
    return (!query || `${student.name} ${student.id} ${student.company}`.toLowerCase().includes(query.toLowerCase()))
      && (status === "all" || student.status === status)
      && (company === "all" || student.company === company)
      && (progress === "all" || (progress === "behind" ? itemProgress < 45 : itemProgress >= 45));
  }), [company, progress, query, status]);

  return <section className="advisor-list-page" aria-labelledby="progress-list-title">
    <div className="list-heading"><div><h1 id="progress-list-title">ความก้าวหน้านักศึกษา</h1><p>ติดตามสถานะการฝึกงานและเลือกดูรายละเอียดของนักศึกษาแต่ละคน</p></div><span className="list-count">{visible.length} คน</span></div>
    <div className="list-filters">
      <label className="list-search"><Icon name="search" size={18} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="ค้นหาชื่อหรือรหัสนักศึกษา" /></label>
      <label>สถานะ<select value={status} onChange={event => setStatus(event.target.value)}><option value="all">ทั้งหมด</option><option value="approved">อนุมัติครบถ้วน</option><option value="pending">รอตรวจสอบ</option><option value="late">ค้างส่ง</option></select></label>
      <label>สถานประกอบการ<select value={company} onChange={event => setCompany(event.target.value)}><option value="all">ทุกบริษัท</option>{companies.map(value => <option key={value} value={value}>{value}</option>)}</select></label>
      <label>ความก้าวหน้า<select value={progress} onChange={event => setProgress(event.target.value)}><option value="all">ทั้งหมด</option><option value="on-track">ตามแผน</option><option value="behind">ต้องติดตาม</option></select></label>
    </div>
    <div className="student-progress-list">{visible.map((student) => {
      const index = students.findIndex(item => item.id === student.id);
      const itemProgress = progressFor(index);
      return <article className="detail-card student-progress-item" key={student.id}>
        <div className="list-avatar" aria-hidden="true">{student.name.replace(/^(นาย|นางสาว)/, "").slice(0, 2)}</div>
        <div className="student-list-copy"><h2>{student.name}</h2><p>{student.id} · {student.company}</p><small>{student.role}</small></div>
        <div className="student-list-progress"><span>สัปดาห์ {itemProgress.currentWeek} / {totalWeeks}</span><strong>{itemProgress.percent}%</strong><progress value={itemProgress.currentWeek} max={totalWeeks} aria-label={`ความก้าวหน้าของ ${student.name}`} /></div>
        <div className="student-list-actions"><span className={`badge ${student.status}`}>{student.status === "approved" ? "ตามแผน" : student.status === "late" ? "ต้องติดตาม" : "รอตรวจสอบ"}</span><Link className="button secondary" href={`/advisor/students/${student.id}`}>ดูรายละเอียด<Icon name="chevron" size={16} /></Link></div>
      </article>;
    })}</div>
    {!visible.length && <p className="detail-card empty-state">ไม่พบรายชื่อนักศึกษาตามตัวกรองที่เลือก</p>}
  </section>;
}
