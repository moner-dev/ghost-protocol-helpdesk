import React from 'react';
import { DARK_THEME } from '@/constants/theme';
import PanelAccentBar from './PanelAccentBar';

function DashboardPanel({ title, action, children, style = {} }) {
  return (
    <div
      style={{
        backgroundColor: DARK_THEME.surface,
        border: `1px solid ${DARK_THEME.border}`,
        borderRadius: '8px',
        padding: '16px',
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
    >
      <PanelAccentBar />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '8px',
          marginBottom: '16px',
        }}
      >
        <span
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '10px',
            letterSpacing: '0.15em',
            color: DARK_THEME.textMuted,
          }}
        >
          {title}
        </span>
        {action}
      </div>
      {children}
    </div>
  );
}

export default DashboardPanel;
