"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import NotificationBell from "@/components/NotificationBell";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { getCurrentStudentId } from "@/lib/currentUser";

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
  const { user, logout } = useAuth();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ข้อมูลนักศึกษาจริงที่ล็อกอินอยู่ตอนนี้ (ดึงจาก profiles ตาม currentStudentId)
  const [studentProfile, setStudentProfile] = useState<{
    name: string;
    code: string;
  } | null>(null);

  const currentPath = pathname ? pathname.toLowerCase() : "";

  // เช็กว่าอยู่ในหน้านักศึกษา (รวมหน้าเลือกบริษัท /select-company ด้วยแล้ว)
  const isStudentPath =
    currentPath.startsWith("/pagestudent") ||
    currentPath.startsWith("/select-company") ||
    currentPath.startsWith("/internship-record") ||
    currentPath.startsWith("/jobs") ||
    currentPath.startsWith("/documents") ||
    currentPath.startsWith("/notifications");

  // ปิด dropdown เมื่อคลิกข้างนอก
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // โหลดชื่อ-รหัสนักศึกษาจริงจาก profiles ตาม currentStudentId
  useEffect(() => {
    if (!isStudentPath) {
      return;
    }

    let cancelled = false;

    (async () => {
      const studentId = await getCurrentStudentId();

      if (!studentId) {
        if (!cancelled) setStudentProfile(null);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, user_code")
        .eq("id", studentId)
        .maybeSingle();

      if (!cancelled) {
        if (error) {
          console.error("โหลดโปรไฟล์สำหรับ Navbar ไม่สำเร็จ:", error);
          setStudentProfile(null);
        } else {
          setStudentProfile({
            name: data?.full_name ?? "",
            code: data?.user_code ?? "",
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isStudentPath]);

  // 1. ถ้าอยู่หน้า Login ให้คืนค่าเป็น null ทันที
  if (currentPath === "/login" || currentPath.startsWith("/login")) {
    return null;
  }

  const handleLogout = async () => {
    setIsDropdownOpen(false);
    try {
      await logout();
      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error("ออกจากระบบไม่สำเร็จ:", error);
    }
  };

  // 2. เช็กประเภทของหน้าปัจจุบัน
  const isHomePage = currentPath === "/";
  const isAdmin = currentPath.startsWith("/admin");
  const isAdvisor = currentPath.startsWith("/advisor");
  const isConditer = currentPath.startsWith("/conditer");
  const isStudent = isStudentPath;

  const isLoggedIn = Boolean(user) && (isAdmin || isAdvisor || isStudent || isConditer);

  // 3. กำหนดข้อมูลโปรไฟล์ผู้ใช้งาน
  const studentDisplayName =
    studentProfile?.name && studentProfile.name.trim().length > 0
      ? studentProfile.name
      : studentProfile?.code || "นักศึกษา";

  const studentAvatarChar =
    studentProfile?.name && studentProfile.name.trim().length > 0
      ? studentProfile.name.trim().charAt(0)
      : "น";

  const userData = isAdmin
    ? { name: "Admin User", subText: "System Admin", avatarChar: "A" }
    : isAdvisor
    ? { name: "Adviser", subText: "อาจารย์ที่ปรึกษา", avatarChar: "A" }
    : isConditer
    ? { name: "Coordinator", subText: "เจ้าหน้าที่ผู้ประสานงาน", avatarChar: "C" }
    : isStudent
    ? {
        name: studentDisplayName,
        subText: studentProfile?.code || "",
        avatarChar: studentAvatarChar,
      }
    : { name: "ผู้ใช้งาน", subText: "", avatarChar: "?" };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white">
      <div className="flex w-full items-center justify-between gap-4 px-4 py-2.5">

        {/* Logo (ด้านซ้าย) */}
        <Link href={isConditer ? "/conditer/companies" : "/"} className="flex shrink-0 items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-900 text-sm font-bold text-white">
            WU
          </div>

          <div className="hidden sm:block">
            <p className="text-sm font-semibold leading-tight text-slate-900">
              WU-Intern<span className="text-orange-500">Ship</span>
            </p>
            <p className="text-[11px] leading-tight text-slate-400">
              {isConditer ? "ระบบจัดการสำหรับเจ้าหน้าที่" : "ระบบสหกิจศึกษาและฝึกงานวิชาชีพ"}
            </p>
          </div>
        </Link>

        {/* Nav tabs (ซ่อนเมื่ออยู่หน้า Home, Admin, Advisor หรือหน้านักศึกษา) */}
        {!isHomePage && !isAdmin && !isAdvisor && !isStudent && (
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
            <div className="flex items-center gap-3">
              {isStudent && <NotificationBell role="student" />}
              {isConditer && <NotificationBell role="coordinator" />}

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
