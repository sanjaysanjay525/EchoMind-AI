import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Award, History, User, ShieldAlert, Brain, Video, FileText, Sparkles, Trophy, BarChart2, Calendar, BookOpen, Compass } from 'lucide-react';

export default function Sidebar() {
  const { isAdmin } = useAuth();
  const location = useLocation();

  const links = isAdmin
    ? [
        { to: '/admin', label: 'Admin Dashboard', icon: ShieldAlert },
        { to: '/profile', label: 'Admin Profile', icon: User },
      ]
    : [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/select?flow=classic', label: 'Interview Preparation', icon: Video },
        { to: '/select?flow=multi-round', label: 'Mock Interview', icon: Brain },
        { to: '/history', label: 'Interview History', icon: History },
        { to: '/analytics', label: 'Performance Analytics', icon: BarChart2 },
        { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
        {to: '/scheduler', label: 'Interview Scheduler', icon: Calendar },
        { to: '/notes', label: 'Study Notes Sandbox', icon: BookOpen },
        { to: '/profile', label: 'Profile Settings', icon: User },
      ];

  const toolkitLinks = isAdmin ? [] : [
    { to: '/resume-builder', label: 'Resume Builder Wizard', icon: FileText },
    { to: '/resume-analyzer', label: 'AI Resume Analyzer', icon: Sparkles },
    { to: '/questions', label: 'AI Question Catalog', icon: BookOpen },
    { to: '/star-builder', label: 'STAR Answer Builder', icon: Award },
    { to: '/flashcards', label: 'Interactive Flashcards', icon: Compass }
  ];

  const getIsActive = (to) => {
    const basePath = to.split('?')[0];
    if (location.pathname !== basePath) return false;
    
    const query = to.split('?')[1];
    if (!query) {
      return !location.search.includes('flow=');
    }
    return location.search.includes(query);
  };

  return (
    <aside className="w-64 border-r border-white/5 bg-[#0e1017]/80 backdrop-blur-md p-6 flex flex-col gap-6 shrink-0">
      <div className="flex flex-col gap-2">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Navigation
        </div>
        <nav className="flex flex-col gap-1.5">
          {links.map((link) => {
            const Icon = link.icon;
            const active = getIsActive(link.to);
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition duration-200 text-sm font-medium ${
                  active
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {!isAdmin && (
        <div className="flex flex-col gap-2 pt-4 border-t border-white/5">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Resume Toolkit
          </div>
          <nav className="flex flex-col gap-1.5">
            {toolkitLinks.map((link) => {
              const Icon = link.icon;
              const active = getIsActive(link.to);
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition duration-200 text-sm font-medium ${
                    active
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      )}
    </aside>
  );
}
