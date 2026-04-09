import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Flag, Building2, Send } from 'lucide-react';
import { DARK_THEME } from '@/constants/theme';
import { PRIORITY_OPTIONS } from '@/constants/options';
import ReporterSelector from '@/components/ui/ReporterSelector';
import { useAuth } from '@/hooks/useAuth';
import { useCompanyDepartments } from '@/hooks/useCompanyDepartments';

function FormField({ label, icon: Icon, children }) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '12px',
          letterSpacing: '0.15em',
          color: DARK_THEME.textMuted,
          marginBottom: '10px',
        }}
      >
        <Icon size={14} />
        {label}
      </label>
      {children}
    </div>
  );
}

function NewIncidentModal({ isOpen, onClose, onSubmit }) {
  const { user } = useAuth();
  const { departments } = useCompanyDepartments();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    department: '',
  });
  const [selectedReporter, setSelectedReporter] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set default department when departments load
  useEffect(() => {
    if (departments.length > 0 && !formData.department) {
      setFormData(prev => ({ ...prev, department: departments[0].id }));
    }
  }, [departments]);

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

    const newIncident = {
      ...formData,
      reported_by: selectedReporter?.id || null,
      created_by: user?.id || null,
    };

    try {
      await onSubmit(newIncident);
      // Reset form on success
      const defaultDept = departments.length > 0 ? departments[0].id : '';
      setFormData({ title: '', description: '', priority: 'medium', department: defaultDept });
      setSelectedReporter(null);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
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
    transition: 'border-color 0.2s, box-shadow 0.2s',
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

          {/* Modal Container - Flex centering */}
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
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
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
            <div
              style={{
                height: '6px',
                background: `linear-gradient(90deg, ${DARK_THEME.electric} 0%, ${DARK_THEME.electric2} 50%, transparent 100%)`,
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
                  NEW INCIDENT
                </h2>
                <span
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '11px',
                    letterSpacing: '0.1em',
                    color: DARK_THEME.textMuted,
                  }}
                >
                  CREATE NEW INCIDENT REPORT
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
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                <X size={18} style={{ color: DARK_THEME.textMuted }} />
              </motion.button>
            </div>

            {/* Form */}
            <div style={{ padding: '28px' }}>
              {/* Title */}
              <FormField label="INCIDENT TITLE" icon={FileText}>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="Brief description of the incident..."
                  style={{
                    ...inputStyle,
                    borderColor: errors.title ? DARK_THEME.danger : DARK_THEME.border,
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = errors.title ? DARK_THEME.danger : DARK_THEME.electric;
                    e.target.style.boxShadow = `0 0 0 3px ${errors.title ? DARK_THEME.danger + '30' : DARK_THEME.glow}`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = errors.title ? DARK_THEME.danger : DARK_THEME.border;
                    e.target.style.boxShadow = 'none';
                  }}
                />
                {errors.title && (
                  <span
                    style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '11px',
                      color: DARK_THEME.danger,
                      marginTop: '8px',
                      display: 'block',
                    }}
                  >
                    {errors.title}
                  </span>
                )}
              </FormField>

              {/* Description */}
              <FormField label="DESCRIPTION (OPTIONAL)" icon={FileText}>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Additional details about the incident..."
                  rows={4}
                  style={{
                    ...inputStyle,
                    resize: 'vertical',
                    minHeight: '100px',
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

              {/* Reporter Selector */}
              <div style={{ marginBottom: '24px' }}>
                <ReporterSelector
                  value={selectedReporter}
                  onChange={setSelectedReporter}
                />
              </div>

              {/* Priority & Department Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Priority */}
                <FormField label="PRIORITY" icon={Flag}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {PRIORITY_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleChange('priority', option.value)}
                        style={{
                          padding: '12px 16px',
                          backgroundColor:
                            formData.priority === option.value
                              ? `${option.color}20`
                              : 'transparent',
                          border: `1px solid ${
                            formData.priority === option.value ? option.color : DARK_THEME.border
                          }`,
                          borderRadius: '6px',
                          fontFamily: 'JetBrains Mono, monospace',
                          fontSize: '12px',
                          letterSpacing: '0.1em',
                          color: formData.priority === option.value ? option.color : DARK_THEME.textMuted,
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.2s',
                        }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </FormField>

                {/* Department */}
                <FormField label="DEPARTMENT" icon={Building2}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                    {departments.map((dept) => (
                      <button
                        key={dept.id}
                        onClick={() => handleChange('department', dept.id)}
                        style={{
                          padding: '12px 16px',
                          backgroundColor:
                            formData.department === dept.id
                              ? `${DARK_THEME.electric}20`
                              : 'transparent',
                          border: `1px solid ${
                            formData.department === dept.id ? DARK_THEME.electric : DARK_THEME.border
                          }`,
                          borderRadius: '6px',
                          fontFamily: 'JetBrains Mono, monospace',
                          fontSize: '12px',
                          letterSpacing: '0.1em',
                          color:
                            formData.department === dept.id
                              ? DARK_THEME.electric
                              : DARK_THEME.textMuted,
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.2s',
                        }}
                      >
                        {dept.name}
                      </button>
                    ))}
                  </div>
                </FormField>
              </div>
            </div>

            {/* Footer */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '14px',
                padding: '20px 28px 28px',
                borderTop: `1px solid ${DARK_THEME.border}`,
              }}
            >
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
                CANCEL
              </motion.button>

              <motion.button
                onClick={handleSubmit}
                disabled={isSubmitting}
                whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
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
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  opacity: isSubmitting ? 0.7 : 1,
                }}
              >
                {isSubmitting ? (
                  <>
                    <div
                      style={{
                        width: '16px',
                        height: '16px',
                        border: `2px solid ${DARK_THEME.electric}`,
                        borderTopColor: 'transparent',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                      }}
                    />
                    CREATING...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    CREATE INCIDENT
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

export default NewIncidentModal;
