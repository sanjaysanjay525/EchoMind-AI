import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../context/AuthContext';
import { Calendar, Clock, ArrowRight, ClipboardList } from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Loader from '../components/Loader';

export default function InterviewHistoryPage() {
  const [history, setHistory] = useState([]);
  const [reports, setReports] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get('/interviews/history');
        const sorted = res.data.sort((a, b) => new Date(b.date) - new Date(a.date));
        setHistory(sorted);

        const completed = sorted.filter((i) => i.status === 'COMPLETED');
        const reportsMap = {};
        await Promise.all(
          completed.map(async (interview) => {
            try {
              const repRes = await api.get(`/report/${interview.id}`);
              reportsMap[interview.id] = repRes.data;
            } catch (err) {
              console.error(err);
            }
          })
        );
        setReports(reportsMap);
      } catch (err) {
        console.error("Error loading history", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const formatDuration = (seconds) => {
    if (!seconds) return '---';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
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

  if (loading) {
    return (
      <div className="min-h-screen bg-darkBg flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader text="Loading session history..." />
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
          <header className="mb-8">
            <h1 className="font-display font-extrabold text-3xl text-white mb-2">Practice History</h1>
            <p className="text-gray-400 text-sm">Review all your past mock runs, scores, and evaluations</p>
          </header>

          {history.length === 0 ? (
            <div className="glass-card p-12 rounded-3xl text-center flex flex-col items-center justify-center max-w-lg mx-auto mt-12 gap-5">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <ClipboardList className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-white mb-2">No Interviews Yet</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  You haven't completed any practice runs yet. Select a domain below to launch your first session.
                </p>
              </div>
              <Link
                to="/select"
                className="bg-gradient-indigo hover:opacity-90 text-white font-semibold px-6 py-3 rounded-xl flex items-center gap-2 transition duration-200 shadow-md shadow-indigo-500/10 text-sm"
              >
                <span>Take First Interview</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="glass-card rounded-3xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-white/5">
                      <th className="py-4 px-6">Domain</th>
                      <th className="py-4 px-6">Date Took</th>
                      <th className="py-4 px-6">Duration</th>
                      <th className="py-4 px-6">Status</th>
                      <th className="py-4 px-6">Overall Score</th>
                      <th className="py-4 px-6">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {history.map((interview) => {
                      const report = reports[interview.id];
                      return (
                        <tr key={interview.id} className="hover:bg-white/5 transition duration-150 text-sm">
                          <td className="py-4 px-6 font-semibold text-white">{interview.domain}</td>
                          <td className="py-4 px-6 text-gray-400">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-500" />
                              <span>{new Date(interview.date).toLocaleDateString()}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-gray-400">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-gray-500" />
                              <span>{formatDuration(interview.duration)}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                              interview.status === 'COMPLETED'
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : 'bg-amber-500/10 text-amber-400'
                            }`}>
                              {interview.status}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            {interview.status === 'COMPLETED' ? (
                              report ? (
                                <span className="font-bold text-indigo-400">{report.overallScore}%</span>
                              ) : (
                                <span className="text-gray-600">---</span>
                              )
                            ) : (
                              <span className="text-gray-600">---</span>
                            )}
                          </td>
                          <td className="py-4 px-6">
                            {interview.status === 'COMPLETED' ? (
                              <div className="flex items-center gap-2">
                                <Link
                                  to={`/report/${interview.id}`}
                                  className="text-xs bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white px-3 py-1.5 rounded-lg border border-indigo-500/20 hover:border-indigo-600 font-semibold transition duration-150 block w-fit"
                                >
                                  View Report
                                </Link>
                                <Link
                                  to={`/readiness/${interview.id}`}
                                  className="text-xs bg-purple-600/10 hover:bg-purple-600 text-purple-400 hover:text-white px-3 py-1.5 rounded-lg border border-purple-500/20 hover:border-purple-600 font-semibold transition duration-150 block w-fit"
                                >
                                  Readiness Benchmark
                                </Link>
                                <button
                                  onClick={() => handleDownload(interview.id)}
                                  className="text-xs bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white px-3 py-1.5 rounded-lg border border-emerald-500/20 hover:border-emerald-600 font-semibold transition duration-150 block w-fit"
                                >
                                  Download PDF
                                </button>
                              </div>
                            ) : (
                              <Link
                                to={`/session/${interview.id}`}
                                className="text-xs bg-amber-600/10 hover:bg-amber-600 text-amber-400 hover:text-white px-3 py-1.5 rounded-lg border border-amber-500/20 hover:border-amber-600 font-semibold transition duration-150 block w-fit"
                              >
                                Resume Run
                              </Link>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
