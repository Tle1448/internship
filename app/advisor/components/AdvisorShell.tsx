"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { type Student, useAdvisorStudents } from "../data";
import FilterSelect from "./FilterSelect";
import Icon from "./Icon";
import "../advisor.css";
import "../details.css";

export type StudentSection = "overview" | "progress" | "supervision" | "evaluation" | "history";

export default function AdvisorShell({ student, active, children, title, studentSection }: { student?: Student; active: "dashboard" | "students" | "tasks"; children: ReactNode; title?: string; studentSection?: StudentSection }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { students } = useAdvisorStudents();
  const links = [
    { label: "Dashboard", href: "/advisor", icon: "dashboard" as const, active: active === "dashboard" },
    { label: "My students", href: "/advisor/students", icon: "users" as const, active: active === "students" },
    { label: "Tasks", href: "/advisor/tasks", icon: "checklist" as const, active: active === "tasks" },
  ];
  const studentLinks = student ? [
    { key: "overview", label: "Overview", href: `/advisor/students/${student.id}` },
    { key: "progress", label: "Weekly Logs", href: `/advisor/students/${student.id}/progress` },
    { key: "supervision", label: "Supervision", href: `/advisor/students/${student.id}/supervision` },
    { key: "evaluation", label: "Evaluation", href: `/advisor/students/${student.id}/evaluation` },
    { key: "history", label: "History", href: `/advisor/students/${student.id}/history` },
  ] as const : [];

  return <div className="advisor-app advisor-details">
    <button className="icon-button mobile-toggle" aria-expanded={open} aria-controls="advisor-menu" onClick={() => setOpen(!open)}><Icon name="menu" />Menu</button>
    <aside id="advisor-menu" className={`sidebar ${open ? "is-open" : ""}`}><div><p className="nav-label">Advisor workspace</p><nav aria-label="Advisor navigation">{links.map((link) => <Link key={link.href} href={link.href} className={link.active ? "active" : ""}><Icon name={link.icon} />{link.label}</Link>)}</nav></div><div className="sidebar-footer"><strong>WU Internship</strong><span>Advisor workspace</span></div></aside>
    <main className="main-content detail-main">
      <div className="detail-context"><Link href="/advisor" aria-label="Go to dashboard"><div className="breadcrumb"><Icon name="home" size={16} /></div></Link><div className="breadcrumb"><Link href="/advisor">Dashboard</Link>{active !== "dashboard" && <><span>›</span><Link href={active === "students" ? "/advisor/students" : "/advisor/tasks"}>{title || (active === "students" ? "Students" : "Tasks")}</Link></>}{student && <><span>›</span><strong>{student.name}</strong></>}</div><div className="detail-context-actions"><details className="detail-environment"><summary>Supabase data</summary><p>Advisor data is loaded from and saved to Supabase.</p></details>{student && <FilterSelect className="student-switcher" label="Change student" value={student.id} options={students.map((item) => ({ value: item.id, label: `${item.name} (${item.id})` }))} onChange={(id) => router.push(`/advisor/students/${id}${studentSection && studentSection !== "overview" ? `/${studentSection}` : ""}`)} />}</div></div>
      {student && <nav className="student-workspace-nav" aria-label="Student workspace">{studentLinks.map((link) => <Link key={link.key} href={link.href} className={studentSection === link.key ? "active" : ""}>{link.label}</Link>)}</nav>}
      {children}
    </main>
  </div>;
}
