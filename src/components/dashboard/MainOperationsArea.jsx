import React from 'react';
import { PieChart, BarChart3, Building2, CheckCircle, Shield } from 'lucide-react';
import { DARK_THEME } from '@/constants/theme';

const APP_VERSION = '1.0.0';
import StatusDistribution from './StatusDistribution';
import PriorityMatrix from './PriorityMatrix';
import DepartmentLoad from './DepartmentLoad';
import RecentResolutions from './RecentResolutions';

function OpsPanel({ title, icon: Icon, accentColor = DARK_THEME.electric, rightContent, children, style = {} }) {
  return (
    <div style={{
      backgroundColor: DARK_THEME.surface,
      border: `1px solid ${DARK_THEME.border}`,
      borderRadius: '12px',
      overflow: 'hidden',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      ...style,
    }}>
      <div style={{ height: '4px', background: `linear-gradient(90deg, ${accentColor} 0%, transparent 100%)`, flexShrink: 0 }} />
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 24px', borderBottom: `1px solid ${DARK_THEME.border}`,
        backgroundColor: 'rgba(79, 195, 247, 0.02)', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '8px', backgroundColor: `${accentColor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={17} style={{ color: accentColor }} />
          </div>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', fontWeight: 500, letterSpacing: '0.15em', color: DARK_THEME.textMuted }}>
            {title}
          </span>
        </div>
        {rightContent}
      </div>
      <div style={{ padding: '24px', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  );
}

function MainOperationsArea({ isTablet, statusData, priorityData, departmentLoad, recentResolutions, onViewIncident }) {
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).toUpperCase();

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: 'transparent' }}>
      {/* Main Content Area */}
      <div style={{ flex: 1, padding: '32px', overflowY: 'auto', minHeight: 0 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
          <div>
            <h1 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '30px', fontWeight: 700, letterSpacing: '0.1em', color: DARK_THEME.text, margin: '0 0 6px 0' }}>
              OPERATIONS OVERVIEW
            </h1>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', letterSpacing: '0.1em', color: DARK_THEME.textMuted }}>
              REAL-TIME SYSTEM MONITORING
            </span>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px',
            backgroundColor: `${DARK_THEME.electric}10`, border: `1px solid ${DARK_THEME.electric}25`, borderRadius: '8px',
          }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: DARK_THEME.success, boxShadow: `0 0 6px ${DARK_THEME.success}`, animation: 'pulse 2s infinite' }} />
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', letterSpacing: '0.1em', color: DARK_THEME.electric }}>
              LIVE
            </span>
          </div>
        </div>

        {/* Row 1: Status Distribution + Priority Matrix */}
        <div style={{ display: 'grid', gridTemplateColumns: isTablet ? '1fr' : '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
          <OpsPanel title="INCIDENT STATUS DISTRIBUTION" icon={PieChart} accentColor={DARK_THEME.electric} style={{ height: '362px' }}>
            <StatusDistribution data={statusData} />
          </OpsPanel>
          <OpsPanel title="PRIORITY MATRIX" icon={BarChart3} accentColor={DARK_THEME.warning} style={{ height: '362px' }}>
            <PriorityMatrix data={priorityData} />
          </OpsPanel>
        </div>

        {/* Row 2: Department Load + Recent Resolutions */}
        <div style={{ display: 'grid', gridTemplateColumns: isTablet ? '1fr' : '1fr 1fr', gap: '24px' }}>
          <OpsPanel title="DEPARTMENT LOAD" icon={Building2} accentColor={DARK_THEME.success} style={{ height: '362px' }}>
            <DepartmentLoad data={departmentLoad} />
          </OpsPanel>
          <OpsPanel
            title="RECENT RESOLUTIONS"
            icon={CheckCircle}
            accentColor={DARK_THEME.gold}
            style={{ height: '362px' }}
          >
            <div style={{ height: '100%', overflowY: 'auto' }}>
              <RecentResolutions data={recentResolutions} onView={onViewIncident} />
            </div>
          </OpsPanel>
        </div>
      </div>

      {/* Footer Bar */}
      <div
        style={{
          height: '32px',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
          borderTop: '1px solid rgba(79, 195, 247, 0.15)',
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
        }}
      >
        {/* Left: Logo + Name + Version */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={12} style={{ color: 'rgba(255, 255, 255, 0.3)' }} />
          <span
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '10px',
              letterSpacing: '0.15em',
              color: 'rgba(255, 255, 255, 0.3)',
            }}
          >
            GHOST PROTOCOL
          </span>
          <span
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '9px',
              letterSpacing: '0.1em',
              color: 'rgba(255, 255, 255, 0.2)',
              padding: '2px 6px',
              backgroundColor: 'rgba(79, 195, 247, 0.1)',
              borderRadius: '3px',
            }}
          >
            V{APP_VERSION}
          </span>
        </div>

        {/* Center: Date + Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '10px',
              letterSpacing: '0.1em',
              color: 'rgba(255, 255, 255, 0.25)',
            }}
          >
            {currentDate}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: DARK_THEME.success,
                boxShadow: `0 0 4px ${DARK_THEME.success}`,
              }}
            />
            <span
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '10px',
                letterSpacing: '0.1em',
                color: DARK_THEME.success,
              }}
            >
              SYSTEM NOMINAL
            </span>
          </div>
        </div>

        {/* Right: Copyright */}
        <span
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '10px',
            letterSpacing: '0.1em',
            color: 'rgba(255, 255, 255, 0.2)',
          }}
        >
          © {new Date().getFullYear()} MONER INTELLIGENCE SYSTEMS
        </span>
      </div>
    </div>
  );
}

export default MainOperationsArea;
