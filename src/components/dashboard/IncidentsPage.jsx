import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, RefreshCw, AlertTriangle, Eye, FileText, Trash2, Building2, Activity, Shield, Clock, User, UserRound, X, Users, CheckCircle, Calendar, SlidersHorizontal } from 'lucide-react';
import { DARK_THEME } from '@/constants/theme';
import { formatSmartTimestamp, getDateRange, parseDateInput, formatDateInput, getDateRangeLabel } from '@/utils/formatters';
import { useToast } from '@/hooks/useToast';
import { notifyDataChanged } from '@/hooks/useDataRefresh';

// ═══════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function MiniStatCard({ label, value, color, icon: Icon }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '14px',
      padding: '16px 20px',
      backgroundColor: DARK_THEME.surface,
      border: `1px solid ${DARK_THEME.border}`,
      borderRadius: '10px',
      position: 'relative',
      overflow: 'hidden',
      flex: 1,
    }}>
      <div style={{ height: '100%', width: '3px', backgroundColor: color, position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: '10px 0 0 10px' }} />
      <div style={{ width: '38px', height: '38px', borderRadius: '8px', backgroundColor: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={18} style={{ color }} />
      </div>
      <div>
        <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '26px', fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', letterSpacing: '0.1em', color: DARK_THEME.textMuted, marginTop: '2px' }}>{label}</div>
      </div>
    </div>
  );
}

function FilterChip({ label, isActive, color, onClick }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      style={{
        padding: '8px 14px',
        fontSize: '11px',
        fontFamily: 'JetBrains Mono, monospace',
        fontWeight: 500,
        letterSpacing: '0.05em',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        whiteSpace: 'nowrap',
        background: isActive ? DARK_THEME.navy : 'transparent',
        color: isActive ? '#FFFFFF' : DARK_THEME.textMuted,
        boxShadow: isActive ? `0 0 12px ${DARK_THEME.glow}` : 'none',
        ...(isActive ? {} : { border: `1px solid ${DARK_THEME.border}` }),
      }}
    >
      {label}
    </motion.button>
  );
}

// Smart Timestamp with Tooltip
function SmartTimestamp({ timestamp }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  const ref = useRef(null);

  const { display, tooltip } = formatSmartTimestamp(timestamp);

  const handleMouseEnter = () => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setTooltipPos({
        top: rect.top - 36,
        left: rect.left + rect.width / 2,
      });
    }
    setShowTooltip(true);
  };

  return (
    <div
      ref={ref}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setShowTooltip(false)}
      style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'default' }}
    >
      <Clock size={13} style={{ color: DARK_THEME.textMuted, flexShrink: 0 }} />
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', color: DARK_THEME.textMuted }}>
        {display}
      </span>

      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'fixed',
              top: tooltipPos.top,
              left: tooltipPos.left,
              transform: 'translateX(-50%)',
              backgroundColor: DARK_THEME.surface,
              border: `1px solid ${DARK_THEME.electric}`,
              borderRadius: '6px',
              padding: '6px 12px',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '11px',
              color: DARK_THEME.text,
              whiteSpace: 'nowrap',
              zIndex: 1000,
              boxShadow: `0 4px 16px rgba(0,0,0,0.4), 0 0 8px ${DARK_THEME.glow}`,
              pointerEvents: 'none',
            }}
          >
            {tooltip}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Styled Checkbox Component
function StyledCheckbox({ checked, indeterminate, onChange, disabled }) {
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) onChange(!checked);
      }}
      style={{
        width: '18px',
        height: '18px',
        borderRadius: '4px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        border: `1.5px solid ${checked || indeterminate ? DARK_THEME.electric : DARK_THEME.border}`,
        backgroundColor: checked || indeterminate ? `${DARK_THEME.electric}20` : 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        transition: 'all 0.15s',
        opacity: disabled ? 0.4 : 1,
      }}
    >
      {checked && <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: DARK_THEME.electric }} />}
      {indeterminate && !checked && <div style={{ width: '10px', height: '2px', backgroundColor: DARK_THEME.electric }} />}
    </div>
  );
}

// Action Dropdown Component
function ActionDropdown({ isOpen, onClose, triggerRef, children, width = 200 }) {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 4,
        left: rect.left,
      });
    }
  }, [isOpen, triggerRef]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) &&
        triggerRef.current && !triggerRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 99,
        }}
      />
      <motion.div
        ref={dropdownRef}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.15 }}
        style={{
          position: 'fixed',
          top: position.top,
          left: position.left,
          width: width,
          maxHeight: '280px',
          overflowY: 'auto',
          backgroundColor: DARK_THEME.surface,
          border: `1px solid ${DARK_THEME.border}`,
          borderRadius: '8px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          zIndex: 100,
        }}
      >
        {children}
      </motion.div>
    </>
  );
}

// Bulk Delete Confirmation Dialog
function BulkDeleteDialog({ isOpen, onClose, onConfirm, onConfirmOpenOnly, selectedIncidents, isLoading, isOwner }) {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && !isLoading) onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose, isLoading]);

  if (!isOpen) return null;

  const protectedIncidents = isOwner ? [] : selectedIncidents.filter(inc => ['resolved', 'closed'].includes(inc.status));
  const openIncidents = isOwner ? selectedIncidents : selectedIncidents.filter(inc => !['resolved', 'closed'].includes(inc.status));
  const allProtected = protectedIncidents.length > 0 && openIncidents.length === 0;
  const hasMixed = protectedIncidents.length > 0 && openIncidents.length > 0;

  // Case C — all protected, no deletable incidents
  if (allProtected) {
    return (
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(5, 10, 24, 0.85)',
            backdropFilter: 'blur(4px)',
            zIndex: 600,
          }}
        />
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 601,
          pointerEvents: 'none',
        }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{
              width: '94%',
              maxWidth: '480px',
              backgroundColor: DARK_THEME.surface,
              border: `1px solid ${DARK_THEME.warning}40`,
              borderRadius: '14px',
              boxShadow: '0 0 60px rgba(245, 158, 11, 0.15)',
              pointerEvents: 'auto',
              overflow: 'hidden',
            }}
          >
            <div style={{ height: '4px', backgroundColor: DARK_THEME.warning }} />

            <div style={{ padding: '24px 28px', textAlign: 'center' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: `${DARK_THEME.warning}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}>
                <AlertTriangle size={28} style={{ color: DARK_THEME.warning }} />
              </div>

              <h2 style={{
                fontFamily: 'Rajdhani, sans-serif',
                fontSize: '22px',
                fontWeight: 600,
                letterSpacing: '0.1em',
                color: DARK_THEME.text,
                margin: '0 0 12px',
              }}>
                CANNOT DELETE SELECTED
              </h2>

              <p style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '14px',
                color: DARK_THEME.textMuted,
                margin: '0 0 16px',
              }}>
                All selected incidents are RESOLVED or CLOSED.
                Only open incidents can be deleted.
              </p>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'center',
              padding: '20px 28px',
              borderTop: `1px solid ${DARK_THEME.border}`,
            }}>
              <motion.button
                onClick={onClose}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  padding: '12px 28px',
                  backgroundColor: 'transparent',
                  border: `1px solid ${DARK_THEME.border}`,
                  borderRadius: '6px',
                  fontFamily: 'Rajdhani, sans-serif',
                  fontWeight: 600,
                  fontSize: '14px',
                  letterSpacing: '0.1em',
                  color: DARK_THEME.textMuted,
                  cursor: 'pointer',
                }}
              >
                CLOSE
              </motion.button>
            </div>
          </motion.div>
        </div>
      </>
    );
  }

  // Case B — mixed selection (some protected)
  if (hasMixed) {
    const statusColors = { resolved: DARK_THEME.success, closed: DARK_THEME.textMuted };
    const statusLabels = { resolved: 'RESOLVED', closed: 'CLOSED' };

    return (
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => !isLoading && onClose()}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(5, 10, 24, 0.85)',
            backdropFilter: 'blur(4px)',
            zIndex: 600,
          }}
        />
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 601,
          pointerEvents: 'none',
        }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{
              width: '94%',
              maxWidth: '520px',
              backgroundColor: DARK_THEME.surface,
              border: `1px solid ${DARK_THEME.warning}40`,
              borderRadius: '14px',
              boxShadow: '0 0 60px rgba(245, 158, 11, 0.15)',
              pointerEvents: 'auto',
              overflow: 'hidden',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ height: '4px', backgroundColor: DARK_THEME.warning, flexShrink: 0 }} />

            <div style={{ overflowY: 'auto', flex: 1 }}>
              <div style={{ padding: '24px 28px', textAlign: 'center' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: `${DARK_THEME.warning}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}>
                  <AlertTriangle size={28} style={{ color: DARK_THEME.warning }} />
                </div>

                <h2 style={{
                  fontFamily: 'Rajdhani, sans-serif',
                  fontSize: '22px',
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  color: DARK_THEME.text,
                  margin: '0 0 12px',
                }}>
                  CANNOT DELETE ALL SELECTED
                </h2>

                <p style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '14px',
                  color: DARK_THEME.textMuted,
                  margin: '0 0 16px',
                }}>
                  {protectedIncidents.length} of your selected incidents {protectedIncidents.length === 1 ? 'is' : 'are'} RESOLVED or CLOSED and cannot be deleted.
                </p>

                {/* Protected incidents list */}
                <div style={{
                  textAlign: 'left',
                  marginBottom: '16px',
                }}>
                  <div style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '9px',
                    letterSpacing: '0.15em',
                    color: DARK_THEME.textMuted,
                    marginBottom: '8px',
                  }}>
                    INCIDENTS THAT CANNOT BE DELETED
                  </div>
                  <div style={{
                    maxHeight: '120px',
                    overflowY: 'auto',
                    backgroundColor: `${DARK_THEME.warning}08`,
                    border: `1px solid ${DARK_THEME.warning}20`,
                    borderRadius: '8px',
                    padding: '8px 12px',
                  }}>
                    {protectedIncidents.map((inc) => (
                      <div
                        key={inc.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '6px 0',
                          borderBottom: `1px solid ${DARK_THEME.warning}10`,
                        }}
                      >
                        <span style={{
                          fontFamily: 'JetBrains Mono, monospace',
                          fontSize: '11px',
                          fontWeight: 600,
                          color: DARK_THEME.warning,
                          flexShrink: 0,
                        }}>
                          {inc.id}
                        </span>
                        <span style={{
                          fontFamily: 'DM Sans, sans-serif',
                          fontSize: '12px',
                          color: DARK_THEME.text,
                          flex: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {inc.title}
                        </span>
                        <span style={{
                          padding: '2px 8px',
                          backgroundColor: `${statusColors[inc.status] || DARK_THEME.textMuted}15`,
                          border: `1px solid ${statusColors[inc.status] || DARK_THEME.textMuted}40`,
                          borderRadius: '4px',
                          fontFamily: 'JetBrains Mono, monospace',
                          fontSize: '9px',
                          letterSpacing: '0.05em',
                          color: statusColors[inc.status] || DARK_THEME.textMuted,
                          flexShrink: 0,
                        }}>
                          {statusLabels[inc.status] || inc.status?.toUpperCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <p style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '13px',
                  color: DARK_THEME.textMuted,
                  margin: 0,
                  textAlign: 'center',
                }}>
                  You can delete the {openIncidents.length} open incident{openIncidents.length !== 1 ? 's' : ''} or cancel and adjust your selection.
                </p>
              </div>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '12px',
              padding: '20px 28px',
              borderTop: `1px solid ${DARK_THEME.border}`,
              flexShrink: 0,
            }}>
              <motion.button
                onClick={onClose}
                disabled={isLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  padding: '12px 28px',
                  backgroundColor: 'transparent',
                  border: `1px solid ${DARK_THEME.border}`,
                  borderRadius: '6px',
                  fontFamily: 'Rajdhani, sans-serif',
                  fontWeight: 600,
                  fontSize: '14px',
                  letterSpacing: '0.1em',
                  color: DARK_THEME.textMuted,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.5 : 1,
                }}
              >
                CANCEL
              </motion.button>
              <motion.button
                onClick={onConfirmOpenOnly}
                disabled={isLoading}
                whileHover={{ scale: isLoading ? 1 : 1.02 }}
                whileTap={{ scale: isLoading ? 1 : 0.98 }}
                style={{
                  padding: '12px 28px',
                  backgroundColor: DARK_THEME.danger,
                  border: `1px solid ${DARK_THEME.danger}`,
                  borderRadius: '6px',
                  fontFamily: 'Rajdhani, sans-serif',
                  fontWeight: 600,
                  fontSize: '14px',
                  letterSpacing: '0.1em',
                  color: '#fff',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.7 : 1,
                }}
              >
                {isLoading ? 'DELETING...' : `DELETE OPEN ONLY (${openIncidents.length})`}
              </motion.button>
            </div>
          </motion.div>
        </div>
      </>
    );
  }

  // Case A — all deletable (all open, or user is owner)
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => !isLoading && onClose()}
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(5, 10, 24, 0.85)',
          backdropFilter: 'blur(4px)',
          zIndex: 600,
        }}
      />
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 601,
        pointerEvents: 'none',
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          style={{
            width: '94%',
            maxWidth: '480px',
            backgroundColor: DARK_THEME.surface,
            border: `1px solid ${DARK_THEME.danger}40`,
            borderRadius: '14px',
            boxShadow: '0 0 60px rgba(239, 68, 68, 0.15)',
            pointerEvents: 'auto',
            overflow: 'hidden',
          }}
        >
          <div style={{ height: '4px', backgroundColor: DARK_THEME.danger }} />

          <div style={{ padding: '24px 28px', textAlign: 'center' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: `${DARK_THEME.danger}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <AlertTriangle size={28} style={{ color: DARK_THEME.danger }} />
            </div>

            <h2 style={{
              fontFamily: 'Rajdhani, sans-serif',
              fontSize: '22px',
              fontWeight: 600,
              letterSpacing: '0.1em',
              color: DARK_THEME.text,
              margin: '0 0 12px',
            }}>
              DELETE {selectedIncidents.length} INCIDENT{selectedIncidents.length > 1 ? 'S' : ''}?
            </h2>

            <p style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '14px',
              color: DARK_THEME.textMuted,
              margin: '0 0 16px',
            }}>
              This action cannot be undone. The following incidents will be permanently deleted:
            </p>

            <div style={{
              maxHeight: '120px',
              overflowY: 'auto',
              backgroundColor: 'rgba(239, 68, 68, 0.05)',
              border: `1px solid ${DARK_THEME.danger}20`,
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '8px',
            }}>
              {selectedIncidents.map((inc) => (
                <div
                  key={inc.id}
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '12px',
                    color: DARK_THEME.danger,
                    padding: '4px 0',
                    borderBottom: `1px solid ${DARK_THEME.danger}10`,
                  }}
                >
                  {inc.id} — {inc.title?.substring(0, 40)}{inc.title?.length > 40 ? '...' : ''}
                </div>
              ))}
            </div>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '12px',
            padding: '20px 28px',
            borderTop: `1px solid ${DARK_THEME.border}`,
          }}>
            <motion.button
              onClick={onClose}
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                padding: '12px 28px',
                backgroundColor: 'transparent',
                border: `1px solid ${DARK_THEME.border}`,
                borderRadius: '6px',
                fontFamily: 'Rajdhani, sans-serif',
                fontWeight: 600,
                fontSize: '14px',
                letterSpacing: '0.1em',
                color: DARK_THEME.textMuted,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.5 : 1,
              }}
            >
              CANCEL
            </motion.button>
            <motion.button
              onClick={onConfirm}
              disabled={isLoading}
              whileHover={{ scale: isLoading ? 1 : 1.02 }}
              whileTap={{ scale: isLoading ? 1 : 0.98 }}
              style={{
                padding: '12px 28px',
                backgroundColor: DARK_THEME.danger,
                border: `1px solid ${DARK_THEME.danger}`,
                borderRadius: '6px',
                fontFamily: 'Rajdhani, sans-serif',
                fontWeight: 600,
                fontSize: '14px',
                letterSpacing: '0.1em',
                color: '#fff',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.7 : 1,
              }}
            >
              {isLoading ? 'DELETING...' : 'DELETE INCIDENTS'}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </>
  );
}

// Bulk Action Toolbar
function BulkActionToolbar({
  selectedCount,
  hiddenCount,
  onClearSelection,
  onAssign,
  onChangePriority,
  onDelete,
  canDelete,
  isProcessing,
  progressText,
  agents,
}) {
  const [assignDropdownOpen, setAssignDropdownOpen] = useState(false);
  const [priorityDropdownOpen, setPriorityDropdownOpen] = useState(false);

  const assignRef = useRef(null);
  const priorityRef = useRef(null);

  const priorityOptions = [
    { value: 'critical', label: 'CRITICAL', color: DARK_THEME.danger },
    { value: 'high', label: 'HIGH', color: DARK_THEME.warning },
    { value: 'medium', label: 'MEDIUM', color: DARK_THEME.electric },
    { value: 'low', label: 'LOW', color: DARK_THEME.textMuted },
  ];

  const toolbarButtonStyle = {
    padding: '10px 16px',
    backgroundColor: 'transparent',
    border: `1px solid ${DARK_THEME.border}`,
    borderRadius: '6px',
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: '11px',
    letterSpacing: '0.05em',
    color: DARK_THEME.text,
    cursor: isProcessing ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.15s',
    opacity: isProcessing ? 0.5 : 1,
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0, marginBottom: 0 }}
      animate={{ opacity: 1, height: 'auto', marginBottom: '16px' }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.2 }}
      style={{ overflow: 'hidden' }}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '14px 20px',
        backgroundColor: DARK_THEME.surface,
        border: `1px solid ${DARK_THEME.border}`,
        borderRadius: '10px',
        borderLeft: `3px solid ${DARK_THEME.electric}`,
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        {/* Left: Selection info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {isProcessing ? (
            <span style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '13px',
              fontWeight: 700,
              color: DARK_THEME.electric,
              letterSpacing: '0.05em',
            }}>
              {progressText}
            </span>
          ) : (
            <>
              <span style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '13px',
                fontWeight: 700,
                color: DARK_THEME.electric,
                letterSpacing: '0.05em',
              }}>
                {selectedCount} INCIDENT{selectedCount > 1 ? 'S' : ''} SELECTED
              </span>
              <button
                onClick={onClearSelection}
                style={{
                  background: 'none',
                  border: 'none',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '11px',
                  color: DARK_THEME.textMuted,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: 0,
                }}
              >
                CLEAR SELECTION
              </button>
            </>
          )}
          {hiddenCount > 0 && !isProcessing && (
            <span style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '10px',
              color: DARK_THEME.warning,
              backgroundColor: `${DARK_THEME.warning}15`,
              padding: '4px 8px',
              borderRadius: '4px',
            }}>
              {hiddenCount} of {selectedCount} hidden by filters
            </span>
          )}
        </div>

        {/* Right: Action buttons */}
        {!isProcessing && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Assign To */}
            <div style={{ position: 'relative' }}>
              <motion.button
                ref={assignRef}
                onClick={() => setAssignDropdownOpen(!assignDropdownOpen)}
                whileHover={{ backgroundColor: `${DARK_THEME.electric}10` }}
                style={toolbarButtonStyle}
              >
                <Users size={14} />
                ASSIGN TO
                <ChevronDown size={12} style={{ transform: assignDropdownOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.15s' }} />
              </motion.button>
              <AnimatePresence>
                {assignDropdownOpen && (
                  <ActionDropdown
                    isOpen={assignDropdownOpen}
                    onClose={() => setAssignDropdownOpen(false)}
                    triggerRef={assignRef}
                    width={220}
                  >
                    <div style={{ padding: '8px 0' }}>
                      {agents.length === 0 ? (
                        <div style={{ padding: '12px 16px', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: DARK_THEME.textMuted }}>
                          No agents available
                        </div>
                      ) : (
                        agents.map((agent) => (
                          <button
                            key={agent.id}
                            onClick={() => {
                              onAssign(agent.id, agent.name);
                              setAssignDropdownOpen(false);
                            }}
                            style={{
                              width: '100%',
                              padding: '10px 16px',
                              backgroundColor: 'transparent',
                              border: 'none',
                              fontFamily: 'JetBrains Mono, monospace',
                              fontSize: '12px',
                              color: DARK_THEME.text,
                              cursor: 'pointer',
                              textAlign: 'left',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              transition: 'background-color 0.15s',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${DARK_THEME.electric}10`}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <User size={14} style={{ color: DARK_THEME.electric }} />
                            <div>
                              <div>{agent.name}</div>
                              <div style={{ fontSize: '10px', color: DARK_THEME.textMuted, textTransform: 'uppercase' }}>{agent.role}</div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </ActionDropdown>
                )}
              </AnimatePresence>
            </div>

            {/* Change Priority */}
            <div style={{ position: 'relative' }}>
              <motion.button
                ref={priorityRef}
                onClick={() => setPriorityDropdownOpen(!priorityDropdownOpen)}
                whileHover={{ backgroundColor: `${DARK_THEME.electric}10` }}
                style={toolbarButtonStyle}
              >
                <Shield size={14} />
                CHANGE PRIORITY
                <ChevronDown size={12} style={{ transform: priorityDropdownOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.15s' }} />
              </motion.button>
              <AnimatePresence>
                {priorityDropdownOpen && (
                  <ActionDropdown
                    isOpen={priorityDropdownOpen}
                    onClose={() => setPriorityDropdownOpen(false)}
                    triggerRef={priorityRef}
                    width={160}
                  >
                    <div style={{ padding: '8px 0' }}>
                      {priorityOptions.map((priority) => (
                        <button
                          key={priority.value}
                          onClick={() => {
                            onChangePriority(priority.value);
                            setPriorityDropdownOpen(false);
                          }}
                          style={{
                            width: '100%',
                            padding: '10px 16px',
                            backgroundColor: 'transparent',
                            border: 'none',
                            fontFamily: 'JetBrains Mono, monospace',
                            fontSize: '12px',
                            color: priority.color,
                            cursor: 'pointer',
                            textAlign: 'left',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            transition: 'background-color 0.15s',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${priority.color}10`}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: priority.color, boxShadow: `0 0 6px ${priority.color}` }} />
                          {priority.label}
                        </button>
                      ))}
                    </div>
                  </ActionDropdown>
                )}
              </AnimatePresence>
            </div>

            {/* Delete Selected - Only for ADMIN/OWNER */}
            {canDelete && (
              <motion.button
                onClick={onDelete}
                whileHover={{ backgroundColor: `${DARK_THEME.danger}15` }}
                style={{
                  ...toolbarButtonStyle,
                  borderColor: `${DARK_THEME.danger}50`,
                  color: DARK_THEME.danger,
                }}
              >
                <Trash2 size={14} />
                DELETE SELECTED
              </motion.button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN INCIDENTS PAGE
// ═══════════════════════════════════════════════════════════════════════════

function IncidentsPage({ incidents, currentUser, onViewIncident, onEditIncident, onDeleteIncident, onNewIncident, onRefresh, onUpdateIncidents }) {
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [ownershipFilter, setOwnershipFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState('all_time');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [showFilters, setShowFilters] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [agents, setAgents] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressText, setProgressText] = useState('');

  // Dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);



  // User role checks
  const userRole = currentUser?.role || 'viewer';
  const canBulkAction = userRole === 'operator' || userRole === 'admin' || userRole === 'owner';
  const canDelete = userRole === 'admin' || userRole === 'owner';

  // Fetch approved agents for assignment dropdown
  useEffect(() => {
    if (window.electronAPI?.users?.getAll) {
      window.electronAPI.users.getAll()
        .then((users) => {
          const assignable = (users ?? [])
            .filter((u) => u.account_status === 'approved')
            .map((u) => ({ id: u.id, name: u.display_name || u.username, role: u.role }));
          setAgents(assignable);
        })
        .catch(() => setAgents([]));
    }
  }, []);

  // Calculate date range bounds
  const getDateBounds = () => {
    if (dateRangeFilter === 'all_time') return { startDate: null, endDate: null };
    if (dateRangeFilter === 'custom') {
      const startDate = parseDateInput(customDateFrom);
      const endDate = parseDateInput(customDateTo);
      return {
        startDate: startDate ? startDate.getTime() : null,
        endDate: endDate ? new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999).getTime() : null,
      };
    }
    return getDateRange(dateRangeFilter);
  };

  const dateBounds = getDateBounds();

  const filteredIncidents = incidents
    .filter((incident) => {
      const matchesSearch = searchQuery === '' ||
        (incident.title ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        incident.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesOwnership = ownershipFilter === 'all' ||
        (ownershipFilter === 'mine' && incident.assigned_to === currentUser?.id) ||
        (ownershipFilter === 'unassigned' && !incident.assigned_to);
      const matchesStatus = statusFilter === 'all' || (incident.status || 'new') === statusFilter;
      const matchesPriority = priorityFilter === 'all' || incident.priority === priorityFilter;

      // Date range filtering
      let matchesDateRange = true;
      if (dateBounds.startDate !== null || dateBounds.endDate !== null) {
        const incidentTime = incident.created_at || 0;
        if (dateBounds.startDate !== null && incidentTime < dateBounds.startDate) matchesDateRange = false;
        if (dateBounds.endDate !== null && incidentTime > dateBounds.endDate) matchesDateRange = false;
      }

      return matchesSearch && matchesOwnership && matchesStatus && matchesPriority && matchesDateRange;
    })
    .sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (sortField === 'created_at') { aVal = aVal || 0; bVal = bVal || 0; }
      else { aVal = (aVal || '').toString().toLowerCase(); bVal = (bVal || '').toString().toLowerCase(); }
      return sortDirection === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
    });

  // Pagination calculations
  const totalCount = filteredIncidents.length;
  const totalPages = Math.ceil(totalCount / pageSize);
  const paginatedIncidents = filteredIncidents.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Reset to page 1 when filters or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, ownershipFilter, statusFilter, priorityFilter, dateRangeFilter, customDateFrom, customDateTo, sortField, sortDirection]);

  // Selection helpers
  const visibleIds = new Set(filteredIncidents.map((i) => i.id));
  const selectedVisibleCount = [...selectedIds].filter((id) => visibleIds.has(id)).length;
  const selectedHiddenCount = selectedIds.size - selectedVisibleCount;
  const allVisibleSelected = filteredIncidents.length > 0 && filteredIncidents.every((i) => selectedIds.has(i.id));
  const someSelected = filteredIncidents.some((i) => selectedIds.has(i.id));

  const toggleSelectAll = useCallback(() => {
    if (allVisibleSelected) {
      // Deselect all visible
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredIncidents.forEach((i) => next.delete(i.id));
        return next;
      });
    } else {
      // Select all visible
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredIncidents.forEach((i) => next.add(i.id));
        return next;
      });
    }
  }, [allVisibleSelected, filteredIncidents]);

  const toggleSelect = useCallback((id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Get selected incident objects
  const getSelectedIncidents = useCallback(() => {
    return incidents.filter((i) => selectedIds.has(i.id));
  }, [incidents, selectedIds]);

  // Helper to update incidents immediately in UI
  const updateIncidentInUI = useCallback((id, updates) => {
    if (onUpdateIncidents) {
      onUpdateIncidents((prev) => prev.map((inc) => inc.id === id ? { ...inc, ...updates } : inc));
    }
  }, [onUpdateIncidents]);

  const removeIncidentFromUI = useCallback((id) => {
    if (onUpdateIncidents) {
      onUpdateIncidents((prev) => prev.filter((inc) => inc.id !== id));
    }
  }, [onUpdateIncidents]);

  // Bulk action handlers
  const handleBulkAssign = useCallback(async (agentId, agentName) => {
    const selected = getSelectedIncidents();
    if (selected.length === 0) return;

    setIsProcessing(true);
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < selected.length; i++) {
      setProgressText(`UPDATING ${i + 1} OF ${selected.length} INCIDENTS...`);
      try {
        const result = await window.electronAPI.incidents.update(selected[i].id, {
          assigned_to: agentId,
          assignee_name: agentName,
        }, currentUser?.id);
        if (result?.success) {
          successCount++;
          updateIncidentInUI(selected[i].id, { assigned_to: agentId, assignee_name: agentName });
        } else {
          failCount++;
        }
      } catch {
        failCount++;
      }
    }

    setIsProcessing(false);
    setProgressText('');
    clearSelection();
    if (successCount > 0) notifyDataChanged('incidents');

    if (failCount === 0) {
      toast.success(`${successCount} incident${successCount > 1 ? 's' : ''} assigned to ${agentName}`);
    } else {
      toast.warning(`${successCount} succeeded, ${failCount} failed`);
    }
  }, [getSelectedIncidents, clearSelection, toast, updateIncidentInUI, currentUser]);

  const handleBulkPriorityChange = useCallback(async (newPriority) => {
    const selected = getSelectedIncidents();
    if (selected.length === 0) return;

    setIsProcessing(true);
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < selected.length; i++) {
      setProgressText(`UPDATING ${i + 1} OF ${selected.length} INCIDENTS...`);
      try {
        const result = await window.electronAPI.incidents.update(selected[i].id, { priority: newPriority }, currentUser?.id);
        if (result?.success) {
          successCount++;
          updateIncidentInUI(selected[i].id, { priority: newPriority });
        } else {
          failCount++;
        }
      } catch {
        failCount++;
      }
    }

    setIsProcessing(false);
    setProgressText('');
    clearSelection();
    if (successCount > 0) notifyDataChanged('incidents');

    if (failCount === 0) {
      toast.success(`${successCount} incident${successCount > 1 ? 's' : ''} changed to ${newPriority.toUpperCase()}`);
    } else {
      toast.warning(`${successCount} succeeded, ${failCount} failed`);
    }
  }, [getSelectedIncidents, clearSelection, toast, updateIncidentInUI, currentUser]);

  const executeBulkDelete = useCallback(async (incidentsToDelete) => {
    if (incidentsToDelete.length === 0) return;

    setShowDeleteDialog(false);
    setIsProcessing(true);
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < incidentsToDelete.length; i++) {
      setProgressText(`DELETING ${i + 1} OF ${incidentsToDelete.length} INCIDENTS...`);
      try {
        const result = await window.electronAPI.incidents.delete(incidentsToDelete[i].id, currentUser?.id, currentUser?.display_name);
        if (result?.success) {
          successCount++;
          removeIncidentFromUI(incidentsToDelete[i].id);
        } else {
          failCount++;
        }
      } catch {
        failCount++;
      }
    }

    setIsProcessing(false);
    setProgressText('');
    clearSelection();
    if (successCount > 0) notifyDataChanged('incidents');

    if (failCount === 0) {
      toast.success(`${successCount} incident${successCount > 1 ? 's' : ''} deleted`);
    } else {
      toast.warning(`${successCount} deleted, ${failCount} failed`);
    }
  }, [clearSelection, toast, removeIncidentFromUI, currentUser]);

  const handleBulkDelete = useCallback(async () => {
    const selected = getSelectedIncidents();
    await executeBulkDelete(selected);
  }, [getSelectedIncidents, executeBulkDelete]);

  const handleBulkDeleteOpenOnly = useCallback(async () => {
    const selected = getSelectedIncidents();
    const openOnly = selected.filter(inc => !['resolved', 'closed'].includes(inc.status));
    await executeBulkDelete(openOnly);
  }, [getSelectedIncidents, executeBulkDelete]);

  const handleSort = (field) => {
    if (sortField === field) setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDirection('desc'); }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ChevronDown size={13} style={{ opacity: 0.3 }} />;
    return sortDirection === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />;
  };

  const priorityColors = { critical: DARK_THEME.danger, high: DARK_THEME.warning, medium: DARK_THEME.electric, low: DARK_THEME.textMuted };
  const statusColors = { new: DARK_THEME.electric, in_progress: DARK_THEME.gold, escalated: DARK_THEME.danger, resolved: DARK_THEME.success, closed: DARK_THEME.textMuted };
  const statusLabels = { new: 'NEW', in_progress: 'IN PROGRESS', escalated: 'ESCALATED', resolved: 'RESOLVED', closed: 'CLOSED' };

  // Quick stats by status — counts within the current filtered result set
  const newCount = filteredIncidents.filter((i) => !i.status || i.status === 'new').length;
  const inProgressCount = filteredIncidents.filter((i) => i.status === 'in_progress').length;
  const escalatedCount = filteredIncidents.filter((i) => i.status === 'escalated').length;
  const resolvedCount = filteredIncidents.filter((i) => i.status === 'resolved').length;
  const closedCount = filteredIncidents.filter((i) => i.status === 'closed').length;

  // Active filter count for badge
  const activeFilterCount = (ownershipFilter !== 'all' ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0) + (priorityFilter !== 'all' ? 1 : 0) + (dateRangeFilter !== 'all_time' ? 1 : 0);

  const headerButtonStyle = {
    background: 'none',
    border: 'none',
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: '12px',
    letterSpacing: '0.1em',
    color: DARK_THEME.textMuted,
    cursor: 'pointer',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  };

  // Grid columns with checkbox (added REPORTER column after DEPARTMENT)
  const gridColumns = canBulkAction
    ? '40px 110px 1fr 130px 130px 130px 100px 110px 110px 120px'
    : '110px 1fr 130px 130px 130px 100px 110px 110px 120px';

  return (
    <div style={{ flex: 1, padding: '32px', overflowY: 'auto', backgroundColor: 'transparent' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '30px', fontWeight: 700, letterSpacing: '0.1em', color: DARK_THEME.text, margin: '0 0 6px 0' }}>
            INCIDENT MANAGEMENT
          </h1>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', letterSpacing: '0.1em', color: DARK_THEME.textMuted }}>
            {filteredIncidents.length} OF {incidents.length} INCIDENTS DISPLAYED
            {dateRangeFilter !== 'all_time' && (
              <span style={{ marginLeft: '12px', color: DARK_THEME.electric }}>
                • {getDateRangeLabel(dateRangeFilter, customDateFrom ? parseDateInput(customDateFrom)?.getTime() : null, customDateTo ? parseDateInput(customDateTo)?.getTime() : null)}
              </span>
            )}
          </span>
        </div>
        {onNewIncident && <motion.button
          onClick={onNewIncident}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{
            padding: '14px 24px',
            background: `linear-gradient(135deg, ${DARK_THEME.navy}, ${DARK_THEME.electric}40)`,
            border: `1px solid ${DARK_THEME.electric}`,
            borderRadius: '10px',
            fontFamily: 'Rajdhani, sans-serif',
            fontWeight: 600,
            fontSize: '15px',
            letterSpacing: '0.1em',
            color: DARK_THEME.electric,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: `0 0 20px ${DARK_THEME.glow}`,
          }}
        >
          <Plus size={18} />
          NEW INCIDENT
        </motion.button>}
      </div>

      {/* ── Quick Stats Row ── */}
      <div style={{ display: 'flex', gap: '14px', marginBottom: '24px' }}>
        <MiniStatCard label="NEW" value={newCount} color={DARK_THEME.electric} icon={Activity} />
        <MiniStatCard label="IN PROGRESS" value={inProgressCount} color={DARK_THEME.gold} icon={Clock} />
        <MiniStatCard label="ESCALATED" value={escalatedCount} color={DARK_THEME.danger} icon={AlertTriangle} />
        <MiniStatCard label="RESOLVED" value={resolvedCount} color={DARK_THEME.success} icon={Shield} />
        <MiniStatCard label="CLOSED" value={closedCount} color={DARK_THEME.textMuted} icon={FileText} />
      </div>

      {/* ── Bulk Action Toolbar ── */}
      <AnimatePresence>
        {selectedIds.size > 0 && canBulkAction && (
          <BulkActionToolbar
            selectedCount={selectedIds.size}
            hiddenCount={selectedHiddenCount}
            onClearSelection={clearSelection}
            onAssign={handleBulkAssign}
            onChangePriority={handleBulkPriorityChange}
            onDelete={() => setShowDeleteDialog(true)}
            canDelete={canDelete}
            isProcessing={isProcessing}
            progressText={progressText}
            agents={agents}
          />
        )}
      </AnimatePresence>

      {/* ── Search & Filter Bar ── */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '16px',
        padding: '16px 20px',
        backgroundColor: DARK_THEME.surface,
        border: `1px solid ${DARK_THEME.border}`,
        borderRadius: '10px',
        flexWrap: 'wrap',
        alignItems: 'center',
      }}>
        <div style={{ flex: 1, minWidth: '280px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: DARK_THEME.textMuted }} />
          <input
            data-search-input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ID or title..."
            style={{
              width: '100%',
              padding: '12px 16px 12px 44px',
              backgroundColor: 'rgba(79, 195, 247, 0.04)',
              border: `1px solid ${DARK_THEME.border}`,
              borderRadius: '8px',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '15px',
              color: DARK_THEME.text,
              outline: 'none',
            }}
          />
        </div>

        {/* FILTERS Toggle Button */}
        <motion.button
          onClick={() => setShowFilters(!showFilters)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{
            padding: '12px 18px',
            backgroundColor: showFilters || activeFilterCount > 0 ? `${DARK_THEME.electric}15` : 'transparent',
            border: `1px solid ${showFilters || activeFilterCount > 0 ? DARK_THEME.electric : DARK_THEME.border}`,
            borderRadius: '8px',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '12px',
            color: showFilters || activeFilterCount > 0 ? DARK_THEME.electric : DARK_THEME.textMuted,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            position: 'relative',
          }}
        >
          <SlidersHorizontal size={14} />
          FILTERS
          {activeFilterCount > 0 && (
            <span style={{
              minWidth: '18px',
              height: '18px',
              borderRadius: '9px',
              backgroundColor: DARK_THEME.electric,
              color: DARK_THEME.bg,
              fontSize: '10px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: '2px',
            }}>
              {activeFilterCount}
            </span>
          )}
        </motion.button>

        {(searchQuery || ownershipFilter !== 'all' || statusFilter !== 'all' || priorityFilter !== 'all' || dateRangeFilter !== 'all_time') && (
          <motion.button
            onClick={() => { setSearchQuery(''); setOwnershipFilter('all'); setStatusFilter('all'); setPriorityFilter('all'); setDateRangeFilter('all_time'); setCustomDateFrom(''); setCustomDateTo(''); }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              padding: '12px 18px',
              backgroundColor: 'transparent',
              border: `1px solid ${DARK_THEME.border}`,
              borderRadius: '8px',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '12px',
              color: DARK_THEME.textMuted,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <RefreshCw size={14} />
            RESET
          </motion.button>
        )}
      </div>

      {/* ── Filter Bar — Collapsible with slide animation ── */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: '16px' }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '16px 20px',
              background: `linear-gradient(135deg, ${DARK_THEME.surface} 0%, rgba(27, 42, 107, 0.15) 100%)`,
              borderRadius: '8px',
              border: `1px solid ${DARK_THEME.border}`,
              flexWrap: 'wrap',
            }}>
              {/* OWNERSHIP Filter Group */}
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', letterSpacing: '0.15em', color: DARK_THEME.textMuted, marginRight: '4px' }}>
                OWNERSHIP:
              </span>
              <FilterChip label="ALL" isActive={ownershipFilter === 'all'} color={DARK_THEME.electric} onClick={() => setOwnershipFilter('all')} />
              <FilterChip label="MY TICKETS" isActive={ownershipFilter === 'mine'} color={DARK_THEME.success} onClick={() => setOwnershipFilter('mine')} />
              <FilterChip label="UNASSIGNED" isActive={ownershipFilter === 'unassigned'} color={DARK_THEME.warning} onClick={() => setOwnershipFilter('unassigned')} />

              {/* Separator */}
              <div style={{ width: '1px', height: '24px', backgroundColor: DARK_THEME.border, margin: '0 8px' }} />

              {/* STATUS Filter Group */}
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', letterSpacing: '0.15em', color: DARK_THEME.textMuted, marginRight: '4px' }}>
                STATUS:
              </span>
              {['all', 'new', 'in_progress', 'escalated', 'resolved', 'closed'].map((status) => (
                <FilterChip
                  key={status}
                  label={status === 'all' ? 'ALL' : statusLabels[status]}
                  isActive={statusFilter === status}
                  color={status === 'all' ? DARK_THEME.electric : (statusColors[status] || DARK_THEME.electric)}
                  onClick={() => setStatusFilter(status)}
                />
              ))}

              {/* Separator */}
              <div style={{ width: '1px', height: '24px', backgroundColor: DARK_THEME.border, margin: '0 8px' }} />

              {/* PRIORITY Filter Group */}
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', letterSpacing: '0.15em', color: DARK_THEME.textMuted, marginRight: '4px' }}>
                PRIORITY:
              </span>
              {['all', 'critical', 'high', 'medium', 'low'].map((priority) => (
                <FilterChip
                  key={priority}
                  label={priority.toUpperCase()}
                  isActive={priorityFilter === priority}
                  color={priority === 'all' ? DARK_THEME.electric : (priorityColors[priority] || DARK_THEME.electric)}
                  onClick={() => setPriorityFilter(priority)}
                />
              ))}

              {/* Separator */}
              <div style={{ width: '1px', height: '24px', backgroundColor: DARK_THEME.border, margin: '0 8px' }} />

              {/* DATE RANGE Filter Group */}
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', letterSpacing: '0.15em', color: DARK_THEME.textMuted, marginRight: '4px' }}>
                DATE:
              </span>
              {[
                { value: 'all_time', label: 'ALL TIME' },
                { value: 'today', label: 'TODAY' },
                { value: 'this_week', label: 'THIS WEEK' },
                { value: 'this_month', label: 'THIS MONTH' },
                { value: 'last_30_days', label: 'LAST 30 DAYS' },
                { value: 'custom', label: 'CUSTOM' },
              ].map((range) => (
                <FilterChip
                  key={range.value}
                  label={range.label}
                  isActive={dateRangeFilter === range.value}
                  color={DARK_THEME.electric}
                  onClick={() => {
                    setDateRangeFilter(range.value);
                    if (range.value !== 'custom') {
                      setCustomDateFrom('');
                      setCustomDateTo('');
                    }
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Date Picker — Shown below filter bar when CUSTOM is selected and filters are visible */}
      <AnimatePresence>
        {showFilters && dateRangeFilter === 'custom' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden', marginBottom: '16px' }}
          >
            <div style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'center',
              padding: '14px 20px',
              background: `linear-gradient(135deg, ${DARK_THEME.surface} 0%, rgba(27, 42, 107, 0.10) 100%)`,
              border: `1px solid ${DARK_THEME.border}`,
              borderRadius: '8px',
              flexWrap: 'wrap',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={13} style={{ color: DARK_THEME.electric }} />
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', letterSpacing: '0.15em', color: DARK_THEME.textMuted }}>FROM</span>
                <input
                  type="text"
                  value={customDateFrom}
                  onChange={(e) => setCustomDateFrom(e.target.value)}
                  placeholder="DD/MM/YYYY"
                  style={{
                    width: '100px',
                    padding: '6px 10px',
                    backgroundColor: DARK_THEME.surface,
                    border: `1px solid ${customDateFrom && !parseDateInput(customDateFrom) ? DARK_THEME.danger : DARK_THEME.border}`,
                    borderRadius: '5px',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '11px',
                    color: DARK_THEME.text,
                    outline: 'none',
                    textAlign: 'center',
                  }}
                />
              </div>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: DARK_THEME.textMuted }}>—</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', letterSpacing: '0.15em', color: DARK_THEME.textMuted }}>TO</span>
                <input
                  type="text"
                  value={customDateTo}
                  onChange={(e) => setCustomDateTo(e.target.value)}
                  placeholder="DD/MM/YYYY"
                  style={{
                    width: '100px',
                    padding: '6px 10px',
                    backgroundColor: DARK_THEME.surface,
                    border: `1px solid ${customDateTo && !parseDateInput(customDateTo) ? DARK_THEME.danger : DARK_THEME.border}`,
                    borderRadius: '5px',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '11px',
                    color: DARK_THEME.text,
                    outline: 'none',
                    textAlign: 'center',
                  }}
                />
              </div>
              {(customDateFrom || customDateTo) && (
                <motion.button
                  onClick={() => { setCustomDateFrom(''); setCustomDateTo(''); }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    padding: '5px 10px',
                    backgroundColor: 'transparent',
                    border: `1px solid ${DARK_THEME.border}`,
                    borderRadius: '4px',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '9px',
                    color: DARK_THEME.textMuted,
                    cursor: 'pointer',
                  }}
                >
                  CLEAR
                </motion.button>
              )}
            </div>
            {((customDateFrom && !parseDateInput(customDateFrom)) || (customDateTo && !parseDateInput(customDateTo))) && (
              <div style={{
                marginTop: '6px',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '9px',
                color: DARK_THEME.danger,
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}>
                <AlertTriangle size={11} />
                Invalid date format. Use DD/MM/YYYY
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Table ── */}
      <div style={{
        backgroundColor: DARK_THEME.surface,
        border: `1px solid ${DARK_THEME.border}`,
        borderRadius: '12px',
        overflow: 'hidden',
      }}>
        {/* Accent bar */}
        <div style={{ height: '4px', background: `linear-gradient(90deg, ${DARK_THEME.electric} 0%, ${DARK_THEME.electric2} 50%, transparent 100%)` }} />

        {/* Table Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: gridColumns,
          gap: '12px',
          padding: '16px 28px',
          backgroundColor: 'rgba(79, 195, 247, 0.04)',
          borderBottom: `1px solid ${DARK_THEME.border}`,
        }}>
          {canBulkAction && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <StyledCheckbox
                checked={allVisibleSelected}
                indeterminate={someSelected && !allVisibleSelected}
                onChange={toggleSelectAll}
                disabled={filteredIncidents.length === 0}
              />
            </div>
          )}
          <button onClick={() => handleSort('id')} style={headerButtonStyle}>ID <SortIcon field="id" /></button>
          <button onClick={() => handleSort('title')} style={headerButtonStyle}>TITLE <SortIcon field="title" /></button>
          <button onClick={() => handleSort('department')} style={headerButtonStyle}>DEPARTMENT <SortIcon field="department" /></button>
          <button onClick={() => handleSort('reporter_name')} style={headerButtonStyle}>REPORTER <SortIcon field="reporter_name" /></button>
          <button onClick={() => handleSort('assignee_name')} style={headerButtonStyle}>ASSIGNED TO <SortIcon field="assignee_name" /></button>
          <button onClick={() => handleSort('priority')} style={headerButtonStyle}>PRIORITY <SortIcon field="priority" /></button>
          <button onClick={() => handleSort('status')} style={headerButtonStyle}>STATUS <SortIcon field="status" /></button>
          <button onClick={() => handleSort('created_at')} style={headerButtonStyle}>CREATED <SortIcon field="created_at" /></button>
          <span style={{ ...headerButtonStyle, cursor: 'default', justifyContent: 'center' }}>ACTIONS</span>
        </div>

        {/* Table Body */}
        <div style={{ maxHeight: 'calc(100vh - 457px)', overflowY: 'auto' }}>
          {filteredIncidents.length === 0 ? (
            <div style={{ padding: '56px 28px', textAlign: 'center' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: `${DARK_THEME.textMuted}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <AlertTriangle size={24} style={{ color: DARK_THEME.textMuted }} />
              </div>
              <p style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '18px', color: DARK_THEME.text, margin: '0 0 6px 0' }}>NO INCIDENTS FOUND</p>
              <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: DARK_THEME.textMuted, margin: 0 }}>
                Try adjusting your search or filter criteria
              </p>
            </div>
          ) : (
            paginatedIncidents.map((incident, index) => {
              const isSelected = selectedIds.has(incident.id);
              return (
                <motion.div
                  key={incident.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.02 }}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: gridColumns,
                    gap: '12px',
                    padding: '18px 28px',
                    backgroundColor: isSelected
                      ? `${DARK_THEME.electric}08`
                      : index % 2 === 0 ? 'transparent' : 'rgba(79, 195, 247, 0.02)',
                    borderBottom: `1px solid ${DARK_THEME.gridLine}`,
                    borderLeft: isSelected ? `3px solid ${DARK_THEME.electric}` : '3px solid transparent',
                    alignItems: 'center',
                    transition: 'background-color 0.2s, border-left-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(79, 195, 247, 0.06)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = index % 2 === 0 ? 'transparent' : 'rgba(79, 195, 247, 0.02)';
                  }}
                >
                  {/* Checkbox */}
                  {canBulkAction && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <StyledCheckbox
                        checked={isSelected}
                        onChange={() => toggleSelect(incident.id)}
                      />
                    </div>
                  )}

                  {/* ID */}
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', fontWeight: 600, color: DARK_THEME.electric }}>
                    {incident.id}
                  </span>

                  {/* Title */}
                  <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', fontWeight: 600, color: DARK_THEME.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {incident.title}
                  </span>

                  {/* Department */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <Building2 size={14} style={{ color: DARK_THEME.textMuted, flexShrink: 0 }} />
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', letterSpacing: '0.05em', color: DARK_THEME.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {(incident.department || 'unassigned').toUpperCase().replace('-', ' ')}
                    </span>
                  </div>

                  {/* Reporter */}
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {incident.reporter_name ? (
                      <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: DARK_THEME.text }}>
                        {incident.reporter_name}
                      </span>
                    ) : (
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: DARK_THEME.textMuted }}>—</span>
                    )}
                  </div>

                  {/* Assigned To */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px', overflow: 'hidden' }}>
                    <User size={14} style={{ color: incident.assignee_name ? DARK_THEME.electric : DARK_THEME.textMuted, flexShrink: 0 }} />
                    <span style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '12px',
                      letterSpacing: '0.05em',
                      color: incident.assignee_name ? DARK_THEME.text : DARK_THEME.textMuted,
                      fontStyle: incident.assignee_name ? 'normal' : 'italic',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {incident.assignee_name || 'UNASSIGNED'}
                    </span>
                  </div>

                  {/* Priority Badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: priorityColors[incident.priority], boxShadow: `0 0 6px ${priorityColors[incident.priority]}`, flexShrink: 0 }} />
                    <span style={{
                      padding: '5px 10px',
                      backgroundColor: `${priorityColors[incident.priority]}15`,
                      border: `1px solid ${priorityColors[incident.priority]}40`,
                      borderRadius: '5px',
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '11px',
                      letterSpacing: '0.05em',
                      color: priorityColors[incident.priority],
                    }}>
                      {(incident.priority ?? '').toUpperCase()}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <span style={{
                    padding: '5px 10px',
                    backgroundColor: `${statusColors[incident.status || 'new']}15`,
                    border: `1px solid ${statusColors[incident.status || 'new']}40`,
                    borderRadius: '5px',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '11px',
                    letterSpacing: '0.05em',
                    color: statusColors[incident.status || 'new'],
                    textAlign: 'center',
                  }}>
                    {statusLabels[incident.status || 'new']}
                  </span>

                  {/* Created */}
                  <SmartTimestamp timestamp={incident.created_at} />

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                    <motion.button onClick={() => onViewIncident(incident)} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                      style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(79, 195, 247, 0.04)', border: `1px solid ${DARK_THEME.border}`, borderRadius: '6px', cursor: 'pointer', transition: 'all 0.15s' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(79, 195, 247, 0.12)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(79, 195, 247, 0.04)'}
                      title="View Details">
                      <Eye size={16} style={{ color: DARK_THEME.textMuted }} />
                    </motion.button>
                    {onEditIncident && <motion.button onClick={() => onEditIncident(incident)} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                      style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(79, 195, 247, 0.04)', border: `1px solid ${DARK_THEME.electric}30`, borderRadius: '6px', cursor: 'pointer', transition: 'all 0.15s' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(79, 195, 247, 0.12)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(79, 195, 247, 0.04)'}
                      title="Edit Incident">
                      <FileText size={16} style={{ color: DARK_THEME.electric }} />
                    </motion.button>}
                    {onDeleteIncident && (userRole === 'owner' || !['resolved', 'closed'].includes(incident.status)) && <motion.button onClick={() => onDeleteIncident(incident)} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                      style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(239, 68, 68, 0.04)', border: `1px solid ${DARK_THEME.danger}30`, borderRadius: '6px', cursor: 'pointer', transition: 'all 0.15s' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.12)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.04)'}
                      title="Delete Incident">
                      <Trash2 size={16} style={{ color: DARK_THEME.danger }} />
                    </motion.button>}
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: `1px solid ${DARK_THEME.border}`, backgroundColor: 'rgba(79, 195, 247, 0.02)', flexShrink: 0 }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: DARK_THEME.textMuted }}>
              Showing {((currentPage - 1) * pageSize) + 1}–{Math.min(currentPage * pageSize, totalCount)} of {totalCount}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <motion.button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} whileHover={{ scale: currentPage === 1 ? 1 : 1.05 }} whileTap={{ scale: currentPage === 1 ? 1 : 0.95 }} style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent', border: `1px solid ${DARK_THEME.border}`, borderRadius: '8px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.4 : 1 }}>
                <ChevronLeft size={16} style={{ color: DARK_THEME.textMuted }} />
              </motion.button>
              <div style={{ padding: '8px 16px', backgroundColor: DARK_THEME.navy, border: `1px solid ${DARK_THEME.electric}`, borderRadius: '8px', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: DARK_THEME.electric }}>{currentPage} / {totalPages}</div>
              <motion.button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} whileHover={{ scale: currentPage === totalPages ? 1 : 1.05 }} whileTap={{ scale: currentPage === totalPages ? 1 : 0.95 }} style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent', border: `1px solid ${DARK_THEME.border}`, borderRadius: '8px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.4 : 1 }}>
                <ChevronRight size={16} style={{ color: DARK_THEME.textMuted }} />
              </motion.button>
            </div>
          </div>
        )}
      </div>

      {/* ── Dialogs ── */}
      <AnimatePresence>
        {showDeleteDialog && (
          <BulkDeleteDialog
            isOpen={showDeleteDialog}
            onClose={() => setShowDeleteDialog(false)}
            onConfirm={handleBulkDelete}
            onConfirmOpenOnly={handleBulkDeleteOpenOnly}
            selectedIncidents={getSelectedIncidents()}
            isLoading={isProcessing}
            isOwner={userRole === 'owner'}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default IncidentsPage;
