import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import { 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  Award, 
  X, 
  Compass, 
  Flame, 
  ChevronRight 
} from 'lucide-react';

export default function WeeklyDigestCard() {
  const [digest, setDigest] = useState(null);
  const [dismissed, setDismissed] = useState(true); // default true until check
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDigest = async () => {
      try {
        const res = await api.get('/digest/latest');
        if (res.data) {
          setDigest(res.data);
          
          // Check if already dismissed for this week
          const dismissedKey = `weeklyDigestDismissed_${res.data.weekOf}`;
          const isDismissed = localStorage.getItem(dismissedKey) === 'true';
          setDismissed(isDismissed);
        }
      } catch (err) {
        console.error("Failed to load weekly progress digest", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDigest();
  }, []);

  const handleDismiss = () => {
    if (digest) {
      const dismissedKey = `weeklyDigestDismissed_${digest.weekOf}`;
      localStorage.setItem(dismissedKey, 'true');
      setDismissed(true);
    }
  };

  if (loading || dismissed || !digest) return null;

  const trendPositive = digest.avgScoreTrend >= 0;

  return (
    <div className="glass-card p-6 rounded-3xl border border-indigo-500/20 bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-[#0e1017] relative overflow-hidden transition-all duration-300">
      
      {/* Background glow highlights */}
      <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none" />

      {/* Dismiss Button */}
      <button 
        onClick={handleDismiss}
        className="absolute top-4 right-4 p-1.5 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition"
      >
        <X size={14} />
      </button>

      <div className="flex flex-col gap-4">
        {/* Title row */}
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400">
            <Sparkles size={16} className="animate-pulse" />
          </div>
          <div>
            <span className="text-xs text-indigo-400 font-bold uppercase tracking-widest">Performance Insights</span>
            <h2 className="text-md font-extrabold text-white">Your Weekly Digest</h2>
          </div>
        </div>

        {/* Aggregate metrics grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-b border-white/5 py-4 my-1">
          
          {/* Sessions Completed */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-indigo-400 shrink-0">
              <Award size={18} />
            </div>
            <div>
              <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Practice Sessions</div>
              <div className="text-md font-extrabold text-white mt-0.5">{digest.sessionsCompleted} completed</div>
            </div>
          </div>

          {/* Average Score Trend */}
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              trendPositive ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-pink-500/10 border border-pink-500/20 text-pink-400'
            }`}>
              {trendPositive ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
            </div>
            <div>
              <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Avg Score Trend</div>
              <div className={`text-md font-extrabold mt-0.5 ${trendPositive ? 'text-emerald-400' : 'text-pink-400'}`}>
                {trendPositive ? '+' : ''}{digest.avgScoreTrend}/10 WoW
              </div>
            </div>
          </div>

          {/* Flashcard Streak */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <Flame size={18} />
            </div>
            <div>
              <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Revision Streak</div>
              <div className="text-md font-extrabold text-white mt-0.5">{digest.flashcardStreak} day streak</div>
            </div>
          </div>

        </div>

        {/* Weak competencies focus areas */}
        <div className="flex items-center gap-3 flex-wrap text-sm text-gray-300">
          <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold uppercase tracking-wider shrink-0">
            <Compass size={14} />
            <span>Target Weaknesses:</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {digest.weakestCompetencies?.map(tag => (
              <span 
                key={tag} 
                className="text-xs bg-white/5 border border-white/5 hover:border-indigo-500/30 px-3 py-1 rounded-full text-gray-300 transition"
              >
                {tag.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </span>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
