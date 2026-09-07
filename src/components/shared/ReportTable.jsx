import React from 'react';
import { cardStyle } from './ui';

export const ReportSummaryCards = ({ cards }) => {
  if (!cards || cards.length === 0) return null;
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

const ReportTable = ({ rows, columns, formatCell }) => {
  if (rows.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
        No records match the selected filters.
      </div>
    );
  }

  return (
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
  );
};

export default ReportTable;