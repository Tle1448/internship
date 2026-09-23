import AdminSidebar from "@/components/AdminSidebar";
import AdminBreadcrumb from "@/components/AdminBreadcrumb";
import AdminDashboardActions from "@/components/AdminDashboardActions";
import DeadlineOverview from "@/components/DeadlineOverview";
import React from "react";
import Link from "next/link";

export default function AdminDashboardPage() {
  return (
    <div className="flex min-h-screen bg-white text-black font-sans">
      {/* เมนูด้านซ้าย */}
      <AdminSidebar active="dashboard" />

      {/* พื้นที่เนื้อหาหลัก */}
      <div className="flex min-w-0 flex-grow flex-col md:ml-[260px]">

        {/* เนื้อหาหน้าภาพรวมระบบ */}
        <main className="flex max-w-[1440px] flex-col p-8">

          <AdminBreadcrumb isRoot />
          <header className="flex flex-col items-start justify-between gap-4 py-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-3xl font-bold text-black">
                ภาพรวมระบบ
              </h1>
              <p className="mt-1 text-black">
                ติดตามภาพรวมข้อมูลนักศึกษา สถานประกอบการ และการฝึกงานในระบบ
              </p>
            </div>

            {/* ปุ่มดำเนินการด่วน */}
            <AdminDashboardActions />
          </header>
          

          {/* สรุปข้อมูลสำคัญ */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            <div className="bg-white border border-[#EAEAEA] rounded-xl p-5 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-semibold text-black">
                  นักศึกษาทั้งหมด
                </span>
              </div>
              <div className="font-mono text-3xl font-bold text-black mb-2">
                450 <span className="text-sm font-normal">คน</span>
              </div>
              <div className="text-xs flex items-center gap-2">
                <span className="text-[#3D348B] font-semibold">320 ได้ที่ฝึกงาน</span>{" "}
                / 130 กำลังค้นหา
              </div>
            </div>

            <div className="bg-white border border-[#EAEAEA] rounded-xl p-5 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-semibold text-black">
                  สถานประกอบการ
                </span>
              </div>
              <div className="font-mono text-3xl font-bold text-black mb-2">
                85 <span className="text-sm font-normal">แห่ง</span>
              </div>
              <div className="text-xs flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#3D348B] text-white">
                  70 อนุมัติแล้ว
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#F18701] text-white">
                  15 รออนุมัติ
                </span>
              </div>
            </div>

            <div className="bg-white border border-[#EAEAEA] rounded-xl p-5 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-semibold text-black">
                  ตำแหน่งงานที่เปิดรับ
                </span>
              </div>
              <div className="font-mono text-3xl font-bold text-black mb-2">
                120 <span className="text-sm font-normal">อัตรา</span>
              </div>
              <div className="text-xs text-black">
                30 ตำแหน่ง จาก 45 สถานประกอบการ
              </div>
            </div>

            <div className="bg-white border border-[#EAEAEA] rounded-xl p-5 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-semibold text-black">
                  เอกสารรอตรวจสอบ
                </span>
              </div>
              <div className="font-mono text-3xl font-bold text-black mb-2">
                28 <span className="text-sm font-normal">ฉบับ</span>
              </div>
              <div className="text-xs flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#F35B04] text-white">
                  รอตรวจสอบ
                </span>
              </div>
            </div>
          </div>

          {/* สรุปข้อมูลและกำหนดการ */}
          <div className="order-2 grid grid-cols-1 gap-5 lg:grid-cols-2">
            {/* สถานะการสมัครของนักศึกษา */}
            <div className="min-w-0 bg-white border border-[#EAEAEA] rounded-xl p-6">
              <div className="mb-5">
                <div className="text-base font-bold">
                  📊 ความก้าวหน้าการสมัครของนักศึกษา
                </div>
                <div className="text-xs text-black">
                  ความก้าวหน้าสถานะการสมัครของนักศึกษา 450 คน
                </div>
              </div>

              <div className="h-4 bg-[#7678ED] rounded-full overflow-hidden flex mb-5">
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
                  className="h-full bg-[#7678ED]"
                ></div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-[#3D348B]"></div>
                  <div>
                    <strong>ได้ที่ฝึกงาน:</strong> 240 คน (53.3%)
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-[#F7B801]"></div>
                  <div>
                    <strong>กำลังสัมภาษณ์:</strong> 80 คน (17.8%)
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-[#F18701]"></div>
                  <div>
                    <strong>สมัครแล้ว:</strong> 70 คน (15.5%)
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-gray-300"></div>
                  <div>
                    <strong>กำลังค้นหา:</strong> 60 คน (13.4%)
                  </div>
                </div>
              </div>
            </div>

            {/* กำหนดการรอบสมัคร */}
            <div className="min-w-0 bg-white border border-[#EAEAEA] rounded-xl p-6">
              <div className="mb-5">
                <div className="text-base font-bold">
                  📅 กำหนดการรอบสมัคร
                </div>
                <div className="text-xs text-black">
                  กำหนดการเปิดรับสมัครตามเกณฑ์ C6
                </div>
              </div>
              <div className="p-4 bg-white rounded-lg border border-[#EAEAEA]">
                <div className="text-sm font-bold mb-2">
                  รอบปัจจุบัน: ภาคการศึกษา 2/2569 รอบปกติ
                </div>
                <div className="text-xs text-black mb-3">
                  วันเริ่มต้น: 1 พ.ย. 2569 — วันสิ้นสุด: 30 พ.ย. 2569
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#F7B801] text-black inline-block">
                  เปิดรับสมัคร (เหลือเวลา 10 วัน)
                </span>
              </div>
            </div>
          </div>

          <section aria-labelledby="admin-actions-title" className="order-1 mb-8 grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
            <div className="rounded-xl border border-[#EAEAEA] bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 id="admin-actions-title" className="text-lg font-bold text-black">งานที่ต้องดำเนินการ</h2>
                  <p className="mt-1 text-sm text-black">รายการที่ควรตรวจสอบและจัดการในวันนี้</p>
                </div>
                <span className="rounded-full bg-[#F35B04] px-3 py-1 text-xs font-semibold text-white">3 งานเร่งด่วน</span>
              </div>

              <div className="mt-5 divide-y divide-[#EAEAEA]">
                <Link href="/admin/documents" className="flex items-center gap-4 py-4 transition hover:bg-[#7678ED]/10">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#DF612A] text-lg">📄</span>
                  <span className="min-w-0 flex-1"><span className="block font-semibold">เอกสารรอตรวจสอบ</span><span className="mt-0.5 block text-xs text-black">ตรวจสอบเอกสารของนักศึกษาก่อนเริ่มฝึกงาน</span></span>
                  <span className="rounded-full bg-[#F35B04] px-2.5 py-1 text-xs font-bold text-white">28 ฉบับ</span>
                  <span aria-hidden="true" className="text-lg text-[#3D348B]">›</span>
                </Link>
                <Link href="/admin/companies" className="flex items-center gap-4 py-4 transition hover:bg-[#7678ED]/10">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#E98E22] text-lg">🏢</span>
                  <span className="min-w-0 flex-1"><span className="block font-semibold">สถานประกอบการรออนุมัติ</span><span className="mt-0.5 block text-xs text-black">ตรวจสอบข้อมูลบริษัทและผู้ติดต่อก่อนเปิดใช้งาน</span></span>
                  <span className="rounded-full bg-[#F18701] px-2.5 py-1 text-xs font-bold text-white">15 แห่ง</span>
                  <span aria-hidden="true" className="text-lg text-[#3D348B]">›</span>
                </Link>
                <Link href="/admin/jobs" className="flex items-center gap-4 py-4 transition hover:bg-[#7678ED]/10">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#514A88] text-lg">💼</span>
                  <span className="min-w-0 flex-1"><span className="block font-semibold">ตำแหน่งงานรอตรวจสอบ</span><span className="mt-0.5 block text-xs text-black">ทบทวนคุณสมบัติและวันปิดรับสมัครของประกาศงาน</span></span>
                  <span className="rounded-full bg-[#3D348B] px-2.5 py-1 text-xs font-bold text-white">4 ตำแหน่ง</span>
                  <span aria-hidden="true" className="text-lg text-[#3D348B]">›</span>
                </Link>
              </div>
            </div>

            <DeadlineOverview />
          </section>

          <section aria-label="ภาพรวมการดำเนินงานของอาจารย์และผู้ประสานงาน" className="order-3 mt-8 grid gap-5 xl:grid-cols-2">
            <section aria-labelledby="advisor-overview-title" className="rounded-xl border border-[#EAEAEA] bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><h2 id="advisor-overview-title" className="text-lg font-bold text-black">การติดตามของอาจารย์นิเทศ</h2><p className="mt-1 text-sm text-black">ภาพรวมการดูแลและประเมินนักศึกษา</p></div>
                <span className="flex size-10 items-center justify-center rounded-xl bg-[#514A88] text-xl">🎓</span>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <Link href="/advisor/students" className="rounded-xl bg-[#514A88] p-4 text-white transition hover:bg-[#433D74]"><p className="text-sm text-white/80">อาจารย์นิเทศ</p><p className="mt-1 font-mono text-2xl font-bold">24 <span className="font-sans text-sm font-normal">คน</span></p></Link>
                <Link href="/advisor/students" className="rounded-xl bg-[#E98E22] p-4 text-white transition hover:bg-[#CC7817]"><p className="text-sm text-white/80">นักศึกษาในความดูแล</p><p className="mt-1 font-mono text-2xl font-bold">450 <span className="font-sans text-sm font-normal">คน</span></p></Link>
                <Link href="/advisor/tasks" className="rounded-xl bg-[#DF612A] p-4 text-white transition hover:bg-[#C34E20]"><p className="text-sm text-white/80">รอนิเทศ</p><p className="mt-1 font-mono text-2xl font-bold">18 <span className="font-sans text-sm font-normal">รายการ</span></p></Link>
                <Link href="/advisor/evaluations" className="rounded-xl bg-[#514A88] p-4 text-white transition hover:bg-[#433D74]"><p className="text-sm text-white/80">ประเมินรอตรวจ</p><p className="mt-1 font-mono text-2xl font-bold">12 <span className="font-sans text-sm font-normal">ฉบับ</span></p></Link>
              </div>
              <Link href="/advisor/students" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#3D348B] hover:text-[#7678ED]">ดูการติดตามนักศึกษาทั้งหมด <span aria-hidden="true">→</span></Link>
            </section>

            <section aria-labelledby="coordinator-overview-title" className="rounded-xl border border-[#EAEAEA] bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><h2 id="coordinator-overview-title" className="text-lg font-bold text-black">การดำเนินงานของผู้ประสานงาน</h2><p className="mt-1 text-sm text-black">ภาพรวมบริษัท ตำแหน่งงาน และใบสมัคร</p></div>
                <span className="flex size-10 items-center justify-center rounded-xl bg-[#E98E22] text-xl">💼</span>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <Link href="/conditer/companies" className="rounded-xl bg-[#E98E22] p-4 text-white transition hover:bg-[#CC7817]"><p className="text-sm text-white/80">บริษัทรออนุมัติ</p><p className="mt-1 font-mono text-2xl font-bold">15 <span className="font-sans text-sm font-normal">แห่ง</span></p></Link>
                <Link href="/conditer/jobs/create" className="rounded-xl bg-[#514A88] p-4 text-white transition hover:bg-[#433D74]"><p className="text-sm text-white/80">ตำแหน่งงานรอตรวจ</p><p className="mt-1 font-mono text-2xl font-bold">4 <span className="font-sans text-sm font-normal">ตำแหน่ง</span></p></Link>
                <Link href="/conditer/applications" className="rounded-xl bg-[#514A88] p-4 text-white transition hover:bg-[#433D74]"><p className="text-sm text-white/80">ใบสมัครรอพิจารณา</p><p className="mt-1 font-mono text-2xl font-bold">31 <span className="font-sans text-sm font-normal">ใบสมัคร</span></p></Link>
                <Link href="/conditer/applications" className="rounded-xl bg-[#DF612A] p-4 text-white transition hover:bg-[#C34E20]"><p className="text-sm text-white/80">อนุมัติการสมัครแล้ว</p><p className="mt-1 font-mono text-2xl font-bold">278 <span className="font-sans text-sm font-normal">ใบสมัคร</span></p></Link>
              </div>
              <Link href="/conditer/applications" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#3D348B] hover:text-[#7678ED]">ดูรายการสมัครทั้งหมด <span aria-hidden="true">→</span></Link>
            </section>
          </section>

          <section className="order-4 mt-8 grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
            <section aria-labelledby="activity-title" className="rounded-xl border border-[#EAEAEA] bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center justify-between gap-3"><div><h2 id="activity-title" className="text-lg font-bold text-black">กิจกรรมล่าสุด</h2><p className="mt-1 text-sm text-[#555]">ความเคลื่อนไหวในระบบล่าสุด</p></div><Link href="/admin/users" className="text-sm font-semibold text-[#3D348B] hover:text-[#7678ED]">ดูผู้ใช้งาน</Link></div>
              <div className="mt-5 space-y-5 border-l-2 border-[#EEECFF] pl-5">
                <div className="relative"><span className="absolute -left-[29px] top-1 size-3 rounded-full border-2 border-white bg-[#3D348B]" /><p className="font-semibold">มีผู้ใช้งานใหม่ลงทะเบียน 6 ราย</p><p className="mt-1 text-xs text-[#555]">นักศึกษา 5 ราย และอาจารย์ที่ปรึกษา 1 ราย · 25 นาทีที่แล้ว</p></div>
                <div className="relative"><span className="absolute -left-[29px] top-1 size-3 rounded-full border-2 border-white bg-[#F18701]" /><p className="font-semibold">บริษัท ดิจิทัลโซลูชันส์ จำกัด ส่งตำแหน่งงานใหม่</p><p className="mt-1 text-xs text-[#555]">นักพัฒนาซอฟต์แวร์ฝึกหัด · 2 ชั่วโมงที่แล้ว</p></div>
                <div className="relative"><span className="absolute -left-[29px] top-1 size-3 rounded-full border-2 border-white bg-[#F35B04]" /><p className="font-semibold">นักศึกษาส่งเอกสารตอบรับเพิ่ม 12 ฉบับ</p><p className="mt-1 text-xs text-[#555]">รอการตรวจสอบจากผู้ดูแลระบบ · 4 ชั่วโมงที่แล้ว</p></div>
              </div>
            </section>

            <section aria-labelledby="document-summary-title" className="rounded-xl border border-[#EAEAEA] bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center justify-between gap-3"><div><h2 id="document-summary-title" className="text-lg font-bold text-black">สรุปสถานะเอกสาร</h2><p className="mt-1 text-sm text-[#555]">เอกสารประกอบการฝึกงาน</p></div><span className="text-xl">📋</span></div>
              <dl className="mt-5 space-y-3">
                <div className="flex items-center justify-between rounded-lg bg-[#F18701] px-4 py-3 text-white"><dt className="text-sm font-medium">รอตรวจสอบ</dt><dd className="font-mono text-xl font-bold">28</dd></div>
                <div className="flex items-center justify-between rounded-lg bg-[#3D348B] px-4 py-3 text-white"><dt className="text-sm font-medium">อนุมัติแล้ว</dt><dd className="font-mono text-xl font-bold">166</dd></div>
                <div className="flex items-center justify-between rounded-lg bg-[#F35B04] px-4 py-3 text-white"><dt className="text-sm font-medium">ส่งกลับแก้ไข</dt><dd className="font-mono text-xl font-bold">9</dd></div>
              </dl>
              <Link href="/admin/documents" className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-[#EAEAEA] px-4 text-sm font-semibold text-[#3D348B] transition hover:bg-[#EEECFF]">จัดการเอกสารทั้งหมด</Link>
            </section>
          </section>

        </main>
      </div>
    </div>
  );
}


