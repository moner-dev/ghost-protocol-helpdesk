/**
 * GHOST PROTOCOL — Knowledge Base Article Export Utility
 *
 * Professional PDF export for Knowledge Base articles.
 * Uses jsPDF for PDF generation.
 */

import { jsPDF } from 'jspdf';

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
  return `GP-KB-${year}${month}${day}-${hour}${min}`;
}

function formatArticleDate(dateStr) {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

// Convert markdown body to plain text lines for PDF
function parseMarkdownToLines(body) {
  if (!body) return [];
  const lines = body.split('\n');
  const result = [];
  let inCodeBlock = false;

  for (const line of lines) {
    // Handle code block markers
    if (line.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      if (inCodeBlock) {
        result.push({ type: 'code-start', text: '' });
      } else {
        result.push({ type: 'code-end', text: '' });
      }
      continue;
    }

    if (inCodeBlock) {
      result.push({ type: 'code', text: line });
      continue;
    }

    // Headers
    if (line.startsWith('# ')) {
      result.push({ type: 'h1', text: line.replace('# ', '') });
    } else if (line.startsWith('## ')) {
      result.push({ type: 'h2', text: line.replace('## ', '') });
    } else if (line.startsWith('### ')) {
      result.push({ type: 'h3', text: line.replace('### ', '') });
    }
    // Lists
    else if (line.startsWith('- ') || line.startsWith('* ')) {
      result.push({ type: 'bullet', text: line.replace(/^[-*] (\[[ x]\] )?/, '') });
    } else if (line.match(/^\d+\./)) {
      result.push({ type: 'numbered', text: line });
    }
    // Tables (simplified)
    else if (line.startsWith('|')) {
      result.push({ type: 'table', text: line });
    }
    // Normal paragraph
    else if (line.trim()) {
      // Strip inline code markers for plain text
      const cleanedLine = line.replace(/`([^`]+)`/g, '$1');
      result.push({ type: 'paragraph', text: cleanedLine });
    }
    // Empty line
    else {
      result.push({ type: 'empty', text: '' });
    }
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════════════════
// PDF GENERATION
// ═══════════════════════════════════════════════════════════════════════════

export function generateArticlePDF(article, categoryName = 'Uncategorized') {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let yPos = 0;

  // Colors
  const navyDark = [5, 10, 24];
  const electricBlue = [79, 195, 247];
  const textWhite = [255, 255, 255];
  const textDark = [30, 30, 30];
  const textMuted = [120, 120, 120];
  const grayLight = [245, 247, 250];
  const grayBorder = [220, 225, 230];
  const codeBackground = [40, 44, 52];

  // Difficulty colors
  const difficultyColors = {
    beginner: [34, 197, 94],
    intermediate: [234, 179, 8],
    advanced: [249, 115, 22],
    expert: [239, 68, 68],
  };

  const documentRef = generateDocumentRef();
  const exportDate = getFormattedDate();
  const diffColor = difficultyColors[article.difficulty] || difficultyColors.beginner;
  const diffLabel = (article.difficulty || 'beginner').toUpperCase();

  // ─────────────────────────────────────────────────────────────────────────
  // HEADER SECTION
  // ─────────────────────────────────────────────────────────────────────────

  // Dark navy header block
  doc.setFillColor(...navyDark);
  doc.rect(0, 0, pageWidth, 40, 'F');

  // GHOST PROTOCOL title
  doc.setTextColor(...textWhite);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('GHOST PROTOCOL', margin, 15);

  // Subtitle
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...electricBlue);
  doc.text('KNOWLEDGE BASE ARTICLE', margin, 23);

  // Document reference
  doc.setFontSize(8);
  doc.setTextColor(180, 180, 180);
  doc.text(`Ref: ${documentRef}`, pageWidth - margin, 15, { align: 'right' });
  doc.text(`Exported: ${getFormattedDateTime()}`, pageWidth - margin, 22, { align: 'right' });

  // Electric blue separator line
  doc.setDrawColor(...electricBlue);
  doc.setLineWidth(0.8);
  doc.line(0, 41, pageWidth, 41);

  yPos = 50;

  // ─────────────────────────────────────────────────────────────────────────
  // ARTICLE TITLE
  // ─────────────────────────────────────────────────────────────────────────

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textDark);

  // Word wrap title
  const titleLines = doc.splitTextToSize(article.title || 'Untitled Article', contentWidth);
  doc.text(titleLines, margin, yPos);
  yPos += titleLines.length * 8 + 5;

  // ─────────────────────────────────────────────────────────────────────────
  // METADATA BAR
  // ─────────────────────────────────────────────────────────────────────────

  doc.setFillColor(...grayLight);
  doc.roundedRect(margin, yPos, contentWidth, 12, 2, 2, 'F');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');

  // Category badge
  doc.setTextColor(...electricBlue);
  doc.text(categoryName.toUpperCase(), margin + 5, yPos + 7.5);

  // Difficulty badge
  doc.setTextColor(...diffColor);
  doc.text(diffLabel, margin + 60, yPos + 7.5);

  // Date
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textMuted);
  doc.text(`Updated: ${formatArticleDate(article.updated_at)}`, margin + 110, yPos + 7.5);

  // Author
  if (article.updated_by_name || article.created_by_name) {
    doc.text(`By: ${article.updated_by_name || article.created_by_name || 'Unknown'}`, pageWidth - margin - 5, yPos + 7.5, { align: 'right' });
  }

  yPos += 20;

  // ─────────────────────────────────────────────────────────────────────────
  // ARTICLE BODY
  // ─────────────────────────────────────────────────────────────────────────

  const parsedLines = parseMarkdownToLines(article.body);
  let inCodeBlock = false;

  for (const line of parsedLines) {
    // Check for page break
    if (yPos > pageHeight - 25) {
      doc.addPage();
      yPos = 20;
    }

    switch (line.type) {
      case 'h1':
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...textDark);
        yPos += 4;
        doc.text(line.text, margin, yPos);
        yPos += 8;
        break;

      case 'h2':
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...textDark);
        yPos += 3;
        // Draw subtle separator
        doc.setDrawColor(...grayBorder);
        doc.setLineWidth(0.2);
        doc.line(margin, yPos - 2, pageWidth - margin, yPos - 2);
        doc.text(line.text, margin, yPos + 4);
        yPos += 10;
        break;

      case 'h3':
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...textDark);
        yPos += 2;
        doc.text(line.text, margin, yPos);
        yPos += 6;
        break;

      case 'bullet':
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...textDark);
        const bulletLines = doc.splitTextToSize(line.text, contentWidth - 10);
        doc.text('\u2022', margin + 2, yPos);
        doc.text(bulletLines, margin + 8, yPos);
        yPos += bulletLines.length * 5 + 2;
        break;

      case 'numbered':
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...textDark);
        const numLines = doc.splitTextToSize(line.text, contentWidth - 5);
        doc.text(numLines, margin + 5, yPos);
        yPos += numLines.length * 5 + 2;
        break;

      case 'code-start':
        inCodeBlock = true;
        doc.setFillColor(...codeBackground);
        yPos += 2;
        break;

      case 'code-end':
        inCodeBlock = false;
        yPos += 4;
        break;

      case 'code':
        doc.setFontSize(9);
        doc.setFont('courier', 'normal');
        doc.setTextColor(200, 200, 200);
        // Draw code background
        doc.setFillColor(...codeBackground);
        doc.rect(margin, yPos - 3, contentWidth, 5, 'F');
        doc.text(line.text, margin + 3, yPos);
        yPos += 5;
        break;

      case 'table':
        doc.setFontSize(9);
        doc.setFont('courier', 'normal');
        doc.setTextColor(...textMuted);
        doc.text(line.text, margin, yPos);
        yPos += 5;
        break;

      case 'paragraph':
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...textDark);
        const paraLines = doc.splitTextToSize(line.text, contentWidth);
        doc.text(paraLines, margin, yPos);
        yPos += paraLines.length * 5 + 2;
        break;

      case 'empty':
        yPos += 3;
        break;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TAGS (if present)
  // ─────────────────────────────────────────────────────────────────────────

  const tags = (article.tags || '').split(',').map(t => t.trim()).filter(Boolean);
  if (tags.length > 0) {
    if (yPos > pageHeight - 35) {
      doc.addPage();
      yPos = 20;
    }

    yPos += 5;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...textMuted);
    doc.text('TAGS:', margin, yPos);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...electricBlue);
    doc.text(tags.map(t => `#${t}`).join('  '), margin + 15, yPos);
    yPos += 8;
  }

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
    doc.text('GHOST PROTOCOL — KNOWLEDGE BASE', margin, pageHeight - 10);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    doc.text(exportDate, pageWidth - margin, pageHeight - 10, { align: 'right' });
  }

  return doc.output('datauristring').split(',')[1];
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT HANDLER
// ═══════════════════════════════════════════════════════════════════════════

export async function exportArticlePDF(article, categoryName = 'Uncategorized') {
  if (!window.electronAPI?.export) {
    throw new Error('Export functionality requires Electron runtime');
  }

  let pdfBase64;
  try {
    pdfBase64 = generateArticlePDF(article, categoryName);
  } catch (pdfError) {
    console.error('[exportArticlePDF] PDF generation failed:', pdfError);
    throw new Error(`PDF generation failed: ${pdfError.message}`);
  }

  // Sanitize title for filename
  const safeTitle = (article.title || 'article')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);

  const defaultFilename = `ghost-kb-${safeTitle}-${getFormattedDate()}.pdf`;

  const dialogResult = await window.electronAPI.export.showSaveDialog({
    title: 'Export Article as PDF',
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
