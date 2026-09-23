'use client';

import React, { useEffect, useState } from 'react';
import StudentSidebar from '@/components/StudentSidebar';
import { supabase } from '@/lib/supabase';
import { getCurrentStudentId } from '@/lib/currentUser';
import { Building2, MapPin, Briefcase, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

interface JobPosition {
  id: string;
  title: string;
  company_name: string;
  location?: string;
  description?: string;
  slots?: number;
}

interface CurrentApplication {
  id: string;
  job_id: string | null;
  company_name: string;
  job_title: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
}

const applicationStatusLabels: Record<CurrentApplication['status'], string> = {
  pending: 'รอการพิจารณา',
  approved: 'ผ่านการอนุมัติ',
  rejected: 'ไม่ผ่านการอนุมัติ',
  cancelled: 'ยกเลิกใบสมัคร',
};

// ข้อมูลตัวอย่างสำหรับแสดงผล (Mock Data) หลายบริษัทเพื่อให้ดูสมจริง
const MOCK_JOBS: JobPosition[] = [
  {
    id: 'mock-1',
    title: 'Frontend Developer (React / Next.js)',
    company_name: 'บริษัท เทคโนโลยีตัวอย่าง จำกัด (Sample Tech Co., Ltd.)',
    location: 'กรุงเทพมหานคร (Remote / Hybrid)',
    description: 'พัฒนาและดูแลระบบเว็บแอปพลิเคชันด้วย Next.js, TypeScript และ Tailwind CSS ร่วมกับทีมโปรดักส์มืออาชีพ',
    slots: 3,
  },
  {
    id: 'mock-2',
    title: 'Software Engineer Intern',
    company_name: 'บริษัท นวัตกรรมดิจิทัล จำกัด (Digital Innovation Co., Ltd.)',
    location: 'ภูเก็ต (On-site)',
    description: 'พัฒนา API ด้วย Node.js และจัดการฐานข้อมูล PostgreSQL พร้อมเรียนรู้ระบบ Cloud Deployment',
    slots: 2,
  },
  {
    id: 'mock-3',
    title: 'IT Support & Network Operations',
    company_name: 'บริษัท ซอฟต์แวร์โซลูชันส์ จำกัด (Software Solutions)',
    location: 'นครศรีธรรมราช (On-site)',
    description: 'ดูแลระบบเครือข่ายภายในองค์กร แก้ไขปัญหาฮาร์ดแวร์และซอฟต์แวร์เบื้องต้นสำหรับพนักงาน',
    slots: 1,
  },
];

export default function SelectCompanyPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [jobs, setJobs] = useState<JobPosition[]>(MOCK_JOBS); // กำหนดค่าเริ่มต้นด้วย Mock Data ทันที
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [currentApplication, setCurrentApplication] = useState<CurrentApplication | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const userId = await getCurrentStudentId();
    if (userId) {
      setStudentId(userId);

      // พยายามดึงข้อมูลจริงจาก Supabase (ถ้ามี)
      const { data: jobList, error: jobError } = await supabase
        .from('jobs')
        .select('*')
        .eq('status', 'open')
        .is('archived_at', null);

      if (!jobError && jobList && jobList.length > 0) {
        setJobs(jobList); // ถ้ามีข้อมูลใน DB ให้ใช้ข้อมูลจริง
      }

      const { data: application } = await supabase
        .from('job_applications')
        .select('id, job_id, company_name, job_title, status')
        .eq('student_id', userId)
        .in('status', ['pending', 'approved', 'rejected', 'cancelled'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (application) {
        setCurrentApplication(application as CurrentApplication);
        if (application.job_id) {
          setSelectedJobId(application.job_id);
        }
      }
    }

    setLoading(false);
  }

  // ฟังก์ชันกดเลือกยืนยันบริษัท
  const handleConfirmCompany = async (job: JobPosition) => {
    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      // ถ้าเป็นข้อมูลจำลอง (Mock) ให้บันทึกจำลองบนหน้าจอทันที
      if (job.id.startsWith('mock-')) {
        setSelectedJobId(job.id);
        setCurrentApplication({
          id: job.id,
          job_id: job.id,
          company_name: job.company_name,
          job_title: job.title,
          status: 'pending',
        });
        setSuccessMessage(`ส่งใบสมัครที่ "${job.company_name}" ตำแหน่ง "${job.title}" แล้ว`);
        setTimeout(() => setSuccessMessage(null), 5000);
        setSubmitting(false);
        return;
      }

      if (!studentId) {
        throw new Error('ไม่พบข้อมูลนักศึกษา กรุณาเข้าสู่ระบบใหม่');
      }

      if (currentApplication?.job_id === job.id && currentApplication.status === 'pending') {
        throw new Error('คุณส่งใบสมัครตำแหน่งนี้แล้ว และกำลังรอการพิจารณา');
      }

      const { data: newApplication, error } = await supabase
          .from('job_applications')
          .insert({
            student_id: studentId,
            job_id: job.id,
            job_title: job.title,
            company_name: job.company_name,
            status: 'pending',
          })
          .select('id, job_id, company_name, job_title, status')
          .single();

      if (error) throw error;
      setCurrentApplication(newApplication as CurrentApplication);

      setSelectedJobId(job.id);
      setSuccessMessage(`ส่งใบสมัครที่ "${job.company_name}" ตำแหน่ง "${job.title}" เรียบร้อยแล้ว`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setErrorMessage(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-900" />
        <span className="ml-2 text-sm text-slate-500">กำลังโหลดข้อมูลบริษัท...</span>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800 text-sm font-sans">
      <StudentSidebar />

      <main className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto">
        <div>
          <h1 className="text-xl font-bold text-slate-900">เลือกสถานประกอบการ (บริษัท) ฝึกงาน</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            เลือกบริษัทและตำแหน่งงานที่คุณต้องการยื่นยืนยันสิทธิ์เพื่อใช้ในการฝึกงาน
          </p>
        </div>

        {successMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {currentApplication?.company_name && (
          <div className="bg-indigo-900 text-white rounded-2xl p-5 shadow-md flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] bg-indigo-800 text-indigo-200 px-2.5 py-0.5 rounded-full font-medium">
                {currentApplication.status === 'approved' ? 'ใบสมัครผ่านการอนุมัติ' : 'ใบสมัครกำลังรอพิจารณา'}
              </span>
              <h2 className="text-base font-bold">{currentApplication.company_name}</h2>
              <p className="text-xs font-semibold text-white">สถานะล่าสุด: {applicationStatusLabels[currentApplication.status]}</p>
              <p className="text-xs text-indigo-200">ตำแหน่ง: {currentApplication.job_title || 'ยังไม่ระบุตำแหน่ง'}</p>
            </div>
            <Building2 className="w-10 h-10 text-indigo-300 opacity-80" />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.map((job) => {
            const isSelected = selectedJobId === job.id;

            return (
              <div
                key={job.id}
                className={`bg-white rounded-2xl p-5 border transition-all space-y-3 shadow-sm ${
                  isSelected ? 'border-indigo-900 ring-2 ring-indigo-900/10 bg-indigo-50/10' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{job.company_name}</h3>
                    <p className="text-xs font-semibold text-indigo-900 mt-0.5 flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5" /> {job.title}
                    </p>
                  </div>
                  {isSelected && (
                    <span className="bg-emerald-100 text-emerald-800 text-[11px] px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> เลือกแล้ว
                    </span>
                  )}
                </div>

                {job.location && (
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" /> {job.location}
                  </p>
                )}

                {job.description && (
                  <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 line-clamp-2">
                    {job.description}
                  </p>
                )}

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    disabled={submitting || isSelected}
                    onClick={() => handleConfirmCompany(job)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                        : 'bg-indigo-900 hover:bg-indigo-800 text-white shadow-sm'
                    }`}
                  >
                    {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{isSelected ? 'ส่งใบสมัครแล้ว' : 'สมัครตำแหน่งนี้'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
