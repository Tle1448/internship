"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Building2, CheckCircle2, ClipboardCheck, Clock, Loader2 } from "lucide-react";
import ConditerSidebar from "@/components/ConditerSidebar";
import { supabase } from "@/lib/supabase";

type RecentApplication = {
  id: string;
  company_name: string;
  job_title: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  student: { full_name: string | null }[] | null;
};

export default function ConditerPage() {
  const [companyCount, setCompanyCount] = useState(0);
  const [jobCount, setJobCount] = useState(0);
  const [applicationCount, setApplicationCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [applications, setApplications] = useState<RecentApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadDashboard();
  }, []);

  async function loadDashboard() {
    const [companies, jobs, allApplications, pendingApplications, recentApplications] = await Promise.all([
      supabase.from("companies").select("id", { count: "exact", head: true }),
      supabase.from("jobs").select("id", { count: "exact", head: true }).is("archived_at", null),
      supabase.from("job_applications").select("id", { count: "exact", head: true }),
      supabase.from("job_applications").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase
        .from("job_applications")
        .select("id, company_name, job_title, status, student:profiles!job_applications_student_id_fkey(full_name)")
        .order("submitted_at", { ascending: false })
        .limit(5),
    ]);

    setCompanyCount(companies.count ?? 0);
    setJobCount(jobs.count ?? 0);
    setApplicationCount(allApplications.count ?? 0);
    setPendingCount(pendingApplications.count ?? 0);
    setApplications((recentApplications.data ?? []) as RecentApplication[]);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#F8F7FB] text-[#29263A]">
      <ConditerSidebar />
      <main className="min-h-screen lg:ml-[235px]">
        <header className="border-b border-[#E8E6F0] bg-white px-6 py-6 lg:px-8">
          <p className="text-[11px] text-[#9691A7]">ระบบสหกิจศึกษา</p>
          <h1 className="mt-1 text-2xl font-bold text-[#29263A]">การจัดการฝึกงาน</h1>
          <p className="mt-1 text-sm text-[#858196]">ข้อมูลบริษัท ประกาศงาน และใบสมัครจากฐานข้อมูล</p>
        </header>

        <div className="px-6 py-6 lg:px-8">
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard title="บริษัททั้งหมด" value={companyCount} icon={<Building2 size={21} />} iconClass="bg-[#EFEEFC] text-[#3D348B]" />
            <StatCard title="ประกาศที่แสดงอยู่" value={jobCount} icon={<BriefcaseBusiness size={21} />} iconClass="bg-[#FFF4DC] text-[#F18701]" />
            <StatCard title="รอพิจารณา" value={pendingCount} icon={<Clock size={21} />} iconClass="bg-[#FFF7D6] text-[#C38A00]" />
            <StatCard title="การสมัครทั้งหมด" value={applicationCount} icon={<ClipboardCheck size={21} />} iconClass="bg-[#E9F8EF] text-[#2D9B59]" />
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <QuickCard href="/conditer/companies" icon={<Building2 size={21} />} title="รายการบริษัท" description="ดูบริษัท ประกาศที่ใช้งาน และประวัติประกาศ" />
            <QuickCard href="/conditer/jobs/create" icon={<BriefcaseBusiness size={21} />} title="สร้างประกาศงาน" description="เพิ่มบริษัทและประกาศงานลงฐานข้อมูล" />
            <QuickCard href="/conditer/applications" icon={<ClipboardCheck size={21} />} title="การสมัครงาน" description="ตรวจสอบและพิจารณาใบสมัครของนักศึกษา" />
          </div>

          <section className="overflow-hidden rounded-lg border border-[#E8E6F0] bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-[#ECEAF2] px-5 py-5">
              <div><h2 className="text-base font-bold text-[#302D42]">การสมัครงานล่าสุด</h2><p className="mt-1 text-xs text-[#9994A8]">รายการจากฐานข้อมูล</p></div>
              <Link href="/conditer/applications" className="flex items-center gap-1 text-xs font-semibold text-[#3D348B]">ดูทั้งหมด<ArrowRight size={14} /></Link>
            </div>
            {loading ? (
              <div className="flex justify-center py-10"><Loader2 className="animate-spin text-[#3D348B]" /></div>
            ) : applications.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-[#858095]">ยังไม่มีใบสมัคร</p>
            ) : applications.map((application) => (
              <div key={application.id} className="flex flex-col gap-3 border-b border-[#F0EEF4] px-5 py-4 last:border-b-0 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EFEEFC] text-xs font-bold text-[#3D348B]">{(application.student?.[0]?.full_name || "?").slice(0, 1)}</div>
                  <div><p className="text-sm font-semibold text-[#353143]">{application.student?.[0]?.full_name || "ไม่ระบุชื่อ"}</p><p className="mt-1 text-[11px] text-[#858095]">{application.company_name} · {application.job_title}</p></div>
                </div>
                <StatusBadge status={application.status} />
              </div>
            ))}
          </section>
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, icon, iconClass }: { title: string; value: number; icon: React.ReactNode; iconClass: string }) {
  return <div className="rounded-lg border border-[#E8E6F0] bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-xs text-[#8C879B]">{title}</p><p className="mt-2 text-2xl font-bold text-[#302D42]">{value}</p></div><div className={"flex h-11 w-11 items-center justify-center rounded-lg " + iconClass}>{icon}</div></div></div>;
}

function QuickCard({ href, icon, title, description }: { href: string; icon: React.ReactNode; title: string; description: string }) {
  return <Link href={href} className="group rounded-lg border border-[#E8E6F0] bg-white p-5 shadow-sm transition hover:border-[#D6D2EC] hover:shadow-md"><div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-[#EFEEFC] text-[#3D348B]">{icon}</div><div className="flex items-center justify-between"><h3 className="text-sm font-bold text-[#353143]">{title}</h3><ArrowRight size={16} className="text-[#AAA6B8] transition group-hover:translate-x-1 group-hover:text-[#3D348B]" /></div><p className="mt-1 text-[11px] text-[#9994A8]">{description}</p></Link>;
}

function StatusBadge({ status }: { status: RecentApplication["status"] }) {
  const labels = { pending: "รอพิจารณา", approved: "อนุมัติแล้ว", rejected: "ไม่อนุมัติ", cancelled: "ยกเลิก" };
  const styles = status === "pending" ? "bg-[#FFF7D6] text-[#A97800]" : status === "approved" ? "bg-[#E9F8EF] text-[#23864B]" : "bg-[#FDECEC] text-[#D94B4B]";
  return <span className={"inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-semibold " + styles}>{status === "approved" && <CheckCircle2 size={12} />}{status === "pending" && <Clock size={12} />}{labels[status]}</span>;
}
