import React from 'react';
import { DARK_THEME } from '@/constants/theme';

function PanelAccentBar() {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '6px',
        background: `linear-gradient(90deg, ${DARK_THEME.electric} 30%, transparent 100%)`,
        borderRadius: '8px 8px 0 0',
        opacity: 0.8,
      }}
    />
  );
}

export default PanelAccentBar;
