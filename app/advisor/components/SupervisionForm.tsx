"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import type { Student } from "../data";
import AdvisorShell from "./AdvisorShell";
import Icon from "./Icon";
import StudentHeader from "./StudentHeader";

type Appointment = { id: string; scheduled_at: string; mode: "onsite" | "online"; location: string; status: "scheduled" | "completed" };
type FormState = { appointmentId: string; date: string; mode: "onsite" | "online"; topics: boolean[]; notes: string };
type SaveState = "idle" | "saving" | "success";
const emptyForm: FormState = { appointmentId: "", date: new Date().toISOString().slice(0, 10), mode: "onsite", topics: [true, true, false, false], notes: "" };

function appointmentDate(value: string) {
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

function appointmentLabel(appointment: Appointment) {
  const date = new Date(appointment.scheduled_at).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" });
  return `${date} · ${appointment.mode === "onsite" ? "On-site" : "Online"} · ${appointment.status === "completed" ? "ดำเนินการแล้ว" : "รอดำเนินการ"}`;
}

export default function SupervisionForm({ student }: { student: Student }) {
  const { user } = useAuth();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [recordId, setRecordId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const saving = saveState === "saving";
  const selectAppointment = useCallback(async (appointmentId: string, available: Appointment[]) => {
    const appointment = available.find((item) => item.id === appointmentId);
    setSaveState("idle");
    setMessage("");
    setRecordId(null);
    setForm({ ...emptyForm, appointmentId, date: appointment ? appointmentDate(appointment.scheduled_at) : emptyForm.date, mode: appointment?.mode ?? "onsite" });
    if (!appointmentId) return;

    const { data, error } = await supabase.from("supervision_records").select("id, appointment_id, date, mode, topics, notes").eq("appointment_id", appointmentId).maybeSingle();
    if (error) {
      setMessage(error.message);
    } else if (data) {
      setRecordId(data.id);
      setForm({ appointmentId, date: data.date, mode: data.mode as FormState["mode"], topics: data.topics || emptyForm.topics, notes: data.notes || "" });
    }
  }, []);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from("supervision_appointments").select("id, scheduled_at, mode, location, status").eq("record_id", student.recordId).in("status", ["scheduled", "completed"]).order("scheduled_at", { ascending: true });
    if (error) {
      setMessage(error.message);
      return;
    }
    const available = (data ?? []) as Appointment[];
    setAppointments(available);
    const next = available.find((item) => item.status === "scheduled" && new Date(item.scheduled_at).getTime() > Date.now())
      ?? available.find((item) => item.status === "scheduled")
      ?? available.at(-1);
    await selectAppointment(next?.id ?? "", available);
  }, [student.recordId]);
  useEffect(() => { void load(); }, [load]);
  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setSaveState("idle");
    setForm((current) => ({ ...current, [key]: value }));
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || !form.notes.trim() || !form.topics.some(Boolean)) { setSaveState("idle"); setMessage("Complete the date, topics, and notes."); return; }
    if (appointments.some((item) => item.status === "scheduled") && !form.appointmentId) { setSaveState("idle"); setMessage("กรุณาเลือกนัดหมายที่ต้องการบันทึกผล"); return; }
    setMessage("");
    setSaveState("saving");
    const payload = { appointment_id: form.appointmentId || null, record_id: student.recordId, student_id: student.userId, advisor_id: user.id, date: form.date, mode: form.mode, topics: form.topics, notes: form.notes.trim(), attachments: [] as string[] };
    const response = recordId ? await supabase.from("supervision_records").update(payload).eq("id", recordId) : await supabase.from("supervision_records").insert(payload).select("id").single();
    if (response.error) { setSaveState("idle"); setMessage(response.error.message); return; }
    if (!recordId && "data" in response && response.data) setRecordId(response.data.id);
    if (form.appointmentId) setAppointments((current) => current.map((item) => item.id === form.appointmentId ? { ...item, status: "completed" } : item));
    setSaveState("success");
  }
  return <AdvisorShell student={student} active="students" studentSection="supervision"><div className="evaluation-heading"><div><h1>Supervision record</h1><p>Record the visit or online supervision for this student.</p></div><button className="button secondary" onClick={() => void load()}><Icon name="reset" />Reload</button></div>{message && <p className="feedback" role="alert">{message}</p>}<StudentHeader student={student} compact /><form onSubmit={submit}><section className="detail-card evaluation-section"><label className="evaluation-field">นัดหมายนิเทศ<select value={form.appointmentId} onChange={(event) => void selectAppointment(event.target.value, appointments)}><option value="">ไม่ผูกกับนัดหมาย</option>{appointments.map((appointment) => <option key={appointment.id} value={appointment.id}>{appointmentLabel(appointment)}</option>)}</select></label><div className="evaluation-grid"><label>Date<input required type="date" value={form.date} onChange={(event) => update("date", event.target.value)} /></label><fieldset><legend>Mode</legend><div className="mode-options"><label><input type="radio" checked={form.mode === "onsite"} onChange={() => update("mode", "onsite")} />On-site</label><label><input type="radio" checked={form.mode === "online"} onChange={() => update("mode", "online")} />Online</label></div></fieldset></div><fieldset className="topic-field"><legend>Topics discussed</legend><div className="evaluation-grid">{["Work discipline", "Project progress", "Workplace support", "Next steps"].map((topic, index) => <label className="topic-option" key={topic}><input type="checkbox" checked={form.topics[index] || false} onChange={(event) => update("topics", form.topics.map((value, itemIndex) => itemIndex === index ? event.target.checked : value))} /><span><strong>{topic}</strong></span></label>)}</div></fieldset><label className="evaluation-field">Notes<textarea required rows={5} value={form.notes} onChange={(event) => update("notes", event.target.value)} /></label></section><footer className="detail-card evaluation-footer"><span className={saveState === "success" ? "save-feedback" : ""} aria-live="polite">{saveState === "saving" ? "กำลังส่งข้อมูลไปยัง Supabase..." : saveState === "success" ? <><Icon name="check" size={16} />{form.appointmentId ? "บันทึกผลและปิดนัดหมายเรียบร้อย" : "บันทึกผลนิเทศเรียบร้อย"}</> : form.appointmentId ? "เมื่อบันทึก นัดหมายที่เลือกจะเสร็จสิ้น" : "บันทึกเป็นผลการนิเทศ"}</span><div className="detail-actions"><Link className="button secondary supervision-cancel-button" href={`/advisor/students/${student.id}`}>ยกเลิก</Link><button className={`button primary supervision-save-button ${saveState === "success" ? "is-saved" : ""}`} disabled={saving} type="submit">{saveState === "saving" ? <><span className="button-spinner" />กำลังบันทึก...</> : saveState === "success" ? <><Icon name="check" />บันทึกเรียบร้อย</> : "บันทึกผลนิเทศ"}</button></div></footer></form></AdvisorShell>;
}
