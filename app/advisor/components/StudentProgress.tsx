"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import type { Student } from "../data";
import { weeklyRecords, type WeeklyRecord } from "../detail-data";
import AdvisorShell, { StudentSummary } from "./AdvisorShell";
import Icon from "./Icon";

export default function StudentProgress({ student }: { student: Student }) {
  const [records, setRecords] = useState(weeklyRecords);
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState(false);
  const [selected, setSelected] = useState<WeeklyRecord | null>(null);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [savedNotes, setSavedNotes] = useState<string[]>([]);
  const dialog = useRef<HTMLDialogElement>(null);
  const filtered = records.filter(r => filter === "all" || r.status === filter);
  const visible = filter === "all" && !expanded ? filtered.filter(r => r.week >= 5 && r.week <= 9) : filtered;
  function approve(week: number) {
    const next = records.map(r => r.week === week ? { ...r, status: "approved" as const, comment: "ตรวจสอบและลงนามโดยอาจารย์ที่ปรึกษาแล้ว (ตัวอย่าง)" } : r);
    try { localStorage.setItem(`advisor-progress-${student.id}`, JSON.stringify(next)); setRecords(next); setMessage(`อนุมัติบันทึกสัปดาห์ที่ ${week} แล้วในเบราว์เซอร์นี้`); }
    catch { setMessage("บันทึกไม่ได้ กรุณาตรวจสอบพื้นที่จัดเก็บของเบราว์เซอร์"); }
  }
  function restore() {
    try {
      const raw = localStorage.getItem(`advisor-progress-${student.id}`);
      const notes = localStorage.getItem(`advisor-notes-${student.id}`);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (!Array.isArray(parsed) || parsed.length !== 16 || !parsed.every(r => r && typeof r.week === "number" && typeof r.title === "string" && typeof r.content === "string" && typeof r.date === "string" && ["pending", "approved", "upcoming"].includes(r.status))) throw new Error();
        setRecords(parsed);
      }
      if (notes) { const parsed: unknown = JSON.parse(notes); if (!Array.isArray(parsed) || !parsed.every(n => typeof n === "string")) throw new Error(); setSavedNotes(parsed); }
      setMessage(raw || notes ? "โหลดข้อมูลที่บันทึกในเบราว์เซอร์แล้ว" : "ยังไม่มีข้อมูลที่บันทึกไว้");
    } catch { setMessage("ไม่สามารถอ่านข้อมูลที่บันทึกไว้ได้"); }
  }
  return <AdvisorShell student={student} active="progress">
    <div className="detail-actions"><button className="button secondary" onClick={restore}><Icon name="reset"/>โหลดข้อมูลที่บันทึก</button><Link className="button secondary" href={`/advisor/evaluations/${student.id}#scores`}><Icon name="checklist"/>ประเมินผลการฝึกงาน</Link><Link className="button primary" href={`/advisor/evaluations/${student.id}`}><Icon name="file"/>บันทึกการนิเทศงาน</Link></div>
    {message && <p className="feedback" role="status">{message}</p>}
    <StudentSummary student={student}/>
    <section className="detail-card placement-card"><div className="placement-top"><span className="detail-icon"><Icon name="home" size={27}/></span><div><h3>{student.company}</h3><h2>{student.role}</h2><p>ระยะเวลา: <strong>1 ก.ค. 2567 – 31 ต.ค. 2567</strong> · หน่วยกิตสะสม: <strong>6 หน่วยกิต (สหกิจศึกษา 1)</strong></p></div><div className="visit-reminder"><span><Icon name="clock" size={17}/>กำหนดการนิเทศครั้งที่ 1: 25 ต.ค. 2567</span><small>การนิเทศแบบผสมผสาน (ณ สถานประกอบการ & ออนไลน์)</small></div></div><div className="placement-bottom"><div className="mentor-card"><span className="detail-icon"><Icon name="users" size={26}/></span><div><small>พนักงานที่ปรึกษา (พี่เลี้ยงสถานประกอบการ)</small><strong>คุณธนภัทร วงศ์เจริญ</strong><p>ผู้ดูแลการฝึกงานประจำสถานประกอบการ</p><small>ข้อมูลพี่เลี้ยงตัวอย่าง</small></div></div><div className="project-progress"><div><strong>ความก้าวหน้าของโครงการสหกิจศึกษา</strong><span><b>50%</b> (8 จาก 16 สัปดาห์)</span></div><progress value={8} max={16} aria-label="ความก้าวหน้าการฝึกงาน"/><div className="progress-labels"><span>เริ่มต้น: สัปดาห์ที่ 1</span><span>จุดกึ่งกลาง (นิเทศครั้งที่ 1)</span><span>สิ้นสุด: สัปดาห์ที่ 16</span></div></div></div></section>
    <section aria-labelledby="weekly-title"><div className="weekly-heading"><div><h2 id="weekly-title">บันทึกประจำสัปดาห์และการลงนามนิเทศ</h2><p>รายการส่งบันทึกงานรายสัปดาห์และการรับรองทางวิชาการ</p></div><div className="detail-tabs" aria-label="กรองบันทึก">{[{ key: "all", label: "ทั้งหมด", count: 16 }, { key: "pending", label: "รอตรวจ", count: records.filter(r => r.status === "pending").length }, { key: "approved", label: "อนุมัติแล้ว", count: records.filter(r => r.status === "approved").length }, { key: "upcoming", label: "ยังไม่ถึงกำหนด", count: 8 }].map(tab => <button key={tab.key} aria-pressed={filter === tab.key} className={filter === tab.key ? "active" : ""} onClick={() => setFilter(tab.key)}>{tab.label} ({tab.count})</button>)}</div></div>
      <div className="weekly-list">{visible.map(record => <article className={`detail-card weekly-card ${record.status === "upcoming" ? "upcoming" : ""}`} key={record.week}><div className="weekly-top"><span className="week-number">W{record.week}</span><div><h3>สัปดาห์ที่ {record.week}: {record.title}</h3><small>{record.status === "upcoming" ? "กำหนดส่ง: " : "ส่งเมื่อ: "}{record.date}</small></div><span className={`badge ${record.status === "upcoming" ? "future" : record.status}`}>{record.status === "approved" ? "✓ อนุมัติแล้ว" : record.status === "pending" ? "◷ รออาจารย์ลงนามนิเทศ" : "ยังไม่ถึงกำหนดส่ง"}</span></div>{record.status === "pending" && <p className="weekly-content">{record.content}</p>}{record.comment && <div className="weekly-comment"><Icon name="file"/><div><strong>ความเห็นของอาจารย์ที่ปรึกษา</strong><p>{record.comment}</p></div></div>}{record.status !== "upcoming" && <div className="weekly-footer">{record.status === "pending" && <button className="approve-button" onClick={() => approve(record.week)}><Icon name="checklist"/>อนุมัติและลงนามบันทึกประจำสัปดาห์</button>}<button className="button secondary" onClick={() => { setSelected(record); dialog.current?.showModal(); }}>อ่านบันทึกฉบับเต็ม & ข้อเสนอแนะ</button></div>}</article>)}</div>
      {!visible.length && <p className="detail-card">ไม่มีบันทึกในสถานะนี้</p>}{filter === "all" && <button className="show-records" onClick={() => setExpanded(!expanded)}>{expanded ? "แสดงเฉพาะสัปดาห์ล่าสุด" : "ดูบันทึกทั้งหมด 16 สัปดาห์"}</button>}
    </section>
    <section className="detail-card advisor-note"><h2><Icon name="file"/>ข้อเสนอแนะและบันทึกด่วนของอาจารย์ที่ปรึกษา</h2><p>บันทึกส่วนตัวในเบราว์เซอร์นี้ ยังไม่ส่งอีเมลหรือแจ้งเตือนไปยังนักศึกษา</p><form onSubmit={e => { e.preventDefault(); if (!note.trim()) return; try { const next = [...savedNotes, note.trim()]; localStorage.setItem(`advisor-notes-${student.id}`, JSON.stringify(next)); setSavedNotes(next); setNote(""); setMessage("บันทึกข้อเสนอแนะในเบราว์เซอร์แล้ว"); } catch { setMessage("บันทึกข้อเสนอแนะไม่สำเร็จ"); } }}><textarea required aria-label="ข้อเสนอแนะ" placeholder="พิมพ์คำแนะนำ หรือบันทึกประเด็นเพื่อติดตามการนิเทศครั้งถัดไป..." rows={4} value={note} onChange={e => setNote(e.target.value)}/><div className="detail-actions"><button className="button primary" type="submit">บันทึกข้อคิดเห็นและคำแนะนำ</button></div></form>{savedNotes.map((item, i) => <p className="weekly-content" key={i}>{item}</p>)}</section>
    <dialog className="modal" ref={dialog} aria-label="บันทึกประจำสัปดาห์ฉบับเต็ม"><div className="modal-header"><h2>บันทึกสัปดาห์ที่ {selected?.week}</h2><button className="icon-button" aria-label="ปิด" onClick={() => dialog.current?.close()}><Icon name="close"/></button></div><h3>{selected?.title}</h3><p>{selected?.content}</p>{selected?.comment && <p className="weekly-comment">{selected.comment}</p>}</dialog>
  </AdvisorShell>;
}
