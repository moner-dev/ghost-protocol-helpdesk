/**
 * GHOST PROTOCOL — Update Available Dialog
 *
 * Modal dialog shown when a new version is detected.
 * Static UI only — no API calls.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Rocket, ArrowRight } from 'lucide-react';
import { DARK_THEME } from '@/constants/theme';

const PLACEHOLDER_CHANGELOG = `## What's New in v1.1.0

### Features
- Improved dashboard performance with real-time event bus
- New date range filters on Reports page
- Bulk incident operations (assign, priority, delete)
- Knowledge Base article editor with markdown support

### Fixes
- Fixed chart rendering delay after incident changes
- Resolved session timeout not redirecting to login
- Corrected department load calculation for closed tickets

### Improvements
- Reduced polling intervals for faster data refresh
- Enhanced keyboard shortcuts across all pages
- Better error messages for failed IPC operations`;

function UpdateDialog({ isOpen, onClose, onDownload, onRemindLater }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onRemindLater || onClose}
            style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(5, 10, 24, 0.85)',
              backdropFilter: 'blur(4px)',
              zIndex: 500,
            }}
          />
          <div
            style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 501,
              pointerEvents: 'none',
              padding: '20px',
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{
                width: '100%',
                maxWidth: '520px',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: DARK_THEME.surface,
                border: `1px solid ${DARK_THEME.border}`,
                borderRadius: '14px',
                boxShadow: `0 0 60px ${DARK_THEME.glow}`,
                pointerEvents: 'auto',
                overflow: 'hidden',
              }}
            >
              {/* Accent bar */}
              <div style={{ height: '6px', background: `linear-gradient(90deg, ${DARK_THEME.electric} 0%, ${DARK_THEME.electric2} 50%, transparent 100%)`, flexShrink: 0 }} />

              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 28px 20px', borderBottom: `1px solid ${DARK_THEME.border}`, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '42px', height: '42px', borderRadius: '10px',
                    backgroundColor: `${DARK_THEME.electric}15`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Rocket size={20} style={{ color: DARK_THEME.electric }} />
                  </div>
                  <div>
                    <h2 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '24px', fontWeight: 600, letterSpacing: '0.1em', color: DARK_THEME.text, margin: 0 }}>
                      UPDATE AVAILABLE
                    </h2>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: DARK_THEME.textMuted }}>
                      A newer version is ready to install
                    </span>
                  </div>
                </div>
                <motion.button onClick={onRemindLater || onClose} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                  style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent', border: `1px solid ${DARK_THEME.border}`, borderRadius: '8px', cursor: 'pointer' }}>
                  <X size={18} style={{ color: DARK_THEME.textMuted }} />
                </motion.button>
              </div>

              {/* Version info */}
              <div style={{ padding: '20px 28px', borderBottom: `1px solid ${DARK_THEME.border}`, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    padding: '8px 16px', borderRadius: '6px',
                    backgroundColor: `${DARK_THEME.textMuted}10`,
                    border: `1px solid ${DARK_THEME.border}`,
                  }}>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: DARK_THEME.textMuted, letterSpacing: '0.1em', marginBottom: '2px' }}>CURRENT</div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '16px', color: DARK_THEME.textMuted }}>v1.0.0</div>
                  </div>
                  <ArrowRight size={18} style={{ color: DARK_THEME.textMuted }} />
                  <div style={{
                    padding: '8px 16px', borderRadius: '6px',
                    backgroundColor: `${DARK_THEME.electric}10`,
                    border: `1px solid ${DARK_THEME.electric}40`,
                  }}>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: DARK_THEME.electric, letterSpacing: '0.1em', marginBottom: '2px' }}>NEW</div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '16px', color: DARK_THEME.electric, fontWeight: 600 }}>v1.1.0</div>
                  </div>
                </div>
              </div>

              {/* Changelog */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px' }}>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: DARK_THEME.textMuted, letterSpacing: '0.1em', marginBottom: '12px' }}>
                  RELEASE NOTES
                </div>
                <div style={{
                  padding: '16px',
                  backgroundColor: `${DARK_THEME.bg}`,
                  border: `1px solid ${DARK_THEME.gridLine}`,
                  borderRadius: '8px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                }}>
                  <pre style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '12px',
                    color: DARK_THEME.text,
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    margin: 0,
                    opacity: 0.85,
                  }}>
                    {PLACEHOLDER_CHANGELOG}
                  </pre>
                </div>
              </div>

              {/* Footer */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '14px', padding: '20px 28px 24px', borderTop: `1px solid ${DARK_THEME.border}`, flexShrink: 0 }}>
                <motion.button
                  onClick={onRemindLater || onClose}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '12px 20px',
                    background: 'transparent',
                    border: `1px solid ${DARK_THEME.border}`,
                    borderRadius: '6px',
                    fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, fontSize: '13px',
                    letterSpacing: '0.1em', color: DARK_THEME.textMuted,
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}
                >
                  REMIND ME LATER
                </motion.button>
                <motion.button
                  onClick={onDownload || (() => {})}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '12px 24px',
                    background: `linear-gradient(135deg, ${DARK_THEME.navy}, ${DARK_THEME.electric}40)`,
                    border: `1px solid ${DARK_THEME.electric}`,
                    borderRadius: '6px',
                    fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, fontSize: '13px',
                    letterSpacing: '0.1em', color: DARK_THEME.electric,
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}
                >
                  <Download size={16} />
                  DOWNLOAD UPDATE
                </motion.button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

export default UpdateDialog;
