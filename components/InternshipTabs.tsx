"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { label: "อัปเดทหลักฐาน", href: "/internship-record" },
  { label: "บันทึกประจำสัปดาห์", href: "/internship-record/weekly-logs" },
];

export default function InternshipTabs() {
  const pathname = usePathname();

  return (
    <div className="flex gap-1.5 bg-white rounded-xl border border-slate-200 p-1.5 w-fit">
      {tabs.map((tab) => {
        const active = pathname === tab.href;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
              active
                ? "bg-indigo-900 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}