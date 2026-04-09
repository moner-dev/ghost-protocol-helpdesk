/**
 * GHOST PROTOCOL — Date Range Utilities
 *
 * Helper functions for date range filtering in Reports page.
 * All date calculations use local timezone.
 */

// ═══════════════════════════════════════════════════════════════════════════
// PRESET RANGE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

export const DATE_PRESETS = {
  TODAY: 'today',
  THIS_WEEK: 'this_week',
  THIS_MONTH: 'this_month',
  LAST_30_DAYS: 'last_30_days',
  LAST_90_DAYS: 'last_90_days',
  ALL_TIME: 'all_time',
  CUSTOM: 'custom',
};

export const PRESET_LABELS = {
  [DATE_PRESETS.TODAY]: 'TODAY',
  [DATE_PRESETS.THIS_WEEK]: 'THIS WEEK',
  [DATE_PRESETS.THIS_MONTH]: 'THIS MONTH',
  [DATE_PRESETS.LAST_30_DAYS]: 'LAST 30 DAYS',
  [DATE_PRESETS.LAST_90_DAYS]: 'LAST 90 DAYS',
  [DATE_PRESETS.ALL_TIME]: 'ALL TIME',
  [DATE_PRESETS.CUSTOM]: 'CUSTOM',
};

// ═══════════════════════════════════════════════════════════════════════════
// DATE RANGE CALCULATIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get start of day (00:00:00.000)
 */
export function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get end of day (23:59:59.999)
 */
export function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Get start of week (Sunday 00:00:00)
 */
export function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get end of week (Saturday 23:59:59)
 */
export function endOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() + (6 - day));
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Get start of month (1st day 00:00:00)
 */
export function startOfMonth(date) {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get end of month (last day 23:59:59)
 */
export function endOfMonth(date) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + 1);
  d.setDate(0);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Subtract days from a date
 */
export function subtractDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  return d;
}

/**
 * Get date range for a preset
 */
export function getPresetDateRange(preset) {
  const now = new Date();

  switch (preset) {
    case DATE_PRESETS.TODAY:
      return {
        startDate: startOfDay(now),
        endDate: endOfDay(now),
      };

    case DATE_PRESETS.THIS_WEEK:
      return {
        startDate: startOfWeek(now),
        endDate: endOfDay(now),
      };

    case DATE_PRESETS.THIS_MONTH:
      return {
        startDate: startOfMonth(now),
        endDate: endOfDay(now),
      };

    case DATE_PRESETS.LAST_30_DAYS:
      return {
        startDate: startOfDay(subtractDays(now, 29)),
        endDate: endOfDay(now),
      };

    case DATE_PRESETS.LAST_90_DAYS:
      return {
        startDate: startOfDay(subtractDays(now, 89)),
        endDate: endOfDay(now),
      };

    case DATE_PRESETS.ALL_TIME:
    default:
      return {
        startDate: null,
        endDate: null,
      };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// DATE FORMATTING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Format date as DD/MM/YYYY
 */
export function formatDateDMY(date) {
  if (!date) return '';
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Format date as YYYY-MM-DD (for input elements)
 */
export function formatDateISO(date) {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse DD/MM/YYYY to Date object
 */
export function parseDateDMY(str) {
  if (!str) return null;
  const parts = str.split('/');
  if (parts.length !== 3) return null;
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parseInt(parts[2], 10);
  const d = new Date(year, month, day);
  if (isNaN(d.getTime())) return null;
  return d;
}

/**
 * Parse YYYY-MM-DD to Date object
 */
export function parseDateISO(str) {
  if (!str) return null;
  const d = new Date(str + 'T00:00:00');
  if (isNaN(d.getTime())) return null;
  return d;
}

/**
 * Get human-readable range description
 */
export function getDateRangeDescription(preset, startDate, endDate) {
  if (preset === DATE_PRESETS.ALL_TIME) {
    return 'ALL TIME';
  }

  if (preset === DATE_PRESETS.CUSTOM && startDate && endDate) {
    return `${formatDateDMY(startDate)} — ${formatDateDMY(endDate)}`;
  }

  if (preset && preset !== DATE_PRESETS.CUSTOM) {
    return PRESET_LABELS[preset] || preset.toUpperCase();
  }

  if (startDate && endDate) {
    return `${formatDateDMY(startDate)} — ${formatDateDMY(endDate)}`;
  }

  return 'ALL TIME';
}

// ═══════════════════════════════════════════════════════════════════════════
// TREND CHART HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Determine the appropriate grouping for trend data based on date range
 * Returns: 'daily', 'weekly', or 'monthly'
 */
export function getTrendGrouping(preset, startDate, endDate) {
  if (preset === DATE_PRESETS.ALL_TIME) {
    return 'monthly';
  }

  if (preset === DATE_PRESETS.LAST_90_DAYS) {
    return 'weekly';
  }

  // For custom ranges, determine by number of days
  if (preset === DATE_PRESETS.CUSTOM && startDate && endDate) {
    const diffMs = endDate.getTime() - startDate.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays > 90) return 'monthly';
    if (diffDays > 31) return 'weekly';
    return 'daily';
  }

  // TODAY, THIS_WEEK, THIS_MONTH, LAST_30_DAYS
  return 'daily';
}

/**
 * Generate date buckets for trend chart
 */
export function generateTrendBuckets(startDate, endDate, grouping) {
  const buckets = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (grouping === 'daily') {
    const current = startOfDay(start);
    while (current <= end) {
      buckets.push({
        label: current.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        shortLabel: current.toLocaleDateString('en-US', { weekday: 'short' }),
        start: new Date(current),
        end: endOfDay(current),
      });
      current.setDate(current.getDate() + 1);
    }
  } else if (grouping === 'weekly') {
    let current = startOfWeek(start);
    while (current <= end) {
      const weekEnd = endOfWeek(current);
      buckets.push({
        label: `${current.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        shortLabel: `W${Math.ceil(current.getDate() / 7)}`,
        start: new Date(current),
        end: weekEnd > end ? new Date(end) : weekEnd,
      });
      current.setDate(current.getDate() + 7);
    }
  } else if (grouping === 'monthly') {
    let current = startOfMonth(start);
    while (current <= end) {
      const monthEnd = endOfMonth(current);
      buckets.push({
        label: current.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        shortLabel: current.toLocaleDateString('en-US', { month: 'short' }),
        start: new Date(current),
        end: monthEnd > end ? new Date(end) : monthEnd,
      });
      current.setMonth(current.getMonth() + 1);
    }
  }

  return buckets;
}

/**
 * Determine if an incident falls within a bucket
 */
export function isDateInBucket(dateStr, bucket) {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  return date >= bucket.start && date <= bucket.end;
}

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Validate a custom date range
 */
export function validateDateRange(startDate, endDate) {
  if (!startDate || !endDate) {
    return { valid: false, error: 'Both dates are required' };
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime())) {
    return { valid: false, error: 'Invalid start date' };
  }

  if (isNaN(end.getTime())) {
    return { valid: false, error: 'Invalid end date' };
  }

  if (start > end) {
    return { valid: false, error: 'Start date cannot be after end date' };
  }

  const now = new Date();
  if (start > now) {
    return { valid: false, error: 'Start date cannot be in the future' };
  }

  return { valid: true, error: null };
}

// ═══════════════════════════════════════════════════════════════════════════
// SQL HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Convert Date to SQLite datetime string
 */
export function toSQLiteDateTime(date) {
  if (!date) return null;
  return new Date(date).toISOString();
}

/**
 * Build SQL WHERE clause for date range
 */
export function buildDateRangeClause(startDate, endDate, columnName = 'created_at') {
  if (!startDate && !endDate) {
    return { clause: '', params: [] };
  }

  const conditions = [];
  const params = [];

  if (startDate) {
    conditions.push(`${columnName} >= ?`);
    params.push(toSQLiteDateTime(startDate));
  }

  if (endDate) {
    conditions.push(`${columnName} <= ?`);
    params.push(toSQLiteDateTime(endDate));
  }

  return {
    clause: conditions.length > 0 ? `(${conditions.join(' AND ')})` : '',
    params,
  };
}
