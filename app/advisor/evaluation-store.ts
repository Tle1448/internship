import { gradeFor, scoreCriteria } from "./evaluation-template";

export type EvaluationRecord = { date: string; mode: "onsite" | "online"; topics: boolean[]; notes: string; scores: number[]; feedback: string };
export type EvaluationHistoryEntry = { savedAt: string; total: number; grade: string };

export const initialEvaluation: EvaluationRecord = {
  date: "2024-10-25",
  mode: "onsite",
  topics: [true, true],
  notes: "นักศึกษามีความก้าวหน้าตามแผน สามารถอธิบายงานและประเด็นที่พบระหว่างการฝึกงานได้ชัดเจน",
  scores: scoreCriteria.map(criterion => criterion.initial),
  feedback: "นักศึกษาปรับตัวกับทีมได้ดี ควรพัฒนาการสรุปผลและการนำเสนอผลงานให้กระชับยิ่งขึ้น",
};

function evaluationKey(studentId: string) {
  return `advisor-evaluation-${studentId}`;
}

export function readEvaluation(studentId: string): EvaluationRecord {
  if (typeof window === "undefined") return initialEvaluation;
  try {
    const value: unknown = JSON.parse(localStorage.getItem(evaluationKey(studentId)) || "null");
    if (!value || typeof value !== "object") return initialEvaluation;
    const record = value as Partial<EvaluationRecord>;
    if (typeof record.date !== "string" || !["onsite", "online"].includes(String(record.mode)) || typeof record.notes !== "string" || typeof record.feedback !== "string" || !Array.isArray(record.topics) || record.topics.length !== 2 || !record.topics.every(item => typeof item === "boolean") || !Array.isArray(record.scores) || record.scores.length !== scoreCriteria.length || !record.scores.every((score, index) => typeof score === "number" && score >= 0 && score <= scoreCriteria[index].max)) return initialEvaluation;
    return record as EvaluationRecord;
  } catch {
    return initialEvaluation;
  }
}

export function writeEvaluation(studentId: string, record: EvaluationRecord) {
  localStorage.setItem(evaluationKey(studentId), JSON.stringify(record));
}

export function readEvaluationHistory(studentId: string): EvaluationHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const value: unknown = JSON.parse(localStorage.getItem(`${evaluationKey(studentId)}-history`) || "[]");
    if (Array.isArray(value) && value.every(item => item && typeof item.savedAt === "string" && typeof item.total === "number" && typeof item.grade === "string")) return value as EvaluationHistoryEntry[];
  } catch {
    // Invalid browser data is treated as an empty history.
  }
  return [];
}

export function submitEvaluation(studentId: string, record: EvaluationRecord) {
  writeEvaluation(studentId, record);
  const total = record.scores.reduce((sum, score) => sum + score, 0);
  const history = [{ savedAt: new Date().toISOString(), total, grade: gradeFor(total) }, ...readEvaluationHistory(studentId)];
  localStorage.setItem(`${evaluationKey(studentId)}-history`, JSON.stringify(history));
  return history;
}
