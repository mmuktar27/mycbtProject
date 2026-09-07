import React, { useState } from 'react';
import axios from 'axios';
import { Filter, Columns } from 'lucide-react';
import { selectStyle, labelStyle } from '../shared/ui';
import { formatCell } from '../shared/formatCell';
import ReportTable, { ReportSummaryCards } from '../shared/ReportTable';
import ReportExportButtons from '../shared/ReportExportButtons';
import { useReportExport } from '../shared/useReportExport';
import { useReportMeta } from '../shared/useReportMeta';
import { useAppDialog } from '../../hooks/useAppDialog';
import AppDialog from '../shared/AppDialog';

// Columns shown in the on-screen table — kept small so it stays readable
const COLUMNS = [
  { key: 'staffId', label: 'Staff ID' },
  { key: 'firstName', label: 'First Name' },
  { key: 'lastName', label: 'Last Name' },
  { key: 'role', label: 'Role' },
  { key: 'department', label: 'Department' },
  { key: 'employmentType', label: 'Employment Type' },
  { key: 'phone', label: 'Phone' },
  { key: 'status', label: 'Status' }
];

// Every field available for export — superset of COLUMNS.
// ⚠️ Adjust these keys to match your real `staff` table columns exactly.
const ALL_STAFF_FIELDS = [
  { key: 'staffId', label: 'Staff ID' },
  { key: 'firstName', label: 'First Name' },
  { key: 'lastName', label: 'Last Name' },
  { key: 'middleName', label: 'Middle Name' },
  { key: 'gender', label: 'Gender' },
  { key: 'role', label: 'Role' },
  { key: 'department', label: 'Department' },
  { key: 'employmentType', label: 'Employment Type' },
  { key: 'status', label: 'Status' },
  { key: 'psn', label: 'PSN' },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' },
  { key: 'dateOfBirth', label: 'Date of Birth' },
  { key: 'employmentDate', label: 'Employment Date' },
  { key: 'qualification', label: 'Qualification' },
  { key: 'yearsOfExperience', label: 'Years of Experience' },
  { key: 'specialization', label: 'Specialization' },
  { key: 'address', label: 'Address' },
  { key: 'stateOfOrigin', label: 'State of Origin' },
  { key: 'lga', label: 'LGA' }
];

const DEFAULT_EXPORT_KEYS = COLUMNS.map(c => c.key);

const StaffReports = () => {
  const { meta, loading: metaLoading } = useReportMeta();
  const { dialog, showDialog, closeDialog, handleDialogAction } = useAppDialog();

  const [filters, setFilters] = useState({
    role: '',
    department: '',
    employmentType: '',
    status: 'active'
  });

  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [exportKeys, setExportKeys] = useState(DEFAULT_EXPORT_KEYS);

  const handleFilterChange = (field, value) => setFilters(prev => ({ ...prev, [field]: value }));

  const toggleExportColumn = (key) => {
    setExportKeys(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const selectAllColumns = () => setExportKeys(ALL_STAFF_FIELDS.map(f => f.key));
  const selectNoColumns = () => setExportKeys([]);

  const generateReport = async () => {
    try {
      setLoading(true);
      setHasGenerated(true);
      const params = {
        role: filters.role,
        department: filters.department,
        status: filters.status,
        employmentType: filters.employmentType
      };
      Object.keys(params).forEach(k => { if (!params[k]) delete params[k]; });

      const response = await axios.get('/api/reports/staff', { params });
      if (response.data.success) {
        setRows(response.data.data);
        setSummary(response.data.summary);
      }
    } catch (error) {
      console.error('Error generating staff report:', error);
      showDialog('error', 'Report Failed', 'Could not generate the report. Please try again.');
      setRows([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  // Export uses whatever the user checked, falling back to the table columns
  const exportColumns = ALL_STAFF_FIELDS.filter(f => exportKeys.includes(f.key));

  const { exporting, handleExcel, handleCSV, handlePDF } = useReportExport({
    rows,
    columns: exportColumns.length ? exportColumns : COLUMNS,
    formatCell,
    reportType: 'staff',
    reportLabel: 'Staff Reports',
    showDialog
  });

  const summaryCards = summary
    ? [
        { label: 'Total Staff', value: summary.total },
        ...Object.entries(summary.byRole || {}).slice(0, 4).map(([k, v]) => ({ label: k, value: v }))
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
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowColumnPicker(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 14px', fontSize: '13px', fontWeight: 500,
                border: '1px solid #d1d5db', borderRadius: '8px', background: '#fff',
                cursor: 'pointer'
              }}
            >
              <Columns size={16} /> Export Columns ({exportKeys.length})
            </button>
            <ReportExportButtons
              onExcel={handleExcel}
              onCSV={handleCSV}
              onPDF={handlePDF}
              exporting={exporting}
              disabled={rows.length === 0 || exportKeys.length === 0}
            />
          </div>

          {showColumnPicker && (
            <div style={{ padding: '14px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '10px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <strong style={{ fontSize: '13px' }}>Choose fields to include in the export</strong>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={selectAllColumns} style={{ fontSize: '12px', color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer' }}>Select all</button>
                  <button onClick={selectNoColumns} style={{ fontSize: '12px', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}>Clear</button>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px' }}>
                {ALL_STAFF_FIELDS.map(f => (
                  <label key={f.key} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={exportKeys.includes(f.key)}
                      onChange={() => toggleExportColumn(f.key)}
                    />
                    {f.label}
                  </label>
                ))}
              </div>
            </div>
          )}

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

export default StaffReports;