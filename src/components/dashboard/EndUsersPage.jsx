/**
 * GHOST PROTOCOL — End Users Management Page
 *
 * Company employee directory with CRUD operations for end users (reporters).
 * Features search, filtering, stats, and data table.
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserRoundSearch, Plus, Search, X, RefreshCw,
  Users, UserCheck, UserX, FileText, AlertTriangle,
  UserMinus, UserPlus as UserPlusIcon, Trash2, Eye,
  Building2, ChevronDown, ChevronLeft, ChevronRight, Check,
  UserRound, Loader2
} from 'lucide-react';
import { DARK_THEME } from '@/constants/theme';
import { PRIORITY_OPTIONS } from '@/constants/options';
import { formatSmartTimestamp } from '@/utils/formatters';
import { useEndUsers } from '@/hooks/useEndUsers';
import { useCompanyDepartments } from '@/hooks/useCompanyDepartments';
import { useToast } from '@/hooks/useToast';
import AddEndUserModal from './AddEndUserModal';
import EndUserModal from './EndUserModal';

// ═══════════════════════════════════════════════════════════════════════════
// MINI STAT CARD
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
      minWidth: '160px',
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

// ═══════════════════════════════════════════════════════════════════════════
// FILTER PILL (matches DateRangeFilter styling)
// ═══════════════════════════════════════════════════════════════════════════

function FilterPill({ label, isActive, onClick }) {
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

// ═══════════════════════════════════════════════════════════════════════════
// STYLED SELECT (Custom Dropdown for Departments)
// ═══════════════════════════════════════════════════════════════════════════

function StyledSelect({ value, onChange, options, placeholder, disabled }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = React.useRef(null);

  const selectedOption = options.find(opt => opt.value === value);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  const isActive = value !== 'all';

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {/* Trigger Button */}
      <motion.button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
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
          cursor: disabled ? 'wait' : 'pointer',
          transition: 'all 0.2s ease',
          whiteSpace: 'nowrap',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: isActive ? DARK_THEME.navy : 'transparent',
          color: isActive ? '#FFFFFF' : DARK_THEME.textMuted,
          boxShadow: isOpen ? `0 0 12px ${DARK_THEME.glow}` : (isActive ? `0 0 12px ${DARK_THEME.glow}` : 'none'),
          ...(isActive || isOpen ? {} : { border: `1px solid ${DARK_THEME.border}` }),
        }}
      >
        <Building2 size={12} />
        <span>{selectedOption?.label || placeholder}</span>
        <ChevronDown
          size={12}
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
          }}
        />
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              left: 0,
              minWidth: '200px',
              backgroundColor: DARK_THEME.surface,
              border: `1px solid ${DARK_THEME.border}`,
              borderRadius: '8px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
              zIndex: 100,
              maxHeight: '264px',
              overflowY: 'auto',
            }}
          >
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  backgroundColor: value === option.value ? `${DARK_THEME.electric}15` : 'transparent',
                  border: 'none',
                  borderBottom: `1px solid ${DARK_THEME.gridLine}`,
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '12px',
                  letterSpacing: '0.05em',
                  color: value === option.value ? DARK_THEME.electric : DARK_THEME.text,
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'background-color 0.1s',
                }}
                onMouseEnter={(e) => {
                  if (value !== option.value) {
                    e.currentTarget.style.backgroundColor = 'rgba(79, 195, 247, 0.08)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (value !== option.value) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <span>{option.label}</span>
                {value === option.value && <Check size={14} style={{ color: DARK_THEME.electric }} />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// DEPARTMENT BADGE
// ═══════════════════════════════════════════════════════════════════════════

function DepartmentBadge({ department, departments = [] }) {
  const deptOption = departments.find(d => d.id === department);
  const label = deptOption?.name || department?.toUpperCase() || 'N/A';

  return (
    <span
      title={label}
      style={{
        display: 'block',
        padding: '4px 10px',
        backgroundColor: `${DARK_THEME.electric}15`,
        border: `1px solid ${DARK_THEME.electric}40`,
        borderRadius: '4px',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '10px',
        letterSpacing: '0.05em',
        color: DARK_THEME.electric,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STATUS BADGE
// ═══════════════════════════════════════════════════════════════════════════

function StatusBadge({ isActive }) {
  const color = isActive ? DARK_THEME.success : DARK_THEME.textMuted;
  const label = isActive ? 'ACTIVE' : 'INACTIVE';

  return (
    <span style={{
      padding: '4px 10px',
      backgroundColor: `${color}15`,
      border: `1px solid ${color}40`,
      borderRadius: '4px',
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '10px',
      letterSpacing: '0.05em',
      color,
    }}>
      {label}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// INCIDENT COUNT BADGE
// ═══════════════════════════════════════════════════════════════════════════

function IncidentCountBadge({ count }) {
  let color = DARK_THEME.success;
  if (count >= 6) color = DARK_THEME.danger;
  else if (count >= 1) color = DARK_THEME.warning;

  return (
    <span style={{
      padding: '4px 10px',
      backgroundColor: `${color}15`,
      border: `1px solid ${color}40`,
      borderRadius: '4px',
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '11px',
      fontWeight: 600,
      color,
      minWidth: '32px',
      textAlign: 'center',
      display: 'inline-block',
    }}>
      {count}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ACTION BUTTON
// ═══════════════════════════════════════════════════════════════════════════

function ActionButton({ icon: Icon, onClick, color = DARK_THEME.textMuted, disabled, title }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) onClick();
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      disabled={disabled}
      title={title}
      style={{
        width: '32px',
        height: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: isHovered && !disabled ? `${color}15` : 'transparent',
        border: `1px solid ${isHovered && !disabled ? color : 'transparent'}`,
        borderRadius: '6px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition: 'all 0.15s',
      }}
    >
      <Icon size={16} style={{ color: isHovered && !disabled ? color : DARK_THEME.textMuted }} />
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TOOLTIP
// ═══════════════════════════════════════════════════════════════════════════

function Tooltip({ children, text }) {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const ref = React.useRef(null);

  const handleMouseEnter = () => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setPos({ top: rect.top - 32, left: rect.left + rect.width / 2 });
    }
    setShow(true);
  };

  return (
    <div
      ref={ref}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setShow(false)}
      style={{ display: 'inline-flex' }}
    >
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            style={{
              position: 'fixed',
              top: pos.top,
              left: pos.left,
              transform: 'translateX(-50%)',
              backgroundColor: DARK_THEME.surface,
              border: `1px solid ${DARK_THEME.border}`,
              borderRadius: '4px',
              padding: '6px 10px',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '10px',
              color: DARK_THEME.text,
              whiteSpace: 'nowrap',
              zIndex: 1000,
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            }}
          >
            {text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CONFIRM DIALOG (Scenario A — no linked tickets)
// ═══════════════════════════════════════════════════════════════════════════

function ConfirmDialog({ isOpen, title, itemId, itemName, onConfirm, onCancel, isLoading }) {
  if (!isOpen) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => !isLoading && onCancel()}
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
              {title}
            </h2>

            <p style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '14px',
              color: DARK_THEME.textMuted,
              margin: '0 0 16px',
            }}>
              Are you sure you want to permanently delete this end user?
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
                {itemId} — {itemName}
              </div>
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
              onClick={onCancel}
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
              {isLoading ? 'DELETING...' : 'DELETE'}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// INCIDENT STATUS BADGE (matches EndUserModal)
// ═══════════════════════════════════════════════════════════════════════════

function IncidentStatusBadge({ status }) {
  const statusColors = {
    new: DARK_THEME.electric,
    in_progress: DARK_THEME.gold,
    escalated: DARK_THEME.danger,
    resolved: DARK_THEME.success,
    closed: DARK_THEME.textMuted,
  };
  const color = statusColors[status] || DARK_THEME.textMuted;
  const label = status?.replace('_', ' ').toUpperCase() || 'UNKNOWN';

  return (
    <span style={{
      padding: '2px 8px',
      backgroundColor: `${color}15`,
      border: `1px solid ${color}40`,
      borderRadius: '4px',
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '9px',
      letterSpacing: '0.05em',
      color,
    }}>
      {label}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PRIORITY BADGE (matches EndUserModal)
// ═══════════════════════════════════════════════════════════════════════════

function DeletePriorityBadge({ priority }) {
  const option = PRIORITY_OPTIONS.find(p => p.value === priority);
  const color = option?.color || DARK_THEME.textMuted;
  const label = option?.label || priority?.toUpperCase() || 'UNKNOWN';

  return (
    <span style={{
      padding: '2px 8px',
      backgroundColor: `${color}15`,
      border: `1px solid ${color}40`,
      borderRadius: '4px',
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '9px',
      letterSpacing: '0.05em',
      color,
    }}>
      {label}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ENHANCED DELETE DIALOG (Scenario B — user has linked tickets)
// ═══════════════════════════════════════════════════════════════════════════

function EnhancedDeleteDialog({ isOpen, user, onConfirm, onCancel, isLoading }) {
  const [incidents, setIncidents] = useState([]);
  const [incidentsLoading, setIncidentsLoading] = useState(false);
  const [selectedReporter, setSelectedReporter] = useState(null);
  const [unassignAll, setUnassignAll] = useState(false);

  // Reporter search state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

  const searchContainerRef = useRef(null);
  const searchInputRef = useRef(null);
  const dropdownRef = useRef(null);

  const { allDepartments } = useCompanyDepartments();

  const canConfirm = selectedReporter || unassignAll;

  // Fetch linked incidents when dialog opens
  useEffect(() => {
    if (!isOpen || !user?.id) {
      setIncidents([]);
      setSelectedReporter(null);
      setUnassignAll(false);
      setSearchQuery('');
      setDebouncedQuery('');
      setSearchResults([]);
      setIsDropdownOpen(false);
      return;
    }

    const fetchIncidents = async () => {
      setIncidentsLoading(true);
      try {
        const data = await window.electronAPI.endUsers.getIncidents(user.id);
        setIncidents(data || []);
      } catch (err) {
        console.error('Failed to fetch linked incidents:', err);
        setIncidents([]);
      } finally {
        setIncidentsLoading(false);
      }
    };

    fetchIncidents();
  }, [isOpen, user?.id]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 150);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch search results
  useEffect(() => {
    if (debouncedQuery.length < 1) {
      setSearchResults([]);
      setIsDropdownOpen(false);
      return;
    }

    const fetchResults = async () => {
      setSearchLoading(true);
      try {
        let data = await window.electronAPI.endUsers.search(debouncedQuery);

        if (!data || (Array.isArray(data) && data.length === 0)) {
          const allData = await window.electronAPI.endUsers.getAll({ includeInactive: false });
          const searchLower = debouncedQuery.toLowerCase();
          data = (allData || []).filter(u =>
            (u.full_name && u.full_name.toLowerCase().includes(searchLower)) ||
            (u.email && u.email.toLowerCase().includes(searchLower)) ||
            (u.id && u.id.toLowerCase().includes(searchLower))
          );
        }

        const usersArray = Array.isArray(data) ? data : (data?.results || data?.users || []);
        // Filter active users, exclude the user being deleted
        const activeUsers = usersArray
          .filter(u => (u.is_active === 1 || u.is_active === true) && u.id !== user.id)
          .slice(0, 6);

        setSearchResults(activeUsers);
        setHighlightedIndex(-1);
        setIsDropdownOpen(activeUsers.length > 0);
      } catch (err) {
        console.error('[EnhancedDeleteDialog] Search failed:', err);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    };

    fetchResults();
  }, [debouncedQuery, user?.id]);

  // Update dropdown position
  const updatePosition = useCallback(() => {
    if (searchContainerRef.current) {
      const rect = searchContainerRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    }
  }, []);

  useEffect(() => {
    if (isDropdownOpen) updatePosition();
  }, [isDropdownOpen, updatePosition]);

  // Click outside to close dropdown
  useEffect(() => {
    if (!isDropdownOpen) return;
    const handleClickOutside = (e) => {
      if (
        searchContainerRef.current && !searchContainerRef.current.contains(e.target) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  // Update position on scroll/resize
  useEffect(() => {
    if (!isDropdownOpen) return;
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isDropdownOpen, updatePosition]);

  const handleSelectReporter = (reporter) => {
    setSelectedReporter(reporter);
    setUnassignAll(false);
    setSearchQuery('');
    setSearchResults([]);
    setIsDropdownOpen(false);
  };

  const handleClearReporter = () => {
    setSelectedReporter(null);
    setSearchQuery('');
    setTimeout(() => searchInputRef.current?.focus(), 50);
  };

  const handleToggleUnassign = () => {
    const newVal = !unassignAll;
    setUnassignAll(newVal);
    if (newVal) {
      setSelectedReporter(null);
      setSearchQuery('');
      setSearchResults([]);
      setIsDropdownOpen(false);
    }
  };

  const handleKeyDown = (e) => {
    if (!isDropdownOpen) return;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => Math.min(prev + 1, searchResults.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && searchResults[highlightedIndex]) {
          handleSelectReporter(searchResults[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsDropdownOpen(false);
        break;
    }
  };

  const getDepartmentLabel = (deptId) => {
    const dept = allDepartments?.find(d => d.id === deptId);
    return dept?.name || deptId?.toUpperCase() || 'N/A';
  };

  if (!isOpen || !user) return null;

  const incidentCount = user.incident_count || incidents.length;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => !isLoading && onCancel()}
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
            maxWidth: '580px',
            backgroundColor: DARK_THEME.surface,
            border: `1px solid ${DARK_THEME.danger}40`,
            borderRadius: '14px',
            boxShadow: '0 0 60px rgba(239, 68, 68, 0.15)',
            pointerEvents: 'auto',
            overflow: 'hidden',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Red top bar */}
          <div style={{ height: '4px', backgroundColor: DARK_THEME.danger, flexShrink: 0 }} />

          {/* Scrollable content */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            <div style={{ padding: '24px 28px' }}>
              {/* Icon + Title */}
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
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
                  <Trash2 size={28} style={{ color: DARK_THEME.danger }} />
                </div>

                <h2 style={{
                  fontFamily: 'Rajdhani, sans-serif',
                  fontSize: '22px',
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  color: DARK_THEME.text,
                  margin: '0 0 8px',
                }}>
                  DELETE END USER
                </h2>

                <div style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '12px',
                  color: DARK_THEME.danger,
                }}>
                  {user.id} — {user.full_name}
                </div>
              </div>

              {/* Divider */}
              <div style={{ height: '1px', backgroundColor: DARK_THEME.border, margin: '0 0 20px' }} />

              {/* Amber Warning */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 16px',
                backgroundColor: `${DARK_THEME.warning}10`,
                border: `1px solid ${DARK_THEME.warning}40`,
                borderRadius: '8px',
                marginBottom: '20px',
              }}>
                <AlertTriangle size={18} style={{ color: DARK_THEME.warning, flexShrink: 0 }} />
                <div>
                  <div style={{
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: DARK_THEME.warning,
                  }}>
                    This user has {incidentCount} linked incident{incidentCount !== 1 ? 's' : ''}
                  </div>
                  <div style={{
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '12px',
                    color: DARK_THEME.textMuted,
                    marginTop: '2px',
                  }}>
                    You must reassign or unassign them first.
                  </div>
                </div>
              </div>

              {/* LINKED INCIDENTS section */}
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{
                  fontFamily: 'Rajdhani, sans-serif',
                  fontSize: '16px',
                  fontWeight: 600,
                  color: DARK_THEME.text,
                  margin: '0 0 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <FileText size={16} style={{ color: DARK_THEME.electric }} />
                  LINKED INCIDENTS
                  <span style={{
                    padding: '2px 8px',
                    backgroundColor: `${DARK_THEME.electric}15`,
                    borderRadius: '4px',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '11px',
                    color: DARK_THEME.electric,
                  }}>
                    {incidentCount}
                  </span>
                </h3>

                <div style={{
                  backgroundColor: DARK_THEME.navy,
                  borderRadius: '10px',
                  overflow: 'hidden',
                }}>
                  {incidentsLoading ? (
                    <div style={{
                      padding: '24px',
                      textAlign: 'center',
                    }}>
                      <Loader2 size={20} style={{ color: DARK_THEME.electric, animation: 'spin 1s linear infinite' }} />
                      <p style={{
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '11px',
                        color: DARK_THEME.textMuted,
                        margin: '8px 0 0',
                      }}>
                        Loading incidents...
                      </p>
                    </div>
                  ) : (
                    <div style={{
                      maxHeight: '132px',
                      overflowY: 'auto',
                    }}>
                      {incidents.map((incident, index) => {
                        const timestamp = formatSmartTimestamp(incident.created_at);
                        return (
                          <div
                            key={incident.id}
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '100px 1fr auto',
                              alignItems: 'center',
                              gap: '12px',
                              padding: '12px 16px',
                              borderBottom: index < incidents.length - 1 ? `1px solid ${DARK_THEME.border}` : 'none',
                              transition: 'background-color 0.15s ease',
                            }}
                          >
                            <span style={{
                              fontFamily: 'JetBrains Mono, monospace',
                              fontSize: '12px',
                              fontWeight: 600,
                              color: DARK_THEME.electric,
                            }}>
                              {incident.id}
                            </span>

                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              minWidth: 0,
                            }}>
                              <span style={{
                                fontFamily: 'DM Sans, sans-serif',
                                fontSize: '13px',
                                color: DARK_THEME.text,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                flex: 1,
                              }}>
                                {incident.title}
                              </span>
                              <DeletePriorityBadge priority={incident.priority} />
                              <IncidentStatusBadge status={incident.status} />
                            </div>

                            <span style={{
                              fontFamily: 'JetBrains Mono, monospace',
                              fontSize: '10px',
                              color: DARK_THEME.textMuted,
                            }}>
                              {timestamp.display}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* REASSIGN REPORTER TO section */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '9px',
                  letterSpacing: '0.15em',
                  color: DARK_THEME.textMuted,
                  marginBottom: '8px',
                }}>
                  REASSIGN REPORTER TO
                </label>

                <div ref={searchContainerRef}>
                  {selectedReporter ? (
                    /* Selected Reporter Card — matches ReporterSelector */
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      backgroundColor: `${DARK_THEME.electric}08`,
                      border: `1px solid ${DARK_THEME.electric}40`,
                      borderRadius: '6px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                        <div style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '6px',
                          backgroundColor: `${DARK_THEME.electric}20`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <UserRound size={14} style={{ color: DARK_THEME.electric }} />
                        </div>
                        <div style={{
                          minWidth: 0,
                          flex: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontFamily: 'Rajdhani, sans-serif',
                          fontSize: '13px',
                          fontWeight: 600,
                          color: DARK_THEME.text,
                        }}>
                          {selectedReporter.full_name}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleClearReporter}
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '4px',
                          backgroundColor: 'transparent',
                          border: `1px solid ${DARK_THEME.border}`,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          marginLeft: '8px',
                        }}
                      >
                        <X size={12} style={{ color: DARK_THEME.textMuted }} />
                      </button>
                    </div>
                  ) : (
                    /* Search Input — matches ReporterSelector */
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 12px',
                        backgroundColor: 'rgba(79, 195, 247, 0.04)',
                        border: `1px solid ${isDropdownOpen ? DARK_THEME.electric : DARK_THEME.border}`,
                        borderRadius: '6px',
                        transition: 'border-color 0.15s',
                        opacity: unassignAll ? 0.4 : 1,
                        pointerEvents: unassignAll ? 'none' : 'auto',
                      }}
                      onClick={() => searchInputRef.current?.focus()}
                    >
                      <Search size={14} style={{ color: isDropdownOpen ? DARK_THEME.electric : DARK_THEME.textMuted, flexShrink: 0 }} />
                      <input
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          updatePosition();
                        }}
                        onKeyDown={handleKeyDown}
                        onFocus={updatePosition}
                        placeholder="Type name to search..."
                        disabled={unassignAll}
                        style={{
                          flex: 1,
                          backgroundColor: 'transparent',
                          border: 'none',
                          outline: 'none',
                          fontFamily: 'JetBrains Mono, monospace',
                          fontSize: '12px',
                          color: DARK_THEME.text,
                        }}
                      />
                      {searchLoading && (
                        <Loader2 size={14} style={{ color: DARK_THEME.electric, animation: 'spin 1s linear infinite', flexShrink: 0 }} />
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* — OR — divider */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                margin: '16px 0',
              }}>
                <div style={{ flex: 1, height: '1px', backgroundColor: DARK_THEME.border }} />
                <span style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '10px',
                  letterSpacing: '0.1em',
                  color: DARK_THEME.textMuted,
                }}>
                  OR
                </span>
                <div style={{ flex: 1, height: '1px', backgroundColor: DARK_THEME.border }} />
              </div>

              {/* Unassign all checkbox */}
              <label
                onClick={handleToggleUnassign}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 14px',
                  backgroundColor: unassignAll ? `${DARK_THEME.warning}08` : 'transparent',
                  border: `1px solid ${unassignAll ? DARK_THEME.warning + '40' : DARK_THEME.border}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  marginBottom: '16px',
                }}
              >
                <div style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '4px',
                  backgroundColor: unassignAll ? DARK_THEME.warning : 'transparent',
                  border: `2px solid ${unassignAll ? DARK_THEME.warning : DARK_THEME.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s',
                  flexShrink: 0,
                }}>
                  {unassignAll && <Check size={12} style={{ color: '#fff' }} />}
                </div>
                <span style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '13px',
                  color: unassignAll ? DARK_THEME.text : DARK_THEME.textMuted,
                }}>
                  Unassign all tickets (set to no reporter)
                </span>
              </label>

              {/* Divider */}
              <div style={{ height: '1px', backgroundColor: DARK_THEME.border, margin: '0 0 12px' }} />

              {/* Danger text */}
              <p style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '13px',
                color: DARK_THEME.danger,
                margin: 0,
                textAlign: 'center',
              }}>
                This action cannot be undone.
              </p>
            </div>
          </div>

          {/* Footer buttons */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '12px',
            padding: '20px 28px',
            borderTop: `1px solid ${DARK_THEME.border}`,
            flexShrink: 0,
          }}>
            <motion.button
              onClick={onCancel}
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
              onClick={() => onConfirm(selectedReporter?.id || null, unassignAll)}
              disabled={isLoading || !canConfirm}
              whileHover={{ scale: (isLoading || !canConfirm) ? 1 : 1.02 }}
              whileTap={{ scale: (isLoading || !canConfirm) ? 1 : 0.98 }}
              style={{
                padding: '12px 28px',
                backgroundColor: canConfirm ? DARK_THEME.danger : `${DARK_THEME.danger}40`,
                border: `1px solid ${canConfirm ? DARK_THEME.danger : DARK_THEME.danger + '40'}`,
                borderRadius: '6px',
                fontFamily: 'Rajdhani, sans-serif',
                fontWeight: 600,
                fontSize: '14px',
                letterSpacing: '0.1em',
                color: canConfirm ? '#fff' : `${DARK_THEME.textMuted}`,
                cursor: (isLoading || !canConfirm) ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.7 : 1,
              }}
            >
              {isLoading ? 'DELETING...' : 'DELETE & REASSIGN'}
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Dropdown Portal for reporter search */}
      {isDropdownOpen && searchResults.length > 0 && createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: 'fixed',
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: dropdownPosition.width,
            backgroundColor: DARK_THEME.surface,
            border: `1px solid ${DARK_THEME.electric}`,
            borderRadius: '8px',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5)',
            zIndex: 9999,
            overflow: 'hidden',
            maxHeight: '172px',
            overflowY: 'auto',
          }}
        >
          {searchResults.map((resultUser, index) => (
            <div
              key={resultUser.id}
              onClick={() => handleSelectReporter(resultUser)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                backgroundColor: index === highlightedIndex ? `${DARK_THEME.electric}10` : 'transparent',
                cursor: 'pointer',
                transition: 'background-color 0.1s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${DARK_THEME.electric}10`;
              }}
              onMouseLeave={(e) => {
                if (index !== highlightedIndex) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              {/* Avatar */}
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                backgroundColor: `${DARK_THEME.electric}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <UserRound size={14} style={{ color: DARK_THEME.electric }} />
              </div>

              {/* Name + Email */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: 'Rajdhani, sans-serif',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: DARK_THEME.text,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {resultUser.full_name}
                </div>
                {resultUser.email && (
                  <span style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '10px',
                    color: DARK_THEME.textMuted,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: 'block',
                  }}>
                    {resultUser.email}
                  </span>
                )}
              </div>

              {/* Department Badge */}
              {resultUser.department && (
                <span style={{
                  padding: '2px 6px',
                  backgroundColor: `${DARK_THEME.electric}15`,
                  border: `1px solid ${DARK_THEME.electric}40`,
                  borderRadius: '3px',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '8px',
                  letterSpacing: '0.05em',
                  color: DARK_THEME.electric,
                  flexShrink: 0,
                }}>
                  {getDepartmentLabel(resultUser.department)}
                </span>
              )}
            </div>
          ))}
        </div>,
        document.body
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN END USERS PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

function EndUsersPage({ currentUser }) {
  const toast = useToast();
  const {
    endUsers,
    isLoading,
    error,
    totalCount,
    activeCount,
    inactiveCount,
    withIncidentsCount,
    refresh,
    createEndUser,
    updateEndUser,
    deactivateEndUser,
    reactivateEndUser,
    deleteEndUser,
  } = useEndUsers({ includeInactive: true });

  // Company departments from database
  const { departments, isLoading: deptsLoading } = useCompanyDepartments();

  // Listen for ghost:refresh event (triggered by R shortcut)
  useEffect(() => {
    const handleRefresh = () => refresh();
    window.addEventListener('ghost:refresh', handleRefresh);
    return () => window.removeEventListener('ghost:refresh', handleRefresh);
  }, [refresh]);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedEndUser, setSelectedEndUser] = useState(null);

  // Delete confirmation state
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Check if user can perform write operations
  const canWrite = currentUser?.role === 'admin' || currentUser?.role === 'owner';

  // Filter end users
  const filteredEndUsers = useMemo(() => {
    return endUsers.filter(user => {
      // Status filter
      if (statusFilter === 'active' && !user.is_active) return false;
      if (statusFilter === 'inactive' && user.is_active) return false;

      // Department filter
      if (departmentFilter !== 'all' && user.department !== departmentFilter) {
        return false;
      }

      // Search filter
      if (debouncedSearch) {
        const query = debouncedSearch.toLowerCase();
        const matchesName = user.full_name?.toLowerCase().includes(query);
        const matchesEmail = user.email?.toLowerCase().includes(query);
        const matchesDept = user.department?.toLowerCase().includes(query);
        const matchesEmployeeId = user.employee_id?.toLowerCase().includes(query);
        if (!matchesName && !matchesEmail && !matchesDept && !matchesEmployeeId) return false;
      }

      return true;
    });
  }, [endUsers, statusFilter, departmentFilter, debouncedSearch]);

  // Pagination calculations
  const filteredCount = filteredEndUsers.length;
  const totalPages = Math.ceil(filteredCount / pageSize);
  const paginatedEndUsers = filteredEndUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Reset to page 1 when filters or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter, departmentFilter]);

  // Check if filters are non-default
  const hasActiveFilters = statusFilter !== 'all' || departmentFilter !== 'all' || searchQuery !== '';

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setDepartmentFilter('all');
  };

  // Handle row click
  const handleRowClick = (endUser) => {
    setSelectedEndUser(endUser);
    setIsDetailModalOpen(true);
  };

  // Handle create
  const handleCreate = async (data) => {
    try {
      const result = await createEndUser(data, currentUser.id, currentUser.display_name);
      if (result) {
        toast.success(`End user ${result.id} created successfully`);
        setIsAddModalOpen(false);
        return { success: true };
      }
    } catch (err) {
      toast.error(err.message || 'Failed to create end user');
      return { success: false, error: err.message };
    }
  };

  // Handle update
  const handleUpdate = async (id, updates) => {
    try {
      const result = await updateEndUser(id, updates, currentUser.id, currentUser.display_name);
      if (result?.success && result.data) {
        toast.success(`End user ${id} updated successfully`);
        setSelectedEndUser(result.data);
        return { success: true, data: result.data };
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update end user');
      return { success: false, error: err.message };
    }
  };

  // Handle deactivate
  const handleDeactivate = async (id) => {
    try {
      const result = await deactivateEndUser(id, currentUser.id, currentUser.display_name);
      if (result?.success && result.data) {
        toast.success(`End user ${id} deactivated`);
        setSelectedEndUser(result.data);
        return { success: true, data: result.data };
      }
    } catch (err) {
      toast.error(err.message || 'Failed to deactivate end user');
      return { success: false, error: err.message };
    }
  };

  // Handle reactivate
  const handleReactivate = async (id) => {
    try {
      const result = await reactivateEndUser(id, currentUser.id, currentUser.display_name);
      if (result?.success && result.data) {
        toast.success(`End user ${id} reactivated`);
        setSelectedEndUser(result.data);
        return { success: true, data: result.data };
      }
    } catch (err) {
      toast.error(err.message || 'Failed to reactivate end user');
      return { success: false, error: err.message };
    }
  };

  // Handle delete (used by modal)
  const handleDelete = async (id) => {
    // If user has linked incidents, close the View modal and open the EnhancedDeleteDialog
    const user = endUsers.find(u => u.id === id) || selectedEndUser;
    if (user && user.incident_count > 0) {
      setIsDetailModalOpen(false);
      setSelectedEndUser(null);
      setUserToDelete(user);
      return { success: true };
    }

    try {
      await deleteEndUser(id, currentUser.id, currentUser.display_name);
      toast.success(`End user ${id} deleted`);
      setIsDetailModalOpen(false);
      setSelectedEndUser(null);
      return { success: true };
    } catch (err) {
      toast.error(err.message || 'Failed to delete end user');
      return { success: false, error: err.message };
    }
  };

  // Handle confirmed delete — Scenario A (no linked tickets)
  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      await deleteEndUser(userToDelete.id, currentUser.id, currentUser.display_name);
      toast.success(`End user ${userToDelete.id} deleted`);
      setUserToDelete(null);
    } catch (err) {
      toast.error(err.message || 'Failed to delete end user');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle confirmed delete with reassignment — Scenario B (has linked tickets)
  const handleConfirmReassignDelete = async (newReporterId, isUnassign) => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      const result = await window.electronAPI.endUsers.reassignAndDelete(
        userToDelete.id,
        isUnassign ? null : newReporterId,
        currentUser.id,
        currentUser.display_name
      );
      if (result?.success) {
        const reassignedCount = result.reassignedCount || userToDelete.incident_count || 0;
        if (isUnassign) {
          toast.success(`${userToDelete.full_name} deleted. ${reassignedCount} incident${reassignedCount !== 1 ? 's' : ''} unassigned`);
        } else {
          // Find the name of the new reporter from search results or fetch
          const newReporter = newReporterId ? await window.electronAPI.endUsers.getById(newReporterId) : null;
          const newName = newReporter?.full_name || newReporterId;
          toast.success(`${userToDelete.full_name} deleted. ${reassignedCount} incident${reassignedCount !== 1 ? 's' : ''} reassigned to ${newName}`);
        }
        setUserToDelete(null);
        refresh();
      } else {
        toast.error(result?.error || 'Failed to delete end user');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete end user');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div style={{
      flex: 1,
      padding: '32px',
      overflowY: 'auto',
      backgroundColor: 'transparent',
    }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '30px', fontWeight: 700, letterSpacing: '0.1em', color: DARK_THEME.text, margin: '0 0 6px 0' }}>
            END USERS MANAGEMENT
          </h1>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', letterSpacing: '0.1em', color: DARK_THEME.textMuted }}>
            {filteredEndUsers.length} OF {totalCount} USERS DISPLAYED
          </span>
        </div>
        {canWrite && (
          <motion.button
            onClick={() => setIsAddModalOpen(true)}
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
            NEW END USER
          </motion.button>
        )}
      </div>

      {/* ── Filter Bar (matches DateRangeFilter styling) ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '16px 20px',
        background: `linear-gradient(135deg, ${DARK_THEME.surface} 0%, rgba(27, 42, 107, 0.15) 100%)`,
        borderRadius: '8px',
        border: `1px solid ${DARK_THEME.border}`,
        marginBottom: '16px',
        flexWrap: 'wrap',
      }}>
        {/* Status Pills */}
        <FilterPill label="ALL" isActive={statusFilter === 'all'} onClick={() => setStatusFilter('all')} />
        <FilterPill label="ACTIVE" isActive={statusFilter === 'active'} onClick={() => setStatusFilter('active')} />
        <FilterPill label="INACTIVE" isActive={statusFilter === 'inactive'} onClick={() => setStatusFilter('inactive')} />

        {/* Separator */}
        <div style={{
          width: '1px',
          height: '24px',
          backgroundColor: DARK_THEME.border,
          margin: '0 8px',
        }} />

        {/* Department Dropdown */}
        <StyledSelect
          value={departmentFilter}
          onChange={setDepartmentFilter}
          disabled={deptsLoading}
          placeholder="ALL DEPARTMENTS"
          options={[
            { value: 'all', label: 'ALL DEPARTMENTS' },
            ...departments.map(dept => ({ value: dept.id, label: dept.name }))
          ]}
        />
      </div>

      {/* ── Search Bar ── */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '20px',
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
            placeholder="Search by name, email, or employee ID..."
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

        {hasActiveFilters && (
          <motion.button
            onClick={handleResetFilters}
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

      {/* ── Quick Stats Row ── */}
      <div style={{ display: 'flex', gap: '14px', marginBottom: '24px' }}>
        <MiniStatCard label="TOTAL USERS" value={totalCount} color={DARK_THEME.electric} icon={Users} />
        <MiniStatCard label="ACTIVE" value={activeCount} color={DARK_THEME.success} icon={UserCheck} />
        <MiniStatCard label="INACTIVE" value={inactiveCount} color={DARK_THEME.textMuted} icon={UserX} />
        <MiniStatCard label="WITH INCIDENTS" value={withIncidentsCount} color={DARK_THEME.warning} icon={FileText} />
      </div>

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
          gridTemplateColumns: '100px 1fr 180px 140px 90px 80px 120px',
          gap: '12px',
          padding: '16px 28px',
          backgroundColor: 'rgba(79, 195, 247, 0.04)',
          borderBottom: `1px solid ${DARK_THEME.border}`,
        }}>
          {['ID', 'FULL NAME', 'EMAIL', 'DEPARTMENT', 'STATUS', 'INCIDENTS', 'ACTIONS'].map(header => (
            <span key={header} style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '12px',
              letterSpacing: '0.1em',
              color: DARK_THEME.textMuted,
              ...(header === 'STATUS' || header === 'INCIDENTS' ? { textAlign: 'left' } : {}),
            }}>
              {header}
            </span>
          ))}
        </div>

        {/* Table Body */}
        <div style={{ maxHeight: 'calc(100vh - 480px)', overflowY: 'auto' }}>
          {/* Loading State */}
          {isLoading && (
            <div style={{ padding: '56px 28px', textAlign: 'center' }}>
              <RefreshCw size={32} style={{ color: DARK_THEME.electric, animation: 'spin 1s linear infinite' }} />
              <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: DARK_THEME.textMuted, marginTop: '16px' }}>
                LOADING END USERS...
              </p>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && filteredEndUsers.length === 0 && (
            <div style={{ padding: '56px 28px', textAlign: 'center' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: `${DARK_THEME.textMuted}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <AlertTriangle size={24} style={{ color: DARK_THEME.textMuted }} />
              </div>
              <p style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '18px', color: DARK_THEME.text, margin: '0 0 6px 0' }}>NO END USERS FOUND</p>
              <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: DARK_THEME.textMuted, margin: 0 }}>
                {hasActiveFilters ? 'Try adjusting your search or filter criteria' : 'Add your first end user to get started'}
              </p>
            </div>
          )}

          {/* Table Rows */}
          {!isLoading && filteredEndUsers.length > 0 && paginatedEndUsers.map((user, index) => (
            <motion.div
              key={user.id}
              onClick={() => handleRowClick(user)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.015 }}
              style={{
                display: 'grid',
                gridTemplateColumns: '100px 1fr 180px 140px 90px 80px 120px',
                gap: '12px',
                padding: '18px 28px',
                borderBottom: `1px solid ${DARK_THEME.gridLine}`,
                cursor: 'pointer',
                backgroundColor: index % 2 === 0 ? 'rgba(0, 0, 0, 0)' : 'rgba(79, 195, 247, 0.02)',
                transition: 'background-color 0.15s',
              }}
              whileHover={{ backgroundColor: 'rgba(79, 195, 247, 0.06)' }}
            >
              {/* ID */}
              <div style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '13px',
                color: DARK_THEME.electric,
                fontWeight: 600,
              }}>
                {user.id}
              </div>

              {/* Full Name + Employee ID */}
              <div style={{ minWidth: 0, overflow: 'hidden' }}>
                <div
                  title={user.full_name}
                  style={{
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: DARK_THEME.text,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {user.full_name}
                </div>
                {user.employee_id && (
                  <div
                    title={user.employee_id}
                    style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '10px',
                      color: DARK_THEME.textMuted,
                      marginTop: '2px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {user.employee_id}
                  </div>
                )}
              </div>

              {/* Email */}
              <div style={{ overflow: 'hidden' }}>
                {user.email ? (
                  <Tooltip text={user.email}>
                    <span style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '12px',
                      color: DARK_THEME.textMuted,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      display: 'block',
                    }}>
                      {user.email}
                    </span>
                  </Tooltip>
                ) : (
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: DARK_THEME.textMuted }}>—</span>
                )}
              </div>

              {/* Department */}
              <div style={{ minWidth: 0, overflow: 'hidden' }}>
                {user.department ? <DepartmentBadge department={user.department} departments={departments} /> : <span style={{ color: DARK_THEME.textMuted }}>—</span>}
              </div>

              {/* Status */}
              <div style={{ textAlign: 'left' }}>
                <StatusBadge isActive={user.is_active} />
              </div>

              {/* Incident Count */}
              <div style={{ textAlign: 'left' }}>
                <IncidentCountBadge count={user.incident_count || 0} />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '4px' }}>
                <ActionButton
                  icon={Eye}
                  onClick={() => handleRowClick(user)}
                  color={DARK_THEME.electric}
                  title="View"
                />
                {user.is_active ? (
                  <ActionButton
                    icon={UserMinus}
                    onClick={() => handleDeactivate(user.id)}
                    color={DARK_THEME.warning}
                    title="Deactivate"
                  />
                ) : (
                  <ActionButton
                    icon={UserPlusIcon}
                    onClick={() => handleReactivate(user.id)}
                    color={DARK_THEME.success}
                    title="Reactivate"
                  />
                )}
                {canWrite && (
                  <ActionButton
                    icon={Trash2}
                    onClick={() => setUserToDelete(user)}
                    color={DARK_THEME.danger}
                    title="Delete"
                  />
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: `1px solid ${DARK_THEME.border}`, backgroundColor: 'rgba(79, 195, 247, 0.02)', flexShrink: 0 }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: DARK_THEME.textMuted }}>
              Showing {((currentPage - 1) * pageSize) + 1}–{Math.min(currentPage * pageSize, filteredCount)} of {filteredCount}
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

      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {/* MODALS */}
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      <AddEndUserModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onCreate={handleCreate}
      />

      <EndUserModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedEndUser(null);
        }}
        endUser={selectedEndUser}
        onUpdate={handleUpdate}
        onDeactivate={handleDeactivate}
        onReactivate={handleReactivate}
        onDelete={handleDelete}
        currentUser={currentUser}
      />

      {/* Delete Confirmation Dialog — routes to Scenario A or B */}
      <AnimatePresence>
        {userToDelete && userToDelete.incident_count > 0 ? (
          <EnhancedDeleteDialog
            isOpen={!!userToDelete}
            user={userToDelete}
            onConfirm={handleConfirmReassignDelete}
            onCancel={() => setUserToDelete(null)}
            isLoading={isDeleting}
          />
        ) : userToDelete ? (
          <ConfirmDialog
            isOpen={!!userToDelete}
            title="DELETE END USER?"
            itemId={userToDelete.id}
            itemName={userToDelete.full_name}
            onConfirm={handleConfirmDelete}
            onCancel={() => setUserToDelete(null)}
            isLoading={isDeleting}
          />
        ) : null}
      </AnimatePresence>

      {/* Keyframe animations */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default EndUsersPage;
