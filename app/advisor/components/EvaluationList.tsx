"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { students } from "../data";
import Icon from "./Icon";

type EvaluationTab = "tasks" | "supervision" | "evaluation" | "history";

const tabs: { key: EvaluationTab; label: string }[] = [
  { key: "tasks", label: "งานที่ต้องดำเนินการ" },
  { key: "supervision", label: "แบบบันทึกการนิเทศ" },
  { key: "evaluation", label: "แบบประเมิน" },
  { key: "history", label: "ประวัติ" },
];

export default function EvaluationList() {
  const [tab, setTab] = useState<EvaluationTab>("tasks");
  const visible = useMemo(() => students.filter(student => {
    if (tab === "tasks") return !student.visited || student.status !== "approved";
    if (tab === "supervision") return !student.visited;
    if (tab === "evaluation") return student.visited || student.status === "approved";
    return student.visited;
  }), [tab]);

  return <section className="advisor-list-page" aria-labelledby="evaluation-list-title">
    <div className="list-heading"><div><h1 id="evaluation-list-title">บันทึกนิเทศและแบบประเมิน</h1><p>เลือกรายการของนักศึกษาเพื่อเริ่มบันทึกการนิเทศหรือประเมินผลการปฏิบัติงาน</p></div></div>
    <nav className="detail-tabs evaluation-list-tabs" aria-label="ตัวกรองรายการประเมิน">{tabs.map(item => <button key={item.key} className={tab === item.key ? "active" : ""} onClick={() => setTab(item.key)}>{item.label}</button>)}</nav>
    <div className="evaluation-task-list">{visible.map((student, index) => {
      const isEvaluation = student.visited || student.status === "approved";
      const action = isEvaluation ? "เริ่มประเมิน" : "เริ่มบันทึกการนิเทศ";
      const type = isEvaluation ? "ประเมินผลการฝึกงาน" : "นิเทศครั้งที่ 1";
      return <article className="detail-card evaluation-task-item" key={student.id}>
        <span className="task-icon"><Icon name={isEvaluation ? "checklist" : "calendar"} size={21} /></span>
        <div><h2>{student.name}</h2><p>{student.id} · {student.company}</p><small>{type} · กำหนดส่งภายใน {25 + index} ต.ค. 2567</small></div>
        <span className={`badge ${student.status === "late" ? "late" : "pending"}`}>{student.status === "late" ? "ต้องติดตาม" : "รอดำเนินการ"}</span>
        <Link className="button primary" href={isEvaluation ? `/advisor/evaluations/${student.id}/scores` : `/advisor/evaluations/${student.id}`}>{action}<Icon name="chevron" size={16} /></Link>
      </article>;
    })}</div>
    {!visible.length && <p className="detail-card empty-state">ยังไม่มีรายการในหมวดนี้</p>}
  </section>;
}
