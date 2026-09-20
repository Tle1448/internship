export type WeeklyRecord = { week: number; title: string; date: string; status: "pending" | "approved" | "upcoming"; content: string; comment?: string };

export const weeklyRecords: WeeklyRecord[] = [
  { week: 8, title: "พัฒนา OpenTelemetry Collector และระบบติดตามแบบกระจาย", date: "18 ต.ค. 2567 เวลา 17:30 น.", status: "pending", content: "ได้ดำเนินการติดตั้งและตั้งค่า OpenTelemetry Collector agent บน Kubernetes Cluster ในระบบทดสอบ เพื่อรวบรวมข้อมูล span จากไมโครเซอร์วิสหลัก 3 บริการ และส่งต่อไปยัง Grafana Tempo ตรวจสอบปัญหาคอขวดที่เกิดขึ้นในระบบสืบค้นข้อมูลได้สำเร็จ" },
  { week: 7, title: "ปรับปรุงประสิทธิภาพ Database Query บน PostgreSQL", date: "11 ต.ค. 2567 เวลา 16:45 น.", status: "approved", content: "วิเคราะห์คำสั่งค้นหาที่ใช้เวลานาน และเพิ่มดัชนีเพื่อปรับปรุงประสิทธิภาพ พร้อมเปรียบเทียบผลก่อนและหลังการปรับปรุง", comment: "ผลงานดีมาก มีการวัดผลเปรียบเทียบชัดเจน ขอให้บันทึกเทคนิค indexing ที่ใช้ลงในเล่มรายงานวิจัยด้วย" },
  { week: 6, title: "จัดทำ Unit Testing & Integration Testing ครอบคลุมกว่า 85%", date: "4 ต.ค. 2567 เวลา 18:00 น.", status: "approved", content: "เพิ่มชุดทดสอบสำหรับบริการหลักและทดสอบการเชื่อมต่อระหว่างระบบ ครอบคลุมเส้นทางการทำงานสำคัญ" },
  { week: 5, title: "ออกแบบ REST API และเอกสารระบบด้วย Swagger", date: "27 ก.ย. 2567 เวลา 17:15 น.", status: "approved", content: "ออกแบบ API และจัดทำเอกสารตัวอย่างคำขอและผลลัพธ์สำหรับทีมพัฒนา" },
  ...[4, 3, 2, 1].map(week => ({ week, title: ["เรียนรู้ระบบงานและวางแผนการฝึกงาน", "ศึกษาความต้องการและออกแบบโครงงาน", "พัฒนาระบบต้นแบบ", "ทดสอบและปรับปรุงระบบต้นแบบ"][week - 1], date: "ภาคการศึกษา 1/2567", status: "approved" as const, content: "ดำเนินงานตามแผนประจำสัปดาห์ พร้อมสรุปสิ่งที่เรียนรู้และประเด็นที่ต้องพัฒนาร่วมกับพี่เลี้ยง" })),
  ...Array.from({ length: 8 }, (_, i) => ({ week: i + 9, title: i === 0 ? "เตรียมนำเสนอความก้าวหน้าโครงงานก่อนนิเทศ" : "ดำเนินโครงงานและสรุปผลการปฏิบัติงาน", date: "ยังไม่ถึงกำหนดส่ง", status: "upcoming" as const, content: "" })),
];

export const scoreCriteria = [
  { title: "ผลสัมฤทธิ์ของงานและโครงงานสหกิจ", description: "คุณภาพของชิ้นงาน ผลผลิตตามเป้าหมาย ความถูกต้อง และการส่งมอบตรงเวลา", max: 30, initial: 28 },
  { title: "ความรู้ความสามารถทางวิชาชีพ", description: "ทักษะเชิงลึก การประยุกต์ใช้ความรู้ การแก้ปัญหาเฉพาะหน้า และความคิดริเริ่ม", max: 30, initial: 27 },
  { title: "ความรับผิดชอบและวินัยในการทำงาน", description: "ความตรงต่อเวลา การปฏิบัติตามระเบียบ และความรับผิดชอบต่องาน", max: 20, initial: 19 },
  { title: "การสื่อสารและการทำงานร่วมกับผู้อื่น", description: "การประสานงาน การนำเสนอ และการปรับตัวเข้ากับทีม", max: 20, initial: 18 },
];

export function gradeFor(score: number) { return score >= 85 ? "A" : score >= 80 ? "B+" : score >= 75 ? "B" : score >= 70 ? "C+" : score >= 65 ? "C" : score >= 60 ? "D+" : score >= 50 ? "D" : "F"; }
