'use client';

import React, { useState } from 'react';
import { 
  Search, MapPin, Bookmark, User, FileText, Bell, 
  Share2, Upload, Sparkles, Building2, Briefcase, 
  ChevronRight, CheckCircle2, X, Calendar, UserCheck,
  Plus, Trash2, Check, File
} from 'lucide-react';

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
  timeline: { open: string; interview: string; start: string };
  hrName?: string;
  hrRole?: string;
}

export default function StudentDashboard() {
  // State สำหรับตำแหน่งงานที่เลือก
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  // State สำหรับโปรไฟล์นักศึกษา
  const [profileData, setProfileData] = useState({
    name: 'นางสาว กานต์พิชชา วงษ์สุวรรณ',
    studentId: '6410210545',
    faculty: 'สำนักวิชาวิศวกรรมศาสตร์',
    major: 'สาขาวิชาวิศวกรรมซอฟต์แวร์ (Software Engineering)',
    year: '4',
    gpa: '3.72',
    credits: '128',
    skills: ['React.js', 'TypeScript', 'Node.js (NestJS)', 'Python (FastAPI)', 'PostgreSQL', 'Figma UI/UX', 'Docker & Git CI/CD'],
    resumeName: 'Resume_Kanpitcha_2025.pdf'
  });

  // State สำหรับ Modal แก้ไขโปรไฟล์
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [tempProfile, setTempProfile] = useState(profileData);
  const [newSkillInput, setNewSkillInput] = useState('');

  // เปิด Modal แก้ไขพร้อมโหลดข้อมูลปัจจุบัน
  const handleOpenEditProfile = () => {
    setTempProfile({ ...profileData });
    setNewSkillInput('');
    setIsEditProfileOpen(true);
  };

  // บันทึกการแก้ไขโปรไฟล์
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileData({ ...tempProfile });
    setIsEditProfileOpen(false);
  };

  // เพิ่มทักษะใหม่
  const handleAddSkill = () => {
    if (newSkillInput.trim() && !tempProfile.skills.includes(newSkillInput.trim())) {
      setTempProfile({
        ...tempProfile,
        skills: [...tempProfile.skills, newSkillInput.trim()]
      });
      setNewSkillInput('');
    }
  };

  // ลบทักษะ
  const handleRemoveSkill = (skillToRemove: string) => {
    setTempProfile({
      ...tempProfile,
      skills: tempProfile.skills.filter(s => s !== skillToRemove)
    });
  };

  // เปลี่ยนไฟล์ Resume
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setTempProfile({
        ...tempProfile,
        resumeName: e.target.files[0].name
      });
    }
  };

  const jobs: Job[] = [
    {
      id: 'scb-techx',
      title: 'Software Engineer Intern (Frontend / Fullstack - Co-op 2025)',
      company: 'SCB TechX Co., Ltd.',
      badge: 'SCBX Group',
      match: '98%',
      tags: ['TypeScript', 'React', 'Next.js', 'Cloud'],
      salary: '18,000 - 22,000 / เดือน',
      location: 'กรุงเทพมหานคร (พญาไท)',
      workType: 'Hybrid (เข้าออฟฟิศ 2 วัน/สัปดาห์)',
      responsibilities: [
        'ร่วมพัฒนาและดูแลเว็บแอปพลิเคชันนวัตกรรม FinTech ด้วย React, Next.js, TypeScript และ Node.js',
        'ทำงานร่วมกับ Senior Software Engineers, Tech Leads และ Product Designers ในการแปล Figma Mockup เป็นระบบ Production ที่มีประสิทธิภาพ',
        'เขียน Unit Test และ Integration Test เพื่อควบคุมคุณภาพของซอฟต์แวร์',
        'เข้าร่วมกระบวนการทำงานแบบ Agile Development, Sprint Planning, Daily Stand-up และ Code Review อย่างเป็นระบบ',
        'ศึกษาและประยุกต์ใช้เทคโนโลยีใหม่ เช่น Cloud-Native (AWS, Kubernetes, Docker) ในโครงการสหกิจศึกษา'
      ],
      qualifications: [
        'นิสิต/นักศึกษา ชั้นปีที่ 3 หรือ 4 สาขาวิชาวิศวกรรมคอมพิวเตอร์, วิทยาการคอมพิวเตอร์ หรือสาขาที่เกี่ยวข้อง',
        'เกรดเฉลี่ยสะสม (GPAX) ไม่ต่ำกว่า 2.75 และผ่านการทดสอบความพร้อมทางวิชาการตามเกณฑ์ของมหาวิทยาลัย',
        'มีความรู้พื้นฐานในการพัฒนาเว็บด้วย HTML5, CSS3, Modern JavaScript (ES6+) และ React/TypeScript',
        'เข้าใจหลักการทำงานของ RESTful API และการเชื่อมต่อข้อมูลกับระบบ Backend',
        'มีผลงานหรือโครงงานที่เคยพัฒนาที่สามารถนำเสนอได้ (GitHub / Portfolio จะได้รับการพิจารณาเป็นพิเศษ)'
      ],
      perks: [
        'ประกันอุบัติเหตุและสุขภาพกลุ่ม',
        'โน้ตบุ๊กประสิทธิภาพสูงสำหรับการทำงาน',
        'คอร์สเรียนออนไลน์เสริมทักษะฟรี',
        'ขนมและเครื่องดื่มฟรีตลอดวันในออฟฟิศ'
      ],
      timeline: {
        open: '1 ม.ค. - 28 ก.พ. 2025',
        interview: '15 มี.ค. - 15 เม.ย. 2025',
        start: '1 มิ.ย. - 30 ก.ย. 2025'
      },
      hrName: 'คุณศุภโชค สุวรรณมณี',
      hrRole: 'People Experience & University Relations'
    },
    {
      id: 'line-man',
      title: 'Full-Stack Developer Intern',
      company: 'LINE Thailand (LINE MAN Wongnai)',
      badge: 'LINE Group',
      match: '95%',
      tags: ['React', 'Node.js', 'GraphQL'],
      salary: '12,000 / เดือน',
      location: 'กรุงเทพมหานคร (เอกมัย)',
      workType: 'On-site',
      responsibilities: [
        'ร่วมพัฒนาฟีเจอร์ใหม่บนแพลตฟอร์ม LINE MAN และ Wongnai',
        'พัฒนา Microservices และ API ด้วย Node.js และ TypeScript',
        'ร่วมออกแบบ UI/UX และพัฒนาหน้าเว็บด้วย React.js',
        'ทำงานร่วมกับทีม Product Manager และ QA ในระบบ Agile'
      ],
      qualifications: [
        'นักศึกษาชั้นปีที่ 3-4 สาขาวิทยาการคอมพิวเตอร์ หรือสาขาที่เกี่ยวข้อง',
        'เข้าใจหลักการพัฒนา Full-stack Web Application',
        'มีความสนใจในระบบที่มีผู้ใช้งานจำนวนมาก (High Traffic Systems)'
      ],
      perks: [
        'อาหารกลางวันและสวัสดิการพนักงานฟรี',
        'อุปกรณ์แล็ปท็อปสำหรับการทำงาน'
      ],
      timeline: {
        open: '1 ม.ค. - 15 มี.ค. 2025',
        interview: '20 มี.ค. - 30 เม.ย. 2025',
        start: '1 มิ.ย. - 31 ต.ค. 2025'
      },
      hrName: 'คุณภาวิณี ศรีสุข',
      hrRole: 'Talent Acquisition Specialist'
    },
    {
      id: 'kbtg',
      title: 'Associate UI/UX Designer (Intern)',
      company: 'Kasikorn Business-Technology Group (KBTG)',
      badge: 'KBank Group',
      match: '91%',
      tags: ['Figma', 'User Research', 'Design System'],
      salary: '15,000 / เดือน',
      location: 'นนทบุรี (แจ้งวัฒนะ)',
      workType: 'Hybrid',
      responsibilities: [
        'ออกแบบ Wireframe, Prototype และ User Interface สำหรับแอปพลิเคชันการเงิน',
        'ทำ User Research และ Usability Testing ร่วมกับทีม UX',
        'ดูแลและอัปเดต Design System ขององค์กร'
      ],
      qualifications: [
        'นักศึกษา สาขาปฏิสัมพันธ์มนุษย์กับคอมพิวเตอร์ (HCI), สถาปัตยกรรม หรือการออกแบบสื่อดิจิทัล',
        'เชี่ยวชาญการใช้เครื่องมือ Figma และ Adobe Creative Suite',
        'มี Portfolio แสดงผลงาน UX/UI อย่างชัดเจน'
      ],
      perks: [
        'เบี้ยเลี้ยงประจำเดือน',
        'การเทรนนิ่งจากทีม UX/UI ผู้เชี่ยวชาญ'
      ],
      timeline: {
        open: '15 ม.ค. - 31 มี.ค. 2025',
        interview: '1 เม.ย. - 30 เม.ย. 2025',
        start: '1 มิ.ย. - 30 ก.ย. 2025'
      },
      hrName: 'คุณกิตติศักดิ์ เจริญพร',
      hrRole: 'Campus Recruitment Lead'
    },
    {
      id: 'agoda',
      title: 'Associate Frontend Engineer',
      company: 'Agoda Services Co., Ltd.',
      badge: 'Global Tech',
      match: '88%',
      tags: ['React', 'TypeScript', 'Large Scale UI'],
      salary: '27,000 / เดือน',
      location: 'กรุงเทพมหานคร (เซ็นทรัลเวิลด์)',
      workType: 'Hybrid',
      responsibilities: [
        'ร่วมสร้างสรรค์ประสบการณ์ใช้งานเว็บไซต์ท่องเที่ยวระดับโลก',
        'พัฒนา UI Component ที่รองรับการแสดงผลหลายภาษา และประสิทธิภาพสูง',
        'ทำ A/B Testing เพื่อปรับปรุง Conversion Rate'
      ],
      qualifications: [
        'สื่อสารภาษาอังกฤษได้ดีเยี่ยม (บรรยากาศการทำงานนานาชาติ)',
        'เชี่ยวชาญ React.js, TypeScript, HTML5/CSS3',
        'มีใจรักในการพัฒนา Web Performance'
      ],
      perks: [
        'ค่าตอบแทนสูงพิเศษ 27,000 บาท/เดือน',
        'ส่วนลดโรงแรมและตั๋วเครื่องบินสำหรับ Agoda Staff'
      ],
      timeline: {
        open: '1 ม.ค. - 15 เม.ย. 2025',
        interview: '1 พ.ค. - 15 พ.ค. 2025',
        start: '1 มิ.ย. - 31 ต.ค. 2025'
      },
      hrName: 'Ms. Sarah Jenkins',
      hrRole: 'Global University Recruiting Manager'
    },
    {
      id: 'ais',
      title: 'Data Engineer & Platform Intern',
      company: 'AIS (Advanced Info Service)',
      badge: 'SET Top 10',
      match: '85%',
      tags: ['Python', 'Kafka', 'PostgreSQL'],
      salary: '17,000 / เดือน',
      location: 'กรุงเทพมหานคร (พญาไท)',
      workType: 'On-site',
      responsibilities: [
        'ออกแบบและสร้าง Data Pipeline ในการประมวลผลข้อมูล Big Data',
        'ดูแลและปรับปรุงประสิทธิภาพของฐานข้อมูล PostgreSQL และ Kafka',
        'ทำงานร่วมกับ Data Scientist และ Business Analyst'
      ],
      qualifications: [
        'นักศึกษา สาขาวิศวกรรมคอมพิวเตอร์, วิทยาการข้อมูล หรือสาขาที่เกี่ยวข้อง',
        'มีความรู้ด้าน SQL, Python และระบบ Data Warehouse',
        'มีความเข้าใจเบื้องต้นเกี่ยวกับ Cloud Infrastructure (AWS/GCP)'
      ],
      perks: [
        'ส่วนลดค่าแพ็กเกจอินเทอร์เน็ต AIS',
        'สวัสดิการรถรับส่งพนักงาน'
      ],
      timeline: {
        open: '1 ม.ค. - 30 มี.ค. 2025',
        interview: '1 เม.ย. - 20 เม.ย. 2025',
        start: '1 มิ.ย. - 30 ก.ย. 2025'
      },
      hrName: 'คุณธนภัทร รัตนเวช',
      hrRole: 'Data Talent Acquisition'
    },
    {
      id: 'garena',
      title: 'Backend Engineer Intern (Cloud)',
      company: 'Garena Online Co., Ltd.',
      badge: 'Sea Group',
      match: '82%',
      tags: ['GoLang', 'Docker', 'PostgreSQL'],
      salary: '20,000 / เดือน',
      location: 'กรุงเทพมหานคร (พระราม 9)',
      workType: 'On-site',
      responsibilities: [
        'พัฒนาและดูแลระบบ Backend รองรับเกมออนไลน์ระดับโลก',
        'เขียนโปรแกรมด้วยภาษา Go (Golang) และทำงานกับ Docker/Kubernetes',
        'เพิ่มประสิทธิภาพระบบและความแม่นยำของฐานข้อมูล'
      ],
      qualifications: [
        'นิสิต/นักศึกษา สาขาวิศวกรรมคอมพิวเตอร์ หรือวิทยาการคอมพิวเตอร์',
        'เข้าใจระบบ Data Structures, Algorithms และ Computer Networks เป็นอย่างดี',
        'สนใจการพัฒนาโปรแกรมด้วยภาษา Go'
      ],
      perks: [
        'เบี้ยเลี้ยง 20,000 บาท/เดือน',
        'ฟรีเครดิตเกมในเครือ Garena และขนมทานเล่นในออฟฟิศ'
      ],
      timeline: {
        open: '10 ม.ค. - 31 มี.ค. 2025',
        interview: '1 เม.ย. - 30 เม.ย. 2025',
        start: '1 มิ.ย. - 30 ก.ย. 2025'
      },
      hrName: 'คุณณัฐพล วงศ์สว่าง',
      hrRole: 'Tech Campus Recruiter'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 text-sm font-sans">

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        
        {/* Profile Section */}
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
                <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                  <h1 className="text-lg font-bold text-slate-900">{profileData.name}</h1>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-medium">
                    ผ่านการทดสอบสหกิจศึกษาแล้ว
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {profileData.faculty} • {profileData.major}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  ชั้นปีที่ {profileData.year} | รหัสนักศึกษา: {profileData.studentId}
                </p>
              </div>
            </div>

            {/* Stats & Actions */}
            <div className="flex items-center space-x-6 w-full md:w-auto justify-between md:justify-end">
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-800">{profileData.gpa} <span className="text-xs text-slate-400 font-normal">/ 4.00</span></div>
                <div className="text-[11px] text-slate-500">เกรดเฉลี่ยสะสม</div>
              </div>
              <div className="text-center border-l border-slate-200 pl-6">
                <div className="text-2xl font-bold text-slate-800">{profileData.credits} <span className="text-xs text-slate-400 font-normal">/ 136</span></div>
                <div className="text-[11px] text-slate-500">หน่วยกิตสะสม</div>
              </div>
              <div className="flex flex-col space-y-2 border-l border-slate-200 pl-6">
                <button 
                  onClick={handleOpenEditProfile}
                  className="px-3 py-1.5 bg-indigo-900 hover:bg-indigo-800 text-white rounded-lg text-xs font-medium flex items-center justify-center space-x-1 shadow-sm transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>แก้ไขโปรไฟล์ / อัปโหลด Resume</span>
                </button>
                <button className="px-3 py-1.5 border border-indigo-900 text-indigo-900 hover:bg-indigo-50 rounded-lg text-xs font-medium flex items-center justify-center space-x-1">
                  <FileText className="w-3.5 h-3.5" />
                  <span>หนังสือรับรองจากศูนย์สหกิจฯ</span>
                </button>
              </div>
            </div>
          </div>

          {/* Skills Tags */}
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-2 items-center">
            <span className="text-xs font-semibold text-slate-500 mr-2">ทักษะความสามารถ:</span>
            {profileData.skills.map((skill, index) => (
              <span key={index} className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-xs font-medium">
                {skill}
              </span>
            ))}
          </div>
        </section>

        {/* Search & Grid Section */}
        <section className="space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">ค้นหาตำแหน่งงาน & องค์กรพันธมิตรสหกิจศึกษา</h2>
              <p className="text-xs text-slate-500">ระบบคัดสรรงานที่เหมาะสมกับทักษะของคุณ (AI Skill Matching)</p>
            </div>
            <span className="text-xs text-slate-500">ตำแหน่งงานเปิดรับ: <strong className="text-indigo-900">142</strong> ตำแหน่ง</span>
          </div>

          {/* Search Bar */}
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

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-2 text-xs">
            <button className="px-3 py-1.5 bg-indigo-900 text-white rounded-full font-medium">ตำแหน่งทั้งหมด</button>
            <button className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-full hover:bg-slate-50">Software & Web Dev</button>
            <button className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-full hover:bg-slate-50">UI/UX & Product Design</button>
            <button className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-full hover:bg-slate-50">Data Engineering & AI</button>
            <button className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-full hover:bg-slate-50">มีเบี้ยเลี้ยง</button>
          </div>

          {/* Jobs Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.map((job) => (
              <div 
                key={job.id} 
                onClick={() => setSelectedJob(job)}
                className="bg-white p-4 rounded-xl border border-slate-200 hover:border-indigo-900 hover:shadow-md cursor-pointer transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <span className="inline-flex items-center text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
                      <Sparkles className="w-3 h-3 mr-1" /> ตรงกับทักษะ {job.match}
                    </span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); }}
                      className="text-slate-400 hover:text-slate-600 p-1"
                    >
                      <Bookmark className="w-4 h-4" />
                    </button>
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 mt-2 line-clamp-1 group-hover:text-indigo-900 transition-colors">
                    {job.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{job.company}</p>

                  <div className="flex flex-wrap gap-1 mt-3">
                    {job.tags.map((tag, idx) => (
                      <span key={idx} className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                  <span className="font-bold text-amber-600">{job.salary}</span>
                  <span className="text-indigo-900 font-medium text-[11px] group-hover:translate-x-0.5 transition-transform flex items-center">
                    ดูรายละเอียด <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

      </main>

      {/* ----------------- MODAL 1: แก้ไขโปรไฟล์ / อัปโหลด Resume ----------------- */}
      {isEditProfileOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setIsEditProfileOpen(false)}
        >
          <div 
            className="relative bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-indigo-900 text-white rounded-lg flex items-center justify-center font-bold">
                  <User className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-slate-900">แก้ไขข้อมูลโปรไฟล์ / อัปโหลด Resume</h2>
              </div>
              <button 
                onClick={() => setIsEditProfileOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveProfile} className="p-6 overflow-y-auto space-y-5 text-xs">
              
              {/* Personal Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">ชื่อ-นามสกุล</label>
                  <input 
                    type="text" 
                    value={tempProfile.name}
                    onChange={(e) => setTempProfile({ ...tempProfile, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-900/20 focus:border-indigo-900"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">รหัสนักศึกษา</label>
                  <input 
                    type="text" 
                    value={tempProfile.studentId}
                    onChange={(e) => setTempProfile({ ...tempProfile, studentId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-900/20 focus:border-indigo-900"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">สำนักวิชา</label>
                  <input 
                    type="text" 
                    value={tempProfile.faculty}
                    onChange={(e) => setTempProfile({ ...tempProfile, faculty: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-900/20 focus:border-indigo-900"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">สาขาวิชา</label>
                  <input 
                    type="text" 
                    value={tempProfile.major}
                    onChange={(e) => setTempProfile({ ...tempProfile, major: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-900/20 focus:border-indigo-900"
                    required
                  />
                </div>
              </div>

              {/* Academic Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">ชั้นปีที่</label>
                  <input 
                    type="text" 
                    value={tempProfile.year}
                    onChange={(e) => setTempProfile({ ...tempProfile, year: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-900/20 focus:border-indigo-900"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">เกรดเฉลี่ย (GPA)</label>
                  <input 
                    type="text" 
                    value={tempProfile.gpa}
                    onChange={(e) => setTempProfile({ ...tempProfile, gpa: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-900/20 focus:border-indigo-900"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">หน่วยกิตสะสม</label>
                  <input 
                    type="text" 
                    value={tempProfile.credits}
                    onChange={(e) => setTempProfile({ ...tempProfile, credits: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-900/20 focus:border-indigo-900"
                    required
                  />
                </div>
              </div>

              {/* Skills Editor */}
              <div className="pt-2">
                <label className="block font-medium text-slate-700 mb-1.5">ทักษะความสามารถ (Skills)</label>
                <div className="flex flex-wrap gap-1.5 p-3 border border-slate-200 bg-slate-50 rounded-lg min-h-[60px] items-center mb-2">
                  {tempProfile.skills.map((skill, index) => (
                    <span key={index} className="bg-indigo-900 text-white px-2.5 py-1 rounded-md text-[11px] font-medium flex items-center space-x-1">
                      <span>{skill}</span>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveSkill(skill)}
                        className="hover:text-red-300 ml-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="พิมพ์ชื่อทักษะ เช่น Docker, Next.js..."
                    value={newSkillInput}
                    onChange={(e) => setNewSkillInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSkill(); }}}
                    className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-900"
                  />
                  <button 
                    type="button"
                    onClick={handleAddSkill}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg flex items-center space-x-1 font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>เพิ่ม</span>
                  </button>
                </div>
              </div>

              {/* Upload Resume Section */}
              <div className="pt-2">
                <label className="block font-medium text-slate-700 mb-1.5">ไฟล์ Resume (PDF / Word)</label>
                <div className="p-4 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 text-center relative hover:bg-indigo-50/30 transition-colors">
                  <input 
                    type="file" 
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center justify-center space-y-1">
                    <File className="w-8 h-8 text-indigo-900/60" />
                    <div className="text-slate-700 font-medium">
                      {tempProfile.resumeName ? (
                        <span className="text-indigo-900 font-semibold">{tempProfile.resumeName}</span>
                      ) : (
                        "คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวางที่นี่"
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400">รองรับไฟล์ .PDF, .DOCX (ขนาดไม่เกิน 10MB)</span>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-200 flex justify-end space-x-2">
                <button 
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-600 hover:bg-slate-100 font-medium rounded-lg"
                >
                  ยกเลิก
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-indigo-900 hover:bg-indigo-800 text-white font-medium rounded-lg shadow-sm flex items-center space-x-1"
                >
                  <Check className="w-4 h-4" />
                  <span>บันทึกการเปลี่ยนแปลง</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ----------------- MODAL 2: รายละเอียดตำแหน่งงาน ----------------- */}
      {selectedJob && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setSelectedJob(null)}
        >
          <div 
            className="relative bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200 bg-white">
              <div className="flex justify-between items-start">
                <div className="flex space-x-4">
                  <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100 shrink-0">
                    <Building2 className="w-6 h-6 text-indigo-900" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <h2 className="text-lg font-bold text-slate-900">{selectedJob.company}</h2>
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
                      <span className="flex items-center"><MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" /> {selectedJob.location}</span>
                      <span className="flex items-center"><Briefcase className="w-3.5 h-3.5 mr-1 text-slate-400" /> {selectedJob.workType}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">
                    <Share2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setSelectedJob(null)}
                    className="p-2 border border-slate-200 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Column (Details) */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* Responsibilities */}
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-3 flex items-center">
                      <span className="w-1.5 h-4 bg-indigo-900 rounded-full mr-2"></span>
                      หน้าที่ความรับผิดชอบ (Key Responsibilities)
                    </h4>
                    <ul className="space-y-2 text-xs text-slate-600 list-disc list-inside leading-relaxed">
                      {selectedJob.responsibilities.map((resp, idx) => (
                        <li key={idx}>{resp}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Qualifications */}
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-3 flex items-center">
                      <span className="w-1.5 h-4 bg-indigo-900 rounded-full mr-2"></span>
                      คุณสมบัติผู้สมัคร (Qualifications)
                    </h4>
                    <ul className="space-y-2 text-xs text-slate-600 list-disc list-inside leading-relaxed">
                      {selectedJob.qualifications.map((qual, idx) => (
                        <li key={idx}>{qual}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Culture */}
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

                {/* Right Column (Sidebar Cards) */}
                <div className="space-y-4">
                  
                  {/* Salary Card */}
                  <div className="bg-amber-50/50 border border-amber-200 p-4 rounded-xl">
                    <div className="text-xs text-amber-800 font-medium">เบี้ยเลี้ยง / ค่าตอบแทน</div>
                    <div className="text-xl font-bold text-amber-600 mt-1">{selectedJob.salary}</div>
                    
                    {selectedJob.perks.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-amber-200/60 space-y-1.5 text-[11px] text-slate-600">
                        {selectedJob.perks.map((perk, idx) => (
                          <div key={idx} className="flex items-start">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mr-1.5 shrink-0 mt-0.5" />
                            <span>{perk}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Timeline Card */}
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs space-y-2">
                    <div className="font-bold text-slate-900 border-b border-slate-200 pb-2 flex items-center">
                      <Calendar className="w-3.5 h-3.5 mr-1.5 text-indigo-900" /> กำหนดการรับสมัคร
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">เปิดรับสมัคร:</span>
                      <span className="font-medium text-slate-800">{selectedJob.timeline.open}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">สัมภาษณ์งาน:</span>
                      <span className="font-medium text-slate-800">{selectedJob.timeline.interview}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">เริ่มปฏิบัติงาน:</span>
                      <span className="font-medium text-slate-800">{selectedJob.timeline.start}</span>
                    </div>
                  </div>

                  {/* HR Contact Card */}
                  {selectedJob.hrName && (
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs space-y-2">
                      <div className="font-bold text-slate-900 border-b border-slate-200 pb-2 flex items-center">
                        <UserCheck className="w-3.5 h-3.5 mr-1.5 text-indigo-900" /> ผู้ประสานงานการรับสมัคร
                      </div>
                      <div className="font-medium text-slate-800">{selectedJob.hrName}</div>
                      <div className="text-[11px] text-slate-500">{selectedJob.hrRole}</div>
                    </div>
                  )}

                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-3">
              <button 
                onClick={() => setSelectedJob(null)}
                className="px-4 py-2 border border-slate-300 text-slate-600 hover:bg-slate-100 font-medium rounded-lg text-xs transition-colors"
              >
                ปิดหน้านี้
              </button>
              <button className="px-4 py-2 border border-indigo-900 text-indigo-900 hover:bg-indigo-50 font-medium rounded-lg text-xs transition-colors">
                พิจารณาเข้าสัมภาษณ์งาน
              </button>
              <button className="px-4 py-2 bg-indigo-900 hover:bg-indigo-800 text-white font-medium rounded-lg text-xs shadow-sm transition-colors">
                ติดต่อนัดหมายขอข้อมูลเพิ่มเติม
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}