import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';

/**
 * Generic, report-agnostic export helpers. Every report tab calls these
 * with its own `rows`, `columns` and `formatCell`, so the Excel/CSV/PDF
 * logic itself only has to be maintained in one place.
 *
 * @param {Array<object>} rows
 * @param {Array<{key:string,label:string}>} columns
 * @param {(row:object, col:object) => any} formatCell
 * @param {string} reportType   e.g. 'students' — used in filenames + sheet name
 * @param {string} reportLabel  e.g. 'Student Reports' — used in the PDF header
 */

export function exportToExcel(rows, columns, formatCell, reportType) {
  const excelData = rows.map((row, i) => {
    const obj = { '#': i + 1 };
    columns.forEach(col => { obj[col.label] = formatCell(row, col); });
    return obj;
  });
  const worksheet = XLSX.utils.json_to_sheet(excelData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, reportType);
  XLSX.writeFile(workbook, `${reportType}_report_${new Date().toISOString().split('T')[0]}.xlsx`);
}

export function exportToCSV(rows, columns, formatCell, reportType) {
  const headers = columns.map(c => c.label);
  const csvContent = [
    headers.join(','),
    ...rows.map(row => columns.map(col => `"${String(formatCell(row, col)).replace(/"/g, '""')}"`).join(','))
  ].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToPDF(rows, columns, formatCell, reportType, reportLabel) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  const usableWidth = pageWidth - margin * 2;
  const colWidth = usableWidth / columns.length;
  const rowHeight = 8;
  let y = margin;

  const drawHeader = () => {
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(reportLabel || 'Report', margin, y);
    y += 6;
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.text(`Generated: ${new Date().toLocaleString()}`, margin, y);
    y += 8;

    doc.setFillColor(240, 240, 240);
    doc.rect(margin, y - 5, usableWidth, rowHeight, 'F');
    doc.setFont(undefined, 'bold');
    doc.setFontSize(8);
    columns.forEach((col, i) => {
      doc.text(col.label, margin + i * colWidth + 1, y);
    });
    y += rowHeight;
    doc.setFont(undefined, 'normal');
  };

  drawHeader();

  rows.forEach((row) => {
    if (y > pageHeight - margin - rowHeight) {
      doc.addPage();
      y = margin;
      drawHeader();
    }
    columns.forEach((col, i) => {
      const text = String(formatCell(row, col)).slice(0, 24);
      doc.text(text, margin + i * colWidth + 1, y);
    });
    y += rowHeight;
  });

  doc.save(`${reportType}_report_${new Date().toISOString().split('T')[0]}.pdf`);
}