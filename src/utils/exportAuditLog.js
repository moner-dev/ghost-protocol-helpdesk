/**
 * GHOST PROTOCOL — Audit Log Export Utility
 *
 * Professional intelligence briefing style exports for Audit Log page.
 * Uses jsPDF and jspdf-autotable for PDF generation.
 * Uses ExcelJS for professional Excel exports.
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';

// ═══════════════════════════════════════════════════════════════════════════
// EVENT TYPE CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const EVENT_LABELS = {
  login: 'LOGIN',
  logout: 'LOGOUT',
  login_failed: 'LOGIN FAILED',
  login_blocked: 'LOGIN BLOCKED',
  user_registered: 'USER REGISTERED',
  user_status_changed: 'STATUS CHANGED',
  user_role_changed: 'ROLE CHANGED',
  user_department_changed: 'DEPT CHANGED',
  user_deleted: 'USER DELETED',
  incident_created: 'TICKET CREATED',
  incident_updated: 'TICKET UPDATED',
  incident_deleted: 'TICKET DELETED',
  database_backup: 'BACKUP CREATED',
  database_restored: 'DB RESTORED',
  database_exported: 'DATA EXPORTED',
  audit_log_exported: 'AUDIT EXPORTED',
  audit_log_cleaned: 'AUDIT CLEANED',
};

const EVENT_CATEGORIES = {
  login: 'AUTH',
  logout: 'AUTH',
  login_failed: 'AUTH',
  login_blocked: 'AUTH',
  user_registered: 'USER',
  user_status_changed: 'USER',
  user_role_changed: 'USER',
  user_department_changed: 'USER',
  user_deleted: 'USER',
  incident_created: 'INCIDENT',
  incident_updated: 'INCIDENT',
  incident_deleted: 'INCIDENT',
  database_backup: 'SYSTEM',
  database_restored: 'SYSTEM',
  database_exported: 'SYSTEM',
  audit_log_exported: 'SYSTEM',
  audit_log_cleaned: 'SYSTEM',
};

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
  return `GP-AUD-${year}${month}${day}-${hour}${min}`;
}

function formatTimestamp(ts) {
  const date = new Date(ts);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function formatTimestampShort(ts) {
  const date = new Date(ts);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function getEventLabel(eventType) {
  return EVENT_LABELS[eventType] || eventType?.toUpperCase() || 'UNKNOWN';
}

function getEventCategory(eventType) {
  return EVENT_CATEGORIES[eventType] || 'OTHER';
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
  // Category colors
  auth: 'FF4FC3F7',
  user: 'FFEAB308',
  incident: 'FF22C55E',
  system: 'FF888888',
};

function getCategoryColor(category) {
  const c = category?.toUpperCase();
  if (c === 'AUTH') return EXCEL_COLORS.auth;
  if (c === 'USER') return EXCEL_COLORS.user;
  if (c === 'INCIDENT') return EXCEL_COLORS.incident;
  if (c === 'SYSTEM') return EXCEL_COLORS.system;
  return EXCEL_COLORS.textDark;
}

export async function generateAuditLogExcel(logs, filters = {}, agentName = 'AGENT') {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'GHOST PROTOCOL';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Audit Log', {
    properties: { tabColor: { argb: EXCEL_COLORS.navyDark } },
    pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1 },
  });

  // Column widths for audit log
  sheet.columns = [
    { width: 22 }, // Timestamp
    { width: 12 }, // Category
    { width: 18 }, // Event Type
    { width: 18 }, // Agent
    { width: 14 }, // Target Type
    { width: 20 }, // Target
    { width: 24 }, // Old Value
    { width: 24 }, // New Value
  ];

  let rowNum = 1;
  const lastCol = 8;

  // ─────────────────────────────────────────────────────────────────────────
  // HEADER BANNER
  // ─────────────────────────────────────────────────────────────────────────

  sheet.mergeCells(rowNum, 1, rowNum, lastCol);
  const titleRow = sheet.getRow(rowNum);
  titleRow.height = 36;
  const titleCell = sheet.getCell(rowNum, 1);
  titleCell.value = 'GHOST PROTOCOL — AUDIT LOG';
  titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: EXCEL_COLORS.navyDark } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  rowNum++;

  sheet.mergeCells(rowNum, 1, rowNum, lastCol);
  const subtitleRow = sheet.getRow(rowNum);
  subtitleRow.height = 20;
  const subtitleCell = sheet.getCell(rowNum, 1);
  subtitleCell.value = `Generated: ${getFormattedDateTime()}  |  Agent: ${agentName.toUpperCase()}  |  Ref: ${generateDocumentRef()}`;
  subtitleCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FFFFFFFF' } };
  subtitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: EXCEL_COLORS.navyDark } };
  subtitleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  rowNum++;

  rowNum++; // Spacer

  // ─────────────────────────────────────────────────────────────────────────
  // EXPORT SUMMARY
  // ─────────────────────────────────────────────────────────────────────────

  // Section header - full width
  sheet.mergeCells(rowNum, 1, rowNum, lastCol);
  const summaryHeaderRow = sheet.getRow(rowNum);
  summaryHeaderRow.height = 22;
  const summaryHeaderCell = sheet.getCell(rowNum, 1);
  summaryHeaderCell.value = 'EXPORT SUMMARY';
  summaryHeaderCell.font = { name: 'Arial', size: 11, bold: true, color: { argb: EXCEL_COLORS.navyDark } };
  summaryHeaderCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: EXCEL_COLORS.lightBlue } };
  summaryHeaderCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  rowNum++;

  // Summary data
  const summaryData = [
    ['Total Events', logs.length.toString()],
  ];
  if (filters.eventType) {
    summaryData.push(['Event Filter', getEventLabel(filters.eventType)]);
  }
  if (filters.performerName || filters.performedBy) {
    summaryData.push(['Agent Filter', filters.performerName || filters.performedBy]);
  }
  if (filters.searchQuery) {
    summaryData.push(['Search Query', filters.searchQuery]);
  }
  if (!filters.eventType && !filters.performedBy && !filters.searchQuery) {
    summaryData.push(['Filters Applied', 'None (full log)']);
  }

  summaryData.forEach((item, idx) => {
    const isAlt = idx % 2 === 1;
    const row = sheet.getRow(rowNum);
    row.height = 18;
    const bgColor = isAlt ? EXCEL_COLORS.altRow : EXCEL_COLORS.white;

    const labelCell = sheet.getCell(rowNum, 1);
    labelCell.value = item[0];
    labelCell.font = { name: 'Arial', size: 10, color: { argb: EXCEL_COLORS.textDark } };
    labelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
    labelCell.border = { bottom: { style: 'thin', color: { argb: EXCEL_COLORS.border } } };

    const valueCell = sheet.getCell(rowNum, 2);
    valueCell.value = item[1];
    valueCell.font = { name: 'Arial', size: 10, bold: true, color: { argb: EXCEL_COLORS.navyDark } };
    valueCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
    valueCell.border = { bottom: { style: 'thin', color: { argb: EXCEL_COLORS.border } } };

    // Fill remaining columns
    for (let c = 3; c <= lastCol; c++) {
      const emptyCell = sheet.getCell(rowNum, c);
      emptyCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
      emptyCell.border = { bottom: { style: 'thin', color: { argb: EXCEL_COLORS.border } } };
    }

    rowNum++;
  });

  rowNum++; // Spacer

  // ─────────────────────────────────────────────────────────────────────────
  // CATEGORY BREAKDOWN
  // ─────────────────────────────────────────────────────────────────────────

  const categoryCount = {};
  logs.forEach((log) => {
    const cat = getEventCategory(log.event_type);
    categoryCount[cat] = (categoryCount[cat] || 0) + 1;
  });

  // Section header - full width
  sheet.mergeCells(rowNum, 1, rowNum, lastCol);
  const catHeaderRow = sheet.getRow(rowNum);
  catHeaderRow.height = 22;
  const catHeaderCell = sheet.getCell(rowNum, 1);
  catHeaderCell.value = 'EVENT CATEGORIES';
  catHeaderCell.font = { name: 'Arial', size: 11, bold: true, color: { argb: EXCEL_COLORS.navyDark } };
  catHeaderCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: EXCEL_COLORS.lightBlue } };
  catHeaderCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  rowNum++;

  // Column headers - full width
  const catColHeaders = ['Category', 'Count', 'Percentage', '', '', '', '', ''];
  catColHeaders.forEach((header, idx) => {
    const cell = sheet.getCell(rowNum, idx + 1);
    cell.value = header;
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: EXCEL_COLORS.navyDark } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = { bottom: { style: 'thin', color: { argb: EXCEL_COLORS.border } } };
  });
  sheet.getRow(rowNum).height = 20;
  rowNum++;

  // Category data rows - full width
  Object.entries(categoryCount).sort((a, b) => b[1] - a[1]).forEach(([cat, count], idx) => {
    const pct = logs.length > 0 ? (count / logs.length) * 100 : 0;
    const isAlt = idx % 2 === 1;
    const row = sheet.getRow(rowNum);
    row.height = 18;
    const bgColor = isAlt ? EXCEL_COLORS.altRow : EXCEL_COLORS.white;

    const catCell = sheet.getCell(rowNum, 1);
    catCell.value = cat;
    catCell.font = { name: 'Arial', size: 10, bold: true, color: { argb: getCategoryColor(cat) } };
    catCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
    catCell.border = { bottom: { style: 'thin', color: { argb: EXCEL_COLORS.border } } };

    const countCell = sheet.getCell(rowNum, 2);
    countCell.value = count;
    countCell.font = { name: 'Arial', size: 10, color: { argb: EXCEL_COLORS.textDark } };
    countCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
    countCell.alignment = { horizontal: 'center' };
    countCell.border = { bottom: { style: 'thin', color: { argb: EXCEL_COLORS.border } } };

    const pctCell = sheet.getCell(rowNum, 3);
    pctCell.value = `${pct.toFixed(1)}%`;
    pctCell.font = { name: 'Arial', size: 10, color: { argb: EXCEL_COLORS.textDark } };
    pctCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
    pctCell.alignment = { horizontal: 'center' };
    pctCell.border = { bottom: { style: 'thin', color: { argb: EXCEL_COLORS.border } } };

    // Fill remaining columns
    for (let c = 4; c <= lastCol; c++) {
      const emptyCell = sheet.getCell(rowNum, c);
      emptyCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
      emptyCell.border = { bottom: { style: 'thin', color: { argb: EXCEL_COLORS.border } } };
    }

    rowNum++;
  });

  rowNum++; // Spacer

  // ─────────────────────────────────────────────────────────────────────────
  // AUDIT LOG ENTRIES
  // ─────────────────────────────────────────────────────────────────────────

  sheet.mergeCells(rowNum, 1, rowNum, lastCol);
  const logHeaderRow = sheet.getRow(rowNum);
  logHeaderRow.height = 22;
  const logHeaderCell = sheet.getCell(rowNum, 1);
  logHeaderCell.value = 'AUDIT LOG ENTRIES';
  logHeaderCell.font = { name: 'Arial', size: 11, bold: true, color: { argb: EXCEL_COLORS.navyDark } };
  logHeaderCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: EXCEL_COLORS.lightBlue } };
  logHeaderCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  for (let c = 2; c <= lastCol; c++) {
    sheet.getCell(rowNum, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: EXCEL_COLORS.lightBlue } };
  }
  rowNum++;

  // Column headers
  const logColHeaders = ['Timestamp', 'Category', 'Event Type', 'Agent', 'Target Type', 'Target', 'Old Value', 'New Value'];
  logColHeaders.forEach((header, idx) => {
    const cell = sheet.getCell(rowNum, idx + 1);
    cell.value = header;
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: EXCEL_COLORS.navyDark } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });
  sheet.getRow(rowNum).height = 20;
  rowNum++;

  // Data rows
  logs.forEach((log, idx) => {
    const isAlt = idx % 2 === 1;
    const row = sheet.getRow(rowNum);
    row.height = 18;
    const bgColor = isAlt ? EXCEL_COLORS.altRow : EXCEL_COLORS.white;
    const category = getEventCategory(log.event_type);

    const values = [
      formatTimestamp(log.performed_at),
      category,
      getEventLabel(log.event_type),
      log.performer_name || log.performed_by || '—',
      log.target_type || '—',
      log.target_name || log.target_id || '—',
      log.old_value || '—',
      log.new_value || '—',
    ];

    values.forEach((val, colIdx) => {
      const cell = sheet.getCell(rowNum, colIdx + 1);
      cell.value = val;
      cell.font = {
        name: 'Arial',
        size: 9,
        bold: colIdx === 1,
        color: { argb: colIdx === 1 ? getCategoryColor(category) : EXCEL_COLORS.textDark },
      };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
      cell.alignment = { vertical: 'middle', horizontal: colIdx <= 2 ? 'center' : 'left' };
      cell.border = { bottom: { style: 'thin', color: { argb: EXCEL_COLORS.border } } };
    });

    rowNum++;
  });

  rowNum++; // Spacer

  // ─────────────────────────────────────────────────────────────────────────
  // FOOTER
  // ─────────────────────────────────────────────────────────────────────────

  sheet.mergeCells(rowNum, 1, rowNum, lastCol);
  const footerRow = sheet.getRow(rowNum);
  footerRow.height = 20;
  const footerCell = sheet.getCell(rowNum, 1);
  footerCell.value = `${generateDocumentRef()}                                                                                              GHOST PROTOCOL — CONFIDENTIAL`;
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

export function generateAuditLogPDF(logs, filters = {}, agentName = 'AGENT') {
  // Landscape for better table fit
  const doc = new jsPDF('l', 'mm', 'a4');
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

  // Category colors
  const categoryColors = {
    AUTH: [79, 195, 247],
    USER: [234, 179, 8],
    INCIDENT: [34, 197, 94],
    SYSTEM: [120, 120, 120],
    OTHER: [160, 160, 160],
  };

  const documentRef = generateDocumentRef();
  const exportDate = getFormattedDate();

  // ─────────────────────────────────────────────────────────────────────────
  // COVER HEADER SECTION
  // ─────────────────────────────────────────────────────────────────────────

  // Dark navy header block
  doc.setFillColor(...navyDark);
  doc.rect(0, 0, pageWidth, 38, 'F');

  // GHOST PROTOCOL title
  doc.setTextColor(...textWhite);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('GHOST PROTOCOL', margin, 15);

  // Subtitle
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...electricBlue);
  doc.text('MONER INTELLIGENCE — IT INCIDENT TRACKER', margin, 22);

  // Document type
  doc.setFontSize(11);
  doc.setTextColor(...textWhite);
  doc.setFont('helvetica', 'bold');
  doc.text('AUDIT LOG', margin, 32);

  // Right side - metadata
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(180, 180, 180);
  doc.text(`Generated: ${getFormattedDateTime()}`, pageWidth - margin, 12, { align: 'right' });
  doc.text(`Agent: ${agentName.toUpperCase()}`, pageWidth - margin, 19, { align: 'right' });
  doc.setTextColor(...electricBlue);
  doc.setFont('helvetica', 'bold');
  doc.text(`Ref: ${documentRef}`, pageWidth - margin, 32, { align: 'right' });

  // Electric blue separator line
  doc.setDrawColor(...electricBlue);
  doc.setLineWidth(0.8);
  doc.line(0, 39, pageWidth, 39);

  yPos = 47;

  // ─────────────────────────────────────────────────────────────────────────
  // EXPORT SUMMARY BOX
  // ─────────────────────────────────────────────────────────────────────────

  const summaryBoxWidth = 140;
  const summaryBoxHeight = 40;

  doc.setFillColor(...grayLight);
  doc.setDrawColor(...grayBorder);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, yPos, summaryBoxWidth, summaryBoxHeight, 3, 3, 'FD');

  // Summary title
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textMuted);
  doc.text('EXPORT SUMMARY', margin + 5, yPos + 7);

  // Total events
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textMuted);
  doc.text('TOTAL EVENTS', margin + 8, yPos + 16);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textDark);
  doc.text(logs.length.toString(), margin + 8, yPos + 26);

  // Filters applied
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textMuted);
  doc.text('FILTERS', margin + 55, yPos + 16);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textDark);

  const filterTexts = [];
  if (filters.eventType) filterTexts.push(getEventLabel(filters.eventType));
  if (filters.performerName || filters.performedBy) filterTexts.push(filters.performerName || filters.performedBy);
  if (filters.searchQuery) filterTexts.push(`"${filters.searchQuery}"`);
  doc.text(filterTexts.length > 0 ? filterTexts.join(', ').substring(0, 25) : 'None', margin + 55, yPos + 24);

  // Category breakdown (mini chart-like display)
  const categoryCount = {};
  logs.forEach((log) => {
    const cat = getEventCategory(log.event_type);
    categoryCount[cat] = (categoryCount[cat] || 0) + 1;
  });

  // Category stats box
  doc.setFillColor(...grayLight);
  doc.roundedRect(margin + summaryBoxWidth + 10, yPos, pageWidth - margin * 2 - summaryBoxWidth - 10, summaryBoxHeight, 3, 3, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textMuted);
  doc.text('EVENT CATEGORIES', margin + summaryBoxWidth + 15, yPos + 7);

  let catX = margin + summaryBoxWidth + 15;
  const sortedCategories = Object.entries(categoryCount).sort((a, b) => b[1] - a[1]);
  sortedCategories.forEach(([cat, count], idx) => {
    if (idx < 5 && catX < pageWidth - margin - 40) {
      const pct = logs.length > 0 ? Math.round((count / logs.length) * 100) : 0;
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...textMuted);
      doc.text(cat, catX, yPos + 18);

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...(categoryColors[cat] || categoryColors.OTHER));
      doc.text(count.toString(), catX, yPos + 27);

      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...textMuted);
      doc.text(`${pct}%`, catX, yPos + 33);

      catX += 35;
    }
  });

  yPos += summaryBoxHeight + 12;

  // ─────────────────────────────────────────────────────────────────────────
  // SECTION: AUDIT LOG ENTRIES
  // ─────────────────────────────────────────────────────────────────────────

  // Section header with accent
  doc.setFillColor(...grayLight);
  doc.rect(margin, yPos, pageWidth - margin * 2, 8, 'F');
  doc.setFillColor(...electricBlue);
  doc.rect(margin, yPos, 3, 8, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textDark);
  doc.text('AUDIT LOG ENTRIES', margin + 8, yPos + 5.5);
  yPos += 12;

  // Prepare table data
  const tableBody = logs.map((log) => [
    formatTimestampShort(log.performed_at),
    getEventCategory(log.event_type),
    getEventLabel(log.event_type),
    (log.performer_name || log.performed_by || '-').substring(0, 15),
    (log.target_type || '-').substring(0, 10),
    (log.target_name || log.target_id || '-').substring(0, 20),
    (log.old_value || '-').substring(0, 20),
    (log.new_value || '-').substring(0, 20),
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['Timestamp', 'Cat', 'Event', 'Agent', 'Type', 'Target', 'Old Value', 'New Value']],
    body: tableBody,
    theme: 'plain',
    headStyles: {
      fillColor: navyDark,
      textColor: textWhite,
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: 3,
    },
    bodyStyles: {
      fontSize: 7,
      textColor: textDark,
      cellPadding: 2.5,
    },
    alternateRowStyles: {
      fillColor: grayLight,
    },
    tableWidth: pageWidth - margin * 2,
    columnStyles: {
      0: { cellWidth: 36 },  // Timestamp
      1: { cellWidth: 22 },  // Category
      2: { cellWidth: 34 },  // Event
      3: { cellWidth: 32 },  // Agent
      4: { cellWidth: 26 },  // Type
      5: { cellWidth: 'auto' },  // Target
      6: { cellWidth: 'auto' },  // Old Value
      7: { cellWidth: 'auto' },  // New Value
    },
    margin: { left: margin, right: margin },
    styles: {
      overflow: 'ellipsize',
      lineWidth: 0.1,
      lineColor: grayBorder,
    },
    didParseCell: (data) => {
      // Color the category column
      if (data.section === 'body' && data.column.index === 1) {
        const cat = data.cell.raw;
        if (cat && categoryColors[cat]) {
          data.cell.styles.textColor = categoryColors[cat];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
    didDrawPage: () => {
      // Footer on each page
      const pageCount = doc.internal.getNumberOfPages();
      const currentPage = doc.internal.getCurrentPageInfo().pageNumber;

      // Footer line
      doc.setDrawColor(...grayBorder);
      doc.setLineWidth(0.3);
      doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

      // Footer text
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...textMuted);
      doc.text('GHOST PROTOCOL — CONFIDENTIAL', margin, pageHeight - 7);
      doc.text(`Page ${currentPage} of ${pageCount}`, pageWidth / 2, pageHeight - 7, { align: 'center' });
      doc.text(exportDate, pageWidth - margin, pageHeight - 7, { align: 'right' });
    },
  });

  return doc.output('datauristring').split(',')[1];
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT HANDLERS
// ═══════════════════════════════════════════════════════════════════════════

export async function exportAuditLogExcel(logs, filters = {}, agentName = 'AGENT') {
  if (!window.electronAPI?.export) {
    throw new Error('Export functionality requires Electron runtime');
  }

  let excelBuffer;
  try {
    excelBuffer = await generateAuditLogExcel(logs, filters, agentName);
  } catch (excelError) {
    console.error('[exportAuditLogExcel] Excel generation failed:', excelError);
    throw new Error(`Excel generation failed: ${excelError.message}`);
  }

  const defaultFilename = `ghost-protocol-audit-log-${getFormattedDate()}.xlsx`;

  const dialogResult = await window.electronAPI.export.showSaveDialog({
    title: 'Export Audit Log as Excel',
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

export async function exportAuditLogPDF(logs, filters = {}, agentName = 'AGENT') {
  if (!window.electronAPI?.export) {
    throw new Error('Export functionality requires Electron runtime');
  }

  let pdfBase64;
  try {
    pdfBase64 = generateAuditLogPDF(logs, filters, agentName);
  } catch (pdfError) {
    console.error('[exportAuditLogPDF] PDF generation failed:', pdfError);
    throw new Error(`PDF generation failed: ${pdfError.message}`);
  }

  const defaultFilename = `ghost-protocol-audit-log-${getFormattedDate()}.pdf`;

  const dialogResult = await window.electronAPI.export.showSaveDialog({
    title: 'Export Audit Log as PDF',
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
