"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { progressPercent, type Student } from "../data";
import { advisorDataEvent, readWeeklyRecords, readWorkflowStatus } from "../advisor-store";
import AdvisorShell from "./AdvisorShell";
import Icon from "./Icon";
import StudentHeader from "./StudentHeader";

export default function StudentOverview({ student }: { student: Student }) {
  const [records, setRecords] = useState(() => readWeeklyRecords(student));
  useEffect(() => {
    const refresh = () => setRecords(readWeeklyRecords(student));
    window.addEventListener(advisorDataEvent, refresh);
    return () => window.removeEventListener(advisorDataEvent, refresh);
  }, [student]);
  const pendingLogs = records.filter(record => record.status === "pending" || record.status === "revision").length;
  const approvedLogs = records.filter(record => record.status === "approved").length;
  const upcomingLogs = records.filter(record => record.status === "upcoming").length;
  const workflow = readWorkflowStatus(student);
  const actions = [
    { href: `/advisor/students/${student.id}/progress`, icon: "file" as const, title: "Weekly Logs", description: "ตรวจบันทึก ให้ข้อเสนอแนะ และอนุมัติงานรายสัปดาห์", status: pendingLogs ? `${pendingLogs} รายการต้องตรวจ` : "ตรวจครบแล้ว", badge: pendingLogs ? "pending" : "approved" },
    { href: `/advisor/students/${student.id}/supervision`, icon: "calendar" as const, title: "บันทึกนิเทศ", description: "บันทึกวันที่ รูปแบบ ประเด็น และผลการติดตามการนิเทศ", status: workflow.supervisionStatus === "completed" ? "นิเทศแล้ว" : "รอนิเทศ", badge: workflow.supervisionStatus === "completed" ? "approved" : "pending" },
    { href: `/advisor/students/${student.id}/evaluation`, icon: "checklist" as const, title: "แบบประเมิน", description: "ประเมินผลการปฏิบัติงานและบันทึกคะแนน", status: workflow.evaluationStatus === "completed" ? "ประเมินแล้ว" : "รอประเมิน", badge: workflow.evaluationStatus === "completed" ? "approved" : "pending" },
  ];

  return <AdvisorShell student={student} active="students" studentSection="overview">
    <StudentHeader student={student} />
    <section className="student-overview-grid" aria-label="ภาพรวมนักศึกษา">
      <div className="detail-card overview-panel">
        <div className="section-title"><span className="detail-icon"><Icon name="cap" /></span><div><h2>ข้อมูลการฝึกงาน</h2><p>ข้อมูลหลักของนักศึกษาและสถานประกอบการ</p></div></div>
        <dl className="overview-definition">
          <div><dt>สถานประกอบการ</dt><dd>{student.company}</dd></div>
          <div><dt>ตำแหน่ง</dt><dd>{student.role}</dd></div>
          <div><dt>หัวข้อโครงงาน</dt><dd>{student.project}</dd></div>
          <div><dt>จังหวัด</dt><dd>{student.province}</dd></div>
        </dl>
      </div>
      <div className="detail-card overview-panel progress-snapshot">
        <div className="section-title"><span className="detail-icon"><Icon name="clock" /></span><div><h2>ความก้าวหน้า</h2><p>ภาพรวมภาคการศึกษา 1/2567</p></div></div>
        <div className="snapshot-value"><strong>{progressPercent(student)}%</strong><span>สัปดาห์ที่ {student.currentWeek} จาก 16</span></div>
        <progress value={student.currentWeek} max={16} aria-label="ความก้าวหน้าการฝึกงาน" />
        <div className="snapshot-stats"><span><b>{pendingLogs}</b> ต้องตรวจ</span><span><b>{approvedLogs}</b> อนุมัติแล้ว</span><span><b>{upcomingLogs}</b> ยังไม่ถึงกำหนด</span></div>
      </div>
    </section>
    <section className="workspace-actions" aria-labelledby="workspace-actions-title">
      <div className="weekly-heading"><div><h2 id="workspace-actions-title">ดำเนินการต่อ</h2><p>เลือกงานที่ต้องการทำสำหรับนักศึกษาคนนี้</p></div></div>
      <div className="workspace-action-list">{actions.map(action => <Link className="workspace-action" href={action.href} key={action.href}><span className="task-icon"><Icon name={action.icon} /></span><span><strong>{action.title}</strong><small>{action.description}</small></span><span className={`badge ${action.badge}`}>{action.status}</span><Icon name="chevron" size={18} /></Link>)}</div>
    </section>
  </AdvisorShell>;
}
