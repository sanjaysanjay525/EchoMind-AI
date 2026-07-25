import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Loader from '../components/Loader';
import { BookOpen, Plus, Trash2, Search, Edit3, Save, Tag, AlertCircle } from 'lucide-react';

const CATEGORIES = ['All', 'Coding', 'System Design', 'Behavioral', 'Aptitude'];
const SAVE_CATEGORIES = ['Coding', 'System Design', 'Behavioral', 'Aptitude'];

export default function StudyNotesPage() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeNote, setActiveNote] = useState(null);
  
  // Note Form
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(SAVE_CATEGORIES[0]);
  const [content, setContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [toast, setToast] = useState(null);

  const fetchNotes = async () => {
    try {
      const res = await api.get('/notes');
      setNotes(res.data || []);
      if (res.data && res.data.length > 0) {
        handleSelectNote(res.data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleSelectNote = (note) => {
    setActiveNote(note);
    setTitle(note.title);
    setCategory(note.category);
    setContent(note.content);
    setIsEditing(false);
  };

  const handleCreateNew = () => {
    setActiveNote(null);
    setTitle('');
    setCategory(SAVE_CATEGORIES[0]);
    setContent('');
    setIsEditing(true);
  };

  const showToastMsg = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      showToastMsg('Please enter a note title', 'error');
      return;
    }

    try {
      const payload = {
        id: activeNote?.id || null,
        title,
        category,
        content
      };
      const res = await api.post('/notes', payload);
      showToastMsg('Note saved successfully!');
      
      // Refresh notes list
      const listRes = await api.get('/notes');
      setNotes(listRes.data || []);
      
      // Set saved note as active
      const savedNote = listRes.data.find(n => n.title === title) || res.data;
      handleSelectNote(savedNote);
    } catch (err) {
      console.error(err);
      showToastMsg('Failed to save study note.', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this cheat sheet?')) return;
    try {
      await api.delete(`/notes/${id}`);
      showToastMsg('Note deleted.');
      const res = await api.get('/notes');
      setNotes(res.data || []);
      if (res.data && res.data.length > 0) {
        handleSelectNote(res.data[0]);
      } else {
        handleCreateNew();
      }
    } catch (err) {
      console.error(err);
      showToastMsg('Failed to delete note.', 'error');
    }
  };

  const filteredNotes = notes.filter(n => {
    const matchesSearch = n.title.toLowerCase().includes(search.toLowerCase()) || 
                          n.content.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || n.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#0e1017', color: 'white', fontFamily: 'system-ui, sans-serif' }}>
        <Navbar />
        <div style={{ display: 'flex', flex: 1 }}>
          <Sidebar />
          <main style={{ flex: 1, display: 'flex', alignItems: 'center', justify: 'center' }}>
            <Loader text="Loading your study sandbox..." />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#0e1017', color: 'white', fontFamily: 'system-ui, sans-serif' }}>
      <Navbar />
      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar />
        <main style={{ flex: 1, padding: '32px', overflowY: 'auto', position: 'relative' }}>
          
          {/* Toast */}
          {toast && (
            <div style={{
              position: 'fixed', top: 24, right: 24, zIndex: 9999,
              padding: '12px 24px', borderRadius: 12,
              background: toast.type === 'error' ? '#ef4444' : '#10b981',
              border: `1px solid rgba(255,255,255,0.1)`,
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              fontSize: 13, fontWeight: 700, color: 'white',
              animation: 'slideIn 0.3s ease',
            }}>
              {toast.msg}
            </div>
          )}

          {/* Header Row */}
          <div style={{ display: 'flex', alignItems: 'center', justify: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ padding: 10, borderRadius: 12, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
                <BookOpen size={24} color="#6366f1" />
              </div>
              <div>
                <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, background: 'linear-gradient(135deg, white, #a5b4fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Study Notes & Cheat Sheets
                </h1>
                <p style={{ margin: 0, color: '#9ca3af', fontSize: 14 }}>Create and manage quick cheat sheets, templates, and revision notes.</p>
              </div>
            </div>
            
            <button
              onClick={handleCreateNew}
              style={{
                padding: '10px 20px', borderRadius: 12, fontSize: 13, fontWeight: 700,
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                border: 'none', cursor: 'pointer', color: 'white',
                display: 'flex', alignItems: 'center', gap: 8,
                boxShadow: '0 4px 20px rgba(99,102,241,0.3)',
              }}
            >
              <Plus size={16} />
              <span>Create New Sheet</span>
            </button>
          </div>

          {/* Two-Column Grid layout */}
          <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24 }}>
            
            {/* LEFT COLUMN: Sidebar list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Search & filters */}
              <div style={{
                padding: 16, borderRadius: 20,
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', flexDirection: 'column', gap: 12,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.05)', padding: '10px 12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)' }}>
                  <Search size={14} color="#6b7280" />
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search sheets..."
                    style={{ background: 'none', border: 'none', color: 'white', fontSize: 12, outline: 'none', width: '100%' }}
                  />
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      style={{
                        padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                        background: selectedCategory === cat ? '#6366f1' : 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.08)', color: selectedCategory === cat ? 'white' : '#9ca3af',
                        cursor: 'pointer', transition: 'all 0.2s',
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Note Cards Queue */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: '500px', overflowY: 'auto' }}>
                {filteredNotes.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px 16px', color: '#6b7280', fontSize: 12 }}>
                    No notes matched filters.
                  </div>
                ) : (
                  filteredNotes.map(n => {
                    const isActive = activeNote && activeNote.id === n.id;
                    return (
                      <div
                        key={n.id}
                        onClick={() => handleSelectNote(n)}
                        style={{
                          padding: 16, borderRadius: 16, cursor: 'pointer',
                          background: isActive ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.02)',
                          border: `1px solid ${isActive ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.06)'}`,
                          transition: 'all 0.2s',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#a5b4fc' }}>{n.category}</span>
                          <span style={{ fontSize: 10, color: '#6b7280' }}>
                            {new Date(n.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {n.title}
                        </h4>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: Note content/form */}
            <div style={{
              padding: 28, borderRadius: 24,
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                
                {/* Note metadata/actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', pb: 16 }}>
                  {isEditing ? (
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', width: '70%' }}>
                      <input
                        type="text"
                        required
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="Untitled Cheat Sheet"
                        style={{ width: '100%', padding: '8px 12px', fontSize: 18, fontWeight: 800, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: 'white', outline: 'none' }}
                      />
                      <select
                        value={category}
                        onChange={e => setCategory(e.target.value)}
                        style={{ padding: '8px 12px', fontSize: 12, fontWeight: 700, background: '#13151f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: 'white', outline: 'none' }}
                      >
                        {SAVE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(99,102,241,0.1)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.2)', fontWeight: 700, textTransform: 'uppercase' }}>
                          {category}
                        </span>
                        <span style={{ fontSize: 11, color: '#6b7280' }}>
                          Last saved: {activeNote ? new Date(activeNote.updatedAt).toLocaleString() : 'Not saved'}
                        </span>
                      </div>
                      <h2 style={{ margin: '8px 0 0 0', fontSize: 20, fontWeight: 800 }}>{title || 'Untitled Sheet'}</h2>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 8 }}>
                    {isEditing ? (
                      <button
                        type="submit"
                        style={{
                          padding: '8px 16px', borderRadius: 10, fontSize: 12, fontWeight: 700,
                          background: '#10b981', border: 'none', color: 'white', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: 6,
                        }}
                      >
                        <Save size={14} /> Save
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        style={{
                          padding: '8px 16px', borderRadius: 10, fontSize: 12, fontWeight: 700,
                          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: 6,
                        }}
                      >
                        <Edit3 size={14} /> Edit
                      </button>
                    )}
                    {activeNote && (
                      <button
                        type="button"
                        onClick={() => handleDelete(activeNote.id)}
                        style={{
                          padding: '8px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', cursor: 'pointer',
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Content body input/display */}
                <div style={{ minHeight: '320px' }}>
                  {isEditing ? (
                    <textarea
                      value={content}
                      onChange={e => setContent(e.target.value)}
                      placeholder="Write your study checklist, key formulas, coding solutions, or notes here. Markdown syntax is supported..."
                      style={{
                        width: '100%', minHeight: '350px', padding: 16, borderRadius: 16, boxSizing: 'border-box',
                        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)',
                        color: 'white', fontFamily: 'monospace', fontSize: 13, lineHeight: 1.6, resize: 'vertical', outline: 'none',
                      }}
                    />
                  ) : (
                    <div style={{
                      lineHeight: 1.6, color: '#d1d5db', fontSize: 14, whiteSpace: 'pre-wrap',
                      background: 'rgba(255,255,255,0.01)', padding: 20, borderRadius: 16,
                      border: '1px solid rgba(255,255,255,0.03)', minHeight: '350px',
                    }}>
                      {content || (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', color: '#6b7280' }}>
                          <AlertCircle size={24} style={{ marginBottom: 8 }} />
                          No note content provided. Click Edit to start writing!
                        </div>
                      )}
                    </div>
                  )}
                </div>

              </form>
            </div>

          </div>

        </main>
      </div>
      <style>{`
        @keyframes slideIn { from { transform: translateY(-20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
    </div>
  );
}
