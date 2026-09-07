// Shared inline style constants used by every report tab.
// Keeping these in one place means a visual tweak (e.g. border radius)
// only has to happen once instead of in four near-identical files.

export const selectStyle = {
  padding: '8px 10px', fontSize: '14px', border: '1px solid #e5e7eb',
  borderRadius: '8px', color: '#111827', background: '#fff', minWidth: '160px'
};

export const labelStyle = {
  display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px'
};

export const exportBtnStyle = {
  display: 'inline-flex', alignItems: 'center', gap: '6px',
  padding: '8px 14px', fontSize: '13px', fontWeight: 500,
  border: '1px solid #e5e7eb', borderRadius: '8px', background: '#fff',
  color: '#374151', cursor: 'pointer'
};

export const cardStyle = {
  background: '#f8fafc', borderRadius: '10px', padding: '14px 18px',
  minWidth: '140px', borderTop: '3px solid #2563eb'
};