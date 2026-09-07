import React from 'react';
import { Sheet, File, FileText, Loader } from 'lucide-react';
import { exportBtnStyle } from './ui';

const ReportExportButtons = ({ onExcel, onCSV, onPDF, exporting, disabled }) => (
  <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
    <button onClick={onExcel} disabled={exporting || disabled} style={exportBtnStyle}>
      <Sheet size={16} /> Excel
    </button>
    <button onClick={onCSV} disabled={exporting || disabled} style={exportBtnStyle}>
      <File size={16} /> CSV
    </button>
    <button onClick={onPDF} disabled={exporting || disabled} style={exportBtnStyle}>
      <FileText size={16} /> PDF
    </button>
    {exporting && <Loader size={18} style={{ animation: 'spin 1s linear infinite', alignSelf: 'center' }} />}
  </div>
);

export default ReportExportButtons;