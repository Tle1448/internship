"use client";
import { useRef, useState } from "react";
import Icon from "./Icon";

export default function EvaluationAttachments() {
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);
  function addFiles(incoming: FileList | null) {
    if (!incoming) return;
    const accepted: File[] = [];
    const rejected: string[] = [];
    Array.from(incoming).forEach(file => { if (file.size > 25 * 1024 * 1024 || !/\.(pdf|docx|png|jpe?g|webp)$/i.test(file.name)) rejected.push(file.name); else accepted.push(file); });
    setFiles(previous => [...previous, ...accepted.filter(file => !previous.some(old => old.name === file.name && old.size === file.size))]);
    setError(rejected.length ? `ไฟล์ไม่รองรับหรือเกิน 25 MB: ${rejected.join(", ")}` : "");
  }
  return <div className="evaluation-attachments"><div className="field-heading"><strong>เอกสารแนบและหลักฐานการนิเทศงาน</strong><small>PDF, DOCX, PNG, JPG, WEBP · สูงสุด 25 MB ต่อไฟล์</small></div><input ref={input} type="file" hidden multiple accept=".pdf,.docx,.png,.jpg,.jpeg,.webp" onChange={e => { addFiles(e.target.files); e.target.value = ""; }}/><button type="button" className="upload-area" onClick={() => input.current?.click()} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); addFiles(e.dataTransfer.files); }}><span className="detail-icon"><Icon name="file" size={28}/></span><strong>ลากและวางไฟล์เอกสารบันทึกการนิเทศ หรือคลิกเพื่อเลือกไฟล์</strong><small>ไฟล์เก็บชั่วคราวในหน้านี้ ยังไม่ได้อัปโหลดและไม่รวมในการบันทึกแบบร่าง</small></button>{error && <p role="alert" className="attachment-error">{error}</p>}{files.map(file => <div className="attachment-row" key={`${file.name}-${file.size}`}><Icon name="file"/><div><strong>{file.name}</strong><small>{(file.size / 1024 / 1024).toFixed(2)} MB · ไฟล์ที่เลือก</small></div><button type="button" className="icon-button" aria-label={`ลบ ${file.name}`} onClick={() => setFiles(files.filter(item => item !== file))}><Icon name="close" size={16}/></button></div>)}</div>;
}
