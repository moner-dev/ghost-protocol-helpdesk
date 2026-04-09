/**
 * GHOST PROTOCOL — Knowledge Base Advanced Search
 * Live search dropdown with debounced IPC calls and highlighted matches.
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Eye, BookOpen } from 'lucide-react';
import { DARK_THEME } from '@/constants/theme';

function highlightMatch(text, query) {
  if (!query || query.length < 2 || typeof text !== 'string') return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? <mark key={i} style={{ backgroundColor: `${DARK_THEME.electric}30`, color: DARK_THEME.electric, borderRadius: '2px', padding: '0 2px' }}>{part}</mark> : part
  );
}

function AdvancedSearch({ query, onQueryChange, onSelectArticle, searchResults, onSearch }) {
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef(null);
  const showDropdown = isFocused && query.length >= 2;

  // Group results by category
  const grouped = {};
  for (const r of (searchResults || [])) {
    const catName = r.category_name || 'Uncategorized';
    if (!grouped[catName]) grouped[catName] = [];
    grouped[catName].push(r);
  }

  const getSnippet = (article) => {
    const q = query.toLowerCase();
    const body = article.body || '';
    const idx = body.toLowerCase().indexOf(q);
    if (idx >= 0) {
      const start = Math.max(0, idx - 40);
      const end = Math.min(body.length, idx + query.length + 60);
      return (start > 0 ? '...' : '') + body.slice(start, end).replace(/\n/g, ' ').replace(/[#*`_]/g, '') + (end < body.length ? '...' : '');
    }
    return article.excerpt?.slice(0, 100) || '';
  };

  useEffect(() => {
    const handleClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setIsFocused(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleChange = (val) => {
    onQueryChange(val);
    if (onSearch) onSearch(val);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: DARK_THEME.textMuted, pointerEvents: 'none' }} />
        <input data-search-input type="text" value={query} onChange={(e) => handleChange(e.target.value)} onFocus={() => setIsFocused(true)} placeholder="Search articles, tags, content..."
          style={{ width: '100%', padding: '10px 36px 10px 34px', boxSizing: 'border-box', backgroundColor: 'rgba(79, 195, 247, 0.04)', border: `1px solid ${isFocused ? DARK_THEME.electric : DARK_THEME.border}`, borderRadius: '8px', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: DARK_THEME.text, outline: 'none', transition: 'border-color 0.2s' }} />
        {query && <button onClick={() => handleChange('')} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', color: DARK_THEME.textMuted }}><X size={12} /></button>}
      </div>

      <AnimatePresence>
        {showDropdown && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px', backgroundColor: DARK_THEME.surface, border: `1px solid ${DARK_THEME.border}`, borderRadius: '8px', boxShadow: '0 12px 40px rgba(0,0,0,0.5)', zIndex: 60, maxHeight: '360px', overflowY: 'auto' }}>
            {(searchResults || []).length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center' }}>
                <BookOpen size={20} style={{ color: DARK_THEME.textMuted, marginBottom: '8px' }} />
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: DARK_THEME.textMuted }}>NO RESULTS FOUND</div>
              </div>
            ) : (
              <div style={{ padding: '6px' }}>
                {Object.entries(grouped).map(([catName, catArticles]) => (
                  <div key={catName}>
                    <div style={{ padding: '8px 12px 4px', fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', letterSpacing: '0.15em', color: DARK_THEME.textMuted }}>{catName.toUpperCase()}</div>
                    {catArticles.map((article) => (
                      <button key={article.id} onClick={() => { onSelectArticle(article); setIsFocused(false); }}
                        style={{ display: 'block', width: '100%', padding: '10px 12px', backgroundColor: 'transparent', border: 'none', borderRadius: '6px', textAlign: 'left', cursor: 'pointer', transition: 'background-color 0.15s' }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(79, 195, 247, 0.06)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
                        <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', fontWeight: 500, color: DARK_THEME.text, marginBottom: '4px' }}>{highlightMatch(article.title, query)}</div>
                        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: DARK_THEME.textMuted, lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{highlightMatch(getSnippet(article), query)}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: DARK_THEME.textMuted, display: 'flex', alignItems: 'center', gap: '3px' }}><Eye size={9} /> {article.view_count || 0}</span>
                          {(article.tags || '').split(',').filter((t) => t.trim().toLowerCase().includes(query.toLowerCase())).slice(0, 2).map((t) => (
                            <span key={t} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: DARK_THEME.electric, backgroundColor: `${DARK_THEME.electric}10`, padding: '1px 5px', borderRadius: '3px' }}>{t.trim()}</span>
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>
                ))}
                <div style={{ padding: '8px 12px', borderTop: `1px solid ${DARK_THEME.border}`, marginTop: '4px' }}>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: DARK_THEME.textMuted }}>{searchResults.length} result{searchResults.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AdvancedSearch;
