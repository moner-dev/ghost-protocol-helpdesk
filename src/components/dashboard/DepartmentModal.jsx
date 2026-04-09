/**
 * GHOST PROTOCOL — Department Modal
 *
 * View/Edit modal for company departments.
 * Shows department details, linked end users, and allows editing.
 * Dark theme matching Ghost Protocol design system.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Building2, FileText, User, Users, Edit2, Save,
  Calendar, Clock, UserPlus
} from 'lucide-react';
import { DARK_THEME } from '@/constants/theme';

// ═══════════════════════════════════════════════════════════════════════════
// DETAIL ROW COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

function DetailRow({ label, value, icon: Icon }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '11px',
        letterSpacing: '0.1em',
        color: DARK_THEME.textMuted,
        marginBottom: '6px',
      }}>
        <Icon size={12} />
        {label}
      </div>
      <div style={{
        fontFamily: 'DM Sans, sans-serif',
        fontSize: '15px',
        color: DARK_THEME.text,
        paddingLeft: '20px',
      }}>
        {value || '—'}
      </div>
    </div>
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
      padding: '6px 14px',
      backgroundColor: `${color}15`,
      border: `1px solid ${color}40`,
      borderRadius: '6px',
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '11px',
      letterSpacing: '0.05em',
      color,
    }}>
      {label}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// INPUT STYLE
// ═══════════════════════════════════════════════════════════════════════════

const inputStyle = {
  width: '100%',
  padding: '14px 18px',
  backgroundColor: 'rgba(79, 195, 247, 0.04)',
  border: `1px solid ${DARK_THEME.border}`,
  borderRadius: '8px',
  fontFamily: 'DM Sans, sans-serif',
  fontSize: '15px',
  color: DARK_THEME.text,
  outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s',
  boxSizing: 'border-box',
};

// ═══════════════════════════════════════════════════════════════════════════
// FORM FIELD (for edit mode)
// ═══════════════════════════════════════════════════════════════════════════

function FormField({ label, icon: Icon, required, children }) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <label style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '12px',
        letterSpacing: '0.15em',
        color: DARK_THEME.textMuted,
        marginBottom: '10px',
      }}>
        <Icon size={14} />
        {label}
        {required && <span style={{ color: DARK_THEME.danger }}>*</span>}
      </label>
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// DEPARTMENT MODAL
// ═══════════════════════════════════════════════════════════════════════════

function DepartmentModal({
  isOpen,
  onClose,
  department,
  onUpdate,
  onReactivate,
  canEdit = false,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editManagerName, setEditManagerName] = useState('');

  // Sync form state when department changes
  useEffect(() => {
    if (department) {
      setEditName(department.name || '');
      setEditDescription(department.description || '');
      setEditManagerName(department.manager_name || '');
      setIsEditing(false);
      setErrors({});
    }
  }, [department]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (isEditing) {
          handleCancelEdit();
        } else {
          onClose();
        }
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isEditing]);

  // Enter edit mode
  const handleStartEdit = () => {
    setEditName(department.name || '');
    setEditDescription(department.description || '');
    setEditManagerName(department.manager_name || '');
    setErrors({});
    setIsEditing(true);
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditName(department.name || '');
    setEditDescription(department.description || '');
    setEditManagerName(department.manager_name || '');
    setErrors({});
    setIsEditing(false);
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    if (!editName.trim()) {
      newErrors.name = 'Department name is required';
    } else if (editName.trim().length < 2) {
      newErrors.name = 'Department name must be at least 2 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save changes
  const handleSave = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const updates = {
        name: editName.trim(),
        description: editDescription.trim() || null,
        manager_name: editManagerName.trim() || null,
      };

      const result = await onUpdate(department.id, updates);
      if (result?.success) {
        setIsEditing(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle reactivate
  const handleReactivate = async () => {
    setIsLoading(true);
    try {
      await onReactivate(department);
    } finally {
      setIsLoading(false);
    }
  };

  if (!department) return null;

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !isEditing && onClose()}
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
          <div style={{
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
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '94%',
                maxWidth: '600px',
                maxHeight: '90vh',
                overflowY: 'auto',
                backgroundColor: DARK_THEME.surface,
                border: `1px solid ${DARK_THEME.border}`,
                borderRadius: '14px',
                boxShadow: `0 0 60px ${DARK_THEME.glow}, 0 0 120px rgba(79, 195, 247, 0.1)`,
                pointerEvents: 'auto',
              }}
            >
              {/* Accent Bar */}
              <div style={{
                height: '6px',
                background: `linear-gradient(90deg, ${DARK_THEME.electric} 0%, ${DARK_THEME.electric2} 50%, transparent 100%)`,
              }} />

              {/* Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                padding: '24px 28px 20px',
                borderBottom: `1px solid ${DARK_THEME.border}`,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <h2 style={{
                      fontFamily: 'Rajdhani, sans-serif',
                      fontSize: '26px',
                      fontWeight: 600,
                      letterSpacing: '0.1em',
                      color: DARK_THEME.text,
                      margin: 0,
                    }}>
                      {isEditing ? 'EDIT DEPARTMENT' : 'DEPARTMENT DETAILS'}
                    </h2>
                    <StatusBadge isActive={department.is_active} />
                  </div>
                  <span style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '11px',
                    letterSpacing: '0.1em',
                    color: DARK_THEME.electric,
                  }}>
                    {department.id}
                  </span>
                </div>

                <motion.button
                  onClick={() => isEditing ? handleCancelEdit() : onClose()}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  style={{
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'transparent',
                    border: `1px solid ${DARK_THEME.border}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                >
                  <X size={18} style={{ color: DARK_THEME.textMuted }} />
                </motion.button>
              </div>

              {/* Content */}
              <div style={{ padding: '28px' }}>
                {isEditing ? (
                  // ═══════════════════════════════════════════════════════════
                  // EDIT MODE
                  // ═══════════════════════════════════════════════════════════
                  <>
                    {/* Department Name */}
                    <FormField label="DEPARTMENT NAME" icon={Building2} required>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Enter department name..."
                        style={{
                          ...inputStyle,
                          borderColor: errors.name ? DARK_THEME.danger : DARK_THEME.border,
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = errors.name ? DARK_THEME.danger : DARK_THEME.electric;
                          e.target.style.boxShadow = `0 0 0 3px ${errors.name ? DARK_THEME.danger + '30' : DARK_THEME.glow}`;
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = errors.name ? DARK_THEME.danger : DARK_THEME.border;
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                      {errors.name && (
                        <span style={{
                          fontFamily: 'JetBrains Mono, monospace',
                          fontSize: '11px',
                          color: DARK_THEME.danger,
                          marginTop: '8px',
                          display: 'block',
                        }}>
                          {errors.name}
                        </span>
                      )}
                    </FormField>

                    {/* Description */}
                    <FormField label="DESCRIPTION" icon={FileText}>
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder="Brief description of this department..."
                        rows={3}
                        style={{
                          ...inputStyle,
                          resize: 'vertical',
                          minHeight: '80px',
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
                    </FormField>

                    {/* Manager Name */}
                    <FormField label="DEPARTMENT MANAGER" icon={User}>
                      <input
                        type="text"
                        value={editManagerName}
                        onChange={(e) => setEditManagerName(e.target.value)}
                        placeholder="Name of department manager..."
                        style={inputStyle}
                        onFocus={(e) => {
                          e.target.style.borderColor = DARK_THEME.electric;
                          e.target.style.boxShadow = `0 0 0 3px ${DARK_THEME.glow}`;
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = DARK_THEME.border;
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                    </FormField>
                  </>
                ) : (
                  // ═══════════════════════════════════════════════════════════
                  // VIEW MODE
                  // ═══════════════════════════════════════════════════════════
                  <>
                    <DetailRow label="NAME" value={department.name} icon={Building2} />
                    <DetailRow label="DESCRIPTION" value={department.description} icon={FileText} />
                    <DetailRow label="MANAGER" value={department.manager_name} icon={User} />

                    {/* Stats Section */}
                    <div style={{
                      padding: '20px',
                      backgroundColor: 'rgba(79, 195, 247, 0.04)',
                      border: `1px solid ${DARK_THEME.border}`,
                      borderRadius: '10px',
                      marginTop: '24px',
                      marginBottom: '24px',
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '11px',
                        letterSpacing: '0.1em',
                        color: DARK_THEME.textMuted,
                        marginBottom: '12px',
                      }}>
                        <Users size={14} />
                        LINKED END USERS
                      </div>
                      <div style={{
                        fontFamily: 'Rajdhani, sans-serif',
                        fontSize: '32px',
                        fontWeight: 700,
                        color: department.end_user_count > 0 ? DARK_THEME.electric : DARK_THEME.textMuted,
                      }}>
                        {department.end_user_count || 0}
                      </div>
                      {department.end_user_count > 0 && (
                        <span style={{
                          fontFamily: 'JetBrains Mono, monospace',
                          fontSize: '11px',
                          color: DARK_THEME.textMuted,
                        }}>
                          employees assigned to this department
                        </span>
                      )}
                    </div>

                    {/* Metadata */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      <DetailRow label="CREATED" value={formatDate(department.created_at)} icon={Calendar} />
                      <DetailRow label="LAST UPDATED" value={formatDate(department.updated_at)} icon={Clock} />
                    </div>
                  </>
                )}
              </div>

              {/* Footer */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '20px 28px 28px',
                borderTop: `1px solid ${DARK_THEME.border}`,
              }}>
                {/* Left side - Reactivate button (only for inactive departments) */}
                <div>
                  {canEdit && !isEditing && !department.is_active && (
                    <motion.button
                      onClick={handleReactivate}
                      disabled={isLoading}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      style={{
                        padding: '12px 20px',
                        backgroundColor: 'transparent',
                        border: `1px solid ${DARK_THEME.success}`,
                        borderRadius: '8px',
                        fontFamily: 'Rajdhani, sans-serif',
                        fontWeight: 600,
                        fontSize: '13px',
                        letterSpacing: '0.1em',
                        color: DARK_THEME.success,
                        cursor: isLoading ? 'wait' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        opacity: isLoading ? 0.7 : 1,
                      }}
                    >
                      <UserPlus size={16} />
                      REACTIVATE
                    </motion.button>
                  )}
                </div>

                {/* Right side - Action buttons */}
                <div style={{ display: 'flex', gap: '14px' }}>
                  {isEditing ? (
                    <>
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
                        }}
                      >
                        CANCEL
                      </motion.button>

                      <motion.button
                        onClick={handleSave}
                        disabled={isLoading || !editName.trim()}
                        whileHover={{ scale: !isLoading && editName.trim() ? 1.02 : 1 }}
                        whileTap={{ scale: !isLoading && editName.trim() ? 0.98 : 1 }}
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
                          cursor: isLoading || !editName.trim() ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          opacity: isLoading || !editName.trim() ? 0.7 : 1,
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
                    </>
                  ) : (
                    <>
                      <motion.button
                        onClick={onClose}
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
                        }}
                      >
                        CLOSE
                      </motion.button>

                      {canEdit && (
                        <motion.button
                          onClick={handleStartEdit}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
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
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                          }}
                        >
                          <Edit2 size={16} />
                          EDIT
                        </motion.button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          <style>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
        </>
      )}
    </AnimatePresence>
  );
}

export default DepartmentModal;
