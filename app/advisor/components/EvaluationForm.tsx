"use client";

import Link from "next/link";
<<<<<<< HEAD
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import type { Student } from "../data";
import { gradeFor, scoreCriteria } from "../evaluation-template";
=======
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import type { Student } from "../data";
import { gradeFor, scoreCriteria } from "../detail-data";
>>>>>>> 390feae (Connect Advisor with database)
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
<<<<<<< HEAD
  const [submitted, setSubmitted] = useState(false);
  const submittedRef = useRef(false);
  const successTimerRef = useRef<number | null>(null);
  const total = useMemo(() => form.scores.reduce((sum, score) => sum + score, 0), [form.scores]);
  const load = useCallback(async () => {
    const { data, error } = await supabase.from("evaluations").select("id, date, mode, topics, notes, scores, feedback, status").eq("record_id", student.recordId).is("archived_at", null).order("updated_at", { ascending: false }).limit(1).maybeSingle();
    if (error) setMessage(error.message);
    else if (data) {
      setEvaluationId(data.id);
      if (submittedRef.current || data.status === "submitted") {
        submittedRef.current = true;
        setForm({ date: data.date, mode: data.mode as EvaluationFormState["mode"], topics: initialForm.topics, notes: "", scores: scoreCriteria.map(() => 0), feedback: "" });
        setMessage("แบบประเมินนี้ส่งเรียบร้อยแล้ว");
      } else {
        setForm({ date: data.date, mode: data.mode as EvaluationFormState["mode"], topics: data.topics || initialForm.topics, notes: data.notes || "", scores: data.scores || initialForm.scores, feedback: data.feedback || "" });
      }
    }
  }, [student.recordId]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => () => {
    if (successTimerRef.current !== null) window.clearTimeout(successTimerRef.current);
  }, []);
  function update<K extends keyof EvaluationFormState>(key: K, value: EvaluationFormState[K]) {
    if (successTimerRef.current !== null) window.clearTimeout(successTimerRef.current);
    setSubmitted(false);
    setForm((current) => ({ ...current, [key]: value }));
  }
=======
  const total = useMemo(() => form.scores.reduce((sum, score) => sum + score, 0), [form.scores]);
  const load = useCallback(async () => {
    const { data, error } = await supabase.from("evaluations").select("id, date, mode, topics, notes, scores, feedback").eq("record_id", student.recordId).order("updated_at", { ascending: false }).limit(1).maybeSingle();
    if (error) setMessage(error.message);
    else if (data) { setEvaluationId(data.id); setForm({ date: data.date, mode: data.mode as EvaluationFormState["mode"], topics: data.topics || initialForm.topics, notes: data.notes || "", scores: data.scores || initialForm.scores, feedback: data.feedback || "" }); }
  }, [student.recordId]);
  useEffect(() => { void load(); }, [load]);
  function update<K extends keyof EvaluationFormState>(key: K, value: EvaluationFormState[K]) { setForm((current) => ({ ...current, [key]: value })); }
>>>>>>> 390feae (Connect Advisor with database)
  async function save(status: "draft" | "submitted") {
    if (!user || !form.feedback.trim()) { setMessage("Enter evaluation feedback before saving."); return; }
    setSaving(true);
    const payload = { record_id: student.recordId, student_id: student.userId, advisor_id: user.id, date: form.date, mode: form.mode, topics: form.topics, notes: form.notes.trim(), scores: form.scores, total_score: total, grade: gradeFor(total), feedback: form.feedback.trim(), status };
    const response = evaluationId ? await supabase.from("evaluations").update(payload).eq("id", evaluationId) : await supabase.from("evaluations").insert(payload).select("id").single();
    if (response.error) { setSaving(false); setMessage(response.error.message); return; }
    const id = evaluationId || ("data" in response && response.data ? response.data.id : null);
    if (id) setEvaluationId(id);
<<<<<<< HEAD
    setSaving(false);
    setMessage(status === "draft" ? "Draft saved to Supabase." : "Evaluation submitted to Supabase.");
    if (status === "submitted") {
      submittedRef.current = true;
      setSubmitted(true);
      if (successTimerRef.current !== null) window.clearTimeout(successTimerRef.current);
      successTimerRef.current = window.setTimeout(() => {
        setSubmitted(false);
        setMessage((current) => current === "Evaluation submitted to Supabase." ? "" : current);
        successTimerRef.current = null;
      }, 3000);
      setForm((current) => ({
        ...current,
        topics: initialForm.topics,
        notes: "",
        scores: scoreCriteria.map(() => 0),
        feedback: "",
      }));
    }
  }
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); void save("submitted"); }
  return <AdvisorShell student={student} active="students" studentSection="evaluation">
    {message && <p className="feedback">{message}</p>}
    <StudentHeader student={student} compact />
    <form onSubmit={submit}>
      <section className="detail-card evaluation-section">
        <div className="evaluation-grid">
          <label>Date<input type="date" value={form.date} onChange={(event) => update("date", event.target.value)} /></label>
          <fieldset><legend>Mode</legend>
            <div className="mode-options">
              <label><input type="radio" checked={form.mode === "onsite"} onChange={() => update("mode", "onsite")} />On-site</label>
              <label><input type="radio" checked={form.mode === "online"} onChange={() => update("mode", "online")} />Online</label>
            </div>
          </fieldset>
        </div>
        <EvaluationScores scores={form.scores} onChange={(scores) => update("scores", scores)} />
        <label className="evaluation-field">Evaluation notes<textarea rows={4} value={form.notes} onChange={(event) => update("notes", event.target.value)} /></label>
        <label className="evaluation-field">Feedback<textarea required rows={4} value={form.feedback} onChange={(event) => update("feedback", event.target.value)} /></label>
      </section>
      <footer className="detail-card evaluation-footer">
        <span className={submitted ? "save-feedback" : ""} aria-live="polite">
          {saving
            ? "กำลังส่งข้อมูลไปยัง Supabase..."
            : submitted
              ? <><Icon name="check" size={16} />ส่งแบบประเมินเรียบร้อยแล้ว</>
              : "แบบประเมินจะถูกบันทึกในระบบ"}
        </span>
        <div className="detail-actions">
          <Link className="button secondary supervision-cancel-button" href={`/advisor/students/${student.id}`}>ยกเลิก</Link>
          <button className={`button primary supervision-save-button ${submitted ? "is-saved" : ""}`} type="submit" disabled={saving}>
            {saving
              ? <><span className="button-spinner" />กำลังส่ง...</>
              : submitted
                ? <><Icon name="check" />ส่งแบบประเมินแล้ว</>
                : "ส่งแบบประเมิน"}
          </button>
        </div>
      </footer>
    </form>
  </AdvisorShell>;
=======
    if (status === "submitted" && id) {
      const history = await supabase.from("evaluation_history").insert({ evaluation_id: id, student_id: student.userId, advisor_id: user.id, total_score: total, grade: gradeFor(total) });
      if (!history.error) await supabase.from("internship_records").update({ evaluation_status: "completed" }).eq("id", student.recordId);
    }
    setSaving(false);
    setMessage(status === "draft" ? "Draft saved to Supabase." : "Evaluation submitted to Supabase.");
  }
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); void save("submitted"); }
  return <AdvisorShell student={student} active="students" studentSection="evaluation"><div className="evaluation-heading"><div><h1>Evaluation</h1><p>Assess the student's internship performance.</p></div><button className="button secondary" onClick={() => void load()}><Icon name="reset" />Reload</button></div>{message && <p className="feedback">{message}</p>}<StudentHeader student={student} compact /><form onSubmit={submit}><section className="detail-card evaluation-section"><div className="evaluation-grid"><label>Date<input type="date" value={form.date} onChange={(event) => update("date", event.target.value)} /></label><fieldset><legend>Mode</legend><div className="mode-options"><label><input type="radio" checked={form.mode === "onsite"} onChange={() => update("mode", "onsite")} />On-site</label><label><input type="radio" checked={form.mode === "online"} onChange={() => update("mode", "online")} />Online</label></div></fieldset></div><EvaluationScores scores={form.scores} onChange={(scores) => update("scores", scores)} /><label className="evaluation-field">Evaluation notes<textarea rows={4} value={form.notes} onChange={(event) => update("notes", event.target.value)} /></label><label className="evaluation-field">Feedback<textarea required rows={4} value={form.feedback} onChange={(event) => update("feedback", event.target.value)} /></label><p>Total: <strong>{total}/100 · {gradeFor(total)}</strong></p></section><footer className="detail-card evaluation-footer"><span>Assessment is stored in Supabase.</span><div className="detail-actions"><Link className="cancel-link" href={`/advisor/students/${student.id}`}>Back</Link><button className="button secondary" type="button" disabled={saving} onClick={() => void save("draft")}>Save draft</button><button className="button primary" type="submit" disabled={saving}>{saving ? "Saving..." : "Submit evaluation"}</button></div></footer></form></AdvisorShell>;
>>>>>>> 390feae (Connect Advisor with database)
}
