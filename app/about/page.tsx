import React from "react";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div
        className="relative min-h-[420px] flex items-center justify-center px-6 md:px-12 lg:px-20 py-20 overflow-hidden text-center"
        style={{
          background: "linear-gradient(135deg, #E8F0FF 0%, #D9E8FF 50%, #E8F0FF 100%)",
        }}
      >
        <div className="absolute top-10 right-20 w-96 h-96 rounded-full bg-blue-300/10 blur-3xl"></div>
        <div className="absolute -bottom-32 left-1/2 w-96 h-96 rounded-full bg-indigo-300/10 blur-3xl"></div>

        <div className="relative z-10 max-w-3xl">
          <p className="text-sm font-semibold text-indigo-600 tracking-wide mb-3">
            เกี่ยวกับเรา
          </p>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            WU-Intern<span className="text-indigo-600">Ship</span>
          </h1>
          <p className="text-lg text-gray-700 leading-relaxed">
            ระบบบริหารจัดการสหกิจศึกษาและฝึกงานวิชาชีพ มหาวิทยาลัยวลัยลักษณ์
            ที่ออกแบบมาเพื่อให้ทุกขั้นตอนของการฝึกงานเป็นเรื่องง่ายสำหรับทุกฝ่าย
          </p>
          
        </div>
      </div>

      {/* Mission Section — เน้นเป็นพิเศษ */}
      <div className="px-6 md:px-12 lg:px-20 py-20 bg-indigo-900 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm font-semibold text-indigo-300 tracking-wide mb-3">
            พันธกิจของเรา
          </p>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            ทำให้การฝึกงานและสหกิจศึกษา
          </h2>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            เป็นเรื่องง่ายสำหรับทุกคน
          </h2>  



          <p className="text-indigo-100 text-lg leading-relaxed max-w-4xl mx-auto">
            เราเชื่อว่านักศึกษาทุกคนควรมีโอกาสได้ฝึกงานในสถานประกอบการที่เหมาะสมกับตัวเอง
            โดยไม่ต้องเสียเวลากับความยุ่งยากของเอกสารและการติดตามงาน
            WU-InternShip จึงถูกสร้างขึ้นเพื่อเชื่อมโยงนักศึกษา สถานประกอบการ
            และอาจารย์นิเทศเข้าไว้ในที่เดียว ตั้งแต่การค้นหาและสมัครงาน
            การส่งเอกสาร ไปจนถึงการติดตามความก้าวหน้าและประเมินผล
            ให้ทุกฝ่ายทำงานร่วมกันได้อย่างมีประสิทธิภาพ โปร่งใส และตรวจสอบได้
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-12">
            <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-sm">
              <h3 className="font-bold text-lg mb-2">โปร่งใส</h3>
              <p className="text-indigo-100 text-sm leading-relaxed">
                ทุกขั้นตอนตรวจสอบสถานะได้แบบเรียลไทม์ ทั้งนักศึกษาและอาจารย์นิเทศ
              </p>
            </div>
            <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-sm">
              <h3 className="font-bold text-lg mb-2">ครบในที่เดียว</h3>
              <p className="text-indigo-100 text-sm leading-relaxed">
                ตั้งแต่หาที่ฝึกงาน ส่งเอกสาร ไปจนถึงประเมินผล ไม่ต้องสลับหลายระบบ
              </p>
            </div>
            <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-sm">
              <h3 className="font-bold text-lg mb-2">เชื่อมทุกฝ่าย</h3>
              <p className="text-indigo-100 text-sm leading-relaxed">
                นักศึกษา สถานประกอบการ และอาจารย์นิเทศ สื่อสารกันได้ในระบบเดียว
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* What the system does */}
      <div className="px-6 md:px-12 lg:px-20 py-16 bg-gray-50">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
            ระบบของเราช่วยอะไรได้บ้าง
          </h2>
          <p className="text-gray-600">
            เครื่องมือครบวงจรสำหรับการสหกิจศึกษาและฝึกงาน
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-100 mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600">
                <path d="M22 10v6M2 10v6" />
                <path d="M5 18c-1 0-2-1-2-2v-5c0-1 1-2 2-2h2a2 2 0 0 1 2 2v5c0 1-1 2-2 2h-2Z" />
                <path d="M17 18c-1 0-2-1-2-2v-5c0-1 1-2 2-2h2a2 2 0 0 1 2 2v5c0 1-1 2-2 2h-2Z" />
                <path d="M6 4v2M12 4v2M18 4v2" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">จัดการฝึกงาน</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              บริหารจัดการสหกิจศึกษาและฝึกงานครบวงจร
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-100 mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">จับคู่บริษัท</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              คัดเลือกสถานประกอบการที่เหมาะสมได้ง่ายขึ้น
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-100 mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">ติดตามเอกสาร</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              ส่งและติดตามเอกสารออนไลน์ ไม่ต้องเดินเอกสารเอง
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-100 mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 17.5" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">ติดตามความก้าวหน้า</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              ประเมินผลและติดตามพัฒนาการได้แบบเรียลไทม์
            </p>
          </div>
        </div>
      </div>

      {/* Contact / CTA */}
      <div className="px-6 md:px-12 lg:px-20 py-16 bg-white">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
            มีคำถามเกี่ยวกับสหกิจศึกษา?
          </h2>
          <p className="text-gray-600 mb-8">
            ติดต่อหน่วยงานสหกิจศึกษา มหาวิทยาลัยวลัยลักษณ์ ได้โดยตรง
          </p>
          <Link
            href="/Login"
            className="inline-flex items-center justify-center gap-3 px-8 py-3.5 rounded-full bg-indigo-600 text-white font-semibold text-base hover:bg-indigo-700 transition-all shadow-lg hover:shadow-xl hover:scale-105"
          >
            เข้าสู่ระบบเพื่อเริ่มต้น
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 md:px-12 lg:px-20 py-8 bg-gray-900 text-gray-400 text-center">
        <p className="text-sm">
          © 2026 WU-InternShip Platform. ระบบบริหารจัดการสหกิจศึกษา มหาวิทยาลัยวลัยลักษณ์
        </p>
      </div>
    </div>
  );
}