import type { Student } from "./data";

export type WeeklyStatus = "pending" | "approved" | "revision" | "upcoming";
export type WeeklyRecord = { week: number; title: string; date: string; status: WeeklyStatus; content: string; comment?: string };

const featuredWeeks: Record<number, Pick<WeeklyRecord, "title" | "content">> = {
  5: { title: "ออกแบบ REST API และเอกสารระบบด้วย Swagger", content: "ออกแบบ API และจัดทำเอกสารตัวอย่างคำขอและผลลัพธ์สำหรับทีมพัฒนา" },
  6: { title: "จัดทำ Unit Testing & Integration Testing ครอบคลุมกว่า 85%", content: "เพิ่มชุดทดสอบสำหรับบริการหลักและทดสอบการเชื่อมต่อระหว่างระบบ ครอบคลุมเส้นทางการทำงานสำคัญ" },
  7: { title: "ปรับปรุงประสิทธิภาพ Database Query บน PostgreSQL", content: "วิเคราะห์คำสั่งค้นหาที่ใช้เวลานาน และเพิ่มดัชนีเพื่อปรับปรุงประสิทธิภาพ พร้อมเปรียบเทียบผลก่อนและหลังการปรับปรุง" },
  8: { title: "พัฒนา OpenTelemetry Collector และระบบติดตามแบบกระจาย", content: "ติดตั้งและตั้งค่า OpenTelemetry Collector บน Kubernetes Cluster เพื่อรวบรวมข้อมูลจากบริการหลักและตรวจสอบปัญหาคอขวดของระบบ" },
};

export function createWeeklyRecords(student: Student): WeeklyRecord[] {
  return Array.from({ length: 16 }, (_, index) => {
    const week = index + 1;
    const featured = featuredWeeks[week];
    const status: WeeklyStatus = week < student.currentWeek ? "approved" : week === student.currentWeek ? "pending" : "upcoming";
    return {
      week,
      title: featured?.title ?? (week > student.currentWeek ? "ดำเนินโครงงานและสรุปผลการปฏิบัติงาน" : "สรุปการปฏิบัติงานและสิ่งที่ได้เรียนรู้"),
      date: status === "upcoming" ? "ยังไม่ถึงกำหนดส่ง" : `สัปดาห์ที่ ${week} · ภาคการศึกษา 1/2567`,
      status,
      content: status === "upcoming" ? "" : featured?.content ?? "ดำเนินงานตามแผนประจำสัปดาห์ พร้อมสรุปสิ่งที่เรียนรู้และประเด็นที่ต้องพัฒนาร่วมกับพี่เลี้ยง",
      comment: status === "approved" && week === 7 ? "ผลงานดี มีการวัดผลเปรียบเทียบชัดเจน ควรบันทึกเทคนิคที่ใช้ลงในรายงานด้วย" : undefined,
    };
  }).sort((a, b) => b.week - a.week);
}

export const scoreCriteria = [
  { title: "ผลสัมฤทธิ์ของงานและโครงงานสหกิจ", description: "คุณภาพของชิ้นงาน ผลผลิตตามเป้าหมาย ความถูกต้อง และการส่งมอบตรงเวลา", max: 30, initial: 28 },
  { title: "ความรู้ความสามารถทางวิชาชีพ", description: "ทักษะเชิงลึก การประยุกต์ใช้ความรู้ การแก้ปัญหาเฉพาะหน้า และความคิดริเริ่ม", max: 30, initial: 27 },
  { title: "ความรับผิดชอบและวินัยในการทำงาน", description: "ความตรงต่อเวลา การปฏิบัติตามระเบียบ และความรับผิดชอบต่องาน", max: 20, initial: 19 },
  { title: "การสื่อสารและการทำงานร่วมกับผู้อื่น", description: "การประสานงาน การนำเสนอ และการปรับตัวเข้ากับทีม", max: 20, initial: 18 },
];

export function gradeFor(score: number) { return score >= 85 ? "A" : score >= 80 ? "B+" : score >= 75 ? "B" : score >= 70 ? "C+" : score >= 65 ? "C" : score >= 60 ? "D+" : score >= 50 ? "D" : "F"; }
