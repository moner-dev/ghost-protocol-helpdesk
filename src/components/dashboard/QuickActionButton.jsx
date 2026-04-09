import React from 'react';
import { DARK_THEME } from '@/constants/theme';

function QuickActionButton({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '4px 10px',
        backgroundColor: 'transparent',
        border: `1px solid ${DARK_THEME.border}`,
        borderRadius: '4px',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '9px',
        letterSpacing: '0.05em',
        color: DARK_THEME.textMuted,
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = DARK_THEME.electric;
        e.currentTarget.style.color = DARK_THEME.electric;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = DARK_THEME.border;
        e.currentTarget.style.color = DARK_THEME.textMuted;
      }}
    >
      {label}
    </button>
  );
}

export default QuickActionButton;
