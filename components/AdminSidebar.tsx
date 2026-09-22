import Link from "next/link";

type AdminPage = "dashboard" | "users" | "student" | "companies" | "jobs" | "documents";

const menuItems: Array<{ key: AdminPage; href: string; label: string; icon: string }> = [
  { key: "dashboard", href: "/admin/dashboard", label: "ภาพรวมระบบ", icon: "📊" },
  { key: "users", href: "/admin/users", label: "จัดการผู้ใช้งาน", icon: "👥" },
  { key: "student", href: "/admin/student", label: "จัดการนักศึกษา", icon: "🎓" },
  { key: "companies", href: "/admin/companies", label: "จัดการสถานประกอบการ", icon: "🏢" },
  { key: "jobs", href: "/admin/jobs", label: "จัดการตำแหน่งงาน", icon: "💼" },
  { key: "documents", href: "/admin/documents", label: "ตรวจสอบเอกสาร", icon: "📑" },
];

export default function AdminSidebar({ active }: { active: AdminPage }) {
  return (
    <aside className="flex flex-col border-b border-[#EAEAEA] bg-white md:fixed md:top-[61px] md:z-10 md:h-[calc(100vh-61px)] md:w-[260px] md:border-r md:border-b-0">
      <nav aria-label="เมนูการจัดการระบบ" className="flex-1 p-3">
        <p className="px-3 pb-2 text-[11px] font-semibold text-[#555]">เมนูการจัดการระบบ</p>
        {menuItems.map((item) => {
          const selected = item.key === active;
          return (
            <Link
              key={item.key}
              href={item.href}
              aria-current={selected ? "page" : undefined}
              className={`mb-1 flex items-center rounded-xl p-3 text-sm font-medium transition-all ${selected ? "bg-[#3D348B] text-white" : "text-black hover:bg-[#7678ED]/10 hover:text-[#3D348B]"}`}
            >
              <span className="mr-2.5">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
