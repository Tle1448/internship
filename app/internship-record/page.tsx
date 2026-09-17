"use client";

import { useState, useRef, type DragEvent, type ChangeEvent } from "react";

// ---------- Types ----------
type ApplicationStatus = "pending" | "signed";

interface Application {
  id: string;
  studentName: string;
  studentId: string;
  position: string;
  company: string;
  status: ApplicationStatus;
  primaryActionLabel: string;
}

// ---------- Mock data (สลับเป็นข้อมูลจริงจาก API ได้ภายหลัง) ----------
const applications: Application[] = [
  {
    id: "1",
    studentName: "กัญญาภัทร ศรีสุนทร",
    studentId: "6410521098",
    position: "Frontend Developer",
    company: "บจก. เทค อินโนเวชั่น",
    status: "pending",
    primaryActionLabel: "ตรวจสอบหลักฐานที่อัปโหลด",
  },
  {
    id: "2",
    studentName: "สมชาย ใจดี",
    studentId: "6410423012",
    position: "Data Analyst",
    company: "ธนาคารไทยพัฒนา",
    status: "signed",
    primaryActionLabel: "อัปเดตสถานะแจ้งอาจารย์",
  },
];

const stats = [
  {
    label: "รอตรวจสอบ",
    value: "12",
    tag: "Urgent",
    tagColor: "bg-orange-100 text-orange-600",
    sub: "ใบสมัครใหม่",
    valueColor: "text-slate-900",
  },
  {
    label: "รออนุมัติบริษัท",
    value: "05",
    tag: "แห่ง",
    tagColor: "bg-slate-100 text-slate-500",
    sub: "รอการตอบรับ",
    valueColor: "text-slate-900",
  },
  {
    label: "จับคู่สำเร็จแล้ว",
    value: "84",
    tag: "คน",
    tagColor: "bg-emerald-100 text-emerald-600",
    sub: "เสร็จสมบูรณ์",
    valueColor: "text-emerald-600",
  },
];

// ---------- Icons (inline SVG, ไม่ต้องพึ่ง dependency เพิ่ม) ----------
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

// ---------- Small building blocks ----------
function StatusBadge({ status }: { status: ApplicationStatus }) {
  if (status === "signed") {
    return (
      <span className="whitespace-nowrap rounded-full bg-violet-100 px-3 py-1 text-xs font-medium text-violet-700">
        ลงนามรับรองแล้ว
      </span>
    );
  }
  return (
    <span className="whitespace-nowrap rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-600">
      รอตรวจสอบ
    </span>
  );
}

function ApplicationCard({ app }: { app: Application }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-slate-900">{app.studentName}</p>
          <p className="text-xs text-slate-400">{app.studentId}</p>
        </div>
        <StatusBadge status={app.status} />
      </div>

      <p className="mt-2 text-sm text-slate-500">
        ตำแหน่ง: {app.position} • {app.company}
      </p>

      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          className="flex-1 rounded-xl bg-indigo-900 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-800"
        >
          {app.primaryActionLabel}
        </button>
        {app.status === "pending" && (
          <button
            type="button"
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            รายละเอียด
          </button>
        )}
      </div>
    </div>
  );
}

// ---------- Main page ----------
export default function InternshipRecordPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadedFiles((prev) => [...prev, ...Array.from(files)]);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    addFiles(e.target.files);
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6">
        {/* Stat cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-sm text-slate-500">{s.label}</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className={`text-3xl font-semibold ${s.valueColor}`}>{s.value}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.tagColor}`}>{s.tag}</span>
              </div>
              <p className="mt-1 text-xs text-slate-400">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Upload section */}
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
              ลากและวางไฟล์ที่นี่ หรือ{" "}
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="font-medium text-indigo-700 underline underline-offset-2 hover:text-indigo-800"
              >
                เลือกไฟล์
              </button>
            </p>
            <p className="mt-1 text-xs text-slate-400">เอกสารรับรองการฝึกงาน เรซูเม่ หรือ ทรานสคริปต์</p>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept=".pdf,.png"
              className="hidden"
              onChange={handleFileInput}
            />
          </div>

          {uploadedFiles.length > 0 && (
            <ul className="mt-4 space-y-2">
              {uploadedFiles.map((file, index) => (
                <li
                  key={`${file.name}-${index}`}
                  className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-sm"
                >
                  <span className="flex items-center gap-2 text-slate-700">
                    <FileIcon className="h-4 w-4 text-slate-400" />
                    {file.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="text-xs text-slate-400 hover:text-red-500"
                  >
                    ลบ
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Advisor feedback */}
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

        {/* Applications list */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">รายการใบสมัครล่าสุด</h2>
            <button type="button" className="text-sm font-medium text-indigo-700 hover:text-indigo-800">
              ดูทั้งหมด
            </button>
          </div>
          <div className="space-y-3">
            {applications.map((app) => (
              <ApplicationCard key={app.id} app={app} />
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="pt-4 text-center text-xs text-slate-400">
          <p>ระบบบริหารจัดการสหกิจศึกษา มหาวิทยาลัยวลัยลักษณ์</p>
          <p>v2.4.0 (Co-op Edu Portal)</p>
        </footer>
      </main>
    </div>
  );
}
