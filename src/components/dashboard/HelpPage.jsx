import React from 'react';
import { Keyboard, AlertTriangle, Zap, Monitor, BookOpen, ArrowRight } from 'lucide-react';
import { DARK_THEME } from '@/constants/theme';
import AppLogo from '@/assets/sea-wave-monster.png';

// ═══════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function SectionHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <h2 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '20px', fontWeight: 600, letterSpacing: '0.1em', color: DARK_THEME.text, margin: '0 0 4px 0' }}>
        {title}
      </h2>
      {subtitle && (
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: DARK_THEME.textMuted }}>{subtitle}</span>
      )}
    </div>
  );
}

function ShortcutRow({ keys, description, noBorder = false }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: noBorder ? 'none' : `1px solid ${DARK_THEME.gridLine}` }}>
      <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '15px', color: DARK_THEME.text }}>{description}</span>
      <div style={{ display: 'flex', gap: '6px' }}>
        {keys.map((key, i) => (
          <span
            key={i}
            style={{
              padding: '6px 14px',
              backgroundColor: 'rgba(79, 195, 247, 0.08)',
              border: `1px solid ${DARK_THEME.border}`,
              borderRadius: '6px',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '12px',
              color: DARK_THEME.electric,
              minWidth: '36px',
              textAlign: 'center',
            }}
          >
            {key}
          </span>
        ))}
      </div>
    </div>
  );
}

function QuickStartCard({ icon: Icon, title, description, color = DARK_THEME.electric }) {
  return (
    <div style={{
      padding: '22px',
      backgroundColor: 'rgba(79, 195, 247, 0.03)',
      border: `1px solid ${DARK_THEME.gridLine}`,
      borderLeft: `3px solid ${color}`,
      borderRadius: '10px',
      display: 'flex',
      gap: '16px',
      alignItems: 'flex-start',
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: '10px',
        backgroundColor: `${color}15`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '17px', fontWeight: 600, color: DARK_THEME.text, marginBottom: '4px' }}>
          {title}
        </div>
        <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: DARK_THEME.textMuted, lineHeight: 1.5 }}>
          {description}
        </div>
      </div>
    </div>
  );
}

function PriorityRow({ level, color, sla, description }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      padding: '16px 20px',
      backgroundColor: 'rgba(79, 195, 247, 0.02)',
      border: `1px solid ${DARK_THEME.gridLine}`,
      borderRadius: '8px',
    }}>
      <span style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '11px',
        letterSpacing: '0.05em',
        padding: '5px 12px',
        backgroundColor: `${color}20`,
        border: `1px solid ${color}50`,
        borderRadius: '4px',
        color,
        minWidth: '80px',
        textAlign: 'center',
        flexShrink: 0,
      }}>
        {level}
      </span>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: DARK_THEME.text }}>{description}</div>
      </div>
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: DARK_THEME.textMuted, flexShrink: 0 }}>
        {sla}
      </span>
    </div>
  );
}

function TechStackItem({ label, value }) {
  return (
    <div style={{
      padding: '14px 18px',
      backgroundColor: 'rgba(79, 195, 247, 0.04)',
      borderRadius: '8px',
      border: `1px solid ${DARK_THEME.gridLine}`,
    }}>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', letterSpacing: '0.1em', color: DARK_THEME.textMuted, marginBottom: '6px' }}>
        {label.toUpperCase()}
      </div>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '14px', color: DARK_THEME.electric }}>
        {value}
      </div>
    </div>
  );
}

function StatusFlowStep({ label, color, isLast = false }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <span style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '11px',
        letterSpacing: '0.05em',
        padding: '6px 14px',
        backgroundColor: `${color}15`,
        border: `1px solid ${color}40`,
        borderRadius: '6px',
        color,
      }}>
        {label}
      </span>
      {!isLast && <ArrowRight size={14} style={{ color: DARK_THEME.textMuted }} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN HELP PAGE
// ═══════════════════════════════════════════════════════════════════════════

function HelpPage() {
  return (
    <div style={{ flex: 1, padding: '32px', overflowY: 'auto', backgroundColor: 'transparent' }}>
      {/* Header */}
      <div style={{ marginBottom: '36px' }}>
        <h1 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '30px', fontWeight: 700, letterSpacing: '0.1em', color: DARK_THEME.text, margin: '0 0 6px 0' }}>
          HELP CENTER
        </h1>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', letterSpacing: '0.1em', color: DARK_THEME.textMuted }}>
          DOCUMENTATION & SUPPORT RESOURCES
        </span>
      </div>

      {/* ── Quick Start Section ── */}
      <div style={{
        backgroundColor: DARK_THEME.surface,
        border: `1px solid ${DARK_THEME.border}`,
        borderRadius: '12px',
        padding: '28px',
        marginBottom: '24px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ height: '4px', background: `linear-gradient(90deg, ${DARK_THEME.electric} 0%, ${DARK_THEME.electric2} 50%, transparent 100%)`, position: 'absolute', top: 0, left: 0, right: 0 }} />
        <div style={{ marginTop: '8px' }}>
          <SectionHeader title="QUICK START GUIDE" subtitle="Get up and running with Ghost Protocol" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            <QuickStartCard
              icon={Monitor}
              title="Dashboard"
              description="Monitor real-time incident status, priority distribution, and department load at a glance."
              color={DARK_THEME.electric}
            />
            <QuickStartCard
              icon={AlertTriangle}
              title="Incidents"
              description="View, create, edit, and manage all incidents. Use filters and search to find specific tickets."
              color={DARK_THEME.warning}
            />
            <QuickStartCard
              icon={BookOpen}
              title="Reports"
              description="Analyze trends with stat cards, priority breakdowns, and weekly incident charts."
              color={DARK_THEME.success}
            />
            <QuickStartCard
              icon={Zap}
              title="Activity Feed"
              description="Live incidents grouped by priority. Create new incidents and take quick actions directly from the panel."
              color={DARK_THEME.danger}
            />
          </div>
        </div>
      </div>

      {/* ── Two-column: Shortcuts + Priority Levels ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', marginBottom: '24px', alignItems: 'stretch' }}>
        {/* Keyboard Shortcuts */}
        <div style={{
          backgroundColor: DARK_THEME.surface,
          border: `1px solid ${DARK_THEME.border}`,
          borderRadius: '12px',
          padding: '28px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{ height: '4px', background: `linear-gradient(90deg, ${DARK_THEME.gold} 0%, transparent 100%)`, position: 'absolute', top: 0, left: 0, right: 0 }} />
          <div style={{ marginTop: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: `${DARK_THEME.gold}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Keyboard size={18} style={{ color: DARK_THEME.gold }} />
              </div>
              <div>
                <h2 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '20px', fontWeight: 600, letterSpacing: '0.1em', color: DARK_THEME.text, margin: 0 }}>
                  KEYBOARD SHORTCUTS
                </h2>
              </div>
            </div>
            {/* GLOBAL */}
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', letterSpacing: '0.15em', color: DARK_THEME.electric, marginBottom: '8px', marginTop: '4px' }}>GLOBAL</div>
            <ShortcutRow keys={['Ctrl', '1-5']} description="Navigate pages (1=Dashboard, 5=Settings)" />
            <ShortcutRow keys={['Ctrl', 'N']} description="New incident" />
            <ShortcutRow keys={['?']} description="Open Help Center" />

            {/* LIST PAGES */}
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', letterSpacing: '0.15em', color: DARK_THEME.electric, marginBottom: '8px', marginTop: '16px' }}>LIST PAGES</div>
            <ShortcutRow keys={['/']} description="Focus search field" />
            <ShortcutRow keys={['R']} description="Refresh current list" />

            {/* INCIDENT EDIT */}
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', letterSpacing: '0.15em', color: DARK_THEME.electric, marginBottom: '8px', marginTop: '16px' }}>INCIDENT EDIT</div>
            <ShortcutRow keys={['Ctrl', 'S']} description="Save changes" />
            <ShortcutRow keys={['Ctrl', 'Shift', '1-4']} description="Switch tabs (1=Details, 4=Attachments)" />

            {/* DIALOGS */}
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', letterSpacing: '0.15em', color: DARK_THEME.electric, marginBottom: '8px', marginTop: '16px' }}>DIALOGS</div>
            <ShortcutRow keys={['Esc']} description="Close modal or dialog" />
            <ShortcutRow keys={['Enter']} description="Submit form / confirm" noBorder />
          </div>
        </div>

        {/* Incident Priority & Status */}
        <div style={{
          backgroundColor: DARK_THEME.surface,
          border: `1px solid ${DARK_THEME.border}`,
          borderRadius: '12px',
          padding: '28px',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          boxSizing: 'border-box',
        }}>
          <div style={{ height: '4px', background: `linear-gradient(90deg, ${DARK_THEME.danger} 0%, transparent 100%)`, position: 'absolute', top: 0, left: 0, right: 0 }} />
          <div style={{ marginTop: '8px', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: `${DARK_THEME.danger}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={18} style={{ color: DARK_THEME.danger }} />
              </div>
              <div>
                <h2 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '20px', fontWeight: 600, letterSpacing: '0.1em', color: DARK_THEME.text, margin: 0 }}>
                  PRIORITY LEVELS
                </h2>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1 }}>
              <PriorityRow level="CRITICAL" color={DARK_THEME.danger} sla="IMMEDIATE" description="Service outage or data loss" />
              <PriorityRow level="HIGH" color={DARK_THEME.warning} sla="< 1 HOUR" description="Major feature impacted" />
              <PriorityRow level="MEDIUM" color={DARK_THEME.electric} sla="< 4 HOURS" description="Partial service degradation" />
              <PriorityRow level="LOW" color={DARK_THEME.textMuted} sla="< 24 HOURS" description="Minor issue or request" />
            </div>

            {/* Status Flow */}
            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: `1px solid ${DARK_THEME.gridLine}` }}>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', letterSpacing: '0.1em', color: DARK_THEME.textMuted, display: 'block', marginBottom: '12px' }}>
                STATUS FLOW
              </span>
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                <StatusFlowStep label="NEW" color={DARK_THEME.electric} />
                <StatusFlowStep label="IN PROGRESS" color={DARK_THEME.gold} />
                <StatusFlowStep label="ESCALATED" color={DARK_THEME.danger} />
                <StatusFlowStep label="RESOLVED" color={DARK_THEME.success} />
                <StatusFlowStep label="CLOSED" color={DARK_THEME.textMuted} isLast />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── System Architecture + About ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
        {/* Tech Stack */}
        <div style={{
          backgroundColor: DARK_THEME.surface,
          border: `1px solid ${DARK_THEME.border}`,
          borderRadius: '12px',
          padding: '28px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{ height: '4px', background: `linear-gradient(90deg, ${DARK_THEME.electric2} 0%, transparent 100%)`, position: 'absolute', top: 0, left: 0, right: 0 }} />
          <div style={{ marginTop: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: `${DARK_THEME.electric2}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Monitor size={18} style={{ color: DARK_THEME.electric2 }} />
              </div>
              <div>
                <h2 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '20px', fontWeight: 600, letterSpacing: '0.1em', color: DARK_THEME.text, margin: 0 }}>
                  SYSTEM ARCHITECTURE
                </h2>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '21px' }}>
              <TechStackItem label="Frontend" value="React 18 + Vite" />
              <TechStackItem label="State" value="Zustand" />
              <TechStackItem label="Animation" value="Framer Motion + GSAP" />
              <TechStackItem label="Styling" value="Tailwind + Inline" />
              <TechStackItem label="Desktop" value="Electron 32" />
              <TechStackItem label="Database" value="SQLite" />
              <TechStackItem label="Charts" value="Canvas API" />
              <TechStackItem label="Maps" value="D3-Geo + TopoJSON" />
            </div>
          </div>
        </div>

        {/* About */}
        <div style={{
          backgroundColor: DARK_THEME.surface,
          border: `1px solid ${DARK_THEME.border}`,
          borderRadius: '12px',
          padding: '28px',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
        }}>
          <div style={{ height: '4px', background: `linear-gradient(90deg, ${DARK_THEME.electric} 0%, ${DARK_THEME.electric2} 100%)`, position: 'absolute', top: 0, left: 0, right: 0 }} />

          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${DARK_THEME.navy}, ${DARK_THEME.electric}30)`,
            border: `2px solid ${DARK_THEME.electric}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 0 24px ${DARK_THEME.glow}`,
            marginBottom: '18px',
            overflow: 'hidden',
          }}>
            <img src={AppLogo} alt="Ghost Protocol" style={{ width: '56px', height: '56px', objectFit: 'contain' }} />
          </div>
          <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '24px', fontWeight: 700, letterSpacing: '0.1em', color: DARK_THEME.text, marginBottom: '4px' }}>
            GHOST PROTOCOL
          </div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: DARK_THEME.textMuted, marginBottom: '18px' }}>
           BUILT BY
          </div>
          <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '20px', fontWeight: 600, letterSpacing: '0.1em', color: DARK_THEME.text, marginBottom: '4px' }}>
            M. O. N. E. R
          </div>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: DARK_THEME.textMuted, lineHeight: 1.6, marginBottom: '20px' }}>
            Application Developer & AI Specialist

"Ghost Protocol was designed and developed as a full-featured IT helpdesk intelligence platform. Crafted with a focus on clean architecture, dark UI aesthetics, and AI-driven workflows."
          </div>
          <div style={{ width: '60px', height: '1px', backgroundColor: DARK_THEME.border, marginBottom: '20px' }} />
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: DARK_THEME.gold, letterSpacing: '0.1em' }}>
           Ghost Protocol v1.0.0 © {new Date().getFullYear()}  MONER INTELLIGENCE SYSTEMS
          </div>
        </div>
      </div>

    </div>
  );
}

export default HelpPage;
