import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Loader from '../components/Loader';
import { HelpCircle, RefreshCw, CheckCircle, ArrowLeft, Eye, Award, Sparkles, BookOpen } from 'lucide-react';

export default function ReviewSession() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dueCards, setDueCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchDueCards = async () => {
    try {
      const res = await api.get('/flashcards/due');
      setDueCards(res.data);
      setCurrentIndex(0);
      setFlipped(false);
    } catch (err) {
      console.error("Error loading due cards", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDueCards();
  }, []);

  const handleReview = async (quality) => {
    if (submitting || dueCards.length === 0) return;
    setSubmitting(true);
    const activeCard = dueCards[currentIndex];
    
    try {
      await api.post(`/flashcards/${activeCard.id}/review`, { quality });
      
      // Flip back and move to next
      setFlipped(false);
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
        setSubmitting(false);
      }, 300);
    } catch (err) {
      console.error("Failed to submit review", err);
      alert("Failed to save progress. Please try again.");
      setSubmitting(false);
    }
  };

  if (loading) return <Loader />;

  const activeCard = dueCards[currentIndex];
  const remainingCount = dueCards.length - currentIndex;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#080b12', color: 'white', fontFamily: 'system-ui, sans-serif' }}>
      <Navbar />
      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar />
        <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
          
          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '32px' }}>
            <button 
              onClick={() => navigate('/flashcards')}
              style={{
                padding: 10, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600,
              }}
            >
              <ArrowLeft size={16} /> Back
            </button>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, background: 'linear-gradient(135deg, white, #a5b4fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Spaced Repetition Review
              </h1>
              <p style={{ margin: 0, color: '#9ca3af', fontSize: 14 }}>Reviewing due flashcards using the SM-2 learning algorithm.</p>
            </div>
          </div>

          {remainingCount > 0 && activeCard ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, maxWidth: 540, margin: '40px auto 0' }}>
              
              {/* Card wrapper */}
              <div
                onClick={() => setFlipped(!flipped)}
                style={{
                  width: '100%', height: 300, cursor: 'pointer', perspective: 1000,
                  position: 'relative',
                }}
              >
                {/* Inner flippable box */}
                <div style={{
                  width: '100%', height: '100%', transition: 'transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                  transformStyle: 'preserve-3d', position: 'relative',
                  transform: flipped ? 'rotateY(180deg)' : 'none',
                }}>
                  
                  {/* FRONT SIDE */}
                  <div style={{
                    position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
                    background: 'linear-gradient(135deg, #13151f, #1a1d2e)',
                    border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24,
                    padding: 32, display: 'flex', flexDirection: 'column',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#a5b4fc' }}>{activeCard.category}</span>
                      <span style={{ fontSize: 11, color: '#6b7280' }}>{remainingCount} cards remaining</span>
                    </div>

                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                      <h2 style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.5, margin: 0 }}>{activeCard.question}</h2>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.04)', fontSize: 12, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
                      Click to reveal answer
                    </div>
                  </div>

                  {/* BACK SIDE */}
                  <div style={{
                    position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
                    background: 'linear-gradient(135deg, #1a1d2e, #13151f)',
                    border: '1px solid rgba(99,102,241,0.2)', borderRadius: 24,
                    padding: 32, display: 'flex', flexDirection: 'column',
                    transform: 'rotateY(180deg)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#10b981' }}>Explanation</span>
                      <span style={{ fontSize: 11, color: '#6b7280' }}>{remainingCount} cards remaining</span>
                    </div>

                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                      <p style={{ fontSize: 15, lineHeight: 1.6, color: '#d1d5db', margin: 0 }}>{activeCard.answer}</p>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.04)', fontSize: 12, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
                      Click to hide answer
                    </div>
                  </div>

                </div>
              </div>

              {/* Spaced repetition SM-2 scoring action triggers */}
              {flipped && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    How well did you recall this answer?
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleReview(1); }}
                      style={{
                        padding: '12px 6px', borderRadius: 12, border: '1px solid rgba(239,68,68,0.2)',
                        background: 'rgba(239,68,68,0.08)', color: '#ef4444', fontWeight: 700, fontSize: 12,
                        cursor: 'pointer', transition: 'all 0.2s',
                      }}
                    >
                      Again
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleReview(2); }}
                      style={{
                        padding: '12px 6px', borderRadius: 12, border: '1px solid rgba(245,158,11,0.2)',
                        background: 'rgba(245,158,11,0.08)', color: '#f59e0b', fontWeight: 700, fontSize: 12,
                        cursor: 'pointer', transition: 'all 0.2s',
                      }}
                    >
                      Hard
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleReview(4); }}
                      style={{
                        padding: '12px 6px', borderRadius: 12, border: '1px solid rgba(99,102,241,0.2)',
                        background: 'rgba(99,102,241,0.08)', color: '#a5b4fc', fontWeight: 700, fontSize: 12,
                        cursor: 'pointer', transition: 'all 0.2s',
                      }}
                    >
                      Good
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleReview(5); }}
                      style={{
                        padding: '12px 6px', borderRadius: 12, border: '1px solid rgba(16,185,129,0.2)',
                        background: 'rgba(16,185,129,0.08)', color: '#10b981', fontWeight: 700, fontSize: 12,
                        cursor: 'pointer', transition: 'all 0.2s',
                      }}
                    >
                      Easy
                    </button>
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 24px', background: 'rgba(255,255,255,0.02)', borderRadius: 24, border: '1px solid rgba(255,255,255,0.05)', maxWidth: 500, margin: '80px auto 0' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justify: 'center', margin: '0 auto 20px', border: '1px solid rgba(16,185,129,0.2)' }}>
                <Award size={28} color="#10b981" />
              </div>
              <h2 style={{ fontSize: 22, fontStyle: 'normal', fontWeight: 800, margin: '0 0 8px' }}>All caught up!</h2>
              <p style={{ margin: '0 0 24px', color: '#9ca3af', fontSize: 14 }}>You have reviewed all due flashcards. Check back later for more reviews!</p>
              <button
                onClick={() => navigate('/flashcards')}
                style={{
                  padding: '12px 24px', borderRadius: 12, background: '#6366f1', color: 'white',
                  border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: 14,
                }}
              >
                Go to Flashcard Panel
              </button>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
