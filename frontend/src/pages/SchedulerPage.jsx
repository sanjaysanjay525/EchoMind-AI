import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Loader from '../components/Loader';
import { Calendar, Clock, Plus, Trash2, AlertCircle, BookOpen } from 'lucide-react';

const DOMAINS = [
  'Software Engineer',
  'Data Scientist',
  'Product Manager',
  'UI/UX Designer',
  'DevOps Engineer',
  'Machine Learning Engineer',
  'Business Analyst',
  'Marketing Manager',
  'Full Stack Developer',
  'Data Analyst'
];

/* ── Countdown Component ── */
function Countdown({ targetTime }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [isOverdue, setIsOverdue] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const diff = new Date(targetTime) - new Date();
      if (diff <= 0) {
        setTimeLeft('Session Overdue');
        setIsOverdue(true);
        return;
      }
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const mins = Math.floor((diff / (1000 * 60)) % 60);
      const secs = Math.floor((diff / 1000) % 60);
      
      let str = '';
      if (days > 0) str += `${days}d `;
      if (hours > 0 || days > 0) str += `${hours}h `;
      str += `${mins}m ${secs}s`;
      setTimeLeft(str);
      setIsOverdue(false);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [targetTime]);

  return (
    <div style={{
      fontSize: 12, fontWeight: 700,
      color: isOverdue ? '#ef4444' : '#10b981',
      background: isOverdue ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
      border: `1px solid ${isOverdue ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}`,
      padding: '4px 10px', borderRadius: 8, display: 'inline-flex', alignItems: 'center', gap: 4,
    }}>
      <Clock size={12} />
      <span>{timeLeft}</span>
    </div>
  );
}

export default function SchedulerPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Form states
  const [title, setTitle] = useState('');
  const [domain, setDomain] = useState(DOMAINS[0]);
  const [difficulty, setDifficulty] = useState('Junior');
  const [scheduledAt, setScheduledAt] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchSessions = async () => {
    try {
      const res = await api.get('/schedule');
      // Sort sessions chronologically
      const sorted = (res.data || []).sort((a,b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
      setSessions(sorted);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const showToastMsg = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSchedule = async (e) => {
    e.preventDefault();
    if (!title.trim() || !scheduledAt) {
      showToastMsg('Please fill in all required fields.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/schedule', {
        title,
        domain,
        difficulty,
        scheduledAt,
        notes
      });
      showToastMsg('Session scheduled successfully!');
      // Reset form
      setTitle('');
      setScheduledAt('');
      setNotes('');
      // Refresh list
      fetchSessions();
    } catch (err) {
      console.error(err);
      showToastMsg('Failed to schedule session.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/schedule/${id}`);
      showToastMsg('Scheduled session removed.');
      fetchSessions();
    } catch (err) {
      console.error(err);
      showToastMsg('Failed to remove scheduled session.', 'error');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#0e1017', color: 'white', fontFamily: 'system-ui, sans-serif' }}>
        <Navbar />
        <div style={{ display: 'flex', flex: 1 }}>
          <Sidebar />
          <main style={{ flex: 1, display: 'flex', alignItems: 'center', justify: 'center' }}>
            <Loader text="Loading your scheduled interviews..." />
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
        <main style={{ flex: 1, padding: '32px', overflowY: 'auto', position: 'relative' }}>
          
          {/* Toast Notification */}
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

          {/* Header Row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '32px' }}>
            <div style={{ padding: 10, borderRadius: 12, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
              <Calendar size={24} color="#6366f1" />
            </div>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, background: 'linear-gradient(135deg, white, #a5b4fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Interview Scheduler
              </h1>
              <p style={{ margin: 0, color: '#9ca3af', fontSize: 14 }}>Schedule future mock sessions and track reminders.</p>
            </div>
          </div>

          {/* Double Column Layout */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 32 }}>
            
            {/* Left Form Card */}
            <div style={{
              padding: 24, borderRadius: 24,
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: 16, fontWeight: 700 }}>Plan a Session</h3>
              <form onSubmit={handleSchedule} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#9ca3af', marginBottom: 6 }}>Session Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g., Spring Boot System Design Mock"
                    style={{ width: '100%', padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#9ca3af', marginBottom: 6 }}>Target Role</label>
                    <select
                      value={domain}
                      onChange={e => setDomain(e.target.value)}
                      style={{ width: '100%', padding: '12px 14px', borderRadius: 12, background: '#13151f', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none' }}
                    >
                      {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#9ca3af', marginBottom: 6 }}>Difficulty</label>
                    <select
                      value={difficulty}
                      onChange={e => setDifficulty(e.target.value)}
                      style={{ width: '100%', padding: '12px 14px', borderRadius: 12, background: '#13151f', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none' }}
                    >
                      {['Junior', 'Mid-level', 'Senior'].map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#9ca3af', marginBottom: 6 }}>Date & Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={scheduledAt}
                    onChange={e => setScheduledAt(e.target.value)}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#9ca3af', marginBottom: 6 }}>Topic notes / checklist</label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="List specific APIs, design patterns, or weak points to focus on during this practice session."
                    rows={4}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none', resize: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '14px', borderRadius: 12, fontSize: 14, fontWeight: 700,
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    border: 'none', cursor: 'pointer', color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    boxShadow: '0 4px 20px rgba(99,102,241,0.3)',
                    marginTop: 8, transition: 'opacity 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  <Plus size={16} />
                  <span>{submitting ? 'Scheduling...' : 'Schedule Practice Session'}</span>
                </button>
              </form>
            </div>

            {/* Right List Card */}
            <div style={{
              display: 'flex', flexDirection: 'column', gap: 16,
            }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                Upcoming Queue <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, background: 'rgba(255,255,255,0.06)', color: '#9ca3af' }}>{sessions.length}</span>
              </h3>

              {sessions.length === 0 ? (
                <div style={{
                  flex: 1, padding: '40px 24px', borderRadius: 24, textAlign: 'center',
                  background: 'rgba(255,255,255,0.01)', border: '1px dashed rgba(255,255,255,0.08)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                }}>
                  <AlertCircle size={32} color="#4b5563" style={{ marginBottom: 12 }} />
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#6b7280' }}>No scheduled interviews</div>
                  <p style={{ fontSize: 11, color: '#4b5563', margin: '4px 0 0 0' }}>Plan a session to stay accountable in your preparation.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {sessions.map((sess) => {
                    const scheduledDate = new Date(sess.scheduledAt);
                    return (
                      <div key={sess.id} style={{
                        padding: 20, borderRadius: 20,
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        display: 'flex', flexDirection: 'column', gap: 12,
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                          <div>
                            <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{sess.title}</h4>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                              <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: 'rgba(99,102,241,0.1)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.2)' }}>
                                {sess.domain}
                              </span>
                              <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.05)', color: '#9ca3af' }}>
                                {sess.difficulty}
                              </span>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => handleDelete(sess.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4b5563', padding: 4 }}
                            onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                            onMouseLeave={e => e.currentTarget.style.color = '#4b5563'}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>

                        {sess.notes && (
                          <p style={{ margin: 0, fontSize: 12, color: '#6b7280', lineHeight: 1.5, background: 'rgba(255,255,255,0.01)', padding: 10, borderRadius: 8 }}>
                            {sess.notes}
                          </p>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                          <span style={{ fontSize: 11, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Calendar size={12} />
                            {scheduledDate.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                          
                          <Countdown targetTime={sess.scheduledAt} />
                        </div>
                      </div>
                    );
                  })}
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
