import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../context/AuthContext';
import { ChevronRight, ChevronLeft, PlayCircle, Star, MessageSquare, AlertCircle, Lightbulb, Play } from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Loader from '../components/Loader';
import CircularProgress from '../components/CircularProgress';

export default function InterviewCoachingPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [coaching, setCoaching] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isReplaying, setIsReplaying] = useState(false);

  useEffect(() => {
    const fetchCoaching = async () => {
      try {
        let res;
        try {
          res = await api.get(`/coaching/${id}`);
        } catch (getErr) {
          if (getErr.response && getErr.response.status === 404) {
            res = await api.post('/coaching/generate', { interviewId: id });
          } else {
            throw getErr;
          }
        }
        setCoaching(res.data);
      } catch (err) {
        console.error("Error fetching coaching data", err);
        alert("Failed to load coaching data. It might not be generated yet.");
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchCoaching();
  }, [id, navigate]);

  useEffect(() => {
    window.speechSynthesis.cancel();
    setIsReplaying(false);
  }, [currentIndex]);

  const handleReplay = () => {
    if (isReplaying) {
      window.speechSynthesis.cancel();
      setIsReplaying(false);
      return;
    }
    
    if (!coaching || !coaching.questionCoachings) return;
    
    const currentQ = coaching.questionCoachings[currentIndex];
    setIsReplaying(true);
    
    const questionUtterance = new SpeechSynthesisUtterance("Question: " + currentQ.question);
    const answerUtterance = new SpeechSynthesisUtterance("Your Answer: " + currentQ.originalAnswer);
    
    answerUtterance.onend = () => {
      setIsReplaying(false);
    };
    
    window.speechSynthesis.speak(questionUtterance);
    window.speechSynthesis.speak(answerUtterance);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-darkBg flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader text="Loading AI Coaching Analysis..." />
        </div>
      </div>
    );
  }

  if (!coaching || !coaching.questionCoachings || coaching.questionCoachings.length === 0) {
    return (
      <div className="min-h-screen bg-darkBg flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
          Coaching data is unavailable or could not be fully generated.
        </div>
      </div>
    );
  }

  const currentQ = coaching.questionCoachings[currentIndex];
  const totalQuestions = coaching.questionCoachings.length;

  return (
    <div className="min-h-screen bg-darkBg flex flex-col">
      <Navbar />
      <div className="flex-1 flex">
        <Sidebar />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto w-full max-w-7xl mx-auto">
          
          <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="font-display font-extrabold text-3xl text-white flex items-center gap-3">
                <PlayCircle className="text-indigo-400 w-8 h-8" />
                AI Interview Replay & Coaching
              </h1>
              <p className="text-gray-400 text-sm mt-1">Review your answers with line-by-line AI analysis and STAR feedback</p>
            </div>
            <Link
              to={`/report/${id}`}
              className="bg-white/5 hover:bg-white/10 text-white border border-white/10 text-sm font-semibold px-5 py-2.5 rounded-xl transition duration-200"
            >
              Back to Full Report
            </Link>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* LEFT PANEL: Replay UI */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <div className="glass-card p-6 rounded-3xl sticky top-24">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">Replay Station</span>
                  <span className="text-xs text-gray-400 bg-white/5 px-3 py-1 rounded-full font-semibold border border-white/5">
                    {currentIndex + 1} / {totalQuestions}
                  </span>
                </div>
                
                {/* Replay Area */}
                <div className="w-full aspect-video bg-black/50 border border-white/10 rounded-2xl mb-6 relative flex flex-col items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/20 to-transparent"></div>
                    <button 
                      onClick={handleReplay}
                      className="z-10 flex flex-col items-center justify-center p-4 hover:scale-105 transition-transform"
                    >
                      {isReplaying ? (
                        <>
                          <div className="flex gap-1 mb-3 h-12 items-end">
                            <div className="w-2 bg-indigo-400 animate-bounce" style={{ height: '100%', animationDelay: '0ms' }}></div>
                            <div className="w-2 bg-indigo-400 animate-bounce" style={{ height: '60%', animationDelay: '100ms' }}></div>
                            <div className="w-2 bg-indigo-400 animate-bounce" style={{ height: '80%', animationDelay: '200ms' }}></div>
                            <div className="w-2 bg-indigo-400 animate-bounce" style={{ height: '40%', animationDelay: '300ms' }}></div>
                            <div className="w-2 bg-indigo-400 animate-bounce" style={{ height: '90%', animationDelay: '400ms' }}></div>
                          </div>
                          <span className="text-indigo-400 text-xs uppercase tracking-wider font-semibold z-10">Stop Replay</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-12 h-12 text-white mb-2" fill="currentColor" />
                          <span className="text-gray-300 text-xs uppercase tracking-wider font-semibold z-10">Play Transcript Replay</span>
                        </>
                      )}
                    </button>
                </div>

                <div className="bg-indigo-500/10 border border-indigo-500/20 p-5 rounded-2xl mb-6 relative overflow-hidden">
                  <div className="absolute left-0 top-0 w-1 h-full bg-indigo-500"></div>
                  <h3 className="text-sm font-semibold text-indigo-300 mb-2 uppercase tracking-wide">Question</h3>
                  <p className="text-white text-base leading-relaxed">{currentQ.question}</p>
                </div>

                <div className="bg-white/5 border border-white/10 p-5 rounded-2xl relative">
                  <h3 className="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wide">Your Transcript</h3>
                  <p className="text-gray-300 text-sm leading-relaxed italic border-l-2 border-white/10 pl-3">
                    "{currentQ.originalAnswer}"
                  </p>
                </div>

                <div className="flex items-center justify-between mt-6">
                  <button
                    onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                    disabled={currentIndex === 0}
                    className="p-2 rounded-full hover:bg-white/10 text-white disabled:opacity-30 disabled:hover:bg-transparent transition duration-200"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Navigate</span>
                  <button
                    onClick={() => setCurrentIndex(Math.min(totalQuestions - 1, currentIndex + 1))}
                    disabled={currentIndex === totalQuestions - 1}
                    className="p-2 rounded-full hover:bg-white/10 text-white disabled:opacity-30 disabled:hover:bg-transparent transition duration-200"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT PANEL: AI Coaching Analysis */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              
              <div className="glass-card p-8 rounded-3xl border-t-4 border-t-indigo-500">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  <div className="flex-1">
                    <h2 className="text-2xl font-display font-bold text-white mb-2 flex items-center gap-2">
                      <Star className="text-amber-400 w-6 h-6" fill="currentColor" />
                      STAR Evaluation
                    </h2>
                    <p className="text-gray-400 text-sm leading-relaxed mb-4">
                      {currentQ.coachingFeedback}
                    </p>
                  </div>
                  <div className="flex-shrink-0 flex flex-col items-center">
                    <CircularProgress value={currentQ.starScore} size={100} strokeWidth={8} title="STAR Score" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-card p-6 rounded-3xl border border-emerald-500/20 bg-gradient-to-b from-emerald-500/5 to-transparent">
                  <h3 className="text-emerald-400 font-bold mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
                    <Lightbulb className="w-4 h-4" />
                    What Was Good
                  </h3>
                  <p className="text-gray-300 text-sm leading-relaxed">{currentQ.whatWasGood}</p>
                </div>
                
                <div className="glass-card p-6 rounded-3xl border border-rose-500/20 bg-gradient-to-b from-rose-500/5 to-transparent">
                  <h3 className="text-rose-400 font-bold mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
                    <AlertCircle className="w-4 h-4" />
                    What Was Missing
                  </h3>
                  <p className="text-gray-300 text-sm leading-relaxed">{currentQ.whatWasMissing}</p>
                </div>
              </div>

              <div className="glass-card p-8 rounded-3xl relative overflow-hidden">
                <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full transform translate-x-1/2 -translate-y-1/2"></div>
                <h3 className="text-indigo-400 font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                  <MessageSquare className="w-4 h-4" />
                  AI Recommended Answer
                </h3>
                <div className="bg-black/30 p-6 rounded-2xl border border-white/5 relative z-10">
                  <p className="text-white text-base leading-relaxed">
                    {currentQ.improvedAnswer}
                  </p>
                </div>
              </div>

              {/* Overall Tips Section (Visible on last question or permanently) */}
              <div className="glass-card p-8 rounded-3xl mt-4">
                <h2 className="text-xl font-display font-bold text-white mb-6">Personalized Overall Coaching</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  <div>
                    <h4 className="text-sm font-semibold text-purple-400 mb-3 uppercase tracking-wider border-b border-white/5 pb-2">Communication</h4>
                    <ul className="list-disc list-inside text-gray-400 text-sm space-y-2">
                      {coaching.communicationTips.map((tip, idx) => (
                        <li key={idx}>{tip}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-indigo-400 mb-3 uppercase tracking-wider border-b border-white/5 pb-2">Technical</h4>
                    <ul className="list-disc list-inside text-gray-400 text-sm space-y-2">
                      {coaching.technicalTips.map((tip, idx) => (
                        <li key={idx}>{tip}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-amber-400 mb-3 uppercase tracking-wider border-b border-white/5 pb-2">Confidence</h4>
                    <ul className="list-disc list-inside text-gray-400 text-sm space-y-2">
                      {coaching.confidenceTips.map((tip, idx) => (
                        <li key={idx}>{tip}</li>
                      ))}
                    </ul>
                  </div>

                </div>
              </div>

            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
