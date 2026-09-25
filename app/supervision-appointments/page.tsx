"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CalendarDays, CheckCircle2, Clock3, Loader2, MapPin, Video, XCircle } from "lucide-react";
import StudentSidebar from "@/components/StudentSidebar";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";

type Appointment = {
  id: string;
  scheduled_at: string;
  mode: "onsite" | "online";
  location: string;
  note: string | null;
  status: "scheduled" | "cancelled" | "completed";
  result?: { date: string; topics: boolean[]; notes: string | null };
};

type SupervisionResult = {
  id: string;
  record_id: string;
  date: string;
  mode: "onsite" | "online";
  topics: boolean[];
  notes: string | null;
};

const statusDetails = {
  scheduled: { label: "นัดหมายแล้ว", className: "bg-amber-50 text-amber-700", icon: Clock3 },
  completed: { label: "ดำเนินการแล้ว", className: "bg-emerald-50 text-emerald-700", icon: CheckCircle2 },
  cancelled: { label: "ยกเลิกแล้ว", className: "bg-red-50 text-red-700", icon: XCircle },
} as const;

function AppointmentItem({ appointment }: { appointment: Appointment }) {
  const status = statusDetails[appointment.status];
  const StatusIcon = status.icon;
  const isLink = appointment.mode === "online" && /^https?:\/\//i.test(appointment.location);

  return <article className="border-b border-slate-100 px-5 py-5 last:border-b-0">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700"><CalendarDays size={20} /></span>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-slate-900">{new Date(appointment.scheduled_at).toLocaleString("th-TH", { dateStyle: "long", timeStyle: "short" })}</h2>
          <p className="mt-1 flex items-start gap-2 text-sm text-slate-600">{appointment.mode === "online" ? <Video className="mt-0.5 shrink-0" size={16} /> : <MapPin className="mt-0.5 shrink-0" size={16} />}{isLink ? <a className="break-all text-indigo-700 hover:underline" href={appointment.location} target="_blank" rel="noreferrer">{appointment.location}</a> : <span className="break-words">{appointment.location}</span>}</p>
          {appointment.note && <p className="mt-3 text-sm leading-6 text-slate-500">{appointment.note}</p>}
          {appointment.result && <section className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50/60 p-4"><h3 className="text-sm font-semibold text-emerald-900">ผลการนิเทศ · {new Date(`${appointment.result.date}T00:00:00`).toLocaleDateString("th-TH", { dateStyle: "long" })}</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{appointment.result.notes || "ไม่มีบันทึกเพิ่มเติม"}</p></section>}
        </div>
      </div>
      <span className={`inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}><StatusIcon size={14} />{status.label}</span>
    </div>
  </article>;
}

export default function SupervisionAppointmentsPage() {
  const { user } = useAuth();
  const appointmentId = useSearchParams().get("appointment_id");
  const params = useSearchParams();
  const resultId = params.get("record_id");
  const internshipId = params.get("internship_id");
  const [items, setItems] = useState<Appointment[]>([]);
  const [unlinkedResults, setUnlinkedResults] = useState<SupervisionResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!user || user.role !== "student") {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error: fetchError } = await supabase
      .from("supervision_appointments")
      .select("id, scheduled_at, mode, location, note, status")
      .eq("student_id", user.id)
      .order("scheduled_at", { ascending: false });
    if (fetchError) {
      setError("ไม่สามารถโหลดนัดหมายนิเทศได้");
      setItems([]);
    } else {
      setError("");
      const rows = (data ?? []) as Appointment[];
      const ids = rows.map((item) => item.id);
      const { data: results } = ids.length
        ? await supabase.from("supervision_records").select("appointment_id, date, topics, notes").eq("student_id", user.id).in("appointment_id", ids)
        : { data: [] };
      const byAppointment = new Map((results ?? []).map((result) => [result.appointment_id, result]));
      setItems(rows.map((item) => ({ ...item, result: byAppointment.get(item.id) ?? undefined })));
    }
    const { data: standaloneResults, error: resultError } = await supabase
      .from("supervision_records")
      .select("id, record_id, date, mode, topics, notes")
      .eq("student_id", user.id)
      .is("appointment_id", null)
      .order("date", { ascending: false });
    if (resultError) setError("ไม่สามารถโหลดผลการนิเทศได้");
    setUnlinkedResults(((standaloneResults ?? []) as SupervisionResult[]).filter((result) => !internshipId || result.record_id === internshipId));
    setLoading(false);
  }, [user, internshipId]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!appointmentId || !items.some((item) => item.id === appointmentId)) return;
    document.getElementById(`appointment-${appointmentId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [appointmentId, items]);
  useEffect(() => {
    if (!resultId || !unlinkedResults.some((result) => result.id === resultId)) return;
    document.getElementById(`supervision-result-${resultId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [resultId, unlinkedResults]);

  const upcoming = useMemo(() => items
    .filter((item) => item.status === "scheduled" && new Date(item.scheduled_at).getTime() > Date.now())
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()), [items]);
  const history = useMemo(() => items.filter((item) => !upcoming.some((current) => current.id === item.id)), [items, upcoming]);

  return <div className="flex min-h-screen bg-slate-50 text-slate-800">
    <StudentSidebar />
    <main className="min-w-0 flex-1 p-5 md:p-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-6"><h1 className="text-2xl font-bold text-slate-950">นัดหมายนิเทศ</h1><p className="mt-1 text-sm text-slate-500">ตรวจสอบวัน เวลา รูปแบบ และสิ่งที่ต้องเตรียมสำหรับการนิเทศ</p></header>

        {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-700" /></div> : error ? <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : <div className="space-y-7">
          <section><div className="mb-3 flex items-center justify-between"><h2 className="text-base font-semibold text-slate-900">นัดหมายที่กำลังจะถึง</h2><span className="text-xs text-slate-500">{upcoming.length} รายการ</span></div>{upcoming.length ? <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">{upcoming.map((appointment) => <div id={`appointment-${appointment.id}`} key={appointment.id}><AppointmentItem appointment={appointment} /></div>)}</div> : <div className="rounded-lg border border-slate-200 bg-white px-6 py-14 text-center"><CalendarDays className="mx-auto text-slate-400" size={32} /><p className="mt-3 text-sm text-slate-500">ยังไม่มีนัดหมายนิเทศที่กำลังจะถึง</p></div>}</section>
          {history.length > 0 && <section><div className="mb-3 flex items-center justify-between"><h2 className="text-base font-semibold text-slate-900">ประวัตินัดหมาย</h2><span className="text-xs text-slate-500">{history.length} รายการ</span></div><div className="overflow-hidden rounded-lg border border-slate-200 bg-white">{history.map((appointment) => <div id={`appointment-${appointment.id}`} key={appointment.id}><AppointmentItem appointment={appointment} /></div>)}</div></section>}
          {unlinkedResults.length > 0 && <section><div className="mb-3 flex items-center justify-between"><h2 className="text-base font-semibold text-slate-900">ผลการนิเทศ</h2><span className="text-xs text-slate-500">{unlinkedResults.length} รายการ</span></div><div className="overflow-hidden rounded-lg border border-slate-200 bg-white">{unlinkedResults.map((result) => <article id={`supervision-result-${result.id}`} key={result.id} className="border-b border-slate-100 px-5 py-5 last:border-b-0"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-semibold text-slate-900">นิเทศเมื่อ {new Date(`${result.date}T00:00:00`).toLocaleDateString("th-TH", { dateStyle: "long" })}</h3><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">{result.mode === "online" ? "ออนไลน์" : "On-site"}</span></div><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{result.notes || "ไม่มีบันทึกเพิ่มเติม"}</p></article>)}</div></section>}
        </div>}
      </div>
    </main>
  </div>;
}
