"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Student } from "../../data";
import { type WeeklyRecord } from "../../detail-data";
import AdvisorShell, { StudentSummary } from "../../components/AdvisorShell";
import Icon from "../../components/Icon";
import { supabase } from "@/lib/supabase";

type RecordFilter = "all" | WeeklyRecord["status"];

const statusCopy = {
  approved: "อนุมัติแล้ว",
  pending: "รออาจารย์ลงนามนิเทศ",
  upcoming: "ยังไม่ถึงกำหนดส่ง",
} as const;

const TOTAL_WEEKS = 16; // จำนวนสัปดาห์ทั้งหมดของการฝึกงาน (ปรับได้ตามหลักสูตรจริง)

interface InternshipRecordInfo {
  companyName: string | null;
  position: string | null;
  status: string | null;
  evidenceFiles: string[]; // เก็บเป็น public URL เต็มๆ
}

// ดึงชื่อไฟล์ที่อ่านง่ายออกมาจาก public URL
function fileNameFromUrl(url: string) {
  try {
    const parts = url.split("/");
    const last = parts[parts.length - 1];
    return decodeURIComponent(last.replace(/^\d+_/, ""));
  } catch {
    return url;
  }
}

const recordStatusCopy: Record<string, { label: string; className: string }> = {
  in_progress: { label: "กำลังฝึกงาน", className: "bg-indigo-100 text-indigo-800 border border-indigo-200" },
  approved: { label: "อนุมัติแล้ว", className: "bg-emerald-100 text-emerald-800 border border-emerald-200" },
  pending: { label: "รออนุมัติ", className: "bg-amber-100 text-amber-800 border border-amber-200" },
  completed: { label: "ฝึกงานเสร็จสิ้น", className: "bg-slate-200 text-slate-700 border border-slate-300" },
};

export default function StudentProgress({ student, embedded = false }: { student: Student; embedded?: boolean }) {
  // ตั้งค่าเริ่มต้นเป็นอาเรย์ว่าง (โล่งสนิท ไม่มีข้อมูลแสดงผลจนกว่าจะดึงจากฐานข้อมูลจริง)
  const [records, setRecords] = useState<WeeklyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<RecordFilter>("all");
  const [showAll, setShowAll] = useState(false);
  const [openWeeks, setOpenWeeks] = useState<number[]>([]);
  const [selected, setSelected] = useState<WeeklyRecord | null>(null);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [savedNotes, setSavedNotes] = useState<string[]>([]);
  const dialog = useRef<HTMLDialogElement>(null);

  // ---------------------------------------------------------------------
  // ข้อมูล internship_records: ไฟล์หลักฐานที่อัปโหลด + สถานะการฝึกงาน
  // ---------------------------------------------------------------------
  const [recordInfo, setRecordInfo] = useState<InternshipRecordInfo | null>(null);
  const [recordInfoLoading, setRecordInfoLoading] = useState(true);

  useEffect(() => {
    fetchWeeklyDataFromSupabase();
    fetchInternshipRecord();
  }, [student.id]);

  async function fetchWeeklyDataFromSupabase() {
    setLoading(true);
    try {
      // ดึงข้อมูลจริงจากตาราง progress_updates ของนักศึกษานี้
      const { data: updates, error } = await supabase
        .from("progress_updates")
        .select("*")
        .eq("student_id", student.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (updates && updates.length > 0) {
        const mappedRecords: WeeklyRecord[] = updates.map((u: any, index: number) => {
          // ดึงหมายเลขสัปดาห์จากข้อความโน้ต เช่น [สัปดาห์ที่ 8] หรือใช้ค่ารัน
          const weekMatch = u.note?.match(/\[สัปดาห์ที่\s*(\d+)\]/);
          const weekNum = weekMatch ? parseInt(weekMatch[1], 10) : u.week_number || index + 1;

          return {
            id: u.id,
            week: weekNum,
            title: u.title || u.note.split(":")[0]?.replace(/\[.*?\]/, "").trim() || `บันทึกการปฏิบัติงานสัปดาห์ที่ ${weekNum}`,
            content: u.content || u.note,
            date: new Date(u.created_at || Date.now()).toLocaleDateString("th-TH", { year: 'numeric', month: 'short', day: 'numeric' }),
            status: (u.status === "approved" ? "approved" : "pending") as WeeklyRecord["status"],
            comment: u.advisor_feedback || u.comment,
          };
        });

        setRecords(mappedRecords);
      } else {
        setRecords([]); // หากไม่มีข้อมูลในฐานข้อมูล ให้เป็นอาเรย์ว่าง (โล่ง)
      }
    } catch (err) {
      console.error("โหลดข้อมูลจาก Supabase ไม่สำเร็จ:", err);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }

  // ดึงข้อมูล internship_records (ไฟล์หลักฐาน + สถานะการฝึกงาน) ของนักศึกษาคนนี้
  async function fetchInternshipRecord() {
    setRecordInfoLoading(true);
    try {
      const { data, error } = await supabase
        .from("internship_records")
        .select("*")
        .eq("student_id", student.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setRecordInfo({
          companyName: data.company_name ?? null,
          position: data.position ?? null,
          status: data.status ?? null,
          evidenceFiles: data.evidence_files ?? [],
        });
      } else {
        setRecordInfo(null);
      }
    } catch (err) {
      console.error("โหลด internship_records ไม่สำเร็จ:", err);
      setRecordInfo(null);
    } finally {
      setRecordInfoLoading(false);
    }
  }

  const filtered = records.filter((record) => filter === "all" || record.status === filter);
  const visible = filtered;

  // สัปดาห์ปัจจุบัน = จำนวนบันทึกรายสัปดาห์ที่นักศึกษาส่งมาจริง (อัปมา 1 ครั้ง = สัปดาห์ที่ 1)
  // ใช้เลขสัปดาห์สูงสุดที่เจอในบันทึก แทนการนับจำนวนแถวเฉยๆ เผื่อ นศ. ข้ามส่งไม่เรียงลำดับ
  const currentWeek = records.length > 0 ? Math.max(...records.map((r) => r.week)) : 0;

  function toggleWeek(week: number) {
    setOpenWeeks((current) => current.includes(week) ? current.filter((item) => item !== week) : [...current, week]);
  }

  async function approve(week: number) {
    try {
      const targetRecord = records.find((r) => r.week === week);
      
      // อัปเดตสถานะใน Supabase หากมี id
      if ((targetRecord as any)?.id) {
        await supabase
          .from("progress_updates")
          .update({ 
            status: "approved", 
            advisor_feedback: "ตรวจสอบและลงนามโดยอาจารย์ที่ปรึกษาเรียบร้อยแล้ว" 
          })
          .eq("id", (targetRecord as any).id);
      }

      const next = records.map((record) => 
        record.week === week 
          ? { ...record, status: "approved" as const, comment: "ตรวจสอบและลงนามโดยอาจารย์ที่ปรึกษาเรียบร้อยแล้ว" } 
          : record
      );
      
      setRecords(next);
      setMessage(`อนุมัติและลงนามบันทึกสัปดาห์ที่ ${week} เรียบร้อยแล้ว`);
      setTimeout(() => setMessage(""), 4000);
    } catch {
      setMessage("เกิดข้อผิดพลาดในการอนุมัติ");
    }
  }

  function saveAdvisorNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!note.trim()) return;
    try {
      const next = [...savedNotes, note.trim()];
      setSavedNotes(next);
      setNote("");
      setMessage("บันทึกข้อเสนอแนะเรียบร้อยแล้ว");
      setTimeout(() => setMessage(""), 4000);
    } catch {
      setMessage("บันทึกข้อเสนอแนะไม่สำเร็จ");
    }
  }

  const tabs: { key: RecordFilter; label: string; count: number }[] = [
    { key: "all", label: "ทั้งหมด", count: records.length },
    { key: "pending", label: "รอตรวจ", count: records.filter((record) => record.status === "pending").length },
    { key: "approved", label: "อนุมัติแล้ว", count: records.filter((record) => record.status === "approved").length },
    { key: "upcoming", label: "ยังไม่ถึงกำหนด", count: records.filter((record) => record.status === "upcoming").length },
  ];

  if (loading) {
    return <div className="p-8 text-center text-sm text-slate-500">กำลังโหลดข้อมูลบันทึกประจำสัปดาห์...</div>;
  }

  const recordStatusInfo =
    (recordInfo?.status && recordStatusCopy[recordInfo.status]) ||
    { label: recordInfo?.status ?? "ไม่มีข้อมูล", className: "bg-slate-100 text-slate-600 border border-slate-200" };

  const content = (
    <>
      <div className="detail-actions progress-actions">
        <Link className="button secondary" href={`/advisor/evaluations/${student.id}/scores`}><Icon name="checklist" />ประเมินผลการฝึกงาน</Link>
        <Link className="button primary" href={`/advisor/evaluations/${student.id}`}><Icon name="file" />บันทึกการนิเทศงาน</Link>
      </div>
      {message && <p className="feedback" role="status">{message}</p>}
      <StudentSummary student={student} currentWeek={currentWeek} totalWeeks={TOTAL_WEEKS} />

      <section className="detail-card placement-card">
        <div className="placement-top">
          <span className="detail-icon"><Icon name="home" size={24} /></span>
          <div className="placement-heading">
            <h3>{recordInfo?.companyName ?? student.company}</h3>
            <h2>{recordInfo?.position ?? student.role}</h2>
            <p>
              ข้อมูลการฝึกงานของนักศึกษา — กำลังฝึกงานสัปดาห์ที่ {currentWeek}/{TOTAL_WEEKS}
            </p>
          </div>
        </div>
      </section>

      {/* การ์ดข้อมูล internship_records: สถานะ + ไฟล์หลักฐานที่อัปโหลด */}
      <section className="detail-card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Icon name="file" size={18} />
            เอกสารและสถานะการฝึกงาน
          </h2>
          <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${recordStatusInfo.className}`}>
            {recordStatusInfo.label}
          </span>
        </div>

        {recordInfoLoading ? (
          <p className="text-xs text-slate-400">กำลังโหลดข้อมูลเอกสาร...</p>
        ) : !recordInfo ? (
          <p className="text-xs text-slate-400">ยังไม่พบข้อมูลการฝึกงานของนักศึกษาคนนี้ในระบบ</p>
        ) : recordInfo.evidenceFiles.length === 0 ? (
          <p className="text-xs text-slate-400">นักศึกษายังไม่ได้อัปโหลดไฟล์หลักฐานใดๆ</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {recordInfo.evidenceFiles.map((url, idx) => (
              <a
                key={idx}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-700 hover:border-indigo-300 hover:bg-indigo-50 transition"
              >
                <Icon name="file" size={14} />
                {fileNameFromUrl(url)}
              </a>
            ))}
          </div>
        )}
      </section>

      <section className="weekly-section" aria-labelledby="weekly-title">
        <div className="weekly-heading">
          <div>
            <h2 id="weekly-title">บันทึกประจำสัปดาห์และการลงนามนิเทศ</h2>
            <p>รายการส่งบันทึกงานรายสัปดาห์และการรับรองทางวิชาการ</p>
          </div>
          <div className="detail-tabs" aria-label="กรองบันทึก">
            {tabs.map((tab) => (
              <button key={tab.key} aria-pressed={filter === tab.key} className={filter === tab.key ? "active" : ""} onClick={() => setFilter(tab.key)}>
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>

        <div className="weekly-list">
          {visible.length === 0 ? (
            <div className="detail-card text-center py-10 text-slate-400">
              <p>ยังไม่มีบันทึกประจำสัปดาห์ที่นักศึกษาสส่งมาในระบบ (รอนักศึกษากรอกและส่งข้อมูล)</p>
            </div>
          ) : (
            visible.map((record) => {
              const isOpen = openWeeks.includes(record.week);
              const badgeClass = record.status === "upcoming" ? "future" : record.status;
              return (
                <article className={`detail-card weekly-card ${isOpen ? "is-open" : ""} ${record.status === "upcoming" ? "upcoming" : ""}`} key={record.week}>
                  <button className="weekly-toggle" aria-expanded={isOpen} onClick={() => toggleWeek(record.week)}>
                    <span className="week-number">W{record.week}</span>
                    <span className="weekly-summary">
                      <strong>สัปดาห์ที่ {record.week}: {record.title}</strong>
                      <small>ส่งเมื่อ: {record.date}</small>
                    </span>
                    <span className={`badge ${badgeClass}`}>{statusCopy[record.status]}</span>
                    <span className="weekly-chevron"><Icon name="chevron" size={18} /></span>
                  </button>
                  {isOpen && (
                    <div className="weekly-details">
                      {record.content && <p className="weekly-content">{record.content}</p>}
                      {record.comment && (
                        <div className="weekly-comment">
                          <Icon name="file" size={18} />
                          <div>
                            <strong>ความเห็นของอาจารย์ที่ปรึกษา</strong>
                            <p>{record.comment}</p>
                          </div>
                        </div>
                      )}
                      <div className="weekly-footer">
                        {record.status === "pending" && (
                          <button className="approve-button" onClick={(event) => { event.stopPropagation(); approve(record.week); }}>
                            <Icon name="checklist" />อนุมัติและลงนามบันทึกประจำสัปดาห์
                          </button>
                        )}
                        <button className="button secondary" onClick={(event) => { event.stopPropagation(); setSelected(record); dialog.current?.showModal(); }}>
                          อ่านบันทึกฉบับเต็ม & ข้อเสนอแนะ
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })
          )}
        </div>
      </section>

      <section className="detail-card advisor-note">
        <h2><Icon name="file" />ข้อเสนอแนะและบันทึกด่วนของอาจารย์ที่ปรึกษา</h2>
        <p>บันทึกข้อเสนอแนะสำหรับติดตามการนิเทศนักศึกษา</p>
        <form onSubmit={saveAdvisorNote}>
          <textarea required aria-label="ข้อเสนอแนะ" placeholder="พิมพ์คำแนะนำ หรือบันทึกประเด็นเพื่อติดตามการนิเทศครั้งถัดไป..." rows={3} value={note} onChange={(event) => setNote(event.target.value)} />
          <div className="detail-actions">
            <button className="button primary" type="submit">บันทึกข้อคิดเห็นและคำแนะนำ</button>
          </div>
        </form>
        {savedNotes.map((item, index) => <p className="weekly-content" key={index}>{item}</p>)}
      </section>

      <dialog className="modal" ref={dialog} aria-label="บันทึกประจำสัปดาห์ฉบับเต็ม">
        <div className="modal-header">
          <h2>บันทึกสัปดาห์ที่ {selected?.week}</h2>
          <button className="icon-button" aria-label="ปิด" onClick={() => dialog.current?.close()}><Icon name="close" /></button>
        </div>
        <h3>{selected?.title}</h3>
        <p>{selected?.content}</p>
        {selected?.comment && <p className="weekly-comment">{selected.comment}</p>}
      </dialog>
    </>
  );

  return embedded ? content : <AdvisorShell student={student} active="progress">{content}</AdvisorShell>;
}
