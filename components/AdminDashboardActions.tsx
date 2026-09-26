"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import UserEditModal, { type EditableUser, type UserRole, type UserSaveError } from "@/components/UserEditModal";

type DashboardReport = { students: number; companies: number | null; openJobs: number; pendingDocuments: number };
const roles: UserRole[] = ["Student", "Coordinator", "Advisor", "Admin"];

export default function AdminDashboardActions({ report, reportUnavailable = false }: { report: DashboardReport; reportUnavailable?: boolean }) {
  const [notice, setNotice] = useState("");
  const [refreshing, startTransition] = useTransition();
  const [isAdding, setIsAdding] = useState(false);
  const savingUser = useRef(false);
  const router = useRouter();

  async function saveNewUser(user: EditableUser): Promise<string | UserSaveError | void> {
    if (savingUser.current) return "กำลังบันทึกผู้ใช้งาน กรุณารอสักครู่";
    savingUser.current = true;
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userCode: user.id, fullName: user.name, email: user.email, password: user.password, role: user.role.toLowerCase(), faculty: user.school, major: user.department, isActive: user.status === "Active" }),
      });
      const payload = await response.json() as { error?: string; field?: string; user?: { user_code: string } };
      if (!response.ok) return { error: payload.error ?? "บันทึกผู้ใช้งานไม่สำเร็จ", field: payload.field };
      setNotice(`เพิ่มผู้ใช้งานสำเร็จแล้ว รหัสประจำตัว: ${payload.user?.user_code ?? "—"}`);
      startTransition(() => router.refresh());
    } catch {
      return "ไม่สามารถยืนยันผลการบันทึกได้ กรุณาตรวจสอบรายชื่อผู้ใช้งานก่อนลองอีกครั้ง";
    } finally {
      savingUser.current = false;
    }
  }

  function exportReport() {
    if (reportUnavailable || report.companies === null || refreshing) return;
    const rows = [["รายงานภาพรวมระบบ", ""], ["รายการ", "จำนวน", "หน่วย"], ["นักศึกษาทั้งหมด", String(report.students), "คน"], ["สถานประกอบการ", String(report.companies), "แห่ง"], ["ตำแหน่งงานเปิดรับ", String(report.openJobs), "ตำแหน่ง"], ["เอกสารรอตรวจสอบ", String(report.pendingDocuments), "ฉบับ"]];
    const csv = `\uFEFF${rows.map((row) => row.map((value) => `"${value}"`).join(",")).join("\n")}`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = Object.assign(document.createElement("a"), { href: url, download: "รายงานภาพรวมระบบ.csv" });
    link.click();
    URL.revokeObjectURL(url);
    setNotice("ดาวน์โหลดรายงานแล้ว");
  }

  return <>
    <div className="flex flex-wrap gap-3">
      <button type="button" aria-haspopup="dialog" onClick={() => { setNotice(""); setIsAdding(true); }} className="inline-flex h-10 items-center rounded-lg bg-[#3D348B] px-5 text-xs font-semibold text-white transition-colors hover:bg-[#7678ED]">+ เพิ่มผู้ใช้งาน</button>
      <button type="button" onClick={exportReport} disabled={reportUnavailable || report.companies === null || refreshing} title={reportUnavailable || report.companies === null ? "ข้อมูลรายงานยังไม่ครบ กรุณาโหลดหน้าใหม่ก่อนส่งออก" : undefined} className="h-10 rounded-lg border border-[#DDD8FA] bg-[#F1EEFC] px-5 text-xs font-semibold text-[#3D348B] transition-colors hover:bg-[#DDD8FA] disabled:opacity-50">ส่งออกรายงาน</button>
    </div>
    {isAdding && <UserEditModal mode="create" roles={roles} onClose={() => { if (!savingUser.current) setIsAdding(false); }} onSave={saveNewUser} />}
    {notice && <div role="status" className="fixed bottom-5 right-5 z-50 rounded-lg bg-[#443B92] px-4 py-3 text-sm font-semibold text-white shadow-lg">{notice}<button type="button" onClick={() => setNotice("")} className="ml-3 text-white/80 hover:text-white" aria-label="ปิดข้อความ">×</button></div>}
  </>;
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
