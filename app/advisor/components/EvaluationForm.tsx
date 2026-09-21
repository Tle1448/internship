"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Student } from "../data";
import { scoreCriteria, gradeFor } from "../detail-data";
import AdvisorShell, { StudentSummary } from "./AdvisorShell";
import EvaluationScores from "./EvaluationScores";
import EvaluationAttachments from "./EvaluationAttachments";
import Icon from "./Icon";

type Evaluation = { date: string; mode: string; topics: boolean[]; notes: string; scores: number[]; feedback: string };
type HistoryEntry = { savedAt: string; total: number; grade: string };
export type EvaluationStep = "visit" | "scores" | "history";
const initial: Evaluation = { date: "2024-10-25", mode: "onsite", topics: [true, true], notes: "ได้เข้าพบนักศึกษาพร้อมกับพนักงานที่ปรึกษา ณ สถานประกอบการ นักศึกษามีความก้าวหน้าของโครงงานตามแผนการบันทึกข้อมูล แนะนำให้ปรับปรุงการจัดทำเอกสารสรุปสถาปัตยกรรมระบบให้มีความชัดเจนยิ่งขึ้นก่อนการนำเสนอ", scores: scoreCriteria.map(c => c.initial), feedback: "นักศึกษาแสดงออกถึงวุฒิภาวะทางวิชาชีพที่น่าประทับใจ มีความสามารถในการปรับตัวกับสภาพแวดล้อมและทีมงานได้อย่างรวดเร็ว แนะนำให้ต่อยอดทักษะด้านสถาปัตยกรรมระบบและการนำเสนอผลงาน" };

export default function EvaluationForm({ student, embedded = false, step = "visit" }: { student: Student; embedded?: boolean; step?: EvaluationStep }) {
  const [form, setForm] = useState<Evaluation>(initial);
  const [message, setMessage] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "draft" | "saved">("idle");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [tab, setTab] = useState<EvaluationStep>(step);
  const formRef = useRef<HTMLFormElement>(null);
  const key = `advisor-evaluation-${student.id}`;
  function update<K extends keyof Evaluation>(field: K, value: Evaluation[K]) { setForm(previous => ({ ...previous, [field]: value })); }
  function readHistory(): HistoryEntry[] {
    const parsed: unknown = JSON.parse(localStorage.getItem(`${key}-history`) || "[]");
    if (!Array.isArray(parsed) || !parsed.every(item => item && typeof item.savedAt === "string" && typeof item.total === "number" && typeof item.grade === "string")) throw new Error();
    return parsed;
  }
  useEffect(() => {
    setTab(step);
    if (step !== "history") return;
    try { setHistory(readHistory()); } catch { setMessage("ไม่สามารถอ่านประวัติได้"); }
  }, [step]);
  function save(submit: boolean) {
    if (submit && (!formRef.current?.reportValidity() || !form.notes.trim() || !form.feedback.trim())) { setMessage("กรุณากรอกบันทึกและข้อเสนอแนะให้ครบถ้วน"); return; }
    if (submit && !form.topics.some(Boolean)) { setMessage("กรุณาเลือกหัวข้อที่ตรวจสอบอย่างน้อย 1 หัวข้อ"); return; }
    try {
      const total = form.scores.reduce((sum, score) => sum + score, 0);
      if (submit) { const next = [{ savedAt: new Date().toISOString(), total, grade: gradeFor(total) }, ...readHistory()]; localStorage.setItem(`${key}-history`, JSON.stringify(next)); setHistory(next); }
      localStorage.setItem(key, JSON.stringify(form));
      setSaveState(submit ? "saved" : "draft");
      window.setTimeout(() => setSaveState("idle"), 2800);
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
  const content = <><div className="evaluation-heading"><div><h1>บันทึกการนิเทศงานและแบบประเมินผลสหกิจศึกษา</h1><p>ระบบบันทึกผลการนิเทศติดตามผลการปฏิบัติงานสหกิจศึกษา ณ สถานประกอบการ พร้อมเครื่องมือประเมินผล</p></div><div className="detail-actions"><button className="button secondary" onClick={restore}><Icon name="reset"/>โหลดแบบร่าง</button><button className="button primary" onClick={() => window.print()}><Icon name="file"/>พิมพ์ / บันทึก PDF</button></div></div>
    <nav className="detail-tabs evaluation-tabs" aria-label="ส่วนของแบบประเมิน"><Link className={tab === "visit" ? "active" : ""} href={`/advisor/evaluations/${student.id}`}><Icon name="calendar"/>1. แบบบันทึกการนิเทศงาน</Link><Link className={tab === "scores" ? "active" : ""} href={`/advisor/evaluations/${student.id}/scores`}><Icon name="checklist"/>2. แบบประเมินผลการปฏิบัติงาน</Link><Link className={tab === "history" ? "active" : ""} href={`/advisor/evaluations/${student.id}/history`}><Icon name="clock"/>3. ประวัติการประเมินย้อนหลัง</Link></nav>
    {message && <p role="status" className="feedback">{message}</p>}
    {tab === "history" && <section className="detail-card evaluation-history"><h2>ประวัติการประเมินที่บันทึกในเบราว์เซอร์</h2>{history.length ? history.map((entry, i) => <div className="attachment-row" key={`${entry.savedAt}-${i}`}><Icon name="check"/><span>{new Date(entry.savedAt).toLocaleString("th-TH")}</span><strong>{entry.total}/100 · เกรด {entry.grade}</strong></div>) : <p>ยังไม่มีประวัติการประเมิน</p>}</section>}
    <StudentSummary student={student} compact/>
    <form ref={formRef} onSubmit={e => { e.preventDefault(); save(true); }}>
      {tab === "visit" && <section id="visit" className="detail-card evaluation-section"><div className="section-title"><span className="detail-icon"><Icon name="calendar"/></span><div><h2>ส่วนที่ 1: รายละเอียดการเข้าตรวจเยี่ยมนิเทศงาน</h2><p>กำหนดวัน ช่องทางการนิเทศ และประเด็นการตรวจสอบ</p></div><span className="badge pending">รอการบันทึกสรุป</span></div><div className="evaluation-grid"><label>วันที่ดำเนินการนิเทศ <span className="required">*</span><input required type="date" value={form.date} onChange={e => update("date", e.target.value)}/></label><fieldset><legend>รูปแบบการนิเทศ <span className="required">*</span></legend><div className="mode-options"><label><input type="radio" name="visit-mode" value="onsite" checked={form.mode === "onsite"} onChange={() => update("mode", "onsite")}/>นิเทศ ณ สถานประกอบการ</label><label><input type="radio" name="visit-mode" value="online" checked={form.mode === "online"} onChange={() => update("mode", "online")}/>นิเทศผ่านระบบออนไลน์</label></div></fieldset></div><fieldset className="topic-field"><legend>หัวข้อและประเด็นที่ได้รับการตรวจสอบ <span className="required">*</span></legend><div className="evaluation-grid">{[{ title: "การปรับตัวเข้ากับองค์กรและวินัยการทำงาน", text: "การแต่งกาย ความประพฤติ การปฏิบัติตามกฎระเบียบ และการทำงานร่วมกับพี่เลี้ยง" }, { title: "ความก้าวหน้าโครงงานสหกิจ", text: "การกำหนดขอบเขตผลงาน รายงานความคืบหน้ารายสัปดาห์ และการประยุกต์ใช้วิชาชีพ" }].map((topic, i) => <label className="topic-option" key={topic.title}><input type="checkbox" checked={form.topics[i]} onChange={e => update("topics", form.topics.map((value, index) => index === i ? e.target.checked : value))}/><span><strong>{i + 1}. {topic.title}</strong><small>{topic.text}</small></span></label>)}</div></fieldset><label className="evaluation-field">บันทึกข้อสนทนาและสรุปการหารือร่วมกับพนักงานที่ปรึกษา <span className="required">*</span><textarea rows={5} required value={form.notes} onChange={e => update("notes", e.target.value)}/></label><EvaluationAttachments/></section>}
      {tab === "scores" && <section id="scores" className="detail-card evaluation-section"><EvaluationScores scores={form.scores} onChange={scores => update("scores", scores)}/><label className="evaluation-field">ความคิดเห็นเพิ่มเติมและการพัฒนานักศึกษาในอนาคต <span className="required">*</span><textarea rows={4} required value={form.feedback} onChange={e => update("feedback", e.target.value)}/></label></section>}
      {tab !== "history" && <footer className="detail-card evaluation-footer"><div><span>● แบบประเมินสำหรับ {student.name}</span>{saveState !== "idle" && <p className="save-feedback" role="status"><Icon name="check" size={16} />{saveState === "draft" ? "บันทึกแบบร่างแล้ว" : "บันทึกผลการประเมินแล้ว"}</p>}</div><div className="detail-actions"><Link href={tab === "visit" ? `/advisor/students/${student.id}` : `/advisor/evaluations/${student.id}`} className="cancel-link">{tab === "visit" ? "กลับหน้าความก้าวหน้า" : "กลับหน้าบันทึกนิเทศ"}</Link><button className="button secondary" type="button" onClick={() => save(false)}>{saveState === "draft" ? "บันทึกแล้ว" : "บันทึกแบบร่าง"}</button>{tab === "visit" ? <Link className="button primary" href={`/advisor/evaluations/${student.id}/scores`}>ไปให้คะแนน</Link> : <button className="button primary" type="submit">{saveState === "saved" ? "บันทึกแล้ว" : "บันทึกผลการประเมิน"}</button>}</div></footer>}
    </form>
  </>;

  return embedded ? content : <AdvisorShell student={student} active="evaluation">{content}</AdvisorShell>;
}
