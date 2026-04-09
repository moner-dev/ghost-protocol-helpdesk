/**
 * GHOST PROTOCOL — Unified Toast Notification System
 *
 * A single toast system that every page and component uses.
 * Exports ToastProvider (wrap at app root) and useToast hook.
 */

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// TOAST CONTEXT
// ═══════════════════════════════════════════════════════════════════════════

const ToastContext = createContext(null);

// ═══════════════════════════════════════════════════════════════════════════
// TOAST TYPE CONFIGURATIONS
// ═══════════════════════════════════════════════════════════════════════════

const TOAST_TYPES = {
  success: {
    color: '#10B981',
    icon: CheckCircle2,
  },
  error: {
    color: '#EF4444',
    icon: XCircle,
  },
  warning: {
    color: '#F59E0B',
    icon: AlertTriangle,
  },
  info: {
    color: '#4FC3F7',
    icon: Info,
  },
};

const MAX_TOASTS = 4;
const DEFAULT_DURATION = 4000;
const DEDUPE_WINDOW_MS = 3000; // Prevent same message within 3 seconds

// ═══════════════════════════════════════════════════════════════════════════
// SINGLE TOAST COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

function ToastItem({ toast, onDismiss }) {
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(100);
  const startTimeRef = useRef(Date.now());
  const remainingRef = useRef(toast.duration);
  const animationRef = useRef(null);

  const config = TOAST_TYPES[toast.type] || TOAST_TYPES.info;
  const Icon = config.icon;

  // Progress bar animation
  useEffect(() => {
    const animate = () => {
      if (isPaused) return;

      const elapsed = Date.now() - startTimeRef.current;
      const remaining = remainingRef.current - elapsed;
      const newProgress = (remaining / toast.duration) * 100;

      if (newProgress <= 0) {
        onDismiss(toast.id);
        return;
      }

      setProgress(newProgress);
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPaused, toast.id, toast.duration, onDismiss]);

  // Pause/resume handlers
  const handleMouseEnter = () => {
    setIsPaused(true);
    remainingRef.current = (progress / 100) * toast.duration;
  };

  const handleMouseLeave = () => {
    startTimeRef.current = Date.now();
    setIsPaused(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 60, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.95 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        width: '320px',
        minHeight: '52px',
        position: 'relative',
        backgroundColor: 'rgba(10, 22, 40, 0.96)',
        backdropFilter: 'blur(20px)',
        border: `1px solid ${config.color}40`,
        borderRadius: '8px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        overflow: 'hidden',
      }}
    >
      {/* Left accent bar */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '3px',
          backgroundColor: config.color,
          borderRadius: '8px 0 0 8px',
        }}
      />

      {/* Content area */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          padding: '14px 40px 14px 16px',
        }}
      >
        {/* Icon */}
        <Icon
          size={16}
          style={{
            color: config.color,
            flexShrink: 0,
            marginTop: toast.title ? '2px' : '0',
          }}
        />

        {/* Text content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {toast.title && (
            <div
              style={{
                fontFamily: 'Rajdhani, sans-serif',
                fontWeight: 600,
                fontSize: '13px',
                color: '#FFFFFF',
                marginBottom: '2px',
                letterSpacing: '0.02em',
              }}
            >
              {toast.title}
            </div>
          )}
          <div
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '12px',
              color: '#FFFFFF',
              lineHeight: 1.4,
              wordBreak: 'break-word',
            }}
          >
            {toast.message}
          </div>
        </div>
      </div>

      {/* Close button */}
      <button
        onClick={() => onDismiss(toast.id)}
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          width: '20px',
          height: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          borderRadius: '4px',
          transition: 'background-color 0.15s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <X
          size={14}
          style={{
            color: 'rgba(255, 255, 255, 0.6)',
            transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#FFFFFF';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
          }}
        />
      </button>

      {/* Progress bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '2px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
        }}
      >
        <motion.div
          style={{
            height: '100%',
            backgroundColor: config.color,
            width: `${progress}%`,
            transition: isPaused ? 'none' : 'width 0.1s linear',
          }}
        />
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TOAST PROVIDER
// ═══════════════════════════════════════════════════════════════════════════

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);
  const recentMessagesRef = useRef(new Map()); // Track recent messages for deduplication

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((type, message, options = {}) => {
    const { duration = DEFAULT_DURATION, title } = options;
    const dedupeKey = `${type}:${message}`;
    const now = Date.now();

    // Check if same message was shown recently (time-based)
    const lastShown = recentMessagesRef.current.get(dedupeKey);
    if (lastShown && now - lastShown < DEDUPE_WINDOW_MS) {
      return null;
    }

    // Update timestamp immediately
    recentMessagesRef.current.set(dedupeKey, now);

    const id = ++toastIdRef.current;

    setToasts((prev) => {
      // Also check if same message already exists in current toasts
      const alreadyExists = prev.some((t) => t.message === message && t.type === type);
      if (alreadyExists) {
        return prev;
      }

      const newToast = {
        id,
        type,
        message,
        title,
        duration,
        createdAt: now,
      };

      // Remove oldest if at max capacity
      const updated = [...prev, newToast];
      if (updated.length > MAX_TOASTS) {
        return updated.slice(1);
      }
      return updated;
    });

    return id;
  }, []);

  const toast = {
    success: useCallback((message, options) => addToast('success', message, options), [addToast]),
    error: useCallback((message, options) => addToast('error', message, options), [addToast]),
    warning: useCallback((message, options) => addToast('warning', message, options), [addToast]),
    info: useCallback((message, options) => addToast('info', message, options), [addToast]),
    dismiss,
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}

      {/* Toast container — fixed portal at bottom-right */}
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          display: 'flex',
          flexDirection: 'column-reverse',
          gap: '8px',
          zIndex: 9999,
          pointerEvents: 'none',
        }}
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <div key={t.id} style={{ pointerEvents: 'auto' }}>
              <ToastItem toast={t} onDismiss={dismiss} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// USE TOAST HOOK
// ═══════════════════════════════════════════════════════════════════════════

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export default ToastProvider;
