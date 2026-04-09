import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { DARK_THEME } from '@/constants/theme';

function DeleteConfirmDialog({ isOpen, onClose, incident, onConfirm }) {
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  const handleDelete = async () => {
    setIsDeleting(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    onConfirm(incident);
    setIsDeleting(false);
    onClose();
  };

  if (!incident) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(5, 10, 24, 0.9)',
              backdropFilter: 'blur(4px)',
              zIndex: 600,
            }}
          />

          {/* Dialog */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 601,
              pointerEvents: 'none',
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{
                width: '94%',
                maxWidth: '420px',
                backgroundColor: DARK_THEME.surface,
                border: `1px solid ${DARK_THEME.danger}50`,
                borderRadius: '12px',
                boxShadow: `0 0 40px rgba(239, 68, 68, 0.2)`,
                pointerEvents: 'auto',
                overflow: 'hidden',
              }}
            >
              {/* Danger Bar */}
              <div
                style={{
                  height: '4px',
                  backgroundColor: DARK_THEME.danger,
                }}
              />

              {/* Content */}
              <div style={{ padding: '24px', textAlign: 'center' }}>
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    margin: '0 auto 16px',
                    borderRadius: '50%',
                    backgroundColor: `${DARK_THEME.danger}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Trash2 size={28} style={{ color: DARK_THEME.danger }} />
                </div>

                <h3
                  style={{
                    fontFamily: 'Rajdhani, sans-serif',
                    fontSize: '20px',
                    fontWeight: 600,
                    color: DARK_THEME.text,
                    margin: '0 0 8px 0',
                  }}
                >
                  DELETE INCIDENT
                </h3>

                <p
                  style={{
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '14px',
                    color: DARK_THEME.textMuted,
                    margin: '0 0 8px 0',
                  }}
                >
                  Are you sure you want to delete this incident?
                </p>

                <div
                  style={{
                    padding: '12px 16px',
                    backgroundColor: DARK_THEME.bg,
                    borderRadius: '6px',
                    marginTop: '16px',
                    overflow: 'hidden',
                  }}
                >
                  <span
                    title={incident.id}
                    style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '12px',
                      color: DARK_THEME.electric,
                      display: 'block',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '100%',
                    }}
                  >
                    {incident.id}
                  </span>
                  <p
                    title={incident.title}
                    style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '13px',
                      color: DARK_THEME.text,
                      margin: '4px 0 0 0',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '100%',
                    }}
                  >
                    {incident.title}
                  </p>
                </div>

                <p
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '11px',
                    color: DARK_THEME.danger,
                    margin: '16px 0 0 0',
                  }}
                >
                  This action cannot be undone.
                </p>
              </div>

              {/* Actions */}
              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  padding: '16px 24px 20px',
                  borderTop: `1px solid ${DARK_THEME.border}`,
                }}
              >
                <motion.button
                  onClick={onClose}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: 'transparent',
                    border: `1px solid ${DARK_THEME.border}`,
                    borderRadius: '6px',
                    fontFamily: 'Rajdhani, sans-serif',
                    fontWeight: 600,
                    fontSize: '13px',
                    letterSpacing: '0.1em',
                    color: DARK_THEME.textMuted,
                    cursor: 'pointer',
                  }}
                >
                  CANCEL
                </motion.button>

                <motion.button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  whileHover={{ scale: isDeleting ? 1 : 1.02 }}
                  whileTap={{ scale: isDeleting ? 1 : 0.98 }}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: DARK_THEME.danger,
                    border: 'none',
                    borderRadius: '6px',
                    fontFamily: 'Rajdhani, sans-serif',
                    fontWeight: 600,
                    fontSize: '13px',
                    letterSpacing: '0.1em',
                    color: '#fff',
                    cursor: isDeleting ? 'not-allowed' : 'pointer',
                    opacity: isDeleting ? 0.7 : 1,
                  }}
                >
                  {isDeleting ? 'DELETING...' : 'DELETE'}
                </motion.button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

export default DeleteConfirmDialog;
