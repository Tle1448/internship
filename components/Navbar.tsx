"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

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

// ---------- Icons (inline SVG, ไม่ต้องพึ่ง dependency เพิ่ม) ----------
function UserIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M4.5 20c1.4-3.4 4.3-5.5 7.5-5.5s6.1 2.1 7.5 5.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ---------- Component ----------
// วางไว้ใน app/layout.tsx เพื่อใช้ร่วมกันทุกหน้า:
//   import Navbar from "@/components/Navbar";
//   ...
//   <body><Navbar /> {children}</body>
export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-2.5">
        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-900 text-sm font-bold text-white">
            WU
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold leading-tight text-slate-900">
              WU-Intern<span className="text-orange-500">Ship</span>
            </p>
            <p className="text-[11px] leading-tight text-slate-400">ระบบสหกิจศึกษาและฝึกงานวิชาชีพ</p>
          </div>
        </Link>

        {/* Nav tabs */}
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

        {/* Right side: ยังไม่มีระบบล็อกอิน จึงโชว์ปุ่มเข้าสู่ระบบแทนข้อมูลผู้ใช้ */}
        <div className="flex shrink-0 items-center gap-3">
          <Link
            href="/login"
            className="flex items-center gap-1.5 whitespace-nowrap rounded-full bg-indigo-900 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-800"
          >
            <UserIcon className="h-4 w-4" />
            เข้าสู่ระบบ
          </Link>
        </div>
      </div>
    </header>
  );
}
