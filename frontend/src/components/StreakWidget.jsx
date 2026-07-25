import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import { Flame, Trophy, Calendar, TrendingUp, Star } from 'lucide-react';

const MILESTONES = [
  { days: 3, label: '3-Day Streak! 🔥', color: '#f59e0b' },
  { days: 7, label: '7-Day Streak! 🏆', color: '#6366f1' },
  { days: 14, label: '2-Week Warrior! ⚡', color: '#8b5cf6' },
  { days: 30, label: '30-Day Legend! 👑', color: '#ec4899' },
];

export default function StreakWidget() {
  const [streak, setStreak] = useState(null);
  const [loading, setLoading] = useState(true);
  const [milestone, setMilestone] = useState(null);

  useEffect(() => {
    api.get('/streak')
      .then(res => {
        setStreak(res.data);
        const hit = MILESTONES.find(m => m.days === res.data.currentStreak);
        if (hit) setMilestone(hit);
      })
      .catch(() => setStreak({ currentStreak: 0, totalInterviews: 0 }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{
      padding: '20px', borderRadius: 16,
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.06)',
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
      <div style={{ flex: 1 }}>
        <div style={{ height: 14, width: '60%', background: 'rgba(255,255,255,0.05)', borderRadius: 6, marginBottom: 6 }} />
        <div style={{ height: 10, width: '40%', background: 'rgba(255,255,255,0.03)', borderRadius: 6 }} />
      </div>
    </div>
  );

  const current = streak?.currentStreak || 0;
  const total = streak?.totalInterviews || 0;
  const flameScale = Math.min(1 + current * 0.05, 1.5);

  return (
    <div style={{
      padding: '20px 24px', borderRadius: 16,
      background: current > 0
        ? 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(239,68,68,0.05))'
        : 'rgba(255,255,255,0.03)',
      border: current > 0 ? '1px solid rgba(245,158,11,0.2)' : '1px solid rgba(255,255,255,0.06)',
      boxShadow: current > 0 ? '0 0 24px rgba(245,158,11,0.08)' : 'none',
    }}>
      {/* Milestone Banner */}
      {milestone && (
        <div style={{
          marginBottom: 12, padding: '6px 12px', borderRadius: 8,
          background: `rgba(${milestone.color === '#f59e0b' ? '245,158,11' : milestone.color === '#6366f1' ? '99,102,241' : '139,92,246'},0.15)`,
          border: `1px solid ${milestone.color}40`,
          fontSize: 12, fontWeight: 600, color: milestone.color, textAlign: 'center',
        }}>
          🎉 {milestone.label} Keep it up!
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Flame */}
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: current > 0 ? 'linear-gradient(135deg, #f59e0b, #ef4444)' : 'rgba(255,255,255,0.05)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: current > 0 ? '0 0 20px rgba(245,158,11,0.4)' : 'none',
          transform: `scale(${flameScale})`,
          transition: 'transform 0.3s',
          flexShrink: 0,
        }}>
          <Flame size={24} color={current > 0 ? 'white' : '#4b5563'} />
        </div>

        {/* Info */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{
              fontSize: 32, fontWeight: 900, lineHeight: 1,
              color: current > 0 ? '#f59e0b' : '#6b7280',
            }}>
              {current}
            </span>
            <span style={{ fontSize: 13, color: '#9ca3af', fontWeight: 500 }}>
              {current === 1 ? 'day streak' : 'day streak'}
            </span>
          </div>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
            {current === 0
              ? 'Complete an interview today to start your streak!'
              : `${total} total interviews completed`}
          </div>
        </div>

        {/* Stats */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>Total</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#a5b4fc' }}>{total}</div>
        </div>
      </div>

      {/* Streak dots - show last 7 days indicators */}
      {current > 0 && (
        <div style={{ marginTop: 14, display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 10, color: '#6b7280', marginRight: 4 }}>Last 7 days</span>
          {Array.from({ length: 7 }).map((_, i) => {
            const active = i >= 7 - Math.min(current, 7);
            return (
              <div key={i} style={{
                width: 22, height: 22, borderRadius: 6,
                background: active ? 'linear-gradient(135deg, #f59e0b, #ef4444)' : 'rgba(255,255,255,0.05)',
                border: active ? '1px solid rgba(245,158,11,0.4)' : '1px solid rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: active ? '0 0 8px rgba(245,158,11,0.3)' : 'none',
                transition: 'all 0.2s',
              }}>
                {active && <Flame size={10} color="white" />}
              </div>
            );
          })}
        </div>
      )}

      {/* Next milestone hint */}
      {current > 0 && (
        (() => {
          const next = MILESTONES.find(m => m.days > current);
          if (!next) return null;
          const daysLeft = next.days - current;
          return (
            <div style={{ marginTop: 10, fontSize: 11, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4 }}>
              <TrendingUp size={11} color="#6b7280" />
              {daysLeft} more day{daysLeft !== 1 ? 's' : ''} to "{next.label}"
            </div>
          );
        })()
      )}
    </div>
  );
}
