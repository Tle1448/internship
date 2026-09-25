"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import ConditerSidebar from "@/components/ConditerSidebar";
import { supabase } from "@/lib/supabase";

type RecordData = {
  id: string; student_id: string; company_name: string | null; position: string | null;
  status: string; placement_status: string; advisor_id: string | null;
};
type Profile = { full_name: string | null; user_code: string | null; major: string | null };

export default function CoordinatorStudentPage() {
  const { recordId } = useParams<{ recordId: string }>();
  const [record, setRecord] = useState<RecordData | null>(null);
  const [student, setStudent] = useState<Profile | null>(null);
  const [advisorName, setAdvisorName] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void (async () => {
      const { data, error: fetchError } = await supabase.from("internship_records")
        .select("id, student_id, company_name, position, status, placement_status, advisor_id")
        .eq("id", recordId).maybeSingle();
      if (!active) return;
      if (fetchError || !data) { setError(fetchError?.message ?? "ไม่พบรายการฝึกงาน"); return; }
      setRecord(data as RecordData);
      const [studentResult, advisorResult] = await Promise.all([
        supabase.from("profiles").select("full_name, user_code, major").eq("id", data.student_id).maybeSingle(),
        data.advisor_id ? supabase.from("profiles").select("full_name").eq("id", data.advisor_id).maybeSingle() : Promise.resolve({ data: null, error: null }),
      ]);
      if (!active) return;
      setStudent(studentResult.data as Profile | null);
      setAdvisorName(advisorResult.data?.full_name ?? null);
      if (studentResult.error || advisorResult.error) setError(studentResult.error?.message ?? advisorResult.error?.message ?? "โหลดข้อมูลไม่สำเร็จ");
    })();
    return () => { active = false; };
  }, [recordId]);

  return <div className="min-h-screen bg-[#F7F6FB]"><ConditerSidebar /><main className="lg:ml-[235px] p-6"><div className="mx-auto max-w-4xl">
    <Link href="/conditer/placements" className="mb-5 inline-flex items-center gap-2 text-sm text-[#3D348B]"><ArrowLeft size={16} />กลับหน้ามอบหมาย</Link>
    {error ? <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</p> : !record ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#3D348B]" /></div> : <section className="rounded-lg border border-[#E7E4EF] bg-white p-6">
      <h1 className="text-xl font-bold text-[#29263E]">รายละเอียดการฝึกงาน</h1>
      <dl className="mt-5 grid gap-4 sm:grid-cols-2">
        <div><dt className="text-xs text-[#777287]">นักศึกษา</dt><dd className="mt-1 font-semibold">{student?.full_name ?? "-"} ({student?.user_code ?? "-"})</dd></div>
        <div><dt className="text-xs text-[#777287]">สาขา</dt><dd className="mt-1">{student?.major ?? "-"}</dd></div>
        <div><dt className="text-xs text-[#777287]">สถานประกอบการ</dt><dd className="mt-1">{record.company_name ?? "-"}</dd></div>
        <div><dt className="text-xs text-[#777287]">ตำแหน่ง</dt><dd className="mt-1">{record.position ?? "-"}</dd></div>
        <div><dt className="text-xs text-[#777287]">อาจารย์ที่ปรึกษา</dt><dd className="mt-1">{advisorName ?? "ยังไม่ได้มอบหมาย"}</dd></div>
        <div><dt className="text-xs text-[#777287]">สถานะ</dt><dd className="mt-1">{record.status} · {record.placement_status}</dd></div>
      </dl>
    </section>}
  </div></main></div>;
}
