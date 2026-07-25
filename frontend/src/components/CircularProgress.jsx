import React from 'react';

export default function CircularProgress({ value, size = 100, strokeWidth = 8, title }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  // Determine score color
  const getColor = (val) => {
    if (val >= 85) return 'stroke-indigo-500';
    if (val >= 70) return 'stroke-purple-500';
    return 'stroke-pink-500';
  };

  const getTextColor = (val) => {
    if (val >= 85) return 'text-indigo-400';
    if (val >= 70) return 'text-purple-400';
    return 'text-pink-400';
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="w-full h-full transform -rotate-90">
          {/* Background circle */}
          <circle
            className="stroke-white/5"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
          {/* Foreground circle */}
          <circle
            className={`transition-all duration-1000 ease-out ${getColor(value)}`}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
        </svg>
        {/* Percentage label */}
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          <span className={`font-display font-bold text-2xl ${getTextColor(value)}`}>
            {value}%
          </span>
        </div>
      </div>
      {title && <span className="text-xs text-gray-400 font-medium tracking-wide uppercase mt-1">{title}</span>}
    </div>
  );
}
