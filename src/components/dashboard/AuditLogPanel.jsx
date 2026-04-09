/**
 * GHOST PROTOCOL — Audit Log Panel
 *
 * Displays system audit log with filtering capabilities.
 * Shows login/logout, user management, and other tracked events.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollText, LogIn, LogOut, UserCheck, UserX, Shield, Trash2, RefreshCw, ChevronDown, Clock, User, Filter } from 'lucide-react';
import { DARK_THEME } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';

const isElectron = typeof window !== 'undefined' && window.electronAPI?.audit;

const EVENT_CONFIG = {
  login: { icon: LogIn, color: DARK_THEME.success, label: 'LOGIN' },
  logout: { icon: LogOut, color: DARK_THEME.textMuted, label: 'LOGOUT' },
  login_failed: { icon: LogIn, color: DARK_THEME.danger, label: 'LOGIN FAILED' },
  login_blocked: { icon: LogIn, color: DARK_THEME.warning, label: 'LOGIN BLOCKED' },
  user_registered: { icon: User, color: DARK_THEME.electric, label: 'REGISTERED' },
  user_status_changed: { icon: UserCheck, color: DARK_THEME.gold, label: 'STATUS CHANGED' },
  user_role_changed: { icon: Shield, color: DARK_THEME.electric, label: 'ROLE CHANGED' },
  user_department_changed: { icon: User, color: DARK_THEME.electric2, label: 'DEPT CHANGED' },
  user_deleted: { icon: Trash2, color: DARK_THEME.danger, label: 'USER DELETED' },
};

function formatTimestamp(ts) {
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

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function AuditLogPanel() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const fetchLogs = useCallback(async () => {
    if (!isElectron) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const options = { limit: 50 };
      const userId = user?.id;

      // Helper to safely get logs array from response
      const safeLogs = (result) => {
        if (result && result.error) return [];
        return Array.isArray(result) ? result : [];
      };

      if (filter !== 'all') {
        if (filter === 'auth') {
          // Auth events - fetch separately and merge
          const [logins, logouts, failed, blocked] = await Promise.all([
            window.electronAPI.audit.getLog({ ...options, eventType: 'login' }, userId),
            window.electronAPI.audit.getLog({ ...options, eventType: 'logout' }, userId),
            window.electronAPI.audit.getLog({ ...options, eventType: 'login_failed' }, userId),
            window.electronAPI.audit.getLog({ ...options, eventType: 'login_blocked' }, userId),
          ]);
          const merged = [...safeLogs(logins), ...safeLogs(logouts), ...safeLogs(failed), ...safeLogs(blocked)]
            .sort((a, b) => new Date(b.performed_at) - new Date(a.performed_at))
            .slice(0, 50);
          setLogs(merged);
          setTotalCount(merged.length);
        } else {
          options.eventType = filter;
          const data = await window.electronAPI.audit.getLog(options, userId);
          const count = await window.electronAPI.audit.getCount({ eventType: filter }, userId);
          setLogs(safeLogs(data));
          setTotalCount(typeof count === 'number' ? count : 0);
        }
      } else {
        const data = await window.electronAPI.audit.getLog(options, userId);
        const count = await window.electronAPI.audit.getCount({}, userId);
        setLogs(safeLogs(data));
        setTotalCount(typeof count === 'number' ? count : 0);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  }, [filter, user]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filterOptions = [
    { id: 'all', label: 'ALL EVENTS' },
    { id: 'auth', label: 'AUTHENTICATION' },
    { id: 'user_status_changed', label: 'STATUS CHANGES' },
    { id: 'user_role_changed', label: 'ROLE CHANGES' },
    { id: 'user_deleted', label: 'DELETIONS' },
  ];

  if (!isElectron) {
    return (
      <div style={{
        padding: '32px',
        textAlign: 'center',
        backgroundColor: DARK_THEME.surface,
        border: `1px solid ${DARK_THEME.border}`,
        borderRadius: '12px',
      }}>
        <ScrollText size={32} style={{ color: DARK_THEME.textMuted, marginBottom: '12px' }} />
        <p style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '16px', color: DARK_THEME.text, margin: '0 0 4px' }}>
          AUDIT LOG UNAVAILABLE
        </p>
        <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: DARK_THEME.textMuted, margin: 0 }}>
          Requires Electron runtime
        </p>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: DARK_THEME.surface,
      border: `1px solid ${DARK_THEME.border}`,
      borderRadius: '12px',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 20px',
        borderBottom: `1px solid ${DARK_THEME.border}`,
        background: `linear-gradient(90deg, ${DARK_THEME.electric}08 0%, transparent 100%)`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ScrollText size={18} style={{ color: DARK_THEME.electric }} />
          <span style={{
            fontFamily: 'Rajdhani, sans-serif',
            fontSize: '16px',
            fontWeight: 600,
            letterSpacing: '0.1em',
            color: DARK_THEME.text,
          }}>
            AUDIT LOG
          </span>
          <span style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '10px',
            color: DARK_THEME.textMuted,
            padding: '2px 8px',
            backgroundColor: DARK_THEME.navy,
            borderRadius: '4px',
          }}>
            {totalCount} EVENTS
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {/* Filter Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowFilters(!showFilters)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 12px',
                backgroundColor: 'transparent',
                border: `1px solid ${DARK_THEME.border}`,
                borderRadius: '6px',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '11px',
                color: DARK_THEME.textMuted,
                cursor: 'pointer',
              }}
            >
              <Filter size={12} />
              {filterOptions.find((f) => f.id === filter)?.label}
              <ChevronDown size={12} />
            </button>

            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '4px',
                    backgroundColor: DARK_THEME.surface,
                    border: `1px solid ${DARK_THEME.border}`,
                    borderRadius: '8px',
                    padding: '6px',
                    minWidth: '160px',
                    zIndex: 50,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                  }}
                >
                  {filterOptions.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => { setFilter(opt.id); setShowFilters(false); }}
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: '8px 12px',
                        backgroundColor: filter === opt.id ? `${DARK_THEME.electric}15` : 'transparent',
                        border: 'none',
                        borderRadius: '4px',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '11px',
                        color: filter === opt.id ? DARK_THEME.electric : DARK_THEME.textMuted,
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Refresh Button */}
          <motion.button
            onClick={fetchLogs}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={isLoading}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '34px',
              height: '34px',
              backgroundColor: 'transparent',
              border: `1px solid ${DARK_THEME.border}`,
              borderRadius: '6px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.5 : 1,
            }}
          >
            <RefreshCw size={14} style={{ color: DARK_THEME.textMuted, animation: isLoading ? 'spin 1s linear infinite' : 'none' }} />
          </motion.button>
        </div>
      </div>

      {/* Log Entries */}
      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {isLoading ? (
          <div style={{ padding: '32px', textAlign: 'center' }}>
            <RefreshCw size={24} style={{ color: DARK_THEME.textMuted, animation: 'spin 1s linear infinite' }} />
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center' }}>
            <ScrollText size={24} style={{ color: DARK_THEME.textMuted, marginBottom: '8px' }} />
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: DARK_THEME.textMuted, margin: 0 }}>
              No audit events found
            </p>
          </div>
        ) : (
          logs.map((log, index) => {
            const config = EVENT_CONFIG[log.event_type] || { icon: ScrollText, color: DARK_THEME.textMuted, label: log.event_type.toUpperCase() };
            const Icon = config.icon;

            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.02 }}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '14px',
                  padding: '14px 20px',
                  borderBottom: `1px solid ${DARK_THEME.gridLine}`,
                  backgroundColor: index % 2 === 0 ? 'transparent' : 'rgba(79, 195, 247, 0.02)',
                }}
              >
                {/* Icon */}
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: `${config.color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Icon size={14} style={{ color: config.color }} />
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '10px',
                      letterSpacing: '0.05em',
                      color: config.color,
                      padding: '2px 6px',
                      backgroundColor: `${config.color}15`,
                      borderRadius: '4px',
                    }}>
                      {config.label}
                    </span>
                    {log.target_name && (
                      <span style={{
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: '13px',
                        color: DARK_THEME.text,
                      }}>
                        {log.target_name}
                      </span>
                    )}
                  </div>

                  {/* Value changes */}
                  {(log.old_value || log.new_value) && (
                    <div style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '11px',
                      color: DARK_THEME.textMuted,
                      marginBottom: '4px',
                    }}>
                      {log.old_value && log.new_value ? (
                        <>
                          <span style={{ color: DARK_THEME.danger }}>{log.old_value}</span>
                          <span style={{ margin: '0 6px' }}>&rarr;</span>
                          <span style={{ color: DARK_THEME.success }}>{log.new_value}</span>
                        </>
                      ) : log.new_value ? (
                        <span>{log.new_value}</span>
                      ) : null}
                    </div>
                  )}

                  {/* Meta */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '10px',
                    color: DARK_THEME.textMuted,
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={10} />
                      {formatTimestamp(log.performed_at)}
                    </span>
                    {log.performer_name && log.performer_name !== log.target_name && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <User size={10} />
                        by {log.performer_name}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* CSS for spinner animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default AuditLogPanel;
