"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import type { Student } from "../data";
import AdvisorShell from "./AdvisorShell";
import Icon from "./Icon";
import StudentHeader from "./StudentHeader";

type FormState = { date: string; mode: "onsite" | "online"; topics: boolean[]; notes: string };
const emptyForm: FormState = { date: new Date().toISOString().slice(0, 10), mode: "onsite", topics: [true, true, false, false], notes: "" };

export default function SupervisionForm({ student }: { student: Student }) {
  const { user } = useAuth();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [recordId, setRecordId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const load = useCallback(async () => {
    const { data, error } = await supabase.from("supervision_records").select("id, date, mode, topics, notes").eq("record_id", student.recordId).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (error) setMessage(error.message);
    else if (data) { setRecordId(data.id); setForm({ date: data.date, mode: data.mode as FormState["mode"], topics: data.topics || emptyForm.topics, notes: data.notes || "" }); }
  }, [student.recordId]);
  useEffect(() => { void load(); }, [load]);
  function update<K extends keyof FormState>(key: K, value: FormState[K]) { setForm((current) => ({ ...current, [key]: value })); }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || !form.notes.trim() || !form.topics.some(Boolean)) { setMessage("Complete the date, topics, and notes."); return; }
    setSaving(true);
    const payload = { record_id: student.recordId, student_id: student.userId, advisor_id: user.id, date: form.date, mode: form.mode, topics: form.topics, notes: form.notes.trim(), attachments: [] as string[] };
    const response = recordId ? await supabase.from("supervision_records").update(payload).eq("id", recordId) : await supabase.from("supervision_records").insert(payload).select("id").single();
    if (!response.error) await supabase.from("internship_records").update({ supervision_status: "completed" }).eq("id", student.recordId);
    setSaving(false);
    if (response.error) { setMessage(response.error.message); return; }
    if (!recordId && "data" in response && response.data) setRecordId(response.data.id);
    setMessage("Supervision record saved to Supabase.");
  }
  return <AdvisorShell student={student} active="students" studentSection="supervision"><div className="evaluation-heading"><div><h1>Supervision record</h1><p>Record the visit or online supervision for this student.</p></div><button className="button secondary" onClick={() => void load()}><Icon name="reset" />Reload</button></div>{message && <p className="feedback">{message}</p>}<StudentHeader student={student} compact /><form onSubmit={submit}><section className="detail-card evaluation-section"><div className="evaluation-grid"><label>Date<input required type="date" value={form.date} onChange={(event) => update("date", event.target.value)} /></label><fieldset><legend>Mode</legend><div className="mode-options"><label><input type="radio" checked={form.mode === "onsite"} onChange={() => update("mode", "onsite")} />On-site</label><label><input type="radio" checked={form.mode === "online"} onChange={() => update("mode", "online")} />Online</label></div></fieldset></div><fieldset className="topic-field"><legend>Topics discussed</legend><div className="evaluation-grid">{["Work discipline", "Project progress", "Workplace support", "Next steps"].map((topic, index) => <label className="topic-option" key={topic}><input type="checkbox" checked={form.topics[index] || false} onChange={(event) => update("topics", form.topics.map((value, itemIndex) => itemIndex === index ? event.target.checked : value))} /><span><strong>{topic}</strong></span></label>)}</div></fieldset><label className="evaluation-field">Notes<textarea required rows={5} value={form.notes} onChange={(event) => update("notes", event.target.value)} /></label></section><footer className="detail-card evaluation-footer"><span>Saved as a supervision record.</span><div className="detail-actions"><Link className="cancel-link" href={`/advisor/students/${student.id}`}>Back</Link><button className="button primary" disabled={saving} type="submit">{saving ? "Saving..." : "Save supervision"}</button></div></footer></form></AdvisorShell>;
}
