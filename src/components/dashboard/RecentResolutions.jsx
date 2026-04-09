import React from 'react';
import { Clock, Inbox, Eye } from 'lucide-react';
import { DARK_THEME } from '@/constants/theme';

const STATUS_COLORS = {
  new: DARK_THEME.electric,
  in_progress: DARK_THEME.gold,
  escalated: DARK_THEME.danger,
  resolved: DARK_THEME.success,
  closed: DARK_THEME.textMuted,
};

function RecentResolutions({ data, onView }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 16px', gap: '10px' }}>
        <Inbox size={28} style={{ color: DARK_THEME.textMuted }} />
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: DARK_THEME.textMuted }}>
          No recent incidents
        </span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {data.map((item, index) => {
        const color = STATUS_COLORS[item.rawStatus] || DARK_THEME.textMuted;
        return (
          <div
            key={item.id}
            onClick={() => onView?.({ id: item.id, title: item.title, status: item.rawStatus, created_at: item.created_at, priority: item.priority, department: item.department })}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px 14px',
              backgroundColor: index % 2 === 0 ? 'rgba(79, 195, 247, 0.03)' : 'transparent',
              borderRadius: '6px',
              gap: '14px',
              cursor: onView ? 'pointer' : 'default',
              transition: 'background-color 0.15s',
            }}
            onMouseEnter={(e) => { if (onView) e.currentTarget.style.backgroundColor = 'rgba(79, 195, 247, 0.08)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = index % 2 === 0 ? 'rgba(79, 195, 247, 0.03)' : 'transparent'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: '60px' }}>
              <Clock size={12} style={{ color: DARK_THEME.textMuted }} />
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: DARK_THEME.textMuted }}>
                {item.time}
              </span>
            </div>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: DARK_THEME.electric, minWidth: '85px' }}>
              {item.id}
            </span>
            <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: DARK_THEME.text, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {item.title}
            </span>
            <span style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', letterSpacing: '0.05em',
              color, padding: '3px 10px', backgroundColor: `${color}12`, border: `1px solid ${color}25`, borderRadius: '5px',
            }}>
              {item.status}
            </span>
            {onView && (
              <Eye size={14} style={{ color: DARK_THEME.textMuted, flexShrink: 0 }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default RecentResolutions;
