'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import StudentSidebar from '@/components/StudentSidebar';
import { supabase } from '@/lib/supabase';
import { getCurrentStudentId } from '@/lib/currentUser';
import { 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Plus, 
  X, 
  Loader2,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  User,
  Building2,
  FileText,
  Lock
} from 'lucide-react';

interface WeeklyLog {
  id: string;
  week_number: number;
  title: string;
  content: string;
  status: 'pending_review' | 'approved' | 'not_due';
  submitted_at?: string;
  advisor_feedback?: string;
}

interface StudentProfile {
  name: string;
  studentId: string;
  major: string;
  company: string;
  position: string;
}

type RealApplicationStatus = 'pending' | 'approved' | 'rejected';

export default function StudentWeeklyLogsSubPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [recordId, setRecordId] = useState<string | null>(null);

  const [studentInfo, setStudentInfo] = useState<StudentProfile>({
    name: '',
    studentId: '',
    major: '',
    company: 'ยังไม่ระบุบริษัท',
    position: 'ยังไม่ระบุตำแหน่ง',
  });

  // ---------------------------------------------------------------------
  // สถานะการอนุมัติ "จริง" มาจากตาราง applications เหมือนหน้า internship-record
  // ปลดล็อคหน้านี้ก็ต่อเมื่อมีใบสมัครที่ status = 'approved' เท่านั้น
  // ---------------------------------------------------------------------
  const [isApproved, setIsApproved] = useState(false);
  const [realStatus, setRealStatus] = useState<RealApplicationStatus>('pending');

  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // ฟอร์มสำหรับเขียนบันทึกสัปดาห์ใหม่
  const [weekNumber, setWeekNumber] = useState<number>(1);
  const [weekTitle, setWeekTitle] = useState('');
  const [weekContent, setWeekContent] = useState('');

  // รายการบันทึกรายสัปดาห์ (เริ่มต้นเป็นค่าว่าง รอข้อมูลจริง)
  const [weeklyLogs, setWeeklyLogs] = useState<WeeklyLog[]>([]);

  useEffect(() => {
    fetchStudentData();
  }, []);

  async function fetchStudentData() {
    setLoading(true);
    const userId = await getCurrentStudentId();
    if (!userId) {
      setLoading(false);
      return;
    }
    setStudentId(userId);

    // ---------------------------------------------------------------
    // เช็คสถานะการอนุมัติจากตาราง applications ก่อน (เหมือนหน้า internship-record)
    // เช็คว่ามีใบไหน "approved" อยู่บ้าง (ไม่ใช่แค่ใบล่าสุด)
    // ---------------------------------------------------------------
    const { data: approvedApp, error: approvedError } = await supabase
      .from('applications')
      .select('company_name, position')
      .eq('student_id', userId)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (approvedError) {
      console.error('ตรวจสอบสถานะการอนุมัติไม่สำเร็จ:', approvedError);
    }

    let derivedStatus: RealApplicationStatus = 'pending';

    if (approvedApp) {
      derivedStatus = 'approved';
    } else {
      const { data: latestApp } = await supabase
        .from('applications')
        .select('status')
        .eq('student_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestApp?.status === 'rejected') {
        derivedStatus = 'rejected';
      }
    }

    setIsApproved(derivedStatus === 'approved');
    setRealStatus(derivedStatus);

    // ดึงข้อมูลโปรไฟล์นักศึกษา
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    // ดึงข้อมูลการฝึกงานเพื่อเช็คบริษัทและตำแหน่ง
    const { data: record } = await supabase
      .from('internship_records')
      .select('*')
      .eq('student_id', userId)
      .maybeSingle();

    if (record) {
      setRecordId(record.id);
    }

    setStudentInfo({
      name: profile?.full_name ?? 'ยังไม่ระบุชื่อ',
      studentId: profile?.student_code ?? 'ยังไม่ระบุรหัสนศ.',
      major: [profile?.faculty, profile?.major].filter(Boolean).join(' • ') || 'ยังไม่ระบุสาขาวิชา',
      company: record?.company_name ?? approvedApp?.company_name ?? 'ยังไม่ระบุบริษัท',
      position: record?.position ?? approvedApp?.position ?? 'ยังไม่ระบุตำแหน่ง',
    });

    setLoading(false);
  }

  const handleOpenModal = () => {
    if (!isApproved) {
      setErrorMessage('ระบบถูกล็อกอยู่ ต้องรอผู้ประกอบการอนุมัติก่อนจึงจะส่งบันทึกประจำสัปดาห์ได้');
      setTimeout(() => setErrorMessage(null), 4000);
      return;
    }
    setIsModalOpen(true);
  };

  const handleCreateLog = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isApproved) {
      setErrorMessage('ระบบถูกล็อกอยู่ ต้องรอผู้ประกอบการอนุมัติก่อนจึงจะส่งบันทึกประจำสัปดาห์ได้');
      return;
    }

    if (!weekTitle.trim() || !weekContent.trim()) {
      setErrorMessage('กรุณากรอกหัวข้อและรายละเอียดให้ครบถ้วน');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      if (recordId && studentId) {
        await supabase.from('progress_updates').insert({
          record_id: recordId,
          student_id: studentId,
          note: `[สัปดาห์ที่ ${weekNumber}] ${weekTitle}: ${weekContent}`,
        });
      }

      const newLog: WeeklyLog = {
        id: Date.now().toString(),
        week_number: weekNumber,
        title: weekTitle,
        content: weekContent,
        status: 'pending_review',
        submitted_at: 'เมื่อสักครู่นี้',
      };

      setWeeklyLogs([newLog, ...weeklyLogs]);
      setWeekTitle('');
      setWeekContent('');
      setIsModalOpen(false);
      setSuccessMessage('ส่งบันทึกประจำสัปดาห์ให้อาจารย์เรียบร้อยแล้ว');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredLogs = weeklyLogs.filter(log => {
    if (activeTab === 'pending') return log.status === 'pending_review';
    if (activeTab === 'approved') return log.status === 'approved';
    return true;
  });

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-61px)] items-center justify-center bg-slate-100">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-900" />
        <span className="ml-2 text-sm text-slate-500">กำลังโหลดข้อมูล...</span>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-61px)] bg-slate-100 text-slate-800 text-sm font-sans">
      <StudentSidebar />

      <main className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto">
        
        {/* Navigation Back & Action */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-900 hover:text-indigo-700 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>กลับไปหน้าหลักฝึกงาน</span>
          </button>

          <button
            onClick={handleOpenModal}
            disabled={!isApproved}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-md transition-all ${
              isApproved
                ? 'bg-indigo-900 hover:bg-indigo-800 text-white cursor-pointer'
                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
            }`}
          >
            {isApproved ? <Plus className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            <span>เพิ่มบันทึกประจำสัปดาห์</span>
          </button>
        </div>

        {/* Header Title */}
        <div>
          <h1 className="text-xl font-bold text-slate-900">บันทึกประจำสัปดาห์และการลงนามนิเทศ</h1>
          <p className="text-xs text-slate-500 mt-0.5">รายการส่งบันทึกงานรายสัปดาห์และการรับรองทางวิชาการจากอาจารย์ที่ปรึกษา</p>
        </div>

        {/* Locked Notice Banner ถ้ายังไม่ได้รับอนุมัติจาก Coordinator */}
        {!isApproved && (
          <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800 shadow-sm">
            <Lock className="w-5 h-5 shrink-0 text-amber-500" />
            <p className="text-sm font-medium">
              {realStatus === 'rejected' ? (
                <>
                  คำร้องฝึกงานของคุณ<strong>ไม่ได้รับการอนุมัติ</strong>จากผู้ประกอบการ
                  กรุณาเลือกสมัครงานใหม่ที่หน้า Dashboard ก่อนจึงจะส่งบันทึกประจำสัปดาห์ได้
                </>
              ) : (
                <>
                  หน้านี้จะ<strong>ปลดล็อคก็ต่อเมื่อได้รับการอนุมัติ</strong>จากผู้ประกอบการ (Coordinator) แล้วเท่านั้น
                  ขณะนี้ยังไม่สามารถส่งบันทึกประจำสัปดาห์ได้
                </>
              )}
            </p>
          </div>
        )}

        {/* Student Profile Card (เชื่อมโยงข้อมูลจริงของ นศ.) */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-900 shrink-0">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-sm">{studentInfo.name} ({studentInfo.studentId})</h2>
              <p className="text-xs text-slate-500 mt-0.5">{studentInfo.major}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-100 w-full md:w-auto">
            <Building2 className="w-4 h-4 text-indigo-900 shrink-0" />
            <span>สถานที่ฝึกงาน: <strong className="text-slate-900">{studentInfo.company}</strong> ({studentInfo.position})</span>
          </div>
        </div>

        {/* Success / Error Banners */}
        {successMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex gap-2 text-xs">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${activeTab === 'all' ? 'bg-indigo-900 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
            >
              ทั้งหมด ({weeklyLogs.length})
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${activeTab === 'pending' ? 'bg-indigo-900 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
            >
              รอตรวจ
            </button>
            <button
              onClick={() => setActiveTab('approved')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${activeTab === 'approved' ? 'bg-indigo-900 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
            >
              อนุมัติแล้ว
            </button>
          </div>
          <span className="text-xs text-slate-400">รายการส่งงานรายสัปดาห์</span>
        </div>

        {/* Weekly Logs List */}
        <div className="space-y-3">
          {filteredLogs.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs space-y-2">
              <FileText className="w-8 h-8 mx-auto text-slate-300" />
              <p className="font-medium text-slate-600">ยังไม่มีบันทึกประจำสัปดาห์</p>
              <p className="text-[11px] text-slate-400">
                {isApproved
                  ? 'คลิกที่ปุ่ม "เพิ่มบันทึกประจำสัปดาห์" ด้านบนเพื่อเริ่มส่งงานรายสัปดาห์ของคุณ'
                  : 'ต้องรอผู้ประกอบการอนุมัติก่อน จึงจะเริ่มส่งบันทึกประจำสัปดาห์ได้'}
              </p>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 hover:border-indigo-200 transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-indigo-900 text-xs shrink-0">
                      W{log.week_number}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">
                        สัปดาห์ที่ {log.week_number}: {log.title}
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        ส่งเมื่อ: {log.submitted_at || 'เร็วๆนี้'}
                      </p>
                    </div>
                  </div>

                  <div>
                    {log.status === 'approved' ? (
                      <span className="bg-emerald-100 text-emerald-800 text-xs px-3 py-1 rounded-full font-semibold inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> อนุมัติแล้ว
                      </span>
                    ) : (
                      <span className="bg-amber-100 text-amber-800 text-xs px-3 py-1 rounded-full font-semibold inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> รออาจารย์ลงนาม
                      </span>
                    )}
                  </div>

                </div>

                {log.content && (
                  <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                    {log.content}
                  </p>
                )}

                {log.advisor_feedback && (
                  <div className="mt-2 text-[11px] bg-indigo-50/60 border border-indigo-100 p-2.5 rounded-xl text-indigo-900">
                    <span className="font-semibold">ความเห็นจากอาจารย์ที่ปรึกษา: </span>
                    {log.advisor_feedback}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

      </main>

      {/* MODAL: เพิ่มบันทึกประจำสัปดาห์ (เปิดได้เฉพาะตอน isApproved เท่านั้น ปุ่มเปิดถูกล็อกไว้แล้ว) */}
      {isModalOpen && isApproved && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900">เขียนบันทึกประจำสัปดาห์ใหม่</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLog} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">สัปดาห์ที่ *</label>
                <input
                  type="number"
                  min={1}
                  max={16}
                  value={weekNumber}
                  onChange={(e) => setWeekNumber(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-900/20 focus:border-indigo-900"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">หัวข้อผลงานสัปดาห์นี้ *</label>
                <input
                  type="text"
                  value={weekTitle}
                  onChange={(e) => setWeekTitle(e.target.value)}
                  placeholder="เช่น พัฒนาหน้า Dashboard และเชื่อมต่อ API..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-900/20 focus:border-indigo-900"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">รายละเอียดการปฏิบัติงาน *</label>
                <textarea
                  rows={4}
                  value={weekContent}
                  onChange={(e) => setWeekContent(e.target.value)}
                  placeholder="อธิบายรายละเอียดงานที่ได้ปฏิบัติ ข้อติดขัด หรือความคืบหน้า..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-900/20 focus:border-indigo-900 resize-none"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-600 hover:bg-slate-100 font-medium rounded-lg"
                  disabled={submitting}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-indigo-900 hover:bg-indigo-800 text-white font-semibold rounded-lg shadow-sm flex items-center gap-1.5 disabled:opacity-60"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{submitting ? 'กำลังบันทึก...' : 'บันทึกและส่งข้อมูล'}</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
