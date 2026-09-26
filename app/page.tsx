import React from "react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div
        className="relative min-h-[700px] flex items-center justify-between px-6 md:px-12 lg:px-20 py-16 overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #E8F0FF 0%, #D9E8FF 50%, #E8F0FF 100%)",
          backgroundImage: `linear-gradient(to right, #E8F0FF 0%, rgba(232, 240, 255, 0.8) 50%, rgba(232, 240, 255, 0) 100%), url('/พื้นหลัง.png')`,
          backgroundSize: "cover",
          backgroundPosition: "center right",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Background decorative circles */}
        <div className="absolute top-10 right-20 w-96 h-96 rounded-full bg-blue-300/10 blur-3xl"></div>
        <div className="absolute -bottom-32 left-1/2 w-96 h-96 rounded-full bg-indigo-300/10 blur-3xl"></div>

        {/* Left Content */}
        <div className="relative z-10 flex-1 max-w-3xl pr-4">
          <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
            <span className="text-gray-900">Start Your</span>
            <span className="text-indigo-600"> Internship</span>
            <br />
            <span className="text-gray-900">Journey with</span>
            <br />
            <span className="text-indigo-600"> Confidence</span>
          </h1>

          <p className="text-lg text-gray-700 mb-4 font-semibold">
            ระบบบริหารจัดการสหกิจศึกษา มหาวิทยาลัยวลัยลักษณ์
          </p>

          <p className="text-base text-gray-600 mb-8 leading-relaxed">
            เพื่อนโยงนักศึกษา สถานประกอบการ และอาจารย์นิเทศ
            <br />
            เพื่อการศึกษาและสหกิจศึกษาที่มีประสิทธิภาพ ครอบคลุม และใช้ง่าย
          </p>

          <Link
            href="/Login"
            className="inline-flex items-center justify-center gap-3 px-8 py-3.5 rounded-full bg-indigo-600 text-white font-semibold text-base hover:bg-indigo-700 transition-all shadow-lg hover:shadow-xl hover:scale-105"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            เข้าสู่ระบบ (Login)
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="px-6 md:px-12 lg:px-20 py-16 bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Feature 1 */}
          <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-all border border-gray-100">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-100 mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-indigo-600"
              >
                <path d="M22 10v6M2 10v6" />
                <path d="M5 18c-1 0-2-1-2-2v-5c0-1 1-2 2-2h2a2 2 0 0 1 2 2v5c0 1-1 2-2 2h-2Z" />
                <path d="M17 18c-1 0-2-1-2-2v-5c0-1 1-2 2-2h2a2 2 0 0 1 2 2v5c0 1-1 2-2 2h-2Z" />
                <path d="M6 4v2M12 4v2M18 4v2" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Internship Management
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              จัดการอยู่สหกิจศึกษาและฝึกงาน ครบครวง
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-all border border-gray-100">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-100 mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-indigo-600"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Company Matching
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              คัดเลือกบริษัทสำนักประกอบการ ได้ง่าย
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-all border border-gray-100">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-100 mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-indigo-600"
              >
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Document Tracking
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              ติดตามเอกสารและเอกสารออนไลน์ แบบออนไลน์
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-all border border-gray-100">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-100 mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-indigo-600"
              >
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 17.5" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Progress Monitoring
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              ติดตามความก้าวหน้าการศึกษา และการประเมินผล
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="px-6 md:px-12 lg:px-20 py-16 bg-white">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            พร้อมที่จะเริ่มต้นหรือยัง?
          </h2>
          <p className="text-gray-600 text-lg mb-8">
            เข้าสู่ระบบเพื่อเข้าถึงบริการและเครื่องมือทั้งหมด
          </p>
          <Link
            href="/Login"
            className="inline-flex items-center justify-center gap-3 px-10 py-4 rounded-full bg-indigo-600 text-white font-semibold text-lg hover:bg-indigo-700 transition-all shadow-lg hover:shadow-xl hover:scale-105"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            เข้าสู่ระบบ (Login)
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