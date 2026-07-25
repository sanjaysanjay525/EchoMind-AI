import React from 'react';
import { Brain, Mic, Code, Layers } from 'lucide-react';

const ROUNDS = [
  { id: 'APTITUDE', name: 'Aptitude', icon: Brain, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  { id: 'COMMUNICATION', name: 'Communication', icon: Mic, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  { id: 'CODING', name: 'Coding IDE', icon: Code, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  { id: 'ADVANCED', name: 'System Design', icon: Layers, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' }
];

export default function RoundProgressBar({ currentRound, roundStatuses = {} }) {
  const getStepStatus = (roundId) => {
    // Determine status: ACTIVE, COMPLETED, LOCKED
    if (currentRound === roundId) return 'ACTIVE';
    
    // Check rounds array status in parent state if any
    const status = roundStatuses[roundId];
    if (status === 'COMPLETED') return 'COMPLETED';
    
    // Fallback relative index checking
    const roundOrder = ['APTITUDE', 'COMMUNICATION', 'CODING', 'ADVANCED'];
    const currentIndex = roundOrder.indexOf(currentRound);
    const targetIndex = roundOrder.indexOf(roundId);

    if (targetIndex < currentIndex) return 'COMPLETED';
    return 'LOCKED';
  };

  return (
    <div className="w-full max-w-4xl mx-auto mb-8 animate-reveal">
      <div className="relative flex items-center justify-between">
        
        {/* Background Track Lines */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-white/5 z-0" />
        
        {ROUNDS.map((r, index) => {
          const stepStatus = getStepStatus(r.id);
          const Icon = r.icon;
          
          let borderStyle = 'border-white/10 bg-darkCard text-gray-500';
          if (stepStatus === 'ACTIVE') {
            borderStyle = 'border-indigo-500 bg-indigo-500/10 text-indigo-400 ring-4 ring-indigo-500/10';
          } else if (stepStatus === 'COMPLETED') {
            borderStyle = 'border-emerald-500 bg-emerald-500/10 text-emerald-400';
          }

          return (
            <div key={r.id} className="relative z-10 flex flex-col items-center gap-2">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all duration-300 ${borderStyle}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={`text-[11px] font-bold uppercase tracking-wider ${
                stepStatus === 'ACTIVE' 
                  ? 'text-indigo-400 font-extrabold' 
                  : stepStatus === 'COMPLETED' 
                    ? 'text-emerald-400' 
                    : 'text-gray-500'
              }`}>
                {r.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
