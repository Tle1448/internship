"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Loader2, Save } from "lucide-react";
import ConditerSidebar from "@/components/ConditerSidebar";
import { supabase } from "@/lib/supabase";

type Criterion = { id: string; title: string; description: string; max_score: number; sort_order: number };
type Band = { grade: string; minimum_score: number; sort_order: number };

export default function EvaluationCriteriaPage() {
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [bands, setBands] = useState<Band[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const load = useCallback(async () => {
    const [criteriaResult, bandResult] = await Promise.all([
      supabase.from("evaluation_criteria").select("id, title, description, max_score, sort_order").eq("active", true).order("sort_order"),
      supabase.from("evaluation_grade_bands").select("grade, minimum_score, sort_order").order("sort_order"),
    ]);
    if (criteriaResult.error || bandResult.error) setMessage(criteriaResult.error?.message ?? bandResult.error?.message ?? "โหลดเกณฑ์ไม่สำเร็จ");
    else { setCriteria(criteriaResult.data ?? []); setBands(bandResult.data ?? []); }
    setLoading(false);
  }, []);
  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);

  async function save() {
    if (criteria.reduce((sum, item) => sum + Number(item.max_score), 0) !== 100) { setMessage("คะแนนเต็มรวมต้องเท่ากับ 100 คะแนน"); return; }
    if (bands.some((band) => !Number.isInteger(Number(band.minimum_score)) || band.minimum_score < 0)) { setMessage("กรุณาตรวจสอบคะแนนขั้นต่ำของเกรด"); return; }
    setSaving(true); setMessage("");
    const [criteriaResult, bandResult] = await Promise.all([
      supabase.from("evaluation_criteria").upsert(criteria.map((item, index) => ({ ...item, sort_order: index + 1, max_score: Number(item.max_score), updated_at: new Date().toISOString() }))),
      supabase.from("evaluation_grade_bands").upsert(bands.map((item, index) => ({ ...item, sort_order: index + 1, minimum_score: Number(item.minimum_score), updated_at: new Date().toISOString() })), { onConflict: "grade" }),
    ]);
    setSaving(false);
    if (criteriaResult.error || bandResult.error) setMessage(criteriaResult.error?.message ?? bandResult.error?.message ?? "บันทึกเกณฑ์ไม่สำเร็จ");
    else setMessage("บันทึกเกณฑ์ประเมินแล้ว การประเมินที่ส่งแล้วจะคงเกณฑ์เดิม");
  }

  return <div className="min-h-screen bg-[#F7F6FB]"><ConditerSidebar /><main className="lg:ml-[235px] p-6"><div className="mx-auto max-w-5xl">
    <header className="mb-5"><h1 className="text-xl font-bold text-[#29263E]">ตั้งค่าเกณฑ์ประเมิน</h1><p className="mt-1 text-sm text-[#777287]">กำหนดคะแนนเต็มและช่วงเกรดสำหรับแบบประเมินใหม่</p></header>
    {message && <p role="status" className="mb-4 rounded-lg border border-[#E7E4EF] bg-white p-3 text-sm">{message}</p>}
    {loading ? <div className="flex justify-center py-16"><Loader2 className="animate-spin text-[#3D348B]" /></div> : <>
      <section className="divide-y divide-[#ECE9F1] rounded-lg border border-[#E7E4EF] bg-white px-5">{criteria.map((item, index) => <div key={item.id} className="grid gap-3 py-4 md:grid-cols-[1fr_150px]"><div className="grid gap-2"><input aria-label={`ชื่อหมวด ${index + 1}`} className="rounded-md border border-[#DCD8E8] px-3 py-2 text-sm" value={item.title} onChange={(event) => setCriteria((current) => current.map((row) => row.id === item.id ? { ...row, title: event.target.value } : row))} /><textarea aria-label={`คำอธิบายหมวด ${index + 1}`} rows={2} className="rounded-md border border-[#DCD8E8] px-3 py-2 text-sm" value={item.description} onChange={(event) => setCriteria((current) => current.map((row) => row.id === item.id ? { ...row, description: event.target.value } : row))} /></div><label className="text-xs text-[#777287]">คะแนนเต็ม<input type="number" min={1} step={1} className="mt-1 w-full rounded-md border border-[#DCD8E8] px-3 py-2 text-sm text-slate-900" value={item.max_score} onChange={(event) => setCriteria((current) => current.map((row) => row.id === item.id ? { ...row, max_score: Number(event.target.value) } : row))} /></label></div>)}</section>
      <section className="mt-5 grid gap-3 rounded-lg border border-[#E7E4EF] bg-white p-5 sm:grid-cols-4">{bands.map((band) => <label key={band.grade} className="text-xs text-[#777287]">เกรด {band.grade} ตั้งแต่<input type="number" min={0} max={100} className="mt-1 w-full rounded-md border border-[#DCD8E8] px-3 py-2 text-sm text-slate-900" value={band.minimum_score} onChange={(event) => setBands((current) => current.map((item) => item.grade === band.grade ? { ...item, minimum_score: Number(event.target.value) } : item))} /></label>)}</section>
      <div className="mt-4 flex justify-end"><button type="button" disabled={saving || criteria.length === 0} onClick={() => void save()} className="inline-flex items-center gap-2 rounded-lg bg-[#3D348B] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{saving ? <Loader2 size={16} className="animate-spin" /> : message.startsWith("บันทึก") ? <Check size={16} /> : <Save size={16} />}บันทึกเกณฑ์</button></div>
    </>}
  </div></main></div>;
}
