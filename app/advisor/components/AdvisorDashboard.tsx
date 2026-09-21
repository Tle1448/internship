"use client";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { statusLabels } from "../data";
import Icon from "./Icon";
import { supabase } from "@/lib/supabase";
import { getCurrentAdvisorId } from "@/lib/currentUser"; // TODO: เปลี่ยนเป็น auth จริงทีหลัง
import "../advisor.css";
import type { AdvisorStudent as Student } from "./StudentDetailsDialog";
import StudentProgress from "./StudentProgress";
import EvaluationForm from "./EvaluationForm";
import type { Student as ProgressStudent } from "../data";

// ---------------------------------------------------------------------
// Student row shape used by this page — ตอนนี้มาจาก Supabase จริงแล้ว
// (แทนที่ mock `students` เดิมจาก ../data)
// ---------------------------------------------------------------------
type Appointment = {
  company: string;
  date: string;
  time: string;
  mode: string;
};

type FilterOption = { value: string; label: string };

function FilterSelect({ label, value, options, onChange }: {
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const menu = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value)?.label ?? options[0]?.label;

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!menu.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  return <div className={`filter-select ${open ? "is-open" : ""}`} ref={menu}>
    <button type="button" className="filter-trigger" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen(!open)}>
      <span className="filter-label">{label}</span>
      <span className="filter-value">{selected}</span>
      <Icon name="chevron" size={16} />
    </button>
    {open && <div className="filter-menu" role="listbox" aria-label={label}>
      {options.map((option) => <button type="button" role="option" aria-selected={option.value === value} className={option.value === value ? "selected" : ""} key={option.value || "all"} onClick={() => { onChange(option.value); setOpen(false); }}><span>{option.label}</span>{option.value === value && <Icon name="check" size={16} />}</button>)}
    </div>}
  </div>;
}

const menus = ["ภาพรวมและสถิติ", "ความก้าวหน้านักศึกษา", "บันทึกนิเทศและแบบประเมิน"];

export default function AdvisorDashboard() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [company, setCompany] = useState("");
  const [major, setMajor] = useState("วิศวกรรมซอฟต์แวร์");
  const [visit, setVisit] = useState("no");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [section, setSection] = useState(0);
  const [mobileMenu, setMobileMenu] = useState(false);

  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [message, setMessage] = useState("");
  const appointmentDialog = useRef<HTMLDialogElement>(null);
  const evaluationDialog = useRef<HTMLDialogElement>(null);

  // ---------------------------------------------------------------------
  // โหลดรายชื่อนักศึกษาในความดูแล + สถานะความก้าวหน้าล่าสุด จาก Supabase
  // ---------------------------------------------------------------------
  useEffect(() => {
    loadStudents();

    // Realtime: พอนักศึกษากด "บันทึกการอัปเดต" (insert progress_updates
    // หรือ update internship_records) ให้หน้านี้รีโหลดอัตโนมัติทันที
    const channel = supabase
      .channel("advisor-progress-watch")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "progress_updates" }, () => {
        loadStudents();
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "internship_records" }, () => {
        loadStudents();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadStudents() {
    setLoadingStudents(true);
    setLoadError(null);

    try {
      const advisorId = await getCurrentAdvisorId();
      if (!advisorId) throw new Error("ไม่พบผู้ใช้ปัจจุบัน (mock)");

      // 1) นักศึกษาที่อยู่ในความดูแลของอาจารย์คนนี้
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, student_code, major, faculty")
        .eq("advisor_id", advisorId)
        .eq("role", "student");

      if (profilesError) throw profilesError;
      if (!profiles || profiles.length === 0) {
        setStudents([]);
        setLoadingStudents(false);
        return;
      }

      const studentIds = profiles.map((p) => p.id);

      // 2) internship_records ล่าสุดของแต่ละคน
      const { data: records, error: recordsError } = await supabase
        .from("internship_records")
        .select("*")
        .in("student_id", studentIds)
        .order("updated_at", { ascending: false });

      if (recordsError) throw recordsError;

      const latestRecordByStudent = new Map<string, any>();
      (records ?? []).forEach((r) => {
        if (!latestRecordByStudent.has(r.student_id)) {
          latestRecordByStudent.set(r.student_id, r);
        }
      });

      // 3) progress_updates ล่าสุดของแต่ละคน (ข้อความที่ นศ. พิมพ์ตอนบันทึก)
      const { data: logs, error: logsError } = await supabase
        .from("progress_updates")
        .select("student_id, note, created_at")
        .in("student_id", studentIds)
        .order("created_at", { ascending: false });

      if (logsError) throw logsError;

      const latestLogByStudent = new Map<string, { note: string; created_at: string }>();
      (logs ?? []).forEach((l) => {
        if (!latestLogByStudent.has(l.student_id)) {
          latestLogByStudent.set(l.student_id, { note: l.note, created_at: l.created_at });
        }
      });

      // 4) ประกอบร่างเป็น Student[] ให้ตรงกับ UI เดิม
      const merged: Student[] = profiles.map((p) => {
        const record = latestRecordByStudent.get(p.id);
        const log = latestLogByStudent.get(p.id);

        return {
          id: p.student_code ?? p.id,
          authId: p.id,
          name: p.full_name ?? "-",
          major: p.major ?? "-",
          company: record?.company_name ?? "ยังไม่ระบุ",
          province: record?.province ?? "-",
          project: record?.position ?? "ยังไม่ระบุ",
          role: record?.position ?? "-",
          status: record?.status ?? "pending",
          visited: record?.visited ?? false,
          latestNote: log?.note ?? null,
          latestNoteAt: log?.created_at ?? null,
          evidenceFiles: record?.evidence_files ?? [],
        };
      });

      setStudents(merged);
    } catch (err: any) {
      console.error("โหลดข้อมูลนักศึกษาไม่สำเร็จ:", err);
      setLoadError(err.message ?? "โหลดข้อมูลนักศึกษาไม่สำเร็จ");
    } finally {
      setLoadingStudents(false);
    }
  }

  const filtered = students.filter(
    (s) =>
      (!query || `${s.id} ${s.name} ${s.company} ${s.project}`.toLowerCase().includes(query.toLowerCase())) &&
      (!status || s.status === status) &&
      (!company || s.company === company) &&
      (!major || s.major === major) &&
      (!visit || s.visited === (visit === "yes"))
  );
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pages);
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const pending = students.filter((s) => s.status === "pending").length;
  const late = students.filter((s) => s.status === "late").length;

  const reset = () => {
    setQuery("");
    setStatus("");
    setCompany("");
    setMajor("");
    setVisit("");
    setPage(1);
  };

  function saveAppointment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setAppointment({
      company: String(data.get("company")),
      date: String(data.get("date")),
      time: String(data.get("time")),
      mode: String(data.get("mode")),
    });
    appointmentDialog.current?.close();
    setMessage("เพิ่มนัดหมายแล้ว (เก็บไว้เฉพาะระหว่างเปิดหน้านี้)");
  }

  function openStudent(student: Student) {
    const detailStudent = {
      id: student.id,
      name: student.name,
      company: student.company,
      province: student.province,
      project: student.project,
      role: student.role,
      major: student.major,
      status: student.status === "approved" ? "approved" : student.status === "late" ? "late" : "pending",
      visited: student.visited,
    };
    sessionStorage.setItem(`advisor-student-${student.id}`, JSON.stringify(detailStudent));
    router.push(`/advisor/students/${student.id}`);
  }

  function formatNoteTime(iso: string | null) {
    return iso ? new Date(iso).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" }) : "";
  }

  const progressStudent = students[0] ? {
    id: students[0].id,
    name: students[0].name,
    company: students[0].company,
    province: students[0].province,
    project: students[0].project,
    role: students[0].role,
    major: students[0].major,
    status: students[0].status === "approved" ? "approved" : students[0].status === "late" ? "late" : "pending",
    visited: students[0].visited,
  } satisfies ProgressStudent : null;

  if (section === 1) {
    return <div className="advisor-app advisor-details">
      <button type="button" className="icon-button mobile-toggle" aria-controls="advisor-menu" aria-expanded={mobileMenu} onClick={() => setMobileMenu(!mobileMenu)}><Icon name="menu" />เมนูอาจารย์</button>
      <aside id="advisor-menu" className={`sidebar ${mobileMenu ? "is-open" : ""}`}>
        <div><p className="nav-label">การจัดการนิเทศ</p><nav aria-label="เมนูอาจารย์">{menus.map((menu, index) => <button key={menu} className={index === 1 ? "active" : ""} aria-current={index === 1 ? "page" : undefined} onClick={() => { setSection(index); setMobileMenu(false); }}><Icon name={index === 0 ? "dashboard" : index === 1 ? "users" : "checklist"} />{menu}</button>)}</nav></div>
        <div className="sidebar-footer"><strong>วิทยาลัยนวัตกรรมวิชาชีพ</strong><span>หน่วยสหกิจศึกษาและการฝึกงาน</span></div>
      </aside>
      <main className="main-content detail-main">
        <div className="detail-context"><button className="detail-back" aria-label="กลับหน้าภาพรวม" onClick={() => setSection(0)}><Icon name="chevron" size={20} /></button><div className="breadcrumb"><span>หน้าหลัก</span><span>›</span><strong>ความก้าวหน้านักศึกษา</strong></div></div>
        <p className="detail-demo">ข้อมูลนักศึกษาในความดูแลของคุณ</p>
        {loadingStudents ? <p className="demo-note">กำลังโหลดข้อมูลนักศึกษา...</p> : progressStudent ? <StudentProgress student={progressStudent} embedded /> : <div className="detail-card empty-state"><Icon name="users" size={32} /><strong>ยังไม่มีนักศึกษาในความดูแล</strong><p>เมื่อนักศึกษาถูกมอบหมายให้อาจารย์ หน้าความก้าวหน้าจะแสดงข้อมูลที่นี่</p></div>}
      </main>
    </div>;
  }

  if (section === 2) {
    return <div className="advisor-app advisor-details">
      <button type="button" className="icon-button mobile-toggle" aria-controls="advisor-menu" aria-expanded={mobileMenu} onClick={() => setMobileMenu(!mobileMenu)}><Icon name="menu" />เมนูอาจารย์</button>
      <aside id="advisor-menu" className={`sidebar ${mobileMenu ? "is-open" : ""}`}>
        <div><p className="nav-label">การจัดการนิเทศ</p><nav aria-label="เมนูอาจารย์">{menus.map((menu, index) => <button key={menu} className={index === 2 ? "active" : ""} aria-current={index === 2 ? "page" : undefined} onClick={() => { setSection(index); setMobileMenu(false); }}><Icon name={index === 0 ? "dashboard" : index === 1 ? "users" : "checklist"} />{menu}</button>)}</nav></div>
        <div className="sidebar-footer"><strong>วิทยาลัยนวัตกรรมวิชาชีพ</strong><span>หน่วยสหกิจศึกษาและการฝึกงาน</span></div>
      </aside>
      <main className="main-content detail-main">
        <div className="detail-context"><button className="detail-back" aria-label="กลับหน้าภาพรวม" onClick={() => setSection(0)}><Icon name="chevron" size={20} /></button><div className="breadcrumb"><span>หน้าหลัก</span><span>›</span><strong>บันทึกนิเทศและแบบประเมิน</strong></div></div>
        {loadingStudents ? <p className="demo-note">กำลังโหลดข้อมูลนักศึกษา...</p> : progressStudent ? <EvaluationForm student={progressStudent} embedded /> : <div className="detail-card empty-state"><Icon name="users" size={32} /><strong>ยังไม่มีนักศึกษาในความดูแล</strong><p>เมื่อนักศึกษาถูกมอบหมายให้อาจารย์แล้ว จะสามารถบันทึกการนิเทศและประเมินผลได้ที่นี่</p></div>}
      </main>
    </div>;
  }

  return (
    <div className="advisor-app">
      <button
        type="button"
        className="icon-button mobile-toggle"
        aria-controls="advisor-menu"
        aria-expanded={mobileMenu}
        onClick={() => setMobileMenu(!mobileMenu)}
      >
        <Icon name="menu" />
        เมนูอาจารย์
      </button>
      <aside id="advisor-menu" className={`sidebar ${mobileMenu ? "is-open" : ""}`}>
        <div>
          <p className="nav-label">การจัดการนิเทศ</p>
          <nav aria-label="เมนูอาจารย์">
            {menus.map((menu, i) => (
              <button
                key={menu}
                className={section === i ? "active" : ""}
                aria-current={section === i ? "page" : undefined}
                onClick={() => {
                  setMobileMenu(false);
                  if (i === 1) {
                    router.push("/advisor/students");
                    return;
                  }
                  if (i === 2) {
                    router.push("/advisor/evaluations");
                    return;
                  }
                  setSection(i);
                }}
              >
                <Icon name={i === 0 ? "dashboard" : i === 1 ? "users" : "checklist"} />
                {menu}
              </button>
            ))}
          </nav>
        </div>
        <div className="sidebar-footer">
          <strong>วิทยาลัยนวัตกรรมวิชาชีพ</strong>
          <span>หน่วยสหกิจศึกษาและการฝึกงาน</span>
        </div>
      </aside>

      <main className="main-content">
        <div className="breadcrumb">
          <Icon name="home" size={16} />
          <span>ภาพรวมและสถิติ</span>
        </div>

        <section className="page-heading">
          <div>
            <h1>{section === 0 ? "ภาพรวมการดูแลนักศึกษาสหกิจศึกษา" : menus[section]}</h1>
            <p>
              <Icon name="cap" />
              <span>
                ภาคเรียนที่ 1/2567 — อาจารย์ที่ปรึกษา: <strong>Adviser</strong>
              </span>
            </p>
          </div>
          <div className="heading-actions">
            <button className="button secondary" onClick={() => window.print()}>
              <Icon name="file" />
              ดาวน์โหลดรายงานสรุป (PDF)
            </button>
            <button className="button primary" onClick={() => appointmentDialog.current?.showModal()}>
              <Icon name="plus" />
              เพิ่มการนัดหมายนิเทศ
            </button>
          </div>
        </section>

        {loadError && (
          <div className="feedback" role="alert">
            <Icon name="warning" />
            โหลดข้อมูลไม่สำเร็จ: {loadError}
            <button className="icon-button" aria-label="ลองใหม่" onClick={loadStudents}>
              <Icon name="reset" size={16} />
            </button>
          </div>
        )}

        {loadingStudents ? (
          <p className="demo-note">กำลังโหลดข้อมูลนักศึกษา...</p>
        ) : (
          <p className="demo-note">ข้อมูลนักศึกษาในความดูแลของคุณ (อัปเดตแบบเรียลไทม์)</p>
        )}

        {message && (
          <div className="feedback" role="status">
            <Icon name="check" />
            {message}
            <button className="icon-button" aria-label="ปิดข้อความ" onClick={() => setMessage("")}>
              <Icon name="close" size={16} />
            </button>
          </div>
        )}

        <section className="stats" aria-label="สถิตินักศึกษา">
          {[
            { title: "นักศึกษาในความดูแล", count: students.length, icon: "users" as const, badge: "นักศึกษาทั้งหมดในภาคเรียน", kind: "all", filter: "" },
            { title: "อนุมัติสถานที่ฝึกงานแล้ว", count: students.filter((s) => s.status === "approved").length, icon: "checklist" as const, badge: "อนุมัติครบถ้วน", kind: "approved", filter: "approved" },
            { title: "รอตรวจสอบเอกสาร/คำร้อง", count: pending, icon: "calendar" as const, badge: "รอการตรวจสอบ", kind: "pending", filter: "pending" },
            { title: "บันทึกสัปดาห์ค้างส่ง", count: late, icon: "warning" as const, badge: "ต้องดำเนินการด่วน", kind: "late", filter: "late" },
          ].map((item) => (
            <button
              key={item.kind}
              className={`stat-card ${item.kind}`}
              onClick={() => {
                reset();
                setStatus(item.filter);
              }}
            >
              <span className="stat-top">
                <span>{item.title}</span>
                <span className="stat-icon">
                  <Icon name={item.icon} size={22} />
                </span>
              </span>
              <span className="stat-number">
                {item.count}
                <small>คน</small>
              </span>
              <span className={`badge ${item.kind}`}>
                {item.kind !== "all" && <Icon name={item.kind === "pending" ? "clock" : item.kind === "late" ? "warning" : "check"} size={14} />}
                {item.badge}
              </span>
            </button>
          ))}
        </section>

        {section !== 2 && (
          <>
            <section className="filter-card" aria-label="ตัวกรองนักศึกษา">
              <div className="filter-controls">
                <label className="search-field">
                  <Icon name="search" />
                  <input
                    aria-label="ค้นหารายชื่อนักศึกษา"
                    placeholder="ค้นหารายชื่อ..."
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setPage(1);
                    }}
                  />
                </label>
                <FilterSelect label="สถานะ" value={status} options={[{ value: "", label: "ทั้งหมด" }, ...Object.entries(statusLabels).map(([value, label]) => ({ value, label: label as string }))]} onChange={(value) => { setStatus(value); setPage(1); }} />
                <FilterSelect label="สถานประกอบการ" value={company} options={[{ value: "", label: "ทุกบริษัท" }, ...[...new Set(students.map((student) => student.company))].map((value) => ({ value, label: value }))]} onChange={(value) => { setCompany(value); setPage(1); }} />
                <FilterSelect label="สาขาวิชา" value={major} options={[{ value: "", label: "ทุกสาขา" }, ...[...new Set(students.map((student) => student.major))].map((value) => ({ value, label: value }))]} onChange={(value) => { setMajor(value); setPage(1); }} />
                <FilterSelect label="การนิเทศ" value={visit} options={[{ value: "", label: "ทั้งหมด" }, { value: "no", label: "ยังไม่ได้นิเทศ" }, { value: "yes", label: "นิเทศแล้ว" }]} onChange={(value) => { setVisit(value); setPage(1); }} />
              </div>
              <div className="filter-chips">
                <span>ตัวกรองที่เลือก:</span>
                {!query && !major && !visit && !status && !company && <span>ทั้งหมด</span>}
                {[
                  { value: query, label: query, clear: () => setQuery("") },
                  { value: major, label: `สาขา: ${major}`, clear: () => setMajor("") },
                  { value: visit, label: `สถานะนิเทศ: ${visit === "no" ? "ยังไม่ได้นิเทศ" : "นิเทศแล้ว"}`, clear: () => setVisit("") },
                  { value: status, label: statusLabels[status as keyof typeof statusLabels], clear: () => setStatus("") },
                  { value: company, label: company, clear: () => setCompany("") },
                ]
                  .filter((c) => c.value)
                  .map((c) => (
                    <button
                      key={c.label}
                      onClick={() => {
                        c.clear();
                        setPage(1);
                      }}
                      aria-label={`ลบตัวกรอง ${c.label}`}
                    >
                      {c.label}
                      <Icon name="close" size={13} />
                    </button>
                  ))}
                <button className="reset-button" onClick={reset}>
                  <Icon name="reset" size={17} />
                  รีเซ็ตตัวกรอง
                </button>
              </div>
            </section>
            <section className="table-card">
              <div className="table-scroll">
                <table>
                  <caption className="sr-only">รายชื่อนักศึกษาในความดูแล</caption>
                  <thead>
                    <tr>
                      <th>รหัสนักศึกษา</th>
                      <th>ชื่อ - นามสกุล</th>
                      <th>สถานประกอบการและที่ตั้ง</th>
                      <th>{section === 1 ? "ความก้าวหน้า / สถานะ" : "ตำแหน่ง / หัวข้อโครงงาน"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((s, i) => (
                      <tr key={s.authId} className={s.status === "late" ? "urgent-row" : ""}>
                        <td>
                          <button className="student-id" onClick={() => openStudent(s)}>
                            {s.id}
                          </button>
                        </td>
                        <td>
                          <button className="student-cell" onClick={() => openStudent(s)}>
                            <span className={`avatar avatar-${i % 4}`}>{s.name.replace(/^(นาย|นางสาว)/, "").slice(0, 2)}</span>
                            <span>
                              <strong>{s.name}</strong>
                              <small>วศ.บ. {s.major} (ชั้นปีที่ 4)</small>
                            </span>
                          </button>
                        </td>
                        <td>
                          <strong>{s.company}</strong>
                          <small className="location">
                            <Icon name="pin" size={14} />
                            {s.province}
                          </small>
                        </td>
                        <td>
                          {section === 1 ? (
                            <>
                              <span className={`badge ${s.status}`}>{statusLabels[s.status as keyof typeof statusLabels] ?? s.status}</span>
                              <small>{s.visited ? "นิเทศแล้ว" : "ยังไม่ได้นิเทศ"}</small>
                              {s.latestNote && (
                                <small style={{ display: "block", marginTop: 4, color: "#6366f1" }}>
                                  &ldquo;{s.latestNote}&rdquo; · {formatNoteTime(s.latestNoteAt)}
                                </small>
                              )}
                              {s.evidenceFiles.length > 0 && (
                                <small style={{ display: "block", marginTop: 2, color: "#059669" }}>
                                  📎 แนบไฟล์หลักฐาน {s.evidenceFiles.length} ไฟล์
                                </small>
                              )}
                            </>
                          ) : (
                            <>
                              <button className="project-link" onClick={() => openStudent(s)}>
                                {s.project}
                              </button>
                              <small>{s.role}</small>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!visible.length && !loadingStudents && (
                  <div className="empty-state">
                    <Icon name="search" size={32} />
                    <strong>ไม่พบนักศึกษาที่ตรงกับตัวกรอง</strong>
                    <p>ลองเปลี่ยนคำค้นหาหรือเลือกตัวกรองใหม่</p>
                    <button className="button secondary" onClick={reset}>
                      ล้างตัวกรองทั้งหมด
                    </button>
                  </div>
                )}
              </div>
              <div className="table-footer">
                <div>
                  แสดง{" "}
                  <strong>
                    {filtered.length ? (currentPage - 1) * pageSize + 1 : 0} - {Math.min(currentPage * pageSize, filtered.length)}
                  </strong>{" "}
                  จากทั้งหมด <strong>{filtered.length}</strong> รายการ{" "}
                  <label className="page-size">
                    แถวต่อหน้า:{" "}
                    <select
                      aria-label="จำนวนแถวต่อหน้า"
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setPage(1);
                      }}
                    >
                      <option>5</option>
                      <option>10</option>
                      <option>20</option>
                    </select>
                  </label>
                </div>
                <nav className="pagination" aria-label="หน้ารายชื่อนักศึกษา">
                  <button aria-label="หน้าก่อนหน้า" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>
                    <span className="previous">
                      <Icon name="chevron" size={16} />
                    </span>
                  </button>
                  {Array.from({ length: pages }, (_, i) => (
                    <button key={i} className={currentPage === i + 1 ? "active" : ""} aria-current={currentPage === i + 1 ? "page" : undefined} onClick={() => setPage(i + 1)}>
                      {i + 1}
                    </button>
                  ))}
                  <button aria-label="หน้าถัดไป" disabled={currentPage === pages} onClick={() => setPage(currentPage + 1)}>
                    <Icon name="chevron" size={16} />
                  </button>
                </nav>
              </div>
            </section>
          </>
        )}
        <section className="appointment-banner">
          <span className="appointment-icon">
            <Icon name="calendar" size={32} />
          </span>
          <div>
            <span className="banner-tag">กำหนดการนิเทศครั้งต่อไป</span>
            <h2>{appointment ? `นิเทศสหกิจศึกษา ณ ${appointment.company}` : "นิเทศสหกิจศึกษา ณ บริษัท อโกด้า เซอร์วิสเซส จำกัด และ บริษัท ไลน์แมน วงใน จำกัด"}</h2>
            <p>
              {appointment
                ? `${new Date(`${appointment.date}T00:00:00`).toLocaleDateString("th-TH", { dateStyle: "long" })} เวลา ${appointment.time} น. (${appointment.mode})`
                : "วันศุกร์ที่ 9 สิงหาคม 2567 เวลา 09:30 - 15:00 น. (ณ สถานประกอบการ On-site กรุงเทพฯ)"}
            </p>
          </div>
          <button className="button" onClick={() => evaluationDialog.current?.showModal()}>
            เตรียมแบบประเมินนิเทศ
          </button>
        </section>
        {section === 2 && (
          <section className="records-card">
            <h2>บันทึกนิเทศและแบบประเมิน</h2>
            <p>เลือกนักศึกษาเพื่อดูข้อมูลและเตรียมแบบประเมินสำหรับการนิเทศ</p>
            {students.map((s) => (
              <button className="record-row" key={s.authId} onClick={() => openStudent(s)}>
                <span>
                  <strong>{s.name}</strong>
                  <small>{s.company}</small>
                </span>
                <span className="record-status">
                  {s.visited ? "นิเทศแล้ว" : "รอการนิเทศ"}
                  <Icon name="chevron" size={16} />
                </span>
              </button>
            ))}
          </section>
        )}
        <footer className="content-footer">ระบบสหกิจศึกษาและฝึกงาน · WU Internship</footer>
      </main>

      <dialog ref={appointmentDialog} className="modal" aria-label="เพิ่มการนัดหมายนิเทศ">
        <div className="modal-header">
          <h2>เพิ่มการนัดหมายนิเทศ</h2>
          <button className="icon-button" aria-label="ปิด" onClick={() => appointmentDialog.current?.close()}>
            <Icon name="close" />
          </button>
        </div>
        <form onSubmit={saveAppointment}>
          <p className="muted">บันทึกนัดหมายตัวอย่างสำหรับภาคเรียน 1/2567</p>
          <label>
            สถานประกอบการ
            <select name="company" required>
              {[...new Set(students.map((s) => s.company))].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <div className="form-grid">
            <label>
              วันที่นิเทศ
              <input name="date" type="date" required />
            </label>
            <label>
              เวลา
              <input name="time" type="time" required />
            </label>
          </div>
          <label>
            รูปแบบการนิเทศ
            <select name="mode">
              <option>On-site ณ สถานประกอบการ</option>
              <option>Online ผ่านระบบประชุม</option>
            </select>
          </label>
          <p className="muted">ข้อมูลจะไม่ถูกบันทึกลงฐานข้อมูล และจะหายเมื่อรีเฟรชหน้า</p>
          <button className="button primary" type="submit">
            บันทึกนัดหมาย
          </button>
        </form>
      </dialog>
      <dialog ref={evaluationDialog} className="modal" aria-label="เตรียมแบบประเมินนิเทศ">
        <div className="modal-header">
          <h2>เตรียมแบบประเมินนิเทศ</h2>
          <button className="icon-button" aria-label="ปิด" onClick={() => evaluationDialog.current?.close()}>
            <Icon name="close" />
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            evaluationDialog.current?.close();
            setMessage("เตรียมรายการประเมินแล้ว (ตัวอย่าง ยังไม่ได้บันทึกลงฐานข้อมูล)");
          }}
        >
          <label>
            นักศึกษา
            <select required>
              {students.map((s) => (
                <option key={s.authId}>
                  {s.id} — {s.name}
                </option>
              ))}
            </select>
          </label>
          <fieldset>
            <legend>รายการเตรียมก่อนนิเทศ</legend>
            {["ตรวจสอบบันทึกประจำสัปดาห์", "ทบทวนความก้าวหน้าโครงงาน", "เตรียมเกณฑ์ประเมินผลการปฏิบัติงาน"].map((label) => (
              <label className="checkbox-label" key={label}>
                <input type="checkbox" required />
                {label}
              </label>
            ))}
          </fieldset>
          <label>
            หมายเหตุ
            <textarea rows={3} placeholder="ประเด็นที่ต้องติดตามในการนิเทศ" />
          </label>
          <button type="submit" className="button primary">
            ยืนยันการเตรียมแบบประเมิน
          </button>
        </form>
      </dialog>
    </div>
  );
}
