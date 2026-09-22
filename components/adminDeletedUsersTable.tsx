"use client";

import type { EditableUser } from "./UserEditModal";

export default function AdminDeletedUsersTable({ users, onRestore }: {
  users: EditableUser[];
  onRestore: (user: EditableUser) => void;
}) {
  return (
    <section aria-labelledby="deleted-users-title" className="rounded-[14px] border border-[#8B80FF] bg-white p-4 lg:p-7">
      <h2 id="deleted-users-title" className="text-lg font-bold text-[#3D348B]">ผู้ใช้งานที่ลบแล้ว ({users.length})</h2>
      <p className="mt-1 mb-5 text-sm text-gray-500">กดกู้คืนเพื่อนำผู้ใช้กลับไปยังรายการด้านบน พร้อมข้อมูลและสถานะเดิม</p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[850px] text-left text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>{["ผู้ใช้งาน (USER)", "อีเมล (EMAIL)", "บทบาท (ROLE)", "สาขา / ภาควิชา", "จัดการ (ACTIONS)"].map((heading) => <th key={heading} scope="col" className="whitespace-nowrap px-5 py-4 last:text-right">{heading}</th>)}</tr>
          </thead>
          <tbody>
            {users.length === 0 && <tr><td colSpan={5} className="px-5 py-12 text-center text-gray-500">ยังไม่มีบัญชีที่รอกู้คืน</td></tr>}
            {users.map((user) => (
              <tr key={user.id} className="border-b border-gray-100 bg-gray-50/50">
                <td className="px-5 py-4"><p className="font-semibold">{user.name}</p><p className="mt-1 font-mono text-xs text-gray-500">ID: {user.id}</p><span className="mt-2 inline-block rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-700">ลบแล้ว</span></td>
                <td className="px-5 py-4">{user.email}</td>
                <td className="px-5 py-4">{user.role}</td>
                <td className="px-5 py-4">{user.department}</td>
                <td className="px-5 py-4 text-right"><button type="button" onClick={() => onRestore(user)} aria-label={`กู้คืน ${user.name}`} className="cursor-pointer whitespace-nowrap rounded-lg border border-[#3D348B] px-4 py-2 font-semibold text-[#3D348B] hover:bg-[#3D348B]/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3D348B]">↶ กู้คืน</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
