import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Activity, Bell, ThumbsUp, ThumbsDown, AlertTriangle, Check, X as XIcon, FileText } from 'lucide-react';
import { DARK_THEME } from '@/constants/theme';
import MetricBadge from './MetricBadge';
import WindowControls from '@/components/shared/WindowControls';

function TopCommandBar({ user, metrics, onLogout, isMobile }) {
  const [time, setTime] = useState(new Date());
  const [uptime, setUptime] = useState(0);
  // Notification bell state (OWNER/ADMIN only)
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const notificationRef = useRef(null);
  const isAdminOrOwner = user?.role === 'owner' || user?.role === 'admin';

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
      setUptime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch unread count periodically for admin/owner
  useEffect(() => {
    if (!isAdminOrOwner || !window.electronAPI?.kb || !user?.id) return;
    const fetchUnread = async () => {
      try {
        const count = await window.electronAPI.kb.getUnreadCount(user.id);
        setUnreadCount(count || 0);
      } catch {}
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [isAdminOrOwner, user?.id]);

  // Listen for real-time notification updates (from feedback/issue submissions)
  useEffect(() => {
    if (!isAdminOrOwner) return;
    const handleNotificationSent = () => {
      setUnreadCount((prev) => prev + 1);
    };
    window.addEventListener('kb-notification-sent', handleNotificationSent);
    return () => window.removeEventListener('kb-notification-sent', handleNotificationSent);
  }, [isAdminOrOwner]);

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  const handleToggleNotifications = useCallback(async (e) => {
    e.stopPropagation();
    if (showNotifications) {
      setShowNotifications(false);
      return;
    }
    if (!window.electronAPI?.kb || !user?.id) return;
    setShowNotifications(true);
    setLoadingNotifications(true);
    try {
      const data = await window.electronAPI.kb.getNotifications(user.id, 30);
      setNotifications(data || []);
      // Mark all as read
      await window.electronAPI.kb.markAllAsRead();
      setUnreadCount(0);
    } catch {}
    setLoadingNotifications(false);
  }, [user?.id, showNotifications]);

  const handleResolveIssue = useCallback(async (issueId) => {
    if (!window.electronAPI?.kb) return;
    try {
      const result = await window.electronAPI.kb.resolveIssueReport(issueId, user?.id);
      if (result?.success) {
        setNotifications((prev) => prev.filter((n) => !(n.type === 'issue' && n.id === issueId)));
      }
    } catch {}
  }, [user?.id]);

  const handleClearAll = useCallback(async () => {
    if (!window.electronAPI?.kb || !user?.id) return;
    try {
      await window.electronAPI.kb.clearAllNotifications(user.id);
      setNotifications([]);
      setUnreadCount(0);
    } catch {}
  }, [user?.id]);

  const formatNotificationDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatUptime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const systemHealth = metrics.critical > 0 ? 'DEGRADED' : 'NOMINAL';
  const healthColor = metrics.critical > 0 ? DARK_THEME.warning : DARK_THEME.success;

  if (isMobile) {
    return (
      <div
        style={{
          gridColumn: '1 / -1',
          height: '48px',
          backgroundColor: 'rgba(5, 10, 24, 0.95)',
          borderBottom: `1px solid ${DARK_THEME.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          zIndex: 200,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: healthColor, boxShadow: `0 0 8px ${healthColor}`, animation: 'pulse 2s ease-in-out infinite' }} />
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', letterSpacing: '0.1em', color: healthColor }}>{systemHealth}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: DARK_THEME.danger }}>{metrics.critical} CRIT</span>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '14px', letterSpacing: '0.1em', color: DARK_THEME.electric }}>
            {time.toLocaleTimeString('en-US', { hour12: false })}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        gridColumn: '1 / -1',
        height: '48px',
        backgroundColor: 'rgba(5, 10, 24, 0.95)',
        borderBottom: `1px solid ${DARK_THEME.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 0 0 24px',
        zIndex: 200,
        WebkitAppRegion: 'drag',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: healthColor, boxShadow: `0 0 8px ${healthColor}`, animation: 'pulse 2s ease-in-out infinite' }} />
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', fontWeight: 500, letterSpacing: '0.15em', color: healthColor }}>{systemHealth}</span>
        </div>
        <div style={{ width: '1px', height: '20px', backgroundColor: DARK_THEME.border }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', letterSpacing: '0.1em', color: DARK_THEME.electric }}>
            AGENT_{user?.username?.toUpperCase() || 'UNKNOWN'}
          </span>
        </div>
        <div style={{ width: '1px', height: '20px', backgroundColor: DARK_THEME.border }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Activity size={12} style={{ color: DARK_THEME.textMuted }} />
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', letterSpacing: '0.05em', color: DARK_THEME.textMuted }}>
            UPTIME {formatUptime(uptime)}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', WebkitAppRegion: 'no-drag' }}>
        <MetricBadge label="CRITICAL" value={metrics.critical} color="danger" />
        <MetricBadge label="ACTIVE" value={metrics.active} color="electric" />
        <MetricBadge label="PENDING" value={metrics.pending} color="gold" />
        <MetricBadge label="RESOLVED" value={metrics.resolvedToday} color="success" />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', WebkitAppRegion: 'no-drag' }}>
        {/* Notification Bell (OWNER/ADMIN only) */}
        {isAdminOrOwner && (
          <>
            <div ref={notificationRef} style={{ position: 'relative' }}>
              <motion.button
                onClick={handleToggleNotifications}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  backgroundColor: showNotifications ? `${DARK_THEME.gold}15` : 'transparent',
                  border: `1px solid ${showNotifications ? DARK_THEME.gold : DARK_THEME.border}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  position: 'relative',
                }}
                onMouseEnter={(e) => { if (!showNotifications) e.currentTarget.style.borderColor = DARK_THEME.gold; }}
                onMouseLeave={(e) => { if (!showNotifications) e.currentTarget.style.borderColor = DARK_THEME.border; }}
              >
                <Bell size={14} style={{ color: showNotifications ? DARK_THEME.gold : DARK_THEME.textMuted }} />
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    minWidth: '16px',
                    height: '16px',
                    padding: '0 4px',
                    backgroundColor: DARK_THEME.danger,
                    borderRadius: '8px',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '9px',
                    fontWeight: 600,
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </motion.button>

              {/* Notifications Dropdown */}
              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    style={{
                      position: 'absolute',
                      top: '42px',
                      right: 0,
                      width: '380px',
                      maxHeight: '480px',
                      backgroundColor: '#0F1B2D',
                      border: '1px solid rgba(79, 195, 247, 0.25)',
                      borderTop: '2px solid #4FC3F7',
                      borderRadius: '10px',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(79, 195, 247, 0.1)',
                      zIndex: 300,
                      overflow: 'hidden',
                    }}
                  >
                    {/* Header */}
                    <div style={{ padding: '14px 16px', borderBottom: `1px solid ${DARK_THEME.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Bell size={14} style={{ color: DARK_THEME.gold }} />
                        <span style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '14px', fontWeight: 600, color: DARK_THEME.text }}>KB Notifications</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {notifications.length > 0 && (
                          <button
                            onClick={handleClearAll}
                            style={{
                              background: 'none',
                              border: 'none',
                              fontFamily: 'JetBrains Mono, monospace',
                              fontSize: '10px',
                              color: DARK_THEME.danger,
                              cursor: 'pointer',
                              padding: '4px 0',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.7'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                          >
                            CLEAR ALL
                          </button>
                        )}
                        <button onClick={() => setShowNotifications(false)} style={{ background: 'none', border: 'none', color: DARK_THEME.textMuted, cursor: 'pointer', padding: '4px' }}>
                          <XIcon size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Content */}
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      {loadingNotifications ? (
                        <div style={{ padding: '40px', textAlign: 'center' }}>
                          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: DARK_THEME.textMuted }}>Loading...</span>
                        </div>
                      ) : notifications.length === 0 ? (
                        <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                          <Bell size={32} style={{ color: DARK_THEME.border, marginBottom: '12px' }} />
                          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: DARK_THEME.textMuted }}>No notifications</div>
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div key={`${n.type}-${n.id}`} style={{
                            padding: '12px 16px',
                            borderBottom: `1px solid ${DARK_THEME.gridLine}`,
                            display: 'flex',
                            gap: '12px',
                            alignItems: 'flex-start',
                          }}>
                            {/* Icon */}
                            <div style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '6px',
                              backgroundColor: n.type === 'issue' ? `${DARK_THEME.warning}15` : (n.is_helpful ? `${DARK_THEME.success}15` : `${DARK_THEME.danger}15`),
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}>
                              {n.type === 'issue' ? (
                                <AlertTriangle size={14} style={{ color: DARK_THEME.warning }} />
                              ) : n.is_helpful ? (
                                <ThumbsUp size={14} style={{ color: DARK_THEME.success }} />
                              ) : (
                                <ThumbsDown size={14} style={{ color: DARK_THEME.danger }} />
                              )}
                            </div>

                            {/* Content */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: DARK_THEME.text, marginBottom: '4px' }}>
                                {n.type === 'issue' ? (
                                  <><span style={{ color: DARK_THEME.warning, fontWeight: 500 }}>Issue reported</span> on <span style={{ color: DARK_THEME.electric }}>{n.article_title}</span></>
                                ) : (
                                  <><span style={{ fontWeight: 500 }}>{n.agent_name || 'Agent'}</span> {n.is_helpful ? 'found helpful' : 'found unhelpful'}: <span style={{ color: DARK_THEME.electric }}>{n.article_title}</span></>
                                )}
                              </div>
                              {n.type === 'issue' && (
                                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: DARK_THEME.textMuted, marginBottom: '4px', textTransform: 'uppercase' }}>
                                  {n.issue_type}
                                </div>
                              )}
                              {n.type === 'issue' && n.description && (
                                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', color: DARK_THEME.textMuted, marginBottom: '6px', lineHeight: 1.4 }}>
                                  {n.description.length > 100 ? n.description.slice(0, 100) + '...' : n.description}
                                </div>
                              )}
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: DARK_THEME.textMuted }}>
                                  {n.type === 'issue' ? n.reporter_name || 'Unknown' : ''}
                                </span>
                                {n.type === 'issue' && (
                                  <button
                                    onClick={() => handleResolveIssue(n.id)}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      padding: '4px 8px',
                                      backgroundColor: 'transparent',
                                      border: `1px solid ${DARK_THEME.success}40`,
                                      borderRadius: '4px',
                                      fontFamily: 'JetBrains Mono, monospace',
                                      fontSize: '9px',
                                      color: DARK_THEME.success,
                                      cursor: 'pointer',
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = `${DARK_THEME.success}15`; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                                  >
                                    <Check size={10} /> RESOLVE
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div style={{ width: '1px', height: '20px', backgroundColor: DARK_THEME.border }} />
          </>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '14px', fontWeight: 500, letterSpacing: '0.1em', color: DARK_THEME.electric, lineHeight: 1 }}>
            {time.toLocaleTimeString('en-US', { hour12: false })}
          </span>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', letterSpacing: '0.1em', color: DARK_THEME.textMuted, lineHeight: 1, marginTop: '3px' }}>
            {time.toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
          </span>
        </div>

        <div style={{ width: '1px', height: '20px', backgroundColor: DARK_THEME.border }} />
        <motion.button
          onClick={onLogout}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            backgroundColor: 'transparent',
            border: `1px solid ${DARK_THEME.border}`,
            borderRadius: '6px',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = DARK_THEME.danger; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = DARK_THEME.border; }}
        >
          <LogOut size={14} style={{ color: DARK_THEME.textMuted }} />
        </motion.button>
        <div style={{ width: '1px', height: '20px', backgroundColor: DARK_THEME.border }} />
        <WindowControls />
      </div>

    </div>
  );
}

export default TopCommandBar;
