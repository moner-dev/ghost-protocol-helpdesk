/**
 * GHOST PROTOCOL — Article Version History Drawer
 * Slides in from right, shows edit timeline with diff comparison.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, User, GitCompare } from 'lucide-react';
import { DARK_THEME } from '@/constants/theme';

function formatTs(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
}

function simpleDiff(oldText, newText) {
  const oldLines = (oldText || '').split('\n');
  const newLines = (newText || '').split('\n');
  const result = [];
  const maxLen = Math.max(oldLines.length, newLines.length);
  for (let i = 0; i < maxLen; i++) {
    const o = oldLines[i];
    const n = newLines[i];
    if (o === n) { result.push({ type: 'same', text: n || '' }); }
    else {
      if (o !== undefined && (n === undefined || o !== n)) result.push({ type: 'removed', text: o });
      if (n !== undefined && (o === undefined || o !== n)) result.push({ type: 'added', text: n });
    }
  }
  return result;
}

function HistoryDrawer({ isOpen, onClose, history, currentArticle }) {
  const [compareIdx, setCompareIdx] = useState(null);

  useEffect(() => { if (isOpen) setCompareIdx(null); }, [isOpen]);

  if (!isOpen) return null;

  const selectedVersion = compareIdx !== null ? history[compareIdx] : null;
  const diffLines = selectedVersion ? simpleDiff(selectedVersion.body, currentArticle?.body || '') : [];
  const titleChanged = selectedVersion && selectedVersion.title !== currentArticle?.title;

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 9000 }} />
      <motion.div initial={{ x: 400 }} animate={{ x: 0 }} exit={{ x: 400 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        style={{ position: 'fixed', top: 0, right: 0, width: '420px', height: '100%', backgroundColor: DARK_THEME.surface, borderLeft: `1px solid ${DARK_THEME.border}`, zIndex: 9001, display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 32px rgba(0,0,0,0.3)' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${DARK_THEME.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '18px', fontWeight: 700, color: DARK_THEME.text }}>VERSION HISTORY</div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: DARK_THEME.textMuted, marginTop: '4px' }}>{history.length} version{history.length !== 1 ? 's' : ''}</div>
          </div>
          <button onClick={onClose} style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent', border: `1px solid ${DARK_THEME.border}`, borderRadius: '6px', cursor: 'pointer', color: DARK_THEME.textMuted }}>
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {compareIdx !== null ? (
            /* Diff View */
            <div style={{ padding: '16px' }}>
              <button onClick={() => setCompareIdx(null)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: DARK_THEME.textMuted, cursor: 'pointer', marginBottom: '16px' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = DARK_THEME.electric)} onMouseLeave={(e) => (e.currentTarget.style.color = DARK_THEME.textMuted)}>
                <X size={10} /> BACK TO TIMELINE
              </button>

              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', letterSpacing: '0.1em', color: DARK_THEME.textMuted, marginBottom: '8px' }}>COMPARING VERSION FROM {formatTs(selectedVersion?.edited_at).toUpperCase()} TO CURRENT</div>

              {titleChanged && (
                <div style={{ padding: '10px 12px', marginBottom: '12px', backgroundColor: `${DARK_THEME.warning}08`, border: `1px solid ${DARK_THEME.warning}25`, borderRadius: '6px' }}>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: DARK_THEME.textMuted, marginBottom: '6px' }}>TITLE CHANGED</div>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: DARK_THEME.danger, textDecoration: 'line-through', marginBottom: '4px' }}>{selectedVersion.title}</div>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: DARK_THEME.success }}>{currentArticle?.title}</div>
                </div>
              )}

              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: DARK_THEME.textMuted, marginBottom: '8px' }}>BODY CHANGES</div>
              <div style={{ backgroundColor: DARK_THEME.bg, border: `1px solid ${DARK_THEME.border}`, borderRadius: '8px', padding: '12px', maxHeight: 'calc(100vh - 300px)', overflowY: 'auto' }}>
                {diffLines.map((line, i) => (
                  <div key={i} style={{
                    fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', lineHeight: 1.6, padding: '1px 6px',
                    backgroundColor: line.type === 'added' ? 'rgba(16,185,129,0.08)' : line.type === 'removed' ? 'rgba(239,68,68,0.08)' : 'transparent',
                    borderLeft: line.type === 'added' ? `2px solid ${DARK_THEME.success}` : line.type === 'removed' ? `2px solid ${DARK_THEME.danger}` : '2px solid transparent',
                    color: line.type === 'added' ? DARK_THEME.success : line.type === 'removed' ? DARK_THEME.danger : DARK_THEME.textMuted,
                    textDecoration: line.type === 'removed' ? 'line-through' : 'none',
                  }}>
                    <span style={{ opacity: 0.5, marginRight: '8px', userSelect: 'none' }}>{line.type === 'added' ? '+' : line.type === 'removed' ? '−' : ' '}</span>
                    {line.text || '\u00A0'}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Timeline */
            <div style={{ padding: '16px' }}>
              {history.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: DARK_THEME.textMuted }}>No version history</div>
              ) : (
                history.map((entry, idx) => (
                  <div key={entry.id} style={{ display: 'flex', gap: '12px', marginBottom: '4px' }}>
                    {/* Timeline line */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '20px', flexShrink: 0 }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: idx === 0 ? DARK_THEME.electric : DARK_THEME.border, flexShrink: 0, marginTop: '6px' }} />
                      {idx < history.length - 1 && <div style={{ width: '1px', flex: 1, backgroundColor: DARK_THEME.border, marginTop: '4px' }} />}
                    </div>
                    {/* Entry */}
                    <div style={{ flex: 1, padding: '8px 12px', backgroundColor: idx === 0 ? `${DARK_THEME.electric}06` : 'transparent', borderRadius: '6px', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: DARK_THEME.text, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <User size={11} style={{ color: DARK_THEME.textMuted }} /> {entry.editor_name || entry.edited_by}
                          </div>
                          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: DARK_THEME.textMuted, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={10} /> {formatTs(entry.edited_at)}
                          </div>
                        </div>
                        {idx > 0 && (
                          <button onClick={() => setCompareIdx(idx)}
                            style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', backgroundColor: 'transparent', border: `1px solid ${DARK_THEME.border}`, borderRadius: '4px', fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: DARK_THEME.textMuted, cursor: 'pointer' }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = DARK_THEME.electric; e.currentTarget.style.color = DARK_THEME.electric; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = DARK_THEME.border; e.currentTarget.style.color = DARK_THEME.textMuted; }}>
                            <GitCompare size={10} /> COMPARE
                          </button>
                        )}
                        {idx === 0 && <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: DARK_THEME.electric, padding: '3px 8px', backgroundColor: `${DARK_THEME.electric}12`, borderRadius: '4px' }}>CURRENT</span>}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}

export default HistoryDrawer;
