import { students } from "../data";
import EvaluationForm from "./EvaluationForm";
import EvaluationHistory from "./EvaluationHistory";
import StudentOverview from "./StudentOverview";
import StudentProgress from "./StudentProgress";
import SupervisionForm from "./SupervisionForm";

type StudentView = "overview" | "progress" | "supervision" | "evaluation" | "history";

export default function AdvisorStudentRoute({ id, view }: { id: string; view: StudentView }) {
  const student = students.find(item => item.id === id);
  if (!student) return <section className="detail-card empty-state"><strong>ไม่พบข้อมูลนักศึกษา</strong><p>กรุณากลับไปเลือกนักศึกษาจากหน้ารวมอีกครั้ง</p></section>;
  if (view === "overview") return <StudentOverview student={student} />;
  if (view === "progress") return <StudentProgress student={student} />;
  if (view === "supervision") return <SupervisionForm student={student} />;
  if (view === "evaluation") return <EvaluationForm student={student} />;
  return <EvaluationHistory student={student} />;
}
