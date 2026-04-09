import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { DARK_THEME } from '@/constants/theme';
import { PRIORITY_OPTIONS, DEPARTMENT_OPTIONS, STATUS_OPTIONS } from '@/constants/options';

function EditIncidentModal({ isOpen, onClose, incident, onSave }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    department: 'helpdesk',
    status: 'new',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form when incident changes
  useEffect(() => {
    if (incident) {
      setFormData({
        title: incident.title || '',
        description: incident.description || '',
        priority: incident.priority || 'medium',
        department: incident.department || 'helpdesk',
        status: incident.status || 'new',
      });
    }
  }, [incident]);

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

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 5) {
      newErrors.title = 'Title must be at least 5 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsSubmitting(true);

    const updatedIncident = {
      ...incident,
      ...formData,
    };

    await new Promise((resolve) => setTimeout(resolve, 500));

    onSave(updatedIncident);
    setIsSubmitting(false);
    onClose();
  };

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
  };

  if (!incident) return null;

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
          <div
            style={{
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
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{
                width: '94%',
                maxWidth: '680px',
                maxHeight: '90vh',
                overflowY: 'auto',
                backgroundColor: DARK_THEME.surface,
                border: `1px solid ${DARK_THEME.border}`,
                borderRadius: '14px',
                boxShadow: `0 0 60px ${DARK_THEME.glow}`,
                pointerEvents: 'auto',
              }}
            >
              {/* Accent Bar */}
              <div
                style={{
                  height: '6px',
                  background: `linear-gradient(90deg, ${DARK_THEME.gold} 0%, ${DARK_THEME.electric} 100%)`,
                }}
              />

              {/* Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '24px 28px 20px',
                  borderBottom: `1px solid ${DARK_THEME.border}`,
                }}
              >
                <div>
                  <h2
                    style={{
                      fontFamily: 'Rajdhani, sans-serif',
                      fontSize: '26px',
                      fontWeight: 600,
                      letterSpacing: '0.1em',
                      color: DARK_THEME.text,
                      margin: 0,
                    }}
                  >
                    EDIT INCIDENT
                  </h2>
                  <span
                    style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '14px',
                      color: DARK_THEME.electric,
                    }}
                  >
                    {incident.id}
                  </span>
                </div>

                <motion.button
                  onClick={onClose}
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
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  <X size={18} style={{ color: DARK_THEME.textMuted }} />
                </motion.button>
              </div>

              {/* Form */}
              <div style={{ padding: '24px 28px' }}>
                {/* Title */}
                <div style={{ marginBottom: '24px' }}>
                  <label
                    style={{
                      display: 'block',
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '12px',
                      letterSpacing: '0.15em',
                      color: DARK_THEME.textMuted,
                      marginBottom: '10px',
                    }}
                  >
                    INCIDENT TITLE
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    style={{
                      ...inputStyle,
                      borderColor: errors.title ? DARK_THEME.danger : DARK_THEME.border,
                    }}
                  />
                  {errors.title && (
                    <span style={{ fontSize: '12px', color: DARK_THEME.danger, marginTop: '6px', display: 'block' }}>
                      {errors.title}
                    </span>
                  )}
                </div>

                {/* Description */}
                <div style={{ marginBottom: '24px' }}>
                  <label
                    style={{
                      display: 'block',
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '12px',
                      letterSpacing: '0.15em',
                      color: DARK_THEME.textMuted,
                      marginBottom: '10px',
                    }}
                  >
                    DESCRIPTION
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    rows={4}
                    style={{ ...inputStyle, resize: 'vertical', minHeight: '100px' }}
                  />
                </div>

                {/* Priority, Status, Department Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                  {/* Priority */}
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '12px',
                        letterSpacing: '0.15em',
                        color: DARK_THEME.textMuted,
                        marginBottom: '10px',
                      }}
                    >
                      PRIORITY
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {PRIORITY_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => handleChange('priority', opt.value)}
                          style={{
                            padding: '10px 14px',
                            backgroundColor: formData.priority === opt.value ? `${opt.color}20` : 'transparent',
                            border: `1px solid ${formData.priority === opt.value ? opt.color : DARK_THEME.border}`,
                            borderRadius: '6px',
                            fontFamily: 'JetBrains Mono, monospace',
                            fontSize: '12px',
                            color: formData.priority === opt.value ? opt.color : DARK_THEME.textMuted,
                            cursor: 'pointer',
                            textAlign: 'left',
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '12px',
                        letterSpacing: '0.15em',
                        color: DARK_THEME.textMuted,
                        marginBottom: '10px',
                      }}
                    >
                      STATUS
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {STATUS_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => handleChange('status', opt.value)}
                          style={{
                            padding: '10px 14px',
                            backgroundColor: formData.status === opt.value ? `${opt.color}20` : 'transparent',
                            border: `1px solid ${formData.status === opt.value ? opt.color : DARK_THEME.border}`,
                            borderRadius: '6px',
                            fontFamily: 'JetBrains Mono, monospace',
                            fontSize: '12px',
                            color: formData.status === opt.value ? opt.color : DARK_THEME.textMuted,
                            cursor: 'pointer',
                            textAlign: 'left',
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Department */}
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '12px',
                        letterSpacing: '0.15em',
                        color: DARK_THEME.textMuted,
                        marginBottom: '10px',
                      }}
                    >
                      DEPARTMENT
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {DEPARTMENT_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => handleChange('department', opt.value)}
                          style={{
                            padding: '10px 14px',
                            backgroundColor: formData.department === opt.value ? `${DARK_THEME.electric}20` : 'transparent',
                            border: `1px solid ${formData.department === opt.value ? DARK_THEME.electric : DARK_THEME.border}`,
                            borderRadius: '6px',
                            fontFamily: 'JetBrains Mono, monospace',
                            fontSize: '12px',
                            color: formData.department === opt.value ? DARK_THEME.electric : DARK_THEME.textMuted,
                            cursor: 'pointer',
                            textAlign: 'left',
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '14px',
                  padding: '20px 28px 24px',
                  borderTop: `1px solid ${DARK_THEME.border}`,
                }}
              >
                <motion.button
                  onClick={onClose}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: 'transparent',
                    border: `1px solid ${DARK_THEME.border}`,
                    borderRadius: '6px',
                    fontFamily: 'Rajdhani, sans-serif',
                    fontWeight: 600,
                    fontSize: '15px',
                    letterSpacing: '0.1em',
                    color: DARK_THEME.textMuted,
                    cursor: 'pointer',
                  }}
                >
                  CANCEL
                </motion.button>

                <motion.button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                  whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                  style={{
                    padding: '12px 24px',
                    background: `linear-gradient(135deg, ${DARK_THEME.navy}, ${DARK_THEME.electric}40)`,
                    border: `1px solid ${DARK_THEME.electric}`,
                    borderRadius: '6px',
                    fontFamily: 'Rajdhani, sans-serif',
                    fontWeight: 600,
                    fontSize: '15px',
                    letterSpacing: '0.1em',
                    color: DARK_THEME.electric,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    opacity: isSubmitting ? 0.7 : 1,
                  }}
                >
                  {isSubmitting ? 'SAVING...' : 'SAVE CHANGES'}
                </motion.button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

export default EditIncidentModal;
