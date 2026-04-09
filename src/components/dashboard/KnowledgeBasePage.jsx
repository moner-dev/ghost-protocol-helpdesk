/**
 * GHOST PROTOCOL — Knowledge Base Page
 * Enhanced: Admin menu, sidebar category management, article card actions.
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Search, ChevronRight, Clock, Pin, Plus, MoreVertical, Library,
  Printer, Monitor, Wifi, KeyRound, Mail, AppWindow, Building2, ClipboardList,
  ThumbsUp, ThumbsDown, AlertCircle, AlertTriangle, FileText, User, Edit3, Copy, Check,
  PrinterIcon, Trash2, PinOff, FileDown, Filter, History, CopyPlus, ChevronDown, Tag, X as XIcon, Send
} from 'lucide-react';
import { DARK_THEME } from '@/constants/theme';
import useKnowledgeBase from '@/hooks/useKnowledgeBase';
import ArticleEditor from '@/components/knowledge/ArticleEditor';
import AdvancedSearch from '@/components/knowledge/AdvancedSearch';
import HistoryDrawer from '@/components/knowledge/HistoryDrawer';
import { useToast } from '@/hooks/useToast';
import { exportArticlePDF } from '@/utils/exportKBArticle';

const ICON_MAP = { Printer, Monitor, Wifi, KeyRound, Mail, AppWindow, Building2, ClipboardList };
const DIFFICULTY_CONFIG = {
  beginner: { label: 'BEGINNER', color: DARK_THEME.success },
  intermediate: { label: 'INTERMEDIATE', color: DARK_THEME.warning },
  advanced: { label: 'ADVANCED', color: DARK_THEME.danger },
};

function formatDate(d) { if (!d) return '—'; return new Date(d).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }); }
function readingTime(b) { return `${Math.max(1, Math.ceil((b || '').split(/\s+/).filter(Boolean).length / 200))} min read`; }

// ── Shared: dropdown menu item ──
const menuItemStyle = { display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '9px 14px', backgroundColor: 'transparent', border: 'none', borderRadius: '4px', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: DARK_THEME.text, cursor: 'pointer', textAlign: 'left', transition: 'background-color 0.1s' };
const menuItemDangerStyle = { ...menuItemStyle, color: DARK_THEME.danger };

// ── Loading skeletons ──
function SkeletonBar({ width, height }) { return <div style={{ width, height: height || '12px', borderRadius: '4px', backgroundColor: `${DARK_THEME.electric}08`, animation: 'skeletonPulse 1.5s ease-in-out infinite' }} />; }
function SkeletonCard() { return <div style={{ padding: '20px', backgroundColor: DARK_THEME.surface, border: `1px solid ${DARK_THEME.border}`, borderRadius: '10px' }}><div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}><SkeletonBar width="80px" height="18px" /><SkeletonBar width="60px" height="18px" /></div><SkeletonBar width="90%" height="16px" /><div style={{ marginTop: '8px' }}><SkeletonBar width="100%" height="12px" /></div><div style={{ marginTop: '4px' }}><SkeletonBar width="70%" height="12px" /></div></div>; }

// ── Dropdown backdrop ──
function DropdownBackdrop({ onClose }) { return <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 80 }} onClick={onClose} />; }

// ═══════════════════════════════════════════════════════════════════════════
// CATEGORY SIDEBAR (with + button, context menu)
// ═══════════════════════════════════════════════════════════════════════════

function CategorySidebar({ categories, selectedCategory, onSelectCategory, searchQuery, onSearchChange, onSelectArticle, searchResults, onSearch, totalArticles, isLoading, canEdit, onCreateCategory, onRenameCategory, onDeleteCategory }) {
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [showNewInput, setShowNewInput] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [renaming, setRenaming] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [addSubTo, setAddSubTo] = useState(null); // parent id for new subcategory
  const [subName, setSubName] = useState('');
  const [pendingCatDelete, setPendingCatDelete] = useState(null); // confirmation dialog state
  const [isDeletingCat, setIsDeletingCat] = useState(false);

  const toggleExpand = (id) => { setExpandedIds((p) => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n; }); };

  // Build hierarchy: parent categories (no parent_id) and their children
  const parentCats = useMemo(() => categories.filter((c) => !c.parent_id), [categories]);
  const childrenOf = useMemo(() => {
    const map = {};
    for (const c of categories) { if (c.parent_id) { if (!map[c.parent_id]) map[c.parent_id] = []; map[c.parent_id].push(c); } }
    return map;
  }, [categories]);

  const handleCreate = async (parentId = null) => {
    const name = parentId ? subName : newName;
    if (!name.trim() || !onCreateCategory) return;
    setCreating(true);
    try {
      const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const res = await onCreateCategory(name.trim(), slug, null, parentId);
      if (res?.success) {
        if (parentId) { setSubName(''); setAddSubTo(null); setExpandedIds((p) => new Set(p).add(parentId)); }
        else { setNewName(''); setShowNewInput(false); }
      }
    } catch (err) { console.error('[KB] createCategory error:', err); }
    setCreating(false);
  };

  const handleRename = async (id) => {
    if (!renameValue.trim() || !onRenameCategory) return;
    await onRenameCategory(id, renameValue.trim(), null);
    setRenaming(null);
    setRenameValue('');
  };

  const handleContextMenu = (e, cat) => {
    e.preventDefault();
    e.stopPropagation();
    const children = childrenOf[cat.id] || [];
    const totalArticles = (cat.article_count || 0) + children.reduce((s, c) => s + (c.article_count || 0), 0);
    setContextMenu({ id: cat.id, name: cat.name, articleCount: totalArticles, childCount: children.length, isChild: !!cat.parent_id, x: e.clientX, y: e.clientY });
  };

  const renderCatButton = (cat, indent = 0) => {
    const Icon = ICON_MAP[cat.icon] || FileText;
    const isSelected = selectedCategory === cat.id;
    const isRenaming_ = renaming === cat.id;
    const children = childrenOf[cat.id] || [];
    const isExpanded = expandedIds.has(cat.id);
    const hasChildren = children.length > 0;

    return (
      <div key={cat.id} style={{ marginTop: '2px' }}>
        {isRenaming_ ? (
          <div style={{ padding: '6px 12px', paddingLeft: `${12 + indent * 16}px` }}>
            <input type="text" value={renameValue} onChange={(e) => setRenameValue(e.target.value)} autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') handleRename(cat.id); if (e.key === 'Escape') setRenaming(null); }}
              onBlur={() => setRenaming(null)}
              style={{ width: '100%', padding: '8px 10px', boxSizing: 'border-box', backgroundColor: 'rgba(79, 195, 247, 0.04)', border: `1px solid ${DARK_THEME.electric}`, borderRadius: '4px', fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: DARK_THEME.text, outline: 'none' }} />
          </div>
        ) : (
          <button
            onClick={() => { onSelectCategory(cat.id); if (hasChildren) toggleExpand(cat.id); }}
            onContextMenu={canEdit ? (e) => handleContextMenu(e, cat) : undefined}
            style={{ display: 'flex', alignItems: 'center', gap: indent > 0 ? '8px' : '10px', width: '100%', padding: `8px 12px 8px ${12 + indent * 16}px`, backgroundColor: isSelected ? `${DARK_THEME.electric}12` : 'transparent', border: 'none', borderRadius: '6px', cursor: 'pointer', textAlign: 'left', borderLeft: isSelected ? `3px solid ${DARK_THEME.electric}` : '3px solid transparent' }}
            onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(79, 195, 247, 0.06)'; }}
            onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'; }}>
            {indent > 0 ? <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: DARK_THEME.textMuted, flexShrink: 0 }} />
              : <Icon size={14} style={{ color: isSelected ? DARK_THEME.electric : DARK_THEME.textMuted, flexShrink: 0 }} />}
            <span style={{ flex: 1, fontFamily: 'DM Sans, sans-serif', fontSize: indent > 0 ? '12px' : '13px', color: isSelected ? DARK_THEME.electric : indent > 0 ? DARK_THEME.textMuted : DARK_THEME.text }}>{cat.name}</span>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: DARK_THEME.textMuted, backgroundColor: `${DARK_THEME.electric}10`, padding: '2px 7px', borderRadius: '10px' }}>{cat.article_count || 0}</span>
            {hasChildren && indent === 0 && <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.15 }}><ChevronRight size={12} style={{ color: DARK_THEME.textMuted }} /></motion.div>}
          </button>
        )}

        {/* Subcategories */}
        <AnimatePresence>
          {isExpanded && hasChildren && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} style={{ overflow: 'hidden' }}>
              {children.map((child) => renderCatButton(child, indent + 1))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add subcategory input */}
        <AnimatePresence>
          {addSubTo === cat.id && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden', paddingLeft: `${28 + indent * 16}px`, paddingRight: '8px', paddingBottom: '4px' }}>
              <input type="text" value={subName} onChange={(e) => setSubName(e.target.value)} placeholder="Subcategory name..." autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(cat.id); if (e.key === 'Escape') { setAddSubTo(null); setSubName(''); } }}
                style={{ width: '100%', padding: '6px 8px', boxSizing: 'border-box', backgroundColor: 'rgba(79, 195, 247, 0.04)', border: `1px solid ${DARK_THEME.electric}`, borderRadius: '4px', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: DARK_THEME.text, outline: 'none', marginTop: '4px' }} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div style={{ width: '260px', height: '100%', backgroundColor: DARK_THEME.surface, borderRight: `1px solid ${DARK_THEME.border}`, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      <div style={{ padding: '16px', borderBottom: `1px solid ${DARK_THEME.border}` }}>
        <AdvancedSearch query={searchQuery} onQueryChange={onSearchChange} onSelectArticle={onSelectArticle} searchResults={searchResults} onSearch={onSearch} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px' }}>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', letterSpacing: '0.15em', color: DARK_THEME.textMuted }}>CATEGORIES</span>
          {canEdit && (
            <button onClick={() => setShowNewInput(!showNewInput)} title="Add category"
              style={{ width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: showNewInput ? `${DARK_THEME.electric}15` : 'transparent', border: `1px solid ${showNewInput ? DARK_THEME.electric : DARK_THEME.border}`, borderRadius: '4px', cursor: 'pointer', color: DARK_THEME.electric }}>
              <Plus size={12} />
            </button>
          )}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
        <AnimatePresence>
          {showNewInput && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden', marginBottom: '4px' }}>
              <div style={{ padding: '6px' }}>
                <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="New category name..." autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(null); if (e.key === 'Escape') { setShowNewInput(false); setNewName(''); } }}
                  style={{ width: '100%', padding: '8px 10px', boxSizing: 'border-box', backgroundColor: 'rgba(79, 195, 247, 0.04)', border: `1px solid ${DARK_THEME.electric}`, borderRadius: '6px', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: DARK_THEME.text, outline: 'none' }} />
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: DARK_THEME.textMuted, marginTop: '4px', paddingLeft: '2px' }}>{creating ? 'Creating...' : 'Enter to create, Esc to cancel'}</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button onClick={() => onSelectCategory(null)} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 12px', backgroundColor: selectedCategory === null ? `${DARK_THEME.electric}12` : 'transparent', border: 'none', borderRadius: '6px', cursor: 'pointer', textAlign: 'left', borderLeft: selectedCategory === null ? `3px solid ${DARK_THEME.electric}` : '3px solid transparent' }}>
          <Library size={14} style={{ color: DARK_THEME.electric, flexShrink: 0 }} />
          <span style={{ flex: 1, fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: selectedCategory === null ? DARK_THEME.electric : DARK_THEME.text }}>ALL ARTICLES</span>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: DARK_THEME.textMuted, backgroundColor: `${DARK_THEME.electric}10`, padding: '2px 7px', borderRadius: '10px' }}>{totalArticles}</span>
        </button>

        {isLoading ? (
          <div style={{ padding: '12px' }}>{[1,2,3,4].map((i) => <div key={i} style={{ marginBottom: '8px' }}><SkeletonBar width="100%" height="32px" /></div>)}</div>
        ) : (
          parentCats.map((cat) => renderCatButton(cat, 0))
        )}
      </div>

      {/* Context menu */}
      <AnimatePresence>
        {contextMenu && (
          <>
            <DropdownBackdrop onClose={() => setContextMenu(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              style={{ position: 'fixed', top: contextMenu.y, left: contextMenu.x, zIndex: 90, backgroundColor: DARK_THEME.surface, border: `1px solid ${DARK_THEME.border}`, borderRadius: '8px', padding: '6px', minWidth: '180px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
              <button onClick={() => { setRenaming(contextMenu.id); setRenameValue(contextMenu.name); setContextMenu(null); }}
                style={menuItemStyle} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(79,195,247,0.06)')} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
                <Edit3 size={12} /> RENAME
              </button>
              {!contextMenu.isChild && (
                <button onClick={() => { setAddSubTo(contextMenu.id); setSubName(''); setExpandedIds((p) => new Set(p).add(contextMenu.id)); setContextMenu(null); }}
                  style={menuItemStyle} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(79,195,247,0.06)')} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
                  <Plus size={12} /> ADD SUBCATEGORY
                </button>
              )}
              <button onClick={() => {
                  setPendingCatDelete({ id: contextMenu.id, name: contextMenu.name, articleCount: contextMenu.articleCount, childCount: contextMenu.childCount });
                  setContextMenu(null);
                }}
                style={menuItemDangerStyle}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = `${DARK_THEME.danger}10`)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
                <Trash2 size={12} /> DELETE
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Category Delete Confirmation Dialog */}
      <AnimatePresence>
        {pendingCatDelete && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isDeletingCat && setPendingCatDelete(null)}
              style={{
                position: 'fixed',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(5, 10, 24, 0.85)',
                backdropFilter: 'blur(4px)',
                zIndex: 600,
              }}
            />
            <div style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 601,
              pointerEvents: 'none',
            }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: '94%',
                  maxWidth: '480px',
                  backgroundColor: DARK_THEME.surface,
                  border: `1px solid ${DARK_THEME.danger}40`,
                  borderRadius: '14px',
                  boxShadow: '0 0 60px rgba(239, 68, 68, 0.15)',
                  pointerEvents: 'auto',
                  overflow: 'hidden',
                }}
              >
                <div style={{ height: '4px', backgroundColor: DARK_THEME.danger }} />

                <div style={{ padding: '24px 28px', textAlign: 'center' }}>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    backgroundColor: `${DARK_THEME.danger}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                  }}>
                    <AlertTriangle size={28} style={{ color: DARK_THEME.danger }} />
                  </div>

                  <h2 style={{
                    fontFamily: 'Rajdhani, sans-serif',
                    fontSize: '22px',
                    fontWeight: 600,
                    letterSpacing: '0.1em',
                    color: DARK_THEME.text,
                    margin: '0 0 12px',
                  }}>
                    DELETE CATEGORY?
                  </h2>

                  <p style={{
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '14px',
                    color: DARK_THEME.textMuted,
                    margin: '0 0 16px',
                  }}>
                    Are you sure you want to permanently delete this category?
                  </p>

                  <div style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.05)',
                    border: `1px solid ${DARK_THEME.danger}20`,
                    borderRadius: '8px',
                    padding: '12px',
                    marginBottom: '12px',
                  }}>
                    <div style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '12px',
                      color: DARK_THEME.danger,
                    }}>
                      {pendingCatDelete.name}
                      {pendingCatDelete.childCount > 0 && ` (+${pendingCatDelete.childCount} subcategories)`}
                    </div>
                  </div>

                  <p style={{
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '13px',
                    color: DARK_THEME.danger,
                    margin: 0,
                  }}>
                    This action cannot be undone.
                  </p>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '12px',
                  padding: '20px 28px',
                  borderTop: `1px solid ${DARK_THEME.border}`,
                }}>
                  <motion.button
                    onClick={() => setPendingCatDelete(null)}
                    disabled={isDeletingCat}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      padding: '12px 28px',
                      backgroundColor: 'transparent',
                      border: `1px solid ${DARK_THEME.border}`,
                      borderRadius: '6px',
                      fontFamily: 'Rajdhani, sans-serif',
                      fontWeight: 600,
                      fontSize: '14px',
                      letterSpacing: '0.1em',
                      color: DARK_THEME.textMuted,
                      cursor: isDeletingCat ? 'not-allowed' : 'pointer',
                      opacity: isDeletingCat ? 0.5 : 1,
                    }}
                  >
                    CANCEL
                  </motion.button>
                  <motion.button
                    onClick={async () => {
                      if (!onDeleteCategory || isDeletingCat) return;
                      setIsDeletingCat(true);
                      await onDeleteCategory(pendingCatDelete.id);
                      setIsDeletingCat(false);
                      setPendingCatDelete(null);
                    }}
                    disabled={isDeletingCat}
                    whileHover={{ scale: isDeletingCat ? 1 : 1.02 }}
                    whileTap={{ scale: isDeletingCat ? 1 : 0.98 }}
                    style={{
                      padding: '12px 28px',
                      backgroundColor: DARK_THEME.danger,
                      border: `1px solid ${DARK_THEME.danger}`,
                      borderRadius: '6px',
                      fontFamily: 'Rajdhani, sans-serif',
                      fontWeight: 600,
                      fontSize: '14px',
                      letterSpacing: '0.1em',
                      color: '#fff',
                      cursor: isDeletingCat ? 'not-allowed' : 'pointer',
                      opacity: isDeletingCat ? 0.7 : 1,
                    }}
                  >
                    {isDeletingCat ? 'DELETING...' : 'DELETE'}
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ARTICLE CARD (with three-dot menu)
// ═══════════════════════════════════════════════════════════════════════════

function ArticleCard({ article, categories, onClick, onEdit, onTogglePin, onDelete, onDuplicate, onTagClick, canEdit }) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  const diff = DIFFICULTY_CONFIG[article.difficulty] || DIFFICULTY_CONFIG.beginner;
  const catName = article.category_name || categories.find((c) => c.id === article.category_id)?.name;

  return (
    <motion.div onClick={() => onClick(article)} whileHover={{ y: -2 }}
      style={{ padding: '20px', backgroundColor: DARK_THEME.surface, border: `1px solid ${DARK_THEME.border}`, borderRadius: '10px', cursor: 'pointer', transition: 'border-color 0.2s, box-shadow 0.2s', position: 'relative', overflow: 'hidden' }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = DARK_THEME.electric; e.currentTarget.style.boxShadow = `0 4px 20px ${DARK_THEME.glow}`; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = DARK_THEME.border; e.currentTarget.style.boxShadow = 'none'; }}>

      {/* Top right: pin icon + three-dot menu */}
      <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
        {article.is_pinned ? <Pin size={12} style={{ color: DARK_THEME.gold, transform: 'rotate(45deg)' }} /> : null}
        {canEdit && (
          <div ref={menuRef} style={{ position: 'relative' }}>
            <button onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
              style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '4px', color: DARK_THEME.textMuted, transition: 'color 0.15s' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = DARK_THEME.electric)}
              onMouseLeave={(e) => (e.currentTarget.style.color = DARK_THEME.textMuted)}>
              <MoreVertical size={14} />
            </button>
            <AnimatePresence>
              {showMenu && (
                <>
                  <DropdownBackdrop onClose={() => setShowMenu(false)} />
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                    style={{ position: 'absolute', top: '100%', right: 0, marginTop: '4px', backgroundColor: DARK_THEME.surface, border: `1px solid ${DARK_THEME.border}`, borderRadius: '8px', padding: '6px', minWidth: '150px', zIndex: 90, boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
                    <button onClick={(e) => { e.stopPropagation(); setShowMenu(false); onEdit(article); }}
                      style={menuItemStyle} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(79,195,247,0.06)')} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
                      <Edit3 size={12} /> EDIT
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setShowMenu(false); onTogglePin(article); }}
                      style={menuItemStyle} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(79,195,247,0.06)')} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
                      {article.is_pinned ? <PinOff size={12} /> : <Pin size={12} style={{ transform: 'rotate(45deg)' }} />} {article.is_pinned ? 'UNPIN' : 'PIN'}
                    </button>
                    {onDuplicate && (
                      <button onClick={(e) => { e.stopPropagation(); setShowMenu(false); onDuplicate(article); }}
                        style={menuItemStyle} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(79,195,247,0.06)')} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
                        <CopyPlus size={12} /> DUPLICATE
                      </button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); setShowMenu(false); onDelete(article); }}
                      style={menuItemDangerStyle} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = `${DARK_THEME.danger}10`)} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
                      <Trash2 size={12} /> DELETE
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
        {catName && <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: DARK_THEME.electric, padding: '3px 8px', backgroundColor: `${DARK_THEME.electric}12`, border: `1px solid ${DARK_THEME.electric}25`, borderRadius: '4px' }}>{catName.toUpperCase()}</span>}
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: diff.color, padding: '3px 8px', backgroundColor: `${diff.color}12`, border: `1px solid ${diff.color}25`, borderRadius: '4px' }}>{diff.label}</span>
        {article.status === 'draft' && <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: DARK_THEME.warning, padding: '3px 8px', backgroundColor: `${DARK_THEME.warning}12`, border: `1px solid ${DARK_THEME.warning}25`, borderRadius: '4px' }}>DRAFT</span>}
      </div>
      <h3 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '15px', fontWeight: 600, color: DARK_THEME.text, margin: '0 0 8px', lineHeight: 1.4, paddingRight: '30px' }}>{article.title}</h3>
      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: DARK_THEME.textMuted, margin: '0 0 14px', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{article.excerpt}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: DARK_THEME.textMuted, flexWrap: 'wrap' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={11} /> {formatDate(article.updated_at)}</span>
        <span>{readingTime(article.body)}</span>
        {onTagClick && (article.tags || '').split(',').filter((t) => t.trim()).slice(0, 3).map((t) => (
          <button key={t.trim()} onClick={(e) => { e.stopPropagation(); onTagClick(t.trim()); }} title={`#${t.trim()}`}
            style={{ padding: '1px 6px', backgroundColor: `${DARK_THEME.electric}08`, border: `1px solid ${DARK_THEME.border}`, borderRadius: '8px', fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: DARK_THEME.textMuted, cursor: 'pointer', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = DARK_THEME.electric; e.currentTarget.style.color = DARK_THEME.electric; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = DARK_THEME.border; e.currentTarget.style.color = DARK_THEME.textMuted; }}>
            #{t.trim()}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CARD WITH CHECKBOX WRAPPER
// ═══════════════════════════════════════════════════════════════════════════

function CardWithCheckbox({ article, isSelected, onToggleSelect, canEdit, hasAnySelected, children }) {
  const [hovered, setHovered] = useState(false);
  const showStrip = canEdit && (isSelected || hasAnySelected || hovered);

  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <div style={{ height: showStrip ? '28px' : '0', overflow: 'hidden', transition: 'height 0.2s ease', display: 'flex', alignItems: 'center', paddingLeft: '4px' }}>
        {showStrip && (
          <div onClick={(e) => { e.stopPropagation(); onToggleSelect(article.id); }}
            style={{ width: '18px', height: '18px', borderRadius: '4px', border: `1.5px solid ${isSelected ? DARK_THEME.electric : DARK_THEME.border}`, backgroundColor: isSelected ? `${DARK_THEME.electric}20` : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s' }}>
            {isSelected && <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: DARK_THEME.electric }} />}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CODE BLOCK WITH COPY
// ═══════════════════════════════════════════════════════════════════════════

function CopyableCodeBlock({ code }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <div style={{ position: 'relative', margin: '14px 0' }}>
      <button onClick={handleCopy} style={{ position: 'absolute', top: '8px', right: '8px', padding: '4px 8px', backgroundColor: copied ? `${DARK_THEME.success}20` : `${DARK_THEME.electric}10`, border: `1px solid ${copied ? DARK_THEME.success : DARK_THEME.border}`, borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: copied ? DARK_THEME.success : DARK_THEME.textMuted, zIndex: 1 }}>
        {copied ? <><Check size={10} /> COPIED</> : <><Copy size={10} /> COPY</>}
      </button>
      <pre style={{ padding: '16px', paddingRight: '80px', backgroundColor: DARK_THEME.bg, border: `1px solid ${DARK_THEME.border}`, borderRadius: '8px', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: DARK_THEME.electric, overflowX: 'auto', lineHeight: 1.6, margin: 0 }}>{code}</pre>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ARTICLE VIEW
// ═══════════════════════════════════════════════════════════════════════════

function ArticleView({ article, categories, onBack, onEdit, canEdit, currentUser, submitFeedback, getUserFeedback, createIssueReport, onTagClick, onShowHistory, toast }) {
  const diff = DIFFICULTY_CONFIG[article.difficulty] || DIFFICULTY_CONFIG.beginner;
  const catName = article.category_name || categories.find((c) => c.id === article.category_id)?.name;
  const scrollRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [feedbackState, setFeedbackState] = useState(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  // Report Issue dialog state
  const [showIssueDialog, setShowIssueDialog] = useState(false);
  const [issueType, setIssueType] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [isSubmittingIssue, setIsSubmittingIssue] = useState(false);
  const headings = (article.body || '').split('\n').filter((l) => l.startsWith('## ')).map((l, i) => ({ id: `heading-${i}`, text: l.replace('## ', '') }));
  const tags = (article.tags || '').split(',').map((t) => t.trim()).filter(Boolean);

  // Load user's previous vote when article loads
  useEffect(() => {
    if (article?.id && currentUser?.id && getUserFeedback) {
      getUserFeedback(article.id, currentUser.id).then((fb) => {
        if (fb) setFeedbackState(fb.is_helpful === 1 ? 'yes' : 'no');
      }).catch(() => {});
    }
  }, [article?.id, currentUser?.id, getUserFeedback]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const h = () => { const { scrollTop, scrollHeight, clientHeight } = el; setScrollProgress(scrollHeight > clientHeight ? scrollTop / (scrollHeight - clientHeight) : 0); };
    el.addEventListener('scroll', h);
    return () => el.removeEventListener('scroll', h);
  }, [article]);

  const handleFeedback = async (isHelpful) => {
    const vote = isHelpful ? 'yes' : 'no';
    if (feedbackState === vote || feedbackLoading) return;
    setFeedbackLoading(true);
    setFeedbackState(vote);
    try {
      if (submitFeedback) {
        await submitFeedback(article.id, currentUser?.id, isHelpful, null, currentUser?.display_name);
        // Notify TopCommandBar to increment badge count immediately
        window.dispatchEvent(new CustomEvent('kb-notification-sent'));
      }
    } catch {
      // Revert on error
      setFeedbackState(null);
    }
    setFeedbackLoading(false);
  };

  const handleSubmitIssue = async () => {
    if (!issueType || !issueDescription.trim() || isSubmittingIssue) return;
    setIsSubmittingIssue(true);
    try {
      const result = await createIssueReport(article.id, currentUser?.id, currentUser?.display_name, issueType, issueDescription.trim());
      if (result?.success) {
        toast?.success('Issue reported successfully');
        // Notify TopCommandBar to increment badge count immediately
        window.dispatchEvent(new CustomEvent('kb-notification-sent'));
        setShowIssueDialog(false);
        setIssueType('');
        setIssueDescription('');
      } else {
        toast?.error(result?.error || 'Failed to submit issue');
      }
    } catch (err) {
      toast?.error('Failed to submit issue');
    }
    setIsSubmittingIssue(false);
  };

  const handleExportPDF = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const result = await exportArticlePDF(article, catName || 'Uncategorized');
      if (result.success) {
        toast?.success('Article exported to PDF');
      } else if (!result.canceled) {
        toast?.error('Failed to export PDF');
      }
    } catch (err) {
      console.error('[ArticleView] PDF export failed:', err);
      toast?.error(err.message || 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const renderBody = (body) => {
    const lines = body.split('\n'); const elements = []; let inCode = false; let codeLines = [];
    const flushCode = () => { if (codeLines.length > 0) { elements.push(<CopyableCodeBlock key={`code-${elements.length}`} code={codeLines.join('\n')} />); codeLines = []; } };
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith('```')) { if (inCode) { flushCode(); inCode = false; } else { inCode = true; } continue; }
      if (inCode) { codeLines.push(line); continue; }
      if (line.startsWith('# ')) elements.push(<h1 key={i} style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '24px', fontWeight: 700, color: DARK_THEME.text, margin: '24px 0 12px' }}>{line.replace('# ', '')}</h1>);
      else if (line.startsWith('## ')) elements.push(<h2 key={i} id={`heading-${headings.findIndex((h) => h.text === line.replace('## ', ''))}`} style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '18px', fontWeight: 600, color: DARK_THEME.text, margin: '20px 0 10px', paddingTop: '10px', borderTop: `1px solid ${DARK_THEME.gridLine}` }}>{line.replace('## ', '')}</h2>);
      else if (line.startsWith('- ')) elements.push(<div key={i} style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: DARK_THEME.text, padding: '3px 0 3px 16px', lineHeight: 1.6, borderLeft: `2px solid ${DARK_THEME.electric}30` }}>{line.replace(/^- (\[[ x]\] )?/, '')}</div>);
      else if (line.match(/^\d+\./)) elements.push(<div key={i} style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: DARK_THEME.text, padding: '3px 0 3px 16px', lineHeight: 1.6 }}>{line}</div>);
      else if (line.startsWith('|')) elements.push(<div key={i} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: DARK_THEME.text, padding: '2px 0' }}>{line}</div>);
      else if (line.trim()) { const parts = line.split(/`([^`]+)`/); elements.push(<p key={i} style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: DARK_THEME.text, margin: '8px 0', lineHeight: 1.7 }}>{parts.map((p, j) => j % 2 === 1 ? <code key={j} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: DARK_THEME.electric, backgroundColor: `${DARK_THEME.electric}10`, padding: '2px 6px', borderRadius: '4px' }}>{p}</code> : p)}</p>); }
    }
    flushCode(); return elements;
  };

  return (
    <div style={{ display: 'flex', height: '100%', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', zIndex: 5, backgroundColor: `${DARK_THEME.electric}15` }}>
        <motion.div animate={{ width: `${scrollProgress * 100}%` }} transition={{ duration: 0.1 }} style={{ height: '100%', backgroundColor: DARK_THEME.electric, borderRadius: '0 2px 2px 0' }} />
      </div>
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '32px', paddingTop: '36px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: DARK_THEME.textMuted, cursor: 'pointer', padding: 0 }} onMouseEnter={(e) => (e.currentTarget.style.color = DARK_THEME.electric)} onMouseLeave={(e) => (e.currentTarget.style.color = DARK_THEME.textMuted)}><ChevronRight size={12} style={{ transform: 'rotate(180deg)' }} /> BACK</button>
          <div style={{ display: 'flex', gap: '8px' }}>
            {canEdit && <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => onEdit(article)} style={{ padding: '8px 14px', backgroundColor: 'transparent', border: `1px solid ${DARK_THEME.electric}30`, borderRadius: '6px', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: DARK_THEME.electric, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}><Edit3 size={12} /> EDIT</motion.button>}
            {canEdit && onShowHistory && <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => onShowHistory(article)} style={{ padding: '8px 14px', backgroundColor: 'transparent', border: `1px solid ${DARK_THEME.gold}30`, borderRadius: '6px', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: DARK_THEME.gold, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}><History size={12} /> HISTORY</motion.button>}
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleExportPDF} disabled={isExporting} style={{ padding: '8px 14px', backgroundColor: 'transparent', border: `1px solid ${DARK_THEME.border}`, borderRadius: '6px', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: DARK_THEME.textMuted, cursor: isExporting ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: '5px', opacity: isExporting ? 0.6 : 1 }}><FileDown size={12} /> {isExporting ? 'EXPORTING...' : 'EXPORT PDF'}</motion.button>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', color: DARK_THEME.electric, padding: '4px 12px', backgroundColor: `${DARK_THEME.electric}12`, border: `1px solid ${DARK_THEME.electric}25`, borderRadius: '5px' }}>{(catName ?? 'UNCATEGORIZED').toUpperCase()}</span>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', color: diff.color, padding: '4px 12px', backgroundColor: `${diff.color}12`, border: `1px solid ${diff.color}25`, borderRadius: '5px' }}>{diff.label}</span>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', color: DARK_THEME.textMuted, display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={13} /> {formatDate(article.updated_at)}</span>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', color: DARK_THEME.electric }}>{readingTime(article.body)}</span>
        </div>
        <div style={{ maxWidth: '720px' }}>{renderBody(article.body)}</div>
        {tags.length > 0 && <div style={{ marginTop: '24px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>{tags.map((t) => <button key={t} onClick={() => onTagClick && onTagClick(t)} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: DARK_THEME.textMuted, padding: '4px 10px', backgroundColor: `${DARK_THEME.electric}08`, borderRadius: '12px', border: `1px solid ${DARK_THEME.border}`, cursor: onTagClick ? 'pointer' : 'default', transition: 'all 0.15s' }} onMouseEnter={(e) => { if (onTagClick) { e.currentTarget.style.borderColor = DARK_THEME.electric; e.currentTarget.style.color = DARK_THEME.electric; }}} onMouseLeave={(e) => { e.currentTarget.style.borderColor = DARK_THEME.border; e.currentTarget.style.color = DARK_THEME.textMuted; }}>#{t}</button>)}</div>}
      </div>
      <div style={{ width: '220px', borderLeft: `1px solid ${DARK_THEME.border}`, padding: '32px 16px', flexShrink: 0, overflowY: 'auto' }}>
        {headings.length > 0 && <div style={{ marginBottom: '28px' }}><div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', letterSpacing: '0.15em', color: DARK_THEME.textMuted, marginBottom: '12px' }}>ON THIS PAGE</div>{headings.map((h) => <a key={h.id} href={`#${h.id}`} onClick={(e) => { e.preventDefault(); document.getElementById(h.id)?.scrollIntoView({ behavior: 'smooth' }); }} style={{ display: 'block', fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: DARK_THEME.textMuted, textDecoration: 'none', padding: '5px 0', borderLeft: `2px solid ${DARK_THEME.border}`, paddingLeft: '10px', cursor: 'pointer' }} onMouseEnter={(e) => (e.currentTarget.style.color = DARK_THEME.electric)} onMouseLeave={(e) => (e.currentTarget.style.color = DARK_THEME.textMuted)}>{h.text}</a>)}</div>}
        <div style={{ marginBottom: '24px' }}><div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', letterSpacing: '0.15em', color: DARK_THEME.textMuted, marginBottom: '12px' }}>WAS THIS HELPFUL?</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => handleFeedback(true)} disabled={feedbackLoading} style={{ flex: 1, padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', backgroundColor: feedbackState === 'yes' ? `${DARK_THEME.success}15` : 'transparent', border: `1px solid ${feedbackState === 'yes' ? DARK_THEME.success : DARK_THEME.success + '30'}`, borderRadius: '6px', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: DARK_THEME.success, cursor: feedbackLoading ? 'wait' : 'pointer', opacity: feedbackLoading ? 0.7 : 1 }}><ThumbsUp size={14} /> YES</button>
            <button onClick={() => handleFeedback(false)} disabled={feedbackLoading} style={{ flex: 1, padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', backgroundColor: feedbackState === 'no' ? `${DARK_THEME.danger}15` : 'transparent', border: `1px solid ${feedbackState === 'no' ? DARK_THEME.danger : DARK_THEME.danger + '30'}`, borderRadius: '6px', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: DARK_THEME.danger, cursor: feedbackLoading ? 'wait' : 'pointer', opacity: feedbackLoading ? 0.7 : 1 }}><ThumbsDown size={14} /> NO</button>
          </div>
        </div>
        <button onClick={() => setShowIssueDialog(true)} style={{ width: '100%', padding: '12px', backgroundColor: 'transparent', border: `1px dashed ${DARK_THEME.border}`, borderRadius: '6px', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: DARK_THEME.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = DARK_THEME.warning; e.currentTarget.style.color = DARK_THEME.warning; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = DARK_THEME.border; e.currentTarget.style.color = DARK_THEME.textMuted; }}><AlertCircle size={14} /> REPORT AN ISSUE</button>
      </div>

      {/* Report Issue Dialog */}
      <AnimatePresence>
        {showIssueDialog && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setShowIssueDialog(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} style={{ width: '420px', backgroundColor: DARK_THEME.surface, border: `1px solid ${DARK_THEME.border}`, borderRadius: '12px', overflow: 'hidden' }}>
              {/* Header */}
              <div style={{ padding: '16px 20px', borderBottom: `1px solid ${DARK_THEME.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <AlertTriangle size={18} style={{ color: DARK_THEME.warning }} />
                  <span style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '16px', fontWeight: 600, color: DARK_THEME.text }}>Report an Issue</span>
                </div>
                <button onClick={() => setShowIssueDialog(false)} style={{ background: 'none', border: 'none', color: DARK_THEME.textMuted, cursor: 'pointer', padding: '4px' }}><XIcon size={18} /></button>
              </div>
              {/* Body */}
              <div style={{ padding: '20px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', letterSpacing: '0.1em', color: DARK_THEME.textMuted, marginBottom: '8px' }}>ISSUE TYPE</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {['outdated', 'inaccurate', 'incomplete', 'other'].map((type) => (
                      <button key={type} onClick={() => setIssueType(type)} style={{ padding: '8px 14px', backgroundColor: issueType === type ? `${DARK_THEME.warning}15` : 'transparent', border: `1px solid ${issueType === type ? DARK_THEME.warning : DARK_THEME.border}`, borderRadius: '6px', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: issueType === type ? DARK_THEME.warning : DARK_THEME.textMuted, cursor: 'pointer', textTransform: 'uppercase' }}>{type}</button>
                    ))}
                  </div>
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', letterSpacing: '0.1em', color: DARK_THEME.textMuted, marginBottom: '8px' }}>DESCRIPTION</label>
                  <textarea value={issueDescription} onChange={(e) => setIssueDescription(e.target.value)} placeholder="Please describe the issue you found..." rows={4} style={{ width: '100%', padding: '12px', backgroundColor: DARK_THEME.bg, border: `1px solid ${DARK_THEME.border}`, borderRadius: '6px', fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#E2E8F0', resize: 'vertical', outline: 'none' }} onFocus={(e) => e.target.style.borderColor = DARK_THEME.electric} onBlur={(e) => e.target.style.borderColor = DARK_THEME.border} />
                </div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button onClick={() => setShowIssueDialog(false)} style={{ padding: '10px 18px', backgroundColor: 'transparent', border: `1px solid ${DARK_THEME.border}`, borderRadius: '6px', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: DARK_THEME.textMuted, cursor: 'pointer' }}>CANCEL</button>
                  <button onClick={handleSubmitIssue} disabled={!issueType || !issueDescription.trim() || isSubmittingIssue} style={{ padding: '10px 18px', backgroundColor: (!issueType || !issueDescription.trim() || isSubmittingIssue) ? `${DARK_THEME.warning}30` : DARK_THEME.warning, border: 'none', borderRadius: '6px', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: (!issueType || !issueDescription.trim() || isSubmittingIssue) ? DARK_THEME.textMuted : '#000', cursor: (!issueType || !issueDescription.trim() || isSubmittingIssue) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}><Send size={12} /> {isSubmittingIssue ? 'SUBMITTING...' : 'SUBMIT'}</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// BROWSE RIGHT PANEL
// ═══════════════════════════════════════════════════════════════════════════

function BrowseRightPanel({ articles, categories }) {
  const stats = useMemo(() => ({ totalArticles: articles.length, totalCategories: categories.length, recentlyAdded: [...articles].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 4) }), [articles, categories]);
  return (
    <div style={{ width: '280px', borderLeft: `1px solid ${DARK_THEME.border}`, backgroundColor: DARK_THEME.surface, padding: '20px', flexShrink: 0, overflowY: 'auto' }}>
      <div style={{ marginBottom: '24px' }}><div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', letterSpacing: '0.15em', color: DARK_THEME.textMuted, marginBottom: '14px' }}>QUICK STATS</div>
        {[{ label: 'TOTAL ARTICLES', value: stats.totalArticles, color: DARK_THEME.electric }, { label: 'CATEGORIES', value: stats.totalCategories, color: DARK_THEME.gold }].map((s) => (
          <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', marginBottom: '6px', backgroundColor: `${s.color}06`, borderRadius: '6px', border: `1px solid ${s.color}15` }}><span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: DARK_THEME.textMuted }}>{s.label}</span><span style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '18px', fontWeight: 700, color: s.color }}>{s.value}</span></div>
        ))}
      </div>
      <div><div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', letterSpacing: '0.15em', color: DARK_THEME.textMuted, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={11} /> RECENTLY ADDED</div>
        {stats.recentlyAdded.map((a) => <div key={a.id} style={{ padding: '8px 0', borderBottom: `1px solid ${DARK_THEME.gridLine}` }}><div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: DARK_THEME.text, marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</div><div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: DARK_THEME.textMuted }}>{formatDate(a.created_at)}</div></div>)}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN KNOWLEDGE BASE PAGE
// ═══════════════════════════════════════════════════════════════════════════

function KnowledgeBasePage({ currentUser }) {
  const kb = useKnowledgeBase();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editorMode, setEditorMode] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const toast = useToast();
  const [showBulkMoveSub, setShowBulkMoveSub] = useState(false);
  const [showDraftsOnly, setShowDraftsOnly] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // article to delete
  const [isDeleting, setIsDeleting] = useState(false);
  const [catDeleteDialog, setCatDeleteDialog] = useState(null);
  const [migrationTarget, setMigrationTarget] = useState(null);
  // Tier 1 features
  const [activeTagFilters, setActiveTagFilters] = useState([]);
  const [selectedArticleIds, setSelectedArticleIds] = useState(new Set());
  const [historyDrawer, setHistoryDrawer] = useState(null); // { articleId, history }
  const [recentEdits, setRecentEdits] = useState([]);

  const canEdit = currentUser?.role === 'owner' || currentUser?.role === 'admin';

  // Load recent edits for admin/owner
  useEffect(() => {
    if (canEdit && currentUser?.id) {
      kb.getRecentEdits(currentUser.id, 5).then(setRecentEdits).catch(() => {});
    }
  }, [canEdit, currentUser?.id, kb.articles]);

  const filteredArticles = useMemo(() => {
    let result = kb.articles;
    if (selectedCategory) result = result.filter((a) => a.category_id === selectedCategory);
    if (showDraftsOnly) result = result.filter((a) => a.status === 'draft');
    else if (!canEdit) result = result.filter((a) => a.status === 'published');
    if (activeTagFilters.length > 0) {
      result = result.filter((a) => {
        const articleTags = (a.tags || '').split(',').map((t) => t.trim().toLowerCase());
        return activeTagFilters.some((f) => articleTags.includes(f.toLowerCase()));
      });
    }
    return result;
  }, [selectedCategory, kb.articles, canEdit, showDraftsOnly, activeTagFilters]);

  // Reset selection when filters change
  useEffect(() => { setSelectedArticleIds(new Set()); }, [selectedCategory, showDraftsOnly, activeTagFilters]);

  const pinnedArticles = filteredArticles.filter((a) => a.is_pinned);
  const regularArticles = filteredArticles.filter((a) => !a.is_pinned);
  const draftCount = kb.articles.filter((a) => a.status === 'draft').length;

  const handleOpenArticle = async (article) => { const full = await kb.openArticle(article.id); if (full) setSelectedArticle(full); };

  const handleSaveArticle = async (data) => {
    setIsSaving(true);
    try {
      const result = data.id
        ? await kb.updateArticle(data.id, data, currentUser?.id, currentUser?.display_name)
        : await kb.createArticle(data, currentUser?.id, currentUser?.display_name);
      if (result.success) { setEditorMode(null); toast.success(data.status === 'published' ? 'Article published' : 'Draft saved'); if (data.status === 'published' && result.article) setSelectedArticle(result.article); }
      else toast.error(result.error || 'Save failed');
    } catch { toast.error('Save failed'); }
    setIsSaving(false);
  };

  const handleTogglePin = async (article) => {
    const res = await kb.togglePin(article.id, currentUser?.id, currentUser?.display_name);
    if (res.success) toast.success(res.is_pinned ? 'Article pinned' : 'Article unpinned');
  };

  const handleDeleteArticle = async () => {
    if (!deleteConfirm || isDeleting) return;
    setIsDeleting(true);
    try {
      const res = await kb.deleteArticle(deleteConfirm.id, currentUser?.id, currentUser?.display_name);
      if (res.success) toast.success('Article deleted');
      else toast.error(res.error || 'Delete failed');
      setDeleteConfirm(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSearch = (q) => { kb.searchArticles(q); };

  const handleTagClick = (tag) => {
    const t = tag.toLowerCase();
    setActiveTagFilters((prev) => prev.includes(t) ? prev : [...prev, t]);
    setSelectedArticle(null);
  };

  const handleDuplicate = async (article) => {
    const res = await kb.duplicateArticle(article.id, currentUser?.id, currentUser?.display_name);
    if (res.success) { toast.success('Article duplicated as draft'); setEditorMode(res.article); }
    else toast.error(res.error || 'Duplication failed');
  };

  const handleShowHistory = async (article) => {
    const history = await kb.getArticleHistory(article.id);
    setHistoryDrawer({ article, history: history || [] });
  };

  const toggleArticleSelection = (id) => {
    setSelectedArticleIds((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };

  const handleBulkPublish = async () => {
    const res = await kb.bulkUpdateStatus([...selectedArticleIds], 'published', currentUser?.id, currentUser?.display_name);
    if (res.success) { toast.success(`${res.count} articles published`); setSelectedArticleIds(new Set()); }
    else toast.error(res.error || 'Failed to publish articles');
  };

  const handleBulkUnpublish = async () => {
    const res = await kb.bulkUpdateStatus([...selectedArticleIds], 'draft', currentUser?.id, currentUser?.display_name);
    if (res.success) { toast.success(`${res.count} articles unpublished`); setSelectedArticleIds(new Set()); }
    else toast.error(res.error || 'Failed to unpublish articles');
  };

  const handleBulkMove = async (catId) => {
    if (!catId) return;
    const res = await kb.bulkMoveCategory([...selectedArticleIds], catId, currentUser?.id, currentUser?.display_name);
    if (res.success) { toast.success(`${res.count} articles moved`); setSelectedArticleIds(new Set()); }
    else toast.error(res.error || 'Failed to move articles');
  };

  const handleBulkDelete = async () => {
    const res = await kb.bulkDelete([...selectedArticleIds], currentUser?.id, currentUser?.display_name);
    if (res.success) { toast.success(`${res.count} articles deleted`); setSelectedArticleIds(new Set()); setDeleteConfirm(null); }
    else toast.error(res.error || 'Failed to delete articles');
  };

  const handleExportAll = async () => {
    if (!window.electronAPI?.export) { toast.error('Export requires Electron runtime'); return; }
    try {
      const exportData = {
        exportedAt: new Date().toISOString(),
        totalArticles: kb.articles.length,
        totalCategories: kb.categories.length,
        categories: kb.categories.map(c => ({ id: c.id, name: c.name, slug: c.slug, icon: c.icon, parent_id: c.parent_id })),
        articles: kb.articles.map(a => ({
          id: a.id, title: a.title, slug: a.slug, body: a.body, category_id: a.category_id,
          status: a.status, difficulty: a.difficulty, tags: a.tags, is_pinned: a.is_pinned,
          created_at: a.created_at, updated_at: a.updated_at,
          created_by_name: a.created_by_name, updated_by_name: a.updated_by_name,
        })),
      };
      const jsonContent = JSON.stringify(exportData, null, 2);
      const dateStr = new Date().toISOString().slice(0, 10);
      const dialogResult = await window.electronAPI.export.showSaveDialog({
        title: 'Export Knowledge Base',
        defaultPath: `ghost-kb-export-${dateStr}.json`,
        filters: [{ name: 'JSON Files', extensions: ['json'] }],
      });
      if (dialogResult.canceled) return;
      const saveResult = await window.electronAPI.export.saveFile({
        filePath: dialogResult.filePath,
        content: jsonContent,
        encoding: 'utf8',
      });
      if (saveResult.success) toast.success(`Exported ${kb.articles.length} articles`);
      else toast.error(saveResult.error || 'Export failed');
    } catch (err) { console.error('[KB] Export error:', err); toast.error('Export failed'); }
  };

  // Editor mode
  if (editorMode) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <ArticleEditor article={editorMode === 'new' ? null : editorMode} categories={kb.categories} onSave={handleSaveArticle} onCancel={() => setEditorMode(null)}
          onCreateCategory={async (name, slug, icon, parentId) => await kb.createCategory(name, slug, icon, parentId, currentUser?.id, currentUser?.display_name)}
          currentUser={currentUser} isSaving={isSaving} />
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '24px 32px', borderBottom: `1px solid ${DARK_THEME.border}`, flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '30px', fontWeight: 700, letterSpacing: '0.1em', color: DARK_THEME.text, margin: '0 0 6px 0' }}>KNOWLEDGE BASE</h1>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', letterSpacing: '0.1em', color: DARK_THEME.textMuted }}>
            IT DOCUMENTATION & PROCEDURES {showDraftsOnly && <span style={{ color: DARK_THEME.warning }}>— DRAFTS ONLY</span>}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '8px 16px', backgroundColor: DARK_THEME.surface, border: `1px solid ${DARK_THEME.border}`, borderRadius: '8px', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: DARK_THEME.electric, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FileText size={13} /> {kb.articles.length} ARTICLES
          </div>
          {canEdit && (
            <>
              <motion.button onClick={() => setEditorMode('new')} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                style={{ padding: '10px 20px', background: `linear-gradient(135deg, ${DARK_THEME.navy}, ${DARK_THEME.electric}30)`, border: `1px solid ${DARK_THEME.electric}`, borderRadius: '8px', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', letterSpacing: '0.1em', color: DARK_THEME.electric, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={14} /> NEW ARTICLE
              </motion.button>

              {/* Admin three-dot menu */}
              <div style={{ position: 'relative' }}>
                <motion.button onClick={() => { setShowAdminMenu(!showAdminMenu); setShowBulkMoveSub(false); }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: showAdminMenu ? `${DARK_THEME.electric}15` : 'transparent', border: `1px solid ${showAdminMenu ? DARK_THEME.electric : DARK_THEME.border}`, borderRadius: '8px', cursor: 'pointer', color: showAdminMenu ? DARK_THEME.electric : DARK_THEME.textMuted }}>
                  <MoreVertical size={16} />
                  {selectedArticleIds.size > 0 && <div style={{ position: 'absolute', top: '4px', right: '4px', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: DARK_THEME.electric }} />}
                </motion.button>
                <AnimatePresence>
                  {showAdminMenu && (
                    <>
                      <DropdownBackdrop onClose={() => { setShowAdminMenu(false); setShowBulkMoveSub(false); }} />
                      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                        style={{ position: 'absolute', top: '100%', right: 0, marginTop: '4px', backgroundColor: '#112240', border: '1px solid rgba(79, 195, 247, 0.3)', borderTop: '2px solid #4FC3F7', borderRadius: '8px', padding: '6px', minWidth: '210px', zIndex: 90, boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)' }}>

                        {/* Bulk Actions — only when articles are selected */}
                        {selectedArticleIds.size > 0 && (
                          <>
                            <div style={{ padding: '6px 14px 4px', fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', letterSpacing: '0.1em', color: DARK_THEME.electric }}>BULK ACTIONS — {selectedArticleIds.size} SELECTED</div>
                            <button onClick={() => { setShowAdminMenu(false); handleBulkPublish(); }}
                              style={{ ...menuItemStyle, color: DARK_THEME.success }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = `${DARK_THEME.success}08`)} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
                              <Send size={12} /> PUBLISH ALL
                            </button>
                            <button onClick={() => { setShowAdminMenu(false); handleBulkUnpublish(); }}
                              style={{ ...menuItemStyle, color: DARK_THEME.warning }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = `${DARK_THEME.warning}08`)} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
                              <FileDown size={12} /> UNPUBLISH ALL
                            </button>
                            <div style={{ position: 'relative' }}>
                              <button onClick={() => setShowBulkMoveSub(!showBulkMoveSub)}
                                style={{ ...menuItemStyle, color: DARK_THEME.electric }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(79,195,247,0.06)')} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
                                <Building2 size={12} /> MOVE ALL TO... <ChevronRight size={10} style={{ marginLeft: 'auto' }} />
                              </button>
                              {showBulkMoveSub && (
                                <div style={{ position: 'absolute', top: 0, right: '100%', marginRight: '4px', backgroundColor: '#112240', border: '1px solid rgba(79, 195, 247, 0.3)', borderRadius: '8px', padding: '6px', minWidth: '180px', zIndex: 91, boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)', maxHeight: '200px', overflowY: 'auto' }}>
                                  {kb.categories.filter((c) => !c.parent_id).map((c) => (
                                    <button key={c.id} onClick={() => { setShowAdminMenu(false); setShowBulkMoveSub(false); handleBulkMove(c.id); }}
                                      style={{ display: 'block', width: '100%', padding: '8px 12px', backgroundColor: 'transparent', border: 'none', borderRadius: '4px', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: DARK_THEME.text, cursor: 'pointer', textAlign: 'left' }}
                                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(79,195,247,0.06)')}
                                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>{c.name}</button>
                                  ))}
                                </div>
                              )}
                            </div>
                            <button onClick={() => { setShowAdminMenu(false); setDeleteConfirm({ bulk: true, count: selectedArticleIds.size }); }}
                              style={menuItemDangerStyle} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = `${DARK_THEME.danger}10`)} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
                              <Trash2 size={12} /> DELETE ALL SELECTED
                            </button>
                            <button onClick={() => { setShowAdminMenu(false); setSelectedArticleIds(new Set()); }}
                              style={menuItemStyle} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(79,195,247,0.06)')} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
                              <XIcon size={12} /> CLEAR SELECTION
                            </button>
                            <div style={{ height: '1px', backgroundColor: DARK_THEME.border, margin: '4px 6px' }} />
                          </>
                        )}

                        {/* Standard admin options */}
                        <button onClick={() => { setShowDraftsOnly(!showDraftsOnly); setShowAdminMenu(false); }}
                          style={menuItemStyle} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(79,195,247,0.06)')} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
                          <Filter size={12} /> {showDraftsOnly ? 'SHOW ALL' : `VIEW DRAFTS (${draftCount})`}
                        </button>
                        <button onClick={() => { setShowAdminMenu(false); handleExportAll(); }}
                          style={menuItemStyle} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(79,195,247,0.06)')} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
                          <FileDown size={12} /> EXPORT ALL
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Three-Zone Layout */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <CategorySidebar categories={kb.categories} selectedCategory={selectedCategory}
          onSelectCategory={(cat) => { setSelectedCategory(cat); setSelectedArticle(null); }}
          searchQuery={searchQuery} onSearchChange={setSearchQuery} onSelectArticle={handleOpenArticle}
          searchResults={kb.searchResults} onSearch={handleSearch} totalArticles={kb.articles.length} isLoading={kb.isLoading} canEdit={canEdit}
          onCreateCategory={async (name, slug, icon, parentId) => {
            try {
              const res = await kb.createCategory(name, slug, icon, parentId, currentUser?.id, currentUser?.display_name);
              if (res?.success) toast.success('Category created');
              else toast.error(res?.error || 'Failed to create category');
              return res;
            } catch (err) { console.error('[KB] create cat error:', err); toast.error('Failed to create category'); return { success: false }; }
          }}
          onRenameCategory={async (id, name, icon) => {
            const res = await kb.updateCategory(id, name, icon, currentUser?.id, currentUser?.display_name);
            if (res?.success) toast.success('Category renamed');
            else toast.error(res?.error || 'Rename failed');
            return res;
          }}
          onDeleteCategory={async (id) => {
            const res = await kb.deleteCategory(id, currentUser?.id, currentUser?.display_name);
            if (res.success) { toast.success('Category deleted'); }
            else if (res.error === 'has_articles') { setCatDeleteDialog({ id, name: res.categoryName, articleCount: res.articleCount, childCount: res.childCount }); setMigrationTarget(null); }
            else { toast.error(res.error || 'Delete failed'); }
          }}
        />

        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {selectedArticle ? (
            <ArticleView article={selectedArticle} categories={kb.categories} onBack={() => { setSelectedArticle(null); kb.closeArticle(); }} onEdit={(a) => { setSelectedArticle(null); setEditorMode(a); }} canEdit={canEdit} currentUser={currentUser} submitFeedback={kb.submitFeedback} getUserFeedback={kb.getUserFeedback} createIssueReport={kb.createIssueReport} onTagClick={handleTagClick} onShowHistory={handleShowHistory} toast={toast} />
          ) : (
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', position: 'relative' }}>
              {/* Active tag filter pills */}
              {activeTagFilters.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                  <Tag size={12} style={{ color: DARK_THEME.textMuted }} />
                  {activeTagFilters.map((t) => (
                    <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', backgroundColor: `${DARK_THEME.electric}12`, border: `1px solid ${DARK_THEME.electric}30`, borderRadius: '12px', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: DARK_THEME.electric }}>
                      #{t}
                      <button onClick={() => setActiveTagFilters((p) => p.filter((x) => x !== t))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: DARK_THEME.electric }}><XIcon size={10} /></button>
                    </span>
                  ))}
                  <button onClick={() => setActiveTagFilters([])} style={{ background: 'none', border: 'none', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: DARK_THEME.textMuted, cursor: 'pointer' }}>Clear all</button>
                </div>
              )}

              {/* Recently edited strip (Feature 5) */}
              {canEdit && recentEdits.length > 0 && !selectedCategory && activeTagFilters.length === 0 && !showDraftsOnly && (
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', letterSpacing: '0.15em', color: DARK_THEME.textMuted, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}><Edit3 size={11} /> RECENTLY EDITED</div>
                  <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }}>
                    {recentEdits.map((e) => (
                      <button key={e.article_id} onClick={() => handleOpenArticle({ id: e.article_id })}
                        style={{ flexShrink: 0, width: '200px', padding: '12px 14px', backgroundColor: DARK_THEME.surface, border: `1px solid ${DARK_THEME.border}`, borderRadius: '8px', cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.15s' }}
                        onMouseEnter={(e2) => (e2.currentTarget.style.borderColor = DARK_THEME.electric)}
                        onMouseLeave={(e2) => (e2.currentTarget.style.borderColor = DARK_THEME.border)}>
                        <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: DARK_THEME.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '6px' }}>{e.title}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {e.category_name && <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: DARK_THEME.electric, padding: '2px 6px', backgroundColor: `${DARK_THEME.electric}10`, borderRadius: '3px' }}>{e.category_name}</span>}
                          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: DARK_THEME.textMuted }}>{formatDate(e.edited_at)}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {kb.isLoading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>{[1,2,3,4,5,6].map((i) => <SkeletonCard key={i} />)}</div>
              ) : filteredArticles.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60%', textAlign: 'center' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: `${DARK_THEME.textMuted}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>{searchQuery || activeTagFilters.length > 0 ? <Search size={28} style={{ color: DARK_THEME.textMuted }} /> : <BookOpen size={28} style={{ color: DARK_THEME.textMuted }} />}</div>
                  <h2 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '20px', fontWeight: 600, color: DARK_THEME.text, margin: '0 0 8px' }}>{showDraftsOnly ? 'NO DRAFTS FOUND' : activeTagFilters.length > 0 ? 'NO ARTICLES WITH SELECTED TAGS' : searchQuery ? 'NO ARTICLES MATCH YOUR SEARCH' : 'NO ARTICLES IN THIS CATEGORY YET'}</h2>
                  <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: DARK_THEME.textMuted, maxWidth: '400px', lineHeight: 1.6, margin: 0 }}>Try different keywords, tags, or categories.</p>
                </div>
              ) : (
                <>
                  {pinnedArticles.length > 0 && !showDraftsOnly && (
                    <div style={{ marginBottom: '28px' }}>
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', letterSpacing: '0.15em', color: DARK_THEME.gold, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}><Pin size={11} style={{ transform: 'rotate(45deg)' }} /> FEATURED ARTICLES</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                        {pinnedArticles.map((a) => (
                          <CardWithCheckbox key={a.id} article={a} isSelected={selectedArticleIds.has(a.id)} onToggleSelect={toggleArticleSelection} canEdit={canEdit} hasAnySelected={selectedArticleIds.size > 0}>
                            <ArticleCard article={a} categories={kb.categories} onClick={handleOpenArticle} onEdit={(art) => setEditorMode(art)} onTogglePin={handleTogglePin} onDelete={setDeleteConfirm} onDuplicate={canEdit ? handleDuplicate : undefined} onTagClick={handleTagClick} canEdit={canEdit} />
                          </CardWithCheckbox>
                        ))}
                      </div>
                    </div>
                  )}
                  {regularArticles.length > 0 && (
                    <div>
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', letterSpacing: '0.15em', color: DARK_THEME.textMuted, marginBottom: '14px' }}>{pinnedArticles.length > 0 && !showDraftsOnly ? 'ALL ARTICLES' : `${filteredArticles.length} ARTICLES`}</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                        {regularArticles.map((a) => (
                          <CardWithCheckbox key={a.id} article={a} isSelected={selectedArticleIds.has(a.id)} onToggleSelect={toggleArticleSelection} canEdit={canEdit} hasAnySelected={selectedArticleIds.size > 0}>
                            <ArticleCard article={a} categories={kb.categories} onClick={handleOpenArticle} onEdit={(art) => setEditorMode(art)} onTogglePin={handleTogglePin} onDelete={setDeleteConfirm} onDuplicate={canEdit ? handleDuplicate : undefined} onTagClick={handleTagClick} canEdit={canEdit} />
                          </CardWithCheckbox>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

            </div>
          )}
        </div>

        {!selectedArticle && <BrowseRightPanel articles={kb.articles} categories={kb.categories} />}
      </div>

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {deleteConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isDeleting && setDeleteConfirm(null)}
              style={{
                position: 'fixed',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(5, 10, 24, 0.85)',
                backdropFilter: 'blur(4px)',
                zIndex: 600,
              }}
            />
            <div style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 601,
              pointerEvents: 'none',
            }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: '94%',
                  maxWidth: '480px',
                  backgroundColor: DARK_THEME.surface,
                  border: `1px solid ${DARK_THEME.danger}40`,
                  borderRadius: '14px',
                  boxShadow: '0 0 60px rgba(239, 68, 68, 0.15)',
                  pointerEvents: 'auto',
                  overflow: 'hidden',
                }}
              >
                <div style={{ height: '4px', backgroundColor: DARK_THEME.danger }} />

                <div style={{ padding: '24px 28px', textAlign: 'center' }}>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    backgroundColor: `${DARK_THEME.danger}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                  }}>
                    <AlertTriangle size={28} style={{ color: DARK_THEME.danger }} />
                  </div>

                  <h2 style={{
                    fontFamily: 'Rajdhani, sans-serif',
                    fontSize: '22px',
                    fontWeight: 600,
                    letterSpacing: '0.1em',
                    color: DARK_THEME.text,
                    margin: '0 0 12px',
                  }}>
                    {deleteConfirm.bulk ? `DELETE ${deleteConfirm.count} ARTICLE${deleteConfirm.count > 1 ? 'S' : ''}?` : 'DELETE ARTICLE?'}
                  </h2>

                  <p style={{
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '14px',
                    color: DARK_THEME.textMuted,
                    margin: '0 0 16px',
                  }}>
                    {deleteConfirm.bulk
                      ? 'The following articles will be permanently deleted:'
                      : 'Are you sure you want to permanently delete this article?'}
                  </p>

                  <div style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.05)',
                    border: `1px solid ${DARK_THEME.danger}20`,
                    borderRadius: '8px',
                    padding: '12px',
                    marginBottom: '12px',
                  }}>
                    <div style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '12px',
                      color: DARK_THEME.danger,
                    }}>
                      {deleteConfirm.bulk
                        ? `${deleteConfirm.count} articles selected`
                        : deleteConfirm.title}
                    </div>
                  </div>

                  <p style={{
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '13px',
                    color: DARK_THEME.danger,
                    margin: 0,
                  }}>
                    This action cannot be undone.
                  </p>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '12px',
                  padding: '20px 28px',
                  borderTop: `1px solid ${DARK_THEME.border}`,
                }}>
                  <motion.button
                    onClick={() => setDeleteConfirm(null)}
                    disabled={isDeleting}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      padding: '12px 28px',
                      backgroundColor: 'transparent',
                      border: `1px solid ${DARK_THEME.border}`,
                      borderRadius: '6px',
                      fontFamily: 'Rajdhani, sans-serif',
                      fontWeight: 600,
                      fontSize: '14px',
                      letterSpacing: '0.1em',
                      color: DARK_THEME.textMuted,
                      cursor: isDeleting ? 'not-allowed' : 'pointer',
                      opacity: isDeleting ? 0.5 : 1,
                    }}
                  >
                    CANCEL
                  </motion.button>
                  <motion.button
                    onClick={deleteConfirm.bulk ? handleBulkDelete : handleDeleteArticle}
                    disabled={isDeleting}
                    whileHover={{ scale: isDeleting ? 1 : 1.02 }}
                    whileTap={{ scale: isDeleting ? 1 : 0.98 }}
                    style={{
                      padding: '12px 28px',
                      backgroundColor: DARK_THEME.danger,
                      border: `1px solid ${DARK_THEME.danger}`,
                      borderRadius: '6px',
                      fontFamily: 'Rajdhani, sans-serif',
                      fontWeight: 600,
                      fontSize: '14px',
                      letterSpacing: '0.1em',
                      color: '#fff',
                      cursor: isDeleting ? 'not-allowed' : 'pointer',
                      opacity: isDeleting ? 0.7 : 1,
                    }}
                  >
                    {isDeleting ? 'DELETING...' : (deleteConfirm.bulk ? `DELETE ${deleteConfirm.count}` : 'DELETE')}
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Category Delete Migration Dialog */}
      <AnimatePresence>
        {catDeleteDialog && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }} onClick={() => setCatDeleteDialog(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} onClick={(e) => e.stopPropagation()}
              style={{ width: '440px', padding: '32px', backgroundColor: DARK_THEME.surface, border: `1px solid ${DARK_THEME.warning}40`, borderRadius: '12px', boxShadow: `0 16px 64px rgba(0,0,0,0.5)` }}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <AlertCircle size={28} style={{ color: DARK_THEME.warning, marginBottom: '12px' }} />
                <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '20px', fontWeight: 700, color: DARK_THEME.text }}>CANNOT DELETE "{catDeleteDialog.name?.toUpperCase()}"</div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: DARK_THEME.textMuted, marginTop: '8px', lineHeight: 1.6 }}>
                  This category contains {catDeleteDialog.articleCount} article{catDeleteDialog.articleCount !== 1 ? 's' : ''}
                  {catDeleteDialog.childCount > 0 ? ` across ${catDeleteDialog.childCount + 1} categories` : ''}.
                  <br />Move all articles to another category before deleting.
                </div>
              </div>
              <div style={{ marginBottom: '20px', position: 'relative' }}>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', letterSpacing: '0.15em', color: DARK_THEME.textMuted, marginBottom: '8px' }}>MOVE ARTICLES TO:</div>
                <button onClick={() => setMigrationTarget(migrationTarget === 'open' ? null : 'open')}
                  style={{ width: '100%', padding: '10px 14px', boxSizing: 'border-box', backgroundColor: 'rgba(79, 195, 247, 0.04)', border: `1px solid ${DARK_THEME.border}`, borderRadius: '6px', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: typeof migrationTarget === 'number' ? DARK_THEME.text : DARK_THEME.textMuted, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left' }}>
                  {typeof migrationTarget === 'number' ? kb.categories.find((c) => c.id === migrationTarget)?.name || 'Selected' : 'Select a category...'}
                  <ChevronDown size={12} style={{ color: DARK_THEME.textMuted }} />
                </button>
                {migrationTarget === 'open' && (
                  <>
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 40 }} onClick={() => setMigrationTarget(null)} />
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px', backgroundColor: DARK_THEME.surface, border: `1px solid ${DARK_THEME.border}`, borderRadius: '8px', padding: '6px', zIndex: 50, boxShadow: '0 8px 24px rgba(0,0,0,0.5)', maxHeight: '180px', overflowY: 'auto' }}>
                      {kb.categories.filter((c) => c.id !== catDeleteDialog.id && !c.parent_id).map((c) => (
                        <button key={c.id} onClick={() => setMigrationTarget(c.id)}
                          style={{ display: 'block', width: '100%', padding: '9px 12px', backgroundColor: 'transparent', border: 'none', borderRadius: '4px', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: DARK_THEME.text, cursor: 'pointer', textAlign: 'left', transition: 'background-color 0.1s' }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(79,195,247,0.06)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
                          {c.name}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => setCatDeleteDialog(null)} style={{ flex: 1, padding: '12px', background: 'none', border: `1px solid ${DARK_THEME.border}`, borderRadius: '6px', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: DARK_THEME.textMuted, cursor: 'pointer' }}>CANCEL</button>
                <motion.button whileTap={{ scale: 0.97 }} disabled={typeof migrationTarget !== 'number'}
                  onClick={async () => {
                    if (typeof migrationTarget !== 'number') return;
                    const res = await kb.deleteCategoryWithMigration(catDeleteDialog.id, migrationTarget, currentUser?.id, currentUser?.display_name);
                    if (res.success) { toast.success('Category deleted, articles moved'); setCatDeleteDialog(null); }
                    else toast.error(res.error || 'Migration failed');
                  }}
                  style={{ flex: 1, padding: '12px', backgroundColor: typeof migrationTarget === 'number' ? `${DARK_THEME.warning}15` : 'transparent', border: `1px solid ${typeof migrationTarget === 'number' ? DARK_THEME.warning : DARK_THEME.border}`, borderRadius: '6px', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: typeof migrationTarget === 'number' ? DARK_THEME.warning : DARK_THEME.textMuted, cursor: typeof migrationTarget === 'number' ? 'pointer' : 'not-allowed', opacity: typeof migrationTarget === 'number' ? 1 : 0.4 }}>
                  MOVE & DELETE
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* History Drawer (Feature 1) */}
      <AnimatePresence>
        {historyDrawer && (
          <HistoryDrawer isOpen={true} onClose={() => setHistoryDrawer(null)} history={historyDrawer.history} currentArticle={historyDrawer.article} />
        )}
      </AnimatePresence>

      <style>{`@keyframes skeletonPulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.8; } }`}</style>
    </div>
  );
}

export default KnowledgeBasePage;
