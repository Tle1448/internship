"use client";

// ===== Import ส่วนต่าง ๆ ที่ต้องใช้ในหน้านี้ =====
import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Clock3, Eye, FileText, FileUp, Loader2, RotateCcw, XCircle } from "lucide-react"; // ไอคอนต่าง ๆ
import StudentSidebar from "@/components/StudentSidebar"; // เมนูด้านข้างของนักศึกษา
import InternshipTabs from "@/components/InternshipTabs"; // แถบแท็บของหน้าฝึกงาน
import { useAuth } from "@/components/AuthProvider"; // hook เอาไว้ดึงข้อมูลผู้ใช้ที่ล็อกอินอยู่
import { supabase } from "@/lib/supabase"; // client เอาไว้เรียก database/storage ของ Supabase

// ===== ค่าคงที่ที่ใช้ทั้งไฟล์ =====
const BUCKET = "student-documents"; // ชื่อ storage bucket ที่เก็บไฟล์เอกสารของนักศึกษา
const MAX_FILE_SIZE = 10 * 1024 * 1024; // จำกัดขนาดไฟล์สูงสุด = 10 MB
const documentTypes = ["หนังสือตอบรับ", "หนังสือส่งตัว", "แผนการฝึกงาน", "รายงานกลางภาค", "รายงานฉบับสมบูรณ์", "เอกสารอื่น ๆ"]; // ประเภทเอกสารที่เลือกได้ตอนอัปโหลด

// ===== กำหนด type ของสถานะเอกสาร และโครงสร้างข้อมูลที่ใช้ในหน้านี้ =====
type DocumentStatus = "pending" | "needs_edit" | "approved" | "rejected"; // สถานะที่เอกสารเป็นไปได้ (รอตรวจ/ขอแก้/ผ่าน/ไม่ผ่าน)
type InternshipRecord = { id: string; company_name: string | null; position: string | null; placement_status: string; status: string }; // ข้อมูลการฝึกงาน 1 รายการของนักศึกษา
type InternshipDocument = {
  id: string; document_type: string; file_name: string; file_url: string; status: DocumentStatus;
  comment: string | null; submitted_at: string; reviewed_at: string | null;
  document_group_id: string; version: number; supersedes_id: string | null; // ใช้ group_id + version เพื่อทำระบบ "ส่งฉบับแก้ไข" (เก็บประวัติทุกเวอร์ชัน)
};

// ===== ข้อความและสีที่ใช้แสดงตามสถานะเอกสาร (ใช้ map จาก status -> label/สี) =====
const statusLabels: Record<DocumentStatus, string> = { pending: "รอตรวจ", needs_edit: "ขอแก้ไข", approved: "ผ่านแล้ว", rejected: "ไม่ผ่าน" };
const statusStyles: Record<DocumentStatus, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  needs_edit: "border-orange-200 bg-orange-50 text-orange-700",
  approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
  rejected: "border-red-200 bg-red-50 text-red-700",
};

// ดึงข้อความ error ออกมาจาก object error แบบปลอดภัย (เผื่อ error ไม่มี field message)
function errorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") return error.message;
  return fallback;
}
// แปลงวันที่ (string) ให้เป็นรูปแบบวันที่/เวลาแบบไทย
function displayDate(value: string) { return new Date(value).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" }); }
// แปลงขนาดไฟล์ (bytes) ให้อ่านง่าย เช่น "500 KB" หรือ "2.3 MB"
function formatFileSize(bytes: number) { return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`; }

export default function InternshipRecordPage() {
  // ดึงข้อมูลผู้ใช้ที่ล็อกอินอยู่ และสถานะกำลังโหลด auth หรือไม่
  const { user, loading: authLoading } = useAuth();

  // ===== State ต่าง ๆ ของหน้านี้ =====
  const [record, setRecord] = useState<InternshipRecord | null>(null); // ข้อมูลการฝึกงานของนักศึกษาคนนี้ (ถ้ามี)
  const [documents, setDocuments] = useState<InternshipDocument[]>([]); // เอกสารทั้งหมด (ทุกเวอร์ชัน) ของการฝึกงานนี้
  const [loading, setLoading] = useState(true); // สถานะกำลังโหลดข้อมูลหน้าแรก
  const [uploading, setUploading] = useState(false); // สถานะกำลังอัปโหลด/ส่งเอกสาร
  const [documentType, setDocumentType] = useState(documentTypes[0]); // ประเภทเอกสารที่เลือกอยู่ในฟอร์ม
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // ไฟล์ที่ผู้ใช้เลือกไว้ก่อนส่ง
  const [revisionTarget, setRevisionTarget] = useState<InternshipDocument | null>(null); // ถ้าไม่ใช่ null = กำลังอยู่ในโหมด "ส่งฉบับแก้ไข" ของเอกสารนี้
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null); // ข้อความแจ้งเตือนบนหน้า (สำเร็จ/ผิดพลาด)
  const fileInput = useRef<HTMLInputElement>(null); // reference ไปยัง input file (ใช้ตอนจะ reset ค่าฟอร์ม)

  // ===== ฟังก์ชันโหลดข้อมูล (การฝึกงาน + รายการเอกสาร) จาก Supabase =====
  const loadData = useCallback(async () => {
    if (!user) { setLoading(false); return; } // ถ้ายังไม่มี user (ยังไม่ล็อกอิน) ก็หยุดโหลด
    setLoading(true); setMessage(null);

    // 1) หา "การฝึกงานที่กำลังดำเนินอยู่" ของนักศึกษาคนนี้ (ต้องถูกอนุมัติสถานที่แล้ว และสถานะ = กำลังฝึกงาน)
    const { data: internship, error: recordError } = await supabase.from("internship_records")
      .select("id, company_name, position, placement_status, status").eq("student_id", user.id)
      .eq("placement_status", "approved").eq("status", "in_progress")
      .order("updated_at", { ascending: false }).limit(1).maybeSingle();

    if (recordError) { setMessage({ type: "error", text: `โหลดข้อมูลการฝึกงานไม่สำเร็จ: ${recordError.message}` }); setLoading(false); return; }

    setRecord(internship as InternshipRecord | null);

    // ถ้าไม่มีการฝึกงานที่ตรงเงื่อนไข ก็เคลียร์รายการเอกสารแล้วจบ (หน้าจะไปแสดง section "ยังส่งเอกสารไม่ได้")
    if (!internship) { setDocuments([]); setLoading(false); return; }

    // 2) ดึงรายการเอกสารทั้งหมดของการฝึกงานนี้ (ทุกเวอร์ชัน) เรียงจากส่งล่าสุดก่อน
    let documentResult = await supabase.from("student_documents")
      .select("id, document_type, file_name, file_url, status, comment, submitted_at, reviewed_at, document_group_id, version, supersedes_id")
      .eq("internship_record_id", internship.id).order("submitted_at", { ascending: false });

    // เคสพิเศษ: ถ้า error บอกว่า "object not found" (อาจเกิดจาก race condition ตอนสร้างข้อมูลใหม่ ๆ)
    // ให้รอสักครู่ (600ms) แล้วลองดึงข้อมูลใหม่อีกครั้ง
    if (documentResult.error?.message.toLowerCase().includes("object not found")) {
      await new Promise((resolve) => window.setTimeout(resolve, 600));
      documentResult = await supabase.from("student_documents")
        .select("id, document_type, file_name, file_url, status, comment, submitted_at, reviewed_at, document_group_id, version, supersedes_id")
        .eq("internship_record_id", internship.id).order("submitted_at", { ascending: false });
    }

    if (documentResult.error) setMessage({ type: "error", text: `โหลดรายการเอกสารไม่สำเร็จ: ${documentResult.error.message}` });
    setDocuments((documentResult.data ?? []) as InternshipDocument[]);
    setLoading(false);
  }, [user]);

  // เรียก loadData ทันทีที่ auth โหลดเสร็จ (หรือเมื่อ user เปลี่ยน)
  useEffect(() => { if (!authLoading) void loadData(); }, [authLoading, loadData]);

  // ===== คำนวณ "เอกสารเวอร์ชันล่าสุด" ของแต่ละกลุ่มเอกสาร (document_group_id) =====
  // เอกสาร 1 ประเภทอาจมีหลายเวอร์ชัน (เพราะมีการส่งแก้ไข) แต่หน้ารายการจะโชว์แค่เวอร์ชันล่าสุดของแต่ละกลุ่ม
  const latestDocuments = useMemo(() => {
    const latest = new Map<string, InternshipDocument>(); // key = group_id, value = เอกสารเวอร์ชันสูงสุดของกลุ่มนั้น
    for (const document of documents) {
      const current = latest.get(document.document_group_id);
      if (!current || document.version > current.version) latest.set(document.document_group_id, document); // เก็บเฉพาะเวอร์ชันที่มากกว่า
    }
    // เรียงผลลัพธ์จากส่งล่าสุดไปเก่าสุด
    return [...latest.values()].sort((a, b) => b.submitted_at.localeCompare(a.submitted_at));
  }, [documents]);

  // ===== เมื่อผู้ใช้เลือกไฟล์จาก input =====
  function selectFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setMessage(null);
    if (!file) { setSelectedFile(null); return; }

    // ตรวจสอบนามสกุลไฟล์ ต้องเป็นหนึ่งในที่กำหนดไว้เท่านั้น
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!extension || !["pdf", "doc", "docx", "png", "jpg", "jpeg", "webp"].includes(extension)) {
      setSelectedFile(null); event.target.value = ""; // เคลียร์ค่า input ด้วย เพราะไฟล์ไม่ผ่านเงื่อนไข
      setMessage({ type: "error", text: "รองรับเฉพาะ PDF, DOC, DOCX, PNG, JPG และ WEBP" }); return;
    }

    // ตรวจสอบขนาดไฟล์ ต้องไม่เกิน MAX_FILE_SIZE
    if (file.size > MAX_FILE_SIZE) {
      setSelectedFile(null); event.target.value = "";
      setMessage({ type: "error", text: "ไฟล์ต้องมีขนาดไม่เกิน 10 MB" }); return;
    }

    setSelectedFile(file); // ไฟล์ผ่านเงื่อนไขทั้งหมด เก็บไว้รอกดส่ง
  }

  // ===== เข้าสู่โหมด "ส่งฉบับแก้ไข" สำหรับเอกสารที่อาจารย์ขอให้แก้ =====
  function beginRevision(document: InternshipDocument) {
    setRevisionTarget(document); // จำไว้ว่ากำลังแก้เอกสารตัวไหน (จะใช้ group_id + version เดิมต่อ)
    setDocumentType(document.document_type); // ล็อกประเภทเอกสารให้ตรงกับของเดิม
    setSelectedFile(null); setMessage(null);
    window.scrollTo({ top: 0, behavior: "smooth" }); // เลื่อนหน้าจอขึ้นไปที่ฟอร์มด้านบน ให้ผู้ใช้เห็นฟอร์มส่งไฟล์
  }
  // ===== ยกเลิกโหมดแก้ไข กลับสู่สถานะฟอร์มปกติ =====
  function cancelRevision() {
    setRevisionTarget(null); setSelectedFile(null); setDocumentType(documentTypes[0]);
    if (fileInput.current) fileInput.current.value = ""; // เคลียร์ค่า input file ด้วย (state อย่างเดียวไม่พอ เพราะ input เป็น uncontrolled)
  }

  // ===== ส่งเอกสาร (ทั้งกรณีส่งใหม่ และกรณีส่งฉบับแก้ไข) =====
  async function submitDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); // กันไม่ให้ฟอร์ม submit แบบปกติ (reload หน้า)

    if (!user || !record || !selectedFile) { setMessage({ type: "error", text: "กรุณาเลือกประเภทและไฟล์เอกสาร" }); return; }
    setUploading(true); setMessage(null);

    // ถ้าเป็นการส่งแก้ไข ใช้ group_id เดิม, ถ้าเป็นเอกสารใหม่สร้าง group_id ใหม่ด้วย UUID
    const groupId = revisionTarget?.document_group_id ?? crypto.randomUUID();
    // เวอร์ชันของเอกสาร: ถ้าส่งแก้ไขให้ +1 จากของเดิม, ถ้าส่งใหม่เริ่มที่ 1
    const version = revisionTarget ? revisionTarget.version + 1 : 1;
    // ทำชื่อไฟล์ให้ปลอดภัยสำหรับใช้เป็นส่วนหนึ่งของ path (ตัดอักขระที่ไม่ใช่ a-z, A-Z, 0-9, ., _, - ออก)
    const safeName = selectedFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    // สร้าง path สำหรับเก็บไฟล์ใน storage แยกตาม user/การฝึกงาน/กลุ่มเอกสาร/เวอร์ชัน
    const path = `${user.id}/internship-documents/${record.id}/${groupId}/v${version}_${Date.now()}_${safeName}`;

    try {
      // 1) อัปโหลดไฟล์ขึ้น Supabase Storage ก่อน (upsert: false = ห้ามทับไฟล์เดิมถ้ามี path ซ้ำ)
      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, selectedFile, { upsert: false });
      if (uploadError) throw uploadError;

      // 2) บันทึกข้อมูลเอกสารลงตาราง student_documents
      const { error: insertError } = await supabase.from("student_documents").insert({
        student_id: user.id, internship_record_id: record.id, document_type: documentType,
        file_name: selectedFile.name, file_url: path, status: "pending", document_group_id: groupId,
        version, supersedes_id: revisionTarget?.id ?? null, // เก็บ id ของเวอร์ชันก่อนหน้า ถ้าเป็นการส่งแก้ไข
      });

      // ถ้า insert ข้อมูลลง DB ไม่สำเร็จ ให้ลบไฟล์ที่อัปโหลดไปแล้วออกด้วย (กัน storage มีไฟล์กำพร้าที่ไม่มีข้อมูลอ้างอิง)
      if (insertError) { await supabase.storage.from(BUCKET).remove([path]); throw insertError; }

      // แสดงข้อความสำเร็จ (ข้อความจะต่างกันเล็กน้อยระหว่างส่งใหม่ กับส่งฉบับแก้ไข)
      setMessage({ type: "success", text: revisionTarget ? `ส่ง ${documentType} เวอร์ชัน ${version} ให้อาจารย์ตรวจแล้ว` : `ส่ง ${documentType} ให้อาจารย์ตรวจแล้ว` });
      cancelRevision(); // เคลียร์ฟอร์มกลับสู่สถานะปกติ
      await loadData(); // โหลดข้อมูลใหม่เพื่อให้รายการเอกสารอัปเดต
    } catch (error) {
      setMessage({ type: "error", text: errorMessage(error, "ส่งเอกสารไม่สำเร็จ กรุณาลองอีกครั้ง") });
    } finally {
      setUploading(false);
    }
  }

  // ===== เปิดดูไฟล์เอกสาร โดยขอ signed URL ชั่วคราวจาก Supabase Storage (มีอายุ 30 นาที) =====
  async function openDocument(document: InternshipDocument) {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(document.file_url, 60 * 30); // 60*30 วินาที = 30 นาที
    if (error || !data?.signedUrl) { setMessage({ type: "error", text: error?.message ?? "เปิดเอกสารไม่สำเร็จ" }); return; }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer"); // เปิดไฟล์ในแท็บใหม่
  }

  // ===== ระหว่างโหลดข้อมูลหน้าแรก แสดงแค่ spinner กลางจอ =====
  if (loading) return <div className="flex min-h-screen items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-[#3D348B]" /></div>;

  return <div className="flex min-h-screen bg-slate-50 text-slate-800">
    <StudentSidebar /> {/* เมนูด้านข้างของนักศึกษา */}
    <main className="min-w-0 flex-1 px-4 py-6 md:px-8"><div className="mx-auto max-w-5xl space-y-6">
      <InternshipTabs /> {/* แท็บเมนูของหน้าฝึกงาน (เพื่อสลับไปหน้าอื่น ๆ) */}
      <header><h1 className="text-2xl font-bold text-slate-900">เอกสารฝึกงาน</h1><p className="mt-1 text-sm text-slate-500">ส่งเอกสาร ติดตามผลตรวจ และส่งฉบับแก้ไขให้อาจารย์ที่ปรึกษา</p></header>

      {/* กล่องข้อความแจ้งเตือน แสดงเมื่อมีการตั้งค่า message (สีเขียว = success, สีแดง = error) */}
      {message && <p role="status" className={`rounded-lg border px-4 py-3 text-sm ${message.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-700"}`}>{message.text}</p>}

      {/* ถ้ายังไม่มี record (การฝึกงานยังไม่ถูกอนุมัติ/ยังไม่เริ่ม) ให้แสดงข้อความแจ้งว่ายังส่งเอกสารไม่ได้ */}
      {!record ? <section className="rounded-lg border border-slate-200 bg-white p-8 text-center"><Clock3 className="mx-auto text-slate-300" size={32} /><h2 className="mt-3 font-semibold text-slate-800">ยังไม่สามารถส่งเอกสารฝึกงานได้</h2><p className="mt-1 text-sm text-slate-500">ระบบจะเปิดส่วนนี้หลัง Coordinator ยืนยันสถานที่ฝึกงานแล้ว</p></section> : <>

        {/* ===== ส่วนฟอร์มส่งเอกสาร (ใช้ฟอร์มเดียวกันทั้งกรณีส่งใหม่ และส่งฉบับแก้ไข) ===== */}
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div>
              {/* หัวข้อฟอร์มเปลี่ยนข้อความตามว่ากำลังอยู่โหมดแก้ไขหรือไม่ */}
              <h2 className="font-bold text-slate-900">{revisionTarget ? "ส่งเอกสารฉบับแก้ไข" : "ส่งเอกสารให้อาจารย์ตรวจ"}</h2>
              <p className="mt-1 text-sm text-slate-500">{record.position || "ตำแหน่งฝึกงาน"} · {record.company_name || "สถานประกอบการ"}</p>
            </div>
            {/* ปุ่มยกเลิกการแก้ไข จะแสดงเฉพาะตอนอยู่ในโหมดแก้ไขเท่านั้น */}
            {revisionTarget && <button type="button" onClick={cancelRevision} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600"><XCircle size={16} />ยกเลิกการแก้ไข</button>}
          </div>

          <form onSubmit={submitDocument} className="grid gap-4 md:grid-cols-[260px_minmax(0,1fr)_auto] md:items-end">
            {/* dropdown เลือกประเภทเอกสาร - ถ้ากำลังแก้ไขอยู่ (revisionTarget) จะ disable ไว้ ห้ามเปลี่ยนประเภท */}
            <label className="text-sm font-semibold text-slate-700">ประเภทเอกสาร
              <select value={documentType} disabled={Boolean(revisionTarget)} onChange={(event) => setDocumentType(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 font-normal disabled:bg-slate-100">
                {documentTypes.map((type) => <option key={type}>{type}</option>)}
              </select>
            </label>

            {/* ส่วนเลือกไฟล์: ซ่อน input file จริง (sr-only) แล้วใช้ label ที่ตกแต่งสวยงามแทนปุ่มเลือกไฟล์ */}
            <div>
              <p className="text-sm font-semibold text-slate-700">ไฟล์เอกสาร</p>
              <input ref={fileInput} id="internship-document-file" type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp" onChange={selectFile} className="sr-only" />
              <label htmlFor="internship-document-file" className="mt-2 flex h-11 cursor-pointer items-center justify-between gap-3 rounded-lg border border-slate-300 px-3 text-sm hover:bg-slate-50">
                <span className="inline-flex items-center gap-2 font-semibold text-[#3D348B]"><FileUp size={16} />เลือกไฟล์</span>
                {/* ถ้ามีไฟล์ที่เลือกแล้ว แสดงชื่อไฟล์ + ขนาดไฟล์ ถ้ายังไม่มีแสดงข้อความบอกว่ายังไม่ได้เลือก */}
                <span className="min-w-0 truncate text-slate-500">{selectedFile ? `${selectedFile.name} · ${formatFileSize(selectedFile.size)}` : "ยังไม่ได้เลือกไฟล์"}</span>
              </label>
            </div>

            {/* ปุ่มส่งเอกสาร: กดไม่ได้ถ้ายังไม่เลือกไฟล์ หรือกำลังอัปโหลดอยู่ / ข้อความปุ่มเปลี่ยนตามสถานะ (กำลังส่ง/ส่งใหม่/ส่งฉบับแก้ไข) */}
            <button type="submit" disabled={!selectedFile || uploading} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#3D348B] px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
              {uploading ? <Loader2 className="animate-spin" size={17} /> : <FileUp size={17} />}
              {uploading ? "กำลังส่ง..." : revisionTarget ? `ส่งเวอร์ชัน ${revisionTarget.version + 1}` : "ส่งตรวจ"}
            </button>
          </form>
          <p className="mt-3 text-xs text-slate-400">รองรับ PDF, DOC, DOCX, PNG, JPG และ WEBP ขนาดไม่เกิน 10 MB</p>
        </section>

        {/* ===== ส่วนแสดงรายการเอกสารที่เคยส่งไปแล้ว (แสดงเฉพาะเวอร์ชันล่าสุดของแต่ละกลุ่ม) ===== */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <div><h2 className="text-lg font-bold text-slate-900">รายการเอกสาร</h2><p className="text-sm text-slate-500">แสดงฉบับล่าสุดของเอกสารแต่ละรายการ</p></div>
            <span className="text-sm font-medium text-slate-500">{latestDocuments.length} รายการ</span>
          </div>

          {/* ถ้ายังไม่มีเอกสารที่ส่งเลย แสดง empty state */}
          {latestDocuments.length === 0 ? <div className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-12 text-center"><FileText className="mx-auto text-slate-300" size={32} /><p className="mt-3 text-sm font-medium text-slate-600">ยังไม่มีเอกสารที่ส่งตรวจ</p></div> : <div className="space-y-3">
            {latestDocuments.map((document) => {
              // ดึงทุกเวอร์ชันของเอกสารกลุ่มนี้ (จาก documents ทั้งหมด) มาเรียงจากเวอร์ชันล่าสุดไปเก่าสุด เพื่อไว้แสดงในส่วน "ดูประวัติ"
              const versions = documents.filter((item) => item.document_group_id === document.document_group_id).sort((a, b) => b.version - a.version);

              return <article key={document.id} className="rounded-lg border border-slate-200 bg-white p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    {/* ชื่อประเภทเอกสาร + ป้ายสถานะ (สีตาม statusStyles) */}
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-slate-900">{document.document_type}</h3>
                      <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyles[document.status]}`}>{statusLabels[document.status]}</span>
                    </div>
                    <p className="mt-2 truncate text-sm text-slate-600">{document.file_name}</p>
                    <p className="mt-1 text-xs text-slate-400">เวอร์ชัน {document.version} · ส่งเมื่อ {displayDate(document.submitted_at)}</p>
                    {/* ถ้าอาจารย์คอมเมนต์ไว้ ให้แสดงคอมเมนต์นั้น (สีส้มถ้าสถานะ needs_edit เพื่อเน้นให้เห็นชัด) */}
                    {document.comment && <p className={`mt-3 rounded-lg px-3 py-2 text-sm ${document.status === "needs_edit" ? "bg-orange-50 text-orange-800" : "bg-slate-50 text-slate-700"}`}><strong>ความคิดเห็นอาจารย์:</strong> {document.comment}</p>}
                  </div>

                  <div className="flex shrink-0 gap-2">
                    {/* ปุ่มดูไฟล์: เรียก openDocument เพื่อขอ signed URL แล้วเปิดแท็บใหม่ */}
                    <button type="button" onClick={() => void openDocument(document)} className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-700"><Eye size={15} />ดูไฟล์</button>
                    {/* ถ้าสถานะเป็น "ขอแก้ไข" ให้แสดงปุ่มส่งฉบับแก้ไข */}
                    {document.status === "needs_edit" && <button type="button" onClick={() => beginRevision(document)} className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#3D348B] px-3 text-sm font-semibold text-white"><RotateCcw size={15} />ส่งฉบับแก้ไข</button>}
                    {/* ถ้าผ่านการตรวจแล้ว แสดงไอคอนติ๊กถูกสีเขียว */}
                    {document.status === "approved" && <CheckCircle2 className="mt-1 text-emerald-600" aria-label="ผ่านการตรวจแล้ว" />}
                  </div>
                </div>

                {/* ถ้ามีมากกว่า 1 เวอร์ชัน แสดง dropdown "ดูประวัติ" ให้กดดูเวอร์ชันเก่า ๆ ได้ */}
                {versions.length > 1 && <details className="mt-4 border-t border-slate-100 pt-3">
                  <summary className="cursor-pointer text-xs font-semibold text-[#3D348B]">ดูประวัติ {versions.length} เวอร์ชัน</summary>
                  <div className="mt-2 space-y-2">
                    {versions.map((version) => <button key={version.id} type="button" onClick={() => void openDocument(version)} className="flex w-full items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-left text-xs text-slate-600">
                      <span>เวอร์ชัน {version.version} · {version.file_name}</span>
                      <span>{statusLabels[version.status]}</span>
                    </button>)}
                  </div>
                </details>}
              </article>;
            })}
          </div>}
        </section>
      </>}
    </div></main>
  </div>;
}
