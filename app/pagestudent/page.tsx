'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  Search,
  MapPin,
  User,
  Bell,
  Upload,
  Building2,
  Briefcase,
  ChevronRight,
  CheckCircle2,
  X,
  Calendar,
  UserCheck,
  Plus,
  Trash2,
  Check,
  File,
  LayoutDashboard,
  FileSpreadsheet,
  Loader2,
  Send,
  Phone,
  Mail,
  MessageCircle,
} from 'lucide-react';

import StudentSidebar from '@/components/StudentSidebar';
import { supabase } from '@/lib/supabase';
import { getCurrentStudentId } from '@/lib/currentUser';

interface Job {
  id: string;
  title: string;
  company: string;
  badge?: string;
  match: string;
  tags: string[];
  salary: string;
  location: string;
  workType: string;
  responsibilities: string[];
  qualifications: string[];
  perks: string[];
  timeline: {
    open: string;
    interview: string;
    start: string;
  };
  hrName?: string;
  hrRole?: string;
  contactPhone?: string;
  contactEmail?: string;
  contactLine?: string;
}

interface ProfileData {
  id: string;
  name: string;
  studentId: string;
  faculty: string;
  major: string;
  year: string;
  gpa: string;
  credits: string;
  skills: string[];
  resumeName: string;
  resumeUrl: string | null;
  avatarUrl: string | null;
}

function getErrorMessage(error: unknown) {
  return typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message?: unknown }).message === 'string'
    ? (error as { message: string }).message
    : '';
}

function isDuplicateApplicationError(error: unknown) {
  const message = getErrorMessage(error);

  return (
    message.includes('already exists') ||
    message.includes('duplicate key') ||
    message.includes('job_applications_one_active_job_idx')
  );
}

function getApplyErrorMessage(error: unknown) {
  const message = getErrorMessage(error);

  if (isDuplicateApplicationError(error)) {
    return 'คุณมีรายการสมัครตำแหน่งนี้อยู่แล้ว กรุณาตรวจสอบในหน้าติดตามการสมัคร';
  }

  if (message.includes('placement has already been confirmed')) {
    return 'คุณได้รับการยืนยันสถานที่ฝึกงานแล้ว จึงไม่สามารถสมัครตำแหน่งอื่นได้';
  }

  if (message.includes('not available')) {
    return 'ตำแหน่งนี้ปิดรับสมัครหรือไม่พร้อมให้สมัครแล้ว';
  }

  if (message.includes('Only students can start an application')) {
    return 'บัญชีนี้ไม่มีสิทธิ์สมัครตำแหน่งฝึกงาน';
  }

  return message || 'เกิดข้อผิดพลาดในการสมัครงาน';
}

const EMPTY_PROFILE: ProfileData = {
  id: '',
  name: '',
  studentId: '',
  faculty: '',
  major: '',
  year: '',
  gpa: '',
  credits: '',
  skills: [],
  resumeName: '',
  resumeUrl: null,
  avatarUrl: null,
};

export default function StudentDashboard() {
  const router = useRouter();

  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  // =========================================================
  // Search & Filters
  // =========================================================
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const [profileData, setProfileData] =
    useState<ProfileData>(EMPTY_PROFILE);

  const [loadingProfile, setLoadingProfile] =
    useState(true);

  const [internshipRecordId, setInternshipRecordId] =
    useState<string | null>(null);

  const [isEditProfileOpen, setIsEditProfileOpen] =
    useState(false);

  const [tempProfile, setTempProfile] =
    useState<ProfileData>(EMPTY_PROFILE);

  const [newSkillInput, setNewSkillInput] =
    useState('');

  const [resumeFile, setResumeFile] =
    useState<File | null>(null);

  const [studentPhotoPreview, setStudentPhotoPreview] =
    useState<string | null>(null);

  const [studentPhotoUploading, setStudentPhotoUploading] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [saveError, setSaveError] =
    useState<string | null>(null);

  const [isExternalCompanyOpen, setIsExternalCompanyOpen] =
    useState(false);

  const [externalSaving, setExternalSaving] =
    useState(false);

  const [externalError, setExternalError] =
    useState<string | null>(null);

  const [externalCompany, setExternalCompany] = useState({
    companyName: '',
    position: '',
    location: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    companyWebsite: '',
    details: '',
  });

  // =========================================================
  // Jobs from Database
  // =========================================================
  const [jobsFromDB, setJobsFromDB] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [activeApplicationJobIds, setActiveApplicationJobIds] =
    useState<Set<string>>(new Set());

  // =========================================================
  // สมัครงาน
  // =========================================================
  const [applying, setApplying] =
    useState(false);

  const [applyError, setApplyError] =
    useState<string | null>(null);

  // =========================================================
  // โหลดข้อมูลนักศึกษา
  // =========================================================

  useEffect(() => {
    loadStudentData();
    loadJobsFromDatabase();
  }, []);

  async function loadStudentData() {
    setLoadingProfile(true);

    try {
      const userId = await getCurrentStudentId();

      if (!userId) {
        console.error('ไม่พบผู้ใช้ปัจจุบัน (userId เป็นค่าว่างหรือ null)');
        setLoadingProfile(false);
        return;
      }

      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error(
          'โหลดโปรไฟล์ไม่สำเร็จ:',
          JSON.stringify(profileError, null, 2)
        );
      }

      const {
        data: record,
        error: recordError,
      } = await supabase
        .from('internship_records')
        .select('*')
        .eq('student_id', userId)
        .order('updated_at', {
          ascending: false,
        })
        .limit(1)
        .maybeSingle();

      if (recordError) {
        console.error(
          'โหลด internship record ไม่สำเร็จ:',
          JSON.stringify(recordError, null, 2)
        );
      }

      let avatarUrl = profile?.avatar_url ?? null;

      if (avatarUrl) {
        const { data: avatarData } =
          await supabase.storage
            .from('resumes')
            .createSignedUrl(avatarUrl, 60 * 60 * 24 * 7);

        avatarUrl = avatarData?.signedUrl ?? null;
      }

      const loaded: ProfileData = {
        id: userId,
        name: profile?.full_name ?? '',
        studentId: profile?.user_code ?? '',
        faculty: profile?.faculty ?? '',
        major: profile?.major ?? '',
        year: profile?.year?.toString() ?? '',
        gpa: profile?.gpa?.toString() ?? '',
        credits: profile?.credits?.toString() ?? '',
        skills:
          record?.skills ??
          profile?.skills ??
          [],
        resumeName:
          profile?.resume_name ?? '',
        resumeUrl:
          profile?.resume_url ?? null,
        avatarUrl,
      };

      setProfileData(loaded);
      setInternshipRecordId(
        record?.id ?? null
      );
    } catch (err) {
      console.error('เกิดข้อผิดพลาดในการโหลดข้อมูลนักศึกษา:', JSON.stringify(err, null, 2));
    } finally {
      setLoadingProfile(false);
    }
  }

  // =========================================================
  // โหลดข้อมูลประกาศงานจาก Supabase
  // =========================================================

  async function loadJobsFromDatabase() {
    setLoadingJobs(true);
    try {
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select(`
          id,
          company_id,
          title,
          location,
          department,
          positions,
          work_type,
          description,
          qualifications,
          welfare,
          start_date,
          end_date,
          status,
          archived_at,
          companies(name, contact_name, contact_email, contact_phone)
        `)
        .eq('status', 'open')
        .is('archived_at', null)
        .order('created_at', { ascending: false });

      if (jobsError) {
        console.error('ดึงข้อมูลประกาศงานไม่สำเร็จ:', jobsError);
        return;
      }

      const userId = await getCurrentStudentId();
      if (userId) {
        const { data: applicationsData, error: applicationsError } =
          await supabase
            .from('job_applications')
            .select('job_id')
            .eq('student_id', userId)
            .in('application_status', [
              'draft',
              'submitted',
              'interview',
              'offer_received',
            ]);

        if (applicationsError) {
          console.error(
            'ดึงข้อมูลใบสมัครงานไม่สำเร็จ:',
            applicationsError
          );
        } else {
          setActiveApplicationJobIds(
            new Set(
              (applicationsData ?? [])
                .map((application) => application.job_id)
                .filter((jobId): jobId is string => Boolean(jobId))
            )
          );
        }
      }

      // แปลงข้อมูลจาก database format เป็น Job interface
      const transformedJobs: Job[] = (jobsData || []).map((job: any) => {
        const qualificationsArray = Array.isArray(job.qualifications)
          ? job.qualifications
          : typeof job.qualifications === 'string'
          ? [job.qualifications]
          : [];

        return {
          id: job.id,
          title: job.title || 'ไม่ระบุตำแหน่ง',
          company: job.companies?.name || 'ไม่ระบุบริษัท',
          match: '85%',
          tags: qualificationsArray.slice(0, 3),
          salary: job.welfare || 'ติดต่อสอบถาม',
          location: job.location || 'ไม่ระบุสถานที่',
          workType: job.work_type || 'ไม่ระบุ',
          description: job.description || '',
          responsibilities: job.description
            ? job.description.split('\n').filter((line: string) => line.trim())
            : [],
          qualifications: qualificationsArray,
          perks: job.welfare ? [job.welfare] : [],
          timeline: {
            open: job.start_date || 'ติดต่อสอบถาม',
            interview: 'ติดต่อสอบถาม',
            start: job.end_date || 'ติดต่อสอบถาม',
          },
          hrName: job.companies?.contact_name || undefined,
          contactPhone: job.companies?.contact_phone || undefined,
          contactEmail: job.companies?.contact_email || undefined,
        };
      });

      setJobsFromDB(transformedJobs);
    } catch (err) {
      console.error('เกิดข้อผิดพลาดในการดึงข้อมูลประกาศงาน:', err);
    } finally {
      setLoadingJobs(false);
    }
  }

  // =========================================================
  // เปิด Modal แก้ไขโปรไฟล์
  // =========================================================

  const handleOpenEditProfile = () => {
    setTempProfile({
      ...profileData,
    });

    setNewSkillInput('');
    setResumeFile(null);
    setStudentPhotoPreview(profileData.avatarUrl ?? null);
    setSaveError(null);

    setIsEditProfileOpen(true);
  };

  // =========================================================
  // บันทึกโปรไฟล์
  // =========================================================

  const handleSaveProfile = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setSaving(true);
    setSaveError(null);

    try {
      let resumeUrl =
        tempProfile.resumeUrl;

      let resumeName =
        tempProfile.resumeName;

      if (resumeFile) {
        const filePath =
          `${tempProfile.id}/${Date.now()}_${resumeFile.name}`;

        const {
          error: uploadError,
        } = await supabase.storage
          .from('resumes')
          .upload(
            filePath,
            resumeFile,
            {
              upsert: true,
            }
          );

        if (uploadError) {
          console.error('Storage Upload Error:', JSON.stringify(uploadError, null, 2));
          throw uploadError;
        }

        resumeUrl = filePath;

        resumeName =
          resumeFile.name;
      }

      const {
        error: profileUpdateError,
      } = await supabase
        .from('profiles')
        .update({
          full_name:
            tempProfile.name,

          faculty:
            tempProfile.faculty,

          major:
            tempProfile.major,

          year:
            tempProfile.year,

          gpa:
            tempProfile.gpa,

          credits:
            tempProfile.credits,

          resume_name:
            resumeName,

          resume_url:
            resumeUrl,
        })
        .eq(
          'id',
          tempProfile.id
        );

      if (profileUpdateError) {
        console.error('Profiles Update Error:', JSON.stringify(profileUpdateError, null, 2));
        throw profileUpdateError;
      }

      let recordIdToLog =
        internshipRecordId;

      if (internshipRecordId) {
        const {
          error: recordUpdateError,
        } = await supabase
          .from('internship_records')
          .update({
            skills:
              tempProfile.skills,

            updated_at:
              new Date().toISOString(),
          })
          .eq(
            'id',
            internshipRecordId
          );

        if (recordUpdateError) {
          console.error('Internship Records Update Error:', JSON.stringify(recordUpdateError, null, 2));
          throw recordUpdateError;
        }
      } else {
        const {
          data: newRecord,
          error: insertError,
        } = await supabase
          .from('internship_records')
          .insert({
            student_id:
              tempProfile.id,

            skills:
              tempProfile.skills,

            status:
              'in_progress',
          })
          .select()
          .single();

        if (insertError) {
          console.error('Internship Records Insert Error:', JSON.stringify(insertError, null, 2));
          throw insertError;
        }

        recordIdToLog =
          newRecord.id;

        setInternshipRecordId(
          newRecord.id
        );
      }

      if (recordIdToLog) {
        const {
          error: logError,
        } = await supabase
          .from('progress_updates')
          .insert({
            record_id:
              recordIdToLog,

            student_id:
              tempProfile.id,

            note:
              'นักศึกษาอัปเดตข้อมูลโปรไฟล์และทักษะ',
          });

        if (logError) {
          console.error(
            'บันทึก log ไม่สำเร็จ:',
            JSON.stringify(logError, null, 2)
          );
        }
      }

      setProfileData({
        ...tempProfile,
        resumeUrl,
        resumeName,
      });

      setIsEditProfileOpen(false);
    } catch (err: any) {
      console.error('บันทึกโปรไฟล์ไม่สำเร็จ (Detailed Error):', JSON.stringify(err, null, 2));
      console.error('Original Error Object:', err);

      const errorMessage =
        err?.message ||
        err?.error_description ||
        (typeof err === 'object' ? JSON.stringify(err) : String(err));

      setSaveError(
        `เกิดข้อผิดพลาดในการบันทึกข้อมูล: ${errorMessage}`
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // เพิ่มทักษะ
  // =========================================================

  const handleAddSkill = () => {
    if (
      newSkillInput.trim() &&
      !tempProfile.skills.includes(
        newSkillInput.trim()
      )
    ) {
      setTempProfile({
        ...tempProfile,

        skills: [
          ...tempProfile.skills,
          newSkillInput.trim(),
        ],
      });

      setNewSkillInput('');
    }
  };

  // =========================================================
  // ลบทักษะ
  // =========================================================

  const handleRemoveSkill = (
    skillToRemove: string
  ) => {
    setTempProfile({
      ...tempProfile,

      skills:
        tempProfile.skills.filter(
          (s) =>
            s !== skillToRemove
        ),
    });
  };

  // =========================================================
  // อัปโหลดรูปนักศึกษา
  // =========================================================

  const handleStudentPhotoChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setSaveError('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setSaveError('ขนาดรูปต้องไม่เกิน 5MB');
      return;
    }

    setSaveError(null);
    setStudentPhotoUploading(true);

    try {
      const localPreview = URL.createObjectURL(file);
      setStudentPhotoPreview(localPreview);
      setProfileData((prev) => ({
        ...prev,
        avatarUrl: localPreview,
      }));
      setTempProfile((prev) => ({
        ...prev,
        avatarUrl: localPreview,
      }));

      const filePath =
        `${profileData.id}/avatar_${Date.now()}_${file.name}`;

      const { error: uploadError } =
        await supabase.storage
          .from('resumes')
          .upload(filePath, file, {
            upsert: true,
          });

      if (uploadError) {
        throw uploadError;
      }

      const { data: signedData, error: signedError } =
        await supabase.storage
          .from('resumes')
          .createSignedUrl(filePath, 60 * 60 * 24 * 7);

      if (signedError || !signedData?.signedUrl) {
        throw signedError || new Error('สร้าง URL รูปภาพไม่สำเร็จ');
      }

      setStudentPhotoPreview(signedData.signedUrl);
      setProfileData((prev) => ({
        ...prev,
        avatarUrl: signedData.signedUrl,
      }));
      setTempProfile((prev) => ({
        ...prev,
        avatarUrl: signedData.signedUrl,
      }));

      const { error: avatarDbError } =
        await supabase
          .from('profiles')
          .update({
            avatar_url: filePath,
          })
          .eq('id', profileData.id);

      if (avatarDbError) {
        console.warn(
          'บันทึก path รูปลง profiles ไม่สำเร็จ แต่รูปยังแสดงบนเว็บแล้ว:',
          avatarDbError
        );
      }
    } catch (err: any) {
      console.error('อัปโหลดรูปนักศึกษาไม่สำเร็จ:', err);
      setSaveError(
        err?.message || 'อัปโหลดรูปนักศึกษาไม่สำเร็จ'
      );
    } finally {
      setStudentPhotoUploading(false);
    }
  };

  // =========================================================
  // เปลี่ยนไฟล์ผลการศึกษา
  // =========================================================

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (
      e.target.files &&
      e.target.files[0]
    ) {
      const file =
        e.target.files[0];

      setResumeFile(file);

      setTempProfile({
        ...tempProfile,
        resumeName:
          file.name,
      });
    }
  };

  // =========================================================
  // เพิ่มบริษัทจากภายนอก
  // =========================================================

  const handleOpenExternalCompany = () => {
    setExternalError(null);
    setIsExternalCompanyOpen(true);
  };

  const handleSubmitExternalCompany =
    async (
      e: React.FormEvent
    ) => {
      e.preventDefault();

      setExternalSaving(true);
      setExternalError(null);

      try {
        const {
          error,
        } = await supabase
          .from(
            'external_company_submissions'
          )
          .insert({
            student_id:
              profileData.id,

            company_name:
              externalCompany.companyName,

            position:
              externalCompany.position,

            location:
              externalCompany.location,

            contact_name:
              externalCompany.contactName,

            contact_phone:
              externalCompany.contactPhone,

            contact_email:
              externalCompany.contactEmail,

            company_website:
              externalCompany.companyWebsite,

            details:
              externalCompany.details,

            status:
              'pending',
          });

        if (error) {
          throw error;
        }

        setExternalCompany({
          companyName: '',
          position: '',
          location: '',
          contactName: '',
          contactPhone: '',
          contactEmail: '',
          companyWebsite: '',
          details: '',
        });

        setIsExternalCompanyOpen(false);
      } catch (err: any) {
        console.error(
          'ส่งข้อมูลบริษัทไม่สำเร็จ:',
          JSON.stringify(err, null, 2)
        );

        setExternalError(
          err.message ??
            'เกิดข้อผิดพลาดในการส่งข้อมูลบริษัท'
        );
      } finally {
        setExternalSaving(false);
      }
    };

  // =========================================================
  // สมัครงาน
  // =========================================================

  const handleApplyJob = async () => {
    if (
      !selectedJob ||
      !profileData.id
    ) {
      return;
    }

    if (activeApplicationJobIds.has(selectedJob.id)) {
      router.push('/select-company');
      return;
    }

    setApplying(true);
    setApplyError(null);

    try {
      const {
        error,
      } = await supabase
        .rpc('start_job_application', {
          job_id: selectedJob.id,
          external_submission_id: null,
        });

      if (error) {
        throw error;
      }

      setActiveApplicationJobIds((current) => {
        const next = new Set(current);
        next.add(selectedJob.id);
        return next;
      });
      setSelectedJob(null);

      router.push('/select-company');
    } catch (err: unknown) {
      console.error(
        'สมัครงานไม่สำเร็จ:',
        JSON.stringify(err, null, 2)
      );

      if (selectedJob && isDuplicateApplicationError(err)) {
        setActiveApplicationJobIds((current) => {
          const next = new Set(current);
          next.add(selectedJob.id);
          return next;
        });
        setApplyError(null);
        return;
      }

      setApplyError(
        getApplyErrorMessage(err)
      );
    } finally {
      setApplying(false);
    }
  };

  // =========================================================
  // Search & Filter Logic
  // =========================================================

  const normalizeSearch = (value: string) =>
    value.trim().toLowerCase();

  const searchText = normalizeSearch(appliedSearch);

  const getSearchScore = (job: Job, query: string) => {
    if (!query) return 0;

    const title = normalizeSearch(job.title);
    const company = normalizeSearch(job.company);
    const tags = job.tags.map((tag) => normalizeSearch(tag));
    const location = normalizeSearch(job.location);

    if (title.startsWith(query)) return 100;
    if (company.startsWith(query)) return 90;
    if (tags.some((tag) => tag.startsWith(query))) return 80;
    if (location.startsWith(query)) return 70;
    if (title.includes(query)) return 60;
    if (company.includes(query)) return 50;
    if (tags.some((tag) => tag.includes(query))) return 40;
    if (location.includes(query)) return 30;

    return 10;
  };

  // ✅ ใช้ jobsFromDB แทน hardcoded jobs
  const jobs = jobsFromDB;

  const filteredJobs = jobs.filter((job) => {
    const searchableText = [
      job.title,
      job.company,
      job.location,
      job.workType,
      job.salary,
      ...job.tags,
      ...job.responsibilities,
      ...job.qualifications,
      ...job.perks,
    ]
      .join(' ')
      .toLowerCase();

    const matchesSearch =
      !searchText || searchableText.includes(searchText);

    const matchesFilter =
      activeFilter === 'all' ||
      (activeFilter === 'software' &&
        [
          'software',
          'developer',
          'engineer',
          'frontend',
          'backend',
          'full-stack',
          'fullstack',
          'react',
          'node',
          'typescript',
          'next.js',
          'golang',
          'cloud',
        ].some((keyword) =>
          searchableText.includes(keyword)
        )) ||
      (activeFilter === 'uiux' &&
        [
          'ui/ux',
          'designer',
          'design',
          'figma',
          'user research',
          'design system',
          'product design',
        ].some((keyword) =>
          searchableText.includes(keyword)
        )) ||
      (activeFilter === 'data' &&
        [
          'data',
          'python',
          'kafka',
          'postgresql',
          'ai',
          'machine learning',
        ].some((keyword) =>
          searchableText.includes(keyword)
        )) ||
      (activeFilter === 'allowance' &&
        job.salary.trim() !== '');

    return matchesSearch && matchesFilter;
  });

  const sortedFilteredJobs = [...filteredJobs].sort((a, b) => {
    if (!searchText) return 0;

    const scoreDiff =
      getSearchScore(b, searchText) -
      getSearchScore(a, searchText);

    if (scoreDiff !== 0) return scoreDiff;

    return a.title.localeCompare(b.title, 'en', {
      sensitivity: 'base',
    });
  });

  const searchSuggestions = searchQuery.trim()
    ? jobs
        .filter((job) => {
          const query = normalizeSearch(searchQuery);

          return (
            job.title.toLowerCase().includes(query) ||
            job.company.toLowerCase().includes(query) ||
            job.tags.some((tag) =>
              tag.toLowerCase().includes(query)
            ) ||
            job.location.toLowerCase().includes(query)
          );
        })
        .sort((a, b) => {
          const scoreDiff =
            getSearchScore(b, normalizeSearch(searchQuery)) -
            getSearchScore(a, normalizeSearch(searchQuery));

          if (scoreDiff !== 0) return scoreDiff;

          return a.title.localeCompare(b.title, 'en', {
            sensitivity: 'base',
          });
        })
        .slice(0, 6)
    : [];

  const handleSearch = () => {
    setAppliedSearch(searchQuery);
  };

  const handleFilterClick = (filter: string) => {
    setActiveFilter(filter);
    setAppliedSearch(searchQuery);
  };

  const handleSuggestionClick = (job: Job) => {
    setSearchQuery(job.title);
    setAppliedSearch(job.title);
  };

  // =========================================================
  // Loading
  // =========================================================

  if (loadingProfile || loadingJobs) {
    return (
      <div className="flex min-h-[calc(100vh-61px)] items-center justify-center bg-slate-100">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-900" />

        <span className="ml-2 text-sm text-slate-500">
          กำลังโหลดข้อมูล...
        </span>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-61px)] bg-slate-100 text-slate-800 text-sm font-sans">

      <StudentSidebar />

      <main className="flex-1 p-6 space-y-6 overflow-y-auto">

        {/* ========================================================= */}
        {/* Profile Section */}
        {/* ========================================================= */}

        <section className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">

            <div className="flex items-start space-x-4">

              <div className="relative">

                <div className="w-20 h-20 rounded-full bg-slate-200 overflow-hidden border-2 border-indigo-900 flex items-center justify-center">

                  {profileData.avatarUrl ? (
                    <img
                      src={profileData.avatarUrl}
                      alt="รูปนักศึกษา"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-slate-400" />
                  )}

                </div>

              </div>

              <div>

                <div className="flex items-center">

                  <h1 className="text-lg font-bold text-slate-900">
                    {profileData.name ||
                      'ยังไม่ระบุชื่อ'}
                  </h1>

                </div>

                <p className="text-xs text-slate-500 mt-1">
                  {profileData.faculty} • {profileData.major}
                </p>

                <p className="text-[11px] text-slate-400 mt-0.5">
                  ชั้นปีที่ {profileData.year} |
                  รหัสนักศึกษา: {profileData.studentId}
                </p>

              </div>

            </div>

            {/* Stats & Actions */}

            <div className="flex items-center space-x-6 w-full md:w-auto justify-between md:justify-end">

              <div className="text-center">

                <div className="text-2xl font-bold text-slate-800">
                  {profileData.gpa || '-'}

                  <span className="text-xs text-slate-400 font-normal">
                    {' '} / 4.00
                  </span>
                </div>

                <div className="text-[11px] text-slate-500">
                  เกรดเฉลี่ยสะสม
                </div>

              </div>

              <div className="text-center border-l border-slate-200 pl-6">

                <div className="text-2xl font-bold text-slate-800">
                  {profileData.credits || '-'}

                  <span className="text-xs text-slate-400 font-normal">
                    {' '} / 136
                  </span>
                </div>

                <div className="text-[11px] text-slate-500">
                  หน่วยกิตสะสม
                </div>

              </div>

              <div className="flex flex-col border-l border-slate-200 pl-6">

                <button
                  onClick={handleOpenEditProfile}
                  className="px-5 py-3 bg-indigo-900 hover:bg-indigo-800 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all min-w-[220px]"
                >

                  <Upload className="w-5 h-5" />

                  <span>
                    แก้ไขโปรไฟล์ / แนบผลการศึกษา
                  </span>

                </button>

              </div>

            </div>

          </div>

          {/* Skills */}

          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-2 items-center">

            <span className="text-xs font-semibold text-slate-500 mr-2">
              ทักษะความสามารถ:
            </span>

            {profileData.skills.length === 0 && (
              <span className="text-xs text-slate-400">
                ยังไม่มีข้อมูลทักษะ
                กดแก้ไขโปรไฟล์เพื่อเพิ่ม
              </span>
            )}

            {profileData.skills.map(
              (skill, index) => (
                <span
                  key={index}
                  className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-xs font-medium"
                >
                  {skill}
                </span>
              )
            )}

          </div>

        </section>

        {/* ========================================================= */}
        {/* Search & Jobs */}
        {/* ========================================================= */}

        <section className="space-y-4">

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">

            <div>

              <h2 className="text-base font-bold text-slate-900">
                ค้นหาตำแหน่งงาน & องค์กรพันธมิตรสหกิจศึกษา
              </h2>

              <p className="text-xs text-slate-500">
                ระบบคัดสรรงานที่เหมาะสมกับทักษะของคุณ
                (AI Skill Matching)
              </p>

            </div>

          </div>

          {/* Search */}

          <div className="relative">
            <div className="flex gap-2">

              <div className="relative flex-1">

                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />

                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setAppliedSearch(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                  placeholder="ค้นหาตามตำแหน่งงาน, ชื่อบริษัท, คำค้น เช่น React, Node.js หรือสถานที่ เช่น กรุงเทพฯ, เชียงใหม่..."
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

              </div>

              <button
                type="button"
                onClick={handleSearch}
                className="px-5 py-2 bg-indigo-900 text-white rounded-lg text-xs font-medium hover:bg-indigo-800 transition-colors"
              >
                ค้นหา
              </button>

            </div>

            {/* Search suggestions */}
            {searchSuggestions.length > 0 && (
              <div className="absolute left-0 right-16 top-full mt-1 z-30 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">

                {searchSuggestions.map((job) => (
                  <button
                    key={job.id}
                    type="button"
                    onClick={() =>
                      handleSuggestionClick(job)
                    }
                    className="w-full text-left px-4 py-3 hover:bg-indigo-50 border-b last:border-b-0 border-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />

                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">
                          {job.title}
                        </p>

                        <p className="text-[10px] text-slate-500 truncate">
                          {job.company} • {job.location}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}

              </div>
            )}
          </div>

          {/* Jobs Cards */}

          {filteredJobs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

              {sortedFilteredJobs.map((job) => (
                <div
                  key={job.id}
                  onClick={() =>
                    setSelectedJob(job)
                  }
                  className="bg-white p-4 rounded-xl border border-slate-200 hover:border-indigo-900 hover:shadow-md cursor-pointer transition-all flex flex-col justify-between group"
                >

                  <div>

                    <h3 className="font-bold text-sm text-slate-900 mt-2 line-clamp-1 group-hover:text-indigo-900 transition-colors">
                      {job.title}
                    </h3>

                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                      {job.company}
                    </p>

                    <div className="flex flex-wrap gap-1 mt-3">

                      {job.tags.map(
                        (tag, idx) => (
                          <span
                            key={idx}
                            className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded"
                          >
                            {tag}
                          </span>
                        )
                      )}

                    </div>

                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">

                    <span className="font-bold text-amber-600">
                      {job.salary}
                    </span>

                    {activeApplicationJobIds.has(job.id) ? (
                      <span className="text-emerald-700 font-semibold text-[11px] flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        สมัครแล้ว
                      </span>
                    ) : (
                      <span className="text-indigo-900 font-medium text-[11px] group-hover:translate-x-0.5 transition-transform flex items-center">
                        ดูรายละเอียด
                        <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                      </span>
                    )}

                  </div>

                </div>
              ))}

            </div>
          ) : (
            <div className="bg-white border border-dashed border-slate-300 rounded-xl py-10 text-center">
              <Search className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-700">
                ไม่พบตำแหน่งงาน
              </p>
              <p className="text-xs text-slate-400 mt-1">
                ลองเปลี่ยนคำค้นหรือเลือกตัวกรองอื่น
              </p>
            </div>
          )}

        </section>

      </main>

      {/* ========================================================= */}
      {/* เพิ่มบริษัทจากภายนอก */}
      {/* ========================================================= */}

      <button
        onClick={handleOpenExternalCompany}
        className="fixed bottom-6 right-6 z-40 px-4 py-3 bg-indigo-900 hover:bg-indigo-800 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 text-xs"
      >

        <Send className="w-4 h-4" />

        <span>
          เพิ่มข้อมูลบริษัทจากภายนอก
        </span>

      </button>

      {/* ========================================================= */}
      {/* MODAL 1: แก้ไขโปรไฟล์ */}
      {/* ========================================================= */}

      {isEditProfileOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() =>
            !saving &&
            setIsEditProfileOpen(false)
          }
        >

          <div
            className="relative bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">

              <div className="flex items-center space-x-2">

                <div className="w-8 h-8 bg-indigo-900 text-white rounded-lg flex items-center justify-center font-bold">

                  <User className="w-4 h-4" />

                </div>

                <h2 className="text-base font-bold text-slate-900">
                  แก้ไขข้อมูลโปรไฟล์ / แนบผลการศึกษา
                </h2>

              </div>

              <button
                onClick={() =>
                  setIsEditProfileOpen(false)
                }
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50"
                disabled={saving}
              >
                <X className="w-5 h-5" />
              </button>

            </div>

            <form
              onSubmit={handleSaveProfile}
              className="p-6 overflow-y-auto space-y-5 text-xs"
            >

              {saveError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs break-all">
                  {saveError}
                </div>
              )}

              {/* รูปนักศึกษา */}

              <div className="pb-1">

                <label className="block font-medium text-slate-700 mb-2">
                  รูปนักศึกษา
                </label>

                <div className="flex items-center gap-4">

                  <div className="w-20 h-20 rounded-full bg-slate-100 border-2 border-indigo-900 overflow-hidden flex items-center justify-center shrink-0">
                    {studentPhotoPreview ? (
                      <img
                        src={studentPhotoPreview}
                        alt="ตัวอย่างรูปนักศึกษา"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-9 h-9 text-slate-400" />
                    )}
                  </div>

                  <div className="flex-1">
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-900 hover:bg-indigo-800 text-white rounded-lg cursor-pointer font-medium transition-colors">
                      <Upload className="w-4 h-4" />
                      <span>
                        {studentPhotoUploading
                          ? 'กำลังอัปโหลด...'
                          : 'แนบรูปนักศึกษา'}
                      </span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        onChange={handleStudentPhotoChange}
                        className="hidden"
                        disabled={studentPhotoUploading || saving}
                      />
                    </label>

                    <p className="text-[10px] text-slate-400 mt-1.5">
                      รองรับ JPG, PNG, WEBP ขนาดไม่เกิน 5MB
                    </p>

                    <p className="text-[10px] text-emerald-600 mt-0.5">
                      เลือกรูปแล้ว รูปบนหน้าเว็บจะอัปเดตทันที
                    </p>
                  </div>

                </div>

              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div>

                  <label className="block font-medium text-slate-700 mb-1">
                    ชื่อ-นามสกุล
                  </label>

                  <input
                    type="text"
                    value={tempProfile.name}
                    onChange={(e) =>
                      setTempProfile({
                        ...tempProfile,
                        name:
                          e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-900/20 focus:border-indigo-900"
                    required
                  />

                </div>

                <div>

                  <label className="block font-medium text-slate-700 mb-1">
                    รหัสนักศึกษา
                  </label>

                  <input
                    type="text"
                    value={
                      tempProfile.studentId
                    }
                    readOnly
                    aria-readonly="true"
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-100 text-slate-500 rounded-lg cursor-not-allowed"
                    required
                  />

                </div>

              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div>

                  <label className="block font-medium text-slate-700 mb-1">
                    สำนักวิชา
                  </label>

                  <input
                    type="text"
                    value={
                      tempProfile.faculty
                    }
                    onChange={(e) =>
                      setTempProfile({
                        ...tempProfile,
                        faculty:
                          e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-900/20 focus:border-indigo-900"
                    required
                  />

                </div>

                <div>

                  <label className="block font-medium text-slate-700 mb-1">
                    สาขาวิชา
                  </label>

                  <input
                    type="text"
                    value={
                      tempProfile.major
                    }
                    onChange={(e) =>
                      setTempProfile({
                        ...tempProfile,
                        major:
                          e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-900/20 focus:border-indigo-900"
                    required
                  />

                </div>

              </div>

              <div className="grid grid-cols-3 gap-4">

                <div>

                  <label className="block font-medium text-slate-700 mb-1">
                    ชั้นปีที่
                  </label>

                  <input
                    type="text"
                    value={
                      tempProfile.year
                    }
                    onChange={(e) =>
                      setTempProfile({
                        ...tempProfile,
                        year:
                          e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-900/20 focus:border-indigo-900"
                    required
                  />

                </div>

                <div>

                  <label className="block font-medium text-slate-700 mb-1">
                    เกรดเฉลี่ย (GPA)
                  </label>

                  <input
                    type="text"
                    value={
                      tempProfile.gpa
                    }
                    onChange={(e) =>
                      setTempProfile({
                        ...tempProfile,
                        gpa:
                          e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-900/20 focus:border-indigo-900"
                    required
                  />

                </div>

                <div>

                  <label className="block font-medium text-slate-700 mb-1">
                    หน่วยกิตสะสม
                  </label>

                  <input
                    type="text"
                    value={
                      tempProfile.credits
                    }
                    onChange={(e) =>
                      setTempProfile({
                        ...tempProfile,
                        credits:
                          e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-900/20 focus:border-indigo-900"
                    required
                  />

                </div>

              </div>

              {/* Skills */}

              <div className="pt-2">

                <label className="block font-medium text-slate-700 mb-1.5">
                  ทักษะความสามารถ (Skills) — จะบันทึกลง internship_records เพื่อให้อาจารย์ที่ปรึกษาเห็น
                </label>

                <div className="flex flex-wrap gap-1.5 p-3 border border-slate-200 bg-slate-50 rounded-lg min-h-[60px] items-center mb-2">

                  {tempProfile.skills.map(
                    (skill, index) => (
                      <span
                        key={index}
                        className="bg-indigo-900 text-white px-2.5 py-1 rounded-md text-[11px] font-medium flex items-center space-x-1"
                      >

                        <span>
                          {skill}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            handleRemoveSkill(
                              skill
                            )
                          }
                          className="hover:text-red-300 ml-1"
                        >
                          <X className="w-3 h-3" />
                        </button>

                      </span>
                    )
                  )}

                </div>

                <div className="flex gap-2">

                  <input
                    type="text"
                    placeholder="พิมพ์ชื่อทักษะ เช่น Docker, Next.js..."
                    value={
                      newSkillInput
                    }
                    onChange={(e) =>
                      setNewSkillInput(
                        e.target.value
                      )
                    }
                    onKeyDown={(e) => {
                      if (
                        e.key ===
                        'Enter'
                      ) {
                        e.preventDefault();
                        handleAddSkill();
                      }
                    }}
                    className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-900"
                  />

                  <button
                    type="button"
                    onClick={
                      handleAddSkill
                    }
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg flex items-center space-x-1 font-medium"
                  >

                    <Plus className="w-3.5 h-3.5" />

                    <span>
                      เพิ่ม
                    </span>

                  </button>

                </div>

              </div>

              {/* Resume */}

              <div className="pt-2">

                <label className="block font-medium text-slate-700 mb-1.5">
                  แนบผลการศึกษา
                </label>

                <div className="p-4 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 text-center relative hover:bg-indigo-50/30 transition-colors">

                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={
                      handleFileChange
                    }
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />

                  <div className="flex flex-col items-center justify-center space-y-1">

                    <File className="w-8 h-8 text-indigo-900/60" />

                    <div className="text-slate-700 font-medium">

                      {tempProfile.resumeName ? (
                        <span className="text-indigo-900 font-semibold">
                          {
                            tempProfile.resumeName
                          }
                        </span>
                      ) : (
                        'คลิกเพื่อแนบผลการศึกษา หรือลากไฟล์มาวางที่นี่'
                      )}

                    </div>

                    <span className="text-[10px] text-slate-400">
                      รองรับไฟล์ .PDF, .DOC, .DOCX (ขนาดไม่เกิน 10MB)
                    </span>

                  </div>

                </div>

              </div>

              {/* Buttons */}

              <div className="pt-4 border-t border-slate-200 flex justify-end space-x-2">

                <button
                  type="button"
                  onClick={() =>
                    setIsEditProfileOpen(
                      false
                    )
                  }
                  className="px-4 py-2 border border-slate-300 text-slate-600 hover:bg-slate-100 font-medium rounded-lg"
                  disabled={saving}
                >
                  ยกเลิก
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-indigo-900 hover:bg-indigo-800 text-white font-medium rounded-lg shadow-sm flex items-center space-x-1 disabled:opacity-60"
                >

                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}

                  <span>
                    {saving
                      ? 'กำลังบันทึก...'
                      : 'บันทึกการเปลี่ยนแปลง'}
                  </span>

                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: รายละเอียดตำแหน่งงาน */}
      {/* ========================================================= */}

      {selectedJob && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() =>
            setSelectedJob(null)
          }
        >

          <div
            className="relative bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* Header */}

            <div className="p-6 border-b border-slate-200 bg-white">

              <div className="flex justify-between items-start">

                <div className="flex space-x-4">

                  <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100 shrink-0">

                    <Building2 className="w-6 h-6 text-indigo-900" />

                  </div>

                  <div>

                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">

                      <h2 className="text-lg font-bold text-slate-900">
                        {selectedJob.company}
                      </h2>

                      {selectedJob.badge && (
                        <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded font-medium">
                          {selectedJob.badge}
                        </span>
                      )}

                    </div>

                    <h3 className="text-sm font-semibold text-indigo-900 mt-1">
                      {selectedJob.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2">

                      <span className="flex items-center">

                        <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />

                        {selectedJob.location}

                      </span>

                      <span className="flex items-center">

                        <Briefcase className="w-3.5 h-3.5 mr-1 text-slate-400" />

                        {selectedJob.workType}

                      </span>

                    </div>

                  </div>

                </div>

                <button
                  onClick={() =>
                    setSelectedJob(null)
                  }
                  className="p-2 border border-slate-200 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

              </div>

            </div>

            {/* Body */}

            <div className="p-6 overflow-y-auto space-y-6">

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left */}

                <div className="lg:col-span-2 space-y-6">

                  <div>

                    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-3 flex items-center">

                      <span className="w-1.5 h-4 bg-indigo-900 rounded-full mr-2"></span>

                      หน้าที่ความรับผิดชอบ (Key Responsibilities)

                    </h4>

                    <ul className="space-y-2 text-xs text-slate-600 list-disc list-inside leading-relaxed">

                      {selectedJob.responsibilities.map(
                        (resp, idx) => (
                          <li key={idx}>
                            {resp}
                          </li>
                        )
                      )}

                    </ul>

                  </div>

                  <div>

                    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-3 flex items-center">

                      <span className="w-1.5 h-4 bg-indigo-900 rounded-full mr-2"></span>

                      คุณสมบัติผู้สมัคร (Qualifications)

                    </h4>

                    <ul className="space-y-2 text-xs text-slate-600 list-disc list-inside leading-relaxed">

                      {selectedJob.qualifications.map(
                        (qual, idx) => (
                          <li key={idx}>
                            {qual}
                          </li>
                        )
                      )}

                    </ul>

                  </div>

                  <div>

                    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-3 flex items-center">

                      <span className="w-1.5 h-4 bg-indigo-900 rounded-full mr-2"></span>

                      บรรยากาศการทำงาน & ทีมงาน (Workplace Culture)

                    </h4>

                    <div className="grid grid-cols-2 gap-3">

                      <div className="bg-slate-100 h-28 rounded-lg flex items-center justify-center text-xs text-slate-400 font-medium">
                        Open Space & Collaborative Area
                      </div>

                      <div className="bg-slate-100 h-28 rounded-lg flex items-center justify-center text-xs text-slate-400 font-medium">
                        Innovation & Tech Hub
                      </div>

                    </div>

                  </div>

                </div>

                {/* Right */}

                <div className="space-y-4">

                  {/* Salary */}

                  <div className="bg-amber-50/50 border border-amber-200 p-4 rounded-xl">

                    <div className="text-xs text-amber-800 font-medium">
                      เบี้ยเลี้ยง / ค่าตอบแทน
                    </div>

                    <div className="text-xl font-bold text-amber-600 mt-1">
                      {selectedJob.salary}
                    </div>

                    {selectedJob.perks.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-amber-200/60 space-y-1.5 text-[11px] text-slate-600">

                        {selectedJob.perks.map(
                          (perk, idx) => (
                            <div
                              key={idx}
                              className="flex items-start"
                            >

                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mr-1.5 shrink-0 mt-0.5" />

                              <span>
                                {perk}
                              </span>

                            </div>
                          )
                        )}

                      </div>
                    )}

                  </div>

                  {/* Timeline */}

                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs space-y-2">

                    <div className="font-bold text-slate-900 border-b border-slate-200 pb-2 flex items-center">

                      <Calendar className="w-3.5 h-3.5 mr-1.5 text-indigo-900" />

                      กำหนดการรับสมัคร

                    </div>

                    <div className="flex justify-between">

                      <span className="text-slate-500">
                        เปิดรับสมัคร:
                      </span>

                      <span className="font-medium text-slate-800">
                        {selectedJob.timeline.open}
                      </span>

                    </div>

                    <div className="flex justify-between">

                      <span className="text-slate-500">
                        สัมภาษณ์งาน:
                      </span>

                      <span className="font-medium text-slate-800">
                        {selectedJob.timeline.interview}
                      </span>

                    </div>

                    <div className="flex justify-between">

                      <span className="text-slate-500">
                        เริ่มปฏิบัติงาน:
                      </span>

                      <span className="font-medium text-slate-800">
                        {selectedJob.timeline.start}
                      </span>

                    </div>

                  </div>

                  {/* HR Contact */}

                  {selectedJob.hrName && (
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs space-y-3">

                      <div className="font-bold text-slate-900 border-b border-slate-200 pb-2 flex items-center">

                        <UserCheck className="w-3.5 h-3.5 mr-1.5 text-indigo-900" />

                        ผู้ประสานงานการรับสมัคร

                      </div>

                      <div>

                        <div className="font-medium text-slate-800">
                          {selectedJob.hrName}
                        </div>

                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {selectedJob.hrRole}
                        </div>

                      </div>

                      <div className="pt-2 border-t border-slate-200 space-y-2">

                        <div className="text-[11px] font-semibold text-slate-700">
                          ช่องทางการติดต่อ
                        </div>

                        {selectedJob.contactPhone && (
                          <div className="flex items-center gap-2 text-[11px] text-slate-600">

                            <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />

                            <span>
                              {selectedJob.contactPhone}
                            </span>

                          </div>
                        )}

                        {selectedJob.contactEmail && (
                          <div className="flex items-center gap-2 text-[11px] text-slate-600 break-all">

                            <Mail className="w-3.5 h-3.5 text-blue-600 shrink-0" />

                            <span>
                              {selectedJob.contactEmail}
                            </span>

                          </div>
                        )}

                        {selectedJob.contactLine && (
                          <div className="flex items-center gap-2 text-[11px] text-slate-600">

                            <MessageCircle className="w-3.5 h-3.5 text-green-600 shrink-0" />

                            <span>
                              {selectedJob.contactLine}
                            </span>

                          </div>
                        )}

                      </div>

                    </div>
                  )}

                </div>

              </div>

            </div>

            {/* Modal Footer */}

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">

              {applyError ? (
                <span className="text-xs text-red-600">
                  {applyError}
                </span>
              ) : activeApplicationJobIds.has(selectedJob.id) ? (
                <span className="text-xs font-medium text-emerald-700">
                  คุณสมัครตำแหน่งนี้แล้ว
                </span>
              ) : (
                <span></span>
              )}

              <div className="flex items-center gap-2">

                <button
                  type="button"
                  onClick={() =>
                    setSelectedJob(null)
                  }
                  disabled={applying}
                  className="px-4 py-2 border border-slate-300 text-slate-600 hover:bg-slate-100 font-medium rounded-lg text-xs transition-colors disabled:opacity-50"
                >
                  ปิดหน้านี้
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (activeApplicationJobIds.has(selectedJob.id)) {
                      router.push('/select-company');
                      return;
                    }
                    void handleApplyJob();
                  }}
                  disabled={applying}
                  className="px-5 py-2 bg-indigo-900 hover:bg-indigo-800 text-white font-semibold rounded-lg text-xs transition-colors flex items-center gap-2 shadow-sm disabled:opacity-60"
                >

                  {applying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />

                      <span>
                        กำลังส่งคำขอ...
                      </span>
                    </>
                  ) : activeApplicationJobIds.has(selectedJob.id) ? (
                    <>
                      <ChevronRight className="w-4 h-4" />
                      <span>ดูสถานะการสมัคร</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />

                      <span>
                        ต้องการสมัคร
                      </span>
                    </>
                  )}

                </button>

              </div>

            </div>

          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: เพิ่มข้อมูลบริษัทจากภายนอก */}
      {/* ========================================================= */}

      {isExternalCompanyOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() =>
            !externalSaving &&
            setIsExternalCompanyOpen(false)
          }
        >

          <div
            className="relative bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* Header */}

            <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">

              <div className="flex items-center space-x-2">

                <div className="w-8 h-8 bg-indigo-900 text-white rounded-lg flex items-center justify-center font-bold">

                  <Send className="w-4 h-4" />

                </div>

                <div>

                  <h2 className="text-base font-bold text-slate-900">
                    เพิ่มข้อมูลบริษัทจากภายนอก
                  </h2>

                  <p className="text-[11px] text-slate-500 mt-0.5">
                    กรอกข้อมูลบริษัทที่ต้องการเสนอให้ระบบเพิ่ม
                  </p>

                </div>

              </div>

              <button
                onClick={() =>
                  setIsExternalCompanyOpen(
                    false
                  )
                }
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50"
                disabled={
                  externalSaving
                }
              >
                <X className="w-5 h-5" />
              </button>

            </div>

            {/* Body */}

            <form
              onSubmit={
                handleSubmitExternalCompany
              }
              className="p-6 overflow-y-auto space-y-4 text-xs"
            >

              {externalError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs">
                  {externalError}
                </div>
              )}

              {/* Company */}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div>

                  <label className="block font-medium text-slate-700 mb-1">
                    ชื่อบริษัท *
                  </label>

                  <input
                    type="text"
                    value={
                      externalCompany.companyName
                    }
                    onChange={(e) =>
                      setExternalCompany({
                        ...externalCompany,
                        companyName:
                          e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-900/20 focus:border-indigo-900"
                    placeholder="เช่น บริษัท ABC จำกัด"
                    required
                  />

                </div>

                <div>

                  <label className="block font-medium text-slate-700 mb-1">
                    ตำแหน่งงาน *
                  </label>

                  <input
                    type="text"
                    value={
                      externalCompany.position
                    }
                    onChange={(e) =>
                      setExternalCompany({
                        ...externalCompany,
                        position:
                          e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-900/20 focus:border-indigo-900"
                    placeholder="เช่น Software Engineer Intern"
                    required
                  />

                </div>

              </div>

              {/* Location */}

              <div>

                <label className="block font-medium text-slate-700 mb-1">
                  สถานที่ตั้ง / สถานที่ปฏิบัติงาน
                </label>

                <input
                  type="text"
                  value={
                    externalCompany.location
                  }
                  onChange={(e) =>
                    setExternalCompany({
                      ...externalCompany,
                      location:
                        e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-900/20 focus:border-indigo-900"
                  placeholder="เช่น กรุงเทพฯ / Hybrid / Remote"
                />

              </div>

              {/* Contact */}

              <div className="pt-2 border-t border-slate-200">

                <div className="font-semibold text-slate-800 mb-3">
                  ข้อมูลผู้ติดต่อ
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  <div>

                    <label className="block font-medium text-slate-700 mb-1">
                      ชื่อผู้ติดต่อ
                    </label>

                    <input
                      type="text"
                      value={
                        externalCompany.contactName
                      }
                      onChange={(e) =>
                        setExternalCompany({
                          ...externalCompany,
                          contactName:
                            e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-900/20 focus:border-indigo-900"
                      placeholder="ชื่อผู้ประสานงาน"
                    />

                  </div>

                  <div>

                    <label className="block font-medium text-slate-700 mb-1">
                      เบอร์โทรศัพท์
                    </label>

                    <input
                      type="text"
                      value={
                        externalCompany.contactPhone
                      }
                      onChange={(e) =>
                        setExternalCompany({
                          ...externalCompany,
                          contactPhone:
                            e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-900/20 focus:border-indigo-900"
                      placeholder="02-xxx-xxxx"
                    />

                  </div>

                  <div>

                    <label className="block font-medium text-slate-700 mb-1">
                      อีเมล
                    </label>

                    <input
                      type="email"
                      value={
                        externalCompany.contactEmail
                      }
                      onChange={(e) =>
                        setExternalCompany({
                          ...externalCompany,
                          contactEmail:
                            e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-900/20 focus:border-indigo-900"
                      placeholder="hr@company.com"
                    />

                  </div>

                  <div>

                    <label className="block font-medium text-slate-700 mb-1">
                      เว็บไซต์บริษัท
                    </label>

                    <input
                      type="url"
                      value={
                        externalCompany.companyWebsite
                      }
                      onChange={(e) =>
                        setExternalCompany({
                          ...externalCompany,
                          companyWebsite:
                            e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-900/20 focus:border-indigo-900"
                      placeholder="https://example.com"
                    />

                  </div>

                </div>

              </div>

              {/* Details */}

              <div>

                <label className="block font-medium text-slate-700 mb-1">
                  รายละเอียดเพิ่มเติม
                </label>

                <textarea
                  value={
                    externalCompany.details
                  }
                  onChange={(e) =>
                    setExternalCompany({
                      ...externalCompany,
                      details:
                        e.target.value,
                    })
                  }
                  rows={4}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-900/20 focus:border-indigo-900 resize-none"
                  placeholder="รายละเอียดตำแหน่งงาน สวัสดิการ หรือข้อมูลอื่น ๆ ที่ต้องการแจ้ง"
                />

              </div>

              {/* Buttons */}

              <div className="pt-4 border-t border-slate-200 flex justify-end space-x-2">

                <button
                  type="button"
                  onClick={() =>
                    setIsExternalCompanyOpen(
                      false
                    )
                  }
                  className="px-4 py-2 border border-slate-300 text-slate-600 hover:bg-slate-100 font-medium rounded-lg"
                  disabled={
                    externalSaving
                  }
                >
                  ยกเลิก
                </button>

                <button
                  type="submit"
                  disabled={
                    externalSaving
                  }
                  className="px-4 py-2 bg-indigo-900 hover:bg-indigo-800 text-white font-medium rounded-lg shadow-sm flex items-center space-x-1 disabled:opacity-60"
                >

                  {externalSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}

                  <span>
                    {externalSaving
                      ? 'กำลังส่งข้อมูล...'
                      : 'ส่งข้อมูลบริษัท'}
                  </span>

                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}
