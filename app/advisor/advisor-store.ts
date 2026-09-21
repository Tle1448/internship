import type { Student, WorkflowStatus } from "./data";
import { createWeeklyRecords, type WeeklyRecord, type WeeklyStatus } from "./detail-data";

export const advisorDataEvent = "advisor-data-change";
const weeklyStatuses: WeeklyStatus[] = ["pending", "approved", "revision", "upcoming"];
export type WorkflowRecord = { supervisionStatus: WorkflowStatus; evaluationStatus: WorkflowStatus };

function isWeeklyRecord(value: unknown): value is WeeklyRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<WeeklyRecord>;
  return typeof record.week === "number" && typeof record.title === "string" && typeof record.date === "string" && typeof record.content === "string" && weeklyStatuses.includes(record.status as WeeklyStatus);
}

export function readWeeklyRecords(student: Student): WeeklyRecord[] {
  if (typeof window === "undefined") return createWeeklyRecords(student);
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(`advisor-progress-${student.id}`) || "null");
    if (Array.isArray(parsed) && parsed.length === 16 && parsed.every(isWeeklyRecord)) return parsed;
  } catch {
    // Fall back to the shared mock records below.
  }
  return createWeeklyRecords(student);
}

export function writeWeeklyRecords(studentId: string, records: WeeklyRecord[]) {
  localStorage.setItem(`advisor-progress-${studentId}`, JSON.stringify(records));
  window.dispatchEvent(new CustomEvent(advisorDataEvent, { detail: { studentId } }));
}

export function readAdvisorNotes(studentId: string): Record<number, string[]> {
  if (typeof window === "undefined") return {};
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(`advisor-notes-${studentId}`) || "null");
    if (Array.isArray(parsed) && parsed.every(item => typeof item === "string")) return { 8: parsed };
    if (parsed && typeof parsed === "object" && Object.values(parsed).every(items => Array.isArray(items) && items.every(item => typeof item === "string"))) return parsed as Record<number, string[]>;
  } catch {
    // Invalid browser data is ignored so the prototype remains usable.
  }
  return {};
}

export function writeAdvisorNotes(studentId: string, notes: Record<number, string[]>) {
  localStorage.setItem(`advisor-notes-${studentId}`, JSON.stringify(notes));
  window.dispatchEvent(new CustomEvent(advisorDataEvent, { detail: { studentId } }));
}

export function readWorkflowStatus(student: Student): WorkflowRecord {
  const fallback = { supervisionStatus: student.supervisionStatus, evaluationStatus: student.evaluationStatus };
  if (typeof window === "undefined") return fallback;
  try {
    const value: unknown = JSON.parse(localStorage.getItem(`advisor-workflow-${student.id}`) || "null");
    if (!value || typeof value !== "object") return fallback;
    const record = value as Partial<WorkflowRecord>;
    if (!["pending", "completed"].includes(String(record.supervisionStatus)) || !["pending", "completed"].includes(String(record.evaluationStatus))) return fallback;
    return record as WorkflowRecord;
  } catch {
    return fallback;
  }
}

export function writeWorkflowStatus(student: Student, updates: Partial<WorkflowRecord>) {
  const next = { ...readWorkflowStatus(student), ...updates };
  localStorage.setItem(`advisor-workflow-${student.id}`, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(advisorDataEvent, { detail: { studentId: student.id } }));
  return next;
}
