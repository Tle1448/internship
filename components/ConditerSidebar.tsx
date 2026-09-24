"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Building2,
  BriefcaseBusiness,
  ClipboardCheck,
  FileClock,
  LogOut,
  Users,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

export default function ConditerSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  const menuItems = [
    {
      label: "รายการบริษัท",
      href: "/conditer/companies",
      icon: Building2,
    },
    {
      label: "สร้างประกาศงาน",
      href: "/conditer/jobs/create",
      icon: BriefcaseBusiness,
    },
    {
      label: "ยื่นคำร้องขออนุมัติ",
      href: "/conditer/applications",
      icon: ClipboardCheck,
    },
    {
      label: "อัปเดตเอกสารและความคืบหน้าการสมัคร",
      href: "/conditer/progress",
      icon: FileClock,
    },
  ];

  const handleLogout = async () => {
    const confirmed = window.confirm(
      "คุณต้องการออกจากระบบใช่หรือไม่?"
    );

    if (!confirmed) return;

    try {
      await logout();
      router.replace("/login");
      router.refresh();
    } catch {
      alert("ไม่สามารถออกจากระบบได้");
    }
  };

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[235px] border-r border-[#E8E6F0] bg-white lg:block">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#3D348B] to-[#7678ED] text-sm font-bold text-white">
          WU
        </div>

        <div>
          <h1 className="text-[16px] font-bold text-[#3D348B]">
            WU-Intern
            <span className="text-[#F18701]">Ship</span>
          </h1>

          <p className="text-[9px] text-[#9995A9]">
            ระบบสหกิจศึกษาและฝึกงานวิชาชีพ
          </p>
        </div>
      </div>

      {/* Menu */}
      <div className="px-3">
        <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-wider text-[#AAA6B8]">
          MAIN MENU
        </p>

        {menuItems.map((item) => {
          const Icon = item.icon;

          const active =
            pathname === item.href ||
            pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-3 text-xs transition ${
                active
                  ? "bg-[#EFEEFC] font-semibold text-[#3D348B]"
                  : "text-[#68657A] hover:bg-[#F4F3FC] hover:text-[#3D348B]"
              }`}
            >
              <Icon
                size={18}
                className={
                  active
                    ? "text-[#3D348B]"
                    : "text-[#888499]"
                }
              />

              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Bottom */}
      <div className="absolute bottom-5 left-4 right-4">
        <div className="mb-3 rounded-xl bg-[#F2F1FC] p-4">
          <div className="mb-2 flex items-center gap-2">
            <Users
              size={17}
              className="text-[#3D348B]"
            />

            <span className="text-[11px] font-semibold text-[#3D348B]">
              Connected System
            </span>
          </div>

          <p className="text-[9px] leading-4 text-[#858196]">
            ระบบจัดการข้อมูลบริษัทและ
            การฝึกงานสำหรับนักศึกษา
          </p>
        </div>

        {/* Logout */}
        
      </div>
    </aside>
  );
}
