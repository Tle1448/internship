"use client";
import AdminSidebar from "@/components/AdminSidebar";

import AdminDeleteConfirmationModal from "@/components/adminDeleteConfirmationModal";
import AdminDeletedUsersTable from "@/components/adminDeletedUsersTable";
import UserEditModal, { type EditableUser, type UserRole } from "@/components/UserEditModal";
import { useState } from "react";

type Role = UserRole;
type User = EditableUser;

const initialUsers: User[] = [
  { id: "65114289", name: "นายสมชาย ใจดี", email: "somchai.na@wu.ac.th", role: "Student", department: "วิศวกรรมคอมพิวเตอร์", status: "Active" },
  { id: "CO-8021", name: "ดร.ประสาน สุขใจ", email: "prasan.su@wu.ac.th", role: "Coordinator", department: "เทคโนโลยีสารสนเทศ", status: "Active" },
  { id: "AD-5501", name: "ผศ.ดร.วิชาการ ดีเลิศ", email: "wichakan.de@wu.ac.th", role: "Advisor", department: "วิศวกรรมคอมพิวเตอร์", status: "Active" },
  { id: "65118942", name: "นางสาววิภาดา ภักดี", email: "wiphada.ph@wu.ac.th", role: "Student", department: "เทคโนโลยีสารสนเทศ", status: "Active" },
];
const roles: Role[] = ["Student", "Coordinator", "Advisor", "Admin"];
const roleBadgeColors: Record<Role, string> = {
  Student: "bg-[#E0E7FF] text-[#3730A3]",
  Coordinator: "bg-[#EDE9FE] text-[#6D28D9]",
  Advisor: "bg-[#FEF3C7] text-[#92400E]",
  Admin: "bg-[#DBEAFE] text-[#1D4ED8]",
};
const roleLabels: Record<Role, string> = { Student: "นักศึกษา", Coordinator: "ผู้ประสานงาน", Advisor: "อาจารย์ที่ปรึกษา", Admin: "ผู้ดูแลระบบ" };
const statusLabels: Record<User["status"], string> = { Active: "ใช้งาน", Inactive: "ระงับ" };
const inputClass = "w-full rounded-[10px] border border-[#8B80FF] bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-[#7678ED]/40";
const primaryClass = "cursor-pointer rounded-[10px] bg-[#3D348B] px-6 py-3.5 font-semibold text-white transition hover:bg-[#5146AA] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#7678ED]";
const usersPerPage = 6;
const addedStudentsStorageKey = "wu-internship-added-students";

export default function UsersPage() {
  const [users, setUsers] = useState(initialUsers);
  const [deletedUserIds, setDeletedUserIds] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<Role | "All">("All");
  const [status, setStatus] = useState<User["status"] | "All">("All");
  const [sortBy, setSortBy] = useState<"name" | "role" | "status">("name");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"general" | "active" | "deleted">("active");
  const [currentPage, setCurrentPage] = useState(1);
  const [editing, setEditing] = useState<User | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newUserId, setNewUserId] = useState("");
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
    if (!user) setNewUserId(`USR-${crypto.randomUUID()}`);
    setEditing(user);
    setIsAdding(user === null);
  }

  function saveNewUser(user: User): string | void {
    if (users.some((item) => item.id.toLowerCase() === user.id.toLowerCase() || item.email.toLowerCase() === user.email.toLowerCase())) {
      return "รหัสผู้ใช้หรืออีเมลนี้มีอยู่แล้ว โปรดตรวจสอบรายการผู้ใช้และผู้ใช้งานที่ลบแล้ว";
    }
    setUsers((current) => [...current, user]);
    if (user.role === "Student") {
      const savedStudents = JSON.parse(window.localStorage.getItem(addedStudentsStorageKey) ?? "[]") as User[];
      window.localStorage.setItem(addedStudentsStorageKey, JSON.stringify([...savedStudents.filter((student) => student.id !== user.id), user]));
    }
    setQuery("");
    setRole("All");
  }

  function deleteUser(user: User) {
    setDeletedUserIds((current) => current.includes(user.id) ? current : [...current, user.id]);
    setUserToDelete(null);
  }

  function restoreUser(user: User) {
    setDeletedUserIds((current) => current.filter((id) => id !== user.id));
    setQuery("");
    setRole("All");
  }

  function initials(name: string) {
    return name.replace(/[^A-Za-zก-๙]/g, "").slice(0, 2).toUpperCase() || "WU";
  }

  function toggleCurrentPageSelection(checked: boolean) {
    setSelectedIds((current) => checked
      ? [...new Set([...current, ...paginatedUsers.map((user) => user.id)])]
      : current.filter((id) => !paginatedUsers.some((user) => user.id === id)),
    );
  }

  return (
    <div lang="th" className="min-h-screen bg-[#F8F9FA] text-black md:flex">
      <AdminSidebar active="users" />

      <div className="min-w-0 flex-1 md:ml-[260px]">
        <header className="px-5 py-6 lg:px-10">
          <h1 className="text-2xl font-bold lg:text-[30px]">จัดการผู้ใช้งาน</h1>
          <p className="mt-1 text-[#555]">ดู เพิ่ม แก้ไข และจัดการสิทธิ์ผู้ใช้งานทั้งหมดในระบบ</p>
        </header>
        <main className="space-y-7 p-5 lg:p-10">
          <section aria-label="ค้นหาและเพิ่มผู้ใช้งาน" className="rounded-[14px] border border-[#EAEAEA] bg-white p-2.5 shadow-sm lg:p-3">
            <div className="mb-3 flex flex-wrap items-center gap-2 border-b border-gray-100 px-1 pb-2 text-sm">
              <button type="button" onClick={() => setActiveTab("general")} aria-pressed={activeTab === "general"} className={`rounded-lg px-3 py-1.5 ${activeTab === "general" ? "bg-[#EEECFF] font-semibold text-[#5146AA]" : "text-gray-500 hover:bg-gray-50"}`}>ข้อมูลทั่วไป</button>
              <button type="button" onClick={() => setActiveTab("active")} aria-pressed={activeTab === "active"} className={`rounded-lg px-3 py-1.5 ${activeTab === "active" ? "bg-[#EEECFF] font-semibold text-[#5146AA]" : "text-gray-500 hover:bg-gray-50"}`}>ผู้ใช้และสิทธิ์</button>
              <button type="button" onClick={() => setActiveTab("deleted")} aria-pressed={activeTab === "deleted"} className={`rounded-lg px-3 py-1.5 ${activeTab === "deleted" ? "bg-[#EEECFF] font-semibold text-[#5146AA]" : "text-gray-500 hover:bg-gray-50"}`}>บัญชีที่ลบแล้ว ({deletedUserIds.length})</button>
              <button type="button" onClick={() => openForm()} className={`${primaryClass} ml-auto px-4 py-2 text-sm`}>+ เพิ่มผู้ใช้งานใหม่</button>
            </div>
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_180px_180px]">
              <label className="relative"><span className="sr-only">ค้นหา</span><input type="search" placeholder="ค้นหาชื่อ อีเมล หรือรหัสผู้ใช้" value={query} onChange={(event) => { setQuery(event.target.value); setCurrentPage(1); }} className={`${inputClass} py-2 pr-10`} /><span aria-hidden="true" className="absolute right-3 top-2 text-gray-500">⌕</span></label>
              <div className="relative"><select aria-label="เรียงลำดับ" value={sortBy} onChange={(event) => { setSortBy(event.target.value as typeof sortBy); setCurrentPage(1); }} className={`${inputClass} appearance-none py-2 pr-10`}><option value="name">เรียงตามชื่อ</option><option value="role">เรียงตามบทบาท</option><option value="status">เรียงตามสถานะ</option></select><svg aria-hidden="true" viewBox="0 0 16 16" className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2" fill="none" stroke="currentColor" strokeWidth="2"><path d="m3 6 5 5 5-5" /></svg></div>
              <div className="relative"><select aria-label="กรองบทบาท" value={role} onChange={(event) => { setRole(event.target.value as Role | "All"); setCurrentPage(1); }} className={`${inputClass} appearance-none py-2 pr-10`}><option value="All">ทุกบทบาท</option>{roles.map((item) => <option key={item} value={item}>{roleLabels[item]}</option>)}</select><svg aria-hidden="true" viewBox="0 0 16 16" className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2" fill="none" stroke="currentColor" strokeWidth="2"><path d="m3 6 5 5 5-5" /></svg></div>
              <div className="relative"><select aria-label="กรองสถานะ" value={status} onChange={(event) => { setStatus(event.target.value as User["status"] | "All"); setCurrentPage(1); }} className={`${inputClass} appearance-none py-2 pr-10`}><option value="All">ทุกสถานะ</option><option value="Active">ใช้งาน</option><option value="Inactive">ระงับ</option></select><svg aria-hidden="true" viewBox="0 0 16 16" className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2" fill="none" stroke="currentColor" strokeWidth="2"><path d="m3 6 5 5 5-5" /></svg></div>
            </div>
          </section>
          {activeTab === "general" ? <section aria-labelledby="general-information-title" className="space-y-6 rounded-2xl border border-[#7678ED] bg-white p-6 shadow-[0_4px_12px_rgba(61,52,139,0.10)] lg:p-8">
            <div className="border-l-4 border-[#3D348B] pl-4"><h2 id="general-information-title" className="text-2xl font-bold text-black">ข้อมูลทั่วไป</h2><p className="mt-1 text-sm text-gray-500">สรุปข้อมูลบัญชีผู้ใช้งานในระบบ</p></div>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {[{ label: "ผู้ใช้งานทั้งหมด", value: availableUsers.length, icon: "👥", color: "bg-[#EEECFF] text-[#3D348B]" }, { label: "บัญชีที่ใช้งาน", value: activeUsers, icon: "✓", color: "bg-[#E5FAED] text-[#16A34A]" }, { label: "บัญชีที่ระงับ", value: inactiveUsers, icon: "−", color: "bg-[#F3F4F6] text-[#4B5563]" }, { label: "บัญชีที่ลบแล้ว", value: deletedUserIds.length, icon: "⌫", color: "bg-[#FFF3E6] text-[#F35B04]" }].map((item) => <article key={item.label} className="group rounded-xl border border-[#7678ED]/30 bg-white p-5 transition duration-150 hover:-translate-y-0.5 hover:border-[#7678ED] hover:shadow-[0_4px_12px_rgba(61,52,139,0.10)]"><div className="flex items-center justify-between"><p className="text-sm font-medium text-gray-600">{item.label}</p><span className={`flex size-8 items-center justify-center rounded-lg text-sm font-bold ${item.color}`}>{item.icon}</span></div><p className={`mt-5 inline-flex rounded-lg px-3 py-1 font-mono text-3xl font-bold ${item.color}`}>{item.value}</p></article>)}
            </div>
            <div className="rounded-xl border border-[#7678ED]/30 bg-[#FCFCFF] p-6"><div className="flex items-center gap-2"><span className="flex size-7 items-center justify-center rounded-md bg-[#3D348B] text-sm text-white">◆</span><h3 className="font-semibold">จำนวนผู้ใช้งานตามบทบาท</h3></div><div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{roles.map((item) => <div key={item} className="flex items-center justify-between rounded-xl border border-white bg-white px-5 py-4 shadow-sm"><span className="text-sm font-medium">{roleLabels[item]}</span><span className={`rounded-full px-3 py-1.5 text-xs font-bold ${roleBadgeColors[item]}`}>{availableUsers.filter((user) => user.role === item).length}</span></div>)}</div></div>
          </section> : activeTab === "active" ? <section aria-label="รายชื่อผู้ใช้งาน" className="rounded-[14px] border border-[#EAEAEA] bg-white p-3 shadow-sm lg:p-4">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1120px] border-collapse text-left text-sm">
                <thead className="bg-[#FAFAFA] text-[#555]"><tr><th className="w-11 px-3 py-4"><input type="checkbox" aria-label="เลือกทั้งหมดในหน้านี้" checked={paginatedUsers.length > 0 && paginatedUsers.every((user) => selectedIds.includes(user.id))} onChange={(event) => toggleCurrentPageSelection(event.target.checked)} /></th>{["ผู้ใช้", "สถานะ", "บทบาท", "สาขา / ภาควิชา", "จัดการ"].map((heading) => <th key={heading} scope="col" className="whitespace-nowrap border-b border-[#EAEAEA] px-4 py-4 text-[11px] font-bold uppercase last:text-right">{heading}</th>)}</tr></thead>
                <tbody>
                  {paginatedUsers.map((user) => (
                    <tr key={user.id} className="border-b border-[#F1F1F1] transition-colors hover:bg-[#FAFAFF]">
                      <td className="px-3 py-3"><input type="checkbox" aria-label={`เลือก ${user.name}`} checked={selectedIds.includes(user.id)} onChange={() => setSelectedIds((current) => current.includes(user.id) ? current.filter((id) => id !== user.id) : [...current, user.id])} /></td>
                      <td className="px-4 py-3"><div className="flex items-center gap-3"><span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#312E81] text-[10px] font-bold text-white">{initials(user.name)}</span><div><button type="button" onClick={() => openForm(user)} className="cursor-pointer text-left font-semibold hover:text-[#3D348B] hover:underline">{user.name}</button><p className="text-xs text-gray-500">{user.email}</p></div></div></td>
                      <td className="px-4 py-3"><span className="inline-flex items-center gap-1.5 rounded-md border border-gray-100 bg-white px-3 py-1.5 text-xs text-gray-600"><span className={`size-1.5 rounded-full ${user.status === "Active" ? "bg-[#10B981]" : "bg-[#EF4444]"}`} />{statusLabels[user.status]}</span></td>
                      <td className="px-4 py-3"><span className={`inline-flex rounded-md px-3 py-1.5 text-xs font-semibold ${roleBadgeColors[user.role]}`}>{roleLabels[user.role]}</span></td>
                      <td className="px-4 py-3">{user.department}</td>
                      <td className="px-5 py-5 text-right">
                        <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                          <button type="button" onClick={() => openForm(user)} aria-label={`แก้ไข ${user.name}`} className="cursor-pointer rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50">แก้ไข</button>
                          <button type="button" onClick={() => setUserToDelete(user)} aria-label={`ลบ ${user.name}`} className="cursor-pointer rounded-lg border border-[#F35B04] px-3 py-2 text-xs font-semibold text-[#F35B04] hover:bg-orange-50">ลบ</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && <tr><td colSpan={6} className="px-5 py-12 text-center text-[#555]">ไม่พบผู้ใช้งานที่ตรงกับการค้นหา</td></tr>}
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
          onConfirm={() => deleteUser(userToDelete)}
        />
      )}

      {editing && (
        <UserEditModal
          key={editing.id}
          user={editing}
          onClose={() => setEditing(null)}
          onSave={(updated) => {
            if (users.some((user) => user.id !== updated.id && user.email.toLowerCase() === updated.email.toLowerCase())) {
              return "อีเมลนี้มีอยู่ในระบบแล้ว";
            }
            setUsers((current) => current.map((user) => user.id === updated.id ? updated : user));
          }}
        />
      )}

      {isAdding && (
        <UserEditModal
          mode="create"
          initialId={newUserId}
          roles={roles}
          onClose={() => setIsAdding(false)}
          onSave={saveNewUser}
        />
      )}
    </div>
  );
}
