import React from "react";
import Link from "next/link"; 

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4 font-sans">
      
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-[#3D348B] mb-4">
          WU-InternShip Platform
        </h1>
        <p className="text-lg text-gray-600">
          ระบบบริหารจัดการสหกิจศึกษา มหาวิทยาลัยวลัยลักษณ์
        </p>
      </div>

      <Link 
        href="/Login"
        className="flex justify-center items-center gap-2 py-3.5 px-8 rounded-[10px] shadow-sm text-[16px] font-semibold text-white bg-[#3D348B] hover:bg-[#7678ED] transition-all"
      >
        เข้าสู่ระบบ (Login)
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14" />
          <path d="m12 5 7 7-7 7" />
        </svg>
      </Link>

    </div>
  );
}