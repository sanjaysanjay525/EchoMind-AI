import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Loader from '../components/Loader';
import { Search, Eye, HelpCircle, Code, Award, X, Sparkles, Filter } from 'lucide-react';

const DOMAINS = ['All', 'Software Engineer', 'Data Scientist', 'Product Manager', 'DevOps Engineer', 'Full Stack Developer', 'Data Analyst'];
const DIFFICULTIES = ['All', 'Easy', 'Medium', 'Hard', 'Junior', 'Professional'];

export default function QuestionsCatalogPage() {
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  
  // Modal details
  const [activeItem, setActiveItem] = useState(null);

  const fetchCatalog = async () => {
    try {
      const res = await api.get('/questions-catalog', {
        params: {
          domain: selectedDomain,
          difficulty: selectedDifficulty
        }
      });
      setCatalog(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, [selectedDomain, selectedDifficulty]);

  const filteredCatalog = catalog.filter(item => 
    item.description?.toLowerCase().includes(search.toLowerCase()) ||
    item.title?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#0e1017', color: 'white', fontFamily: 'system-ui, sans-serif' }}>
        <Navbar />
        <div style={{ display: 'flex', flex: 1 }}>
          <Sidebar />
          <main style={{ flex: 1, display: 'flex', alignItems: 'center', justify: 'center' }}>
            <Loader text="Generating mock question directories..." />
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
        <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
          
          {/* Header Row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '32px' }}>
            <div style={{ padding: 10, borderRadius: 12, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
              <Filter size={24} color="#6366f1" />
            </div>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, background: 'linear-gradient(135deg, white, #a5b4fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                AI Mock Question Directory
              </h1>
              <p style={{ margin: 0, color: '#9ca3af', fontSize: 14 }}>Browse theoretical and coding questions to practice before starting graded runs.</p>
            </div>
          </div>

          {/* Catalog grid filters & cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24 }}>
            
            {/* Filter Panel */}
            <div style={{
              padding: 24, borderRadius: 20, height: 'fit-content',
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
              display: 'flex', flexDirection: 'column', gap: 20,
            }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#6b7280', marginBottom: 8 }}>Search query</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.05)', padding: '10px 12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)' }}>
                  <Search size={14} color="#6b7280" />
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search keywords..."
                    style={{ background: 'none', border: 'none', color: 'white', fontSize: 12, outline: 'none', width: '100%' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#6b7280', marginBottom: 8 }}>Target Domain</label>
                <select
                  value={selectedDomain}
                  onChange={e => setSelectedDomain(e.target.value)}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 12, background: '#13151f', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none' }}
                >
                  {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#6b7280', marginBottom: 8 }}>Difficulty Level</label>
                <select
                  value={selectedDifficulty}
                  onChange={e => setSelectedDifficulty(e.target.value)}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 12, background: '#13151f', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none' }}
                >
                  {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            {/* Questions cards list */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
              {filteredCatalog.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => setActiveItem(item)}
                  style={{
                    padding: 20, borderRadius: 20, cursor: 'pointer',
                    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex', flexDirection: 'column', gap: 12, transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                      background: item.type === 'Coding' ? 'rgba(16,185,129,0.15)' : 'rgba(99,102,241,0.15)',
                      color: item.type === 'Coding' ? '#34d399' : '#a5b4fc',
                    }}>{item.type}</span>
                    <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 600 }}>{item.difficulty}</span>
                  </div>

                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.title}
                  </h3>
                  
                  <p style={{ margin: 0, fontSize: 12, color: '#9ca3af', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {item.description}
                  </p>

                  <div style={{ display: 'flex', justify: 'space-between', alignItems: 'center', marginTop: 'auto', pt: 10, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ fontSize: 11, color: '#6b7280' }}>Role: {item.domain}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#6366f1', fontWeight: 600 }}>
                      <Eye size={12} /> View Details
                    </span>
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* Modal Overlay */}
          {activeItem && (
            <div style={{
              position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
            }}>
              <div style={{
                background: '#13151f', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 24, width: '100%', maxWidth: 640, padding: 32, position: 'relative',
                display: 'flex', flexDirection: 'column', gap: 20,
              }}>
                <button
                  onClick={() => setActiveItem(null)}
                  style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>

                <div>
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: 'rgba(99,102,241,0.1)', color: '#a5b4fc', fontWeight: 700, textTransform: 'uppercase' }}>
                    {activeItem.type}
                  </span>
                  <h2 style={{ margin: '8px 0 0 0', fontSize: 20, fontWeight: 800 }}>{activeItem.title}</h2>
                </div>

                <div style={{ padding: 16, background: 'rgba(255,255,255,0.02)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.05)' }}>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#6b7280', marginBottom: 8 }}>Description</label>
                  <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: '#d1d5db' }}>{activeItem.description}</p>
                </div>

                {activeItem.type === 'Coding' && activeItem.templateCode && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#6b7280' }}>Starter Code Template</label>
                    <pre style={{ margin: 0, padding: 16, background: '#0e1017', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, color: '#10b981', fontFamily: 'monospace', fontSize: 11, overflowX: 'auto' }}>
                      {activeItem.templateCode}
                    </pre>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6b7280', pt: 12, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <span>Career Path Target: {activeItem.domain}</span>
                  <span>Difficulty Level: {activeItem.difficulty}</span>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
