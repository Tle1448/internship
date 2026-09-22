"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Mail,
  MapPin,
  Phone,
  Save,
  User,
  Users,
} from "lucide-react";
import ConditerSidebar from "@/components/ConditerSidebar";

const STORAGE_KEY = "wu-conditer-jobs";

export default function CreateJobPage() {
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  const [jobTitle, setJobTitle] = useState("");
  const [location, setLocation] = useState("");
  const [department, setDepartment] = useState("");
  const [positions, setPositions] = useState("");
  const [workType, setWorkType] = useState("On-site");

  const [description, setDescription] = useState("");
  const [qualifications, setQualifications] = useState("");
  const [welfare, setWelfare] = useState("");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!companyName.trim()) {
      alert("กรุณากรอกชื่อบริษัท");
      return;
    }

    if (!contactName.trim()) {
      alert("กรุณากรอกชื่อผู้ติดต่อ");
      return;
    }

    if (!jobTitle.trim()) {
      alert("กรุณากรอกชื่อตำแหน่งงาน");
      return;
    }

    if (!startDate || !endDate) {
      alert("กรุณากำหนดช่วงเวลารับสมัคร");
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      alert("วันที่เริ่มรับสมัครต้องไม่มากกว่าวันที่สิ้นสุด");
      return;
    }

    const newJob = {
      id: `job-${Date.now()}`,
      companyName: companyName.trim(),
      contactName: contactName.trim(),
      contactEmail: contactEmail.trim(),
      contactPhone: contactPhone.trim(),
      jobTitle: jobTitle.trim(),
      location: location.trim(),
      department: department.trim(),
      positions: Number(positions) || 0,
      workType,
      description: description.trim(),
      qualifications: qualifications.trim(),
      welfare: welfare.trim(),
      startDate,
      endDate,
      createdAt: new Date().toISOString(),
    };

    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      const existingJobs = saved
        ? JSON.parse(saved)
        : [];

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify([
          ...existingJobs,
          newJob,
        ])
      );

      alert("สร้างประกาศงานเรียบร้อยแล้ว");

      window.location.href = "/conditer/companies";
    } catch {
      alert("ไม่สามารถบันทึกข้อมูลได้");
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F6FB]">
      <ConditerSidebar />

      <main className="lg:ml-[235px]">
        <div className="mx-auto max-w-[1250px] px-5 py-6 lg:px-8">
          <div className="mb-6 flex items-center gap-3">
            <Link
              href="/conditer"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E5E2EE] bg-white text-[#6D6980] hover:bg-[#F4F2FC]"
            >
              <ArrowLeft size={18} />
            </Link>

            <div>
              <h1 className="text-[22px] font-bold text-[#24213A]">
                สร้างประกาศงาน
              </h1>

              <p className="mt-1 text-sm text-[#89859A]">
                สร้างประกาศงานสำหรับนักศึกษาฝึกงานและสหกิจศึกษา
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
              <div className="space-y-6">
                {/* Company */}
                <section className="rounded-2xl border border-[#E7E4EF] bg-white">
                  <div className="border-b border-[#EEEAF3] px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EFEEFC]">
                        <Building2
                          size={20}
                          className="text-[#3D348B]"
                        />
                      </div>

                      <div>
                        <h2 className="font-bold text-[#29263E]">
                          ข้อมูลบริษัท
                        </h2>

                        <p className="text-xs text-[#9691A5]">
                          สามารถเพิ่มบริษัทใหม่ได้ด้วยการพิมพ์ชื่อบริษัท
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <label className="mb-2 block text-sm font-semibold text-[#403C52]">
                        ชื่อบริษัท
                        <span className="ml-1 text-red-500">*</span>
                      </label>

                      <div className="relative">
                        <Building2
                          size={18}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-[#AAA6B7]"
                        />

                        <input
                          type="text"
                          value={companyName}
                          onChange={(e) =>
                            setCompanyName(e.target.value)
                          }
                          placeholder="กรอกชื่อบริษัท เช่น บริษัท ABC จำกัด"
                          className="w-full rounded-xl border border-[#DDD9E8] py-3 pl-11 pr-4 text-sm outline-none focus:border-[#7678ED] focus:ring-2 focus:ring-[#7678ED]/10"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-[#403C52]">
                        ชื่อผู้ติดต่อ
                        <span className="ml-1 text-red-500">*</span>
                      </label>

                      <div className="relative">
                        <User
                          size={18}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-[#AAA6B7]"
                        />

                        <input
                          type="text"
                          value={contactName}
                          onChange={(e) =>
                            setContactName(e.target.value)
                          }
                          placeholder="เช่น คุณสมชาย ใจดี"
                          className="w-full rounded-xl border border-[#DDD9E8] py-3 pl-11 pr-4 text-sm outline-none focus:border-[#7678ED]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-[#403C52]">
                        อีเมลผู้ติดต่อ
                      </label>

                      <div className="relative">
                        <Mail
                          size={18}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-[#AAA6B7]"
                        />

                        <input
                          type="email"
                          value={contactEmail}
                          onChange={(e) =>
                            setContactEmail(e.target.value)
                          }
                          placeholder="example@company.com"
                          className="w-full rounded-xl border border-[#DDD9E8] py-3 pl-11 pr-4 text-sm outline-none focus:border-[#7678ED]"
                        />
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="mb-2 block text-sm font-semibold text-[#403C52]">
                        เบอร์โทรศัพท์ผู้ติดต่อ
                      </label>

                      <div className="relative">
                        <Phone
                          size={18}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-[#AAA6B7]"
                        />

                        <input
                          type="tel"
                          value={contactPhone}
                          onChange={(e) =>
                            setContactPhone(e.target.value)
                          }
                          placeholder="เช่น 02-123-4567"
                          className="w-full rounded-xl border border-[#DDD9E8] py-3 pl-11 pr-4 text-sm outline-none focus:border-[#7678ED]"
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {/* Job */}
                <section className="rounded-2xl border border-[#E7E4EF] bg-white">
                  <div className="border-b border-[#EEEAF3] px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF5DF]">
                        <BriefcaseBusiness
                          size={20}
                          className="text-[#F18701]"
                        />
                      </div>

                      <div>
                        <h2 className="font-bold text-[#29263E]">
                          รายละเอียดงาน
                        </h2>

                        <p className="text-xs text-[#9691A5]">
                          ข้อมูลตำแหน่งงาน
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <label className="mb-2 block text-sm font-semibold text-[#403C52]">
                        ชื่อตำแหน่งงาน
                        <span className="ml-1 text-red-500">*</span>
                      </label>

                      <input
                        type="text"
                        value={jobTitle}
                        onChange={(e) =>
                          setJobTitle(e.target.value)
                        }
                        placeholder="เช่น Software Engineer Intern"
                        className="w-full rounded-xl border border-[#DDD9E8] px-4 py-3 text-sm outline-none focus:border-[#7678ED]"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-[#403C52]">
                        สถานที่ทำงาน
                      </label>

                      <div className="relative">
                        <MapPin
                          size={18}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-[#AAA6B7]"
                        />

                        <input
                          type="text"
                          value={location}
                          onChange={(e) =>
                            setLocation(e.target.value)
                          }
                          placeholder="เช่น กรุงเทพมหานคร"
                          className="w-full rounded-xl border border-[#DDD9E8] py-3 pl-11 pr-4 text-sm outline-none focus:border-[#7678ED]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-[#403C52]">
                        แผนก / ฝ่าย
                      </label>

                      <input
                        type="text"
                        value={department}
                        onChange={(e) =>
                          setDepartment(e.target.value)
                        }
                        placeholder="เช่น Technology / IT"
                        className="w-full rounded-xl border border-[#DDD9E8] px-4 py-3 text-sm outline-none focus:border-[#7678ED]"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-[#403C52]">
                        จำนวนที่รับ
                      </label>

                      <div className="relative">
                        <Users
                          size={18}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-[#AAA6B7]"
                        />

                        <input
                          type="number"
                          min="1"
                          value={positions}
                          onChange={(e) =>
                            setPositions(e.target.value)
                          }
                          placeholder="เช่น 2"
                          className="w-full rounded-xl border border-[#DDD9E8] py-3 pl-11 pr-4 text-sm outline-none focus:border-[#7678ED]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-[#403C52]">
                        รูปแบบการทำงาน
                      </label>

                      <select
                        value={workType}
                        onChange={(e) =>
                          setWorkType(e.target.value)
                        }
                        className="w-full rounded-xl border border-[#DDD9E8] bg-white px-4 py-3 text-sm outline-none focus:border-[#7678ED]"
                      >
                        <option value="On-site">
                          On-site
                        </option>

                        <option value="Hybrid">
                          Hybrid
                        </option>

                        <option value="Remote">
                          Remote
                        </option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="mb-2 block text-sm font-semibold text-[#403C52]">
                        รายละเอียดงาน
                      </label>

                      <textarea
                        rows={5}
                        value={description}
                        onChange={(e) =>
                          setDescription(e.target.value)
                        }
                        placeholder="อธิบายหน้าที่ความรับผิดชอบ..."
                        className="w-full resize-none rounded-xl border border-[#DDD9E8] px-4 py-3 text-sm outline-none focus:border-[#7678ED]"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="mb-2 block text-sm font-semibold text-[#403C52]">
                        คุณสมบัติผู้สมัคร
                      </label>

                      <textarea
                        rows={5}
                        value={qualifications}
                        onChange={(e) =>
                          setQualifications(e.target.value)
                        }
                        placeholder="เช่น&#10;• กำลังศึกษาอยู่ชั้นปีที่ 3-4&#10;• สาขาวิศวกรรมคอมพิวเตอร์&#10;• มีพื้นฐาน Programming"
                        className="w-full resize-none rounded-xl border border-[#DDD9E8] px-4 py-3 text-sm outline-none focus:border-[#7678ED]"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="mb-2 block text-sm font-semibold text-[#403C52]">
                        สวัสดิการ
                      </label>

                      <textarea
                        rows={4}
                        value={welfare}
                        onChange={(e) =>
                          setWelfare(e.target.value)
                        }
                        placeholder="เช่น&#10;• เบี้ยเลี้ยง&#10;• อุปกรณ์สำหรับทำงาน&#10;• อาหารกลางวัน"
                        className="w-full resize-none rounded-xl border border-[#DDD9E8] px-4 py-3 text-sm outline-none focus:border-[#7678ED]"
                      />
                    </div>
                  </div>
                </section>

                {/* Date */}
                <section className="rounded-2xl border border-[#E7E4EF] bg-white">
                  <div className="border-b border-[#EEEAF3] px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF1E8]">
                        <CalendarDays
                          size={20}
                          className="text-[#F18701]"
                        />
                      </div>

                      <div>
                        <h2 className="font-bold text-[#29263E]">
                          กำหนดช่วงเวลารับสมัคร
                        </h2>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-[#403C52]">
                        วันที่เริ่มรับสมัคร *
                      </label>

                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) =>
                          setStartDate(e.target.value)
                        }
                        className="w-full rounded-xl border border-[#DDD9E8] px-4 py-3 text-sm outline-none focus:border-[#7678ED]"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-[#403C52]">
                        วันที่สิ้นสุดรับสมัคร *
                      </label>

                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) =>
                          setEndDate(e.target.value)
                        }
                        className="w-full rounded-xl border border-[#DDD9E8] px-4 py-3 text-sm outline-none focus:border-[#7678ED]"
                      />
                    </div>
                  </div>
                </section>
              </div>

              {/* Summary */}
              <div>
                <div className="sticky top-6 rounded-2xl border border-[#E7E4EF] bg-white p-5">
                  <h3 className="font-bold text-[#29263E]">
                    สรุปประกาศงาน
                  </h3>

                  <div className="mt-5 space-y-4">
                    <SummaryItem
                      label="บริษัท"
                      value={
                        companyName || "ยังไม่ได้ระบุ"
                      }
                    />

                    <SummaryItem
                      label="ผู้ติดต่อ"
                      value={
                        contactName || "ยังไม่ได้ระบุ"
                      }
                    />

                    <SummaryItem
                      label="ตำแหน่ง"
                      value={
                        jobTitle || "ยังไม่ได้ระบุ"
                      }
                    />

                    <SummaryItem
                      label="สถานที่"
                      value={
                        location || "ยังไม่ได้ระบุ"
                      }
                    />

                    <SummaryItem
                      label="จำนวนที่รับ"
                      value={
                        positions
                          ? `${positions} คน`
                          : "ยังไม่ได้ระบุ"
                      }
                    />

                    <SummaryItem
                      label="ช่วงเวลารับสมัคร"
                      value={`${startDate || "-"} ถึง ${
                        endDate || "-"
                      }`}
                    />
                  </div>

                  <div className="mt-6 space-y-3">
                    <button
                      type="submit"
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#3D348B] px-4 py-3 text-sm font-semibold text-white hover:bg-[#302975]"
                    >
                      <Save size={17} />
                      สร้างประกาศงาน
                    </button>

                    <Link
                      href="/conditer"
                      className="flex w-full items-center justify-center rounded-xl border border-[#DDD9E8] px-4 py-3 text-sm font-semibold text-[#696579] hover:bg-[#F7F6FB]"
                    >
                      ยกเลิก
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

function SummaryItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[11px] text-[#9B97AA]">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-semibold text-[#403C52]">
        {value}
      </p>
    </div>
  );
}