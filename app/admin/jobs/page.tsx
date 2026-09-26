"use client";
import AdminSidebar from "@/components/AdminSidebar";
import AdminBreadcrumb from "@/components/AdminBreadcrumb";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

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

const initialJobs: Job[] = [
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
  const [jobs, setJobs] = useState<Job[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<JobStatus | "ทั้งหมด">("ทั้งหมด");
  const [category, setCategory] = useState("ทั้งหมด");
  const [company, setCompany] = useState("ทั้งหมด");
  const [selected, setSelected] = useState<Job | null>(null);
  useEffect(() => {
    async function loadJobs() {
      const [companiesResult, jobsResult, applicationsResult] = await Promise.all([
        supabase.from("companies").select("id, name"),
        supabase.from("jobs").select("id, company_id, title, location, department, positions, work_type, description, qualifications, end_date, status").order("created_at", { ascending: false }),
        supabase.from("job_applications").select("job_id"),
      ]);
      if (companiesResult.error || jobsResult.error || applicationsResult.error) return;
      const companyNames = new Map((companiesResult.data ?? []).map((item) => [item.id, item.name]));
      const applicationCounts = new Map<string, number>();
      for (const application of applicationsResult.data ?? []) if (application.job_id) applicationCounts.set(application.job_id, (applicationCounts.get(application.job_id) ?? 0) + 1);
      const visibleJobs = (jobsResult.data ?? []).filter((job) => job.status !== "closed");
      setJobs(visibleJobs.map((job) => {
        const end = job.end_date ? new Date(job.end_date) : null;
        const isClosingSoon = job.status === "open" && end && end.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000 && end.getTime() >= Date.now();
        const displayStatus: JobStatus = job.status === "closed" ? "ปิดรับสมัคร" : job.status === "draft" ? "รอตรวจสอบ" : isClosingSoon ? "ใกล้ปิดรับ" : "เปิดรับสมัคร";
        return { id: job.id, title: job.title, company: companyNames.get(job.company_id ?? "") ?? "-", category: job.department ?? "-", location: job.location ?? "-", type: job.work_type ?? "-", slots: job.positions ?? 0, applicants: applicationCounts.get(job.id) ?? 0, deadline: end ? end.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" }) : "-", status: displayStatus, description: job.description ?? "", qualifications: job.qualifications ?? [] };
      }));
    }
    void loadJobs();
  }, []);
  const categories = useMemo(() => [...new Set(jobs.map((job) => job.category))], [jobs]);
  const companies = useMemo(() => [...new Set(jobs.map((job) => job.company))], [jobs]);
  const filtered = jobs.filter((job) => (status === "ทั้งหมด" || job.status === status) && (category === "ทั้งหมด" || job.category === category) && (company === "ทั้งหมด" || job.company === company) && [job.title, job.company, job.category, job.location].some((item) => item.toLowerCase().includes(query.trim().toLowerCase())));
  const active = jobs.filter((job) => job.status === "เปิดรับสมัคร").length;

  const applications = jobs.reduce((total, job) => total + job.applicants, 0);
  useEffect(() => {
    const table = document.querySelector("main > section:last-of-type table");
    if (!(table instanceof HTMLTableElement)) return;

    const responsiveStyle = document.createElement("style");
    responsiveStyle.id = "admin-jobs-mobile-cards";
    responsiveStyle.textContent = `
      @media (max-width: 767px) {
        main > section:last-of-type { overflow: visible !important; border: 0 !important; background: transparent !important; box-shadow: none !important; }
        main > section:last-of-type table, main > section:last-of-type tbody { display: block !important; width: 100% !important; }
        main > section:last-of-type thead { display: none !important; }
        main > section:last-of-type tbody { display: grid !important; gap: 0.75rem; }
        main > section:last-of-type tr { display: block !important; border: 1px solid #DFE6EF; border-radius: 0.875rem; background: white; padding: 0.875rem; }
        main > section:last-of-type td { display: flex !important; width: auto !important; justify-content: space-between; gap: 1rem; padding: 0.375rem 0 !important; white-space: normal !important; }
        main > section:last-of-type td:nth-child(1), main > section:last-of-type td:nth-child(2) { display: block !important; }
        main > section:last-of-type td:nth-child(1) { padding-top: 0 !important; }
        main > section:last-of-type td:nth-child(2) { padding-bottom: 0.75rem !important; border-bottom: 1px solid #F0EEF5; }
        main > section:last-of-type td:nth-child(4)::before { content: "จำนวนรับ / ผู้สมัคร"; color: #6D6979; font-size: 0.75rem; }
        main > section:last-of-type td:nth-child(6)::before { content: "สถานะ"; color: #6D6979; font-size: 0.75rem; }
        main > section:last-of-type td:nth-child(7) { justify-content: flex-end; padding-bottom: 0 !important; }
      }
    `;
    document.head.append(responsiveStyle);

    const columnWidths = ["33%", "27%", "0", "16%", "0", "12%", "12%"];
    table.style.tableLayout = "fixed";
    table.style.width = "100%";
    table.style.minWidth = "0";
    table.style.maxWidth = "100%";
    table.parentElement?.style.setProperty("overflow-x", "hidden");

    Array.from(table.rows).forEach((row) => {
      Array.from(row.cells).forEach((cell, index) => {
        cell.style.display = index === 2 || index === 4 ? "none" : "";
        cell.style.width = columnWidths[index] ?? "auto";
        cell.style.whiteSpace = index >= 3 ? "nowrap" : "normal";
        cell.style.wordBreak = index < 2 ? "break-word" : "normal";
        cell.style.padding = row.parentElement?.tagName === "THEAD" ? "0.875rem 0.75rem" : "0.875rem 0.75rem";
        cell.style.fontSize = row.parentElement?.tagName === "THEAD" ? "0.6875rem" : "0.8125rem";

        if (index === 0) {
          const metadata = cell.querySelector<HTMLElement>("p.mt-1");
          const text = metadata?.textContent ?? "";
          const separator = text.indexOf(" · ");
          if (metadata) {
            metadata.style.fontSize = "0.6875rem";
            if (separator >= 0) metadata.textContent = text.slice(separator + 3);
          }
        }

        cell.querySelectorAll("button").forEach((button) => {
          button.style.padding = "0.5rem 0.75rem";
          button.style.fontSize = "0.6875rem";
        });
        cell.querySelectorAll<HTMLElement>("span.rounded-full").forEach((badge) => {
          badge.style.padding = "0.375rem 0.75rem";
          badge.style.fontSize = "0.6875rem";
        });
      });
    });
    return () => responsiveStyle.remove();
  }, [jobs, query, status, category, company]);
return <div lang="th" className="min-h-screen bg-[#F8F9FA] text-black md:flex"><AdminSidebar active="jobs" /><div className="min-w-0 flex-1 md:ml-[260px]"><header className="px-5 py-6 lg:px-10"><AdminBreadcrumb current="จัดการตำแหน่งงาน" /><div className="mt-5"><h1 className="text-2xl font-bold lg:text-[30px]">จัดการตำแหน่งงาน</h1><p className="mt-1 text-[#555]">จัดการประกาศตำแหน่งฝึกงาน จำนวนที่เปิดรับ และผู้สมัครในแต่ละสถานประกอบการ</p></div></header><main className="space-y-6 p-5 lg:p-10"><section className="grid gap-[22px] sm:grid-cols-3">{[{ label: "ตำแหน่งงานทั้งหมด", value: jobs.length, unit: "ตำแหน่ง", icon: "briefcase", color: "text-[#3D348B]", iconColor: "bg-[#EEECFF] text-[#3D348B]", badge: "รวมทั้งหมด", badgeColor: "bg-[#EEECFF] text-[#3D348B]" }, { label: "กำลังเปิดรับสมัคร", value: active, unit: "ตำแหน่ง", icon: "check", color: "text-[#F35B04]", iconColor: "bg-[#FFE0D5] text-[#F35B04]", badge: "เปิดรับสมัคร", badgeColor: "bg-[#F35B04] text-white" }, { label: "ใบสมัครทั้งหมด", value: applications, unit: "ใบสมัคร", icon: "document", color: "text-[#24232B]", iconColor: "bg-[#EEECFF] text-[#3D348B]", badge: "ใบสมัครทั้งหมด", badgeColor: "bg-[#F18701] text-white" }].map((card) => <article key={card.label} className="flex min-h-[220px] flex-col rounded-[14px] border border-[#DFE6EF] bg-white p-[26px] shadow-[0_2px_5px_rgba(15,23,42,0.08)] transition hover:shadow-[0_5px_14px_rgba(15,23,42,0.12)]"><div className="flex items-start justify-between gap-3"><p className="text-sm font-semibold leading-5 text-[#6D6979]">{card.label}</p><span className={`flex size-12 shrink-0 items-center justify-center rounded-[10px] ${card.iconColor}`}>{card.icon === "briefcase" ? <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-6"><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2" /></svg> : card.icon === "check" ? <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-6"><path d="m5 12 4 4L19 6" /></svg> : <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-6"><path d="M6 2h8l4 4v16H6z" /><path d="M14 2v5h5M9 12h6M9 16h6" /></svg>}</span></div><p className={`mt-6 font-mono text-[52px] font-bold leading-none ${card.color}`}>{card.value}<span className="ml-2 text-sm font-normal text-[#858390]">{card.unit}</span></p><span className={`mt-auto w-fit rounded-full px-3 py-2 text-xs font-bold ${card.badgeColor}`}>{card.badge}</span></article>)}</section><section aria-label="ค้นหาและตัวกรองตำแหน่งงาน" className="grid gap-2 rounded-xl border border-[#EAEAEA] bg-white p-3 shadow-sm lg:grid-cols-[300px_minmax(220px,1fr)_minmax(190px,0.9fr)_minmax(180px,0.85fr)_42px]"><label className="relative"><span className="sr-only">ค้นหาตำแหน่งงาน</span><span aria-hidden="true" className="absolute left-3 top-2.5 text-gray-500">⌕</span><input type="search" placeholder="ค้นหาตำแหน่ง" value={query} onChange={(event) => setQuery(event.target.value)} className="w-full rounded-lg border border-[#EAEAEA] bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-[#7678ED]/30" /></label><select aria-label="กรองสถานประกอบการ" value={company} onChange={(event) => setCompany(event.target.value)} className="rounded-lg border border-[#EAEAEA] bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#7678ED]/30"><option value="ทั้งหมด">สถานประกอบการทั้งหมด ({companies.length} แห่ง)</option>{companies.map((item) => <option key={item}>{item}</option>)}</select><select aria-label="กรองสาขาวิชา" value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-lg border border-[#EAEAEA] bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#7678ED]/30"><option value="ทั้งหมด">ทุกสาขาวิชา (All Majors)</option>{categories.map((item) => <option key={item}>{item}</option>)}</select><select aria-label="กรองสถานะ" value={status} onChange={(event) => setStatus(event.target.value as JobStatus | "ทั้งหมด")} className="rounded-lg border border-[#EAEAEA] bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#7678ED]/30"><option value="ทั้งหมด">ทุกสถานะ (Status)</option>{Object.keys(statusStyles).map((item) => <option key={item}>{item}</option>)}</select><button type="button" aria-label="ล้างตัวกรอง" onClick={() => { setQuery(""); setCompany("ทั้งหมด"); setCategory("ทั้งหมด"); setStatus("ทั้งหมด"); }} className="flex items-center justify-center rounded-lg text-lg text-[#3D348B] hover:bg-[#EEECFF]">⌫</button></section><section className="overflow-x-auto rounded-[14px] border border-[#DFE6EF] bg-white p-0 shadow-[0_2px_5px_rgba(15,23,42,0.08)]"><table className="w-full min-w-[1080px] text-left text-sm"><thead className="bg-[#F8F7FC] text-[#3D348B]"><tr>{["ตำแหน่งงาน", "สถานประกอบการ", "รูปแบบงาน", "จำนวนรับ / ผู้สมัคร", "วันปิดรับ", "สถานะ", "จัดการ"].map((heading) => <th key={heading} className="border-b border-[#7678ED] px-[18px] py-4 text-xs font-bold">{heading}</th>)}</tr></thead><tbody>{filtered.map((job) => <tr key={job.id} className="border-b border-[#DFE6EF] transition-colors hover:bg-[#FAF8FF]"><td className="px-[18px] py-4"><p className="font-semibold">{job.title}</p><p className="mt-1 font-mono text-xs text-gray-500">{job.id} · {job.category}</p></td><td className="px-[18px] py-4"><p>{job.company}</p><p className="mt-1 text-xs text-gray-500">{job.location}</p></td><td className="px-[18px] py-4">{job.type}</td><td className="px-[18px] py-4">{job.slots} คน / {job.applicants} ใบสมัคร</td><td className="px-[18px] py-4">{job.deadline}</td><td className="px-[18px] py-4"><span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${statusStyles[job.status]}`}>{job.status}</span></td><td className="px-[18px] py-4"><button type="button" onClick={() => setSelected(job)} className="rounded-lg border border-[#7678ED] px-3 py-2 text-xs font-semibold text-[#3D348B] transition hover:bg-[#F1EEFC]">ดูข้อมูล</button></td></tr>)}{filtered.length === 0 && <tr><td colSpan={7} className="p-10 text-center text-gray-500">ไม่พบตำแหน่งงาน</td></tr>}</tbody></table></section></main></div>{selected && <JobDialog job={selected} onClose={() => setSelected(null)} onSave={(updated) => { setJobs((current) => current.map((job) => job.id === updated.id ? updated : job)); setSelected(updated); }} />}</div>;
}

function JobDialogLegacy({ job, onClose, onSave }: { job: Job; onClose: () => void; onSave: (job: Job) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(job);
  const field = "mt-1 w-full rounded-lg border border-[#DFE6EF] bg-white px-3 py-2 text-sm outline-none focus:border-[#7678ED] focus:ring-2 focus:ring-[#7678ED]/20";
  const cancelEditing = () => { setDraft(job); setEditing(false); };
  const save = async () => {
    const status = draft.status === "ปิดรับสมัคร" ? "closed" : draft.status === "รอตรวจสอบ" ? "draft" : "open";
    const response = await fetch("/api/admin/jobs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: draft.id, title: draft.title, location: draft.location, department: draft.category, positions: Math.max(0, draft.slots), workType: draft.type, description: draft.description, qualifications: draft.qualifications, status }),
    });
    if (!response.ok) {
      const data = await response.json() as { error?: string };
      window.alert(data.error ?? "ไม่สามารถบันทึกตำแหน่งงานได้");
      return;
    }
    onSave({ ...draft, slots: Math.max(0, draft.slots) });
    setEditing(false);
  };

  return <div role="dialog" aria-modal="true" aria-labelledby="job-dialog-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="flex max-h-[calc(100dvh-6rem)] w-full max-w-2xl flex-col overflow-hidden rounded-[18px] border border-[#DFE6EF] bg-white shadow-[0_20px_40px_rgba(32,22,64,0.20)]"><header className="shrink-0 relative flex items-start gap-3 border-b border-[#DCE3EE] bg-[#F5F7FB] px-7 py-6 text-[#24232B]"><span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#3D348B] text-white"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-5"><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2" /></svg></span><div className="min-w-0 flex-1"><p className="text-xs font-semibold text-[#3D348B]">รายละเอียดตำแหน่งงาน · {job.id}</p>{editing ? <><input aria-label="ชื่อตำแหน่งงาน" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} className="mt-1 w-full rounded-lg border border-[#DFE6EF] bg-white px-3 py-2 text-xl font-bold text-[#24232B] outline-none focus:border-[#7678ED]" /><input aria-label="สถานประกอบการ" value={draft.company} onChange={(event) => setDraft({ ...draft, company: event.target.value })} className="mt-2 w-full rounded-lg border border-[#DFE6EF] bg-white px-3 py-2 text-sm text-[#6D6979] outline-none focus:border-[#7678ED]" /></> : <><h2 id="job-dialog-title" className="mt-1 text-xl font-bold text-[#24232B]">{job.title}</h2><p className="mt-1 text-sm text-[#6D6979]">{job.company}</p></>}</div><button type="button" onClick={onClose} aria-label="ปิดหน้าต่าง" className="absolute right-6 top-6 flex size-8 items-center justify-center rounded-full text-lg text-[#6D6979] hover:bg-[#F1EEFC] hover:text-[#3D348B]">×</button></header><div className="min-h-0 flex-1 overflow-y-auto space-y-5 px-7 py-6">{editing ? <><div className="grid gap-3 sm:grid-cols-2"><label className="text-sm font-semibold">รูปแบบงาน<input value={draft.type} onChange={(event) => setDraft({ ...draft, type: event.target.value })} className={field} /></label><label className="text-sm font-semibold">จำนวนที่รับ<input min="0" type="number" value={draft.slots} onChange={(event) => setDraft({ ...draft, slots: Number(event.target.value) })} className={field} /></label><label className="text-sm font-semibold">จำนวนผู้สมัคร<input min="0" type="number" value={draft.applicants} onChange={(event) => setDraft({ ...draft, applicants: Number(event.target.value) })} className={field} /></label><label className="text-sm font-semibold">วันปิดรับ<input value={draft.deadline} onChange={(event) => setDraft({ ...draft, deadline: event.target.value })} className={field} /></label><label className="text-sm font-semibold">สาขา / ประเภทงาน<input value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })} className={field} /></label><label className="text-sm font-semibold">สถานที่<input value={draft.location} onChange={(event) => setDraft({ ...draft, location: event.target.value })} className={field} /></label><label className="text-sm font-semibold sm:col-span-2">สถานะการรับสมัคร<select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as JobStatus })} className={field}>{Object.keys(statusStyles).map((item) => <option key={item}>{item}</option>)}</select></label></div><section><h3 className="font-semibold text-[#24232B]">รายละเอียดงาน</h3><textarea value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} rows={4} className={field} /></section><section className="pb-5"><h3 className="font-semibold text-[#24232B]">คุณสมบัติผู้สมัคร</h3><textarea value={draft.qualifications.join("\n")} onChange={(event) => setDraft({ ...draft, qualifications: event.target.value.split("\n").map((item) => item.trim()).filter(Boolean) })} rows={4} className={field} /><p className="mt-1 text-xs text-[#6D6979]">กรอกหนึ่งคุณสมบัติต่อหนึ่งบรรทัด</p></section></> : <><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><Info label="รูปแบบงาน" value={job.type} /><Info label="จำนวนที่รับ" value={`${job.slots} คน`} /><Info label="จำนวนผู้สมัคร" value={`${job.applicants} ใบสมัคร`} /><Info label="วันปิดรับ" value={job.deadline} /><Info label="สาขา / ประเภทงาน" value={job.category} /><Info label="สถานที่" value={job.location} /></div><section className="flex items-center justify-between rounded-xl bg-[#F8F7FC] p-4"><p className="text-xs text-[#6D6979]">สถานะการรับสมัคร</p><span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${statusStyles[job.status]}`}>{job.status}</span></section><section><h3 className="font-semibold text-[#24232B]">รายละเอียดงาน</h3><p className="mt-2 text-sm leading-6 text-[#555]">{job.description}</p></section><section className="pb-5"><h3 className="font-semibold text-[#24232B]">คุณสมบัติผู้สมัคร</h3><ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-[#555]">{job.qualifications.map((item) => <li key={item}>{item}</li>)}</ul></section></>}</div><footer className="shrink-0 flex flex-wrap justify-end gap-3 border-t border-[#E9E6F2] bg-white px-7 py-5">{editing ? <><button type="button" onClick={cancelEditing} className="rounded-lg border border-[#DFE6EF] px-4 py-2.5 text-sm font-semibold hover:bg-[#F8F7FC]">ยกเลิก</button><button type="button" onClick={save} className="rounded-lg bg-[#3D348B] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#5146AA]">บันทึกการแก้ไข</button></> : <><button type="button" onClick={onClose} className="rounded-lg border border-[#DFE6EF] px-4 py-2.5 text-sm font-semibold hover:bg-[#F8F7FC]">ปิดหน้าต่าง</button><button type="button" onClick={() => setEditing(true)} className="rounded-lg bg-[#3D348B] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#5146AA]">แก้ไขตำแหน่งงาน</button></>}</footer></section></div>;
}
void JobDialogLegacy;

function JobDialog({ job, onClose, onSave }: { job: Job; onClose: () => void; onSave: (job: Job) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(job);
  const [saving, setSaving] = useState(false);
  const field = "mt-1.5 w-full rounded-lg border border-[#DFE6EF] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#7678ED] focus:ring-2 focus:ring-[#7678ED]/20";

  const save = async () => {
    setSaving(true);
    const status = draft.status === "ปิดรับสมัคร" ? "closed" : draft.status === "รอตรวจสอบ" ? "draft" : "open";
    try {
      const response = await fetch("/api/admin/jobs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: draft.id, title: draft.title, location: draft.location, department: draft.category, positions: Math.max(0, draft.slots), workType: draft.type, description: draft.description, qualifications: draft.qualifications, status }),
      });
      if (!response.ok) {
        const data = await response.json() as { error?: string };
        window.alert(data.error ?? "ไม่สามารถบันทึกตำแหน่งงานได้");
        return;
      }
      onSave({ ...draft, slots: Math.max(0, draft.slots) });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="job-dialog-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[#DFE6EF] bg-white shadow-[0_20px_40px_rgba(32,22,64,0.20)]">
        <header className="relative flex shrink-0 items-start gap-4 border-b border-[#DCE3EE] bg-[#F5F7FB] px-6 py-5 text-[#24232B]">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#3D348B] text-white"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-5"><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2" /></svg></span>
          <div className="min-w-0 pr-10"><h2 id="job-dialog-title" className="text-xl font-bold text-[#3D348B]">{editing ? "แก้ไขตำแหน่งงาน" : "รายละเอียดตำแหน่งงาน"}</h2><p className="mt-1 text-sm text-[#6D6979]">{editing ? "ปรับข้อมูลประกาศงานและบันทึกการเปลี่ยนแปลง" : job.company}</p></div>
          <button type="button" onClick={onClose} aria-label="ปิดหน้าต่าง" className="absolute right-5 top-5 flex size-9 items-center justify-center rounded-lg border border-[#DCE3EE] text-lg text-[#6D6979] hover:bg-white hover:text-[#3D348B]">×</button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
          {editing ? <div className="space-y-6">
            <section className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold text-[#403C52] sm:col-span-2">ชื่อตำแหน่งงาน<input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} className={field} /></label>
              <label className="text-sm font-semibold text-[#403C52] sm:col-span-2">สถานประกอบการ<input value={draft.company} readOnly className={`${field} cursor-not-allowed bg-[#F5F5F6] text-[#6D6979]`} /></label>
              <label className="text-sm font-semibold text-[#403C52]">รูปแบบงาน<input value={draft.type} onChange={(event) => setDraft({ ...draft, type: event.target.value })} className={field} /></label>
              <label className="text-sm font-semibold text-[#403C52]">จำนวนที่รับ<input min="0" type="number" value={draft.slots} onChange={(event) => setDraft({ ...draft, slots: Number(event.target.value) })} className={field} /></label>
              <label className="text-sm font-semibold text-[#403C52]">สาขา / ประเภทงาน<input value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })} className={field} /></label>
              <label className="text-sm font-semibold text-[#403C52]">สถานที่<input value={draft.location} onChange={(event) => setDraft({ ...draft, location: event.target.value })} className={field} /></label>
              <label className="text-sm font-semibold text-[#403C52] sm:col-span-2">สถานะการรับสมัคร<select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as JobStatus })} className={field}>{Object.keys(statusStyles).map((item) => <option key={item}>{item}</option>)}</select></label>
            </section>
            <section><h3 className="font-semibold text-[#24232B]">รายละเอียดงาน</h3><textarea value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} rows={4} className={field} /></section>
            <section><h3 className="font-semibold text-[#24232B]">คุณสมบัติผู้สมัคร</h3><textarea value={draft.qualifications.join("\n")} onChange={(event) => setDraft({ ...draft, qualifications: event.target.value.split("\n").map((item) => item.trim()).filter(Boolean) })} rows={4} className={field} /><p className="mt-1 text-xs text-[#6D6979]">กรอกหนึ่งคุณสมบัติต่อหนึ่งบรรทัด</p></section>
          </div> : <div className="space-y-6">
            <section className="rounded-xl border border-[#E8E5F2] bg-[#FAF9FE] p-5"><h3 className="text-xl font-bold text-[#24232B]">{job.title}</h3><p className="mt-2 text-sm text-[#6D6979]">{job.company} · {job.location}</p></section>
            <div className="grid gap-3 sm:grid-cols-2"><Info label="รูปแบบงาน" value={job.type} /><Info label="จำนวนที่รับ" value={`${job.slots} คน`} /><Info label="จำนวนผู้สมัคร" value={`${job.applicants} ใบสมัคร`} /><Info label="สาขา / ประเภทงาน" value={job.category} /></div>
            <section className="flex items-center justify-between rounded-xl bg-[#F8F7FC] p-4"><p className="text-sm text-[#6D6979]">สถานะการรับสมัคร</p><span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${statusStyles[job.status]}`}>{job.status}</span></section>
            <section><h3 className="font-semibold text-[#24232B]">รายละเอียดงาน</h3><p className="mt-2 text-sm leading-6 text-[#555]">{job.description || "-"}</p></section>
            <section><h3 className="font-semibold text-[#24232B]">คุณสมบัติผู้สมัคร</h3><ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-[#555]">{job.qualifications.length ? job.qualifications.map((item) => <li key={item}>{item}</li>) : <li>-</li>}</ul></section>
          </div>}
        </div>

        <footer className="flex shrink-0 flex-wrap justify-end gap-3 border-t border-[#E9E6F2] bg-[#F8F8FA] px-6 py-4">
          {editing ? <><button type="button" disabled={saving} onClick={() => { setDraft(job); setEditing(false); }} className="rounded-lg border border-[#DFE6EF] bg-white px-5 py-2.5 text-sm font-semibold hover:bg-gray-50">ยกเลิก</button><button type="button" disabled={saving} onClick={save} className="rounded-lg bg-[#3D348B] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#5146AA] disabled:opacity-60">{saving ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}</button></> : <><button type="button" onClick={onClose} className="rounded-lg border border-[#DFE6EF] bg-white px-5 py-2.5 text-sm font-semibold hover:bg-gray-50">ปิด</button><button type="button" onClick={() => setEditing(true)} className="rounded-lg bg-[#3D348B] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#5146AA]">แก้ไขข้อมูล</button></>}
        </footer>
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-[#F8F7FC] p-4"><p className="text-xs text-[#6D6979]">{label}</p><p className="mt-1 text-sm font-semibold text-[#24232B]">{value}</p></div>;
}
