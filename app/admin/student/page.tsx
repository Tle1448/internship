"use client";
import AdminSidebar from "@/components/AdminSidebar";

import AdminStudentProfileModal from "@/components/adminStudentProfileModal";
import { useEffect, useState } from "react";

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
  "กำลังหาที่ฝึกงาน": "bg-[#FFF4D8] text-[#A16207]",
  "รอการอนุมัติ": "bg-[#E0E7FF] text-[#3730A3]",
  "ได้ที่ฝึกงานแล้ว": "bg-[#E5FAED] text-[#16A34A]",
};

export default function StudentPage() {
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StudentStatus | "ทั้งหมด">("ทั้งหมด");
  const [school, setSchool] = useState("ทั้งหมด");
  const [c1Status, setC1Status] = useState<C1Status | "ทั้งหมด">("ทั้งหมด");
  const [advisor, setAdvisor] = useState("ทั้งหมด");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

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
  const filteredStudents = students.filter((student) => (status === "ทั้งหมด" || student.status === status) && (school === "ทั้งหมด" || student.school === school) && (c1Status === "ทั้งหมด" || student.c1Status === c1Status) && (advisor === "ทั้งหมด" || student.advisor === advisor) && [student.name, student.id, student.email, student.program].some((value) => value.toLocaleLowerCase().includes(search)));
  const schools = [...new Set(students.map((student) => student.school))];
  const advisors = [...new Set(students.map((student) => student.advisor))];
  const placedStudents = students.filter((student) => student.status === "ได้ที่ฝึกงานแล้ว").length;
  const reviewingStudents = students.filter((student) => student.status === "รอการอนุมัติ").length;
  const unplacedStudents = students.filter((student) => student.status === "กำลังหาที่ฝึกงาน").length;
  const percentage = (value: number) => students.length ? `${((value / students.length) * 100).toFixed(1)}%` : "0%";

  return (
    <div lang="th" className="min-h-screen bg-[#F8F9FA] text-black md:flex">
      <AdminSidebar active="student" />

      <div className="min-w-0 flex-1 md:ml-[260px]">
        <header className="px-5 py-6 lg:px-10"><div className="border-l-4 border-[#3D348B] pl-4"><h1 className="text-2xl font-bold lg:text-[30px]">จัดการนักศึกษา</h1><p className="mt-1 text-[#555]">ตรวจสอบข้อมูลและสถานะการฝึกงานของนักศึกษา</p></div></header>
        <main className="space-y-6 p-5 lg:p-10">
          <section aria-label="สรุปสถานะนักศึกษา" className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
             {[{ label: "นักศึกษาทั้งหมด", value: students.length, icon: "🎓", accent: "text-[#171717]", iconColor: "bg-[#EEECFF] text-[#3D348B]", detail: "นักศึกษาทั้งหมด", badge: "100% รวมทั้งหมด", badgeColor: "bg-gray-100 text-gray-700" }, { label: "กำลังหาที่ฝึกงาน", value: unplacedStudents, icon: "⌕", accent: "text-[#F35B04]", iconColor: "bg-[#FFE8DC] text-[#F35B04]", detail: "อยู่ระหว่างค้นหาสถานประกอบการ", badge: `${percentage(unplacedStudents)} กำลังหา`, badgeColor: "bg-[#F35B04] text-white" }, { label: "รอการอนุมัติ", value: reviewingStudents, icon: "◷", accent: "text-[#F18701]", iconColor: "bg-[#FFF0DD] text-[#F18701]", detail: "อยู่ในกระบวนการพิจารณา", badge: `${percentage(reviewingStudents)} รออนุมัติ`, badgeColor: "bg-[#F18701] text-white" }, { label: "ได้ที่ฝึกงานแล้ว", value: placedStudents, icon: "✓", accent: "text-[#3D348B]", iconColor: "bg-[#EEECFF] text-[#3D348B]", detail: "ผ่านการคัดเลือกและตอบรับ", badge: `${percentage(placedStudents)} ได้ที่ฝึกงานแล้ว`, badgeColor: "bg-[#3D348B] text-white" }].map((card) => <article key={card.label} className="flex min-h-[220px] flex-col rounded-2xl border border-[#EAEAEA] bg-white p-6 shadow-sm transition duration-150 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(61,52,139,0.10)]"><div className="flex items-start justify-between gap-3"><p className="max-w-[180px] text-sm font-semibold leading-5 text-gray-500">{card.label}</p><span className={`flex size-12 shrink-0 items-center justify-center rounded-2xl text-2xl ${card.iconColor}`}>{card.icon}</span></div><p className={`mt-2 font-mono text-4xl font-bold ${card.accent}`}>{card.value}</p><div className="mt-auto flex items-end justify-between gap-3"><p className="max-w-[135px] text-sm leading-5 text-gray-600">{card.detail}</p><span className={`rounded-full px-3 py-2 text-xs font-bold ${card.badgeColor}`}>{card.badge}</span></div></article>)}
          </section>
          <section aria-label="ค้นหาและตัวกรองนักศึกษา" className="rounded-xl border border-[#EAEAEA] bg-white p-4 shadow-sm">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1.35fr)_minmax(220px,1fr)_minmax(190px,0.85fr)]"><label className="relative"><span className="sr-only">ค้นหานักศึกษา</span><input type="search" aria-label="ค้นหานักศึกษา" placeholder="ค้นหาชื่อหรือรหัสนักศึกษา (เช่น 6511428)" value={query} onChange={(event) => setQuery(event.target.value)} className="w-full rounded-lg border border-[#EAEAEA] px-4 py-2.5 pr-10 outline-none focus:border-[#7678ED] focus:ring-2 focus:ring-[#7678ED]/30" /><span aria-hidden="true" className="absolute right-3 top-2.5 text-[#3D348B]">⌕</span></label><select aria-label="กรองสำนักวิชา" value={school} onChange={(event) => setSchool(event.target.value)} className="rounded-lg border border-[#EAEAEA] bg-white px-4 py-2.5 outline-none focus:border-[#7678ED] focus:ring-2 focus:ring-[#7678ED]/30"><option value="ทั้งหมด">สำนักวิชาทั้งหมด</option>{schools.map((item) => <option key={item}>{item}</option>)}</select><select aria-label="กรองสถานะ C1" value={c1Status} onChange={(event) => setC1Status(event.target.value as C1Status | "ทั้งหมด")} className="rounded-lg border border-[#EAEAEA] bg-white px-4 py-2.5 outline-none focus:border-[#7678ED] focus:ring-2 focus:ring-[#7678ED]/30"><option value="ทั้งหมด">สถานะ C1: ทั้งหมด</option><option>ผ่าน C1</option><option>รอตรวจ C1</option></select></div>
            <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(220px,1fr)_auto]"><select aria-label="กรองอาจารย์ที่ปรึกษา" value={advisor} onChange={(event) => setAdvisor(event.target.value)} className="rounded-lg border border-[#EAEAEA] bg-white px-4 py-2.5 outline-none focus:border-[#7678ED] focus:ring-2 focus:ring-[#7678ED]/30"><option value="ทั้งหมด">อาจารย์ที่ปรึกษา: ทั้งหมด</option>{advisors.map((item) => <option key={item}>{item}</option>)}</select><button type="button" onClick={() => { setQuery(""); setStatus("ทั้งหมด"); setSchool("ทั้งหมด"); setC1Status("ทั้งหมด"); setAdvisor("ทั้งหมด"); }} className="rounded-lg border border-[#EAEAEA] px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50">⌫ ล้างตัวกรอง</button></div>
          </section>
          <section className="overflow-x-auto rounded-xl border border-[#EAEAEA] bg-white p-4 shadow-sm">
            <table className="w-full min-w-[940px] text-left text-sm"><thead className="bg-[#FAFAFA] text-[#555]"><tr>{["นักศึกษา", "สำนักวิชา / หลักสูตร", "ชั้นปี", "สถานะฝึกงาน", "จัดการ"].map((heading) => <th key={heading} className="border-b border-[#EAEAEA] px-4 py-4 text-xs font-bold">{heading}</th>)}</tr></thead><tbody>{filteredStudents.map((student) => <tr key={student.id} className="border-b border-gray-100 transition-colors hover:bg-[#FAFAFF]"><td className="px-4 py-4"><div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-full bg-[#3D348B] text-xs font-bold text-white">{student.name.slice(0, 2)}</span><div><p className="font-semibold">{student.name}</p><p className="mt-1 font-mono text-xs text-gray-500">{student.id} · {student.email}</p></div></div></td><td className="px-4 py-4"><p>{student.school}</p><p className="mt-1 text-xs text-gray-500">{student.program}</p></td><td className="px-4 py-4">{student.year}</td><td className="px-4 py-4"><span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${statusStyles[student.status]}`}>{student.status}</span></td><td className="px-4 py-4"><button type="button" onClick={() => setSelectedStudent(student)} className="rounded-lg border border-[#EAEAEA] px-3 py-2 text-xs font-semibold text-[#3D348B] transition hover:bg-[#F5F3FF]">ดูข้อมูล</button></td></tr>)}{filteredStudents.length === 0 && <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-500">ไม่พบนักศึกษาที่ตรงกับการค้นหา</td></tr>}</tbody></table>
          </section>
        </main>
      </div>
      {selectedStudent && <AdminStudentProfileModal student={selectedStudent} advisors={advisors} onClose={() => setSelectedStudent(null)} onChangeAdvisor={(newAdvisor) => { setStudents((current) => current.map((student) => student.id === selectedStudent.id ? { ...student, advisor: newAdvisor } : student)); setSelectedStudent((current) => current ? { ...current, advisor: newAdvisor } : null); }} />}
    </div>
  );
}

