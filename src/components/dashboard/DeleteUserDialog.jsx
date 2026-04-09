import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, AlertTriangle, Shield, Search, ChevronDown, UserX, X } from 'lucide-react';
import { DARK_THEME } from '@/constants/theme';

const PRIORITY_COLORS = {
  critical: DARK_THEME.danger,
  high: DARK_THEME.warning,
  medium: DARK_THEME.electric,
  low: DARK_THEME.textMuted,
};

const STATUS_COLORS = {
  new: DARK_THEME.electric,
  in_progress: DARK_THEME.gold,
  escalated: DARK_THEME.danger,
  resolved: DARK_THEME.success,
  closed: DARK_THEME.textMuted,
};

// ═══════════════════════════════════════════════════════════════════════════
// SIMPLE CONFIRM DIALOG — No linked tickets
// ═══════════════════════════════════════════════════════════════════════════

function SimpleConfirmDialog({ user, onConfirm, onClose, isProcessing }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      style={{
        width: '94%', maxWidth: '480px',
        backgroundColor: DARK_THEME.surface,
        border: `1px solid ${DARK_THEME.danger}40`,
        borderRadius: '14px',
        boxShadow: '0 0 60px rgba(239, 68, 68, 0.15)',
        pointerEvents: 'auto', overflow: 'hidden',
      }}
    >
      <div style={{ height: '4px', backgroundColor: DARK_THEME.danger }} />

      <div style={{ padding: '24px 28px', textAlign: 'center' }}>
        <div style={{
          width: '56px', height: '56px', margin: '0 auto 16px', borderRadius: '50%',
          backgroundColor: `${DARK_THEME.danger}15`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <AlertTriangle size={28} style={{ color: DARK_THEME.danger }} />
        </div>

        <h2 style={{
          fontFamily: 'Rajdhani, sans-serif', fontSize: '22px', fontWeight: 600,
          letterSpacing: '0.1em', color: DARK_THEME.text, margin: '0 0 12px',
        }}>
          DELETE AGENT?
        </h2>

        <p style={{
          fontFamily: 'DM Sans, sans-serif', fontSize: '14px',
          color: DARK_THEME.textMuted, margin: '0 0 16px',
        }}>
          Are you sure you want to permanently delete this agent?
        </p>

        <div style={{
          backgroundColor: 'rgba(239, 68, 68, 0.05)',
          border: `1px solid ${DARK_THEME.danger}20`,
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '12px',
        }}>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '12px',
            color: DARK_THEME.danger,
          }}>
            @{user.username} — {user.display_name}
          </div>
        </div>

        <p style={{
          fontFamily: 'DM Sans, sans-serif', fontSize: '13px',
          color: DARK_THEME.danger, margin: 0,
        }}>
          This action cannot be undone.
        </p>
      </div>

      <div style={{
        display: 'flex', justifyContent: 'center', gap: '12px',
        padding: '20px 28px',
        borderTop: `1px solid ${DARK_THEME.border}`,
      }}>
        <motion.button
          onClick={onClose}
          disabled={isProcessing}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{
            padding: '12px 28px', backgroundColor: 'transparent',
            border: `1px solid ${DARK_THEME.border}`, borderRadius: '6px',
            fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, fontSize: '14px',
            letterSpacing: '0.1em', color: DARK_THEME.textMuted,
            cursor: isProcessing ? 'not-allowed' : 'pointer',
            opacity: isProcessing ? 0.5 : 1,
          }}
        >
          CANCEL
        </motion.button>
        <motion.button
          onClick={onConfirm}
          disabled={isProcessing}
          whileHover={{ scale: isProcessing ? 1 : 1.02 }}
          whileTap={{ scale: isProcessing ? 1 : 0.98 }}
          style={{
            padding: '12px 28px', backgroundColor: DARK_THEME.danger,
            border: `1px solid ${DARK_THEME.danger}`, borderRadius: '6px',
            fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, fontSize: '14px',
            letterSpacing: '0.1em', color: '#fff',
            cursor: isProcessing ? 'not-allowed' : 'pointer',
            opacity: isProcessing ? 0.7 : 1,
          }}
        >
          {isProcessing ? 'DELETING...' : 'DELETE'}
        </motion.button>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// REASSIGNMENT DIALOG — User has linked tickets
// ═══════════════════════════════════════════════════════════════════════════

function ReassignmentDialog({ user, tickets, agents, onReassignDelete, onReassignDeactivate, onClose, isProcessing }) {
  const [search, setSearch] = useState('');
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const dropdownRef = useRef(null);
  const btnRef = useRef(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });

  // Default to System Admin (first in list)
  useEffect(() => {
    if (agents.length > 0 && !selectedAgent) {
      const admin = agents.find((a) => a.role === 'owner') || agents.find((a) => a.role === 'admin') || agents[0];
      setSelectedAgent(admin);
    }
  }, [agents, selectedAgent]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) &&
          btnRef.current && !btnRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropdownOpen]);

  const filteredTickets = tickets.filter((t) =>
    t.id.toLowerCase().includes(search.toLowerCase()) ||
    t.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenDropdown = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }
    setDropdownOpen(!dropdownOpen);
  };

  const initial = (user.display_name || user.username || '?')[0].toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      style={{
        width: '94%', maxWidth: '620px',
        backgroundColor: DARK_THEME.surface,
        border: `1px solid ${DARK_THEME.border}`,
        borderRadius: '12px',
        boxShadow: `0 0 40px ${DARK_THEME.glow}, 0 0 80px rgba(0,0,0,0.5)`,
        pointerEvents: 'auto', overflow: 'hidden', maxHeight: '90vh',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Accent bar */}
      <div style={{
        height: '4px',
        background: `linear-gradient(90deg, ${DARK_THEME.warning} 30%, ${DARK_THEME.danger} 100%)`,
      }} />

      {/* Header */}
      <div style={{ padding: '24px 28px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '50%',
            backgroundColor: `${DARK_THEME.warning}15`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <span style={{
              fontFamily: 'Rajdhani, sans-serif', fontSize: '20px', fontWeight: 700,
              color: DARK_THEME.warning,
            }}>
              {initial}
            </span>
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{
              fontFamily: 'Rajdhani, sans-serif', fontSize: '20px', fontWeight: 700,
              letterSpacing: '0.1em', color: DARK_THEME.text, margin: 0,
            }}>
              AGENT DELETION BLOCKED
            </h3>
            <p style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: '11px',
              color: DARK_THEME.textMuted, margin: '2px 0 0 0',
            }}>
              {user.display_name} has active links that must be resolved
            </p>
          </div>
          <motion.button
            onClick={onClose}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            style={{
              width: '32px', height: '32px', borderRadius: '6px',
              backgroundColor: 'transparent', border: `1px solid ${DARK_THEME.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', flexShrink: 0,
            }}
          >
            <X size={14} style={{ color: DARK_THEME.textMuted }} />
          </motion.button>
        </div>

        {/* Warning banner */}
        <div style={{
          padding: '12px 16px', marginBottom: '16px',
          backgroundColor: `${DARK_THEME.warning}08`,
          border: `1px solid ${DARK_THEME.warning}25`, borderRadius: '8px',
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <AlertTriangle size={16} style={{ color: DARK_THEME.warning, flexShrink: 0 }} />
          <span style={{
            fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: DARK_THEME.warning,
          }}>
            {tickets.length} ticket{tickets.length !== 1 ? 's are' : ' is'} currently assigned to or created by this agent.
          </span>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: '12px' }}>
          <Search size={14} style={{
            position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
            color: DARK_THEME.textMuted,
          }} />
          <input
            type="text"
            placeholder="Search tickets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%', height: '36px', padding: '0 12px 0 34px',
              backgroundColor: 'rgba(79, 195, 247, 0.04)',
              border: `1px solid ${DARK_THEME.border}`, borderRadius: '6px',
              fontFamily: 'JetBrains Mono, monospace', fontSize: '12px',
              color: DARK_THEME.text, outline: 'none', boxSizing: 'border-box',
            }}
            onFocus={(e) => { e.target.style.borderColor = DARK_THEME.electric; }}
            onBlur={(e) => { e.target.style.borderColor = DARK_THEME.border; }}
          />
        </div>
      </div>

      {/* Ticket list */}
      <div style={{
        maxHeight: '264px', overflowY: 'auto', margin: '0 28px',
        border: `1px solid ${DARK_THEME.border}`, borderRadius: '8px',
        backgroundColor: DARK_THEME.bg,
      }}>
        {filteredTickets.length === 0 ? (
          <div style={{
            padding: '24px', textAlign: 'center',
            fontFamily: 'JetBrains Mono, monospace', fontSize: '11px',
            color: DARK_THEME.textMuted,
          }}>
            No tickets match your search
          </div>
        ) : (
          filteredTickets.map((ticket, idx) => {
            const pColor = PRIORITY_COLORS[ticket.priority] || DARK_THEME.textMuted;
            const sColor = STATUS_COLORS[ticket.status] || DARK_THEME.textMuted;
            return (
              <div
                key={ticket.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '10px 14px',
                  borderBottom: idx < filteredTickets.length - 1 ? `1px solid ${DARK_THEME.gridLine}` : 'none',
                }}
              >
                <span style={{
                  fontFamily: 'JetBrains Mono, monospace', fontSize: '11px',
                  color: DARK_THEME.electric, minWidth: '78px', flexShrink: 0,
                }}>
                  {ticket.id}
                </span>
                <span style={{
                  fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: DARK_THEME.text,
                  flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {ticket.title}
                </span>
                <span style={{
                  fontFamily: 'JetBrains Mono, monospace', fontSize: '10px',
                  color: pColor, padding: '2px 8px',
                  backgroundColor: `${pColor}12`, border: `1px solid ${pColor}25`,
                  borderRadius: '4px', flexShrink: 0,
                }}>
                  {ticket.priority?.toUpperCase()}
                </span>
                <span style={{
                  fontFamily: 'JetBrains Mono, monospace', fontSize: '10px',
                  color: sColor, padding: '2px 8px',
                  backgroundColor: `${sColor}12`, border: `1px solid ${sColor}25`,
                  borderRadius: '4px', flexShrink: 0,
                }}>
                  {(ticket.status || '').toUpperCase().replace('_', ' ')}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Reassignment section */}
      <div style={{ padding: '20px 28px 0' }}>
        <label style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: '10px',
          letterSpacing: '0.15em', color: DARK_THEME.textMuted,
          display: 'block', marginBottom: '8px',
        }}>
          REASSIGN ALL TICKETS TO:
        </label>

        <button
          ref={btnRef}
          onClick={handleOpenDropdown}
          style={{
            width: '100%', padding: '10px 14px',
            backgroundColor: 'rgba(79, 195, 247, 0.04)',
            border: `1px solid ${DARK_THEME.border}`, borderRadius: '6px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            cursor: 'pointer', boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {selectedAgent && (
              <>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  backgroundColor: (selectedAgent.role === 'admin' || selectedAgent.role === 'owner') ? `${DARK_THEME.danger}15` : `${DARK_THEME.electric}10`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Shield size={12} style={{ color: (selectedAgent.role === 'admin' || selectedAgent.role === 'owner') ? DARK_THEME.danger : DARK_THEME.electric }} />
                </div>
                <span style={{
                  fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: DARK_THEME.text,
                }}>
                  {selectedAgent.display_name}
                </span>
                <span style={{
                  fontFamily: 'JetBrains Mono, monospace', fontSize: '10px',
                  color: DARK_THEME.textMuted,
                }}>
                  @{selectedAgent.username}
                </span>
              </>
            )}
          </div>
          <ChevronDown size={14} style={{ color: DARK_THEME.textMuted }} />
        </button>
      </div>

      {/* Agent dropdown — fixed position */}
      <AnimatePresence>
        {dropdownOpen && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            style={{
              position: 'fixed',
              top: dropdownPos.top,
              left: dropdownPos.left,
              width: dropdownPos.width,
              zIndex: 99999,
              backgroundColor: DARK_THEME.surface,
              border: `1px solid ${DARK_THEME.border}`,
              borderRadius: '8px',
              padding: '6px',
              maxHeight: '200px', overflowY: 'auto',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            }}
          >
            {agents.map((agent) => (
              <button
                key={agent.id}
                onClick={() => { setSelectedAgent(agent); setDropdownOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  width: '100%', padding: '8px 12px',
                  backgroundColor: selectedAgent?.id === agent.id ? `${DARK_THEME.electric}12` : 'transparent',
                  border: 'none', borderRadius: '4px', cursor: 'pointer', textAlign: 'left',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = `${DARK_THEME.electric}12`; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = selectedAgent?.id === agent.id ? `${DARK_THEME.electric}12` : 'transparent'; }}
              >
                <div style={{
                  width: '24px', height: '24px', borderRadius: '50%',
                  backgroundColor: (agent.role === 'admin' || agent.role === 'owner') ? `${DARK_THEME.danger}15` : `${DARK_THEME.electric}10`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Shield size={10} style={{ color: (agent.role === 'admin' || agent.role === 'owner') ? DARK_THEME.danger : DARK_THEME.electric }} />
                </div>
                <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: DARK_THEME.text }}>
                  {agent.display_name}
                </span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: DARK_THEME.textMuted }}>
                  {agent.role.toUpperCase()}
                </span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action buttons */}
      <div style={{
        display: 'flex', flexDirection: 'column', gap: '10px',
        padding: '20px 28px 24px',
        borderTop: `1px solid ${DARK_THEME.border}`, marginTop: '20px',
      }}>
        {!confirmDelete ? (
          <div style={{ display: 'flex', gap: '10px' }}>
            <motion.button
              onClick={onClose}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                padding: '12px 20px', backgroundColor: 'transparent',
                border: `1px solid ${DARK_THEME.border}`, borderRadius: '6px',
                fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, fontSize: '13px',
                letterSpacing: '0.15em', color: DARK_THEME.textMuted, cursor: 'pointer',
              }}
            >
              CANCEL
            </motion.button>
            <motion.button
              onClick={() => selectedAgent && onReassignDeactivate(selectedAgent.id)}
              disabled={isProcessing || !selectedAgent}
              whileHover={{ scale: isProcessing ? 1 : 1.02 }}
              whileTap={{ scale: isProcessing ? 1 : 0.98 }}
              style={{
                flex: 1, padding: '12px',
                background: `linear-gradient(135deg, ${DARK_THEME.navy}, #0A1628)`,
                border: `1px solid ${DARK_THEME.electric}`, borderRadius: '6px',
                fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, fontSize: '13px',
                letterSpacing: '0.15em', color: DARK_THEME.electric,
                cursor: isProcessing || !selectedAgent ? 'not-allowed' : 'pointer',
                opacity: isProcessing || !selectedAgent ? 0.5 : 1,
              }}
            >
              {isProcessing ? 'PROCESSING...' : 'REASSIGN & DEACTIVATE'}
            </motion.button>
            <motion.button
              onClick={() => setConfirmDelete(true)}
              disabled={isProcessing || !selectedAgent}
              whileHover={{ scale: isProcessing ? 1 : 1.02 }}
              whileTap={{ scale: isProcessing ? 1 : 0.98 }}
              style={{
                padding: '12px 20px', backgroundColor: `${DARK_THEME.danger}15`,
                border: `1px solid ${DARK_THEME.danger}40`, borderRadius: '6px',
                fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, fontSize: '13px',
                letterSpacing: '0.15em', color: DARK_THEME.danger,
                cursor: isProcessing || !selectedAgent ? 'not-allowed' : 'pointer',
                opacity: isProcessing || !selectedAgent ? 0.5 : 1,
              }}
            >
              REASSIGN & DELETE
            </motion.button>
          </div>
        ) : (
          <div>
            <div style={{
              padding: '12px 16px', marginBottom: '12px',
              backgroundColor: `${DARK_THEME.danger}08`,
              border: `1px solid ${DARK_THEME.danger}25`, borderRadius: '8px',
              display: 'flex', alignItems: 'center', gap: '10px',
            }}>
              <AlertTriangle size={14} style={{ color: DARK_THEME.danger, flexShrink: 0 }} />
              <span style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: DARK_THEME.danger,
              }}>
                This will permanently remove {user.display_name} from the database. This action cannot be undone.
              </span>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <motion.button
                onClick={() => setConfirmDelete(false)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  flex: 1, padding: '12px', backgroundColor: 'transparent',
                  border: `1px solid ${DARK_THEME.border}`, borderRadius: '6px',
                  fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, fontSize: '13px',
                  letterSpacing: '0.15em', color: DARK_THEME.textMuted, cursor: 'pointer',
                }}
              >
                GO BACK
              </motion.button>
              <motion.button
                onClick={() => selectedAgent && onReassignDelete(selectedAgent.id)}
                disabled={isProcessing}
                whileHover={{ scale: isProcessing ? 1 : 1.02 }}
                whileTap={{ scale: isProcessing ? 1 : 0.98 }}
                style={{
                  flex: 1, padding: '12px', backgroundColor: DARK_THEME.danger, border: 'none',
                  borderRadius: '6px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 600,
                  fontSize: '13px', letterSpacing: '0.15em', color: '#fff',
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                  opacity: isProcessing ? 0.7 : 1,
                }}
              >
                {isProcessing ? 'DELETING...' : 'CONFIRM PERMANENT DELETE'}
              </motion.button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN DIALOG CONTROLLER
// ═══════════════════════════════════════════════════════════════════════════

function DeleteUserDialog({ isOpen, onClose, user, currentUser, users, onComplete }) {
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const isElectron = typeof window !== 'undefined' && window.electronAPI?.admin;

  // Fetch linked tickets when dialog opens
  useEffect(() => {
    if (!isOpen || !user || !isElectron) return;
    setIsLoading(true);
    setTickets([]);
    window.electronAPI.admin.getLinkedTickets(user.id)
      .then((result) => setTickets(result || []))
      .catch((err) => console.error('[DeleteUserDialog] getLinkedTickets error:', err))
      .finally(() => setIsLoading(false));
  }, [isOpen, user, isElectron]);

  // Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Other approved agents (exclude target user, sort admin first)
  const availableAgents = (users || [])
    .filter((u) => u.id !== user?.id && u.account_status === 'approved')
    .sort((a, b) => {
      const rp = { owner: 0, admin: 1, operator: 2, viewer: 3 };
      if ((rp[a.role] ?? 9) !== (rp[b.role] ?? 9)) return (rp[a.role] ?? 9) - (rp[b.role] ?? 9);
      return (a.display_name || '').localeCompare(b.display_name || '');
    });

  const handleSimpleDelete = async () => {
    setIsProcessing(true);
    try {
      const success = await window.electronAPI.admin.deleteUser(user.id, currentUser?.id, currentUser?.display_name);
      if (success) {
        onComplete('deleted', user.display_name);
      } else {
        onComplete('error', 'Delete failed');
      }
    } catch (err) {
      onComplete('error', err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReassignDeactivate = async (reassignToId) => {
    setIsProcessing(true);
    try {
      const result = await window.electronAPI.admin.reassignAndDeactivate(
        user.id, reassignToId, currentUser?.id, currentUser?.display_name
      );
      if (result.success) {
        onComplete('deactivated', user.display_name);
      } else {
        onComplete('error', result.error || 'Operation failed');
      }
    } catch (err) {
      onComplete('error', err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReassignDelete = async (reassignToId) => {
    setIsProcessing(true);
    try {
      const result = await window.electronAPI.admin.reassignAndDelete(
        user.id, reassignToId, currentUser?.id, currentUser?.display_name
      );
      if (result.success) {
        onComplete('deleted', user.display_name);
      } else {
        onComplete('error', result.error || 'Operation failed');
      }
    } catch (err) {
      onComplete('error', err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!user) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(5, 10, 24, 0.85)',
              backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
              zIndex: 600,
            }}
          />

          {/* Dialog container */}
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 601, pointerEvents: 'none',
          }}>
            {isLoading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  fontFamily: 'JetBrains Mono, monospace', fontSize: '12px',
                  color: DARK_THEME.textMuted, pointerEvents: 'auto',
                }}
              >
                Loading...
              </motion.div>
            ) : tickets.length === 0 ? (
              <SimpleConfirmDialog
                user={user}
                onConfirm={handleSimpleDelete}
                onClose={onClose}
                isProcessing={isProcessing}
              />
            ) : (
              <ReassignmentDialog
                user={user}
                tickets={tickets}
                agents={availableAgents}
                onReassignDelete={handleReassignDelete}
                onReassignDeactivate={handleReassignDeactivate}
                onClose={onClose}
                isProcessing={isProcessing}
              />
            )}
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

export default DeleteUserDialog;
