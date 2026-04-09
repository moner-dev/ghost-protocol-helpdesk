import React, { useState } from 'react';
import { DARK_THEME } from '@/constants/theme';

function Input({
  label,
  icon: Icon,
  error,
  value,
  onChange,
  placeholder,
  type = 'text',
  multiline = false,
  rows = 4,
  style = {},
  ...props
}) {
  const [isFocused, setIsFocused] = useState(false);

  const borderColor = error
    ? DARK_THEME.danger
    : isFocused
    ? DARK_THEME.electric
    : DARK_THEME.border;

  const inputStyles = {
    width: '100%',
    padding: Icon && !label ? '14px 18px 14px 44px' : '14px 18px',
    backgroundColor: 'rgba(79, 195, 247, 0.04)',
    border: `1px solid ${borderColor}`,
    borderRadius: '8px',
    fontFamily: 'DM Sans, sans-serif',
    fontSize: '15px',
    color: DARK_THEME.text,
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxShadow: isFocused ? `0 0 0 3px ${error ? DARK_THEME.danger + '30' : DARK_THEME.glow}` : 'none',
    ...style,
  };

  return (
    <div style={{ marginBottom: '20px' }}>
      {label && (
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '12px',
            letterSpacing: '0.15em',
            color: DARK_THEME.textMuted,
            marginBottom: '10px',
          }}
        >
          {Icon && <Icon size={14} />}
          {label}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        {Icon && !label && (
          <Icon
            size={16}
            style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: DARK_THEME.textMuted,
              pointerEvents: 'none',
            }}
          />
        )}
        {multiline ? (
          <textarea
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            rows={rows}
            style={{ ...inputStyles, resize: 'vertical', minHeight: '100px' }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...props}
          />
        ) : (
          <input
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            style={inputStyles}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...props}
          />
        )}
      </div>
      {error && (
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: DARK_THEME.danger, marginTop: '6px', display: 'block' }}>
          {error}
        </span>
      )}
    </div>
  );
}

export default Input;
