"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { students, type Student } from "../data";
import FilterSelect from "./FilterSelect";
import Icon from "./Icon";
import "../advisor.css";
import "../details.css";

export type StudentSection = "overview" | "progress" | "supervision" | "evaluation" | "history";

export default function AdvisorShell({ student, active, children, title, studentSection }: { student?: Student; active: "dashboard" | "students" | "tasks"; children: ReactNode; title?: string; studentSection?: StudentSection }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const links = [
    { label: "ภาพรวมและสถิติ", href: "/advisor", icon: "dashboard" as const, active: active === "dashboard" },
    { label: "นักศึกษาในความดูแล", href: "/advisor/students", icon: "users" as const, active: active === "students" },
    { label: "งานที่ต้องดำเนินการ", href: "/advisor/tasks", icon: "checklist" as const, active: active === "tasks" },
  ];
  const studentLinks = student ? [
    { key: "overview", label: "ภาพรวม", href: `/advisor/students/${student.id}` },
    { key: "progress", label: "Weekly Logs", href: `/advisor/students/${student.id}/progress` },
    { key: "supervision", label: "บันทึกนิเทศ", href: `/advisor/students/${student.id}/supervision` },
    { key: "evaluation", label: "แบบประเมิน", href: `/advisor/students/${student.id}/evaluation` },
    { key: "history", label: "ประวัติ", href: `/advisor/students/${student.id}/history` },
  ] as const : [];
  return <div className="advisor-app advisor-details">
    <button className="icon-button mobile-toggle" aria-expanded={open} aria-controls="advisor-detail-menu" onClick={() => setOpen(!open)}><Icon name="menu"/>เมนูอาจารย์</button>
    <aside id="advisor-detail-menu" className={`sidebar ${open ? "is-open" : ""}`}><div><p className="nav-label">การจัดการนิเทศ</p><nav aria-label="เมนูอาจารย์">{links.map(link => <Link key={link.href} href={link.href} className={link.active ? "active" : ""} aria-current={link.active ? "page" : undefined}><Icon name={link.icon}/>{link.label}</Link>)}</nav></div><div className="sidebar-footer"><strong>วิทยาลัยนวัตกรรมวิชาชีพ</strong><span>หน่วยสหกิจศึกษาและการฝึกงาน</span></div></aside>
    <main className="main-content detail-main">
      <div className="detail-context">
        <Link href="/advisor" aria-label="กลับหน้าภาพรวม">
          <div className="breadcrumb">
            <Icon name="home" size={16} />
          </div>
        </Link>
        <div className="breadcrumb">{active === "dashboard" ? <strong>ภาพรวมและสถิติ</strong> : <><Link href="/advisor">ภาพรวมและสถิติ</Link><span>›</span><Link href={active === "students" ? "/advisor/students" : "/advisor/tasks"}>{title ?? (active === "students" ? "นักศึกษาในความดูแล" : "งานที่ต้องดำเนินการ")}</Link>{student && <><span>›</span><strong>{student.name}</strong></>}</>}</div><div className="detail-context-actions"><details className="detail-environment"><summary>ข้อมูลตัวอย่าง · 1/2567</summary><p>การบันทึกเก็บเฉพาะในเบราว์เซอร์นี้ และยังไม่เชื่อมต่อฐานข้อมูล</p></details>{student && <FilterSelect className="student-switcher" label="เปลี่ยนนักศึกษา" value={student.id} options={students.map(item => ({ value: item.id, label: `${item.name} (${item.id})` }))} onChange={id => router.push(`/advisor/students/${id}${studentSection && studentSection !== "overview" ? `/${studentSection}` : ""}`)} />}</div></div>
      {student && <nav className="student-workspace-nav" aria-label="ข้อมูลของนักศึกษา">{studentLinks.map(link => <Link key={link.key} href={link.href} className={studentSection === link.key ? "active" : ""} aria-current={studentSection === link.key ? "page" : undefined}>{link.label}</Link>)}</nav>}
      {children}
    </main>
  </div>;
}
