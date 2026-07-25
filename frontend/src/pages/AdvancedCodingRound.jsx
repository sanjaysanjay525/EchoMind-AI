import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Loader from '../components/Loader';
import RoundProgressBar from '../components/RoundProgressBar';
import TimerBar from '../components/TimerBar';
import { Layers, Sparkles, AlertCircle, Eraser, Trash, Palette, FileText } from 'lucide-react';

export default function AdvancedCodingRound() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [problem, setProblem] = useState(null);
  
  const [designNotes, setDesignNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Timed Mock Test Mode options
  const timedModeEnabled = JSON.parse(localStorage.getItem('timedModeEnabled') || 'false');
  const timedModeSeconds = JSON.parse(localStorage.getItem('timedModeSeconds') || '60') * 4; // 4x time for architecture!

  const handleAdvancedTimeout = async () => {
    try {
      const canvas = canvasRef.current;
      const whiteboardBase64 = canvas ? canvas.toDataURL("image/png") : null;
      const res = await api.post(`/sessions/${sessionId}/round/advanced/submit`, {
        notes: designNotes || "Auto-submitted architectural design notes.",
        language: "text",
        whiteboardBase64: whiteboardBase64
      });
      navigate(`/interview/${sessionId}/transition`, {
        state: {
          completedRound: 'ADVANCED',
          nextRound: res.data.nextRound || 'REPORT',
          score: res.data.score !== undefined ? res.data.score : 50,
          passed: res.data.passed !== undefined ? res.data.passed : false
        }
      });
    } catch (err) {
      console.error("Advanced round timeout error", err);
      navigate(`/interview/${sessionId}/report`);
    }
  };

  // Whiteboard drawing tools
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState('#6366f1'); // default indigo
  const [brushSize, setBrushSize] = useState(3);
  const [isEraser, setIsEraser] = useState(false);

  useEffect(() => {
    // Advanced system design problem seeding fetch
    const fetchProblem = async () => {
      try {
        const res = await api.post(`/sessions/${sessionId}/round/ADVANCED/start`);
        const problemsList = res.data.problems || [];
        setProblem({
          title: "System Design: WhatsApp / Slack Scale Architecture",
          description: "Design a high-throughput, real-time message delivery system like WhatsApp or Slack. It must support 1M active daily users sending text messages.\n\nDemonstrate details regarding:\n1. Load balancer and WebSocket proxy routing.\n2. In-memory messaging caches.\n3. Primary/Secondary database choices for chat history storage.\n\nUse the whiteboard on the right to sketch the layout, and write architectural notes in the text area below."
        });
      } catch (err) {
        console.error("Failed to load advanced design problem", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProblem();
  }, [sessionId]);

  // Whiteboard canvas setup
  useEffect(() => {
    if (loading || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    // Set width and height based on offset boundaries
    canvas.width = canvas.parentElement.offsetWidth * 2;
    canvas.height = canvas.parentElement.offsetHeight * 2;
    canvas.style.width = `${canvas.parentElement.offsetWidth}px`;
    canvas.style.height = `${canvas.parentElement.offsetHeight}px`;

    const context = canvas.getContext("2d");
    context.scale(2, 2);
    context.lineCap = "round";
    context.strokeStyle = brushColor;
    context.lineWidth = brushSize;
    contextRef.current = context;

    // Fill background black/gray
    context.fillStyle = "#15171e";
    context.fillRect(0, 0, canvas.width, canvas.height);
  }, [loading]);

  // Sync brush parameters
  useEffect(() => {
    if (contextRef.current) {
      contextRef.current.strokeStyle = isEraser ? "#15171e" : brushColor;
      contextRef.current.lineWidth = isEraser ? 24 : brushSize;
    }
  }, [brushColor, brushSize, isEraser]);

  const startDrawing = ({ nativeEvent }) => {
    // Handle touch or mouse
    const x = nativeEvent.offsetX || (nativeEvent.touches ? nativeEvent.touches[0].clientX - nativeEvent.target.getBoundingClientRect().left : 0);
    const y = nativeEvent.offsetY || (nativeEvent.touches ? nativeEvent.touches[0].clientY - nativeEvent.target.getBoundingClientRect().top : 0);
    
    contextRef.current.beginPath();
    contextRef.current.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = ({ nativeEvent }) => {
    if (!isDrawing) return;
    const x = nativeEvent.offsetX || (nativeEvent.touches ? nativeEvent.touches[0].clientX - nativeEvent.target.getBoundingClientRect().left : 0);
    const y = nativeEvent.offsetY || (nativeEvent.touches ? nativeEvent.touches[0].clientY - nativeEvent.target.getBoundingClientRect().top : 0);
    
    contextRef.current.lineTo(x, y);
    contextRef.current.stroke();
  };

  const stopDrawing = () => {
    contextRef.current.closePath();
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    context.fillStyle = "#15171e";
    context.fillRect(0, 0, canvas.width, canvas.height);
  };

  const handleSubmit = async () => {
    if (!designNotes.trim()) {
      alert("Please provide system architecture notes before submitting!");
      return;
    }

    setSubmitting(true);
    try {
      // Export canvas drawing to Base64 image
      const canvas = canvasRef.current;
      const whiteboardBase64 = canvas ? canvas.toDataURL("image/png") : null;

      const res = await api.post(`/sessions/${sessionId}/round/advanced/submit`, {
        notes: designNotes,
        language: "text",
        whiteboardBase64: whiteboardBase64
      });

      navigate(`/interview/${sessionId}/transition`, {
        state: {
          completedRound: 'ADVANCED',
          nextRound: res.data.nextRound || 'REPORT',
          score: res.data.score,
          passed: res.data.passed
        }
      });
    } catch (err) {
      console.error("Advanced round submission error", err);
      alert("Submission complete. Redirecting to consolidated scorecard.");
      navigate(`/interview/${sessionId}/report`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-darkBg flex flex-col text-white">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader text="Setting up system design whiteboard session..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-darkBg flex flex-col text-white relative overflow-hidden">
      <div className="glow-bg w-[500px] h-[500px] bg-purple-500/10 top-[-100px] right-[-100px]" />
      
      <Navbar />

      <main className="flex-1 p-8 overflow-y-auto max-w-7xl mx-auto w-full relative z-10">
        <RoundProgressBar currentRound="ADVANCED" />

        {problem && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-220px)] min-h-[580px]">
            
            {/* LEFT PANEL: Description and Notes (lg:col-span-5) */}
            <div className="lg:col-span-5 flex flex-col gap-4 overflow-y-auto pr-2">
              <div className="glass-card rounded-2xl p-6 border flex-1 flex flex-col gap-4">
                
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-purple-400" />
                    <h2 className="font-display font-extrabold text-lg">{problem.title}</h2>
                  </div>
                </div>

                {/* Timed mode timer */}
                {timedModeEnabled && (
                  <div className="mt-1">
                    <TimerBar key={problem.title} seconds={timedModeSeconds} onTimeout={handleAdvancedTimeout} />
                  </div>
                )}

                <div className="text-xs text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {problem.description}
                </div>

                {/* Notes Input Area */}
                <div className="flex-1 flex flex-col gap-2 mt-2 min-h-[180px]">
                  <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    <span>System Architecture Notes</span>
                  </label>
                  <textarea
                    value={designNotes}
                    onChange={(e) => setDesignNotes(e.target.value)}
                    placeholder="Document your system details, component specifications, data schema details, API signatures, caching structures, and scaling strategies..."
                    className="glass-input flex-1 p-4 rounded-xl text-xs placeholder-gray-600 resize-none font-mono text-white leading-relaxed"
                  />
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full py-3 bg-gradient-indigo hover:opacity-90 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span>Complete System Design Round</span>
                      <Sparkles className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* RIGHT PANEL: Whiteboard Canvas (lg:col-span-7) */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              
              {/* Whiteboard Workspace */}
              <div className="glass-card rounded-2xl border flex-1 overflow-hidden flex flex-col min-h-[350px]">
                
                {/* Whiteboard Controls Header */}
                <div className="bg-[#15171e] px-4 py-2.5 flex justify-between items-center border-b border-white/5">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Interactive Whiteboard</span>
                  
                  <div className="flex items-center gap-4">
                    {/* Brush Colors */}
                    <div className="flex items-center gap-1.5">
                      {['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#ffffff'].map(c => (
                        <button
                          key={c}
                          onClick={() => { setBrushColor(c); setIsEraser(false); }}
                          className={`w-5 h-5 rounded-full border transition-all ${
                            brushColor === c && !isEraser ? 'ring-2 ring-indigo-500 scale-110' : 'border-white/10'
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>

                    {/* Eraser */}
                    <button
                      onClick={() => setIsEraser(prev => !prev)}
                      className={`p-1.5 rounded-lg border transition ${
                        isEraser 
                          ? 'bg-indigo-600 border-indigo-500 text-white' 
                          : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                      }`}
                      title="Eraser"
                    >
                      <Eraser className="w-4 h-4" />
                    </button>

                    {/* Clear Board */}
                    <button
                      onClick={handleClear}
                      className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition"
                      title="Clear Board"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Draw Canvas */}
                <div className="flex-1 w-full bg-[#15171e] relative cursor-crosshair">
                  <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                  />
                </div>
              </div>

            </div>

          </div>
        )}
      </main>
    </div>
  );
}
