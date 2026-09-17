"use client";
import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { students, statusLabels, type Student } from "../data";
import Icon from "./Icon";
import "../advisor.css";

type Appointment = {
    company: string;
    date: string;
    time: string;
    mode: string;
};

const menus = ["ภาพรวมและสถิติ", "ความก้าวหน้านักศึกษา", "บันทึกนิเทศและแบบประเมิน"];

export default function AdvisorDashboard() {
    const [query, setQuery] = useState("");
    const [status, setStatus] = useState("");
    const [company, setCompany] = useState("");
    const [major, setMajor] = useState("วิศวกรรมซอฟต์แวร์");
    const [visit, setVisit] = useState("no");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);
    const [section, setSection] = useState(0);
    const [mobileMenu, setMobileMenu] = useState(false);

    const [selected, setSelected] = useState<Student | null>(null);
    const [appointment, setAppointment] = useState<Appointment | null>(null);
    const [message, setMessage] = useState("");
    const appointmentDialog = useRef<HTMLDialogElement>(null);
    const studentDialog = useRef<HTMLDialogElement>(null);
    const evaluationDialog = useRef<HTMLDialogElement>(null);

    const filtered = students.filter(s => (!query || `${s.id} ${s.name} ${s.company} ${s.project}`.toLowerCase().includes(query.toLowerCase())) && (!status || s.status === status) && (!company || s.company === company) && (!major || s.major === major) && (!visit || s.visited === (visit === "yes")));
    const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const currentPage = Math.min(page, pages);
    const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    const pending = students.filter(s => s.status === "pending").length;
    const late = students.filter(s => s.status === "late").length;

    const reset = () => { setQuery(""); setStatus(""); setCompany(""); setMajor(""); setVisit(""); setPage(1); };

    function saveAppointment(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setAppointment({ company: String(data.get("company")), date: String(data.get("date")), time: String(data.get("time")), mode: String(data.get("mode")) });
        appointmentDialog.current?.close();
        setMessage("เพิ่มนัดหมายแล้ว (เก็บไว้เฉพาะระหว่างเปิดหน้านี้)");
    }

    function openStudent(student: Student) { setSelected(student); studentDialog.current?.showModal(); }

    return <div className="advisor-app">
    <button type="button" className="icon-button mobile-toggle" aria-controls="advisor-menu" aria-expanded={mobileMenu} onClick={() => setMobileMenu(!mobileMenu)}><Icon name="menu"/>เมนูอาจารย์</button>
    <aside id="advisor-menu" className={`sidebar ${mobileMenu ? "is-open" : ""}`}><div><p className="nav-label">การจัดการนิเทศ</p><nav aria-label="เมนูอาจารย์">{menus.map((menu, i) => <button key={menu} className={section === i ? "active" : ""} aria-current={section === i ? "page" : undefined} onClick={() => { setSection(i); setMobileMenu(false); }}><Icon name={i === 0 ? "dashboard" : i === 1 ? "users" : "checklist"}/>{menu}</button>)}</nav></div><div className="sidebar-footer"><strong>วิทยาลัยนวัตกรรมวิชาชีพ</strong><span>หน่วยสหกิจศึกษาและการฝึกงาน</span></div></aside>
    
    <main className="main-content">
      {/* Breadcrumb อย่างเดียว (ลบส่วนโปรไฟล์ซ้ำออกแล้ว) */}
      <div className="breadcrumb"><Icon name="home" size={16}/><span>หน้าหลัก</span><span>/</span><strong>แดชบอร์ดอาจารย์นิเทศ</strong></div>

      <section className="page-heading"><div><h1>{section === 0 ? "ภาพรวมการดูแลนักศึกษาสหกิจศึกษา" : menus[section]}</h1><p><Icon name="cap"/><span>ภาคเรียนที่ 1/2567 — อาจารย์ที่ปรึกษา: <strong>Adviser</strong></span></p></div><div className="heading-actions"><button className="button secondary" onClick={() => window.print()}><Icon name="file"/>ดาวน์โหลดรายงานสรุป (PDF)</button><button className="button primary" onClick={() => appointmentDialog.current?.showModal()}><Icon name="plus"/>เพิ่มการนัดหมายนิเทศ</button></div></section>
      <p className="demo-note">ข้อมูลตัวอย่างสำหรับภาคเรียน 1/2567</p>
      {message && <div className="feedback" role="status"><Icon name="check"/>{message}<button className="icon-button" aria-label="ปิดข้อความ" onClick={() => setMessage("")}><Icon name="close" size={16}/></button></div>}
      <section className="stats" aria-label="สถิตินักศึกษา">
        {[{ title: "นักศึกษาในความดูแล", count: students.length, icon: "users" as const, badge: "นักศึกษาทั้งหมดในภาคเรียน", kind: "all", filter: "" }, { title: "อนุมัติสถานที่ฝึกงานแล้ว", count: students.filter(s => s.status === "approved").length, icon: "checklist" as const, badge: "อนุมัติครบถ้วน", kind: "approved", filter: "approved" }, { title: "รอตรวจสอบเอกสาร/คำร้อง", count: pending, icon: "calendar" as const, badge: "รอการตรวจสอบ", kind: "pending", filter: "pending" }, { title: "บันทึกสัปดาห์ค้างส่ง", count: late, icon: "warning" as const, badge: "ต้องดำเนินการด่วน", kind: "late", filter: "late" }].map(item => <button key={item.kind} className={`stat-card ${item.kind}`} onClick={() => { reset(); setStatus(item.filter); }}><span className="stat-top"><span>{item.title}</span><span className="stat-icon"><Icon name={item.icon} size={26}/></span></span><span className="stat-number">{item.count}<small>คน</small></span><span className={`badge ${item.kind}`}>{item.kind !== "all" && <Icon name={item.kind === "pending" ? "clock" : item.kind === "late" ? "warning" : "check"} size={14}/>}{item.badge}</span></button>)}
      </section>
      {section !== 2 && <>
      <section className="filter-card" aria-label="ตัวกรองนักศึกษา"><div className="filter-controls"><label className="search-field"><Icon name="search"/><input aria-label="ค้นหารายชื่อนักศึกษา" placeholder="ค้นหารายชื่อ..." value={query} onChange={e => { setQuery(e.target.value); setPage(1); }}/></label><label className="select-field">สถานะ:<select aria-label="สถานะ" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}><option value="">ทั้งหมด</option>{Object.entries(statusLabels).map(([key, value]) => <option key={key} value={key}>{value}</option>)}</select></label><label className="select-field">สถานประกอบการ:<select aria-label="สถานประกอบการ" value={company} onChange={e => { setCompany(e.target.value); setPage(1); }}><option value="">ทุกบริษัท</option>{[...new Set(students.map(s => s.company))].map(c => <option key={c}>{c}</option>)}</select></label><label className="select-field">สาขาวิชา:<select aria-label="สาขาวิชา" value={major} onChange={e => { setMajor(e.target.value); setPage(1); }}><option value="">ทุกสาขา</option><option>วิศวกรรมซอฟต์แวร์</option><option>วิทยาการคอมพิวเตอร์</option></select></label><label className="select-field">การนิเทศ:<select aria-label="การนิเทศ" value={visit} onChange={e => { setVisit(e.target.value); setPage(1); }}><option value="">ทั้งหมด</option><option value="no">ยังไม่ได้นิเทศ</option><option value="yes">นิเทศแล้ว</option></select></label><button className="reset-button" onClick={reset}><Icon name="reset" size={17}/>รีเซ็ตตัวกรอง</button></div><div className="filter-chips"><span>ตัวกรองที่เลือก:</span>{!query && !major && !visit && !status && !company && <span>ทั้งหมด</span>}{[{ value: query, label: query, clear: () => setQuery("") }, { value: major, label: `สาขา: ${major}`, clear: () => setMajor("") }, { value: visit, label: `สถานะนิเทศ: ${visit === "no" ? "ยังไม่ได้นิเทศ" : "นิเทศแล้ว"}`, clear: () => setVisit("") }, { value: status, label: statusLabels[status as keyof typeof statusLabels], clear: () => setStatus("") }, { value: company, label: company, clear: () => setCompany("") }].filter(c => c.value).map(c => <button key={c.label} onClick={() => { c.clear(); setPage(1); }} aria-label={`ลบตัวกรอง ${c.label}`}>{c.label}<Icon name="close" size={13}/></button>)}</div></section>
      <section className="table-card"><div className="table-scroll"><table><caption className="sr-only">รายชื่อนักศึกษาในความดูแล</caption><thead><tr><th>รหัสนักศึกษา</th><th>ชื่อ - นามสกุล</th><th>สถานประกอบการและที่ตั้ง</th><th>{section === 1 ? "ความก้าวหน้า / สถานะ" : "ตำแหน่ง / หัวข้อโครงงาน"}</th></tr></thead><tbody>{visible.map((s, i) => <tr key={s.id} className={s.status === "late" ? "urgent-row" : ""}><td><button className="student-id" onClick={() => openStudent(s)}>{s.id}</button></td><td><button className="student-cell" onClick={() => openStudent(s)}><span className={`avatar avatar-${i % 4}`}>{s.name.replace(/^(นาย|นางสาว)/, "").slice(0, 2)}</span><span><strong>{s.name}</strong><small>วศ.บ. {s.major} (ชั้นปีที่ 4)</small></span></button></td><td><strong>{s.company}</strong><small className="location"><Icon name="pin" size={14}/>{s.province}</small></td><td>{section === 1 ? <><span className={`badge ${s.status}`}>{statusLabels[s.status]}</span><small>{s.visited ? "นิเทศแล้ว" : "ยังไม่ได้นิเทศ"}</small></> : <><button className="project-link" onClick={() => openStudent(s)}>{s.project}</button><small>{s.role}</small></>}</td></tr>)}</tbody></table>{!visible.length && <div className="empty-state"><Icon name="search" size={32}/><strong>ไม่พบนักศึกษาที่ตรงกับตัวกรอง</strong><p>ลองเปลี่ยนคำค้นหาหรือเลือกตัวกรองใหม่</p><button className="button secondary" onClick={reset}>ล้างตัวกรองทั้งหมด</button></div>}</div><div className="table-footer"><div>แสดง <strong>{filtered.length ? (currentPage - 1) * pageSize + 1 : 0} - {Math.min(currentPage * pageSize, filtered.length)}</strong> จากทั้งหมด <strong>{filtered.length}</strong> รายการ <label className="page-size">แถวต่อหน้า: <select aria-label="จำนวนแถวต่อหน้า" value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}><option>5</option><option>10</option><option>20</option></select></label></div><nav className="pagination" aria-label="หน้ารายชื่อนักศึกษา"><button aria-label="หน้าก่อนหน้า" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}><span className="previous"><Icon name="chevron" size={16}/></span></button>{Array.from({ length: pages }, (_, i) => <button key={i} className={currentPage === i + 1 ? "active" : ""} aria-current={currentPage === i + 1 ? "page" : undefined} onClick={() => setPage(i + 1)}>{i + 1}</button>)}<button aria-label="หน้าถัดไป" disabled={currentPage === pages} onClick={() => setPage(currentPage + 1)}><Icon name="chevron" size={16}/></button></nav></div></section>
      </>}
      <section className="appointment-banner"><span className="appointment-icon"><Icon name="calendar" size={32}/></span><div><span className="banner-tag">กำหนดการนิเทศครั้งต่อไป</span><h2>{appointment ? `นิเทศสหกิจศึกษา ณ ${appointment.company}` : "นิเทศสหกิจศึกษา ณ บริษัท อโกด้า เซอร์วิสเซส จำกัด และ บริษัท ไลน์แมน วงใน จำกัด"}</h2><p>{appointment ? `${new Date(`${appointment.date}T00:00:00`).toLocaleDateString("th-TH", { dateStyle: "long" })} เวลา ${appointment.time} น. (${appointment.mode})` : "วันศุกร์ที่ 9 สิงหาคม 2567 เวลา 09:30 - 15:00 น. (ณ สถานประกอบการ On-site กรุงเทพฯ)"}</p></div><button className="button" onClick={() => evaluationDialog.current?.showModal()}>เตรียมแบบประเมินนิเทศ</button></section>
      {section === 2 && <section className="records-card"><h2>บันทึกนิเทศและแบบประเมิน</h2><p>เลือกนักศึกษาเพื่อดูข้อมูลและเตรียมแบบประเมินสำหรับการนิเทศ</p>{students.map(s => <button className="record-row" key={s.id} onClick={() => openStudent(s)}><span><strong>{s.name}</strong><small>{s.company}</small></span><span className="record-status">{s.visited ? "นิเทศแล้ว" : "รอการนิเทศ"}<Icon name="chevron" size={16}/></span></button>)}</section>}
      <footer className="content-footer">ระบบสหกิจศึกษาและฝึกงาน · WU Internship</footer>
    </main>

    <dialog ref={appointmentDialog} className="modal" aria-label="เพิ่มการนัดหมายนิเทศ"><div className="modal-header"><h2>เพิ่มการนัดหมายนิเทศ</h2><button className="icon-button" aria-label="ปิด" onClick={() => appointmentDialog.current?.close()}><Icon name="close"/></button></div><form onSubmit={saveAppointment}><p className="muted">บันทึกนัดหมายตัวอย่างสำหรับภาคเรียน 1/2567</p><label>สถานประกอบการ<select name="company" required>{[...new Set(students.map(s => s.company))].map(c => <option key={c}>{c}</option>)}</select></label><div className="form-grid"><label>วันที่นิเทศ<input name="date" type="date" required/></label><label>เวลา<input name="time" type="time" required/></label></div><label>รูปแบบการนิเทศ<select name="mode"><option>On-site ณ สถานประกอบการ</option><option>Online ผ่านระบบประชุม</option></select></label><p className="muted">ข้อมูลจะไม่ถูกบันทึกลงฐานข้อมูล และจะหายเมื่อรีเฟรชหน้า</p><button className="button primary" type="submit">บันทึกนัดหมาย</button></form></dialog>
    <dialog ref={studentDialog} className="modal" aria-label="ข้อมูลนักศึกษา"><div className="modal-header"><h2>ข้อมูลนักศึกษา</h2><button className="icon-button" aria-label="ปิด" onClick={() => studentDialog.current?.close()}><Icon name="close"/></button></div>{selected && <div className="student-detail"><span className={`badge ${selected.status}`}>{statusLabels[selected.status]}</span><h3>{selected.name}</h3><p>{selected.id} · {selected.major}</p><dl><dt>สถานประกอบการ</dt><dd>{selected.company}</dd><dt>จังหวัด</dt><dd>{selected.province}</dd><dt>หัวข้อโครงงาน</dt><dd>{selected.project}</dd><dt>ตำแหน่ง</dt><dd>{selected.role}</dd><dt>การนิเทศ</dt><dd>{selected.visited ? "นิเทศแล้ว" : "ยังไม่ได้นิเทศ"}</dd></dl></div>}</dialog>
    <dialog ref={evaluationDialog} className="modal" aria-label="เตรียมแบบประเมินนิเทศ"><div className="modal-header"><h2>เตรียมแบบประเมินนิเทศ</h2><button className="icon-button" aria-label="ปิด" onClick={() => evaluationDialog.current?.close()}><Icon name="close"/></button></div><form onSubmit={e => { e.preventDefault(); evaluationDialog.current?.close(); setMessage("เตรียมรายการประเมินแล้ว (ตัวอย่าง ยังไม่ได้บันทึกลงฐานข้อมูล)"); }}><label>นักศึกษา<select required>{students.map(s => <option key={s.id}>{s.id} — {s.name}</option>)}</select></label><fieldset><legend>รายการเตรียมก่อนนิเทศ</legend>{["ตรวจสอบบันทึกประจำสัปดาห์", "ทบทวนความก้าวหน้าโครงงาน", "เตรียมเกณฑ์ประเมินผลการปฏิบัติงาน"].map(label => <label className="checkbox-label" key={label}><input type="checkbox" required/>{label}</label>)}</fieldset><label>หมายเหตุ<textarea rows={3} placeholder="ประเด็นที่ต้องติดตามในการนิเทศ"/></label><button type="submit" className="button primary">ยืนยันการเตรียมแบบประเมิน</button></form></dialog>
  </div>;
}