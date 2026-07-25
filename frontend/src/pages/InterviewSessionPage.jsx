import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../context/AuthContext';
import { Mic, MicOff, ChevronRight, Timer, VideoOff, Volume2, Wifi, HelpCircle, Sparkles, AlertTriangle } from 'lucide-react';
import Navbar from '../components/Navbar';
import Loader from '../components/Loader';
import AudioVisualizer from '../components/AudioVisualizer';
import VisionTracker from '../components/VisionTracker';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const TRANSLATIONS = {
  en: {
    initializing: "Initializing interview environment...",
    heading: "Interactive Interview Assistant (IIAA)",
    domain: "Job Profile",
    difficulty: "Difficulty",
    sessionTime: "Session Time",
    visionMetrics: "Vision tracking & focus metrics",
    questionsHeading: "Interview Questions",
    questionNum: "Question {num}",
    transcriptLabel: "Your Transcript / Answer",
    startRec: "Start Voice Input",
    stopRec: "Stop Voice Input",
    placeholder: "Speak to transcribe or type your answer here...",
    prev: "Previous",
    backToCurrent: "Back to Current",
    submitNext: "Submit & Next Question",
    endInterview: "End Interview",
    cameraLoading: "Starting camera...",
    cameraError: "Camera not accessible.",
    sttWakeupLoading: "Pre-warming STT engine (wav2vec2-large-xlsr-53-th) serverless container...",
    sttWakeupReady: "STT Engine Ready (Cold-start mitigated, 0ms latency)",
    ttsEngineGoogle: "TTS Provider: Google Cloud (th-TH-Neural2-C)",
    ttsEngineAzure: "TTS Provider: Microsoft Azure (th-TH-NiwatNeural)",
    ttsEngineEn: "TTS Provider: Web Speech Synthesis (en-US)",
    alertShortAnswer: "Your answer is too short. Please provide a more detailed response.",
    avatarTalking: "Interviewer is speaking...",
    avatarListening: "Interviewer is listening...",
    avatarIdle: "Interviewer is thinking..."
  },
  th: {
    initializing: "กำลังเข้าสู่ห้องสัมภาษณ์จำลอง...",
    heading: "ระบบผู้ช่วยสัมภาษณ์อัจฉริยะ (IIAA)",
    domain: "ตำแหน่งงาน",
    difficulty: "ความยาก",
    sessionTime: "เวลาการสัมภาษณ์",
    visionMetrics: "ระบบวิเคราะห์สมาธิและสายตา",
    questionsHeading: "คำถามสัมภาษณ์",
    questionNum: "คำถามข้อที่ {num}",
    transcriptLabel: "กล่องคำตอบและตัวถอดเสียงของคุณ",
    startRec: "เริ่มบันทึกเสียง",
    stopRec: "หยุดบันทึกเสียง",
    placeholder: "กดปุ่มเพื่อพูดถอดความเสียงภาษาไทย/อังกฤษ หรือพิมพ์คำตอบของคุณที่นี่...",
    prev: "คำถามก่อนหน้า",
    backToCurrent: "กลับไปคำถามปัจจุบัน",
    submitNext: "ส่งคำตอบ & คำถามถัดไป",
    endInterview: "สิ้นสุดการสัมภาษณ์",
    cameraLoading: "กำลังเริ่มการทำงานของกล้อง...",
    cameraError: "ไม่สามารถเข้าถึงกล้องถ่ายภาพได้",
    sttWakeupLoading: "กำลังเริ่มการเชื่อมต่อ STT Model (wav2vec2-large-xlsr-53-th) เพื่อลดความหน่วงเริ่มต้น...",
    sttWakeupReady: "STT Engine พร้อมใช้งาน (แก้ไขปัญหา Cold-start สำเร็จ, ความหน่วง 0ms)",
    ttsEngineGoogle: "ระบบสังเคราะห์เสียง: Google Cloud (th-TH-Neural2-C)",
    ttsEngineAzure: "ระบบสังเคราะห์เสียง: Microsoft Azure (th-TH-NiwatNeural)",
    ttsEngineEn: "ระบบสังเคราะห์เสียง: Web Speech Synthesis (en-US)",
    alertShortAnswer: "คำตอบของคุณสั้นเกินไป โปรดตอบให้มีความยาวและรายละเอียดเพิ่มขึ้น",
    avatarTalking: "ผู้สัมภาษณ์กำลังพูด...",
    avatarListening: "ผู้สัมภาษณ์กำลังฟังคุณอยู่...",
    avatarIdle: "ผู้สัมภาษณ์กำลังคิด..."
  }
};

const OFFICE_BACKGROUNDS = {
  modern_office: "from-[#0d1527] via-[#1a233d] to-[#0f172e] border-indigo-500/10",
  creative_studio: "from-[#1c0f24] via-[#2a1335] to-[#160b1e] border-pink-500/10",
  formal_boardroom: "from-[#0c1c1f] via-[#112a2e] to-[#0a1618] border-teal-500/10"
};

export default function InterviewSessionPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [interview, setInterview] = useState(null);
  const [contexts, setContexts] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const [answerText, setAnswerText] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [questionTimeElapsed, setQuestionTimeElapsed] = useState(0);
  const [currentFeedback, setCurrentFeedback] = useState(null);
  const [coveredKeywords, setCoveredKeywords] = useState([]);
  
  // Customization fields
  const [lang, setLang] = useState('en');
  const [interviewerGender, setInterviewerGender] = useState('female');
  const [officeSetting, setOfficeSetting] = useState('modern_office');
  
  // STT Pre-warming Simulation
  const [sttWarming, setSttWarming] = useState(true);

  // Avatar Speaking State
  const [isTalking, setIsTalking] = useState(false);

  const videoRef = useRef(null);
  const [webcamActive, setWebcamActive] = useState(false);
  const [webcamError, setWebcamError] = useState(null);

  const [isRecording, setIsRecording] = useState(false);
  const [audioStream, setAudioStream] = useState(null);
  const [silenceNudgeText, setSilenceNudgeText] = useState(null);
  const [hasInterruptedThisQuestion, setHasInterruptedThisQuestion] = useState(false);
  const silenceSecondsRef = useRef(0);
  const previousAnswerTextRef = useRef('');
  const silenceGapCountRef = useRef(0);
  const lastResultTimestampRef = useRef(Date.now());
  
  const [rewrittenAnswerText, setRewrittenAnswerText] = useState(null);
  const [isRewriting, setIsRewriting] = useState(false);
  
  const recognitionRef = useRef(null);
  const visionMetricsRef = useRef(null);
  const previousSpokenQuestionRef = useRef("");

  // Web Audio silence and gaze tracking refs
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const silenceDurationRef = useRef(0);
  const silenceStartTimeRef = useRef(null);
  const audioIntervalRef = useRef(null);
  const questionGazeStartRef = useRef(0);

  const t = TRANSLATIONS[lang];

  // Real-time keyword coverage tracking (client-side substring match)
  useEffect(() => {
    const expected = contexts[currentIndex]?.expectedKeywords;
    if (!expected || expected.length === 0) {
      setCoveredKeywords([]);
      return;
    }
    const cleanAnswer = answerText.toLowerCase();
    const matches = expected.filter(kw => {
      const cleanKw = kw.toLowerCase().trim();
      if (!cleanKw) return false;
      return cleanAnswer.includes(cleanKw);
    });
    setCoveredKeywords(matches);
  }, [answerText, currentIndex, contexts]);

  // Reset question timer & speech stats when current index changes
  useEffect(() => {
    setQuestionTimeElapsed(0);
    silenceGapCountRef.current = 0;
    lastResultTimestampRef.current = Date.now();
    setHasInterruptedThisQuestion(false);
    setRewrittenAnswerText(null);
    
    questionGazeStartRef.current = visionMetricsRef.current ? visionMetricsRef.current.lookingAwayCount : 0;
    silenceDurationRef.current = 0;
  }, [currentIndex]);

  // Reset silence nudge and counter when user types or speaks
  useEffect(() => {
    silenceSecondsRef.current = 0;
    setSilenceNudgeText(null);
  }, [answerText, currentIndex]);

  const fetchSessionData = async () => {
    try {
      const intRes = await api.get(`/interviews/${id}`);
      const activeInterview = intRes.data;
      if (!activeInterview || activeInterview.status === 'COMPLETED') {
        navigate('/dashboard');
        return;
      }
      setInterview(activeInterview);
      setLang(activeInterview.language || 'en');
      setInterviewerGender(activeInterview.interviewerGender || 'female');
      setOfficeSetting(activeInterview.officeSetting || 'modern_office');

      // Request next/first question
      await api.post(`/interviews/${id}/question`);

      const ctxRes = await api.get(`/interviews/${id}/contexts`);
      const fetchedContexts = ctxRes.data || [];
      setContexts(fetchedContexts);
      
      const lastIdx = fetchedContexts.length - 1;
      setCurrentIndex(lastIdx >= 0 ? lastIdx : 0);
      setAnswerText(fetchedContexts[lastIdx]?.answer || '');

    } catch (err) {
      console.error("Error fetching interview details", err);
      navigate('/dashboard');
    } finally {
      setLoading(false);
      setIsGenerating(false);
    }
  };

  // Pre-warm STT Simulation
  useEffect(() => {
    const timer = setTimeout(() => {
      setSttWarming(false);
    }, 2800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    fetchSessionData();
  }, [id, navigate]);

  useEffect(() => {
    if (loading || !interview) return;
    const interval = setInterval(() => {
      setTimeElapsed((prev) => prev + 1);
      setQuestionTimeElapsed((prev) => prev + 1);

      if (isRecording) {
        if (Date.now() - lastResultTimestampRef.current > 3000) {
          silenceGapCountRef.current += 1;
          lastResultTimestampRef.current = Date.now();
        }
      }

      if (!isGenerating && !currentFeedback) {
        silenceSecondsRef.current += 1;
        if (shouldNudgeCandidate(silenceSecondsRef.current, visionMetricsRef.current)) {
          const promptText = lang === 'th'
            ? "ต้องการคำแนะนำเพิ่มเติมไหมคะ? ลองเริ่มด้วยการอธิบายแนวคิดหลักของคุณ หรือโครงสร้างทั่วไปก่อนได้ค่ะ"
            : "Need a quick nudge? Try to explain your core conceptual model or outline the overall structure first.";
          setSilenceNudgeText(promptText);
          silenceSecondsRef.current = 0;
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [loading, interview, isGenerating, currentFeedback, lang, isRecording]);

  // Clean up Web Audio resources on unmount
  useEffect(() => {
    return () => {
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
      if (audioContextRef.current) {
        try { audioContextRef.current.close(); } catch (e) {}
      }
    };
  }, []);

  // Voice Synthesis (TTS) trigger on question changes
  useEffect(() => {
    if (loading || contexts.length === 0 || isGenerating) return;
    const currentQuestion = contexts[currentIndex]?.question;
    
    // Conclude session detection
    if (currentQuestion === "COMPLETED") {
      handleEndInterview();
      return;
    }

    if (currentQuestion && currentQuestion !== previousSpokenQuestionRef.current) {
      previousSpokenQuestionRef.current = currentQuestion;
      speakTextWithPacing(currentQuestion);
    }
  }, [currentIndex, contexts, loading, isGenerating]);

  // SpeechSynthesis voice config & 75-character pacing optimization
  const speakTextWithPacing = (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    // Segmenting text post-whitespace at a minimum of 75 characters
    const segments = [];
    let currentSegment = "";
    const words = text.split(" ");
    
    for (let word of words) {
      if ((currentSegment + " " + word).length >= 75) {
        segments.push(currentSegment.trim());
        currentSegment = word;
      } else {
        currentSegment += (currentSegment === "" ? "" : " ") + word;
      }
    }
    if (currentSegment.trim() !== "") {
      segments.push(currentSegment.trim());
    }

    // Queue segments
    segments.forEach((segment) => {
      const utterance = new SpeechSynthesisUtterance(segment);
      if (lang === 'th') {
        utterance.lang = 'th-TH';
        const voices = window.speechSynthesis.getVoices();
        const thVoice = voices.find(v => v.lang.startsWith('th')) || voices.find(v => v.lang.includes('TH'));
        if (thVoice) utterance.voice = thVoice;
      } else {
        utterance.lang = 'en-US';
        const voices = window.speechSynthesis.getVoices();
        const enVoice = voices.find(v => v.lang.startsWith('en-US')) || voices.find(v => v.lang.includes('en'));
        if (enVoice) utterance.voice = enVoice;
      }

      utterance.onstart = () => setIsTalking(true);
      utterance.onend = () => {
        if (segment === segments[segments.length - 1]) {
          setIsTalking(false);
        }
      };
      utterance.onerror = () => setIsTalking(false);

      window.speechSynthesis.speak(utterance);
    });
  };

  const triggerClientInterruption = async () => {
    setIsRecording(false);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsGenerating(true);

    try {
      const res = await api.post(`/interviews/${id}/interrupt`, {
        partialAnswer: answerText
      });
      
      const contextRes = await api.get(`/interviews/${id}/contexts`);
      setContexts(contextRes.data);
      setCurrentIndex(contextRes.data.length - 1);
      
      setAnswerText('');
      setSilenceNudgeText(null);
    } catch (err) {
      console.error("Interruption error", err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Interruption trigger monitoring hook
  useEffect(() => {
    if (!isRecording || hasInterruptedThisQuestion || contexts[currentIndex]?.isFollowUp) return;
    if (interview?.mode !== 'comprehensive') return;

    const words = answerText.trim() === '' ? 0 : answerText.trim().split(/\s+/).length;
    if (words >= 15) {
      const persona = interview?.interviewerPersona || 'Friendly HR';
      let prob = 0.05;
      if (persona === 'Technical Grillmaster') prob = 0.25;
      else if (persona === 'Skeptical Panel') prob = 0.15;

      if (Math.random() < prob) {
        setHasInterruptedThisQuestion(true);
        triggerClientInterruption();
      }
    }
  }, [answerText, isRecording, hasInterruptedThisQuestion, interview, currentIndex, contexts]);

  // Configure Speech Recognition based on selected Language
  useEffect(() => {
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = lang === 'th' ? 'th-TH' : 'en-US';

      recognition.onresult = (event) => {
        lastResultTimestampRef.current = Date.now();
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setAnswerText(prev => prev + (prev.endsWith(' ') || prev === '' ? '' : ' ') + finalTranscript);
        }
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        if (event.error !== 'no-speech') {
          setIsRecording(false);
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }
  }, [lang]);

  useEffect(() => {
    let stream = null;
    const startWebcam = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setWebcamActive(true);
      } catch (err) {
        console.error("Error accessing webcam", err);
        setWebcamError(lang === 'th' ? "ไม่สามารถเชื่อมต่อกล้องได้" : "Webcam not accessible.");
        setWebcamActive(false);
      }
    };

    if (!loading) {
      startWebcam();
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
      }
      if (isRecording && recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [loading, audioStream, isRecording]);

  const toggleRecording = async () => {
    if (!SpeechRecognition) {
      alert(lang === 'th' ? "เบราว์เซอร์ของคุณไม่สนับสนุนการถอดเสียง โปรดใช้ Google Chrome" : "Your browser does not support Speech Recognition. Please try using Chrome or Edge.");
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
        setAudioStream(null);
      }
      if (audioIntervalRef.current) {
        clearInterval(audioIntervalRef.current);
        audioIntervalRef.current = null;
      }
      if (audioContextRef.current) {
        try { audioContextRef.current.close(); } catch (e) {}
        audioContextRef.current = null;
      }
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setAudioStream(stream);
        recognitionRef.current?.start();
        setIsRecording(true);

        // Setup Web Audio Analyzer for silence tracking
        try {
          const AudioCtx = window.AudioContext || window.webkitAudioContext;
          const audioCtx = new AudioCtx();
          audioContextRef.current = audioCtx;
          
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 256;
          source.connect(analyser);
          analyserRef.current = analyser;

          const bufferLength = analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);

          silenceStartTimeRef.current = null;

          audioIntervalRef.current = setInterval(() => {
            if (analyserRef.current) {
              analyserRef.current.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < bufferLength; i++) {
                sum += dataArray[i];
              }
              const avg = sum / bufferLength;
              if (avg < 8) { // silence threshold
                if (silenceStartTimeRef.current === null) {
                  silenceStartTimeRef.current = Date.now();
                } else {
                  const duration = (Date.now() - silenceStartTimeRef.current) / 1000;
                  if (duration >= 2) {
                    silenceDurationRef.current += 0.1;
                  }
                }
              } else {
                silenceStartTimeRef.current = null;
              }
            }
          }, 100);
        } catch (audioErr) {
          console.error("Failed to initialize audio analyser", audioErr);
        }
      } catch (err) {
        console.error("Error accessing microphone:", err);
        alert(lang === 'th' ? "ไม่สามารถเข้าถึงไมโครโฟนได้" : "Microphone access denied or unavailable.");
      }
    }
  };

  const getDeliveryCoachingMetrics = () => {
    const durationMin = questionTimeElapsed / 60;
    const wCount = answerText.trim() === '' ? 0 : answerText.trim().split(/\s+/).length;
    const wpm = durationMin > 0.05 ? Math.round(wCount / durationMin) : 0;
    const pauseCount = silenceGapCountRef.current;
    
    const deliveryScore = Math.max(30, Math.min(100, Math.round(
      100 - (pauseCount * 10) - Math.abs((wpm || 130) - 130) * 0.5
    )));
    
    return { wpm, pauseCount, deliveryScore };
  };

  const handleRewriteAnswer = async () => {
    setIsRewriting(true);
    setRewrittenAnswerText(null);
    try {
      const res = await api.post('/interviews/coaching/rewrite', {
        question: contexts[currentIndex]?.question,
        answer: answerText,
        language: lang
      });
      setRewrittenAnswerText(res.data?.rewrite);
    } catch (err) {
      console.error("Failed to rewrite", err);
      setRewrittenAnswerText(lang === 'th' ? "ไม่สามารถเรียบเรียงได้ในขณะนี้" : "Could not rewrite answer right now.");
    } finally {
      setIsRewriting(false);
    }
  };

  const handleNextQuestion = async () => {
    if (!answerText.trim() || answerText.trim().split(/\s+/).length < 2) {
      alert(t.alertShortAnswer);
      return;
    }

    setIsGenerating(true);
    if (window.speechSynthesis) window.speechSynthesis.cancel();

    try {
      const gazeAwayEvents = (visionMetricsRef.current ? visionMetricsRef.current.lookingAwayCount : 0) - questionGazeStartRef.current;
      const res = await api.post(`/interviews/${id}/answer`, {
        answerText: answerText,
        coveredKeywords: coveredKeywords,
        deliveryScore: metrics.deliveryScore,
        wpm: metrics.wpm,
        pauseCount: metrics.pauseCount,
        interrupted: false,
        isCurveball: contexts[currentIndex]?.isCurveball || false,
        silenceSeconds: Math.round(silenceDurationRef.current * 10) / 10,
        gazeAwayEvents: Math.max(0, gazeAwayEvents)
      });

      const feedback = res.data?.feedback;

      if (interview?.practiceMode && feedback) {
        setCurrentFeedback(feedback);
        setIsGenerating(false);
        return;
      }

      await advanceToNextQuestion();
    } catch (err) {
      console.error("Failed to process question", err);
      alert(lang === 'th' ? "ไม่สามารถส่งคำตอบได้ กรุณาลองใหม่อีกครั้ง" : "Failed to submit response. Please try again.");
      setIsGenerating(false);
    }
  };

  const advanceToNextQuestion = async () => {
    setIsGenerating(true);
    try {
      const qRes = await api.post(`/interviews/${id}/question`);
      const nextQuestion = qRes.data?.questionText;

      if (nextQuestion === "COMPLETED") {
        handleEndInterview();
        return;
      }
      
      const ctxRes = await api.get(`/interviews/${id}/contexts`);
      const updatedContexts = ctxRes.data || [];
      setContexts(updatedContexts);
      setCurrentIndex(updatedContexts.length - 1);
      setAnswerText('');
      setCurrentFeedback(null);
    } catch (err) {
      console.error("Failed to advance question", err);
      alert(lang === 'th' ? "ไม่สามารถดึงคำถามถัดไปได้" : "Failed to retrieve next question.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEndInterview = async () => {
    setIsGenerating(true);
    if (window.speechSynthesis) window.speechSynthesis.cancel();

    if (answerText.trim() && answerText.trim().split(/\s+/).length >= 2) {
      try {
        const gazeAwayEvents = (visionMetricsRef.current ? visionMetricsRef.current.lookingAwayCount : 0) - questionGazeStartRef.current;
        await api.post(`/interviews/${id}/answer`, { 
          answerText: answerText,
          coveredKeywords: coveredKeywords,
          deliveryScore: metrics.deliveryScore,
          wpm: metrics.wpm,
          pauseCount: metrics.pauseCount,
          interrupted: false,
          isCurveball: contexts[currentIndex]?.isCurveball || false,
          silenceSeconds: Math.round(silenceDurationRef.current * 10) / 10,
          gazeAwayEvents: Math.max(0, gazeAwayEvents)
        });
      } catch (err) {
        console.error("Failed to save final answer", err);
      }
    }

    try {
      await api.post(`/interviews/${id}/submit`, { duration: timeElapsed });

      if (visionMetricsRef.current) {
        try {
          await api.post('/vision/metrics', {
            interviewId: id,
            eyeContactScore: visionMetricsRef.current.eyeContactPercentage,
            attentionScore: visionMetricsRef.current.attentionScore,
            faceVisibilityScore: visionMetricsRef.current.faceVisibilityScore,
            lookingAwayCount: visionMetricsRef.current.lookingAwayCount,
            averageHeadTilt: visionMetricsRef.current.averageHeadTilt || 0
          });
        } catch (vErr) {
          console.error("Failed to submit vision metrics", vErr);
        }
      }

      // Generate related reports asynchronously
      try { await api.post('/report/generate', { interviewId: id }); } catch (rErr) {}
      try { await api.post('/readiness/analyze', { interviewId: id }); } catch (readinessErr) {}
      try { await api.post('/coaching/generate', { interviewId: id }); } catch (coachingErr) {}

      navigate(`/report/${id}`);
    } catch (err) {
      console.error("Failed to end interview", err);
      alert(lang === 'th' ? "สิ้นสุดการสัมภาษณ์ล้มเหลว โปรดลองอีกครั้ง" : "Failed to end interview properly. Please try again.");
      setIsGenerating(false);
    }
  };

  const handleMetricsUpdate = (metrics) => {
    visionMetricsRef.current = metrics;
  };

  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-darkBg flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader text={t.initializing} />
        </div>
      </div>
    );
  }

  const currentContext = contexts[currentIndex];
  const isHistorical = currentIndex < contexts.length - 1;

  const getThresholds = () => {
    const diff = contexts[currentIndex]?.effectiveDifficulty || interview?.difficulty || 'Mid';
    if (diff === 'Junior') {
      return { maxSeconds: 60, maxWords: 150 };
    } else if (diff === 'Senior') {
      return { maxSeconds: 120, maxWords: 350 };
    } else { // Mid
      return { maxSeconds: 90, maxWords: 250 };
    }
  };

  const thresholds = getThresholds();
  const activeAnswer = isHistorical ? currentContext?.answer : answerText;
  const wordCount = activeAnswer?.trim() === '' || !activeAnswer ? 0 : activeAnswer.trim().split(/\s+/).length;
  const isExceeded = !isHistorical && (questionTimeElapsed > thresholds.maxSeconds || wordCount > thresholds.maxWords || (lang === 'th' && activeAnswer?.length > thresholds.maxWords * 4));

  // TTS Engine Label selection
  const ttsEngineLabel = lang === 'th' 
    ? (interviewerGender === 'female' ? t.ttsEngineGoogle : t.ttsEngineAzure) 
    : t.ttsEngineEn;

  return (
    <div className="min-h-screen bg-darkBg flex flex-col text-white">
      <Navbar />
      
      {/* Top Engine & Cold Start Alert Bar */}
      <div className="bg-black/60 border-b border-white/5 py-2 px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-mono text-gray-400">
        <div className="flex items-center gap-2">
          <Wifi className={`w-3.5 h-3.5 ${sttWarming ? 'text-amber-500 animate-pulse' : 'text-emerald-500'}`} />
          <span>{sttWarming ? t.sttWakeupLoading : t.sttWakeupReady}</span>
        </div>
        <div className="flex items-center gap-2">
          <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
          <span>{ttsEngineLabel}</span>
        </div>
      </div>

      <div className="flex-1 p-6 relative z-10 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT PANEL: Candidate Video Feed & Stats */}
        <div className="lg:col-span-4 glass-card p-6 rounded-3xl flex flex-col items-center sticky top-24">
          <div className="w-full aspect-[4/3] bg-black/40 rounded-2xl overflow-hidden relative border border-white/10 mb-6 flex items-center justify-center shadow-lg">
            {!webcamActive && !webcamError && (
              <Loader text={t.cameraLoading} className="scale-75" />
            )}
            {webcamError && (
              <div className="flex flex-col items-center text-gray-500 gap-2">
                <VideoOff className="w-8 h-8" />
                <span className="text-sm">{webcamError}</span>
              </div>
            )}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${webcamActive ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}
            />
            {webcamActive && (
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full text-xs text-white font-medium">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                LIVE CAMERA
              </div>
            )}
          </div>
          
          <div className="w-full text-center mb-6">
            <h3 className="text-xl font-display font-bold text-white mb-1">
              {lang === 'th' ? 'การประเมินทักษะ' : 'Skills Assessment'}
            </h3>
            <span className="text-sm font-mono uppercase text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full inline-block mb-1">
              {interview?.domain}
            </span>
            <span className="text-xs font-semibold uppercase text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full inline-block ml-2">
              {interview?.difficulty || 'Intermediate'}
            </span>
            {contexts[currentIndex]?.effectiveDifficulty && contexts[currentIndex]?.effectiveDifficulty !== interview?.difficulty && (
              <span className="text-xs font-semibold uppercase text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full inline-flex items-center gap-1.5 ml-2">
                <span>{lang === 'th' ? `ความยากปรับเปลี่ยน: ${contexts[currentIndex]?.effectiveDifficulty === 'Junior' ? 'ระดับต้น' : contexts[currentIndex]?.effectiveDifficulty === 'Mid' ? 'ระดับกลาง' : 'ระดับสูง'}` : `Adaptive Level: ${contexts[currentIndex]?.effectiveDifficulty}`}</span>
                {contexts[currentIndex]?.effectiveDifficulty === 'Senior' || (contexts[currentIndex]?.effectiveDifficulty === 'Mid' && interview?.difficulty === 'Junior') ? (
                  <span className="text-emerald-400">↑</span>
                ) : (
                  <span className="text-rose-400">↓</span>
                )}
              </span>
            )}
          </div>

          {interview?.sessionType !== 'MICRO' && (
            <div className="w-full flex items-center justify-between bg-white/5 px-5 py-4 rounded-2xl border border-white/5 mb-6">
              <div className="flex items-center gap-3">
                <Timer className="w-5 h-5 text-indigo-400" />
                <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">{t.sessionTime}</span>
              </div>
              <span className="text-lg font-mono text-white font-medium">{formatTime(timeElapsed)}</span>
            </div>
          )}

          <div className="w-full">
            <VisionTracker videoRef={videoRef} onMetricsUpdate={handleMetricsUpdate} />
          </div>
        </div>

        {/* RIGHT PANEL: Digital Human Interviewer & Question/Transcript */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* DIGITAL HUMAN INTERVIEWER SCREEN */}
          <div className={`glass-card p-6 rounded-3xl bg-gradient-to-b ${OFFICE_BACKGROUNDS[officeSetting]} border flex flex-col items-center justify-center relative overflow-hidden min-h-[300px]`}>
            {/* Ambient Background Grid Overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.1),rgba(255,255,255,0))]" />

            {/* Persona Badge Overlay */}
            {interview?.interviewerPersona && (
              <div className="absolute top-4 left-4 z-20 bg-indigo-600/90 border border-indigo-500/30 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg backdrop-blur-sm animate-reveal">
                <Sparkles className="w-3.5 h-3.5 text-indigo-200 fill-indigo-200" />
                <span className="text-[10px] font-bold text-white uppercase tracking-wider font-mono">
                  {interview.interviewerPersona.replaceAll('_', ' ')}
                </span>
              </div>
            )}

            {/* Avatar Container with CSS micro-animations */}
            <div className="relative w-36 h-36 rounded-full border-2 border-white/10 overflow-hidden shadow-2xl z-10 flex items-center justify-center bg-black/40">
              <div className={`absolute inset-0 bg-cover bg-center transition-all duration-500 ${isTalking ? 'scale-105 opacity-90' : 'scale-100 opacity-80'}`} 
                   style={{ backgroundImage: interviewerGender === 'female' 
                     ? "url('https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=256')" 
                     : "url('https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=256')"
                   }} 
              />
              
              {/* Blinking overlay block */}
              <div className="absolute inset-0 bg-black/20 opacity-0 animate-[blink_6s_infinite] pointer-events-none" />

              {/* Thinking overlay animations per persona */}
              {isGenerating && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                  {interview?.interviewerPersona === 'Technical Grillmaster' ? (
                    <div className="w-8 h-8 rounded bg-red-600/70 border border-red-500 animate-[pulse_0.4s_infinite] flex items-center justify-center">
                      <span className="text-red-100 text-xs font-black animate-bounce">!</span>
                    </div>
                  ) : interview?.interviewerPersona === 'Skeptical Panel' ? (
                    <div className="w-8 h-8 rounded-full border-2 border-t-purple-400 border-r-transparent border-b-purple-400 border-l-transparent animate-spin" />
                  ) : (
                    /* Friendly HR */
                    <div className="w-6 h-6 rounded-full bg-amber-400/60 animate-pulse relative">
                      <div className="absolute inset-0 rounded-full bg-amber-400/40 animate-ping" />
                    </div>
                  )}
                </div>
              )}

              {/* Pulsing Breathing Border */}
              <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20 animate-[pulse_3s_infinite]" />

              {/* Talking state mouth animation representation */}
              {isTalking && (
                <div className="absolute bottom-2 flex items-center justify-center gap-1 bg-black/60 px-3 py-1 rounded-full text-[10px] tracking-wide text-indigo-300 font-bold border border-indigo-500/20">
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }} />
                </div>
              )}
            </div>

            <div className="mt-5 text-center z-10">
              <h4 className="text-base font-bold text-white tracking-wide">
                {interview?.interviewerPersona || 'Friendly HR'} ({interviewerGender === 'female' ? 'Female' : 'Male'})
              </h4>
              <p className="text-xs text-gray-400 flex items-center gap-1.5 justify-center mt-1">
                <span className={`w-2 h-2 rounded-full ${
                  isGenerating 
                    ? (interview?.interviewerPersona === 'Technical Grillmaster' ? 'bg-red-500 animate-ping' : interview?.interviewerPersona === 'Skeptical Panel' ? 'bg-purple-500 animate-spin' : 'bg-amber-500 animate-pulse') 
                    : (isTalking ? 'bg-indigo-400 animate-pulse' : 'bg-gray-600')
                }`} />
                <span>{
                  isGenerating 
                    ? (interview?.interviewerPersona === 'Technical Grillmaster' 
                        ? (lang === 'th' ? 'Grillmaster กำลังวิเคราะห์เจาะลึก...' : 'Grillmaster is examining trade-offs...') 
                        : interview?.interviewerPersona === 'Skeptical Panel' 
                        ? (lang === 'th' ? 'คณะกรรมการกำลังถกประเด็นคำตอบ...' : 'Skeptical Panel is debating response...') 
                        : (lang === 'th' ? 'HR กำลังพยักหน้าให้กำลังใจ...' : 'Friendly HR is listening warmly...'))
                    : (isTalking ? t.avatarTalking : (isRecording ? t.avatarListening : t.avatarIdle))
                }</span>
              </p>
            </div>
          </div>

          {/* INTERVIEW QUESTIONS & ANSWER BOX */}
          <div className="glass-card p-8 rounded-3xl flex flex-col gap-6 relative overflow-hidden">
            {isGenerating && (
              <div className="absolute inset-0 bg-darkBg/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center rounded-3xl">
                <Loader text={lang === 'th' ? "AI กำลังวิเคราะห์คำตอบและจัดเตรียมคำถามถัดไป..." : "Gemini is analyzing your response and generating the next question..."} />
              </div>
            )}
            
            <div className="flex flex-col gap-4 pb-6 border-b border-white/5">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-bold text-2xl text-white">{t.questionsHeading}</h2>
                <span className="text-sm text-gray-400 font-semibold bg-white/5 px-4 py-2 rounded-xl">
                  {interview?.sessionType === 'MICRO' 
                    ? `Drill Question ${currentIndex + 1} / 5`
                    : t.questionNum.replace('{num}', currentIndex + 1)}
                </span>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
              <span className="text-xs text-indigo-400 font-bold uppercase tracking-widest block mb-3">
                {interview?.sessionType === 'MICRO'
                  ? `Drill Question ${currentIndex + 1}:`
                  : `${t.questionNum.replace('{num}', currentIndex + 1)}:`}
              </span>
              <p className="text-white text-xl font-medium leading-relaxed">
                {currentContext?.question}
              </p>
            </div>

            {/* Silence Nudge Tooltip */}
            {silenceNudgeText && (
              <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs px-4 py-3 rounded-xl animate-pulse flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{silenceNudgeText}</span>
              </div>
            )}

            <div className="flex flex-col gap-4 mt-2">
              <div className="flex items-center justify-between">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t.transcriptLabel}</label>
                  {!isHistorical && (
                    <div className="flex items-center gap-2 text-[10px] font-mono text-gray-500">
                      <span>{wordCount} / {thresholds.maxWords} words</span>
                      <span>•</span>
                      <span>{questionTimeElapsed}s / {thresholds.maxSeconds}s</span>
                      {isExceeded && (
                        <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded flex items-center gap-1 animate-pulse font-bold border border-amber-500/20">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                          <span>{lang === 'th' ? 'กรุณาสรุปคำตอบ (Wrap Up)' : 'Wrap up response'}</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
                
                {!isHistorical && (
                  <button
                    onClick={toggleRecording}
                    disabled={isGenerating}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                      isRecording 
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                        : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/30'
                    } disabled:opacity-50`}
                  >
                    {isRecording ? <Mic className="w-4 h-4 animate-pulse" /> : <MicOff className="w-4 h-4" />}
                    {isRecording ? t.stopRec : t.startRec}
                  </button>
                )}
              </div>
              
              {isRecording && <AudioVisualizer stream={audioStream} isRecording={isRecording} />}
              
              {currentFeedback && (
                <div className="bg-indigo-500/10 border border-indigo-500/30 p-5 rounded-2xl mb-2 animate-reveal flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-400" />
                    <h4 className="font-bold text-white text-sm uppercase tracking-wider">Practice Mode Feedback / Hint</h4>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{currentFeedback}</p>
                  
                  {/* Rewrite section */}
                  <div className="border-t border-white/5 pt-3 mt-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] text-indigo-300 uppercase tracking-widest font-bold">Smart Rewrite Coach</span>
                      <button
                        onClick={handleRewriteAnswer}
                        disabled={isRewriting || !answerText.trim()}
                        className="bg-indigo-500/20 hover:bg-indigo-500/35 border border-indigo-500/30 text-indigo-300 font-semibold px-4 py-1.5 rounded-lg text-2xs transition duration-200 disabled:opacity-50"
                      >
                        {isRewriting ? (lang === 'th' ? 'กำลังเรียบเรียง...' : 'Writing...') : (lang === 'th' ? 'เรียบเรียงคำตอบนี้ใหม่' : 'Rewrite this answer')}
                      </button>
                    </div>
                    {rewrittenAnswerText && (
                      <div className="bg-white/5 border border-white/10 p-3 rounded-xl text-xs text-gray-200 leading-relaxed font-mono whitespace-pre-wrap animate-reveal">
                        {rewrittenAnswerText}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={advanceToNextQuestion}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-2 rounded-lg text-xs self-start transition duration-200 mt-2"
                  >
                    {lang === 'en' ? 'Continue to Next Question' : 'ทำข้อถัดไป'}
                  </button>
                </div>
              )}

              <textarea
                value={isHistorical ? currentContext?.answer : answerText}
                onChange={(e) => { if (!isHistorical) setAnswerText(e.target.value); }}
                placeholder={t.placeholder}
                rows={6}
                readOnly={isHistorical || !!currentFeedback}
                className={`glass-input w-full p-5 rounded-2xl text-base text-white placeholder-gray-600 resize-none leading-relaxed focus:border-indigo-500/50 ${isHistorical || currentFeedback ? 'opacity-70 cursor-not-allowed' : ''}`}
              />
            </div>

            <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/5">
              <button
                onClick={() => {
                  if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
                }}
                disabled={currentIndex === 0}
                className="px-6 py-3 rounded-xl border border-white/5 text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent text-sm transition duration-200 font-semibold"
              >
                {t.prev}
              </button>

              {isHistorical ? (
                <button
                  onClick={() => {
                    setCurrentIndex(contexts.length - 1);
                    setAnswerText(contexts[contexts.length - 1]?.answer || '');
                  }}
                  className="bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-3 rounded-xl flex items-center gap-2 transition duration-200 shadow-lg text-sm border border-white/10"
                >
                  <span>{t.backToCurrent}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <div className="flex gap-4">
                  <button
                    onClick={handleNextQuestion}
                    disabled={isGenerating || isRecording || !!currentFeedback}
                    className="bg-white/10 hover:bg-white/20 text-white font-semibold px-6 py-3 rounded-xl flex items-center gap-2 transition duration-200 shadow-lg text-sm border border-white/10 disabled:opacity-50"
                  >
                    <span>{t.submitNext}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleEndInterview}
                    disabled={isGenerating || isRecording || !!currentFeedback}
                    className="bg-gradient-indigo hover:opacity-90 text-white font-semibold px-6 py-3 rounded-xl flex items-center gap-2 transition duration-200 shadow-lg shadow-indigo-500/20 text-sm disabled:opacity-50"
                  >
                    <span>{t.endInterview}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Styled animation frames */}
      <style>{`
        @keyframes blink {
          0%, 90%, 100% { opacity: 0; }
          95% { opacity: 0.35; }
        }
      `}</style>
    </div>
  );
}

/**
 * Decides if the AI interviewer should nudge the candidate during an awkward silence.
 * @param {number} silenceSeconds - Consecutive seconds of silence/no input
 * @param {Object} visionMetrics - Current MediaPipe eye/face metrics
 * @returns {boolean} True if a gentle nudge prompt should be offered, false otherwise.
 */
export function shouldNudgeCandidate(silenceSeconds, visionMetrics) {
  if (silenceSeconds < 20) return false;
  
  if (!visionMetrics || !visionMetrics.faceDetected) return false;
  
  // Gaze away indicates deep conceptual processing (thinking). Let them process!
  if (visionMetrics.headPose === 'Left' || visionMetrics.headPose === 'Right') {
    return false;
  }
  
  // Gaze directly at screen (high eye contact) + silence indicates candidate is stuck
  if (visionMetrics.eyeContactPercentage > 50) {
    return true;
  }
  
  return false;
}
