import Link from "next/link";
import type { ReactNode } from "react";

type AdminPage = "dashboard" | "users" | "student" | "companies" | "jobs" | "documents";

const menuItems: Array<{ key: AdminPage; href: string; label: string; icon: string }> = [
  { key: "dashboard", href: "/admin/dashboard", label: "ภาพรวมระบบ", icon: "📊" },
  { key: "users", href: "/admin/users", label: "จัดการผู้ใช้งาน", icon: "👥" },
  { key: "student", href: "/admin/student", label: "จัดการนักศึกษา", icon: "🎓" },
  { key: "companies", href: "/admin/companies", label: "จัดการสถานประกอบการ", icon: "🏢" },
  { key: "jobs", href: "/admin/jobs", label: "จัดการตำแหน่งงาน", icon: "💼" },
  { key: "documents", href: "/admin/documents", label: "ตรวจสอบเอกสาร", icon: "📑" },
];

function MenuIcon({ name }: { name: AdminPage }) {
  const paths: Record<AdminPage, ReactNode> = {
    dashboard: <><rect x="3" y="3" width="18" height="18" rx="1" /><path d="M9 3v18M9 9h12" /></>,
    users: <><circle cx="9" cy="8" r="3" /><path d="M3 21v-2a6 6 0 0 1 12 0v2M16 3a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 4v3" /></>,
    student: <><path d="m3 9 9-5 9 5-9 5-9-5Z" /><path d="M7 11v5l5 3 5-3v-5M21 10v6" /></>,
    companies: <><rect x="4" y="3" width="16" height="18" rx="1" /><path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2" /></>,
    jobs: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2" /></>,
    documents: <><path d="M6 2h9l4 4v16H6z" /><path d="M15 2v5h5M9 12h6M9 16h6" /></>,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-5 shrink-0">{paths[name]}</svg>;
}

export default function AdminSidebar({ active, variant }: { active: AdminPage; variant?: "advisor" }) {
  return (
    <>
    <aside id="admin-sidebar" className="flex flex-col border-b border-[#DFE6EF] bg-white md:fixed md:top-[61px] md:z-10 md:h-[calc(100vh-61px)] md:w-[285px] md:border-r md:border-b-0">
      <nav aria-label="เมนูการจัดการระบบ" className="flex-1 px-5 py-5">
        <p className="mb-4 px-3 text-[11px] font-semibold tracking-[0.05em] text-[#94A3B8]">การจัดการระบบ</p>
        {menuItems.filter((item) => item.key !== "documents").map((item) => {
          const selected = item.key === active;
          return (
            <Link
              key={item.key}
              href={item.href}
              aria-current={selected ? "page" : undefined}
              className={`relative mb-1 flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition-colors ${selected ? variant === "advisor" ? "bg-[#EFECFA] font-bold text-[#3D348B] after:absolute after:right-0 after:top-2 after:h-[calc(100%-16px)] after:w-[3px] after:rounded-full after:bg-[#3D348B]" : "bg-[#3D348B] font-bold text-white shadow-sm" : "font-medium text-[#51506A] hover:bg-[#F5F3FB] hover:text-[#3D348B]"}`}
            >
              {variant !== "advisor" && <MenuIcon name={item.key} />}
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
    <style>{`@media (min-width: 768px) { #admin-sidebar ~ div { margin-left: 285px !important; } }`}</style>
    </>
  );
}
