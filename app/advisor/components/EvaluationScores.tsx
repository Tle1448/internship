import { evaluationMaxScore, gradeLabelFor, scoreCriteria } from "../evaluation-template";
import Icon from "./Icon";

export default function EvaluationScores({ scores, onChange }: { scores: number[]; onChange: (scores: number[]) => void }) {
  const total = scores.reduce((sum, score) => sum + score, 0);
  const percentage = Math.round((total / evaluationMaxScore) * 100);

  function updateScore(index: number, rawValue: string, max: number) {
    const parsedValue = Number(rawValue);
    const nextValue = Number.isFinite(parsedValue) ? Math.min(max, Math.max(0, parsedValue)) : 0;
    onChange(scores.map((score, scoreIndex) => scoreIndex === index ? nextValue : score));
  }

  return <>
    <div className="section-title">
      <span className="detail-icon"><Icon name="checklist"/></span>
      <div><h2>ส่วนที่ 2: เกณฑ์การให้คะแนนและประเมินผลการปฏิบัติงาน</h2><p>คำนวณตามน้ำหนัก 4 ด้าน รวม {evaluationMaxScore} คะแนนเต็ม</p></div>
      <small>เกณฑ์การตัดเกรด A: ≥85, B+: 80–84, B: 75–79, C+: 70–74</small>
    </div>
    <div className="score-list">
      {scoreCriteria.map((criterion, index) => <article className="score-card" key={criterion.id}>
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
            inputMode="numeric"
            value={scores[index] ?? 0}
            aria-describedby={`score-limit-${criterion.id}`}
            onChange={(event) => updateScore(index, event.target.value, criterion.max)}
          />
          <span id={`score-limit-${criterion.id}`}>/ {criterion.max} คะแนน</span>
        </div>
      </article>)}
    </div>
    <div className="score-total">
      <div><strong>ผลสรุปคะแนนประเมินรวม</strong><h3>{total} <span>/ {evaluationMaxScore} คะแนน</span> <span className="badge approved">{gradeLabelFor(total)}</span></h3><p>คำนวณอัตโนมัติจากคะแนนทั้ง 4 หมวด</p></div>
      <div className="score-ring" style={{ background: `conic-gradient(var(--violet) ${percentage}%, #dedaf1 0)` }}><span>{percentage}%</span></div>
    </div>
  </>;
}
