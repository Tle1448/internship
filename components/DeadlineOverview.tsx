"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
type D = {
  id: string;
  academic_term: string;
  audience: string;
  title: string;
  summary: string;
  detail: string;
  due_date: string;
  destination: string;
  color: "violet" | "orange" | "deep-orange";
  sort_order: number;
};
type Draft = Omit<D, "id">;
const blank: Draft = {
  academic_term: "2/2569",
  audience: "นักศึกษา",
  title: "",
  summary: "",
  detail: "",
  due_date: "",
  destination: "/admin/dashboard",
  color: "violet",
  sort_order: 0,
};
const defaultTerms = ["1/2569", "2/2569", "ฤดูร้อน/2569"],
  colors = {
    violet: "bg-[#3D348B]",
    orange: "bg-[#F18701]",
    "deep-orange": "bg-[#F35B04]",
  };
const allowedDestinations = [
  "/admin/dashboard",
  "/admin/student",
  "/admin/companies",
  "/admin/jobs",
  "/admin/users",
  "/advisor",
  "/advisor/students",
  "/advisor/tasks",
  "/conditer",
  "/conditer/companies",
  "/conditer/jobs/create",
  "/conditer/applications",
] as const;
const getAllowedDestination = (destination: string) =>
  allowedDestinations.includes(destination as (typeof allowedDestinations)[number])
    ? destination
    : "/admin/dashboard";
export default function DeadlineOverview() {
  const [term, setTerm] = useState("2/2569"),
    [availableTerms, setAvailableTerms] = useState(defaultTerms),
    [items, setItems] = useState<D[]>([]),
    [page, setPage] = useState(1),
    [selected, setSelected] = useState<D | null>(null),
    [draft, setDraft] = useState<Draft | null>(null),
    [editId, setEditId] = useState<string | null>(null),
    [saveError, setSaveError] = useState<string | null>(null);
  const load = useCallback(async () => {
    const [{ data }, { data: termData }] = await Promise.all([
      supabase
        .from("dashboard_deadlines")
        .select(
          "id,academic_term,audience,title,summary,detail,due_date,destination,color,sort_order",
        )
        .eq("academic_term", term)
        .order("due_date"),
      supabase.from("dashboard_deadlines").select("academic_term"),
    ]);
    setItems((data ?? []) as D[]);
    setAvailableTerms([
      ...new Set([
        ...defaultTerms,
        ...(termData ?? []).map((item) => item.academic_term),
      ]),
    ]);
  }, [term]);
  useEffect(() => {
    const t = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(t);
  }, [load]);
  const pages = Math.max(1, Math.ceil(items.length / 3)),
    shown = items.slice((page - 1) * 3, page * 3);
  const create = () => {
    setEditId(null);
    setSaveError(null);
    setDraft({ ...blank, academic_term: term, sort_order: items.length + 1 });
  };
  const edit = (x: D) => {
    const { id, ...v } = x;
    setEditId(id);
    setSaveError(null);
    setDraft(v);
    setSelected(null);
  };
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    const safeDraft = { ...draft, destination: getAllowedDestination(draft.destination) };
    const q = editId
      ? supabase.from("dashboard_deadlines").update(safeDraft).eq("id", editId)
      : supabase.from("dashboard_deadlines").insert(safeDraft);
    const { error } = await q;
    if (error) {
      setSaveError(error.message);
      return;
    }
    setSaveError(null);
    setDraft(null);
    await load();
  };
  const del = async (x: D) => {
    if (window.confirm("ลบกำหนดส่งนี้ใช่หรือไม่?")) {
      await supabase.from("dashboard_deadlines").delete().eq("id", x.id);
      setSelected(null);
      await load();
    }
  };
  return (
    <section className="rounded-[14px] border border-[#DFE6EF] bg-white p-5 shadow-[0_2px_5px_rgba(15,23,42,0.08)] sm:p-6">
      <div className="flex justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">กำหนดส่งที่ใกล้ถึง</h2>
          <label className="mt-1 flex gap-2 text-sm text-[#555]">
            ภาคการศึกษา
            <select
              value={term}
              onChange={(e) => {
                setTerm(e.target.value);
                setPage(1);
              }}
            >
              {availableTerms.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
        </div>
        <button
          onClick={create}
          className="rounded-lg bg-[#3D348B] px-2 py-1.5 text-xs font-semibold text-white"
        >
          + เพิ่มกำหนดส่ง
        </button>
      </div>
      <ol className="mt-3 space-y-1">
        {shown.map((x) => (
          <li key={x.id} className="flex gap-3 rounded-lg px-2 py-1">
            <i className={`mt-2 size-2 rounded-full ${colors[x.color]}`} />
            <button
              onClick={() => setSelected(x)}
              className="group flex-1 rounded-lg px-1 py-0.5 text-left outline-none transition hover:bg-[#F1F0FF] focus-visible:ring-2 focus-visible:ring-[#7678ED]"
              aria-label={`ดูหรือแก้ไข ${x.title}`}
            >
              <span className="flex items-center gap-2">
                <span className="rounded-full border px-2 py-0.5 text-[10px]">
                  {x.audience}
                </span>
                <b>{x.title}</b>
                <span className="ml-auto text-xs font-medium text-[#3D348B] opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
                  ✎ คลิกเพื่อดู/แก้ไข
                </span>
              </span>
              <span className="mt-0.5 block text-xs text-[#555]">{x.summary}</span>
              <span className="block text-xs text-[#555]">
                {new Date(`${x.due_date}T00:00:00`).toLocaleDateString("th-TH")}
              </span>
            </button>
            <Link href={getAllowedDestination(x.destination)}>›</Link>
          </li>
        ))}
      </ol>
      {pages > 1 && (
        <nav className="mt-4 flex justify-end gap-2">
          <button onClick={() => setPage(Math.max(1, page - 1))}>‹</button>
          <small>
            {page}/{pages}
          </small>
          <button onClick={() => setPage(Math.min(pages, page + 1))}>›</button>
        </nav>
      )}
      {selected && (
        <Modal>
          <button onClick={() => setSelected(null)} className="float-right">
            ×
          </button>
          <h3 className="text-xl font-bold">{selected.title}</h3>
          <p className="mt-4 text-[#555]">{selected.detail}</p>
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={() => del(selected)}
              className="rounded-lg bg-[#F35B04] px-4 py-2 text-white"
            >
              ลบ
            </button>
            <button
              onClick={() => edit(selected)}
              className="rounded-lg border px-4 py-2"
            >
              แก้ไข
            </button>
          </div>
        </Modal>
      )}
      {draft && <EditorModal draft={draft} setDraft={setDraft} edit={Boolean(editId)} error={saveError} onClose={() => { setSaveError(null); setDraft(null); }} onSave={save} />}
    </section>
  );
}
function Modal({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <section className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6">
        {children}
      </section>
    </div>
  );
}
function EditorModal({ draft, setDraft, edit, error, onClose, onSave }: { draft: Draft; setDraft: (value: Draft) => void; edit: boolean; error: string | null; onClose: () => void; onSave: (event: React.FormEvent) => void }) {
  return <div role="dialog" aria-modal="true" aria-labelledby="deadline-editor-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><form onSubmit={onSave} className="flex h-[min(800px,calc(100dvh-2rem))] w-full max-w-[800px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"><header className="flex items-start gap-3 border-b border-gray-100 bg-[#F5F5F6] px-5 py-6 sm:px-6"><span className="flex size-10 items-center justify-center rounded-lg bg-[#3D348B] text-white" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-5"><path d="M5 21V4m0 1h10l-1.5 3L15 11H5" /></svg></span><div className="flex-1"><h3 id="deadline-editor-title" className="text-lg font-bold text-[#3D348B]">{edit ? "แก้ไขกำหนดส่ง" : "เพิ่มกำหนดส่ง"}</h3><p className="mt-0.5 text-xs text-gray-500">กำหนดกลุ่มเป้าหมาย รายละเอียด และวันครบกำหนด</p></div><button type="button" onClick={onClose} aria-label="ปิด" className="rounded-md px-2 py-1 text-xl text-gray-500 hover:bg-gray-200">×</button></header><div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-6"><Fields d={draft} set={setDraft} />{error && <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">บันทึกไม่สำเร็จ: {error}</p>}</div><footer className="flex shrink-0 justify-end gap-3 border-t border-gray-100 bg-[#F5F5F6] px-5 py-5 sm:px-6"><button type="button" onClick={onClose} className="rounded-lg border border-gray-200 bg-white px-5 py-3 text-sm font-semibold">ยกเลิก</button><button className="rounded-lg bg-[#3D348B] px-5 py-3 text-sm font-semibold text-white hover:bg-[#5146AA]">บันทึกกำหนดส่ง</button></footer></form></div>;
}
function Fields({ d, set }: { d: Draft; set: (x: Draft) => void }) {
  const u = (k: keyof Draft, v: string) => set({ ...d, [k]: v });
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {(
        [
          ["title", "ชื่อกิจกรรม", "text"],
          ["audience", "กลุ่มเป้าหมาย", "select"],
          ["due_date", "วันกำหนดส่ง", "date"],
          ["summary", "คำอธิบายสั้น", "text"],
          ["detail", "รายละเอียด", "text"],
        ] as const
      ).map(([k, l, t]) => (
        <label key={k} className={k === "detail" ? "sm:col-span-2 text-xs font-semibold text-gray-600" : "text-xs font-semibold text-gray-600"}>
          {l}
          {k === "audience" ? (
            <select
              value={d.audience}
              onChange={(e) => u("audience", e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-[#7678ED]"
            >
              <option value="อาจารย์นิเทศ">อาจารย์นิเทศ</option>
              <option value="นักศึกษา">นักศึกษา</option>
              <option value="เจ้าหน้าที่สหกิจ">เจ้าหน้าที่สหกิจ</option>
              <option value="อาจารย์ผู้ประสานงานสหกิจ">อาจารย์ผู้ประสานงานสหกิจ</option>
            </select>
          ) : k === "detail" ? (
            <textarea
              value={d[k]}
              onChange={(e) => u(k, e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-[#7678ED] focus:ring-2 focus:ring-[#7678ED]/20"
            />
          ) : (
            <input
              type={t}
              value={d[k]}
              onChange={(e) => u(k, e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-[#7678ED] focus:ring-2 focus:ring-[#7678ED]/20"
            />
          )}
        </label>
      ))}
      <label className="text-xs font-semibold text-gray-600">
        ภาคการศึกษา
        <input
          value={d.academic_term}
          onChange={(e) => u("academic_term", e.target.value)}
          list="academic-term-options"
          placeholder="เช่น 1/2570"
          className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-[#7678ED]"
        />
        <datalist id="academic-term-options">
          <option value="1/2569" />
          <option value="2/2569" />
          <option value="ฤดูร้อน/2569" />
        </datalist>
      </label>
      <label className="text-xs font-semibold text-gray-600">
        หน้าที่เกี่ยวข้อง
        <select
          value={d.destination}
          onChange={(e) => u("destination", e.target.value)}
          className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-[#7678ED]"
        >
          <option value="/admin/jobs">จัดการตำแหน่งงาน</option>
          <option value="/admin/companies">จัดการสถานประกอบการ</option>
          <option value="/admin/student">จัดการนักศึกษา</option>
          <option value="/admin/users">จัดการผู้ใช้</option>
          <option value="/admin/dashboard">หน้า Dashboard</option>
          <option value="/advisor">ภาพรวมอาจารย์นิเทศ</option>
          <option value="/advisor/students">นักศึกษาในความดูแล</option>
          <option value="/advisor/tasks">งานอาจารย์นิเทศ</option>
          <option value="/conditer">ภาพรวมผู้ประสานงาน</option>
          <option value="/conditer/companies">รายการสถานประกอบการ</option>
          <option value="/conditer/jobs/create">สร้างประกาศงาน</option>
          <option value="/conditer/applications">พิจารณาใบสมัคร</option>
        </select>
      </label>
      <label className="text-xs font-semibold text-gray-600">
        สีจุดสถานะ
        <select value={d.color} onChange={(e) => u("color", e.target.value)} className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-[#7678ED]">
          <option value="violet">ม่วง (งานทั่วไป)</option>
          <option value="orange">ส้ม (งานรอติดตาม)</option>
          <option value="deep-orange">ส้มเข้ม (งานเร่งด่วน)</option>
        </select>
      </label>
    </div>
  );
}
