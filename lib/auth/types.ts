export const roleLabels = {
  admin: "ผู้ดูแลระบบ (Admin)",
  student: "นักศึกษา",
  coordinator: "ผู้ประสานงานสหกิจศึกษา",
  advisor: "อาจารย์ที่ปรึกษา / อาจารย์นิเทศ",
} as const;

export type UserRole = keyof typeof roleLabels;
export type SessionUser = { id: string; username: string; name: string; role: UserRole };

export function isSessionUser(value: unknown): value is SessionUser {
  if (!value || typeof value !== "object") return false;
  const user = value as Record<string, unknown>;
  return [user.id, user.username, user.name].every(v => typeof v === "string" && v.trim().length > 0)
    && typeof user.role === "string" && Object.hasOwn(roleLabels, user.role);
}

export function homeForRole(role: UserRole) {
  if (role === "admin") return "/admin/dashboard";
  if (role === "advisor") return "/advisor";
  if (role === "coordinator") return "/conditer";
  return "/pagestudent";
}
