import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../context/AuthContext';
import { LogOut, User as UserIcon, Shield, Bell, Flame } from 'lucide-react';

export default function Navbar() {
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [streak, setStreak] = useState(0);
  const [showStreakTooltip, setShowStreakTooltip] = useState(false);

  useEffect(() => {
    if (isAuthenticated && !isAdmin) {
      api.get('/streak').then(r => setStreak(r.data?.currentStreak || 0)).catch(() => {});
    }
  }, [isAuthenticated, isAdmin]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActiveSession = location.pathname.includes('/session/') || location.pathname.includes('/round/');

  return (
    <nav className="glass-nav sticky top-0 z-50 w-full px-6 py-4 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-indigo flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <svg className="w-4 h-4 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
            <line x1="12" x2="12" y1="19" y2="22" />
          </svg>
        </div>
        <span className="font-display font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-indigo-400">
          EchoMind <span className="text-indigo-400">AI</span>
        </span>
      </Link>

      {/* Persistent Navigation links */}
      {isAuthenticated && !isAdmin && isActiveSession && (
        <div className="hidden md:flex items-center gap-8">
          <span className="text-xs text-gray-500 font-bold uppercase tracking-wider bg-white/5 border border-white/5 px-4 py-2 rounded-full select-none animate-pulse">
            Active Assessment Mode - Navigation Locked
          </span>
        </div>
      )}



      <div className="flex items-center gap-4">
        {isAuthenticated ? (
          <>
            {/* Streak Badge */}
            {!isAdmin && streak > 0 && (
              <div
                onMouseEnter={() => setShowStreakTooltip(true)}
                onMouseLeave={() => setShowStreakTooltip(false)}
                style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 20, background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(239,68,68,0.1))', border: '1px solid rgba(245,158,11,0.3)', cursor: 'default' }}
              >
                <Flame size={14} color="#f59e0b" />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b' }}>{streak}</span>
                {showStreakTooltip && (
                  <div style={{ position: 'absolute', top: 38, left: '50%', transform: 'translateX(-50%)', background: '#1a1d2e', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, padding: '6px 12px', fontSize: 12, whiteSpace: 'nowrap', color: '#fbbf24', zIndex: 100, boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
                    🔥 {streak}-day streak!
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full">
              {isAdmin ? (
                <Shield className="w-4 h-4 text-indigo-400" />
              ) : (
                <UserIcon className="w-4 h-4 text-gray-400" />
              )}
              <span className="text-sm font-medium">{user.name}</span>
              <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-mono uppercase">
                {isAdmin ? 'Admin' : 'Candidate'}
              </span>
            </div>
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl transition duration-200"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm text-gray-300 hover:text-white px-3 py-2">
              Log In
            </Link>
            <Link
              to="/register"
              className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2 rounded-xl transition duration-200 shadow-lg shadow-indigo-500/20"
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
