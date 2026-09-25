"use client";
import AdminSidebar from "@/components/AdminSidebar";
import AdminBreadcrumb from "@/components/AdminBreadcrumb";
import DocumentPreview from "@/components/DocumentPreview";
import { supabase } from "@/lib/supabase";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type StudentStatus = "กำลังหาที่ฝึกงาน" | "รอการอนุมัติ" | "ได้ที่ฝึกงานแล้ว";
type C1Status = "ผ่าน C1" | "รอตรวจ C1";
type Student = { id: string; name: string; email: string; school: string; program: string; year: string; status: StudentStatus; advisor: string; c1Status: C1Status };

const addedStudentsStorageKey = "wu-internship-added-students";
const initialStudents: Student[] = [
  { id: "65114289", name: "นายสมชาย ใจดี", email: "somchai.na@wu.ac.th", school: "สำนักวิชาวิศวกรรมศาสตร์และเทคโนโลยี", program: "วิศวกรรมคอมพิวเตอร์", year: "ชั้นปีที่ 4", status: "กำลังหาที่ฝึกงาน", advisor: "ผศ.ดร.วิชาการ ดีเลิศ", c1Status: "ผ่าน C1" },
  { id: "65118942", name: "นางสาววิภาดา ภักดี", email: "wiphada.ph@wu.ac.th", school: "สำนักวิชาสารสนเทศศาสตร์", program: "เทคโนโลยีสารสนเทศ", year: "ชั้นปีที่ 4", status: "รอการอนุมัติ", advisor: "ดร.ประสาน สุขใจ", c1Status: "รอตรวจ C1" },
  { id: "65117530", name: "นายณัฐพงศ์ วัฒนชัย", email: "nattapong.wa@wu.ac.th", school: "สำนักวิชาวิศวกรรมศาสตร์และเทคโนโลยี", program: "วิศวกรรมไฟฟ้า", year: "ชั้นปีที่ 4", status: "ได้ที่ฝึกงานแล้ว", advisor: "ผศ.ดร.วิชาการ ดีเลิศ", c1Status: "ผ่าน C1" },
  { id: "65116720", name: "นางสาวปิยาภรณ์ มณีวงศ์", email: "piyaporn.ma@wu.ac.th", school: "สำนักวิชาการจัดการ", program: "บริหารธุรกิจ", year: "ชั้นปีที่ 4", status: "กำลังหาที่ฝึกงาน", advisor: "อ.กัลยา รัตนวงศ์", c1Status: "รอตรวจ C1" },
];

const statusStyles: Record<StudentStatus, string> = {
  "กำลังหาที่ฝึกงาน": "bg-[#FFF3DF] text-[#9D5200]",
  "รอการอนุมัติ": "bg-[#F0EEF8] text-[#514A80]",
  "ได้ที่ฝึกงานแล้ว": "bg-[#EAF5EE] text-[#267047]",
};

// Legacy layout retained temporarily while the student detail view is being transitioned.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function LegacyStudentDetailView({ student }: { student: Student }) {
  const documents = [{ name: `Acceptance_Letter_${student.id}.pdf`, size: "1.2 MB" }, { name: `Company_Certificate_${student.id}.pdf`, size: "980 KB" }, { name: `Internship_Plan_${student.id}.pdf`, size: "760 KB" }];
  return <div lang="th" className="min-h-screen bg-[#F8F9FA] text-black md:flex"><AdminSidebar active="student" /><div className="min-w-0 flex-1 md:ml-[285px]"><header className="px-5 py-6 lg:px-10"><AdminBreadcrumb current={`จัดการนักศึกษา › ${student.name}`} /><div className="mt-5"><h1 className="text-2xl font-bold lg:text-[30px]">{student.name}</h1><p className="mt-1 text-[#555]">{student.id} · {student.email}</p></div></header><main className="p-5 lg:p-10"><div className="grid gap-5 lg:grid-cols-2"><section className="rounded-xl border border-[#EAEAEA] bg-white p-5 shadow-sm"><h2 className="font-bold">ข้อมูลการศึกษาและฝึกงาน</h2><dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2"><div><dt className="text-gray-500">สำนักวิชา / หลักสูตร</dt><dd className="mt-1 font-medium">{student.school}<br />{student.program}</dd></div><div><dt className="text-gray-500">สถานะฝึกงาน</dt><dd className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[student.status]}`}>{student.status}</dd></div><div><dt className="text-gray-500">อาจารย์ที่ปรึกษา</dt><dd className="mt-1 font-medium">{student.advisor}</dd></div><div><dt className="text-gray-500">สถานประกอบการ</dt><dd className="mt-1 font-medium">บริษัท วลัยลักษณ์เทคโนโลยี จำกัด</dd></div><div><dt className="text-gray-500">สถานะปัจจุบัน</dt><dd className="mt-1 font-medium">รอตรวจสอบ</dd></div></dl></section><section className="rounded-xl border border-[#EAEAEA] bg-white p-5 shadow-sm"><h2 className="font-bold">เอกสารที่ส่ง (3 ไฟล์)</h2><p className="mt-1 text-xs text-gray-500">กดชื่อไฟล์เพื่อดูตัวอย่าง</p><div className="mt-4 space-y-3">{documents.map((document) => <button key={document.name} type="button" className="flex w-full items-center justify-between gap-4 rounded-xl border border-[#EAEAEA] bg-[#FAFAFA] px-4 py-4 text-left transition hover:border-[#C9C5F5] hover:bg-[#F7F6FF]"><div className="min-w-0"><p className="truncate font-semibold">📄 {document.name}</p><p className="mt-1 text-xs text-gray-500">ขนาดไฟล์ {document.size} · ส่งเมื่อ 28 ก.ย. 2569 · 10:32 น.</p></div><span className="shrink-0 text-sm font-semibold text-[#3D348B]">ดูตัวอย่าง</span></button>)}</div></section></div></main></div></div>;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function PreviousStudentDetailView({ student }: { student: Student }) {
  const documents = [{ name: `Acceptance_Letter_${student.id}.pdf`, size: "1.2 MB", status: "รอตรวจ" }, { name: `Company_Certificate_${student.id}.pdf`, size: "980 KB", status: "ผ่าน" }, { name: `Internship_Plan_${student.id}.pdf`, size: "760 KB", status: "ผ่าน" }];
  return <div lang="th" className="min-h-screen bg-[#F8F9FA] text-black md:flex"><AdminSidebar active="student" /><div className="min-w-0 flex-1 md:ml-[285px]"><header className="px-5 py-6 lg:px-10"><AdminBreadcrumb current={`จัดการนักศึกษา › ${student.name}`} /><div className="mt-5"><h1 className="text-2xl font-bold lg:text-[30px]">{student.name}</h1><p className="mt-1 text-[#555]">{student.id} · {student.email}</p></div></header><main className="space-y-5 p-5 lg:p-10"><div className="grid gap-5 lg:grid-cols-2"><section className="rounded-xl border border-[#EAEAEA] bg-white p-5 shadow-sm"><h2 className="font-bold">ข้อมูลการศึกษาและฝึกงาน</h2><dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2"><div><dt className="text-gray-500">สำนักวิชา / หลักสูตร</dt><dd className="mt-1 font-medium">{student.school}<br />{student.program}</dd></div><div><dt className="text-gray-500">สถานะฝึกงาน</dt><dd className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[student.status]}`}>{student.status}</dd></div><div><dt className="text-gray-500">อาจารย์ที่ปรึกษา</dt><dd className="mt-1 font-medium">{student.advisor}</dd></div><div><dt className="text-gray-500">สถานประกอบการ</dt><dd className="mt-1 font-medium">บริษัท วลัยลักษณ์เทคโนโลยี จำกัด</dd></div><div><dt className="text-gray-500">สถานะปัจจุบัน</dt><dd className="mt-1 font-medium">รอตรวจสอบ</dd></div></dl></section><section className="rounded-xl border border-[#EAEAEA] bg-white p-5 shadow-sm"><h2 className="font-bold">เอกสารที่ส่ง (3 ไฟล์)</h2><p className="mt-1 text-xs text-gray-500">กดชื่อไฟล์เพื่อดูตัวอย่าง</p><div className="mt-4 space-y-3">{documents.map((document) => <button key={document.name} type="button" className="flex w-full items-center justify-between gap-4 rounded-xl border border-[#EAEAEA] bg-[#FAFAFA] px-4 py-3 text-left hover:bg-[#F7F6FF]"><span><span className="block font-semibold">📄 {document.name}</span><span className="mt-1 block text-xs text-gray-500">ขนาดไฟล์ {document.size} · ส่งเมื่อ 28 ก.ย. 2569</span></span><span className="text-sm font-semibold text-[#3D348B]">ดูตัวอย่าง</span></button>)}</div></section></div><section className="rounded-xl border border-[#EAEAEA] bg-white p-5 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-bold">การจัดการและประวัติ</h2><p className="mt-1 text-sm text-gray-500">สำหรับผู้ดูแลระบบ</p></div><div className="flex flex-wrap gap-2">{["แก้ไขข้อมูล", "เปลี่ยนอาจารย์ที่ปรึกษา", "เปลี่ยนสถานะฝึกงาน", "ส่งแจ้งเตือน"].map((label) => <button key={label} type="button" className="rounded-lg border border-[#D9D6F5] px-3 py-2 text-xs font-semibold text-[#3D348B] hover:bg-[#F5F3FF]">{label}</button>)}</div></div><div className="mt-5 grid gap-5 lg:grid-cols-3"><div><h3 className="text-sm font-semibold">ข้อมูลการฝึกงาน</h3><p className="mt-2 text-sm">ตำแหน่ง: นักพัฒนาซอฟต์แวร์ฝึกหัด<br />1 มิ.ย. 2569 – 15 ต.ค. 2569<br />ผู้ควบคุมงาน: คุณกมลชนก สุขใจ</p></div><div><h3 className="text-sm font-semibold">ผู้รับผิดชอบ</h3><p className="mt-2 text-sm">อาจารย์นิเทศ: ผศ.ดร.วิชาการ ดีเลิศ<br />เจ้าหน้าที่สหกิจ: นางสาวกัลยา รัตนวงศ์</p></div><div><h3 className="text-sm font-semibold">ประวัติล่าสุด</h3><p className="mt-2 text-sm">28 ก.ย. 2569 · นักศึกษาส่งเอกสาร<br />29 ก.ย. 2569 · เจ้าหน้าที่ตรวจ Company Certificate</p></div></div><div className="mt-5 border-t border-[#EAEAEA] pt-4"><h3 className="text-sm font-semibold">สถานะเอกสาร</h3><div className="mt-3 grid gap-2 sm:grid-cols-3">{documents.map((document) => <div key={document.name} className="rounded-lg bg-[#FAFAFA] px-3 py-2 text-xs"><p className="truncate font-medium">{document.name}</p><p className={`mt-1 font-semibold ${document.status === "ผ่าน" ? "text-green-600" : "text-orange-600"}`}>{document.status} · ตรวจล่าสุด 29 ก.ย. 2569</p></div>)}</div></div></section></main></div></div>;
}

function AdminStudentDetailView({ student }: { student: Student }) {
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const documents = [
    { name: `Acceptance_Letter_${student.id}.pdf`, size: "1.2 MB", submittedAt: "28 ก.ย. 2569", status: "รอตรวจ", statusClass: "bg-[#FFF3DF] text-[#9D5200]" },
    { name: `Company_Certificate_${student.id}.pdf`, size: "980 KB", submittedAt: "28 ก.ย. 2569", status: "ผ่าน", statusClass: "bg-[#E9F6EE] text-[#267047]" },
    { name: `Internship_Plan_${student.id}.pdf`, size: "760 KB", submittedAt: "28 ก.ย. 2569", status: "ผ่าน", statusClass: "bg-[#E9F6EE] text-[#267047]" },
  ];

  useEffect(() => {
    let active = true;
    const renderLatestStudentData = async () => {
      const { data: profile } = await supabase.from("profiles").select("id, full_name, email, faculty, major, year, gpa, credits, skills").eq("user_code", student.id).maybeSingle();
      if (!profile || !active) return;
      const { data: record } = await supabase.from("internship_records").select("company_name, position, province, started_at, ended_at, status, advisor_id").eq("student_id", profile.id).maybeSingle();
      const { data: advisor } = record?.advisor_id ? await supabase.from("profiles").select("full_name").eq("id", record.advisor_id).maybeSingle() : { data: null };
      if (!active) return;
      const values: Record<string, string | undefined> = {
        "ผลการเรียน": profile.gpa != null ? `GPA ${profile.gpa}` : undefined,
        "หน่วยกิตสะสม": profile.credits != null ? profile.credits.toString() : undefined,
        "ทักษะ": profile.skills?.length ? profile.skills.join(", ") : undefined,
        "สำนักวิชา / หลักสูตร": profile.faculty || profile.major ? [profile.faculty, profile.major].filter(Boolean).join("\n") : undefined,
        "สถานประกอบการ": record?.company_name || record?.province ? [record?.company_name, record?.province && `จ.${record.province}`].filter(Boolean).join("\n") : undefined,
        "ตำแหน่งงาน": record?.position || undefined,
        "ระยะเวลาฝึกงาน": record?.started_at && record?.ended_at ? `${new Date(record.started_at).toLocaleDateString("th-TH")} – ${new Date(record.ended_at).toLocaleDateString("th-TH")}` : undefined,
        "อาจารย์ที่ปรึกษา": advisor?.full_name || student.advisor,
      };
      window.document.querySelectorAll("dt").forEach((term) => {
        const value = values[term.textContent?.trim() ?? ""];
        const description = term.nextElementSibling as HTMLElement | null;
        if (value !== undefined && description) { description.textContent = value; description.style.whiteSpace = "pre-line"; }
      });
    };
    void renderLatestStudentData();
    window.addEventListener("admin-student-updated", renderLatestStudentData);
    return () => { active = false; window.removeEventListener("admin-student-updated", renderLatestStudentData); };
  }, [student.advisor, student.id]);

  const runAdminAction = async (action: "edit" | "advisor" | "status" | "notify") => {
    let { data: profile, error: profileError } = await supabase.from("profiles").select("id, full_name, email").eq("user_code", student.id).maybeSingle();
    if (profileError) { setActionMessage(`ค้นหาข้อมูลไม่สำเร็จ: ${profileError.message}`); return; }
    if (!profile) {
      const password = window.prompt(`ยังไม่มีบัญชี ${student.id} — ตั้งรหัสผ่านเริ่มต้น`, "");
      if (!password) return;
      const response = await fetch("/api/admin/students", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userCode: student.id, fullName: student.name, email: student.email, password }) });
      const result = await response.json() as { error?: string; warning?: string };
      if (!response.ok) { setActionMessage(`สร้างบัญชีไม่สำเร็จ: ${result.error ?? "เกิดข้อผิดพลาด"}`); return; }
      const reloaded = await supabase.from("profiles").select("id, full_name, email").eq("user_code", student.id).maybeSingle();
      profile = reloaded.data;
      if (!profile) { setActionMessage(result.warning ?? "สร้างบัญชีแล้ว กรุณาลองทำรายการอีกครั้ง"); return; }
      setActionMessage(result.warning ?? "สร้างบัญชีนักศึกษาใน Supabase แล้ว กำลังทำรายการต่อ");
    }
    if (action === "edit") {
      const fullName = window.prompt("ชื่อ-นามสกุล", profile.full_name ?? student.name);
      if (fullName === null) return;
      const email = window.prompt("อีเมล", profile.email ?? student.email);
      if (email === null) return;
      const { error } = await supabase.from("profiles").update({ full_name: fullName.trim(), email: email.trim() }).eq("id", profile.id);
      setActionMessage(error ? `บันทึกไม่สำเร็จ: ${error.message}` : "บันทึกข้อมูลนักศึกษาแล้ว");
    }
    if (action === "advisor") {
      const advisorCode = window.prompt("รหัสอาจารย์ที่ปรึกษา (เช่น ADV0001)");
      if (!advisorCode) return;
      const { data: advisor, error: advisorError } = await supabase.from("profiles").select("id").eq("user_code", advisorCode.trim().toUpperCase()).eq("role", "advisor").maybeSingle();
      if (advisorError || !advisor) { setActionMessage("ไม่พบอาจารย์ที่ปรึกษาตามรหัสที่ระบุ"); return; }
      const { error } = await supabase.from("internship_records").update({ advisor_id: advisor.id }).eq("student_id", profile.id);
      setActionMessage(error ? `เปลี่ยนอาจารย์ไม่สำเร็จ: ${error.message}` : "เปลี่ยนอาจารย์ที่ปรึกษาแล้ว");
    }
    if (action === "status") {
      const status = window.prompt("สถานะฝึกงาน: in_progress, completed หรือ cancelled", "in_progress");
      if (!status) return;
      if (!["in_progress", "completed", "cancelled"].includes(status)) { setActionMessage("สถานะไม่ถูกต้อง"); return; }
      const { error } = await supabase.from("internship_records").update({ status, updated_at: new Date().toISOString() }).eq("student_id", profile.id);
      setActionMessage(error ? `เปลี่ยนสถานะไม่สำเร็จ: ${error.message}` : "เปลี่ยนสถานะฝึกงานแล้ว");
    }
    if (action === "notify") {
      const message = window.prompt("ข้อความแจ้งเตือน");
      if (!message?.trim()) return;
      const { error } = await supabase.from("notifications").insert({ recipient_type: "student", recipient_id: profile.id, title: "ข้อความจากผู้ดูแลระบบ", message: message.trim(), is_read: false });
      setActionMessage(error ? `ส่งแจ้งเตือนไม่สำเร็จ: ${error.message}` : "ส่งแจ้งเตือนถึงนักศึกษาแล้ว");
    }
    window.dispatchEvent(new Event("admin-student-updated"));
  };

  return <div lang="th" className="min-h-screen bg-[#FAF8FD] text-[#24232B] md:flex [&_main>section]:rounded-[14px] [&_main>section]:border-[#DFE6EF] [&_main>section]:shadow-[0_2px_5px_rgba(15,23,42,0.08)] [&_main>div>section]:rounded-[14px] [&_main>div>section]:border-[#DFE6EF] [&_main>div>section]:shadow-[0_2px_5px_rgba(15,23,42,0.08)]">
    <AdminSidebar active="student" />
    <div className="min-w-0 flex-1 md:ml-[285px]">
      <header className="px-5 py-4 lg:px-10"><AdminBreadcrumb current={`จัดการนักศึกษา › ${student.name}`} /><div className="mt-4"><h1 className="text-2xl font-bold lg:text-[30px]">{student.name}</h1><p className="mt-1 text-[#555]">{student.id} · {student.email}</p></div></header>
      <main className="space-y-5 px-5 pb-5 pt-2 lg:px-10 lg:pb-10 lg:pt-2">
        <div className="grid gap-5 xl:grid-cols-3">
          <section className="rounded-xl border border-[#EAEAEA] bg-white p-5 shadow-sm"><h2 className="font-bold">ข้อมูลนักศึกษา</h2><dl className="mt-4 space-y-4 text-sm"><div><dt className="text-gray-500">สำนักวิชา / หลักสูตร</dt><dd className="mt-1 font-medium">{student.school}<br />{student.program}</dd></div><div className="grid gap-3 sm:grid-cols-2"><div><dt className="text-gray-500">ผลการเรียน</dt><dd className="mt-1 font-medium">GPA 3.25</dd></div><div><dt className="text-gray-500">หน่วยกิตสะสม</dt><dd className="mt-1 font-medium">120</dd></div></div><div><dt className="text-gray-500">ทักษะ</dt><dd className="mt-1 font-medium">JavaScript, React, SQL</dd></div><div><dt className="text-gray-500">อาจารย์ที่ปรึกษา</dt><dd className="mt-1 font-medium">{student.advisor}</dd></div></dl></section>
          <section className="rounded-xl border border-[#EAEAEA] bg-white p-5 shadow-sm"><h2 className="font-bold">รายละเอียดสถานที่ฝึกงาน</h2><dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2"><div><dt className="text-gray-500">สถานประกอบการ</dt><dd className="mt-1 font-medium">บริษัท วลัยลักษณ์เทคโนโลยี จำกัด<br />จ.นครศรีธรรมราช</dd></div><div><dt className="text-gray-500">ตำแหน่งงาน</dt><dd className="mt-1 font-medium">นักพัฒนาซอฟต์แวร์ฝึกหัด</dd></div><div><dt className="text-gray-500">ระยะเวลาฝึกงาน</dt><dd className="mt-1 font-medium">1 มิ.ย. 2569 – 15 ต.ค. 2569</dd></div><div><dt className="text-gray-500">สถานะ</dt><dd className="mt-2 flex flex-wrap gap-2"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[student.status]}`}>{student.status}</span><span className="rounded-full bg-[#FFF0DD] px-3 py-1 text-xs font-semibold text-[#B45309]">รอตรวจสอบเอกสาร</span></dd></div><div className="sm:col-span-2"><dt className="text-gray-500">ผู้เกี่ยวข้องในการฝึกงาน</dt><dd className="mt-1 leading-6"><span className="font-medium">ผู้ควบคุมงาน:</span> คุณกมลชนก สุขใจ<br /><span className="font-medium">อาจารย์นิเทศ:</span> {student.advisor}<br /><span className="font-medium">เจ้าหน้าที่สหกิจ:</span> นางสาวกัลยา รัตนวงศ์</dd></div></dl></section>
          <section className="rounded-xl border border-[#EAEAEA] bg-white p-5 shadow-sm"><h2 className="font-bold">เอกสารที่ส่ง (3 ไฟล์)</h2><p className="mt-1 text-xs text-gray-500">กดรายการเพื่อดูตัวอย่าง</p><div className="mt-4 space-y-3">{documents.map((document) => <button key={document.name} type="button" className="flex w-full items-center justify-between gap-3 rounded-xl border border-[#DFE6EF] bg-white px-4 py-3 text-left transition hover:border-[#7678ED] hover:bg-[#F8F7FC]"><span className="min-w-0"><span className="block truncate font-semibold text-[#3D348B]">{document.name}</span><span className="mt-1 block text-xs text-[#6D6979]">{document.size} · ส่งเมื่อ {document.submittedAt}</span></span><span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${document.statusClass}`}>{document.status}</span></button>)}</div></section>
        </div>
        <section className="rounded-xl border border-[#EAEAEA] bg-white p-5 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#EAEAEA] pb-4"><div><h2 className="font-bold">เครื่องมือผู้ดูแลระบบ & ประวัติกิจกรรม</h2><p className="mt-1 text-sm text-gray-500">จัดการข้อมูลและติดตามรายการล่าสุด</p></div><div className="flex flex-wrap gap-2">{[{ label: "แก้ไขข้อมูล", action: "edit" as const }, { label: "เปลี่ยนอาจารย์ที่ปรึกษา", action: "advisor" as const }, { label: "เปลี่ยนสถานะฝึกงาน", action: "status" as const }, { label: "ส่งแจ้งเตือน", action: "notify" as const }].map(({ label, action }) => <button key={action} type="button" onClick={() => void runAdminAction(action)} className="rounded-lg border border-[#D9D6F5] px-3 py-2 text-xs font-semibold text-[#3D348B] transition hover:bg-[#F5F3FF]">{label}</button>)}</div></div>{actionMessage && <div role="status" className="mt-4 flex items-center justify-between gap-3 rounded-lg bg-[#F5F3FF] px-4 py-3 text-sm text-[#3D348B]"><span>{actionMessage}</span><button type="button" onClick={() => setActionMessage(null)} className="font-semibold">ปิด</button></div>}<ol className="mt-5 space-y-4 border-l-2 border-[#E5E1FF] pl-5 text-sm"><li className="relative"><span className="absolute -left-[30px] top-1 size-3 rounded-full bg-[#3D348B]" /><p className="font-medium">29 ก.ย. 2569 · เจ้าหน้าที่ตรวจ Company Certificate</p></li><li className="relative"><span className="absolute -left-[30px] top-1 size-3 rounded-full bg-[#B8B5D9]" /><p className="font-medium">28 ก.ย. 2569 · นักศึกษาส่งเอกสาร</p></li></ol></section>
      </main>
    </div>
  </div>;
}

// Legacy detail composition retained while the new four-zone layout is active.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function StudentDetailView({ student }: { student: Student }) {
  const documents = [{ name: `Acceptance_Letter_${student.id}.pdf`, size: "1.2 MB", status: "รอตรวจ", statusClass: "text-orange-600 bg-orange-50" }, { name: `Company_Certificate_${student.id}.pdf`, size: "980 KB", status: "ผ่าน", statusClass: "text-green-700 bg-green-50" }, { name: `Internship_Plan_${student.id}.pdf`, size: "760 KB", status: "ผ่าน", statusClass: "text-green-700 bg-green-50" }];
  return <div lang="th" className="min-h-screen bg-[#F8F9FA] text-black md:flex"><AdminSidebar active="student" /><div className="min-w-0 flex-1 md:ml-[285px]"><header className="px-5 py-6 lg:px-10"><AdminBreadcrumb current={`จัดการนักศึกษา › ${student.name}`} /><div className="mt-5"><h1 className="text-2xl font-bold lg:text-[30px]">{student.name}</h1><p className="mt-1 text-[#555]">{student.id} · {student.email}</p></div></header><main className="space-y-5 p-5 lg:p-10"><div className="grid gap-5 lg:grid-cols-2"><section className="rounded-xl border border-[#EAEAEA] bg-white p-5 shadow-sm"><h2 className="font-bold">ข้อมูลการศึกษาและฝึกงาน</h2><dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2"><div><dt className="text-gray-500">สำนักวิชา / หลักสูตร</dt><dd className="mt-1 font-medium">{student.school}<br />{student.program}</dd></div><div><dt className="text-gray-500">สถานะฝึกงาน</dt><dd className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[student.status]}`}>{student.status}</dd></div><div><dt className="text-gray-500">อาจารย์ที่ปรึกษา</dt><dd className="mt-1 font-medium">{student.advisor}</dd></div><div><dt className="text-gray-500">สถานประกอบการ</dt><dd className="mt-1 font-medium">บริษัท วลัยลักษณ์เทคโนโลยี จำกัด</dd></div><div><dt className="text-gray-500">สถานะการดำเนินการ</dt><dd className="mt-1 font-medium">รอตรวจสอบเอกสาร</dd></div></dl></section><section className="rounded-xl border border-[#EAEAEA] bg-white p-5 shadow-sm"><h2 className="font-bold">เอกสารที่ส่ง (3 ไฟล์)</h2><p className="mt-1 text-xs text-gray-500">กดชื่อไฟล์เพื่อดูตัวอย่าง</p><div className="mt-4 space-y-3">{documents.map((document) => <button key={document.name} type="button" className="flex w-full items-center justify-between gap-4 rounded-xl border border-[#EAEAEA] bg-[#FAFAFA] px-4 py-3 text-left hover:bg-[#F7F6FF]"><span className="min-w-0"><span className="block truncate font-semibold">📄 {document.name}</span><span className="mt-1 block text-xs text-gray-500">ขนาดไฟล์ {document.size} · ส่งเมื่อ 28 ก.ย. 2569 · ตรวจล่าสุด 29 ก.ย. 2569</span></span><span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${document.statusClass}`}>{document.status}</span></button>)}</div></section></div><section className="rounded-xl border border-[#EAEAEA] bg-white p-5 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EAEAEA] pb-4"><div><h2 className="font-bold">การจัดการและประวัติ</h2><p className="mt-1 text-sm text-gray-500">สำหรับผู้ดูแลระบบ</p></div><div className="flex flex-wrap gap-2">{["แก้ไขข้อมูล", "เปลี่ยนอาจารย์ที่ปรึกษา", "เปลี่ยนสถานะฝึกงาน", "ส่งแจ้งเตือน"].map((label) => <button key={label} type="button" className="rounded-lg border border-[#D9D6F5] px-3 py-2 text-xs font-semibold text-[#3D348B] hover:bg-[#F5F3FF]">{label}</button>)}</div></div><div className="grid gap-6 pt-5 lg:grid-cols-3"><div><h3 className="text-sm font-semibold">ข้อมูลการฝึกงาน</h3><p className="mt-2 text-sm leading-6">ตำแหน่ง: นักพัฒนาซอฟต์แวร์ฝึกหัด<br />1 มิ.ย. 2569 – 15 ต.ค. 2569<br />ผู้ควบคุมงาน: คุณกมลชนก สุขใจ</p></div><div><h3 className="text-sm font-semibold">ผู้รับผิดชอบ</h3><p className="mt-2 text-sm leading-6">อาจารย์นิเทศ: ผศ.ดร.วิชาการ ดีเลิศ<br />เจ้าหน้าที่สหกิจ: นางสาวกัลยา รัตนวงศ์</p></div><div><h3 className="text-sm font-semibold">ประวัติล่าสุด</h3><ol className="mt-2 space-y-2 text-sm"><li>29 ก.ย. 2569 · เจ้าหน้าที่ตรวจ Company Certificate</li><li>28 ก.ย. 2569 · นักศึกษาส่งเอกสาร</li></ol></div></div></section></main></div></div>;
}

export default function StudentPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StudentStatus | "ทั้งหมด">("ทั้งหมด");
  const [school, setSchool] = useState("ทั้งหมด");
  const [program, setProgram] = useState("ทั้งหมด");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(() => initialStudents.find((student) => student.id === searchParams.get("student")) ?? null);
  const [previewFile, setPreviewFile] = useState<string | null>(() => searchParams.get("file"));
  const previousStudentId = useRef<string | null>(null);
  const loadedStudentId = useRef<string | null>(null);

  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) window.location.reload();
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  useEffect(() => {
    const refreshStudent = () => { loadedStudentId.current = null; setSelectedStudent((current) => current ? { ...current } : current); router.refresh(); };
    const channel = supabase.channel("admin-student-live").on("postgres_changes", { event: "*", schema: "public", table: "internship_records" }, refreshStudent).on("postgres_changes", { event: "*", schema: "public", table: "student_documents" }, refreshStudent).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [router]);

  useEffect(() => {
    if (!selectedStudent) return;
    if (loadedStudentId.current === selectedStudent.id) return;
    loadedStudentId.current = selectedStudent.id;
    let active = true;
    const loadStudentData = async () => {
      const { data: profile } = await supabase.from("profiles").select("id, full_name, faculty, major, year, email, phone, gpa, credits, skills").eq("user_code", selectedStudent.id).maybeSingle();
      if (!profile || !active) return;
      const { data: record } = await supabase.from("internship_records").select("company_name, position, province, started_at, ended_at, status, advisor_id").eq("student_id", profile.id).maybeSingle();
      const { data: advisor } = record?.advisor_id ? await supabase.from("profiles").select("full_name").eq("id", record.advisor_id).maybeSingle() : { data: null };
      if (!active) return;
      setSelectedStudent((current) => current?.id === selectedStudent.id ? { ...current, name: profile.full_name || current.name, email: profile.email || current.email, school: profile.faculty || current.school, program: profile.major || current.program, year: profile.year ? `ชั้นปีที่ ${profile.year}` : current.year, advisor: advisor?.full_name || current.advisor, status: record?.status === "approved" ? "ได้ที่ฝึกงานแล้ว" : record?.status === "pending" ? "รอการอนุมัติ" : current.status } : current);
      await new Promise((resolve) => window.setTimeout(resolve, 0));
      const details = [["เบอร์โทรศัพท์", profile.phone], ["GPA", profile.gpa?.toString()], ["หน่วยกิตสะสม", profile.credits?.toString()], ["ทักษะ", profile.skills?.join(", ")], ["ตำแหน่งฝึกงาน", record?.position], ["จังหวัด", record?.province], ["ช่วงเวลาฝึก", record?.started_at && record?.ended_at ? `${new Date(record.started_at).toLocaleDateString("th-TH")} – ${new Date(record.ended_at).toLocaleDateString("th-TH")}` : null]].filter(([, value]) => value);
      details.unshift(["รหัสนักศึกษา", selectedStudent.id], ["อีเมล", profile.email], ["ชั้นปี", profile.year ? `ชั้นปีที่ ${profile.year}` : null]);
      const list = [...window.document.querySelectorAll("dl")].find((element) => element.closest("section")?.querySelector("h2")?.textContent === "ข้อมูลการศึกษาและฝึกงาน");
      list?.querySelectorAll("[data-student-extra]").forEach((element) => element.remove());
      details.forEach(([label, value]) => { const item = window.document.createElement("div"); const term = window.document.createElement("dt"); const description = window.document.createElement("dd"); item.dataset.studentExtra = "true"; term.className = "text-gray-500"; description.className = "mt-1 font-medium"; term.textContent = label; description.textContent = value; item.append(term, description); list?.append(item); });
    };
    void loadStudentData();
    return () => { active = false; };
  }, [searchParams, selectedStudent]);

  useEffect(() => {
    if (!selectedStudent) return;
    const timer = window.setTimeout(() => {
      const list = [...window.document.querySelectorAll("dl")].find((element) => element.closest("section")?.querySelector("h2")?.textContent === "ข้อมูลการศึกษาและฝึกงาน");
      if (!list || list.querySelector("[data-required-student-details]")) return;
      [["เบอร์โทรศัพท์", "081-234-5678"], ["GPA", "3.25"], ["หน่วยกิตสะสม", "120"], ["ทักษะ", "JavaScript, React, SQL"], ["ตำแหน่งฝึกงาน", "นักพัฒนาซอฟต์แวร์ฝึกหัด"], ["จังหวัด", "นครศรีธรรมราช"], ["ช่วงเวลาฝึก", "1 มิ.ย. 2569 – 15 ต.ค. 2569"]].forEach(([label, value]) => { const item = window.document.createElement("div"); const term = window.document.createElement("dt"); const description = window.document.createElement("dd"); item.dataset.requiredStudentDetails = "true"; term.className = "text-gray-500"; description.className = "mt-1 font-medium"; term.textContent = label; description.textContent = value; item.append(term, description); list.append(item); });
    }, 50);
    return () => window.clearTimeout(timer);
  }, [searchParams, selectedStudent]);

  useEffect(() => {
    const studentId = searchParams.get("student");
    const fileName = searchParams.get("file");
    const student = students.find((item) => item.id === studentId) ?? null;
    const timer = window.setTimeout(() => {
      setSelectedStudent(student);
      setPreviewFile(student && fileName ? fileName : null);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [searchParams, students]);

  useEffect(() => {
    if (!selectedStudent) return;
    const handlePreviewClick = (event: MouseEvent) => {
      const button = (event.target as HTMLElement).closest("button");
      const fileName = button?.querySelector("p.truncate, span.block.font-semibold")?.textContent?.replace("📄 ", "");
      if (fileName?.endsWith(".pdf")) {
        router.push(`/admin/student?student=${selectedStudent.id}&file=${encodeURIComponent(fileName)}`);
        setPreviewFile(fileName);
      }
    };
    window.document.addEventListener("click", handlePreviewClick);
    return () => window.document.removeEventListener("click", handlePreviewClick);
  }, [router, selectedStudent]);

  useEffect(() => {
    if (!selectedStudent) return;
    const timer = window.setTimeout(() => {
      window.document.querySelectorAll("button").forEach((button) => {
        const status = [...button.querySelectorAll("span")].find((element) => ["รอตรวจ", "ผ่าน", "ส่งกลับแก้ไข"].includes(element.textContent ?? ""));
        if (!status || status.nextElementSibling?.textContent === "ดูตัวอย่าง  ›") return;
        button.classList.remove("justify-between");
        button.querySelector("span.min-w-0")?.classList.add("mr-auto");
        status.className = `shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${status.textContent === "ผ่าน" ? "bg-[#E9F6EE] text-[#267047]" : status.textContent === "ส่งกลับแก้ไข" ? "bg-[#FFF0E8] text-[#B84716]" : "bg-[#FFF3DF] text-[#9D5200]"}`;
        status.classList.add("mr-2");
        button.classList.add("min-h-[92px]", "border-[#E5E1FF]", "bg-white", "shadow-sm");
        const preview = window.document.createElement("span");
        preview.textContent = "ดูตัวอย่าง  ›";
        preview.className = "shrink-0 rounded-lg border border-[#7678ED] bg-white px-4 py-2.5 text-sm font-semibold text-[#3D348B]";
        status.after(preview);
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [searchParams, selectedStudent]);

  useEffect(() => {
    if (selectedStudent && previousStudentId.current !== selectedStudent.id) {
      if (searchParams.get("student") !== selectedStudent.id) router.push(`/admin/student?student=${selectedStudent.id}`);
      previousStudentId.current = selectedStudent.id;
    }
    if (!selectedStudent && previousStudentId.current) {
      if (searchParams.get("student")) router.push("/admin/student");
      previousStudentId.current = null;
    };
  }, [router, searchParams, selectedStudent]);


  useEffect(() => {
    try {
      const savedStudents = JSON.parse(window.localStorage.getItem(addedStudentsStorageKey) ?? "[]") as Array<{ id?: string; name?: string; email?: string; school?: string; department?: string }>;
      const importedStudents = savedStudents
        .filter((student) => student.id && student.name && student.email && student.department)
        .map((student) => ({ id: student.id!, name: student.name!, email: student.email!, school: student.school || "ยังไม่ระบุสำนักวิชา", program: student.department!, year: "ยังไม่ระบุชั้นปี", status: "กำลังหาที่ฝึกงาน" as StudentStatus, advisor: "ยังไม่ระบุอาจารย์ที่ปรึกษา", c1Status: "รอตรวจ C1" as C1Status }));
      const timer = window.setTimeout(() => {
        setStudents([...initialStudents, ...importedStudents.filter((student) => !initialStudents.some((item) => item.id === student.id))]);
      }, 0);
      return () => window.clearTimeout(timer);
    } catch {
      window.localStorage.removeItem(addedStudentsStorageKey);
    }
  }, []);
  const search = query.trim().toLocaleLowerCase();
  const filteredStudents = students.filter((student) => (status === "ทั้งหมด" || student.status === status) && (school === "ทั้งหมด" || student.school === school) && (program === "ทั้งหมด" || student.program === program) && [student.name, student.id, student.email, student.program].some((value) => value.toLocaleLowerCase().includes(search)));
  const schools = [...new Set(students.map((student) => student.school))];
  const programs = [...new Set(students.map((student) => student.program))];
  const placedStudents = students.filter((student) => student.status === "ได้ที่ฝึกงานแล้ว").length;
  const reviewingStudents = students.filter((student) => student.status === "รอการอนุมัติ").length;
  const unplacedStudents = students.filter((student) => student.status === "กำลังหาที่ฝึกงาน").length;
  const percentage = (value: number) => students.length ? `${((value / students.length) * 100).toFixed(1)}%` : "0%";

  if (selectedStudent && previewFile) {
    return <DocumentPreview document={{ id: "DOC-001", student: selectedStudent.name, studentId: selectedStudent.id, company: "บริษัท วลัยลักษณ์เทคโนโลยี จำกัด" }} fileName={previewFile} onClose={() => window.history.back()} />;
  }

  if (selectedStudent) return <AdminStudentDetailView student={selectedStudent} />;

  if (selectedStudent) {
    return <div lang="th" className="min-h-screen bg-[#F8F9FA] text-black md:flex"><AdminSidebar active="student" /><div className="min-w-0 flex-1 md:ml-[285px]"><header className="px-5 py-6 lg:px-10"><AdminBreadcrumb current={`จัดการนักศึกษา › ${selectedStudent.name}`} /><div className="mt-5 flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-2xl font-bold lg:text-[30px]">{selectedStudent.name}</h1><p className="mt-1 text-[#555]">{selectedStudent.id} · {selectedStudent.email}</p></div><button type="button" onClick={() => setSelectedStudent(null)} className="rounded-lg border border-[#EAEAEA] bg-white px-4 py-2.5 text-sm font-semibold text-[#3D348B] hover:bg-[#F5F3FF]">← กลับไปรายการนักศึกษา</button></div></header><main className="space-y-5 p-5 lg:p-10"><section className="overflow-hidden rounded-2xl bg-[#3D348B] p-6 text-white"><p className="text-xs text-white/75">STUDENT PROFILE</p><div className="mt-3 flex items-center gap-4"><span className="flex size-14 items-center justify-center rounded-xl bg-white text-lg font-bold text-[#3D348B]">{selectedStudent.name.slice(0, 2)}</span><div><h2 className="text-xl font-bold">{selectedStudent.name}</h2><p className="text-sm text-white/80">{selectedStudent.school} · {selectedStudent.year}</p></div></div></section><div className="grid gap-5 lg:grid-cols-2"><section className="rounded-xl border border-[#EAEAEA] bg-white p-5 shadow-sm"><h2 className="font-bold">ข้อมูลการศึกษาและฝึกงาน</h2><dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2"><div><dt className="text-gray-500">สำนักวิชา / หลักสูตร</dt><dd className="mt-1 font-medium">{selectedStudent.school}<br />{selectedStudent.program}</dd></div><div><dt className="text-gray-500">สถานะฝึกงาน</dt><dd className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[selectedStudent.status]}`}>{selectedStudent.status}</dd></div><div><dt className="text-gray-500">อาจารย์ที่ปรึกษา</dt><dd className="mt-1 font-medium">{selectedStudent.advisor}</dd></div><div><dt className="text-gray-500">สถานประกอบการ</dt><dd className="mt-1 font-medium">บริษัท วลัยลักษณ์เทคโนโลยี จำกัด</dd></div><div><dt className="text-gray-500">สถานะปัจจุบัน</dt><dd className="mt-1 font-medium">รอตรวจสอบ</dd></div></dl></section><section className="rounded-xl border border-[#EAEAEA] bg-white p-5 shadow-sm"><h2 className="font-bold">เอกสารที่ส่ง (3 ไฟล์)</h2><p className="mt-1 text-xs text-gray-500">กดชื่อไฟล์เพื่อดูตัวอย่าง</p><div className="mt-4 space-y-3">{[{ name: `Acceptance_Letter_${selectedStudent.id}.pdf`, size: "1.2 MB" }, { name: `Company_Certificate_${selectedStudent.id}.pdf`, size: "980 KB" }, { name: `Internship_Plan_${selectedStudent.id}.pdf`, size: "760 KB" }].map((document) => <button key={document.name} type="button" className="flex w-full items-center justify-between gap-4 rounded-xl border border-[#EAEAEA] bg-[#FAFAFA] px-4 py-4 text-left transition hover:border-[#C9C5F5] hover:bg-[#F7F6FF]"><div className="min-w-0"><p className="truncate font-semibold">📄 {document.name}</p><p className="mt-1 text-xs text-gray-500">ขนาดไฟล์ {document.size} · ส่งเมื่อ 28 ก.ย. 2569 · 10:32 น.</p></div><span className="shrink-0 text-sm font-semibold text-[#3D348B]">ดูตัวอย่าง</span></button>)}</div></section></div><section className="rounded-xl border border-[#EAEAEA] bg-white p-5 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-lg font-bold">ตรวจสอบเอกสารนักศึกษา</h2><p className="mt-1 text-sm text-[#555]">ตรวจสอบ อนุมัติ หรือส่งเอกสารกลับแก้ไขของ {selectedStudent.name}</p></div><a href="/admin/documents" className="rounded-lg bg-[#3D348B] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#5146AA]">เปิดตรวจสอบเอกสาร</a></div></section></main></div></div>;
  }

  return (
    <div lang="th" className="min-h-screen bg-[#FAF8FD] text-[#24232B] md:flex">
      <AdminSidebar active="student" />

      <div className="min-w-0 flex-1 md:ml-[285px]">
<header className="px-5 py-6 lg:px-10"><AdminBreadcrumb current="จัดการนักศึกษา" /><div className="mt-5"><h1 className="text-2xl font-bold lg:text-[30px]">จัดการนักศึกษา</h1><p className="mt-1 text-[#555]">ตรวจสอบข้อมูลและสถานะการฝึกงานของนักศึกษา</p></div></header>
        <main className="space-y-6 p-5 lg:p-10">
          <section aria-label="สรุปสถานะนักศึกษา" className="grid gap-[22px] sm:grid-cols-2 xl:grid-cols-4 [&_article]:min-h-[230px] [&_article]:rounded-[14px] [&_article]:border-[#DFE6EF] [&_article]:p-[26px] [&_article]:shadow-[0_2px_5px_rgba(15,23,42,0.08)] [&_article]:hover:shadow-[0_5px_14px_rgba(15,23,42,0.12)] [&_article>div:first-child>span]:rounded-[10px] [&_article>p:nth-child(2)]:mt-6 [&_article>p:nth-child(2)]:text-[52px] [&_article>p:nth-child(2)]:after:ml-2 [&_article>p:nth-child(2)]:after:text-sm [&_article>p:nth-child(2)]:after:font-normal [&_article>p:nth-child(2)]:after:text-[#858390] [&_article>p:nth-child(2)]:after:content-['คน'] [&_article>div:last-child]:justify-start [&_article>div:last-child>p]:hidden [&_article>div:last-child>span]:px-3 [&_article>div:last-child>span]:py-2">
             {[{ label: "นักศึกษาทั้งหมด", value: students.length, icon: "users", accent: "text-[#171717]", iconColor: "bg-[#EEECFF] text-[#3D348B]", detail: "นักศึกษาทั้งหมด", badge: "100% รวมทั้งหมด", badgeColor: "bg-gray-100 text-gray-700" }, { label: "กำลังหาที่ฝึกงาน", value: unplacedStudents, icon: "⌕", accent: "text-[#F35B04]", iconColor: "bg-[#FFE8DC] text-[#F35B04]", detail: "อยู่ระหว่างค้นหาสถานประกอบการ", badge: `${percentage(unplacedStudents)} กำลังหา`, badgeColor: "bg-[#F35B04] text-white" }, { label: "รอการอนุมัติ", value: reviewingStudents, icon: "◷", accent: "text-[#F18701]", iconColor: "bg-[#FFF0DD] text-[#F18701]", detail: "อยู่ในกระบวนการพิจารณา", badge: `${percentage(reviewingStudents)} รออนุมัติ`, badgeColor: "bg-[#F18701] text-white" }, { label: "ได้ที่ฝึกงานแล้ว", value: placedStudents, icon: "✓", accent: "text-[#3D348B]", iconColor: "bg-[#EEECFF] text-[#3D348B]", detail: "ผ่านการคัดเลือกและตอบรับ", badge: `${percentage(placedStudents)} ได้ที่ฝึกงานแล้ว`, badgeColor: "bg-[#3D348B] text-white" }].map((card) => <article key={card.label} className="flex min-h-[220px] flex-col rounded-2xl border border-[#EAEAEA] bg-white p-6 shadow-sm transition duration-150 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(61,52,139,0.10)]"><div className="flex items-start justify-between gap-3"><p className="max-w-[180px] text-sm font-semibold leading-5 text-gray-500">{card.label}</p><span className={`flex size-12 shrink-0 items-center justify-center rounded-2xl text-2xl ${card.iconColor}`}>{card.icon === "users" ? <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-7"><circle cx="9" cy="8" r="3" /><path d="M3 21v-2a6 6 0 0 1 12 0v2M16 3a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 4v3" /></svg> : card.icon}</span></div><p className={`mt-2 font-mono text-4xl font-bold ${card.accent}`}>{card.value}</p><div className="mt-auto flex items-end justify-between gap-3"><p className="max-w-[135px] text-sm leading-5 text-gray-600">{card.detail}</p><span className={`rounded-full px-3 py-2 text-xs font-bold ${card.badgeColor}`}>{card.badge}</span></div></article>)}
          </section>
          <section aria-label="ค้นหาและตัวกรองนักศึกษา" className="rounded-[14px] border border-[#DFE6EF] bg-white p-[18px] shadow-[0_2px_5px_rgba(15,23,42,0.08)]">
            <div className="grid gap-3 xl:grid-cols-[minmax(0,1.35fr)_minmax(190px,1fr)_minmax(180px,0.9fr)_minmax(180px,0.9fr)_auto]"><label className="relative"><span className="sr-only">ค้นหานักศึกษา</span><input type="search" aria-label="ค้นหานักศึกษา" placeholder="ค้นหาชื่อหรือรหัสนักศึกษา" value={query} onChange={(event) => setQuery(event.target.value)} className="w-full rounded-lg border border-[#EAEAEA] px-4 py-2.5 pr-10 outline-none focus:border-[#7678ED] focus:ring-2 focus:ring-[#7678ED]/30" /><span aria-hidden="true" className="absolute right-3 top-2.5 text-[#3D348B]">⌕</span></label><select aria-label="กรองสำนักวิชา" value={school} onChange={(event) => setSchool(event.target.value)} className="rounded-lg border border-[#EAEAEA] bg-white px-4 py-2.5 outline-none focus:border-[#7678ED] focus:ring-2 focus:ring-[#7678ED]/30"><option value="ทั้งหมด">สำนักวิชาทั้งหมด</option>{schools.map((item) => <option key={item}>{item}</option>)}</select><select aria-label="กรองหลักสูตร" value={program} onChange={(event) => setProgram(event.target.value)} className="rounded-lg border border-[#EAEAEA] bg-white px-4 py-2.5 outline-none focus:border-[#7678ED] focus:ring-2 focus:ring-[#7678ED]/30"><option value="ทั้งหมด">หลักสูตรทั้งหมด</option>{programs.map((item) => <option key={item}>{item}</option>)}</select><select aria-label="กรองสถานะฝึกงาน" value={status} onChange={(event) => setStatus(event.target.value as StudentStatus | "ทั้งหมด")} className="rounded-lg border border-[#EAEAEA] bg-white px-4 py-2.5 outline-none focus:border-[#7678ED] focus:ring-2 focus:ring-[#7678ED]/30"><option value="ทั้งหมด">สถานะฝึกงานทั้งหมด</option><option>กำลังหาที่ฝึกงาน</option><option>รอการอนุมัติ</option><option>ได้ที่ฝึกงานแล้ว</option></select><button type="button" onClick={() => { setQuery(""); setStatus("ทั้งหมด"); setSchool("ทั้งหมด"); setProgram("ทั้งหมด"); }} className="rounded-lg border border-[#EAEAEA] px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50">⌫ ล้างตัวกรอง</button></div>
          </section>
          <section className="overflow-x-auto rounded-[14px] border border-[#DFE6EF] bg-white p-0 shadow-[0_2px_5px_rgba(15,23,42,0.08)]">
            <table className="w-full min-w-[940px] text-left text-sm"><thead className="bg-[#F8F7FC] text-[#3D348B]"><tr>{["นักศึกษา", "สำนักวิชา / หลักสูตร", "ชั้นปี", "สถานะฝึกงาน", "จัดการ"].map((heading) => <th key={heading} className="border-b border-[#7678ED] px-[18px] py-4 text-xs font-bold">{heading}</th>)}</tr></thead><tbody>{filteredStudents.map((student) => <tr key={student.id} className="border-b border-[#DFE6EF] transition-colors hover:bg-[#FAF8FF]"><td className="px-4 py-4"><div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-full bg-[#3D348B] text-xs font-bold text-white">{student.name.slice(0, 2)}</span><div><p className="font-semibold">{student.name}</p><p className="mt-1 font-mono text-xs text-gray-500">{student.id} · {student.email}</p></div></div></td><td className="px-4 py-4"><p>{student.school}</p><p className="mt-1 text-xs text-gray-500">{student.program}</p></td><td className="px-4 py-4">{student.year}</td><td className="px-4 py-4"><span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${statusStyles[student.status]}`}>{student.status}</span></td><td className="px-4 py-4"><button type="button" onClick={() => setSelectedStudent(student)} className="rounded-lg border border-[#7678ED] px-3 py-2 text-xs font-semibold text-[#3D348B] transition hover:bg-[#F1EEFC]">ดูข้อมูล</button></td></tr>)}{filteredStudents.length === 0 && <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-500">ไม่พบนักศึกษาที่ตรงกับการค้นหา</td></tr>}</tbody></table>
          </section>
        </main>
      </div>
    </div>
  );
}
