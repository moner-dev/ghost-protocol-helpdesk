import React from 'react';
import { motion } from 'framer-motion';
import { DARK_THEME } from '@/constants/theme';
import { formatSmartTimestamp } from '@/utils/formatters';
import QuickActionButton from './QuickActionButton';

function IncidentCard({ incident, onView }) {
  const priorityColors = {
    critical: DARK_THEME.danger,
    high: DARK_THEME.warning,
    medium: DARK_THEME.electric,
    low: DARK_THEME.textMuted,
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      style={{
        backgroundColor: 'rgba(5, 10, 24, 0.6)',
        border: `1px solid ${DARK_THEME.border}`,
        borderLeft: `3px solid ${priorityColors[incident.priority]}`,
        borderRadius: '6px',
        padding: '12px',
        marginBottom: '8px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: DARK_THEME.electric }}>
          {incident.id}
        </span>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: DARK_THEME.textMuted }}>
          {formatSmartTimestamp(incident.created_at).display}
        </span>
      </div>
      <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: DARK_THEME.text, marginBottom: '10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {incident.title}
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <QuickActionButton label="View" onClick={() => onView?.(incident)} />
      </div>
    </motion.div>
  );
}

export default IncidentCard;
