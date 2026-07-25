import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Loader from '../components/Loader';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, RadialBarChart, RadialBar, Legend } from 'recharts';
import { Trophy, Award, CheckCircle, ShieldAlert, Sparkles, Download, ArrowRight, Video, FileText, CheckCircle2, AlertCircle, Target } from 'lucide-react';

const PROFICIENCY_TIERS = [
  { min: 95, label: 'Extraordinary', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  { min: 85, label: 'Expert', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
  { min: 75, label: 'Advanced Professional', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  { min: 65, label: 'Professional', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  { min: 50, label: 'Entry-Level', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  { min: 0, label: 'Incomplete Response', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' }
];

export default function FinalReport() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await api.get(`/sessions/${sessionId}/report`);
        setReportData(res.data);
      } catch (err) {
        console.error("Failed to load consolidated report", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [sessionId]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const response = await api.get(`/sessions/${sessionId}/report/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Consolidated_Report_${sessionId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error("Failed to download PDF", err);
      alert("Failed to download consolidated PDF report. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-darkBg flex flex-col text-white">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader text="Compiling multi-round reports and charts..." />
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="min-h-screen bg-darkBg flex flex-col text-white">
        <Navbar />
        <div className="flex-1 flex items-center justify-center text-gray-500">
          Consolidated report could not be generated. Please try again.
        </div>
      </div>
    );
  }

  const { session, results = [], overallScore = 0, strengths = [], improvements = [] } = reportData;

  const currentTier = PROFICIENCY_TIERS.find(t => overallScore >= t.min) || PROFICIENCY_TIERS[PROFICIENCY_TIERS.length - 1];

  // Prepare round by round breakdown data
  const chartData = results.map(r => ({
    roundName: r.roundType === 'APTITUDE' ? 'Warm Up' : r.roundType === 'COMMUNICATION' ? 'Behavioral' : r.roundType === 'CODING' ? 'Coding' : 'Role Related',
    Score: r.score
  }));

  // Map scores dynamically for multi ring radial charts
  const codingScore = results.find(r => r.roundType === 'CODING')?.score || overallScore;
  const advancedScore = results.find(r => r.roundType === 'ADVANCED')?.score || overallScore;
  const commScore = results.find(r => r.roundType === 'COMMUNICATION')?.score || overallScore;

  const domainKnowledge = Math.round((codingScore + advancedScore) / 2);
  const articulation = commScore;
  const communication = commScore;

  const radialData = [
    { name: 'Artic.', value: articulation, fill: '#3b82f6' },
    { name: 'Comm.', value: communication, fill: '#10b981' },
    { name: 'Domain', value: domainKnowledge, fill: '#8b5cf6' },
    { name: 'Overall', value: overallScore, fill: '#6366f1' }
  ];

  // Compile detailed questions feedback checklist
  const questionFeedbacks = [];
  results.forEach(r => {
    if (r.roundType === 'APTITUDE' && Array.isArray(r.rawResponses)) {
      r.rawResponses.forEach((sub, idx) => {
        questionFeedbacks.push({
          round: 'Warm Up',
          question: sub.questionText || `Aptitude Question ${idx + 1}`,
          response: `Option Selected Index: ${sub.selectedOptionIndex !== -1 ? sub.selectedOptionIndex : 'None'}`,
          strengths: sub.strengths || [],
          improvements: sub.improvements || []
        });
      });
    } else if (r.roundType === 'COMMUNICATION' && Array.isArray(r.rawResponses)) {
      r.rawResponses.forEach((sub) => {
        questionFeedbacks.push({
          round: 'Behavioral',
          question: sub.questionText,
          response: sub.answerText,
          strengths: sub.strengths || [],
          improvements: sub.improvements || []
        });
      });
    } else if (r.roundType === 'CODING' && r.rawResponses) {
      questionFeedbacks.push({
        round: 'Coding',
        question: 'Algorithms & Coding Problem Solution',
        response: r.rawResponses.code || '',
        strengths: r.rawResponses.strengths || [],
        improvements: r.rawResponses.improvements || []
      });
    } else if (r.roundType === 'ADVANCED' && r.rawResponses) {
      questionFeedbacks.push({
        round: 'Role Related',
        question: 'System Architecture Design Notes',
        response: r.rawResponses.notes || '',
        strengths: r.rawResponses.strengths || [],
        improvements: r.rawResponses.improvements || []
      });
    }
  });

  const commRound = results.find(r => r.roundType === 'COMMUNICATION');
  const metrics = commRound?.engagementMetrics || {
    eyeContactPercentage: 85,
    attentionScore: 90,
    lookingAwayCount: 1
  };

  return (
    <div className="min-h-screen bg-darkBg text-white flex flex-col relative overflow-hidden">
      <div className="glow-bg w-[600px] h-[600px] bg-indigo-500/5 top-[-100px] right-[-100px]" />
      <div className="glow-bg w-[500px] h-[500px] bg-purple-500/5 bottom-[-100px] left-[-100px]" />

      <Navbar />

      <main className="flex-1 p-8 overflow-y-auto max-w-6xl mx-auto w-full relative z-10 space-y-8">
        
        {/* Header scorecard banner */}
        <div className="bg-[#15171e] border border-[#232630] rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-white">Interview Scorecard</h1>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-semibold px-2.5 py-1 bg-white/5 border border-white/5 text-gray-400 rounded-full">
                Role: {session?.careerPath}
              </span>
              <span className="text-xs text-gray-500">Session ID: {session?.id}</span>
            </div>
          </div>

          <div className="flex gap-3 flex-wrap">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-[#232630] rounded-xl text-xs font-bold transition flex items-center gap-2 text-gray-300 hover:text-white disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{downloading ? 'Downloading...' : 'Export Report PDF'}</span>
            </button>
            <Link
              to={`/skill-gap/${sessionId}`}
              className="px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 text-white"
              style={{ background: 'linear-gradient(135deg, #059669, #0d9488)' }}
            >
              <Target className="w-4 h-4" />
              <span>Skill Gap Analysis</span>
            </Link>
            <Link
              to="/dashboard"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold transition flex items-center gap-2 text-white"
            >
              <span>Back to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Dashboard grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Panel */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Circle summary & badge */}
            <div className="bg-[#15171e] border border-[#232630] rounded-3xl p-6 flex flex-col items-center justify-center text-center gap-4">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Overall Score</span>
              <div className="relative w-40 h-40 rounded-full border-4 border-indigo-500/10 flex items-center justify-center">
                <div className="absolute inset-2 rounded-full border-4 border-indigo-500 flex flex-col items-center justify-center shadow-lg shadow-indigo-500/10">
                  <span className="text-4xl font-extrabold text-white">{overallScore}%</span>
                  <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">Average</span>
                </div>
              </div>

              {/* Proficiency Level Badge */}
              <div className={`mt-2 px-4 py-2 border rounded-full text-xs font-bold tracking-wide ${currentTier.color}`}>
                Proficiency: {currentTier.label}
              </div>
            </div>

            {/* Recharts radial bar scorecard */}
            <div className="bg-[#15171e] border border-[#232630] rounded-3xl p-6 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">Accuracy Metrics Radar</h3>
              
              <div className="w-full h-64 flex items-center justify-center relative">
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
                    <Legend iconSize={10} layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: 11, color: '#9ca3af' }} />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Webcam Engagement tracker */}
            {session?.videoEnabled !== false && (
              <div className="bg-[#15171e] border border-[#232630] rounded-3xl p-6 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-400 flex items-center gap-1.5">
                  <Video className="w-4 h-4" />
                  <span>Webcam Engagement Metrics</span>
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white/5 border border-white/5 rounded-xl flex flex-col gap-1 text-center">
                    <span className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Eye Contact</span>
                    <span className="text-xl font-bold text-white">{metrics?.eyeContactPercentage}%</span>
                  </div>
                  <div className="p-4 bg-white/5 border border-white/5 rounded-xl flex flex-col gap-1 text-center">
                    <span className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Attention</span>
                    <span className="text-xl font-bold text-white">{metrics?.attentionScore}%</span>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Right Panel */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* "You Are Here" Horizontal scale bar */}
            <div className="bg-[#15171e] border border-[#232630] rounded-3xl p-6 space-y-6">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">You Are Here</h3>
              
              <div className="relative pt-4">
                {/* Horizontal scale track */}
                <div className="h-2 w-full bg-white/5 rounded-full relative">
                  <div
                    className="absolute top-0 bottom-0 left-0 bg-indigo-500 rounded-full"
                    style={{ width: `${overallScore}%` }}
                  />
                  {/* Position pointer marker */}
                  <div
                    className="absolute -top-2.5 w-7 h-7 bg-indigo-600 border-2 border-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-lg shadow-indigo-500/30 transform -translate-x-1/2 cursor-pointer"
                    style={{ left: `${overallScore}%` }}
                  >
                    {overallScore}
                  </div>
                </div>

                {/* Score bands labels */}
                <div className="flex justify-between text-[9px] text-gray-500 font-bold uppercase tracking-wider mt-4">
                  <span>Incomplete</span>
                  <span>Entry</span>
                  <span>Professional</span>
                  <span>Expert</span>
                  <span>Extraordinary</span>
                </div>
              </div>
            </div>

            {/* Rounds bar chart */}
            <div className="bg-[#15171e] border border-[#232630] rounded-3xl p-6 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">Round By Round Scores</h3>
              <div className="w-full h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="roundName" stroke="#4b5563" fontSize={11} tickLine={false} />
                    <YAxis domain={[0, 100]} stroke="#4b5563" fontSize={11} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#15171e', borderColor: 'rgba(255,255,255,0.08)', borderRadius: '12px' }} />
                    <Bar dataKey="Score" fill="#6366f1" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Strengths & Areas of Improvements lists */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              <div className="bg-[#15171e] border border-[#232630] rounded-3xl p-6 space-y-3">
                <h3 className="font-bold text-sm text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Strengths Identified</span>
                </h3>
                <ul className="space-y-2 text-xs text-gray-300">
                  {strengths.map((str, idx) => (
                    <li key={idx} className="flex gap-2 items-start leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-[#15171e] border border-[#232630] rounded-3xl p-6 space-y-3">
                <h3 className="font-bold text-sm text-amber-400 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  <span>Areas of Improvement</span>
                </h3>
                <ul className="space-y-2 text-xs text-gray-300">
                  {improvements.map((imp, idx) => (
                    <li key={idx} className="flex gap-2 items-start leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                      <span>{imp}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>

          </div>

        </div>

        {/* Detailed Per-Question AI Critique Table */}
        {questionFeedbacks.length > 0 && (
          <div className="bg-[#15171e] border border-[#232630] rounded-3xl p-8 space-y-6">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white">Detailed Per-Question Feedback</h2>
              <p className="text-xs text-gray-400 mt-1">
                A review checklist of the questions asked, responses, and AI evaluations.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-gray-500 uppercase font-bold tracking-wider text-[10px]">
                    <th className="py-4 px-4 w-28">Round</th>
                    <th className="py-4 px-4 w-64">Question / Challenge</th>
                    <th className="py-4 px-4 w-72">Your Response</th>
                    <th className="py-4 px-4">AI Critique</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {questionFeedbacks.map((fb, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors duration-150 items-start">
                      <td className="py-4 px-4 font-bold text-indigo-400">{fb.round}</td>
                      <td className="py-4 px-4 font-medium text-gray-200 leading-relaxed pr-6">{fb.question}</td>
                      <td className="py-4 px-4 text-gray-400 pr-6">
                        <div className="max-h-24 overflow-y-auto whitespace-pre-wrap font-mono leading-relaxed bg-[#0b0c10] p-3 rounded-lg border border-white/5 text-[10px]">
                          {fb.response}
                        </div>
                      </td>
                      <td className="py-4 px-4 space-y-3">
                        {fb.strengths.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">What went well:</span>
                            <ul className="list-disc pl-4 text-gray-300 space-y-0.5">
                              {fb.strengths.map((s, i) => (
                                <li key={i}>{s}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {fb.improvements.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">What could be better:</span>
                            <ul className="list-disc pl-4 text-gray-300 space-y-0.5">
                              {fb.improvements.map((s, i) => (
                                <li key={i}>{s}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {fb.strengths.length === 0 && fb.improvements.length === 0 && (
                          <span className="text-gray-500 italic">No detailed breakdown logged.</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
