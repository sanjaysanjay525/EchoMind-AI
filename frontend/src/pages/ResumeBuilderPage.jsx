import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import StepTracker from '../components/StepTracker';
import { Layout, FileText, Settings, Eye, CheckCircle2, Upload, AlertCircle, Plus, Trash2, Wand2, Download, Play, ArrowRight, ArrowLeft } from 'lucide-react';

const STEPS = [
  { label: 'Option', icon: Settings },
  { label: 'Template', icon: Layout },
  { label: 'Build', icon: FileText },
  { label: 'Preview', icon: Eye }
];

const TEMPLATES = [
  { id: 'Classic', name: 'Classic Executive', desc: 'Formal serif alignment, perfect for corporate and management.' },
  { id: 'Modern', name: 'Modern Minimalist', desc: 'Clean sans-serif design with a tinted indigo left border.' },
  { id: 'Minimal', name: 'Elegant Minimal', desc: 'Minimal margins, gray accents, focus on clean whitespace.' },
  { id: 'Technical', name: 'Developer Pro', desc: 'Monospace sub-headers, compact sections, tags for technologies.' }
];

export default function ResumeBuilderPage() {
  const navigate = useNavigate();

  // Wizard States
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [option, setOption] = useState(''); // 'scratch' or 'upload'
  const [templateId, setTemplateId] = useState('Classic');
  const [loading, setLoading] = useState(false);

  // Resume Form Sections
  const [contact, setContact] = useState({ name: '', email: '', phone: '', location: '', website: '' });
  const [summary, setSummary] = useState('');
  const [experience, setExperience] = useState([]);
  const [education, setEducation] = useState([]);
  const [skills, setSkills] = useState([]);
  const [projects, setProjects] = useState([]);

  // File parsing state
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // AI helper states
  const [aiSuggestions, setAiSuggestions] = useState({}); // { fieldPath: suggestionString }
  const [improvingField, setImprovingField] = useState(''); // active field path being improved

  // Load existing draft on mount
  useEffect(() => {
    const loadDraft = async () => {
      try {
        const res = await api.get('/resumes/draft');
        if (res.data) {
          setTemplateId(res.data.templateId || 'Classic');
          const secs = res.data.sections || {};
          if (secs.contact) setContact(secs.contact);
          if (secs.summary) setSummary(secs.summary);
          if (secs.experience) setExperience(secs.experience);
          if (secs.education) setEducation(secs.education);
          if (secs.skills) setSkills(secs.skills);
          if (secs.projects) setProjects(secs.projects);
        }
      } catch (err) {
        console.error("Failed to load draft resume", err);
      }
    };
    loadDraft();
  }, []);

  const handleAutosave = async () => {
    try {
      const sections = { contact, summary, experience, education, skills, projects };
      await api.post('/resumes/draft', {
        templateId,
        sections,
        status: 'DRAFT'
      });
    } catch (err) {
      console.error("Autosave draft failed", err);
    }
  };

  const handleNextStep = async () => {
    await handleAutosave();
    setCurrentStepIndex(prev => Math.min(prev + 1, STEPS.length - 1));
  };

  const handlePrevStep = () => {
    setCurrentStepIndex(prev => Math.max(prev - 1, 0));
  };

  // Upload and Enhance handler
  const handleResumeUpload = async (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setUploading(true);

    const formData = new FormData();
    formData.append('file', uploadedFile);

    try {
      const res = await api.post('/resumes/parse-structured', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const data = res.data;
      if (data.contact) setContact(data.contact);
      if (data.summary) setSummary(data.summary);
      if (data.experience) setExperience(data.experience);
      if (data.education) setEducation(data.education);
      if (data.skills) setSkills(data.skills);
      if (data.projects) setProjects(data.projects);

      // Advance directly to templates/forms
      setCurrentStepIndex(2);
    } catch (err) {
      console.error("Structured parsing failed", err);
      alert("Failed to extract resume details automatically. Please complete details manually.");
      setCurrentStepIndex(2); // fallback to manual edit
    } finally {
      setUploading(false);
    }
  };

  // AI Phrase Improver
  const handleImproveText = async (fieldPath, text, typeLabel) => {
    if (!text || !text.trim()) return;
    setImprovingField(fieldPath);

    try {
      const res = await api.post('/resumes/draft/improve-section', {
        type: typeLabel,
        text: text
      });
      setAiSuggestions(prev => ({
        ...prev,
        [fieldPath]: res.data.improvedText
      }));
    } catch (err) {
      console.error("AI improvement failed", err);
    } finally {
      setImprovingField('');
    }
  };

  const acceptSuggestion = (fieldPath, setterFn) => {
    const sug = aiSuggestions[fieldPath];
    if (sug) {
      setterFn(sug);
      setAiSuggestions(prev => {
        const next = { ...prev };
        delete next[fieldPath];
        return next;
      });
    }
  };

  const rejectSuggestion = (fieldPath) => {
    setAiSuggestions(prev => {
      const next = { ...prev };
      delete next[fieldPath];
      return next;
    });
  };

  // Helper additions/removals for Experience list items
  const addExperienceItem = () => {
    setExperience(prev => [...prev, { company: '', role: '', startDate: '', endDate: '', description: '' }]);
  };
  const updateExperienceItem = (index, key, val) => {
    setExperience(prev => prev.map((item, idx) => idx === index ? { ...item, [key]: val } : item));
  };
  const removeExperienceItem = (index) => {
    setExperience(prev => prev.filter((_, idx) => idx !== index));
  };

  // Helper additions/removals for Education list items
  const addEducationItem = () => {
    setEducation(prev => [...prev, { school: '', degree: '', gradDate: '', description: '' }]);
  };
  const updateEducationItem = (index, key, val) => {
    setEducation(prev => prev.map((item, idx) => idx === index ? { ...item, [key]: val } : item));
  };
  const removeEducationItem = (index) => {
    setEducation(prev => prev.filter((_, idx) => idx !== index));
  };

  // Helper additions/removals for Projects list items
  const addProjectItem = () => {
    setProjects(prev => [...prev, { name: '', technologies: '', description: '', link: '' }]);
  };
  const updateProjectItem = (index, key, val) => {
    setProjects(prev => prev.map((item, idx) => idx === index ? { ...item, [key]: val } : item));
  };
  const removeProjectItem = (index) => {
    setProjects(prev => prev.filter((_, idx) => idx !== index));
  };

  // Handlers for Skills tags
  const [skillInput, setSkillInput] = useState('');
  const addSkill = (e) => {
    if (e.key === 'Enter' || e.type === 'blur') {
      e.preventDefault();
      const val = skillInput.trim();
      if (val && !skills.includes(val)) {
        setSkills(prev => [...prev, val]);
        setSkillInput('');
      }
    }
  };
  const removeSkill = (sk) => {
    setSkills(prev => prev.filter(s => s !== sk));
  };

  // Export PDF Trigger
  const handleDownloadPdf = async () => {
    setLoading(true);
    try {
      const response = await api.get('/resumes/draft/export-pdf', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Resume.pdf');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error("PDF export failed", err);
      alert("Failed to export resume PDF.");
    } finally {
      setLoading(false);
    }
  };

  // Carries built resume keywords and redirects to config page
  const handleStartInterviewWithResume = () => {
    const searchParams = new URLSearchParams();
    searchParams.set('flow', 'classic');
    searchParams.set('role', 'Software Engineer'); // default prefill SWE
    navigate(`/config?${searchParams.toString()}`, {
      state: { preloadedKeywords: skills }
    });
  };

  return (
    <div className="min-h-screen bg-darkBg text-white flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-8">
            
            {/* Header & Back Link */}
            <div className="flex items-center gap-4">
              <Link
                to="/dashboard"
                className="p-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl transition duration-150"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">Resume Builder Wizard</h1>
                <p className="text-gray-400 text-xs mt-1">
                  Build a high-impact profile manually or parse existing resumes with AI phrase suggestions.
                </p>
              </div>
            </div>

            {/* Stepper progress indicator */}
            <StepTracker steps={STEPS} currentStepIndex={currentStepIndex} />

            {/* STEP 1: Option Select */}
            {currentStepIndex === 0 && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Scratch card */}
                  <div
                    onClick={() => setOption('scratch')}
                    className={`p-6 rounded-2xl border cursor-pointer transition flex flex-col gap-4 ${
                      option === 'scratch'
                        ? 'border-indigo-500 bg-indigo-500/10'
                        : 'border-[#232630] bg-[#15171e] hover:border-white/10'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">Create from Scratch</h3>
                      <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                        Enter details manually, using smart AI wording helpers to polish descriptions.
                      </p>
                    </div>
                  </div>

                  {/* Upload card */}
                  <div
                    onClick={() => setOption('upload')}
                    className={`p-6 rounded-2xl border cursor-pointer transition flex flex-col gap-4 ${
                      option === 'upload'
                        ? 'border-indigo-500 bg-indigo-500/10'
                        : 'border-[#232630] bg-[#15171e] hover:border-white/10'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 text-purple-400">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">Upload and Enhance</h3>
                      <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                        Upload your PDF/DOCX resume file. The AI parses information into editable fields.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Conditional Upload DropZone */}
                {option === 'upload' && (
                  <div className="bg-[#15171e] border border-[#232630] rounded-2xl p-6 space-y-4 animate-reveal">
                    <h3 className="font-semibold text-white text-xs uppercase tracking-wider">File Uploader</h3>
                    <label className="border-2 border-dashed border-[#232630] hover:border-indigo-500/40 w-full h-32 rounded-xl cursor-pointer transition duration-150 flex flex-col items-center justify-center p-4 text-center bg-[#0b0c10]/40">
                      <Upload className="w-6 h-6 text-gray-400 mb-2" />
                      <span className="text-xs font-semibold text-white">
                        {file ? file.name : 'Upload PDF or DOCX'}
                      </span>
                      <span className="text-[10px] text-gray-500 mt-1">Extracted sections populate draft</span>
                      <input
                        type="file"
                        accept=".pdf,.docx"
                        onChange={handleResumeUpload}
                        className="hidden"
                      />
                    </label>

                    {uploading && (
                      <div className="text-indigo-400 text-xs font-bold animate-pulse text-center">
                        Parsing sections and matching fields...
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-end pt-4">
                  <button
                    onClick={handleNextStep}
                    disabled={!option || (option === 'upload' && !file)}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <span>Next</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Template Selection */}
            {currentStepIndex === 1 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {TEMPLATES.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setTemplateId(t.id)}
                      className={`p-5 rounded-xl border cursor-pointer transition ${
                        templateId === t.id
                          ? 'border-indigo-500 bg-indigo-500/10'
                          : 'border-[#232630] bg-[#15171e] hover:border-white/10'
                      }`}
                    >
                      <h4 className="font-bold text-sm text-white">{t.name}</h4>
                      <p className="text-gray-400 text-[11px] mt-1 leading-relaxed">{t.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between pt-4">
                  <button
                    onClick={handlePrevStep}
                    className="px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>
                  <button
                    onClick={handleNextStep}
                    className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <span>Next</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Build Resume Fields */}
            {currentStepIndex === 2 && (
              <div className="space-y-6">
                
                {/* 1. Contact details */}
                <div className="bg-[#15171e] border border-[#232630] rounded-2xl p-6 space-y-4">
                  <h3 className="font-semibold text-white text-base">Contact Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={contact.name}
                      onChange={(e) => setContact({ ...contact, name: e.target.value })}
                      className="bg-[#0b0c10] border border-[#232630] rounded-xl px-4 py-2.5 text-xs text-white"
                    />
                    <input
                      type="email"
                      placeholder="Email Address"
                      value={contact.email}
                      onChange={(e) => setContact({ ...contact, email: e.target.value })}
                      className="bg-[#0b0c10] border border-[#232630] rounded-xl px-4 py-2.5 text-xs text-white"
                    />
                    <input
                      type="text"
                      placeholder="Phone Number"
                      value={contact.phone}
                      onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                      className="bg-[#0b0c10] border border-[#232630] rounded-xl px-4 py-2.5 text-xs text-white"
                    />
                    <input
                      type="text"
                      placeholder="Location (e.g. San Francisco, CA)"
                      value={contact.location}
                      onChange={(e) => setContact({ ...contact, location: e.target.value })}
                      className="bg-[#0b0c10] border border-[#232630] rounded-xl px-4 py-2.5 text-xs text-white"
                    />
                    <input
                      type="text"
                      placeholder="Website / LinkedIn / GitHub Portfolio"
                      value={contact.website}
                      onChange={(e) => setContact({ ...contact, website: e.target.value })}
                      className="bg-[#0b0c10] border border-[#232630] rounded-xl px-4 py-2.5 text-xs text-white sm:col-span-2"
                    />
                  </div>
                </div>

                {/* 2. Professional summary */}
                <div className="bg-[#15171e] border border-[#232630] rounded-2xl p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-white text-base">Professional Summary</h3>
                    <button
                      type="button"
                      onClick={() => handleImproveText('summary', summary, 'Summary')}
                      disabled={improvingField === 'summary' || !summary.trim()}
                      className="px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1.5"
                    >
                      <Wand2 className="w-3.5 h-3.5" />
                      <span>{improvingField === 'summary' ? 'Refining...' : 'Improve Wording'}</span>
                    </button>
                  </div>

                  <textarea
                    rows={4}
                    placeholder="Brief professional profile summary..."
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    className="w-full bg-[#0b0c10] border border-[#232630] rounded-xl p-4 text-xs text-white resize-none"
                  />

                  {/* AI Suggestion alert */}
                  {aiSuggestions['summary'] && (
                    <div className="bg-indigo-500/5 border border-indigo-500/10 p-4 rounded-xl space-y-3 animate-reveal">
                      <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">AI Wording Suggestion:</span>
                      <p className="text-xs text-gray-300 italic">{aiSuggestions['summary']}</p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => acceptSuggestion('summary', setSummary)}
                          className="px-3 py-1 bg-indigo-600 text-white rounded text-[10px] font-bold"
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          onClick={() => rejectSuggestion('summary')}
                          className="px-3 py-1 bg-white/5 text-gray-400 rounded text-[10px] font-bold"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Experience */}
                <div className="bg-[#15171e] border border-[#232630] rounded-2xl p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-white text-base">Work Experience</h3>
                    <button
                      type="button"
                      onClick={addExperienceItem}
                      className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Experience</span>
                    </button>
                  </div>

                  <div className="space-y-6">
                    {experience.map((exp, idx) => (
                      <div key={idx} className="border border-[#232630] rounded-xl p-4 space-y-4 relative bg-[#0b0c10]/20">
                        <button
                          type="button"
                          onClick={() => removeExperienceItem(idx)}
                          className="absolute top-4 right-4 text-gray-500 hover:text-red-400 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl pr-8">
                          <input
                            type="text"
                            placeholder="Company Name"
                            value={exp.company}
                            onChange={(e) => updateExperienceItem(idx, 'company', e.target.value)}
                            className="bg-[#0b0c10] border border-[#232630] rounded-xl px-4 py-2 text-xs text-white"
                          />
                          <input
                            type="text"
                            placeholder="Role / Title"
                            value={exp.role}
                            onChange={(e) => updateExperienceItem(idx, 'role', e.target.value)}
                            className="bg-[#0b0c10] border border-[#232630] rounded-xl px-4 py-2 text-xs text-white"
                          />
                          <input
                            type="text"
                            placeholder="Start Date (e.g. Jan 2022)"
                            value={exp.startDate}
                            onChange={(e) => updateExperienceItem(idx, 'startDate', e.target.value)}
                            className="bg-[#0b0c10] border border-[#232630] rounded-xl px-4 py-2 text-xs text-white"
                          />
                          <input
                            type="text"
                            placeholder="End Date (e.g. Present)"
                            value={exp.endDate}
                            onChange={(e) => updateExperienceItem(idx, 'endDate', e.target.value)}
                            className="bg-[#0b0c10] border border-[#232630] rounded-xl px-4 py-2 text-xs text-white"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Responsibilities & Key Metrics</label>
                            <button
                              type="button"
                              onClick={() => handleImproveText(`exp-${idx}`, exp.description, 'Experience Bullet')}
                              disabled={improvingField === `exp-${idx}` || !exp.description?.trim()}
                              className="px-2 py-1 bg-indigo-500/10 text-indigo-400 hover:text-white rounded text-[9px] font-bold transition flex items-center gap-1"
                            >
                              <Wand2 className="w-3 h-3" />
                              <span>{improvingField === `exp-${idx}` ? 'Refining...' : 'AI Refine'}</span>
                            </button>
                          </div>
                          <textarea
                            rows={3}
                            placeholder="Describe achievements, metric scale, and core outcomes..."
                            value={exp.description}
                            onChange={(e) => updateExperienceItem(idx, 'description', e.target.value)}
                            className="w-full bg-[#0b0c10] border border-[#232630] rounded-xl p-3 text-xs text-white resize-none"
                          />
                        </div>

                        {/* AI Suggestion alert */}
                        {aiSuggestions[`exp-${idx}`] && (
                          <div className="bg-indigo-500/5 border border-indigo-500/10 p-4 rounded-xl space-y-3 animate-reveal">
                            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">AI Wording Suggestion:</span>
                            <p className="text-xs text-gray-300 italic">{aiSuggestions[`exp-${idx}`]}</p>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => acceptSuggestion(`exp-${idx}`, (val) => updateExperienceItem(idx, 'description', val))}
                                className="px-3 py-1 bg-indigo-600 text-white rounded text-[10px] font-bold"
                              >
                                Accept
                              </button>
                              <button
                                type="button"
                                onClick={() => rejectSuggestion(`exp-${idx}`)}
                                className="px-3 py-1 bg-white/5 text-gray-400 rounded text-[10px] font-bold"
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Education */}
                <div className="bg-[#15171e] border border-[#232630] rounded-2xl p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-white text-base">Education</h3>
                    <button
                      type="button"
                      onClick={addEducationItem}
                      className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Education</span>
                    </button>
                  </div>

                  <div className="space-y-6">
                    {education.map((edu, idx) => (
                      <div key={idx} className="border border-[#232630] rounded-xl p-4 space-y-4 relative bg-[#0b0c10]/20">
                        <button
                          type="button"
                          onClick={() => removeEducationItem(idx)}
                          className="absolute top-4 right-4 text-gray-500 hover:text-red-400 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
                          <input
                            type="text"
                            placeholder="School / University"
                            value={edu.school}
                            onChange={(e) => updateEducationItem(idx, 'school', e.target.value)}
                            className="bg-[#0b0c10] border border-[#232630] rounded-xl px-4 py-2 text-xs text-white"
                          />
                          <input
                            type="text"
                            placeholder="Degree / Major"
                            value={edu.degree}
                            onChange={(e) => updateEducationItem(idx, 'degree', e.target.value)}
                            className="bg-[#0b0c10] border border-[#232630] rounded-xl px-4 py-2 text-xs text-white"
                          />
                          <input
                            type="text"
                            placeholder="Graduation Date / Expected"
                            value={edu.gradDate}
                            onChange={(e) => updateEducationItem(idx, 'gradDate', e.target.value)}
                            className="bg-[#0b0c10] border border-[#232630] rounded-xl px-4 py-2 text-xs text-white"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 5. Skills Tags */}
                <div className="bg-[#15171e] border border-[#232630] rounded-2xl p-6 space-y-4">
                  <h3 className="font-semibold text-white text-base">Skills & Technologies</h3>
                  
                  <div className="flex flex-wrap gap-2">
                    {skills.map((sk, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 text-xs bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full border border-indigo-500/20 font-medium"
                      >
                        <span>{sk}</span>
                        <button
                          type="button"
                          onClick={() => removeSkill(sk)}
                          className="hover:text-red-400 transition"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="max-w-md pt-2">
                    <input
                      type="text"
                      placeholder="Type skill tag (e.g. React, Java) and press Enter"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={addSkill}
                      onBlur={addSkill}
                      className="w-full bg-[#0b0c10] border border-[#232630] rounded-xl px-4 py-2.5 text-white placeholder-gray-600 text-xs focus:outline-none focus:border-indigo-500/50 transition duration-150"
                    />
                  </div>
                </div>

                {/* 6. Projects */}
                <div className="bg-[#15171e] border border-[#232630] rounded-2xl p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-white text-base">Key Projects</h3>
                    <button
                      type="button"
                      onClick={addProjectItem}
                      className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Project</span>
                    </button>
                  </div>

                  <div className="space-y-6">
                    {projects.map((proj, idx) => (
                      <div key={idx} className="border border-[#232630] rounded-xl p-4 space-y-4 relative bg-[#0b0c10]/20">
                        <button
                          type="button"
                          onClick={() => removeProjectItem(idx)}
                          className="absolute top-4 right-4 text-gray-500 hover:text-red-400 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl pr-8">
                          <input
                            type="text"
                            placeholder="Project Name"
                            value={proj.name}
                            onChange={(e) => updateProjectItem(idx, 'name', e.target.value)}
                            className="bg-[#0b0c10] border border-[#232630] rounded-xl px-4 py-2 text-xs text-white"
                          />
                          <input
                            type="text"
                            placeholder="Technologies (e.g. React, Node.js)"
                            value={proj.technologies}
                            onChange={(e) => updateProjectItem(idx, 'technologies', e.target.value)}
                            className="bg-[#0b0c10] border border-[#232630] rounded-xl px-4 py-2 text-xs text-white"
                          />
                          <input
                            type="text"
                            placeholder="Project Link / Code URL (Optional)"
                            value={proj.link}
                            onChange={(e) => updateProjectItem(idx, 'link', e.target.value)}
                            className="bg-[#0b0c10] border border-[#232630] rounded-xl px-4 py-2 text-xs text-white sm:col-span-2"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Project Description</label>
                            <button
                              type="button"
                              onClick={() => handleImproveText(`proj-${idx}`, proj.description, 'Project Description')}
                              disabled={improvingField === `proj-${idx}` || !proj.description?.trim()}
                              className="px-2 py-1 bg-indigo-500/10 text-indigo-400 hover:text-white rounded text-[9px] font-bold transition flex items-center gap-1"
                            >
                              <Wand2 className="w-3 h-3" />
                              <span>{improvingField === `proj-${idx}` ? 'Refining...' : 'AI Refine'}</span>
                            </button>
                          </div>
                          <textarea
                            rows={3}
                            placeholder="Detail objectives, contributions, and tools used..."
                            value={proj.description}
                            onChange={(e) => updateProjectItem(idx, 'description', e.target.value)}
                            className="w-full bg-[#0b0c10] border border-[#232630] rounded-xl p-3 text-xs text-white resize-none"
                          />
                        </div>

                        {/* AI Suggestion alert */}
                        {aiSuggestions[`proj-${idx}`] && (
                          <div className="bg-indigo-500/5 border border-indigo-500/10 p-4 rounded-xl space-y-3 animate-reveal">
                            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">AI Wording Suggestion:</span>
                            <p className="text-xs text-gray-300 italic">{aiSuggestions[`proj-${idx}`]}</p>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => acceptSuggestion(`proj-${idx}`, (val) => updateProjectItem(idx, 'description', val))}
                                className="px-3 py-1 bg-indigo-600 text-white rounded text-[10px] font-bold"
                              >
                                Accept
                              </button>
                              <button
                                type="button"
                                onClick={() => rejectSuggestion(`proj-${idx}`)}
                                className="px-3 py-1 bg-white/5 text-gray-400 rounded text-[10px] font-bold"
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <button
                    onClick={handlePrevStep}
                    className="px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>
                  <button
                    onClick={handleNextStep}
                    className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <span>Next</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: Resume Visual Preview & Actions */}
            {currentStepIndex === 3 && (
              <div className="space-y-6">
                
                {/* PDF Actions CTA Callout */}
                <div className="bg-[#15171e] border border-[#232630] rounded-3xl p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div>
                    <h3 className="font-semibold text-white text-base">Your Resume is Ready!</h3>
                    <p className="text-xs text-gray-400 mt-1">Export your structured draft as a formatted PDF.</p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleDownloadPdf}
                      disabled={loading}
                      className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-bold transition flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>{loading ? 'Downloading...' : 'Download as PDF'}</span>
                    </button>
                    <button
                      onClick={handleStartInterviewWithResume}
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-indigo-500/20"
                    >
                      <Play className="w-4 h-4" />
                      <span>Start Interview with Resume</span>
                    </button>
                  </div>
                </div>

                {/* CSS Styled Preview Thumbnail */}
                <div className="bg-[#15171e] border border-[#232630] rounded-3xl p-8 space-y-6 text-black min-h-[500px]">
                  {/* Outer Paper frame simulated with vanilla CSS */}
                  <div className={`p-8 bg-white border border-gray-200 shadow-xl rounded-lg font-sans max-w-2xl mx-auto ${
                    templateId === 'Modern' ? 'border-l-8 border-l-indigo-600' : ''
                  }`}>
                    
                    {/* Header */}
                    <div className="text-center space-y-1">
                      <h2 className={`font-bold tracking-tight text-xl ${
                        templateId === 'Technical' ? 'font-mono uppercase' : 'font-serif'
                      }`}>{contact.name || 'Your Full Name'}</h2>
                      <div className="text-[10px] text-gray-600 flex justify-center gap-3">
                        {contact.phone && <span>{contact.phone}</span>}
                        {contact.email && <span>• {contact.email}</span>}
                        {contact.location && <span>• {contact.location}</span>}
                        {contact.website && <span>• {contact.website}</span>}
                      </div>
                    </div>

                    <hr className="my-4 border-gray-200" />

                    {/* Summary */}
                    {summary && (
                      <div className="space-y-1.5 mb-5">
                        <h4 className={`text-xs font-bold text-indigo-600 tracking-wider ${
                          templateId === 'Technical' ? 'font-mono' : ''
                        }`}>EXECUTIVE SUMMARY</h4>
                        <p className="text-[10px] text-gray-700 leading-relaxed">{summary}</p>
                      </div>
                    )}

                    {/* Experience list */}
                    {experience.length > 0 && (
                      <div className="space-y-3 mb-5">
                        <h4 className={`text-xs font-bold text-indigo-600 tracking-wider ${
                          templateId === 'Technical' ? 'font-mono' : ''
                        }`}>PROFESSIONAL EXPERIENCE</h4>
                        <div className="space-y-3">
                          {experience.map((exp, idx) => (
                            <div key={idx} className="space-y-1 text-[10px]">
                              <div className="flex justify-between font-bold text-gray-900">
                                <span>{exp.role} - {exp.company}</span>
                                <span className="font-normal text-gray-500">{exp.startDate} - {exp.endDate}</span>
                              </div>
                              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{exp.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Education list */}
                    {education.length > 0 && (
                      <div className="space-y-3 mb-5">
                        <h4 className={`text-xs font-bold text-indigo-600 tracking-wider ${
                          templateId === 'Technical' ? 'font-mono' : ''
                        }`}>EDUCATION</h4>
                        <div className="space-y-3">
                          {education.map((edu, idx) => (
                            <div key={idx} className="space-y-1 text-[10px]">
                              <div className="flex justify-between font-bold text-gray-900">
                                <span>{edu.degree} - {edu.school}</span>
                                <span className="font-normal text-gray-500">{edu.gradDate}</span>
                              </div>
                              {edu.description && <p className="text-gray-700 leading-relaxed">{edu.description}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Skills list */}
                    {skills.length > 0 && (
                      <div className="space-y-1.5 mb-5">
                        <h4 className={`text-xs font-bold text-indigo-600 tracking-wider ${
                          templateId === 'Technical' ? 'font-mono' : ''
                        }`}>SKILLS & TECHNOLOGIES</h4>
                        <p className="text-[10px] text-gray-700 leading-relaxed">{skills.join(', ')}</p>
                      </div>
                    )}

                    {/* Projects list */}
                    {projects.length > 0 && (
                      <div className="space-y-3">
                        <h4 className={`text-xs font-bold text-indigo-600 tracking-wider ${
                          templateId === 'Technical' ? 'font-mono' : ''
                        }`}>KEY PROJECTS</h4>
                        <div className="space-y-3">
                          {projects.map((p, idx) => (
                            <div key={idx} className="space-y-1 text-[10px]">
                              <div className="flex justify-between font-bold text-gray-900">
                                <span>{p.name} {p.technologies ? `[Tech: ${p.technologies}]` : ''}</span>
                                {p.link && <span className="font-normal text-indigo-500">{p.link}</span>}
                              </div>
                              <p className="text-gray-700 leading-relaxed">{p.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <button
                    onClick={handlePrevStep}
                    className="px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
