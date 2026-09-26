"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { type Student, useAdvisorStudents } from "../data";
import FilterSelect from "./FilterSelect";
import Icon from "./Icon";
import "../advisor.css";
import "../details.css";

export type StudentSection = "overview" | "documents" | "progress" | "supervision" | "evaluation" | "history";
type AdvisorSection = "dashboard" | "students" | "tasks" | "profile";

export default function AdvisorShell({ student, active, children, title, studentSection }: { student?: Student; active: AdvisorSection; children: ReactNode; title?: string; studentSection?: StudentSection }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { students } = useAdvisorStudents();
  const links = [
    { label: "ภาพรวมและสถิติ", href: "/advisor", icon: "dashboard" as const, active: active === "dashboard" },
    { label: "นักศึกษาในความดูแล", href: "/advisor/students", icon: "users" as const, active: active === "students" },
    { label: "งานที่ต้องดำเนินการ", href: "/advisor/tasks", icon: "checklist" as const, active: active === "tasks" },
    { label: "โปรไฟล์อาจารย์", href: "/advisor/profile", icon: "users" as const, active: active === "profile" },
  ];
  const studentLinks = student ? [
    { key: "overview", label: "ภาพรวม", href: `/advisor/students/${student.id}` },
    { key: "documents", label: "เอกสารฝึกงาน", href: `/advisor/students/${student.id}/documents` },
    { key: "progress", label: "บันทึกความก้าวหน้า", href: `/advisor/students/${student.id}/progress` },
    { key: "supervision", label: "บันทึกนิเทศ", href: `/advisor/students/${student.id}/supervision` },
    { key: "evaluation", label: "แบบประเมิน", href: `/advisor/students/${student.id}/evaluation` },
    { key: "history", label: "ประวัติ", href: `/advisor/students/${student.id}/history` },
  ] as const : [];
  const sectionTitle = active === "students" ? "นักศึกษาในความดูแล" : active === "tasks" ? "งานที่ต้องดำเนินการ" : "โปรไฟล์อาจารย์";

  return <div className="advisor-app advisor-details">
    <button className="icon-button mobile-toggle" aria-expanded={open} aria-controls="advisor-menu" onClick={() => setOpen(!open)}><Icon name="menu" />เมนูอาจารย์</button>
    <aside id="advisor-menu" className={`sidebar ${open ? "is-open" : ""}`}><div><p className="nav-label">การจัดการนิเทศ</p><nav aria-label="เมนูอาจารย์">{links.map((link) => <Link key={link.href} href={link.href} className={link.active ? "active" : ""}><Icon name={link.icon} />{link.label}</Link>)}</nav></div><div className="sidebar-footer"><strong>มหาวิทยาลัยวลัยลักษณ์</strong><span>หน่วยสหกิจศึกษาและการฝึกงาน</span></div></aside>
    <main className="main-content detail-main">
      <div className="detail-context"><Link href="/advisor" aria-label="กลับหน้าภาพรวม"><div className="breadcrumb"><Icon name="home" size={16} /></div></Link><div className="breadcrumb"><Link href="/advisor">ภาพรวมและสถิติ</Link>{active !== "dashboard" && <><span>›</span><Link href={active === "students" ? "/advisor/students" : active === "tasks" ? "/advisor/tasks" : "/advisor/profile"}>{title || sectionTitle}</Link></>}{student && <><span>›</span><strong>{student.name}</strong></>}</div>{student && <div className="detail-context-actions"><FilterSelect className="student-switcher" label="เปลี่ยนนักศึกษา" value={student.id} options={students.map((item) => ({ value: item.id, label: `${item.name} (${item.id})` }))} onChange={(id) => router.push(`/advisor/students/${id}${studentSection && studentSection !== "overview" ? `/${studentSection}` : ""}`)} /></div>}</div>
      {student && <nav className="student-workspace-nav" aria-label="ข้อมูลนักศึกษา">{studentLinks.map((link) => <Link key={link.key} href={link.href} className={studentSection === link.key ? "active" : ""}>{link.label}</Link>)}</nav>}
      {children}
    </main>
  </div>;
}
