import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, LayoutDashboard, AlertTriangle, BarChart3, Settings, HelpCircle, Users, ScrollText, BookOpen, UserRoundSearch, Building2 } from 'lucide-react';
import { DARK_THEME } from '@/constants/theme';

const NAV_ITEMS = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'DASHBOARD' },
  { id: 'incidents', icon: AlertTriangle, label: 'INCIDENTS' },
  { id: 'endusers', icon: UserRoundSearch, label: 'END USERS' },
  { id: 'reports', icon: BarChart3, label: 'REPORTS' },
  { id: 'knowledge', icon: BookOpen, label: 'KNOWLEDGE BASE' },
];

const ADMIN_NAV_ITEMS = [
  { id: 'admin', icon: Users, label: 'ADMIN' },
  { id: 'company', icon: Building2, label: 'DEPARTMENTS' },
  { id: 'auditlog', icon: ScrollText, label: 'AUDIT LOG' },
];

const BOTTOM_NAV_ITEMS = [
  { id: 'settings', icon: Settings, label: 'SETTINGS' },
  { id: 'help', icon: HelpCircle, label: 'HELP' },
];

function NavItem({ icon: Icon, label, isActive, onClick }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      style={{
        width: '48px',
        height: '48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '8px',
        backgroundColor: isActive ? 'rgba(79, 195, 247, 0.1)' : 'transparent',
        border: isActive ? `1px solid ${DARK_THEME.border}` : '1px solid transparent',
        cursor: 'pointer',
        position: 'relative',
      }}
    >
      {isActive && (
        <div style={{ position: 'absolute', left: '-12px', width: '3px', height: '24px', backgroundColor: DARK_THEME.electric, borderRadius: '0 2px 2px 0' }} />
      )}
      <Icon size={20} style={{ color: isActive ? DARK_THEME.electric : DARK_THEME.textMuted, transition: 'color 0.2s' }} />
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -5 }}
            style={{
              position: 'absolute',
              left: '60px',
              padding: '6px 12px',
              backgroundColor: DARK_THEME.danger,
              border: 'none',
              borderRadius: '4px',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '10px',
              letterSpacing: '0.1em',
              color: DARK_THEME.navy,
              fontWeight: 600,
              whiteSpace: 'nowrap',
              zIndex: 9999,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
            }}
          >
            {label}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

function LeftNavSidebar({ activeNav, setActiveNav, userRole, hasCritical }) {
  const navItems = (userRole === 'admin' || userRole === 'owner')
    ? [...NAV_ITEMS, ...ADMIN_NAV_ITEMS]
    : NAV_ITEMS;

  const shieldClass = hasCritical ? 'gp-nav-shield gp-nav-shield--critical' : 'gp-nav-shield gp-nav-shield--nominal';
  const shieldColor = hasCritical ? DARK_THEME.warning : DARK_THEME.success;

  return (
    <div
      style={{
        width: '72px',
        height: '100%',
        backgroundColor: DARK_THEME.surface,
        borderRight: `1px solid ${DARK_THEME.border}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: '16px',
        paddingBottom: '16px',
        position: 'relative',
        zIndex: 300,
        overflow: 'visible',
      }}
    >
      <div className={shieldClass} style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', position: 'relative' }}>
        <Shield size={24} style={{ color: shieldColor, position: 'relative', zIndex: 1 }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {navItems.map((item) => (
          <NavItem key={item.id} icon={item.icon} label={item.label} isActive={activeNav === item.id} onClick={() => setActiveNav(item.id)} />
        ))}
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {BOTTOM_NAV_ITEMS.map((item) => (
          <NavItem key={item.id} icon={item.icon} label={item.label} isActive={activeNav === item.id} onClick={() => setActiveNav(item.id)} />
        ))}
      </div>

      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .gp-nav-shield--nominal {
            filter: drop-shadow(0 0 6px ${DARK_THEME.success}80);
            animation: gp-nav-pulse-nominal 2.5s ease-in-out infinite;
          }
          .gp-nav-shield--nominal::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 100%;
            height: 100%;
            border-radius: 50%;
            border: 1.5px solid ${DARK_THEME.success};
            transform: translate(-50%, -50%) scale(1);
            opacity: 0;
            animation: gp-nav-ripple-nominal 2.5s ease-out infinite;
            pointer-events: none;
          }
          .gp-nav-shield--critical {
            filter: drop-shadow(0 0 8px ${DARK_THEME.warning}90);
            animation: gp-nav-pulse-critical 0.8s ease-in-out infinite;
          }
          .gp-nav-shield--critical::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 100%;
            height: 100%;
            border-radius: 50%;
            border: 1.5px solid ${DARK_THEME.warning};
            transform: translate(-50%, -50%) scale(1);
            opacity: 0;
            animation: gp-nav-ripple-critical 0.8s ease-out infinite;
            pointer-events: none;
          }
          @keyframes gp-nav-pulse-nominal {
            0%, 100% { filter: drop-shadow(0 0 4px ${DARK_THEME.success}60); }
            50% { filter: drop-shadow(0 0 12px ${DARK_THEME.success}); }
          }
          @keyframes gp-nav-ripple-nominal {
            0% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
            100% { transform: translate(-50%, -50%) scale(1.8); opacity: 0; }
          }
          @keyframes gp-nav-pulse-critical {
            0%, 100% { filter: drop-shadow(0 0 5px ${DARK_THEME.warning}70); }
            50% { filter: drop-shadow(0 0 14px ${DARK_THEME.warning}); }
          }
          @keyframes gp-nav-ripple-critical {
            0% { transform: translate(-50%, -50%) scale(1); opacity: 0.7; }
            100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
          }
        }
      `}</style>
    </div>
  );
}

export default LeftNavSidebar;
