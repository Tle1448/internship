import React from "react";
import Link from "next/link";

export default function AdminDashboardPage() {
  return (
    <div className="flex min-h-screen bg-[#F8F9FA] text-black font-sans">
      {/* 1. LEFT SIDEBAR NAVIGATION */}
      <aside className="w-[260px] bg-white border-r border-[#EAEAEA] flex flex-col fixed h-screen z-10">
        <div className="p-5 flex items-center gap-3 border-b border-[#EAEAEA]">
          <div className="w-[36px] h-[36px] bg-[#3D348B] text-white rounded-lg flex items-center justify-content-center justify-center font-bold text-lg">
            WU
          </div>
          <div>
            <div className="text-lg font-bold text-[#3D348B] leading-tight">
              WU-InternShip
            </div>
            <div className="text-[10px] text-[#555555] tracking-widest">
              ADMIN PORTAL
            </div>
          </div>
        </div>

        <ul className="list-none p-3 flex-grow">
          <li className="text-[11px] text-[#555555] px-3 pb-2 font-semibold">
            เมนูการจัดการระบบ
          </li>
          <li className="mb-1">
            <a
              href="#"
              className="flex items-center justify-between p-3 rounded-xl text-sm font-medium transition-all bg-[#3D348B] text-white"
            >
              <div className="flex items-center gap-2.5">
                📊 ภาพรวมระบบ (Dashboard)
              </div>
            </a>
          </li>
          <li className="mb-1">
            <a
              href="#"
              className="flex items-center justify-between p-3 rounded-xl text-sm font-medium transition-all text-black hover:bg-[#7678ED]/10 hover:text-[#3D348B]"
            >
              <div className="flex items-center gap-2.5">
                👥 จัดการผู้ใช้งาน (Users)
              </div>
            </a>
          </li>
          <li className="mb-1">
            <a
              href="#"
              className="flex items-center justify-between p-3 rounded-xl text-sm font-medium transition-all text-black hover:bg-[#7678ED]/10 hover:text-[#3D348B]"
            >
              <div className="flex items-center gap-2.5">
                🎓 จัดการนักศึกษา (Students)
              </div>
              <span className="bg-[#F7B801] text-black text-[11px] font-bold px-2 py-0.5 rounded-full font-mono">
                450
              </span>
            </a>
          </li>
          <li className="mb-1">
            <a
              href="#"
              className="flex items-center justify-between p-3 rounded-xl text-sm font-medium transition-all text-black hover:bg-[#7678ED]/10 hover:text-[#3D348B]"
            >
              <div className="flex items-center gap-2.5">
                🏢 จัดการสถานประกอบการ
              </div>
              <span className="bg-[#F18701] text-white text-[11px] font-bold px-2 py-0.5 rounded-full font-mono">
                15
              </span>
            </a>
          </li>
          <li className="mb-1">
            <a
              href="#"
              className="flex items-center justify-between p-3 rounded-xl text-sm font-medium transition-all text-black hover:bg-[#7678ED]/10 hover:text-[#3D348B]"
            >
              <div className="flex items-center gap-2.5">
                💼 จัดการตำแหน่งงาน (Jobs)
              </div>
            </a>
          </li>
          <li className="mb-1">
            <a
              href="#"
              className="flex items-center justify-between p-3 rounded-xl text-sm font-medium transition-all text-black hover:bg-[#7678ED]/10 hover:text-[#3D348B]"
            >
              <div className="flex items-center gap-2.5">📑 ตรวจสอบเอกสาร</div>
              <span className="bg-[#F35B04] text-white text-[11px] font-bold px-2 py-0.5 rounded-full font-mono">
                28
              </span>
            </a>
          </li>
        </ul>

        <div className="p-4 border-t border-[#EAEAEA] flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#3D348B] text-white flex items-center justify-center font-bold text-sm">
            AU
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">Admin User</span>
            <span className="text-xs text-[#555555]">System Admin</span>
          </div>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <div className="ml-[260px] flex-grow flex flex-col min-w-0">

        {/* Main Dashboard Content */}
        <main className="p-8 max-w-[1440px]">

          <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sticky top-0 z-0 py-4 px-8">
            <div>
              <h1 className="text-3xl font-bold text-black">
                Dashboard
              </h1>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex gap-3">
              <button className="h-10 px-5 rounded-lg text-xs font-semibold bg-[#3D348B] text-white hover:bg-[#7678ED] transition-colors">
                + Add New User
              </button>
              <button className="h-10 px-5 rounded-lg text-xs font-semibold bg-[#F7B801] text-black transition-colors">
                Configure Application Period
              </button>
              <button className="h-10 px-5 rounded-lg text-xs font-semibold bg-white border border-[#EAEAEA] text-black hover:bg-[#7678ED]/10 transition-colors">
                Export Report
              </button>
            </div>
          </header>
          

          {/* A. Top Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            <div className="bg-white border border-[#EAEAEA] rounded-xl p-5 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-semibold text-[#555555]">
                  นักศึกษาทั้งหมด (TOTAL STUDENTS)
                </span>
              </div>
              <div className="font-mono text-3xl font-bold text-black mb-2">
                450 <span className="text-sm font-normal">คน</span>
              </div>
              <div className="text-xs flex items-center gap-2">
                <span className="text-[#3D348B] font-semibold">320 Placed</span>{" "}
                / 130 Searching
              </div>
            </div>

            <div className="bg-white border border-[#EAEAEA] rounded-xl p-5 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-semibold text-[#555555]">
                  สถานประกอบการ (PARTNER COMPANIES)
                </span>
              </div>
              <div className="font-mono text-3xl font-bold text-black mb-2">
                85 <span className="text-sm font-normal">แห่ง</span>
              </div>
              <div className="text-xs flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#3D348B] text-white">
                  70 Approved
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#F18701] text-white">
                  15 Pending
                </span>
              </div>
            </div>

            <div className="bg-white border border-[#EAEAEA] rounded-xl p-5 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-semibold text-[#555555]">
                  ตำแหน่งงานที่เปิดรับ (ACTIVE JOBS)
                </span>
              </div>
              <div className="font-mono text-3xl font-bold text-black mb-2">
                120 <span className="text-sm font-normal">อัตรา</span>
              </div>
              <div className="text-xs text-[#555555]">
                กระจายใน 45 บริษัทคู่ค้า
              </div>
            </div>

            <div className="bg-white border border-[#EAEAEA] rounded-xl p-5 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-semibold text-[#555555]">
                  เอกสารรอตรวจสอบ (DOCS)
                </span>
              </div>
              <div className="font-mono text-3xl font-bold text-black mb-2">
                28 <span className="text-sm font-normal">ฉบับ</span>
              </div>
              <div className="text-xs flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#F35B04] text-white">
                  Requires Review
                </span>
              </div>
            </div>
          </div>

          {/* C. Dashboard Analytics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,0.8fr)] gap-5 mb-8">
            {/* Left Panel */}
            <div className="min-w-0 bg-white border border-[#EAEAEA] rounded-xl p-6">
              <div className="mb-5">
                <div className="text-base font-bold">
                  📊 Student Application Progress Breakdown
                </div>
                <div className="text-xs text-[#555555]">
                  ความก้าวหน้าสถานะการสมัครของนักศึกษา 450 คน
                </div>
              </div>

              <div className="h-4 bg-[#EAEAEA] rounded-full overflow-hidden flex mb-5">
                <div
                  style={{ width: "53.3%" }}
                  className="h-full bg-[#3D348B]"
                ></div>
                <div
                  style={{ width: "17.8%" }}
                  className="h-full bg-[#F7B801]"
                ></div>
                <div
                  style={{ width: "15.5%" }}
                  className="h-full bg-[#F18701]"
                ></div>
                <div
                  style={{ width: "13.4%" }}
                  className="h-full bg-gray-300"
                ></div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-[#3D348B]"></div>
                  <div>
                    <strong>Matched (ได้งาน):</strong> 240 คน (53.3%)
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-[#F7B801]"></div>
                  <div>
                    <strong>Interviewing:</strong> 80 คน (17.8%)
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-[#F18701]"></div>
                  <div>
                    <strong>Applied:</strong> 70 คน (15.5%)
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-gray-300"></div>
                  <div>
                    <strong>Searching:</strong> 60 คน (13.4%)
                  </div>
                </div>
              </div>
            </div>

            {/* Right Panel */}
            <div className="min-w-0 bg-white border border-[#EAEAEA] rounded-xl p-6">
              <div className="mb-5">
                <div className="text-base font-bold">
                  📅 Application Period Timeline
                </div>
                <div className="text-xs text-[#555555]">
                  กำหนดการเปิดรับสมัครตาม C6 Lockdown Rule
                </div>
              </div>
              <div className="p-4 bg-[#FAFAFA] rounded-lg border border-[#EAEAEA]">
                <div className="text-sm font-bold mb-2">
                  รอบปัจจุบัน: Term 2/2026 Regular
                </div>
                <div className="text-xs text-[#555555] mb-3">
                  วันเริ่มต้น: 1 พ.ย. 2026 — วันสิ้นสุด: 30 พ.ย. 2026
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#F7B801] text-black inline-block">
                  เปิดรับสมัคร (เหลือเวลา 10 วัน)
                </span>
              </div>
            </div>
            <section className="min-w-0 bg-white border border-[#EAEAEA] rounded-xl p-6 flex flex-col items-start gap-6">
              <h2 className="text-base font-bold">📄 Recent Student Document Submissions</h2>
              <Link
                href="/admin/documents"
                className="mt-auto inline-flex min-h-11 items-center rounded-lg bg-[#3D348B] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#7678ED] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#3D348B]"
              >
                ดูเพิ่มเติม →
              </Link>
            </section>
          </div>

        </main>
      </div>
    </div>
  );
}


