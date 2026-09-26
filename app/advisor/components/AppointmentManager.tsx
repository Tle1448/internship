"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState, type FormEvent } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import type { Student } from "../data";
import Icon from "./Icon";

type AppointmentStatus = "scheduled" | "cancelled" | "completed";
type Appointment = {
  id: string;
  record_id: string;
  student_id: string;
  scheduled_at: string;
  mode: "onsite" | "online";
  location: string;
  note: string | null;
  status: AppointmentStatus;
};

type FormState = {
  recordId: string;
  date: string;
  time: string;
  mode: "onsite" | "online";
  location: string;
  note: string;
};

export type AppointmentManagerHandle = { openCreate: () => void };

function tomorrow() {
  const value = new Date();
  value.setDate(value.getDate() + 1);
  return value.toISOString().slice(0, 10);
}

function emptyForm(recordId = ""): FormState {
  return { recordId, date: tomorrow(), time: "09:00", mode: "onsite", location: "", note: "" };
}

function localDateParts(value: string) {
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString();
  return { date: local.slice(0, 10), time: local.slice(11, 16) };
}

function formatAppointmentDate(value: string) {
  return new Date(value).toLocaleString("th-TH", { dateStyle: "long", timeStyle: "short" });
}

const AppointmentManager = forwardRef<AppointmentManagerHandle, { students: Student[] }>(function AppointmentManager({ students }, ref) {
  const { user } = useAuth();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [form, setForm] = useState<FormState>(() => emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!user || user.role !== "advisor") return;
    const { data, error } = await supabase
      .from("supervision_appointments")
      .select("id, record_id, student_id, scheduled_at, mode, location, note, status")
      .eq("advisor_id", user.id)
      .order("scheduled_at", { ascending: true })
      .limit(30);
    if (error) {
      setMessage(`ไม่สามารถโหลดนัดหมายได้: ${error.message}`);
      return;
    }
    setAppointments((data ?? []) as Appointment[]);
  }, [user]);

  useEffect(() => { void load(); }, [load]);

  const studentByRecord = useMemo(() => new Map(students.map((student) => [student.recordId, student])), [students]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm(students[0]?.recordId ?? ""));
    setMessage("");
    dialogRef.current?.showModal();
  }

  useImperativeHandle(ref, () => ({ openCreate }), [students]);

  function openEdit(appointment: Appointment) {
    const parts = localDateParts(appointment.scheduled_at);
    setEditingId(appointment.id);
    setForm({
      recordId: appointment.record_id,
      date: parts.date,
      time: parts.time,
      mode: appointment.mode,
      location: appointment.location,
      note: appointment.note ?? "",
    });
    setMessage("");
    dialogRef.current?.showModal();
  }

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const student = studentByRecord.get(form.recordId);
    if (!user || !student) {
      setMessage("กรุณาเลือกนักศึกษาในความดูแล");
      return;
    }

    const scheduledAt = new Date(`${form.date}T${form.time}:00`);
    if (Number.isNaN(scheduledAt.getTime()) || scheduledAt.getTime() <= Date.now()) {
      setMessage("วันและเวลานัดหมายต้องอยู่ในอนาคต");
      return;
    }

    setSaving(true);
    const values = {
      scheduled_at: scheduledAt.toISOString(),
      mode: form.mode,
      location: form.location.trim(),
      note: form.note.trim() || null,
    };
    const response = editingId
      ? await supabase.from("supervision_appointments").update(values).eq("id", editingId)
      : await supabase.from("supervision_appointments").insert({
          ...values,
          record_id: student.recordId,
          student_id: student.userId,
          advisor_id: user.id,
        });
    setSaving(false);

    if (response.error) {
      setMessage(response.error.code === "23505" ? "ช่วงเวลานี้มีนัดหมายอยู่แล้ว" : response.error.message);
      return;
    }

    dialogRef.current?.close();
    setMessage(editingId ? "แก้ไขนัดหมายและแจ้งนักศึกษาแล้ว" : "เพิ่มนัดหมายและแจ้งนักศึกษาแล้ว");
    if (!editingId) setForm(emptyForm(students[0]?.recordId ?? ""));
    await load();
  }

  async function cancel(appointment: Appointment) {
    if (!window.confirm("ยืนยันการยกเลิกนัดหมายนี้หรือไม่")) return;
    const { error } = await supabase
      .from("supervision_appointments")
      .update({ status: "cancelled" })
      .eq("id", appointment.id);
    if (error) {
      setMessage(error.message);
      return;
    }
    setMessage("ยกเลิกนัดหมายและแจ้งนักศึกษาแล้ว");
    await load();
  }

  const activeAppointments = appointments.filter((item) => item.status === "scheduled" && new Date(item.scheduled_at).getTime() > Date.now());

  return <>
    {message && <div className="feedback appointment-feedback" role="status"><Icon name="check" />{message}<button className="icon-button" aria-label="ปิดข้อความ" onClick={() => setMessage("")}><Icon name="close" size={16} /></button></div>}
    <dialog ref={dialogRef} className="modal appointment-modal" onClose={() => setEditingId(null)}>
      <div className="modal-header"><div><h2>{editingId ? "แก้ไขนัดหมายนิเทศ" : "เพิ่มนัดหมายนิเทศ"}</h2><p className="muted">ระบบจะแจ้งรายละเอียดให้นักศึกษาอัตโนมัติ</p></div><button className="icon-button" type="button" aria-label="ปิด" onClick={() => dialogRef.current?.close()}><Icon name="close" /></button></div>
      <form onSubmit={save}>
        <label>นักศึกษา<select required disabled={Boolean(editingId)} value={form.recordId} onChange={(event) => update("recordId", event.target.value)}><option value="">เลือกนักศึกษา</option>{students.map((student) => <option key={student.recordId} value={student.recordId}>{student.name} ({student.id}) · {student.company}</option>)}</select></label>
        <div className="form-grid"><label>วันที่นิเทศ<input required min={new Date().toISOString().slice(0, 10)} type="date" value={form.date} onChange={(event) => update("date", event.target.value)} /></label><label>เวลา<input required type="time" value={form.time} onChange={(event) => update("time", event.target.value)} /></label></div>
        <label>รูปแบบ<select value={form.mode} onChange={(event) => update("mode", event.target.value as FormState["mode"])}><option value="onsite">On-site</option><option value="online">Online</option></select></label>
        <label>{form.mode === "online" ? "ลิงก์ประชุม" : "สถานที่"}<input required value={form.location} onChange={(event) => update("location", event.target.value)} placeholder={form.mode === "online" ? "https://..." : "บริษัท / อาคาร / ห้อง"} /></label>
        <label>หมายเหตุ<textarea rows={3} value={form.note} onChange={(event) => update("note", event.target.value)} placeholder="รายละเอียดที่นักศึกษาควรเตรียม" /></label>
        {message && <p className="appointment-form-error" role="alert">{message}</p>}
        <div className="appointment-form-actions"><button className="button secondary" type="button" onClick={() => dialogRef.current?.close()}>ยกเลิก</button><button className="button primary" disabled={saving} type="submit">{saving ? "กำลังบันทึก..." : "บันทึกนัดหมาย"}</button></div>
      </form>
      <section className="appointment-list" aria-label="นัดหมายที่กำลังจะถึง">
        <div className="appointment-list-heading"><h3>นัดหมายที่กำลังจะถึง</h3><span>{activeAppointments.length} รายการ</span></div>
        {activeAppointments.length ? activeAppointments.map((appointment) => {
          const student = studentByRecord.get(appointment.record_id);
          return <article key={appointment.id}><div><strong>{student?.name ?? "นักศึกษา"}</strong><span>{formatAppointmentDate(appointment.scheduled_at)} · {appointment.mode === "onsite" ? "On-site" : "Online"}</span><small>{appointment.location}</small></div><div><button type="button" className="appointment-action" onClick={() => openEdit(appointment)}>แก้ไข</button><button type="button" className="appointment-action danger" onClick={() => void cancel(appointment)}>ยกเลิก</button></div></article>;
        }) : <p className="appointment-empty">ยังไม่มีนัดหมายที่กำลังจะถึง</p>}
      </section>
    </dialog>
  </>;
});

AppointmentManager.displayName = "AppointmentManager";

export default AppointmentManager;
