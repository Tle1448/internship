"use client";

import { useEffect, useRef, useState, type DragEvent, type ChangeEvent } from "react";
import StudentSidebar from "@/components/StudentSidebar";
import { supabase } from "@/lib/supabase";
import { getCurrentStudentId } from "@/lib/currentUser"; // TODO: เปลี่ยนเป็น auth จริงทีหลัง
import InternshipTabs from "@/components/InternshipTabs";

// ---------- Types ----------
interface Application {
  id: string;              // = internship_records.id
  studentName: string;
  studentId: string;
  major: string;
  gpa: string;
  skills: string[];
  position: string;
  company: string;
  statusText: string;
  uploadedFiles: string[]; // ชื่อไฟล์ที่โชว์ (มาจาก evidence_files)
}

interface SubmittedUpdateLog {
  id: string;
  timestamp: string;
  company: string;
  position: string;
  note: string;
  filesCount: number;
}

// ---------- Icons (เดิม ไม่แก้) ----------
function UploadCloudIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M7 18a4.5 4.5 0 0 1-.5-8.97A5.5 5.5 0 0 1 17 8.5c.17 0 .33.01.5.03A4 4 0 0 1 17 16.5H7z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12 12v6m0-6 2.2 2.2M12 12l-2.2 2.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function WarningIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M12 9v4m0 3.5h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FileIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M14 3v5h5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

function CloseIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function CheckCircleIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function StatusBadge({ statusText }: { statusText: string }) {
  return (
    <span className="whitespace-nowrap rounded-full bg-violet-100 px-3 py-1 text-xs font-medium text-violet-700">
      {statusText}
    </span>
  );
}

// ดึงชื่อไฟล์ที่อ่านง่ายออกมาจาก public URL ที่เก็บไว้
function fileNameFromUrl(url: string) {
  try {
    const parts = url.split("/");
    const last = parts[parts.length - 1];
    return decodeURIComponent(last.replace(/^\d+_/, ""));
  } catch {
    return url;
  }
}

export default function InternshipRecordPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const [updateStatusText, setUpdateStatusText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedLogs, setSubmittedLogs] = useState<SubmittedUpdateLog[]>([]);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const [studentId, setStudentId] = useState<string | null>(null);
  const [recordId, setRecordId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // ---------------------------------------------------------------------
  // โหลดข้อมูลนักศึกษา + internship record จริงจาก Supabase ตอนเปิดหน้า
  // ---------------------------------------------------------------------
  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    const userId = await getCurrentStudentId();

    if (!userId) {
      console.error("ไม่พบผู้ใช้ปัจจุบัน (mock)");
      setLoading(false);
      return;
    }

    setStudentId(userId);

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (profileError) console.error("โหลดโปรไฟล์ไม่สำเร็จ:", profileError);

    const { data: record, error: recordError } = await supabase
      .from("internship_records")
      .select("*")
      .eq("student_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recordError) console.error("โหลด internship record ไม่สำเร็จ:", recordError);

    if (record) {
      setRecordId(record.id);
      setApplications([
        {
          id: record.id,
          studentName: profile?.full_name ?? "-",
          studentId: profile?.user_code ?? "-",
          major: [profile?.faculty, profile?.major].filter(Boolean).join(" • ") || "-",
          gpa: profile?.gpa ? `${profile.gpa} / 4.00` : "-",
          skills: record.skills ?? [],
          position: record.position ?? "ยังไม่ระบุตำแหน่ง",
          company: record.company_name ?? "ยังไม่ระบุบริษัท",
          statusText: record.progress_note ?? record.status ?? "in_progress",
          uploadedFiles: (record.evidence_files ?? []).map(fileNameFromUrl),
        },
      ]);
    } else {
      // นักศึกษายังไม่มี internship_records เลย (ยังไม่เคยกรอกโปรไฟล์/สกิลที่หน้า pagestudent)
      setApplications([]);
    }

    setLoading(false);
  }

  // ---------------------------------------------------------------------
  // อัปโหลดไฟล์หลักฐาน -> Supabase Storage (bucket: internship-evidence)
  // แล้วอัปเดต evidence_files ใน internship_records ทันที
  // ---------------------------------------------------------------------
  const addFilesToProfile = async (files: FileList | null) => {
    if (!files || files.length === 0 || !studentId) return;

    setUploading(true);
    setErrorBanner(null);

    try {
      let currentRecordId = recordId;

      // ถ้ายังไม่มี internship_records ของนักศึกษาคนนี้ -> สร้างใหม่ก่อน
      if (!currentRecordId) {
        const { data: newRecord, error: insertError } = await supabase
          .from("internship_records")
          .insert({ student_id: studentId, status: "in_progress" })
          .select()
          .single();

        if (insertError) throw insertError;
        currentRecordId = newRecord.id;
        setRecordId(newRecord.id);
      }

      const uploadedPaths: string[] = [];

      for (const file of Array.from(files)) {
        const filePath = `${studentId}/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("internship-evidence")
          .upload(filePath, file, { upsert: true });

        if (uploadError) throw uploadError;

        uploadedPaths.push(filePath);
      }

      // ดึง evidence_files ปัจจุบันก่อน แล้วค่อย append (กันเคส record ถูกอัปเดตที่อื่นระหว่างนี้)
      const { data: currentRecord, error: fetchError } = await supabase
        .from("internship_records")
        .select("evidence_files")
        .eq("id", currentRecordId)
        .single();

      if (fetchError) throw fetchError;

      const mergedFiles = [...(currentRecord?.evidence_files ?? []), ...uploadedPaths];

      const { error: updateError } = await supabase
        .from("internship_records")
        .update({ evidence_files: mergedFiles, updated_at: new Date().toISOString() })
        .eq("id", currentRecordId);

      if (updateError) throw updateError;

      // อัปเดต state หน้าจอ
      setApplications((prev) => {
        if (prev.length === 0) {
          return [
            {
              id: currentRecordId!,
              studentName: "-",
              studentId: "-",
              major: "-",
              gpa: "-",
              skills: [],
              position: "ยังไม่ระบุตำแหน่ง",
              company: "ยังไม่ระบุบริษัท",
              statusText: "in_progress",
              uploadedFiles: mergedFiles.map(fileNameFromUrl),
            },
          ];
        }
        return prev.map((app) => ({ ...app, uploadedFiles: mergedFiles.map(fileNameFromUrl) }));
      });
    } catch (err: any) {
      console.error("อัปโหลดไฟล์ไม่สำเร็จ:", err);
      setErrorBanner(err.message ?? "อัปโหลดไฟล์ไม่สำเร็จ");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    addFilesToProfile(e.dataTransfer.files);
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    addFilesToProfile(e.target.files);
    e.target.value = "";
  };

  const handleOpenViewModal = (app: Application) => {
    setSelectedApp(app);
    setIsViewModalOpen(true);
  };

  // อัปเดต badge ที่การ์ด (ยังไม่บันทึกลง DB — จะบันทึกจริงตอนกด "บันทึกการอัปเดต")
  const handleApplyUpdateStatus = () => {
    if (!updateStatusText.trim()) return;
    const noteToSave = updateStatusText.trim();

    setApplications((prev) => prev.map((item) => ({ ...item, statusText: noteToSave })));
    setSuccessBanner(`อัปเดต Badge บนการ์ดเป็น "${noteToSave}" เรียบร้อยแล้ว (กด "บันทึกการอัปเดต" เพื่อส่งให้อาจารย์)`);
    setUpdateStatusText("");

    setTimeout(() => setSuccessBanner(null), 4000);
  };

  // ---------------------------------------------------------------------
  // บันทึกข้อความความคืบหน้าโดยไม่เขียนทับสถานะ workflow ของการฝึกงาน
  // -> จุดนี้คือจุดที่ฝั่ง advisor จะเห็นความเคลื่อนไหว
  // ---------------------------------------------------------------------
  const handleFinalSubmitAllUpdates = async () => {
    if (applications.length === 0 || !studentId || !recordId) return;
    setIsSubmitting(true);
    setErrorBanner(null);

    try {
      const app = applications[0];

      const { error: updateError } = await supabase
        .from("internship_records")
        .update({ progress_note: app.statusText, updated_at: new Date().toISOString() })
        .eq("id", recordId);

      if (updateError) throw updateError;

      const { error: logError } = await supabase.from("progress_updates").insert({
        record_id: recordId,
        student_id: studentId,
        note: app.statusText,
      });

      if (logError) throw logError;

      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")} น.`;

      setSubmittedLogs((prev) => [
        {
          id: String(Date.now()),
          timestamp: timeStr,
          company: app.company,
          position: app.position,
          note: app.statusText,
          filesCount: app.uploadedFiles?.length || 0,
        },
        ...prev,
      ]);

      setSuccessBanner("บันทึกและส่งข้อมูลอัปเดตให้อาจารย์ที่ปรึกษาสำเร็จแล้ว!");
      setTimeout(() => setSuccessBanner(null), 5000);
    } catch (err: any) {
      console.error("บันทึกการอัปเดตไม่สำเร็จ:", err);
      setErrorBanner(err.message ?? "บันทึกการอัปเดตไม่สำเร็จ");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-sm text-slate-500">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <StudentSidebar />

      <main className="flex-1 space-y-6 px-4 py-6 md:px-8 pb-20">
        <div className="mx-auto max-w-5xl space-y-6">

          {/* แท็บสลับหน้า: อัปเดทหลักฐาน <-> บันทึกประจำสัปดาห์ */}
          <InternshipTabs />

          {successBanner && (
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 shadow-sm transition">
              <CheckCircleIcon className="h-5 w-5 shrink-0 text-emerald-600" />
              <p className="text-sm font-semibold">{successBanner}</p>
            </div>
          )}

          {errorBanner && (
            <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700 shadow-sm transition">
              <WarningIcon className="h-5 w-5 shrink-0 text-red-500" />
              <p className="text-sm font-semibold">{errorBanner}</p>
            </div>
          )}

          {applications.length === 0 && (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500">
              ยังไม่พบข้อมูลการฝึกงานของคุณ — ลองไปกรอกทักษะ/ข้อมูลโปรไฟล์ที่หน้า Dashboard ก่อน หรืออัปโหลดไฟล์ด้านล่างเพื่อเริ่มสร้างระเบียนใหม่อัตโนมัติ
            </section>
          )}

          {/* Upload Section */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">อัปโหลดหลักฐานการสมัคร</h2>
              <span className="text-xs text-slate-400">PDF, PNG สูงสุด 10MB</span>
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`mt-4 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition ${
                isDragging ? "border-indigo-400 bg-indigo-50" : "border-slate-200"
              }`}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-50 text-indigo-700">
                <UploadCloudIcon className="h-6 w-6" />
              </div>
              <p className="mt-3 text-sm text-slate-600">
                {uploading ? (
                  "กำลังอัปโหลด..."
                ) : (
                  <>
                    ลากและวางไฟล์ที่นี่ หรือ{" "}
                    <button
                      type="button"
                      onClick={() => inputRef.current?.click()}
                      className="font-medium text-indigo-700 underline underline-offset-2 hover:text-indigo-800 cursor-pointer"
                    >
                      เลือกไฟล์
                    </button>
                  </>
                )}
              </p>
              <p className="mt-1 text-xs text-slate-400">เอกสารรับรองการฝึกงาน เรซูเม่ หรือ ทรานสคริปต์</p>
              <input
                ref={inputRef}
                type="file"
                multiple
                accept=".pdf,.png"
                className="hidden"
                onChange={handleFileInput}
                disabled={uploading}
              />
            </div>
          </section>

          {/* Advisor Feedback Alert (ยัง hardcode ไว้ก่อน — ถ้าต้องการของจริง ต้องมีตาราง feedback แยก) */}
          <section className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <WarningIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-800">Feedback ล่าสุดจาก advisor</p>
              <p className="mt-1 text-sm text-amber-900">
                &ldquo;โปรดตรวจสอบรายละเอียดเอกสารสัญญาฝึกงานฉบับล่าสุด และให้อาจารย์ที่ปรึกษาลงนามก่อนวันที่ 25 มิ.ย.&rdquo;
              </p>
              <div className="mt-2 flex items-center justify-between text-xs text-amber-700">
                <span>โดย อ.ดร. มานะ (Advisor)</span>
                <span>19 มิ.ย. 2568</span>
              </div>
            </div>
          </section>

          {/* ตรวจสอบเอกสาร List Section */}
          {applications.length > 0 && (
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900">ตรวจสอบเอกสาร</h2>
              </div>

              <div className="space-y-4">
                {applications.map((app) => {
                  const hasFiles = app.uploadedFiles && app.uploadedFiles.length > 0;

                  return (
                    <div key={app.id} className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 space-y-3">

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-slate-900 text-sm">{app.studentName}</p>
                            <span className="text-[11px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium border border-emerald-200">
                              ผ่านการตรวจสอบสมรรถนะแล้ว ✓
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{app.major}</p>
                          <p className="text-xs text-slate-400">รหัสนักศึกษา: {app.studentId}</p>
                        </div>

                        <div className="flex items-center gap-3 self-start sm:self-center">
                          <div className="text-right">
                            <p className="text-xs text-slate-400">เกรดเฉลี่ย</p>
                            <p className="text-sm font-bold text-slate-800">{app.gpa}</p>
                          </div>
                          <StatusBadge statusText={app.statusText} />
                        </div>
                      </div>

                      <div>
                        <p className="text-[11px] text-slate-400 mb-1.5 font-medium">ทักษะและความสามารถ (Skills):</p>
                        <div className="flex flex-wrap gap-1.5">
                          {app.skills.length === 0 && (
                            <span className="text-xs text-slate-400">ยังไม่มีข้อมูลทักษะ</span>
                          )}
                          {app.skills.map((skill, sIdx) => (
                            <span key={sIdx} className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="pt-1">
                        <p className="text-sm font-semibold text-slate-800">
                          ตำแหน่ง: {app.position} • {app.company}
                        </p>
                      </div>

                      {!hasFiles ? (
                        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
                          <FileIcon className="h-6 w-6 text-slate-300 mb-1" />
                          <p className="text-xs font-medium text-slate-500">ยังไม่มีรายการอัปโหลดหลักฐาน</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">โปรดอัปโหลดเอกสารที่ส่วนด้านบน</p>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {app.uploadedFiles?.map((file, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-700">
                              <FileIcon className="h-3.5 w-3.5 text-indigo-600" />
                              <span>{file}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => handleOpenViewModal(app)}
                          className="w-full rounded-xl bg-indigo-900 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-800 cursor-pointer"
                        >
                          ดูหลักฐานที่อัปโหลด ({app.uploadedFiles?.length || 0} ไฟล์)
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ช่องพิมพ์อัปเดตสถานะ */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">พิมพ์อัปเดตสถานะแจ้งอาจารย์ที่ปรึกษา</h2>
              <button
                type="button"
                onClick={handleApplyUpdateStatus}
                disabled={!updateStatusText.trim() || applications.length === 0}
                className="rounded-full bg-violet-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                อัปเดตสถานะ
              </button>
            </div>

            <textarea
              rows={3}
              value={updateStatusText}
              onChange={(e) => setUpdateStatusText(e.target.value)}
              placeholder="พิมพ์ระบุข้อความอัปเดตสถานะที่นี่ เช่น ส่งใบสมัครแล้วนะ, ผ่านการสัมภาษณ์แล้ว..."
              className="w-full p-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </section>

          {/* สรุปข้อมูลการอัปเดต */}
          {submittedLogs.length > 0 && (
            <section className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-indigo-950 flex items-center gap-2">
                  <CheckCircleIcon className="h-4 w-4 text-emerald-600" />
                  รายการที่อัปเดตแจ้งอาจารย์แล้ว
                </h3>
                <span className="text-xs text-indigo-600">อัปเดตล่าสุดวันนี้</span>
              </div>

              <div className="space-y-2">
                {submittedLogs.map((log) => (
                  <div key={log.id} className="rounded-xl bg-white p-3 border border-indigo-100 text-xs space-y-1">
                    <div className="flex items-center justify-between font-semibold text-slate-800">
                      <span>{log.position} — {log.company}</span>
                      <span className="text-slate-400 font-normal">{log.timestamp}</span>
                    </div>
                    <p className="text-slate-600">
                      <span className="font-medium text-indigo-900">ข้อความที่แจ้ง: </span>
                      &ldquo;{log.note}&rdquo;
                    </p>
                    {log.filesCount > 0 && (
                      <p className="text-[11px] text-emerald-600 font-medium pt-0.5">
                        ✓ แนบไฟล์หลักฐานรวม {log.filesCount} ไฟล์
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ปุ่มบันทึกการอัปเดต */}
          <div className="pt-4 flex justify-end">
            <button
              type="button"
              onClick={handleFinalSubmitAllUpdates}
              disabled={isSubmitting || applications.length === 0}
              className="w-full sm:w-auto px-8 py-3 rounded-xl bg-indigo-900 text-sm font-semibold text-white shadow-lg shadow-indigo-900/20 hover:bg-indigo-800 transition active:scale-[0.99] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "กำลังบันทึกและส่งข้อมูล..." : "บันทึกการอัปเดต"}
            </button>
          </div>

        </div>
      </main>

      {/* MODAL */}
      {isViewModalOpen && selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl space-y-4">

            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">ดูหลักฐานที่อัปโหลด</h3>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-400">นักศึกษา</p>
                <p className="text-sm font-medium text-slate-800">{selectedApp.studentName} ({selectedApp.studentId})</p>
                <p className="text-xs text-slate-500">{selectedApp.position} • {selectedApp.company}</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-700 mb-2">รายการไฟล์หลักฐานในระบบทั้งหมด:</p>
                {selectedApp.uploadedFiles && selectedApp.uploadedFiles.length > 0 ? (
                  <ul className="space-y-2">
                    {selectedApp.uploadedFiles.map((file, idx) => (
                      <li key={idx} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs">
                        <span className="flex items-center gap-2 font-medium text-slate-700">
                          <FileIcon className="h-4 w-4 text-indigo-600" />
                          {file}
                        </span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">พร้อมตรวจ</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center bg-slate-50/50">
                    <p className="text-xs font-medium text-slate-500">ยังไม่มีรายการอัปโหลดหลักฐาน</p>
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsViewModalOpen(false)}
                  className="px-5 py-2 rounded-xl bg-indigo-900 text-xs font-medium text-white hover:bg-indigo-800 cursor-pointer"
                >
                  ตกลง
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
