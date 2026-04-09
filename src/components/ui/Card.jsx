import React from 'react';
import { DARK_THEME } from '@/constants/theme';

const ELEVATION_STYLES = {
  flat: { boxShadow: 'none' },
  low: { boxShadow: `0 0 20px ${DARK_THEME.glow}` },
  high: { boxShadow: `0 0 30px ${DARK_THEME.glow}` },
  glow: { boxShadow: `0 0 60px ${DARK_THEME.glow}, 0 0 120px rgba(79, 195, 247, 0.1)` },
};

function Card({
  children,
  elevation = 'low',
  glass = false,
  accentColor,
  padding = '16px',
  style = {},
  ...props
}) {
  const shadow = ELEVATION_STYLES[elevation] || ELEVATION_STYLES.low;

  return (
    <div
      style={{
        backgroundColor: glass ? 'rgba(5, 10, 24, 0.9)' : DARK_THEME.surface,
        backdropFilter: glass ? 'blur(20px)' : undefined,
        WebkitBackdropFilter: glass ? 'blur(20px)' : undefined,
        border: `1px solid ${DARK_THEME.border}`,
        borderRadius: '8px',
        padding,
        position: 'relative',
        overflow: 'hidden',
        ...shadow,
        ...style,
      }}
      {...props}
    >
      {accentColor && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', backgroundColor: accentColor }} />
      )}
      {children}
    </div>
  );
}

export default Card;
