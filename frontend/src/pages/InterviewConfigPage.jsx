import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link, useLocation } from 'react-router-dom';
import { api } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { Shield, Sparkles, Video, Mic, Volume2, Clock, CheckSquare, Upload, X, HelpCircle, ArrowLeft, AlertCircle, ChevronDown, Search } from 'lucide-react';

const PERSONAS = [
  {
    id: 'Friendly HR',
    nameEn: 'Friendly HR',
    nameTh: 'ทรัพยากรบุคคลผู้เป็นมิตร',
    descEn: 'Warm, conversational, empathetic, and positive. Focuses on behavior, collaboration, and foundational domain concepts.',
    descTh: 'ให้คำแนะนำที่อบอุ่น มุ่งเน้นไปที่ทัศนคติ การทำงานร่วมกับผู้อื่น และซอฟต์สกิล',
    icon: Volume2,
    color: 'from-amber-400 to-orange-500',
    bgColor: 'bg-amber-500/10 border-amber-500/20 text-amber-400'
  },
  {
    id: 'Technical Grillmaster',
    nameEn: 'Technical Grillmaster',
    nameTh: 'ผู้สัมภาษณ์เชิงลึกสายแข็ง',
    descEn: 'Intense, blunt, and critical. Probes deeply on optimizations, edge cases, scalability, and code correctness.',
    descTh: 'เจาะลึกคำถามทางเทคนิค ระบบ และขีดจำกัด ไม่พูดคุยเล่น เน้นความถูกต้องสูงสุด',
    icon: Sparkles,
    color: 'from-red-500 to-rose-600',
    bgColor: 'bg-red-500/10 border-red-500/20 text-red-400'
  },
  {
    id: 'Skeptical Panel',
    nameEn: 'Skeptical Panel',
    nameTh: 'คณะกรรมการผู้ตั้งข้อสังเกต',
    descEn: 'Formal, analytical, and challenging. Frequently questions architectural scaling and choices, demanding justifications.',
    descTh: 'เป็นทางการ มุ่งเน้นเหตุผลในการออกแบบ การขยายระบบ และการเปรียบเทียบข้อดีข้อเสีย',
    icon: Shield,
    color: 'from-purple-500 to-indigo-600',
    bgColor: 'bg-purple-500/10 border-purple-500/20 text-purple-400'
  }
];

const CODING_LANGUAGES = ['JavaScript', 'Python', 'Java', 'C++', 'TypeScript', 'Go', 'C'];

const ROUND_INFOS = {
  APTITUDE: 'Quantitative and logical reasoning questions to test problem-solving fundamentals.',
  COMMUNICATION: 'Verbal situational HR questions scored on STAR method adherence and confidence.',
  CODING: 'Programming and algorithm questions with compiler and editor, relevant to your expertise.',
  ADVANCED: 'System architecture scaling and design challenges with freehand drawing canvas.'
};

export default function InterviewConfigPage() {
  const [searchParams] = useSearchParams();
  const flow = searchParams.get('flow') || 'classic';
  const role = searchParams.get('role') || 'Software Engineer';

  const navigate = useNavigate();
  const location = useLocation();

  // General Settings
  const [selectedPersona, setSelectedPersona] = useState('Friendly HR');
  const [selectedGender, setSelectedGender] = useState('female');
  const [duration, setDuration] = useState(30); // 5, 15, 30
  const [difficulty, setDifficulty] = useState('PROFESSIONAL'); // BEGINNER / PROFESSIONAL
  const [codingLanguage, setCodingLanguage] = useState('');
  
  // Practice Flags
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [timedMode, setTimedMode] = useState(false);
  const [questionTimerSeconds, setQuestionTimerSeconds] = useState(60);

  // Rounds Config
  const [enabledRounds, setEnabledRounds] = useState(['APTITUDE', 'COMMUNICATION', 'CODING', 'ADVANCED']);

  // Resume Upload & Keywords
  const [file, setFile] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [resumeKeywords, setResumeKeywords] = useState(location.state?.preloadedKeywords || []);
  const [resumeProfile, setResumeProfile] = useState(null);
  const [customKeywordInput, setCustomKeywordInput] = useState('');

  // Dropdown states for language select
  const [langSearch, setLangSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [validationError, setValidationError] = useState('');

  const handleToggleRound = (roundCode) => {
    if (enabledRounds.includes(roundCode)) {
      if (enabledRounds.length > 1) {
        setEnabledRounds(prev => prev.filter(r => r !== roundCode));
      }
    } else {
      setEnabledRounds(prev => [...prev, roundCode]);
    }
  };

  const handleFileUpload = async (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setParsing(true);

    const formData = new FormData();
    formData.append('file', uploadedFile);

    try {
      const res = await api.post('/resumes/parse-profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setResumeProfile(res.data);
      const keywords = [
        ...(res.data.technicalSkills || []),
        ...(res.data.tools || [])
      ].slice(0, 10);
      setResumeKeywords(keywords);
    } catch (err) {
      console.error("Resume parsing failed", err);
      alert("Failed to parse resume file. You can enter keywords/skills manually.");
    } finally {
      setParsing(false);
    }
  };

  const handleAddKeyword = (e) => {
    if (e.key === 'Enter' || e.type === 'blur') {
      e.preventDefault();
      const val = customKeywordInput.trim();
      if (val && !resumeKeywords.includes(val)) {
        setResumeKeywords(prev => [...prev, val]);
        setCustomKeywordInput('');
      }
    }
  };

  const handleRemoveKeyword = (kw) => {
    setResumeKeywords(prev => prev.filter(k => k !== kw));
  };

  const handleStartInterview = async () => {
    // Form validations
    if (flow === 'multi-round' && enabledRounds.includes('CODING') && !codingLanguage) {
      setValidationError("Select Coding Language is required when Coding round is enabled.");
      return;
    }
    setValidationError('');

    try {
      // Save timed test mode options to local storage
      localStorage.setItem('timedModeEnabled', JSON.stringify(timedMode));
      localStorage.setItem('timedModeSeconds', JSON.stringify(questionTimerSeconds));

      if (flow === 'multi-round') {
        const res = await api.post('/sessions/start', {
          careerPath: role,
          personaId: selectedPersona,
          enabledRounds: enabledRounds,
          durationMinutes: duration,
          audioEnabled: audioEnabled,
          videoEnabled: videoEnabled,
          resumeKeywords: resumeKeywords,
          difficultyLevel: difficulty,
          codingLanguage: codingLanguage,
          resumeProfile: resumeProfile
        });
        const session = res.data;
        const firstRound = session.currentRound.toLowerCase();
        navigate(`/interview/${session.id}/round/${firstRound}`);
      } else {
        // Classic Preparation Single Session
        const res = await api.post('/interviews/start', {
          domain: role,
          difficulty: difficulty === 'BEGINNER' ? 'Junior' : 'Mid',
          mode: 'comprehensive',
          interviewerGender: selectedGender,
          officeSetting: 'modern_office',
          language: 'en',
          practiceMode: true,
          interviewerPersona: selectedPersona
        });
        const interview = res.data;
        navigate(`/session/${interview.id}`);
      }
    } catch (err) {
      console.error("Failed to start session", err);
      alert("Failed to initialize session. Please check connection and try again.");
    }
  };

  const filteredLanguages = CODING_LANGUAGES.filter(lang => 
    lang.toLowerCase().includes(langSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-darkBg text-white flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-8">
            
            {/* Header & Back Button */}
            <div className="flex items-center gap-4">
              <Link
                to={`/select?flow=${flow}`}
                className="p-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl transition duration-150"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full">
                    {role}
                  </span>
                  <Link to={`/select?flow=${flow}`} className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold hover:underline">
                    Change Role
                  </Link>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-white mt-1">Configure Interview Session</h1>
              </div>
            </div>

            {/* Config Form Cards */}
            <div className="space-y-6">
              
              {/* Optional Resume Upload */}
              <div className="bg-[#15171e] border border-[#232630] rounded-2xl p-6 space-y-4">
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-white text-base">Personalize with Resume (Optional)</h3>
                      <p className="text-gray-400 text-xs mt-1">
                        Upload your resume to tailor AI generated interview questions to your background.
                      </p>
                    </div>
                    <Link
                      to="/resume-builder"
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-bold hover:underline"
                    >
                      Don't have a resume? Build one
                    </Link>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-[#232630] hover:border-indigo-500/40 w-full sm:w-64 h-32 rounded-xl cursor-pointer transition duration-150 p-4 text-center">
                    <Upload className="w-6 h-6 text-gray-400 mb-2" />
                    <span className="text-xs font-semibold text-white">
                      {file ? file.name : 'Upload PDF or DOCX'}
                    </span>
                    <span className="text-[10px] text-gray-500 mt-1">Max size 5MB</span>
                    <input
                      type="file"
                      accept=".pdf,.docx"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  {/* Extraction state */}
                  {parsing && (
                    <div className="text-indigo-400 text-xs font-semibold animate-pulse">
                      Analyzing skills and extracting keywords...
                    </div>
                  )}

                  {/* Chip tags list */}
                  {!parsing && resumeKeywords.length > 0 && (
                    <div className="flex-1 space-y-3">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                        Extracted Core Skills / Focus Areas:
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {resumeKeywords.map((kw, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 text-xs bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full border border-indigo-500/20 font-medium"
                          >
                            <span>{kw}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveKeyword(kw)}
                              className="hover:text-red-400 transition"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Custom Manual Skills Input */}
                <div className="max-w-md pt-2">
                  <label className="text-xs font-bold text-gray-400 block mb-2">Add Manual Skill / Framework:</label>
                  <input
                    type="text"
                    placeholder="Type skill (e.g. Docker, Python) and press Enter"
                    value={customKeywordInput}
                    onChange={(e) => setCustomKeywordInput(e.target.value)}
                    onKeyDown={handleAddKeyword}
                    onBlur={handleAddKeyword}
                    className="w-full bg-[#0b0c10] border border-[#232630] rounded-xl px-4 py-2.5 text-white placeholder-gray-600 text-xs focus:outline-none focus:border-indigo-500/50 transition duration-150"
                  />
                </div>
              </div>

              {/* Configure Assessment Pipeline Rounds */}
              {flow === 'multi-round' && (
                <div className="bg-[#15171e] border border-[#232630] rounded-2xl p-6 space-y-6">
                  <div>
                    <h3 className="font-semibold text-white text-base">Select Interview Rounds</h3>
                    <p className="text-gray-400 text-xs mt-1">
                      Toggle the rounds to include in your mock evaluation loop. At least one round must be enabled.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { code: 'APTITUDE', label: 'Warm Up', desc: 'Quantitative & logic questions' },
                      { code: 'COMMUNICATION', label: 'Behavioral', desc: 'Situational HR STAR questions' },
                      { code: 'CODING', label: 'Coding', desc: 'Interactive algorithms testing' },
                      { code: 'ADVANCED', label: 'Role Related', desc: 'System design problems' }
                    ].map((r) => {
                      const active = enabledRounds.includes(r.code);
                      return (
                        <div
                          key={r.code}
                          onClick={() => handleToggleRound(r.code)}
                          className={`p-4 rounded-xl border cursor-pointer transition duration-150 flex flex-col gap-2 ${
                            active
                              ? 'border-indigo-500 bg-indigo-500/10 text-white'
                              : 'border-white/5 bg-[#0b0c10]/40 text-gray-400 hover:border-white/15'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm">{r.label}</span>
                            <CheckSquare className={`w-4 h-4 ${active ? 'text-indigo-400' : 'text-gray-600'}`} />
                          </div>
                          <span className="text-[10px] text-gray-500 leading-normal">{r.desc}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Contextual Banner showing active round summaries */}
                  <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-4 text-xs text-indigo-300 space-y-1.5">
                    <span className="font-bold block text-white">Assessment Pipeline Summary:</span>
                    {enabledRounds.map(r => (
                      <div key={r} className="flex gap-2">
                        <span className="font-bold uppercase text-[9px] bg-indigo-500/10 px-1.5 py-0.5 rounded text-indigo-400 self-start">
                          {r === 'APTITUDE' ? 'Warm Up' : r === 'COMMUNICATION' ? 'Behavioral' : r === 'CODING' ? 'Coding' : 'Role Related'}
                        </span>
                        <span>{ROUND_INFOS[r]}</span>
                      </div>
                    ))}
                  </div>

                  {/* Difficulty level selection */}
                  <div className="pt-2">
                    <label className="text-xs font-bold text-gray-400 block mb-2">Difficulty Level:</label>
                    <div className="flex gap-3">
                      {['BEGINNER', 'PROFESSIONAL'].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setDifficulty(d)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold border transition duration-150 ${
                            difficulty === d
                              ? 'bg-indigo-600 border-indigo-500 text-white'
                              : 'bg-[#0b0c10] border-white/5 text-gray-400 hover:border-white/15'
                          }`}
                        >
                          {d === 'BEGINNER' ? 'Beginner' : 'Professional'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Coding Language selection (reveals only if Coding round is enabled) */}
                  {enabledRounds.includes('CODING') && (
                    <div className="pt-2 max-w-sm relative">
                      <label className="text-xs font-bold text-gray-400 block mb-2">Select Coding Language:</label>
                      <div
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="bg-[#0b0c10] border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white cursor-pointer flex justify-between items-center"
                      >
                        <span>{codingLanguage || 'Choose Language...'}</span>
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      </div>

                      {dropdownOpen && (
                        <div className="absolute top-[72px] left-0 right-0 bg-[#15171e] border border-[#232630] rounded-xl p-2 z-50 space-y-2 max-h-56 overflow-y-auto">
                          <div className="flex items-center gap-2 bg-[#0b0c10] px-3 py-1.5 rounded-lg border border-[#232630]">
                            <Search className="w-3.5 h-3.5 text-gray-500" />
                            <input
                              type="text"
                              placeholder="Search language..."
                              value={langSearch}
                              onChange={(e) => setLangSearch(e.target.value)}
                              className="bg-transparent border-none text-white text-xs w-full focus:outline-none placeholder-gray-600"
                            />
                          </div>
                          <div className="space-y-1">
                            {filteredLanguages.map((lang) => (
                              <div
                                key={lang}
                                onClick={() => {
                                  setCodingLanguage(lang);
                                  setDropdownOpen(false);
                                  setLangSearch('');
                                }}
                                className="px-3 py-2 hover:bg-white/5 rounded-lg text-xs cursor-pointer text-gray-300 hover:text-white"
                              >
                                {lang}
                              </div>
                            ))}
                            {filteredLanguages.length === 0 && (
                              <div className="text-center text-[10px] text-gray-500 py-2">No languages match</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              )}

              {/* Assessment Duration Settings */}
              {flow === 'multi-round' && (
                <div className="bg-[#15171e] border border-[#232630] rounded-2xl p-6 space-y-4">
                  <div>
                    <h3 className="font-semibold text-white text-base">Session Target Duration</h3>
                    <p className="text-gray-400 text-xs mt-1">
                      Choose duration. Scaling scales the list of questions dynamically.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-4 max-w-md bg-[#0b0c10]/40 p-1.5 rounded-xl border border-white/5">
                    {[
                      { val: 5, label: '5 Mins', cap: 'Warmup only' },
                      { val: 15, label: '15 Mins', cap: 'Rapid testing' },
                      { val: 30, label: '30 Mins', cap: 'Full assessment' }
                    ].map((d) => (
                      <button
                        key={d.val}
                        type="button"
                        onClick={() => setDuration(d.val)}
                        className={`py-3 rounded-lg flex flex-col items-center justify-center gap-1 transition ${
                          duration === d.val
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        <span className="font-bold text-xs">{d.label}</span>
                        <span className="text-[9px] opacity-60 font-medium">{d.cap}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Select AI Persona */}
              <div className="bg-[#15171e] border border-[#232630] rounded-2xl p-6 space-y-4">
                <div>
                  <h3 className="font-semibold text-white text-base">Select Interviewer Persona</h3>
                  <p className="text-gray-400 text-xs mt-1">
                    Choose the virtual AI recruiter persona you want to be assessed by.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {PERSONAS.map((p) => {
                    const Icon = p.icon;
                    const active = selectedPersona === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => setSelectedPersona(p.id)}
                        className={`p-5 rounded-xl border cursor-pointer flex flex-col gap-3 transition duration-150 relative overflow-hidden ${
                          active
                            ? 'border-indigo-500 bg-indigo-500/10'
                            : 'border-white/5 bg-[#0b0c10]/40 hover:border-white/15'
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${p.bgColor}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-white">{p.nameEn}</h4>
                          <p className="text-gray-400 text-[11px] leading-relaxed mt-1">{p.descEn}</p>
                        </div>

                        {/* Tone Selector if selected */}
                        {active && (
                          <div className="mt-auto pt-3 border-t border-white/5 flex items-center justify-between">
                            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Voice Tone:</span>
                            <div className="flex gap-1.5">
                              {['female', 'male'].map((g) => (
                                <button
                                  key={g}
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setSelectedGender(g); }}
                                  className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase transition ${
                                    selectedGender === g
                                      ? 'bg-indigo-600 text-white'
                                      : 'bg-white/5 text-gray-400 hover:text-white'
                                  }`}
                                >
                                  {g}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Practice / Hardware & Timed Mode Settings */}
              <div className="bg-[#15171e] border border-[#232630] rounded-2xl p-6 space-y-6">
                <div>
                  <h3 className="font-semibold text-white text-base">Practice & Mode Settings</h3>
                  <p className="text-gray-400 text-xs mt-1">
                    Configure hardware preferences and simulated testing modes.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-6">
                    <label className="flex items-center gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={videoEnabled}
                        onChange={(e) => setVideoEnabled(e.target.checked)}
                        className="w-4.5 h-4.5 rounded text-indigo-600 bg-[#0b0c10] border-[#232630] focus:ring-indigo-500/20"
                      />
                      <div className="flex items-center gap-2">
                        <Video className="w-4 h-4 text-indigo-400" />
                        <span className="text-xs font-semibold text-white">Enable Video (Engagement & Face Mesh tracking)</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={audioEnabled}
                        onChange={(e) => setAudioEnabled(e.target.checked)}
                        className="w-4.5 h-4.5 rounded text-indigo-600 bg-[#0b0c10] border-[#232630] focus:ring-indigo-500/20"
                      />
                      <div className="flex items-center gap-2">
                        <Mic className="w-4 h-4 text-indigo-400" />
                        <span className="text-xs font-semibold text-white">Enable Audio (Voice answers transcription)</span>
                      </div>
                    </label>
                  </div>

                  <div className="border-t border-white/5 pt-4 flex flex-col gap-3">
                    <label className="flex items-center gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={timedMode}
                        onChange={(e) => setTimedMode(e.target.checked)}
                        className="w-4.5 h-4.5 rounded text-indigo-600 bg-[#0b0c10] border-[#232630] focus:ring-indigo-500/20"
                      />
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-semibold text-white">Enable Timed Mock Test Mode (Pressure simulation)</span>
                      </div>
                    </label>

                    {timedMode && (
                      <div className="flex items-center gap-3 pl-7 animate-reveal">
                        <span className="text-xs text-gray-400">Limit per question:</span>
                        <div className="flex gap-2">
                          {[30, 60, 90].map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setQuestionTimerSeconds(s)}
                              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                                questionTimerSeconds === s
                                  ? 'bg-amber-500 text-black'
                                  : 'bg-white/5 text-gray-400 hover:text-white'
                              }`}
                            >
                              {s} Seconds
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-[10px] text-gray-500 mt-2 font-medium">
                  Note: Audio and video records will be deleted automatically after 30 mins.
                </p>
              </div>

            </div>

            {/* Validation Banner */}
            {validationError && (
              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-3 text-red-400 text-xs font-semibold animate-reveal">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span>{validationError}</span>
              </div>
            )}

            {/* Launch CTA */}
            <div className="pt-4 flex items-center justify-end">
              <button
                type="button"
                onClick={handleStartInterview}
                className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm shadow-xl shadow-indigo-500/20 transition duration-150 flex items-center gap-2"
              >
                <span>Start Assessment</span>
                <Sparkles className="w-4 h-4" />
              </button>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
