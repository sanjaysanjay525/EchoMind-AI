import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';
import { Award, Calendar, BookOpen, Clock, ChevronRight, BarChart2, Star, Play } from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Loader from '../components/Loader';
import StreakWidget from '../components/StreakWidget';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import WeeklyDigestCard from '../components/WeeklyDigestCard';

export default function CandidateDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [reports, setReports] = useState({});
  const [readinessData, setReadinessData] = useState({});
  const [loading, setLoading] = useState(true);
  const [weakCompetencies, setWeakCompetencies] = useState([]);
  const [dueFlashcardsCount, setDueFlashcardsCount] = useState(0);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const historyRes = await api.get('/interviews/history');
        const sortedHistory = historyRes.data.sort((a, b) => new Date(b.date) - new Date(a.date));
        setHistory(sortedHistory);

        // Fetch reports for completed interviews
        const completed = sortedHistory.filter((i) => i.status === 'COMPLETED');
        const reportsData = {};
        const readinessMap = {};
        await Promise.all(
          completed.map(async (interview) => {
            try {
              const repRes = await api.get(`/report/${interview.id}`);
              reportsData[interview.id] = repRes.data;
            } catch (err) {
              console.error(`Failed to fetch report for ${interview.id}`, err);
            }
            try {
              const readyRes = await api.get(`/readiness/${interview.id}`);
              readinessMap[interview.id] = readyRes.data;
            } catch (err) {
              console.log(`No readiness data for ${interview.id}`);
            }
          })
        );
        setReports(reportsData);
        setReadinessData(readinessMap);

        // Fetch user weak competencies if they have completed sessions
        if (completed.length > 0) {
          try {
            const weakRes = await api.get('/users/weak-competencies');
            setWeakCompetencies(weakRes.data || []);
          } catch (weakErr) {
            console.error("Failed to load weak competencies", weakErr);
          }
        }

        // Fetch due flashcards count
        try {
          const dueRes = await api.get('/flashcards/due');
          setDueFlashcardsCount(dueRes.data.length);
        } catch (dueErr) {
          console.error("Failed to load due flashcards count", dueErr);
        }
      } catch (err) {
        console.error("Error loading dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const COMPETENCY_LABELS = {
    starStructure: "STAR Structure",
    technicalAccuracy: "Technical Accuracy",
    communicationClarity: "Communication Clarity",
    confidenceDelivery: "Confidence & Delivery"
  };

  const handleStartMicroSession = async () => {
    try {
      const lastCompleted = completedInterviews[0];
      const domain = lastCompleted ? lastCompleted.domain : "Software Engineer";
      
      const res = await api.post('/interviews/micro-session', { roleId: domain });
      navigate(`/interview/${res.data.id}`);
    } catch (err) {
      console.error("Failed to start micro-session", err);
      alert("Failed to start quick drill session. Please try again.");
    }
  };

  const handleDownload = async (id) => {
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
      alert("Failed to download PDF report. It may not be generated yet.");
    }
  };

  const completedInterviews = history.filter((i) => i.status === 'COMPLETED');
  
  // Calculate average score
  const scores = Object.values(reports).map((r) => r.overallScore);
  const averageScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  // Prepare chart data (chronological)
  const chartData = [...completedInterviews]
    .reverse()
    .map((interview) => {
      const report = reports[interview.id];
      const ready = readinessData[interview.id];
      return {
        date: new Date(interview.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        domain: interview.domain,
        score: report ? report.overallScore : 0,
        readinessScore: ready ? ready.readinessScore : 0,
      };
    });

  const latestCompleted = completedInterviews.length > 0 ? completedInterviews[0] : null;
  const latestReadiness = latestCompleted ? readinessData[latestCompleted.id] : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-darkBg flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader text="Loading dashboard metrics..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-darkBg flex flex-col">
      <Navbar />
      <div className="flex-1 flex">
        <Sidebar />
        <main className="flex-1 p-8 overflow-y-auto max-w-5xl mx-auto w-full">
          {/* Header */}
          <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="font-display font-extrabold text-3xl text-white">Hello, {user?.name}</h1>
              <p className="text-gray-400 text-sm">Here is your current preparation status</p>
            </div>
            <Link
              to="/select"
              className="bg-gradient-indigo hover:opacity-90 text-white font-semibold px-5 py-2.5 rounded-xl flex items-center gap-2 transition duration-200 shadow-md shadow-indigo-500/10 text-sm w-fit"
            >
              <Award className="w-4 h-4" />
              <span>Start New Interview</span>
            </Link>
          </header>

          <div className="mb-8">
            <WeeklyDigestCard />
          </div>

          {dueFlashcardsCount > 0 && (
            <div className="glass-card p-6 rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-indigo-500/10 to-[#0e1017] mb-8 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-sm">Spaced Repetition Review Due</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    You have <strong className="text-indigo-300 font-bold">{dueFlashcardsCount}</strong> flashcards due for revision today.
                  </p>
                </div>
              </div>
              <Link
                to="/flashcards/review"
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-md shadow-indigo-500/10 shrink-0"
              >
                Start Reviewing
              </Link>
            </div>
          )}

          {/* Metrics grids */}
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
            <div className="glass-card p-6 rounded-2xl flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider block">Total Sessions</span>
                <span className="text-2xl font-bold text-white">{history.length}</span>
              </div>
            </div>

            <div className="glass-card p-6 rounded-2xl flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Star className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider block">Average Score</span>
                <span className="text-2xl font-bold text-white">{averageScore ? `${averageScore}%` : 'N/A'}</span>
              </div>
            </div>

            <div className="glass-card p-6 rounded-2xl flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
                <BarChart2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider block">Completed Runs</span>
                <span className="text-2xl font-bold text-white">{completedInterviews.length}</span>
              </div>
            </div>
          </section>

          {/* Placement Readiness Banner */}
          {latestReadiness && (
            <section className="glass-card p-8 rounded-3xl mb-8 flex flex-col md:flex-row items-center justify-between gap-6 border-l-4 border-l-indigo-500 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-3xl pointer-events-none rounded-full transform translate-x-1/2 -translate-y-1/2"></div>
              
              <div className="flex-1">
                <span className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-2 block">AI Assessment Result</span>
                <h2 className="text-2xl font-display font-bold text-white mb-2">
                  Placement Readiness: <span className="text-indigo-400">{latestReadiness.readinessScore}%</span>
                </h2>
                <div className="flex flex-wrap gap-3 mt-4">
                  <span className="bg-white/5 border border-white/10 px-3 py-1 rounded-full text-xs font-semibold text-gray-300">
                    Category: <span className="text-white">{latestReadiness.readinessCategory}</span>
                  </span>
                  <span className="bg-white/5 border border-white/10 px-3 py-1 rounded-full text-xs font-semibold text-gray-300">
                    Confidence: <span className="text-white">{latestReadiness.confidenceLevel}</span>
                  </span>
                  <span className="bg-white/5 border border-white/10 px-3 py-1 rounded-full text-xs font-semibold text-gray-300">
                    Hiring Probability: <span className={`font-bold ${
                      latestReadiness.hiringProbability.toLowerCase() === 'high' || latestReadiness.hiringProbability.toLowerCase() === 'excellent' 
                      ? 'text-emerald-400' 
                      : 'text-amber-400'
                    }`}>
                      {latestReadiness.hiringProbability}
                    </span>
                  </span>
                </div>
              </div>
              
              <div className="w-full md:w-1/3 bg-white/5 border border-white/5 rounded-2xl p-5">
                <h4 className="text-sm font-semibold text-white mb-3">Recommended Roles</h4>
                <div className="flex flex-wrap gap-2">
                  {latestReadiness.recommendedRoles.map((role, idx) => (
                    <span key={idx} className="bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-lg text-xs font-medium border border-indigo-500/20">
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Performance chart */}
          {chartData.length > 0 && (
            <section className="glass-card p-6 rounded-3xl mb-8">
              <h3 className="font-display font-bold text-lg text-white mb-4">Performance Progress</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="scoreGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="readyGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" stroke="#4b5563" fontSize={11} tickLine={false} />
                    <YAxis domain={[0, 100]} stroke="#4b5563" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: '#15171e', borderColor: '#232630', borderRadius: '12px' }}
                      labelClassName="text-xs text-gray-500 font-medium"
                      itemStyle={{ fontWeight: 'bold' }}
                    />
                    <Area type="monotone" dataKey="score" name="Overall Score" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#scoreGlow)" />
                    <Area type="monotone" dataKey="readinessScore" name="Readiness Score" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#readyGlow)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}

          {/* Skill Improvement Tracker */}
          {latestReadiness && (
            <section className="glass-card p-6 rounded-3xl mb-8">
              <h3 className="font-display font-bold text-lg text-white mb-4">Skill Improvement Tracker</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/5 border border-white/5 p-5 rounded-2xl">
                  <h4 className="text-pink-400 font-semibold text-sm mb-3">Technical Gaps</h4>
                  <ul className="list-disc list-inside text-sm text-gray-400 space-y-2">
                    {latestReadiness.technicalSkillGaps.slice(0, 3).map((gap, i) => (
                      <li key={i}>{gap}</li>
                    ))}
                  </ul>
                </div>
                <div className="bg-white/5 border border-white/5 p-5 rounded-2xl">
                  <h4 className="text-amber-400 font-semibold text-sm mb-3">Communication & Behavior Gaps</h4>
                  <ul className="list-disc list-inside text-sm text-gray-400 space-y-2">
                    {latestReadiness.communicationGaps.concat(latestReadiness.interviewBehaviorIssues).slice(0, 3).map((gap, i) => (
                      <li key={i}>{gap}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          )}

          {/* Quick 5-Question Drill */}
          {completedInterviews.length > 0 && weakCompetencies.length > 0 && (
            <section className="glass-card p-6 rounded-3xl mb-8 border border-indigo-500/10 relative overflow-hidden bg-gradient-to-r from-indigo-500/5 to-purple-500/5">
              <div className="absolute top-[-30px] right-[-30px] w-24 h-24 bg-indigo-500/10 blur-2xl rounded-full"></div>
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h3 className="font-display font-bold text-lg text-white mb-1 flex items-center gap-2">
                    <Star className="w-5 h-5 text-indigo-400" />
                    <span>Quick 5-Question Drill</span>
                  </h3>
                  <p className="text-gray-400 text-xs mb-3">
                    Practice a fast-paced 5-question micro-session targeted at your lowest-performing competencies.
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider font-mono">Today's Focus Areas:</span>
                    {weakCompetencies.map(comp => (
                      <span key={comp} className="bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 px-2.5 py-1 rounded-full text-[10px] font-semibold font-mono">
                        {COMPETENCY_LABELS[comp] || comp}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleStartMicroSession}
                  className="bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-semibold text-xs px-5 py-3 rounded-xl flex items-center gap-2 transition duration-200 shadow-lg shadow-indigo-500/20 cursor-pointer self-start md:self-auto shrink-0"
                >
                  <Play className="w-4 h-4 text-indigo-100 fill-indigo-100" />
                  <span>Start Drill</span>
                </button>
              </div>
            </section>
          )}

          {/* History */}
          <section className="glass-card p-6 rounded-3xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-lg text-white">Recent Activity</h3>
              <Link to="/history" className="text-indigo-400 hover:text-indigo-300 text-xs font-semibold flex items-center gap-1">
                <span>View Full History</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {history.length === 0 ? (
              <div className="text-center py-12">
                <span className="text-sm text-gray-500 block mb-4">You have not completed any interview practices yet.</span>
                <Link
                  to="/select"
                  className="bg-white/5 hover:bg-white/10 text-white border border-white/10 text-sm font-medium px-4 py-2 rounded-xl transition duration-200"
                >
                  Take Your First Mock Interview
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <th className="py-3 px-4">Domain</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Score</th>
                      <th className="py-3 px-4">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {history.slice(0, 5).map((interview) => {
                      const report = reports[interview.id];
                      return (
                        <tr key={interview.id} className="hover:bg-white/5 transition duration-150 text-sm">
                          <td className="py-4 px-4 font-medium text-white">{interview.domain}</td>
                          <td className="py-4 px-4 text-gray-400">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>{new Date(interview.date).toLocaleDateString()}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wide ${
                              interview.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                            }`}>
                              {interview.status}
                            </span>
                          </td>
                          <td className="py-4 px-4 font-bold text-white">
                            {interview.status === 'COMPLETED' ? (report ? `${report.overallScore}%` : '---') : '---'}
                          </td>
                          <td className="py-4 px-4">
                            {interview.status === 'COMPLETED' ? (
                              <div className="flex items-center gap-3">
                                <Link
                                  to={`/report/${interview.id}`}
                                  className="text-xs text-indigo-400 hover:underline font-semibold"
                                >
                                  View Report
                                </Link>
                                <Link
                                  to={`/coaching/${interview.id}`}
                                  className="text-xs text-purple-400 hover:underline font-semibold flex items-center gap-1"
                                >
                                  <Play className="w-3 h-3" />
                                  Replay
                                </Link>
                                <button
                                  onClick={() => handleDownload(interview.id)}
                                  className="text-xs text-emerald-400 hover:underline font-semibold"
                                >
                                  Download PDF
                                </button>
                              </div>
                            ) : (
                              <Link
                                to={`/session/${interview.id}`}
                                className="text-xs text-amber-400 hover:underline font-semibold"
                              >
                                Resume
                              </Link>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
