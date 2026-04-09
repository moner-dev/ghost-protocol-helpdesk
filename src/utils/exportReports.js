/**
 * GHOST PROTOCOL — Reports Export Utility
 *
 * Professional intelligence briefing style exports for Reports page.
 * Uses jsPDF and jspdf-autotable for PDF generation.
 * Uses ExcelJS for professional Excel exports.
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function getFormattedDate() {
  return new Date().toISOString().slice(0, 10);
}

function getFormattedDateTime() {
  const now = new Date();
  return now.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function generateDocumentRef() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  return `GP-RPT-${year}${month}${day}-${hour}${min}`;
}

function getWeekDates() {
  const dates = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    dates.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
  }
  return dates;
}

// ═══════════════════════════════════════════════════════════════════════════
// EXCEL EXPORT — PROFESSIONAL GRADE SPREADSHEET
// ═══════════════════════════════════════════════════════════════════════════

// Color palette
const EXCEL_COLORS = {
  navyDark: 'FF1B2A6B',
  lightBlue: 'FFD5E8F0',
  white: 'FFFFFFFF',
  altRow: 'FFEBF0FF',
  border: 'FFC5D0E0',
  textDark: 'FF222222',
  // Priority colors
  critical: 'FFCC0000',
  high: 'FFC45000',
  medium: 'FF7A6000',
  low: 'FF2E7D32',
  // Status colors
  resolved: 'FF2E7D32',
  closed: 'FF888888',
  escalated: 'FFB8860B',
  inProgress: 'FF0D47A1',
  new: 'FF1B2A6B',
};

function getPriorityColor(priority) {
  const p = priority?.toUpperCase();
  if (p === 'CRITICAL') return EXCEL_COLORS.critical;
  if (p === 'HIGH') return EXCEL_COLORS.high;
  if (p === 'MEDIUM') return EXCEL_COLORS.medium;
  if (p === 'LOW') return EXCEL_COLORS.low;
  return EXCEL_COLORS.textDark;
}

function getStatusColor(status) {
  const s = status?.toUpperCase();
  if (s === 'RESOLVED') return EXCEL_COLORS.resolved;
  if (s === 'CLOSED') return EXCEL_COLORS.closed;
  if (s === 'ESCALATED') return EXCEL_COLORS.escalated;
  if (s === 'IN PROGRESS') return EXCEL_COLORS.inProgress;
  if (s === 'NEW') return EXCEL_COLORS.new;
  return EXCEL_COLORS.textDark;
}

function formatTimeValue(minutes) {
  if (!minutes || minutes === 0) return '—';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function formatValue(val) {
  if (val === 0) return '—';
  return val;
}

export async function generateReportsExcel(reportData, agentName = 'AGENT') {
  const {
    totalIncidents,
    openIncidents,
    resolvedIncidents,
    criticalOpen,
    resolutionRate,
    priorityData,
    statusData,
    weeklyData,
    avgResolveMinutes,
    dateRange = 'ALL TIME',
  } = reportData;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'GHOST PROTOCOL';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Incident Report', {
    properties: { tabColor: { argb: EXCEL_COLORS.navyDark } },
    pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1 },
  });

  // Column widths - wider for full content visibility
  sheet.columns = [
    { width: 22 }, // A
    { width: 18 }, // B
    { width: 18 }, // C
    { width: 18 }, // D
    { width: 18 }, // E
    { width: 22 }, // F
  ];

  let rowNum = 1;
  const lastCol = 6;

  // ─────────────────────────────────────────────────────────────────────────
  // HEADER BANNER (rows 1-2)
  // ─────────────────────────────────────────────────────────────────────────

  // Row 1 - Title
  sheet.mergeCells(rowNum, 1, rowNum, lastCol);
  const titleRow = sheet.getRow(rowNum);
  titleRow.height = 36;
  const titleCell = sheet.getCell(rowNum, 1);
  titleCell.value = 'GHOST PROTOCOL — INCIDENT REPORT';
  titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: EXCEL_COLORS.navyDark } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  rowNum++;

  // Row 2 - Subtitle
  sheet.mergeCells(rowNum, 1, rowNum, lastCol);
  const subtitleRow = sheet.getRow(rowNum);
  subtitleRow.height = 20;
  const subtitleCell = sheet.getCell(rowNum, 1);
  subtitleCell.value = `Generated: ${getFormattedDateTime()}  |  Agent: ${agentName.toUpperCase()}  |  Range: ${dateRange}  |  Ref: ${generateDocumentRef()}`;
  subtitleCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FFFFFFFF' } };
  subtitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: EXCEL_COLORS.navyDark } };
  subtitleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  rowNum++;

  // Spacer row
  rowNum++;

  // ─────────────────────────────────────────────────────────────────────────
  // KPI SUMMARY SECTION
  // ─────────────────────────────────────────────────────────────────────────

  // Section header
  sheet.mergeCells(rowNum, 1, rowNum, lastCol);
  const kpiHeaderRow = sheet.getRow(rowNum);
  kpiHeaderRow.height = 22;
  const kpiHeaderCell = sheet.getCell(rowNum, 1);
  kpiHeaderCell.value = 'EXECUTIVE SUMMARY';
  kpiHeaderCell.font = { name: 'Arial', size: 11, bold: true, color: { argb: EXCEL_COLORS.navyDark } };
  kpiHeaderCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: EXCEL_COLORS.lightBlue } };
  kpiHeaderCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  rowNum++;

  // KPI row - 6 metrics across
  const kpiRow = sheet.getRow(rowNum);
  kpiRow.height = 32;

  const kpis = [
    { label: 'TOTAL INCIDENTS', value: formatValue(totalIncidents), color: EXCEL_COLORS.navyDark },
    { label: 'OPEN INCIDENTS', value: formatValue(openIncidents), color: EXCEL_COLORS.high },
    { label: 'CRITICAL OPEN', value: formatValue(criticalOpen), color: EXCEL_COLORS.critical },
    { label: 'RESOLVED', value: formatValue(resolvedIncidents), color: EXCEL_COLORS.resolved },
    { label: 'RESOLUTION RATE', value: resolutionRate > 0 ? `${resolutionRate.toFixed(1)}%` : '—', color: resolutionRate >= 70 ? EXCEL_COLORS.resolved : resolutionRate >= 40 ? EXCEL_COLORS.medium : EXCEL_COLORS.critical },
    { label: 'AVG RESOLUTION', value: formatTimeValue(avgResolveMinutes), color: EXCEL_COLORS.navyDark },
  ];

  kpis.forEach((kpi, idx) => {
    const col = idx + 1;
    const cell = sheet.getCell(rowNum, col);
    cell.value = `${kpi.label}\n${kpi.value}`;
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: kpi.color } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: EXCEL_COLORS.lightBlue } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      left: { style: 'medium', color: { argb: kpi.color } },
      right: { style: 'thin', color: { argb: EXCEL_COLORS.border } },
      top: { style: 'thin', color: { argb: EXCEL_COLORS.border } },
      bottom: { style: 'thin', color: { argb: EXCEL_COLORS.border } },
    };
  });
  rowNum++;

  rowNum++; // Single spacer

  // ─────────────────────────────────────────────────────────────────────────
  // INCIDENTS BY PRIORITY
  // ─────────────────────────────────────────────────────────────────────────

  // Section header - full width
  sheet.mergeCells(rowNum, 1, rowNum, lastCol);
  const priorityHeaderRow = sheet.getRow(rowNum);
  priorityHeaderRow.height = 22;
  const priorityHeaderCell = sheet.getCell(rowNum, 1);
  priorityHeaderCell.value = 'INCIDENTS BY PRIORITY';
  priorityHeaderCell.font = { name: 'Arial', size: 11, bold: true, color: { argb: EXCEL_COLORS.navyDark } };
  priorityHeaderCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: EXCEL_COLORS.lightBlue } };
  priorityHeaderCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  rowNum++;

  // Column headers - full width
  const priorityColHeaders = ['Priority', 'Count', 'Percentage', '', '', ''];
  priorityColHeaders.forEach((header, idx) => {
    const cell = sheet.getCell(rowNum, idx + 1);
    cell.value = header;
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: EXCEL_COLORS.navyDark } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = { bottom: { style: 'thin', color: { argb: EXCEL_COLORS.border } } };
  });
  sheet.getRow(rowNum).height = 20;
  rowNum++;

  // Data rows - full width
  priorityData.forEach((p, idx) => {
    const pct = totalIncidents > 0 ? (p.count / totalIncidents) * 100 : 0;
    const isAlt = idx % 2 === 1;
    const row = sheet.getRow(rowNum);
    row.height = 18;
    const bgColor = isAlt ? EXCEL_COLORS.altRow : EXCEL_COLORS.white;

    // Priority cell (colored)
    const priorityCell = sheet.getCell(rowNum, 1);
    priorityCell.value = p.label;
    priorityCell.font = { name: 'Arial', size: 10, bold: true, color: { argb: getPriorityColor(p.label) } };
    priorityCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
    priorityCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    priorityCell.border = { bottom: { style: 'thin', color: { argb: EXCEL_COLORS.border } } };

    // Count cell
    const countCell = sheet.getCell(rowNum, 2);
    countCell.value = formatValue(p.count);
    countCell.font = { name: 'Arial', size: 10, color: { argb: EXCEL_COLORS.textDark } };
    countCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
    countCell.alignment = { vertical: 'middle', horizontal: 'center' };
    countCell.border = { bottom: { style: 'thin', color: { argb: EXCEL_COLORS.border } } };

    // Percentage cell
    const pctCell = sheet.getCell(rowNum, 3);
    pctCell.value = pct > 0 ? `${pct.toFixed(1)}%` : '—';
    pctCell.font = { name: 'Arial', size: 10, color: { argb: EXCEL_COLORS.textDark } };
    pctCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
    pctCell.alignment = { vertical: 'middle', horizontal: 'center' };
    pctCell.border = { bottom: { style: 'thin', color: { argb: EXCEL_COLORS.border } } };

    // Fill remaining columns
    for (let c = 4; c <= lastCol; c++) {
      const emptyCell = sheet.getCell(rowNum, c);
      emptyCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
      emptyCell.border = { bottom: { style: 'thin', color: { argb: EXCEL_COLORS.border } } };
    }

    rowNum++;
  });

  rowNum++; // Single spacer

  // ─────────────────────────────────────────────────────────────────────────
  // INCIDENTS BY STATUS
  // ─────────────────────────────────────────────────────────────────────────

  // Section header - full width
  sheet.mergeCells(rowNum, 1, rowNum, lastCol);
  const statusHeaderRow = sheet.getRow(rowNum);
  statusHeaderRow.height = 22;
  const statusHeaderCell = sheet.getCell(rowNum, 1);
  statusHeaderCell.value = 'INCIDENTS BY STATUS';
  statusHeaderCell.font = { name: 'Arial', size: 11, bold: true, color: { argb: EXCEL_COLORS.navyDark } };
  statusHeaderCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: EXCEL_COLORS.lightBlue } };
  statusHeaderCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  rowNum++;

  // Column headers - full width
  const statusColHeaders = ['Status', 'Count', 'Percentage', '', '', ''];
  statusColHeaders.forEach((header, idx) => {
    const cell = sheet.getCell(rowNum, idx + 1);
    cell.value = header;
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: EXCEL_COLORS.navyDark } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = { bottom: { style: 'thin', color: { argb: EXCEL_COLORS.border } } };
  });
  sheet.getRow(rowNum).height = 20;
  rowNum++;

  // Data rows - full width
  statusData.forEach((s, idx) => {
    const pct = totalIncidents > 0 ? (s.count / totalIncidents) * 100 : 0;
    const isAlt = idx % 2 === 1;
    const row = sheet.getRow(rowNum);
    row.height = 18;
    const bgColor = isAlt ? EXCEL_COLORS.altRow : EXCEL_COLORS.white;

    // Status cell (colored)
    const statusCell = sheet.getCell(rowNum, 1);
    statusCell.value = s.label;
    statusCell.font = { name: 'Arial', size: 10, bold: s.label === 'ESCALATED', color: { argb: getStatusColor(s.label) } };
    statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
    statusCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    statusCell.border = { bottom: { style: 'thin', color: { argb: EXCEL_COLORS.border } } };

    // Count cell
    const countCell = sheet.getCell(rowNum, 2);
    countCell.value = formatValue(s.count);
    countCell.font = { name: 'Arial', size: 10, color: { argb: EXCEL_COLORS.textDark } };
    countCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
    countCell.alignment = { vertical: 'middle', horizontal: 'center' };
    countCell.border = { bottom: { style: 'thin', color: { argb: EXCEL_COLORS.border } } };

    // Percentage cell
    const pctCell = sheet.getCell(rowNum, 3);
    pctCell.value = pct > 0 ? `${pct.toFixed(1)}%` : '—';
    pctCell.font = { name: 'Arial', size: 10, color: { argb: EXCEL_COLORS.textDark } };
    pctCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
    pctCell.alignment = { vertical: 'middle', horizontal: 'center' };
    pctCell.border = { bottom: { style: 'thin', color: { argb: EXCEL_COLORS.border } } };

    // Fill remaining columns
    for (let c = 4; c <= lastCol; c++) {
      const emptyCell = sheet.getCell(rowNum, c);
      emptyCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
      emptyCell.border = { bottom: { style: 'thin', color: { argb: EXCEL_COLORS.border } } };
    }

    rowNum++;
  });

  // Spacer
  rowNum++;

  // ─────────────────────────────────────────────────────────────────────────
  // WEEKLY TREND
  // ─────────────────────────────────────────────────────────────────────────

  const weekDates = getWeekDates();

  // Section header - full width
  sheet.mergeCells(rowNum, 1, rowNum, lastCol);
  const weeklyHeaderRow = sheet.getRow(rowNum);
  weeklyHeaderRow.height = 22;
  const weeklyHeaderCell = sheet.getCell(rowNum, 1);
  weeklyHeaderCell.value = 'WEEKLY INCIDENT TREND (LAST 7 DAYS)';
  weeklyHeaderCell.font = { name: 'Arial', size: 11, bold: true, color: { argb: EXCEL_COLORS.navyDark } };
  weeklyHeaderCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: EXCEL_COLORS.lightBlue } };
  weeklyHeaderCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  rowNum++;

  // Column headers - full width
  const weeklyColHeaders = ['Day', 'Date', 'Created', 'Resolved', 'Net Change', ''];
  weeklyColHeaders.forEach((header, idx) => {
    const cell = sheet.getCell(rowNum, idx + 1);
    cell.value = header;
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: EXCEL_COLORS.navyDark } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = { bottom: { style: 'thin', color: { argb: EXCEL_COLORS.border } } };
  });
  sheet.getRow(rowNum).height = 20;
  rowNum++;

  // Data rows - full width
  weeklyData.forEach((d, idx) => {
    const net = d.created - d.resolved;
    const isAlt = idx % 2 === 1;
    const row = sheet.getRow(rowNum);
    row.height = 18;
    const bgColor = isAlt ? EXCEL_COLORS.altRow : EXCEL_COLORS.white;

    const dayCell = sheet.getCell(rowNum, 1);
    dayCell.value = d.day;
    dayCell.font = { name: 'Arial', size: 10, color: { argb: EXCEL_COLORS.textDark } };
    dayCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
    dayCell.alignment = { vertical: 'middle', horizontal: 'center' };
    dayCell.border = { bottom: { style: 'thin', color: { argb: EXCEL_COLORS.border } } };

    const dateCell = sheet.getCell(rowNum, 2);
    dateCell.value = weekDates[idx] || '';
    dateCell.font = { name: 'Arial', size: 10, color: { argb: EXCEL_COLORS.textDark } };
    dateCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
    dateCell.alignment = { vertical: 'middle', horizontal: 'center' };
    dateCell.border = { bottom: { style: 'thin', color: { argb: EXCEL_COLORS.border } } };

    const createdCell = sheet.getCell(rowNum, 3);
    createdCell.value = formatValue(d.created);
    createdCell.font = { name: 'Arial', size: 10, color: { argb: EXCEL_COLORS.textDark } };
    createdCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
    createdCell.alignment = { vertical: 'middle', horizontal: 'center' };
    createdCell.border = { bottom: { style: 'thin', color: { argb: EXCEL_COLORS.border } } };

    const resolvedCell = sheet.getCell(rowNum, 4);
    resolvedCell.value = formatValue(d.resolved);
    resolvedCell.font = { name: 'Arial', size: 10, color: { argb: EXCEL_COLORS.textDark } };
    resolvedCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
    resolvedCell.alignment = { vertical: 'middle', horizontal: 'center' };
    resolvedCell.border = { bottom: { style: 'thin', color: { argb: EXCEL_COLORS.border } } };

    const netCell = sheet.getCell(rowNum, 5);
    netCell.value = net === 0 ? '—' : (net > 0 ? `+${net}` : net.toString());
    netCell.font = { name: 'Arial', size: 10, bold: true, color: { argb: net > 0 ? EXCEL_COLORS.critical : net < 0 ? EXCEL_COLORS.resolved : EXCEL_COLORS.textDark } };
    netCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
    netCell.alignment = { vertical: 'middle', horizontal: 'center' };
    netCell.border = { bottom: { style: 'thin', color: { argb: EXCEL_COLORS.border } } };

    // Fill column 6
    const col6Cell = sheet.getCell(rowNum, 6);
    col6Cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
    col6Cell.border = { bottom: { style: 'thin', color: { argb: EXCEL_COLORS.border } } };

    rowNum++;
  });

  // Weekly totals row - full width
  const totalCreatedWeek = weeklyData.reduce((s, d) => s + d.created, 0);
  const totalResolvedWeek = weeklyData.reduce((s, d) => s + d.resolved, 0);
  const netChange = totalCreatedWeek - totalResolvedWeek;

  const totalsRow = sheet.getRow(rowNum);
  totalsRow.height = 20;
  sheet.mergeCells(rowNum, 1, rowNum, 2);
  const totalsLabelCell = sheet.getCell(rowNum, 1);
  totalsLabelCell.value = 'WEEK TOTALS';
  totalsLabelCell.font = { name: 'Arial', size: 10, bold: true, color: { argb: EXCEL_COLORS.navyDark } };
  totalsLabelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: EXCEL_COLORS.lightBlue } };
  totalsLabelCell.alignment = { vertical: 'middle', horizontal: 'right', indent: 1 };
  sheet.getCell(rowNum, 2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: EXCEL_COLORS.lightBlue } };

  const totalCreatedCell = sheet.getCell(rowNum, 3);
  totalCreatedCell.value = formatValue(totalCreatedWeek);
  totalCreatedCell.font = { name: 'Arial', size: 10, bold: true, color: { argb: EXCEL_COLORS.navyDark } };
  totalCreatedCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: EXCEL_COLORS.lightBlue } };
  totalCreatedCell.alignment = { vertical: 'middle', horizontal: 'center' };

  const totalResolvedCell = sheet.getCell(rowNum, 4);
  totalResolvedCell.value = formatValue(totalResolvedWeek);
  totalResolvedCell.font = { name: 'Arial', size: 10, bold: true, color: { argb: EXCEL_COLORS.navyDark } };
  totalResolvedCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: EXCEL_COLORS.lightBlue } };
  totalResolvedCell.alignment = { vertical: 'middle', horizontal: 'center' };

  const totalNetCell = sheet.getCell(rowNum, 5);
  totalNetCell.value = netChange === 0 ? '—' : (netChange > 0 ? `+${netChange}` : netChange.toString());
  totalNetCell.font = { name: 'Arial', size: 10, bold: true, color: { argb: netChange > 0 ? EXCEL_COLORS.critical : netChange < 0 ? EXCEL_COLORS.resolved : EXCEL_COLORS.navyDark } };
  totalNetCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: EXCEL_COLORS.lightBlue } };
  totalNetCell.alignment = { vertical: 'middle', horizontal: 'center' };

  // Fill column 6 for totals row
  const totalsCol6Cell = sheet.getCell(rowNum, 6);
  totalsCol6Cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: EXCEL_COLORS.lightBlue } };

  rowNum++;
  rowNum++; // Spacer

  // ─────────────────────────────────────────────────────────────────────────
  // FOOTER
  // ─────────────────────────────────────────────────────────────────────────

  sheet.mergeCells(rowNum, 1, rowNum, lastCol);
  const footerRow = sheet.getRow(rowNum);
  footerRow.height = 20;
  const footerCell = sheet.getCell(rowNum, 1);
  footerCell.value = `${generateDocumentRef()}                                                                    GHOST PROTOCOL — CONFIDENTIAL`;
  footerCell.font = { name: 'Arial', size: 9, italic: true, color: { argb: 'FFFFFFFF' } };
  footerCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: EXCEL_COLORS.navyDark } };
  footerCell.alignment = { vertical: 'middle', horizontal: 'center' };

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

// ═══════════════════════════════════════════════════════════════════════════
// PDF EXPORT — PROFESSIONAL INTELLIGENCE BRIEFING STYLE
// ═══════════════════════════════════════════════════════════════════════════

export function generateReportsPDF(reportData, agentName = 'AGENT') {
  const {
    totalIncidents,
    openIncidents,
    resolvedIncidents,
    criticalOpen,
    resolutionRate,
    priorityData,
    statusData,
    weeklyData,
    avgResolveMinutes,
    dateRange = 'ALL TIME',
  } = reportData;

  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let yPos = 0;

  // Colors
  const navyDark = [5, 10, 24];
  const electricBlue = [79, 195, 247];
  const textWhite = [255, 255, 255];
  const textDark = [30, 30, 30];
  const textMuted = [120, 120, 120];
  const grayLight = [245, 247, 250];
  const grayBorder = [220, 225, 230];

  // Priority colors
  const priorityColors = {
    CRITICAL: [239, 68, 68],
    HIGH: [249, 115, 22],
    MEDIUM: [234, 179, 8],
    LOW: [34, 197, 94],
  };

  // Status colors
  const statusColors = {
    NEW: [79, 195, 247],
    'IN PROGRESS': [234, 179, 8],
    ESCALATED: [239, 68, 68],
    RESOLVED: [34, 197, 94],
    CLOSED: [120, 120, 120],
  };

  const documentRef = generateDocumentRef();
  const exportDate = getFormattedDate();

  // ─────────────────────────────────────────────────────────────────────────
  // COVER HEADER SECTION
  // ─────────────────────────────────────────────────────────────────────────

  // Dark navy header block
  doc.setFillColor(...navyDark);
  doc.rect(0, 0, pageWidth, 45, 'F');

  // GHOST PROTOCOL title
  doc.setTextColor(...textWhite);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('GHOST PROTOCOL', margin, 18);

  // Subtitle
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...electricBlue);
  doc.text('MONER INTELLIGENCE — IT INCIDENT TRACKER', margin, 26);

  // Document type
  doc.setFontSize(12);
  doc.setTextColor(...textWhite);
  doc.setFont('helvetica', 'bold');
  doc.text('INCIDENT REPORT', margin, 38);

  // Right side - metadata
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(180, 180, 180);
  doc.text(`Generated: ${getFormattedDateTime()}`, pageWidth - margin, 15, { align: 'right' });
  doc.text(`Agent: ${agentName.toUpperCase()}`, pageWidth - margin, 22, { align: 'right' });
  doc.text(`Range: ${dateRange}`, pageWidth - margin, 29, { align: 'right' });
  doc.setTextColor(...electricBlue);
  doc.setFont('helvetica', 'bold');
  doc.text(`Ref: ${documentRef}`, pageWidth - margin, 38, { align: 'right' });

  // Electric blue separator line
  doc.setDrawColor(...electricBlue);
  doc.setLineWidth(0.8);
  doc.line(0, 46, pageWidth, 46);

  yPos = 55;

  // ─────────────────────────────────────────────────────────────────────────
  // EXECUTIVE SUMMARY BOX
  // ─────────────────────────────────────────────────────────────────────────

  const summaryBoxHeight = 35;
  doc.setFillColor(...grayLight);
  doc.setDrawColor(...grayBorder);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, yPos, pageWidth - margin * 2, summaryBoxHeight, 3, 3, 'FD');

  // Summary title
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textMuted);
  doc.text('EXECUTIVE SUMMARY', margin + 5, yPos + 7);

  // Metrics in 6 evenly spaced columns
  const metricsY = yPos + 15;
  const contentWidth = pageWidth - margin * 2 - 10; // padding inside box
  const metricWidth = contentWidth / 6;
  const startX = margin + 5;

  // Helper to draw a metric
  const drawMetric = (label, value, color, index) => {
    const x = startX + (index * metricWidth);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textMuted);
    doc.text(label, x, metricsY);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...color);
    doc.text(value, x, metricsY + 8);
  };

  drawMetric('TOTAL', totalIncidents.toString(), textDark, 0);
  drawMetric('OPEN', openIncidents.toString(), priorityColors.HIGH, 1);
  drawMetric('CRITICAL', criticalOpen.toString(), priorityColors.CRITICAL, 2);
  drawMetric('RESOLVED', resolvedIncidents.toString(), statusColors.RESOLVED, 3);
  drawMetric('RESOLUTION', `${resolutionRate}%`, resolutionRate >= 70 ? statusColors.RESOLVED : resolutionRate >= 40 ? priorityColors.MEDIUM : priorityColors.CRITICAL, 4);
  drawMetric('AVG TIME', `${avgResolveMinutes}m`, textDark, 5);

  yPos += summaryBoxHeight + 15;

  // ─────────────────────────────────────────────────────────────────────────
  // SECTION: INCIDENTS BY PRIORITY
  // ─────────────────────────────────────────────────────────────────────────

  // Section header with accent
  doc.setFillColor(...grayLight);
  doc.rect(margin, yPos, pageWidth - margin * 2, 8, 'F');
  doc.setFillColor(...priorityColors.HIGH);
  doc.rect(margin, yPos, 3, 8, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textDark);
  doc.text('INCIDENTS BY PRIORITY', margin + 8, yPos + 5.5);
  yPos += 12;

  autoTable(doc, {
    startY: yPos,
    head: [['Priority', 'Count', 'Percentage']],
    body: priorityData.map((p) => {
      const pct = totalIncidents > 0 ? Math.round((p.count / totalIncidents) * 100) : 0;
      return [p.label, p.count.toString(), `${pct}%`];
    }),
    theme: 'plain',
    headStyles: {
      fillColor: navyDark,
      textColor: textWhite,
      fontStyle: 'bold',
      fontSize: 9,
      cellPadding: 4,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: textDark,
      cellPadding: 4,
    },
    alternateRowStyles: {
      fillColor: grayLight,
    },
    tableWidth: pageWidth - margin * 2,
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 50, halign: 'center' },
      2: { cellWidth: 50, halign: 'center' },
    },
    margin: { left: margin, right: margin },
    didParseCell: (data) => {
      // Color-code the priority label in first column
      if (data.section === 'body' && data.column.index === 0) {
        const priority = priorityData[data.row.index]?.label;
        if (priority && priorityColors[priority]) {
          data.cell.styles.textColor = priorityColors[priority];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
  });

  yPos = doc.lastAutoTable.finalY + 15;

  // ─────────────────────────────────────────────────────────────────────────
  // SECTION: INCIDENTS BY STATUS
  // ─────────────────────────────────────────────────────────────────────────

  doc.setFillColor(...grayLight);
  doc.rect(margin, yPos, pageWidth - margin * 2, 8, 'F');
  doc.setFillColor(...electricBlue);
  doc.rect(margin, yPos, 3, 8, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textDark);
  doc.text('INCIDENTS BY STATUS', margin + 8, yPos + 5.5);
  yPos += 12;

  autoTable(doc, {
    startY: yPos,
    head: [['Status', 'Count', 'Percentage']],
    body: statusData.map((s) => {
      const pct = totalIncidents > 0 ? Math.round((s.count / totalIncidents) * 100) : 0;
      return [s.label, s.count.toString(), `${pct}%`];
    }),
    theme: 'plain',
    headStyles: {
      fillColor: navyDark,
      textColor: textWhite,
      fontStyle: 'bold',
      fontSize: 9,
      cellPadding: 4,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: textDark,
      cellPadding: 4,
    },
    alternateRowStyles: {
      fillColor: grayLight,
    },
    tableWidth: pageWidth - margin * 2,
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 50, halign: 'center' },
      2: { cellWidth: 50, halign: 'center' },
    },
    margin: { left: margin, right: margin },
    didParseCell: (data) => {
      // Color-code the status label in first column
      if (data.section === 'body' && data.column.index === 0) {
        const status = statusData[data.row.index]?.label;
        if (status && statusColors[status]) {
          data.cell.styles.textColor = statusColors[status];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
  });

  yPos = doc.lastAutoTable.finalY + 15;

  // Check page break
  if (yPos > pageHeight - 80) {
    doc.addPage();
    yPos = 20;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SECTION: WEEKLY TREND
  // ─────────────────────────────────────────────────────────────────────────

  doc.setFillColor(...grayLight);
  doc.rect(margin, yPos, pageWidth - margin * 2, 8, 'F');
  doc.setFillColor(...statusColors.RESOLVED);
  doc.rect(margin, yPos, 3, 8, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textDark);
  doc.text('WEEKLY INCIDENT TREND (LAST 7 DAYS)', margin + 8, yPos + 5.5);
  yPos += 12;

  const weekDates = getWeekDates();
  autoTable(doc, {
    startY: yPos,
    head: [['Day', 'Date', 'Created', 'Resolved', 'Net Change']],
    body: weeklyData.map((d, idx) => {
      const net = d.created - d.resolved;
      return [
        d.day,
        weekDates[idx] || '',
        d.created.toString(),
        d.resolved.toString(),
        `${net >= 0 ? '+' : ''}${net}`,
      ];
    }),
    theme: 'plain',
    headStyles: {
      fillColor: navyDark,
      textColor: textWhite,
      fontStyle: 'bold',
      fontSize: 9,
      cellPadding: 4,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: textDark,
      cellPadding: 4,
    },
    alternateRowStyles: {
      fillColor: grayLight,
    },
    tableWidth: pageWidth - margin * 2,
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 50, halign: 'center' },
      3: { cellWidth: 50, halign: 'center' },
      4: { cellWidth: 50, halign: 'center' },
    },
    margin: { left: margin, right: margin },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 4) {
        const net = weeklyData[data.row.index]?.created - weeklyData[data.row.index]?.resolved;
        if (net > 0) {
          data.cell.styles.textColor = priorityColors.CRITICAL;
        } else if (net < 0) {
          data.cell.styles.textColor = statusColors.RESOLVED;
        }
        data.cell.styles.fontStyle = 'bold';
      }
    },
  });

  yPos = doc.lastAutoTable.finalY + 10;

  // Weekly summary row
  const totalCreatedWeek = weeklyData.reduce((s, d) => s + d.created, 0);
  const totalResolvedWeek = weeklyData.reduce((s, d) => s + d.resolved, 0);
  const netChange = totalCreatedWeek - totalResolvedWeek;

  doc.setFillColor(240, 245, 250);
  doc.roundedRect(margin, yPos, pageWidth - margin * 2, 20, 2, 2, 'F');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textMuted);
  doc.text('WEEK TOTALS:', margin + 5, yPos + 8);

  doc.setTextColor(...textDark);
  doc.text(`Created: ${totalCreatedWeek}`, margin + 50, yPos + 8);
  doc.text(`Resolved: ${totalResolvedWeek}`, margin + 90, yPos + 8);

  doc.setTextColor(...(netChange > 0 ? priorityColors.CRITICAL : netChange < 0 ? statusColors.RESOLVED : textDark));
  doc.text(`Net: ${netChange >= 0 ? '+' : ''}${netChange}`, margin + 140, yPos + 8);

  // ─────────────────────────────────────────────────────────────────────────
  // FOOTER ON ALL PAGES
  // ─────────────────────────────────────────────────────────────────────────

  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // Footer line
    doc.setDrawColor(...grayBorder);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);

    // Footer text
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textMuted);
    doc.text('GHOST PROTOCOL — CONFIDENTIAL', margin, pageHeight - 10);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    doc.text(exportDate, pageWidth - margin, pageHeight - 10, { align: 'right' });
  }

  return doc.output('datauristring').split(',')[1];
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT HANDLERS
// ═══════════════════════════════════════════════════════════════════════════

export async function exportReportsExcel(reportData, agentName = 'AGENT') {
  if (!window.electronAPI?.export) {
    throw new Error('Export functionality requires Electron runtime');
  }

  let excelBuffer;
  try {
    excelBuffer = await generateReportsExcel(reportData, agentName);
  } catch (excelError) {
    console.error('[exportReportsExcel] Excel generation failed:', excelError);
    throw new Error(`Excel generation failed: ${excelError.message}`);
  }

  const defaultFilename = `ghost-protocol-reports-${getFormattedDate()}.xlsx`;

  const dialogResult = await window.electronAPI.export.showSaveDialog({
    title: 'Export Reports as Excel',
    defaultPath: defaultFilename,
    filters: [{ name: 'Excel Files', extensions: ['xlsx'] }],
  });

  if (dialogResult.canceled) {
    return { success: false, canceled: true };
  }

  // Convert buffer to base64 for IPC transfer
  const base64Content = btoa(String.fromCharCode(...new Uint8Array(excelBuffer)));

  const saveResult = await window.electronAPI.export.saveFile({
    filePath: dialogResult.filePath,
    content: base64Content,
    encoding: 'binary',
  });

  return saveResult;
}

export async function exportReportsPDF(reportData, agentName = 'AGENT') {
  if (!window.electronAPI?.export) {
    throw new Error('Export functionality requires Electron runtime');
  }

  let pdfBase64;
  try {
    pdfBase64 = generateReportsPDF(reportData, agentName);
  } catch (pdfError) {
    console.error('[exportReportsPDF] PDF generation failed:', pdfError);
    throw new Error(`PDF generation failed: ${pdfError.message}`);
  }

  const defaultFilename = `ghost-protocol-reports-${getFormattedDate()}.pdf`;

  const dialogResult = await window.electronAPI.export.showSaveDialog({
    title: 'Export Reports as PDF',
    defaultPath: defaultFilename,
    filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
  });

  if (dialogResult.canceled) {
    return { success: false, canceled: true };
  }

  const saveResult = await window.electronAPI.export.saveFile({
    filePath: dialogResult.filePath,
    content: pdfBase64,
    encoding: 'binary',
  });

  return saveResult;
}
