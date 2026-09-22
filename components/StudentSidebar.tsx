"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  FileText, 
  Bell 
} from "lucide-react";

interface MenuCategory {
  title: string;
  items: {
    label: string;
    href: string;
    badge?: string;
    icon: React.ReactNode;
  }[];
}

export default function StudentSidebar() {
  const pathname = usePathname();

  const menuCategories: MenuCategory[] = [
    {
      title: "เมนูจัดการหลัก",
      items: [
        {
          label: "หน้าแรก",
          href: "/pagestudent",
          icon: <LayoutDashboard className="w-5 h-5" />,
        },
        {
          label: "อัปเดต",
          href: "/internship-record",
          icon: <FileText className="w-5 h-5" />,
        },
        {
          label: "แจ้งเตือน",
          href: "/notifications",
          icon: <Bell className="w-5 h-5" />,
        },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 h-[calc(100vh-61px)] sticky top-[61px] p-4 flex flex-col justify-between shrink-0 hidden md:flex">
      <div className="space-y-6">
        {menuCategories.map((cat, idx) => (
          <div key={idx}>
            <p className="text-[11px] font-semibold text-slate-400 mb-3 px-3 uppercase tracking-wider">
              {cat.title}
            </p>
            <nav className="space-y-1">
              {cat.items.map((item) => {
                const isActive = 
                  pathname === item.href || 
                  (item.href !== "/pagestudent" && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? "bg-[#3D348B] text-white shadow-md shadow-indigo-100"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {item.icon}
                      <span>{item.label}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          isActive
                            ? "bg-orange-500 text-white"
                            : "bg-orange-100 text-orange-600"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-500">
        <p className="font-semibold text-slate-700">WU Internship System</p>
        <p className="text-[10px] mt-0.5">ภาคเรียนที่ 1/2567</p>
      </div>
    </aside>
  );
}