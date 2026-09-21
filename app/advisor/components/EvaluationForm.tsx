"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import type { Student } from "../data";
import { writeWorkflowStatus } from "../advisor-store";
import { readEvaluation, submitEvaluation, writeEvaluation, type EvaluationRecord } from "../evaluation-store";
import AdvisorShell from "./AdvisorShell";
import EvaluationScores from "./EvaluationScores";
import Icon from "./Icon";
import StudentHeader from "./StudentHeader";

export default function EvaluationForm({ student }: { student: Student }) {
  const [form, setForm] = useState<EvaluationRecord>(() => readEvaluation(student.id));
  const [message, setMessage] = useState("");
  function update<K extends keyof EvaluationRecord>(field: K, value: EvaluationRecord[K]) { setForm(previous => ({ ...previous, [field]: value })); }
  function saveDraft() {
    try { writeEvaluation(student.id, form); setMessage("บันทึกแบบร่างไว้ในเบราว์เซอร์นี้แล้ว"); } catch { setMessage("บันทึกแบบร่างไม่สำเร็จ"); }
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.feedback.trim()) { setMessage("กรุณากรอกความคิดเห็นเพิ่มเติม"); return; }
    try { submitEvaluation(student.id, form); writeWorkflowStatus(student, { evaluationStatus: "completed" }); setMessage("บันทึกผลการประเมินแล้ว"); } catch { setMessage("บันทึกผลการประเมินไม่สำเร็จ"); }
  }

  return <AdvisorShell student={student} active="students" studentSection="evaluation">
    <div className="evaluation-heading"><div><h1>แบบประเมินผลการปฏิบัติงาน</h1><p>ให้คะแนนตามเกณฑ์และบันทึกแนวทางพัฒนานักศึกษา</p></div><div className="detail-actions"><button className="button secondary" onClick={() => { setForm(readEvaluation(student.id)); setMessage("โหลดแบบร่างแล้ว"); }}><Icon name="reset" />โหลดแบบร่าง</button><button className="button secondary" onClick={() => window.print()}><Icon name="file" />พิมพ์ / PDF</button></div></div>
    {message && <p role="status" className="feedback">{message}</p>}
    <StudentHeader student={student} compact />
    <form onSubmit={submit}><section className="detail-card evaluation-section"><EvaluationScores scores={form.scores} onChange={scores => update("scores", scores)} /><label className="evaluation-field">ความคิดเห็นเพิ่มเติมและแนวทางพัฒนา <span className="required">*</span><textarea rows={4} required value={form.feedback} onChange={event => update("feedback", event.target.value)} /></label></section>
      <footer className="detail-card evaluation-footer"><span>แบบประเมินสำหรับ {student.name}</span><div className="detail-actions"><Link className="cancel-link" href={`/advisor/students/${student.id}/supervision`}>กลับบันทึกนิเทศ</Link><button className="button secondary" type="button" onClick={saveDraft}>บันทึกแบบร่าง</button><button className="button primary" type="submit">บันทึกผลการประเมิน</button></div></footer>
    </form>
  </AdvisorShell>;
}
