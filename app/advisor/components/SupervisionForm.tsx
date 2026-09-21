"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import type { Student } from "../data";
import { readWorkflowStatus, writeWorkflowStatus } from "../advisor-store";
import { readEvaluation, writeEvaluation, type EvaluationRecord } from "../evaluation-store";
import AdvisorShell from "./AdvisorShell";
import EvaluationAttachments from "./EvaluationAttachments";
import Icon from "./Icon";
import StudentHeader from "./StudentHeader";

export default function SupervisionForm({ student }: { student: Student }) {
  const [form, setForm] = useState<EvaluationRecord>(() => readEvaluation(student.id));
  const [message, setMessage] = useState("");
  const [completed, setCompleted] = useState(() => readWorkflowStatus(student).supervisionStatus === "completed");
  function update<K extends keyof EvaluationRecord>(field: K, value: EvaluationRecord[K]) { setForm(previous => ({ ...previous, [field]: value })); }
  function saveDraft() {
    try { writeEvaluation(student.id, form); setMessage("บันทึกแบบร่างไว้ในเบราว์เซอร์นี้แล้ว"); } catch { setMessage("บันทึกแบบร่างไม่สำเร็จ"); }
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.notes.trim() || !form.topics.some(Boolean)) { setMessage("กรุณาเลือกหัวข้อและกรอกสรุปการนิเทศให้ครบถ้วน"); return; }
    try { writeEvaluation(student.id, form); writeWorkflowStatus(student, { supervisionStatus: "completed" }); setCompleted(true); setMessage("บันทึกการนิเทศไว้ในเบราว์เซอร์นี้แล้ว"); } catch { setMessage("บันทึกไม่สำเร็จ กรุณาตรวจสอบพื้นที่จัดเก็บของเบราว์เซอร์"); }
  }

  return <AdvisorShell student={student} active="students" studentSection="supervision">
    <div className="evaluation-heading"><div><h1>บันทึกการนิเทศงาน</h1><p>บันทึกวัน รูปแบบ ประเด็นการหารือ และผลการติดตามจากการนิเทศ</p></div><div className="detail-actions"><button className="button secondary" onClick={() => { setForm(readEvaluation(student.id)); setMessage("โหลดแบบร่างแล้ว"); }}><Icon name="reset" />โหลดแบบร่าง</button><button className="button secondary" onClick={() => window.print()}><Icon name="file" />พิมพ์ / PDF</button></div></div>
    {message && <p role="status" className="feedback">{message}</p>}
    <StudentHeader student={student} compact />
    <form onSubmit={submit}>
      <section className="detail-card evaluation-section"><div className="section-title"><span className="detail-icon"><Icon name="calendar" /></span><div><h2>รายละเอียดการเข้าตรวจเยี่ยม</h2><p>ข้อมูลการนิเทศอย่างเป็นทางการสำหรับนักศึกษาคนนี้</p></div><span className={`badge ${completed ? "approved" : "pending"}`}>{completed ? "บันทึกแล้ว" : "รอบันทึกสรุป"}</span></div>
        <div className="evaluation-grid"><label>วันที่ดำเนินการนิเทศ <span className="required">*</span><input required type="date" value={form.date} onChange={event => update("date", event.target.value)} /></label><fieldset><legend>รูปแบบการนิเทศ <span className="required">*</span></legend><div className="mode-options"><label><input type="radio" name="visit-mode" checked={form.mode === "onsite"} onChange={() => update("mode", "onsite")} />ณ สถานประกอบการ</label><label><input type="radio" name="visit-mode" checked={form.mode === "online"} onChange={() => update("mode", "online")} />ระบบออนไลน์</label></div></fieldset></div>
        <fieldset className="topic-field"><legend>หัวข้อที่ตรวจสอบ <span className="required">*</span></legend><div className="evaluation-grid">{[{ title: "การปรับตัวและวินัยในการทำงาน", text: "ความประพฤติ การปฏิบัติตามกฎ และการทำงานร่วมกับทีม" }, { title: "ความก้าวหน้าของโครงงาน", text: "ขอบเขตผลงาน ปัญหาที่พบ และแผนดำเนินงานต่อ" }].map((topic, index) => <label className="topic-option" key={topic.title}><input type="checkbox" checked={form.topics[index]} onChange={event => update("topics", form.topics.map((value, itemIndex) => itemIndex === index ? event.target.checked : value))} /><span><strong>{topic.title}</strong><small>{topic.text}</small></span></label>)}</div></fieldset>
        <label className="evaluation-field">สรุปการหารือและข้อเสนอแนะ <span className="required">*</span><textarea required rows={5} value={form.notes} onChange={event => update("notes", event.target.value)} /></label><EvaluationAttachments />
      </section>
      <footer className="detail-card evaluation-footer"><span>บันทึกนิเทศสำหรับ {student.name}</span><div className="detail-actions"><Link className="cancel-link" href={`/advisor/students/${student.id}/progress`}>กลับ Weekly Logs</Link><button className="button secondary" type="button" onClick={saveDraft}>บันทึกแบบร่าง</button><button className="button primary" type="submit">บันทึกการนิเทศ</button><Link className="button secondary" href={`/advisor/students/${student.id}/evaluation`}>ไปแบบประเมิน</Link></div></footer>
    </form>
  </AdvisorShell>;
}
