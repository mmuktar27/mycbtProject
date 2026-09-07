import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Filter,
  Download,
  Calendar,
  DollarSign,
  Receipt,
  FileText,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import './PaymentHistory.css';
import { useNavigate } from 'react-router-dom';
const PaymentHistory = () => {
    const navigate = useNavigate()
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  const [filters, setFilters] = useState({
    search: '',
    academicYear: '',
    className: '',
    startDate: '',
    endDate: ''
  });

  const [classes, setClasses] = useState([]);
  const [schoolSettings, setSchoolSettings] = useState(null);
  const [academicYears, setAcademicYears] = useState([]);
  const [statistics, setStatistics] = useState({
    totalCollected: 0,
    transactionCount: 0,
    averagePayment: 0
  });

  // Generate academic years based on current year
  const generateAcademicYears = (currentAcademicYear) => {
    if (!currentAcademicYear) {
      const currentYear = new Date().getFullYear();
      currentAcademicYear = `${currentYear}/${currentYear + 1}`;
    }

    const startYear = parseInt(currentAcademicYear.split('/')[0]);
    const years = [];
    
    // Generate 10 years before current year
    for (let i = 10; i > 0; i--) {
      const year = startYear - i;
      years.push(`${year}/${year + 1}`);
    }
    
    years.push(currentAcademicYear);
    
    // Add 5 years after current year
    for (let i = 1; i <= 5; i++) {
      const year = startYear + i;
      years.push(`${year}/${year + 1}`);
    }
    
    return years;
  };

  // Fetch school settings
  const fetchSchoolSettings = async () => {
    try {
      const response = await fetch('/api/school-settings');
      const data = await response.json();
      if (data.success) {
        setSchoolSettings(data.data);
        const years = generateAcademicYears(data.data.academicYear);
        setAcademicYears(years);
        
        // Set the current academic year as default filter
        setFilters(prev => ({
          ...prev,
          academicYear: data.data.academicYear
        }));
      }
    } catch (error) {
      console.error('Error fetching school settings:', error);
      const currentYear = new Date().getFullYear();
      const fallbackYear = `${currentYear}/${currentYear + 1}`;
      const years = generateAcademicYears(fallbackYear);
      setAcademicYears(years);
      setFilters(prev => ({ ...prev, academicYear: fallbackYear }));
    }
  };

  // Fetch classes
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await fetch('/api/classes');
        const data = await response.json();
        if (data.success) {
          setClasses(data.data);
        }
      } catch (error) {
        console.error('Error fetching classes:', error);
      }
    };
    
    fetchSchoolSettings();
    fetchClasses();
  }, []);

  // Fetch payments
  useEffect(() => {
    if (filters.academicYear) {
      fetchPayments();
    }
  }, [pagination.page, filters]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      });

      const response = await fetch(`/api/fees/payments?${params}`);

      console.log('Fetching payments with params:', response);
      const data = await response.json();

      if (data.success) {
        setPayments(data.data);
        setPagination({
          ...pagination,
          total: data.pagination.total,
          pages: data.pagination.pages
        });

        // Calculate statistics
        const total = data.data.reduce((sum, p) => sum + p.amountPaid, 0);
        const count = data.data.length;
        setStatistics({
          totalCollected: total,
          transactionCount: count,
          averagePayment: count > 0 ? total / count : 0
        });
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setFilters({ ...filters, search: value });
    setPagination({ ...pagination, page: 1 });
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
    setPagination({ ...pagination, page: 1 });
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setPagination({ ...pagination, page: newPage });
    }
  };

  const exportToCSV = () => {
    // CSV headers
    const headers = [
      'Receipt No',
      'Date',
      'Student Name',
      'Student ID',
      'Class',
      'Fee Category',
      'Amount Paid',
      'Payment Method',
      'Received By'
    ];

    // CSV rows
    const rows = payments.map(payment => [
      payment.receiptNumber,
      new Date(payment.paymentDate).toLocaleDateString(),
      payment.studentName,
      payment.studentId,
      payment.className,
      payment.categoryName,
      payment.amountPaid,
      payment.paymentMethod,
      payment.receivedBy
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payment-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      academicYear: schoolSettings?.academicYear || '',
      className: '',
      startDate: '',
      endDate: ''
    });
    setPagination({ ...pagination, page: 1 });
  };

  return (
    <div className="payment-history-container">
      <div className="payment-history-header">
        <div className="header-left">
          <History className="header-icon" />
          <div>
            <h1>Payment History</h1>
            <p>View and manage all fee payment records</p>
          </div>
        </div>
        <button className="export-btn" onClick={exportToCSV}>
          <Download size={20} /> Export CSV
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
            <DollarSign />
          </div>
          <div className="stat-content">
            <p className="stat-label">Total Collected</p>
            <p className="stat-value">₦{statistics.totalCollected.toLocaleString()}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}>
            <Receipt />
          </div>
          <div className="stat-content">
            <p className="stat-label">Transactions</p>
            <p className="stat-value">{statistics.transactionCount}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
            <FileText />
          </div>
          <div className="stat-content">
            <p className="stat-label">Average Payment</p>
            <p className="stat-value">₦{statistics.averagePayment.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          </div>
        </div>
      </div>

      {/* Filters Section */}
<div className="filters-section" style={{ display: 'block', textAlign: 'left' }}>
  <div className="search-box">
    <Search className="search-icon" />
    <input
      type="text"
      placeholder="Search by student name, ID, or receipt number..."
      value={filters.search}
      onChange={(e) => handleSearch(e.target.value)}
      className="search-input"
    />
  </div>

  <div
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
      gap: '1rem',
      alignItems: 'end',
      width: '100%',
      marginTop: '1rem'
    }}
  >
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      <label style={{
        fontSize: '0.75rem',
        fontWeight: 600,
        color: '#6b7280',
        marginBottom: '0.5rem',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        Academic Year
      </label>
      <select
        value={filters.academicYear}
        onChange={(e) => handleFilterChange('academicYear', e.target.value)}
        style={{
          width: '100%',
          padding: '0.625rem',
          fontSize: '0.875rem',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          backgroundColor: 'white',
          boxSizing: 'border-box'
        }}
      >
        <option value="">All Years</option>
        {academicYears.length === 0 ? (
          <option value="">Loading...</option>
        ) : (
          academicYears.map((year) => (
            <option key={year} value={year}>
              {year}
              {schoolSettings && year === schoolSettings.academicYear && ' (Current)'}
            </option>
          ))
        )}
      </select>
    </div>

    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      <label style={{
        fontSize: '0.75rem',
        fontWeight: 600,
        color: '#6b7280',
        marginBottom: '0.5rem',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        Class
      </label>
      <select
        value={filters.className}
        onChange={(e) => handleFilterChange('className', e.target.value)}
        style={{
          width: '100%',
          padding: '0.625rem',
          fontSize: '0.875rem',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          backgroundColor: 'white',
          boxSizing: 'border-box'
        }}
      >
        <option value="">All Classes</option>
        {classes.map((cls) => (
          <option key={cls.id} value={cls.className}>
            {cls.className}
          </option>
        ))}
      </select>
    </div>

    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      <label style={{
        fontSize: '0.75rem',
        fontWeight: 600,
        color: '#6b7280',
        marginBottom: '0.5rem',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        Start Date
      </label>
      <input
        type="date"
        value={filters.startDate}
        onChange={(e) => handleFilterChange('startDate', e.target.value)}
        style={{
          width: '100%',
          padding: '0.625rem',
          fontSize: '0.875rem',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          backgroundColor: 'white',
          boxSizing: 'border-box'
        }}
      />
    </div>

    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      <label style={{
        fontSize: '0.75rem',
        fontWeight: 600,
        color: '#6b7280',
        marginBottom: '0.5rem',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        End Date
      </label>
      <input
        type="date"
        value={filters.endDate}
        onChange={(e) => handleFilterChange('endDate', e.target.value)}
        style={{
          width: '100%',
          padding: '0.625rem',
          fontSize: '0.875rem',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          backgroundColor: 'white',
          boxSizing: 'border-box'
        }}
      />
    </div>

    <button
      onClick={clearFilters}
      style={{
        padding: '0.625rem 1rem',
        background: '#f3f4f6',
        color: '#374151',
        border: 'none',
        borderRadius: '6px',
        fontSize: '0.875rem',
        fontWeight: 500,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        height: 'fit-content'
      }}
    >
      Clear Filters
    </button>
  </div>
</div>

      {/* Payments Table */}
      <div className="payments-table-container">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading payments...</p>
          </div>
        ) : (
          <>
            <table className="payments-table">
              <thead>
                <tr>
                  <th>Receipt No.</th>
                  <th>Date</th>
                  <th>Student</th>
                  <th>Class</th>
                  <th>Fee Category</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Received By</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.paymentId}>
                    <td>
                      <span className="receipt-number">{payment.receiptNumber}</span>
                    </td>
                    <td>{new Date(payment.paymentDate).toLocaleDateString()}</td>
                    <td>
                      <div className="student-cell">
                        <strong>{payment.studentName}</strong>
                        <span className="student-id">{payment.studentId}</span>
                      </div>
                    </td>
                    <td>{payment.className}</td>
                    <td>{payment.categoryName}</td>
                    <td>
                      <strong className="amount">₦{payment.amountPaid.toLocaleString()}</strong>
                    </td>
                    <td>
                      <span className={`payment-method ${payment.paymentMethod.toLowerCase().replace(' ', '-')}`}>
                        {payment.paymentMethod}
                      </span>
                    </td>
                    <td>{payment.receivedBy}</td>
                    <td>
                     <button
  className="view-receipt-btn"
  onClick={() => window.open(`/fees/receipts/print/${encodeURIComponent(payment.receiptNumber)}`, '_blank')}
>
  <Receipt size={16} /> Receipt
</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {payments.length === 0 && !loading && (
              <div className="empty-state">
                <FileText size={64} className="empty-icon" />
                <h3>No Payments Found</h3>
                <p>No payment records match your search criteria</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="pagination">
          <button
            className="pagination-btn"
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
          >
            <ChevronLeft size={20} />
          </button>

          <div className="pagination-info">
            Page {pagination.page} of {pagination.pages}
            <span className="pagination-total">({pagination.total} total records)</span>
          </div>

          <button
            className="pagination-btn"
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.pages}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
};

export default PaymentHistory;