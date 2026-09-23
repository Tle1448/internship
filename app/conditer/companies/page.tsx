"use client";

import { useEffect, useMemo, useState } from "react";
import { Archive, BriefcaseBusiness, Building2, Eye, Loader2, Mail, MapPin, Phone, RotateCcw, Trash2, User, Users, X } from "lucide-react";
import ConditerSidebar from "@/components/ConditerSidebar";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";

type Job = {
  id: string;
  company_id: string | null;
  title: string;
  location: string | null;
  department: string | null;
  positions: number;
  work_type: string | null;
  description: string | null;
  qualifications: string[] | null;
  welfare: string | null;
  start_date: string | null;
  end_date: string | null;
  status: "draft" | "open" | "closed";
  archived_at: string | null;
};

type CompanyRow = {
  id: string;
  name: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  location: string;
};

type Company = CompanyRow & { jobs: Job[] };

export default function CompaniesPage() {
  const { user } = useAuth();
  const [companyRows, setCompanyRows] = useState<CompanyRow[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [mutatingJobId, setMutatingJobId] = useState<string | null>(null);

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [companiesResult, jobsResult] = await Promise.all([
      supabase.from("companies").select("id, name, contact_name, contact_email, contact_phone, location").order("name"),
      supabase.from("jobs").select("id, company_id, title, location, department, positions, work_type, description, qualifications, welfare, start_date, end_date, status, archived_at").order("created_at", { ascending: false }),
    ]);

    if (companiesResult.error || jobsResult.error) {
      setError("ไม่สามารถโหลดข้อมูลบริษัทและประกาศงานได้");
    } else {
      setCompanyRows((companiesResult.data ?? []) as CompanyRow[]);
      setJobs((jobsResult.data ?? []) as Job[]);
    }
    setLoading(false);
  }

  const companies = useMemo<Company[]>(() => {
    const visibleJobs = jobs.filter((job) => showArchived ? job.archived_at !== null : job.archived_at === null);
    return companyRows
      .map((company) => ({ ...company, jobs: visibleJobs.filter((job) => job.company_id === company.id) }))
      .filter((company) => company.jobs.length > 0);
  }, [companyRows, jobs, showArchived]);

  const filteredCompanies = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return companies;
    return companies.filter((company) =>
      company.name.toLowerCase().includes(keyword)
      || (company.contact_name ?? "").toLowerCase().includes(keyword)
      || company.jobs.some((job) => job.title.toLowerCase().includes(keyword))
    );
  }, [companies, search]);

  const selectedCompany = companies.find((company) => company.id === selectedCompanyId) ?? null;
  const jobCount = companies.reduce((total, company) => total + company.jobs.length, 0);
  const totalPositions = companies.flatMap((company) => company.jobs).reduce((total, job) => total + (job.positions || 0), 0);

  async function updateArchive(job: Job, archive: boolean) {
    const verb = archive ? "เก็บประกาศ" : "กู้คืนประกาศ";
    if (!window.confirm(verb + " \"" + job.title + "\" ใช่หรือไม่?")) return;
    if (archive && !user) return;

    setMutatingJobId(job.id);
    const archivedAt = archive ? new Date().toISOString() : null;
    const { error: updateError } = await supabase
      .from("jobs")
      .update({ archived_at: archivedAt, archived_by: archive ? user?.id : null })
      .eq("id", job.id);

    if (updateError) {
      alert("ไม่สามารถบันทึกการเปลี่ยนแปลงได้");
    } else {
      setJobs((current) => current.map((item) => item.id === job.id ? { ...item, archived_at: archivedAt } : item));
      setSelectedCompanyId(null);
    }
    setMutatingJobId(null);
  }

  return (
    <div className="min-h-screen bg-[#F7F6FB]">
      <ConditerSidebar />
      <main className="lg:ml-[235px]">
        <div className="mx-auto max-w-[1400px] px-5 py-7 lg:px-8">
          <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div><p className="text-xs text-[#9995A8]">Coordinator</p><h1 className="mt-1 text-2xl font-bold text-[#302C44]">บริษัทและประกาศงาน</h1></div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setShowArchived(false)} className={"rounded-lg px-4 py-2 text-xs font-semibold " + (!showArchived ? "bg-[#3D348B] text-white" : "border border-[#DDD9E8] bg-white text-[#696579]")}>ประกาศที่แสดงอยู่</button>
              <button type="button" onClick={() => setShowArchived(true)} className={"flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold " + (showArchived ? "bg-[#3D348B] text-white" : "border border-[#DDD9E8] bg-white text-[#696579]")}><Archive size={15} />ประวัติประกาศ</button>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <Stat label={showArchived ? "บริษัทในประวัติ" : "บริษัทที่มีประกาศ"} value={companies.length} icon={<Building2 size={21} />} className="bg-[#EFEEFC] text-[#3D348B]" />
            <Stat label={showArchived ? "ประกาศที่เก็บแล้ว" : "ประกาศที่แสดงอยู่"} value={jobCount} icon={<BriefcaseBusiness size={21} />} className="bg-[#FFF4DD] text-[#F18701]" />
            <Stat label="จำนวนตำแหน่ง" value={totalPositions} icon={<Users size={21} />} className="bg-[#EAF8F0] text-[#159447]" />
          </div>

          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ค้นหาบริษัท ผู้ติดต่อ หรือตำแหน่งงาน" className="mb-6 w-full max-w-xl rounded-lg border border-[#DDD9E8] bg-white px-4 py-3 text-sm outline-none focus:border-[#7678ED]" />

          {loading ? (
            <div className="flex justify-center py-20 text-[#6B667B]"><Loader2 className="animate-spin" /></div>
          ) : error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
          ) : filteredCompanies.length === 0 ? (
            <div className="rounded-lg border border-[#E7E4EF] bg-white px-6 py-16 text-center text-sm text-[#777287]">ไม่พบข้อมูลในมุมมองนี้</div>
          ) : (
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
              {filteredCompanies.map((company) => (
                <div key={company.id} className="rounded-lg border border-[#E7E4EF] bg-white p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#EFEEFC] text-[#3D348B]"><Building2 size={24} /></div>
                      <div className="min-w-0"><h2 className="text-base font-bold text-[#302C44]">{company.name}</h2><p className="mt-1 flex items-center gap-2 text-xs text-[#8B8799]"><User size={14} />{company.contact_name || "ไม่ระบุผู้ติดต่อ"}</p></div>
                    </div>
                    <span className="rounded-full bg-[#EFEEFC] px-3 py-1.5 text-[11px] font-semibold text-[#3D348B]">{company.jobs.length} ประกาศ</span>
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-3 rounded-lg bg-[#FAF9FC] p-4 text-xs text-[#5E5A70]"><p className="flex min-w-0 items-center gap-2 truncate"><Mail size={14} className="shrink-0 text-[#7678ED]" />{company.contact_email || "-"}</p><p className="flex items-center gap-2"><Phone size={14} className="shrink-0 text-[#7678ED]" />{company.contact_phone || "-"}</p></div>
                  <div className="mt-5 space-y-2">
                    {company.jobs.map((job) => (
                      <div key={job.id} className="flex items-center justify-between gap-3 rounded-lg border border-[#EEEAF3] px-4 py-3">
                        <div className="min-w-0"><p className="truncate text-xs font-semibold text-[#403C52]">{job.title}</p><p className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-[#9995A8]"><span className="flex items-center gap-1"><MapPin size={12} />{job.location || "ไม่ระบุสถานที่"}</span><span>{job.work_type || "-"}</span><span>{job.status}</span></p></div>
                        <button type="button" disabled={mutatingJobId === job.id} onClick={() => void updateArchive(job, !showArchived)} title={showArchived ? "กู้คืนประกาศ" : "เก็บเข้าประวัติ"} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#777287] hover:bg-[#F4F3FC] disabled:opacity-50">{mutatingJobId === job.id ? <Loader2 size={15} className="animate-spin" /> : showArchived ? <RotateCcw size={15} /> : <Trash2 size={15} />}</button>
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={() => setSelectedCompanyId(company.id)} className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg border border-[#DDD9E8] py-3 text-xs font-semibold text-[#3D348B] hover:bg-[#F4F3FC]"><Eye size={16} />ดูรายละเอียด</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {selectedCompany && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" onClick={() => setSelectedCompanyId(null)}>
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="sticky top-0 flex items-center justify-between border-b border-[#ECE9F1] bg-white px-6 py-5"><div><h2 className="text-lg font-bold text-[#29263E]">{selectedCompany.name}</h2><p className="mt-1 text-xs text-[#9691A5]">{selectedCompany.location || "ไม่ระบุสถานที่"}</p></div><button type="button" onClick={() => setSelectedCompanyId(null)} className="flex h-9 w-9 items-center justify-center rounded-lg text-[#777287] hover:bg-[#F5F3FA]"><X size={20} /></button></div>
            <div className="space-y-5 p-6">
              {selectedCompany.jobs.map((job) => (
                <article key={job.id} className="rounded-lg border border-[#E9E6F0] p-5">
                  <div className="flex items-start justify-between gap-4"><div><h3 className="text-sm font-bold text-[#302C44]">{job.title}</h3><p className="mt-1 text-xs text-[#777287]">{job.department || "ไม่ระบุแผนก"} · {job.work_type || "-"}</p></div><button type="button" disabled={mutatingJobId === job.id} onClick={() => void updateArchive(job, !showArchived)} className="flex items-center gap-2 rounded-lg border border-[#DDD9E8] px-3 py-2 text-xs font-semibold text-[#3D348B] disabled:opacity-50">{showArchived ? <RotateCcw size={15} /> : <Trash2 size={15} />}{showArchived ? "กู้คืน" : "เก็บเข้าประวัติ"}</button></div>
                  <div className="mt-4 grid grid-cols-1 gap-3 text-xs text-[#5E5A70] md:grid-cols-3"><p>สถานที่: {job.location || "-"}</p><p>รับ: {job.positions} คน</p><p>สมัคร: {job.start_date || "-"} ถึง {job.end_date || "-"}</p></div>
                  {job.description && <Section title="รายละเอียดงาน" value={job.description} />}
                  {job.qualifications && job.qualifications.length > 0 && <Section title="คุณสมบัติ" value={job.qualifications.join("\n")} />}
                  {job.welfare && <Section title="สวัสดิการ" value={job.welfare} />}
                </article>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, icon, className }: { label: string; value: number; icon: React.ReactNode; className: string }) {
  return <div className="flex items-center justify-between rounded-lg border border-[#E7E4EF] bg-white p-5"><div><p className="text-xs text-[#9995A8]">{label}</p><p className="mt-2 text-2xl font-bold text-[#302C44]">{value}</p></div><div className={"flex h-11 w-11 items-center justify-center rounded-lg " + className}>{icon}</div></div>;
}

function Section({ title, value }: { title: string; value: string }) {
  return <div className="mt-4 border-t border-[#EEEAF3] pt-4"><p className="text-[10px] font-semibold text-[#AAA6B7]">{title}</p><p className="mt-2 whitespace-pre-line text-xs leading-6 text-[#696579]">{value}</p></div>;
}
