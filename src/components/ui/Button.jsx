import React from 'react';
import { motion } from 'framer-motion';
import { DARK_THEME } from '@/constants/theme';

const VARIANT_STYLES = {
  primary: {
    background: `linear-gradient(135deg, ${DARK_THEME.navy}, ${DARK_THEME.electric}40)`,
    border: `1px solid ${DARK_THEME.electric}`,
    color: DARK_THEME.electric,
  },
  secondary: {
    background: 'transparent',
    border: `1px solid ${DARK_THEME.border}`,
    color: DARK_THEME.textMuted,
  },
  ghost: {
    background: 'transparent',
    border: '1px solid transparent',
    color: DARK_THEME.textMuted,
  },
  danger: {
    background: DARK_THEME.danger,
    border: 'none',
    color: '#fff',
  },
  success: {
    background: 'transparent',
    border: `1px solid ${DARK_THEME.success}50`,
    color: DARK_THEME.success,
  },
};

const SIZE_STYLES = {
  sm: { padding: '8px 14px', fontSize: '12px' },
  md: { padding: '12px 20px', fontSize: '13px' },
  lg: { padding: '14px 28px', fontSize: '15px' },
};

function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon: Icon,
  onClick,
  style = {},
  ...props
}) {
  const v = VARIANT_STYLES[variant] || VARIANT_STYLES.primary;
  const s = SIZE_STYLES[size] || SIZE_STYLES.md;

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        padding: s.padding,
        background: v.background,
        border: v.border,
        borderRadius: '6px',
        fontFamily: 'Rajdhani, sans-serif',
        fontWeight: 600,
        fontSize: s.fontSize,
        letterSpacing: '0.1em',
        color: v.color,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled || loading ? 0.7 : 1,
        transition: 'all 0.2s',
        ...style,
      }}
      {...props}
    >
      {loading ? (
        <div style={{ width: '16px', height: '16px', border: `2px solid ${v.color}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      ) : Icon ? (
        <Icon size={16} />
      ) : null}
      {children}
    </motion.button>
  );
}

export default Button;
