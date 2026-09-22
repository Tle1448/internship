"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Eye,
  MapPin,
  Trash2,
  User,
  Users,
  X,
  Mail,
  Phone,
  Briefcase,
} from "lucide-react";
import ConditerSidebar from "@/components/ConditerSidebar";

type Job = {
  id: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  jobTitle: string;
  location: string;
  department: string;
  positions: number;
  workType: string;
  description: string;
  qualifications: string;
  welfare: string;
  startDate: string;
  endDate: string;
  createdAt: string;
};

type Company = {
  name: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  jobs: Job[];
};

const STORAGE_KEY = "wu-conditer-jobs";

/* =========================================================
   บริษัทตัวอย่าง
========================================================= */

const sampleJobs: Job[] = [
  {
    id: "sample-scb-techx",
    companyName: "SCB TechX Co., Ltd.",
    contactName: "SCB TechX Recruitment",
    contactEmail: "recruitment@scbtechx.com",
    contactPhone: "02-XXX-XXXX",
    jobTitle:
      "Software Engineer Intern (Frontend / Fullstack - Co-op 2025)",
    location: "กรุงเทพมหานคร (พญาไท)",
    department: "Technology",
    positions: 3,
    workType: "Hybrid",
    description:
      "ร่วมพัฒนาและดูแลเว็บแอปพลิเคชันด้วย React, Next.js, TypeScript และ Node.js พร้อมทำงานร่วมกับทีม Software Engineer และ Product Designer",
    qualifications:
      "นักศึกษา ชั้นปีที่ 3 หรือ 4 สาขาวิศวกรรมคอมพิวเตอร์ วิทยาการคอมพิวเตอร์ หรือสาขาที่เกี่ยวข้อง\nมีพื้นฐาน HTML, CSS, JavaScript และ React/TypeScript\nเข้าใจ RESTful API และ Backend เบื้องต้น\nมีผลงานหรือ Portfolio จะได้รับการพิจารณาเป็นพิเศษ",
    welfare:
      "ประกันอุบัติเหตุและสุขภาพกลุ่ม\nโน้ตบุ๊กสำหรับการทำงาน\nคอร์สเรียนออนไลน์เสริมทักษะ\nขนมและเครื่องดื่มในสำนักงาน",
    startDate: "2026-10-01",
    endDate: "2026-11-30",
    createdAt: "2026-09-01T09:00:00.000Z",
  },

  {
    id: "sample-kbtg",
    companyName:
      "Kasikorn Business-Technology Group (KBTG)",
    contactName: "คุณกิตติศักดิ์ เจริญพร",
    contactEmail: "hr@company.com",
    contactPhone: "02-XXX-XXXX",
    jobTitle: "Associate UI/UX Designer (Intern)",
    location: "นนทบุรี (แจ้งวัฒนะ)",
    department: "UX/UI Design",
    positions: 2,
    workType: "Hybrid",
    description:
      "ออกแบบ Wireframe, Prototype และ User Interface สำหรับผลิตภัณฑ์ดิจิทัล รวมถึงทำ User Research และ Usability Testing",
    qualifications:
      "นักศึกษาสาขาที่เกี่ยวข้องกับ HCI, Design หรือ Digital Media\nสามารถใช้ Figma ได้\nมีความเข้าใจพื้นฐานด้าน User Research\nมี Portfolio แสดงผลงาน UX/UI",
    welfare:
      "เบี้ยเลี้ยงประจำเดือน\nการ Training จากทีม UX/UI\nได้เรียนรู้การทำงานกับทีม Product",
    startDate: "2026-10-15",
    endDate: "2026-12-15",
    createdAt: "2026-09-02T09:00:00.000Z",
  },

  {
    id: "sample-line-man",
    companyName: "LINE Thailand (LINE MAN Wongnai)",
    contactName: "คุณภาวิณี ศรีสุข",
    contactEmail: "hr@company.com",
    contactPhone: "02-XXX-XXXX",
    jobTitle: "Full-Stack Developer Intern",
    location: "กรุงเทพมหานคร (เอกมัย)",
    department: "Engineering",
    positions: 4,
    workType: "On-site",
    description:
      "พัฒนา Feature สำหรับระบบ LINE MAN และ Wongnai พร้อมทำงานร่วมกับทีม Backend และ Frontend",
    qualifications:
      "มีพื้นฐาน React หรือ Node.js\nเข้าใจพื้นฐาน Database\nสนใจการพัฒนา Web Application\nสามารถทำงานร่วมกับทีมได้",
    welfare:
      "อาหารกลางวัน\nอุปกรณ์ Laptop สำหรับการทำงาน\nสวัสดิการพนักงาน\nกิจกรรมสำหรับพนักงาน",
    startDate: "2026-10-01",
    endDate: "2026-12-31",
    createdAt: "2026-09-03T09:00:00.000Z",
  },

  {
    id: "sample-agoda",
    companyName: "Agoda Services Co., Ltd.",
    contactName: "Ms. Sarah Jenkins",
    contactEmail: "hr@company.com",
    contactPhone: "02-XXX-XXXX",
    jobTitle: "Associate Frontend Engineer",
    location: "กรุงเทพมหานคร",
    department: "Engineering",
    positions: 2,
    workType: "Hybrid",
    description:
      "พัฒนา Frontend สำหรับเว็บไซต์และแพลตฟอร์มระดับ Global โดยเน้นประสิทธิภาพและประสบการณ์ผู้ใช้งาน",
    qualifications:
      "สื่อสารภาษาอังกฤษได้ดี\nเชี่ยวชาญ React.js, TypeScript, HTML5 และ CSS3\nมีความสนใจด้าน Web Performance\nสามารถทำงานในสภาพแวดล้อมนานาชาติได้",
    welfare:
      "ค่าตอบแทนรายเดือน\nส่วนลดโรงแรมและตั๋วเครื่องบินสำหรับ Agoda Staff\nสวัสดิการพนักงาน",
    startDate: "2026-10-01",
    endDate: "2026-12-31",
    createdAt: "2026-09-04T09:00:00.000Z",
  },

  {
    id: "sample-ais",
    companyName: "AIS (Advanced Info Service)",
    contactName: "คุณธนภัทร รัตนเวช",
    contactEmail: "hr@company.com",
    contactPhone: "02-XXX-XXXX",
    jobTitle: "Data Engineer & Platform Intern",
    location: "กรุงเทพมหานคร (พญาไท)",
    department: "Data Engineering",
    positions: 3,
    workType: "On-site",
    description:
      "ออกแบบและสร้าง Data Pipeline สำหรับประมวลผลข้อมูล Big Data รวมถึงดูแลระบบ PostgreSQL และ Kafka",
    qualifications:
      "นักศึกษาสาขาวิศวกรรมคอมพิวเตอร์ วิทยาการข้อมูล หรือสาขาที่เกี่ยวข้อง\nมีพื้นฐาน SQL และ Python\nสนใจ Data Engineering และ Big Data",
    welfare:
      "ส่วนลดแพ็กเกจอินเทอร์เน็ต\nรถรับส่งพนักงาน\nTraining Program\nกิจกรรมพัฒนาทักษะ",
    startDate: "2026-10-01",
    endDate: "2026-12-15",
    createdAt: "2026-09-05T09:00:00.000Z",
  },

  {
    id: "sample-garena",
    companyName: "Garena Online Co., Ltd.",
    contactName: "คุณณัฐพล วงศ์สว่าง",
    contactEmail: "hr@company.com",
    contactPhone: "02-XXX-XXXX",
    jobTitle: "Backend Engineer Intern (Cloud)",
    location: "กรุงเทพมหานคร (พระราม 9)",
    department: "Backend Engineering",
    positions: 2,
    workType: "On-site",
    description:
      "พัฒนาระบบ Backend รองรับเกมออนไลน์ และทำงานกับระบบ Cloud, Docker และ Kubernetes",
    qualifications:
      "นักศึกษาสาขาวิศวกรรมคอมพิวเตอร์หรือวิทยาการคอมพิวเตอร์\nเข้าใจ Data Structures และ Algorithms\nมีความสนใจ Backend Development\nสนใจภาษา Go หรือ Cloud Technology",
    welfare:
      "เบี้ยเลี้ยงรายเดือน\nขนมและอาหารในสำนักงาน\nกิจกรรมสำหรับพนักงาน\nสิทธิประโยชน์จากบริษัท",
    startDate: "2026-10-15",
    endDate: "2026-12-31",
    createdAt: "2026-09-06T09:00:00.000Z",
  },
];

export default function CompaniesPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCompany, setSelectedCompany] =
    useState<Company | null>(null);

  /* =========================================================
     โหลดข้อมูล

     บริษัทตัวอย่างจะถูกเก็บไว้ใน localStorage แยกจาก
     ประกาศที่สร้างเอง เพื่อให้บริษัทตัวอย่างยังคงอยู่
     แม้ว่าผู้ใช้จะลบประกาศของตัวเอง
  ========================================================= */

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (saved) {
        const parsed: Job[] = JSON.parse(saved);

        // เพิ่มบริษัทตัวอย่างที่ยังไม่มีใน localStorage
        const existingIds = new Set(
          parsed.map((job) => job.id)
        );

        const missingSamples = sampleJobs.filter(
          (job) => !existingIds.has(job.id)
        );

        const merged = [...sampleJobs.filter((job) =>
          existingIds.has(job.id)
        ), ...missingSamples];

        // เอาข้อมูลที่ผู้ใช้สร้างเองเข้ามาด้วย
        const customJobs = parsed.filter(
          (job) =>
            !sampleJobs.some(
              (sample) => sample.id === job.id
            )
        );

        const finalJobs = [...merged, ...customJobs];

        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(finalJobs)
        );

        setJobs(finalJobs);
      } else {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(sampleJobs)
        );

        setJobs(sampleJobs);
      }
    } catch {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(sampleJobs)
      );

      setJobs(sampleJobs);
    }
  }, []);

  /* =========================================================
     จัดกลุ่มตามบริษัท
  ========================================================= */

  const companies = useMemo<Company[]>(() => {
    const map = new Map<string, Company>();

    jobs.forEach((job) => {
      const key = job.companyName
        .trim()
        .toLowerCase();

      if (!key) return;

      if (!map.has(key)) {
        map.set(key, {
          name: job.companyName,
          contactName: job.contactName,
          contactEmail: job.contactEmail,
          contactPhone: job.contactPhone,
          jobs: [],
        });
      }

      map.get(key)!.jobs.push(job);
    });

    return Array.from(map.values());
  }, [jobs]);

  /* =========================================================
     ค้นหา
  ========================================================= */

  const filteredCompanies = useMemo(() => {
    const keyword = search
      .trim()
      .toLowerCase();

    if (!keyword) {
      return companies;
    }

    return companies.filter((company) => {
      return (
        company.name
          .toLowerCase()
          .includes(keyword) ||
        company.contactName
          .toLowerCase()
          .includes(keyword) ||
        company.jobs.some((job) =>
          job.jobTitle
            .toLowerCase()
            .includes(keyword)
        )
      );
    });
  }, [companies, search]);

  const totalPositions = jobs.reduce(
    (sum, job) =>
      sum + (Number(job.positions) || 0),
    0
  );

  /* =========================================================
     ลบประกาศงาน
  ========================================================= */

  const handleDeleteJob = (job: Job) => {
    const confirmed = window.confirm(
      `ต้องการลบประกาศงาน "${job.jobTitle}" ของ ${job.companyName} ใช่หรือไม่?`
    );

    if (!confirmed) return;

    const updatedJobs = jobs.filter(
      (item) => item.id !== job.id
    );

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(updatedJobs)
    );

    setJobs(updatedJobs);

    if (selectedCompany) {
      const remainingJobs =
        selectedCompany.jobs.filter(
          (item) => item.id !== job.id
        );

      if (remainingJobs.length === 0) {
        setSelectedCompany(null);
      } else {
        setSelectedCompany({
          ...selectedCompany,
          jobs: remainingJobs,
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F6FB]">
      <ConditerSidebar />

      <main className="lg:ml-[235px]">
        <div className="mx-auto max-w-[1400px] px-5 py-7 lg:px-8">

          {/* =================================================
              STAT
          ================================================= */}

          <div className="mb-7 grid grid-cols-1 gap-4 md:grid-cols-3">

            <Stat
              label="บริษัททั้งหมด"
              value={companies.length}
              icon={<Building2 size={21} />}
              className="bg-[#EFEEFC] text-[#3D348B]"
            />

            <Stat
              label="ประกาศงานทั้งหมด"
              value={jobs.length}
              icon={<BriefcaseBusiness size={21} />}
              className="bg-[#FFF4DD] text-[#F18701]"
            />

            <Stat
              label="ตำแหน่งที่เปิดรับ"
              value={totalPositions}
              icon={<Users size={21} />}
              className="bg-[#EAF8F0] text-[#159447]"
            />

          </div>

          {/* =================================================
              COMPANY LIST
          ================================================= */}

          {filteredCompanies.length === 0 ? (
            <div className="rounded-2xl border border-[#E7E4EF] bg-white px-6 py-16 text-center">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#F2F1FC]">
                <Building2
                  size={28}
                  className="text-[#7678ED]"
                />
              </div>

              <h2 className="mt-5 text-base font-bold text-[#403C52]">
                ไม่พบบริษัท
              </h2>

              <p className="mt-2 text-xs text-[#9995A8]">
                ลองเปลี่ยนคำค้นหา
              </p>

            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">

              {filteredCompanies.map((company) => (
                <div
                  key={company.name}
                  className="rounded-2xl border border-[#E7E4EF] bg-white p-6 transition hover:-translate-y-[2px] hover:shadow-md"
                >

                  {/* Company Header */}

                  <div className="flex items-start justify-between gap-4">

                    <div className="flex min-w-0 items-start gap-4">

                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#EFEEFC]">
                        <Building2
                          size={26}
                          className="text-[#3D348B]"
                        />
                      </div>

                      <div className="min-w-0">
                        <h2 className="text-base font-bold text-[#302C44]">
                          {company.name}
                        </h2>

                        <div className="mt-2 flex items-center gap-2 text-xs text-[#8B8799]">
                          <User size={14} />
                          <span>
                            {company.contactName ||
                              "ไม่ระบุผู้ติดต่อ"}
                          </span>
                        </div>
                      </div>

                    </div>

                    <span className="shrink-0 rounded-full bg-[#EFEEFC] px-3 py-1.5 text-[11px] font-semibold text-[#3D348B]">
                      {company.jobs.length} ประกาศ
                    </span>

                  </div>

                  {/* Contact */}

                  <div className="mt-5 grid grid-cols-1 gap-3 rounded-xl bg-[#FAF9FC] p-4 md:grid-cols-2">

                    <div className="flex items-start gap-2">
                      <Mail
                        size={14}
                        className="mt-0.5 text-[#7678ED]"
                      />

                      <div className="min-w-0">
                        <p className="text-[10px] text-[#AAA6B7]">
                          อีเมล
                        </p>

                        <p className="mt-1 truncate text-xs font-medium text-[#5E5A70]">
                          {company.contactEmail || "-"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Phone
                        size={14}
                        className="mt-0.5 text-[#7678ED]"
                      />

                      <div>
                        <p className="text-[10px] text-[#AAA6B7]">
                          เบอร์โทร
                        </p>

                        <p className="mt-1 text-xs font-medium text-[#5E5A70]">
                          {company.contactPhone || "-"}
                        </p>
                      </div>
                    </div>

                  </div>

                  {/* Jobs */}

                  <div className="mt-5">

                    <div className="mb-3 flex items-center justify-between">

                      <h3 className="text-xs font-bold text-[#4A465B]">
                        ประกาศงาน
                      </h3>

                      <span className="text-[10px] text-[#AAA6B7]">
                        {company.jobs.reduce(
                          (sum, job) =>
                            sum +
                            (Number(job.positions) || 0),
                          0
                        )}{" "}
                        อัตรา
                      </span>

                    </div>

                    <div className="space-y-2">

                      {company.jobs.map((job) => (
                        <div
                          key={job.id}
                          className="group flex items-center justify-between gap-3 rounded-xl border border-[#EEEAF3] px-4 py-3 transition hover:border-[#DAD5E7] hover:bg-[#FCFBFE]"
                        >

                          <div className="min-w-0">

                            <p className="truncate text-xs font-semibold text-[#403C52]">
                              {job.jobTitle}
                            </p>

                            <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-[#9995A8]">

                              <span className="flex items-center gap-1">
                                <MapPin size={12} />
                                {job.location ||
                                  "ไม่ระบุสถานที่"}
                              </span>

                              <span className="text-[#D4D0DC]">
                                |
                              </span>

                              <span>
                                {job.workType ||
                                  "ไม่ระบุรูปแบบ"}
                              </span>

                            </div>

                          </div>

                          <div className="flex shrink-0 items-center gap-2">

                            <span className="rounded-full bg-[#EAF8F0] px-2.5 py-1 text-[10px] font-semibold text-[#159447]">
                              {job.positions || 0} คน
                            </span>

                            <button
                              onClick={() =>
                                handleDeleteJob(job)
                              }
                              title="ลบประกาศงาน"
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-[#A39EAF] transition hover:bg-[#FDECEC] hover:text-[#E94B4B]"
                            >
                              <Trash2 size={15} />
                            </button>

                          </div>

                        </div>
                      ))}

                    </div>

                  </div>

                  {/* Detail Button */}

                  <button
                    onClick={() =>
                      setSelectedCompany(company)
                    }
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-[#DDD9E8] py-3 text-xs font-semibold text-[#3D348B] transition hover:bg-[#F4F3FC]"
                  >
                    <Eye size={16} />
                    ดูรายละเอียดบริษัท
                  </button>

                </div>
              ))}

            </div>
          )}
        </div>
      </main>

      {/* =====================================================
          COMPANY DETAIL MODAL
      ===================================================== */}

      {selectedCompany && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
          onClick={() =>
            setSelectedCompany(null)
          }
        >

          <div
            className="max-h-[90vh] w-full max-w-[820px] overflow-y-auto rounded-2xl bg-white shadow-2xl"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* Header */}

            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#ECE9F1] bg-white px-6 py-5">

              <div>
                <h2 className="text-lg font-bold text-[#29263E]">
                  {selectedCompany.name}
                </h2>

                <p className="mt-1 text-xs text-[#9691A5]">
                  รายละเอียดบริษัทและประกาศงาน
                </p>
              </div>

              <button
                onClick={() =>
                  setSelectedCompany(null)
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg text-[#777287] transition hover:bg-[#F5F3FA]"
              >
                <X size={20} />
              </button>

            </div>

            <div className="space-y-6 p-6">

              {/* Company Information */}

              <div className="rounded-xl bg-[#FAF9FC] p-5">

                <div className="mb-5 flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EFEEFC]">
                    <Building2
                      size={20}
                      className="text-[#3D348B]"
                    />
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-[#403C52]">
                      ข้อมูลบริษัท
                    </h3>

                    <p className="text-[10px] text-[#9995A8]">
                      ข้อมูลสำหรับติดต่อบริษัท
                    </p>
                  </div>

                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-3">

                  <Info
                    icon={<User size={14} />}
                    label="ผู้ติดต่อ"
                    value={
                      selectedCompany.contactName ||
                      "-"
                    }
                  />

                  <Info
                    icon={<Mail size={14} />}
                    label="อีเมล"
                    value={
                      selectedCompany.contactEmail ||
                      "-"
                    }
                  />

                  <Info
                    icon={<Phone size={14} />}
                    label="เบอร์โทร"
                    value={
                      selectedCompany.contactPhone ||
                      "-"
                    }
                  />

                </div>

              </div>

              {/* Jobs */}

              <div>

                <div className="mb-4 flex items-center justify-between">

                  <div>
                    <h3 className="text-sm font-bold text-[#403C52]">
                      ประกาศงานทั้งหมด
                    </h3>

                    <p className="mt-1 text-[10px] text-[#AAA6B7]">
                      ตำแหน่งงานที่บริษัทเปิดรับ
                    </p>
                  </div>

                  <span className="rounded-full bg-[#EFEEFC] px-3 py-1 text-[10px] font-semibold text-[#3D348B]">
                    {selectedCompany.jobs.length} ประกาศ
                  </span>

                </div>

                <div className="space-y-4">

                  {selectedCompany.jobs.map(
                    (job) => (
                      <div
                        key={job.id}
                        className="rounded-xl border border-[#E9E6F0] p-5"
                      >

                        {/* Job Title */}

                        <div className="flex flex-col justify-between gap-3 md:flex-row">

                          <div>
                            <div className="flex items-center gap-2">

                              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EFEEFC]">
                                <Briefcase
                                  size={17}
                                  className="text-[#3D348B]"
                                />
                              </div>

                              <div>
                                <h4 className="text-sm font-bold text-[#302C44]">
                                  {job.jobTitle}
                                </h4>

                                <p className="mt-1 text-[10px] text-[#777287]">
                                  {job.department ||
                                    "ไม่ระบุแผนก"}
                                </p>
                              </div>

                            </div>
                          </div>

                          <button
                            onClick={() =>
                              handleDeleteJob(job)
                            }
                            className="flex h-9 items-center justify-center gap-2 rounded-lg border border-[#F0CACA] bg-[#FFF7F7] px-3 text-xs font-semibold text-[#E94B4B] transition hover:bg-[#FDECEC]"
                          >
                            <Trash2 size={15} />
                            ลบประกาศ
                          </button>

                        </div>

                        {/* Job Basic Info */}

                        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">

                          <Info
                            icon={
                              <MapPin size={14} />
                            }
                            label="สถานที่"
                            value={
                              job.location || "-"
                            }
                          />

                          <Info
                            icon={
                              <BriefcaseBusiness
                                size={14}
                              />
                            }
                            label="รูปแบบการทำงาน"
                            value={
                              job.workType || "-"
                            }
                          />

                          <Info
                            icon={
                              <Users size={14} />
                            }
                            label="จำนวนที่รับ"
                            value={`${job.positions || 0} คน`}
                          />

                        </div>

                        {/* Timeline */}

                        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">

                          <Info
                            icon={
                              <CalendarDays
                                size={14}
                              />
                            }
                            label="เริ่มรับสมัคร"
                            value={
                              job.startDate || "-"
                            }
                          />

                          <Info
                            icon={
                              <CalendarDays
                                size={14}
                              />
                            }
                            label="สิ้นสุดรับสมัคร"
                            value={
                              job.endDate || "-"
                            }
                          />

                        </div>

                        {/* Description */}

                        {job.description && (
                          <div className="mt-5 border-t border-[#EEEAF3] pt-4">

                            <p className="text-[10px] font-semibold text-[#AAA6B7]">
                              รายละเอียดงาน
                            </p>

                            <p className="mt-2 whitespace-pre-line text-xs leading-6 text-[#696579]">
                              {job.description}
                            </p>

                          </div>
                        )}

                        {/* Qualifications */}

                        {job.qualifications && (
                          <div className="mt-5 border-t border-[#EEEAF3] pt-4">

                            <p className="text-[10px] font-semibold text-[#AAA6B7]">
                              คุณสมบัติผู้สมัคร
                            </p>

                            <p className="mt-2 whitespace-pre-line text-xs leading-6 text-[#696579]">
                              {job.qualifications}
                            </p>

                          </div>
                        )}

                        {/* Welfare */}

                        {job.welfare && (
                          <div className="mt-5 border-t border-[#EEEAF3] pt-4">

                            <p className="text-[10px] font-semibold text-[#AAA6B7]">
                              สวัสดิการ
                            </p>

                            <p className="mt-2 whitespace-pre-line text-xs leading-6 text-[#696579]">
                              {job.welfare}
                            </p>

                          </div>
                        )}

                      </div>
                    )
                  )}

                </div>

              </div>

            </div>

            {/* Footer */}

            <div className="sticky bottom-0 border-t border-[#ECE9F1] bg-[#FCFBFD] px-6 py-4">

              <button
                onClick={() =>
                  setSelectedCompany(null)
                }
                className="w-full rounded-xl border border-[#DDD9E8] bg-white py-3 text-sm font-semibold text-[#6B667B] transition hover:bg-[#F7F6FB]"
              >
                ปิด
              </button>

            </div>

          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   STAT COMPONENT
========================================================= */

function Stat({
  label,
  value,
  icon,
  className,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  className: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-[#E7E4EF] bg-white p-5">

      <div>
        <p className="text-xs text-[#9995A8]">
          {label}
        </p>

        <p className="mt-2 text-2xl font-bold text-[#302C44]">
          {value}
        </p>
      </div>

      <div
        className={`flex h-11 w-11 items-center justify-center rounded-xl ${className}`}
      >
        {icon}
      </div>

    </div>
  );
}

/* =========================================================
   INFO COMPONENT
========================================================= */

function Info({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div>

      <div className="flex items-center gap-1.5 text-[10px] text-[#AAA6B7]">
        {icon}
        <span>{label}</span>
      </div>

      <p className="mt-1.5 break-words text-xs font-semibold text-[#514D61]">
        {value}
      </p>

    </div>
  );
}
