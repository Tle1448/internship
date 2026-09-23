"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { type Student, useAdvisorStudents } from "../data";
import Icon from "./Icon";

type Task = { id: string; student: Student; kind: "weekly" | "supervision" | "evaluation"; title: string; urgent: boolean; href: string };

export default function EvaluationList() {
  const { students, loading } = useAdvisorStudents();
  const [pendingLogs, setPendingLogs] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  useEffect(() => { void (async () => {
    if (!students.length) { setPendingLogs(new Set()); return; }
    const { data } = await supabase.from("weekly_logs").select("record_id, status").in("record_id", students.map((student) => student.recordId)).in("status", ["pending", "revision"]);
    setPendingLogs(new Set((data || []).map((row) => row.record_id)));
  })(); }, [students]);
  const tasks = useMemo(() => students.flatMap((student): Task[] => {
    const next: Task[] = [];
    if (pendingLogs.has(student.recordId)) next.push({ id: `${student.recordId}-weekly`, student, kind: "weekly", title: "Review weekly log", urgent: student.progressHealth === "attention", href: `/advisor/students/${student.id}/progress` });
    if (student.supervisionStatus === "pending") next.push({ id: `${student.recordId}-supervision`, student, kind: "supervision", title: "Record supervision", urgent: student.progressHealth === "attention", href: `/advisor/students/${student.id}/supervision` });
    if (student.supervisionStatus === "completed" && student.evaluationStatus === "pending") next.push({ id: `${student.recordId}-evaluation`, student, kind: "evaluation", title: "Submit evaluation", urgent: false, href: `/advisor/students/${student.id}/evaluation` });
    return next;
  }), [students, pendingLogs]);
  const visible = tasks.filter((task) => !query || `${task.student.name} ${task.student.id} ${task.title}`.toLowerCase().includes(query.toLowerCase()));
  return <section className="advisor-list-page task-inbox"><div className="list-heading"><div><h1>Tasks</h1><p>Items generated from live weekly logs and workflow statuses.</p></div><span className="list-count">{loading ? "..." : visible.length} tasks</span></div><div className="task-toolbar"><label className="list-search"><Icon name="search" size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search student or task" /></label></div><div className="evaluation-task-list">{visible.map((task) => <article className="detail-card evaluation-task-item" key={task.id}><span className="task-icon"><Icon name={task.kind === "weekly" ? "file" : task.kind === "supervision" ? "calendar" : "checklist"} size={21} /></span><div><span className="task-kind">{task.kind.toUpperCase()}</span><h2>{task.student.name}</h2><p>{task.title}</p><small>{task.student.id} · {task.student.company}</small></div><span className={`badge ${task.urgent ? "late" : "pending"}`}>{task.urgent ? "Needs attention" : "Pending"}</span><Link className="button primary" href={task.href}>Open<Icon name="chevron" size={16} /></Link></article>)}</div>{!loading && !visible.length && <p className="detail-card empty-state">No pending tasks.</p>}</section>;
}
