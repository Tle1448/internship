"use client";
import AdminSidebar from "@/components/AdminSidebar";

import { useMemo, useState } from "react";

type JobStatus = "เปิดรับสมัคร" | "ใกล้ปิดรับ" | "ปิดรับสมัคร" | "รอตรวจสอบ";
type Job = {
  id: string;
  title: string;
  company: string;
  category: string;
  location: string;
  type: string;
  slots: number;
  applicants: number;
  deadline: string;
  status: JobStatus;
  description: string;
  qualifications: string[];
};

const jobs: Job[] = [
  { id: "JOB-001", title: "นักพัฒนาซอฟต์แวร์ฝึกหัด", company: "บริษัท วลัยลักษณ์เทคโนโลยี จำกัด", category: "เทคโนโลยีสารสนเทศ", location: "นครศรีธรรมราช", type: "สหกิจศึกษา", slots: 3, applicants: 8, deadline: "30 พ.ย. 2569", status: "เปิดรับสมัคร", description: "ร่วมพัฒนาเว็บแอปพลิเคชันและระบบภายในองค์กรกับทีมพัฒนา", qualifications: ["กำลังศึกษาในสาขาที่เกี่ยวข้อง", "มีพื้นฐาน JavaScript หรือ TypeScript", "สามารถทำงานร่วมกับผู้อื่นได้"] },
  { id: "JOB-002", title: "ผู้ช่วยวิเคราะห์ข้อมูล", company: "บริษัท ดิจิทัลโซลูชันส์ จำกัด", category: "ข้อมูลและธุรกิจ", location: "กรุงเทพมหานคร", type: "สหกิจศึกษา", slots: 2, applicants: 5, deadline: "15 พ.ย. 2569", status: "ใกล้ปิดรับ", description: "สนับสนุนทีมข้อมูลในการจัดเตรียม วิเคราะห์ และนำเสนอข้อมูลธุรกิจ", qualifications: ["ใช้ Excel หรือ Google Sheets ได้ดี", "มีพื้นฐาน SQL จะได้รับการพิจารณา", "ละเอียดรอบคอบ"] },
  { id: "JOB-003", title: "ผู้ช่วยวิศวกรระบบ", company: "บริษัท สยามอุตสาหกรรม จำกัด", category: "วิศวกรรม", location: "กรุงเทพมหานคร", type: "ฝึกงาน", slots: 4, applicants: 6, deadline: "20 ธ.ค. 2569", status: "เปิดรับสมัคร", description: "เรียนรู้งานระบบควบคุมและสนับสนุนโครงการวิศวกรรมของบริษัท", qualifications: ["กำลังศึกษาวิศวกรรมศาสตร์", "อ่านแบบทางเทคนิคได้", "พร้อมเรียนรู้งานภาคสนาม"] },
  { id: "JOB-004", title: "ผู้ช่วยงานทรัพยากรบุคคล", company: "โรงพยาบาลนครพัฒน์", category: "บริหารธุรกิจ", location: "นครศรีธรรมราช", type: "ฝึกงาน", slots: 1, applicants: 2, deadline: "10 ต.ค. 2569", status: "รอตรวจสอบ", description: "ช่วยงานเอกสาร การสื่อสาร และกิจกรรมด้านทรัพยากรบุคคล", qualifications: ["กำลังศึกษาบริหารธุรกิจหรือสาขาที่เกี่ยวข้อง", "ใช้โปรแกรมสำนักงานได้", "มีมนุษยสัมพันธ์ดี"] },
  { id: "JOB-005", title: "นักออกแบบสื่อดิจิทัลฝึกหัด", company: "บริษัท ดิจิทัลโซลูชันส์ จำกัด", category: "ออกแบบและสื่อดิจิทัล", location: "กรุงเทพมหานคร", type: "สหกิจศึกษา", slots: 2, applicants: 11, deadline: "30 ก.ย. 2569", status: "ปิดรับสมัคร", description: "ออกแบบสื่อดิจิทัลสำหรับผลิตภัณฑ์และช่องทางประชาสัมพันธ์", qualifications: ["ใช้ Figma หรือเครื่องมือออกแบบได้", "มีแฟ้มผลงาน", "สามารถทำงานตามกำหนดเวลา"] },
];

const statusStyles: Record<JobStatus, string> = {
  "เปิดรับสมัคร": "bg-[#E5FAED] text-[#16A34A]",
  "ใกล้ปิดรับ": "bg-[#FFF4D8] text-[#A16207]",
  "ปิดรับสมัคร": "bg-[#F1F1F3] text-[#666]",
  "รอตรวจสอบ": "bg-[#E9E7FF] text-[#3D348B]",
};

export default function JobsPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<JobStatus | "ทั้งหมด">("ทั้งหมด");
  const [category, setCategory] = useState("ทั้งหมด");
  const [company, setCompany] = useState("ทั้งหมด");
  const [selected, setSelected] = useState<Job | null>(null);
  const categories = useMemo(() => [...new Set(jobs.map((job) => job.category))], []);
  const companies = useMemo(() => [...new Set(jobs.map((job) => job.company))], []);
  const filtered = jobs.filter((job) => (status === "ทั้งหมด" || job.status === status) && (category === "ทั้งหมด" || job.category === category) && (company === "ทั้งหมด" || job.company === company) && [job.title, job.company, job.category, job.location].some((item) => item.toLowerCase().includes(query.trim().toLowerCase())));
  const active = jobs.filter((job) => job.status === "เปิดรับสมัคร").length;
  const pending = jobs.filter((job) => job.status === "รอตรวจสอบ").length;
  const applications = jobs.reduce((total, job) => total + job.applicants, 0);
  return <div lang="th" className="min-h-screen bg-[#F8F9FA] text-black md:flex"><AdminSidebar active="jobs" /><div className="min-w-0 flex-1 md:ml-[260px]"><header className="px-5 py-6 lg:px-10"><div className="border-l-4 border-[#3D348B] pl-4"><h1 className="text-2xl font-bold lg:text-[30px]">จัดการตำแหน่งงาน</h1><p className="mt-1 text-[#555]">จัดการประกาศตำแหน่งฝึกงาน จำนวนที่เปิดรับ และผู้สมัครในแต่ละสถานประกอบการ</p></div></header><main className="space-y-6 p-5 lg:p-10"><section className="grid gap-4 sm:grid-cols-3">{[{ label: "ตำแหน่งงานทั้งหมด", value: jobs.length, color: "text-[#3D348B]" }, { label: "กำลังเปิดรับสมัคร", value: active, color: "text-[#16A34A]" }, { label: "ใบสมัครทั้งหมด", value: applications, color: "text-[#F18701]" }].map((card) => <article key={card.label} className="rounded-xl border border-[#EAEAEA] bg-white p-5 shadow-sm"><p className="text-sm text-gray-500">{card.label}</p><p className={`mt-2 font-mono text-3xl font-bold ${card.color}`}>{card.value}</p></article>)}</section><section aria-label="ค้นหาและตัวกรองตำแหน่งงาน" className="grid gap-2 rounded-xl border border-[#EAEAEA] bg-white p-3 shadow-sm lg:grid-cols-[300px_minmax(220px,1fr)_minmax(190px,0.9fr)_minmax(180px,0.85fr)_42px]"><label className="relative"><span className="sr-only">ค้นหาตำแหน่งงาน</span><span aria-hidden="true" className="absolute left-3 top-2.5 text-gray-500">⌕</span><input type="search" placeholder="ค้นหาตำแหน่ง" value={query} onChange={(event) => setQuery(event.target.value)} className="w-full rounded-lg border border-[#EAEAEA] bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-[#7678ED]/30" /></label><select aria-label="กรองสถานประกอบการ" value={company} onChange={(event) => setCompany(event.target.value)} className="rounded-lg border border-[#EAEAEA] bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#7678ED]/30"><option value="ทั้งหมด">สถานประกอบการทั้งหมด ({companies.length} แห่ง)</option>{companies.map((item) => <option key={item}>{item}</option>)}</select><select aria-label="กรองสาขาวิชา" value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-lg border border-[#EAEAEA] bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#7678ED]/30"><option value="ทั้งหมด">ทุกสาขาวิชา (All Majors)</option>{categories.map((item) => <option key={item}>{item}</option>)}</select><select aria-label="กรองสถานะ" value={status} onChange={(event) => setStatus(event.target.value as JobStatus | "ทั้งหมด")} className="rounded-lg border border-[#EAEAEA] bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#7678ED]/30"><option value="ทั้งหมด">ทุกสถานะ (Status)</option>{Object.keys(statusStyles).map((item) => <option key={item}>{item}</option>)}</select><button type="button" aria-label="ล้างตัวกรอง" onClick={() => { setQuery(""); setCompany("ทั้งหมด"); setCategory("ทั้งหมด"); setStatus("ทั้งหมด"); }} className="flex items-center justify-center rounded-lg text-lg text-[#3D348B] hover:bg-[#EEECFF]">⌫</button></section><section className="overflow-x-auto rounded-xl border border-[#EAEAEA] bg-white p-4 shadow-sm"><table className="w-full min-w-[1080px] text-left text-sm"><thead className="bg-[#FAFAFA] text-[#555]"><tr>{["ตำแหน่งงาน", "สถานประกอบการ", "รูปแบบงาน", "จำนวนรับ / ผู้สมัคร", "วันปิดรับ", "สถานะ", "จัดการ"].map((heading) => <th key={heading} className="border-b border-[#EAEAEA] px-4 py-4 text-xs">{heading}</th>)}</tr></thead><tbody>{filtered.map((job) => <tr key={job.id} className="border-b border-gray-100 hover:bg-[#FAFAFF]"><td className="px-4 py-4"><p className="font-semibold">{job.title}</p><p className="mt-1 font-mono text-xs text-gray-500">{job.id} · {job.category}</p></td><td className="px-4 py-4"><p>{job.company}</p><p className="mt-1 text-xs text-gray-500">{job.location}</p></td><td className="px-4 py-4">{job.type}</td><td className="px-4 py-4">{job.slots} คน / {job.applicants} ใบสมัคร</td><td className="px-4 py-4">{job.deadline}</td><td className="px-4 py-4"><span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${statusStyles[job.status]}`}>{job.status}</span></td><td className="px-4 py-4"><button type="button" onClick={() => setSelected(job)} className="rounded-lg border border-[#EAEAEA] px-3 py-2 text-xs font-semibold text-[#3D348B]">ดูข้อมูล</button></td></tr>)}{filtered.length === 0 && <tr><td colSpan={7} className="p-10 text-center text-gray-500">ไม่พบตำแหน่งงาน</td></tr>}</tbody></table></section><p className="text-sm text-gray-500">รอตรวจสอบ {pending} ตำแหน่ง</p></main></div>{selected && <JobDialog job={selected} onClose={() => setSelected(null)} />}</div>;
}

function JobDialog({ job, onClose }: { job: Job; onClose: () => void }) {
  return <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><section className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold text-[#3D348B]">รายละเอียดตำแหน่งงาน · {job.id}</p><h2 className="mt-1 text-xl font-bold">{job.title}</h2><p className="mt-1 text-sm text-gray-500">{job.company}</p></div><button type="button" onClick={onClose} aria-label="ปิดหน้าต่าง" className="text-xl">×</button></div><div className="mt-5 grid gap-3 sm:grid-cols-3"><Info label="รูปแบบงาน" value={job.type} /><Info label="จำนวนที่รับ" value={`${job.slots} คน`} /><Info label="วันปิดรับ" value={job.deadline} /></div><div className="mt-5"><h3 className="font-semibold">รายละเอียดงาน</h3><p className="mt-2 text-sm leading-6 text-gray-600">{job.description}</p></div><div className="mt-5"><h3 className="font-semibold">คุณสมบัติผู้สมัคร</h3><ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-gray-600">{job.qualifications.map((item) => <li key={item}>{item}</li>)}</ul></div><div className="mt-6 flex justify-end gap-3 border-t border-[#EAEAEA] pt-5"><button type="button" onClick={onClose} className="rounded-lg border border-[#EAEAEA] px-4 py-2 text-sm font-semibold">ปิดหน้าต่าง</button><button type="button" className="rounded-lg bg-[#3D348B] px-4 py-2 text-sm font-semibold text-white">แก้ไขตำแหน่งงาน</button></div></section></div>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg bg-[#FAFAFA] p-3"><p className="text-xs text-gray-500">{label}</p><p className="mt-1 text-sm font-semibold">{value}</p></div>;
}
