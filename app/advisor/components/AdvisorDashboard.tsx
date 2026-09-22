"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { placementStatusLabels, progressPercent, students } from "../data";
import { advisorDataEvent, readWorkflowStatus } from "../advisor-store";
import AdvisorShell from "./AdvisorShell";
import FilterSelect from "./FilterSelect";
import Icon from "./Icon";

type Appointment = { company: string; date: string; time: string; mode: string };

export default function AdvisorDashboard() {
  const router = useRouter();
  const appointmentDialog = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState("");
  const [placement, setPlacement] = useState("");
  const [health, setHealth] = useState("");
  const [company, setCompany] = useState("");
  const [supervision, setSupervision] = useState("");
  const [page, setPage] = useState(1);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [appointmentCompany, setAppointmentCompany] = useState(students[0]?.company ?? "");
  const [appointmentMode, setAppointmentMode] = useState("On-site");
  const [message, setMessage] = useState("");
  const [, setDataVersion] = useState(0);
  const pageSize = 5;
  useEffect(() => {
    const refresh = () => setDataVersion((version) => version + 1);
    window.addEventListener(advisorDataEvent, refresh);
    return () => window.removeEventListener(advisorDataEvent, refresh);
  }, []);

  const currentStudents = students.map((student) => ({ ...student, ...readWorkflowStatus(student) }));
  const filtered = currentStudents.filter((student) => {
    const searchable = `${student.id} ${student.name} ${student.company} ${student.project}`.toLowerCase();
    return (!query || searchable.includes(query.toLowerCase()))
      && (!placement || student.placementStatus === placement)
      && (!health || student.progressHealth === health)
      && (!company || student.company === company)
      && (!supervision || student.supervisionStatus === supervision);
  });
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const companies = [...new Set(currentStudents.map((student) => student.company))];

  function reset() {
    setQuery("");
    setPlacement("");
    setHealth("");
    setCompany("");
    setSupervision("");
    setPage(1);
  }

  function saveAppointment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setAppointment({ company: appointmentCompany, date: String(data.get("date")), time: String(data.get("time")), mode: appointmentMode });
    appointmentDialog.current?.close();
    setMessage("เพิ่มนัดหมายแล้วในหน้าตัวอย่างนี้");
  }

  const stats = [
    { title: "นักศึกษาในความดูแล", count: currentStudents.length, icon: "users" as const, badge: "นักศึกษาทั้งหมด", kind: "all", action: reset },
    { title: "เอกสารอนุมัติครบถ้วน", count: currentStudents.filter((student) => student.placementStatus === "approved").length, icon: "checklist" as const, badge: "พร้อมดำเนินการ", kind: "approved", action: () => { reset(); setPlacement("approved"); } },
    { title: "ความก้าวหน้าต้องติดตาม", count: currentStudents.filter((student) => student.progressHealth === "attention").length, icon: "warning" as const, badge: "ควรติดตาม", kind: "late", action: () => { reset(); setHealth("attention"); } },
    { title: "รอดำเนินการนิเทศ", count: currentStudents.filter((student) => student.supervisionStatus === "pending").length, icon: "calendar" as const, badge: "รอนิเทศ", kind: "pending", action: () => { reset(); setSupervision("pending"); } },
  ];

  return (
    <AdvisorShell active="dashboard">
      <section className="page-heading">
        <div><h1>ภาพรวมการดูแลนักศึกษาสหกิจศึกษา</h1><p><Icon name="cap" /><span>ภาคเรียนที่ 1/2567 · อาจารย์ที่ปรึกษา: <strong>Adviser</strong></span></p></div>
        <div className="heading-actions"><button className="button secondary" onClick={() => window.print()}><Icon name="file" />ดาวน์โหลดรายงานสรุป</button><button className="button primary" onClick={() => appointmentDialog.current?.showModal()}><Icon name="plus" />เพิ่มนัดหมายนิเทศ</button></div>
      </section>

      {message && <div className="feedback" role="status"><Icon name="check" />{message}<button className="icon-button" aria-label="ปิดข้อความ" onClick={() => setMessage("")}><Icon name="close" size={16} /></button></div>}

      <section className="stats" aria-label="สถิตินักศึกษา">
        {stats.map((item) => <button key={item.kind} className={`stat-card ${item.kind}`} onClick={item.action}><span className="stat-top"><span>{item.title}</span><span className="stat-icon"><Icon name={item.icon} size={22} /></span></span><span className="stat-number">{item.count}<small>คน</small></span><span className={`badge ${item.kind}`}>{item.kind !== "all" && <Icon name={item.kind === "pending" ? "clock" : item.kind === "late" ? "warning" : "check"} size={14} />}{item.badge}</span></button>)}
      </section>

      <section className="filter-card" aria-label="ตัวกรองนักศึกษา">
        <div className="filter-controls">
          <label className="search-field"><Icon name="search" /><input aria-label="ค้นหารายชื่อนักศึกษา" placeholder="ค้นหารายชื่อ..." value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} /></label>
          <FilterSelect label="สถานะเอกสาร" value={placement} options={[{ value: "", label: "ทั้งหมด" }, { value: "approved", label: "อนุมัติครบถ้วน" }, { value: "pending", label: "รอตรวจสอบ" }]} onChange={(value) => { setPlacement(value); setPage(1); }} />
          <FilterSelect label="ความก้าวหน้า" value={health} options={[{ value: "", label: "ทั้งหมด" }, { value: "on-track", label: "ตามแผน" }, { value: "attention", label: "ต้องติดตาม" }]} onChange={(value) => { setHealth(value); setPage(1); }} />
          <FilterSelect label="สถานประกอบการ" value={company} options={[{ value: "", label: "ทุกบริษัท" }, ...companies.map((value) => ({ value, label: value }))]} onChange={(value) => { setCompany(value); setPage(1); }} />
          <FilterSelect label="การนิเทศ" value={supervision} options={[{ value: "", label: "ทั้งหมด" }, { value: "pending", label: "รอนิเทศ" }, { value: "completed", label: "นิเทศแล้ว" }]} onChange={(value) => { setSupervision(value); setPage(1); }} />
        </div>
        <div className="filter-chips"><span>ผลลัพธ์ {filtered.length} คน</span><button className="reset-button" onClick={reset}><Icon name="reset" size={17} />รีเซ็ตตัวกรอง</button></div>
      </section>

      <section className="table-card">
        <div className="table-scroll">
          <table>
            <caption className="sr-only">รายชื่อนักศึกษาในความดูแล</caption>
            <thead><tr><th>รหัสนักศึกษา</th><th>ชื่อ - นามสกุล</th><th>สถานประกอบการ</th><th>ความก้าวหน้า / สิ่งที่ต้องสนใจ</th></tr></thead>
            <tbody>{visible.map((student, index) => <tr key={student.id} className={student.progressHealth === "attention" ? "urgent-row" : ""}><td><button className="student-id" onClick={() => router.push(`/advisor/students/${student.id}`)}>{student.id}</button></td><td><button className="student-cell" onClick={() => router.push(`/advisor/students/${student.id}`)}><span className={`avatar avatar-${index % 4}`}>{student.name.replace(/^(นาย|นางสาว)/, "").slice(0, 2)}</span><span><strong>{student.name}</strong><small>{student.major}</small></span></button></td><td><strong>{student.company}</strong><small className="location"><Icon name="pin" size={14} />{student.province}</small></td><td><div className="dashboard-progress"><span>สัปดาห์ {student.currentWeek}/16 · {progressPercent(student)}%</span><progress value={student.currentWeek} max={16} /></div><div className="dashboard-statuses"><span className={`attention-badge ${student.placementStatus === "approved" ? "document-approved" : "pending"}`}>{placementStatusLabels[student.placementStatus]}</span><span className={`attention-badge ${student.progressHealth === "attention" ? "followup" : "on-track"}`}>{student.progressHealth === "attention" ? "ต้องติดตาม" : "ตามแผน"}</span></div></td></tr>)}</tbody>
          </table>
          {!visible.length && <div className="empty-state"><Icon name="search" size={32} /><strong>ไม่พบนักศึกษาที่ตรงกับตัวกรอง</strong><button className="button secondary" onClick={reset}>ล้างตัวกรองทั้งหมด</button></div>}
        </div>
        <div className="table-footer"><span>แสดง {filtered.length ? (currentPage - 1) * pageSize + 1 : 0}–{Math.min(currentPage * pageSize, filtered.length)} จาก {filtered.length} คน</span><nav className="pagination" aria-label="หน้ารายชื่อนักศึกษา"><button aria-label="หน้าก่อนหน้า" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}><span className="previous"><Icon name="chevron" size={16} /></span></button>{Array.from({ length: pageCount }, (_, index) => <button key={index} className={currentPage === index + 1 ? "active" : ""} onClick={() => setPage(index + 1)}>{index + 1}</button>)}<button aria-label="หน้าถัดไป" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}><Icon name="chevron" size={16} /></button></nav></div>
      </section>

      <section className="appointment-banner"><span className="appointment-icon"><Icon name="calendar" size={32} /></span><div><span className="banner-tag">กำหนดการนิเทศครั้งต่อไป</span><h2>{appointment ? `นิเทศสหกิจศึกษา ณ ${appointment.company}` : "นิเทศสหกิจศึกษา ณ สถานประกอบการ"}</h2><p>{appointment ? `${new Date(`${appointment.date}T00:00:00`).toLocaleDateString("th-TH", { dateStyle: "long" })} เวลา ${appointment.time} น. (${appointment.mode})` : "วันศุกร์ที่ 9 สิงหาคม 2567 เวลา 09:30–15:00 น."}</p></div><button className="button" onClick={() => router.push("/advisor/tasks")}>ดูงานที่ต้องดำเนินการ</button></section>

      <dialog ref={appointmentDialog} className="modal" aria-label="เพิ่มการนัดหมายนิเทศ"><div className="modal-header"><h2>เพิ่มการนัดหมายนิเทศ</h2><button className="icon-button" aria-label="ปิด" onClick={() => appointmentDialog.current?.close()}><Icon name="close" /></button></div><form onSubmit={saveAppointment}><FilterSelect label="สถานประกอบการ" value={appointmentCompany} options={companies.map((value) => ({ value, label: value }))} onChange={setAppointmentCompany} /><div className="form-grid"><label>วันที่นิเทศ<input name="date" type="date" required /></label><label>เวลา<input name="time" type="time" required /></label></div><FilterSelect label="รูปแบบการนิเทศ" value={appointmentMode} options={[{ value: "On-site", label: "On-site" }, { value: "Online", label: "Online" }]} onChange={setAppointmentMode} /><button className="button primary" type="submit">บันทึกนัดหมาย</button></form></dialog>
    </AdvisorShell>
  );
}
