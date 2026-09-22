'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  Search,
  MapPin,
  User,
  Bell,
  Upload,
  Sparkles,
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
};

export default function StudentDashboard() {
  const router = useRouter();

  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

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

      const loaded: ProfileData = {
        id: userId,
        name: profile?.full_name ?? '',
        studentId: profile?.student_code ?? '',
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
  // เปิด Modal แก้ไขโปรไฟล์
  // =========================================================

  const handleOpenEditProfile = () => {
    setTempProfile({
      ...profileData,
    });

    setNewSkillInput('');
    setResumeFile(null);
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

        const {
          data: publicUrlData,
        } = supabase.storage
          .from('resumes')
          .getPublicUrl(filePath);

        resumeUrl =
          publicUrlData.publicUrl;

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

          student_code:
            tempProfile.studentId,

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

    setApplying(true);
    setApplyError(null);

    try {
      const {
        error,
      } = await supabase
        .from('job_applications')
        .insert({
          student_id:
            profileData.id,

          job_id:
            selectedJob.id,

          job_title:
            selectedJob.title,

          company_name:
            selectedJob.company,

          status:
            'pending',
        });

      if (error) {
        throw error;
      }

      setSelectedJob(null);

      router.push('/coordinator');
    } catch (err: any) {
      console.error(
        'สมัครงานไม่สำเร็จ:',
        JSON.stringify(err, null, 2)
      );

      setApplyError(
        err.message ??
          'เกิดข้อผิดพลาดในการสมัครงาน'
      );
    } finally {
      setApplying(false);
    }
  };

  // =========================================================
  // Jobs
  // =========================================================

  const jobs: Job[] = [
    {
      id: 'scb-techx',
      title:
        'Software Engineer Intern (Frontend / Fullstack - Co-op 2025)',
      company:
        'SCB TechX Co., Ltd.',
      badge:
        'SCBX Group',
      match:
        '98%',
      tags: [
        'TypeScript',
        'React',
        'Next.js',
        'Cloud',
      ],
      salary:
        '18,000 - 22,000 / เดือน',
      location:
        'กรุงเทพมหานคร (พญาไท)',
      workType:
        'Hybrid (เข้าออฟฟิศ 2 วัน/สัปดาห์)',
      responsibilities: [
        'ร่วมพัฒนาและดูแลเว็บแอปพลิเคชันนวัตกรรม FinTech ด้วย React, Next.js, TypeScript และ Node.js',
        'ทำงานร่วมกับ Senior Software Engineers, Tech Leads และ Product Designers ในการแปล Figma Mockup เป็นระบบ Production ที่มีประสิทธิภาพ',
        'เขียน Unit Test และ Integration Test เพื่อควบคุมคุณภาพของซอฟต์แวร์',
        'เข้าร่วมกระบวนการทำงานแบบ Agile Development, Sprint Planning, Daily Stand-up และ Code Review อย่างเป็นระบบ',
        'ศึกษาและประยุกต์ใช้เทคโนโลยีใหม่ เช่น Cloud-Native (AWS, Kubernetes, Docker) ในโครงการสหกิจศึกษา',
      ],
      qualifications: [
        'นิสิต/นักศึกษา ชั้นปีที่ 3 หรือ 4 สาขาวิชาวิศวกรรมคอมพิวเตอร์, วิทยาการคอมพิวเตอร์ หรือสาขาที่เกี่ยวข้อง',
        'เกรดเฉลี่ยสะสม (GPAX) ไม่ต่ำกว่า 2.75 และผ่านการทดสอบความพร้อมทางวิชาการตามเกณฑ์ของมหาวิทยาลัย',
        'มีความรู้พื้นฐานในการพัฒนาเว็บด้วย HTML5, CSS3, Modern JavaScript (ES6+) และ React/TypeScript',
        'เข้าใจหลักการทำงานของ RESTful API และการเชื่อมต่อข้อมูลกับระบบ Backend',
        'มีผลงานหรือโครงงานที่เคยพัฒนาที่สามารถนำเสนอได้ (GitHub / Portfolio จะได้รับการพิจารณาเป็นพิเศษ)',
      ],
      perks: [
        'ประกันอุบัติเหตุและสุขภาพกลุ่ม',
        'โน้ตบุ๊กประสิทธิภาพสูงสำหรับการทำงาน',
        'คอร์สเรียนออนไลน์เสริมทักษะฟรี',
        'ขนมและเครื่องดื่มฟรีตลอดวันในออฟฟิศ',
      ],
      timeline: {
        open:
          '1 ม.ค. - 28 ก.พ. 2025',
        interview:
          '15 มี.ค. - 15 เม.ย. 2025',
        start:
          '1 มิ.ย. - 30 ก.ย. 2025',
      },
      hrName:
        'คุณศุภโชค สุวรรณมณี',
      hrRole:
        'People Experience & University Relations',
      contactPhone:
        '02-XXX-XXXX',
      contactEmail:
        'hr@company.com',
      contactLine:
        '@company_hr',
    },

    {
      id: 'line-man',
      title:
        'Full-Stack Developer Intern',
      company:
        'LINE Thailand (LINE MAN Wongnai)',
      badge:
        'LINE Group',
      match:
        '95%',
      tags: [
        'React',
        'Node.js',
        'GraphQL',
      ],
      salary:
        '12,000 / เดือน',
      location:
        'กรุงเทพมหานคร (เอกมัย)',
      workType:
        'On-site',
      responsibilities: [
        'ร่วมพัฒนาฟีเจอร์ใหม่บนแพลตฟอร์ม LINE MAN และ Wongnai',
        'พัฒนา Microservices และ API ด้วย Node.js และ TypeScript',
        'ร่วมออกแบบ UI/UX และพัฒนาหน้าเว็บด้วย React.js',
        'ทำงานร่วมกับทีม Product Manager และ QA ในระบบ Agile',
      ],
      qualifications: [
        'นักศึกษาชั้นปีที่ 3-4 สาขาวิทยาการคอมพิวเตอร์ หรือสาขาที่เกี่ยวข้อง',
        'เข้าใจหลักการพัฒนา Full-stack Web Application',
        'มีความสนใจในระบบที่มีผู้ใช้งานจำนวนมาก (High Traffic Systems)',
      ],
      perks: [
        'อาหารกลางวันและสวัสดิการพนักงานฟรี',
        'อุปกรณ์แล็ปท็อปสำหรับการทำงาน',
      ],
      timeline: {
        open:
          '1 ม.ค. - 15 มี.ค. 2025',
        interview:
          '20 มี.ค. - 30 เม.ย. 2025',
        start:
          '1 มิ.ย. - 31 ต.ค. 2025',
      },
      hrName:
        'คุณภาวิณี ศรีสุข',
      hrRole:
        'Talent Acquisition Specialist',
      contactPhone:
        '02-XXX-XXXX',
      contactEmail:
        'hr@company.com',
      contactLine:
        '@company_hr',
    },

    {
      id: 'kbtg',
      title:
        'Associate UI/UX Designer (Intern)',
      company:
        'Kasikorn Business-Technology Group (KBTG)',
      badge:
        'KBank Group',
      match:
        '91%',
      tags: [
        'Figma',
        'User Research',
        'Design System',
      ],
      salary:
        '15,000 / เดือน',
      location:
        'นนทบุรี (แจ้งวัฒนะ)',
      workType:
        'Hybrid',
      responsibilities: [
        'ออกแบบ Wireframe, Prototype และ User Interface สำหรับแอปพลิเคชันการเงิน',
        'ทำ User Research และ Usability Testing ร่วมกับทีม UX',
        'ดูแลและอัปเดต Design System ขององค์กร',
      ],
      qualifications: [
        'นักศึกษา สาขาปฏิสัมพันธ์มนุษย์กับคอมพิวเตอร์ (HCI), สถาปัตยกรรม หรือการออกแบบสื่อดิจิทัล',
        'เชี่ยวชาญการใช้เครื่องมือ Figma และ Adobe Creative Suite',
        'มี Portfolio แสดงผลงาน UX/UI อย่างชัดเจน',
      ],
      perks: [
        'เบี้ยเลี้ยงประจำเดือน',
        'การเทรนนิ่งจากทีม UX/UI ผู้เชี่ยวชาญ',
      ],
      timeline: {
        open:
          '15 ม.ค. - 31 มี.ค. 2025',
        interview:
          '1 เม.ย. - 30 เม.ย. 2025',
        start:
          '1 มิ.ย. - 30 ก.ย. 2025',
      },
      hrName:
        'คุณกิตติศักดิ์ เจริญพร',
      hrRole:
        'Campus Recruitment Lead',
      contactPhone:
        '02-XXX-XXXX',
      contactEmail:
        'hr@company.com',
      contactLine:
        '@company_hr',
    },

    {
      id: 'agoda',
      title:
        'Associate Frontend Engineer',
      company:
        'Agoda Services Co., Ltd.',
      badge:
        'Global Tech',
      match:
        '88%',
      tags: [
        'React',
        'TypeScript',
        'Large Scale UI',
      ],
      salary:
        '27,000 / เดือน',
      location:
        'กรุงเทพมหานคร (เซ็นทรัลเวิลด์)',
      workType:
        'Hybrid',
      responsibilities: [
        'ร่วมสร้างสรรค์ประสบการณ์ใช้งานเว็บไซต์ท่องเที่ยวระดับโลก',
        'พัฒนา UI Component ที่รองรับการแสดงผลหลายภาษา และประสิทธิภาพสูง',
        'ทำ A/B Testing เพื่อปรับปรุง Conversion Rate',
      ],
      qualifications: [
        'สื่อสารภาษาอังกฤษได้ดีเยี่ยม (บรรยากาศการทำงานนานาชาติ)',
        'เชี่ยวชาญ React.js, TypeScript, HTML5/CSS3',
        'มีใจรักในการพัฒนา Web Performance',
      ],
      perks: [
        'ค่าตอบแทนสูงพิเศษ 27,000 บาท/เดือน',
        'ส่วนลดโรงแรมและตั๋วเครื่องบินสำหรับ Agoda Staff',
      ],
      timeline: {
        open:
          '1 ม.ค. - 15 เม.ย. 2025',
        interview:
          '1 พ.ค. - 15 พ.ค. 2025',
        start:
          '1 มิ.ย. - 31 ต.ค. 2025',
      },
      hrName:
        'Ms. Sarah Jenkins',
      hrRole:
        'Global University Recruiting Manager',
      contactPhone:
        '02-XXX-XXXX',
      contactEmail:
        'hr@company.com',
      contactLine:
        '@company_hr',
    },

    {
      id: 'ais',
      title:
        'Data Engineer & Platform Intern',
      company:
        'AIS (Advanced Info Service)',
      badge:
        'SET Top 10',
      match:
        '85%',
      tags: [
        'Python',
        'Kafka',
        'PostgreSQL',
      ],
      salary:
        '17,000 / เดือน',
      location:
        'กรุงเทพมหานคร (พญาไท)',
      workType:
        'On-site',
      responsibilities: [
        'ออกแบบและสร้าง Data Pipeline ในการประมวลผลข้อมูล Big Data',
        'ดูแลและปรับปรุงประสิทธิภาพของฐานข้อมูล PostgreSQL และ Kafka',
        'ทำงานร่วมกับ Data Scientist และ Business Analyst',
      ],
      qualifications: [
        'นักศึกษา สาขาวิศวกรรมคอมพิวเตอร์, วิทยาการข้อมูล หรือสาขาที่เกี่ยวข้อง',
        'มีความรู้ด้าน SQL, Python และระบบ Data Warehouse',
        'มีความเข้าใจเบื้องต้นเกี่ยวกับ Cloud Infrastructure (AWS/GCP)',
      ],
      perks: [
        'ส่วนลดค่าแพ็กเกจอินเทอร์เน็ต AIS',
        'สวัสดิการรถรับส่งพนักงาน',
      ],
      timeline: {
        open:
          '1 ม.ค. - 30 มี.ค. 2025',
        interview:
          '1 เม.ย. - 20 เม.ย. 2025',
        start:
          '1 มิ.ย. - 30 ก.ย. 2025',
      },
      hrName:
        'คุณธนภัทร รัตนเวช',
      hrRole:
        'Data Talent Acquisition',
      contactPhone:
        '02-XXX-XXXX',
      contactEmail:
        'hr@company.com',
      contactLine:
        '@company_hr',
    },

    {
      id: 'garena',
      title:
        'Backend Engineer Intern (Cloud)',
      company:
        'Garena Online Co., Ltd.',
      badge:
        'Sea Group',
      match:
        '82%',
      tags: [
        'GoLang',
        'Docker',
        'PostgreSQL',
      ],
      salary:
        '20,000 / เดือน',
      location:
        'กรุงเทพมหานคร (พระราม 9)',
      workType:
        'On-site',
      responsibilities: [
        'พัฒนาและดูแลระบบ Backend รองรับเกมออนไลน์ระดับโลก',
        'เขียนโปรแกรมด้วยภาษา Go (Golang) และทำงานกับ Docker/Kubernetes',
        'เพิ่มประสิทธิภาพระบบและความแม่นยำของฐานข้อมูล',
      ],
      qualifications: [
        'นิสิต/นักศึกษา สาขาวิศวกรรมคอมพิวเตอร์ หรือวิทยาการคอมพิวเตอร์',
        'เข้าใจระบบ Data Structures, Algorithms และ Computer Networks เป็นอย่างดี',
        'สนใจการพัฒนาโปรแกรมด้วยภาษา Go',
      ],
      perks: [
        'เบี้ยเลี้ยง 20,000 บาท/เดือน',
        'เครดิตฟรีเกมในเครือ Garena และขนมทานเล่นในออฟฟิศ',
      ],
      timeline: {
        open:
          '10 ม.ค. - 31 มี.ค. 2025',
        interview:
          '1 เม.ย. - 30 เม.ย. 2025',
        start:
          '1 มิ.ย. - 30 ก.ย. 2025',
      },
      hrName:
        'คุณณัฐพล วงศ์สว่าง',
      hrRole:
        'Tech Campus Recruiter',
      contactPhone:
        '02-XXX-XXXX',
      contactEmail:
        'hr@company.com',
      contactLine:
        '@company_hr',
    },
  ];

  // =========================================================
  // Loading
  // =========================================================

  if (loadingProfile) {
    return (
      <div className="flex min-h-[calc(100vh-61px)] items-center justify-center bg-slate-100">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-900" />

        <span className="ml-2 text-sm text-slate-500">
          กำลังโหลดข้อมูลนักศึกษา...
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

                  <User className="w-12 h-12 text-slate-400" />

                </div>

                <span className="absolute bottom-0 right-0 bg-emerald-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                  100%
                </span>

              </div>

              <div>

                {/* ชื่อผู้ใช้ */}
                {/* ลบป้าย "ผ่านการทดสอบสหกิจศึกษาแล้ว" ออกแล้ว */}

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

              {/* ปุ่มจัดการโปรไฟล์ */}

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

            <span className="text-xs text-slate-500">
              ตำแหน่งงานเปิดรับ:

              <strong className="text-indigo-900">
                {' '}142
              </strong>{' '}
              ตำแหน่ง
            </span>

          </div>

          {/* Search */}

          <div className="flex gap-2">

            <div className="relative flex-1">

              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />

              <input
                type="text"
                placeholder="ค้นหาตามตำแหน่งงาน, ชื่อบริษัท, คำค้น เช่น React, Node.js หรือสถานที่ เช่น กรุงเทพฯ, เชียงใหม่..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

            </div>

            <button className="px-5 py-2 bg-indigo-900 text-white rounded-lg text-xs font-medium hover:bg-indigo-800">
              ค้นหา
            </button>

          </div>

          {/* Filters */}

          <div className="flex flex-wrap gap-2 text-xs">

            <button className="px-3 py-1.5 bg-indigo-900 text-white rounded-full font-medium">
              ตำแหน่งทั้งหมด
            </button>

            <button className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-full hover:bg-slate-50">
              Software & Web Dev
            </button>

            <button className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-full hover:bg-slate-50">
              UI/UX & Product Design
            </button>

            <button className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-full hover:bg-slate-50">
              Data Engineering & AI
            </button>

            <button className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-full hover:bg-slate-50">
              มีเบี้ยเลี้ยง
            </button>

          </div>

          {/* Jobs Cards */}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

            {jobs.map((job) => (
              <div
                key={job.id}
                onClick={() =>
                  setSelectedJob(job)
                }
                className="bg-white p-4 rounded-xl border border-slate-200 hover:border-indigo-900 hover:shadow-md cursor-pointer transition-all flex flex-col justify-between group"
              >

                <div>

                  <div className="flex justify-between items-start">

                    <span className="inline-flex items-center text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">

                      <Sparkles className="w-3 h-3 mr-1" />

                      ตรงกับทักษะ {job.match}

                    </span>

                  </div>

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

                  <span className="text-indigo-900 font-medium text-[11px] group-hover:translate-x-0.5 transition-transform flex items-center">

                    ดูรายละเอียด

                    <ChevronRight className="w-3.5 h-3.5 ml-0.5" />

                  </span>

                </div>

              </div>
            ))}

          </div>

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
                    onChange={(e) =>
                      setTempProfile({
                        ...tempProfile,
                        studentId:
                          e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-900/20 focus:border-indigo-900"
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
                  onClick={
                    handleApplyJob
                  }
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