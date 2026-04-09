import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, X } from 'lucide-react';
import { DARK_THEME } from '@/constants/theme';
import IncidentCard from './IncidentCard';
import PriorityHeader from './PriorityHeader';

function RightActivityPanel({ criticalIncidents, highIncidents, mediumIncidents, lowIncidents, onNewIncident, onViewIncident }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filterIncidents = (incidents) => {
    if (!searchTerm.trim()) return incidents;
    const term = searchTerm.toLowerCase();
    return incidents.filter(
      (i) => i.id.toLowerCase().includes(term) || (i.title && i.title.toLowerCase().includes(term))
    );
  };

  const filteredCritical = useMemo(() => filterIncidents(criticalIncidents), [criticalIncidents, searchTerm]);
  const filteredHigh = useMemo(() => filterIncidents(highIncidents), [highIncidents, searchTerm]);
  const filteredMedium = useMemo(() => filterIncidents(mediumIncidents), [mediumIncidents, searchTerm]);
  const filteredLow = useMemo(() => filterIncidents(lowIncidents), [lowIncidents, searchTerm]);

  const hasResults = filteredCritical.length + filteredHigh.length + filteredMedium.length + filteredLow.length > 0;
  const isSearching = searchTerm.trim().length > 0;

  return (
    <div
      style={{
        width: '320px',
        height: '100%',
        backgroundColor: DARK_THEME.surface,
        borderLeft: `1px solid ${DARK_THEME.border}`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '16px', borderBottom: `1px solid ${DARK_THEME.border}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', letterSpacing: '0.15em', color: DARK_THEME.textMuted }}>
            LIVE ACTIVITY FEED
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: DARK_THEME.danger, animation: 'pulse 1.5s infinite' }} />
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: DARK_THEME.danger }}>
              {criticalIncidents.length} critical
            </span>
          </div>
        </div>

        {onNewIncident && (
          <motion.button
            onClick={onNewIncident}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              width: '100%',
              padding: '12px',
              background: `linear-gradient(135deg, ${DARK_THEME.navy}, ${DARK_THEME.electric}30)`,
              border: `1px solid ${DARK_THEME.electric}`,
              borderRadius: '8px',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '12px',
              letterSpacing: '0.1em',
              color: DARK_THEME.electric,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
            }}
          >
            <Plus size={16} />
            NEW INCIDENT
          </motion.button>
        )}

        {/* Live Search */}
        <div style={{ position: 'relative', marginTop: '12px' }}>
          <Search
            size={14}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: DARK_THEME.textMuted,
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search ID or title..."
            style={{
              width: '100%',
              padding: '10px 36px 10px 34px',
              backgroundColor: 'rgba(79, 195, 247, 0.04)',
              border: `1px solid ${DARK_THEME.border}`,
              borderRadius: '8px',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '11px',
              letterSpacing: '0.05em',
              color: DARK_THEME.text,
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => (e.target.style.borderColor = DARK_THEME.electric)}
            onBlur={(e) => (e.target.style.borderColor = DARK_THEME.border)}
          />
          {isSearching && (
            <button
              onClick={() => setSearchTerm('')}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '4px',
                color: DARK_THEME.textMuted,
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = DARK_THEME.electric)}
              onMouseLeave={(e) => (e.currentTarget.style.color = DARK_THEME.textMuted)}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px' }}>
        {!hasResults && isSearching ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '11px',
              letterSpacing: '0.15em',
              color: DARK_THEME.textMuted,
            }}
          >
            NO RESULTS FOUND
          </div>
        ) : (
          <>
            {filteredCritical.length > 0 && (
              <>
                <PriorityHeader level="critical" count={filteredCritical.length} />
                {filteredCritical.map((incident) => (
                  <IncidentCard key={incident.id} incident={incident} onView={onViewIncident} />
                ))}
              </>
            )}
            {filteredHigh.length > 0 && (
              <>
                <PriorityHeader level="high" count={filteredHigh.length} />
                {filteredHigh.map((incident) => (
                  <IncidentCard key={incident.id} incident={incident} onView={onViewIncident} />
                ))}
              </>
            )}
            {filteredMedium.length > 0 && (
              <>
                <PriorityHeader level="medium" count={filteredMedium.length} />
                {filteredMedium.map((incident) => (
                  <IncidentCard key={incident.id} incident={incident} onView={onViewIncident} />
                ))}
              </>
            )}
            {filteredLow.length > 0 && (
              <>
                <PriorityHeader level="low" count={filteredLow.length} />
                {filteredLow.map((incident) => (
                  <IncidentCard key={incident.id} incident={incident} onView={onViewIncident} />
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default RightActivityPanel;
