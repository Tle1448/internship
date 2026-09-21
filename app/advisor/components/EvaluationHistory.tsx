"use client";

import { useEffect, useState } from "react";
import type { Student } from "../data";
import { advisorDataEvent } from "../advisor-store";
import { readEvaluationHistory, type EvaluationHistoryEntry } from "../evaluation-store";
import AdvisorShell from "./AdvisorShell";
import Icon from "./Icon";
import StudentHeader from "./StudentHeader";

export default function EvaluationHistory({ student }: { student: Student }) {
  const [history, setHistory] = useState<EvaluationHistoryEntry[]>([]);
  useEffect(() => {
    const refresh = () => setHistory(readEvaluationHistory(student.id));
    const timer = window.setTimeout(refresh, 0);
    window.addEventListener(advisorDataEvent, refresh);
    return () => { window.clearTimeout(timer); window.removeEventListener(advisorDataEvent, refresh); };
  }, [student.id]);
  return <AdvisorShell student={student} active="students" studentSection="history">
    <div className="evaluation-heading"><div><h1>ประวัติการประเมิน</h1><p>รายการผลการประเมินที่บันทึกไว้สำหรับนักศึกษาคนนี้</p></div></div>
    <StudentHeader student={student} compact />
    <section className="detail-card evaluation-history"><div className="section-title"><span className="detail-icon"><Icon name="clock" /></span><div><h2>ผลการประเมินย้อนหลัง</h2><p>เรียงจากรายการล่าสุด</p></div></div>{history.length ? history.map((entry, index) => <div className="attachment-row" key={`${entry.savedAt}-${index}`}><Icon name="check" /><span>{new Date(entry.savedAt).toLocaleString("th-TH")}</span><strong>{entry.total}/100 · เกรด {entry.grade}</strong></div>) : <div className="empty-state"><Icon name="clock" size={28} /><strong>ยังไม่มีประวัติการประเมิน</strong><p>เมื่อบันทึกผลประเมินแล้ว รายการจะแสดงที่หน้านี้</p></div>}</section>
  </AdvisorShell>;
}
