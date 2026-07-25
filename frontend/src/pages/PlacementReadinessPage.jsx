import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Loader from '../components/Loader';
import { Award, Briefcase, Calendar, CheckCircle, AlertTriangle, ArrowLeft, Lightbulb, UserCheck, Flame, Compass } from 'lucide-react';

export default function PlacementReadinessPage() {
  const { interviewId } = useParams();
  const [readiness, setReadiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);

  const fetchReadiness = async () => {
    try {
      // Try to get existing analysis first
      const res = await api.get(`/readiness/${interviewId}`);
      setReadiness(res.data);
      setLoading(false);
    } catch (err) {
      if (err.response?.status === 404) {
        // Not found, trigger analysis
        triggerAnalysis();
      } else {
        setError("Failed to fetch placement readiness data.");
        setLoading(false);
      }
    }
  };

  const triggerAnalysis = async () => {
    setAnalyzing(true);
    try {
      const res = await api.post('/readiness/analyze', { interviewId });
      setReadiness(res.data);
    } catch (err) {
      setError("AI analysis of placement readiness failed. Please check backend services.");
    } finally {
      setAnalyzing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReadiness();
  }, [interviewId]);

  if (loading || analyzing) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#0e1017', color: 'white', fontFamily: 'system-ui, sans-serif' }}>
        <Navbar />
        <div style={{ display: 'flex', flex: 1 }}>
          <Sidebar />
          <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Loader text={analyzing ? "AI is evaluating hiring probability & benchmark metrics..." : "Fetching readiness records..."} />
          </main>
        </div>
      </div>
    );
  }

  if (error || !readiness) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#0e1017', color: 'white', fontFamily: 'system-ui, sans-serif' }}>
        <Navbar />
        <div style={{ display: 'flex', flex: 1 }}>
          <Sidebar />
          <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            <AlertTriangle size={48} color="#ef4444" />
            <h3 style={{ fontSize: 18, fontWeight: 700 }}>Evaluation Not Found</h3>
            <p style={{ color: '#9ca3af' }}>{error || 'Hiring checklist could not be generated.'}</p>
            <Link to="/history" style={{ padding: '10px 20px', background: '#6366f1', color: 'white', borderRadius: 12, textDecoration: 'none', fontWeight: 600 }}>
              Back to History
            </Link>
          </main>
        </div>
      </div>
    );
  }

  const getProbabilityColor = (prob) => {
    if (!prob) return '#9ca3af';
    const clean = prob.toLowerCase();
    if (clean.includes('high') || clean.includes('strong')) return '#10b981';
    if (clean.includes('medium') || clean.includes('moderate')) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#0e1017', color: 'white', fontFamily: 'system-ui, sans-serif' }}>
      <Navbar />
      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar />
        <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
          
          <Link to="/history" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#9ca3af', textDecoration: 'none', fontSize: 13, marginBottom: 20 }}>
            <ArrowLeft size={14} /> Back to History
          </Link>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '32px' }}>
            <div style={{ padding: 10, borderRadius: 12, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
              <UserCheck size={24} color="#6366f1" />
            </div>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, background: 'linear-gradient(135deg, white, #a5b4fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Placement Readiness & Job Matching
              </h1>
              <p style={{ margin: 0, color: '#9ca3af', fontSize: 14 }}>Real-time corporate benchmarking based on mock evaluation scores.</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

            {/* Scorecard Hero Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
              
              {/* circular score */}
              <div style={{
                padding: 24, borderRadius: 24,
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
              }}>
                <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#6b7280', marginBottom: 16 }}>Readiness Score</span>
                <div style={{
                  width: 120, height: 120, borderRadius: '50%',
                  border: '4px solid rgba(99,102,241,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)',
                }}>
                  <span style={{ fontSize: 32, fontWeight: 900, color: 'white' }}>{readiness.readinessScore}%</span>
                </div>
                <span style={{ fontSize: 13, color: '#a5b4fc', fontWeight: 600, marginTop: 16 }}>
                  Target Company Tier: {readiness.readinessCategory || 'Tier 2 / MNC'}
                </span>
              </div>

              {/* hiring probability */}
              <div style={{
                padding: 24, borderRadius: 24,
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              }}>
                <div>
                  <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#6b7280', display: 'block', marginBottom: 8 }}>Hiring Recommendation</span>
                  <div style={{
                    fontSize: 24, fontWeight: 900,
                    color: getProbabilityColor(readiness.hiringProbability),
                    marginBottom: 12,
                  }}>
                    {readiness.hiringProbability || 'Medium Probability'}
                  </div>
                </div>
                <div style={{
                  padding: 12, borderRadius: 12, background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)', fontSize: 12, color: '#9ca3af', lineHeight: 1.5,
                }}>
                  Confidence Rating: <strong style={{ color: 'white' }}>{readiness.confidenceLevel || 'Moderate'}</strong>
                </div>
              </div>

              {/* Job recommendations */}
              <div style={{
                padding: 24, borderRadius: 24,
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', flexDirection: 'column', gap: 12,
              }}>
                <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#6b7280' }}>Recommended Roles</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {readiness.recommendedRoles?.map((role, idx) => (
                    <div key={idx} style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: 10, borderRadius: 10,
                      background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.1)',
                    }}>
                      <Briefcase size={14} color="#a5b4fc" />
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{role}</span>
                    </div>
                  )) || <div style={{ fontSize: 12, color: '#6b7280' }}>No recommendations generated yet.</div>}
                </div>
              </div>

            </div>

            {/* Gap checklists */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
              
              {/* Tech Skill Gaps */}
              <div style={{
                padding: 24, borderRadius: 24,
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertTriangle size={16} color="#f59e0b" /> Technical Gaps Detected
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {readiness.technicalSkillGaps?.map((gap, idx) => (
                    <div key={idx} style={{ fontSize: 13, color: '#d1d5db', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>•</span>
                      <span>{gap}</span>
                    </div>
                  )) || <div style={{ fontSize: 12, color: '#6b7280' }}>None detected. Perfect technical showing!</div>}
                </div>
              </div>

              {/* Behavior & confidence gaps */}
              <div style={{
                padding: 24, borderRadius: 24,
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Compass size={16} color="#06b6d4" /> Soft-Skills Gaps Detected
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {readiness.communicationGaps?.map((gap, idx) => (
                    <div key={idx} style={{ fontSize: 13, color: '#d1d5db', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <span style={{ color: '#06b6d4', fontWeight: 'bold' }}>•</span>
                      <span>{gap}</span>
                    </div>
                  )) || <div style={{ fontSize: 12, color: '#6b7280' }}>None detected. Articulate and clear communication!</div>}
                </div>
              </div>

            </div>

            {/* Structured Learning Roadmap */}
            {readiness.improvementPlan && (
              <div style={{
                padding: 28, borderRadius: 28,
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <h3 style={{ margin: '0 0 24px 0', fontSize: 17, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Lightbulb size={18} color="#f59e0b" /> Structured Improvement Learning Roadmap
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
                  {[
                    { title: '7-Day Fast-Track Action', plan: readiness.improvementPlan.sevenDayPlan, col: '#ef4444' },
                    { title: '30-Day Mid-Term Goals', plan: readiness.improvementPlan.thirtyDayPlan, col: '#f59e0b' },
                    { title: '90-Day Full Mastery Strategy', plan: readiness.improvementPlan.ninetyDayPlan, col: '#10b981' }
                  ].map((tier, idx) => (
                    <div key={idx} style={{
                      padding: 20, borderRadius: 20,
                      background: 'rgba(255,255,255,0.01)', border: `1px solid rgba(255,255,255,0.05)`,
                      position: 'relative',
                    }}>
                      <div style={{
                        position: 'absolute', top: 20, right: 20,
                        width: 8, height: 8, borderRadius: '50%', background: tier.col,
                      }} />
                      <h4 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 700, color: 'white' }}>{tier.title}</h4>
                      <p style={{ margin: 0, fontSize: 12, color: '#9ca3af', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                        {tier.plan || 'Review core technical modules and practice speaking.'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </main>
      </div>
    </div>
  );
}
