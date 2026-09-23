"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { type Student, type WeeklyStatus } from "../data";
import AdvisorShell from "./AdvisorShell";
import Icon from "./Icon";
import StudentHeader from "./StudentHeader";

type WeeklyLog = { id: string; week: number; title: string; content: string; submitted_at: string | null; status: WeeklyStatus; advisor_comment: string | null };
const labels: Record<WeeklyStatus, string> = { approved: "Approved", pending: "Pending review", revision: "Revision requested", upcoming: "Upcoming" };

export default function StudentProgress({ student }: { student: Student }) {
  const { user } = useAuth();
  const [logs, setLogs] = useState<WeeklyLog[]>([]);
  const [filter, setFilter] = useState<"all" | WeeklyStatus>("all");
  const [note, setNote] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState("");
  const load = useCallback(async () => {
    const { data, error } = await supabase.from("weekly_logs").select("id, week, title, content, submitted_at, status, advisor_comment").eq("record_id", student.recordId).order("week", { ascending: true });
    if (error) setMessage(error.message); else setLogs((data || []) as WeeklyLog[]);
  }, [student.recordId]);
  useEffect(() => { void load(); }, [load]);
  async function review(log: WeeklyLog, status: "approved" | "revision") {
    if (!user) return;
    const comment = status === "revision" ? note[log.id]?.trim() : log.advisor_comment;
    if (status === "revision" && !comment) { setMessage("Enter a comment before requesting a revision."); return; }
    setBusyId(log.id);
    const { error } = await supabase.from("weekly_logs").update({ status, advisor_comment: comment || null }).eq("id", log.id).eq("record_id", student.recordId);
    setBusyId("");
    if (error) { setMessage(error.message); return; }
    if (status === "revision" && comment) {
      const { error: noteError } = await supabase.from("advisor_notes").insert({ weekly_log_id: log.id, advisor_id: user.id, note: comment });
      if (noteError) { setMessage(noteError.message); return; }
    }
    setMessage(status === "approved" ? `Week ${log.week} approved.` : `Week ${log.week} returned for revision.`);
    await load();
  }
  const visible = logs.filter((log) => filter === "all" || log.status === filter);
  const count = (status: WeeklyStatus) => logs.filter((log) => log.status === status).length;
  return <AdvisorShell student={student} active="students" studentSection="progress"><StudentHeader student={student} /><section className="weekly-section"><div className="weekly-heading"><div><h2>Weekly logs</h2><p>Review and save feedback to Supabase.</p></div><div className="detail-tabs">{(["all", "pending", "revision", "approved", "upcoming"] as const).map((item) => <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item === "all" ? "All" : labels[item]} <span>{item === "all" ? logs.length : count(item)}</span></button>)}</div></div>{message && <p className="feedback">{message}</p>}<div className="weekly-list">{visible.map((log) => <article className={`weekly-card is-open ${log.status === "upcoming" ? "upcoming" : ""}`} key={log.id}><div className="weekly-toggle"><span className="week-number">W{log.week}</span><span className="weekly-summary"><strong>{log.title}</strong><small>{log.submitted_at ? new Date(log.submitted_at).toLocaleDateString() : "Not submitted"}</small></span><span className={`badge ${log.status}`}>{labels[log.status]}</span></div><div className="weekly-details">{log.content && <div className="log-summary"><strong>Summary</strong><p>{log.content}</p></div>}{log.advisor_comment && <div className="weekly-comment"><Icon name="file" size={18} /><div><strong>Advisor comment</strong><p>{log.advisor_comment}</p></div></div>}{log.status !== "upcoming" && log.status !== "approved" && <div className="weekly-review"><label>Feedback<textarea rows={3} value={note[log.id] || ""} onChange={(event) => setNote((current) => ({ ...current, [log.id]: event.target.value }))} /></label><div className="review-actions"><button className="button revision" disabled={busyId === log.id} onClick={() => void review(log, "revision")}>Request revision</button><button className="button primary" disabled={busyId === log.id} onClick={() => void review(log, "approved")}>Approve</button></div></div>}</div></article>)}</div>{!visible.length && <p className="weekly-empty">No logs in this status.</p>}</section></AdvisorShell>;
}
