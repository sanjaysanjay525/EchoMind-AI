import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Loader from '../components/Loader';
import { Target, CheckCircle2, TrendingUp, AlertTriangle, ArrowLeft, ExternalLink, Play, FileText, Globe } from 'lucide-react';

export default function SkillGapPage() {
  const { interviewId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSkillGap = async () => {
      try {
        const res = await api.get(`/skill-gap/${interviewId}`);
        
        let parsedAnalysis = {};
        if (res.data && res.data.analysis) {
          try {
            // strip potential markdown format indicators
            let cleanJson = res.data.analysis.trim();
            if (cleanJson.startsWith('```json')) {
              cleanJson = cleanJson.substring(7);
            }
            if (cleanJson.endsWith('```')) {
              cleanJson = cleanJson.substring(0, cleanJson.length - 3);
            }
            parsedAnalysis = JSON.parse(cleanJson.trim());
          } catch (jsonErr) {
            console.error("JSON parse failed, raw string used", jsonErr);
            parsedAnalysis = { rawText: res.data.analysis };
          }
        }
        
        setData({
          ...res.data,
          analysis: parsedAnalysis,
        });
      } catch (err) {
        console.error("Error loading skill gap analysis", err);
        setError("Could not load skill gap analysis. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchSkillGap();
  }, [interviewId]);

  const getResourceIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'youtube':
        return <Play size={16} color="#ef4444" />;
      case 'docs':
        return <FileText size={16} color="#3b82f6" />;
      default:
        return <Globe size={16} color="#10b981" />;
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#0e1017', color: 'white', fontFamily: 'system-ui, sans-serif' }}>
        <Navbar />
        <div style={{ display: 'flex', flex: 1 }}>
          <Sidebar />
          <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Loader text="AI is generating your personalized skill gap analysis..." />
          </main>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#0e1017', color: 'white', fontFamily: 'system-ui, sans-serif' }}>
        <Navbar />
        <div style={{ display: 'flex', flex: 1 }}>
          <Sidebar />
          <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            <AlertTriangle size={48} color="#ef4444" />
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Analysis Failed</h3>
            <p style={{ color: '#9ca3af', margin: 0 }}>{error || 'Unable to build report.'}</p>
            <Link to="/history" style={{ padding: '10px 20px', background: '#6366f1', color: 'white', borderRadius: 12, textDecoration: 'none', fontWeight: 600 }}>
              Back to History
            </Link>
          </main>
        </div>
      </div>
    );
  }

  const { analysis, domain, overallScore } = data;
  const isRaw = !!analysis.rawText;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#0e1017', color: 'white', fontFamily: 'system-ui, sans-serif' }}>
      <Navbar />
      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar />
        <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
          
          {/* Back button */}
          <Link to={`/report/${interviewId}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#9ca3af', textDecoration: 'none', fontSize: 13, marginBottom: 20 }}>
            <ArrowLeft size={14} /> Back to Scorecard
          </Link>

          {/* Header Row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '32px' }}>
            <div style={{ padding: 10, borderRadius: 12, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <Target size={24} color="#10b981" />
            </div>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, background: 'linear-gradient(135deg, white, #a5b4fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                AI Skill Gap Analysis
              </h1>
              <p style={{ margin: 0, color: '#9ca3af', fontSize: 14 }}>Role Target: {domain} | Overall performance: {overallScore}%</p>
            </div>
          </div>

          {isRaw ? (
            /* Fallback raw display */
            <div style={{
              padding: 24, borderRadius: 20,
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              lineHeight: 1.6, whiteSpace: 'pre-wrap', color: '#d1d5db', fontSize: 14,
            }}>
              {analysis.rawText}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              
              {/* Weak areas grid */}
              <div>
                <h3 style={{ margin: '0 0 16px 0', fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertTriangle size={18} color="#f59e0b" /> Areas For Improvement
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
                  {analysis.weakAreas?.map((item, idx) => (
                    <div key={idx} style={{
                      padding: 20, borderRadius: 20,
                      background: 'rgba(245,158,11,0.03)',
                      border: '1px solid rgba(245,158,11,0.15)',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <span style={{ fontWeight: 700, color: 'white' }}>{item.skill}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b' }}>{item.score}%</span>
                      </div>
                      <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden', marginBottom: 12 }}>
                        <div style={{ height: '100%', width: `${item.score}%`, background: '#f59e0b', borderRadius: 99 }} />
                      </div>
                      <p style={{ margin: 0, fontSize: 12, color: '#9ca3af', lineHeight: 1.5, fontStyle: 'italic' }}>
                        "{item.recommendation}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strong areas chips */}
              {analysis.strongAreas && analysis.strongAreas.length > 0 && (
                <div>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CheckCircle2 size={16} color="#10b981" /> Verified Core Strengths
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {analysis.strongAreas.map((s, idx) => (
                      <span key={idx} style={{
                        padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                        background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#34d399',
                      }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Two column resources & action steps */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
                
                {/* Next Steps */}
                <div style={{
                  padding: 24, borderRadius: 24,
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <h3 style={{ margin: '0 0 20px 0', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <TrendingUp size={16} color="#6366f1" /> Actionable Next Steps
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {analysis.nextSteps?.map((step, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: 14 }}>
                        <div style={{
                          width: 24, height: 24, borderRadius: '50%',
                          background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, fontWeight: 700, color: '#a5b4fc', flexShrink: 0,
                        }}>{idx + 1}</div>
                        <div style={{ fontSize: 13, color: '#d1d5db', lineHeight: 1.5 }}>{step}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Resources */}
                <div style={{
                  padding: 24, borderRadius: 24,
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <h3 style={{ margin: '0 0 20px 0', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                    Recommended Learning Resources
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {analysis.resources?.map((res, idx) => (
                      <div
                        key={idx}
                        onClick={() => window.open(res.url, '_blank')}
                        style={{
                          padding: '12px 16px', borderRadius: 14,
                          background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)',
                          display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.01)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; }}
                      >
                        <div style={{
                          width: 32, height: 32, borderRadius: 10,
                          background: 'rgba(255,255,255,0.03)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {getResourceIcon(res.type)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {res.title}
                          </div>
                          <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'capitalize' }}>{res.type || 'link'}</div>
                        </div>
                        <ExternalLink size={14} color="#4b5563" />
                      </div>
                    ))}
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
