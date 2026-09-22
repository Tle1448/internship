export type PlacementStatus = "approved" | "pending";
export type ProgressHealth = "on-track" | "attention";
export type WorkflowStatus = "pending" | "completed";

export type Student = {
  id: string;
  name: string;
  company: string;
  province: string;
  project: string;
  role: string;
  major: string;
  currentWeek: number;
  placementStatus: PlacementStatus;
  progressHealth: ProgressHealth;
  supervisionStatus: WorkflowStatus;
  evaluationStatus: WorkflowStatus;
};

export const students: Student[] = [
  { id: "641123456", name: "นายกานต์ ชนสิริ", company: "บริษัท อโกด้า เซอร์วิสเซส จำกัด", province: "กรุงเทพมหานคร", project: "การวัดและติดตามระบบคลาวด์ไมโครเซอร์วิส", role: "นักศึกษาฝึกงานวิศวกรรมคลาวด์", major: "วิศวกรรมซอฟต์แวร์", currentWeek: 5, placementStatus: "approved", progressHealth: "attention", supervisionStatus: "pending", evaluationStatus: "pending" },
  { id: "641189201", name: "นางสาวพิมพ์พิศา ฤทธิเดช", company: "บริษัท ไลน์แมน วงใน จำกัด", province: "กรุงเทพมหานคร", project: "ท่อส่งข้อมูลและการวิเคราะห์ข้อมูลเรียลไทม์", role: "นักศึกษาฝึกงานวิศวกรรมข้อมูล", major: "วิศวกรรมซอฟต์แวร์", currentWeek: 6, placementStatus: "approved", progressHealth: "attention", supervisionStatus: "pending", evaluationStatus: "pending" },
  { id: "641144502", name: "นายรัฐพงศ์ สุวรรณเวช", company: "บริษัท เอสซีบี เทคเอกซ์ จำกัด", province: "กรุงเทพมหานคร", project: "ระบบตรวจสอบเอกสารอัจฉริยะด้วยเอไอ", role: "นักศึกษาฝึกงานวิศวกรรมการเรียนรู้ของเครื่อง", major: "วิศวกรรมซอฟต์แวร์", currentWeek: 7, placementStatus: "approved", progressHealth: "attention", supervisionStatus: "pending", evaluationStatus: "pending" },
  { id: "641177319", name: "นางสาววรินทร จินดารัตน์", company: "บริษัท กสิกร บิซิเนส-เทคโนโลยี กรุ๊ป (KBTG)", province: "นนทบุรี", project: "การปรับปรุงการเข้าถึงโมบายแบงกิ้งสำหรับทุกคน", role: "นักศึกษาฝึกงานพัฒนาฟรอนต์เอนด์", major: "วิศวกรรมซอฟต์แวร์", currentWeek: 8, placementStatus: "approved", progressHealth: "on-track", supervisionStatus: "pending", evaluationStatus: "pending" },
  { id: "641109874", name: "นายวรภพ รัตนโชติ", company: "บริษัท เซอร์ทิส จำกัด", province: "กรุงเทพมหานคร", project: "ระบบคอมพิวเตอร์วิทัศน์สำหรับภาคการผลิตอุตสาหกรรม", role: "นักศึกษาฝึกงานวิจัยปัญญาประดิษฐ์", major: "วิศวกรรมซอฟต์แวร์", currentWeek: 9, placementStatus: "pending", progressHealth: "on-track", supervisionStatus: "pending", evaluationStatus: "pending" },
  { id: "641128630", name: "นางสาวณัฐธิดา ศรีสุข", company: "บริษัท ไลน์แมน วงใน จำกัด", province: "กรุงเทพมหานคร", project: "การพัฒนาระบบจัดการคำสั่งซื้อ", role: "นักศึกษาฝึกงานพัฒนาแบ็กเอนด์", major: "วิศวกรรมซอฟต์แวร์", currentWeek: 5, placementStatus: "approved", progressHealth: "attention", supervisionStatus: "completed", evaluationStatus: "pending" },
  { id: "641135218", name: "นายธนกร แก้วมณี", company: "บริษัท อโกด้า เซอร์วิสเซส จำกัด", province: "กรุงเทพมหานคร", project: "ระบบแนะนำที่พักอัจฉริยะ", role: "นักศึกษาฝึกงานวิทยาศาสตร์ข้อมูล", major: "วิทยาการคอมพิวเตอร์", currentWeek: 6, placementStatus: "pending", progressHealth: "attention", supervisionStatus: "pending", evaluationStatus: "pending" },
];

export const placementStatusLabels: Record<PlacementStatus, string> = {
  approved: "อนุมัติครบถ้วน",
  pending: "รอตรวจสอบ",
};

export function progressPercent(student: Student) {
  return Math.round((student.currentWeek / 16) * 100);
}
