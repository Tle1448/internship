"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import type { Student } from "../data";
import { gradeFor, scoreCriteria } from "../detail-data";
import AdvisorShell from "./AdvisorShell";
import EvaluationScores from "./EvaluationScores";
import Icon from "./Icon";
import StudentHeader from "./StudentHeader";

type EvaluationFormState = { date: string; mode: "onsite" | "online"; topics: boolean[]; notes: string; scores: number[]; feedback: string };
const initialForm: EvaluationFormState = { date: new Date().toISOString().slice(0, 10), mode: "onsite", topics: [true, true, true, true, true], notes: "", scores: scoreCriteria.map((item) => item.initial), feedback: "" };

export default function EvaluationForm({ student }: { student: Student }) {
  const { user } = useAuth();
  const [form, setForm] = useState<EvaluationFormState>(initialForm);
  const [evaluationId, setEvaluationId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const total = useMemo(() => form.scores.reduce((sum, score) => sum + score, 0), [form.scores]);
  const load = useCallback(async () => {
    const { data, error } = await supabase.from("evaluations").select("id, date, mode, topics, notes, scores, feedback").eq("record_id", student.recordId).is("archived_at", null).order("updated_at", { ascending: false }).limit(1).maybeSingle();
    if (error) setMessage(error.message);
    else if (data) { setEvaluationId(data.id); setForm({ date: data.date, mode: data.mode as EvaluationFormState["mode"], topics: data.topics || initialForm.topics, notes: data.notes || "", scores: data.scores || initialForm.scores, feedback: data.feedback || "" }); }
  }, [student.recordId]);
  useEffect(() => { void load(); }, [load]);
  function update<K extends keyof EvaluationFormState>(key: K, value: EvaluationFormState[K]) { setForm((current) => ({ ...current, [key]: value })); }
  async function save(status: "draft" | "submitted") {
    if (!user || !form.feedback.trim()) { setMessage("Enter evaluation feedback before saving."); return; }
    setSaving(true);
    const payload = { record_id: student.recordId, student_id: student.userId, advisor_id: user.id, date: form.date, mode: form.mode, topics: form.topics, notes: form.notes.trim(), scores: form.scores, total_score: total, grade: gradeFor(total), feedback: form.feedback.trim(), status };
    const response = evaluationId ? await supabase.from("evaluations").update(payload).eq("id", evaluationId) : await supabase.from("evaluations").insert(payload).select("id").single();
    if (response.error) { setSaving(false); setMessage(response.error.message); return; }
    const id = evaluationId || ("data" in response && response.data ? response.data.id : null);
    if (id) setEvaluationId(id);
    setSaving(false);
    setMessage(status === "draft" ? "Draft saved to Supabase." : "Evaluation submitted to Supabase.");
  }
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); void save("submitted"); }
  return <AdvisorShell student={student} active="students" studentSection="evaluation"><div className="evaluation-heading"><div><h1>Evaluation</h1><p>Assess the student's internship performance.</p></div><button className="button secondary" onClick={() => void load()}><Icon name="reset" />Reload</button></div>{message && <p className="feedback">{message}</p>}<StudentHeader student={student} compact /><form onSubmit={submit}><section className="detail-card evaluation-section"><div className="evaluation-grid"><label>Date<input type="date" value={form.date} onChange={(event) => update("date", event.target.value)} /></label><fieldset><legend>Mode</legend><div className="mode-options"><label><input type="radio" checked={form.mode === "onsite"} onChange={() => update("mode", "onsite")} />On-site</label><label><input type="radio" checked={form.mode === "online"} onChange={() => update("mode", "online")} />Online</label></div></fieldset></div><EvaluationScores scores={form.scores} onChange={(scores) => update("scores", scores)} /><label className="evaluation-field">Evaluation notes<textarea rows={4} value={form.notes} onChange={(event) => update("notes", event.target.value)} /></label><label className="evaluation-field">Feedback<textarea required rows={4} value={form.feedback} onChange={(event) => update("feedback", event.target.value)} /></label><p>Total: <strong>{total}/100 · {gradeFor(total)}</strong></p></section><footer className="detail-card evaluation-footer"><span>Assessment is stored in Supabase.</span><div className="detail-actions"><Link className="cancel-link" href={`/advisor/students/${student.id}`}>Back</Link><button className="button secondary" type="button" disabled={saving} onClick={() => void save("draft")}>Save draft</button><button className="button primary" type="submit" disabled={saving}>{saving ? "Saving..." : "Submit evaluation"}</button></div></footer></form></AdvisorShell>;
}
