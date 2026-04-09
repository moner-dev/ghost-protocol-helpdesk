/**
 * GHOST PROTOCOL — Add Department Modal
 *
 * Focused creation modal for adding new company departments.
 * Dark theme with form validation — matching NewIncidentModal styling.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Building2, FileText, User, Plus } from 'lucide-react';
import { DARK_THEME } from '@/constants/theme';

// ═══════════════════════════════════════════════════════════════════════════
// FORM FIELD COMPONENT (matches NewIncidentModal)
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
// INPUT STYLE (matches NewIncidentModal)
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
// ADD DEPARTMENT MODAL
// ═══════════════════════════════════════════════════════════════════════════

function AddDepartmentModal({ isOpen, onClose, onCreate }) {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [managerName, setManagerName] = useState('');

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  // Reset form
  const resetForm = () => {
    setName('');
    setDescription('');
    setManagerName('');
    setErrors({});
  };

  // Handle close
  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    if (!name.trim()) {
      newErrors.name = 'Department name is required';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Department name must be at least 2 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const data = {
        name: name.trim(),
        description: description.trim() || null,
        manager_name: managerName.trim() || null,
      };

      const result = await onCreate(data);
      if (result?.success) {
        handleClose();
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Check if form is valid for submit
  const canSubmit = name.trim().length > 0 && !isLoading;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
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
                maxWidth: '520px',
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
                alignItems: 'center',
                padding: '24px 28px 20px',
                borderBottom: `1px solid ${DARK_THEME.border}`,
              }}>
                <div>
                  <h2 style={{
                    fontFamily: 'Rajdhani, sans-serif',
                    fontSize: '26px',
                    fontWeight: 600,
                    letterSpacing: '0.1em',
                    color: DARK_THEME.text,
                    margin: 0,
                  }}>
                    NEW DEPARTMENT
                  </h2>
                  <span style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '11px',
                    letterSpacing: '0.1em',
                    color: DARK_THEME.textMuted,
                  }}>
                    CREATE COMPANY DEPARTMENT
                  </span>
                </div>

                <motion.button
                  onClick={handleClose}
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

              {/* Form */}
              <div style={{ padding: '28px' }}>
                {/* Department Name */}
                <FormField label="DEPARTMENT NAME" icon={Building2} required>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
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
                <FormField label="DESCRIPTION (OPTIONAL)" icon={FileText}>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
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
                <FormField label="DEPARTMENT MANAGER (OPTIONAL)" icon={User}>
                  <input
                    type="text"
                    value={managerName}
                    onChange={(e) => setManagerName(e.target.value)}
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
              </div>

              {/* Footer */}
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '14px',
                padding: '20px 28px 28px',
                borderTop: `1px solid ${DARK_THEME.border}`,
              }}>
                <motion.button
                  onClick={handleClose}
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
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  whileHover={{ scale: canSubmit ? 1.02 : 1 }}
                  whileTap={{ scale: canSubmit ? 0.98 : 1 }}
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
                    cursor: canSubmit ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    opacity: canSubmit ? 1 : 0.7,
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
                      CREATING...
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      CREATE DEPARTMENT
                    </>
                  )}
                </motion.button>
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

export default AddDepartmentModal;
