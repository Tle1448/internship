"use client";

/**
 * หน้า: อัปเดตเอกสารและความคืบหน้าการสมัคร (ฝั่ง conditer)
 * คู่กับหน้าอัปโหลดหลักฐานฝั่งนักศึกษา (InternshipRecordPage) ที่ส่งมาให้ก่อนหน้านี้
 * เมนูนี้ถูกเพิ่มไว้ใน ConditerSidebar แล้ว -> /conditer/progress
 *
 * ---------------------------------------------------------------------
 * หน้านี้เชื่อมกับตาราง internship_records เท่านั้น (ไม่แตะ advisor_feedback —
 * ส่วนแจ้งเตือน/feedback ไปหา advisor เป็นงานของทีมอื่น)
 *
 * SQL ที่ต้องเพิ่ม (ถ้ายังไม่มี) — รันใน Supabase SQL editor:
 * ---------------------------------------------------------------------
 * alter table internship_records
 *   add column if not exists review_status text not null default 'pending';
 *   -- ค่าที่ใช้: 'pending' | 'approved' | 'rejected'
 *
 * -- อย่าลืมตั้ง RLS policy ให้ role conditer update คอลัมน์นี้ได้
 * ---------------------------------------------------------------------
 */

import { useEffect, useState } from "react";
import ConditerSidebar from "@/components/ConditerSidebar";
import { supabase } from "@/lib/supabase";
import { FileText, X, Clock, Check, ClipboardX } from "lucide-react";

// ---------- Types ----------
type ReviewStatus = "pending" | "approved" | "rejected";

interface ProgressUpdateLog {
  id: string;
  note: string;
  createdAt: string;
}

interface EvidenceFile {
  path: string;
  name: string;
}

interface ProgressRow {
  recordId: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  major: string;
  company: string;
  position: string;
  latestNote: string;
  lastUpdated: string;
  evidenceFiles: EvidenceFile[];
  reviewStatus: ReviewStatus;
}

// bucket เดียวกับที่หน้านักศึกษาอัปโหลดไฟล์เข้ามา
const EVIDENCE_BUCKET = "internship-evidence";

function fileNameFromUrl(url: string) {
  try {
    const parts = url.split("/");
    const last = parts[parts.length - 1];
    return decodeURIComponent(last.replace(/^\d+_/, ""));
  } catch {
    return url;
  }
}

function StatusPill({ status }: { status: ReviewStatus }) {
  const map: Record<ReviewStatus, { label: string; cls: string }> = {
    pending: { label: "รอตรวจสอบ", cls: "bg-[#FFF4E5] text-[#F18701]" },
    approved: { label: "อนุมัติแล้ว", cls: "bg-[#EAF9F0] text-[#1FA25C]" },
    rejected: { label: "ไม่อนุมัติ", cls: "bg-[#FDECEC] text-[#E94B4B]" },
  };
  const s = map[status];
  return <span className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${s.cls}`}>{s.label}</span>;
}

export default function ConditerProgressPage() {
  const [rows, setRows] = useState<ProgressRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ReviewStatus>("all");

  const [selectedRow, setSelectedRow] = useState<ProgressRow | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [historyLogs, setHistoryLogs] = useState<ProgressUpdateLog[]>([]);
  const [fileUrls, setFileUrls] = useState<Record<string, string>>({});
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadRows();
  }, []);

  async function loadRows() {
    setLoading(true);
    setErrorBanner(null);

    // 1) ดึง internship_records ตรง ๆ ก่อน ไม่ embed join กับ profiles
    //    (เลี่ยงปัญหา "more than one relationship was found" ของ Supabase)
    const { data: records, error: recordsError } = await supabase
      .from("internship_records")
      .select("id, student_id, company_name, position, progress_note, evidence_files, updated_at, review_status")
      .order("updated_at", { ascending: false });

    if (recordsError) {
      console.error("โหลดรายการความคืบหน้าไม่สำเร็จ:", recordsError);
      setErrorBanner(recordsError.message || "โหลดรายการไม่สำเร็จ");
      setLoading(false);
      return;
    }

    const studentIds = Array.from(new Set((records ?? []).map((r: any) => r.student_id).filter(Boolean)));

    // 2) ดึงข้อมูลนักศึกษาที่เกี่ยวข้องทั้งหมดแยกอีก query หนึ่ง แล้วค่อย merge เอง
    let profilesById: Record<string, any> = {};
    if (studentIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, user_code, faculty, major")
        .in("id", studentIds);

      if (profilesError) {
        console.error("โหลดข้อมูลนักศึกษาไม่สำเร็จ:", profilesError);
        // ไม่ throw ต่อ เพราะยังอยากโชว์รายการ record ได้แม้โปรไฟล์จะโหลดไม่ครบ
      } else {
        profilesById = Object.fromEntries((profiles ?? []).map((p: any) => [p.id, p]));
      }
    }

    const mapped: ProgressRow[] = (records ?? []).map((r: any) => {
      const profile = profilesById[r.student_id];
      return {
        recordId: r.id,
        studentId: r.student_id,
        studentName: profile?.full_name ?? "-",
        studentCode: profile?.user_code ?? "-",
        major: [profile?.faculty, profile?.major].filter(Boolean).join(" • ") || "-",
        company: r.company_name ?? "ยังไม่ระบุบริษัท",
        position: r.position ?? "ยังไม่ระบุตำแหน่ง",
        latestNote: r.progress_note ?? "ยังไม่มีการอัปเดต",
        lastUpdated: r.updated_at,
        evidenceFiles: (r.evidence_files ?? []).map((path: string) => ({
          path,
          name: fileNameFromUrl(path),
        })),
        reviewStatus: (r.review_status ?? "pending") as ReviewStatus,
      };
    });

    setRows(mapped);
    setLoading(false);
  }

  async function openReview(row: ProgressRow) {
    setSelectedRow(row);
    setIsModalOpen(true);
    setFileUrls({});

    // ขอ signed URL ของไฟล์หลักฐานทุกไฟล์ (ใช้ได้ทั้งบัคเก็ตแบบ public และ private)
    if (row.evidenceFiles.length > 0) {
      setLoadingFiles(true);
      const results = await Promise.all(
        row.evidenceFiles.map(async (file) => {
          const { data, error } = await supabase.storage
            .from(EVIDENCE_BUCKET)
            .createSignedUrl(file.path, 60 * 60); // ลิงก์ใช้ได้ 1 ชั่วโมง

          if (error) {
            console.error("สร้างลิงก์ดูไฟล์ไม่สำเร็จ:", file.path, error);
            return null;
          }
          return { path: file.path, url: data?.signedUrl };
        })
      );

      const urlMap: Record<string, string> = {};
      results.forEach((r) => {
        if (r?.url) urlMap[r.path] = r.url;
      });
      setFileUrls(urlMap);
      setLoadingFiles(false);
    }

    const { data, error } = await supabase
      .from("progress_updates")
      .select("id, note, created_at")
      .eq("record_id", row.recordId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("โหลดประวัติการอัปเดตไม่สำเร็จ:", error);
      setHistoryLogs([]);
      return;
    }

    setHistoryLogs((data ?? []).map((d: any) => ({ id: d.id, note: d.note, createdAt: d.created_at })));
  }

  async function handleDecision(decision: "approved" | "rejected") {
    if (!selectedRow) return;
    setIsSaving(true);
    setErrorBanner(null);

    try {
      const { error: updateError } = await supabase
        .from("internship_records")
        .update({ review_status: decision, updated_at: new Date().toISOString() })
        .eq("id", selectedRow.recordId);

      if (updateError) throw updateError;

      setRows((prev) =>
        prev.map((r) => (r.recordId === selectedRow.recordId ? { ...r, reviewStatus: decision } : r))
      );
      setIsModalOpen(false);
    } catch (err: any) {
      console.error("บันทึกผลการตรวจสอบไม่สำเร็จ:", err);
      setErrorBanner(err.message ?? "บันทึกผลการตรวจสอบไม่สำเร็จ");
    } finally {
      setIsSaving(false);
    }
  }

  const filteredRows = rows.filter((r) => {
    const matchesStatus = statusFilter === "all" || r.reviewStatus === statusFilter;
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      r.studentName.toLowerCase().includes(q) ||
      r.company.toLowerCase().includes(q) ||
      r.position.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const counts = {
    pending: rows.filter((r) => r.reviewStatus === "pending").length,
    approved: rows.filter((r) => r.reviewStatus === "approved").length,
    rejected: rows.filter((r) => r.reviewStatus === "rejected").length,
  };

  return (
    <div className="min-h-screen bg-[#FAFAFC]">
      <ConditerSidebar />

      <main className="lg:pl-[235px]">
        <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 md:px-8">
          <div>
            <h1 className="text-2xl font-bold text-[#2E2A4A]">อัปเดตเอกสารและความคืบหน้าการสมัคร</h1>
            <p className="mt-1 text-sm text-[#8A879A]">
              ตรวจสอบเอกสารหลักฐานและข้อความอัปเดตสถานะที่นักศึกษาส่งเข้ามา แล้วอนุมัติหรือให้ feedback กลับ
            </p>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-[#E8E6F0] bg-white p-10 text-center text-sm text-[#8A879A]">
              กำลังโหลดข้อมูล...
            </div>
          ) : (
            <>
              {errorBanner && (
                <div className="rounded-2xl border border-[#F6C9C9] bg-[#FDECEC] p-4 text-sm font-semibold text-[#E94B4B]">
                  {errorBanner}
                </div>
              )}

              {/* Summary cards */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="flex items-center justify-between rounded-2xl border border-[#E8E6F0] bg-white p-5">
                  <div>
                    <p className="text-xs text-[#9995A9]">รอตรวจสอบ</p>
                    <p className="text-2xl font-bold text-[#2E2A4A]">{counts.pending}</p>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FFF4E5] text-[#F18701]">
                    <Clock size={20} />
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-[#E8E6F0] bg-white p-5">
                  <div>
                    <p className="text-xs text-[#9995A9]">อนุมัติแล้ว</p>
                    <p className="text-2xl font-bold text-[#2E2A4A]">{counts.approved}</p>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#EAF9F0] text-[#1FA25C]">
                    <Check size={20} />
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-[#E8E6F0] bg-white p-5">
                  <div>
                    <p className="text-xs text-[#9995A9]">ไม่อนุมัติ</p>
                    <p className="text-2xl font-bold text-[#2E2A4A]">{counts.rejected}</p>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FDECEC] text-[#E94B4B]">
                    <ClipboardX size={20} />
                  </div>
                </div>
              </div>

              {/* Table section */}
              <section className="rounded-2xl border border-[#E8E6F0] bg-white p-5">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-[#2E2A4A]">รายการอัปเดตความคืบหน้า</h2>
                    <p className="text-xs text-[#9995A9]">อนุมัติ ไม่อนุมัติ หรือให้ feedback กลับนักศึกษา</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="ค้นหานักศึกษา บริษัท..."
                      className="rounded-xl border border-[#E8E6F0] px-3 py-2 text-xs text-[#2E2A4A] focus:outline-none focus:ring-2 focus:ring-[#3D348B]/30"
                    />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as "all" | ReviewStatus)}
                      className="rounded-xl border border-[#E8E6F0] px-3 py-2 text-xs text-[#2E2A4A] focus:outline-none focus:ring-2 focus:ring-[#3D348B]/30"
                    >
                      <option value="all">ทั้งหมด</option>
                      <option value="pending">รอตรวจสอบ</option>
                      <option value="approved">อนุมัติแล้ว</option>
                      <option value="rejected">ไม่อนุมัติ</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#EFEEFC] text-[#9995A9]">
                        <th className="py-2 pr-4 font-medium">นักศึกษา</th>
                        <th className="py-2 pr-4 font-medium">บริษัท / ตำแหน่ง</th>
                        <th className="py-2 pr-4 font-medium">ข้อความล่าสุด</th>
                        <th className="py-2 pr-4 font-medium">ไฟล์แนบ</th>
                        <th className="py-2 pr-4 font-medium">อัปเดตล่าสุด</th>
                        <th className="py-2 pr-4 font-medium">สถานะ</th>
                        <th className="py-2 pr-4 font-medium">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRows.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-6 text-center text-[#B5B2C2]">
                            ไม่พบรายการที่ตรงกับเงื่อนไข
                          </td>
                        </tr>
                      )}
                      {filteredRows.map((row) => (
                        <tr key={row.recordId} className="border-b border-[#F4F3FC] hover:bg-[#FAFAFC]">
                          <td className="py-3 pr-4">
                            <p className="font-semibold text-[#2E2A4A]">{row.studentName}</p>
                            <p className="text-[#B5B2C2]">{row.studentCode}</p>
                          </td>
                          <td className="py-3 pr-4">
                            <p className="font-medium text-[#3D348B]">{row.position}</p>
                            <p className="text-[#B5B2C2]">{row.company}</p>
                          </td>
                          <td className="max-w-[220px] truncate py-3 pr-4 text-[#68657A]">{row.latestNote}</td>
                          <td className="py-3 pr-4">
                            <span className="inline-flex items-center gap-1 text-[#68657A]">
                              <FileText size={14} className="text-[#3D348B]" />
                              {row.evidenceFiles.length} ไฟล์
                            </span>
                          </td>
                          <td className="py-3 pr-4 text-[#9995A9]">
                            {new Date(row.lastUpdated).toLocaleDateString("th-TH")}
                          </td>
                          <td className="py-3 pr-4">
                            <StatusPill status={row.reviewStatus} />
                          </td>
                          <td className="py-3 pr-4">
                            <button
                              type="button"
                              onClick={() => openReview(row)}
                              className="rounded-lg bg-[#3D348B] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#332B75]"
                            >
                              ตรวจสอบ
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
        </div>
      </main>

      {/* Review Modal */}
      {isModalOpen && selectedRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#EFEEFC] pb-3">
              <h3 className="text-lg font-bold text-[#2E2A4A]">ตรวจสอบความคืบหน้า</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-[#9995A9] hover:bg-[#F4F3FC] hover:text-[#3D348B]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs text-[#9995A9]">นักศึกษา</p>
                <p className="text-sm font-medium text-[#2E2A4A]">
                  {selectedRow.studentName} ({selectedRow.studentCode})
                </p>
                <p className="text-xs text-[#8A879A]">
                  {selectedRow.position} • {selectedRow.company}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold text-[#2E2A4A]">ไฟล์หลักฐาน</p>
                {selectedRow.evidenceFiles.length > 0 ? (
                  <ul className="space-y-2">
                    {selectedRow.evidenceFiles.map((file, idx) => {
                      const url = fileUrls[file.path];
                      return (
                        <li key={idx}>
                          <a
                            href={url ?? undefined}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => {
                              if (!url) e.preventDefault();
                            }}
                            className={`flex items-center gap-2 rounded-xl border border-[#E8E6F0] bg-[#FAFAFC] p-2.5 text-xs font-medium ${
                              url
                                ? "text-[#3D348B] hover:bg-[#F4F3FC] hover:underline cursor-pointer"
                                : "text-[#B5B2C2] cursor-not-allowed"
                            }`}
                          >
                            <FileText size={16} className={url ? "text-[#3D348B]" : "text-[#B5B2C2]"} />
                            <span className="truncate">{file.name}</span>
                            {loadingFiles && !url && (
                              <span className="ml-auto text-[10px] text-[#B5B2C2]">กำลังโหลดลิงก์...</span>
                            )}
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-xs text-[#B5B2C2]">ยังไม่มีไฟล์แนบ</p>
                )}
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold text-[#2E2A4A]">ประวัติการอัปเดตสถานะ</p>
                {historyLogs.length > 0 ? (
                  <div className="max-h-40 space-y-2 overflow-y-auto pr-1">
                    {historyLogs.map((log) => (
                      <div key={log.id} className="rounded-xl border border-[#EFEEFC] bg-[#FAFAFC] p-2.5 text-xs">
                        <p className="text-[#2E2A4A]">{log.note}</p>
                        <p className="mt-0.5 text-[#B5B2C2]">{new Date(log.createdAt).toLocaleString("th-TH")}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#B5B2C2]">ยังไม่มีประวัติ</p>
                )}
              </div>

              <div className="flex justify-end gap-2 border-t border-[#EFEEFC] pt-2">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => handleDecision("rejected")}
                  className="rounded-xl bg-[#FDECEC] px-4 py-2 text-xs font-semibold text-[#E94B4B] hover:bg-[#FBDCDC] disabled:opacity-50"
                >
                  ไม่อนุมัติ
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => handleDecision("approved")}
                  className="rounded-xl bg-[#1FA25C] px-4 py-2 text-xs font-semibold text-white hover:bg-[#188A4C] disabled:opacity-50"
                >
                  {isSaving ? "กำลังบันทึก..." : "อนุมัติ"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
