/**
 * GHOST PROTOCOL — Add End User Modal
 *
 * Focused creation modal for adding new end users (reporters).
 * Dark theme with form validation — matching NewIncidentModal styling.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, User, Mail, Phone, Building2, MapPin, Hash, FileText, Send, ChevronDown, Check } from 'lucide-react';
import { DARK_THEME } from '@/constants/theme';
import { useCompanyDepartments } from '@/hooks/useCompanyDepartments';

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
// STYLED SELECT (Custom Dropdown)
// ═══════════════════════════════════════════════════════════════════════════

function StyledSelect({ value, onChange, options, placeholder, disabled, hasError }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = React.useRef(null);

  const selectedOption = options.find(opt => opt.value === value);

  // Determine border color
  const getBorderColor = () => {
    if (hasError) return DARK_THEME.danger;
    if (isOpen) return DARK_THEME.electric;
    if (value) return DARK_THEME.electric;
    return DARK_THEME.border;
  };

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

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        style={{
          width: '100%',
          padding: '14px 18px',
          backgroundColor: 'rgba(79, 195, 247, 0.04)',
          border: `1px solid ${getBorderColor()}`,
          borderRadius: '8px',
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '15px',
          color: value ? DARK_THEME.text : DARK_THEME.textMuted,
          cursor: disabled ? 'wait' : 'pointer',
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
        <span>{selectedOption?.label || placeholder}</span>
        <ChevronDown
          size={16}
          style={{
            color: DARK_THEME.textMuted,
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
          }}
        />
      </button>

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
              right: 0,
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ADD END USER MODAL
// ═══════════════════════════════════════════════════════════════════════════

function AddEndUserModal({ isOpen, onClose, onCreate }) {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Company departments from database
  const { departments, isLoading: deptsLoading } = useCompanyDepartments();

  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [location, setLocation] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [notes, setNotes] = useState('');

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
    setFullName('');
    setEmail('');
    setPhone('');
    setDepartment('');
    setLocation('');
    setEmployeeId('');
    setNotes('');
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
    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    if (!department) {
      newErrors.department = 'Department is required';
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Invalid email format';
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
        full_name: fullName.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        department: department || null,
        location: location.trim() || null,
        employee_id: employeeId.trim() || null,
        notes: notes.trim() || null,
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
  const canSubmit = fullName.trim().length > 0 && department && !isLoading;

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
                maxWidth: '580px',
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
                    NEW END USER
                  </h2>
                  <span style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '11px',
                    letterSpacing: '0.1em',
                    color: DARK_THEME.textMuted,
                  }}>
                    CREATE NEW EMPLOYEE RECORD
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
                {/* Full Name */}
                <FormField label="FULL NAME" icon={User} required>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter full name..."
                    style={{
                      ...inputStyle,
                      borderColor: errors.fullName ? DARK_THEME.danger : DARK_THEME.border,
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = errors.fullName ? DARK_THEME.danger : DARK_THEME.electric;
                      e.target.style.boxShadow = `0 0 0 3px ${errors.fullName ? DARK_THEME.danger + '30' : DARK_THEME.glow}`;
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = errors.fullName ? DARK_THEME.danger : DARK_THEME.border;
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                  {errors.fullName && (
                    <span style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '11px',
                      color: DARK_THEME.danger,
                      marginTop: '8px',
                      display: 'block',
                    }}>
                      {errors.fullName}
                    </span>
                  )}
                </FormField>

                {/* Email & Phone Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <FormField label="EMAIL" icon={Mail}>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@company.com"
                      style={{
                        ...inputStyle,
                        borderColor: errors.email ? DARK_THEME.danger : DARK_THEME.border,
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = errors.email ? DARK_THEME.danger : DARK_THEME.electric;
                        e.target.style.boxShadow = `0 0 0 3px ${errors.email ? DARK_THEME.danger + '30' : DARK_THEME.glow}`;
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = errors.email ? DARK_THEME.danger : DARK_THEME.border;
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                    {errors.email && (
                      <span style={{
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '11px',
                        color: DARK_THEME.danger,
                        marginTop: '8px',
                        display: 'block',
                      }}>
                        {errors.email}
                      </span>
                    )}
                  </FormField>

                  <FormField label="PHONE" icon={Phone}>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
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

                {/* Department */}
                <FormField label="DEPARTMENT" icon={Building2} required>
                  <StyledSelect
                    value={department}
                    onChange={(val) => {
                      setDepartment(val);
                      if (errors.department) setErrors((prev) => ({ ...prev, department: null }));
                    }}
                    disabled={deptsLoading}
                    placeholder="Select department..."
                    options={departments.map((dept) => ({ value: dept.id, label: dept.name }))}
                    hasError={!!errors.department}
                  />
                  {errors.department && (
                    <span style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '11px',
                      color: DARK_THEME.danger,
                      marginTop: '8px',
                      display: 'block',
                    }}>
                      {errors.department}
                    </span>
                  )}
                </FormField>

                {/* Location & Employee ID Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <FormField label="LOCATION" icon={MapPin}>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Office / Building / Floor"
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

                  <FormField label="EMPLOYEE ID" icon={Hash}>
                    <input
                      type="text"
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      placeholder="EMP-12345"
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

                {/* Notes */}
                <FormField label="NOTES (OPTIONAL)" icon={FileText}>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Additional notes about this employee..."
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
                      <UserPlus size={16} />
                      CREATE END USER
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

export default AddEndUserModal;
