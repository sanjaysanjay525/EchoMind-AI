import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api, useAuth } from '../context/AuthContext';
import { Code, Palette, Gamepad2, Clock, Award, HelpCircle, User, Settings, Shield, Globe, FileText, Upload, Sparkles, Smile, Flame, Users, Brain, Video } from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

const TRANSLATIONS = {
  en: {
    title: 'Select Job Role & Configure Interview',
    subtitle: 'Setup your immersive serious game practice session',
    nameLabel: 'Candidate Name',
    roleLabel: 'Select Career Path / Job Role',
    difficultyLabel: 'Experience level (Difficulty)',
    formatLabel: 'Interview Format (Mode)',
    genderLabel: 'Interviewer Gender & Voice Persona',
    officeLabel: 'Virtual Office Environment Setting',
    langLabel: 'Interview Language',
    basicFormat: 'Basic (10 Mins) - Sequential bank questions, no probing follow-ups',
    compFormat: 'Comprehensive (30 Mins) - Adaptive dynamic follow-up probing',
    maleGender: 'Male (Microsoft Azure Niwat voice)',
    femaleGender: 'Female (Google Cloud Neural2-C voice)',
    modernOffice: 'Modern Tech Workspace (High rise city view)',
    creativeStudio: 'Creative Design Studio (Vibrant artistic vibe)',
    formalBoardroom: 'Formal Corporate Boardroom (Polished corporate setup)',
    startBtn: 'Next / Start Interview',
    exitBtn: 'Exit to Dashboard',
    backBtn: 'Back',
    resumeLabel: 'Resume / Job Description Analysis',
    resumeHint: 'Upload (.txt, .pdf) or paste your resume/JD below to auto-extract tailored questions & suggested career path.',
    resumePlaceholder: 'Paste your resume or job description details here...',
    analyzeBtn: 'Analyze & Suggest Settings',
    analyzing: 'Analyzing Profile with Gemini AI...',
    autoSuggestBadge: 'Suggested Career Path: {domain} (including 3 custom interview questions)',
    practiceModeLabel: 'Interview Evaluation Mode',
    practiceOption: 'Practice Mode (Reveals sample ideal answers/hints after each question)',
    gradedOption: 'Graded Mode (Withholds all feedback until the final report scorecard)',
    personaLabel: 'Select Interviewer AI Persona',
    flowLabel: 'Choose Assessment Mode',
    multiRoundTab: 'Multi-Round Pipeline',
    classicTab: 'Classic Mock Interview',
    technicalTab: 'Technical DSA Coding',
  },
  th: {
    title: 'เลือกตำแหน่งงานและตั้งค่าการสัมภาษณ์',
    subtitle: 'ตั้งค่าการจำลองการสัมภาษณ์ในรูปแบบเกมการศึกษาเพื่อฝึกฝนทักษะของคุณ',
    nameLabel: 'ชื่อผู้สมัคร',
    roleLabel: 'ตำแหน่งงานที่สมัคร',
    difficultyLabel: 'ระดับประสบการณ์ (ความยาก)',
    formatLabel: 'รูปแบบการสัมภาษณ์',
    genderLabel: 'เพศและเสียงของผู้สัมภาษณ์จำลอง',
    officeLabel: 'สถานที่สัมภาษณ์จำลอง (Environment)',
    langLabel: 'ภาษาที่ใช้ในการสัมภาษณ์',
    basicFormat: 'เบื้องต้น (10 นาที) - ถามคำถาม 5 ข้อตามลำดับ ไม่มีคำถามเจาะลึก',
    compFormat: 'ละเอียด (30 นาที) - เจาะลึกรายข้อด้วย AI ปรับเปลี่ยนตามคำตอบของผู้สมัคร',
    maleGender: 'ชาย (เสียง Niwat จาก MS Azure)',
    femaleGender: 'หญิง (เสียง Neural2-C จาก Google Cloud)',
    modernOffice: 'ห้องทำงานบริษัทเทคโนโลยีสุดโมเดิร์น',
    creativeStudio: 'สตูดิโอสร้างสรรค์ของทีมออกแบบสีสันสดใส',
    formalBoardroom: 'ห้องประชุมคณะกรรมการบริหารสุดหรูหรา',
    startBtn: 'ถัดไป / เริ่มสัมภาษณ์',
    exitBtn: 'ออกไปที่แดชบอร์ด',
    backBtn: 'ย้อนกลับ',
    resumeLabel: 'การวิเคราะห์เรซูเม่ / รายละเอียดงาน (Resume/JD)',
    resumeHint: 'อัปโหลดไฟล์ (.txt, .pdf) หรือวางข้อความเพื่อสแกนทักษะและสร้างคำถามสัมภาษณ์เฉพาะบุคคล 3 ข้อ',
    resumePlaceholder: 'วางข้อมูลเรซูเม่ ประวัติการทำงาน หรือรายละเอียดงานที่นี่...',
    analyzeBtn: 'เริ่มวิเคราะห์ข้อมูล',
    analyzing: 'กำลังวิเคราะห์โปรไฟล์ของคุณด้วย AI...',
    autoSuggestBadge: 'ตรวจพบตำแหน่งแนะนำ: {domain} (เพิ่มคำถามเฉพาะเจาะจง 3 ข้อเรียบร้อย)',
    practiceModeLabel: 'โหมดการประเมินผล',
    practiceOption: 'โหมดเน้นฝึกฝน (เฉลยแนวทางตอบและคำแนะนำแบบเรียลไทม์หลังตอบคำถามแต่ละข้อ)',
    gradedOption: 'โหมดสัมภาษณ์จริง (เก็บคะแนนและประเมินผลหลังจบการสัมภาษณ์เท่านั้น)',
    personaLabel: 'เลือกบุคลิกและเพศจำลอง AI (Persona)',
    flowLabel: 'เลือกโหมดการประเมินผล',
    multiRoundTab: 'การสัมภาษณ์หลายรอบ (Multi-Round)',
    classicTab: 'การสัมภาษณ์จำลองดั้งเดิม (Classic Mock)',
    technicalTab: 'โหมดวิเคราะห์โค้ด (Technical DSA)',
  }
};

const DOMAINS = [
  {
    id: 'Software Engineer',
    nameEn: 'Software Engineer',
    nameTh: 'วิศวกรซอฟต์แวร์',
    descEn: 'Covers OOP principles, DBMS, database query structures, debugging, and multi-threaded applications (Java, Python, C++).',
    descTh: 'ครอบคลุมแนวคิดหลัก OOP, การจัดการฐานข้อมูล (DBMS), การแก้ไขข้อผิดพลาด, และการทำงานแบบ Multi-threaded (Java, Python, C++)',
    icon: Code,
    color: 'from-blue-500 to-indigo-500',
    bgColor: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
  },
  {
    id: 'UI/UX Designer',
    nameEn: 'UI/UX Designer',
    nameTh: 'นักออกแบบ UI/UX',
    descEn: 'Focuses on user-centered design, usability testing vs A/B tests, Figma prototyping, and developer handoffs.',
    descTh: 'เน้นหลักการออกแบบที่เน้นผู้ใช้เป็นศูนย์กลาง, การทดสอบความพึงพอใจเปรียบเทียบ A/B, การทำต้นแบบด้วย Figma, และการส่งต่อวิศวกร',
    icon: Palette,
    color: 'from-pink-500 to-rose-500',
    bgColor: 'bg-pink-500/10 border-pink-500/20 text-pink-400',
  },
  {
    id: 'Game Developer',
    nameEn: 'Game Developer',
    nameTh: 'นักพัฒนาเกม',
    descEn: 'Examines game loop mechanics, framerate profiling, entity component systems (ECS), physics collisions, and level streaming.',
    descTh: 'ทดสอบกลไกเกมลูป, การเพิ่มความเร็วเฟรมเรต, สถาปัตยกรรม Entity Component (ECS), ฟิสิกส์ชนกัน, และการโหลดด่านแบบ Level Streaming',
    icon: Gamepad2,
    color: 'from-emerald-500 to-teal-500',
    bgColor: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
  }
];

const PERSONAS = [
  {
    id: 'SUPPORTIVE_COACH',
    nameEn: 'Supportive Coach',
    nameTh: 'โค้ชผู้สนับสนุน',
    descEn: 'Patient, instructional, warm, and encouraging. Nudges candidate gently.',
    descTh: 'อบอุ่น ใจเย็น ช่วยเหลือ แนะนำอย่างประนีประนอม',
    icon: Smile,
    color: 'from-amber-400 to-orange-500',
    bgColor: 'bg-amber-500/10 border-amber-500/20 text-amber-400'
  },
  {
    id: 'FRIENDLY_STARTUP_FOUNDER',
    nameEn: 'Friendly Startup Founder',
    nameTh: 'ผู้ร่วมก่อตั้งสตาร์ทอัพเป็นกันเอง',
    descEn: 'Empathetic, collaborative, growth-focused, and vision-oriented.',
    descTh: 'เน้นวิสัยทัศน์ ความกระตือรือร้น ความยืดหยุ่นและการเติบโตแบบก้าวกระโดด',
    icon: Users,
    color: 'from-blue-400 to-indigo-500',
    bgColor: 'bg-blue-500/10 border-blue-500/20 text-blue-400'
  },
  {
    id: 'RAPID_FIRE_TECHNICAL',
    nameEn: 'Rapid-Fire Technical Grinder',
    nameTh: 'วิศวกรซอฟต์แวร์สายเน้นรายละเอียด',
    descEn: 'Fast-paced, precise, focusing on accuracy, syntax, and optimizations.',
    descTh: 'ถามเร็ว ตอบเร็ว เน้นความถูกต้อง แม่นยำ และจังหวะความลื่นไหล',
    icon: Code,
    color: 'from-purple-500 to-indigo-600',
    bgColor: 'bg-purple-500/10 border-purple-500/20 text-purple-400'
  },
  {
    id: 'STRICT_BAR_RAISER',
    nameEn: 'Strict Bar Raiser',
    nameTh: 'ผู้คุมมาตรฐานระดับสูง',
    descEn: 'Demanding, critical, focused on high standards and behavior validation.',
    descTh: 'เข้มงวด มุ่งเน้นไปที่ทักษะการแก้ปัญหา ความสมบูรณ์แบบ และโครงสร้าง STAR',
    icon: Flame,
    color: 'from-red-500 to-rose-600',
    bgColor: 'bg-red-500/10 border-red-500/20 text-red-400'
  }
];

export default function InterviewSelectionPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  // UI States
  const [lang, setLang] = useState('en'); // Language Toggle
  const [candidateName, setCandidateName] = useState(user?.name || '');
  const [selectedRole, setSelectedRole] = useState('Software Engineer');
  const [interviewFlow, setInterviewFlow] = useState('multi-round'); // multi-round or classic or technical

  React.useEffect(() => {
    const flowParam = searchParams.get('flow');
    if (flowParam === 'classic' || flowParam === 'multi-round' || flowParam === 'technical') {
      setInterviewFlow(flowParam);
    }
  }, [searchParams]);
  
  // Difficulty Level: 0 = Junior, 1 = Mid, 2 = Senior
  const [difficultyVal, setDifficultyVal] = useState(1);
  const difficultyOptions = ['Junior', 'Mid', 'Senior'];

  const [selectedFormat, setSelectedFormat] = useState('comprehensive');
  const [selectedGender, setSelectedGender] = useState('female');
  const [selectedOffice, setSelectedOffice] = useState('modern_office');
  const [practiceMode, setPracticeMode] = useState(true);
  const [selectedPersona, setSelectedPersona] = useState('SUPPORTIVE_COACH');

  // Resume Upload State
  const [resumeText, setResumeText] = useState('');
  const [customQuestions, setCustomQuestions] = useState(null);
  const [suggestedDomain, setSuggestedDomain] = useState(null);
  const [analyzingResume, setAnalyzingResume] = useState(false);

  const [loading, setLoading] = useState(false);

  const t = TRANSLATIONS[lang];

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        setAnalyzingResume(true);
        try {
          if (!window.pdfjsLib) {
            await new Promise((resolve, reject) => {
              const script = document.createElement('script');
              script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
              script.onload = () => {
                window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                resolve();
              };
              script.onerror = (err) => reject(new Error("Failed to load PDF library."));
              document.head.appendChild(script);
            });
          }
          const arrayBuffer = await file.arrayBuffer();
          const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
          const pdf = await loadingTask.promise;
          let fullText = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += pageText + '\n';
          }
          setResumeText(fullText.trim());
        } catch (err) {
          console.error("Error parsing PDF file: ", err);
          alert(lang === 'th' ? "ล้มเหลวในการอ่านไฟล์ PDF โปรดลองคัดลอกข้อความมาวางแทน" : "Failed to parse PDF file. Please try copying and pasting the text instead.");
        } finally {
          setAnalyzingResume(false);
        }
      } else {
        const reader = new FileReader();
        reader.onload = (event) => {
          setResumeText(event.target.result);
        };
        reader.readAsText(file);
      }
    }
  };

  const handleAnalyzeResume = async () => {
    if (!resumeText.trim()) {
      alert(lang === 'th' ? 'กรุณาวางเรซูเม่หรือรายละเอียดงานของคุณก่อน' : 'Please enter or upload resume text first.');
      return;
    }
    setAnalyzingResume(true);
    try {
      const res = await api.post('/interviews/analyze-resume', { resumeText });
      const { suggestedDomain, tailoredQuestions } = res.data;
      setCustomQuestions(tailoredQuestions);
      
      if (suggestedDomain) {
        // Robust matching to ensure it matches one of the DOMAINS IDs
        const normalized = suggestedDomain.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        const matchedDomain = DOMAINS.find(d => 
          d.id.toLowerCase().replace(/[^a-z0-9]/g, '') === normalized
        );
        if (matchedDomain) {
          setSelectedRole(matchedDomain.id);
          setSuggestedDomain(matchedDomain.id);
        } else {
          console.warn("Suggested domain from AI did not match any predefined DOMAINS:", suggestedDomain);
          setSuggestedDomain(suggestedDomain); // fallback display
        }
      }
    } catch (err) {
      console.error("Failed to analyze resume", err);
      alert(lang === 'th' ? "ล้มเหลวในการวิเคราะห์ข้อมูล โปรดลองอีกครั้ง" : "Failed to analyze resume profile. Please try again.");
    } finally {
      setAnalyzingResume(false);
    }
  };

  const handleStart = async () => {
    if (!candidateName.trim()) {
      alert(lang === 'th' ? 'กรุณากรอกชื่อผู้สมัคร' : 'Please enter candidate name.');
      return;
    }
    setLoading(true);
    try {
      if (interviewFlow === 'technical') {
        const res = await api.post('/coding/sessions', {
          difficulty: difficultyOptions[difficultyVal],
          topicTags: []
        });
        const codingSession = res.data;
        navigate(`/coding/session/${codingSession.session.id}`);
      } else if (interviewFlow === 'multi-round') {
        const res = await api.post('/sessions/start', {
          careerPath: selectedRole,
          personaId: selectedPersona
        });
        
        const session = res.data;
        navigate(`/interview/${session.id}/round/aptitude`);
      } else {
        // Classic mock session (single round with webcam face & speech transcription tracker)
        const res = await api.post('/interviews/start', {
          domain: selectedRole,
          difficulty: difficultyOptions[difficultyVal],
          mode: selectedFormat,
          interviewerGender: selectedGender,
          officeSetting: selectedOffice,
          language: lang,
          practiceMode: practiceMode,
          customQuestions: customQuestions,
          interviewerPersona: selectedPersona
        });
        
        const interview = res.data;
        navigate(`/session/${interview.id}`);
      }
    } catch (err) {
      console.error("Failed to start session", err);
      alert(lang === 'th' ? "ล้มเหลวในการเริ่มการสัมภาษณ์ โปรดลองอีกครั้ง" : "Failed to start interview session. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-darkBg flex flex-col text-white">
      <Navbar />
      <div className="flex-1 flex">
        <Sidebar />
        <main className="flex-1 p-8 overflow-y-auto max-w-5xl mx-auto w-full">
          {/* Header & Language Toggle */}
          <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
            <div>
              <h1 className="font-display font-extrabold text-3xl tracking-tight text-white mb-2">{t.title}</h1>
              <p className="text-gray-400 text-sm">{t.subtitle}</p>
            </div>
            
            <button
              onClick={() => setLang(lang === 'en' ? 'th' : 'en')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-indigo-500/30 hover:bg-white/10 transition-all font-semibold text-sm self-start sm:self-center"
            >
              <Globe className="w-4 h-4 text-indigo-400" />
              <span>{lang === 'en' ? 'ไทย (TH)' : 'English (EN)'}</span>
            </button>
          </header>

          <div className="glass-card p-8 rounded-3xl flex flex-col gap-6">
            
            {/* Candidate Name */}
            <div className="flex flex-col gap-2">
              <label className="text-xs text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-400" />
                {t.nameLabel}
              </label>
              <input
                type="text"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                placeholder="Enter candidate name..."
                className="glass-input px-4 py-3 rounded-xl text-base text-white focus:border-indigo-500/50 bg-white/5 border border-white/10 w-full md:max-w-md font-medium"
              />
            </div>

            {/* Assessment Flow Switcher Header */}
            <div className="flex flex-col gap-2">
              <label className="text-xs text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5 text-indigo-400" />
                <span>{t.flowLabel}</span>
              </label>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-white/5 p-1.5 rounded-2xl border border-white/5 max-w-2xl">
                <button
                  type="button"
                  onClick={() => setInterviewFlow('multi-round')}
                  className={`py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 justify-center md:justify-start ${
                    interviewFlow === 'multi-round'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Brain className="w-4 h-4 text-amber-400" />
                  <span className="block font-bold">{t.multiRoundTab}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInterviewFlow('classic')}
                  className={`py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 justify-center md:justify-start ${
                    interviewFlow === 'classic'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Video className="w-4 h-4 text-blue-400" />
                  <span className="block font-bold">{t.classicTab}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInterviewFlow('technical')}
                  className={`py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 justify-center md:justify-start ${
                    interviewFlow === 'technical'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Code className="w-4 h-4 text-emerald-400" />
                  <span className="block font-bold">{t.technicalTab}</span>
                </button>
              </div>
            </div>

            {/* Resume Upload / Job Description Paste Section */}
            <div className="flex flex-col gap-3 bg-white/5 border border-white/5 p-6 rounded-2xl">
              <label className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                {t.resumeLabel}
              </label>
              <p className="text-gray-400 text-xs">{t.resumeHint}</p>
              
              <div className="flex flex-col md:flex-row gap-4 items-start">
                <div className="flex-1 w-full flex flex-col gap-2">
                  <textarea
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    placeholder={t.resumePlaceholder}
                    rows={4}
                    className="glass-input w-full p-4 rounded-xl text-sm placeholder-gray-600 resize-none"
                  />
                  <div className="flex items-center justify-between w-full">
                    <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 hover:border-indigo-500/30 hover:bg-white/5 text-xs text-indigo-300 font-semibold cursor-pointer transition">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload (.txt, .pdf)</span>
                      <input type="file" accept=".txt,.pdf" onChange={handleFileUpload} className="hidden" />
                    </label>
                    
                    <button
                      onClick={handleAnalyzeResume}
                      disabled={analyzingResume}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition flex items-center gap-2"
                    >
                      {analyzingResume ? (
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{t.analyzeBtn}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Suggestions results badge */}
              {suggestedDomain && (
                <div className="mt-3 flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-2.5 rounded-xl text-xs font-semibold animate-reveal">
                  <Sparkles className="w-4 h-4" />
                  <span>{t.autoSuggestBadge.replace('{domain}', suggestedDomain)}</span>
                </div>
              )}
            </div>

            {/* Select Career Path */}
            <div className="flex flex-col gap-3">
              <label className="text-xs text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5 text-indigo-400" />
                {t.roleLabel}
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {DOMAINS.map((role) => {
                  const Icon = role.icon;
                  const isSelected = selectedRole === role.id;
                  return (
                    <div
                      key={role.id}
                      onClick={() => setSelectedRole(role.id)}
                      className={`glass-card p-5 rounded-2xl cursor-pointer flex flex-col gap-3 transition-all duration-300 relative overflow-hidden border ${
                        isSelected 
                          ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/5' 
                          : 'border-white/10 hover:border-indigo-500/30 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${role.bgColor}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-white mb-1">
                          {lang === 'en' ? role.nameEn : role.nameTh}
                        </h3>
                        <p className="text-gray-400 text-xs leading-relaxed">
                          {lang === 'en' ? role.descEn : role.descTh}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Select Interviewer AI Persona */}
            <div className="flex flex-col gap-3">
              <label className="text-xs text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-indigo-400" />
                {t.personaLabel}
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {PERSONAS.map((p) => {
                  const Icon = p.icon;
                  const isSelected = selectedPersona === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPersona(p.id)}
                      className={`glass-card p-5 rounded-2xl cursor-pointer flex flex-col gap-3 transition-all duration-300 relative overflow-hidden border ${
                        isSelected 
                          ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/5' 
                          : 'border-white/10 hover:border-indigo-500/30 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${p.bgColor}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-white mb-1">
                          {lang === 'en' ? p.nameEn : p.nameTh}
                        </h3>
                        <p className="text-gray-400 text-xs leading-relaxed mb-3">
                          {lang === 'en' ? p.descEn : p.descTh}
                        </p>
                      </div>

                      {/* Nested Gender Selection under Selected Card */}
                      {isSelected && (
                        <div className="mt-auto border-t border-white/10 pt-3 flex items-center justify-between">
                          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Voice Tone:</span>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setSelectedGender('female'); }}
                              className={`px-2.5 py-1 rounded text-[10px] font-bold transition ${
                                selectedGender === 'female' 
                                  ? 'bg-indigo-600 text-white' 
                                  : 'bg-white/5 text-gray-400 hover:text-white'
                              }`}
                            >
                              Female
                            </button>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setSelectedGender('male'); }}
                              className={`px-2.5 py-1 rounded text-[10px] font-bold transition ${
                                selectedGender === 'male' 
                                  ? 'bg-indigo-600 text-white' 
                                  : 'bg-white/5 text-gray-400 hover:text-white'
                              }`}
                            >
                              Male
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Difficulty Slider & Practice Toggles */}
            {interviewFlow === 'classic' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2 animate-reveal">
                
                {/* Difficulty Slider (Junior / Mid / Senior) */}
                <div className="flex flex-col gap-3">
                  <label className="text-xs text-gray-400 font-bold uppercase tracking-wider flex items-center justify-between">
                    <span>{t.difficultyLabel}</span>
                    <span className="text-indigo-400 font-bold text-sm">{lang === 'th' && difficultyOptions[difficultyVal] === 'Junior' ? 'ระดับต้น (Junior)' : lang === 'th' && difficultyOptions[difficultyVal] === 'Mid' ? 'ระดับกลาง (Mid)' : lang === 'th' && difficultyOptions[difficultyVal] === 'Senior' ? 'ระดับสูง (Senior)' : difficultyOptions[difficultyVal]}</span>
                  </label>
                  <div className="flex items-center gap-4 bg-white/5 border border-white/5 px-4 py-4 rounded-xl">
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="1"
                      value={difficultyVal}
                      onChange={(e) => setDifficultyVal(parseInt(e.target.value))}
                      className="w-full h-1 bg-white/10 accent-indigo-500 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>

                {/* Assessment Mode Toggle: Practice vs Graded */}
                <div className="flex flex-col gap-3">
                  <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">{t.practiceModeLabel}</label>
                  <div className="grid grid-cols-2 gap-3 bg-white/5 p-1 rounded-xl border border-white/5 h-[54px] items-center">
                    <button
                      type="button"
                      onClick={() => setPracticeMode(true)}
                      className={`h-full rounded-lg text-xs font-bold transition-all ${
                        practiceMode 
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' 
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {lang === 'en' ? 'Practice Mode' : 'โหมดฝึกฝน'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPracticeMode(false)}
                      className={`h-full rounded-lg text-xs font-bold transition-all ${
                        !practiceMode 
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' 
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {lang === 'en' ? 'Graded Mode' : 'โหมดสัมภาษณ์จริง'}
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-400 leading-relaxed italic px-1">
                    {practiceMode ? t.practiceOption : t.gradedOption}
                  </p>
                </div>

                {/* Interview Format (Mode) */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">{t.formatLabel}</label>
                  <select
                    value={selectedFormat}
                    onChange={(e) => setSelectedFormat(e.target.value)}
                    className="glass-input px-4 py-3 rounded-xl text-sm focus:border-indigo-500/50 appearance-none bg-darkCard border border-white/10 cursor-pointer text-white font-medium"
                  >
                    <option value="basic">{t.basicFormat}</option>
                    <option value="comprehensive">{t.compFormat}</option>
                  </select>
                </div>

                {/* Office Settings */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">{t.officeLabel}</label>
                  <select
                    value={selectedOffice}
                    onChange={(e) => setSelectedOffice(e.target.value)}
                    className="glass-input px-4 py-3 rounded-xl text-sm focus:border-indigo-500/50 appearance-none bg-darkCard border border-white/10 cursor-pointer text-white font-medium"
                  >
                    <option value="modern_office">{t.modernOffice}</option>
                    <option value="creative_studio">{t.creativeStudio}</option>
                    <option value="formal_boardroom">{t.formalBoardroom}</option>
                  </select>
                </div>
              </div>
            )}

            {/* Launch Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-4 mt-6 pt-6 border-t border-white/5">
              <button
                onClick={handleStart}
                disabled={loading}
                className="w-full sm:w-auto bg-gradient-indigo hover:opacity-90 text-white font-semibold px-8 py-3.5 rounded-xl flex items-center justify-center gap-2 transition duration-200 shadow-lg shadow-indigo-500/20 text-base disabled:opacity-50 min-w-[200px]"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>{t.startBtn}</span>
                    <Award className="w-4 h-4" />
                  </>
                )}
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 text-sm transition duration-200 font-semibold text-center"
              >
                {t.exitBtn}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
