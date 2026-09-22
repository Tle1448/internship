import Link from "next/link";

type AdminBreadcrumbProps = {
  current?: string;
  isRoot?: boolean;
};

function HomeIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="size-4">
      <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

export default function AdminBreadcrumb({ current, isRoot = false }: AdminBreadcrumbProps) {
  return (
    <nav aria-label="ตำแหน่งหน้าปัจจุบัน" className="flex items-center gap-3 text-sm text-[#77758D]">
      <Link href="/admin/dashboard" aria-label="ภาพรวมระบบ" className="rounded text-[#9290A4] transition hover:text-[#3D348B] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3D348B]">
        <HomeIcon />
      </Link>
      {isRoot ? <span className="font-semibold text-[#3D348B]" aria-current="page">ภาพรวมระบบ</span> : <Link href="/admin/dashboard" className="transition hover:text-[#3D348B]">ภาพรวมระบบ</Link>}
      {current && <><span aria-hidden="true" className="text-[#AAA8B7]">›</span><span className="font-semibold text-[#3D348B]" aria-current="page">{current}</span></>}
    </nav>
  );
}
