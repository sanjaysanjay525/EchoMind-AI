import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { Upload, FileText, ChevronDown, ChevronUp, Sparkles, CheckCircle2, AlertTriangle, ArrowRight, ArrowLeft } from 'lucide-react';
import { ResponsiveContainer, RadialBarChart, RadialBar, Tooltip, Legend } from 'recharts';

export default function ResumeAnalyzerPage() {
  const navigate = useNavigate();

  // Wizard state
  const [file, setFile] = useState(null);
  const [desiredRole, setDesiredRole] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [showJd, setShowJd] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [report, setReport] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!file || !desiredRole.trim()) return;

    setAnalyzing(true);
    setReport(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('desiredRole', desiredRole);
    if (jobDescription.trim()) {
      formData.append('jobDescription', jobDescription);
    }

    try {
      const res = await api.post('/resumes/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setReport(res.data);
    } catch (err) {
      console.error("Resume analysis failed", err);
      alert("Failed to analyze resume. Please check connection and try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleBuildInterview = () => {
    if (!report) return;
    // Pre-fill config options in query state and redirect
    const keywords = [...(report.matchedKeywords || []), ...(report.missingKeywords || [])].slice(0, 10);
    const searchParams = new URLSearchParams();
    searchParams.set('flow', 'classic');
    searchParams.set('role', desiredRole);
    // Navigate with preloaded state
    navigate(`/config?${searchParams.toString()}`, {
      state: { preloadedKeywords: keywords }
    });
  };

  // Recharts metric radar data mapping
  const radialData = report ? [
    { name: 'Match Score', value: report.matchScore || 0, fill: '#6366f1' }
  ] : [];

  return (
    <div className="min-h-screen bg-darkBg text-white flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-8">
            
            {/* Header */}
            <div className="flex items-center gap-4">
              <Link
                to="/dashboard"
                className="p-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl transition duration-150"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">AI Resume Analyzer</h1>
                <p className="text-gray-400 text-xs mt-1">
                  Evaluate your resume fit score against standard industry roles and job criteria.
                </p>
              </div>
            </div>

            {/* Upload Zone & Fields */}
            {!report && (
              <form onSubmit={handleAnalyze} className="space-y-6">
                
                {/* Drag and Drop Zone */}
                <div className="bg-[#15171e] border border-[#232630] rounded-2xl p-6 space-y-4">
                  <h3 className="font-semibold text-white text-base">Upload Resume</h3>
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition duration-150 min-h-[160px] ${
                      dragActive ? 'border-indigo-500 bg-indigo-500/5' : 'border-[#232630] hover:border-indigo-500/40 bg-[#0b0c10]/40'
                    }`}
                  >
                    <Upload className="w-8 h-8 text-gray-500 mb-2" />
                    {file ? (
                      <div>
                        <span className="text-xs font-semibold text-white block">{file.name}</span>
                        <span className="text-[10px] text-indigo-400 font-bold block mt-1">File selected</span>
                      </div>
                    ) : (
                      <div>
                        <span className="text-xs font-semibold text-white block">Drag and drop your resume file here</span>
                        <span className="text-[10px] text-gray-500 block mt-1">Accepts PDF or DOCX (Max size 5MB)</span>
                      </div>
                    )}
                    <input
                      type="file"
                      accept=".pdf,.docx"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="analyzer-file-input"
                    />
                    <label htmlFor="analyzer-file-input" className="mt-4 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg text-xs font-bold transition">
                      Browse Files
                    </label>
                  </div>
                </div>

                {/* Target Role input */}
                <div className="bg-[#15171e] border border-[#232630] rounded-2xl p-6 space-y-4">
                  <h3 className="font-semibold text-white text-base">Desired Role</h3>
                  <div className="max-w-md">
                    <input
                      type="text"
                      placeholder="e.g. Software Engineer, Product Manager"
                      value={desiredRole}
                      onChange={(e) => setDesiredRole(e.target.value)}
                      required
                      className="w-full bg-[#0b0c10] border border-[#232630] rounded-xl px-4 py-3 text-white placeholder-gray-600 text-xs focus:outline-none focus:border-indigo-500/50 transition duration-150 font-medium"
                    />
                  </div>
                </div>

                {/* Collapsible job description */}
                <div className="bg-[#15171e] border border-[#232630] rounded-2xl p-6 space-y-4">
                  <button
                    type="button"
                    onClick={() => setShowJd(!showJd)}
                    className="w-full flex items-center justify-between font-semibold text-white text-base focus:outline-none"
                  >
                    <div className="flex items-center gap-2">
                      <span>Target Job Description</span>
                      <span className="text-[9px] font-bold text-gray-400 bg-white/5 px-2 py-0.5 rounded-full">Optional</span>
                    </div>
                    {showJd ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {showJd && (
                    <div className="space-y-2 pt-2 animate-reveal">
                      <p className="text-gray-400 text-[10px]">
                        Improves keyword match accuracy by comparing specific requirements.
                      </p>
                      <textarea
                        rows={6}
                        placeholder="Paste target job listing requirements here..."
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        className="w-full bg-[#0b0c10] border border-[#232630] rounded-xl p-4 text-white placeholder-gray-600 text-xs focus:outline-none focus:border-indigo-500/50 transition duration-150 resize-none font-medium"
                      />
                    </div>
                  )}
                </div>

                {/* Analyze Trigger */}
                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={analyzing || !file || !desiredRole.trim()}
                    className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-xl shadow-indigo-500/20 transition duration-150 flex items-center gap-2"
                  >
                    <span>{analyzing ? 'Analyzing Profile...' : 'Run Analysis'}</span>
                    <Sparkles className="w-4 h-4" />
                  </button>
                </div>

              </form>
            )}

            {/* Results Report Card */}
            {report && (
              <div className="space-y-6">
                
                {/* Score and CTAs summary grid */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
                  
                  {/* Circular Recharts gauge score */}
                  <div className="md:col-span-5 bg-[#15171e] border border-[#232630] rounded-3xl p-6 flex flex-col items-center justify-center text-center gap-4">
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Resume Match Score</span>
                    <div className="relative w-40 h-40 rounded-full border-4 border-indigo-500/10 flex items-center justify-center">
                      <div className="absolute inset-2 rounded-full border-4 border-indigo-500 flex flex-col items-center justify-center shadow-lg shadow-indigo-500/10">
                        <span className="text-4xl font-extrabold text-white">{report.matchScore}%</span>
                        <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">Index Match</span>
                      </div>
                    </div>
                  </div>

                  {/* Recommendations Callout */}
                  <div className="md:col-span-7 bg-[#15171e] border border-[#232630] rounded-3xl p-6 flex flex-col justify-between">
                    <div>
                      <h3 className="font-semibold text-white text-base">Match Analysis Completed</h3>
                      <p className="text-xs text-gray-400 leading-relaxed mt-2">
                        We checked your profile keywords against the role requirements of a <strong>{desiredRole}</strong>. 
                        Launch a customized mock session with these skills to assess domain readiness.
                      </p>
                    </div>

                    <div className="pt-4 flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={handleBuildInterview}
                        className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/10"
                      >
                        <span>Build Interview from Analysis</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => { setReport(null); setFile(null); }}
                        className="px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-bold transition"
                      >
                        Analyze Another Resume
                      </button>
                    </div>
                  </div>

                </div>

                {/* Keyword match metrics */}
                <div className="bg-[#15171e] border border-[#232630] rounded-3xl p-6 space-y-6">
                  <div>
                    <h3 className="font-semibold text-white text-base">Keyword Matching Check</h3>
                    <p className="text-xs text-gray-400 mt-1">Highlighted gaps indicates keywords frequently sought in this role.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Matched */}
                    <div className="space-y-3">
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Matched Keywords ({report.matchedKeywords?.length || 0})</span>
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {report.matchedKeywords?.map((kw, i) => (
                          <span key={i} className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full font-medium">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Missing */}
                    <div className="space-y-3">
                      <span className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Missing Keywords ({report.missingKeywords?.length || 0})</span>
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {report.missingKeywords?.map((kw, i) => (
                          <span key={i} className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1 rounded-full font-medium">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Strengths vs Gaps list */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Strengths */}
                  <div className="bg-[#15171e] border border-[#232630] rounded-3xl p-6 space-y-3">
                    <h3 className="font-bold text-sm text-indigo-400">Core Strengths</h3>
                    <ul className="space-y-2.5 text-xs text-gray-300">
                      {report.strengths?.map((s, i) => (
                        <li key={i} className="flex gap-2 items-start leading-relaxed">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Suggestions/Gaps */}
                  <div className="bg-[#15171e] border border-[#232630] rounded-3xl p-6 space-y-3">
                    <h3 className="font-bold text-sm text-purple-400">AI Recommendations & Gaps</h3>
                    <ul className="space-y-2.5 text-xs text-gray-300">
                      {report.suggestions?.map((s, i) => (
                        <li key={i} className="flex gap-2 items-start leading-relaxed">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 flex-shrink-0" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                </div>

              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
