"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import StudentSidebar from "@/components/StudentSidebar";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";

type Evaluation = {
  id: string;
  date: string;
  mode: "onsite" | "online";
  scores: number[];
  total_score: number;
  grade: string;
  notes: string;
  feedback: string;
  updated_at: string;
  criteria_snapshot: { id: string; title: string; description: string; max: number }[];
};

export default function EvaluationResultsPage() {
  const evaluationId = useSearchParams().get("evaluation_id");
  const { user } = useAuth();
  const [items, setItems] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load(studentId: string) {
    const { data, error: fetchError } = await supabase
      .from("evaluations")
      .select("id, date, mode, scores, total_score, grade, notes, feedback, updated_at, criteria_snapshot")
      .eq("student_id", studentId)
      .eq("status", "submitted")
      .is("archived_at", null)
      .order("updated_at", { ascending: false });
    if (fetchError) setError("ไม่สามารถโหลดผลการประเมินได้");
    else setItems((data ?? []) as Evaluation[]);
    setLoading(false);
  }

  useEffect(() => {
    if (!user || user.role !== "student") return;
    const timer = window.setTimeout(() => void load(user.id), 0);
    return () => window.clearTimeout(timer);
  }, [user]);

  useEffect(() => {
    if (!evaluationId || !items.some((item) => item.id === evaluationId)) return;
    document.getElementById(`evaluation-${evaluationId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [evaluationId, items]);

  return <div className="flex min-h-screen bg-slate-50 text-slate-800">
    <StudentSidebar />
    <main className="min-w-0 flex-1 p-5 md:p-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-6"><h1 className="text-2xl font-bold text-slate-950">ผลการประเมิน</h1><p className="mt-1 text-sm text-slate-500">ผลประเมินการฝึกงานและข้อเสนอแนะจากอาจารย์ที่ปรึกษา</p></header>
        {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-700" /></div>
          : error ? <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>
            : items.length === 0 ? <div className="rounded-lg border border-slate-200 bg-white px-6 py-14 text-center"><CheckCircle2 className="mx-auto text-slate-400" size={30} /><p className="mt-3 text-sm text-slate-600">ยังไม่มีผลการประเมินที่ส่งแล้ว</p></div>
              : <div className="space-y-5">{items.map((item) => <article id={`evaluation-${item.id}`} key={item.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4"><div><h2 className="font-semibold text-slate-900">ประเมินวันที่ {new Date(`${item.date}T00:00:00`).toLocaleDateString("th-TH", { dateStyle: "long" })}</h2><p className="mt-1 text-sm text-slate-500">รูปแบบ: {item.mode === "onsite" ? "On-site" : "Online"}</p></div><span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-800">เกรด {item.grade}</span></header>
                <div className="space-y-5 p-5">
                  <div className="divide-y divide-slate-100">{(item.criteria_snapshot ?? []).map((criterion, index) => <div key={criterion.id} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0"><div><h3 className="text-sm font-medium text-slate-900">{criterion.title}</h3><p className="mt-1 text-xs text-slate-500">{criterion.description}</p></div><span className="shrink-0 text-sm font-semibold">{item.scores?.[index] ?? 0} / {criterion.max}</span></div>)}</div>
                  <div className="rounded-lg bg-indigo-50 px-4 py-3"><p className="text-xs text-indigo-800">คะแนนรวม</p><p className="mt-1 text-xl font-bold text-indigo-900">{item.total_score} / 100 คะแนน</p></div>
                  {item.notes && <section><h3 className="text-sm font-semibold">บันทึกการประเมิน</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{item.notes}</p></section>}
                  <section><h3 className="text-sm font-semibold">ข้อเสนอแนะ</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{item.feedback}</p></section>
                </div>
              </article>)}</div>}
      </div>
    </main>
  </div>;
}
