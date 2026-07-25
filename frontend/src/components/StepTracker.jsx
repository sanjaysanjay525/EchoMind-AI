import React from 'react';

export default function StepTracker({ steps = [], currentStepIndex = 0 }) {
  return (
    <div className="w-full max-w-3xl mx-auto mb-8 animate-reveal">
      <div className="relative flex items-center justify-between">
        
        {/* Background Track Lines */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-white/5 z-0" />
        
        {steps.map((s, index) => {
          const isActive = index === currentStepIndex;
          const isCompleted = index < currentStepIndex;
          const Icon = s.icon;
          
          let borderStyle = 'border-white/10 bg-darkCard text-gray-500';
          if (isActive) {
            borderStyle = 'border-indigo-500 bg-indigo-500/10 text-indigo-400 ring-4 ring-indigo-500/10';
          } else if (isCompleted) {
            borderStyle = 'border-emerald-500 bg-emerald-500/10 text-emerald-400';
          }

          return (
            <div key={index} className="relative z-10 flex flex-col items-center gap-2">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all duration-300 ${borderStyle}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${
                isActive 
                  ? 'text-indigo-400 font-extrabold' 
                  : isCompleted 
                    ? 'text-emerald-400' 
                    : 'text-gray-500'
              }`}>
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
