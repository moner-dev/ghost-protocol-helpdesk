/**
 * GHOST PROTOCOL — Update Banner
 *
 * Slim dismissible notification banner shown at the top of content areas
 * when an update is available. Auto-dismisses after 10 seconds.
 * Static UI only — no API calls.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { DARK_THEME } from '@/constants/theme';

function UpdateBanner({ isVisible = true, version = 'v1.1.0', onViewUpdate, onDismiss }) {
  const [show, setShow] = useState(isVisible);

  useEffect(() => {
    setShow(isVisible);
  }, [isVisible]);

  // Auto-dismiss after 10 seconds
  useEffect(() => {
    if (!show) return;
    const timer = setTimeout(() => {
      setShow(false);
      onDismiss?.();
    }, 10000);
    return () => clearTimeout(timer);
  }, [show, onDismiss]);

  const handleDismiss = () => {
    setShow(false);
    onDismiss?.();
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.25 }}
          style={{ overflow: 'hidden', flexShrink: 0 }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 20px',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            borderBottom: `1px solid ${DARK_THEME.warning}30`,
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '12px',
              color: DARK_THEME.warning,
            }}>
              <span role="img" aria-label="notification">&#x1F514;</span>
              <span>
                A new version <span style={{ fontWeight: 600 }}>{version}</span> is available
                {' \u2014 '}
                <span
                  onClick={onViewUpdate}
                  style={{
                    color: DARK_THEME.electric,
                    textDecoration: 'underline',
                    textUnderlineOffset: '3px',
                    cursor: 'pointer',
                    transition: 'opacity 0.2s',
                  }}
                  onMouseEnter={(e) => { e.target.style.opacity = '0.8'; }}
                  onMouseLeave={(e) => { e.target.style.opacity = '1'; }}
                >
                  View Update
                </span>
              </span>
            </div>
            <motion.button
              onClick={handleDismiss}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '24px',
                height: '24px',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <X size={14} style={{ color: DARK_THEME.warning, opacity: 0.7 }} />
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default UpdateBanner;
