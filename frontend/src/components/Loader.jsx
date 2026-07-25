import React from 'react';

export default function Loader({ size = 'md', text }) {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3',
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 gap-4">
      <div className={`animate-spin rounded-full border-t-indigo-500 border-r-indigo-500/10 border-b-indigo-500/10 border-l-indigo-500/10 ${sizeClasses[size] || sizeClasses.md}`}></div>
      {text && <span className="text-sm text-gray-400 font-medium animate-pulse">{text}</span>}
    </div>
  );
}
