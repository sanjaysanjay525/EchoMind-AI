import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { Search, Briefcase, ChevronRight } from 'lucide-react';

export default function RoleSearchPage() {
  const [searchParams] = useSearchParams();
  const flow = searchParams.get('flow') || 'classic';

  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('role'); // role, company, jd
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState('');

  // Debounced search trigger
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchRoles();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  const fetchRoles = async () => {
    setLoading(true);
    setGenerationError('');
    try {
      const res = await api.get(`/roles/search?q=${encodeURIComponent(searchTerm)}`);
      if (res.data && res.data.exactMatches) {
        setRoles(res.data.exactMatches);
        setSuggestion(res.data.suggestion);
      } else {
        setRoles(res.data || []);
        setSuggestion(null);
      }
    } catch (err) {
      console.error("Failed to fetch roles", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateRole = async () => {
    if (!suggestion || !suggestion.query) return;
    setGenerating(true);
    setGenerationError('');
    try {
      const res = await api.post('/roles/generate', { title: suggestion.query });
      const newRole = res.data;
      handleSelectRole(newRole.id);
    } catch (err) {
      console.error("Role generation failed", err);
      setGenerationError(err.response?.data || "Failed to generate role profile. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleSelectRole = (roleId) => {
    navigate(`/config?flow=${flow}&role=${encodeURIComponent(roleId)}`);
  };

  return (
    <div className="min-h-screen bg-darkBg text-white flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
                {flow === 'multi-round' ? 'Start Mock Interview' : 'Start Interview Preparation'}
              </h1>
              <p className="text-gray-400">
                Choose from over 30+ tailored industry roles to configure your custom interview session.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex border-b border-white/5 pb-px gap-6">
              <button
                onClick={() => setActiveTab('role')}
                className={`pb-3 text-sm font-semibold tracking-wide border-b-2 transition duration-200 ${
                  activeTab === 'role'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                Role Based
              </button>
              <button
                disabled
                className="pb-3 text-sm font-semibold tracking-wide text-gray-600 cursor-not-allowed flex items-center gap-2"
              >
                <span>Company Based</span>
                <span className="text-[10px] bg-white/5 text-gray-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Soon
                </span>
              </button>
              <button
                disabled
                className="pb-3 text-sm font-semibold tracking-wide text-gray-600 cursor-not-allowed flex items-center gap-2"
              >
                <span>JD Based</span>
                <span className="text-[10px] bg-white/5 text-gray-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Soon
                </span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative max-w-xl">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                <Search className="w-5 h-5" />
              </span>
              <input
                type="text"
                placeholder="Search for roles (e.g. Software Engineer, Data Analyst)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#15171e] border border-[#232630] rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-indigo-500/50 transition duration-200"
              />
            </div>

            {/* Grid */}
            {generating ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-4 max-w-md mx-auto">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-indigo-400 text-sm font-semibold animate-pulse text-center">
                  Setting up interview questions for this role...
                </p>
              </div>
            ) : loading ? (
              <div className="text-center py-12 text-gray-400 animate-pulse">Loading roles...</div>
            ) : roles.length === 0 ? (
              suggestion && suggestion.available ? (
                <div className="bg-[#15171e] border border-[#232630] rounded-2xl p-8 max-w-2xl mx-auto text-center space-y-6 shadow-xl">
                  <div className="inline-flex p-4 bg-indigo-500/10 text-indigo-400 rounded-full">
                    <Briefcase className="w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-white">We don't have "{suggestion.query}" yet</h3>
                    <p className="text-gray-400 text-sm max-w-md mx-auto leading-relaxed">
                      Generate this role now using AI. We'll outline its category, core keywords, and design dedicated technical interview questions instantly.
                    </p>
                  </div>
                  {generationError && (
                    <p className="text-red-400 text-xs font-semibold">{generationError}</p>
                  )}
                  <div>
                    <button
                      onClick={handleGenerateRole}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm px-6 py-3 rounded-xl shadow-lg shadow-indigo-500/20 active:scale-95 transition-all duration-200"
                    >
                      Generate Role
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500 bg-[#15171e]/50 border border-white/5 rounded-2xl">
                  No matching roles found. Try searching another title.
                </div>
              )
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {roles.map((role) => (
                  <div
                    key={role.id}
                    onClick={() => handleSelectRole(role.id)}
                    className="group bg-[#15171e] border border-[#232630] hover:border-indigo-500/40 p-6 rounded-2xl cursor-pointer hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      {/* Badge / Icon */}
                      <div className="flex items-center justify-between">
                        <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
                          <Briefcase className="w-5 h-5" />
                        </div>
                        <div className="flex items-center gap-2">
                          {role.source === 'ai_generated' && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full">
                              AI-generated
                            </span>
                          )}
                          <span className="text-xs font-semibold px-2.5 py-1 bg-white/5 border border-white/5 text-gray-400 rounded-full">
                            {role.category}
                          </span>
                        </div>
                      </div>
                      
                      {/* Details */}
                      <div>
                        <h3 className="font-semibold text-lg text-white group-hover:text-indigo-400 transition-colors duration-200">
                          {role.title}
                        </h3>
                        <p className="text-sm text-gray-400 mt-2 line-clamp-3 leading-relaxed">
                          {role.description}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 space-y-4">
                      {/* Keywords */}
                      <div className="flex flex-wrap gap-1.5">
                        {role.keywords.slice(0, 3).map((kw, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] bg-white/5 text-gray-400 px-2 py-0.5 rounded"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>

                      {/* Call-to-action */}
                      <div className="flex items-center text-xs font-bold text-indigo-400 group-hover:translate-x-1 transition-transform duration-200">
                        <span>Select Role</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
