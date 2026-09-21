"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { progressPercent, type Student } from "../data";
import type { WeeklyRecord } from "../detail-data";
import { readAdvisorNotes, readWeeklyRecords, writeAdvisorNotes, writeWeeklyRecords } from "../advisor-store";
import AdvisorShell from "./AdvisorShell";
import Icon from "./Icon";
import StudentHeader from "./StudentHeader";

type RecordFilter = "all" | WeeklyRecord["status"];
type NotesByWeek = Record<number, string[]>;

const statusCopy = { approved: "อนุมัติแล้ว", pending: "รอตรวจ", revision: "ส่งกลับแก้ไข", upcoming: "ยังไม่ถึงกำหนด" } as const;

export default function StudentProgress({ student }: { student: Student }) {
  const [records, setRecords] = useState(() => readWeeklyRecords(student));
  const [filter, setFilter] = useState<RecordFilter>("all");
  const [showAll, setShowAll] = useState(false);
  const [openWeek, setOpenWeek] = useState<number | null>(student.currentWeek);
  const [selected, setSelected] = useState<WeeklyRecord | null>(null);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [savedNotes, setSavedNotes] = useState<NotesByWeek>(() => readAdvisorNotes(student.id));
  const dialog = useRef<HTMLDialogElement>(null);

  const filtered = records.filter(record => filter === "all" || record.status === filter);
  const visible = filter === "all" && !showAll ? filtered.filter(record => record.week >= Math.max(1, student.currentWeek - 1) && record.week <= Math.min(16, student.currentWeek + 1)) : filtered;
  const pendingCount = records.filter(record => record.status === "pending").length;
  const revisionCount = records.filter(record => record.status === "revision").length;
  const approvedCount = records.filter(record => record.status === "approved").length;
  const upcomingCount = records.filter(record => record.status === "upcoming").length;

  function approve(week: number) {
    try {
      const next = records.map(record => record.week === week ? { ...record, status: "approved" as const, comment: "ตรวจสอบและอนุมัติโดยอาจารย์ที่ปรึกษาแล้ว" } : record);
      writeWeeklyRecords(student.id, next);
      setRecords(next);
      setMessage(`อนุมัติบันทึกสัปดาห์ที่ ${week} แล้ว`);
    } catch {
      setMessage("บันทึกไม่ได้ กรุณาตรวจสอบพื้นที่จัดเก็บของเบราว์เซอร์");
    }
  }

  function restore() {
    setRecords(readWeeklyRecords(student));
    setSavedNotes(readAdvisorNotes(student.id));
    setMessage("โหลดข้อมูลที่บันทึกในเบราว์เซอร์แล้ว");
  }

  function requestRevision(event: FormEvent<HTMLFormElement>, week: number) {
    event.preventDefault();
    if (!note.trim()) return;
    try {
      const nextNotes = { ...savedNotes, [week]: [...(savedNotes[week] ?? []), note.trim()] };
      const nextRecords = records.map(record => record.week === week ? { ...record, status: "revision" as const, comment: note.trim() } : record);
      writeAdvisorNotes(student.id, nextNotes);
      writeWeeklyRecords(student.id, nextRecords);
      setSavedNotes(nextNotes);
      setRecords(nextRecords);
      setNote("");
      setMessage(`ส่งบันทึกสัปดาห์ที่ ${week} กลับให้นักศึกษาแก้ไขแล้ว`);
    } catch {
      setMessage("ส่งข้อเสนอแนะไม่สำเร็จ");
    }
  }

  const tabs: { key: RecordFilter; label: string; count: number }[] = [
    { key: "all", label: "ทั้งหมด", count: records.length },
    { key: "pending", label: "รอตรวจ", count: pendingCount },
    { key: "revision", label: "ส่งกลับแก้ไข", count: revisionCount },
    { key: "approved", label: "อนุมัติแล้ว", count: approvedCount },
    { key: "upcoming", label: "ยังไม่ถึงกำหนด", count: upcomingCount },
  ];

  return <AdvisorShell student={student} active="students" studentSection="progress">
    <div className="detail-actions progress-actions">
      <button className="button secondary" onClick={restore}><Icon name="reset" />โหลดข้อมูลที่บันทึก</button>
      <Link className="button secondary" href={`/advisor/students/${student.id}/evaluation`}><Icon name="checklist" />ประเมินผลการฝึกงาน</Link>
      <Link className="button primary" href={`/advisor/students/${student.id}/supervision`}><Icon name="file" />บันทึกการนิเทศงาน</Link>
    </div>
    {message && <p className="feedback progress-feedback" role="status">{message}</p>}
    <StudentHeader student={student} />

    <section className="detail-card progress-summary progress-summary-card" aria-label="ความก้าวหน้าและสถานะบันทึก">
      <div className="progress-main"><div className="progress-heading"><span><small>ความก้าวหน้าการฝึกงาน</small><strong>สัปดาห์ที่ {student.currentWeek} จาก 16</strong></span><b>{progressPercent(student)}%</b></div><progress value={student.currentWeek} max={16} aria-label="ความก้าวหน้าการฝึกงาน" /></div>
      <div className="progress-stats"><div className="pending"><small>ต้องตรวจ</small><strong>{pendingCount + revisionCount}</strong></div><div className="approved"><small>อนุมัติแล้ว</small><strong>{approvedCount}</strong></div><div><small>ยังไม่ถึงกำหนด</small><strong>{upcomingCount}</strong></div></div>
    </section>

    <section className="weekly-section" aria-labelledby="weekly-title">
      <div className="weekly-heading"><div><h2 id="weekly-title">บันทึกประจำสัปดาห์</h2><p>เปิดอ่าน ให้ข้อเสนอแนะ และอนุมัติบันทึกของนักศึกษา</p></div><div className="detail-tabs" aria-label="กรองบันทึก">{tabs.map(tab => <button key={tab.key} aria-pressed={filter === tab.key} className={filter === tab.key ? "active" : ""} onClick={() => setFilter(tab.key)}>{tab.label} <span>{tab.count}</span></button>)}</div></div>
      <div className="weekly-list">{visible.map(record => {
        const isOpen = openWeek === record.week;
        return <article className={`weekly-card ${isOpen ? "is-open" : ""} ${record.status === "upcoming" ? "upcoming" : ""}`} key={record.week}>
          <button className="weekly-toggle" aria-expanded={isOpen} onClick={() => setOpenWeek(isOpen ? null : record.week)}><span className="week-number">W{record.week}</span><span className="weekly-summary"><strong>{record.title}</strong><small>{record.status === "upcoming" ? "กำหนดส่ง: " : "ส่งเมื่อ: "}{record.date}</small></span><span className={`badge ${record.status === "upcoming" ? "future" : record.status}`}>{statusCopy[record.status]}</span><span className="weekly-chevron"><Icon name="chevron" size={18} /></span></button>
          {isOpen && <div className="weekly-details">{record.content && <div className="log-summary"><strong>สรุปงาน</strong><p>{record.content}</p></div>}{record.comment && <div className="weekly-comment"><Icon name="file" size={18} /><div><strong>ความเห็นของอาจารย์ที่ปรึกษา</strong><p>{record.comment}</p></div></div>}{record.status !== "upcoming" && <div className="weekly-review"><button className="full-log-link" type="button" onClick={() => { setSelected(record); dialog.current?.showModal(); }}><Icon name="file" size={17} />อ่านบันทึกฉบับเต็ม</button><form onSubmit={event => requestRevision(event, record.week)}><label htmlFor={`advisor-note-${record.week}`}>ข้อเสนอแนะถึงนักศึกษา</label><textarea id={`advisor-note-${record.week}`} required placeholder="เขียนข้อเสนอแนะหรือประเด็นที่ต้องแก้ไข..." rows={3} value={note} onChange={event => setNote(event.target.value)} />{(savedNotes[record.week] ?? []).map((item, index) => <p className="saved-note" key={index}><Icon name="check" size={15} />{item}</p>)}<div className="review-actions"><button className="button revision" type="submit">ส่งกลับแก้ไข</button>{(record.status === "pending" || record.status === "revision") && <button className="button primary" type="button" onClick={() => approve(record.week)}><Icon name="check" size={17} />อนุมัติ</button>}</div></form></div>}</div>}
        </article>;
      })}</div>
      {!visible.length && <p className="weekly-empty">ไม่มีบันทึกในสถานะนี้</p>}
      {filter === "all" && <button className="show-records" onClick={() => setShowAll(!showAll)}>{showAll ? "แสดงเฉพาะสัปดาห์ล่าสุด" : "ดูบันทึกทั้งหมด 16 สัปดาห์"}</button>}
    </section>

    <dialog className="modal" ref={dialog} aria-label="บันทึกประจำสัปดาห์ฉบับเต็ม"><div className="modal-header"><h2>บันทึกสัปดาห์ที่ {selected?.week}</h2><button className="icon-button" aria-label="ปิด" onClick={() => dialog.current?.close()}><Icon name="close" /></button></div><h3>{selected?.title}</h3><p>{selected?.content}</p>{selected?.comment && <div className="weekly-comment"><p>{selected.comment}</p></div>}</dialog>
  </AdvisorShell>;
}
