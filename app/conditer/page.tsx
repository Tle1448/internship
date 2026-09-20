"use client";

import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Users,
} from "lucide-react";
import ConditerSidebar from "@/components/ConditerSidebar";

const companies = [
  "SCB TechX Co., Ltd.",
  "Kasikorn Business-Technology Group (KBTG)",
  "LINE Thailand (LINE MAN Wongnai)",
  "Agoda Services Co., Ltd.",
  "AIS (Advanced Info Service)",
  "Garena Online Co., Ltd.",
];

const jobs = [
  {
    company: "SCB TechX Co., Ltd.",
    position:
      "Software Engineer Intern (Frontend / Fullstack - Co-op 2025)",
  },
  {
    company: "Kasikorn Business-Technology Group (KBTG)",
    position: "Associate UI/UX Designer (Intern)",
  },
  {
    company: "LINE Thailand (LINE MAN Wongnai)",
    position: "Full-Stack Developer Intern",
  },
  {
    company: "Agoda Services Co., Ltd.",
    position: "Associate Frontend Engineer",
  },
  {
    company: "AIS (Advanced Info Service)",
    position: "Data Engineer & Platform Intern",
  },
  {
    company: "Garena Online Co., Ltd.",
    position: "Backend Engineer Intern (Cloud)",
  },
];

const applications = [
  {
    name: "นายพิรพัฒน์ เลาหะสราญ",
    company: "TechCorp Solutions Co., Ltd.",
    position: "Full Stack Developer Intern",
    status: "พิจารณา",
  },
  {
    name: "นางสาวณัฐชา ใจดี",
    company: "Creative Digital Co., Ltd.",
    position: "UI/UX Designer Intern",
    status: "พิจารณา",
  },
  {
    name: "นายกิตติพงษ์ สมชาย",
    company: "Global Finance Group",
    position: "Software Engineer Intern",
    status: "อนุมัติแล้ว",
  },
  {
    name: "นางสาวพิมพ์ชนก แสงทอง",
    company: "Bright Future Education",
    position: "Software Developer Intern",
    status: "ไม่อนุมัติ",
  },
  {
    name: "นายธนกฤต วัฒนะ",
    company: "Green Energy Systems",
    position: "Data Engineer Intern",
    status: "พิจารณา",
  },
];

export default function ConditerPage() {
  const pendingApplications = applications.filter(
    (item) => item.status === "พิจารณา"
  ).length;

  return (
    <div className="min-h-screen bg-[#F8F7FB] text-[#29263A]">
      <ConditerSidebar />

      <main className="min-h-screen lg:ml-[235px]">
        <header className="border-b border-[#E8E6F0] bg-white px-6 py-6 lg:px-8">
          <p className="text-[11px] text-[#9691A7]">
            ระบบสหกิจศึกษา
          </p>

          <h1 className="mt-1 text-2xl font-bold text-[#29263A]">
            การจัดการฝึกงาน
          </h1>

          <p className="mt-1 text-sm text-[#858196]">
            จัดการบริษัท ประกาศงาน และการสมัครงานของนักศึกษา
          </p>
        </header>

        <div className="px-6 py-6 lg:px-8">
          {/* Stats */}
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="บริษัททั้งหมด"
              value={companies.length}
              icon={<Building2 size={21} />}
              iconClass="bg-[#EFEEFC] text-[#3D348B]"
            />

            <StatCard
              title="ประกาศงาน"
              value={jobs.length}
              icon={<BriefcaseBusiness size={21} />}
              iconClass="bg-[#FFF4DC] text-[#F18701]"
            />

            <StatCard
              title="รอพิจารณา"
              value={pendingApplications}
              icon={<Clock size={21} />}
              iconClass="bg-[#FFF7D6] text-[#C38A00]"
            />

            <StatCard
              title="การสมัครทั้งหมด"
              value={applications.length}
              icon={<ClipboardCheck size={21} />}
              iconClass="bg-[#E9F8EF] text-[#2D9B59]"
            />
          </div>

          {/* Quick Menu */}
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <QuickCard
              href="/conditer/companies"
              icon={<Building2 size={21} />}
              title="รายการบริษัท"
              description="ดูบริษัทและประกาศงานทั้งหมด"
            />

            <QuickCard
              href="/conditer/jobs/create"
              icon={<BriefcaseBusiness size={21} />}
              title="สร้างประกาศงาน"
              description="สร้างประกาศรับนักศึกษาฝึกงาน"
            />

            <QuickCard
              href="/conditer/applications"
              icon={<ClipboardCheck size={21} />}
              title="การสมัครงาน"
              description="ตรวจสอบและพิจารณาการสมัคร"
            />
          </div>

          {/* Recent Applications */}
          <section className="overflow-hidden rounded-2xl border border-[#E8E6F0] bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-[#ECEAF2] px-5 py-5">
              <div>
                <h2 className="text-base font-bold text-[#302D42]">
                  การสมัครงานล่าสุด
                </h2>

                <p className="mt-1 text-xs text-[#9994A8]">
                  รายการสมัครงานที่ต้องติดตาม
                </p>
              </div>

              <Link
                href="/conditer/applications"
                className="flex items-center gap-1 text-xs font-semibold text-[#3D348B]"
              >
                ดูทั้งหมด
                <ArrowRight size={14} />
              </Link>
            </div>

            <div>
              {applications.map((application, index) => (
                <div
                  key={index}
                  className="flex flex-col gap-3 border-b border-[#F0EEF4] px-5 py-4 last:border-b-0 md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EFEEFC] text-xs font-bold text-[#3D348B]">
                      {application.name.slice(0, 1)}
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-[#353143]">
                        {application.name}
                      </p>

                      <p className="mt-1 text-[11px] text-[#858095]">
                        {application.company} •{" "}
                        {application.position}
                      </p>
                    </div>
                  </div>

                  <StatusBadge status={application.status} />
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  iconClass,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  iconClass: string;
}) {
  return (
    <div className="rounded-2xl border border-[#E8E6F0] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-[#8C879B]">{title}</p>

          <p className="mt-2 text-2xl font-bold text-[#302D42]">
            {value}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClass}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function QuickCard({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-[#E8E6F0] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#D6D2EC] hover:shadow-md"
    >
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#EFEEFC] text-[#3D348B]">
        {icon}
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-[#353143]">
          {title}
        </h3>

        <ArrowRight
          size={16}
          className="text-[#AAA6B8] transition group-hover:translate-x-1 group-hover:text-[#3D348B]"
        />
      </div>

      <p className="mt-1 text-[11px] text-[#9994A8]">
        {description}
      </p>
    </Link>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles =
    status === "พิจารณา"
      ? "bg-[#FFF7D6] text-[#A97800]"
      : status === "อนุมัติแล้ว"
      ? "bg-[#E9F8EF] text-[#23864B]"
      : "bg-[#FDECEC] text-[#D94B4B]";

  return (
    <span
      className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-semibold ${styles}`}
    >
      {status === "อนุมัติแล้ว" && <CheckCircle2 size={12} />}
      {status === "พิจารณา" && <Clock size={12} />}
      {status}
    </span>
  );
}