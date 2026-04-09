/**
 * GHOST PROTOCOL — Window Controls Component
 *
 * Custom window controls for frameless Electron window.
 * Provides minimize, maximize/restore, and close buttons.
 */

import React, { useState, useEffect } from 'react';
import { Minus, Square, X, Copy } from 'lucide-react';
import { DARK_THEME } from '@/constants/theme';

function WindowControls() {
  const [isMaximized, setIsMaximized] = useState(false);
  const isElectron = typeof window !== 'undefined' && window.electronAPI?.window;

  useEffect(() => {
    if (!isElectron) return;

    // Check initial maximized state
    const checkMaximized = async () => {
      const maximized = await window.electronAPI.window.isMaximized();
      setIsMaximized(maximized);
    };
    checkMaximized();

    // Listen for window state changes (check periodically since Electron doesn't have a direct event in preload)
    const interval = setInterval(checkMaximized, 500);
    return () => clearInterval(interval);
  }, [isElectron]);

  if (!isElectron) {
    return null; // Don't render in browser
  }

  const handleMinimize = () => {
    window.electronAPI.window.minimize();
  };

  const handleMaximize = async () => {
    await window.electronAPI.window.maximize();
    const maximized = await window.electronAPI.window.isMaximized();
    setIsMaximized(maximized);
  };

  const handleClose = () => {
    window.electronAPI.window.close();
  };

  const buttonBaseStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '28px',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
    WebkitAppRegion: 'no-drag',
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        height: '100%',
        marginLeft: '12px',
        WebkitAppRegion: 'no-drag',
      }}
    >
      {/* Minimize Button */}
      <button
        onClick={handleMinimize}
        style={buttonBaseStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(79, 195, 247, 0.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
        title="Minimize"
      >
        <Minus size={14} style={{ color: DARK_THEME.textMuted }} />
      </button>

      {/* Maximize/Restore Button */}
      <button
        onClick={handleMaximize}
        style={buttonBaseStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(79, 195, 247, 0.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
        title={isMaximized ? 'Restore' : 'Maximize'}
      >
        {isMaximized ? (
          <Copy size={12} style={{ color: DARK_THEME.textMuted, transform: 'rotate(180deg)' }} />
        ) : (
          <Square size={11} style={{ color: DARK_THEME.textMuted }} />
        )}
      </button>

      {/* Close Button */}
      <button
        onClick={handleClose}
        style={buttonBaseStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.8)';
          e.currentTarget.querySelector('svg').style.color = '#ffffff';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.querySelector('svg').style.color = DARK_THEME.textMuted;
        }}
        title="Close"
      >
        <X size={14} style={{ color: DARK_THEME.textMuted, transition: 'color 0.15s ease' }} />
      </button>
    </div>
  );
}

export default WindowControls;
