import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DARK_THEME } from '@/constants/theme';

function Tooltip({ children, text, position = 'top' }) {
  const [isVisible, setIsVisible] = useState(false);

  const positionStyles = {
    top: { bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: '8px' },
    bottom: { top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '8px' },
    left: { right: '100%', top: '50%', transform: 'translateY(-50%)', marginRight: '8px' },
    right: { left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: '8px' },
  };

  const animOrigin = {
    top: { initial: { opacity: 0, y: 4 }, animate: { opacity: 1, y: 0 } },
    bottom: { initial: { opacity: 0, y: -4 }, animate: { opacity: 1, y: 0 } },
    left: { initial: { opacity: 0, x: 4 }, animate: { opacity: 1, x: 0 } },
    right: { initial: { opacity: 0, x: -4 }, animate: { opacity: 1, x: 0 } },
  };

  const anim = animOrigin[position] || animOrigin.top;

  return (
    <div
      style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={anim.initial}
            animate={anim.animate}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              ...positionStyles[position],
              padding: '6px 12px',
              backgroundColor: DARK_THEME.surface,
              border: `1px solid ${DARK_THEME.border}`,
              borderRadius: '4px',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '10px',
              letterSpacing: '0.1em',
              color: DARK_THEME.text,
              whiteSpace: 'nowrap',
              zIndex: 1000,
              pointerEvents: 'none',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
            }}
          >
            {text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Tooltip;
