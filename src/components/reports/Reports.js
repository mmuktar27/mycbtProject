import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import {
  Users, DollarSign, GraduationCap, Briefcase, Download,
  FileText, Sheet, File, Filter, Loader
} from 'lucide-react';
import AppDialog from '../shared/AppDialog';
import { useAppDialog } from '../../hooks/useAppDialog';

const REPORT_TABS = [
  { key: 'students', label: 'Student Reports', icon: Users },
  { key: 'financial', label: 'Financial Reports', icon: DollarSign },
  { key: 'academic', label: 'Academic Reports', icon: GraduationCap },
  { key: 'staff', label: 'Staff Reports', icon: Briefcase }
];

// Column definitions per report type — shared by table preview, Excel, CSV, and PDF export
const REPORT_COLUMNS = {
  students: [
    { key: 'admissionNumber', label: 'Admission No' },
    { key: 'studentId', label: 'Student ID' },
    { key: 'firstName', label: 'First Name' },
    { key: 'lastName', label: 'Last Name' },
    { key: 'gender', label: 'Gender' },
    { key: 'currentClass', label: 'Class' },
    { key: 'admissionType', label: 'Admission Type' },
    { key: 'entryTermName', label: 'Entry Term' },
    { key: 'guardianPhone', label: 'Guardian Phone' },
    { key: 'status', label: 'Status' }
  ],
  financial: [
    { key: 'receiptNumber', label: 'Receipt No' },
    { key: 'studentName', label: 'Student' },
    { key: 'className', label: 'Class' },
    { key: 'categoryName', label: 'Category' },
    { key: 'amountPaid', label: 'Amount Paid' },
    { key: 'paymentMethod', label: 'Method' },
    { key: 'paymentDate', label: 'Date' },
    { key: 'receivedBy', label: 'Received By' }
  ],
  academic: [
    { key: 'studentName', label: 'Student' },
    { key: 'className', label: 'Class' },
    { key: 'subjectName', label: 'Subject' },
    { key: 'totalScore', label: 'Score' },
    { key: 'grade', label: 'Grade' },
    { key: 'remark', label: 'Remark' },
    { key: 'position', label: 'Position' }
  ],
  staff: [
    { key: 'staffId', label: 'Staff ID' },
    { key: 'firstName', label: 'First Name' },
    { key: 'lastName', label: 'Last Name' },
    { key: 'role', label: 'Role' },
    { key: 'department', label: 'Department' },
    { key: 'employmentType', label: 'Employment Type' },
    { key: 'phone', label: 'Phone' },
    { key: 'status', label: 'Status' }
  ]
};

const Reports = () => {
  const { reportType = 'students' } = useParams();
  const navigate = useNavigate();
  const { dialog, showDialog, closeDialog, handleDialogAction } = useAppDialog();

  const [meta, setMeta] = useState(null);
  const [metaLoading, setMetaLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  const [filters, setFilters] = useState({
    academicYear: '',
    termId: '',
    classId: '',
    subjectId: '',
    studentId: '',
    categoryId: '',
    role: '',
    department: '',
    status: 'active',
    admissionType: '',
    gender: '',
    employmentType: '',
    search: ''
  });

  useEffect(() => {
    fetchMeta();
  }, []);

  // Reset results (not filters) when switching tabs, so stale data from another
  // report type never shows under the new tab's columns
  useEffect(() => {
    setRows([]);
    setSummary(null);
    setHasGenerated(false);
  }, [reportType]);

  const fetchMeta = async () => {
    try {
      setMetaLoading(true);
      const response = await axios.get('/api/reports/filters/meta');
      if (response.data.success) {
        setMeta(response.data.data);
        const current = response.data.data.academicYears.find(y => y.isCurrent);
        if (current) {
          setFilters(prev => ({ ...prev, academicYear: current.yearLabel }));
        }
      }
    } catch (error) {
      console.error('Error fetching report filter metadata:', error);
    } finally {
      setMetaLoading(false);
    }
  };

  const selectedYearTerms = useMemo(() => {
    if (!meta || !filters.academicYear) return [];
    const year = meta.academicYears.find(y => y.yearLabel === filters.academicYear);
    return year ? year.terms : [];
  }, [meta, filters.academicYear]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const buildQueryParams = () => {
    const params = {};
    switch (reportType) {
      case 'students':
        Object.assign(params, {
          academicYear: filters.academicYear,
          termId: filters.termId,
          classId: filters.classId,
          status: filters.status,
          admissionType: filters.admissionType,
          gender: filters.gender,
          search: filters.search
        });
        break;
      case 'financial': {
        const term = selectedYearTerms.find(t => String(t.id) === String(filters.termId));
        Object.assign(params, {
          academicYear: filters.academicYear,
          term: term ? term.termName : undefined,
          classId: filters.classId,
          studentId: filters.studentId,
          categoryId: filters.categoryId
        });
        break;
      }
      case 'academic': {
        const term2 = selectedYearTerms.find(t => String(t.id) === String(filters.termId));
        Object.assign(params, {
          academicYear: filters.academicYear,
          term: term2 ? term2.termName : undefined,
          classId: filters.classId,
          subjectId: filters.subjectId,
          studentId: filters.studentId
        });
        break;
      }
      case 'staff':
        Object.assign(params, {
          role: filters.role,
          department: filters.department,
          status: filters.status,
          employmentType: filters.employmentType
        });
        break;
      default:
        break;
    }
    // Strip empty values so the backend's optional-filter checks work cleanly
    Object.keys(params).forEach(k => { if (!params[k]) delete params[k]; });
    return params;
  };

  const generateReport = async () => {
    try {
      setLoading(true);
      setHasGenerated(true);
      const response = await axios.get(`/api/reports/${reportType}`, { params: buildQueryParams() });
      if (response.data.success) {
        setRows(response.data.data);
        setSummary(response.data.summary);
      }
    } catch (error) {
      console.error('Error generating report:', error);
      showDialog('error', 'Report Failed', 'Could not generate the report. Please try again.');
      setRows([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  const columns = REPORT_COLUMNS[reportType];

  const formatCell = (row, col) => {
    const value = row[col.key];
    if (col.key === 'paymentDate' && value) return new Date(value).toLocaleDateString();
    if (col.key === 'amountPaid' && value != null) return `₦${Number(value).toLocaleString()}`;
    return value ?? 'N/A';
  };

  // ==================== EXPORTS ====================

  const exportToExcel = () => {
    if (rows.length === 0) return;
    setExporting(true);
    try {
      const excelData = rows.map((row, i) => {
        const obj = { '#': i + 1 };
        columns.forEach(col => { obj[col.label] = formatCell(row, col); });
        return obj;
      });
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, reportType);
      XLSX.writeFile(workbook, `${reportType}_report_${new Date().toISOString().split('T')[0]}.xlsx`);
      showDialog('success', 'Export Complete', `Exported ${rows.length} record(s) to Excel.`);
    } catch (error) {
      showDialog('error', 'Export Failed', 'Failed to export to Excel.');
    } finally {
      setExporting(false);
    }
  };

  const exportToCSV = () => {
    if (rows.length === 0) return;
    setExporting(true);
    try {
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
      showDialog('success', 'Export Complete', `Exported ${rows.length} record(s) to CSV.`);
    } catch (error) {
      showDialog('error', 'Export Failed', 'Failed to export to CSV.');
    } finally {
      setExporting(false);
    }
  };

  // Generic tabular PDF renderer — no extra plugin dependency required
  const exportToPDF = () => {
    if (rows.length === 0) return;
    setExporting(true);
    try {
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
        doc.text(`${REPORT_TABS.find(t => t.key === reportType)?.label || 'Report'}`, margin, y);
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
      showDialog('success', 'Export Complete', `Exported ${rows.length} record(s) to PDF.`);
    } catch (error) {
      console.error(error);
      showDialog('error', 'Export Failed', 'Failed to export to PDF.');
    } finally {
      setExporting(false);
    }
  };

  // ==================== FILTER UI PER TAB ====================

  const renderFilters = () => {
    if (!meta) return null;
    const selectStyle = {
      padding: '8px 10px', fontSize: '14px', border: '1px solid #e5e7eb',
      borderRadius: '8px', color: '#111827', background: '#fff', minWidth: '160px'
    };
    const labelStyle = { display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' };

    const yearTermFilters = (
      <>
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
      </>
    );

    const classFilter = (
      <div>
        <label style={labelStyle}>Class</label>
        <select style={selectStyle} value={filters.classId} onChange={(e) => handleFilterChange('classId', e.target.value)}>
          <option value="">All Classes</option>
          {meta.classes.map(c => (
            <option key={c.id} value={c.id}>{c.className}{c.section ? ` (${c.section})` : ''}</option>
          ))}
        </select>
      </div>
    );

    if (reportType === 'students') {
      return (
        <>
          {yearTermFilters}
          {classFilter}
          <div>
            <label style={labelStyle}>Admission Type</label>
            <select style={selectStyle} value={filters.admissionType} onChange={(e) => handleFilterChange('admissionType', e.target.value)}>
              <option value="">All Types</option>
              <option value="New">New</option>
              <option value="Transfer">Transfer</option>
              <option value="Bulk Import">Bulk Import</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Gender</label>
            <select style={selectStyle} value={filters.gender} onChange={(e) => handleFilterChange('gender', e.target.value)}>
              <option value="">All</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Status</label>
            <select style={selectStyle} value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="">All Status</option>
            </select>
          </div>
          <div style={{ flex: '1 1 200px' }}>
            <label style={labelStyle}>Search</label>
            <input
              style={{ ...selectStyle, width: '100%' }}
              placeholder="Name, ID, admission no..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>
        </>
      );
    }

    if (reportType === 'financial') {
      return (
        <>
          {yearTermFilters}
          {classFilter}
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
        </>
      );
    }

    if (reportType === 'academic') {
      return (
        <>
          {yearTermFilters}
          {classFilter}
          <div>
            <label style={labelStyle}>Subject</label>
            <select style={selectStyle} value={filters.subjectId} onChange={(e) => handleFilterChange('subjectId', e.target.value)}>
              <option value="">All Subjects</option>
              {meta.subjects.map(s => <option key={s.id} value={s.id}>{s.subjectName}</option>)}
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
        </>
      );
    }

    if (reportType === 'staff') {
      return (
        <>
          <div>
            <label style={labelStyle}>Role</label>
            <select style={selectStyle} value={filters.role} onChange={(e) => handleFilterChange('role', e.target.value)}>
              <option value="">All Roles</option>
              {meta.roles.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Department</label>
            <select style={selectStyle} value={filters.department} onChange={(e) => handleFilterChange('department', e.target.value)}>
              <option value="">All Departments</option>
              {meta.departments.map(d => <option key={d.id} value={d.departmentName}>{d.departmentName}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Employment Type</label>
            <select style={selectStyle} value={filters.employmentType} onChange={(e) => handleFilterChange('employmentType', e.target.value)}>
              <option value="">All Types</option>
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Contract">Contract</option>
              <option value="Temporary">Temporary</option>
              <option value="Intern">Intern</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Status</label>
            <select style={selectStyle} value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="">All Status</option>
            </select>
          </div>
        </>
      );
    }

    return null;
  };

  const renderSummary = () => {
    if (!summary) return null;
    const cardStyle = { background: '#f8fafc', borderRadius: '10px', padding: '14px 18px', minWidth: '140px', borderTop: '3px solid #2563eb' };
    const cards = [];

    if (reportType === 'students') {
      cards.push({ label: 'Total Students', value: summary.total });
      Object.entries(summary.byClass || {}).slice(0, 4).forEach(([k, v]) => cards.push({ label: k, value: v }));
    } else if (reportType === 'financial') {
      cards.push({ label: 'Total Collected', value: `₦${summary.totalCollected.toLocaleString()}` });
      cards.push({ label: 'Payments', value: summary.count });
    } else if (reportType === 'academic') {
      cards.push({ label: 'Average Score', value: summary.averageScore });
      cards.push({ label: 'Pass', value: summary.passCount });
      cards.push({ label: 'Fail', value: summary.failCount });
    } else if (reportType === 'staff') {
      cards.push({ label: 'Total Staff', value: summary.total });
      Object.entries(summary.byRole || {}).slice(0, 4).forEach(([k, v]) => cards.push({ label: k, value: v }));
    }

    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', margin: '16px 0' }}>
        {cards.map((c, i) => (
          <div key={i} style={cardStyle}>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#111827' }}>{c.value}</div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>{c.label}</div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700 }}>Reports</h1>
        <p style={{ margin: '4px 0 0', color: '#6b7280' }}>Generate and export reports across students, fees, academics, and staff</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e5e7eb', marginBottom: '20px' }}>
        {REPORT_TABS.map(tab => {
          const Icon = tab.icon;
          const active = reportType === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => navigate(`/reports/${tab.key}`)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '10px 16px', fontSize: '14px', fontWeight: 500,
                border: 'none', background: 'none', cursor: 'pointer',
                color: active ? '#2563eb' : '#6b7280',
                borderBottom: active ? '2px solid #2563eb' : '2px solid transparent'
              }}
            >
              <Icon size={16} /> {tab.label}
            </button>
          );
        })}
      </div>

      {metaLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <Loader size={24} style={{ animation: 'spin 1s linear infinite' }} />
          <p>Loading filters...</p>
        </div>
      ) : (
        <>
          {/* Filter bar */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'flex-end', padding: '16px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', marginBottom: '16px' }}>
            <Filter size={18} style={{ color: '#6b7280', marginBottom: '8px' }} />
            {renderFilters()}
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

          {renderSummary()}

          {hasGenerated && !loading && (
            <>
              {/* Export buttons */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                <button onClick={exportToExcel} disabled={exporting || rows.length === 0} style={exportBtnStyle}>
                  <Sheet size={16} /> Excel
                </button>
                <button onClick={exportToCSV} disabled={exporting || rows.length === 0} style={exportBtnStyle}>
                  <File size={16} /> CSV
                </button>
                <button onClick={exportToPDF} disabled={exporting || rows.length === 0} style={exportBtnStyle}>
                  <FileText size={16} /> PDF
                </button>
                {exporting && <Loader size={18} style={{ animation: 'spin 1s linear infinite', alignSelf: 'center' }} />}
              </div>

              {/* Table preview */}
              {rows.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                  No records match the selected filters.
                </div>
              ) : (
                <div style={{ overflowX: 'auto', border: '1px solid #e5e7eb', borderRadius: '10px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: '#f9fafb' }}>
                        {columns.map(col => (
                          <th key={col.key} style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid #e5e7eb', fontWeight: 600 }}>
                            {col.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.slice(0, 100).map((row, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          {columns.map(col => (
                            <td key={col.key} style={{ padding: '10px 12px' }}>{formatCell(row, col)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {rows.length > 100 && (
                    <p style={{ textAlign: 'center', padding: '10px', color: '#6b7280', fontSize: '12px' }}>
                      Showing first 100 of {rows.length} records — export to see all.
                    </p>
                  )}
                </div>
              )}
            </>
          )}
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
    </div>
  );
};

const exportBtnStyle = {
  display: 'inline-flex', alignItems: 'center', gap: '6px',
  padding: '8px 14px', fontSize: '13px', fontWeight: 500,
  border: '1px solid #e5e7eb', borderRadius: '8px', background: '#fff',
  color: '#374151', cursor: 'pointer'
};

export default Reports;