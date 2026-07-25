import React from 'react';
import { CheckCircle2, AlertTriangle, Lightbulb, GitMerge, Code, Briefcase, Server } from 'lucide-react';
import CircularProgress from './CircularProgress';

export default function MemoryAnalysis({ report }) {
  if (!report) return null;

  return (
    <section className="glass-card p-6 rounded-3xl mb-8 border border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-3xl pointer-events-none rounded-full"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 blur-3xl pointer-events-none rounded-full"></div>

        <h3 className="font-display font-bold text-xl text-white mb-6 flex items-center gap-2 relative z-10">
            <GitMerge className="w-6 h-6 text-indigo-400" />
            Interview Memory & Consistency
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 relative z-10">
            {/* Left Col: Scores & Summary */}
            <div className="md:col-span-5 flex flex-col gap-6">
                <div className="bg-white/5 border border-white/5 p-6 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden h-full">
                    <div className="absolute top-[-20px] right-[-20px] w-24 h-24 bg-emerald-500/10 blur-xl rounded-full"></div>
                    <span className="text-sm text-gray-400 mb-4 font-semibold tracking-wider uppercase">Consistency Score</span>
                    <CircularProgress value={report.consistencyScore} size={140} strokeWidth={10} title="" />
                    <div className="mt-6 flex items-center gap-2">
                        {report.contradictionCount === 0 ? (
                            <span className="text-emerald-400 flex items-center gap-1.5 text-sm font-semibold bg-emerald-500/10 px-3 py-1 rounded-full">
                                <CheckCircle2 className="w-4 h-4" /> No Contradictions
                            </span>
                        ) : (
                            <span className="text-pink-400 flex items-center gap-1.5 text-sm font-semibold bg-pink-500/10 px-3 py-1 rounded-full">
                                <AlertTriangle className="w-4 h-4" /> {report.contradictionCount} Contradiction{report.contradictionCount > 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Col: Knowledge Graph */}
            <div className="md:col-span-7 flex flex-col gap-6">
                
                {/* Summary */}
                <div className="bg-white/5 border border-white/5 p-5 rounded-2xl flex gap-4 items-start">
                    <Lightbulb className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-semibold text-white text-sm mb-1 uppercase tracking-wide">Analysis Summary</h4>
                        <p className="text-sm text-gray-300 leading-relaxed">
                            {report.analysisSummary}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Skills */}
                    <div className="bg-white/5 border border-white/5 p-5 rounded-2xl">
                        <div className="flex items-center gap-2 text-indigo-400 mb-3">
                            <Code className="w-4 h-4" />
                            <h4 className="font-semibold text-sm uppercase tracking-wider">Skills & Tech</h4>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {report.skillsIdentified && report.skillsIdentified.length > 0 ? (
                                report.skillsIdentified.map((skill, idx) => (
                                    <span key={idx} className="bg-indigo-500/20 border border-indigo-500/30 text-indigo-200 text-xs px-2.5 py-1 rounded-md">
                                        {skill}
                                    </span>
                                ))
                            ) : (
                                <span className="text-xs text-gray-500">None identified</span>
                            )}
                        </div>
                    </div>

                    {/* Knowledge Areas */}
                    <div className="bg-white/5 border border-white/5 p-5 rounded-2xl">
                        <div className="flex items-center gap-2 text-emerald-400 mb-3">
                            <Server className="w-4 h-4" />
                            <h4 className="font-semibold text-sm uppercase tracking-wider">Knowledge Areas</h4>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {report.knowledgeAreas && report.knowledgeAreas.length > 0 ? (
                                report.knowledgeAreas.map((area, idx) => (
                                    <span key={idx} className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-200 text-xs px-2.5 py-1 rounded-md">
                                        {area}
                                    </span>
                                ))
                            ) : (
                                <span className="text-xs text-gray-500">None identified</span>
                            )}
                        </div>
                    </div>

                    {/* Projects */}
                    <div className="bg-white/5 border border-white/5 p-5 rounded-2xl sm:col-span-2">
                        <div className="flex items-center gap-2 text-purple-400 mb-3">
                            <Briefcase className="w-4 h-4" />
                            <h4 className="font-semibold text-sm uppercase tracking-wider">Projects Mentioned</h4>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {report.projectsIdentified && report.projectsIdentified.length > 0 ? (
                                report.projectsIdentified.map((proj, idx) => (
                                    <span key={idx} className="bg-purple-500/20 border border-purple-500/30 text-purple-200 text-xs px-2.5 py-1 rounded-md">
                                        {proj}
                                    </span>
                                ))
                            ) : (
                                <span className="text-xs text-gray-500">None identified</span>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </section>
  );
}
