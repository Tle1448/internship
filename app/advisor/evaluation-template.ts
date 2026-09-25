export type EvaluationCriterion = {
  id: string;
  title: string;
  description: string;
  max: number;
  initial: number;
};

export const evaluationTemplate = {
  criteria: [
    {
      id: "work-outcome",
      title: "ผลสัมฤทธิ์ของงานและโครงงานสหกิจ",
      description: "คุณภาพของชิ้นงาน ผลผลิตตามเป้าหมาย ความถูกต้อง และการส่งมอบตรงเวลา",
      max: 30,
      initial: 28,
    },
    {
      id: "professional-skill",
      title: "ความรู้ความสามารถทางวิชาชีพ",
      description: "ทักษะเชิงลึก การประยุกต์ใช้ความรู้ การแก้ปัญหาเฉพาะหน้า และความคิดริเริ่ม",
      max: 30,
      initial: 27,
    },
    {
      id: "responsibility",
      title: "ความรับผิดชอบและวินัยในการทำงาน",
      description: "ความตรงต่อเวลา การปฏิบัติตามระเบียบ และความรับผิดชอบต่องาน",
      max: 20,
      initial: 19,
    },
    {
      id: "communication",
      title: "การสื่อสารและการทำงานร่วมกับผู้อื่น",
      description: "การประสานงาน การนำเสนอ และการปรับตัวเข้ากับทีม",
      max: 20,
      initial: 18,
    },
  ] satisfies EvaluationCriterion[],
  grades: [
    { minimum: 85, grade: "A" },
    { minimum: 80, grade: "B+" },
    { minimum: 75, grade: "B" },
    { minimum: 70, grade: "C+" },
  ],
} as const;

export const scoreCriteria = evaluationTemplate.criteria;
export const evaluationMaxScore = scoreCriteria.reduce((sum, criterion) => sum + criterion.max, 0);

export function gradeFor(score: number) {
  return evaluationTemplate.grades.find((item) => score >= item.minimum)?.grade ?? "ต่ำกว่า C+";
}

export function gradeLabelFor(score: number) {
  const grade = gradeFor(score);
  return grade === "ต่ำกว่า C+" ? "เกรดต่ำกว่า C+" : `เกรด ${grade}`;
}
