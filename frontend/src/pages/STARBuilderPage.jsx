import React, { useState } from 'react';
import { api } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Loader from '../components/Loader';
import { Sparkles, Award, AlertTriangle, Lightbulb, Compass, Save, Edit3 } from 'lucide-react';

export default function STARBuilderPage() {
  const [situation, setSituation] = useState('');
  const [task, setTask] = useState('');
  const [action, setAction] = useState('');
  const [result, setResult] = useState('');

  const [loading, setLoading] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const [toast, setToast] = useState(null);

  const showToastMsg = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleEvaluate = async (e) => {
    e.preventDefault();
    if (!situation.trim() || !task.trim() || !action.trim() || !result.trim()) {
      showToastMsg('Please fill out all STAR quadrants.', 'error');
      return;
    }

    setLoading(true);
    setEvaluation(null);
    try {
      const res = await api.post('/star-builder/evaluate', {
        situation,
        task,
        action,
        result
      });
      
      let parsed = {};
      if (res.data && res.data.evaluation) {
        try {
          parsed = JSON.parse(res.data.evaluation);
        } catch (jsonErr) {
          console.error("JSON parse of STAR feedback failed, showing raw", jsonErr);
          parsed = { feedback: res.data.evaluation };
        }
      }
      setEvaluation(parsed);
      showToastMsg('AI feedback generated successfully!');
    } catch (err) {
      console.error(err);
      showToastMsg('Failed to evaluate template.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSituation('');
    setTask('');
    setAction('');
    setResult('');
    setEvaluation(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#0e1017', color: 'white', fontFamily: 'system-ui, sans-serif' }}>
      <Navbar />
      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar />
        <main style={{ flex: 1, padding: '32px', overflowY: 'auto', position: 'relative' }}>
          
          {/* Toast */}
          {toast && (
            <div style={{
              position: 'fixed', top: 24, right: 24, zIndex: 9999,
              padding: '12px 24px', borderRadius: 12,
              background: toast.type === 'error' ? '#ef4444' : '#10b981',
              border: `1px solid rgba(255,255,255,0.1)`,
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              fontSize: 13, fontWeight: 700, color: 'white',
              animation: 'slideIn 0.3s ease',
            }}>
              {toast.msg}
            </div>
          )}

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '32px' }}>
            <div style={{ padding: 10, borderRadius: 12, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
              <Sparkles size={24} color="#6366f1" />
            </div>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, background: 'linear-gradient(135deg, white, #a5b4fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                STAR Method Answer Builder
              </h1>
              <p style={{ margin: 0, color: '#9ca3af', fontSize: 14 }}>Structure and refine your behavioral answers using Situation, Task, Action, Result framework.</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 32 }}>
            
            {/* Left quadrant inputs form */}
            <div style={{
              padding: 24, borderRadius: 24,
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: 16, fontWeight: 700 }}>STAR Template Fields</h3>
              <form onSubmit={handleEvaluate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#6366f1', marginBottom: 6 }}>Situation (S)</label>
                  <textarea
                    required
                    value={situation}
                    onChange={e => setSituation(e.target.value)}
                    placeholder="Set the scene: Describe the project, challenge, or conflict you faced. E.g., 'During my internship at TechCorp, we were facing a 20% drops in API throughput...'"
                    rows={3}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none', resize: 'none', boxSizing: 'border-box', fontSize: 13, lineHeight: 1.5 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#8b5cf6', marginBottom: 6 }}>Task (T)</label>
                  <textarea
                    required
                    value={task}
                    onChange={e => setTask(e.target.value)}
                    placeholder="Identify the goal: What needed to be done? E.g., 'My task was to optimize the database queries and cache layer to handle peak loads...'"
                    rows={3}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none', resize: 'none', boxSizing: 'border-box', fontSize: 13, lineHeight: 1.5 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#ec4899', marginBottom: 6 }}>Action (A)</label>
                  <textarea
                    required
                    value={action}
                    onChange={e => setAction(e.target.value)}
                    placeholder="Describe your steps: E.g., 'I implemented a Redis caching layer for key endpoints, optimized SQL indexes, and refactored backend logic...'"
                    rows={3}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none', resize: 'none', boxSizing: 'border-box', fontSize: 13, lineHeight: 1.5 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#10b981', marginBottom: 6 }}>Result (R)</label>
                  <textarea
                    required
                    value={result}
                    onChange={e => setResult(e.target.value)}
                    placeholder="Highlight metrics: E.g., 'This resulted in a 40% speedup in response times, and the API successfully handled 2M requests daily...'"
                    rows={3}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none', resize: 'none', boxSizing: 'border-box', fontSize: 13, lineHeight: 1.5 }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      flex: 1, padding: '14px', borderRadius: 12, fontSize: 14, fontWeight: 700,
                      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                      border: 'none', cursor: 'pointer', color: 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      boxShadow: '0 4px 20px rgba(99,102,241,0.3)',
                    }}
                  >
                    <span>{loading ? 'Evaluating...' : 'Get AI Grading Feedback'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    style={{
                      padding: '14px 20px', borderRadius: 12, fontSize: 14, fontWeight: 700,
                      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                      color: 'white', cursor: 'pointer',
                    }}
                  >
                    Reset
                  </button>
                </div>
              </form>
            </div>

            {/* Right evaluation results panel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>AI STAR Grade Report</h3>
              
              {loading ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.01)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 24, minHeight: 300 }}>
                  <Loader text="AI is grading your structured behavioral description..." />
                </div>
              ) : !evaluation ? (
                <div style={{
                  flex: 1, padding: 32, borderRadius: 24, textAlign: 'center',
                  background: 'rgba(255,255,255,0.01)', border: '1px dashed rgba(255,255,255,0.08)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  minHeight: 300,
                }}>
                  <Compass size={32} color="#4b5563" style={{ marginBottom: 12 }} />
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#6b7280' }}>Ready to evaluate</div>
                  <p style={{ fontSize: 11, color: '#4b5563', margin: '4px 0 0 0' }}>Fill in the STAR quadrants on the left and submit to receive instant scores.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  
                  {/* Score & benchmark */}
                  <div style={{
                    padding: 24, borderRadius: 24,
                    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex', alignItems: 'center', gap: 20,
                  }}>
                    <div style={{
                      width: 72, height: 72, borderRadius: '50%',
                      background: 'rgba(16,185,129,0.1)', border: '2px solid #10b981',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 22, fontWeight: 900, color: '#10b981',
                    }}>
                      {evaluation.score || 80}%
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', fontWeight: 700 }}>STAR Rating</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: 'white', marginTop: 4 }}>{evaluation.frameworkRating || 'Good structure'}</div>
                    </div>
                  </div>

                  {/* Feedback Card */}
                  <div style={{
                    padding: 24, borderRadius: 24,
                    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 700 }}>AI Structure Analysis</h4>
                    <p style={{ margin: 0, fontSize: 13, color: '#9ca3af', lineHeight: 1.6 }}>
                      {evaluation.feedback}
                    </p>
                  </div>

                  {/* Improvement checklist */}
                  {evaluation.improvementTips && evaluation.improvementTips.length > 0 && (
                    <div style={{
                      padding: 24, borderRadius: 24,
                      background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                    }}>
                      <h4 style={{ margin: '0 0 16px 0', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Lightbulb size={16} color="#f59e0b" /> Actionable Recommendations
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {evaluation.improvementTips.map((tip, idx) => (
                          <div key={idx} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                            <span style={{
                              width: 18, height: 18, borderRadius: '50%',
                              background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 10, fontWeight: 700, color: '#f59e0b', flexShrink: 0,
                            }}>{idx + 1}</span>
                            <span style={{ fontSize: 12, color: '#d1d5db', lineHeight: 1.5 }}>{tip}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>

          </div>

        </main>
      </div>
      <style>{`
        @keyframes slideIn { from { transform: translateY(-20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
    </div>
  );
}
