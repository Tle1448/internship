"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";

export type PlacementStatus = "approved" | "pending";
export type ProgressHealth = "on_track" | "attention";
export type WorkflowStatus = "pending" | "completed";
export type WeeklyStatus = "pending" | "approved" | "revision" | "upcoming";

export type Student = {
  id: string;
  userId: string;
  recordId: string;
  name: string;
  company: string;
  province: string;
  project: string;
  role: string;
  major: string;
  currentWeek: number;
  progress: number;
  placementStatus: PlacementStatus;
  progressHealth: ProgressHealth;
  supervisionStatus: WorkflowStatus;
  evaluationStatus: WorkflowStatus;
};

type RecordRow = {
  id: string; student_id: string; company_name: string | null; position: string | null;
  province: string | null; project: string | null; current_week: number | null;
  placement_status: PlacementStatus | null;
  progress_health: ProgressHealth | null; supervision_status: WorkflowStatus | null;
  evaluation_status: WorkflowStatus | null;
};
type ProfileRow = { id: string; full_name: string | null; user_code: string | null; major: string | null };

export const placementStatusLabels: Record<PlacementStatus, string> = {
  approved: "อนุมัติครบถ้วน",
  pending: "รอตรวจสอบ",
};

export const progressHealthLabels: Record<ProgressHealth, string> = {
  on_track: "ตามแผน",
  attention: "ต้องติดตาม",
};

export function progressPercent(student: Student) {
  return student.progress;
}

function toStudent(record: RecordRow, profile: ProfileRow): Student {
  return {
    id: profile.user_code || profile.id,
    userId: profile.id,
    recordId: record.id,
    name: profile.full_name || profile.user_code || "Student",
    company: record.company_name || "-",
    province: record.province || "-",
    project: record.project || "-",
    role: record.position || "-",
    major: profile.major || "-",
    currentWeek: record.current_week || 1,
    progress: 0,
    placementStatus: record.placement_status || "pending",
    progressHealth: record.progress_health || "on_track",
    supervisionStatus: record.supervision_status || "pending",
    evaluationStatus: record.evaluation_status || "pending",
  };
}

export function useAdvisorStudents() {
  const { user } = useAuth();
  const userId = user?.id;
  const userRole = user?.role;
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!userId || userRole !== "advisor") {
      setStudents([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data: records, error: recordError } = await supabase
      .from("internship_records")
      .select("id, student_id, company_name, position, province, project, current_week, placement_status, progress_health, supervision_status, evaluation_status")
      .eq("advisor_id", userId)
      .eq("placement_status", "approved")
      .eq("status", "in_progress")
      .order("updated_at", { ascending: false });
    if (recordError) {
      setError(recordError.message);
      setStudents([]);
      setLoading(false);
      return;
    }
    const rows = (records || []) as RecordRow[];
    if (!rows.length) {
      setStudents([]);
      setError("");
      setLoading(false);
      return;
    }
    const [profileResult, progressResult] = await Promise.all([
      supabase.from("profiles").select("id, full_name, user_code, major").in("id", rows.map((row) => row.student_id)),
      supabase.from("progress_reports").select("record_id, project_progress, submitted_at").in("record_id", rows.map((row) => row.id)).eq("status", "approved").order("submitted_at", { ascending: false }),
    ]);
    if (profileResult.error || progressResult.error) {
      setError(profileResult.error?.message ?? progressResult.error?.message ?? "Unable to load student data.");
      setStudents([]);
    } else {
      const profileById = new Map(((profileResult.data ?? []) as ProfileRow[]).map((profile) => [profile.id, profile]));
      const progressByRecord = new Map<string, number>();
      for (const report of progressResult.data ?? []) {
        if (!progressByRecord.has(report.record_id)) progressByRecord.set(report.record_id, report.project_progress);
      }
      setStudents(rows.flatMap((record) => {
        const profile = profileById.get(record.student_id);
        if (!profile) return [];
        const student = toStudent(record, profile);
        student.progress = progressByRecord.get(record.id) ?? 0;
        return [student];
      }));
      setError("");
    }
    setLoading(false);
  }, [userId, userRole]);

  useEffect(() => { void refresh(); }, [refresh]);
  return { students, loading, error, refresh };
}
