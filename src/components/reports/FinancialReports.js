import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Filter } from 'lucide-react';
import { selectStyle, labelStyle } from '../shared/ui';
import { formatCell } from '../shared/formatCell';
import ReportTable, { ReportSummaryCards } from '../shared/ReportTable';
import ReportExportButtons from '../shared/ReportExportButtons';
import { useReportExport } from '../shared/useReportExport';
import { useReportMeta } from '../shared/useReportMeta';
import { useAppDialog } from '../../hooks/useAppDialog';
import AppDialog from '../shared/AppDialog';

const COLUMNS = [
  { key: 'receiptNumber', label: 'Receipt No' },
  { key: 'studentName', label: 'Student' },
  { key: 'className', label: 'Class' },
  { key: 'categoryName', label: 'Category' },
  { key: 'amountPaid', label: 'Amount Paid' },
  { key: 'paymentMethod', label: 'Method' },
  { key: 'paymentDate', label: 'Date' },
  { key: 'receivedBy', label: 'Received By' }
];

const FinancialReports = () => {
  const { meta, loading: metaLoading } = useReportMeta();
  const { dialog, showDialog, closeDialog, handleDialogAction } = useAppDialog();

  const [filters, setFilters] = useState({
    academicYear: '',
    termId: '',
    classId: '',
    studentId: '',
    categoryId: ''
  });

  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  useEffect(() => {
    if (meta && !filters.academicYear) {
      const current = meta.academicYears.find(y => y.isCurrent);
      if (current) {
        setFilters(prev => ({ ...prev, academicYear: current.yearLabel }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta]);

  const selectedYearTerms = meta
    ? (meta.academicYears.find(y => y.yearLabel === filters.academicYear) || {}).terms || []
    : [];

  const handleFilterChange = (field, value) => setFilters(prev => ({ ...prev, [field]: value }));

  const generateReport = async () => {
    try {
      setLoading(true);
      setHasGenerated(true);
      const term = selectedYearTerms.find(t => String(t.id) === String(filters.termId));
      const params = {
        academicYear: filters.academicYear,
        term: term ? term.termName : undefined,
        classId: filters.classId,
        studentId: filters.studentId,
        categoryId: filters.categoryId
      };
      Object.keys(params).forEach(k => { if (!params[k]) delete params[k]; });

      const response = await axios.get('/api/reports/financial', { params });
      if (response.data.success) {
        setRows(response.data.data);
        setSummary(response.data.summary);
      }
    } catch (error) {
      console.error('Error generating financial report:', error);
      showDialog('error', 'Report Failed', 'Could not generate the report. Please try again.');
      setRows([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  const { exporting, handleExcel, handleCSV, handlePDF } = useReportExport({
    rows, columns: COLUMNS, formatCell, reportType: 'financial', reportLabel: 'Financial Reports', showDialog
  });

  const summaryCards = summary
    ? [
        { label: 'Total Collected', value: `₦${summary.totalCollected.toLocaleString()}` },
        { label: 'Payments', value: summary.count }
      ]
    : [];

  if (metaLoading || !meta) {
    return <div style={{ padding: '24px' }}>Loading report filters...</div>;
  }

  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'flex-end', padding: '16px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', marginBottom: '16px' }}>
        <Filter size={18} style={{ color: '#6b7280', marginBottom: '8px' }} />

        <div>
          <label style={labelStyle}>Academic Year</label>
          <select style={selectStyle} value={filters.academicYear} onChange={(e) => handleFilterChange('academicYear', e.target.value)}>
            <option value="">All Years</option>
            {meta.academicYears.map(y => (
              <option key={y.id} value={y.yearLabel}>{y.yearLabel}{y.isCurrent ? ' (Current)' : ''}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Term</label>
          <select style={selectStyle} value={filters.termId} onChange={(e) => handleFilterChange('termId', e.target.value)} disabled={!filters.academicYear}>
            <option value="">All Terms</option>
            {selectedYearTerms.map(t => (
              <option key={t.id} value={t.id}>{t.termName}{t.isCurrent ? ' (Current)' : ''}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Class</label>
          <select style={selectStyle} value={filters.classId} onChange={(e) => handleFilterChange('classId', e.target.value)}>
            <option value="">All Classes</option>
            {meta.classes.map(c => (
              <option key={c.id} value={c.id}>{c.className}{c.section ? ` (${c.section})` : ''}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Fee Category</label>
          <select style={selectStyle} value={filters.categoryId} onChange={(e) => handleFilterChange('categoryId', e.target.value)}>
            <option value="">All Categories</option>
            {meta.feeCategories.map(c => <option key={c.id} value={c.id}>{c.categoryName}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Student ID (optional)</label>
          <input
            style={selectStyle}
            placeholder="e.g. STU26..."
            value={filters.studentId}
            onChange={(e) => handleFilterChange('studentId', e.target.value)}
          />
        </div>

        <button
          onClick={generateReport}
          disabled={loading}
          style={{
            padding: '9px 18px', fontSize: '14px', fontWeight: 500,
            border: 'none', borderRadius: '8px', background: '#2563eb', color: '#fff',
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? 'Generating...' : 'Generate Report'}
        </button>
      </div>

      <ReportSummaryCards cards={summaryCards} />

      {hasGenerated && !loading && (
        <>
          <ReportExportButtons onExcel={handleExcel} onCSV={handleCSV} onPDF={handlePDF} exporting={exporting} disabled={rows.length === 0} />
          <ReportTable rows={rows} columns={COLUMNS} formatCell={formatCell} />
        </>
      )}

      <AppDialog
        isOpen={dialog.isOpen}
        type={dialog.type}
        title={dialog.title}
        message={dialog.message}
        details={dialog.details}
        actionLabel={dialog.actionLabel}
        onAction={dialog.onAction ? handleDialogAction : null}
        onClose={closeDialog}
        showCancel={dialog.showCancel}
        actionLoading={dialog.actionLoading}
      />
    </>
  );
};

export default FinancialReports;