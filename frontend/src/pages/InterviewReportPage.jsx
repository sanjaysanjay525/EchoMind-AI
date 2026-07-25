import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../context/AuthContext';
import { CheckCircle2, AlertTriangle, Lightbulb, ArrowLeft, RefreshCw, Calendar, Clock, ChevronDown, ChevronUp, Eye, User, Award, Flame, ShieldCheck, Volume2, Activity, Sparkles, Play, StopCircle, CheckCircle, ShieldAlert } from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Loader from '../components/Loader';
import CircularProgress from '../components/CircularProgress';
import MemoryAnalysis from '../components/MemoryAnalysis';
import { ResponsiveContainer, RadialBarChart, RadialBar, Tooltip, Legend } from 'recharts';
import ScoreBreakdownCard from '../components/ScoreBreakdownCard';

const TRANSLATIONS = {
  en: {
    back: "Back to Dashboard",
    title: "Evaluation Scorecard",
    subtitle: "Diagnostic report for your {domain} mock run",
    downloadBtn: "Download PDF Report",
    duration: "Duration: {dur}",
    overall: "Overall Score",
    technical: "Technical Score",
    communication: "Communication Score",
    strengths: "Key Strengths",
    weaknesses: "Improvement Areas",
    summary: "Executive Summary",
    roadmap: "Personalized Improvement Roadmap",
    oneWeek: "1 Week Plan",
    oneMonth: "1 Month Plan",
    threeMonth: "3 Month Plan",
    vision: "Vision Analysis",
    eyeContact: "Eye Contact Score",
    attention: "Attention Score",
    visibility: "Face Visibility",
    lookingAway: "Looking Away",
    suggestions: "Improvement Suggestions",
    transcript: "Review Session Transcript",
    practiceAgain: "Practice Again",
    dashboard: "Back to Dashboard",
    answered: "Answered",
    unanswered: "Unanswered",
    yourResponse: "Your response:",
    idealAnswer: "Feedback & Ideal Answer:",
    loadingText: "Generating diagnostic scorecard..."
  },
  th: {
    back: "กลับไปยังแดชบอร์ด",
    title: "รายงานคะแนนการสัมภาษณ์",
    subtitle: "รายงานผลการสัมภาษณ์จำลองสำหรับตำแหน่ง {domain}",
    downloadBtn: "ดาวน์โหลดรายงาน PDF",
    duration: "ระยะเวลา: {dur}",
    overall: "คะแนนภาพรวม",
    technical: "คะแนนทักษะทางเทคนิค",
    communication: "คะแนนการสื่อสาร",
    strengths: "จุดเด่นหลักของคุณ",
    weaknesses: "หัวข้อที่ควรพัฒนาเพิ่มเติม",
    summary: "บทสรุปสำหรับผู้บริหาร",
    roadmap: "แผนเส้นทางเพื่อพัฒนาทักษะ (Roadmap)",
    oneWeek: "แผนระยะ 1 สัปดาห์",
    oneMonth: "แผนระยะ 1 เดือน",
    threeMonth: "แผนระยะ 3 เดือน",
    vision: "การวิเคราะห์สมาธิและปฏิสัมพันธ์ทางสายตา",
    eyeContact: "คะแนนการสบสายตา (Eye Contact)",
    attention: "คะแนนความสนใจและสมาธิ",
    visibility: "ความชัดเจนของใบหน้าในกล้อง",
    lookingAway: "จำนวนครั้งที่หันสายตาไปที่อื่น",
    suggestions: "ข้อเสนอแนะในการปรับปรุงพฤติกรรม",
    transcript: "ทบทวนบทบันทึกการสัมภาษณ์",
    practiceAgain: "เริ่มฝึกฝนใหม่อีกครั้ง",
    dashboard: "กลับไปยังแดชบอร์ด",
    answered: "ตอบคำถามแล้ว",
    unanswered: "ยังไม่ได้ตอบคำถาม",
    yourResponse: "คำตอบของคุณ:",
    idealAnswer: "คำแนะนำและคำตอบตัวอย่างที่เหมาะสม:",
    loadingText: "กำลังสร้างการรายงานวิเคราะห์ผลคะแนน..."
  }
};

const PROFICIENCY_TIERS = [
  { min: 95, label: 'Extraordinary', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  { min: 85, label: 'Expert', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
  { min: 75, label: 'Advanced Professional', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  { min: 65, label: 'Professional', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  { min: 50, label: 'Entry-Level', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  { min: 0, label: 'Incomplete Response', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' }
];

export default function InterviewReportPage() {
  const { id } = useParams();
  const [interview, setInterview] = useState(null);
  const [report, setReport] = useState(null);
  const [contexts, setContexts] = useState([]);
  const [visionReport, setVisionReport] = useState(null);
  const [consistencyReport, setConsistencyReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedQuestion, setExpandedQuestion] = useState(null);
  const [lang, setLang] = useState('en');
  const [userStreak, setUserStreak] = useState(null);
  const [breakdowns, setBreakdowns] = useState({});
  const [benchmark, setBenchmark] = useState(null);

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        const historyRes = await api.get('/interviews/history');
        const active = historyRes.data.find((i) => i.id === id);
        if (active) {
          setInterview(active);
          setLang(active.language || 'en');
          
          const repRes = await api.get(`/report/${id}`);
          setReport(repRes.data);
          
          const ctxRes = await api.get(`/interviews/${id}/contexts`);
          setContexts(ctxRes.data || []);

          try {
            const streakRes = await api.get('/users/streak');
            setUserStreak(streakRes.data?.currentStreak || 0);
          } catch (err) {
            console.error("Failed to load streak", err);
          }

          try {
            const benchRes = await api.get(`/interviews/${id}/benchmark`);
            setBenchmark(benchRes.data);
          } catch (benchErr) {
            console.log("No benchmark available or error: ", benchErr);
          }

          try {
            const visionRes = await api.get(`/vision/report/${id}`);
            setVisionReport(visionRes.data);
          } catch {
            console.log("No vision report available.");
          }

          try {
            const consistencyRes = await api.get(`/consistency/report/${id}`);
            setConsistencyReport(consistencyRes.data);
          } catch {
            console.log("No consistency report available.");
          }
        }
      } catch (err) {
        console.error("Error loading report", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReportData();
  }, [id]);

  const [timelineEventIndex, setTimelineEventIndex] = useState(0);

  const getTimelineEvents = () => {
    const events = [];
    let cumulativeTime = 0;
    
    contexts.forEach((ctx, idx) => {
      events.push({
        type: 'question',
        label: lang === 'th' ? `เริ่มคำถามที่ ${idx + 1}` : `Question ${idx + 1} Started`,
        time: cumulativeTime,
        detail: ctx.question,
        color: 'text-indigo-400 border-indigo-500 bg-indigo-500/10'
      });
      
      const wordCount = ctx.answer?.trim() ? ctx.answer.trim().split(/\s+/).length : 0;
      const answerDuration = Math.max(15, Math.round(wordCount * 0.6));
      
      if (ctx.interrupted) {
        events.push({
          type: 'interruption',
          label: lang === 'th' ? 'การขัดจังหวะของ AI' : 'AI Interruption challenge',
          time: cumulativeTime + Math.round(answerDuration * 0.7),
          detail: lang === 'th' ? 'ผู้สัมภาษณ์ขัดจังหวะเพื่อท้าทายด้วยคำถามเชิงลึก' : 'Interviewer cut off candidate to challenge details.',
          color: 'text-red-400 border-red-500 bg-red-500/10'
        });
      }
      
      if (ctx.isCurveball) {
        events.push({
          type: 'curveball',
          label: lang === 'th' ? 'คำถามทดสอบไหวพริบ (Curveball)' : 'Curveball Question',
          time: cumulativeTime,
          detail: lang === 'th' ? 'คำถามเชิงจริยธรรม/พฤติกรรมที่ไม่คาดคิด' : 'Unexpected ethical or situational challenge.',
          color: 'text-amber-400 border-amber-500 bg-amber-500/10'
        });
      }
      
      if (ctx.pauseCount && ctx.pauseCount > 0) {
        events.push({
          type: 'silence',
          label: lang === 'th' ? `ตรวจพบช่วงความเงียบ (${ctx.pauseCount} ครั้ง)` : `Awkward pauses (${ctx.pauseCount} times)`,
          time: cumulativeTime + Math.round(answerDuration * 0.4),
          detail: lang === 'th' ? 'ตรวจพบช่วงหยุดพูดคุยระหว่างตอบนานกว่า 3 วินาที' : 'Detected response pauses exceeding 3 seconds.',
          color: 'text-pink-400 border-pink-500 bg-pink-500/10'
        });
      }
      
      cumulativeTime += answerDuration + 5;
    });
    
    return events.sort((a, b) => a.time - b.time);
  };

  const toggleExpandQuestion = async (index) => {
    if (expandedQuestion === index) {
      setExpandedQuestion(null);
    } else {
      setExpandedQuestion(index);
      const ctx = contexts[index];
      if (ctx && ctx.id && !breakdowns[ctx.id]) {
        try {
          const res = await api.get(`/interviews/${id}/responses/${ctx.id}/score-breakdown`);
          setBreakdowns(prev => ({ ...prev, [ctx.id]: res.data }));
        } catch (err) {
          console.error("Failed to load score breakdown", err);
        }
      }
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const handleDownload = async () => {
    try {
      const response = await api.get(`/report/download/${id}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Interview_Report_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error("Failed to download PDF", err);
      alert(lang === 'th' ? "การดาวน์โหลด PDF ล้มเหลว รายงานอาจยังเจเนอเรตไม่เสร็จสิ้น" : "Failed to download PDF report. It may not be generated yet.");
    }
  };

  const t = TRANSLATIONS[lang];

  if (loading) {
    return (
      <div className="min-h-screen bg-darkBg flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader text={t?.loadingText || "Generating diagnostic scorecard..."} />
        </div>
      </div>
    );
  }

  if (!interview || !report) {
    return (
      <div className="min-h-screen bg-darkBg flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <span className="text-gray-400 text-sm">
            {lang === 'th' ? "ไม่พบรายงานหรือเซสชันการสัมภาษณ์ยังไม่สิ้นสุด" : "Report not found or interview not completed."}
          </span>
          <Link to="/dashboard" className="text-indigo-400 hover:underline flex items-center gap-2 text-sm">
            <ArrowLeft className="w-4 h-4" />
            <span>{t?.back || "Back to Dashboard"}</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-darkBg flex flex-col text-white">
      <Navbar />
      <div className="flex-1 flex">
        <Sidebar />
        <main className="flex-1 p-8 overflow-y-auto max-w-5xl mx-auto w-full">
          {/* Header */}
          <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
            <div>
              <Link to="/dashboard" className="text-xs text-gray-500 hover:text-white flex items-center gap-1.5 mb-2 transition duration-200">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{t.back}</span>
              </Link>
              <h1 className="font-display font-extrabold text-3xl text-white">{t.title}</h1>
              <p className="text-gray-400 text-sm">{t.subtitle.replace('{domain}', interview.domain)}</p>
              <div className="mt-4">
                <button
                  onClick={handleDownload}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition duration-200"
                >
                  {t.downloadBtn}
                </button>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-xs text-gray-400 bg-white/5 border border-white/5 p-4 rounded-2xl">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-400" />
                <span>{new Date(interview.date).toLocaleDateString()}</span>
              </div>
              <span className="w-1 h-1 rounded-full bg-gray-600 hidden sm:block"></span>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-indigo-400" />
                <span>{t.duration.replace('{dur}', formatDuration(interview.duration))}</span>
              </div>
              <span className="w-1 h-1 rounded-full bg-gray-600 hidden sm:block"></span>
              <div className="flex items-center gap-1.5">
                <User className="w-4 h-4 text-indigo-400" />
                <span>{lang === 'en' ? `Interviewer: ${interview.interviewerPersona || 'Friendly HR'}` : `ผู้สัมภาษณ์: ${interview.interviewerPersona || 'Friendly HR'}`}</span>
              </div>
            </div>
          </header>

          {/* Scores grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
            {/* Circular gauges & You Are Here scale */}
            <div className="lg:col-span-7 glass-card p-8 rounded-3xl flex flex-col justify-between gap-6 relative overflow-hidden">
              <div className="absolute top-[-50px] left-[-50px] w-48 h-48 bg-indigo-500/5 blur-3xl pointer-events-none rounded-full"></div>
              
              <div className="flex flex-col sm:flex-row justify-around items-center gap-6">
                <CircularProgress value={report.overallScore} size={120} strokeWidth={9} title={t.overall} />
                <div className="w-px h-16 bg-white/10 hidden sm:block"></div>
                <CircularProgress value={report.technicalScore} size={100} strokeWidth={7} title={t.technical} />
                <div className="w-px h-16 bg-white/10 hidden sm:block"></div>
                <CircularProgress value={report.communicationScore} size={100} strokeWidth={7} title={t.communication} />
              </div>

              {/* Proficiency Level Badge */}
              {(() => {
                const overallScore = report.overallScore || 0;
                const currentTier = PROFICIENCY_TIERS.find(t => overallScore >= t.min) || PROFICIENCY_TIERS[PROFICIENCY_TIERS.length - 1];
                return (
                  <div className="flex flex-col items-center gap-3 pt-4 border-t border-white/5">
                    <div className={`px-4 py-2 border rounded-full text-xs font-bold tracking-wide ${currentTier.color}`}>
                      Proficiency: {currentTier.label}
                    </div>

                    {/* You Are Here Scale */}
                    <div className="w-full pt-2">
                      <div className="relative">
                        <div className="h-2 w-full bg-white/5 rounded-full relative">
                          <div
                            className="absolute top-0 bottom-0 left-0 bg-indigo-500 rounded-full"
                            style={{ width: `${overallScore}%` }}
                          />
                          <div
                            className="absolute -top-2.5 w-7 h-7 bg-indigo-600 border-2 border-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-lg shadow-indigo-500/30 transform -translate-x-1/2 cursor-pointer"
                            style={{ left: `${overallScore}%` }}
                          >
                            {overallScore}
                          </div>
                        </div>
                        <div className="flex justify-between text-[8px] text-gray-500 font-bold uppercase tracking-wider mt-4">
                          <span>Incomplete</span>
                          <span>Entry</span>
                          <span>Professional</span>
                          <span>Expert</span>
                          <span>Extraordinary</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Recharts radial bar scorecard */}
            <div className="lg:col-span-5 glass-card p-6 rounded-3xl flex flex-col justify-center space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 text-center">Accuracy Metrics Radar</h3>
              
              {(() => {
                const overallScore = report.overallScore || 0;
                const radialData = [
                  { name: 'Comm.', value: report.communicationScore || 0, fill: '#10b981' },
                  { name: 'Tech.', value: report.technicalScore || 0, fill: '#8b5cf6' },
                  { name: 'Overall', value: overallScore, fill: '#6366f1' }
                ];
                return (
                  <div className="w-full h-56 flex items-center justify-center relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadialBarChart
                        innerRadius="30%"
                        outerRadius="100%"
                        data={radialData}
                        startAngle={180}
                        endAngle={-180}
                      >
                        <RadialBar minAngle={15} background dataKey="value" cornerRadius={6} />
                        <Tooltip contentStyle={{ backgroundColor: '#15171e', borderColor: 'rgba(255,255,255,0.08)', borderRadius: '12px' }} />
                        <Legend iconSize={10} layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: 10, color: '#9ca3af' }} />
                      </RadialBarChart>
                    </ResponsiveContainer>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Benchmarking Widget */}
          {benchmark && (
            <div className="glass-card p-6 rounded-3xl mb-8 border border-white/5 relative overflow-hidden bg-white/[0.02] animate-reveal">
              <h3 className="font-display font-bold text-lg text-white mb-2 flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-400" />
                <span>{lang === 'th' ? 'การเปรียบเทียบกับผู้สมัครรายอื่น (Peer Comparison)' : 'How You Compare'}</span>
              </h3>
              <p className="text-gray-400 text-xs mb-6">
                {lang === 'th' 
                  ? `คุณทำคะแนนได้สูงกว่า ${benchmark.percentile}% ของผู้สมัครทั้งหมดในตำแหน่ง ${interview?.domain} บนแพลตฟอร์มนี้`
                  : `You scored higher than ${benchmark.percentile}% of ${interview?.domain} candidates on this platform.`}
              </p>
              
              <div className="relative pt-6 pb-2">
                {/* Scale Bar */}
                <div className="h-2 w-full bg-white/5 rounded-full relative">
                  {/* Role Average Marker */}
                  <div 
                    className="absolute -top-3 bottom-0 w-0.5 bg-rose-500 h-9 z-10"
                    style={{ left: `${benchmark.roleAverage}%` }}
                  >
                    <span className="absolute -top-4 left-1/2 transform -translate-x-1/2 text-[9px] text-rose-400 font-mono font-bold whitespace-nowrap">
                      {lang === 'th' ? 'ค่าเฉลี่ย' : 'Avg'}: {benchmark.roleAverage}%
                    </span>
                  </div>
                  
                  {/* User Score Dot */}
                  <div 
                    className="absolute -top-2 w-6 h-6 bg-indigo-500 border-2 border-white rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-lg shadow-indigo-500/50 z-20 transform -translate-x-1/2 cursor-pointer"
                    style={{ left: `${report.overallScore}%` }}
                    title={`Your score: ${report.overallScore}%`}
                  >
                    {report.overallScore}
                  </div>
                </div>

                <div className="flex justify-between text-[8px] text-gray-500 font-mono font-bold mt-4 uppercase tracking-wider">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          )}

          {/* Gamification Streak & Badges Panel */}
          <section className="glass-card p-6 rounded-3xl mb-8 border border-white/5 relative overflow-hidden bg-white/[0.02]">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                   <h3 className="font-display font-bold text-lg text-white mb-2 flex items-center gap-2">
                       <Award className="w-5 h-5 text-indigo-400" />
                       <span>{lang === 'th' ? 'เหรียญตราและความสำเร็จ (Gamification Achievements)' : 'Achievements & Badges'}</span>
                   </h3>
                   <p className="text-gray-400 text-xs">{lang === 'th' ? 'เหรียญตราที่ได้รับการปลดล็อกจากการฝึกซ้อมและการพัฒนาทักษะของคุณ' : 'Badges and milestones unlocked based on your performance and practice streak.'}</p>
                </div>
                
                {/* Streak display */}
                <div className="flex items-center gap-3 bg-indigo-500/10 border border-indigo-500/20 px-4 py-2.5 rounded-2xl shrink-0 self-stretch md:self-auto justify-center">
                   <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center animate-pulse">
                      <Flame className="w-5 h-5 text-indigo-400" />
                   </div>
                   <div className="flex flex-col">
                      <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold font-mono">{lang === 'th' ? 'สถิติการฝึกซ้อมต่อวัน' : 'Active Streak'}</span>
                      <span className="text-sm font-extrabold text-indigo-300 font-mono">{userStreak !== null ? `${userStreak} Days` : '1 Day'}</span>
                   </div>
                </div>
             </div>

             {/* Unlocked Badges list */}
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 border-t border-white/5 pt-6">
                 {/* Badge: Ace Candidate */}
                 <div className={`p-4 rounded-2xl border flex items-center gap-3 transition-all duration-300 ${
                     report.unlockedBadges?.includes('Ace Candidate') 
                       ? 'bg-gradient-to-r from-amber-500/10 to-yellow-500/5 border-amber-500/30 hover:border-amber-500/50 shadow-lg shadow-amber-500/5' 
                       : 'bg-white/[0.01] border-white/5 opacity-40'
                 }`}>
                     <div className={`w-10 h-10 rounded-full flex items-center justify-center ${report.unlockedBadges?.includes('Ace Candidate') ? 'bg-amber-500/20' : 'bg-white/5'}`}>
                         <ShieldCheck className={`w-5 h-5 ${report.unlockedBadges?.includes('Ace Candidate') ? 'text-amber-400' : 'text-gray-500'}`} />
                     </div>
                     <div className="flex flex-col">
                         <span className="text-xs font-bold text-white">Ace Candidate</span>
                         <span className="text-[10px] text-gray-500 mt-0.5">{lang === 'th' ? 'ผ่านระดับ Senior ที่คะแนน 80+' : 'Pass Senior at 80+ score'}</span>
                     </div>
                 </div>

                 {/* Badge: Smooth Talker */}
                 <div className={`p-4 rounded-2xl border flex items-center gap-3 transition-all duration-300 ${
                     report.unlockedBadges?.includes('Smooth Talker') 
                       ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/5 border-emerald-500/30 hover:border-emerald-500/50 shadow-lg shadow-emerald-500/5' 
                       : 'bg-white/[0.01] border-white/5 opacity-40'
                 }`}>
                     <div className={`w-10 h-10 rounded-full flex items-center justify-center ${report.unlockedBadges?.includes('Smooth Talker') ? 'bg-emerald-500/20' : 'bg-white/5'}`}>
                         <Volume2 className={`w-5 h-5 ${report.unlockedBadges?.includes('Smooth Talker') ? 'text-emerald-400' : 'text-gray-500'}`} />
                     </div>
                     <div className="flex flex-col">
                         <span className="text-xs font-bold text-white">Smooth Talker</span>
                         <span className="text-[10px] text-gray-500 mt-0.5">{lang === 'th' ? 'ไม่มีหยุดเว้นวรรค (0 pauses)' : 'Fluent delivery with 0 pauses'}</span>
                     </div>
                 </div>

                 {/* Badge: Dedicated Candidate */}
                 <div className={`p-4 rounded-2xl border flex items-center gap-3 transition-all duration-300 ${
                     report.unlockedBadges?.includes('Dedicated Candidate') 
                       ? 'bg-gradient-to-r from-indigo-500/10 to-purple-500/5 border-indigo-500/30 hover:border-indigo-500/50 shadow-lg shadow-indigo-500/5' 
                       : 'bg-white/[0.01] border-white/5 opacity-40'
                 }`}>
                     <div className={`w-10 h-10 rounded-full flex items-center justify-center ${report.unlockedBadges?.includes('Dedicated Candidate') ? 'bg-indigo-500/20' : 'bg-white/5'}`}>
                         <Flame className={`w-5 h-5 ${report.unlockedBadges?.includes('Dedicated Candidate') ? 'text-indigo-400' : 'text-gray-500'}`} />
                     </div>
                     <div className="flex flex-col">
                         <span className="text-xs font-bold text-white">Dedicated Candidate</span>
                         <span className="text-[10px] text-gray-500 mt-0.5">{lang === 'th' ? 'เข้าซ้อมต่อกันเป็นเวลา 3 วัน' : 'Reach a 3-day active streak'}</span>
                     </div>
                 </div>
             </div>
          </section>

          {/* Feedback Grids (Strengths, Weaknesses, Suggestions) */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Strengths */}
            <div className="glass-card p-6 rounded-2xl border-t-2 border-t-emerald-500/50">
              <div className="flex items-center gap-2 text-emerald-400 mb-4">
                <CheckCircle2 className="w-5 h-5" />
                <h3 className="font-display font-bold text-base">{t.strengths}</h3>
              </div>
              <ul className="flex flex-col gap-3 text-sm text-gray-400 leading-relaxed list-disc list-inside">
                {report.strengths && report.strengths.map((str, idx) => (
                  <li key={idx} className="marker:text-emerald-500">{str}</li>
                ))}
              </ul>
            </div>

            {/* Weaknesses */}
            <div className="glass-card p-6 rounded-2xl border-t-2 border-t-pink-500/50">
              <div className="flex items-center gap-2 text-pink-400 mb-4">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-display font-bold text-base">{t.weaknesses}</h3>
              </div>
              <ul className="flex flex-col gap-3 text-sm text-gray-400 leading-relaxed list-disc list-inside">
                {report.weaknesses && report.weaknesses.map((weak, idx) => (
                  <li key={idx} className="marker:text-pink-500">{weak}</li>
                ))}
              </ul>
            </div>
          </section>
          
          {/* Summary & Roadmap */}
          <section className="glass-card p-6 rounded-3xl mb-8">
             <div className="mb-6">
                 <h3 className="font-display font-bold text-lg text-white mb-2 flex items-center gap-2">
                     {t.summary}
                 </h3>
                 <p className="text-gray-300 text-sm leading-relaxed">{report.summary}</p>
             </div>
             <div>
                 <h3 className="font-display font-bold text-lg text-white mb-4 flex items-center gap-2">
                     <Lightbulb className="w-5 h-5 text-indigo-400" />
                     {t.roadmap}
                 </h3>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div className="bg-white/5 p-4 rounded-xl">
                          <h4 className="text-indigo-400 font-bold text-sm mb-2">{t.oneWeek}</h4>
                          <p className="text-gray-400 text-xs leading-relaxed">{report.roadmap?.oneWeekPlan || 'N/A'}</p>
                     </div>
                     <div className="bg-white/5 p-4 rounded-xl">
                          <h4 className="text-purple-400 font-bold text-sm mb-2">{t.oneMonth}</h4>
                          <p className="text-gray-400 text-xs leading-relaxed">{report.roadmap?.oneMonthPlan || 'N/A'}</p>
                     </div>
                     <div className="bg-white/5 p-4 rounded-xl">
                          <h4 className="text-pink-400 font-bold text-sm mb-2">{t.threeMonth}</h4>
                          <p className="text-gray-400 text-xs leading-relaxed">{report.roadmap?.threeMonthPlan || 'N/A'}</p>
                     </div>
                 </div>
             </div>
           </section>

           {/* Weak-spots 2-3 Day Study Plan */}
           {report.studyPlan && (
             <section className="glass-card p-6 rounded-3xl mb-8 border border-amber-500/20 bg-amber-500/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl"></div>
                <h3 className="font-display font-bold text-lg text-amber-300 mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    {lang === 'th' ? 'แผนการฝึกซ้อมเจาะลึก 3 วัน (Spaced Practice Study Guide)' : 'Custom 2-3 Day Study Plan'}
                </h3>
                <div className="text-gray-300 text-sm leading-relaxed prose prose-invert max-w-none prose-xs font-sans whitespace-pre-wrap">
                    {report.studyPlan}
                </div>
             </section>
           )}

           {/* Memory Engine / Consistency Analysis */}
          {consistencyReport && (
              <MemoryAnalysis report={consistencyReport} />
          )}

          {/* Vision Analytics */}
          {visionReport && (
            <section className="glass-card p-6 rounded-3xl mb-8">
               <h3 className="font-display font-bold text-lg text-white mb-6 flex items-center gap-2">
                   <Eye className="w-5 h-5 text-indigo-400" />
                   {t.vision}
               </h3>
               <div className="grid grid-cols-2 sm:grid-cols-5 gap-6 mb-6">
                    <div className="bg-white/5 border border-white/5 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                        <span className="text-sm text-gray-400 mb-1">{t.eyeContact}</span>
                        <span className="text-3xl font-bold text-white">{visionReport.eyeContactScore}%</span>
                    </div>
                    <div className="bg-white/5 border border-white/5 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                        <span className="text-sm text-gray-400 mb-1">{t.attention}</span>
                        <span className="text-3xl font-bold text-white">{visionReport.attentionScore}%</span>
                    </div>
                    <div className="bg-white/5 border border-white/5 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                        <span className="text-sm text-gray-400 mb-1">{t.visibility}</span>
                        <span className="text-3xl font-bold text-white">{visionReport.faceVisibilityScore}%</span>
                    </div>
                    <div className="bg-white/5 border border-white/5 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                        <span className="text-sm text-gray-400 mb-1">{t.lookingAway}</span>
                        <span className="text-3xl font-bold text-white">{visionReport.lookingAwayCount}</span>
                    </div>
                    <div className="bg-white/5 border border-white/5 p-4 rounded-2xl flex flex-col items-center justify-center text-center col-span-2 sm:col-span-1">
                        <span className="text-sm text-gray-400 mb-1">{lang === 'th' ? 'ระดับเอียงศีรษะ' : 'Avg Head Tilt'}</span>
                        <span className="text-3xl font-bold text-white">{visionReport.averageHeadTilt || 0}°</span>
                    </div>
                </div>
               
               <div className="bg-indigo-500/10 border border-indigo-500/20 p-5 rounded-2xl flex gap-4">
                   <Lightbulb className="w-6 h-6 text-indigo-400 shrink-0" />
                   <div>
                       <h4 className="font-semibold text-white mb-2">{t.suggestions}</h4>
                       <ul className="list-disc list-inside text-sm text-gray-300 flex flex-col gap-1">
                           {visionReport.eyeContactScore < 70 && <li>{lang === 'th' ? "สบตาให้บ่อยขึ้นเพื่อแสดงออกถึงความมั่นใจ" : "Maintain eye contact longer to project confidence."}</li>}
                           {visionReport.lookingAwayCount > 5 && <li>{lang === 'th' ? "หลีกเลี่ยงการหันสายตาไปที่อื่นบ่อยครั้งเพื่อลดความฟุ้งซ่าน" : "Avoid looking away frequently as it can seem distracting."}</li>}
                           {visionReport.attentionScore >= 80 && <li>{lang === 'th' ? "คุณทำได้ดีมากในการรักษาสมาธิระหว่างการตอบสัมภาษณ์!" : "Great job maintaining focus and attention throughout the session!"}</li>}
                           {visionReport.faceVisibilityScore < 90 && <li>{lang === 'th' ? "ควรปรับมุมกล้องและแสงไฟให้มองเห็นใบหน้าได้อย่างชัดเจนตลอดเวลา" : "Ensure your face is clearly visible to the camera at all times."}</li>}
                       </ul>
                   </div>
               </div>
            </section>
          )}

          {/* Delivery Patterns Card */}
          {contexts.length > 0 && (() => {
            const totalSilence = contexts.reduce((sum, c) => sum + (c.silenceSeconds || 0), 0);
            const totalGazeAway = contexts.reduce((sum, c) => sum + (c.gazeAwayEvents || 0), 0);
            return (
              <section className="glass-card p-6 rounded-3xl mb-8 border border-white/5 bg-white/[0.02]">
                <h3 className="font-display font-bold text-lg text-white mb-6 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-indigo-400" />
                  <span>{lang === 'th' ? 'พฤติกรรมการตอบสัมภาษณ์ (Delivery Patterns)' : 'Delivery Patterns'}</span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white/5 border border-white/5 p-5 rounded-2xl flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                      <Clock className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-xs text-gray-400 font-semibold block uppercase tracking-wider mb-0.5">
                        {lang === 'th' ? 'ระยะเวลาหยุดเงียบสะสม' : 'Total Silence Duration'}
                      </span>
                      <span className="text-xl font-extrabold text-white font-mono">
                        {totalSilence.toFixed(1)}s
                      </span>
                      <span className="text-xs text-gray-500 block mt-1">
                        {lang === 'th' ? 'เวลาหยุดพูดเฉลี่ยระหว่างการสัมภาษณ์' : 'Total silent pause time across all questions.'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/5 p-5 rounded-2xl flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 shrink-0">
                      <Eye className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-xs text-gray-400 font-semibold block uppercase tracking-wider mb-0.5">
                        {lang === 'th' ? 'การหลบสายตาสะสม' : 'Gaze Aversion Lapses'}
                      </span>
                      <span className="text-xl font-extrabold text-white font-mono">
                        {totalGazeAway} {lang === 'th' ? 'ครั้ง' : 'lapses'}
                      </span>
                      <span className="text-xs text-gray-500 block mt-1">
                        {lang === 'th' ? 'จำนวนครั้งที่สายตาละไปจากกล้อง' : 'Lapses in steady camera focus/eye contact.'}
                      </span>
                    </div>
                  </div>
                </div>
              </section>
            );
          })()}

          {/* Speech & Articulation Pacing Analysis */}
          {contexts.length > 0 && (
            <section className="glass-card p-6 rounded-3xl mb-8">
               <h3 className="font-display font-bold text-lg text-white mb-6 flex items-center gap-2">
                   <Volume2 className="w-5 h-5 text-indigo-400" />
                   {lang === 'th' ? 'การวิเคราะห์การพูดและการวางจังหวะเสียง (Speech & Pacing Feedback)' : 'Speech & Articulation Pacing Feedback'}
               </h3>
               <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-6">
                    {(() => {
                      const countFillerWords = (text) => {
                        if (!text) return 0;
                        const fillers = ['um', 'ah', 'like', 'actually', 'basically', 'so', 'uh', 'you know'];
                        const words = text.toLowerCase().split(/\s+/);
                        return words.filter(w => fillers.includes(w)).length;
                      };
                      const validContexts = contexts.filter(c => c.answer);
                      const avgWpm = validContexts.length > 0 ? Math.round(validContexts.reduce((sum, c) => sum + (c.wpm || 120), 0) / validContexts.length) : 120;
                      const totalPauses = contexts.reduce((sum, c) => sum + (c.pauseCount || 0), 0);
                      const avgDelivery = validContexts.length > 0 ? Math.round(validContexts.reduce((sum, c) => sum + (c.deliveryScore || 80), 0) / validContexts.length) : 80;
                      const totalFillers = validContexts.reduce((sum, c) => sum + countFillerWords(c.answer), 0);

                      let paceLabel = "Balanced";
                      let paceColor = "text-emerald-400";
                      if (avgWpm > 160) {
                        paceLabel = "Too Fast";
                        paceColor = "text-rose-400";
                      } else if (avgWpm < 100) {
                        paceLabel = "Too Slow";
                        paceColor = "text-amber-400";
                      }

                      return (
                        <>
                          <div className="bg-white/5 border border-white/5 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                              <span className="text-xs text-gray-400 mb-1">{lang === 'th' ? 'อัตราความเร็วการพูด' : 'Average Speaking Pace'}</span>
                              <span className="text-2xl font-bold text-white">{avgWpm} WPM</span>
                              <span className={`text-[10px] font-bold uppercase mt-1 ${paceColor}`}>{paceLabel}</span>
                          </div>
                          <div className="bg-white/5 border border-white/5 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                              <span className="text-xs text-gray-400 mb-1">{lang === 'th' ? 'คำฟุ่มเฟือยสะสม' : 'Filler Words Count'}</span>
                              <span className="text-2xl font-bold text-white">{totalFillers}</span>
                              <span className="text-[10px] text-gray-500 font-bold uppercase mt-1">um, ah, like</span>
                          </div>
                          <div className="bg-white/5 border border-white/5 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                              <span className="text-xs text-gray-400 mb-1">{lang === 'th' ? 'ความแจ่มชัดในการออกเสียง' : 'Articulation Score'}</span>
                              <span className="text-2xl font-bold text-white">{avgDelivery}%</span>
                              <span className="text-[10px] text-emerald-400 font-bold uppercase mt-1">Excellent</span>
                          </div>
                          <div className="bg-white/5 border border-white/5 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                              <span className="text-xs text-gray-400 mb-1">{lang === 'th' ? 'หยุดเว้นวรรคสนทนา' : 'Vocal Pauses'}</span>
                              <span className="text-2xl font-bold text-white">{totalPauses}</span>
                              <span className="text-[10px] text-gray-500 font-bold uppercase mt-1">Pause incidents</span>
                          </div>
                        </>
                      );
                    })()}
               </div>
            </section>
          )}

          {/* Interactive Event Timeline */}
          {(() => {
            const timelineEvents = getTimelineEvents();
            if (timelineEvents.length === 0) return null;
            return (
              <section className="glass-card p-6 rounded-3xl mb-8">
                 <h3 className="font-display font-bold text-lg text-white mb-6 flex items-center gap-2">
                     <Activity className="w-5 h-5 text-indigo-400" />
                     <span>{lang === 'th' ? 'ไทม์ไลน์บันทึกเหตุการณ์สัมภาษณ์ (Interactive Speech Timeline)' : 'Interactive Session Timeline'}</span>
                 </h3>
                 
                 {/* Scrubbing track slider */}
                 <div className="relative pt-6 pb-4 px-2">
                     <input
                         type="range"
                         min="0"
                         max={timelineEvents.length - 1}
                         value={timelineEventIndex}
                         onChange={(e) => setTimelineEventIndex(parseInt(e.target.value))}
                         className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                     />
                     
                     {/* Event ticks overlay */}
                     <div className="flex justify-between text-[10px] text-gray-500 font-mono mt-3">
                         <span>0:00 (Start)</span>
                         <span>{formatDuration(interview.duration || 300)} (End)</span>
                     </div>
                 </div>

                 {/* Active event detail card */}
                 {timelineEvents[timelineEventIndex] && (
                     <div className="bg-white/5 border border-white/10 p-5 rounded-2xl animate-reveal mt-4 flex items-start gap-4">
                         <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 shrink-0">
                             {timelineEvents[timelineEventIndex].type === 'question' ? (
                                 <Play className="w-5 h-5 text-indigo-400" />
                             ) : timelineEvents[timelineEventIndex].type === 'interruption' ? (
                                 <StopCircle className="w-5 h-5 text-red-400" />
                             ) : timelineEvents[timelineEventIndex].type === 'curveball' ? (
                                 <Award className="w-5 h-5 text-amber-400" />
                             ) : (
                                 <AlertTriangle className="w-5 h-5 text-pink-400" />
                             )}
                         </div>
                         
                         <div className="flex-1">
                             <div className="flex items-center justify-between gap-4 mb-1">
                                 <h4 className="font-bold text-white text-sm">{timelineEvents[timelineEventIndex].label}</h4>
                                 <span className="text-[10px] font-mono text-gray-400 bg-white/10 px-2 py-0.5 rounded">
                                     Time offset: ~{timelineEvents[timelineEventIndex].time}s
                                 </span>
                             </div>
                             <p className="text-gray-300 text-xs leading-relaxed font-sans">{timelineEvents[timelineEventIndex].detail}</p>
                         </div>
                     </div>
                 )}
              </section>
            );
          })()}

          {/* Transcript/Q&A review */}
          <section className="glass-card p-6 rounded-3xl">
            <h3 className="font-display font-bold text-lg text-white mb-6">{t.transcript}</h3>
            <div className="flex flex-col gap-4">
              {contexts.map((ctx, idx) => {
                const isExpanded = expandedQuestion === idx;
                const hasAnswer = ctx.answer && ctx.answer.trim().length > 0;
                return (
                  <div key={ctx.id || idx} className="border border-white/5 rounded-2xl overflow-hidden bg-white/5">
                    {/* Collapsible header */}
                    <button
                      onClick={() => toggleExpandQuestion(idx)}
                      className="w-full text-left px-6 py-4 flex items-center justify-between hover:bg-white/5 transition duration-150"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-white/10 text-white font-mono text-xs flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="text-sm font-semibold text-white truncate max-w-lg md:max-w-xl">
                          {ctx.question}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{hasAnswer ? t.answered : t.unanswered}</span>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </button>

                    {/* Collapsible Body */}
                    {isExpanded && (
                      <div className="px-6 pb-6 pt-2 border-t border-white/5 flex flex-col gap-4 text-sm">
                        <div>
                          <span className="text-xs text-indigo-400 font-semibold uppercase block mb-1">{t.yourResponse}</span>
                          <p className="text-gray-300 italic bg-white/5 p-4 rounded-xl leading-relaxed">
                            {hasAnswer ? ctx.answer : "No response logged."}
                          </p>
                        </div>
                        
                        <div>
                          <span className="text-xs text-purple-400 font-semibold uppercase block mb-1">{t.idealAnswer}</span>
                          <p className="text-gray-400 leading-relaxed whitespace-pre-wrap">
                            {ctx.feedback ? ctx.feedback : "No feedback available."}
                          </p>
                        </div>
                        
                        {hasAnswer && breakdowns[ctx.id] && (
                          <div className="mt-2">
                            <ScoreBreakdownCard breakdownData={breakdowns[ctx.id]} lang={lang} />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Action triggers */}
          <div className="flex justify-center gap-4 mt-8">
            <Link
              to="/select"
              className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-6 py-3 rounded-xl flex items-center gap-2 transition duration-200 text-sm font-semibold"
            >
              <RefreshCw className="w-4 h-4" />
              <span>{t.practiceAgain}</span>
            </Link>
            <Link
              to="/dashboard"
              className="bg-gradient-indigo hover:opacity-90 text-white px-6 py-3 rounded-xl transition duration-200 text-sm font-semibold shadow-md shadow-indigo-500/10"
            >
              {t.dashboard}
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
