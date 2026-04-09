/**
 * GHOST PROTOCOL — Reporter Selector Component
 *
 * Searchable autocomplete input for selecting an end user
 * as the reporter of an incident.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { UserRound, X, Search, Loader2 } from 'lucide-react';
import { DARK_THEME } from '@/constants/theme';
import { useCompanyDepartments } from '@/hooks/useCompanyDepartments';

// ═══════════════════════════════════════════════════════════════════════════
// DEPARTMENT BADGE
// ═══════════════════════════════════════════════════════════════════════════

function DepartmentBadge({ department, departments = [], size = 'normal' }) {
  const deptOption = departments.find(d => d.id === department);
  const label = deptOption?.name || department?.toUpperCase() || 'N/A';

  const isSmall = size === 'small';

  return (
    <span style={{
      padding: isSmall ? '2px 6px' : '3px 8px',
      backgroundColor: `${DARK_THEME.electric}15`,
      border: `1px solid ${DARK_THEME.electric}40`,
      borderRadius: '3px',
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: isSmall ? '8px' : '9px',
      letterSpacing: '0.05em',
      color: DARK_THEME.electric,
      flexShrink: 0,
    }}>
      {label}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// RESULT ROW
// ═══════════════════════════════════════════════════════════════════════════

function ResultRow({ user, isHighlighted, onSelect, departments }) {
  return (
    <div
      onClick={() => onSelect(user)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '10px 14px',
        backgroundColor: isHighlighted ? `${DARK_THEME.electric}10` : 'transparent',
        cursor: 'pointer',
        transition: 'background-color 0.1s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = `${DARK_THEME.electric}10`;
      }}
      onMouseLeave={(e) => {
        if (!isHighlighted) {
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

      {/* Name */}
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
          {user.full_name}
        </div>
        {user.email && (
          <span style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '10px',
            color: DARK_THEME.textMuted,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: 'block',
          }}>
            {user.email}
          </span>
        )}
      </div>

      {/* Department Badge */}
      {user.department && <DepartmentBadge department={user.department} departments={departments} size="small" />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SELECTED REPORTER CARD
// ═══════════════════════════════════════════════════════════════════════════

function SelectedReporterCard({ reporter, onClear, departments }) {
  return (
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
          {reporter.full_name}
        </div>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClear();
        }}
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
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN REPORTER SELECTOR COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

function ReporterSelector({ value, onChange }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1); // -1 = no highlight until user navigates
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  const isElectron = typeof window !== 'undefined' && window.electronAPI?.endUsers;

  // Company departments from database
  const { allDepartments } = useCompanyDepartments();

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 150);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch results when query changes
  useEffect(() => {
    if (debouncedQuery.length < 1) {
      setResults([]);
      setIsDropdownOpen(false);
      return;
    }

    const fetchResults = async () => {
      setIsLoading(true);

      try {
        if (isElectron) {
          // Try search first
          let data = await window.electronAPI.endUsers.search(debouncedQuery);

          // If search returns empty, try getting all and filter client-side
          if (!data || (Array.isArray(data) && data.length === 0)) {
            const allData = await window.electronAPI.endUsers.getAll({ includeInactive: false });

            // Filter by search query client-side
            const searchLower = debouncedQuery.toLowerCase();
            data = (allData || []).filter(u =>
              (u.full_name && u.full_name.toLowerCase().includes(searchLower)) ||
              (u.email && u.email.toLowerCase().includes(searchLower)) ||
              (u.id && u.id.toLowerCase().includes(searchLower))
            );
          }

          // Handle both array response and object with results property
          const usersArray = Array.isArray(data) ? data : (data?.results || data?.users || []);

          // Filter to only show active users (handle SQLite integer booleans)
          const activeUsers = usersArray.filter(u => u.is_active === 1 || u.is_active === true).slice(0, 6);

          setResults(activeUsers);
          setHighlightedIndex(-1); // No pre-highlight — user must navigate or click
          setIsDropdownOpen(activeUsers.length > 0);
        }
      } catch (err) {
        console.error('[ReporterSelector] Search failed:', err);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [debouncedQuery, isElectron]);

  // Update dropdown position
  const updatePosition = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    }
  }, []);

  // Update position when dropdown opens
  useEffect(() => {
    if (isDropdownOpen) {
      updatePosition();
    }
  }, [isDropdownOpen, updatePosition]);

  // Handle select
  const handleSelect = (user) => {
    onChange(user);
    setSearchQuery('');
    setResults([]);
    setIsDropdownOpen(false);
  };

  // Handle clear
  const handleClear = () => {
    onChange(null);
    setSearchQuery('');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!isDropdownOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        // From -1 (no selection) go to 0, otherwise increment up to last item
        setHighlightedIndex(prev => Math.min(prev + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        // Don't go below 0 once user has started navigating
        setHighlightedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        // Only select if user has explicitly highlighted an option (index >= 0)
        if (highlightedIndex >= 0 && results[highlightedIndex]) {
          handleSelect(results[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsDropdownOpen(false);
        break;
    }
  };

  // Handle click outside
  useEffect(() => {
    if (!isDropdownOpen) return;

    const handleClickOutside = (e) => {
      if (
        containerRef.current && !containerRef.current.contains(e.target) &&
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

  // Dropdown visibility flag
  const shouldShowDropdown = isDropdownOpen && results.length > 0;

  return (
    <>
      <div ref={containerRef}>
        {/* Label */}
        <label style={{
          display: 'block',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '9px',
          letterSpacing: '0.15em',
          color: DARK_THEME.textMuted,
          marginBottom: '8px',
        }}>
          REPORTED BY
        </label>

        {/* Selected Reporter or Search Input */}
        {value ? (
          <SelectedReporterCard reporter={value} onClear={handleClear} departments={allDepartments} />
        ) : (
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
            }}
            onClick={() => inputRef.current?.focus()}
          >
            <Search size={14} style={{ color: isDropdownOpen ? DARK_THEME.electric : DARK_THEME.textMuted, flexShrink: 0 }} />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                updatePosition();
              }}
              onKeyDown={handleKeyDown}
              onFocus={updatePosition}
              placeholder="Type name to search..."
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
            {isLoading && (
              <Loader2 size={14} style={{ color: DARK_THEME.electric, animation: 'spin 1s linear infinite', flexShrink: 0 }} />
            )}
          </div>
        )}
      </div>

      {/* Dropdown Portal */}
      {shouldShowDropdown && createPortal(
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
            maxHeight: '320px',
            overflowY: 'auto',
          }}
        >
          {results.map((user, index) => (
            <ResultRow
              key={user.id}
              user={user}
              isHighlighted={index === highlightedIndex}
              onSelect={handleSelect}
              departments={allDepartments}
            />
          ))}
        </div>,
        document.body
      )}

      {/* Keyframe animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}

export default ReporterSelector;
