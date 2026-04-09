import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { DARK_THEME } from '@/constants/theme';

function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  accentColor = DARK_THEME.electric,
  maxWidth = '580px',
  children,
  footer,
}) {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
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
                maxWidth,
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
              <div style={{ height: '6px', background: `linear-gradient(90deg, ${accentColor} 0%, ${accentColor}60 50%, transparent 100%)`, flexShrink: 0 }} />

              {title && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 28px 20px', borderBottom: `1px solid ${DARK_THEME.border}`, flexShrink: 0 }}>
                  <div>
                    <h2 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '26px', fontWeight: 600, letterSpacing: '0.1em', color: DARK_THEME.text, margin: 0 }}>
                      {title}
                    </h2>
                    {subtitle && (
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: DARK_THEME.electric }}>
                        {subtitle}
                      </span>
                    )}
                  </div>
                  <motion.button onClick={onClose} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent', border: `1px solid ${DARK_THEME.border}`, borderRadius: '8px', cursor: 'pointer' }}>
                    <X size={18} style={{ color: DARK_THEME.textMuted }} />
                  </motion.button>
                </div>
              )}

              <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
                {children}
              </div>

              {footer && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '14px', padding: '20px 28px 24px', borderTop: `1px solid ${DARK_THEME.border}`, flexShrink: 0 }}>
                  {footer}
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

export default Modal;
