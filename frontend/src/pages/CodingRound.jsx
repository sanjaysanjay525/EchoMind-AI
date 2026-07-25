import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Loader from '../components/Loader';
import RoundProgressBar from '../components/RoundProgressBar';
import Editor from '@monaco-editor/react';
import TimerBar from '../components/TimerBar';
import { Play, Sparkles, AlertCircle, CheckCircle, Code, Layers, HelpCircle } from 'lucide-react';

export default function CodingRound() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [problems, setProblems] = useState([]);
  const [currentProblem, setCurrentProblem] = useState(null);
  
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  
  const [runResults, setRunResults] = useState(null);
  const [running, setRunning] = useState(false);
  const [hint, setHint] = useState(null);
  const [hintsUsed, setHintsUsed] = useState(0);

  // Timed Mock Test Mode options
  const timedModeEnabled = JSON.parse(localStorage.getItem('timedModeEnabled') || 'false');
  const timedModeSeconds = JSON.parse(localStorage.getItem('timedModeSeconds') || '60') * 3; // 3x time for coding!

  const handleCodingTimeout = async () => {
    try {
      const res = await api.post(`/sessions/${sessionId}/round/coding/submit`, {
        code,
        language
      });
      navigate(`/interview/${sessionId}/transition`, {
        state: {
          completedRound: 'CODING',
          nextRound: res.data.nextRound || 'ADVANCED',
          score: res.data.score !== undefined ? res.data.score : 0,
          passed: res.data.passed !== undefined ? res.data.passed : false
        }
      });
    } catch (err) {
      console.error(err);
      navigate(`/interview/${sessionId}/round/advanced`);
    }
  };

  useEffect(() => {
    const fetchProblem = async () => {
      try {
        const res = await api.post(`/sessions/${sessionId}/round/CODING/start`);
        const problemsList = res.data.problems || [];
        setProblems(problemsList);
        if (problemsList.length > 0) {
          setCurrentProblem(problemsList[0]);
          setCode(problemsList[0].templateCode || '// Write your code here');
        }
      } catch (err) {
        console.error("Failed to load coding problem", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProblem();
  }, [sessionId]);

  const handleEditorChange = (value) => {
    setCode(value);
  };

  const [submitResponse, setSubmitResponse] = useState(null);

  const handleRunCode = async () => {
    setRunning(true);
    setRunResults(null);
    setSubmitResponse(null);
    try {
      const res = await api.post(`/sessions/${sessionId}/round/coding/submit`, {
        code,
        language
      });
      setRunResults(res.data.runResults);
      setSubmitResponse(res.data);
    } catch (err) {
      console.error("Run code error", err);
      alert("Execution error: " + (err.response?.data?.message || err.message));
    } finally {
      setRunning(false);
    }
  };

  const handleShowHint = () => {
    if (!currentProblem) return;
    if (hintsUsed === 0) {
      setHint("Recall that two-pointer or hashing approach is O(N) complexity.");
      setHintsUsed(1);
    } else {
      setHint("Create a hash map. Store index and number. Check if (target - num) is in map.");
      setHintsUsed(2);
    }
  };

  const handleSubmit = async () => {
    if (!runResults || !runResults.success) {
      alert("Please run your code and verify test outcomes before advancing!");
      return;
    }

    try {
      // Advance to transition screen
      navigate(`/interview/${sessionId}/transition`, {
        state: {
          completedRound: 'CODING',
          nextRound: submitResponse?.nextRound || 'ADVANCED',
          score: submitResponse?.score !== undefined ? submitResponse.score : runResults.score,
          passed: submitResponse?.passed !== undefined ? submitResponse.passed : (runResults.score >= 60)
        }
      });
    } catch(err) {
      console.error("Submit coding error", err);
      navigate(`/interview/${sessionId}/round/advanced`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-darkBg flex flex-col text-white">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader text="Setting up programming editor sandbox..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-darkBg flex flex-col text-white relative overflow-hidden">
      <div className="glow-bg w-[500px] h-[500px] bg-emerald-500/10 top-[-100px] right-[-100px]" />
      
      <Navbar />

      <main className="flex-1 p-8 overflow-y-auto max-w-7xl mx-auto w-full relative z-10">
        <RoundProgressBar currentRound="CODING" />

        {currentProblem ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-220px)] min-h-[550px]">
            
            {/* LEFT PANEL: Description (lg:col-span-5) */}
            <div className="lg:col-span-5 flex flex-col gap-4 overflow-y-auto pr-2">
              <div className="glass-card rounded-2xl p-6 border flex-1 flex flex-col gap-4">
                
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div className="flex items-center gap-2">
                    <Code className="w-5 h-5 text-emerald-400" />
                    <h2 className="font-display font-extrabold text-lg">{currentProblem.title}</h2>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-md">
                    {currentProblem.difficulty}
                  </span>
                </div>

                {/* Timed mode timer */}
                {timedModeEnabled && (
                  <div className="mt-1">
                    <TimerBar key={currentProblem.id} seconds={timedModeSeconds} onTimeout={handleCodingTimeout} />
                  </div>
                )}

                {/* Problem Description */}
                <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed flex-1">
                  {currentProblem.description}
                </div>

                {/* Hints panel */}
                {hint && (
                  <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs animate-reveal">
                    <span className="font-extrabold block mb-1">Hint:</span>
                    {hint}
                  </div>
                )}

                <div className="flex gap-3 mt-auto pt-4 border-t border-white/5">
                  <button
                    onClick={handleShowHint}
                    className="flex-1 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 text-gray-400 hover:text-white"
                  >
                    <HelpCircle className="w-4 h-4" />
                    <span>Request Hint ({hintsUsed}/2)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT PANEL: Editor & Submits (lg:col-span-7) */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              
              {/* Monaco IDE */}
              <div className="glass-card rounded-2xl border flex-1 overflow-hidden flex flex-col min-h-[300px]">
                <div className="bg-[#15171e] px-4 py-2.5 flex justify-between items-center border-b border-white/5">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Editor (JavaScript)</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleRunCode}
                      disabled={running}
                      className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                    >
                      {running ? (
                        <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5" />
                          <span>Run Code</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Monaco Editor Container */}
                <div className="flex-1 w-full relative">
                  <Editor
                    height="100%"
                    language={language}
                    theme="vs-dark"
                    value={code}
                    onChange={handleEditorChange}
                    options={{
                      fontSize: 14,
                      fontFamily: "'Courier New', Courier, monospace",
                      minimap: { enabled: false },
                      automaticLayout: true,
                      scrollBeyondLastLine: false,
                      tabSize: 4
                    }}
                  />
                </div>
              </div>

              {/* Console & Test Case Outcomes */}
              <div className="glass-card rounded-2xl border p-4 flex flex-col gap-3 min-h-[180px] bg-darkCard/80">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500">Test Case Results</span>
                
                {runResults ? (
                  runResults.success ? (
                    <div className="flex flex-col gap-2 overflow-y-auto max-h-[140px]">
                      <div className="text-xs font-bold text-emerald-400 flex items-center gap-1 mb-1">
                        <CheckCircle className="w-4 h-4" />
                        <span>Score: {runResults.score}% Passed</span>
                      </div>
                      
                      {runResults.results.map((tc, index) => (
                        <div key={index} className="p-2.5 rounded-lg bg-black/30 border border-white/5 flex items-center justify-between text-xs">
                          <div className="flex flex-col gap-1">
                            <span className="text-gray-400">Test Case {index + 1}</span>
                            <span className="text-[10px] text-gray-500 font-mono">Expected: {JSON.stringify(tc.expected)} | Output: {JSON.stringify(tc.output)}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded font-extrabold text-[10px] uppercase ${
                            tc.passed 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}>
                            {tc.passed ? 'PASSED' : 'FAILED'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 bg-red-950/20 border border-red-900/30 text-red-400 text-xs rounded-xl flex gap-2 items-start font-mono">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <pre className="whitespace-pre-wrap">{runResults.error}</pre>
                    </div>
                  )
                ) : (
                  <div className="flex-1 flex items-center justify-center text-xs text-gray-600 italic">
                    {running ? 'Executing sandbox container tests...' : 'Click "Run Code" to compile and execute your code against test cases.'}
                  </div>
                )}

                {/* Complete / Submit action */}
                <div className="flex justify-end pt-2 border-t border-white/5 mt-auto">
                  <button
                    onClick={handleSubmit}
                    disabled={!runResults || !runResults.success}
                    className="px-6 py-2 bg-gradient-indigo hover:opacity-90 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <span>Complete Round</span>
                    <Sparkles className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>

          </div>
        ) : (
          <div className="text-center py-10 text-gray-500">Problem not found. Please contact support.</div>
        )}
      </main>
    </div>
  );
}
