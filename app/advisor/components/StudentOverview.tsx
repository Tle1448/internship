"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { progressPercent, type Student } from "../data";
import AdvisorShell from "./AdvisorShell";
import Icon from "./Icon";
import StudentHeader from "./StudentHeader";

export default function StudentOverview({ student }: { student: Student }) {
  const [counts, setCounts] = useState({ pending: 0, approved: 0, revision: 0 });

  useEffect(() => { void (async () => {
    const { data } = await supabase.from("progress_reports").select("status").eq("record_id", student.recordId);
    const rows = data ?? [];
    setCounts({
      pending: rows.filter((row) => row.status === "submitted").length,
      approved: rows.filter((row) => row.status === "approved").length,
      revision: rows.filter((row) => row.status === "revision_required").length,
    });
  })(); }, [student.recordId]);

  const actions = [
    { href: `/advisor/students/${student.id}/documents`, icon: "file" as const, title: "เอกสารฝึกงาน", value: "ตรวจเอกสารและส่งความคิดเห็น" },
    { href: `/advisor/students/${student.id}/progress`, icon: "file" as const, title: "บันทึกความก้าวหน้า", value: counts.pending ? `${counts.pending} รายการรอตรวจ` : "ตรวจครบแล้ว" },
    { href: `/advisor/students/${student.id}/supervision`, icon: "calendar" as const, title: "การนิเทศ", value: student.supervisionStatus === "completed" ? "ดำเนินการแล้ว" : "รอดำเนินการ" },
    { href: `/advisor/students/${student.id}/evaluation`, icon: "checklist" as const, title: "การประเมิน", value: student.evaluationStatus === "completed" ? "ประเมินแล้ว" : "รอประเมิน" },
  ];

  return (
    <AdvisorShell student={student} active="students" studentSection="overview">
      <StudentHeader student={student} />
      <section className="student-overview-grid">
        <div className="detail-card overview-panel">
          <div className="section-title"><span className="detail-icon"><Icon name="cap" /></span><div><h2>ข้อมูลการฝึกงาน</h2><p>ข้อมูลสถานที่ฝึกงานจาก Supabase</p></div></div>
          <dl className="overview-definition"><div><dt>บริษัท</dt><dd>{student.company}</dd></div><div><dt>ตำแหน่ง</dt><dd>{student.role}</dd></div><div><dt>โปรเจกต์</dt><dd>{student.project}</dd></div><div><dt>จังหวัด</dt><dd>{student.province}</dd></div></dl>
        </div>
        <div className="detail-card overview-panel progress-snapshot">
          <div className="section-title"><span className="detail-icon"><Icon name="clock" /></span><div><h2>ความก้าวหน้า</h2><p>ภาพรวมการฝึกงานปัจจุบัน</p></div></div>
          <div className="snapshot-value"><strong>{progressPercent(student)}%</strong><span>{counts.approved} รอบได้รับการอนุมัติ</span></div>
          <progress value={student.progress} max={100} />
          <div className="snapshot-stats"><span><b>{counts.pending}</b> รอตรวจ</span><span><b>{counts.approved}</b> อนุมัติแล้ว</span><span><b>{counts.revision}</b> รอแก้ไข</span></div>
        </div>
      </section>
      <section className="workspace-actions"><div className="weekly-heading"><h2>ดำเนินการต่อ</h2></div><div className="workspace-action-list">{actions.map((action) => <Link className="workspace-action" href={action.href} key={action.href}><span className="task-icon"><Icon name={action.icon} /></span><span><strong>{action.title}</strong><small>{action.value}</small></span><Icon name="chevron" size={18} /></Link>)}</div></section>
    </AdvisorShell>
  );
}
