"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import type { Student } from "../data";
import AdvisorShell from "./AdvisorShell";
import EvaluationScores, { type GradeBand, type ScoreCriterion } from "./EvaluationScores";
import Icon from "./Icon";
import StudentHeader from "./StudentHeader";

type EvaluationFormState = { date: string; mode: "onsite" | "online"; topics: boolean[]; notes: string; scores: number[]; feedback: string };
const initialForm: EvaluationFormState = { date: new Date().toISOString().slice(0, 10), mode: "onsite", topics: [true, true, true, true, true], notes: "", scores: [], feedback: "" };

export default function EvaluationForm({ student }: { student: Student }) {
  const { user } = useAuth();
  const [form, setForm] = useState<EvaluationFormState>(initialForm);
  const [evaluationId, setEvaluationId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [criteria, setCriteria] = useState<ScoreCriterion[]>([]);
  const [grades, setGrades] = useState<GradeBand[]>([]);
  const submittedRef = useRef(false);
  const load = useCallback(async () => {
    const [criteriaResult, gradesResult, evaluationResult] = await Promise.all([
      supabase.from("evaluation_criteria").select("id, title, description, max_score").eq("active", true).order("sort_order"),
      supabase.from("evaluation_grade_bands").select("grade, minimum_score").order("sort_order"),
      supabase.from("evaluations").select("id, date, mode, topics, notes, scores, feedback, status").eq("record_id", student.recordId).is("archived_at", null).order("updated_at", { ascending: false }).limit(1).maybeSingle(),
    ]);
    if (criteriaResult.error || gradesResult.error) { setMessage(criteriaResult.error?.message ?? gradesResult.error?.message ?? "โหลดเกณฑ์ประเมินไม่สำเร็จ"); return; }
    const configuredCriteria = (criteriaResult.data ?? []).map((item) => ({ id: item.id, title: item.title, description: item.description, max: item.max_score }));
    const configuredGrades = (gradesResult.data ?? []).map((item) => ({ minimum: item.minimum_score, grade: item.grade }));
    setCriteria(configuredCriteria);
    setGrades(configuredGrades);
    const { data, error } = evaluationResult;
    if (error) setMessage(error.message);
    else if (data) {
      setEvaluationId(data.id);
      if (submittedRef.current || data.status === "submitted") {
        submittedRef.current = true;
        setSubmitted(true);
        setForm({ date: data.date, mode: data.mode as EvaluationFormState["mode"], topics: initialForm.topics, notes: "", scores: data.scores ?? configuredCriteria.map(() => 0), feedback: "" });
        setMessage("แบบประเมินนี้ส่งแล้ว คะแนนถูกล็อกและไม่สามารถแก้ไขได้");
      } else {
        setForm({ date: data.date, mode: data.mode as EvaluationFormState["mode"], topics: data.topics || initialForm.topics, notes: data.notes || "", scores: data.scores?.length ? data.scores : configuredCriteria.map(() => 0), feedback: data.feedback || "" });
      }
    } else {
      setEvaluationId(null);
      setForm((current) => ({ ...current, scores: configuredCriteria.map(() => 0) }));
    }
  }, [student.recordId]);
  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  function update<K extends keyof EvaluationFormState>(key: K, value: EvaluationFormState[K]) {
    if (submittedRef.current) return;
    setSubmitted(false);
    setForm((current) => ({ ...current, [key]: value }));
  }
  async function save(status: "draft" | "submitted") {
    if (submittedRef.current) return;
    if (!user || !form.feedback.trim()) { setMessage("Enter evaluation feedback before saving."); return; }
    setSaving(true);
    const payload = { record_id: student.recordId, student_id: student.userId, advisor_id: user.id, date: form.date, mode: form.mode, topics: form.topics, notes: form.notes.trim(), scores: form.scores, feedback: form.feedback.trim(), status };
    const response = evaluationId ? await supabase.from("evaluations").update(payload).eq("id", evaluationId) : await supabase.from("evaluations").insert(payload).select("id").single();
    if (response.error) { setSaving(false); setMessage(response.error.message); return; }
    const id = evaluationId || ("data" in response && response.data ? response.data.id : null);
    if (id) setEvaluationId(id);
    setSaving(false);
    setMessage(status === "draft" ? "บันทึกแบบร่างเรียบร้อยแล้ว" : "ส่งแบบประเมินแล้ว คะแนนถูกล็อกและไม่สามารถแก้ไขได้");
    if (status === "submitted") {
      submittedRef.current = true;
      setSubmitted(true);
      setForm((current) => ({
        ...current,
        topics: initialForm.topics,
        notes: "",
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
          <label>วันที่<input type="date" value={form.date} disabled={submitted} onChange={(event) => update("date", event.target.value)} /></label>
          <fieldset><legend>Mode</legend>
            <div className="mode-options">
              <label><input type="radio" disabled={submitted} checked={form.mode === "onsite"} onChange={() => update("mode", "onsite")} />On-site</label>
              <label><input type="radio" disabled={submitted} checked={form.mode === "online"} onChange={() => update("mode", "online")} />Online</label>
            </div>
          </fieldset>
        </div>
        {submitted && <p className="evaluation-locked-notice" role="status"><Icon name="check" size={16} />แบบประเมินนี้ส่งแล้ว คะแนนถูกล็อกและไม่สามารถแก้ไขได้</p>}
        <EvaluationScores key={`${criteria.length}-${submitted}`} scores={form.scores} criteria={criteria} grades={grades} disabled={submitted} onChange={(scores) => update("scores", scores)} />
        <label className="evaluation-field">บันทึกการประเมิน<textarea disabled={submitted} rows={4} value={form.notes} onChange={(event) => update("notes", event.target.value)} /></label>
        <label className="evaluation-field">ข้อเสนอแนะ<textarea disabled={submitted} required rows={4} value={form.feedback} onChange={(event) => update("feedback", event.target.value)} /></label>
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
          <button className={`button primary supervision-save-button ${submitted ? "is-saved" : ""}`} type="submit" disabled={saving || submitted}>
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
}
