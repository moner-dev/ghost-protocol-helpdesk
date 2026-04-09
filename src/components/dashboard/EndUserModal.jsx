/**
 * GHOST PROTOCOL — End User Detail Modal
 *
 * Larger modal for viewing and editing end user details.
 * Includes incident history section and action buttons.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Edit2, Save, XCircle, UserMinus, UserPlus, Trash2,
  Mail, Phone, Building2, MapPin, Hash, FileText, Clock,
  AlertTriangle, CheckCircle, Loader2, ChevronRight, ExternalLink,
  ChevronDown, Check
} from 'lucide-react';
import { DARK_THEME } from '@/constants/theme';
import { PRIORITY_OPTIONS } from '@/constants/options';
import { formatSmartTimestamp } from '@/utils/formatters';
import { useCompanyDepartments } from '@/hooks/useCompanyDepartments';

// ═══════════════════════════════════════════════════════════════════════════
// STATUS BADGE
// ═══════════════════════════════════════════════════════════════════════════

function StatusBadge({ isActive }) {
  const color = isActive ? DARK_THEME.success : DARK_THEME.textMuted;
  const label = isActive ? 'ACTIVE' : 'INACTIVE';

  return (
    <span style={{
      padding: '4px 12px',
      backgroundColor: `${color}15`,
      border: `1px solid ${color}40`,
      borderRadius: '6px',
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '11px',
      letterSpacing: '0.05em',
      color,
      fontWeight: 600,
      flexShrink: 0,
      whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// INCIDENT STATUS BADGE (for history section)
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
// PRIORITY BADGE (for history section)
// ═══════════════════════════════════════════════════════════════════════════

function PriorityBadge({ priority }) {
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
// LABELED VALUE (View Mode)
// ═══════════════════════════════════════════════════════════════════════════

function LabeledValue({ label, value, icon: Icon, multiline = false }) {
  return (
    <div style={{ marginBottom: '20px', minWidth: 0 }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '8px',
      }}>
        {Icon && <Icon size={14} style={{ color: DARK_THEME.textMuted }} />}
        <span style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '12px',
          letterSpacing: '0.15em',
          color: DARK_THEME.textMuted,
        }}>
          {label}
        </span>
      </div>
      <div style={{
        fontFamily: 'DM Sans, sans-serif',
        fontSize: '15px',
        color: value ? DARK_THEME.text : DARK_THEME.textMuted,
        paddingLeft: Icon ? '22px' : '0',
        ...(multiline ? {
          wordBreak: 'break-word',
          whiteSpace: 'pre-wrap',
        } : {
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }),
      }}>
        {value || '—'}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// EDITABLE INPUT
// ═══════════════════════════════════════════════════════════════════════════

function EditableInput({ label, value, onChange, type = 'text', icon: Icon }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '10px',
      }}>
        {Icon && <Icon size={14} style={{ color: DARK_THEME.textMuted }} />}
        <span style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '12px',
          letterSpacing: '0.15em',
          color: DARK_THEME.textMuted,
        }}>
          {label}
        </span>
      </div>
      <input
        type={type}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: '14px 18px',
          backgroundColor: 'rgba(79, 195, 247, 0.04)',
          border: `1px solid ${DARK_THEME.border}`,
          borderRadius: '8px',
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '15px',
          color: DARK_THEME.text,
          outline: 'none',
          boxSizing: 'border-box',
          transition: 'border-color 0.2s, box-shadow 0.2s',
        }}
        onFocus={(e) => {
          e.target.style.borderColor = DARK_THEME.electric;
          e.target.style.boxShadow = `0 0 0 3px ${DARK_THEME.glow}`;
        }}
        onBlur={(e) => {
          e.target.style.borderColor = DARK_THEME.border;
          e.target.style.boxShadow = 'none';
        }}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// EDITABLE SELECT (Custom Styled Dropdown with Portal)
// ═══════════════════════════════════════════════════════════════════════════

function EditableSelect({ label, value, onChange, options, icon: Icon, required, hasError, errorMessage }) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);

  const selectedOption = options.find(opt => opt.value === value);

  // Determine border color
  const getBorderColor = () => {
    if (hasError) return DARK_THEME.danger;
    if (isOpen) return DARK_THEME.electric;
    return DARK_THEME.border;
  };

  // Update dropdown position
  const updatePosition = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    }
  }, []);

  // Update position when dropdown opens
  useEffect(() => {
    if (isOpen) {
      updatePosition();
    }
  }, [isOpen, updatePosition]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        containerRef.current && !containerRef.current.contains(e.target) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target)
      ) {
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

  // Update position on scroll/resize
  useEffect(() => {
    if (!isOpen) return;

    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen, updatePosition]);

  return (
    <div style={{ marginBottom: '20px' }} ref={containerRef}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '10px',
      }}>
        {Icon && <Icon size={14} style={{ color: DARK_THEME.textMuted }} />}
        <span style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '12px',
          letterSpacing: '0.15em',
          color: DARK_THEME.textMuted,
        }}>
          {label}
          {required && <span style={{ color: DARK_THEME.danger, marginLeft: '4px' }}>*</span>}
        </span>
      </div>

      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '14px 18px',
          backgroundColor: 'rgba(79, 195, 247, 0.04)',
          border: `1px solid ${getBorderColor()}`,
          borderRadius: '8px',
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '15px',
          color: value ? DARK_THEME.text : DARK_THEME.textMuted,
          cursor: 'pointer',
          outline: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          textAlign: 'left',
          boxShadow: isOpen ? `0 0 0 3px ${hasError ? DARK_THEME.danger + '30' : DARK_THEME.glow}` : 'none',
          transition: 'border-color 0.2s, box-shadow 0.2s',
          boxSizing: 'border-box',
        }}
      >
        <span>{selectedOption?.label || 'Select...'}</span>
        <ChevronDown
          size={16}
          style={{
            color: DARK_THEME.textMuted,
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
          }}
        />
      </button>

      {/* Dropdown Portal */}
      {isOpen && createPortal(
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
            maxHeight: '264px',
            overflowY: 'auto',
          }}
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: value === option.value ? `${DARK_THEME.electric}15` : 'transparent',
                border: 'none',
                borderBottom: `1px solid ${DARK_THEME.gridLine}`,
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '14px',
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
              {value === option.value && <Check size={16} style={{ color: DARK_THEME.electric }} />}
            </button>
          ))}
        </div>,
        document.body
      )}

      {/* Error Message */}
      {hasError && errorMessage && (
        <span style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '11px',
          color: DARK_THEME.danger,
          marginTop: '8px',
          display: 'block',
        }}>
          {errorMessage}
        </span>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// EDITABLE TEXTAREA
// ═══════════════════════════════════════════════════════════════════════════

function EditableTextarea({ label, value, onChange, icon: Icon }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '10px',
      }}>
        {Icon && <Icon size={14} style={{ color: DARK_THEME.textMuted }} />}
        <span style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '12px',
          letterSpacing: '0.15em',
          color: DARK_THEME.textMuted,
        }}>
          {label}
        </span>
      </div>
      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        style={{
          width: '100%',
          padding: '14px 18px',
          backgroundColor: 'rgba(79, 195, 247, 0.04)',
          border: `1px solid ${DARK_THEME.border}`,
          borderRadius: '8px',
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '15px',
          color: DARK_THEME.text,
          outline: 'none',
          resize: 'vertical',
          minHeight: '100px',
          boxSizing: 'border-box',
          transition: 'border-color 0.2s, box-shadow 0.2s',
        }}
        onFocus={(e) => {
          e.target.style.borderColor = DARK_THEME.electric;
          e.target.style.boxShadow = `0 0 0 3px ${DARK_THEME.glow}`;
        }}
        onBlur={(e) => {
          e.target.style.borderColor = DARK_THEME.border;
          e.target.style.boxShadow = 'none';
        }}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CONFIRMATION DIALOG
// ═══════════════════════════════════════════════════════════════════════════

function ConfirmDialog({ isOpen, title, message, confirmLabel, confirmColor, onConfirm, onCancel, isLoading }) {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
        borderRadius: '16px',
      }}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        style={{
          backgroundColor: DARK_THEME.surface,
          borderRadius: '12px',
          border: `1px solid ${DARK_THEME.border}`,
          padding: '24px',
          maxWidth: '360px',
          textAlign: 'center',
        }}
      >
        <AlertTriangle size={32} style={{ color: confirmColor, marginBottom: '12px' }} />
        <h3 style={{
          fontFamily: 'Rajdhani, sans-serif',
          fontSize: '18px',
          fontWeight: 700,
          color: DARK_THEME.text,
          margin: '0 0 8px 0',
        }}>
          {title}
        </h3>
        <p style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '12px',
          color: DARK_THEME.textMuted,
          margin: '0 0 20px 0',
          lineHeight: 1.5,
        }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={onCancel}
            disabled={isLoading}
            style={{
              padding: '10px 20px',
              backgroundColor: 'transparent',
              border: `1px solid ${DARK_THEME.border}`,
              borderRadius: '6px',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '11px',
              color: DARK_THEME.textMuted,
              cursor: 'pointer',
            }}
          >
            CANCEL
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            style={{
              padding: '10px 20px',
              backgroundColor: confirmColor,
              border: 'none',
              borderRadius: '6px',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '11px',
              fontWeight: 600,
              color: DARK_THEME.navy,
              cursor: isLoading ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {isLoading && <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />}
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN END USER MODAL
// ═══════════════════════════════════════════════════════════════════════════

function EndUserModal({
  isOpen,
  onClose,
  endUser,
  onUpdate,
  onDeactivate,
  onReactivate,
  onDelete,
  currentUser,
}) {
  const navigate = useNavigate();
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const [editErrors, setEditErrors] = useState({});

  // Company departments from database
  const { allDepartments, departmentOptions } = useCompanyDepartments();

  // Edit form state
  const [editData, setEditData] = useState({});

  // Incident history state
  const [incidentHistory, setIncidentHistory] = useState([]);
  const [incidentsLoading, setIncidentsLoading] = useState(false);

  // Check permissions
  const canWrite = currentUser?.role === 'admin' || currentUser?.role === 'owner';
  const canDelete = canWrite;

  // Initialize edit data when endUser changes
  useEffect(() => {
    if (endUser) {
      setEditData({
        full_name: endUser.full_name || '',
        email: endUser.email || '',
        phone: endUser.phone || '',
        department: endUser.department || '',
        location: endUser.location || '',
        employee_id: endUser.employee_id || '',
        notes: endUser.notes || '',
      });
      setIsEditMode(false);
      setHasUnsavedChanges(false);
      setEditErrors({});
    }
  }, [endUser]);

  // Fetch incident history when modal opens
  useEffect(() => {
    const fetchIncidents = async () => {
      if (!isOpen || !endUser?.id || endUser.incident_count === 0) {
        setIncidentHistory([]);
        return;
      }

      setIncidentsLoading(true);
      try {
        // Fetch all incidents and filter by reporter
        const allIncidents = await window.electronAPI.incidents.getAll();

        // Filter by reported_by, sort by created_at DESC, limit to 10
        const userIncidents = (allIncidents || [])
          .filter(inc => inc.reported_by === endUser.id)
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 10);

        setIncidentHistory(userIncidents);
      } catch (error) {
        console.error('Failed to fetch incident history:', error);
        setIncidentHistory([]);
      } finally {
        setIncidentsLoading(false);
      }
    };

    fetchIncidents();
  }, [isOpen, endUser?.id, endUser?.incident_count]);

  // Get department label
  const getDepartmentLabel = (value) => {
    const dept = allDepartments.find(d => d.id === value);
    return dept?.name || value?.toUpperCase() || '—';
  };

  // Handle edit data change
  const handleEditChange = (field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
    // Clear error for this field when user makes changes
    if (editErrors[field]) {
      setEditErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // Validate edit form
  const validateEditForm = () => {
    const newErrors = {};
    if (!editData.department) {
      newErrors.department = 'Department is required';
    }
    setEditErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle save
  const handleSave = async () => {
    if (!validateEditForm()) return;

    setIsLoading(true);
    try {
      const updates = {};
      Object.keys(editData).forEach(key => {
        const newValue = editData[key]?.trim() || null;
        const oldValue = endUser[key] || null;
        if (newValue !== oldValue) {
          updates[key] = newValue;
        }
      });

      if (Object.keys(updates).length > 0) {
        const result = await onUpdate(endUser.id, updates);
        if (result?.success) {
          setIsEditMode(false);
          setHasUnsavedChanges(false);
        }
      } else {
        setIsEditMode(false);
        setHasUnsavedChanges(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedWarning(true);
    } else {
      setIsEditMode(false);
      setEditErrors({});
      setEditData({
        full_name: endUser.full_name || '',
        email: endUser.email || '',
        phone: endUser.phone || '',
        department: endUser.department || '',
        location: endUser.location || '',
        employee_id: endUser.employee_id || '',
        notes: endUser.notes || '',
      });
    }
  };

  // Handle close
  const handleClose = () => {
    if (hasUnsavedChanges && isEditMode) {
      setShowUnsavedWarning(true);
    } else {
      onClose();
    }
  };

  // Handle deactivate/reactivate
  const handleToggleActive = async () => {
    setIsLoading(true);
    try {
      if (endUser.is_active) {
        await onDeactivate(endUser.id);
      } else {
        await onReactivate(endUser.id);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await onDelete(endUser.id);
      setShowDeleteConfirm(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !endUser) return null;

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="enduser-modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(5, 10, 24, 0.85)',
          backdropFilter: 'blur(4px)',
          zIndex: 500,
        }}
      />

      {/* Modal Container */}
      <div key="enduser-modal-container" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 501,
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
            maxWidth: '700px',
            maxHeight: '90vh',
            backgroundColor: DARK_THEME.surface,
            borderRadius: '14px',
            border: `1px solid ${DARK_THEME.border}`,
            boxShadow: `0 0 60px ${DARK_THEME.glow}, 0 0 120px rgba(79, 195, 247, 0.1)`,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            pointerEvents: 'auto',
          }}
        >
          {/* Accent Bar */}
          <div style={{
            height: '6px',
            background: `linear-gradient(90deg, ${DARK_THEME.electric} 0%, ${DARK_THEME.electric2} 50%, transparent 100%)`,
            flexShrink: 0,
          }} />

          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '16px',
            padding: '24px 28px 20px',
            borderBottom: `1px solid ${DARK_THEME.border}`,
            flexShrink: 0,
          }}>
            <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '6px' }}>
                <h2 style={{
                  fontFamily: 'Rajdhani, sans-serif',
                  fontSize: '26px',
                  fontWeight: 600,
                  letterSpacing: '0.05em',
                  color: DARK_THEME.text,
                  margin: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  flex: 1,
                  minWidth: 0,
                }}>
                  {endUser.full_name}
                </h2>
                <StatusBadge isActive={endUser.is_active} />
              </div>
              <span style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '11px',
                letterSpacing: '0.1em',
                color: DARK_THEME.electric,
              }}>
                {endUser.id}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
              {!isEditMode && canWrite && (
                <motion.button
                  onClick={() => setIsEditMode(true)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    padding: '12px 20px',
                    background: `linear-gradient(135deg, ${DARK_THEME.navy}, ${DARK_THEME.electric}40)`,
                    border: `1px solid ${DARK_THEME.electric}`,
                    borderRadius: '8px',
                    fontFamily: 'Rajdhani, sans-serif',
                    fontWeight: 600,
                    fontSize: '13px',
                    letterSpacing: '0.1em',
                    color: DARK_THEME.electric,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <Edit2 size={16} />
                  EDIT
                </motion.button>
              )}
              <button
                onClick={handleClose}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  backgroundColor: 'transparent',
                  border: `1px solid ${DARK_THEME.border}`,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={18} style={{ color: DARK_THEME.textMuted }} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflow: 'auto', padding: '28px' }}>
            {/* Two Column Layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', overflow: 'hidden' }}>
              {/* Left Column */}
              <div style={{ minWidth: 0, overflow: 'hidden' }}>
                {isEditMode ? (
                  <>
                    <EditableInput
                      label="FULL NAME"
                      value={editData.full_name}
                      onChange={(v) => handleEditChange('full_name', v)}
                    />
                    <EditableInput
                      label="EMAIL"
                      type="email"
                      value={editData.email}
                      onChange={(v) => handleEditChange('email', v)}
                      icon={Mail}
                    />
                    <EditableInput
                      label="PHONE"
                      value={editData.phone}
                      onChange={(v) => handleEditChange('phone', v)}
                      icon={Phone}
                    />
                    <EditableInput
                      label="LOCATION"
                      value={editData.location}
                      onChange={(v) => handleEditChange('location', v)}
                      icon={MapPin}
                    />
                  </>
                ) : (
                  <>
                    <LabeledValue label="FULL NAME" value={endUser.full_name} />
                    <LabeledValue label="EMAIL" value={endUser.email} icon={Mail} />
                    <LabeledValue label="PHONE" value={endUser.phone} icon={Phone} />
                    <LabeledValue label="LOCATION" value={endUser.location} icon={MapPin} />
                  </>
                )}
              </div>

              {/* Right Column */}
              <div style={{ minWidth: 0, overflow: 'hidden' }}>
                {isEditMode ? (
                  <>
                    <EditableSelect
                      label="DEPARTMENT"
                      value={editData.department}
                      onChange={(v) => handleEditChange('department', v)}
                      options={departmentOptions}
                      icon={Building2}
                      required
                      hasError={!!editErrors.department}
                      errorMessage={editErrors.department}
                    />
                    <EditableInput
                      label="EMPLOYEE ID"
                      value={editData.employee_id}
                      onChange={(v) => handleEditChange('employee_id', v)}
                      icon={Hash}
                    />
                    <EditableTextarea
                      label="NOTES"
                      value={editData.notes}
                      onChange={(v) => handleEditChange('notes', v)}
                      icon={FileText}
                    />
                  </>
                ) : (
                  <>
                    <LabeledValue label="DEPARTMENT" value={getDepartmentLabel(endUser.department)} icon={Building2} />
                    <LabeledValue label="EMPLOYEE ID" value={endUser.employee_id} icon={Hash} />
                    <LabeledValue label="NOTES" value={endUser.notes} icon={FileText} multiline />
                  </>
                )}
              </div>
            </div>

            {/* Incident History Section */}
            {!isEditMode && (
              <div style={{ marginTop: '32px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '16px',
                }}>
                  <h3 style={{
                    fontFamily: 'Rajdhani, sans-serif',
                    fontSize: '16px',
                    fontWeight: 600,
                    color: DARK_THEME.text,
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}>
                    <FileText size={16} style={{ color: DARK_THEME.electric }} />
                    INCIDENT HISTORY
                    <span style={{
                      padding: '2px 8px',
                      backgroundColor: `${DARK_THEME.electric}15`,
                      borderRadius: '4px',
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '11px',
                      color: DARK_THEME.electric,
                    }}>
                      {endUser.incident_count || 0}
                    </span>
                  </h3>
                </div>

                {endUser.incident_count === 0 ? (
                  <div style={{
                    padding: '32px',
                    backgroundColor: DARK_THEME.navy,
                    borderRadius: '10px',
                    textAlign: 'center',
                  }}>
                    <CheckCircle size={24} style={{ color: DARK_THEME.success, marginBottom: '8px' }} />
                    <p style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '12px',
                      color: DARK_THEME.textMuted,
                      margin: 0,
                    }}>
                      No incidents reported by this user
                    </p>
                  </div>
                ) : incidentsLoading ? (
                  <div style={{
                    padding: '32px',
                    backgroundColor: DARK_THEME.navy,
                    borderRadius: '10px',
                    textAlign: 'center',
                  }}>
                    <Loader2 size={24} style={{ color: DARK_THEME.electric, marginBottom: '8px', animation: 'spin 1s linear infinite' }} />
                    <p style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '12px',
                      color: DARK_THEME.textMuted,
                      margin: 0,
                    }}>
                      Loading incidents...
                    </p>
                  </div>
                ) : (
                  <div style={{
                    backgroundColor: DARK_THEME.navy,
                    borderRadius: '10px',
                    overflow: 'hidden',
                  }}>
                    {/* Incident List - Scrollable Container */}
                    <div style={{
                      maxHeight: '240px',
                      overflowY: 'auto',
                    }}>
                      {incidentHistory.map((incident, index) => {
                        const timestamp = formatSmartTimestamp(incident.created_at);
                        return (
                          <motion.div
                            key={incident.id}
                            onClick={() => {
                              onClose();
                              navigate(`/dashboard/incidents/${incident.id}/edit`);
                            }}
                            whileHover={{ backgroundColor: `${DARK_THEME.electric}08` }}
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '100px 1fr auto',
                              alignItems: 'center',
                              gap: '12px',
                              padding: '12px 16px',
                              borderBottom: index < incidentHistory.length - 1 ? `1px solid ${DARK_THEME.border}` : 'none',
                              cursor: 'pointer',
                              transition: 'background-color 0.15s ease',
                            }}
                          >
                            {/* Incident ID */}
                            <span style={{
                              fontFamily: 'JetBrains Mono, monospace',
                              fontSize: '12px',
                              fontWeight: 600,
                              color: DARK_THEME.electric,
                            }}>
                              {incident.id}
                            </span>

                            {/* Title + Badges */}
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
                              <PriorityBadge priority={incident.priority} />
                              <IncidentStatusBadge status={incident.status} />
                            </div>

                            {/* Timestamp + Arrow */}
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                            }}>
                              <span style={{
                                fontFamily: 'JetBrains Mono, monospace',
                                fontSize: '10px',
                                color: DARK_THEME.textMuted,
                              }}>
                                {timestamp.display}
                              </span>
                              <ChevronRight size={14} style={{ color: DARK_THEME.textMuted }} />
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>

                    {/* View All Button - Show if more than 10 incidents */}
                    {endUser.incident_count > 10 && (
                      <motion.button
                        onClick={() => {
                          onClose();
                          // Navigate to incidents page with reporter filter
                          navigate(`/dashboard/incidents?reporter=${endUser.id}`);
                        }}
                        whileHover={{ backgroundColor: `${DARK_THEME.electric}15` }}
                        whileTap={{ scale: 0.98 }}
                        style={{
                          width: '100%',
                          padding: '14px',
                          backgroundColor: 'transparent',
                          border: 'none',
                          borderTop: `1px solid ${DARK_THEME.border}`,
                          fontFamily: 'JetBrains Mono, monospace',
                          fontSize: '11px',
                          fontWeight: 600,
                          letterSpacing: '0.05em',
                          color: DARK_THEME.electric,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                        }}
                      >
                        <ExternalLink size={14} />
                        VIEW ALL {endUser.incident_count} INCIDENTS
                      </motion.button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Edit Mode Buttons */}
            {isEditMode && (
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '14px',
                marginTop: '28px',
                paddingTop: '24px',
                borderTop: `1px solid ${DARK_THEME.border}`,
              }}>
                <motion.button
                  onClick={handleCancelEdit}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    padding: '14px 28px',
                    backgroundColor: 'transparent',
                    border: `1px solid ${DARK_THEME.border}`,
                    borderRadius: '8px',
                    fontFamily: 'Rajdhani, sans-serif',
                    fontWeight: 600,
                    fontSize: '14px',
                    letterSpacing: '0.15em',
                    color: DARK_THEME.textMuted,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <XCircle size={16} />
                  CANCEL
                </motion.button>
                <motion.button
                  onClick={handleSave}
                  disabled={isLoading}
                  whileHover={{ scale: isLoading ? 1 : 1.02 }}
                  whileTap={{ scale: isLoading ? 1 : 0.98 }}
                  style={{
                    padding: '14px 28px',
                    background: `linear-gradient(135deg, ${DARK_THEME.navy}, ${DARK_THEME.electric}40)`,
                    border: `1px solid ${DARK_THEME.electric}`,
                    borderRadius: '8px',
                    fontFamily: 'Rajdhani, sans-serif',
                    fontWeight: 600,
                    fontSize: '14px',
                    letterSpacing: '0.15em',
                    color: DARK_THEME.electric,
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    opacity: isLoading ? 0.7 : 1,
                  }}
                >
                  {isLoading ? (
                    <>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        border: `2px solid ${DARK_THEME.electric}`,
                        borderTopColor: 'transparent',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                      }} />
                      SAVING...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      SAVE CHANGES
                    </>
                  )}
                </motion.button>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          {!isEditMode && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '20px 28px',
              borderTop: `1px solid ${DARK_THEME.border}`,
              flexShrink: 0,
            }}>
              <div style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '11px',
                color: DARK_THEME.textMuted,
              }}>
                Created: {endUser.created_at ? formatSmartTimestamp(endUser.created_at).display : '—'}
              </div>

              <div style={{ display: 'flex', gap: '14px' }}>
                {/* Deactivate/Reactivate Button */}
                <motion.button
                  onClick={handleToggleActive}
                  disabled={isLoading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    padding: '12px 20px',
                    backgroundColor: endUser.is_active ? `${DARK_THEME.warning}15` : `${DARK_THEME.success}15`,
                    border: `1px solid ${endUser.is_active ? DARK_THEME.warning : DARK_THEME.success}`,
                    borderRadius: '8px',
                    fontFamily: 'Rajdhani, sans-serif',
                    fontWeight: 600,
                    fontSize: '13px',
                    letterSpacing: '0.1em',
                    color: endUser.is_active ? DARK_THEME.warning : DARK_THEME.success,
                    cursor: isLoading ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  {endUser.is_active ? (
                    <>
                      <UserMinus size={16} />
                      DEACTIVATE
                    </>
                  ) : (
                    <>
                      <UserPlus size={16} />
                      REACTIVATE
                    </>
                  )}
                </motion.button>

                {/* Delete Button */}
                {canWrite && (
                  <motion.button
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={!canDelete || isLoading}
                    whileHover={canDelete ? { scale: 1.02 } : {}}
                    whileTap={canDelete ? { scale: 0.98 } : {}}
                    title="Delete user"
                    style={{
                      padding: '12px 20px',
                      backgroundColor: canDelete ? `${DARK_THEME.danger}15` : 'transparent',
                      border: `1px solid ${canDelete ? DARK_THEME.danger : DARK_THEME.border}`,
                      borderRadius: '8px',
                      fontFamily: 'Rajdhani, sans-serif',
                      fontWeight: 600,
                      fontSize: '13px',
                      letterSpacing: '0.1em',
                      color: canDelete ? DARK_THEME.danger : DARK_THEME.textMuted,
                      cursor: canDelete ? 'pointer' : 'not-allowed',
                      opacity: canDelete ? 1 : 0.5,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <Trash2 size={16} />
                    DELETE
                  </motion.button>
                )}
              </div>
            </div>
          )}

          {/* Delete Confirmation Dialog */}
          <ConfirmDialog
            isOpen={showDeleteConfirm}
            title="DELETE END USER"
            message={`Are you sure you want to permanently delete ${endUser.full_name}? This action cannot be undone.`}
            confirmLabel="DELETE"
            confirmColor={DARK_THEME.danger}
            onConfirm={handleDelete}
            onCancel={() => setShowDeleteConfirm(false)}
            isLoading={isLoading}
          />

          {/* Unsaved Changes Warning */}
          <ConfirmDialog
            isOpen={showUnsavedWarning}
            title="UNSAVED CHANGES"
            message="You have unsaved changes. Are you sure you want to discard them?"
            confirmLabel="DISCARD"
            confirmColor={DARK_THEME.warning}
            onConfirm={() => {
              setShowUnsavedWarning(false);
              setIsEditMode(false);
              setHasUnsavedChanges(false);
              setEditErrors({});
              setEditData({
                full_name: endUser.full_name || '',
                email: endUser.email || '',
                phone: endUser.phone || '',
                department: endUser.department || '',
                location: endUser.location || '',
                employee_id: endUser.employee_id || '',
                notes: endUser.notes || '',
              });
            }}
            onCancel={() => setShowUnsavedWarning(false)}
            isLoading={false}
          />
        </motion.div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </AnimatePresence>
  );
}

export default EndUserModal;
