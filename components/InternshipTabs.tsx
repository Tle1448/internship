"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { label: "เอกสารฝึกงาน", href: "/internship-record" },
  { label: "บันทึกความก้าวหน้า", href: "/internship-record/weekly-logs" },
];

export default function InternshipTabs() {
  const pathname = usePathname();
  return <nav aria-label="งานระหว่างฝึกงาน" className="flex w-fit gap-1.5 rounded-lg border border-slate-200 bg-white p-1.5">
    {tabs.map((tab) => <Link key={tab.href} href={tab.href} className={`whitespace-nowrap rounded-lg px-4 py-2 text-xs font-semibold transition ${pathname === tab.href ? "bg-indigo-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"}`}>{tab.label}</Link>)}
  </nav>;
}
