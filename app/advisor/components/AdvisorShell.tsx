"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { students, type Student } from "../data";
import Icon from "./Icon";
import "../advisor.css";
import "../details.css";

export default function AdvisorShell({ student, active, children }: { student: Student; active: "progress" | "evaluation"; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const links = [
    { label: "ภาพรวมและสถิติ", href: "/advisor", icon: "dashboard" as const, active: false },
    { label: "ความก้าวหน้านักศึกษา", href: `/advisor/students/${student.id}`, icon: "users" as const, active: active === "progress" },
    { label: "บันทึกนิเทศและแบบประเมิน", href: `/advisor/evaluations/${student.id}`, icon: "checklist" as const, active: active === "evaluation" },
  ];
  return <div className="advisor-app advisor-details">
    <button className="icon-button mobile-toggle" aria-expanded={open} aria-controls="advisor-detail-menu" onClick={() => setOpen(!open)}><Icon name="menu"/>เมนูอาจารย์</button>
    <aside id="advisor-detail-menu" className={`sidebar ${open ? "is-open" : ""}`}><div><p className="nav-label">การจัดการนิเทศ</p><nav aria-label="เมนูอาจารย์">{links.map(link => <Link key={link.href} href={link.href} className={link.active ? "active" : ""} aria-current={link.active ? "page" : undefined}><Icon name={link.icon}/>{link.label}</Link>)}</nav></div><div className="sidebar-footer"><strong>วิทยาลัยนวัตกรรมวิชาชีพ</strong><span>หน่วยสหกิจศึกษาและการฝึกงาน</span></div></aside>
    <main className="main-content detail-main"><div className="detail-context"><Link href="/advisor" className="detail-back" aria-label="กลับหน้าภาพรวม">←</Link><div className="breadcrumb"><Link href="/advisor">หน้าหลัก</Link><span>›</span><span>{active === "progress" ? "ความก้าวหน้านักศึกษา" : "บันทึกนิเทศและแบบประเมิน"}</span></div><label className="student-picker">นักศึกษา<select value={student.id} onChange={e => router.push(`/advisor/${active === "progress" ? "students" : "evaluations"}/${e.target.value}`)}>{students.map(s => <option value={s.id} key={s.id}>{s.name} ({s.id})</option>)}</select></label></div>
      <p className="detail-demo">ข้อมูลตัวอย่าง ภาคการศึกษา 1/2567 · การบันทึกเก็บเฉพาะในเบราว์เซอร์นี้ ยังไม่เชื่อมต่อฐานข้อมูล</p>
      {children}
    </main>
  </div>;
}

export function StudentSummary({ student, compact = false }: { student: Student; compact?: boolean }) {
  return <section className={`detail-card student-summary ${compact ? "compact" : ""}`} aria-label="ข้อมูลนักศึกษา"><span className="detail-avatar" aria-hidden="true">{student.name.replace(/^(นาย|นางสาว)/, "").slice(0, 2)}</span><div className="student-summary-copy"><h2>{student.name} <span className="detail-tag">{student.id}</span></h2><p>{compact ? student.company : `สาขาวิชา${student.major} · สำนักวิชาสารสนเทศศาสตร์`}</p><small>{compact ? `ตำแหน่ง: ${student.role}` : student.company}</small></div><div className="student-current"><small>สถานะการฝึกงานปัจจุบัน</small><span className="badge approved">● กำลังฝึกงานสัปดาห์ที่ 8/16</span></div></section>;
}
