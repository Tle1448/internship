export type Student = {
    id: string;
    name: string;
    company: string;
    province: string;
    project: string;
    role: string;
    major: string;
    status: "approved" | "pending" | "late";
    visited: boolean;
};
export const students: Student[] = [
    { id: "641123456", name: "นายกานต์ ชนสิริ", company: "บริษัท อโกด้า เซอร์วิสเซส จำกัด", province: "กรุงเทพมหานคร", project: "การวัดและติดตามระบบคลาวด์ไมโครเซอร์วิส", role: "นักศึกษาฝึกงานวิศวกรรมคลาวด์", major: "วิศวกรรมซอฟต์แวร์", status: "approved", visited: false },
    { id: "641189201", name: "นางสาวพิมพ์พิศา ฤทธิเดช", company: "บริษัท ไลน์แมน วงใน จำกัด", province: "กรุงเทพมหานคร", project: "ท่อส่งข้อมูลและการวิเคราะห์ข้อมูลเรียลไทม์", role: "นักศึกษาฝึกงานวิศวกรรมข้อมูล", major: "วิศวกรรมซอฟต์แวร์", status: "approved", visited: false },
    { id: "641144502", name: "นายรัฐพงศ์ สุวรรณเวช", company: "บริษัท เอสซีบี เทคเอกซ์ จำกัด", province: "กรุงเทพมหานคร", project: "ระบบตรวจสอบเอกสารอัจฉริยะด้วยเอไอ", role: "นักศึกษาฝึกงานวิศวกรรมการเรียนรู้ของเครื่อง", major: "วิศวกรรมซอฟต์แวร์", status: "late", visited: false },
    { id: "641177319", name: "นางสาววรินทร จินดารัตน์", company: "บริษัท กสิกร บิซิเนส-เทคโนโลยี กรุ๊ป (KBTG)", province: "นนทบุรี", project: "การปรับปรุงการเข้าถึงโมบายแบงกิ้งสำหรับทุกคน", role: "นักศึกษาฝึกงานพัฒนาฟรอนต์เอนด์", major: "วิศวกรรมซอฟต์แวร์", status: "approved", visited: false },
    { id: "641109874", name: "นายวรภพ รัตนโชติ", company: "บริษัท เซอร์ทิส จำกัด", province: "กรุงเทพมหานคร", project: "ระบบคอมพิวเตอร์วิทัศน์สำหรับภาคการผลิตอุตสาหกรรม", role: "นักศึกษาฝึกงานวิจัยปัญญาประดิษฐ์", major: "วิศวกรรมซอฟต์แวร์", status: "pending", visited: false },
    { id: "641128630", name: "นางสาวณัฐธิดา ศรีสุข", company: "บริษัท ไลน์แมน วงใน จำกัด", province: "กรุงเทพมหานคร", project: "การพัฒนาระบบจัดการคำสั่งซื้อ", role: "นักศึกษาฝึกงานพัฒนาแบ็กเอนด์", major: "วิศวกรรมซอฟต์แวร์", status: "approved", visited: true },
    { id: "641135218", name: "นายธนกร แก้วมณี", company: "บริษัท อโกด้า เซอร์วิสเซส จำกัด", province: "กรุงเทพมหานคร", project: "ระบบแนะนำที่พักอัจฉริยะ", role: "นักศึกษาฝึกงานวิทยาศาสตร์ข้อมูล", major: "วิทยาการคอมพิวเตอร์", status: "pending", visited: false }
];
export const statusLabels = { approved: "อนุมัติครบถ้วน", pending: "รอการตรวจสอบ", late: "บันทึกค้างส่ง" };
