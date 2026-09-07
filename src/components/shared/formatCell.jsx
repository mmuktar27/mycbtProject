// Shared across all report tabs. The paymentDate/amountPaid special cases
// only ever match financial-report columns; for every other report this is
// just `value ?? 'N/A'`, so one function safely covers all four tabs.
export const formatCell = (row, col) => {
  const value = row[col.key];
  if (col.key === 'paymentDate' && value) return new Date(value).toLocaleDateString();
  if (col.key === 'amountPaid' && value != null) return `₦${Number(value).toLocaleString()}`;
  return value ?? 'N/A';
};