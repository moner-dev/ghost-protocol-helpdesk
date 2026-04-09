/**
 * GHOST PROTOCOL — Audit Log Page
 *
 * Dedicated security operations log viewer.
 * Displays all system audit events with filtering, pagination, and cleanup.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ScrollText, LogIn, LogOut, UserCheck, UserX, Shield, Trash2, RefreshCw,
  ChevronDown, ChevronLeft, ChevronRight, Clock, User, Filter, Search,
  X, Database, Download, Upload, FileText, AlertCircle, AlertTriangle, Activity, FileSpreadsheet, FileDown
} from 'lucide-react';
import { DARK_THEME } from '@/constants/theme';
import { exportAuditLogExcel, exportAuditLogPDF } from '@/utils/exportAuditLog';
import { useToast } from '@/hooks/useToast';

const isElectron = typeof window !== 'undefined' && window.electronAPI?.audit;

// ═══════════════════════════════════════════════════════════════════════════
// EVENT TYPE CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const EVENT_CONFIG = {
  login: { icon: LogIn, color: DARK_THEME.electric, label: 'LOGIN', category: 'auth' },
  logout: { icon: LogOut, color: DARK_THEME.electric2, label: 'LOGOUT', category: 'auth' },
  login_failed: { icon: LogIn, color: DARK_THEME.danger, label: 'LOGIN FAILED', category: 'auth' },
  login_blocked: { icon: LogIn, color: DARK_THEME.warning, label: 'LOGIN BLOCKED', category: 'auth' },
  user_registered: { icon: User, color: DARK_THEME.gold, label: 'USER REGISTERED', category: 'user' },
  user_status_changed: { icon: UserCheck, color: DARK_THEME.gold, label: 'STATUS CHANGED', category: 'user' },
  user_role_changed: { icon: Shield, color: DARK_THEME.gold, label: 'ROLE CHANGED', category: 'user' },
  user_department_changed: { icon: User, color: DARK_THEME.gold, label: 'DEPT CHANGED', category: 'user' },
  user_deleted: { icon: UserX, color: DARK_THEME.danger, label: 'USER DELETED', category: 'user' },
  incident_created: { icon: FileText, color: DARK_THEME.success, label: 'TICKET CREATED', category: 'incident' },
  incident_updated: { icon: FileText, color: DARK_THEME.success, label: 'TICKET UPDATED', category: 'incident' },
  incident_deleted: { icon: Trash2, color: DARK_THEME.danger, label: 'TICKET DELETED', category: 'incident' },
  database_backup: { icon: Download, color: DARK_THEME.textMuted, label: 'BACKUP CREATED', category: 'system' },
  database_restored: { icon: Upload, color: DARK_THEME.warning, label: 'DB RESTORED', category: 'system' },
  database_exported: { icon: Database, color: DARK_THEME.textMuted, label: 'DATA EXPORTED', category: 'system' },
  audit_log_exported: { icon: FileDown, color: DARK_THEME.textMuted, label: 'AUDIT EXPORTED', category: 'system' },
  audit_log_cleaned: { icon: Trash2, color: DARK_THEME.danger, label: 'AUDIT CLEANED', category: 'system' },
};

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function formatTimestamp(ts) {
  const date = new Date(ts);
  return date.toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

function formatRelativeTime(ts) {
  const date = new Date(ts);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function FilterDropdown({ label, value, options, onChange, icon: Icon }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setIsOpen(!isOpen)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', backgroundColor: value ? `${DARK_THEME.electric}15` : 'transparent', border: `1px solid ${value ? DARK_THEME.electric : DARK_THEME.border}`, borderRadius: '8px', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', letterSpacing: '0.05em', color: value ? DARK_THEME.electric : DARK_THEME.textMuted, cursor: 'pointer', minWidth: '140px', justifyContent: 'space-between' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Icon size={12} />{value ? options.find((o) => o.value === value)?.label || value : label}</span>
        <ChevronDown size={12} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <>
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 40 }} onClick={() => setIsOpen(false)} />
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} style={{ position: 'absolute', top: '100%', left: 0, marginTop: '4px', backgroundColor: DARK_THEME.surface, border: `1px solid ${DARK_THEME.border}`, borderRadius: '8px', padding: '6px', minWidth: '180px', zIndex: 50, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
              <button onClick={() => { onChange(null); setIsOpen(false); }} style={{ display: 'block', width: '100%', padding: '10px 14px', backgroundColor: !value ? `${DARK_THEME.electric}15` : 'transparent', border: 'none', borderRadius: '6px', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: DARK_THEME.textMuted, cursor: 'pointer', textAlign: 'left' }}>ALL</button>
              {options.map((opt) => (
                <button key={opt.value} onClick={() => { onChange(opt.value); setIsOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 14px', backgroundColor: value === opt.value ? `${opt.color || DARK_THEME.electric}15` : 'transparent', border: 'none', borderRadius: '6px', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: opt.color || DARK_THEME.text, cursor: 'pointer', textAlign: 'left' }}>
                  {opt.icon && <opt.icon size={12} />}{opt.label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function EventBadge({ eventType }) {
  const config = EVENT_CONFIG[eventType] || { icon: Activity, color: DARK_THEME.textMuted, label: eventType?.toUpperCase() || 'UNKNOWN' };
  const Icon = config.icon;
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 10px', backgroundColor: `${config.color}15`, border: `1px solid ${config.color}30`, borderRadius: '6px' }}>
      <Icon size={12} style={{ color: config.color }} />
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', letterSpacing: '0.05em', color: config.color, fontWeight: 500 }}>{config.label}</span>
    </div>
  );
}

function StyledCheckbox({ checked, indeterminate, onChange }) {
  return (
    <div
      onClick={(e) => { e.stopPropagation(); onChange(!checked); }}
      style={{
        width: '18px', height: '18px', borderRadius: '4px', cursor: 'pointer',
        border: `1.5px solid ${checked || indeterminate ? DARK_THEME.electric : DARK_THEME.border}`,
        backgroundColor: checked || indeterminate ? `${DARK_THEME.electric}20` : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        transition: 'all 0.15s',
      }}
    >
      {checked && <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: DARK_THEME.electric }} />}
      {indeterminate && !checked && <div style={{ width: '10px', height: '2px', borderRadius: '1px', backgroundColor: DARK_THEME.electric }} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CONFIRMATION DIALOGS
// ═══════════════════════════════════════════════════════════════════════════

function CleanSelectedDialog({ isOpen, onClose, count, eventSummary, onConfirm, isLoading }) {
  if (!isOpen) return null;
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
          onClick={(e) => e.stopPropagation()}
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
              DELETE {count} ENTR{count === 1 ? 'Y' : 'IES'}?
            </h2>

            <p style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '14px',
              color: DARK_THEME.textMuted,
              margin: '0 0 16px',
            }}>
              The following audit entries will be permanently deleted:
            </p>

            {eventSummary.length > 0 && (
              <div style={{
                maxHeight: '120px',
                overflowY: 'auto',
                backgroundColor: 'rgba(239, 68, 68, 0.05)',
                border: `1px solid ${DARK_THEME.danger}20`,
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '12px',
              }}>
                {eventSummary.map((s) => (
                  <div
                    key={s.type}
                    style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '12px',
                      color: DARK_THEME.danger,
                      padding: '4px 0',
                      borderBottom: `1px solid ${DARK_THEME.danger}10`,
                    }}
                  >
                    {s.label} — {s.count}
                  </div>
                ))}
              </div>
            )}

            <p style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '13px',
              color: DARK_THEME.danger,
              margin: 0,
            }}>
              This action cannot be undone.
            </p>
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
              {isLoading ? 'DELETING...' : `DELETE ${count}`}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </>
  );
}

function CleanAllDialog({ isOpen, onClose, totalCount, onConfirm, isLoading }) {
  const [confirmText, setConfirmText] = useState('');
  useEffect(() => { if (isOpen) setConfirmText(''); }, [isOpen]);
  if (!isOpen) return null;
  const canConfirm = confirmText === 'CONFIRM';
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
          onClick={(e) => e.stopPropagation()}
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
              DELETE ALL AUDIT LOGS?
            </h2>

            <p style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '14px',
              color: DARK_THEME.textMuted,
              margin: '0 0 16px',
            }}>
              All audit entries will be permanently erased.
            </p>

            <div style={{
              backgroundColor: 'rgba(239, 68, 68, 0.05)',
              border: `1px solid ${DARK_THEME.danger}20`,
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '16px',
            }}>
              <div style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '12px',
                color: DARK_THEME.danger,
              }}>
                {totalCount.toLocaleString()} entries selected
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{
                display: 'block',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '10px',
                letterSpacing: '0.15em',
                color: DARK_THEME.textMuted,
                marginBottom: '8px',
              }}>
                TYPE "CONFIRM" TO PROCEED
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                placeholder="CONFIRM"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  boxSizing: 'border-box',
                  backgroundColor: 'rgba(79, 195, 247, 0.04)',
                  border: `1px solid ${canConfirm ? DARK_THEME.danger : DARK_THEME.border}`,
                  borderRadius: '6px',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '14px',
                  letterSpacing: '0.2em',
                  color: DARK_THEME.text,
                  outline: 'none',
                  textAlign: 'center',
                  transition: 'border-color 0.2s',
                }}
              />
            </div>

            <p style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '13px',
              color: DARK_THEME.danger,
              margin: 0,
            }}>
              This action cannot be undone.
            </p>
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
              disabled={!canConfirm || isLoading}
              whileHover={{ scale: (!canConfirm || isLoading) ? 1 : 1.02 }}
              whileTap={{ scale: (!canConfirm || isLoading) ? 1 : 0.98 }}
              style={{
                padding: '12px 28px',
                backgroundColor: canConfirm ? DARK_THEME.danger : 'transparent',
                border: `1px solid ${canConfirm ? DARK_THEME.danger : DARK_THEME.border}`,
                borderRadius: '6px',
                fontFamily: 'Rajdhani, sans-serif',
                fontWeight: 600,
                fontSize: '14px',
                letterSpacing: '0.1em',
                color: canConfirm ? '#fff' : DARK_THEME.textMuted,
                cursor: (!canConfirm || isLoading) ? 'not-allowed' : 'pointer',
                opacity: !canConfirm ? 0.4 : (isLoading ? 0.7 : 1),
              }}
            >
              {isLoading ? 'DELETING...' : 'DELETE ALL'}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN AUDIT LOG PAGE
// ═══════════════════════════════════════════════════════════════════════════

function AuditLogPage({ currentUser }) {
  // Access control: only OWNER and ADMIN can view audit logs
  const hasAccess = currentUser?.role === 'owner' || currentUser?.role === 'admin';

  const [logs, setLogs] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const toast = useToast();

  // Block access for unauthorized roles
  if (!hasAccess) {
    return (
      <div style={{ flex: 1, padding: '32px', overflowY: 'auto', backgroundColor: 'transparent' }}>
        <div style={{ marginBottom: '36px' }}>
          <h1 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '30px', fontWeight: 700, letterSpacing: '0.1em', color: DARK_THEME.text, margin: '0 0 6px 0' }}>AUDIT LOG</h1>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', letterSpacing: '0.1em', color: DARK_THEME.textMuted }}>SYSTEM ACTIVITY & SECURITY EVENTS</span>
        </div>
        <div style={{ padding: '48px', backgroundColor: DARK_THEME.surface, border: `1px solid ${DARK_THEME.danger}40`, borderRadius: '12px', textAlign: 'center' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '50%',
            backgroundColor: `${DARK_THEME.danger}15`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <Shield size={28} style={{ color: DARK_THEME.danger }} />
          </div>
          <h2 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '22px', fontWeight: 600, color: DARK_THEME.text, margin: '0 0 12px' }}>ACCESS DENIED</h2>
          <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', color: DARK_THEME.textMuted, margin: 0 }}>
            Only OWNER and ADMIN roles can view the audit log.
          </p>
          <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: DARK_THEME.textMuted, marginTop: '8px' }}>
            Current role: <span style={{ color: DARK_THEME.warning }}>{(currentUser?.role || 'unknown').toUpperCase()}</span>
          </p>
        </div>
      </div>
    );
  }

  const agentName = currentUser?.display_name || currentUser?.username || 'AGENT';

  // Filters
  const [eventTypeFilter, setEventTypeFilter] = useState(null);
  const [performerFilter, setPerformerFilter] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  // Performers
  const [performers, setPerformers] = useState([]);

  // Selection
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Clean dialogs
  const [showCleanDropdown, setShowCleanDropdown] = useState(false);
  const [showCleanSelectedDialog, setShowCleanSelectedDialog] = useState(false);
  const [showCleanAllDialog, setShowCleanAllDialog] = useState(false);
  const [cleanLoading, setCleanLoading] = useState(false);

  const canClean = currentUser?.role === 'owner';

  const fetchLogs = useCallback(async () => {
    if (!isElectron) { setIsLoading(false); return; }
    setIsLoading(true);
    try {
      const options = { limit: pageSize, offset: (currentPage - 1) * pageSize };
      if (eventTypeFilter) options.eventType = eventTypeFilter;
      if (performerFilter) options.performedBy = performerFilter;
      if (searchQuery.trim()) options.searchQuery = searchQuery.trim();

      const [logsResult, countResult] = await Promise.all([
        window.electronAPI.audit.getLog(options, currentUser?.id),
        window.electronAPI.audit.getCount({ eventType: eventTypeFilter || undefined, performedBy: performerFilter || undefined, searchQuery: searchQuery.trim() || undefined }, currentUser?.id),
      ]);

      // Handle RBAC error response
      if (logsResult && logsResult.error) {
        console.error('Audit log access denied:', logsResult.error);
        setLogs([]);
        setTotalCount(0);
        return;
      }

      setLogs(Array.isArray(logsResult) ? logsResult : []);
      setTotalCount(typeof countResult === 'number' ? countResult : 0);

      // Fetch current users for the agent filter (not from log history)
      if (performers.length === 0 && window.electronAPI?.users?.getAll) {
        const users = await window.electronAPI.users.getAll();
        setPerformers(users.filter((u) => u.account_status === 'approved').map((u) => ({ id: u.id, name: u.display_name || u.username })));
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, eventTypeFilter, performerFilter, searchQuery, performers.length, currentUser]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  // Reset selection when filters/page change
  useEffect(() => { setSelectedIds(new Set()); }, [eventTypeFilter, performerFilter, searchQuery, currentPage]);

  useEffect(() => { setCurrentPage(1); }, [eventTypeFilter, performerFilter, searchQuery]);

  const handleClearFilters = () => { setEventTypeFilter(null); setPerformerFilter(null); setSearchQuery(''); setCurrentPage(1); };

  // Get current filter state for export
  const getExportFilters = () => ({
    eventType: eventTypeFilter,
    performedBy: performerFilter,
    performerName: performers.find((p) => p.id === performerFilter)?.name,
    searchQuery: searchQuery,
  });

  // Fetch all logs for export (respecting current filters including search)
  const fetchAllLogsForExport = async () => {
    if (!isElectron) return [];
    try {
      const options = { limit: 10000, offset: 0 };
      if (eventTypeFilter) options.eventType = eventTypeFilter;
      if (performerFilter) options.performedBy = performerFilter;
      if (searchQuery.trim()) options.searchQuery = searchQuery.trim();
      const allLogs = await window.electronAPI.audit.getLog(options, currentUser?.id);
      // Handle RBAC error response
      if (allLogs && allLogs.error) {
        console.error('Audit log export denied:', allLogs.error);
        return [];
      }
      return Array.isArray(allLogs) ? allLogs : [];
    } catch (err) {
      console.error('Failed to fetch logs for export:', err);
      return [];
    }
  };

  const handleExportExcel = async () => {
    setExportLoading(true);
    setShowExportDropdown(false);
    try {
      const logsToExport = await fetchAllLogsForExport();
      if (logsToExport.length === 0) {
        toast.error('No audit entries to export');
        setExportLoading(false);
        return;
      }
      const result = await exportAuditLogExcel(logsToExport, getExportFilters(), agentName);
      if (result.success) {
        toast.success(`Exported ${logsToExport.length} entries to ${result.filePath.split(/[\\/]/).pop()}`);
      } else if (!result.canceled) {
        toast.error(result.error || 'Export failed');
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportPDF = async () => {
    setExportLoading(true);
    setShowExportDropdown(false);
    try {
      const logsToExport = await fetchAllLogsForExport();
      if (logsToExport.length === 0) {
        toast.error('No audit entries to export');
        setExportLoading(false);
        return;
      }
      const result = await exportAuditLogPDF(logsToExport, getExportFilters(), agentName);
      if (result.success) {
        toast.success(`Exported ${logsToExport.length} entries to ${result.filePath.split(/[\\/]/).pop()}`);
      } else if (!result.canceled) {
        toast.error(result.error || 'Export failed');
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setExportLoading(false);
    }
  };

  // Selection helpers (search is now server-side, so filteredLogs = logs)
  // Safety guard: ensure filteredLogs is always an array
  const filteredLogs = Array.isArray(logs) ? logs : [];

  const allVisibleSelected = filteredLogs.length > 0 && filteredLogs.every((l) => selectedIds.has(l.id));
  const someSelected = filteredLogs.length > 0 && filteredLogs.some((l) => selectedIds.has(l.id));

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredLogs.map((l) => l.id)));
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // Clean handlers
  const handleCleanSelected = async () => {
    if (selectedIds.size === 0) return;
    setCleanLoading(true);
    try {
      const res = await window.electronAPI.audit.deleteSelected([...selectedIds], currentUser?.id, currentUser?.display_name);
      if (res.success) {
        toast.success(`${res.deleted} audit entries deleted`);
        setSelectedIds(new Set());
        fetchLogs();
      } else { toast.error(res.error || 'Delete failed'); }
    } catch (err) { console.error('Clean selected error:', err); toast.error(err?.message || 'Delete failed'); }
    setCleanLoading(false);
    setShowCleanSelectedDialog(false);
  };

  const handleCleanAll = async () => {
    setCleanLoading(true);
    try {
      const res = await window.electronAPI.audit.deleteAll(currentUser?.id, currentUser?.display_name);
      if (res.success) {
        toast.success(`${res.deleted} audit entries deleted`);
        setSelectedIds(new Set());
        fetchLogs();
      } else { toast.error(res.error || 'Delete failed'); }
    } catch (err) { console.error('Clean all error:', err); toast.error(err?.message || 'Delete failed'); }
    setCleanLoading(false);
    setShowCleanAllDialog(false);
  };

  // Event summary for selected entries
  const selectedEventSummary = () => {
    const counts = {};
    for (const log of filteredLogs) {
      if (selectedIds.has(log.id)) {
        const cfg = EVENT_CONFIG[log.event_type] || { label: log.event_type };
        counts[log.event_type] = counts[log.event_type] || { label: cfg.label, count: 0, type: log.event_type };
        counts[log.event_type].count++;
      }
    }
    return Object.values(counts);
  };

  const hasActiveFilters = eventTypeFilter || performerFilter || searchQuery;
  const totalPages = Math.ceil(totalCount / pageSize);

  const eventTypeOptions = [
    { value: 'login', label: 'LOGIN', icon: LogIn, color: DARK_THEME.electric },
    { value: 'logout', label: 'LOGOUT', icon: LogOut, color: DARK_THEME.electric2 },
    { value: 'login_failed', label: 'LOGIN FAILED', icon: LogIn, color: DARK_THEME.danger },
    { value: 'user_status_changed', label: 'STATUS CHANGED', icon: UserCheck, color: DARK_THEME.gold },
    { value: 'user_role_changed', label: 'ROLE CHANGED', icon: Shield, color: DARK_THEME.gold },
    { value: 'user_deleted', label: 'USER DELETED', icon: UserX, color: DARK_THEME.danger },
    { value: 'database_backup', label: 'BACKUP', icon: Download, color: DARK_THEME.textMuted },
    { value: 'audit_log_cleaned', label: 'AUDIT CLEANED', icon: Trash2, color: DARK_THEME.danger },
  ];

  const performerOptions = performers.map((p) => ({ value: p.id, label: p.name || p.id, color: DARK_THEME.text }));

  if (!isElectron) {
    return (
      <div style={{ flex: 1, padding: '32px', overflowY: 'auto', backgroundColor: 'transparent' }}>
        <div style={{ marginBottom: '36px' }}>
          <h1 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '30px', fontWeight: 700, letterSpacing: '0.1em', color: DARK_THEME.text, margin: '0 0 6px 0' }}>AUDIT LOG</h1>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', letterSpacing: '0.1em', color: DARK_THEME.textMuted }}>SYSTEM ACTIVITY & SECURITY EVENTS</span>
        </div>
        <div style={{ padding: '48px', backgroundColor: DARK_THEME.surface, border: `1px solid ${DARK_THEME.border}`, borderRadius: '12px', textAlign: 'center' }}>
          <AlertCircle size={40} style={{ color: DARK_THEME.warning, marginBottom: '16px' }} />
          <h2 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '22px', fontWeight: 600, color: DARK_THEME.text, margin: '0 0 12px' }}>ELECTRON RUNTIME REQUIRED</h2>
          <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', color: DARK_THEME.textMuted }}>Run with: npm run electron:dev</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, padding: '32px', overflowY: 'auto', backgroundColor: 'transparent', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexShrink: 0 }}>
        <div>
          <h1 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '30px', fontWeight: 700, letterSpacing: '0.1em', color: DARK_THEME.text, margin: '0 0 6px 0' }}>AUDIT LOG</h1>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', letterSpacing: '0.1em', color: DARK_THEME.textMuted }}>SYSTEM ACTIVITY & SECURITY EVENTS</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px', backgroundColor: DARK_THEME.surface, border: `1px solid ${DARK_THEME.border}`, borderRadius: '10px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: DARK_THEME.success, boxShadow: `0 0 8px ${DARK_THEME.success}`, animation: 'pulse 2s infinite' }} />
          <div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '20px', fontWeight: 700, color: DARK_THEME.electric }}>{totalCount.toLocaleString()}</div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', letterSpacing: '0.1em', color: DARK_THEME.textMuted }}>TOTAL EVENTS</div>
          </div>
          <motion.button onClick={fetchLogs} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} disabled={isLoading} title="Refresh" style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent', border: `1px solid ${DARK_THEME.border}`, borderRadius: '8px', cursor: isLoading ? 'not-allowed' : 'pointer', marginLeft: '8px' }}>
            <RefreshCw size={16} style={{ color: DARK_THEME.textMuted, animation: isLoading ? 'spin 1s linear infinite' : 'none' }} />
          </motion.button>

          {/* Export Dropdown */}
          <div style={{ position: 'relative' }}>
            <motion.button
              onClick={() => setShowExportDropdown(!showExportDropdown)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={exportLoading || logs.length === 0}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                backgroundColor: `${DARK_THEME.electric}10`,
                border: `1px solid ${DARK_THEME.electric}40`,
                borderRadius: '8px',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '11px',
                letterSpacing: '0.05em',
                color: DARK_THEME.electric,
                cursor: exportLoading || logs.length === 0 ? 'not-allowed' : 'pointer',
                opacity: logs.length === 0 ? 0.4 : 1,
              }}
            >
              <Download size={14} style={{ animation: exportLoading ? 'spin 1s linear infinite' : 'none' }} />
              EXPORT
              <ChevronDown size={12} style={{ transform: showExportDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </motion.button>
            <AnimatePresence>
              {showExportDropdown && (
                <>
                  <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 40 }} onClick={() => setShowExportDropdown(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    style={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      marginTop: '4px',
                      backgroundColor: DARK_THEME.surface,
                      border: `1px solid ${DARK_THEME.border}`,
                      borderRadius: '8px',
                      padding: '6px',
                      minWidth: '180px',
                      zIndex: 50,
                      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                    }}
                  >
                    <button
                      onClick={handleExportExcel}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        width: '100%',
                        padding: '10px 14px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderRadius: '6px',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '11px',
                        color: DARK_THEME.text,
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = `${DARK_THEME.electric}15`)}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <FileSpreadsheet size={14} style={{ color: DARK_THEME.success }} />
                      EXPORT AS EXCEL
                    </button>
                    <button
                      onClick={handleExportPDF}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        width: '100%',
                        padding: '10px 14px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderRadius: '6px',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '11px',
                        color: DARK_THEME.text,
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = `${DARK_THEME.electric}15`)}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <FileText size={14} style={{ color: DARK_THEME.danger }} />
                      EXPORT AS PDF
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Clean Button */}
          {canClean && (
            <div style={{ position: 'relative' }}>
              <motion.button
                onClick={() => setShowCleanDropdown(!showCleanDropdown)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', backgroundColor: `${DARK_THEME.danger}10`, border: `1px solid ${DARK_THEME.danger}40`, borderRadius: '8px', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', letterSpacing: '0.05em', color: DARK_THEME.danger, cursor: 'pointer' }}
              >
                <Trash2 size={14} /> CLEAN <ChevronDown size={12} />
              </motion.button>
              <AnimatePresence>
                {showCleanDropdown && (
                  <>
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 40 }} onClick={() => setShowCleanDropdown(false)} />
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} style={{ position: 'absolute', top: '100%', right: 0, marginTop: '4px', backgroundColor: DARK_THEME.surface, border: `1px solid ${DARK_THEME.border}`, borderRadius: '8px', padding: '6px', minWidth: '200px', zIndex: 50, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
                      <button
                        onClick={() => { if (selectedIds.size > 0) { setShowCleanDropdown(false); setShowCleanSelectedDialog(true); } }}
                        disabled={selectedIds.size === 0}
                        style={{ display: 'block', width: '100%', padding: '10px 14px', backgroundColor: 'transparent', border: 'none', borderRadius: '6px', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: selectedIds.size > 0 ? DARK_THEME.danger : DARK_THEME.textMuted, cursor: selectedIds.size > 0 ? 'pointer' : 'not-allowed', textAlign: 'left', opacity: selectedIds.size === 0 ? 0.4 : 1 }}
                      >
                        CLEAN SELECTED{selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}
                      </button>
                      <button
                        onClick={() => { setShowCleanDropdown(false); setShowCleanAllDialog(true); }}
                        style={{ display: 'block', width: '100%', padding: '10px 14px', backgroundColor: 'transparent', border: 'none', borderRadius: '6px', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: DARK_THEME.danger, cursor: 'pointer', textAlign: 'left' }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = `${DARK_THEME.danger}15`)}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        CLEAN ALL LOGS
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', backgroundColor: DARK_THEME.surface, border: `1px solid ${DARK_THEME.border}`, borderRadius: '12px', marginBottom: '20px', flexShrink: 0, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', backgroundColor: 'rgba(79, 195, 247, 0.04)', border: `1px solid ${DARK_THEME.border}`, borderRadius: '8px', flex: 1, minWidth: '200px', maxWidth: '300px' }}>
          <Search size={14} style={{ color: DARK_THEME.textMuted }} />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search events..." style={{ flex: 1, backgroundColor: 'transparent', border: 'none', outline: 'none', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: DARK_THEME.text }} />
          {searchQuery && <button onClick={() => setSearchQuery('')} style={{ backgroundColor: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}><X size={12} style={{ color: DARK_THEME.textMuted }} /></button>}
        </div>
        <div style={{ width: '1px', height: '28px', backgroundColor: DARK_THEME.border }} />
        <FilterDropdown label="EVENT TYPE" value={eventTypeFilter} options={eventTypeOptions} onChange={setEventTypeFilter} icon={Filter} />
        <FilterDropdown label="AGENT" value={performerFilter} options={performerOptions} onChange={setPerformerFilter} icon={User} />
        {hasActiveFilters && (
          <motion.button onClick={handleClearFilters} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 14px', backgroundColor: `${DARK_THEME.danger}15`, border: `1px solid ${DARK_THEME.danger}30`, borderRadius: '8px', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: DARK_THEME.danger, cursor: 'pointer' }}>
            <X size={12} /> CLEAR
          </motion.button>
        )}
      </div>

      {/* Main Table */}
      <div style={{ flex: 1, backgroundColor: DARK_THEME.surface, border: `1px solid ${DARK_THEME.border}`, borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Table Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '36px 180px 160px 140px 140px 1fr', gap: '16px', padding: '16px 24px', backgroundColor: 'rgba(79, 195, 247, 0.04)', borderBottom: `1px solid ${DARK_THEME.border}`, flexShrink: 0, alignItems: 'center' }}>
          {canClean && (
            <StyledCheckbox checked={allVisibleSelected} indeterminate={someSelected && !allVisibleSelected} onChange={toggleSelectAll} />
          )}
          {!canClean && <span />}
          {['TIMESTAMP', 'EVENT TYPE', 'AGENT', 'TARGET', 'DETAILS'].map((header) => (
            <span key={header} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', letterSpacing: '0.1em', color: DARK_THEME.textMuted }}>{header}</span>
          ))}
        </div>

        {/* Table Body */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {isLoading ? (
            <div style={{ padding: '48px', textAlign: 'center' }}><RefreshCw size={32} style={{ color: DARK_THEME.electric, animation: 'spin 1s linear infinite' }} /></div>
          ) : filteredLogs.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center' }}>
              <ScrollText size={32} style={{ color: DARK_THEME.textMuted, marginBottom: '12px' }} />
              <p style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '16px', color: DARK_THEME.text, margin: '0 0 4px' }}>NO EVENTS FOUND</p>
              <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: DARK_THEME.textMuted, margin: 0 }}>{hasActiveFilters ? 'Try adjusting your filters' : 'Audit events will appear here'}</p>
            </div>
          ) : (
            filteredLogs.map((log, index) => {
              const isExpanded = expandedRow === log.id;
              const isSelected = selectedIds.has(log.id);
              const config = EVENT_CONFIG[log.event_type] || { icon: Activity, color: DARK_THEME.textMuted };

              return (
                <React.Fragment key={log.id}>
                  <motion.div
                    onClick={() => setExpandedRow(isExpanded ? null : log.id)}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.01 }}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '36px 180px 160px 140px 140px 1fr',
                      gap: '16px',
                      padding: '16px 24px',
                      alignItems: 'center',
                      backgroundColor: isExpanded ? `${config.color}08` : index % 2 === 0 ? 'transparent' : 'rgba(79, 195, 247, 0.02)',
                      borderBottom: `1px solid ${DARK_THEME.gridLine}`,
                      borderLeft: isSelected ? `3px solid ${DARK_THEME.electric}` : '3px solid transparent',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s, border-left-color 0.15s',
                    }}
                    onMouseEnter={(e) => { if (!isExpanded) e.currentTarget.style.backgroundColor = 'rgba(79, 195, 247, 0.06)'; }}
                    onMouseLeave={(e) => { if (!isExpanded) e.currentTarget.style.backgroundColor = index % 2 === 0 ? 'transparent' : 'rgba(79, 195, 247, 0.02)'; }}
                  >
                    {canClean ? <StyledCheckbox checked={isSelected} onChange={() => toggleSelect(log.id)} /> : <span />}
                    <div>
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: DARK_THEME.text }}>{formatTimestamp(log.performed_at)}</div>
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: DARK_THEME.textMuted, marginTop: '2px' }}>{formatRelativeTime(log.performed_at)}</div>
                    </div>
                    <div><EventBadge eventType={log.event_type} /></div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: DARK_THEME.text }}>{log.performer_name || log.performed_by || '—'}</div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: DARK_THEME.electric }}>{log.target_name || log.target_id || '—'}</div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: DARK_THEME.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.old_value && log.new_value ? (<><span style={{ color: DARK_THEME.danger }}>{log.old_value}</span><span style={{ margin: '0 6px' }}>&rarr;</span><span style={{ color: DARK_THEME.success }}>{log.new_value}</span></>) : log.new_value ? <span>{log.new_value}</span> : '—'}
                    </div>
                  </motion.div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} style={{ overflow: 'hidden', backgroundColor: `${config.color}05`, borderBottom: `1px solid ${config.color}30` }}>
                        <div style={{ padding: '20px 24px 20px 84px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
                          {[{ label: 'EVENT ID', value: `#${log.id}` }, { label: 'TARGET TYPE', value: log.target_type?.toUpperCase() || '—' }, { label: 'TARGET ID', value: log.target_id || '—' }, { label: 'PERFORMER ID', value: log.performed_by || '—' }].map((item) => (
                            <div key={item.label}>
                              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', letterSpacing: '0.1em', color: DARK_THEME.textMuted, marginBottom: '6px' }}>{item.label}</div>
                              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', color: DARK_THEME.text }}>{item.value}</div>
                            </div>
                          ))}
                          {(log.old_value || log.new_value) && (
                            <>
                              <div>
                                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', letterSpacing: '0.1em', color: DARK_THEME.textMuted, marginBottom: '6px' }}>PREVIOUS VALUE</div>
                                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', color: log.old_value ? DARK_THEME.danger : DARK_THEME.textMuted }}>{log.old_value || '—'}</div>
                              </div>
                              <div>
                                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', letterSpacing: '0.1em', color: DARK_THEME.textMuted, marginBottom: '6px' }}>NEW VALUE</div>
                                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', color: log.new_value ? DARK_THEME.success : DARK_THEME.textMuted }}>{log.new_value || '—'}</div>
                              </div>
                            </>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </React.Fragment>
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

      {/* Dialogs */}
      <CleanSelectedDialog isOpen={showCleanSelectedDialog} onClose={() => setShowCleanSelectedDialog(false)} count={selectedIds.size} eventSummary={selectedEventSummary()} onConfirm={handleCleanSelected} isLoading={cleanLoading} />
      <CleanAllDialog isOpen={showCleanAllDialog} onClose={() => setShowCleanAllDialog(false)} totalCount={totalCount} onConfirm={handleCleanAll} isLoading={cleanLoading} />

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default AuditLogPage;
