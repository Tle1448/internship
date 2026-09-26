"use client";
import AdminSidebar from "@/components/AdminSidebar";
import AdminBreadcrumb from "@/components/AdminBreadcrumb";

import AdminDeleteConfirmationModal from "@/components/adminDeleteConfirmationModal";
import AdminDeletedUsersTable from "@/components/adminDeletedUsersTable";
import UserEditModal, { type EditableUser, type UserRole, type UserSaveError } from "@/components/UserEditModal";
import { useEffect, useState } from "react";

type Role = UserRole;
type User = EditableUser & { authId?: string };
const roles: Role[] = ["Student", "Coordinator", "Advisor", "Admin"];
const roleBadgeColors: Record<Role, string> = {
  Student: "bg-[#E0E7FF] text-[#3730A3]",
  Coordinator: "bg-[#EDE9FE] text-[#6D28D9]",
  Advisor: "bg-[#FEF3C7] text-[#92400E]",
  Admin: "bg-[#DBEAFE] text-[#1D4ED8]",
};
const roleLabels: Record<Role, string> = { Student: "นักศึกษา", Coordinator: "ผู้ประสานงาน", Advisor: "อาจารย์ที่ปรึกษา", Admin: "ผู้ดูแลระบบ" };
const statusLabels: Record<User["status"], string> = { Active: "ใช้งาน", Inactive: "ระงับ" };
const inputClass = "w-full rounded-lg border border-[#EAEAEA] bg-white px-4 py-2.5 outline-none focus:border-[#7678ED] focus:ring-2 focus:ring-[#7678ED]/30";
const primaryClass = "cursor-pointer rounded-[10px] bg-[#3D348B] px-6 py-3.5 font-semibold text-white transition hover:bg-[#5146AA] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#7678ED]";
const usersPerPage = 6;
const roleFromDatabase: Record<string, Role> = { student: "Student", coordinator: "Coordinator", advisor: "Advisor", admin: "Admin" };
const roleForDatabase: Record<Role, string> = { Student: "student", Coordinator: "coordinator", Advisor: "advisor", Admin: "admin" };

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [deletedUserIds, setDeletedUserIds] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<Role | "All">("All");
  const [status, setStatus] = useState<User["status"] | "All">("All");
  const [sortBy, setSortBy] = useState<"name" | "role" | "status">("name");
  const [activeTab, setActiveTab] = useState<"general" | "active" | "deleted">("active");
  const [currentPage, setCurrentPage] = useState(1);
  const [editing, setEditing] = useState<User | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [notice, setNotice] = useState("");
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const search = query.trim().toLocaleLowerCase();
  const filteredUsers = users
    .filter((user) => !deletedUserIds.includes(user.id) && (role === "All" || user.role === role) && (status === "All" || user.status === status) && [user.name, user.email, user.id].some((value) => value.toLocaleLowerCase().includes(search)))
    .sort((a, b) => a[sortBy].localeCompare(b[sortBy], "th"));
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / usersPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedUsers = filteredUsers.slice((safeCurrentPage - 1) * usersPerPage, safeCurrentPage * usersPerPage);
  const pageNumbers = totalPages <= 7
    ? Array.from({ length: totalPages }, (_, index) => index + 1)
    : [1, 2, 3, -1, totalPages - 2, totalPages - 1, totalPages];
  const availableUsers = users.filter((user) => !deletedUserIds.includes(user.id));
  const activeUsers = availableUsers.filter((user) => user.status === "Active").length;
  const inactiveUsers = availableUsers.filter((user) => user.status === "Inactive").length;

  function openForm(user: User | null = null) {
    setEditing(user);
    setIsAdding(user === null);
  }

  async function loadUsers() {
    const response = await fetch("/api/admin/users", { cache: "no-store" });
    const payload = await response.json() as { users?: Array<{ id: string; user_code: string | null; full_name: string | null; email: string | null; role: string; faculty: string | null; major: string | null; is_active: boolean }> };
    if (!response.ok) return;
    setUsers((payload.users ?? []).map((user) => ({ authId: user.id, id: user.user_code ?? user.id, name: user.full_name ?? "-", email: user.email ?? "-", role: roleFromDatabase[user.role] ?? "Student", school: user.faculty ?? "", department: user.major ?? "-", status: user.is_active ? "Active" : "Inactive" })));
  }

  useEffect(() => { void loadUsers(); }, []);

  async function saveNewUser(user: User): Promise<string | UserSaveError | void> {
    const response = await fetch("/api/admin/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userCode: user.id, fullName: user.name, email: user.email, password: user.password, role: roleForDatabase[user.role], faculty: user.school, major: user.department, isActive: user.status === "Active" }) });
    const payload = await response.json() as { error?: string; field?: string; user?: { user_code: string } };
    if (!response.ok) return { error: payload.error ?? "บันทึกผู้ใช้งานไม่สำเร็จ", field: payload.field };
    setNotice(`เพิ่มผู้ใช้งานสำเร็จ รหัสประจำตัว: ${payload.user?.user_code ?? "—"}`);
    setQuery(""); setRole("All"); setStatus("All"); setCurrentPage(1); setActiveTab("active");
    try { await loadUsers(); } catch { setNotice(`สร้างบัญชีสำเร็จ รหัสประจำตัว: ${payload.user?.user_code ?? "—"} กรุณาโหลดหน้าใหม่เพื่อดูรายชื่อ`); }
  }

  async function deleteUser(user: User) {
    if (user.authId) await fetch(`/api/admin/users?id=${encodeURIComponent(user.authId)}`, { method: "DELETE" });
    setDeletedUserIds((current) => current.includes(user.id) ? current : [...current, user.id]);
    setUserToDelete(null);
    await loadUsers();
  }

  function restoreUser(user: User) {
    setDeletedUserIds((current) => current.filter((id) => id !== user.id));
    setQuery("");
    setRole("All");
  }

  function initials(name: string) {
    return name.replace(/[^A-Za-zก-๙]/g, "").slice(0, 2).toUpperCase() || "WU";
  }

  return (
    <div lang="th" className="min-h-screen bg-[#F8F9FA] text-black md:flex">
      <AdminSidebar active="users" />

      <div className="min-w-0 flex-1 md:ml-[285px]">
        <header className="px-5 py-6 lg:px-10">
          <AdminBreadcrumb current="จัดการผู้ใช้งาน" />
          <h1 className="mt-5 text-2xl font-bold lg:text-[30px]">จัดการผู้ใช้งาน</h1>
          <p className="mt-1 text-[#555]">ดู เพิ่ม แก้ไข และจัดการสิทธิ์ผู้ใช้งานทั้งหมดในระบบ</p>
        </header>
        <main className="space-y-7 p-5 lg:p-10">
          <section aria-label="ค้นหาและเพิ่มผู้ใช้งาน" className="rounded-[14px] border border-[#DFE6EF] bg-white p-[18px] shadow-[0_2px_5px_rgba(15,23,42,0.08)]">
            <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-gray-100 px-1 pb-3 text-sm">
              <button type="button" onClick={() => setActiveTab("general")} aria-pressed={activeTab === "general"} className={`rounded-lg px-3 py-1.5 ${activeTab === "general" ? "bg-[#EEECFF] font-semibold text-[#5146AA]" : "text-gray-500 hover:bg-gray-50"}`}>ข้อมูลทั่วไป</button>
              <button type="button" onClick={() => setActiveTab("active")} aria-pressed={activeTab === "active"} className={`rounded-lg px-3 py-1.5 ${activeTab === "active" ? "bg-[#EEECFF] font-semibold text-[#5146AA]" : "text-gray-500 hover:bg-gray-50"}`}>ผู้ใช้และสิทธิ์</button>
              <button type="button" onClick={() => setActiveTab("deleted")} aria-pressed={activeTab === "deleted"} className={`rounded-lg px-3 py-1.5 ${activeTab === "deleted" ? "bg-[#EEECFF] font-semibold text-[#5146AA]" : "text-gray-500 hover:bg-gray-50"}`}>บัญชีที่ลบแล้ว ({deletedUserIds.length})</button>
              <button type="button" onClick={() => openForm()} className={`${primaryClass} ml-auto px-4 py-2 text-sm`}>+ เพิ่มผู้ใช้งานใหม่</button>
            </div>
            <div className="grid gap-3 xl:grid-cols-[minmax(0,1.35fr)_minmax(190px,1fr)_minmax(180px,0.9fr)_minmax(180px,0.9fr)]">
              <label className="relative"><span className="sr-only">ค้นหา</span><input type="search" placeholder="ค้นหาชื่อ อีเมล หรือรหัสผู้ใช้" value={query} onChange={(event) => { setQuery(event.target.value); setCurrentPage(1); }} className={`${inputClass} pr-10`} /><span aria-hidden="true" className="absolute right-3 top-2.5 text-[#3D348B]">⌕</span></label>
              <div className="relative"><select aria-label="เรียงลำดับ" value={sortBy} onChange={(event) => { setSortBy(event.target.value as typeof sortBy); setCurrentPage(1); }} className={`${inputClass} appearance-none pr-10`}><option value="name">เรียงตามชื่อ</option><option value="role">เรียงตามบทบาท</option><option value="status">เรียงตามสถานะ</option></select><svg aria-hidden="true" viewBox="0 0 16 16" className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2" fill="none" stroke="currentColor" strokeWidth="2"><path d="m3 6 5 5 5-5" /></svg></div>
              <div className="relative"><select aria-label="กรองบทบาท" value={role} onChange={(event) => { setRole(event.target.value as Role | "All"); setCurrentPage(1); }} className={`${inputClass} appearance-none pr-10`}><option value="All">ทุกบทบาท</option>{roles.map((item) => <option key={item} value={item}>{roleLabels[item]}</option>)}</select><svg aria-hidden="true" viewBox="0 0 16 16" className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2" fill="none" stroke="currentColor" strokeWidth="2"><path d="m3 6 5 5 5-5" /></svg></div>
              <div className="relative"><select aria-label="กรองสถานะ" value={status} onChange={(event) => { setStatus(event.target.value as User["status"] | "All"); setCurrentPage(1); }} className={`${inputClass} appearance-none pr-10`}><option value="All">ทุกสถานะ</option><option value="Active">ใช้งาน</option><option value="Inactive">ระงับ</option></select><svg aria-hidden="true" viewBox="0 0 16 16" className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2" fill="none" stroke="currentColor" strokeWidth="2"><path d="m3 6 5 5 5-5" /></svg></div>
            </div>
          </section>
          {activeTab === "general" ? <section aria-labelledby="general-information-title" className="space-y-6 rounded-2xl border border-[#7678ED] bg-white p-6 shadow-[0_4px_12px_rgba(61,52,139,0.10)] lg:p-8">
            <div className="border-l-4 border-[#3D348B] pl-4"><h2 id="general-information-title" className="text-2xl font-bold text-black">ข้อมูลทั่วไป</h2><p className="mt-1 text-sm text-gray-500">สรุปข้อมูลบัญชีผู้ใช้งานในระบบ</p></div>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {[{ label: "ผู้ใช้งานทั้งหมด", value: availableUsers.length, icon: "👥", color: "bg-[#EEECFF] text-[#3D348B]" }, { label: "บัญชีที่ใช้งาน", value: activeUsers, icon: "✓", color: "bg-[#E5FAED] text-[#16A34A]" }, { label: "บัญชีที่ระงับ", value: inactiveUsers, icon: "−", color: "bg-[#F3F4F6] text-[#4B5563]" }, { label: "บัญชีที่ลบแล้ว", value: deletedUserIds.length, icon: "⌫", color: "bg-[#FFF3E6] text-[#F35B04]" }].map((item) => <article key={item.label} className="group rounded-xl border border-[#7678ED]/30 bg-white p-5 transition duration-150 hover:-translate-y-0.5 hover:border-[#7678ED] hover:shadow-[0_4px_12px_rgba(61,52,139,0.10)]"><div className="flex items-center justify-between"><p className="text-sm font-medium text-gray-600">{item.label}</p><span className={`flex size-8 items-center justify-center rounded-lg text-sm font-bold ${item.color}`}>{item.icon}</span></div><p className={`mt-5 inline-flex rounded-lg px-3 py-1 font-mono text-3xl font-bold ${item.color}`}>{item.value}</p></article>)}
            </div>
            <div className="rounded-xl border border-[#7678ED]/30 bg-[#FCFCFF] p-6"><div className="flex items-center gap-2"><span className="flex size-7 items-center justify-center rounded-md bg-[#3D348B] text-sm text-white">◆</span><h3 className="font-semibold">จำนวนผู้ใช้งานตามบทบาท</h3></div><div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{roles.map((item) => <div key={item} className="flex items-center justify-between rounded-xl border border-white bg-white px-5 py-4 shadow-sm"><span className="text-sm font-medium">{roleLabels[item]}</span><span className={`rounded-full px-3 py-1.5 text-xs font-bold ${roleBadgeColors[item]}`}>{availableUsers.filter((user) => user.role === item).length}</span></div>)}</div></div>
          </section> : activeTab === "active" ? <section aria-label="รายชื่อผู้ใช้งาน" className="overflow-x-auto rounded-[14px] border border-[#DFE6EF] bg-white p-0 shadow-[0_2px_5px_rgba(15,23,42,0.08)]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1120px] text-left text-sm">
                <thead className="bg-[#F8F7FC] text-[#3D348B]"><tr>{["ผู้ใช้", "สถานะ", "บทบาท", "สาขา / ภาควิชา", "จัดการ"].map((heading) => <th key={heading} scope="col" className="whitespace-nowrap border-b border-[#7678ED] px-[18px] py-4 text-xs font-bold last:text-right">{heading}</th>)}</tr></thead>
                <tbody>
                  {paginatedUsers.map((user) => (
                    <tr key={user.id} className="border-b border-[#DFE6EF] transition-colors hover:bg-[#FAF8FF]">
                      <td className="px-[18px] py-4"><div className="flex items-center gap-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#312E81] text-[10px] font-bold text-white">{initials(user.name)}</span><div><button type="button" onClick={() => openForm(user)} className="cursor-pointer text-left font-semibold hover:text-[#3D348B] hover:underline">{user.name}</button><p className="mt-1 text-xs text-gray-500">{user.email}</p></div></div></td>
                      <td className="px-[18px] py-4"><span className="inline-flex items-center gap-1.5 rounded-md border border-gray-100 bg-white px-3 py-1.5 text-xs text-gray-600"><span className={`size-1.5 rounded-full ${user.status === "Active" ? "bg-[#10B981]" : "bg-[#EF4444]"}`} />{statusLabels[user.status]}</span></td>
                      <td className="px-[18px] py-4"><span className={`inline-flex rounded-md px-3 py-1.5 text-xs font-semibold ${roleBadgeColors[user.role]}`}>{roleLabels[user.role]}</span></td>
                      <td className="px-[18px] py-4">{user.department}</td>
                      <td className="px-[18px] py-4 text-right">
                        <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                          <button type="button" onClick={() => openForm(user)} aria-label={`แก้ไข ${user.name}`} className="cursor-pointer rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50">แก้ไข</button>
                          <button type="button" onClick={() => setUserToDelete(user)} aria-label={`ลบ ${user.name}`} className="cursor-pointer rounded-lg border border-[#F35B04] px-3 py-2 text-xs font-semibold text-[#F35B04] hover:bg-orange-50">ลบ</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && <tr><td colSpan={5} className="px-5 py-12 text-center text-[#555]">ไม่พบผู้ใช้งานที่ตรงกับการค้นหา</td></tr>}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && <nav aria-label="แบ่งหน้ารายชื่อผู้ใช้งาน" className="flex items-center justify-between gap-4 border-t border-gray-100 px-2 pt-4 text-xs text-gray-500">
              <span>หน้า {safeCurrentPage} จาก {totalPages}</span>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={safeCurrentPage === 1} className="cursor-pointer rounded-md border border-gray-200 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-40">ก่อนหน้า</button>
                {pageNumbers.map((page, index) => page === -1 ? <span key={`ellipsis-${index}`} className="px-2">…</span> : <button key={page} type="button" onClick={() => setCurrentPage(page)} aria-current={safeCurrentPage === page ? "page" : undefined} className={`size-8 cursor-pointer rounded-md ${safeCurrentPage === page ? "bg-[#F1F0FF] font-semibold text-[#3D348B]" : "hover:bg-gray-100"}`}>{page}</button>)}
                <button type="button" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={safeCurrentPage === totalPages} className="cursor-pointer rounded-md border border-gray-200 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-40">ถัดไป</button>
              </div>
            </nav>}
          </section> : <AdminDeletedUsersTable
            users={users.filter((user) => deletedUserIds.includes(user.id))}
            onRestore={restoreUser}
          />}
        </main>
      </div>

      {userToDelete && (
        <AdminDeleteConfirmationModal
          user={userToDelete}
          onCancel={() => setUserToDelete(null)}
          onConfirm={() => { void deleteUser(userToDelete); }}
        />
      )}

      {editing && (
        <UserEditModal
          key={editing.id}
          user={editing}
          onClose={() => setEditing(null)}
          onSave={async (updated) => {
            if (!editing.authId) return "ไม่พบรหัสบัญชีในระบบ";
            const response = await fetch("/api/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editing.authId, userCode: updated.id, fullName: updated.name, email: updated.email, role: roleForDatabase[updated.role], faculty: updated.school, major: updated.department, isActive: updated.status === "Active" }) });
            const payload = await response.json() as { error?: string; field?: string };
            if (!response.ok) return { error: payload.error ?? "บันทึกผู้ใช้งานไม่สำเร็จ", field: payload.field };
            await loadUsers();
          }}
        />
      )}

      {isAdding && (
        <UserEditModal
          mode="create"
          roles={roles}
          onClose={() => setIsAdding(false)}
          onSave={saveNewUser}
        />
      )}
      {notice && <div role="status" className="fixed bottom-5 right-5 z-50 rounded-lg bg-[#3D348B] p-4 text-sm text-white shadow-lg">{notice}<button type="button" onClick={() => setNotice("")} aria-label="ปิดข้อความ" className="ml-3">×</button></div>}
    </div>
  );
}
