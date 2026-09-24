"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { homeForRole, type UserRole } from "@/lib/auth/types";

const studentRoutes = [
  "/pagestudent",
  "/select-company",
  "/internship-record",
  "/notifications",
  "/supervision-appointments",
  "/jobs",
  "/documents",
];

function requiredRoleForPath(pathname: string): UserRole | null {
  const path = pathname.toLowerCase();

  if (path.startsWith("/admin")) return "admin";
  if (path.startsWith("/advisor")) return "advisor";
  if (path.startsWith("/conditer")) return "coordinator";
  if (studentRoutes.some((route) => path.startsWith(route))) return "student";

  return null;
}

function LoadingAccess() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f6fc] px-6">
      <p className="text-sm text-slate-500">กำลังตรวจสอบสิทธิ์การใช้งาน...</p>
    </main>
  );
}

export default function RoleGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const requiredRole = requiredRoleForPath(pathname ?? "/");

  useEffect(() => {
    if (!requiredRole || loading) return;

    if (!user) {
      router.replace("/Login");
      return;
    }

    if (user.role !== requiredRole) {
      router.replace(homeForRole(user.role));
    }
  }, [loading, requiredRole, router, user]);

  if (!requiredRole) return children;
  if (loading || !user || user.role !== requiredRole) return <LoadingAccess />;

  return children;
}
