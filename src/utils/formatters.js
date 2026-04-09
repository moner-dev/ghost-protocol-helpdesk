/**
 * GHOST PROTOCOL — Formatters
 *
 * Shared utility functions for formatting dates, times, and other data.
 */

// ═══════════════════════════════════════════════════════════════════════════
// SMART TIMESTAMP SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Parse a timestamp into a Date object.
 * Handles numeric timestamps, ISO strings, and other formats.
 */
function parseTimestamp(timestamp) {
  if (!timestamp) return null;

  // If it's already a Date object
  if (timestamp instanceof Date) {
    return isNaN(timestamp.getTime()) ? null : timestamp;
  }

  // If it's a number (Unix timestamp in milliseconds or seconds)
  if (typeof timestamp === 'number') {
    // If it looks like seconds (before year 2100), convert to ms
    if (timestamp < 4102444800) {
      timestamp = timestamp * 1000;
    }
    const date = new Date(timestamp);
    return isNaN(date.getTime()) ? null : date;
  }

  // If it's a string, try to parse it
  if (typeof timestamp === 'string') {
    // Try ISO format first
    let date = new Date(timestamp);
    if (!isNaN(date.getTime())) return date;

    // Try parsing as number
    const num = parseInt(timestamp, 10);
    if (!isNaN(num)) {
      return parseTimestamp(num);
    }
  }

  return null;
}

/**
 * Format time as HH:MM in 24-hour format
 */
function formatTime24(date) {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Format time as HH:MM AM/PM
 */
function formatTime12(date) {
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 should be 12
  return `${hours}:${minutes} ${ampm}`;
}

/**
 * Smart timestamp formatting based on age.
 *
 * Returns an object with:
 * - display: The smart display string
 * - tooltip: The full datetime for tooltip
 * - valid: Whether the timestamp was valid
 *
 * Display logic:
 * - Less than 1 hour: "45m ago"
 * - 1-24 hours: "3h ago"
 * - 1-7 days: "Mon 14:32"
 * - Older: "Apr 01, 2026"
 */
export function formatSmartTimestamp(timestamp) {
  const date = parseTimestamp(timestamp);

  if (!date) {
    return {
      display: '—',
      tooltip: 'Unknown date',
      valid: false,
    };
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  // Full tooltip format: "April 01, 2026 — 11:03 PM"
  const tooltip = `${MONTHS_FULL[date.getMonth()]} ${date.getDate().toString().padStart(2, '0')}, ${date.getFullYear()} — ${formatTime12(date)}`;

  let display;

  if (diffMinutes < 0) {
    // Future date
    display = `${MONTHS_SHORT[date.getMonth()]} ${date.getDate().toString().padStart(2, '0')}, ${date.getFullYear()}`;
  } else if (diffMinutes < 1) {
    display = 'Just now';
  } else if (diffMinutes < 60) {
    display = `${diffMinutes}m ago`;
  } else if (diffHours < 24) {
    display = `${diffHours}h ago`;
  } else if (diffDays < 7) {
    // Show day name and time: "Mon 14:32"
    display = `${DAYS_SHORT[date.getDay()]} ${formatTime24(date)}`;
  } else {
    // Show full date: "Apr 01, 2026"
    display = `${MONTHS_SHORT[date.getMonth()]} ${date.getDate().toString().padStart(2, '0')}, ${date.getFullYear()}`;
  }

  return {
    display,
    tooltip,
    valid: true,
  };
}

/**
 * Legacy function for backward compatibility.
 * Use formatSmartTimestamp for new code.
 */
export function formatTimeAgo(timestamp) {
  const result = formatSmartTimestamp(timestamp);
  return result.display;
}

// ═══════════════════════════════════════════════════════════════════════════
// DATE RANGE HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get the start and end timestamps for a predefined date range.
 * Returns { startDate, endDate } where both are timestamps (ms).
 * Start is 00:00:00, End is 23:59:59.999
 */
export function getDateRange(rangeType) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (rangeType) {
    case 'today': {
      const startDate = today.getTime();
      const endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).getTime();
      return { startDate, endDate };
    }

    case 'this_week': {
      // Week starts on Sunday (day 0)
      const dayOfWeek = today.getDay();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - dayOfWeek);
      const startDate = startOfWeek.getTime();
      const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();
      return { startDate, endDate };
    }

    case 'this_month': {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startDate = startOfMonth.getTime();
      const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();
      return { startDate, endDate };
    }

    case 'last_30_days': {
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 29); // -29 to include today
      const startDate = thirtyDaysAgo.getTime();
      const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();
      return { startDate, endDate };
    }

    case 'all_time':
    default:
      return { startDate: null, endDate: null };
  }
}

/**
 * Format a date range for display.
 * Returns a short label like "Apr 01 — Apr 04"
 */
export function formatDateRangeLabel(startDate, endDate) {
  if (!startDate || !endDate) return 'ALL TIME';

  const start = parseTimestamp(startDate);
  const end = parseTimestamp(endDate);

  if (!start || !end) return 'CUSTOM';

  const startStr = `${MONTHS_SHORT[start.getMonth()]} ${start.getDate().toString().padStart(2, '0')}`;
  const endStr = `${MONTHS_SHORT[end.getMonth()]} ${end.getDate().toString().padStart(2, '0')}`;

  // If same year as current, omit year
  const currentYear = new Date().getFullYear();
  if (start.getFullYear() !== currentYear || end.getFullYear() !== currentYear) {
    return `${startStr}, ${start.getFullYear()} — ${endStr}, ${end.getFullYear()}`;
  }

  return `${startStr} — ${endStr}`;
}

/**
 * Parse a DD/MM/YYYY string into a Date object.
 * Returns null if invalid.
 */
export function parseDateInput(dateString) {
  if (!dateString || typeof dateString !== 'string') return null;

  const parts = dateString.split('/');
  if (parts.length !== 3) return null;

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // 0-indexed
  const year = parseInt(parts[2], 10);

  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  if (day < 1 || day > 31 || month < 0 || month > 11 || year < 1900 || year > 2100) return null;

  const date = new Date(year, month, day);

  // Verify the date is valid (e.g., not Feb 30)
  if (date.getDate() !== day || date.getMonth() !== month || date.getFullYear() !== year) {
    return null;
  }

  return date;
}

/**
 * Format a Date or timestamp to DD/MM/YYYY string.
 */
export function formatDateInput(timestamp) {
  const date = parseTimestamp(timestamp);
  if (!date) return '';

  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

/**
 * Get the display label for a date range filter type.
 */
export function getDateRangeLabel(rangeType, customStart, customEnd) {
  switch (rangeType) {
    case 'today':
      return 'TODAY';
    case 'this_week':
      return 'THIS WEEK';
    case 'this_month':
      return 'THIS MONTH';
    case 'last_30_days':
      return 'LAST 30 DAYS';
    case 'custom':
      if (customStart && customEnd) {
        return formatDateRangeLabel(customStart, customEnd);
      }
      return 'CUSTOM';
    case 'all_time':
    default:
      return 'ALL TIME';
  }
}
