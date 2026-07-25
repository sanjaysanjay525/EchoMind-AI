import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Loader from '../components/Loader';
import { BarChart2, TrendingUp, Calendar, Target, Award, Star, Activity, AlertCircle } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export default function AnalyticsDashboard() {
  const [sessions, setSessions] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalInterviews: 0,
    avgScore: 0,
    bestScore: 0,
    currentStreak: 0,
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const historyRes = await api.get('/interviews/history');
        const list = historyRes.data || [];
        setSessions(list);

        const completed = list.filter(s => s.status === 'COMPLETED');
        
        // Fetch detailed reports for completed interviews
        const reportsList = [];
        await Promise.all(
          completed.map(async (s) => {
            try {
              const repRes = await api.get(`/report/${s.id}`);
              if (repRes.data) {
                reportsList.push({ ...repRes.data, date: s.date });
              }
            } catch (err) {
              console.error(err);
            }
          })
        );
        
        // Sort reports chronologically
        reportsList.sort((a, b) => new Date(a.date) - new Date(b.date));
        setReports(reportsList);

        // Fetch streak
        let streakVal = 0;
        try {
          const streakRes = await api.get('/streak');
          streakVal = streakRes.data?.currentStreak || 0;
        } catch {}

        // Compute metrics
        if (reportsList.length > 0) {
          const scores = reportsList.map(r => r.overallScore || 0);
          const totalScore = scores.reduce((sum, s) => sum + s, 0);
          const avg = Math.round(totalScore / scores.length);
          const max = Math.max(...scores);
          setStats({
            totalInterviews: list.length,
            avgScore: avg,
            bestScore: max,
            currentStreak: streakVal,
          });
        } else {
          setStats(prev => ({ ...prev, totalInterviews: list.length, currentStreak: streakVal }));
        }

      } catch (err) {
        console.error("Error building analytics dashboard", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  // Format charts data
  const trendData = reports.map((r, i) => {
    const dateObj = new Date(r.date);
    return {
      name: `${dateObj.getMonth() + 1}/${dateObj.getDate()}`,
      Score: r.overallScore,
      domain: r.session?.careerPath || 'Interview',
    };
  });

  // Round scores breakdown
  const roundScores = { APTITUDE: [], COMMUNICATION: [], CODING: [], ADVANCED: [] };
  reports.forEach(r => {
    if (r.results) {
      r.results.forEach(res => {
        if (roundScores[res.roundType]) {
          roundScores[res.roundType].push(res.score);
        }
      });
    }
  });

  const getAvg = (arr) => arr.length > 0 ? Math.round(arr.reduce((a,b)=>a+b, 0) / arr.length) : 0;

  const radarData = [
    { subject: 'Warm Up', A: getAvg(roundScores.APTITUDE), fullMark: 100 },
    { subject: 'Behavioral', A: getAvg(roundScores.COMMUNICATION), fullMark: 100 },
    { subject: 'Coding', A: getAvg(roundScores.CODING), fullMark: 100 },
    { subject: 'Architecture', A: getAvg(roundScores.ADVANCED), fullMark: 100 },
  ];

  // Domain score averages
  const domainScoresMap = {};
  reports.forEach(r => {
    const d = r.session?.careerPath || 'Other';
    if (!domainScoresMap[d]) domainScoresMap[d] = [];
    domainScoresMap[d].push(r.overallScore);
  });
  const barData = Object.entries(domainScoresMap).map(([domain, arr]) => ({
    name: domain.length > 15 ? domain.substring(0, 15) + '...' : domain,
    AvgScore: getAvg(arr),
  }));

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#0e1017', color: 'white', fontFamily: 'system-ui, sans-serif' }}>
        <Navbar />
        <div style={{ display: 'flex', flex: 1 }}>
          <Sidebar />
          <main style={{ flex: 1, display: 'flex', alignItems: 'center', justify: 'center' }}>
            <Loader text="Generating performance reports..." />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#0e1017', color: 'white', fontFamily: 'system-ui, sans-serif' }}>
      <Navbar />
      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar />
        <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
          
          {/* Header Row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '32px' }}>
            <div style={{ padding: 10, borderRadius: 12, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
              <BarChart2 size={24} color="#6366f1" />
            </div>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, background: 'linear-gradient(135deg, white, #a5b4fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Performance Analytics
              </h1>
              <p style={{ margin: 0, color: '#9ca3af', fontSize: 14 }}>Detailed charts and insights on your preparation progress.</p>
            </div>
          </div>

          {reports.length === 0 ? (
            <div style={{
              padding: '60px 24px', borderRadius: 24, textAlign: 'center',
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <AlertCircle size={48} color="#6366f1" style={{ marginBottom: 16 }} />
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px 0' }}>No Completed Interviews Yet</h3>
              <p style={{ color: '#9ca3af', fontSize: 14, margin: '0 auto 24px', maxWidth: 440 }}>
                Complete at least one graded interview session to unlock your performance metrics, trends, and weak area breakdown.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              
              {/* Stat Cards Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
                {[
                  { label: 'Total Sessions', val: stats.totalInterviews, icon: Calendar, desc: 'Graded and practice sessions', col: '#6366f1' },
                  { label: 'Average Score', val: `${stats.avgScore}%`, icon: Target, desc: 'Overall mean performance', col: '#8b5cf6' },
                  { label: 'Best Score', val: `${stats.bestScore}%`, icon: Award, desc: 'Your personal highest record', col: '#06b6d4' },
                  { label: 'Current Streak', val: `${stats.currentStreak} Days`, icon: Activity, desc: 'Consecutive active prep days', col: '#f59e0b' },
                ].map((stat, i) => {
                  const Icon = stat.icon;
                  return (
                    <div key={i} style={{
                      padding: 24, borderRadius: 20,
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      display: 'flex', alignItems: 'center', gap: 20,
                    }}>
                      <div style={{
                        width: 48, height: 48, borderRadius: 12,
                        background: `rgba(${stat.col === '#6366f1' ? '99,102,241' : stat.col === '#8b5cf6' ? '139,92,246' : stat.col === '#06b6d4' ? '6,182,212' : '245,158,11'}, 0.1)`,
                        border: `1px solid ${stat.col}40`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Icon size={20} color={stat.col} />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, color: '#9ca3af', fontWeight: 500 }}>{stat.label}</div>
                        <div style={{ fontSize: 24, fontWeight: 800, margin: '4px 0' }}>{stat.val}</div>
                        <div style={{ fontSize: 11, color: '#6b7280' }}>{stat.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Trend Chart */}
              <div style={{
                padding: 24, borderRadius: 24,
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: 16, fontWeight: 700 }}>Overall Score Progression</h3>
                <div style={{ width: '100%', height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="scoreColor" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: 11 }} />
                      <YAxis domain={[0, 100]} stroke="#6b7280" style={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{ background: '#13151f', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 }}
                        labelStyle={{ color: '#9ca3af', fontWeight: 600 }}
                      />
                      <Area type="monotone" dataKey="Score" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#scoreColor)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Double Column Breakdown */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
                {/* Radar round performance */}
                <div style={{
                  padding: 24, borderRadius: 24,
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex', flexDirection: 'column',
                }}>
                  <h3 style={{ margin: '0 0 20px 0', fontSize: 16, fontWeight: 700 }}>Round-wise Metrics Breakdown</h3>
                  <div style={{ flex: 1, height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                        <PolarGrid stroke="rgba(255,255,255,0.05)" />
                        <PolarAngleAxis dataKey="subject" stroke="#9ca3af" style={{ fontSize: 11, fontWeight: 500 }} />
                        <Radar name="Averages" dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.25} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Bar chart domains */}
                <div style={{
                  padding: 24, borderRadius: 24,
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex', flexDirection: 'column',
                }}>
                  <h3 style={{ margin: '0 0 20px 0', fontSize: 16, fontWeight: 700 }}>Domain Performance Metrics</h3>
                  <div style={{ flex: 1, height: 240 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: 10 }} />
                        <YAxis domain={[0, 100]} stroke="#6b7280" style={{ fontSize: 10 }} />
                        <Tooltip contentStyle={{ background: '#13151f', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 }} />
                        <Bar dataKey="AvgScore" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

            </div>
          )}

        </main>
      </div>
    </div>
  );
}
