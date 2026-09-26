"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { placementStatusLabels, progressHealthLabels, progressPercent, useAdvisorStudents } from "../data";
import AdvisorShell from "./AdvisorShell";
import AppointmentManager, { type AppointmentManagerHandle } from "./AppointmentManager";
import FilterSelect from "./FilterSelect";
import Icon from "./Icon";

const pageSize = 5;

export default function AdvisorDashboard() {
  const { students, loading, error } = useAdvisorStudents();
  const appointmentManager = useRef<AppointmentManagerHandle>(null);
  const [query, setQuery] = useState("");
  const [placement, setPlacement] = useState("");
  const [health, setHealth] = useState("");
  const [company, setCompany] = useState("");
  const [supervision, setSupervision] = useState("");
  const [page, setPage] = useState(1);

  const companies = useMemo(() => [...new Set(students.map((student) => student.company).filter((value) => value !== "-"))], [students]);
  const filtered = useMemo(() => students.filter((student) => {
    const searchable = `${student.id} ${student.name} ${student.company} ${student.project}`.toLowerCase();
    return (!query || searchable.includes(query.toLowerCase()))
      && (!placement || student.placementStatus === placement)
      && (!health || student.progressHealth === health)
      && (!company || student.company === company)
      && (!supervision || student.supervisionStatus === supervision);
  }), [students, query, placement, health, company, supervision]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function reset() {
    setQuery("");
    setPlacement("");
    setHealth("");
    setCompany("");
    setSupervision("");
    setPage(1);
  }

  function filterBy(type: "all" | "approved" | "attention" | "supervision") {
    reset();
    if (type === "approved") setPlacement("approved");
    if (type === "attention") setHealth("attention");
    if (type === "supervision") setSupervision("pending");
  }

  const stats = [
    { title: "นักศึกษาในความดูแล", count: students.length, icon: "users" as const, badge: "นักศึกษาทั้งหมด", kind: "all" as const, action: () => filterBy("all") },
    { title: "เอกสารอนุมัติครบถ้วน", count: students.filter((student) => student.placementStatus === "approved").length, icon: "checklist" as const, badge: "พร้อมดำเนินการ", kind: "approved" as const, action: () => filterBy("approved") },
    { title: "ความก้าวหน้าต้องติดตาม", count: students.filter((student) => student.progressHealth === "attention").length, icon: "warning" as const, badge: "ควรติดตาม", kind: "late" as const, action: () => filterBy("attention") },
    { title: "รอดำเนินการนิเทศ", count: students.filter((student) => student.supervisionStatus === "pending").length, icon: "calendar" as const, badge: "รอนิเทศ", kind: "pending" as const, action: () => filterBy("supervision") },
  ];

  return <AdvisorShell active="dashboard">
    <section className="page-heading">
      <div><h1>ภาพรวมการดูแลนักศึกษาสหกิจศึกษา</h1><p><Icon name="cap" /><span>ข้อมูลนักศึกษาในความดูแล</span></p></div>
      <div className="heading-actions">
        <button className="button primary" disabled={!students.length} onClick={() => appointmentManager.current?.openCreate()}><Icon name="plus" />เพิ่มนัดหมายนิเทศ</button>
        {/* <Link className="button primary" href="/advisor/tasks"><Icon name="checklist" />ดูงานที่ต้องดำเนินการ</Link> */}
      </div>
    </section>
    {error && <p className="feedback">ไม่สามารถโหลดข้อมูลได้: {error}</p>}
    <section className="stats" aria-label="สถิตินักศึกษา">
      {stats.map((item) => <button key={item.kind} className={`stat-card ${item.kind}`} onClick={item.action}><span className="stat-top"><span>{item.title}</span><span className="stat-icon"><Icon name={item.icon} size={22} /></span></span><span className="stat-number">{loading ? "..." : item.count}<small> คน</small></span><span className={`badge ${item.kind}`}>{item.badge}</span></button>)}
    </section>
    <section className="filter-card" aria-label="ตัวกรองนักศึกษา">
      <div className="filter-controls">
        <label className="search-field"><Icon name="search" /><input aria-label="ค้นหารายชื่อนักศึกษา" placeholder="ค้นหารายชื่อ รหัส หรือสถานประกอบการ..." value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} /></label>
        <FilterSelect label="สถานะเอกสาร" value={placement} options={[{ value: "", label: "ทั้งหมด" }, { value: "approved", label: "อนุมัติครบถ้วน" }, { value: "pending", label: "รอตรวจสอบ" }]} onChange={(value) => { setPlacement(value); setPage(1); }} />
        <FilterSelect label="ความก้าวหน้า" value={health} options={[{ value: "", label: "ทั้งหมด" }, { value: "on_track", label: "ตามแผน" }, { value: "attention", label: "ต้องติดตาม" }]} onChange={(value) => { setHealth(value); setPage(1); }} />
        <FilterSelect label="สถานประกอบการ" value={company} options={[{ value: "", label: "ทุกบริษัท" }, ...companies.map((value) => ({ value, label: value }))]} onChange={(value) => { setCompany(value); setPage(1); }} />
        <FilterSelect label="การนิเทศ" value={supervision} options={[{ value: "", label: "ทั้งหมด" }, { value: "pending", label: "รอนิเทศ" }, { value: "completed", label: "นิเทศแล้ว" }]} onChange={(value) => { setSupervision(value); setPage(1); }} />
      </div>
      <div className="filter-chips"><span>ผลลัพธ์ {loading ? "..." : filtered.length} คน</span><button className="reset-button" onClick={reset}><Icon name="reset" size={17} />รีเซ็ตตัวกรอง</button></div>
    </section>
    <section className="table-card">
      <div className="table-scroll"><table><caption className="sr-only">รายชื่อนักศึกษาในความดูแล</caption><thead><tr><th>รหัสนักศึกษา</th><th>ชื่อ - นามสกุล</th><th>สถานประกอบการ</th><th>ความก้าวหน้า / สิ่งที่ต้องสนใจ</th></tr></thead><tbody>{visible.map((student, index) => <tr key={student.recordId} className={student.progressHealth === "attention" ? "urgent-row" : ""}><td><Link className="student-id" href={`/advisor/students/${student.id}`}>{student.id}</Link></td><td><Link className="student-cell" href={`/advisor/students/${student.id}`}><span className={`avatar avatar-${index % 4}`}>{student.name.replace(/^(นาย|นางสาว)/, "").slice(0, 2)}</span><span><strong>{student.name}</strong><small>{student.major}</small></span></Link></td><td><strong>{student.company}</strong><small className="location"><Icon name="pin" size={14} />{student.province}</small></td><td><div className="dashboard-progress"><span>สัปดาห์ {student.currentWeek}/16 · {progressPercent(student)}%</span><progress value={student.progress} max={100} /></div><div className="dashboard-statuses"><span className={`attention-badge ${student.placementStatus === "approved" ? "document-approved" : "pending"}`}>{placementStatusLabels[student.placementStatus]}</span><span className={`attention-badge ${student.progressHealth === "attention" ? "followup" : "on-track"}`}>{progressHealthLabels[student.progressHealth]}</span></div></td></tr>)}</tbody></table>{!loading && !visible.length && <div className="empty-state"><Icon name="search" size={32} /><strong>ไม่พบนักศึกษาที่ตรงกับตัวกรอง</strong><button className="button secondary" onClick={reset}>ล้างตัวกรองทั้งหมด</button></div>}</div>
      <div className="table-footer"><span>แสดง {filtered.length ? (currentPage - 1) * pageSize + 1 : 0}–{Math.min(currentPage * pageSize, filtered.length)} จาก {filtered.length} คน</span><nav className="pagination" aria-label="หน้ารายชื่อนักศึกษา"><button aria-label="หน้าก่อนหน้า" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}><span className="previous"><Icon name="chevron" size={16} /></span></button>{Array.from({ length: pageCount }, (_, index) => <button key={index} className={currentPage === index + 1 ? "active" : ""} onClick={() => setPage(index + 1)}>{index + 1}</button>)}<button aria-label="หน้าถัดไป" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}><Icon name="chevron" size={16} /></button></nav></div>
    </section>
    <AppointmentManager ref={appointmentManager} students={students} />
  </AdvisorShell>;
}
