"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { placementStatusLabels, progressHealthLabels, progressPercent, useAdvisorStudents } from "../data";
import AdvisorShell from "./AdvisorShell";
import Icon from "./Icon";

export default function AdvisorDashboard() {
  const { students, loading, error } = useAdvisorStudents();
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => students.filter((student) => `${student.id} ${student.name} ${student.company}`.toLowerCase().includes(query.toLowerCase())), [students, query]);
  const stats = [
    { label: "Students", value: students.length, icon: "users" as const },
    { label: "Needs attention", value: students.filter((student) => student.progressHealth === "attention").length, icon: "warning" as const },
    { label: "Supervision pending", value: students.filter((student) => student.supervisionStatus === "pending").length, icon: "calendar" as const },
    { label: "Evaluation pending", value: students.filter((student) => student.evaluationStatus === "pending").length, icon: "checklist" as const },
  ];
  return <AdvisorShell active="dashboard">
    <section className="page-heading"><div><h1>Advisor dashboard</h1><p>Students assigned to your account from Supabase.</p></div><Link className="button primary" href="/advisor/tasks"><Icon name="checklist" />View tasks</Link></section>
    {error && <p className="feedback">Unable to load data: {error}</p>}
    <section className="stats" aria-label="Advisor summary">{stats.map((item) => <article key={item.label} className="stat-card all"><span className="stat-top"><span>{item.label}</span><span className="stat-icon"><Icon name={item.icon} size={22} /></span></span><span className="stat-number">{loading ? "..." : item.value}</span></article>)}</section>
    <section className="filter-card"><label className="search-field"><Icon name="search" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search student or company" /></label><span>{filtered.length} result(s)</span></section>
    <section className="table-card"><div className="table-scroll"><table><thead><tr><th>Student</th><th>Company</th><th>Progress</th><th>Status</th></tr></thead><tbody>{filtered.map((student) => <tr key={student.recordId}><td><Link className="student-cell" href={`/advisor/students/${student.id}`}><span><strong>{student.name}</strong><small>{student.id} · {student.major}</small></span></Link></td><td><strong>{student.company}</strong><small>{student.role}</small></td><td><div className="dashboard-progress"><span>Week {student.currentWeek}/16 · {progressPercent(student)}%</span><progress value={student.progress} max={100} /></div></td><td><span className={`attention-badge ${student.progressHealth === "attention" ? "followup" : "on-track"}`}>{progressHealthLabels[student.progressHealth]}</span><span className={`attention-badge ${student.placementStatus === "approved" ? "document-approved" : "pending"}`}>{placementStatusLabels[student.placementStatus]}</span></td></tr>)}</tbody></table>{!loading && !filtered.length && <p className="empty-state">No assigned students found.</p>}</div></section>
  </AdvisorShell>;
}
