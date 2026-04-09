/**
 * GHOST PROTOCOL — Signup Page
 *
 * New user registration with pending admin approval.
 * Matches the Dark Intelligence Theater aesthetic of the Login page.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, User, Lock, Mail, UserCircle, Eye, EyeOff, ArrowLeft, CheckCircle, Building2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { DARK_THEME } from '@/constants/theme';
import WindowControls from '@/components/shared/WindowControls';

function Signup() {
  const navigate = useNavigate();
  const { register, isLoading, error, clearError } = useAuth();

  const [formData, setFormData] = useState({
    username: '',
    display_name: '',
    department: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [departments, setDepartments] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch departments on mount
  useEffect(() => {
    const fetchDepartments = async () => {
      if (window.electronAPI?.departments?.getAll) {
        try {
          const depts = await window.electronAPI.departments.getAll();
          setDepartments(depts || []);
        } catch (err) {
          console.error('Failed to fetch departments:', err);
        }
      }
    };
    fetchDepartments();
  }, []);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (localError) setLocalError(null);
    if (error) clearError();
  };

  const validate = () => {
    if (!formData.username.trim()) return 'Username is required';
    if (formData.username.length < 3) return 'Username must be at least 3 characters';
    if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) return 'Username can only contain letters, numbers, and underscores';
    if (!formData.display_name.trim()) return 'Display name is required';
    if (!formData.department) return 'Department is required';
    if (!formData.password) return 'Password is required';
    if (formData.password.length < 6) return 'Password must be at least 6 characters';
    if (formData.password !== formData.confirmPassword) return 'Passwords do not match';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);

    const validationError = validate();
    if (validationError) {
      setLocalError(validationError);
      return;
    }

    const result = await register({
      username: formData.username.toLowerCase(),
      password: formData.password,
      email: formData.email || null,
      display_name: formData.display_name,
      department: formData.department,
    });

    if (result.success) {
      setSuccess(true);
    } else {
      setLocalError(result.error);
    }
  };

  const displayError = localError || error;

  const inputStyle = (field) => ({
    width: '100%',
    height: '48px',
    padding: '0 16px 0 48px',
    backgroundColor: 'rgba(79, 195, 247, 0.04)',
    border: `1px solid ${focusedField === field ? DARK_THEME.electric : DARK_THEME.border}`,
    borderRadius: '8px',
    fontFamily: 'DM Sans, sans-serif',
    fontSize: '14px',
    color: DARK_THEME.text,
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxShadow: focusedField === field ? `0 0 0 3px ${DARK_THEME.glow}` : 'none',
  });

  const iconStyle = {
    position: 'absolute',
    left: '16px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: DARK_THEME.textMuted,
    pointerEvents: 'none',
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0, left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: DARK_THEME.bg,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Background grid pattern */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundImage: `
          linear-gradient(rgba(79, 195, 247, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(79, 195, 247, 0.03) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
        zIndex: 1,
      }} />

      {/* Radial vignette */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'radial-gradient(ellipse at center, transparent 30%, rgba(5,10,24,0.8) 100%)',
        zIndex: 2,
      }} />

      {/* Top bar */}
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        height: '36px',
        backgroundColor: 'rgba(5, 10, 24, 0.95)',
        borderBottom: `1px solid ${DARK_THEME.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 0 0 24px',
        zIndex: 200,
        WebkitAppRegion: 'drag',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', WebkitAppRegion: 'no-drag' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: DARK_THEME.success, boxShadow: `0 0 8px ${DARK_THEME.success}` }} />
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', letterSpacing: '0.15em', color: DARK_THEME.success }}>SYSTEM ONLINE</span>
        </div>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', letterSpacing: '0.15em', color: DARK_THEME.textMuted }}>
          GHOST PROTOCOL — NEW AGENT REGISTRATION
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', WebkitAppRegion: 'no-drag' }}>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '14px', letterSpacing: '0.1em', color: DARK_THEME.electric }}>
            {time.toLocaleTimeString('en-US', { hour12: false })}
          </span>
          <WindowControls />
        </div>
      </div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{
          position: 'relative',
          width: '512px',
          backgroundColor: 'rgba(5, 10, 24, 0.92)',
          backdropFilter: 'blur(20px)',
          border: `1px solid ${DARK_THEME.border}`,
          borderRadius: '16px',
          boxShadow: `0 0 80px rgba(79,195,247,0.1), 0 0 160px rgba(79,195,247,0.05)`,
          zIndex: 100,
          overflow: 'hidden',
        }}
      >
        {/* Accent bar */}
        <div style={{ height: '6px', background: `linear-gradient(90deg, ${DARK_THEME.electric} 0%, ${DARK_THEME.electric2} 50%, transparent 100%)` }} />

        <AnimatePresence mode="wait">
          {success ? (
            /* ── Success State ── */
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              style={{ padding: '48px 36px', textAlign: 'center' }}
            >
              <div style={{
                width: '72px', height: '72px', borderRadius: '50%',
                background: `linear-gradient(135deg, ${DARK_THEME.navy}, ${DARK_THEME.success}30)`,
                border: `2px solid ${DARK_THEME.success}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 24px',
                boxShadow: `0 0 30px ${DARK_THEME.success}30`,
              }}>
                <CheckCircle size={32} style={{ color: DARK_THEME.success }} />
              </div>

              <h2 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '26px', fontWeight: 700, letterSpacing: '0.1em', color: DARK_THEME.text, margin: '0 0 8px 0' }}>
                REGISTRATION SUBMITTED
              </h2>
              <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: DARK_THEME.success, letterSpacing: '0.05em', margin: '0 0 20px 0' }}>
                AGENT ID: {formData.username.toUpperCase()}
              </p>
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: DARK_THEME.textMuted, lineHeight: 1.6, margin: '0 0 32px 0' }}>
                Your account is pending administrator approval. You will be able to log in once your registration has been reviewed and approved.
              </p>

              <motion.button
                onClick={() => navigate('/login')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  width: '100%',
                  height: '48px',
                  background: `linear-gradient(135deg, ${DARK_THEME.navy}, ${DARK_THEME.electric}40)`,
                  border: `1px solid ${DARK_THEME.electric}`,
                  borderRadius: '8px',
                  fontFamily: 'Rajdhani, sans-serif',
                  fontWeight: 600,
                  fontSize: '15px',
                  letterSpacing: '0.2em',
                  color: DARK_THEME.electric,
                  cursor: 'pointer',
                }}
              >
                RETURN TO LOGIN
              </motion.button>
            </motion.div>
          ) : (
            /* ── Registration Form ── */
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Header */}
              <div style={{ padding: '28px 36px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '6px' }}>
                  <Shield size={28} style={{ color: DARK_THEME.electric }} />
                  <h1 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '28px', fontWeight: 700, letterSpacing: '0.1em', color: DARK_THEME.text, margin: 0 }}>
                    GHOST PROTOCOL
                  </h1>
                </div>
                <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', letterSpacing: '0.15em', color: DARK_THEME.textMuted, margin: '0 0 4px 0' }}>
                  NEW AGENT REGISTRATION
                </p>
                <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: DARK_THEME.textMuted, margin: '0 0 24px 0' }}>
                  Create your account. Access requires admin approval.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} style={{ padding: '0 36px 28px' }}>
                {/* Username */}
                <div style={{ position: 'relative', marginBottom: '16px' }}>
                  <motion.label
                    animate={{ letterSpacing: focusedField === 'username' ? '0.3em' : '0.2em' }}
                    style={{ display: 'block', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', letterSpacing: '0.2em', color: DARK_THEME.textMuted, marginBottom: '8px' }}
                  >
                    AGENT ID
                  </motion.label>
                  <div style={{ position: 'relative' }}>
                    <User size={16} style={iconStyle} />
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => handleChange('username', e.target.value)}
                      onFocus={() => setFocusedField('username')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Choose a username"
                      style={inputStyle('username')}
                    />
                  </div>
                </div>

                {/* Display Name */}
                <div style={{ position: 'relative', marginBottom: '16px' }}>
                  <motion.label
                    animate={{ letterSpacing: focusedField === 'display_name' ? '0.3em' : '0.2em' }}
                    style={{ display: 'block', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', letterSpacing: '0.2em', color: DARK_THEME.textMuted, marginBottom: '8px' }}
                  >
                    DISPLAY NAME
                  </motion.label>
                  <div style={{ position: 'relative' }}>
                    <UserCircle size={16} style={iconStyle} />
                    <input
                      type="text"
                      value={formData.display_name}
                      onChange={(e) => handleChange('display_name', e.target.value)}
                      onFocus={() => setFocusedField('display_name')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Your full name"
                      style={inputStyle('display_name')}
                    />
                  </div>
                </div>

                {/* Department */}
                <div style={{ position: 'relative', marginBottom: '16px' }}>
                  <motion.label
                    animate={{ letterSpacing: focusedField === 'department' ? '0.3em' : '0.2em' }}
                    style={{ display: 'block', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', letterSpacing: '0.2em', color: DARK_THEME.textMuted, marginBottom: '8px' }}
                  >
                    DEPARTMENT
                  </motion.label>
                  <div style={{ position: 'relative' }}>
                    <Building2 size={16} style={iconStyle} />
                    <select
                      value={formData.department}
                      onChange={(e) => {
                        const selectedValue = e.target.value;
                        setFormData(prev => ({ ...prev, department: selectedValue }));
                        if (localError) setLocalError(null);
                        if (error) clearError();
                      }}
                      onFocus={() => setFocusedField('department')}
                      onBlur={() => setFocusedField(null)}
                      style={{
                        ...inputStyle('department'),
                        appearance: 'none',
                        cursor: 'pointer',
                        paddingRight: '40px',
                        color: formData.department ? DARK_THEME.text : DARK_THEME.textMuted,
                      }}
                    >
                      <option value="" disabled style={{ backgroundColor: '#0D1526', color: '#6B7280' }}>Select department...</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={String(dept.id)} style={{ backgroundColor: '#0D1526', color: DARK_THEME.text }}>
                          {dept.display_name || dept.name}
                        </option>
                      ))}
                    </select>
                    {/* Dropdown arrow */}
                    <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2.5 4.5L6 8L9.5 4.5" stroke={DARK_THEME.textMuted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div style={{ position: 'relative', marginBottom: '16px' }}>
                  <motion.label
                    animate={{ letterSpacing: focusedField === 'email' ? '0.3em' : '0.2em' }}
                    style={{ display: 'block', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', letterSpacing: '0.2em', color: DARK_THEME.textMuted, marginBottom: '8px' }}
                  >
                    EMAIL (OPTIONAL)
                  </motion.label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={iconStyle} />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="your@email.com"
                      style={inputStyle('email')}
                    />
                  </div>
                </div>

                {/* Password */}
                <div style={{ position: 'relative', marginBottom: '16px' }}>
                  <motion.label
                    animate={{ letterSpacing: focusedField === 'password' ? '0.3em' : '0.2em' }}
                    style={{ display: 'block', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', letterSpacing: '0.2em', color: DARK_THEME.textMuted, marginBottom: '8px' }}
                  >
                    CLEARANCE CODE
                  </motion.label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={iconStyle} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Minimum 6 characters"
                      style={{ ...inputStyle('password'), paddingRight: '48px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                      {showPassword ? <EyeOff size={16} style={{ color: DARK_THEME.textMuted }} /> : <Eye size={16} style={{ color: DARK_THEME.textMuted }} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div style={{ position: 'relative', marginBottom: '24px' }}>
                  <motion.label
                    animate={{ letterSpacing: focusedField === 'confirmPassword' ? '0.3em' : '0.2em' }}
                    style={{ display: 'block', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', letterSpacing: '0.2em', color: DARK_THEME.textMuted, marginBottom: '8px' }}
                  >
                    CONFIRM CLEARANCE CODE
                  </motion.label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={iconStyle} />
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => handleChange('confirmPassword', e.target.value)}
                      onFocus={() => setFocusedField('confirmPassword')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Re-enter your code"
                      style={{ ...inputStyle('confirmPassword'), paddingRight: '48px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                      {showConfirm ? <EyeOff size={16} style={{ color: DARK_THEME.textMuted }} /> : <Eye size={16} style={{ color: DARK_THEME.textMuted }} />}
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                <AnimatePresence>
                  {displayError && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      style={{
                        padding: '12px 16px',
                        backgroundColor: `${DARK_THEME.danger}15`,
                        border: `1px solid ${DARK_THEME.danger}40`,
                        borderRadius: '8px',
                        marginBottom: '20px',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '11px',
                        color: DARK_THEME.danger,
                        textAlign: 'center',
                      }}
                    >
                      {displayError}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={{ scale: isLoading ? 1 : 1.01 }}
                  whileTap={{ scale: isLoading ? 1 : 0.98 }}
                  style={{
                    width: '100%',
                    height: '48px',
                    background: `linear-gradient(135deg, ${DARK_THEME.navy}, #0A1628)`,
                    border: `1px solid ${DARK_THEME.electric}`,
                    borderRadius: '8px',
                    fontFamily: 'Rajdhani, sans-serif',
                    fontWeight: 600,
                    fontSize: '15px',
                    letterSpacing: '0.25em',
                    color: DARK_THEME.electric,
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    opacity: isLoading ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    marginBottom: '20px',
                  }}
                >
                  {isLoading ? (
                    <>
                      <div style={{ width: '16px', height: '16px', border: `2px solid ${DARK_THEME.electric}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                      PROCESSING...
                    </>
                  ) : (
                    'REQUEST ACCESS'
                  )}
                </motion.button>

                {/* Back to Login */}
                <div style={{ textAlign: 'center' }}>
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '11px',
                      letterSpacing: '0.1em',
                      color: DARK_THEME.textMuted,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = DARK_THEME.electric)}
                    onMouseLeave={(e) => (e.currentTarget.style.color = DARK_THEME.textMuted)}
                  >
                    <ArrowLeft size={14} />
                    BACK TO LOGIN
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Inject keyframes */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default Signup;
