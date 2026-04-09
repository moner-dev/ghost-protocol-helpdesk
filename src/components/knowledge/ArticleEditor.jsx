/**
 * GHOST PROTOCOL — Knowledge Base Article Editor
 * Rich markdown editor with metadata fields and live preview.
 * Phase 4: Connected to real IPC backend. Fully audited.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import MDEditor from '@uiw/react-md-editor';
import { Save, Send, ChevronDown, ChevronRight, Pin, X, Tag, Loader2, Plus } from 'lucide-react';
import { DARK_THEME } from '@/constants/theme';

const DIFFICULTY_OPTIONS = ['beginner', 'intermediate', 'advanced'];
const DIFFICULTY_COLORS = { beginner: DARK_THEME.success, intermediate: DARK_THEME.warning, advanced: DARK_THEME.danger };

const DEFAULT_BODY = '# New Article\n\nStart writing here...';

function ArticleEditor({ article, categories, onSave, onCancel, onCreateCategory, currentUser, isSaving }) {
  const isNew = !article;

  const [title, setTitle] = useState(article?.title || '');
  const [categoryId, setCategoryId] = useState(article?.category_id ?? null);
  const [tags, setTags] = useState(article?.tags || '');
  const [difficulty, setDifficulty] = useState(article?.difficulty || 'beginner');
  const [pinned, setPinned] = useState(article?.is_pinned ? true : false);
  const [body, setBody] = useState(article?.body || DEFAULT_BODY);
  const [previewMode, setPreviewMode] = useState('live');
  const [showCatDropdown, setShowCatDropdown] = useState(false);
  const [showDiffDropdown, setShowDiffDropdown] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const [showNewCatInput, setShowNewCatInput] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [creatingCat, setCreatingCat] = useState(false);

  const selectedCat = (categories || []).find((c) => c.id === categoryId);

  const clearValidation = () => { if (validationError) setValidationError(null); };

  const validate = () => {
    if (!title.trim()) return 'Title is required';
    if (categoryId === null || categoryId === undefined) return 'Category is required';
    if (!body.trim() || body.trim() === DEFAULT_BODY) return 'Article body is required';
    return null;
  };

  const handleSave = (status) => {
    const err = validate();
    if (err) { setValidationError(err); return; }
    setValidationError(null);

    const excerpt = body.replace(/^#.*\n/gm, '').replace(/[`*_#\[\]]/g, '').trim().slice(0, 160);
    onSave({
      id: article?.id || null,
      title: title.trim(),
      body,
      excerpt,
      category_id: categoryId,
      tags: tags.trim(),
      difficulty,
      status,
      is_pinned: pinned ? 1 : 0,
    });
  };

  const inputStyle = { width: '100%', padding: '10px 14px', boxSizing: 'border-box', backgroundColor: 'rgba(79, 195, 247, 0.04)', border: `1px solid ${DARK_THEME.border}`, borderRadius: '6px', fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: DARK_THEME.text, outline: 'none', transition: 'border-color 0.2s' };
  const labelStyle = { display: 'block', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', letterSpacing: '0.15em', color: DARK_THEME.textMuted, marginBottom: '6px' };
  const dropdownBtnStyle = { ...inputStyle, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px' };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '16px 24px', borderBottom: `1px solid ${DARK_THEME.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={onCancel} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: DARK_THEME.textMuted, cursor: 'pointer' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = DARK_THEME.electric)} onMouseLeave={(e) => (e.currentTarget.style.color = DARK_THEME.textMuted)}>
            <ChevronRight size={12} style={{ transform: 'rotate(180deg)' }} /> CANCEL
          </button>
          <div style={{ width: '1px', height: '20px', backgroundColor: DARK_THEME.border }} />
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', letterSpacing: '0.1em', color: DARK_THEME.electric }}>{isNew ? 'NEW ARTICLE' : 'EDIT ARTICLE'}</span>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ display: 'flex', borderRadius: '6px', overflow: 'hidden', border: `1px solid ${DARK_THEME.border}` }}>
            {[{ key: 'edit', label: 'EDIT' }, { key: 'live', label: 'SPLIT' }, { key: 'preview', label: 'PREVIEW' }].map((m) => (
              <button key={m.key} onClick={() => setPreviewMode(m.key)} style={{ padding: '6px 12px', backgroundColor: previewMode === m.key ? `${DARK_THEME.electric}15` : 'transparent', border: 'none', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', letterSpacing: '0.05em', color: previewMode === m.key ? DARK_THEME.electric : DARK_THEME.textMuted, cursor: 'pointer' }}>{m.label}</button>
            ))}
          </div>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => handleSave('draft')} disabled={isSaving}
            style={{ padding: '8px 16px', backgroundColor: 'transparent', border: `1px solid ${DARK_THEME.border}`, borderRadius: '6px', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: DARK_THEME.textMuted, cursor: isSaving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', opacity: isSaving ? 0.6 : 1 }}>
            {isSaving ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={13} />} SAVE DRAFT
          </motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => handleSave('published')} disabled={isSaving}
            style={{ padding: '8px 16px', background: `linear-gradient(135deg, ${DARK_THEME.navy}, ${DARK_THEME.electric}30)`, border: `1px solid ${DARK_THEME.electric}`, borderRadius: '6px', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: DARK_THEME.electric, cursor: isSaving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', opacity: isSaving ? 0.6 : 1 }}>
            {isSaving ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={13} />} PUBLISH
          </motion.button>
        </div>
      </div>

      {validationError && (
        <div style={{ padding: '10px 24px', backgroundColor: `${DARK_THEME.danger}10`, borderBottom: `1px solid ${DARK_THEME.danger}30`, fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: DARK_THEME.danger, display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}><X size={12} /> {validationError}</div>
      )}

      {/* Metadata */}
      <div style={{ padding: '16px 24px', borderBottom: `1px solid ${DARK_THEME.border}`, flexShrink: 0 }}>
        <input type="text" value={title} onChange={(e) => { setTitle(e.target.value); clearValidation(); }} placeholder="Article title..."
          style={{ ...inputStyle, fontSize: '20px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, marginBottom: '14px', padding: '12px 16px' }}
          onFocus={(e) => (e.target.style.borderColor = DARK_THEME.electric)} onBlur={(e) => (e.target.style.borderColor = DARK_THEME.border)} />
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          {/* Category */}
          <div style={{ minWidth: '220px', position: 'relative' }}>
            <span style={labelStyle}>CATEGORY</span>
            <button onClick={() => { setShowCatDropdown(!showCatDropdown); clearValidation(); }} style={{ ...dropdownBtnStyle, borderColor: validationError?.includes('Category') ? DARK_THEME.danger : DARK_THEME.border }}>
              {selectedCat?.name || 'Select category...'} <ChevronDown size={12} />
            </button>
            {showCatDropdown && (
              <>
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 40 }} onClick={() => setShowCatDropdown(false)} />
                <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '4px', backgroundColor: DARK_THEME.surface, border: `1px solid ${DARK_THEME.border}`, borderRadius: '8px', padding: '6px', minWidth: '240px', zIndex: 50, boxShadow: '0 8px 24px rgba(0,0,0,0.5)', maxHeight: '300px', overflowY: 'auto' }}>
                  {(categories || []).filter((c) => !c.parent_id).map((parent) => {
                    const children = (categories || []).filter((c) => c.parent_id === parent.id);
                    return (
                      <div key={parent.id}>
                        <button onClick={() => { setCategoryId(parent.id); setShowCatDropdown(false); setShowNewCatInput(false); clearValidation(); }}
                          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '10px 12px', backgroundColor: categoryId === parent.id ? `${DARK_THEME.electric}15` : 'transparent', border: 'none', borderRadius: '4px', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: DARK_THEME.text, cursor: 'pointer', textAlign: 'left', fontWeight: 500 }}
                          onMouseEnter={(e) => { if (categoryId !== parent.id) e.currentTarget.style.backgroundColor = 'rgba(79, 195, 247, 0.06)'; }}
                          onMouseLeave={(e) => { if (categoryId !== parent.id) e.currentTarget.style.backgroundColor = 'transparent'; }}>
                          <span>{parent.name}</span>
                          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: DARK_THEME.textMuted }}>{parent.article_count || 0}</span>
                        </button>
                        {children.map((child) => (
                          <button key={child.id} onClick={() => { setCategoryId(child.id); setShowCatDropdown(false); setShowNewCatInput(false); clearValidation(); }}
                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '8px 12px 8px 28px', backgroundColor: categoryId === child.id ? `${DARK_THEME.electric}15` : 'transparent', border: 'none', borderRadius: '4px', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: DARK_THEME.textMuted, cursor: 'pointer', textAlign: 'left' }}
                            onMouseEnter={(e) => { if (categoryId !== child.id) e.currentTarget.style.backgroundColor = 'rgba(79, 195, 247, 0.06)'; }}
                            onMouseLeave={(e) => { if (categoryId !== child.id) e.currentTarget.style.backgroundColor = 'transparent'; }}>
                            <span>— {child.name}</span>
                            <span style={{ fontSize: '10px' }}>{child.article_count || 0}</span>
                          </button>
                        ))}
                      </div>
                    );
                  })}
                  {/* Create new category */}
                  <div style={{ borderTop: `1px solid ${DARK_THEME.border}`, marginTop: '4px', paddingTop: '4px' }}>
                    {showNewCatInput ? (
                      <div style={{ padding: '6px' }}>
                        <input type="text" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="Category name..." autoFocus
                          onKeyDown={async (e) => {
                            if (e.key === 'Enter' && newCatName.trim() && onCreateCategory) {
                              setCreatingCat(true);
                              const slug = newCatName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
                              const res = await onCreateCategory(newCatName.trim(), slug, null, null);
                              if (res?.success) { setCategoryId(res.id); setShowCatDropdown(false); setShowNewCatInput(false); setNewCatName(''); clearValidation(); }
                              setCreatingCat(false);
                            }
                            if (e.key === 'Escape') { setShowNewCatInput(false); setNewCatName(''); }
                          }}
                          style={{ width: '100%', padding: '8px 10px', boxSizing: 'border-box', backgroundColor: 'rgba(79, 195, 247, 0.04)', border: `1px solid ${DARK_THEME.electric}`, borderRadius: '4px', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: DARK_THEME.text, outline: 'none' }} />
                        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: DARK_THEME.textMuted, marginTop: '4px', paddingLeft: '2px' }}>Press Enter to create, Esc to cancel</div>
                      </div>
                    ) : (
                      <button onClick={() => setShowNewCatInput(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%', padding: '10px 12px', backgroundColor: 'transparent', border: 'none', borderRadius: '4px', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: DARK_THEME.electric, cursor: 'pointer', textAlign: 'left' }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = `${DARK_THEME.electric}08`)}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
                        <Plus size={12} /> CREATE NEW CATEGORY
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
          {/* Difficulty */}
          <div style={{ minWidth: '140px', position: 'relative' }}>
            <span style={labelStyle}>DIFFICULTY</span>
            <button onClick={() => setShowDiffDropdown(!showDiffDropdown)} style={{ ...dropdownBtnStyle, color: DIFFICULTY_COLORS[difficulty] }}>{difficulty.toUpperCase()} <ChevronDown size={12} /></button>
            {showDiffDropdown && (
              <>
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 40 }} onClick={() => setShowDiffDropdown(false)} />
                <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '4px', backgroundColor: DARK_THEME.surface, border: `1px solid ${DARK_THEME.border}`, borderRadius: '8px', padding: '6px', minWidth: '140px', zIndex: 50, boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
                  {DIFFICULTY_OPTIONS.map((d) => (
                    <button key={d} onClick={() => { setDifficulty(d); setShowDiffDropdown(false); }} style={{ display: 'block', width: '100%', padding: '8px 12px', backgroundColor: difficulty === d ? `${DIFFICULTY_COLORS[d]}15` : 'transparent', border: 'none', borderRadius: '4px', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: DIFFICULTY_COLORS[d], cursor: 'pointer', textAlign: 'left' }}>{d.toUpperCase()}</button>
                  ))}
                </div>
              </>
            )}
          </div>
          {/* Tags */}
          <div style={{ flex: 1, minWidth: '200px' }}>
            <span style={labelStyle}>TAGS (comma-separated)</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Tag size={12} style={{ color: DARK_THEME.textMuted, flexShrink: 0 }} />
              <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="vpn, network, setup..." style={{ ...inputStyle, fontSize: '12px', fontFamily: 'JetBrains Mono, monospace' }}
                onFocus={(e) => (e.target.style.borderColor = DARK_THEME.electric)} onBlur={(e) => (e.target.style.borderColor = DARK_THEME.border)} />
            </div>
          </div>
          {/* Pin */}
          <div>
            <span style={labelStyle}>PIN</span>
            <button onClick={() => setPinned(!pinned)} style={{ padding: '10px 14px', backgroundColor: pinned ? `${DARK_THEME.gold}15` : 'transparent', border: `1px solid ${pinned ? DARK_THEME.gold : DARK_THEME.border}`, borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: pinned ? DARK_THEME.gold : DARK_THEME.textMuted }}>
              <Pin size={12} style={{ transform: 'rotate(45deg)' }} /> {pinned ? 'PINNED' : 'PIN'}
            </button>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div style={{ flex: 1, overflow: 'hidden' }} data-color-mode="light">
        <MDEditor value={body} onChange={(val) => { setBody(val || ''); clearValidation(); }} preview={previewMode} height="100%" visibleDragbar={false} style={{ backgroundColor: '#ffffff', height: '100%' }} />
      </div>

      <style>{`
        .w-md-editor { background-color: #ffffff !important; border: none !important; color: #1a1a2e !important; }
        .w-md-editor-toolbar { background-color: #f5f5f5 !important; border-bottom: 1px solid #e0e0e0 !important; }
        .w-md-editor-toolbar li > button { color: #555 !important; }
        .w-md-editor-toolbar li > button:hover { color: ${DARK_THEME.electric} !important; }
        .w-md-editor-content { background-color: #ffffff !important; color: #1a1a2e !important; }
        .w-md-editor-text-pre, .w-md-editor-text-input, .w-md-editor-text { color: #1a1a2e !important; -webkit-text-fill-color: #1a1a2e !important; font-family: 'JetBrains Mono', monospace !important; font-size: 14px !important; background-color: #ffffff !important; }
        .w-md-editor-input { background-color: #ffffff !important; color: #1a1a2e !important; }
        .w-md-editor-area { background-color: #ffffff !important; color: #1a1a2e !important; }
        .w-md-editor-area .w-md-editor-input { color: #1a1a2e !important; -webkit-text-fill-color: #1a1a2e !important; }
        .w-md-editor-text-pre { color: #1a1a2e !important; -webkit-text-fill-color: #1a1a2e !important; }
        .w-md-editor-text-pre > code, .w-md-editor-text-pre > code * { color: #1a1a2e !important; -webkit-text-fill-color: #1a1a2e !important; }
        .w-md-editor-text-pre > code .title { color: #0d47a1 !important; -webkit-text-fill-color: #0d47a1 !important; font-weight: 700 !important; }
        .w-md-editor-text-pre > code .attr { color: #0d47a1 !important; -webkit-text-fill-color: #0d47a1 !important; }
        .w-md-editor textarea { caret-color: #1a1a2e !important; background-color: #ffffff !important; color: #1a1a2e !important; -webkit-text-fill-color: #1a1a2e !important; }
        .w-md-editor textarea::placeholder { color: #999 !important; -webkit-text-fill-color: #999 !important; }
        .w-md-editor-preview { background-color: #ffffff !important; }
        .w-md-editor-preview .wmde-markdown { color: #1a1a2e !important; font-family: 'DM Sans', sans-serif !important; }
        .w-md-editor-preview .wmde-markdown p, .w-md-editor-preview .wmde-markdown li, .w-md-editor-preview .wmde-markdown td, .w-md-editor-preview .wmde-markdown th, .w-md-editor-preview .wmde-markdown span { color: #1a1a2e !important; }
        .w-md-editor-preview .wmde-markdown h1, .w-md-editor-preview .wmde-markdown h2, .w-md-editor-preview .wmde-markdown h3, .w-md-editor-preview .wmde-markdown h4 { color: #0a0a1a !important; border-bottom-color: #e0e0e0 !important; }
        .w-md-editor-preview .wmde-markdown code { background-color: #f0f0f0 !important; color: #0d47a1 !important; }
        .w-md-editor-preview .wmde-markdown pre { background-color: #1a1a2e !important; border: 1px solid #e0e0e0 !important; border-radius: 8px !important; }
        .w-md-editor-preview .wmde-markdown pre code { color: ${DARK_THEME.electric} !important; background-color: transparent !important; }
        .w-md-editor-preview .wmde-markdown blockquote { border-left-color: ${DARK_THEME.electric} !important; color: #555 !important; }
        .w-md-editor-preview .wmde-markdown blockquote p { color: #555 !important; }
        .w-md-editor-preview .wmde-markdown a { color: #0d47a1 !important; }
        .w-md-editor-preview .wmde-markdown hr { border-top: 1px solid #ccc !important; background-color: transparent !important; }
        .w-md-editor-preview .wmde-markdown img { max-width: 100% !important; border-radius: 8px !important; border: 1px solid #e0e0e0 !important; }
        .w-md-editor-preview .wmde-markdown strong { color: #0a0a1a !important; }
        .w-md-editor-preview .wmde-markdown em { color: #333 !important; }
        .w-md-editor-preview .wmde-markdown table tr { border-color: #ddd !important; }
        .w-md-editor-preview .wmde-markdown table td, .w-md-editor-preview .wmde-markdown table th { border-color: #ddd !important; }
        .w-md-editor .w-md-editor-bar { background-color: #e0e0e0 !important; }
        .w-md-editor-content > .w-md-editor-preview, .w-md-editor-content > .w-md-editor-input { border-color: #e0e0e0 !important; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default ArticleEditor;
