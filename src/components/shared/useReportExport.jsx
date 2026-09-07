import { useState } from 'react';
import { exportToExcel, exportToCSV, exportToPDF } from './reportExport';

/**
 * Wraps the three export helpers with the shared exporting/dialog boilerplate
 * that used to be copy-pasted per handler. Each report tab just does:
 *
 *   const { exporting, handleExcel, handleCSV, handlePDF } =
 *     useReportExport({ rows, columns, formatCell, reportType: 'students', reportLabel: 'Student Reports', showDialog });
 */
export function useReportExport({ rows, columns, formatCell, reportType, reportLabel, showDialog }) {
  const [exporting, setExporting] = useState(false);

  const run = (label, fn) => {
    if (rows.length === 0) return;
    setExporting(true);
    try {
      fn();
      showDialog('success', 'Export Complete', `Exported ${rows.length} record(s) to ${label}.`);
    } catch (error) {
      console.error(error);
      showDialog('error', 'Export Failed', `Failed to export to ${label}.`);
    } finally {
      setExporting(false);
    }
  };

  return {
    exporting,
    handleExcel: () => run('Excel', () => exportToExcel(rows, columns, formatCell, reportType)),
    handleCSV: () => run('CSV', () => exportToCSV(rows, columns, formatCell, reportType)),
    handlePDF: () => run('PDF', () => exportToPDF(rows, columns, formatCell, reportType, reportLabel))
  };
}