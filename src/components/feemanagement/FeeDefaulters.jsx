import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Search,
  Filter,
  Download,
  Send,
  DollarSign,X ,
  Clock,
  Users,
  TrendingUp,  AlertCircle,
  CheckCircle,
  Mail,
  MessageSquare
} from 'lucide-react';
import './FeeDefaulters.css';

const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast toast-${type}`}>
      {type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
      <span>{message}</span>
      <button className="toast-close" onClick={onClose}>
        <X size={16} />
      </button>
    </div>
  );
};

const Dialog = ({ isOpen, onClose, onConfirm, title, message, type = 'danger' }) => {
  if (!isOpen) return null;

  return (
    <div className="dialog-overlay">
      <div className="dialog-content">
        <div className="dialog-header">
          <AlertCircle className={`dialog-icon ${type}`} size={24} />
          <h3>{title}</h3>
        </div>
        <div className="dialog-body">
          <p>{message}</p>
        </div>
        <div className="dialog-actions">
          <button className="dialog-btn dialog-btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button 
            className={`dialog-btn dialog-btn-confirm ${type}`} 
            onClick={onConfirm}
          >
            {type === 'danger' ? 'Delete' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
};
const FeeDefaulters = () => {
  const [defaulters, setDefaulters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    academicYear: '2024/2025',
    className: '',
    status: ''
  });
  const [summary, setSummary] = useState({
    total: 0,
    totalOutstanding: 0,
    overdue: 0,
    pending: 0
  });
  const [classes, setClasses] = useState([]);
  const [selectedDefaulters, setSelectedDefaulters] = useState([]);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderType, setReminderType] = useState('sms');

    const [dialog, setDialog] = useState({
      isOpen: false,
      title: '',
      message: '',
      type: 'danger',
      onConfirm: () => {}
    });
  
    // Toast state
    const [toast, setToast] = useState({
      show: false,
      message: '',
      type: 'success'
    });
  
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const closeToast = () => {
    setToast({ ...toast, show: false });
  };

  // Dialog helper
  const showDialog = (title, message, onConfirm, type = 'danger') => {
    setDialog({
      isOpen: true,
      title,
      message,
      type,
      onConfirm
    });
  };

  const closeDialog = () => {
    setDialog({ ...dialog, isOpen: false });
  };

  // Fetch classes
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await fetch('api/classes');
        const data = await response.json();
        if (data.success) {
          setClasses(data.data);
        }
      } catch (error) {
        console.error('Error fetching classes:', error);
      }
    };
    fetchClasses();
  }, []);

  // Fetch defaulters
  useEffect(() => {
    fetchDefaulters();
  }, [filters]);

  const fetchDefaulters = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(filters);
      const response = await fetch(`api/fees/defaulters?${params}`);
      const data = await response.json();

      if (data.success) {
        setDefaulters(data.data);
        setSummary(data.summary);
      }
    } catch (error) {
      console.error('Error fetching defaulters:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
  };

  const toggleSelectDefaulter = (studentId) => {
    setSelectedDefaulters(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const selectAllDefaulters = () => {
    if (selectedDefaulters.length === defaulters.length) {
      setSelectedDefaulters([]);
    } else {
      setSelectedDefaulters(defaulters.map(d => d.studentId));
    }
  };

  const sendReminder = async (studentId) => {
    try {
      const response = await fetch(`api/fees/send-reminder/${studentId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          academicYear: filters.academicYear,
          reminderType: reminderType
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(`Reminder sent successfully to ${data.data.studentName}`);
        fetchDefaulters(); // Refresh list
      } else {
        alert(`Failed to send reminder: ${data.message}`);
      }
    } catch (error) {
      console.error('Error sending reminder:', error);
      alert('Failed to send reminder');
    }
  };

 const sendBulkReminders = async () => {
    if (selectedDefaulters.length === 0) {
      showToast('Please select at least one student', 'error');
      return;
    }

    showDialog(
      'Send Bulk Reminders',
      `Send ${reminderType.toUpperCase()} reminders to ${selectedDefaulters.length} student(s)?`,
      async () => {
        closeDialog();
        setLoading(true);
        let successCount = 0;
        let failCount = 0;

        for (const studentId of selectedDefaulters) {
          try {
            await sendReminder(studentId);
            successCount++;
          } catch (error) {
            failCount++;
          }
        }

        setLoading(false);
        setShowReminderModal(false);
        setSelectedDefaulters([]);
        
        if (failCount === 0) {
          showToast(`Successfully sent ${successCount} reminder(s)`, 'success');
        } else {
          showToast(
            `Sent ${successCount} reminder(s) successfully. ${failCount} failed.`,
            failCount > successCount ? 'error' : 'success'
          );
        }
        
        fetchDefaulters();
      },
      'warning'
    );
  };

  const exportToCSV = () => {
    const headers = [
      'Student Name',
      'Student ID',
      'Class',
      'Total Due',
      'Total Paid',
      'Balance',
      'Overdue Amount',
      'Last Payment',
      'Status'
    ];

    const rows = defaulters.map(d => [
      `${d.firstName} ${d.lastName}`,
      d.studentId,
      d.currentClass,
      d.totalDue,
      d.totalPaid,
      d.totalBalance,
      d.overdueAmount,
      d.lastPaymentDate ? new Date(d.lastPaymentDate).toLocaleDateString() : 'Never',
      d.status
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fee-defaulters-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="defaulters-container">
      <div className="defaulters-header">
        <div className="header-left">
          <AlertTriangle className="header-icon" />
          <div>
            <h1>Fee Defaulters</h1>
            <p>Track and manage students with outstanding fees</p>
          </div>
        </div>
        <div className="header-actions">
          {selectedDefaulters.length > 0 && (
            <button
              className="send-reminder-btn"
              onClick={() => setShowReminderModal(true)}
            >
              <Send size={20} /> Send Reminders ({selectedDefaulters.length})
            </button>
          )}
          <button className="export-btn" onClick={exportToCSV}>
            <Download size={20} /> Export
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-grid">
        <div className="summary-card">
          <div className="card-icon" style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}>
            <Users />
          </div>
          <div className="card-content">
            <p className="card-label">Total Defaulters</p>
            <p className="card-value">{summary.total}</p>
          </div>
        </div>
        <div className="summary-card">
          <div className="card-icon" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
            <DollarSign />
          </div>
          <div className="card-content">
            <p className="card-label">Total Outstanding</p>
            <p className="card-value">₦{summary.totalOutstanding.toLocaleString()}</p>
          </div>
        </div>
        <div className="summary-card">
          <div className="card-icon" style={{ background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)' }}>
            <Clock />
          </div>
          <div className="card-content">
            <p className="card-label">Overdue</p>
            <p className="card-value">{summary.overdue}</p>
          </div>
        </div>
        <div className="summary-card">
          <div className="card-icon" style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' }}>
            <TrendingUp />
          </div>
          <div className="card-content">
            <p className="card-label">Pending</p>
            <p className="card-value">{summary.pending}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filters-row">
          <div className="filter-group">
            <label>Academic Year</label>
            <select
              value={filters.academicYear}
              onChange={(e) => handleFilterChange('academicYear', e.target.value)}
            >
              <option value="2024/2025">2024/2025</option>
              <option value="2023/2024">2023/2024</option>
              <option value="2022/2023">2022/2023</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Class</label>
            <select
              value={filters.className}
              onChange={(e) => handleFilterChange('className', e.target.value)}
            >
              <option value="">All Classes</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.className}>
                  {cls.className}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">All Status</option>
              <option value="overdue">Overdue</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Defaulters Table */}
      <div className="defaulters-table-container">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading defaulters...</p>
          </div>
        ) : (
          <>
            {defaulters.length > 0 && (
              <div className="table-actions">
                <label className="select-all-label">
                  <input
                    type="checkbox"
                    checked={selectedDefaulters.length === defaulters.length}
                    onChange={selectAllDefaulters}
                  />
                  Select All
                </label>
                <span className="table-count">{defaulters.length} defaulter(s) found</span>
              </div>
            )}

            <table className="defaulters-table">
              <thead>
                <tr>
                  <th width="40">
                    <input
                      type="checkbox"
                      checked={selectedDefaulters.length === defaulters.length && defaulters.length > 0}
                      onChange={selectAllDefaulters}
                    />
                  </th>
                  <th>Student</th>
                  <th>Class</th>
                  <th>Total Due</th>
                  <th>Total Paid</th>
                  <th>Balance</th>
                  <th>Overdue</th>
                  <th>Last Payment</th>
                  <th>Reminders</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {defaulters.map((defaulter) => (
                  <tr key={defaulter.studentId} className={selectedDefaulters.includes(defaulter.studentId) ? 'selected' : ''}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedDefaulters.includes(defaulter.studentId)}
                        onChange={() => toggleSelectDefaulter(defaulter.studentId)}
                      />
                    </td>
                    <td>
                      <div className="student-cell">
                        <strong>{defaulter.firstName} {defaulter.lastName}</strong>
                        <span className="student-id">{defaulter.studentId}</span>
                      </div>
                    </td>
                    <td>{defaulter.currentClass}</td>
                    <td>₦{defaulter.totalDue.toLocaleString()}</td>
                    <td>₦{defaulter.totalPaid.toLocaleString()}</td>
                    <td>
                      <strong className="balance-amount">₦{defaulter.totalBalance.toLocaleString()}</strong>
                    </td>
                    <td>
                      {defaulter.overdueAmount > 0 ? (
                        <span className="overdue-amount">₦{defaulter.overdueAmount.toLocaleString()}</span>
                      ) : (
                        <span className="no-overdue">None</span>
                      )}
                    </td>
                    <td>
                      {defaulter.lastPaymentDate
                        ? new Date(defaulter.lastPaymentDate).toLocaleDateString()
                        : 'Never'}
                    </td>
                    <td>
                      <span className="reminder-count">{defaulter.remindersSent || 0}</span>
                    </td>
                    <td>
                      <span className={`status-badge ${defaulter.status}`}>
                        {defaulter.status === 'overdue' ? 'Overdue' : 'Pending'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="send-reminder-btn-small"
                        onClick={() => sendReminder(defaulter.studentId)}
                        title="Send Reminder"
                      >
                        <Send size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {defaulters.length === 0 && !loading && (
              <div className="empty-state">
                <Users size={64} className="empty-icon" />
                <h3>No Defaulters Found</h3>
                <p>All students have paid their fees or no records match your filters</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Reminder Modal */}
      {showReminderModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Send Payment Reminders</h2>
              <button
                className="close-modal-btn"
                onClick={() => setShowReminderModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <p className="reminder-info">
                Send payment reminders to <strong>{selectedDefaulters.length}</strong> selected student(s)
              </p>

              <div className="reminder-options">
                <label className="reminder-option">
                  <input
                    type="radio"
                    name="reminderType"
                    value="sms"
                    checked={reminderType === 'sms'}
                    onChange={(e) => setReminderType(e.target.value)}
                  />
                  <MessageSquare size={20} />
                  <div>
                    <strong>SMS Reminder</strong>
                    <p>Send via text message to parent's phone</p>
                  </div>
                </label>

                <label className="reminder-option">
                  <input
                    type="radio"
                    name="reminderType"
                    value="email"
                    checked={reminderType === 'email'}
                    onChange={(e) => setReminderType(e.target.value)}
                  />
                  <Mail size={20} />
                  <div>
                    <strong>Email Reminder</strong>
                    <p>Send via email to parent's email address</p>
                  </div>
                </label>

                <label className="reminder-option">
                  <input
                    type="radio"
                    name="reminderType"
                    value="both"
                    checked={reminderType === 'both'}
                    onChange={(e) => setReminderType(e.target.value)}
                  />
                  <Send size={20} />
                  <div>
                    <strong>Both SMS & Email</strong>
                    <p>Send via both channels for better reach</p>
                  </div>
                </label>
              </div>

              <div className="modal-actions">
                <button
                  className="cancel-btn"
                  onClick={() => setShowReminderModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="confirm-btn"
                  onClick={sendBulkReminders}
                  disabled={loading}
                >
                  {loading ? 'Sending...' : `Send ${selectedDefaulters.length} Reminder(s)`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


            <Dialog
        isOpen={dialog.isOpen}
        onClose={closeDialog}
        onConfirm={dialog.onConfirm}
        title={dialog.title}
        message={dialog.message}
        type={dialog.type}
      />

       {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={closeToast}
        />
      )}
    </div>
  );
};

export default FeeDefaulters;