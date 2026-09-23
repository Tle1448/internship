"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { progressPercent, type Student } from "../data";
import AdvisorShell from "./AdvisorShell";
import Icon from "./Icon";
import StudentHeader from "./StudentHeader";

export default function StudentOverview({ student }: { student: Student }) {
  const [counts, setCounts] = useState({ pending: 0, approved: 0, upcoming: 0 });
  useEffect(() => { void (async () => {
    const { data } = await supabase.from("weekly_logs").select("status").eq("record_id", student.recordId);
    const rows = data || [];
    setCounts({ pending: rows.filter((row) => row.status === "pending" || row.status === "revision").length, approved: rows.filter((row) => row.status === "approved").length, upcoming: rows.filter((row) => row.status === "upcoming").length });
  })(); }, [student.recordId]);
  const actions = [
    { href: `/advisor/students/${student.id}/progress`, icon: "file" as const, title: "Weekly logs", value: counts.pending ? `${counts.pending} need review` : "All reviewed" },
    { href: `/advisor/students/${student.id}/supervision`, icon: "calendar" as const, title: "Supervision", value: student.supervisionStatus === "completed" ? "Completed" : "Pending" },
    { href: `/advisor/students/${student.id}/evaluation`, icon: "checklist" as const, title: "Evaluation", value: student.evaluationStatus === "completed" ? "Completed" : "Pending" },
  ];
  return <AdvisorShell student={student} active="students" studentSection="overview"><StudentHeader student={student} /><section className="student-overview-grid"><div className="detail-card overview-panel"><div className="section-title"><span className="detail-icon"><Icon name="cap" /></span><div><h2>Internship details</h2><p>Current placement from Supabase.</p></div></div><dl className="overview-definition"><div><dt>Company</dt><dd>{student.company}</dd></div><div><dt>Position</dt><dd>{student.role}</dd></div><div><dt>Project</dt><dd>{student.project}</dd></div><div><dt>Province</dt><dd>{student.province}</dd></div></dl></div><div className="detail-card overview-panel progress-snapshot"><div className="section-title"><span className="detail-icon"><Icon name="clock" /></span><div><h2>Progress</h2><p>Current internship progress.</p></div></div><div className="snapshot-value"><strong>{progressPercent(student)}%</strong><span>Week {student.currentWeek} of 16</span></div><progress value={student.progress} max={100} /><div className="snapshot-stats"><span><b>{counts.pending}</b> to review</span><span><b>{counts.approved}</b> approved</span><span><b>{counts.upcoming}</b> upcoming</span></div></div></section><section className="workspace-actions"><div className="weekly-heading"><h2>Continue work</h2></div><div className="workspace-action-list">{actions.map((action) => <Link className="workspace-action" href={action.href} key={action.href}><span className="task-icon"><Icon name={action.icon} /></span><span><strong>{action.title}</strong><small>{action.value}</small></span><Icon name="chevron" size={18} /></Link>)}</div></section></AdvisorShell>;
}
