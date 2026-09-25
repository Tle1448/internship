"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";

export default function AdminDashboardActions() {
  const [notice, setNotice] = useState("");

  function exportReport() {
    const rows = [["รายงานภาพรวมระบบ", ""], ["รายการ", "จำนวน", "หน่วย"], ["นักศึกษาทั้งหมด", "450", "คน"], ["สถานประกอบการ", "86", "แห่ง"], ["ตำแหน่งงานเปิดรับ", "42", "ตำแหน่ง"], ["เอกสารรอตรวจสอบ", "28", "ฉบับ"]];
    const csv = `\uFEFF${rows.map((row) => row.map((value) => `"${value}"`).join(",")).join("\n")}`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = Object.assign(document.createElement("a"), { href: url, download: "รายงานภาพรวมระบบ.csv" });
    link.click();
    URL.revokeObjectURL(url);
    setNotice("ดาวน์โหลดรายงานแล้ว");
  }

  return <><div className="flex gap-3"><Link href="/admin/users" className="inline-flex h-10 items-center rounded-lg bg-[#3D348B] px-5 text-xs font-semibold text-white transition-colors hover:bg-[#7678ED]">+ เพิ่มผู้ใช้งาน</Link><button type="button" onClick={exportReport} className="h-10 rounded-lg border border-[#DDD8FA] bg-[#F1EEFC] px-5 text-xs font-semibold text-[#3D348B] transition-colors hover:bg-[#DDD8FA]">ส่งออกรายงาน</button></div>{notice && <div role="status" className="fixed bottom-5 right-5 z-50 rounded-lg bg-[#443B92] px-4 py-3 text-sm font-semibold text-white shadow-lg">{notice}<button type="button" onClick={() => setNotice("")} className="ml-3 text-white/80 hover:text-white" aria-label="ปิดข้อความ">×</button></div>}</>;
}

export function ApplicationCycleDialog({ onClose, onSaved }: { onClose: () => void; onSaved: (name: string) => void }) {
  const [academicYear, setAcademicYear] = useState("2569");
  const [semester, setSemester] = useState("ภาคการศึกษาที่ 1");
  const [opensOn, setOpensOn] = useState("2026-10-01");
  const [closesOn, setClosesOn] = useState("2026-11-30");
  const [documentDeadline, setDocumentDeadline] = useState("2026-12-15");
  const inputClass = "mt-1 w-full rounded-lg border border-[#EAEAEA] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#443B92] focus:ring-2 focus:ring-[#443B92]/20";

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = `${semester}/${academicYear}`;
    window.localStorage.setItem("wu-admin-application-cycle", JSON.stringify({ academicYear, semester, opensOn, closesOn, documentDeadline }));
    onSaved(name);
  }

  return <div role="dialog" aria-modal="true" aria-labelledby="application-cycle-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><form onSubmit={save} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><h2 id="application-cycle-title" className="text-xl font-bold">ตั้งค่ารอบการสมัคร</h2><p className="mt-1 text-sm text-[#555]">กำหนดช่วงเวลาสำหรับการสมัครฝึกงาน</p></div><button type="button" onClick={onClose} aria-label="ปิด" className="text-xl text-gray-500 hover:text-black">×</button></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold">ปีการศึกษา<input required value={academicYear} onChange={(event) => setAcademicYear(event.target.value)} className={inputClass} /></label><label className="text-sm font-semibold">ภาคการศึกษา<select value={semester} onChange={(event) => setSemester(event.target.value)} className={inputClass}><option>ภาคการศึกษาที่ 1</option><option>ภาคการศึกษาที่ 2</option><option>ภาคฤดูร้อน</option></select></label><label className="text-sm font-semibold">วันเปิดรับสมัคร<input required type="date" value={opensOn} onChange={(event) => setOpensOn(event.target.value)} className={inputClass} /></label><label className="text-sm font-semibold">วันปิดรับสมัคร<input required type="date" min={opensOn} value={closesOn} onChange={(event) => setClosesOn(event.target.value)} className={inputClass} /></label><label className="text-sm font-semibold sm:col-span-2">วันปิดส่งเอกสาร<input required type="date" min={closesOn} value={documentDeadline} onChange={(event) => setDocumentDeadline(event.target.value)} className={inputClass} /></label></div><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded-lg border border-[#EAEAEA] px-4 py-2.5 text-sm font-semibold hover:bg-gray-50">ยกเลิก</button><button type="submit" className="rounded-lg bg-[#443B92] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#373077]">บันทึกรอบสมัคร</button></div></form></div>;
}
