import React, { useState, useRef, useEffect } from 'react';
import { api } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';
import { MessageCircle, X, Send, Bot, User, Loader2, Sparkles, Minimize2 } from 'lucide-react';

const SUGGESTED = [
  'How do I start a mock interview?',
  'Tips for coding round?',
  'How to improve my score?',
  'What is skill gap analysis?',
];

export default function AIChatbot() {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: '👋 Hi! I\'m your EchoMind AI assistant. Ask me anything about interview prep, platform features, or career tips!',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (open && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  if (!isAuthenticated) return null;

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg) return;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: msg }]);
    setLoading(true);
    try {
      const res = await api.post('/chat', { message: msg });
      setMessages((prev) => [...prev, { role: 'assistant', text: res.data.reply || 'Sorry, I could not respond right now.' }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', text: 'Network error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          style={{
            position: 'fixed', bottom: 28, right: 28, zIndex: 9999,
            width: 60, height: 60, borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            border: 'none', cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 0 4px rgba(99,102,241,0.25), 0 8px 32px rgba(99,102,241,0.5)',
            transition: 'transform 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <Sparkles size={26} color="white" />
        </button>
      )}

      {/* Chat Panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          width: 380, height: 540, borderRadius: 20,
          background: 'rgba(15,17,26,0.97)',
          border: '1px solid rgba(99,102,241,0.3)',
          backdropFilter: 'blur(24px)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(99,102,241,0.15)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          animation: 'slideUp 0.25s ease',
        }}>
          {/* Header */}
          <div style={{
            padding: '16px 20px', display: 'flex', alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.1))',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Bot size={18} color="white" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'white' }}>EchoMind Assistant</div>
                <div style={{ fontSize: 11, color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                  Online
                </div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4 }}>
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  background: msg.role === 'user' ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'linear-gradient(135deg,#1e293b,#334155)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {msg.role === 'user' ? <User size={12} color="white" /> : <Bot size={12} color="#6366f1" />}
                </div>
                <div style={{
                  maxWidth: '75%', padding: '10px 14px', borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: msg.role === 'user' ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(255,255,255,0.05)',
                  border: msg.role === 'assistant' ? '1px solid rgba(255,255,255,0.08)' : 'none',
                  fontSize: 13, lineHeight: 1.5, color: 'white',
                }}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Loader2 size={12} color="#6366f1" style={{ animation: 'spin 1s linear infinite' }} />
                </div>
                <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.05)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    {[0,1,2].map(n => (
                      <span key={n} style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366f1', animation: `bounce 1s ${n * 0.2}s infinite` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggested chips - only if first message */}
          {messages.length === 1 && (
            <div style={{ padding: '0 16px 8px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {SUGGESTED.map((s) => (
                <button key={s} onClick={() => sendMessage(s)} style={{
                  padding: '5px 12px', borderRadius: 20, fontSize: 11, cursor: 'pointer',
                  background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)',
                  color: '#a5b4fc', transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.2)'; e.currentTarget.style.color = 'white'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.1)'; e.currentTarget.style.color = '#a5b4fc'; }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 8 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Ask me anything..."
              style={{
                flex: 1, padding: '10px 14px', borderRadius: 12, fontSize: 13,
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                color: 'white', outline: 'none',
              }}
            />
            <button onClick={() => sendMessage()} disabled={loading || !input.trim()} style={{
              width: 40, height: 40, borderRadius: 12, flexShrink: 0,
              background: input.trim() ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'rgba(99,102,241,0.2)',
              border: 'none', cursor: input.trim() ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
            }}>
              <Send size={16} color="white" />
            </button>
          </div>

          <style>{`
            @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
            @keyframes spin { to { transform: rotate(360deg); } }
            @keyframes bounce { 0%,60%,100% { transform: translateY(0); } 30% { transform: translateY(-4px); } }
          `}</style>
        </div>
      )}
    </>
  );
}
