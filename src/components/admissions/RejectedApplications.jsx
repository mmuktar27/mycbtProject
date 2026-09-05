import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Search, Filter, Eye, XCircle, RotateCcw,
  FileText, Calendar, Phone, Mail,
  ChevronLeft, ChevronRight, RefreshCw, X,
  AlertTriangle, Info, Loader, AlertCircle, CheckCircle
} from 'lucide-react';
import './AdmissionsList.css';

// Reuses AdmissionsList.css — same design system, no new stylesheet needed.

const RejectedApplications = () => {
  const navigate = useNavigate();
  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const [classes, setClasses] = useState([]);

  const [showReconsiderModal, setShowReconsiderModal] = useState(false);
  const [selectedAdmission, setSelectedAdmission] = useState(null);
  const [reconsiderNote, setReconsiderNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [dialog, setDialog] = useState({
    isOpen: false, type: 'success', title: '', message: '', details: '',
    actionLabel: 'Close', onAction: null, showCancel: false, actionLoading: false
  });

  useEffect(() => {
    fetchAdmissions();
    fetchClasses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, searchTerm, filterClass]);

  const fetchAdmissions = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admissions', {
        params: {
          page: pagination.page,
          limit: pagination.limit,
          search: searchTerm,
          status: 'rejected',
          appliedClass: filterClass
        }
      });
      if (response.data.success) {
        setAdmissions(response.data.data);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching admissions:', error);
      showDialog('error', 'Failed to Load Applications', 'Could not fetch rejected applications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await axios.get('/api/classes');
      if (response.data.success) setClasses(response.data.data);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const showDialog = (type, title, message, details = '', actionLabel = 'Close', onAction = null, showCancel = false) => {
    setDialog({ isOpen: true, type, title, message, details, actionLabel, onAction, showCancel, actionLoading: false });
  };
  const closeDialog = () => setDialog(prev => ({ ...prev, isOpen: false }));
  const handleDialogAction = async () => {
    if (dialog.onAction) {
      setDialog(prev => ({ ...prev, actionLoading: true }));
      await dialog.onAction();
      setDialog(prev => ({ ...prev, actionLoading: false }));
    } else {
      closeDialog();
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleClassFilter = (e) => {
    setFilterClass(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => setPagination(prev => ({ ...prev, page: newPage }));

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const openReconsider = (admission) => {
    setSelectedAdmission(admission);
    setReconsiderNote('');
    setShowReconsiderModal(true);
  };

  const handleReconsiderSubmit = async () => {
    try {
      setIsSubmitting(true);
      const response = await axios.put(
        `/api/admissions/${selectedAdmission.applicationId}/status`,
        {
          status: 'under_review',
          reviewedBy: selectedAdmission.reviewedBy || 'Admin',
          interviewNotes: reconsiderNote
            ? `${selectedAdmission.interviewNotes || ''}\n[Reconsidered] ${reconsiderNote}`.trim()
            : selectedAdmission.interviewNotes,
          interviewScheduled: selectedAdmission.interviewScheduled,
          entranceTestScore: selectedAdmission.entranceTestScore
        }
      );

      if (response.data.success) {
        setShowReconsiderModal(false);
        fetchAdmissions();
        showDialog(
          'success',
          'Application Reopened',
          'The application has been moved back to Under Review.',
          `Application ID: ${selectedAdmission.applicationId}`
        );
      }
    } catch (error) {
      console.error('Error reconsidering admission:', error);
      showDialog('error', 'Update Failed', 'Failed to reopen this application.', error.response?.data?.message || 'Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admissions-list-container">
      <div className="page-header">
        <div className="header-left">
          <h1><XCircle size={28} /> Rejected Applications</h1>
          <p className="subtitle">Applications that were declined</p>
        </div>
        <div className="header-actions">
          <button onClick={fetchAdmissions} className="btn btn-secondary">
            <RefreshCw size={18} /> Refresh
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card rejected">
          <XCircle size={24} />
          <div className="stat-info">
            <h3>{pagination.total}</h3>
            <p>Total Rejected</p>
          </div>
        </div>
      </div>

   <div style={{
  background: 'white',
  padding: '1.5rem',
  borderRadius: '12px',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
  marginBottom: '1.5rem'
}}>
  <div style={{ position: 'relative', marginBottom: '1rem' }}>
    <Search
      size={20}
      style={{
        position: 'absolute',
        left: '1rem',
        top: '50%',
        transform: 'translateY(-50%)',
        color: '#64748b'
      }}
    />
    <input
      type="text"
      placeholder="Search by name, application ID, or phone..."
      value={searchTerm}
      onChange={handleSearch}
      style={{
        width: '100%',
        padding: '0.875rem 1rem 0.875rem 3rem',
        border: '2px solid #e2e8f0',
        borderRadius: '8px',
        fontSize: '1rem',
        transition: 'all 0.2s',
        outline: 'none',
        boxSizing: 'border-box'
      }}
      onFocus={(e) => {
        e.target.style.borderColor = '#3b82f6';
        e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
      }}
      onBlur={(e) => {
        e.target.style.borderColor = '#e2e8f0';
        e.target.style.boxShadow = 'none';
      }}
    />
  </div>

  <div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <Filter size={18} />
      <select
        value={filterClass}
        onChange={handleClassFilter}
        style={{
          flex: 1,
          padding: '0.75rem 1rem',
          border: '2px solid #e2e8f0',
          borderRadius: '8px',
          fontSize: '0.95rem',
          background: 'white',
          cursor: 'pointer',
          transition: 'all 0.2s',
          outline: 'none'
        }}
        onFocus={(e) => {
          e.target.style.borderColor = '#3b82f6';
          e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = '#e2e8f0';
          e.target.style.boxShadow = 'none';
        }}
      >
        <option value="">All Classes</option>
        {classes.map(cls => (
          <option key={cls.id} value={cls.className}>{cls.className}</option>
        ))}
      </select>
    </div>
  </div>
</div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading applications...</p>
        </div>
      ) : admissions.length === 0 ? (
        <div className="empty-state">
          <FileText size={64} className="empty-icon" />
          <h3>No rejected applications</h3>
          <p>No rejected applications match your search criteria.</p>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="admissions-table">
              <thead>
                <tr>
                  <th>Application ID</th>
                  <th>Student Name</th>
                  <th>Applied Class</th>
                  <th>Contact</th>
                  <th>Rejected On</th>
                  <th>Reason</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {admissions.map((admission) => (
                  <tr key={admission.id}>
                    <td><span className="application-id">{admission.applicationId}</span></td>
                    <td>
                      <div className="student-info">
                        {admission.passportPhoto ? (
                          <img src={admission.passportPhoto} alt={admission.firstName} className="student-avatar" />
                        ) : (
                          <div className="student-avatar-placeholder">
                            {admission.firstName.charAt(0)}{admission.lastName.charAt(0)}
                          </div>
                        )}
                        <div className="student-name">
                          <span className="name-primary">{admission.firstName} {admission.lastName}</span>
                          {admission.middleName && <span className="name-secondary">{admission.middleName}</span>}
                        </div>
                      </div>
                    </td>
                    <td><span className="class-badge">{admission.appliedClass}</span></td>
                    <td>
                      <div className="contact-info">
                        <div className="contact-item"><Phone size={12} /> {admission.guardianPhone}</div>
                        {admission.guardianEmail && (
                          <div className="contact-item"><Mail size={12} /> {admission.guardianEmail}</div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="date-info"><Calendar size={14} /> {formatDate(admission.reviewedAt || admission.updatedAt)}</div>
                    </td>
                    <td>
                      <span title={admission.rejectionReason || ''} style={{
                        display: 'inline-block',
                        maxWidth: '220px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        color: '#64748b',
                        fontSize: '0.85rem'
                      }}>
                        {admission.rejectionReason || '—'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => navigate(`/admission/detail/${admission.applicationId}`)}
                          className="btn-icon btn-view"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => openReconsider(admission)}
                          className="btn-icon btn-review"
                          title="Reconsider (move back to Under Review)"
                        >
                          <RotateCcw size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.pages > 1 && (
            <div className="pagination">
              <button onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page === 1} className="btn-pagination">
                <ChevronLeft size={18} /> Previous
              </button>
              <div className="pagination-info">
                Page {pagination.page} of {pagination.pages}
                <span className="total-count">({pagination.total} total)</span>
              </div>
              <button onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page === pagination.pages} className="btn-pagination">
                Next <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}

      {/* Reconsider Modal */}
      {showReconsiderModal && (
        <div className="modal-overlay" onClick={() => !isSubmitting && setShowReconsiderModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🔄 Reconsider Application</h3>
              <button className="modal-close" onClick={() => !isSubmitting && setShowReconsiderModal(false)} disabled={isSubmitting}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="applicant-summary">
                <p><strong>Applicant:</strong> {selectedAdmission?.firstName} {selectedAdmission?.lastName}</p>
                <p><strong>Application ID:</strong> {selectedAdmission?.applicationId}</p>
                <p><strong>Original Rejection Reason:</strong> {selectedAdmission?.rejectionReason || 'N/A'}</p>
              </div>

              <div className="alert alert-info">
                <Info size={20} />
                <div>
                  <strong>This will:</strong>
                  <ul className="info-list">
                    <li>✓ Move the application back to "Under Review"</li>
                    <li>✓ Make it available for approval again</li>
                  </ul>
                </div>
              </div>

              <div className="form-group">
                <label>Note (optional)</label>
                <textarea
                  value={reconsiderNote}
                  onChange={(e) => setReconsiderNote(e.target.value)}
                  rows="4"
                  placeholder="Why is this application being reconsidered?"
                  disabled={isSubmitting}
                  className="form-textarea"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowReconsiderModal(false)} className="btn btn-secondary" disabled={isSubmitting}>
                <X size={18} /> Cancel
              </button>
              <button onClick={handleReconsiderSubmit} className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting && <Loader size={18} className="spinner-inline" />}
                {isSubmitting ? 'Processing...' : <><RotateCcw size={18} /> Move to Under Review</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {dialog.isOpen && (
        <div className="dialog-overlay" onClick={closeDialog}>
          <div className="dialog-box" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-content">
              <div className="dialog-icon-container">
                {dialog.type === 'success' && <CheckCircleIcon />}
                {dialog.type === 'error' && <AlertTriangle className="dialog-icon error" size={48} />}
                {dialog.type === 'warning' && <AlertCircle className="dialog-icon warning" size={48} />}
                {dialog.type === 'info' && <Info className="dialog-icon info" size={48} />}
              </div>
              <h2 className="dialog-title">{dialog.title}</h2>
              <p className="dialog-message">{dialog.message}</p>
              {dialog.details && (
                <div className="dialog-details">
                  {dialog.details.split('\n').map((line, index) => <p key={index}>{line}</p>)}
                </div>
              )}
            </div>
            <div className="dialog-footer">
              {dialog.showCancel && (
                <button className="btn btn-secondary" onClick={closeDialog} disabled={dialog.actionLoading}>Cancel</button>
              )}
              <button
                className={`btn btn-${dialog.type === 'success' ? 'success' : dialog.type === 'error' ? 'danger' : 'primary'}`}
                onClick={handleDialogAction}
                disabled={dialog.actionLoading}
              >
                {dialog.actionLoading && <Loader size={18} className="spinner-inline" />}
                {dialog.actionLoading ? 'Processing...' : dialog.actionLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const CheckCircleIcon = () => <CheckCircle className="dialog-icon success" size={48} />;

export default RejectedApplications;