import React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import RoundProgressBar from '../components/RoundProgressBar';
import { Trophy, ArrowRight, ShieldCheck, AlertCircle, HelpCircle } from 'lucide-react';

export default function RoundTransitionScreen() {
  const { sessionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Retrieve state parameters passed during navigation redirect
  const { completedRound, nextRound, score, passed } = location.state || {
    completedRound: 'APTITUDE',
    nextRound: 'COMMUNICATION',
    score: 80,
    passed: true
  };

  const handleContinue = () => {
    if (nextRound === 'REPORT') {
      navigate(`/interview/${sessionId}/report`);
    } else {
      navigate(`/interview/${sessionId}/round/${nextRound.toLowerCase()}`);
    }
  };

  return (
    <div className="min-h-screen bg-darkBg flex flex-col text-white relative overflow-hidden">
      <div className="glow-bg w-[500px] h-[500px] bg-indigo-500/10 top-[-100px] right-[-100px]" />
      
      <Navbar />

      <main className="flex-1 p-8 overflow-y-auto max-w-3xl mx-auto w-full relative z-10 flex flex-col justify-center">
        <RoundProgressBar currentRound={completedRound} />

        <div className="glass-card rounded-3xl p-8 border flex flex-col items-center justify-center text-center gap-6 mt-4 relative overflow-hidden">
          
          {/* Circular Trophy/Status Icon */}
          <div className={`w-20 h-20 rounded-full flex items-center justify-center border-2 ${
            passed 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
              : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
          }`}>
            {passed ? <ShieldCheck className="w-10 h-10" /> : <Trophy className="w-10 h-10" />}
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="font-display font-extrabold text-2xl">
              Round: {completedRound} Completed!
            </h2>
            <p className="text-gray-400 text-sm">
              Your performance score for this stage has been processed and saved.
            </p>
          </div>

          {/* Scores breakdown */}
          <div className="w-full max-w-sm rounded-2xl bg-white/5 border border-white/5 p-5 flex flex-col gap-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Section Score</span>
              <span className="text-lg font-mono font-bold text-white">{score}%</span>
            </div>
            
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Pass/Fail Status</span>
              <span className={`px-2.5 py-0.5 rounded font-extrabold text-xs uppercase ${
                passed 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}>
                {passed ? 'PASSED (Proceeding)' : 'PRACTICE MODE ENABLED'}
              </span>
            </div>
          </div>

          {!passed && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs flex gap-2 items-start text-left max-w-md">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>Your score fell below the target threshold. You are allowed to proceed in **Practice Mode** for trial training and evaluation.</span>
            </div>
          )}

          {/* Action CTA */}
          <button
            onClick={handleContinue}
            className="w-full max-w-sm py-4 bg-gradient-indigo hover:opacity-90 text-white rounded-xl font-bold transition flex items-center justify-center gap-2 text-sm shadow-lg shadow-indigo-500/20 mt-2"
          >
            <span>{nextRound === 'REPORT' ? 'View Final consolidated Report' : `Continue to Round: ${nextRound}`}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

        </div>
      </main>
    </div>
  );
}
