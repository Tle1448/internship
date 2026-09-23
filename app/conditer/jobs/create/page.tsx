"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BriefcaseBusiness, Building2, CalendarDays, Loader2, Save } from "lucide-react";
import ConditerSidebar from "@/components/ConditerSidebar";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";

export default function CreateJobPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [location, setLocation] = useState("");
  const [department, setDepartment] = useState("");
  const [positions, setPositions] = useState("1");
  const [workType, setWorkType] = useState("On-site");
  const [description, setDescription] = useState("");
  const [qualifications, setQualifications] = useState("");
  const [welfare, setWelfare] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!user) {
      setError("กรุณาเข้าสู่ระบบใหม่");
      return;
    }
    if (!companyName.trim() || !contactName.trim() || !jobTitle.trim() || !startDate || !endDate) {
      setError("กรุณากรอกข้อมูลที่มีเครื่องหมาย * ให้ครบ");
      return;
    }
    if (startDate > endDate) {
      setError("วันที่เริ่มรับสมัครต้องไม่เกินวันสิ้นสุดรับสมัคร");
      return;
    }

    setSaving(true);
    try {
      const normalizedCompanyName = companyName.trim();
      const { data: existingCompany, error: lookupError } = await supabase
        .from("companies")
        .select("id")
        .eq("name", normalizedCompanyName)
        .limit(1)
        .maybeSingle();
      if (lookupError) throw lookupError;

      let companyId = existingCompany?.id;
      if (!companyId) {
        const { data: company, error: companyError } = await supabase
          .from("companies")
          .insert({
            name: normalizedCompanyName,
            contact_name: contactName.trim(),
            contact_email: contactEmail.trim() || null,
            contact_phone: contactPhone.trim() || null,
            location: location.trim(),
            status: "approved",
            created_by: user.id,
          })
          .select("id")
          .single();
        if (companyError) throw companyError;
        companyId = company.id;
      }

      const qualificationList = qualifications.split("\n").map((item) => item.trim()).filter(Boolean);
      const { error: jobError } = await supabase.from("jobs").insert({
        company_id: companyId,
        company_name: normalizedCompanyName,
        title: jobTitle.trim(),
        location: location.trim() || null,
        department: department.trim() || null,
        positions: Math.max(1, Number(positions) || 1),
        work_type: workType,
        description: description.trim() || null,
        qualifications: qualificationList,
        welfare: welfare.trim() || null,
        start_date: startDate,
        end_date: endDate,
        status: "open",
        created_by: user.id,
      });
      if (jobError) throw jobError;

      router.push("/conditer/companies");
    } catch (submissionError) {
      console.error(submissionError);
      setError("ไม่สามารถบันทึกข้อมูลลงฐานข้อมูลได้");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F6FB]">
      <ConditerSidebar />
      <main className="lg:ml-[235px]">
        <div className="mx-auto max-w-5xl px-5 py-6 lg:px-8">
          <div className="mb-6 flex items-center gap-3">
            <Link href="/conditer/companies" className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#E5E2EE] bg-white text-[#6D6980] hover:bg-[#F4F2FC]"><ArrowLeft size={18} /></Link>
            <div><h1 className="text-[22px] font-bold text-[#24213A]">สร้างประกาศงาน</h1><p className="mt-1 text-sm text-[#89859A]">บันทึกบริษัทและประกาศงานลงฐานข้อมูล</p></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
            <section className="rounded-lg border border-[#E7E4EF] bg-white">
              <SectionTitle icon={<Building2 size={20} />} title="ข้อมูลบริษัท" />
              <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">
                <Field label="ชื่อบริษัท *" value={companyName} onChange={setCompanyName} className="md:col-span-2" />
                <Field label="ชื่อผู้ติดต่อ *" value={contactName} onChange={setContactName} />
                <Field label="อีเมลผู้ติดต่อ" value={contactEmail} onChange={setContactEmail} type="email" />
                <Field label="เบอร์โทรศัพท์" value={contactPhone} onChange={setContactPhone} />
                <Field label="สถานที่ทำงาน" value={location} onChange={setLocation} />
              </div>
            </section>

            <section className="rounded-lg border border-[#E7E4EF] bg-white">
              <SectionTitle icon={<BriefcaseBusiness size={20} />} title="รายละเอียดงาน" />
              <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">
                <Field label="ชื่อตำแหน่งงาน *" value={jobTitle} onChange={setJobTitle} className="md:col-span-2" />
                <Field label="แผนก / ฝ่าย" value={department} onChange={setDepartment} />
                <Field label="จำนวนที่รับ" value={positions} onChange={setPositions} type="number" min="1" />
                <label className="text-sm font-semibold text-[#403C52]">รูปแบบการทำงาน<select value={workType} onChange={(event) => setWorkType(event.target.value)} className="mt-2 w-full rounded-lg border border-[#DDD9E8] bg-white px-4 py-3 text-sm font-normal outline-none focus:border-[#7678ED]"><option value="On-site">On-site</option><option value="Hybrid">Hybrid</option><option value="Remote">Remote</option></select></label>
                <div />
                <TextArea label="รายละเอียดงาน" value={description} onChange={setDescription} rows={5} className="md:col-span-2" />
                <TextArea label="คุณสมบัติผู้สมัคร" value={qualifications} onChange={setQualifications} rows={5} hint="ใส่หนึ่งข้อในแต่ละบรรทัด" className="md:col-span-2" />
                <TextArea label="สวัสดิการ" value={welfare} onChange={setWelfare} rows={4} className="md:col-span-2" />
              </div>
            </section>

            <section className="rounded-lg border border-[#E7E4EF] bg-white">
              <SectionTitle icon={<CalendarDays size={20} />} title="ช่วงเวลารับสมัคร" />
              <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">
                <Field label="วันที่เริ่มรับสมัคร *" value={startDate} onChange={setStartDate} type="date" />
                <Field label="วันสิ้นสุดรับสมัคร *" value={endDate} onChange={setEndDate} type="date" />
              </div>
            </section>

            <div className="flex justify-end gap-3">
              <Link href="/conditer/companies" className="rounded-lg border border-[#DDD9E8] bg-white px-5 py-3 text-sm font-semibold text-[#696579] hover:bg-[#F7F6FB]">ยกเลิก</Link>
              <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-lg bg-[#3D348B] px-5 py-3 text-sm font-semibold text-white hover:bg-[#302975] disabled:opacity-60">{saving ? <Loader2 size={17} className="animate-spin" /> : <Save size={17} />}{saving ? "กำลังบันทึก..." : "สร้างประกาศงาน"}</button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return <div className="flex items-center gap-3 border-b border-[#EEEAF3] px-6 py-5"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#EFEEFC] text-[#3D348B]">{icon}</div><h2 className="font-bold text-[#29263E]">{title}</h2></div>;
}

function Field({ label, value, onChange, type = "text", className = "", min }: { label: string; value: string; onChange: (value: string) => void; type?: string; className?: string; min?: string }) {
  return <label className={"text-sm font-semibold text-[#403C52] " + className}>{label}<input type={type} min={min} value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-lg border border-[#DDD9E8] px-4 py-3 text-sm font-normal outline-none focus:border-[#7678ED]" /></label>;
}

function TextArea({ label, value, onChange, rows, hint, className = "" }: { label: string; value: string; onChange: (value: string) => void; rows: number; hint?: string; className?: string }) {
  return <label className={"text-sm font-semibold text-[#403C52] " + className}>{label}{hint && <span className="ml-2 text-xs font-normal text-[#89859A]">{hint}</span>}<textarea rows={rows} value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full resize-y rounded-lg border border-[#DDD9E8] px-4 py-3 text-sm font-normal outline-none focus:border-[#7678ED]" /></label>;
}
