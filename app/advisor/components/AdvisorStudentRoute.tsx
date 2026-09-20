"use client";

import { useEffect, useState } from "react";
import { students, type Student } from "../data";
import EvaluationForm, { type EvaluationStep } from "./EvaluationForm";
import StudentProgress from "./StudentProgress";

type AdvisorStudentRouteProps = { id: string; view: "progress" | "evaluation"; step?: EvaluationStep };

function readSelectedStudent(id: string): Student | null {
  try {
    const stored: unknown = JSON.parse(sessionStorage.getItem(`advisor-student-${id}`) || "null");
    if (!stored || typeof stored !== "object") return null;
    const student = stored as Partial<Student>;
    if (typeof student.id !== "string" || typeof student.name !== "string" || typeof student.company !== "string" || typeof student.province !== "string" || typeof student.project !== "string" || typeof student.role !== "string" || typeof student.major !== "string" || !["approved", "pending", "late"].includes(String(student.status)) || typeof student.visited !== "boolean") return null;
    return student as Student;
  } catch {
    return null;
  }
}

export default function AdvisorStudentRoute({ id, view, step }: AdvisorStudentRouteProps) {
  const [student, setStudent] = useState<Student | null>(() => students.find(item => item.id === id) ?? null);
  const [resolved, setResolved] = useState(() => students.some(item => item.id === id));

  useEffect(() => {
    const selected = readSelectedStudent(id);
    if (selected) setStudent(selected);
    setResolved(true);
  }, [id]);

  if (!resolved) return <p className="detail-card">กำลังโหลดข้อมูลนักศึกษา...</p>;
  if (!student) return <section className="detail-card empty-state"><strong>ไม่พบข้อมูลนักศึกษา</strong><p>กรุณากลับไปเลือกนักศึกษาจากหน้ารวมอีกครั้ง</p></section>;
  return view === "progress" ? <StudentProgress key={student.id} student={student} /> : <EvaluationForm key={student.id} student={student} step={step} />;
}
