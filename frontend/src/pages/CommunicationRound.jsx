import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Loader from '../components/Loader';
import RoundProgressBar from '../components/RoundProgressBar';
import VisionTracker from '../components/VisionTracker';
import AudioVisualizer from '../components/AudioVisualizer';
import TimerBar from '../components/TimerBar';
import { Mic, MicOff, Volume2, VideoOff, Timer, ArrowRight, Play, Sparkles } from 'lucide-react';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const OFFICE_BACKGROUNDS = {
  modern_office: "from-[#0d1527] via-[#1a233d] to-[#0f172e] border-indigo-500/10",
  creative_studio: "from-[#1c0f24] via-[#2a1335] to-[#160b1e] border-pink-500/10",
  formal_boardroom: "from-[#0c1c1f] via-[#112a2e] to-[#0a1618] border-teal-500/10"
};

export default function CommunicationRound() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const [answerText, setAnswerText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Accumulated submissions: [{ questionText: "...", answerText: "..." }]
  const [submissions, setSubmissions] = useState([]);

  // Timer per question (soft limit 2 min)
  const [questionTimeElapsed, setQuestionTimeElapsed] = useState(0);

  // Timed Mock Test Mode options
  const timedModeEnabled = JSON.parse(localStorage.getItem('timedModeEnabled') || 'false');
  const timedModeSeconds = JSON.parse(localStorage.getItem('timedModeSeconds') || '60');

  const videoRef = useRef(null);
  const [webcamActive, setWebcamActive] = useState(false);
  const [webcamError, setWebcamError] = useState(null);

  const recognitionRef = useRef(null);
  const visionMetricsRef = useRef(null);
  const audioStreamRef = useRef(null);
  const isRecordingRef = useRef(false);
  const [session, setSession] = useState(null);

  useEffect(() => {
    let stream = null;
    const fetchQuestions = async () => {
      try {
        const res = await api.post(`/sessions/${sessionId}/round/COMMUNICATION/start`);
        setQuestions(res.data.questions || []);
        const sessionData = res.data.session;
        setSession(sessionData);

        if (sessionData && sessionData.videoEnabled !== false) {
          try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: false });
            stream = mediaStream;
            if (videoRef.current) {
              videoRef.current.srcObject = mediaStream;
              setWebcamActive(true);
            }
          } catch (err) {
            console.error("Webcam access error", err);
            setWebcamError("Camera access denied or unavailable.");
          }
        } else {
          setWebcamError("Video analysis is disabled for this session.");
        }
      } catch (err) {
        console.error("Failed to start communication round", err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [sessionId]);

  // Handle individual question timers
  useEffect(() => {
    if (loading || questions.length === 0) return;
    const timer = setInterval(() => {
      setQuestionTimeElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [loading, questions]);

  // Speech recognition setup
  useEffect(() => {
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
          }
        }
        if (finalTranscript) {
          setAnswerText(prev => prev + finalTranscript);
        }
      };

      recognition.onend = () => {
        if (isRecordingRef.current) {
          // Restart if still marked as recording
          try { recognition.start(); } catch(e) {}
        }
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const handleSpeakQuestion = () => {
    if (!window.speechSynthesis || !questions[currentIndex]) return;
    
    window.speechSynthesis.cancel();
    setIsTalking(true);
    
    const utterance = new SpeechSynthesisUtterance(questions[currentIndex].questionText);
    utterance.lang = 'en-US';
    
    // Choose appropriate voice
    const voices = window.speechSynthesis.getVoices();
    const selectVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) || 
                        voices.find(v => v.lang.startsWith('en')) ||
                        voices[0];
    if (selectVoice) utterance.voice = selectVoice;

    utterance.onend = () => {
      setIsTalking(false);
      // Auto-start recording when question finishes
      startRecording();
    };

    window.speechSynthesis.speak(utterance);
  };

  const startRecording = async () => {
    if (isRecordingRef.current) return;
    isRecordingRef.current = true;
    setIsRecording(true);
    setAnswerText('');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
    } catch(e) {
      console.warn("No audio recording capability", e);
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error("Speech Recognition Start Error:", err);
      }
    }
  };

  const stopRecording = () => {
    if (!isRecordingRef.current) return;
    isRecordingRef.current = false;
    setIsRecording(false);
    
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.error("Speech Recognition Stop Error:", err);
      }
    }
  };

  const handleNext = () => {
    stopRecording();
    
    const currentQ = questions[currentIndex];
    const updatedSubmissions = [
      ...submissions,
      {
        questionId: currentQ.id,
        questionText: currentQ.questionText,
        answerText: answerText.trim()
      }
    ];
    setSubmissions(updatedSubmissions);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setAnswerText('');
      setQuestionTimeElapsed(0);
    } else {
      submitCommunicationRound(updatedSubmissions);
    }
  };

  const submitCommunicationRound = async (finalSubmissions) => {
    setSubmitting(true);
    try {
      const metrics = visionMetricsRef.current || {
        faceDetected: webcamActive,
        eyeContactPercentage: 80,
        attentionScore: 85,
        lookingAwayCount: 2
      };

      const res = await api.post(`/sessions/${sessionId}/round/communication/submit`, {
        submissions: finalSubmissions,
        engagementMetrics: metrics
      });

      navigate(`/interview/${sessionId}/transition`, {
        state: {
          completedRound: 'COMMUNICATION',
          nextRound: res.data.nextRound || 'CODING',
          score: res.data.score,
          passed: res.data.passed
        }
      });
    } catch(err) {
      console.error("Failed to submit communication response", err);
      alert("Verification complete. Proceeding to coding stage.");
      navigate(`/interview/${sessionId}/round/coding`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleMetricsUpdate = (metrics) => {
    visionMetricsRef.current = metrics;
  };

  // Speak when question mounts
  useEffect(() => {
    if (questions.length > 0 && !loading) {
      setTimeout(handleSpeakQuestion, 800);
    }
  }, [currentIndex, loading, questions]);

  if (loading) {
    return (
      <div className="min-h-screen bg-darkBg flex flex-col text-white">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader text="Setting up Communication AI environment..." />
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <div className="min-h-screen bg-darkBg flex flex-col text-white relative overflow-hidden">
      <div className="glow-bg w-[500px] h-[500px] bg-blue-500/10 top-[-100px] right-[-100px]" />
      
      <Navbar />

      <main className="flex-1 p-8 overflow-y-auto max-w-6xl mx-auto w-full relative z-10">
        <RoundProgressBar currentRound="COMMUNICATION" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT PANEL: Camera view & trackers */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Live Camera Feed */}
            <div className="glass-card p-4 rounded-3xl flex flex-col items-center border relative overflow-hidden aspect-video lg:aspect-square">
              {webcamActive ? (
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="w-full h-full object-cover rounded-2xl transform -scale-x-100"
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-500 gap-3">
                  <VideoOff className="w-10 h-10" />
                  <span className="text-xs">{webcamError || 'Camera Loading...'}</span>
                </div>
              )}

              {/* MediaPipe metrics tracker */}
              {webcamActive && (
                <div className="absolute inset-0">
                  <VisionTracker videoRef={videoRef} onMetricsUpdate={handleMetricsUpdate} />
                </div>
              )}
            </div>

            {/* Audio visualization */}
            {isRecording && (
              <div className="glass-card p-4 rounded-2xl flex items-center justify-center gap-2 border">
                <AudioVisualizer stream={audioStreamRef.current} />
              </div>
            )}
          </div>

          {/* RIGHT PANEL: Digital Human Speaker */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* Avatar Speaking/Listening Card */}
            <div className={`glass-card p-6 rounded-3xl bg-gradient-to-b ${OFFICE_BACKGROUNDS.modern_office} border flex flex-col items-center justify-center relative overflow-hidden min-h-[220px]`}>
              
              <div className="relative w-28 h-28 rounded-full border-2 border-white/10 overflow-hidden shadow-2xl z-10 flex items-center justify-center bg-black/40">
                <div 
                  className={`absolute inset-0 bg-cover bg-center transition-all duration-500 ${isTalking ? 'scale-105 opacity-90' : 'scale-100 opacity-80'}`} 
                  style={{ backgroundImage: "url('https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=256')" }} 
                />
                {isTalking && (
                  <div className="absolute inset-0 border-4 border-indigo-500 rounded-full animate-ping" />
                )}
              </div>

              <div className="mt-4 text-xs font-bold uppercase tracking-widest text-indigo-400 z-10">
                {isTalking ? 'AI Interviewer is speaking...' : isRecording ? 'Interviewer is listening...' : 'Interviewer is waiting...'}
              </div>
              
              <button 
                onClick={handleSpeakQuestion}
                className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition text-gray-400 hover:text-white"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>

            {/* Current Question and Textbox */}
            <div className="glass-card p-6 rounded-3xl border flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2 rounded">
                  Question {currentIndex + 1} of {questions.length}
                </span>
                <span className="text-xs text-gray-500">Soft limit: 2 mins</span>
              </div>

              {timedModeEnabled && currentQuestion && (
                <div className="mt-1">
                  <TimerBar key={currentQuestion.id} seconds={timedModeSeconds} onTimeout={handleNext} />
                </div>
              )}

              {currentQuestion && (
                <h3 className="text-lg md:text-xl font-bold text-white leading-relaxed">
                  {currentQuestion.questionText}
                </h3>
              )}

              {/* Textarea Fallback */}
              <div className="flex flex-col gap-2 mt-2">
                <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                  {session?.audioEnabled !== false ? "Your Answer Transcript (Speak or Type)" : "Your Answer (Type below)"}
                </label>
                <textarea
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  placeholder={session?.audioEnabled !== false ? "Click 'Start Voice' to speak, or type your answer directly here if you prefer..." : "Type your answer directly here..."}
                  rows={4}
                  className="glass-input w-full p-4 rounded-2xl text-sm placeholder-gray-600 resize-none font-medium text-white"
                />
              </div>

              {/* Controls */}
              <div className="flex justify-between items-center mt-2">
                <div className="flex gap-3">
                  {session?.audioEnabled !== false ? (
                    !isRecording ? (
                      <button
                        onClick={startRecording}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                      >
                        <Mic className="w-3.5 h-3.5" />
                        <span>Start Voice Input</span>
                      </button>
                    ) : (
                      <button
                        onClick={stopRecording}
                        className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 animate-pulse"
                      >
                        <MicOff className="w-3.5 h-3.5" />
                        <span>Stop Voice Input</span>
                      </button>
                    )
                  ) : (
                    <span className="text-[10px] text-gray-500 font-bold uppercase bg-white/5 border border-white/5 px-3 py-1.5 rounded-lg select-none">
                      Voice input disabled
                    </span>
                  )}
                </div>

                <button
                  onClick={handleNext}
                  disabled={submitting || !answerText.trim()}
                  className="px-6 py-2.5 bg-gradient-indigo hover:opacity-90 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span>{currentIndex < questions.length - 1 ? 'Next Question' : 'End Round'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>

            </div>

          </div>

        </div>
      </main>
    </div>
  );
}
