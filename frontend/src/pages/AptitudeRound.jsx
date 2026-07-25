import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Loader from '../components/Loader';
import RoundProgressBar from '../components/RoundProgressBar';
import TimerBar from '../components/TimerBar';
import { Timer, ArrowRight, Brain, HelpCircle, CheckCircle2 } from 'lucide-react';

export default function AptitudeRound() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { questionId: selectedIndex }
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes total timer for round
  const [submitting, setSubmitting] = useState(false);

  // Timed Mock Test Mode options
  const timedModeEnabled = JSON.parse(localStorage.getItem('timedModeEnabled') || 'false');
  const timedModeSeconds = JSON.parse(localStorage.getItem('timedModeSeconds') || '60');

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await api.post(`/sessions/${sessionId}/round/APTITUDE/start`);
        setQuestions(res.data.questions || []);
      } catch (err) {
        console.error("Failed to load aptitude questions", err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, [sessionId]);

  // Global round timer
  useEffect(() => {
    if (loading || questions.length === 0 || timeLeft <= 0) {
      if (timeLeft === 0) handleAutoSubmit();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [loading, questions, timeLeft]);

  const handleSelect = (questionId, optionIndex) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleQuestionTimeout = () => {
    if (currentIndex < questions.length - 1) {
      handleNext();
    } else {
      handleSubmit();
    }
  };

  const handleAutoSubmit = () => {
    handleSubmit();
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Format submissions payload: List of Map with questionId and selectedOptionIndex
      const payload = questions.map(q => ({
        questionId: q.id,
        selectedOptionIndex: answers[q.id] !== undefined ? answers[q.id] : -1
      }));

      const res = await api.post(`/sessions/${sessionId}/round/aptitude/submit`, payload);
      navigate(`/interview/${sessionId}/transition`, { 
        state: { 
          completedRound: 'APTITUDE', 
          nextRound: res.data.nextRound || 'COMMUNICATION', 
          score: res.data.score,
          passed: res.data.passed
        } 
      });
    } catch (err) {
      console.error("Failed to submit aptitude answers", err);
      alert("Failed to submit answers. Redirecting to next round.");
      navigate(`/interview/${sessionId}/round/communication`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-darkBg flex flex-col text-white">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader text="Preparing timed aptitude questions..." />
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progressPercent = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

  // Format timer
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  return (
    <div className="min-h-screen bg-darkBg flex flex-col text-white relative overflow-hidden">
      
      {/* Decorative Glow elements */}
      <div className="glow-bg w-[500px] h-[500px] bg-indigo-500/10 top-[-100px] right-[-100px]" />
      <div className="glow-bg w-[400px] h-[400px] bg-purple-500/5 bottom-[-100px] left-[-100px]" />

      <Navbar />

      <main className="flex-1 p-8 overflow-y-auto max-w-4xl mx-auto w-full relative z-10">
        <RoundProgressBar currentRound="APTITUDE" />

        <div className="glass-card rounded-3xl p-8 flex flex-col gap-6 relative overflow-hidden">
          
          {/* Header row */}
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-400">
                <Brain className="w-4 h-4" />
              </div>
              <h2 className="font-display font-extrabold text-xl">Round 1: General Aptitude</h2>
            </div>
            
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-amber-400 font-bold text-sm">
              <Timer className="w-4 h-4 animate-pulse" />
              <span>{formatTime(timeLeft)}</span>
            </div>
          </div>

          {/* Progress tracker */}
          <div className="w-full flex flex-col gap-1.5">
            <div className="flex justify-between text-xs text-gray-400 font-bold">
              <span>Question {currentIndex + 1} of {questions.length}</span>
              <span>{Math.round(progressPercent)}% Complete</span>
            </div>
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-indigo transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Question Countdown Timer (Timed Mode) */}
          {timedModeEnabled && currentQuestion && (
            <div className="mt-2">
              <TimerBar key={currentQuestion.id} seconds={timedModeSeconds} onTimeout={handleQuestionTimeout} />
            </div>
          )}

          {currentQuestion && (
            <div className="flex flex-col gap-6 my-4 animate-reveal">
              {/* Category tag */}
              <span className="self-start text-[10px] uppercase font-extrabold tracking-wider bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 px-2.5 py-1 rounded-md">
                {currentQuestion.category} Question
              </span>

              {/* Question Text */}
              <h3 className="text-lg md:text-xl font-bold leading-relaxed text-white">
                {currentQuestion.questionText}
              </h3>

              {/* MCQ Options */}
              <div className="grid grid-cols-1 gap-3.5 mt-2">
                {currentQuestion.options.map((opt, optIdx) => {
                  const isSelected = answers[currentQuestion.id] === optIdx;
                  return (
                    <button
                      key={optIdx}
                      onClick={() => handleSelect(currentQuestion.id, optIdx)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between group ${
                        isSelected 
                          ? 'border-indigo-500 bg-indigo-500/10 text-white font-semibold' 
                          : 'border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10 text-gray-300'
                      }`}
                    >
                      <span>{opt}</span>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                        isSelected 
                          ? 'border-indigo-500 bg-indigo-500 text-white' 
                          : 'border-white/20 group-hover:border-white/40'
                      }`}>
                        {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Row */}
          <div className="flex justify-between items-center border-t border-white/5 pt-6 mt-4">
            <span className="text-xs text-gray-500 italic">No going back once submitted</span>
            
            {currentIndex < questions.length - 1 ? (
              <button
                onClick={handleNext}
                disabled={answers[currentQuestion.id] === undefined}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition flex items-center gap-2"
              >
                <span>Next Question</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-8 py-3 bg-gradient-indigo hover:opacity-90 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition flex items-center gap-2"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Submit & End Round</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
