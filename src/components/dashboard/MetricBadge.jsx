import React from 'react';
import { DARK_THEME } from '@/constants/theme';

function MetricBadge({ label, value, color }) {
  const colorMap = {
    electric: DARK_THEME.electric,
    danger: DARK_THEME.danger,
    gold: DARK_THEME.gold,
    success: DARK_THEME.success,
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 10px',
        backgroundColor: `${colorMap[color]}15`,
        border: `1px solid ${colorMap[color]}40`,
        borderRadius: '4px',
      }}
    >
      <span
        style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '14px',
          fontWeight: 600,
          color: colorMap[color],
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '8px',
          letterSpacing: '0.1em',
          color: DARK_THEME.textMuted,
        }}
      >
        {label}
      </span>
    </div>
  );
}

export default MetricBadge;
