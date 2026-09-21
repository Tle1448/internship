import type { Student } from "../data";
import { progressPercent } from "../data";

export default function StudentHeader({ student, compact = false }: { student: Student; compact?: boolean }) {
  return <section className={`detail-card student-summary ${compact ? "compact" : ""}`} aria-label="ข้อมูลนักศึกษา">
    <span className="detail-avatar" aria-hidden="true">{student.name.replace(/^(นาย|นางสาว)/, "").slice(0, 2)}</span>
    <div className="student-summary-copy"><h2>{student.name} <span className="detail-tag">{student.id}</span></h2><p>{student.company}</p><small>{student.role} · {student.major}</small></div>
    <div className="student-current"><small>ความก้าวหน้าปัจจุบัน</small><strong>{progressPercent(student)}%</strong><span>สัปดาห์ {student.currentWeek} / 16</span></div>
  </section>;
}
