import { DARK_THEME } from './theme';

export const PRIORITY_OPTIONS = [
  { value: 'critical', label: 'CRITICAL', color: DARK_THEME.danger },
  { value: 'high', label: 'HIGH', color: DARK_THEME.warning },
  { value: 'medium', label: 'MEDIUM', color: DARK_THEME.electric },
  { value: 'low', label: 'LOW', color: DARK_THEME.textMuted },
];

export const DEPARTMENT_OPTIONS = [
  { value: 'it-ops', label: 'IT OPS' },
  { value: 'security', label: 'SECURITY' },
  { value: 'network', label: 'NETWORK' },
  { value: 'helpdesk', label: 'HELPDESK' },
  { value: 'dev', label: 'DEV' },
];

export const STATUS_OPTIONS = [
  { value: 'new', label: 'NEW', color: DARK_THEME.electric },
  { value: 'in_progress', label: 'IN PROGRESS', color: DARK_THEME.gold },
  { value: 'escalated', label: 'ESCALATED', color: DARK_THEME.danger },
  { value: 'resolved', label: 'RESOLVED', color: DARK_THEME.success },
  { value: 'closed', label: 'CLOSED', color: DARK_THEME.textMuted },
];

// ═══════════════════════════════════════════════════════════════════════════
// END USER (REPORTER) DEPARTMENTS
// ═══════════════════════════════════════════════════════════════════════════
// MIGRATED: End user departments are now stored in the database
// (company_departments table) and accessed via useCompanyDepartments hook.
