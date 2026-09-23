"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Student } from "../data";
import AdvisorShell from "./AdvisorShell";
import Icon from "./Icon";
import StudentHeader from "./StudentHeader";

type History = { id: string; total_score: number; grade: string; saved_at: string };

export default function EvaluationHistory({ student }: { student: Student }) {
  const [history, setHistory] = useState<History[]>([]);
  const [message, setMessage] = useState("");
  const load = useCallback(async () => {
    const { data, error } = await supabase.from("evaluation_history").select("id, total_score, grade, saved_at").eq("student_id", student.userId).order("saved_at", { ascending: false });
    if (error) setMessage(error.message); else setHistory((data || []) as History[]);
  }, [student.userId]);
  useEffect(() => { void load(); }, [load]);
  return <AdvisorShell student={student} active="students" studentSection="history"><div className="evaluation-heading"><div><h1>Evaluation history</h1><p>Submitted evaluation records for this student.</p></div><button className="button secondary" onClick={() => void load()}><Icon name="reset" />Reload</button></div>{message && <p className="feedback">{message}</p>}<StudentHeader student={student} compact /><section className="detail-card evaluation-history"><div className="section-title"><span className="detail-icon"><Icon name="clock" /></span><div><h2>Saved evaluations</h2><p>Newest submission first.</p></div></div>{history.length ? history.map((entry) => <div className="attachment-row" key={entry.id}><Icon name="check" /><span>{new Date(entry.saved_at).toLocaleString()}</span><strong>{entry.total_score}/100 · Grade {entry.grade}</strong></div>) : <div className="empty-state"><Icon name="clock" size={28} /><strong>No submitted evaluation yet.</strong></div>}</section></AdvisorShell>;
}
