import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Loader from '../components/Loader';
import Editor from '@monaco-editor/react';
import { 
  Play, 
  Send, 
  Clock, 
  Code, 
  Terminal, 
  Award, 
  CheckCircle, 
  XCircle, 
  ChevronRight, 
  Cpu, 
  HelpCircle,
  Sparkles,
  ArrowLeft
} from 'lucide-react';

export default function CodingRoundScreen() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [question, setQuestion] = useState(null);

  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [submitting, setSubmitting] = useState(false);
  
  // Results panel states
  const [results, setResults] = useState(null);
  const [aiReview, setAiReview] = useState(null);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await api.get(`/coding/sessions/${sessionId}`);
        const data = res.data;
        setSession(data.session);
        setQuestion(data.question);
        
        // Load starter code or previous code
        if (data.session.code) {
          setCode(data.session.code);
          setLanguage(data.session.language || 'javascript');
        } else {
          const defaultLang = 'javascript';
          setLanguage(defaultLang);
          setCode(data.question.starterCode?.[defaultLang] || '// Write your code here');
        }

        // Setup timer
        if (data.session.status === 'IN_PROGRESS') {
          const startedAt = new Date(data.session.startedAt).getTime();
          const limitMs = (data.question.timeLimitMinutes || 15) * 60 * 1000;
          const elapsedMs = Date.now() - startedAt;
          const remainingSec = Math.max(0, Math.floor((limitMs - elapsedMs) / 1000));
          setTimeLeft(remainingSec);
        } else {
          setTimeLeft(0);
          setResults(data.session.correctness);
          setAiReview(data.session.aiReview);
        }
      } catch (err) {
        console.error("Error loading coding session", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [sessionId]);

  // Countdown timer effect
  useEffect(() => {
    if (timeLeft <= 0 || !session || session.status !== 'IN_PROGRESS') return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, session]);

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    // Swap starter code template only if user hasn't edited or asks for it
    if (confirm("Change starter code template for " + newLang + "? Your current code will be reset.")) {
      setCode(question.starterCode?.[newLang] || '');
    }
  };

  const handleAutoSubmit = () => {
    alert("Time has run out! Submitting your current code automatically.");
    handleSubmit();
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await api.post(`/coding/sessions/${sessionId}/submit`, {
        code,
        language
      });
      const data = res.data;
      setSession(data.session);
      setResults(data.session.correctness);
      setAiReview(data.session.aiReview);
    } catch (err) {
      console.error("Submission failed", err);
      alert("Submission failed. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) return <Loader />;
  if (!question || !session) {
    return (
      <div className="min-h-screen bg-[#080b12] text-white flex items-center justify-center">
        <div className="text-center p-8 bg-white/5 rounded-3xl border border-white/5 max-w-md">
          <h2 className="text-2xl font-bold mb-4">Session Not Found</h2>
          <button onClick={() => navigate('/dashboard')} className="px-6 py-3 bg-indigo-600 rounded-xl hover:bg-indigo-500 font-bold transition">
            Go back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const isCompleted = session.status === 'SUBMITTED';

  return (
    <div className="min-h-screen bg-[#080b12] text-white flex flex-col font-sans">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        
        <main className="flex-1 flex flex-col p-6 overflow-y-auto max-h-[92vh]">
          {/* Header row */}
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate('/dashboard')}
                className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition"
              >
                <ArrowLeft size={16} />
              </button>
              <div>
                <span className="text-xs text-indigo-400 font-bold uppercase tracking-widest">
                  DSA TIMED TECHNICAL ROUND
                </span>
                <h1 className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-100 to-indigo-300">
                  {question.title}
                </h1>
              </div>
            </div>

            {/* Timer or Completed badge */}
            <div className="flex items-center gap-4">
              {!isCompleted ? (
                <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono text-lg font-bold">
                  <Clock size={18} />
                  <span>{formatTime(timeLeft)}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-sm">
                  <Award size={16} />
                  <span>ROUND COMPLETED</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-stretch">
            {/* Left Column: Problem Description & Results */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              
              {/* Problem Description Card */}
              <div className="glass-card p-6 rounded-2xl flex flex-col gap-4 border border-white/5 bg-[#0e1017]/80">
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    {question.topicTags?.map(tag => (
                      <span key={tag} className="text-xs bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2.5 py-1 rounded-full font-semibold uppercase">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${
                    question.difficulty === 'Easy' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                    question.difficulty === 'Medium' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                    'bg-pink-500/10 border-pink-500/20 text-pink-400'
                  }`}>
                    {question.difficulty}
                  </span>
                </div>

                <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-line border-t border-white/5 pt-4">
                  {question.description}
                </div>

                {/* Example Test Cases */}
                <div className="mt-2">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                    Example Test Cases
                  </span>
                  <div className="flex flex-col gap-2.5 mt-2">
                    {question.testCases?.filter(tc => !tc.isHidden).map((tc, idx) => (
                      <div key={idx} className="p-3 bg-white/5 border border-white/5 rounded-xl font-mono text-xs text-gray-300">
                        <div><strong className="text-indigo-400">Input:</strong> {tc.input}</div>
                        <div className="mt-1"><strong className="text-emerald-400">Expected Output:</strong> {tc.expectedOutput}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Run Results Card */}
              {results && (
                <div className="glass-card p-6 rounded-2xl border border-white/5 bg-[#0e1017]/80 flex flex-col gap-4">
                  <h3 className="text-md font-extrabold flex items-center gap-2 text-white uppercase tracking-wider">
                    <Terminal size={16} className="text-indigo-400" />
                    <span>Test Case Status</span>
                  </h3>
                  
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 justify-between">
                    <div>
                      <div className="text-xs text-gray-400 font-semibold uppercase">Total Verification Score</div>
                      <div className="text-2xl font-black text-emerald-400 mt-1">
                        {Math.round((results.passed / results.totalTests) * 100)}%
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-400 font-semibold uppercase">Passed Cases</div>
                      <div className="text-lg font-bold text-white mt-1">
                        {results.passed} / {results.totalTests}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
                    {results.passedTests?.map((tc, idx) => (
                      <div 
                        key={idx} 
                        className={`p-3 rounded-xl border flex items-center justify-between text-xs font-mono ${
                          tc.passed ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-300' : 'bg-pink-500/5 border-pink-500/10 text-pink-300'
                        }`}
                      >
                        <div>
                          <strong>Case {idx + 1}:</strong> {tc.isHidden ? 'Hidden Test Case' : `Input: ${tc.input}`}
                          {!tc.isHidden && (
                            <div className="text-gray-400 mt-1">
                              <div>Expected: {tc.expected}</div>
                              <div>Actual: {tc.actual}</div>
                            </div>
                          )}
                        </div>
                        {tc.passed ? (
                          <CheckCircle size={16} className="text-emerald-400 shrink-0" />
                        ) : (
                          <XCircle size={16} className="text-pink-400 shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Code Editor & AI Review */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              
              {/* Code Editor Header & Monaco Wrapper */}
              <div className="glass-card rounded-2xl border border-white/5 bg-[#0e1017]/80 overflow-hidden flex flex-col flex-1 min-h-[500px]">
                <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between bg-white/5">
                  <div className="flex items-center gap-2">
                    <Code size={16} className="text-indigo-400" />
                    <span className="text-xs font-bold uppercase tracking-wider">Solution Editor</span>
                  </div>
                  
                  <select 
                    value={language}
                    onChange={handleLanguageChange}
                    disabled={isCompleted}
                    className="bg-[#121520] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white font-bold outline-none cursor-pointer focus:border-indigo-500 transition"
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                  </select>
                </div>

                <div className="flex-1 min-h-[400px]">
                  <Editor
                    height="100%"
                    language={language === 'java' ? 'java' : language === 'python' ? 'python' : 'javascript'}
                    theme="vs-dark"
                    value={code}
                    options={{
                      readOnly: isCompleted,
                      fontSize: 14,
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                    }}
                    onChange={setCode}
                  />
                </div>

                {!isCompleted && (
                  <div className="p-4 border-t border-white/5 bg-white/5 flex justify-end gap-3">
                    <button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 font-bold hover:opacity-95 shadow-lg shadow-indigo-500/20 text-sm flex items-center gap-2 disabled:opacity-50 transition"
                    >
                      {submitting ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Send size={15} />
                      )}
                      <span>Submit Code & Run Review</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Qualitative AI Review Card */}
              {aiReview && (
                <div className="glass-card p-6 rounded-2xl border border-white/5 bg-[#0e1017]/85 flex flex-col gap-5">
                  <div className="flex items-center justify-between flex-wrap gap-2 border-b border-white/5 pb-4">
                    <h3 className="text-md font-extrabold flex items-center gap-2 text-white uppercase tracking-wider">
                      <Sparkles size={16} className="text-amber-400 animate-pulse" />
                      <span>Gemini Technical review</span>
                    </h3>
                    <div className="flex items-center gap-4 text-xs font-mono font-bold">
                      <div className="px-3 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-300 rounded-lg flex items-center gap-1.5">
                        <Cpu size={14} />
                        <span>{aiReview.complexity}</span>
                      </div>
                      <div className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-lg">
                        Readability: {aiReview.readabilityScore}/100
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    {aiReview.feedback?.map((item, idx) => (
                      <div key={idx} className="flex gap-3 text-sm text-gray-300 leading-relaxed">
                        <ChevronRight size={16} className="text-amber-400 shrink-0 mt-1" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
