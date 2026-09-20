"use client";

import type { RefObject } from "react";
import { statusLabels } from "../data";
import Icon from "./Icon";

export type AdvisorStudent = {
  id: string;
  authId: string;
  name: string;
  major: string;
  company: string;
  province: string;
  project: string;
  role: string;
  status: string;
  visited: boolean;
  latestNote: string | null;
  latestNoteAt: string | null;
  evidenceFiles: string[];
};

type StudentDetailsDialogProps = {
  dialogRef: RefObject<HTMLDialogElement | null>;
  student: AdvisorStudent | null;
};

function fileNameFromUrl(url: string) {
  try {
    const parts = url.split("/");
    return decodeURIComponent(parts[parts.length - 1].replace(/^\d+_/, ""));
  } catch {
    return url;
  }
}

function formatNoteTime(iso: string | null) {
  return iso ? new Date(iso).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" }) : "";
}

export default function StudentDetailsDialog({ dialogRef, student }: StudentDetailsDialogProps) {
  return <dialog ref={dialogRef} className="modal" aria-label="ข้อมูลนักศึกษา">
    <div className="modal-header">
      <h2>ข้อมูลนักศึกษา</h2>
      <button className="icon-button" aria-label="ปิด" onClick={() => dialogRef.current?.close()}>
        <Icon name="close" />
      </button>
    </div>
    {student && <div className="student-detail">
      <span className={`badge ${student.status}`}>{statusLabels[student.status as keyof typeof statusLabels] ?? student.status}</span>
      <h3>{student.name}</h3>
      <p>{student.id} · {student.major}</p>
      <dl>
        <dt>สถานประกอบการ</dt><dd>{student.company}</dd>
        <dt>จังหวัด</dt><dd>{student.province}</dd>
        <dt>หัวข้อโครงงาน</dt><dd>{student.project}</dd>
        <dt>ตำแหน่ง</dt><dd>{student.role}</dd>
        <dt>การนิเทศ</dt><dd>{student.visited ? "นิเทศแล้ว" : "ยังไม่ได้นิเทศ"}</dd>
        {student.latestNote && <><dt>อัปเดตล่าสุดจากนักศึกษา</dt><dd>&ldquo;{student.latestNote}&rdquo;<br /><small>{formatNoteTime(student.latestNoteAt)}</small></dd></>}
        <dt>ไฟล์หลักฐานที่อัปโหลด</dt>
        <dd>{student.evidenceFiles.length === 0 ? <span>ยังไม่มีไฟล์แนบ</span> : <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {student.evidenceFiles.map((url, index) => <li key={index} style={{ marginBottom: 4 }}><a href={url} target="_blank" rel="noopener noreferrer" style={{ color: "#4338ca", textDecoration: "underline" }}>📎 {fileNameFromUrl(url)}</a></li>)}
        </ul>}</dd>
      </dl>
    </div>}
  </dialog>;
}
