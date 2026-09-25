import { useState } from "react";
import Icon from "./Icon";

export type ScoreCriterion = { id: string; title: string; description: string; max: number };
export type GradeBand = { minimum: number; grade: string };

export default function EvaluationScores({ scores, onChange, criteria, grades, disabled = false }: { scores: number[]; onChange: (scores: number[]) => void; criteria: ScoreCriterion[]; grades: GradeBand[]; disabled?: boolean }) {
  const [draftScores, setDraftScores] = useState<string[]>(() => scores.map(String));
  const total = scores.reduce((sum, score) => sum + score, 0);
  const evaluationMaxScore = criteria.reduce((sum, criterion) => sum + criterion.max, 0);
  const grade = [...grades].sort((a, b) => b.minimum - a.minimum).find((item) => total >= item.minimum)?.grade ?? "ต่ำกว่า C+";
  const percentage = Math.round((total / evaluationMaxScore) * 100);

  function updateScore(index: number, rawValue: string, max: number) {
    setDraftScores((current) => {
      const next = [...current];
      next[index] = rawValue;
      return next;
    });
    const parsedValue = rawValue === "" ? 0 : Number(rawValue);
    const nextValue = Number.isFinite(parsedValue) ? Math.min(max, Math.max(0, parsedValue)) : 0;
    const nextScores = criteria.map((_, scoreIndex) => scores[scoreIndex] ?? 0);
    nextScores[index] = nextValue;
    onChange(nextScores);
  }

  function normalizeScore(index: number, max: number) {
    const parsedValue = Number(draftScores[index]);
    const normalized = Number.isFinite(parsedValue) ? Math.min(max, Math.max(0, parsedValue)) : 0;
    setDraftScores((current) => {
      const next = [...current];
      next[index] = String(normalized);
      return next;
    });
    const nextScores = criteria.map((_, scoreIndex) => scores[scoreIndex] ?? 0);
    nextScores[index] = normalized;
    onChange(nextScores);
  }

  return <>
    <div className="section-title">
      <span className="detail-icon"><Icon name="checklist"/></span>
      <div><h2>ส่วนที่ 2: เกณฑ์การให้คะแนนและประเมินผลการปฏิบัติงาน</h2><p>คำนวณตามน้ำหนัก 4 ด้าน รวม {evaluationMaxScore} คะแนนเต็ม</p></div>
      <small>เกณฑ์การตัดเกรด A: ≥85, B+: 80–84, B: 75–79, C+: 70–74</small>
    </div>
    <div className="score-list">
      {criteria.map((criterion, index) => <article className="score-card" key={criterion.id}>
        <div className="score-card-heading">
          <div><label htmlFor={`score-${criterion.id}`}>หมวดที่ {index + 1}: {criterion.title}</label><p>{criterion.description}</p></div>
          <span className="detail-tag">เต็ม {criterion.max} คะแนน</span>
        </div>
        <div className="score-input-row">
          <input
            id={`score-${criterion.id}`}
            type="number"
            min={0}
            max={criterion.max}
            step={1}
            disabled={disabled}
            inputMode="numeric"
            value={draftScores[index] ?? String(scores[index] ?? 0)}
            aria-describedby={`score-limit-${criterion.id}`}
            onFocus={() => {
              if ((draftScores[index] ?? String(scores[index] ?? 0)) === "0") {
                setDraftScores((current) => {
                  const next = [...current];
                  next[index] = "";
                  return next;
                });
              }
            }}
            onChange={(event) => updateScore(index, event.target.value, criterion.max)}
            onBlur={() => normalizeScore(index, criterion.max)}
          />
          <span id={`score-limit-${criterion.id}`}>/ {criterion.max} คะแนน</span>
        </div>
      </article>)}
    </div>
    <div className="score-total">
      <div><strong>ผลสรุปคะแนนประเมินรวม</strong><h3>{total} <span>/ {evaluationMaxScore} คะแนน</span> <span className="badge approved">{grade === "ต่ำกว่า C+" ? "เกรดต่ำกว่า C+" : `เกรด ${grade}`}</span></h3><p>คำนวณอัตโนมัติจากคะแนนทั้ง {criteria.length} หมวด</p></div>
      <div className="score-ring" style={{ background: `conic-gradient(var(--violet) ${percentage}%, #dedaf1 0)` }}><span>{percentage}%</span></div>
    </div>
  </>;
}
