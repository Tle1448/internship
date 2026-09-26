import AdminSidebar from "@/components/AdminSidebar";
import AdminBreadcrumb from "@/components/AdminBreadcrumb";
import AdminDashboardActions from "@/components/AdminDashboardActions";
import ApplicationRoundOverview from "@/components/ApplicationRoundOverview";
import DeadlineOverview from "@/components/DeadlineOverview";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import React from "react";
import Link from "next/link";

function DashboardIcon({ name, className = "size-5" }: { name: "chart" | "file" | "building" | "briefcase" | "cap" | "clipboard"; className?: string }) {
  const paths = {
    chart: <><path d="M4 19V5M4 19h16" /><path d="m7 15 3-3 3 2 5-6" /></>,
    file: <><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v5h5M9 12h6M9 16h6" /></>,
    building: <><path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16M2 21h20M8 7h2m-2 4h2m-2 4h2m4-8h2m-2 4h2m-2 4h2" /></>,
    briefcase: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2" /></>,
    cap: <><path d="m2 9 10-5 10 5-10 5z" /><path d="M6 11v5c3 2 9 2 12 0v-5M22 9v6" /></>,
    clipboard: <><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4V2h6v2M9 11h6M9 15h6" /></>,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>{paths[name]}</svg>;
}

function relativeTime(value: string) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return "เมื่อสักครู่";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} นาทีที่แล้ว`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} ชั่วโมงที่แล้ว`;
  return `${Math.floor(seconds / 86400)} วันที่แล้ว`;
}

export default async function AdminDashboardPage() {
  const [studentsResult, advisorsResult, recordsResult, companiesResult, jobsResult, documentsResult, applicationsResult, activitiesResult] = await Promise.all([
    supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "student"),
    supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "advisor"),
    supabaseAdmin.from("internship_records").select("placement_status"),
    supabaseAdmin.from("companies").select("approval_status"),
    supabaseAdmin.from("jobs").select("status, positions"),
    supabaseAdmin.from("student_documents").select("status"),
    supabaseAdmin.from("job_applications").select("status"),
    supabaseAdmin.from("admin_activity_logs").select("id, summary, entity_type, created_at").order("created_at", { ascending: false }).limit(3),
  ]);
  const students = studentsResult.count ?? 0;
  const studentsError = studentsResult.error?.message;
  const advisors = advisorsResult.count ?? 0;
  const records = recordsResult.data ?? [];
  const companies = companiesResult.data ?? [];
  const jobs = jobsResult.data ?? [];
  const documents = documentsResult.data ?? [];
  const applications = applicationsResult.data ?? [];
  // A placement is final only after the coordinator approval workflow sets
  // placement_status to "approved". Other states must not inflate this count.
  const placedStudents = records.filter((record) => record.placement_status === "approved").length;
  const approvedCompanies = companies.filter((company) => company.approval_status === "approved").length;
  const pendingCompanies = companies.filter((company) => company.approval_status === "pending").length;
  const openJobs = jobs.filter((job) => job.status === "open");
  const openPositions = openJobs.reduce((total, job) => total + (job.positions ?? 0), 0);
  const pendingJobs = jobs.filter((job) => job.status === "draft").length;
  const pendingDocuments = documents.filter((document) => document.status === "pending").length;
  const approvedDocuments = documents.filter((document) => document.status === "approved").length;
  const returnedDocuments = documents.filter((document) => document.status === "needs_edit").length;
  const pendingApplications = applications.filter((application) => application.status === "pending").length;
  const approvedApplications = applications.filter((application) => application.status === "approved").length;
  const totalApplications = applications.length;
  const activities = activitiesResult.data ?? [];
  const placementPercent = students ? Math.round((placedStudents / students) * 100) : 0;
  const inProgressStudents = records.filter((record) => record.placement_status === "pending").length;
  const inProgressPercent = students ? Math.round((inProgressStudents / students) * 100) : 0;
  const remainingStudents = Math.max(0, students - placedStudents - inProgressStudents);
  const remainingPercent = students ? Math.max(0, 100 - placementPercent - inProgressPercent) : 0;
  const pendingApplicationPercent = totalApplications ? Math.round((pendingApplications / totalApplications) * 100) : 0;
  const approvedApplicationPercent = totalApplications ? Math.round((approvedApplications / totalApplications) * 100) : 0;
  const advisorPendingTotal = pendingDocuments + pendingApplications;
  const pendingDocumentPercent = advisorPendingTotal ? Math.round((pendingDocuments / advisorPendingTotal) * 100) : 0;
  const pendingApplicationsForAdvisorPercent = advisorPendingTotal ? Math.round((pendingApplications / advisorPendingTotal) * 100) : 0;
  return (
    <div className="flex min-h-screen bg-[#FAF8FD] font-sans text-[#24232B]">
      {/* เมนูด้านซ้าย */}
      <AdminSidebar active="dashboard" />

      {/* พื้นที่เนื้อหาหลัก */}
      <div className="flex min-w-0 flex-grow flex-col md:ml-[285px]">

        {/* เนื้อหาหน้าภาพรวมระบบ */}
        <main className="flex w-full max-w-none flex-col p-5 lg:p-10">

          <AdminBreadcrumb isRoot />
          <header className="flex flex-col items-start justify-between gap-4 py-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-3xl font-bold text-[#24232B]">
                ภาพรวมระบบ
              </h1>
              <p className="mt-1 text-[#6D6979]">
                ติดตามภาพรวมข้อมูลนักศึกษา สถานประกอบการ และการฝึกงานในระบบ
              </p>
            </div>

            {/* ปุ่มดำเนินการด่วน */}
            <AdminDashboardActions report={{ students, companies: companies.length, openJobs: openJobs.length, pendingDocuments }} />
          </header>
          {studentsError && <p role="alert" className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">ไม่สามารถโหลดจำนวนนักศึกษาได้: {studentsError}</p>}
          

          {/* สรุปข้อมูลสำคัญ */}
          <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 [&>div]:min-h-[176px] [&>div]:rounded-[14px] [&>div]:border-[#DFE6EF] [&>div]:p-[22px] [&>div]:shadow-[0_2px_5px_rgba(15,23,42,0.08)] [&>div]:hover:shadow-[0_5px_14px_rgba(15,23,42,0.12)]">
            <div className="flex flex-col justify-center bg-white border border-[#EAEAEA] rounded-xl p-5 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-semibold text-black">
                  นักศึกษาทั้งหมด
                </span>
              </div>
              <div className="font-mono text-3xl font-bold text-black mb-2">
                {students} <span className="text-sm font-normal">คน</span>
              </div>
              <div className="text-xs flex items-center gap-2">
                <span className="text-[#3D348B] font-semibold">{placedStudents} ได้ที่ฝึกงาน</span>{" "}
                / {Math.max(0, students - placedStudents)} กำลังค้นหา
              </div>
            </div>

            <div className="flex flex-col justify-center bg-white border border-[#EAEAEA] rounded-xl p-5 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-semibold text-black">
                  สถานประกอบการ
                </span>
              </div>
              <div className="font-mono text-3xl font-bold text-black mb-2">
                {companies.length} <span className="text-sm font-normal">แห่ง</span>
              </div>
              <div className="text-xs flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#3D348B] text-white">
                  {approvedCompanies} อนุมัติแล้ว
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#F18701] text-white">
                  {pendingCompanies} รออนุมัติ
                </span>
              </div>
            </div>

            <div className="flex flex-col justify-center bg-white border border-[#EAEAEA] rounded-xl p-5 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-semibold text-black">
                  ตำแหน่งงานที่เปิดรับ
                </span>
              </div>
              <div className="font-mono text-3xl font-bold text-black mb-2">
                {openPositions} <span className="text-sm font-normal">อัตรา</span>
              </div>
              <div className="text-xs text-black">
                {openJobs.length} ตำแหน่ง จาก {companies.length} สถานประกอบการ
              </div>
            </div>

            <div className="flex flex-col justify-center bg-white border border-[#EAEAEA] rounded-xl p-5 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-semibold text-black">
                  เอกสารรอตรวจสอบ
                </span>
              </div>
              <div className="font-mono text-3xl font-bold text-black mb-2">
                {pendingDocuments} <span className="text-sm font-normal">ฉบับ</span>
              </div>
              <div className="text-xs flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#F35B04] text-white">
                  รอตรวจสอบ
                </span>
              </div>
            </div>
          </div>

          {/* สรุปข้อมูลและกำหนดการ */}
          <div className="order-2 grid grid-cols-1 gap-5 lg:grid-cols-2 [&_#application-rounds]:rounded-[14px] [&_#application-rounds]:border-[#DFE6EF] [&_#application-rounds]:shadow-[0_2px_5px_rgba(15,23,42,0.08)]">
            {/* สถานะการสมัครของนักศึกษา */}
            <div className="min-w-0 rounded-[14px] border border-[#DFE6EF] bg-white p-6 shadow-[0_2px_5px_rgba(15,23,42,0.08)]">
              <div className="mb-5">
                <div className="text-base font-bold">
                  <span className="inline-flex items-center gap-2"><span className="flex size-8 items-center justify-center rounded-lg bg-[#EEECFF] text-[#3D348B]"><DashboardIcon name="chart" className="size-4" /></span>ความก้าวหน้าการสมัครของนักศึกษา</span>
                </div>
                <div className="text-xs text-black">
                  ความก้าวหน้าสถานะการสมัครของนักศึกษา {students} คน
                </div>
              </div>

              <div className="h-4 bg-[#7678ED] rounded-full overflow-hidden flex mb-5">
                <div
                  style={{ width: `${placementPercent}%` }}
                  className="h-full bg-[#3D348B]"
                ></div>
                <div
                  style={{ width: `${inProgressPercent}%` }}
                  className="h-full bg-[#F7B801]"
                ></div>
                <div
                  style={{ width: `${pendingApplicationPercent}%` }}
                  className="h-full bg-[#F18701]"
                ></div>
                <div
                  style={{ width: `${Math.max(0, remainingPercent - pendingApplicationPercent)}%` }}
                  className="h-full bg-[#7678ED]"
                ></div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-[#3D348B]"></div>
                  <div>
                    <strong>ได้ที่ฝึกงาน:</strong> {placedStudents} คน ({placementPercent}%)
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-[#F7B801]"></div>
                  <div>
                    <strong>กำลังดำเนินการ:</strong> {inProgressStudents} คน ({inProgressPercent}%)
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-[#F18701]"></div>
                  <div>
                    <strong>ใบสมัครรอพิจารณา:</strong> {pendingApplications} คน ({pendingApplicationPercent}%)
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-gray-300"></div>
                  <div>
                    <strong>กำลังค้นหา:</strong> {remainingStudents} คน ({Math.max(0, remainingPercent - pendingApplicationPercent)}%)
                  </div>
                </div>
              </div>
            </div>

            <ApplicationRoundOverview />
          </div>

          <section aria-labelledby="admin-actions-title" className="order-1 mb-8 grid items-start gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div className="rounded-[14px] border border-[#DFE6EF] bg-white p-5 shadow-[0_2px_5px_rgba(15,23,42,0.08)] sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 id="admin-actions-title" className="text-lg font-bold text-black">งานที่ต้องดำเนินการ</h2>
                  <p className="mt-1 text-sm text-black">รายการที่ควรตรวจสอบและจัดการในวันนี้</p>
                </div>
                <span className="rounded-full bg-[#F35B04] px-3 py-1 text-xs font-semibold text-white">{pendingDocuments + pendingCompanies + pendingJobs} งานเร่งด่วน</span>
              </div>

              <div className="mt-5 divide-y divide-[#EAEAEA]">
                <Link href="/admin/student" className="flex items-center gap-4 py-4 transition hover:bg-[#7678ED]/10">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#FFE0D5] text-[#F35B04]"><DashboardIcon name="file" /></span>
                  <span className="min-w-0 flex-1"><span className="block font-semibold">เอกสารรอตรวจสอบ</span><span className="mt-0.5 block text-xs text-black">ตรวจสอบเอกสารของนักศึกษาก่อนเริ่มฝึกงาน</span></span>
                  <span className="rounded-full bg-[#F35B04] px-2.5 py-1 text-xs font-bold text-white">{pendingDocuments} ฉบับ</span>
                  <span aria-hidden="true" className="text-lg text-[#3D348B]">›</span>
                </Link>
                <Link href="/admin/companies" className="flex items-center gap-4 py-4 transition hover:bg-[#7678ED]/10">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF0DD] text-[#F18701]"><DashboardIcon name="building" /></span>
                  <span className="min-w-0 flex-1"><span className="block font-semibold">สถานประกอบการรออนุมัติ</span><span className="mt-0.5 block text-xs text-black">ตรวจสอบข้อมูลบริษัทและผู้ติดต่อก่อนเปิดใช้งาน</span></span>
                  <span className="rounded-full bg-[#F18701] px-2.5 py-1 text-xs font-bold text-white">{pendingCompanies} แห่ง</span>
                  <span aria-hidden="true" className="text-lg text-[#3D348B]">›</span>
                </Link>
                <Link href="/admin/jobs" className="flex items-center gap-4 py-4 transition hover:bg-[#7678ED]/10">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#EEECFF] text-[#3D348B]"><DashboardIcon name="briefcase" /></span>
                  <span className="min-w-0 flex-1"><span className="block font-semibold">ตำแหน่งงานรอตรวจสอบ</span><span className="mt-0.5 block text-xs text-black">ทบทวนคุณสมบัติและวันปิดรับสมัครของประกาศงาน</span></span>
                  <span className="rounded-full bg-[#3D348B] px-2.5 py-1 text-xs font-bold text-white">{pendingJobs} ตำแหน่ง</span>
                  <span aria-hidden="true" className="text-lg text-[#3D348B]">›</span>
                </Link>
              </div>
            </div>

            <DeadlineOverview />
          </section>

          <section aria-label="ภาพรวมการดำเนินงานของอาจารย์และผู้ประสานงาน" className="order-3 mt-8 grid items-start gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <section aria-labelledby="advisor-overview-title" className="rounded-[14px] border border-[#DFE6EF] bg-white p-5 shadow-[0_2px_5px_rgba(15,23,42,0.08)] sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><h2 id="advisor-overview-title" className="text-lg font-bold text-black">การติดตามของอาจารย์นิเทศ</h2><p className="mt-1 text-sm text-black">ภาพรวมการดูแลและประเมินนักศึกษา</p></div>
                <span className="flex size-10 items-center justify-center rounded-xl bg-[#EEECFF] text-[#3D348B]"><DashboardIcon name="cap" /></span>
              </div>
              <div className="mt-5 grid auto-rows-fr gap-3 sm:grid-cols-3">
                <Link href="/advisor" className="h-full rounded-xl border border-[#E3DFFA] bg-[#F8F7FC] p-4 transition hover:border-[#7678ED]"><p className="text-xs font-semibold text-[#6D6979]">อาจารย์นิเทศ</p><p className="mt-2 font-mono text-3xl font-bold text-[#3D348B]">{advisors} <span className="font-sans text-sm font-normal text-[#858390]">คน</span></p></Link>
                <Link href="/advisor/students" className="h-full rounded-xl border border-[#E3DFFA] bg-[#F8F7FC] p-4 transition hover:border-[#7678ED]"><p className="text-xs font-semibold text-[#6D6979]">นักศึกษาในความดูแล</p><p className="mt-2 font-mono text-3xl font-bold text-[#3D348B]">{students} <span className="font-sans text-sm font-normal text-[#858390]">คน</span></p></Link>
                <Link href="/advisor/tasks" className="h-full rounded-xl border border-[#FBE0D4] bg-[#FFF8F4] p-4 transition hover:border-[#F35B04]"><p className="text-xs font-semibold text-[#6D6979]">งานรอดำเนินการ</p><p className="mt-2 font-mono text-3xl font-bold text-[#F35B04]">{pendingDocuments + pendingApplications} <span className="font-sans text-sm font-normal text-[#858390]">รายการ</span></p></Link>
              </div>
              <div className="mt-4 space-y-3 rounded-xl bg-[#F8F7FC] p-4">
                <div className="flex items-center justify-between gap-3 text-sm"><Link href="/advisor/tasks" className="font-medium text-[#3D348B] hover:underline">ใบสมัครรอพิจารณา</Link><span className="font-mono font-bold text-[#24232B]">{pendingApplications} รายการ · {pendingApplicationsForAdvisorPercent}%</span></div><div className="h-2 overflow-hidden rounded-full bg-[#E9E6F2]"><div style={{ width: `${pendingApplicationsForAdvisorPercent}%` }} className="h-full rounded-full bg-[#F35B04]" /></div>
                <div className="flex items-center justify-between gap-3 text-sm"><Link href="/advisor/tasks" className="font-medium text-[#3D348B] hover:underline">เอกสารรอตรวจ</Link><span className="font-mono font-bold text-[#24232B]">{pendingDocuments} ฉบับ · {pendingDocumentPercent}%</span></div><div className="h-2 overflow-hidden rounded-full bg-[#E9E6F2]"><div style={{ width: `${pendingDocumentPercent}%` }} className="h-full rounded-full bg-[#3D348B]" /></div>
              </div>
              <Link href="/advisor/students" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#3D348B] hover:text-[#7678ED]">ดูการติดตามนักศึกษาทั้งหมด <span aria-hidden="true">→</span></Link>
            </section>

            <section aria-labelledby="coordinator-overview-title" className="rounded-[14px] border border-[#DFE6EF] bg-white p-5 shadow-[0_2px_5px_rgba(15,23,42,0.08)] sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><h2 id="coordinator-overview-title" className="text-lg font-bold text-black">การดำเนินงานของผู้ประสานงาน</h2><p className="mt-1 text-sm text-black">ภาพรวมบริษัท ตำแหน่งงาน และใบสมัคร</p></div>
                <span className="flex size-10 items-center justify-center rounded-xl bg-[#FFF0DD] text-[#F18701]"><DashboardIcon name="briefcase" /></span>
              </div>
              <div className="mt-5 grid auto-rows-fr gap-3 sm:grid-cols-3">
                <Link href="/conditer/companies" className="h-full rounded-xl border border-[#FBE0D4] bg-[#FFF8F4] p-4 transition hover:border-[#F35B04]"><p className="text-xs font-semibold text-[#6D6979]">บริษัทรออนุมัติ</p><p className="mt-2 font-mono text-3xl font-bold text-[#F35B04]">{pendingCompanies} <span className="font-sans text-sm font-normal text-[#858390]">แห่ง</span></p></Link>
                <Link href="/conditer/companies" className="h-full rounded-xl border border-[#E3DFFA] bg-[#F8F7FC] p-4 transition hover:border-[#7678ED]"><p className="text-xs font-semibold text-[#6D6979]">ตำแหน่งงานรอตรวจ</p><p className="mt-2 font-mono text-3xl font-bold text-[#3D348B]">{pendingJobs} <span className="font-sans text-sm font-normal text-[#858390]">ตำแหน่ง</span></p></Link>
                <Link href="/conditer/applications" className="h-full rounded-xl border border-[#E3DFFA] bg-[#F8F7FC] p-4 transition hover:border-[#7678ED]"><p className="text-xs font-semibold text-[#6D6979]">ใบสมัครทั้งหมด</p><p className="mt-2 font-mono text-3xl font-bold text-[#3D348B]">{totalApplications} <span className="font-sans text-sm font-normal text-[#858390]">ใบสมัคร</span></p></Link>
              </div>
              <div className="mt-4 space-y-3 rounded-xl bg-[#F8F7FC] p-4">
                <div className="flex items-center justify-between gap-3 text-sm"><Link href="/conditer/applications" className="font-medium text-[#3D348B] hover:underline">ใบสมัครรอพิจารณา</Link><span className="font-mono font-bold text-[#24232B]">{pendingApplications} ใบสมัคร · {pendingApplicationPercent}%</span></div><div className="h-2 overflow-hidden rounded-full bg-[#E9E6F2]"><div style={{ width: `${pendingApplicationPercent}%` }} className="h-full rounded-full bg-[#F35B04]" /></div>
                <div className="flex items-center justify-between gap-3 text-sm"><Link href="/conditer/applications" className="font-medium text-[#3D348B] hover:underline">อนุมัติการสมัครแล้ว</Link><span className="font-mono font-bold text-[#24232B]">{approvedApplications} ใบสมัคร · {approvedApplicationPercent}%</span></div><div className="h-2 overflow-hidden rounded-full bg-[#E9E6F2]"><div style={{ width: `${approvedApplicationPercent}%` }} className="h-full rounded-full bg-[#3D348B]" /></div>
              </div>
              <Link href="/conditer/applications" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#3D348B] hover:text-[#7678ED]">ดูรายการสมัครทั้งหมด <span aria-hidden="true">→</span></Link>
            </section>
          </section>

          <section className="order-4 mt-8 grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
            <section aria-labelledby="activity-title" className="rounded-[14px] border border-[#DFE6EF] bg-white p-5 shadow-[0_2px_5px_rgba(15,23,42,0.08)] sm:p-6">
              <div><h2 id="activity-title" className="text-lg font-bold text-black">กิจกรรมล่าสุด</h2><p className="mt-1 text-sm text-[#555]">ความเคลื่อนไหวในระบบล่าสุด</p></div>
              <div className="mt-5 space-y-5 border-l-2 border-[#EEECFF] pl-5">
                {activities.length === 0 ? <p className="text-sm text-[#6D6979]">ยังไม่มีกิจกรรมจากผู้ดูแลระบบ</p> : activities.map((activity, index) => <div key={activity.id} className="relative"><span className={`absolute -left-[29px] top-1 size-3 rounded-full border-2 border-white ${index === 0 ? "bg-[#3D348B]" : index === 1 ? "bg-[#F18701]" : "bg-[#F35B04]"}`} /><p className="font-semibold">{activity.summary}</p><p className="mt-1 text-xs text-[#555]">{activity.entity_type} · {relativeTime(activity.created_at)}</p></div>)}
              </div>
            </section>

            <section aria-labelledby="document-summary-title" className="rounded-[14px] border border-[#DFE6EF] bg-white p-5 shadow-[0_2px_5px_rgba(15,23,42,0.08)] sm:p-6">
              <div className="flex items-center justify-between gap-3"><div><h2 id="document-summary-title" className="text-lg font-bold text-black">สรุปสถานะเอกสาร</h2><p className="mt-1 text-sm text-[#555]">เอกสารประกอบการฝึกงาน</p></div><span className="flex size-10 items-center justify-center rounded-xl bg-[#EEECFF] text-[#3D348B]"><DashboardIcon name="clipboard" /></span></div>
              <dl className="mt-5 space-y-3">
                <div className="flex items-center justify-between rounded-lg bg-[#F49B1A] px-4 py-3 text-white"><dt className="text-sm font-medium">รอตรวจสอบ</dt><dd className="font-mono text-xl font-bold">{pendingDocuments}</dd></div>
                <div className="flex items-center justify-between rounded-lg bg-[#5146AA] px-4 py-3 text-white"><dt className="text-sm font-medium">อนุมัติแล้ว</dt><dd className="font-mono text-xl font-bold">{approvedDocuments}</dd></div>
                <div className="flex items-center justify-between rounded-lg bg-[#F56B22] px-4 py-3 text-white"><dt className="text-sm font-medium">ส่งกลับแก้ไข</dt><dd className="font-mono text-xl font-bold">{returnedDocuments}</dd></div>
              </dl>
              <Link href="/admin/student" className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-[#EAEAEA] px-4 text-sm font-semibold text-[#3D348B] transition hover:bg-[#EEECFF]">จัดการเอกสารนักศึกษา</Link>
            </section>
          </section>

        </main>
      </div>
    </div>
  );
}


