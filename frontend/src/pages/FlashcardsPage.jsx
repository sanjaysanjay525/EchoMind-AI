import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Loader from '../components/Loader';
import { api } from '../context/AuthContext';
import { 
  HelpCircle, 
  RefreshCw, 
  CheckCircle, 
  Award, 
  Compass, 
  BookOpen, 
  ArrowRight, 
  ArrowLeft, 
  Plus, 
  Trash2,
  AlertTriangle,
  Play
} from 'lucide-react';

const CATEGORIES = ['All', 'System Design', 'Java & OOP', 'Databases', 'Data Science', 'General'];

export default function FlashcardsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [flashcards, setFlashcards] = useState([]);
  const [dueCount, setDueCount] = useState(0);

  // Active review states
  const [activeCategory, setActiveCategory] = useState('All');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  // Form creation states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [newCategory, setNewCategory] = useState('System Design');
  const [creating, setCreating] = useState(false);

  const fetchFlashcards = async () => {
    try {
      const res = await api.get('/flashcards');
      setFlashcards(res.data);
      
      const dueRes = await api.get('/flashcards/due');
      setDueCount(dueRes.data.length);
    } catch (err) {
      console.error("Failed to load flashcards from backend", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlashcards();
  }, []);

  const filteredCards = flashcards.filter(card => 
    activeCategory === 'All' || card.category === activeCategory
  );

  // Reset index when changing category
  useEffect(() => {
    setCurrentIndex(0);
    setFlipped(false);
  }, [activeCategory, flashcards]);

  const handleNext = () => {
    setFlipped(false);
    setTimeout(() => {
      setCurrentIndex(prev => (prev + 1) % filteredCards.length);
    }, 200);
  };

  const handlePrev = () => {
    setFlipped(false);
    setTimeout(() => {
      setCurrentIndex(prev => (prev - 1 + filteredCards.length) % filteredCards.length);
    }, 200);
  };

  const handleCreateCard = async (e) => {
    e.preventDefault();
    if (!newQuestion.trim() || !newAnswer.trim()) return;
    setCreating(true);

    try {
      const res = await api.post('/flashcards', {
        question: newQuestion,
        answer: newAnswer,
        category: newCategory
      });
      setFlashcards(prev => [...prev, res.data]);
      setNewQuestion('');
      setNewAnswer('');
      setShowCreateForm(false);
      
      // Update due count (new cards are due immediately)
      setDueCount(prev => prev + 1);
    } catch (err) {
      console.error("Failed to create card", err);
      alert("Failed to create flashcard. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteCard = async (id, e) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this card?")) return;

    try {
      await api.delete(`/flashcards/${id}`);
      setFlashcards(prev => prev.filter(c => c.id !== id));
      // Re-fetch due count
      const dueRes = await api.get('/flashcards/due');
      setDueCount(dueRes.data.length);
    } catch (err) {
      console.error("Failed to delete card", err);
      alert("Failed to delete flashcard.");
    }
  };

  const activeCard = filteredCards[currentIndex];
  
  // Calculate statistics
  const totalInCat = filteredCards.length;
  // Mastered cards defined as cards with easeFactor >= 2.5 and repetitions >= 1
  const masteredInCat = filteredCards.filter(c => c.repetitions > 0 && c.easeFactor >= 2.5).length;
  const percentComplete = totalInCat > 0 ? Math.round((masteredInCat / totalInCat) * 100) : 0;

  if (loading) return <Loader />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#0e1017', color: 'white', fontFamily: 'system-ui, sans-serif' }}>
      <Navbar />
      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar />
        <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
          
          {/* Due Today Spaced Repetition Alert Banner */}
          {dueCount > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', justify: 'space-between',
              padding: '16px 24px', borderRadius: 16, background: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(139,92,246,0.15) 100%)',
              border: '1px solid rgba(99,102,241,0.4)', marginBottom: 32, flexWrap: 'wrap', gap: 16
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ padding: 8, borderRadius: '50%', background: 'rgba(99,102,241,0.2)' }}>
                  <AlertTriangle size={20} color="#a5b4fc" />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 15 }}>Spaced Repetition Review Due</div>
                  <div style={{ fontSize: 13, color: '#a5b4fc', marginTop: 2 }}>You have <strong style={{ color: 'white' }}>{dueCount}</strong> cards due for revision today under the SM-2 algorithm.</div>
                </div>
              </div>
              <button
                onClick={() => navigate('/flashcards/review')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12,
                  background: '#6366f1', border: 'none', color: 'white', fontWeight: 700, cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(99,102,241,0.4)', transition: 'all 0.2s'
                }}
              >
                <Play size={14} fill="white" /> Start Review Session
              </button>
            </div>
          )}

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justify: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ padding: 10, borderRadius: 12, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
                <Compass size={24} color="#6366f1" />
              </div>
              <div>
                <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, background: 'linear-gradient(135deg, white, #a5b4fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Interactive Interview Flashcards
                </h1>
                <p style={{ margin: 0, color: '#9ca3af', fontSize: 14 }}>Flip and review core concepts on System Design, OOP, Databases, and Data Science.</p>
              </div>
            </div>

            {/* Actions & Progress tracker */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 12,
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                  color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer'
                }}
              >
                <Plus size={16} /> Create Card
              </button>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 20px', borderRadius: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div>
                  <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' }}>Mastery Progress</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#10b981', marginTop: 2 }}>{masteredInCat} of {totalInCat} Mastered ({percentComplete}%)</div>
                </div>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)', border: '3px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 11, fontWeight: 900, color: '#10b981' }}>{percentComplete}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Create Flashcard Form */}
          {showCreateForm && (
            <form onSubmit={handleCreateCard} style={{
              background: '#13151f', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20,
              padding: 24, marginBottom: 32, maxWidth: 540, display: 'flex', flexDirection: 'column', gap: 16
            }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>Create New Revision Flashcard</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase' }}>Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  style={{
                    padding: 12, borderRadius: 10, background: '#0e1017', border: '1px solid rgba(255,255,255,0.1)',
                    color: 'white', fontSize: 13, outline: 'none'
                  }}
                >
                  <option value="System Design">System Design</option>
                  <option value="Java & OOP">Java & OOP</option>
                  <option value="Databases">Databases</option>
                  <option value="Data Science">Data Science</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase' }}>Question</label>
                <input
                  type="text"
                  placeholder="e.g. What is the difference between processes and threads?"
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  required
                  style={{
                    padding: 12, borderRadius: 10, background: '#0e1017', border: '1px solid rgba(255,255,255,0.1)',
                    color: 'white', fontSize: 13, outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase' }}>Answer Explanation</label>
                <textarea
                  rows="3"
                  placeholder="Explain the answer summary clearly for study checks..."
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                  required
                  style={{
                    padding: 12, borderRadius: 10, background: '#0e1017', border: '1px solid rgba(255,255,255,0.1)',
                    color: 'white', fontSize: 13, outline: 'none', resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'end' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  style={{
                    padding: '10px 16px', borderRadius: 10, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
                    color: '#9ca3af', fontSize: 13, fontWeight: 600, cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  style={{
                    padding: '10px 20px', borderRadius: 10, background: '#6366f1', border: 'none',
                    color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: creating ? 0.7 : 1
                  }}
                >
                  {creating ? 'Creating...' : 'Create Flashcard'}
                </button>
              </div>
            </form>
          )}

          {/* Category Switcher Tabs */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 32 }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: '8px 16px', borderRadius: 12, fontSize: 12, fontWeight: 700,
                  background: activeCategory === cat ? '#6366f1' : 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)', color: activeCategory === cat ? 'white' : '#9ca3af',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {activeCard ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, maxWidth: 540, margin: '0 auto' }}>
              
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
                    <div style={{ display: 'flex', justify: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#a5b4fc' }}>{activeCard.category}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 11, color: '#6b7280' }}>Card {currentIndex + 1} of {totalInCat}</span>
                        <button 
                          onClick={(e) => handleDeleteCard(activeCard.id, e)}
                          style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer' }}
                          onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                          onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justify: 'center', textAlign: 'center' }}>
                      <h2 style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.5, margin: 0 }}>{activeCard.question}</h2>
                    </div>

                    <div style={{ display: 'flex', justify: 'center', paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.04)', fontSize: 12, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
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
                    <div style={{ display: 'flex', justify: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#10b981' }}>Explanation</span>
                      <span style={{ fontSize: 11, color: '#6b7280' }}>Card {currentIndex + 1} of {totalInCat}</span>
                    </div>

                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justify: 'center', textAlign: 'center' }}>
                      <p style={{ fontSize: 15, lineHeight: 1.6, color: '#d1d5db', margin: 0 }}>{activeCard.answer}</p>
                    </div>

                    <div style={{ display: 'flex', justify: 'center', paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.04)', fontSize: 12, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
                      Click to hide answer
                    </div>
                  </div>

                </div>
              </div>

              {/* Action controller buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: 16, marginTop: 10 }}>
                <button
                  onClick={handlePrev}
                  style={{
                    padding: 12, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                    cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600,
                  }}
                >
                  <ArrowLeft size={16} /> Previous
                </button>

                <button
                  onClick={() => navigate('/flashcards/review')}
                  style={{
                    flex: 1, padding: '12px 20px', borderRadius: 12, fontSize: 13, fontWeight: 700,
                    background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
                    color: '#a5b4fc', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    transition: 'all 0.2s',
                  }}
                >
                  <RefreshCw size={16} />
                  <span>Start Due Review</span>
                </button>

                <button
                  onClick={handleNext}
                  style={{
                    padding: 12, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                    cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600,
                  }}
                >
                  Next <ArrowRight size={16} />
                </button>
              </div>

            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '80px 24px', color: '#6b7280', background: 'rgba(255,255,255,0.01)', borderRadius: 20, maxWidth: 500, margin: '40px auto' }}>
              <BookOpen size={48} color="rgba(255,255,255,0.1)" style={{ margin: '0 auto 20px' }} />
              <h3 style={{ color: 'white', fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>No flashcards found</h3>
              <p style={{ margin: '0 0 20px' }}>Create custom flashcards using the "Create Card" button above to populate your revisions list.</p>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
