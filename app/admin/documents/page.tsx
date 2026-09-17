import Link from "next/link";

export default function AdminDocumentsPage() {
  return (
    <main className="min-h-screen bg-[#F8F9FA] p-6 text-black sm:p-10">
      <div className="mx-auto max-w-7xl">
        <Link href="/admin/dashboard" className="mb-6 inline-flex min-h-11 items-center font-semibold text-[#3D348B] hover:underline">
          ← กลับหน้า Dashboard
        </Link>
        <section className="rounded-xl border border-[#EAEAEA] bg-white p-6">
          <h1 className="mb-6 text-xl font-bold">Recent Student Document Submissions</h1>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-[#FAFAFA] border-b border-[#EAEAEA] text-xs font-semibold text-[#555555]">
                  <th className="p-3.5">รหัสนักศึกษา (ID)</th>
                  <th className="p-3.5">ชื่อ - นามสกุล</th>
                  <th className="p-3.5">ประเภทเอกสาร (DOCUMENT TYPE)</th>
                  <th className="p-3.5">วันที่ส่ง</th>
                  <th className="p-3.5">สถานะ (STATUS)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAEAEA] text-xs">
                <tr className="hover:bg-[#7678ED]/10 transition-colors">
                  <td className="p-3.5 font-mono font-bold">65114289</td>
                  <td className="p-3.5">นายสมชาย ในดี</td>
                  <td className="p-3.5">
                    หนังสือตอบรับเข้าฝึกงาน (Acceptance Letter)
                  </td>
                  <td className="p-3.5 font-mono font-bold">28 ก.ย. 2026</td>
                  <td className="p-3.5">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F18701] text-white">
                      รอตรวจสอบ (Pending)
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-[#7678ED]/10 transition-colors">
                  <td className="p-3.5 font-mono font-bold">65118942</td>
                  <td className="p-3.5">นางสาววิภาดา ภักดีสุวรรณ</td>
                  <td className="p-3.5">
                    หนังสือยินยอมผู้ปกครอง (Parental Consent)
                  </td>
                  <td className="p-3.5 font-mono font-bold">27 ก.ย. 2026</td>
                  <td className="p-3.5">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F18701] text-white">
                      รอตรวจสอบ (Pending)
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-[#7678ED]/10 transition-colors">
                  <td className="p-3.5 font-mono font-bold">65120194</td>
                  <td className="p-3.5">นายธนกฤต ชนบท</td>
                  <td className="p-3.5">
                    หนังสือยืนยันวันนัดสัมภาษณ์ (Interview Confirmation)
                  </td>
                  <td className="p-3.5 font-mono font-bold">26 ก.ย. 2026</td>
                  <td className="p-3.5">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F35B04] text-white">
                      ส่งแก้ไข (Needs Edit)
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-[#7678ED]/10 transition-colors">
                  <td className="p-3.5 font-mono font-bold">65115531</td>
                  <td className="p-3.5">นางสาวกาญจนา รัตนวิจิตร</td>
                  <td className="p-3.5">
                    กรมธรรม์ประกันภัยอุบัติเหตุ (Insurance)
                  </td>
                  <td className="p-3.5 font-mono font-bold">26 ก.ย. 2026</td>
                  <td className="p-3.5">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#3D348B] text-white">
                      อนุมัติแล้ว (Approved)
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

