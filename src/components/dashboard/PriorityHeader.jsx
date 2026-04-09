import React from 'react';
import { DARK_THEME } from '@/constants/theme';

function PriorityHeader({ level, count }) {
  const colors = {
    critical: DARK_THEME.danger,
    high: DARK_THEME.warning,
    medium: DARK_THEME.electric,
    low: DARK_THEME.success,
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px', marginBottom: '8px' }}>
      <div style={{ width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderBottom: `8px solid ${colors[level]}` }} />
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', letterSpacing: '0.15em', color: colors[level] }}>
        {level.toUpperCase()}
      </span>
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: DARK_THEME.textMuted }}>
        ({count})
      </span>
    </div>
  );
}

export default PriorityHeader;
