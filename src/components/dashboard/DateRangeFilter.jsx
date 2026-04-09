/**
 * GHOST PROTOCOL — Date Range Filter Component
 *
 * Filter bar for Reports page with preset ranges and custom date picker.
 * Follows Ghost Protocol design system.
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, X, ChevronDown, AlertCircle } from 'lucide-react';
import { DARK_THEME } from '@/constants/theme';
import {
  DATE_PRESETS,
  PRESET_LABELS,
  getPresetDateRange,
  formatDateISO,
  parseDateISO,
  validateDateRange,
  getDateRangeDescription,
} from '@/utils/dateRangeUtils';

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '16px 20px',
    background: `linear-gradient(135deg, ${DARK_THEME.surface} 0%, rgba(27, 42, 107, 0.15) 100%)`,
    borderRadius: '8px',
    border: `1px solid ${DARK_THEME.border}`,
    marginBottom: '20px',
  },
  topRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '12px',
  },
  presetsGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  presetButton: {
    padding: '8px 14px',
    fontSize: '11px',
    fontFamily: "'JetBrains Mono', monospace",
    fontWeight: 500,
    letterSpacing: '0.05em',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap',
  },
  presetActive: {
    background: DARK_THEME.navy,
    color: '#FFFFFF',
    boxShadow: `0 0 12px ${DARK_THEME.glow}`,
  },
  presetInactive: {
    background: 'transparent',
    color: DARK_THEME.textMuted,
    border: `1px solid ${DARK_THEME.border}`,
  },
  customButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    fontSize: '11px',
    fontFamily: "'JetBrains Mono', monospace",
    fontWeight: 500,
    letterSpacing: '0.05em',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  customActive: {
    background: DARK_THEME.electric,
    color: DARK_THEME.bg,
  },
  customInactive: {
    background: 'transparent',
    color: DARK_THEME.textMuted,
    border: `1px solid ${DARK_THEME.border}`,
  },
  customPanel: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    background: 'rgba(5, 10, 24, 0.6)',
    borderRadius: '6px',
    border: `1px solid ${DARK_THEME.border}`,
    flexWrap: 'wrap',
  },
  dateInputGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  dateLabel: {
    fontSize: '10px',
    fontFamily: "'JetBrains Mono', monospace",
    fontWeight: 500,
    letterSpacing: '0.1em',
    color: DARK_THEME.textMuted,
    textTransform: 'uppercase',
  },
  dateInput: {
    padding: '8px 12px',
    fontSize: '12px',
    fontFamily: "'JetBrains Mono', monospace",
    background: DARK_THEME.surface,
    border: `1px solid ${DARK_THEME.border}`,
    borderRadius: '4px',
    color: DARK_THEME.text,
    outline: 'none',
    width: '130px',
    transition: 'border-color 0.2s ease',
  },
  dateInputFocus: {
    borderColor: DARK_THEME.electric,
    boxShadow: `0 0 8px ${DARK_THEME.glow}`,
  },
  separator: {
    color: DARK_THEME.textMuted,
    fontSize: '12px',
  },
  actionButton: {
    padding: '8px 16px',
    fontSize: '11px',
    fontFamily: "'JetBrains Mono', monospace",
    fontWeight: 600,
    letterSpacing: '0.05em',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  applyButton: {
    background: DARK_THEME.electric,
    color: DARK_THEME.bg,
  },
  applyButtonDisabled: {
    background: 'rgba(79, 195, 247, 0.3)',
    color: 'rgba(255, 255, 255, 0.4)',
    cursor: 'not-allowed',
  },
  clearButton: {
    background: 'transparent',
    color: DARK_THEME.textMuted,
    border: `1px solid ${DARK_THEME.border}`,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  errorMessage: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '11px',
    fontFamily: "'JetBrains Mono', monospace",
    color: DARK_THEME.danger,
    marginLeft: '8px',
  },
  activeIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '10px',
    fontFamily: "'JetBrains Mono', monospace",
    fontWeight: 500,
    letterSpacing: '0.1em',
    color: DARK_THEME.textMuted,
    marginLeft: 'auto',
  },
  indicatorLabel: {
    color: DARK_THEME.electric,
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

function DateRangeFilter({ value, onChange }) {
  const { preset = DATE_PRESETS.ALL_TIME, startDate, endDate } = value || {};

  const [showCustomPanel, setShowCustomPanel] = useState(preset === DATE_PRESETS.CUSTOM);
  const [customStart, setCustomStart] = useState(startDate ? formatDateISO(startDate) : '');
  const [customEnd, setCustomEnd] = useState(endDate ? formatDateISO(endDate) : '');
  const [error, setError] = useState(null);
  const [focusedInput, setFocusedInput] = useState(null);

  const startInputRef = useRef(null);

  // Update custom inputs when external value changes
  useEffect(() => {
    if (preset === DATE_PRESETS.CUSTOM && startDate && endDate) {
      setCustomStart(formatDateISO(startDate));
      setCustomEnd(formatDateISO(endDate));
    }
  }, [preset, startDate, endDate]);

  // Handle preset button click
  const handlePresetClick = (presetKey) => {
    setShowCustomPanel(false);
    setError(null);

    const range = getPresetDateRange(presetKey);
    onChange({
      preset: presetKey,
      startDate: range.startDate,
      endDate: range.endDate,
    });
  };

  // Handle custom button click
  const handleCustomClick = () => {
    setShowCustomPanel(!showCustomPanel);
    if (!showCustomPanel) {
      // Focus the start input when opening
      setTimeout(() => startInputRef.current?.focus(), 100);
    }
  };

  // Handle apply custom range
  const handleApplyCustom = () => {
    const start = parseDateISO(customStart);
    const end = parseDateISO(customEnd);

    const validation = validateDateRange(start, end);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    setError(null);
    onChange({
      preset: DATE_PRESETS.CUSTOM,
      startDate: start,
      endDate: end,
    });
  };

  // Handle clear
  const handleClear = () => {
    setCustomStart('');
    setCustomEnd('');
    setError(null);
    setShowCustomPanel(false);
    handlePresetClick(DATE_PRESETS.ALL_TIME);
  };

  // Validate on input change
  const handleStartChange = (e) => {
    setCustomStart(e.target.value);
    setError(null);
  };

  const handleEndChange = (e) => {
    setCustomEnd(e.target.value);
    setError(null);
  };

  // Check if apply button should be disabled
  const isApplyDisabled = !customStart || !customEnd || !!error;

  // Preset button list (excluding CUSTOM)
  const presetKeys = [
    DATE_PRESETS.TODAY,
    DATE_PRESETS.THIS_WEEK,
    DATE_PRESETS.THIS_MONTH,
    DATE_PRESETS.LAST_30_DAYS,
    DATE_PRESETS.LAST_90_DAYS,
    DATE_PRESETS.ALL_TIME,
  ];

  const isCustomActive = preset === DATE_PRESETS.CUSTOM;
  const rangeDescription = getDateRangeDescription(preset, startDate, endDate);
  const showIndicator = preset !== DATE_PRESETS.ALL_TIME;

  return (
    <div style={styles.container}>
      <div style={styles.topRow}>
        <div style={styles.presetsGroup}>
          {presetKeys.map((key) => (
            <motion.button
              key={key}
              style={{
                ...styles.presetButton,
                ...(preset === key && !isCustomActive ? styles.presetActive : styles.presetInactive),
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handlePresetClick(key)}
            >
              {PRESET_LABELS[key]}
            </motion.button>
          ))}

          <motion.button
            style={{
              ...styles.customButton,
              ...(isCustomActive || showCustomPanel ? styles.customActive : styles.customInactive),
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCustomClick}
          >
            <Calendar size={12} />
            CUSTOM
            <ChevronDown
              size={12}
              style={{
                transform: showCustomPanel ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
              }}
            />
          </motion.button>
        </div>

        {showIndicator && (
          <div style={styles.activeIndicator}>
            SHOWING DATA FOR:{' '}
            <span style={styles.indicatorLabel}>{rangeDescription}</span>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showCustomPanel && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={styles.customPanel}>
              <div style={styles.dateInputGroup}>
                <span style={styles.dateLabel}>FROM</span>
                <input
                  ref={startInputRef}
                  type="date"
                  value={customStart}
                  onChange={handleStartChange}
                  onFocus={() => setFocusedInput('start')}
                  onBlur={() => setFocusedInput(null)}
                  style={{
                    ...styles.dateInput,
                    ...(focusedInput === 'start' ? styles.dateInputFocus : {}),
                  }}
                  max={formatDateISO(new Date())}
                />
              </div>

              <span style={styles.separator}>—</span>

              <div style={styles.dateInputGroup}>
                <span style={styles.dateLabel}>TO</span>
                <input
                  type="date"
                  value={customEnd}
                  onChange={handleEndChange}
                  onFocus={() => setFocusedInput('end')}
                  onBlur={() => setFocusedInput(null)}
                  style={{
                    ...styles.dateInput,
                    ...(focusedInput === 'end' ? styles.dateInputFocus : {}),
                  }}
                  max={formatDateISO(new Date())}
                />
              </div>

              <motion.button
                style={{
                  ...styles.actionButton,
                  ...(isApplyDisabled ? styles.applyButtonDisabled : styles.applyButton),
                }}
                whileHover={!isApplyDisabled ? { scale: 1.02 } : {}}
                whileTap={!isApplyDisabled ? { scale: 0.98 } : {}}
                onClick={handleApplyCustom}
                disabled={isApplyDisabled}
              >
                APPLY
              </motion.button>

              <motion.button
                style={{ ...styles.actionButton, ...styles.clearButton }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleClear}
              >
                <X size={12} />
                CLEAR
              </motion.button>

              {error && (
                <div style={styles.errorMessage}>
                  <AlertCircle size={12} />
                  {error}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default DateRangeFilter;
