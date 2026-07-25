import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Mic, Brain, Code, BarChart2, FileText, Trophy, Sparkles, Star, ChevronRight, Zap, Shield, Target, Users, Award, TrendingUp, Play, ArrowRight } from 'lucide-react';

/* ─── Animated counter hook ─── */
function useCounter(target, duration = 2000, start = false) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime = null;
    const step = (ts) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [start, target, duration]);
  return val;
}

/* ─── Gradient orb background ─── */
function Orb({ style }) {
  return <div style={{ position: 'absolute', borderRadius: '50%', filter: 'blur(80px)', opacity: 0.15, pointerEvents: 'none', ...style }} />;
}

/* ─── Feature card ─── */
function FeatureCard({ icon: Icon, title, desc, color, delay }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '28px', borderRadius: 20,
        background: hovered ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
        border: hovered ? `1px solid ${color}40` : '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(12px)',
        transition: 'all 0.3s ease',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered ? `0 16px 40px ${color}20` : 'none',
        animationDelay: `${delay}s`,
        cursor: 'default',
      }}
    >
      <div style={{
        width: 48, height: 48, borderRadius: 14,
        background: `linear-gradient(135deg, ${color}30, ${color}10)`,
        border: `1px solid ${color}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 18,
        boxShadow: hovered ? `0 0 20px ${color}30` : 'none',
        transition: 'box-shadow 0.3s',
      }}>
        <Icon size={22} color={color} />
      </div>
      <div style={{ fontWeight: 700, fontSize: 17, color: 'white', marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 14, color: '#9ca3af', lineHeight: 1.6 }}>{desc}</div>
    </div>
  );
}

/* ─── Stat card ─── */
function StatCard({ label, suffix = '', target, start, color }) {
  const val = useCounter(target, 2200, start);
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        fontSize: 48, fontWeight: 900, lineHeight: 1,
        background: `linear-gradient(135deg, ${color}, white)`,
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        marginBottom: 8,
      }}>
        {val.toLocaleString()}{suffix}
      </div>
      <div style={{ fontSize: 15, color: '#9ca3af', fontWeight: 500 }}>{label}</div>
    </div>
  );
}

/* ─── Testimonial card ─── */
const TESTIMONIALS = [
  { name: 'Arjun Sharma', role: 'Software Engineer @ Google', avatar: 'AS', score: 94, text: 'EchoMind\'s AI interviews are incredibly realistic. The personalized feedback helped me land my dream role at Google in just 3 weeks of practice!' },
  { name: 'Priya Mehta', role: 'Data Scientist @ Amazon', avatar: 'PM', score: 88, text: 'The resume analyzer pinpointed exactly what was wrong with my CV. After fixing it, I got callbacks from 8 out of 10 applications.' },
  { name: 'Rahul Singh', role: 'Product Manager @ Microsoft', avatar: 'RS', score: 91, text: 'The multi-round interview with different personas — HR, Grillmaster, Skeptical Panel — prepared me for every possible interviewer style.' },
  { name: 'Sneha Patel', role: 'ML Engineer @ Meta', avatar: 'SP', score: 96, text: 'Skill gap analysis was a game-changer. It identified my weak points and gave me curated resources. I went from 60% to 96% score in 2 weeks!' },
];

export default function LandingPage() {
  const heroRef = useRef(null);
  const statsRef = useRef(null);
  const [statsVisible, setStatsVisible] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsVisible(true); },
      { threshold: 0.3 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setActiveTestimonial(p => (p + 1) % TESTIMONIALS.length), 5000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    { icon: Mic, title: 'AI Voice Interviews', desc: 'Real-time speech-to-text with AI interviewers that adapt to your answers dynamically.', color: '#6366f1' },
    { icon: Brain, title: 'Multi-Round Format', desc: 'Aptitude, Communication, Coding & Advanced rounds — just like real company interviews.', color: '#8b5cf6' },
    { icon: FileText, title: 'Resume Builder & AI Analyzer', desc: 'Build an ATS-optimized resume and get instant AI feedback on every section.', color: '#06b6d4' },
    { icon: Target, title: 'Skill Gap Analysis', desc: 'AI pinpoints your exact weak areas and provides curated learning resources.', color: '#10b981' },
    { icon: Trophy, title: 'Global Leaderboard', desc: 'Compete with thousands of candidates and track your rank in real time.', color: '#f59e0b' },
    { icon: BarChart2, title: 'Performance Analytics', desc: 'Deep dive into your score trends, round breakdowns, and improvement trajectory.', color: '#ec4899' },
  ];

  return (
    <div style={{ background: '#080b12', color: 'white', fontFamily: 'system-ui, -apple-system, sans-serif', overflowX: 'hidden' }}>

      {/* ── NAVBAR ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        padding: '16px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(8,11,18,0.8)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px rgba(99,102,241,0.4)',
          }}>
            <Mic size={18} color="white" />
          </div>
          <span style={{ fontWeight: 800, fontSize: 20, background: 'linear-gradient(135deg, white, #a5b4fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            EchoMind <span style={{ color: '#6366f1', WebkitTextFillColor: '#6366f1' }}>AI</span>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link to="/login" style={{ padding: '8px 20px', borderRadius: 10, color: '#9ca3af', textDecoration: 'none', fontSize: 14, fontWeight: 500, transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = 'white'}
            onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}
          >Log In</Link>
          <Link to="/register" style={{
            padding: '9px 22px', borderRadius: 10, fontSize: 14, fontWeight: 600,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: 'white', textDecoration: 'none',
            boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(99,102,241,0.5)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(99,102,241,0.4)'; }}
          >Get Started Free</Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section ref={heroRef} style={{ position: 'relative', minHeight: '92vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '80px 24px', overflow: 'hidden' }}>
        {/* Orbs */}
        <Orb style={{ width: 600, height: 600, background: '#6366f1', top: -100, left: -100 }} />
        <Orb style={{ width: 400, height: 400, background: '#8b5cf6', bottom: -50, right: -50 }} />
        <Orb style={{ width: 300, height: 300, background: '#06b6d4', top: '40%', right: '10%' }} />

        {/* Grid pattern overlay */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.03,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />

        <div style={{ position: 'relative', maxWidth: 820, margin: '0 auto' }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 16px', borderRadius: 999,
            background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)',
            marginBottom: 32, fontSize: 13, color: '#a5b4fc', fontWeight: 600,
            boxShadow: '0 0 20px rgba(99,102,241,0.15)',
          }}>
            <Sparkles size={13} color="#6366f1" />
            Powered by Gemini 2.5 Flash + OmniRoute AI
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: 'clamp(40px, 7vw, 80px)', fontWeight: 900, lineHeight: 1.08,
            marginBottom: 24, letterSpacing: '-2px',
          }}>
            <span style={{ background: 'linear-gradient(135deg, white 0%, #e0e7ff 50%, #a5b4fc 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Ace Every Interview
            </span>
            <br />
            <span style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              With AI Coaching
            </span>
          </h1>

          <p style={{ fontSize: 19, color: '#9ca3af', lineHeight: 1.7, marginBottom: 44, maxWidth: 600, margin: '0 auto 44px' }}>
            Practice realistic AI-powered mock interviews, get personalized feedback, build your resume, and track your progress — all in one premium platform.
          </p>

          {/* CTA Buttons */}
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" style={{
              padding: '15px 36px', borderRadius: 14, fontSize: 16, fontWeight: 700,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: 'white', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8,
              boxShadow: '0 0 40px rgba(99,102,241,0.4)',
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 0 60px rgba(99,102,241,0.6)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 0 40px rgba(99,102,241,0.4)'; }}
            >
              <Zap size={18} />
              Start Free Interview
              <ArrowRight size={16} />
            </Link>
            <Link to="/login" style={{
              padding: '15px 32px', borderRadius: 14, fontSize: 16, fontWeight: 600,
              background: 'rgba(255,255,255,0.05)', color: 'white', textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.12)', display: 'inline-flex', alignItems: 'center', gap: 8,
              backdropFilter: 'blur(12px)', transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
            >
              <Play size={16} />
              Watch Demo
            </Link>
          </div>

          {/* Trust badges */}
          <div style={{ marginTop: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 32, flexWrap: 'wrap' }}>
            {[
              { icon: Shield, text: 'Free Forever Plan' },
              { icon: Users, text: '50,000+ Candidates' },
              { icon: Star, text: '4.9/5 Rating' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#6b7280' }}>
                <Icon size={14} color="#6366f1" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section ref={statsRef} style={{ padding: '80px 48px', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(99,102,241,0.03)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 48 }}>
          <StatCard label="Curated Roles" suffix="+" target={3000} start={statsVisible} color="#6366f1" />
          <StatCard label="Mock Sessions Completed" suffix="K+" target={50} start={statsVisible} color="#8b5cf6" />
          <StatCard label="Success Rate" suffix="%" target={89} start={statsVisible} color="#06b6d4" />
          <StatCard label="Active Candidates" suffix="+" target={12000} start={statsVisible} color="#10b981" />
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ padding: '100px 48px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 14px', borderRadius: 999, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', marginBottom: 16, fontSize: 12, color: '#a5b4fc', fontWeight: 600 }}>
            <Zap size={12} />
            EVERYTHING YOU NEED
          </div>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, marginBottom: 16, background: 'linear-gradient(135deg, white, #a5b4fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            The Complete Interview Prep Platform
          </h2>
          <p style={{ fontSize: 17, color: '#9ca3af', maxWidth: 560, margin: '0 auto' }}>
            Everything you need to prepare, practice, and succeed — powered by cutting-edge AI.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
          {features.map((f, i) => <FeatureCard key={f.title} {...f} delay={i * 0.1} />)}
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ padding: '100px 48px', background: 'rgba(255,255,255,0.01)', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 14px', borderRadius: 999, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', marginBottom: 16, fontSize: 12, color: '#fbbf24', fontWeight: 600 }}>
            <Star size={12} color="#f59e0b" />
            SUCCESS STORIES
          </div>
          <h2 style={{ fontSize: 36, fontWeight: 800, marginBottom: 56, background: 'linear-gradient(135deg, white, #e0e7ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Candidates Who Made It
          </h2>

          <div style={{ position: 'relative', minHeight: 240 }}>
            {TESTIMONIALS.map((t, i) => (
              <div key={i} style={{
                padding: '36px', borderRadius: 20,
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                backdropFilter: 'blur(12px)', textAlign: 'left',
                position: i === activeTestimonial ? 'relative' : 'absolute',
                opacity: i === activeTestimonial ? 1 : 0,
                transform: i === activeTestimonial ? 'translateY(0)' : 'translateY(10px)',
                transition: 'all 0.5s ease',
                top: 0, left: 0, right: 0,
                pointerEvents: i === activeTestimonial ? 'auto' : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: 16, color: 'white', flexShrink: 0,
                  }}>{t.avatar}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16, color: 'white' }}>{t.name}</div>
                    <div style={{ fontSize: 13, color: '#6366f1', fontWeight: 500 }}>{t.role}</div>
                  </div>
                  <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                    <div style={{ fontSize: 24, fontWeight: 900, color: '#10b981' }}>{t.score}%</div>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>Final Score</div>
                  </div>
                </div>
                <p style={{ fontSize: 16, color: '#d1d5db', lineHeight: 1.7, fontStyle: 'italic' }}>
                  "{t.text}"
                </p>
                <div style={{ display: 'flex', gap: 4, marginTop: 16 }}>
                  {[...Array(5)].map((_, si) => <Star key={si} size={14} color="#f59e0b" fill="#f59e0b" />)}
                </div>
              </div>
            ))}
          </div>

          {/* Dots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
            {TESTIMONIALS.map((_, i) => (
              <button key={i} onClick={() => setActiveTestimonial(i)} style={{
                width: i === activeTestimonial ? 24 : 8, height: 8, borderRadius: 999, border: 'none', cursor: 'pointer',
                background: i === activeTestimonial ? '#6366f1' : 'rgba(255,255,255,0.15)',
                transition: 'all 0.3s',
              }} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA SECTION ── */}
      <section style={{ padding: '100px 48px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <Orb style={{ width: 500, height: 500, background: '#6366f1', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
        <div style={{ position: 'relative', maxWidth: 640, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(28px, 5vw, 52px)', fontWeight: 900, marginBottom: 20, background: 'linear-gradient(135deg, white, #a5b4fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Ready to Land Your Dream Job?
          </h2>
          <p style={{ fontSize: 17, color: '#9ca3af', marginBottom: 40, lineHeight: 1.6 }}>
            Join 50,000+ candidates already using EchoMind AI to practice smarter and interview better.
          </p>
          <Link to="/register" style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            padding: '16px 40px', borderRadius: 14, fontSize: 17, fontWeight: 700,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: 'white', textDecoration: 'none',
            boxShadow: '0 0 50px rgba(99,102,241,0.5)',
            transition: 'all 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.boxShadow = '0 0 70px rgba(99,102,241,0.7)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 0 50px rgba(99,102,241,0.5)'; }}
          >
            <Zap size={20} />
            Get Started — It's Free
            <ChevronRight size={18} />
          </Link>
          <div style={{ marginTop: 20, fontSize: 13, color: '#4b5563' }}>
            No credit card required · Free forever plan available
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ padding: '32px 48px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Mic size={14} color="white" />
          </div>
          <span style={{ fontWeight: 700, fontSize: 15, color: '#6b7280' }}>EchoMind AI</span>
        </div>
        <div style={{ fontSize: 13, color: '#4b5563' }}>© 2026 EchoMind AI. Built with ❤️ for candidates worldwide.</div>
        <div style={{ display: 'flex', gap: 20 }}>
          {['Privacy', 'Terms', 'Contact'].map(l => (
            <span key={l} style={{ fontSize: 13, color: '#4b5563', cursor: 'pointer', transition: 'color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#9ca3af'}
              onMouseLeave={e => e.currentTarget.style.color = '#4b5563'}
            >{l}</span>
          ))}
        </div>
      </footer>
    </div>
  );
}
