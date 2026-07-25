import React, { useState, useEffect, useRef } from 'react';
import { Timer, AlertTriangle } from 'lucide-react';

export default function TimerBar({ seconds, onTimeout, warningAt = 10 }) {
  const [remaining, setRemaining] = useState(seconds);
  const intervalRef = useRef(null);

  useEffect(() => {
    setRemaining(seconds);
  }, [seconds]);

  useEffect(() => {
    if (remaining <= 0) {
      clearInterval(intervalRef.current);
      if (onTimeout) onTimeout();
      return;
    }
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          if (onTimeout) onTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [seconds]);

  const pct = Math.max(0, (remaining / seconds) * 100);
  const isWarning = remaining <= warningAt && remaining > 0;
  const isDone = remaining <= 0;

  const barColor = isDone
    ? '#ef4444'
    : isWarning
    ? `linear-gradient(90deg, #f59e0b, #ef4444)`
    : `linear-gradient(90deg, #6366f1, #8b5cf6)`;

  const textColor = isDone ? '#ef4444' : isWarning ? '#f59e0b' : '#a5b4fc';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 16px', borderRadius: 12,
      background: isDone ? 'rgba(239,68,68,0.08)' : isWarning ? 'rgba(245,158,11,0.08)' : 'rgba(99,102,241,0.08)',
      border: `1px solid ${isDone ? 'rgba(239,68,68,0.3)' : isWarning ? 'rgba(245,158,11,0.3)' : 'rgba(99,102,241,0.2)'}`,
      transition: 'all 0.3s',
    }}>
      {isWarning || isDone ? (
        <AlertTriangle size={16} color={textColor} style={{ flexShrink: 0, animation: 'pulse 0.5s infinite alternate' }} />
      ) : (
        <Timer size={16} color={textColor} style={{ flexShrink: 0 }} />
      )}

      <div style={{ flex: 1 }}>
        <div style={{
          height: 6, borderRadius: 999,
          background: 'rgba(255,255,255,0.06)',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${pct}%`,
            background: barColor,
            borderRadius: 999,
            transition: 'width 0.8s linear',
            boxShadow: isWarning ? '0 0 8px rgba(245,158,11,0.5)' : isDone ? '0 0 8px rgba(239,68,68,0.5)' : '0 0 8px rgba(99,102,241,0.4)',
          }} />
        </div>
      </div>

      <div style={{
        fontSize: 15, fontWeight: 700, fontFamily: 'monospace',
        color: textColor, minWidth: 40, textAlign: 'right',
        animation: isWarning ? 'pulse 0.5s infinite alternate' : 'none',
      }}>
        {isDone ? '0s' : `${remaining}s`}
      </div>

      <style>{`
        @keyframes pulse { from { opacity: 1; } to { opacity: 0.5; } }
      `}</style>
    </div>
  );
}
