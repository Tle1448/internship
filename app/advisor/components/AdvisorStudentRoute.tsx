"use client";

import { useAdvisorStudents } from "../data";
import EvaluationForm from "./EvaluationForm";
import EvaluationHistory from "./EvaluationHistory";
import StudentOverview from "./StudentOverview";
import StudentProgress from "./StudentProgress";
import SupervisionForm from "./SupervisionForm";

type StudentView = "overview" | "progress" | "supervision" | "evaluation" | "history";

export default function AdvisorStudentRoute({ id, recordId, view }: { id?: string; recordId?: string; view: StudentView }) {
  const { students, loading, error } = useAdvisorStudents();
  if (loading) return <section className="detail-card empty-state">Loading student data...</section>;
  if (error) return <section className="detail-card empty-state">Unable to load student data: {error}</section>;
  const student = students.find((item) => recordId ? item.recordId === recordId : item.id === id);
  if (!student) return <section className="detail-card empty-state">Student record was not found or is not assigned to this advisor.</section>;
  if (view === "overview") return <StudentOverview student={student} />;
  if (view === "progress") return <StudentProgress student={student} />;
  if (view === "supervision") return <SupervisionForm student={student} />;
  if (view === "evaluation") return <EvaluationForm key={student.recordId} student={student} />;
  return <EvaluationHistory student={student} />;
}
