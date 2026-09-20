"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import type { Student } from "../data";
import { scoreCriteria, gradeFor } from "../detail-data";
import AdvisorShell, { StudentSummary } from "./AdvisorShell";
import EvaluationScores from "./EvaluationScores";
import EvaluationAttachments from "./EvaluationAttachments";
import Icon from "./Icon";

type Evaluation = { date: string; mode: string; topics: boolean[]; notes: string; scores: number[]; feedback: string };
type HistoryEntry = { savedAt: string; total: number; grade: string };
const initial: Evaluation = { date: "2024-10-25", mode: "onsite", topics: [true, true], notes: "ได้เข้าพบนักศึกษาพร้อมกับพนักงานที่ปรึกษา ณ สถานประกอบการ นักศึกษามีความก้าวหน้าของโครงงานตามแผนการบันทึกข้อมูล แนะนำให้ปรับปรุงการจัดทำเอกสารสรุปสถาปัตยกรรมระบบให้มีความชัดเจนยิ่งขึ้นก่อนการนำเสนอ", scores: scoreCriteria.map(c => c.initial), feedback: "นักศึกษาแสดงออกถึงวุฒิภาวะทางวิชาชีพที่น่าประทับใจ มีความสามารถในการปรับตัวกับสภาพแวดล้อมและทีมงานได้อย่างรวดเร็ว แนะนำให้ต่อยอดทักษะด้านสถาปัตยกรรมระบบและการนำเสนอผลงาน" };

export default function EvaluationForm({ student }: { student: Student }) {
  const [form, setForm] = useState<Evaluation>(initial);
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [tab, setTab] = useState("visit");
  const formRef = useRef<HTMLFormElement>(null);
  const key = `advisor-evaluation-${student.id}`;
  function update<K extends keyof Evaluation>(field: K, value: Evaluation[K]) { setForm(previous => ({ ...previous, [field]: value })); }
  function readHistory(): HistoryEntry[] {
    const parsed: unknown = JSON.parse(localStorage.getItem(`${key}-history`) || "[]");
    if (!Array.isArray(parsed) || !parsed.every(item => item && typeof item.savedAt === "string" && typeof item.total === "number" && typeof item.grade === "string")) throw new Error();
    return parsed;
  }
  function save(submit: boolean) {
    if (submit && (!formRef.current?.reportValidity() || !form.notes.trim() || !form.feedback.trim())) { setMessage("กรุณากรอกบันทึกและข้อเสนอแนะให้ครบถ้วน"); return; }
    if (submit && !form.topics.some(Boolean)) { setMessage("กรุณาเลือกหัวข้อที่ตรวจสอบอย่างน้อย 1 หัวข้อ"); return; }
    try {
      const total = form.scores.reduce((sum, score) => sum + score, 0);
      if (submit) { const next = [{ savedAt: new Date().toISOString(), total, grade: gradeFor(total) }, ...readHistory()]; localStorage.setItem(`${key}-history`, JSON.stringify(next)); setHistory(next); }
      localStorage.setItem(key, JSON.stringify(form));
      setMessage(submit ? "บันทึกผลประเมินในเบราว์เซอร์แล้ว ยังไม่ได้ส่งเข้าระบบมหาวิทยาลัย" : "บันทึกแบบร่างในเบราว์เซอร์แล้ว (ไม่รวมไฟล์แนบ)");
    } catch { setMessage("บันทึกไม่สำเร็จ กรุณาตรวจสอบพื้นที่จัดเก็บของเบราว์เซอร์"); }
  }
  function restore() {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) { setMessage("ยังไม่มีแบบร่างที่บันทึกไว้"); return; }
      const value = JSON.parse(raw);
      if (!value || typeof value.date !== "string" || !["onsite", "online"].includes(value.mode) || typeof value.notes !== "string" || typeof value.feedback !== "string" || !Array.isArray(value.topics) || value.topics.length !== 2 || !value.topics.every((v: unknown) => typeof v === "boolean") || !Array.isArray(value.scores) || value.scores.length !== 4 || !value.scores.every((v: unknown, i: number) => typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= scoreCriteria[i].max)) throw new Error();
      setForm(value); setMessage("โหลดแบบร่างที่บันทึกไว้แล้ว");
    } catch { setMessage("ไม่สามารถอ่านแบบร่างที่บันทึกไว้ได้"); }
  }
  function showHistory() { setTab("history"); try { setHistory(readHistory()); } catch { setMessage("ไม่สามารถอ่านประวัติได้"); } }
  return <AdvisorShell student={student} active="evaluation"><div className="evaluation-heading"><div><h1>บันทึกการนิเทศงานและแบบประเมินผลสหกิจศึกษา</h1><p>ระบบบันทึกผลการนิเทศติดตามผลการปฏิบัติงานสหกิจศึกษา ณ สถานประกอบการ พร้อมเครื่องมือประเมินผล</p></div><div className="detail-actions"><button className="button secondary" onClick={restore}><Icon name="reset"/>โหลดแบบร่าง</button><button className="button primary" onClick={() => window.print()}><Icon name="file"/>พิมพ์ / บันทึก PDF</button></div></div>
    <nav className="detail-tabs evaluation-tabs" aria-label="ส่วนของแบบประเมิน"><button className={tab === "visit" ? "active" : ""} onClick={() => { setTab("visit"); document.getElementById("visit")?.scrollIntoView({ behavior: "smooth" }); }}><Icon name="calendar"/>1. แบบบันทึกการนิเทศงาน</button><button className={tab === "scores" ? "active" : ""} onClick={() => { setTab("scores"); document.getElementById("scores")?.scrollIntoView({ behavior: "smooth" }); }}><Icon name="checklist"/>2. แบบประเมินผลการปฏิบัติงาน</button><button className={tab === "history" ? "active" : ""} onClick={showHistory}><Icon name="clock"/>3. ประวัติการประเมินย้อนหลัง</button></nav>
    {message && <p role="status" className="feedback">{message}</p>}
    {tab === "history" && <section className="detail-card evaluation-history"><h2>ประวัติการประเมินที่บันทึกในเบราว์เซอร์</h2>{history.length ? history.map((entry, i) => <div className="attachment-row" key={`${entry.savedAt}-${i}`}><Icon name="check"/><span>{new Date(entry.savedAt).toLocaleString("th-TH")}</span><strong>{entry.total}/100 · เกรด {entry.grade}</strong></div>) : <p>ยังไม่มีประวัติการประเมิน</p>}</section>}
    <StudentSummary student={student} compact/>
    <form ref={formRef} onSubmit={e => { e.preventDefault(); save(true); }}>
      <section id="visit" className="detail-card evaluation-section"><div className="section-title"><span className="detail-icon"><Icon name="calendar"/></span><div><h2>ส่วนที่ 1: รายละเอียดการเข้าตรวจเยี่ยมนิเทศงาน</h2><p>กำหนดวัน ช่องทางการนิเทศ และประเด็นการตรวจสอบ</p></div><span className="badge pending">รอการบันทึกสรุป</span></div><div className="evaluation-grid"><label>วันที่ดำเนินการนิเทศ <span className="required">*</span><input required type="date" value={form.date} onChange={e => update("date", e.target.value)}/></label><fieldset><legend>รูปแบบการนิเทศ <span className="required">*</span></legend><div className="mode-options"><label><input type="radio" name="visit-mode" value="onsite" checked={form.mode === "onsite"} onChange={() => update("mode", "onsite")}/>นิเทศ ณ สถานประกอบการ</label><label><input type="radio" name="visit-mode" value="online" checked={form.mode === "online"} onChange={() => update("mode", "online")}/>นิเทศผ่านระบบออนไลน์</label></div></fieldset></div><fieldset className="topic-field"><legend>หัวข้อและประเด็นที่ได้รับการตรวจสอบ <span className="required">*</span></legend><div className="evaluation-grid">{[{ title: "การปรับตัวเข้ากับองค์กรและวินัยการทำงาน", text: "การแต่งกาย ความประพฤติ การปฏิบัติตามกฎระเบียบ และการทำงานร่วมกับพี่เลี้ยง" }, { title: "ความก้าวหน้าโครงงานสหกิจ", text: "การกำหนดขอบเขตผลงาน รายงานความคืบหน้ารายสัปดาห์ และการประยุกต์ใช้วิชาชีพ" }].map((topic, i) => <label className="topic-option" key={topic.title}><input type="checkbox" checked={form.topics[i]} onChange={e => update("topics", form.topics.map((value, index) => index === i ? e.target.checked : value))}/><span><strong>{i + 1}. {topic.title}</strong><small>{topic.text}</small></span></label>)}</div></fieldset><label className="evaluation-field">บันทึกข้อสนทนาและสรุปการหารือร่วมกับพนักงานที่ปรึกษา <span className="required">*</span><textarea rows={5} required value={form.notes} onChange={e => update("notes", e.target.value)}/></label><EvaluationAttachments/></section>
      <section id="scores" className="detail-card evaluation-section"><EvaluationScores scores={form.scores} onChange={scores => update("scores", scores)}/><label className="evaluation-field">ความคิดเห็นเพิ่มเติมและการพัฒนานักศึกษาในอนาคต <span className="required">*</span><textarea rows={4} required value={form.feedback} onChange={e => update("feedback", e.target.value)}/></label></section>
      <footer className="detail-card evaluation-footer"><span>● แบบประเมินสำหรับ {student.name}</span><div className="detail-actions"><Link href={`/advisor/students/${student.id}`} className="cancel-link">กลับหน้าความก้าวหน้า</Link><button className="button secondary" type="button" onClick={() => save(false)}>บันทึกแบบร่าง</button><button className="button primary" type="submit">บันทึกผลการประเมิน</button></div></footer>
    </form>
  </AdvisorShell>;
}
