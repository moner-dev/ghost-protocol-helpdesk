import React from 'react';
import { DARK_THEME } from '@/constants/theme';

const VARIANT_STYLES = {
  default: { bg: DARK_THEME.electric },
  electric: { bg: DARK_THEME.electric },
  success: { bg: DARK_THEME.success },
  danger: { bg: DARK_THEME.danger },
  warning: { bg: DARK_THEME.warning },
  muted: { bg: DARK_THEME.textMuted },
  outline: { bg: DARK_THEME.electric },
};

const SIZE_STYLES = {
  xs: { fontSize: '8px', padding: '2px 6px' },
  sm: { fontSize: '9px', padding: '3px 8px' },
  md: { fontSize: '11px', padding: '4px 10px' },
  lg: { fontSize: '12px', padding: '6px 12px' },
};

function Badge({ children, variant = 'default', size = 'sm', dot = false, style = {} }) {
  const v = VARIANT_STYLES[variant] || VARIANT_STYLES.default;
  const s = SIZE_STYLES[size] || SIZE_STYLES.sm;
  const isOutline = variant === 'outline';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: s.fontSize,
        letterSpacing: '0.05em',
        padding: s.padding,
        borderRadius: '4px',
        backgroundColor: isOutline ? 'transparent' : `${v.bg}20`,
        border: `1px solid ${v.bg}${isOutline ? '' : '50'}`,
        color: v.bg,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {dot && (
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: v.bg, flexShrink: 0 }} />
      )}
      {children}
    </span>
  );
}

export default Badge;
