import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Loader from '../components/Loader';
import { Trophy, Medal, Crown, Star, Award, ChevronRight } from 'lucide-react';

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserRank, setCurrentUserRank] = useState(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await api.get('/leaderboard');
        setLeaderboard(res.data);
        
        // Find current user's rank if present
        if (user && res.data) {
          const userIndex = res.data.findIndex(entry => entry.emailMasked && entry.name === user.name);
          if (userIndex !== -1) {
            setCurrentUserRank(userIndex + 1);
          }
        }
      } catch (err) {
        console.error("Error fetching leaderboard", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [user]);

  const getBadgeStyle = (badge) => {
    switch (badge) {
      case 'Elite':
        return { background: 'linear-gradient(135deg, #fbbf24, #d97706)', color: 'white' };
      case 'Expert':
        return { background: 'linear-gradient(135deg, #a78bfa, #7c3aed)', color: 'white' };
      case 'Advanced':
        return { background: 'linear-gradient(135deg, #60a5fa, #2563eb)', color: 'white' };
      case 'Proficient':
        return { background: 'linear-gradient(135deg, #34d399, #059669)', color: 'white' };
      default:
        return { background: 'rgba(255,255,255,0.1)', color: '#9ca3af' };
    }
  };

  const podium = leaderboard.slice(0, 3);
  const tableData = leaderboard.slice(3);

  // Re-order podium as [2nd, 1st, 3rd] for layout
  const orderedPodium = [];
  if (podium[1]) orderedPodium.push({ ...podium[1], originalRank: 2 });
  if (podium[0]) orderedPodium.push({ ...podium[0], originalRank: 1 });
  if (podium[2]) orderedPodium.push({ ...podium[2], originalRank: 3 });

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#0e1017', color: 'white', fontFamily: 'system-ui, sans-serif' }}>
        <Navbar />
        <div style={{ display: 'flex', flex: 1 }}>
          <Sidebar />
          <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Loader text="Loading global rankings..." />
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <div style={{ padding: 10, borderRadius: 12, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
                  <Trophy size={24} color="#f59e0b" />
                </div>
                <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, background: 'linear-gradient(135deg, white, #a5b4fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Global Leaderboard
                </h1>
              </div>
              <p style={{ margin: 0, color: '#9ca3af', fontSize: 14 }}>Rankings of top candidates based on completed graded mock interviews.</p>
            </div>
            
            {currentUserRank && (
              <div style={{
                padding: '12px 24px', borderRadius: 16,
                background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))',
                border: '1px solid rgba(99,102,241,0.3)',
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <Award size={20} color="#a5b4fc" />
                <div>
                  <div style={{ fontSize: 11, color: '#a5b4fc', fontWeight: 600, textTransform: 'uppercase' }}>Your Current Rank</div>
                  <div style={{ fontSize: 18, fontWeight: 800 }}>Rank #{currentUserRank}</div>
                </div>
              </div>
            )}
          </div>

          {/* Podium Area */}
          {podium.length > 0 && (
            <div style={{
              display: 'flex', justifyContent: 'center', alignItems: 'flex-end',
              gap: 24, marginBottom: 40, flexWrap: 'wrap', padding: '0 20px',
            }}>
              {orderedPodium.map((player) => {
                const isFirst = player.originalRank === 1;
                const isSecond = player.originalRank === 2;
                
                const cardStyle = isFirst
                  ? {
                      background: 'linear-gradient(135deg, #1e1b4b, #311042)',
                      border: '1px solid rgba(139,92,246,0.4)',
                      height: 320, width: 260,
                      boxShadow: '0 20px 40px rgba(139,92,246,0.15)',
                    }
                  : isSecond
                  ? {
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      height: 280, width: 230,
                    }
                  : {
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      height: 260, width: 220,
                    };

                return (
                  <div
                    key={player.name}
                    style={{
                      borderRadius: 24, padding: 24,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      textAlign: 'center', position: 'relative',
                      ...cardStyle,
                    }}
                  >
                    {/* Rank Crown/Badge */}
                    <div style={{
                      position: 'absolute', top: -20,
                      width: 40, height: 40, borderRadius: '50%',
                      background: isFirst ? '#f59e0b' : isSecond ? '#9ca3af' : '#b45309',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                    }}>
                      {isFirst ? <Crown size={20} color="white" /> : <Medal size={20} color="white" />}
                    </div>

                    <div style={{
                      width: isFirst ? 72 : 60, height: isFirst ? 72 : 60,
                      borderRadius: '50%', marginBottom: 16,
                      background: isFirst ? 'linear-gradient(135deg, #f59e0b, #ef4444)' : 'linear-gradient(135deg, #4b5563, #1f2937)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: isFirst ? 24 : 20, color: 'white',
                    }}>
                      {player.name.substring(0, 2).toUpperCase()}
                    </div>

                    <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4, width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {player.name}
                    </div>
                    
                    <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 12 }}>
                      {player.emailMasked || '***@gmail.com'}
                    </div>

                    <div style={{ fontSize: 32, fontWeight: 900, color: isFirst ? '#fbbf24' : 'white', marginBottom: 4 }}>
                      {player.avgScore}%
                    </div>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 16 }}>
                      Average Score
                    </div>

                    <div style={{
                      padding: '4px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                      textTransform: 'uppercase', tracking: 1,
                      ...getBadgeStyle(player.badge),
                    }}>
                      {player.badge}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Leaderboard Table */}
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 20,
            overflow: 'hidden',
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Rankings list</h3>
            </div>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <th style={{ padding: '16px 24px', color: '#6b7280', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>Rank</th>
                    <th style={{ padding: '16px 24px', color: '#6b7280', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>Candidate</th>
                    <th style={{ padding: '16px 24px', color: '#6b7280', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>Score</th>
                    <th style={{ padding: '16px 24px', color: '#6b7280', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>Interviews</th>
                    <th style={{ padding: '16px 24px', color: '#6b7280', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>Badge</th>
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((player, idx) => {
                    const actualRank = idx + 4;
                    const isCurrentUser = user && player.name === user.name;
                    return (
                      <tr
                        key={player.name}
                        style={{
                          borderBottom: '1px solid rgba(255,255,255,0.04)',
                          background: isCurrentUser ? 'rgba(99,102,241,0.08)' : 'transparent',
                          transition: 'background 0.2s',
                        }}
                      >
                        <td style={{ padding: '16px 24px', fontWeight: 700, color: '#9ca3af' }}>
                          #{actualRank}
                        </td>
                        <td style={{ padding: '16px 24px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{
                              width: 32, height: 32, borderRadius: '50%',
                              background: 'rgba(255,255,255,0.05)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 12, fontWeight: 700, color: '#a5b4fc',
                            }}>
                              {player.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: 'white' }}>{player.name}</div>
                              <div style={{ fontSize: 11, color: '#6b7280' }}>{player.emailMasked}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '16px 24px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontWeight: 800, fontSize: 14, minWidth: 32 }}>{player.avgScore}%</span>
                            <div style={{ width: 100, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${player.avgScore}%`, background: '#6366f1' }} />
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '16px 24px', fontWeight: 600, color: '#9ca3af' }}>
                          {player.totalInterviews}
                        </td>
                        <td style={{ padding: '16px 24px' }}>
                          <span style={{
                            padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                            ...getBadgeStyle(player.badge),
                          }}>
                            {player.badge}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
