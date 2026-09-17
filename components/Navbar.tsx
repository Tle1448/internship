"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";

// ---------- Config ----------
interface NavItem {
  label: string;
  href: string;
}

const navItems: NavItem[] = [
  { label: "หน้าแรก", href: "/" },
  { label: "ค้นหางาน", href: "/jobs" },
  { label: "บันทึกฝึกงาน", href: "/internship-record" },
  { label: "เอกสารส่งงาน", href: "/documents" },
  { label: "แจ้งเตือน", href: "/notifications" },
];

// ---------- Icons ----------
function UserIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4.5 20c1.4-3.4 4.3-5.5 7.5-5.5s6.1 2.1 7.5 5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function BellIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

function LogOutIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

// ---------- Component ----------
export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  // State สำหรับเปิด/ปิด Dropdown Menu
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ปิด Dropdown เมื่อคลิกพื้นที่อื่นภายนอก
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ฟังก์ชัน Logout และนำทางไปหน้า Home (/)
  const handleLogout = () => {
    setIsDropdownOpen(false);

    // ล้างข้อมูล Session/LocalStorage
    if (typeof window !== "undefined") {
      localStorage.clear();
      sessionStorage.clear();
    }

    // เปลี่ยนหน้ากลับไปหน้าแรก (Home)
    router.push("/");
    router.refresh();
  };

  // 1. ซ่อน Navbar ทั้งหมดเมื่ออยู่หน้า Login
  if (pathname.toLowerCase() === "/login") {
    return null;
  }

  // 2. เช็คหน้าปัจจุบัน
  const isHomePage = pathname === "/";
  const isAdvisor = pathname.startsWith("/advisor");
  const isStudent = pathname.startsWith("/pagestudent");
  const isLoggedIn = isAdvisor || isStudent;

  // 3. ข้อมูลโปรไฟล์ตามบทบาท
  const userData = isAdvisor
    ? { name: "Adviser", subText: "อาจารย์ที่ปรึกษา", avatarChar: "A" }
    : { name: "กานต์พิชชา วงษ์สุวรรณ", subText: "6410210545", avatarChar: "ก" };

  if (pathname === "/admin" || pathname.startsWith("/admin/")) return null;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white">
      <div className="flex w-full items-center justify-between gap-4 px-4 py-2.5">

        {/* Logo (ด้านซ้าย) */}
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-900 text-sm font-bold text-white">
            WU
          </div>

          <div className="hidden sm:block">
            <p className="text-sm font-semibold leading-tight text-slate-900">
              WU-Intern<span className="text-orange-500">Ship</span>
            </p>
            <p className="text-[11px] leading-tight text-slate-400">
              ระบบสหกิจศึกษาและฝึกงานวิชาชีพ
            </p>
          </div>
        </Link>

        {/* Nav tabs */}
        {!isHomePage && !isAdvisor && (
          <nav className="flex flex-1 items-center gap-1 overflow-x-auto">
            {navItems.map((item) => {
              const active = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                    active
                      ? "bg-indigo-900 text-white"
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}

        {/* Right side */}
        <div className="flex shrink-0 items-center gap-3">
          {isLoggedIn ? (
            /* กรณีล็อกอินแล้ว */
            <div className="flex items-center gap-3">
              <button className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition">
                <BellIcon className="h-5 w-5" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500"></span>
              </button>

              {/* ส่วนคลิกโปรไฟล์ + Dropdown Menu */}
              <div className="relative border-l border-slate-200 pl-3" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2.5 rounded-lg p-1 transition hover:bg-slate-50 focus:outline-none cursor-pointer"
                >
                  <div className="hidden text-right sm:block">
                    <p className="text-xs font-bold leading-tight text-slate-900">
                      {userData.name}
                    </p>
                    <p className="text-[10px] leading-tight text-slate-400">
                      {userData.subText}
                    </p>
                  </div>

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 border border-indigo-100 font-bold text-indigo-900 shadow-sm">
                    <span className="text-sm">{userData.avatarChar}</span>
                  </div>
                </button>

                {/* Dropdown เมนูลอยลงมา */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-100 bg-white p-1.5 shadow-lg ring-1 ring-black/5 z-50">
                    <div className="px-3 py-2 border-b border-slate-100 sm:hidden">
                      <p className="text-xs font-bold text-slate-900">{userData.name}</p>
                      <p className="text-[10px] text-slate-400">{userData.subText}</p>
                    </div>

                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-red-600 transition hover:bg-red-50 cursor-pointer"
                    >
                      <LogOutIcon className="h-4 w-4" />
                      ออกจากระบบ
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ปุ่มเข้าสู่ระบบ */
            <Link
              href="/login"
              className="flex items-center gap-1.5 whitespace-nowrap rounded-full bg-indigo-900 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-800"
            >
              <UserIcon className="h-4 w-4" />
              เข้าสู่ระบบ
            </Link>
          )}
        </div>

      </div>
    </header>
  );
}