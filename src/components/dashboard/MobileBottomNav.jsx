import React from 'react';
import { LayoutDashboard, AlertTriangle, Plus, BarChart3, User } from 'lucide-react';
import { DARK_THEME } from '@/constants/theme';

function MobileBottomNav({ activeNav, setActiveNav, incidentCount = 0 }) {
  const items = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'incidents', icon: AlertTriangle, label: 'Incidents', badge: incidentCount > 0 ? incidentCount : null },
    { id: 'new', icon: Plus, label: 'New', primary: true },
    { id: 'reports', icon: BarChart3, label: 'Reports' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '64px',
        backgroundColor: DARK_THEME.surface,
        borderTop: `1px solid ${DARK_THEME.border}`,
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        zIndex: 100,
        paddingBottom: '8px',
      }}
    >
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => setActiveNav(item.id)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            background: item.primary ? `linear-gradient(135deg, ${DARK_THEME.navy}, ${DARK_THEME.electric}40)` : 'none',
            border: item.primary ? `1px solid ${DARK_THEME.electric}` : 'none',
            borderRadius: item.primary ? '50%' : '0',
            width: item.primary ? '48px' : 'auto',
            height: item.primary ? '48px' : 'auto',
            padding: item.primary ? '0' : '8px',
            cursor: 'pointer',
            position: 'relative',
          }}
        >
          <item.icon size={item.primary ? 20 : 18} style={{ color: activeNav === item.id || item.primary ? DARK_THEME.electric : DARK_THEME.textMuted }} />
          {!item.primary && (
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '8px', color: activeNav === item.id ? DARK_THEME.electric : DARK_THEME.textMuted }}>
              {item.label}
            </span>
          )}
          {item.badge && (
            <div style={{ position: 'absolute', top: '2px', right: '2px', width: '14px', height: '14px', backgroundColor: DARK_THEME.danger, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: '8px', color: '#fff' }}>
              {item.badge}
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

export default MobileBottomNav;
