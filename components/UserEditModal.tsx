"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";

export type UserRole = "Student" | "Coordinator" | "Advisor" | "Admin";
export type UserSaveError = { error: string; field?: string };
export type EditableUser = {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  school?: string;
  department: string;
  status: "Active" | "Inactive";
};

type Props = {
  user?: EditableUser;
  initialId?: string;
  mode?: "create" | "edit";
  roles?: UserRole[];
  onClose: () => void;
  /** Return an error message if the user cannot be saved. */
  onSave: (user: EditableUser) => string | UserSaveError | void | Promise<string | UserSaveError | void>;
};

const departments: Record<string, string[]> = {
  "วิทยาลัยทันตแพทยศาสตร์นานาชาติ": ["สาขาวิชาทันตแพทยศาสตร์ (หลักสูตรนานาชาติ)"],
  "วิทยาลัยนานาชาติ (Walailak University International College - WUIC)": ["หลักสูตรนานาชาติต่างๆ (เช่น บริหารธุรกิจนานาชาติ, นวัตกรรมดิจิทัล ฯลฯ)"],
  "วิทยาลัยสัตวแพทยศาสตร์อัครราชกุมารี": ["สาขาวิชาสัตวแพทยศาสตร์ (หลักสูตรนานาชาติ)"],
  "สำนักวิชาการจัดการ": ["สาขาวิชาบริหารธุรกิจ (การตลาดดิจิทัลและการสร้างแบรนด์, การจัดการโลจิสติกส์, อุตสาหกรรมการบริการ)", "สาขาวิชาศิลปะการประกอบอาหารและการจัดการธุรกิจ / ศิลปะการประกอบการอย่างมืออาชีพ", "สาขาวิชาเศรษฐศาสตร์"],
  "สำนักวิชาการบัญชีและการเงิน": ["สาขาวิชาบัญชี", "สาขาวิชาการเงิน / นวัตกรรมธุรกิจและการเงินยุคดิจิทัล"],
  "สำนักวิชานิติศาสตร์": ["สาขาวิชานิติศาสตร์"],
  "สำนักวิชาพยาบาลศาสตร์": ["สาขาวิชาพยาบาลศาสตร์"],
  "สำนักวิชาพหุภาษาและการศึกษาทั่วไป": ["ศูนย์รายวิชาศึกษาทั่วไปและรายวิชาภาษาต่างประเทศ"],
  "สำนักวิชารัฐศาสตร์และรัฐประศาสนศาสตร์": ["สาขาวิชารัฐศาสตร์ (การเมืองการปกครอง, ความสัมพันธ์ระหว่างประเทศ)", "สาขาวิชารัฐประศาสนศาสตร์"],
  "สำนักวิชาวิทยาศาสตร์": ["สาขาวิชาวิทยาศาสตร์ (เคมี, ฟิสิกส์, ชีววิทยา, คณิตศาสตร์และสถิติ)", "สาขาวิชาวิทยาศาสตร์ทางทะเล"],
  "สำนักวิชาวิศวกรรมศาสตร์และเทคโนโลยี": ["สาขาวิชาวิศวกรรมคอมพิวเตอร์และระบบอัจฉริยะ", "สาขาวิชาวิศวกรรมเคมีและเคมีสังเคราะห์", "สาขาวิชาวิศวกรรมเครื่องกลและหุ่นยนต์", "สาขาวิชาปิโตรเคมีและพอลิเมอร์", "สาขาวิชาวิศวกรรมไฟฟ้า", "สาขาวิชาวิศวกรรมโยธา"],
  "สำนักวิชาศิลปศาสตร์": ["สาขาวิชาภาษาอังกฤษ", "สาขาวิชาภาษาจีน", "สาขาวิชาภาษาไทย", "สาขาวิชาอาเซียนศึกษา"],
  "สำนักวิชาสถาปัตยกรรมศาสตร์และการออกแบบ": ["สาขาวิชาสถาปัตยกรรม", "สาขาวิชาการออกแบบภายใน"],
  "สำนักวิชาสหเวชศาสตร์": ["สาขาวิชาเทคนิคการแพทย์ (หลักสูตรปกติและหลักสูตรนานาชาติ)", "สาขาวิชากายภาพบำบัด"],
  "สำนักวิชาสาธารณสุขศาสตร์": ["สาขาวิชาอาชีวอนามัยและความปลอดภัย", "สาขาวิชาอนามัยสิ่งแวดล้อม", "สาขาวิชาสาธารณสุขชุมชน"],
  "สำนักวิชาสารสนเทศศาสตร์": ["สาขาวิชาเทคโนโลยีมัลติมีเดีย แอนิเมชัน และเกม", "สาขาวิชาเทคโนโลยีสารสนเทศและนวัตกรรมดิจิทัล", "สาขาวิชาเทคโนโลยีดิจิทัล"],
  "สำนักวิชาเทคโนโลยีการเกษตรและอุตสาหกรรมอาหาร": ["สาขาวิชาเกษตรศาสตร์และนวัตกรรม", "สาขาวิชาวิทยาศาสตร์อาหารและนวัตกรรม"],
  "สำนักวิชาเภสัชศาสตร์": ["สาขาวิชาเภสัชศาสตร์"],
  "สำนักวิชาแพทยศาสตร์": ["สาขาวิชาแพทยศาสตร์", "สาขาวิชาการแพทย์แผนไทยประยุกต์", "สาขาวิชาวิทยาศาสตร์การกีฬาและการออกกำลังกาย"],
};
const roleLabels: Record<UserRole, string> = {
  Student: "นักศึกษา (Student)",
  Coordinator: "ผู้ประสานงาน (Coordinator)",
  Advisor: "อาจารย์ที่ปรึกษา (Academic Advisor)",
  Admin: "ผู้ดูแลระบบ (System Admin)",
};
const fieldClass = "mt-1.5 w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-normal text-[#292934] outline-none focus:border-[#7678ED] focus:ring-2 focus:ring-[#7678ED]/20";

/** Mount with key={user.id}; unmount on close to discard unsaved changes. */
export default function UserEditModal({ user, initialId = "", mode = "edit", roles = ["Student", "Coordinator", "Advisor"], onClose, onSave }: Props) {
  const isCreate = mode === "create";
  const [draft, setDraft] = useState<EditableUser>(() => user ? ({
    ...user,
    school: user.school ?? (user.department.includes("วิศวกรรม") ? "สำนักวิชาวิศวกรรมศาสตร์และเทคโนโลยี" : "สำนักวิชาสารสนเทศศาสตร์"),
  }) : ({ id: initialId, name: "", email: "", role: roles[0] ?? "Student", school: "", department: "", status: "Active" }));
  const [error, setError] = useState("");
  const [codeError, setCodeError] = useState("");
  const [editingCode, setEditingCode] = useState(false);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const autoCode = isCreate && draft.role !== "Student";
  const codeEditable = !autoCode && (isCreate || editingCode);
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const formId = useId();
  const availableDepartments = [...new Set([...(departments[draft.school ?? ""] ?? []), draft.department])].filter(Boolean);

  useEffect(() => {
    const element = dialog.current;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement;
    element?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      element?.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (savingRef.current) return;
    setError(""); setCodeError("");
    const updated = { ...draft, id: autoCode ? "" : draft.id.trim(), name: draft.name.trim(), email: draft.email.trim(), department: draft.department.trim() };
    if (!autoCode && (isCreate || editingCode || user?.role !== draft.role) && draft.role === "Student" && !/^[0-9]{8}$/.test(updated.id)) {
      setCodeError("กรุณากรอกรหัสนักศึกษาเป็นตัวเลข 8 หลัก");
      return;
    }
    if ((!autoCode && !updated.id) || !updated.name || !updated.school || !updated.department) {
      setError("กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน");
      return;
    }
    if (!/^[^\s@]+@wu\.ac\.th$/i.test(updated.email)) {
      setError("กรุณาใช้อีเมลสถาบันที่ลงท้ายด้วย @wu.ac.th");
      return;
    }
    savingRef.current = true; setSaving(true);
    try {
      const saveError = await onSave(updated);
      if (typeof saveError === "string") setError(saveError);
      else if (saveError?.field === "userCode") setCodeError(saveError.error);
      else if (saveError) setError(saveError.error);
      else onClose();
    } catch {
      setError("ไม่สามารถยืนยันผลการบันทึกได้ กรุณาตรวจสอบรายชื่อผู้ใช้งานก่อนลองอีกครั้ง");
    } finally {
      savingRef.current = false; setSaving(false);
    }
  }


  return (
    <dialog ref={dialog} aria-labelledby={titleId} onCancel={(event) => { event.preventDefault(); if (!savingRef.current) onClose(); }} className="fixed inset-0 m-auto h-[min(800px,calc(100dvh-2rem))] max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-[800px] overflow-hidden rounded-2xl border-0 bg-white p-0 text-[#292934] shadow-2xl backdrop:bg-black/40">
      <div className="flex h-full flex-col">
        <header className="flex shrink-0 items-start gap-3 border-b border-gray-100 bg-[#F5F5F6] px-5 py-6 sm:px-6">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#3D348B] text-white">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="size-6"><circle cx="9" cy="7" r="3" /><path d="M13 19H3v-2a6 6 0 0 1 9-5" /><circle cx="17" cy="16" r="3" /><path d="M17 11v2m0 6v2m-5-5h2m6 0h2m-8.5-3.5 1.4 1.4m4.2 4.2 1.4 1.4m0-7-1.4 1.4m-4.2 4.2-1.4 1.4" /></svg>
          </span>
          <div className="flex-1"><h2 id={titleId} className="text-lg font-bold text-[#3D348B]">จัดการสิทธิ์ผู้ใช้ (User RBAC Settings)</h2><p className="mt-0.5 text-xs text-gray-500">กำหนดบทบาท สิทธิ์การอนุมัติ และสังกัดหลักสูตร</p></div>
          <button type="button" disabled={saving} onClick={onClose} aria-label="ปิดหน้าต่าง" className="cursor-pointer rounded-md px-2 py-1 text-xl text-gray-500 hover:bg-gray-200">×</button>
        </header>

        <form id={formId} onSubmit={submit} className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-6 sm:px-6">
          <div>
            {autoCode ? <p role="status" className="rounded-lg bg-gray-100 p-3 text-sm text-gray-600">ระบบจะกำหนดรหัสบัญชีเมื่อบันทึกตามบทบาทที่เลือก</p> : <label className="block text-xs font-semibold text-gray-600">{draft.role === "Student" ? "รหัสนักศึกษา" : "รหัสประจำตัว"}<input required type="text" readOnly={!codeEditable} value={draft.id} onChange={(event) => { setDraft({ ...draft, id: event.target.value }); setCodeError(""); }} inputMode={draft.role === "Student" ? "numeric" : "text"} aria-invalid={Boolean(codeError)} aria-describedby={codeError ? `${formId}-code-error` : undefined} placeholder={draft.role === "Student" ? "กรอกรหัสนักศึกษาจริง 8 หลัก" : "กรอกรหัสประจำตัว"} className={`${fieldClass} font-mono read-only:bg-gray-100`} /></label>}
            {!isCreate && <button type="button" disabled={saving} onClick={() => { if (editingCode) setDraft({ ...draft, id: user?.id ?? "" }); setEditingCode(!editingCode); setCodeError(""); }} className="mt-2 text-xs font-semibold text-[#3D348B]">{editingCode ? "ยกเลิกการแก้ไขรหัส" : "แก้ไขรหัส"}</button>}
            {codeError && <p id={`${formId}-code-error`} role="alert" className="mt-2 text-sm text-red-700">{codeError}</p>}
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-xs font-semibold text-gray-600">ชื่อ - นามสกุล <span className="text-red-600">*</span><input required value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} autoComplete="name" className={fieldClass} /></label>
            <label className="block text-xs font-semibold text-gray-600">อีเมลสถาบัน (@wu.ac.th) <span className="text-red-600">*</span><input required type="email" value={draft.email} onChange={(event) => setDraft({ ...draft, email: event.target.value })} autoComplete="email" className={fieldClass} /></label>
            {isCreate && <label className="block text-xs font-semibold text-gray-600 sm:col-span-2">รหัสผ่านเริ่มต้น <span className="text-red-600">*</span><input required minLength={8} type="password" value={draft.password ?? ""} onChange={(event) => setDraft({ ...draft, password: event.target.value })} autoComplete="new-password" className={fieldClass} /></label>}
            <label className="block text-xs font-semibold text-gray-600">สำนักวิชา <span className="text-red-600">*</span><select required value={draft.school} onChange={(event) => setDraft({ ...draft, school: event.target.value, department: "" })} className={fieldClass}><option value="">เลือกสำนักวิชา</option>{[...new Set([...Object.keys(departments), draft.school ?? ""])].filter(Boolean).map((school) => <option key={school}>{school}</option>)}</select></label>
            <label className="block text-xs font-semibold text-gray-600">สาขาวิชา / หลักสูตร <span className="text-red-600">*</span><select required disabled={!draft.school} value={draft.department} onChange={(event) => setDraft({ ...draft, department: event.target.value })} className={`${fieldClass} disabled:cursor-not-allowed disabled:bg-gray-100`}><option value="">{draft.school ? "เลือกสาขาวิชา / หลักสูตร" : "เลือกสำนักวิชาก่อน"}</option>{availableDepartments.map((department) => <option key={department}>{department}</option>)}</select></label>
          </div>
          <label className="block text-xs font-semibold text-gray-600"><span className="flex flex-wrap justify-between gap-2">บทบาทที่มอบหมาย (Assigned Role)<span className="font-mono text-[#F18701]">★ C4 Policy</span></span><select value={draft.role} onChange={(event) => { setDraft({ ...draft, role: event.target.value as UserRole, id: isCreate ? "" : draft.id }); setCodeError(""); }} className={`${fieldClass} border-[#C9C5EA]`}>{[...new Set([...roles, draft.role])].map((role) => <option key={role} value={role}>{roleLabels[role]}</option>)}</select></label>

          <div className="flex items-center justify-between gap-4 rounded-xl bg-[#F3F3F4] p-4">
            <div><p id={`${formId}-active`} className="text-sm font-semibold">สถานะการใช้งานบัญชี (Account Active)</p><p className="mt-1 text-xs text-gray-500">เปิดหรือปิดสถานะการใช้งานของบัญชีผู้ใช้</p></div>
            <button type="button" role="switch" aria-checked={draft.status === "Active"} aria-labelledby={`${formId}-active`} onClick={() => setDraft({ ...draft, status: draft.status === "Active" ? "Inactive" : "Active" })} className={`flex h-6 w-12 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#3D348B] ${draft.status === "Active" ? "bg-[#3D348B]" : "bg-gray-400"}`}><span className={`size-5 rounded-full bg-white shadow-sm transition-transform ${draft.status === "Active" ? "translate-x-6" : "translate-x-0"}`} /></button>
          </div>
          {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        </form>

        <footer className="flex shrink-0 flex-wrap justify-end gap-3 border-t border-gray-100 bg-[#F5F5F6] px-5 py-5 sm:px-6">
          <button type="button" disabled={saving} onClick={onClose} className="cursor-pointer rounded-lg border border-gray-200 bg-white px-5 py-3 text-sm font-semibold hover:bg-gray-50">ยกเลิก (Cancel)</button>
          <button type="submit" form={formId} disabled={saving} aria-busy={saving} className="flex cursor-pointer items-center gap-2 rounded-lg bg-[#3D348B] px-5 py-3 text-sm font-semibold text-white hover:bg-[#5146AA]"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4"><path d="M5 3h12l4 4v14H3V3h2Z" /><path d="M7 3v6h10V3M7 21v-8h10v8" /></svg>บันทึกการเปลี่ยนแปลง (Save Changes)</button>
        </footer>
      </div>
    </dialog>
  );
}
