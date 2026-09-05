import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Search, Filter, Eye, CheckCircle, XCircle,
  Clock, AlertCircle, FileText, Calendar, Phone, Mail,
  ChevronLeft, ChevronRight, RefreshCw, X,
  AlertTriangle, Info, Loader
} from 'lucide-react';
import './AdmissionsList.css';

// Reuses AdmissionsList.css — same design system, no new stylesheet needed.

const PendingReview = () => {
  const navigate = useNavigate();
  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [tab, setTab] = useState('pending'); // 'pending' | 'under_review'
  const [filterClass, setFilterClass] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const [classes, setClasses] = useState([]);

  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedAdmission, setSelectedAdmission] = useState(null);
  const [actionType, setActionType] = useState(''); // approve-and-enroll, reject, review
  const [actionData, setActionData] = useState({
    reviewedBy: '',
    rejectionReason: '',
    interviewScheduled: '',
    interviewNotes: '',
    entranceTestScore: '',
    selectedClassId: '',
    section: '',
    rollNumber: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [dialog, setDialog] = useState({
    isOpen: false, type: 'success', title: '', message: '', details: '',
    actionLabel: 'Close', onAction: null, showCancel: false, actionLoading: false
  });

  useEffect(() => {
    fetchAdmissions();
    fetchClasses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, searchTerm, filterClass, tab]);

  const fetchAdmissions = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admissions', {
        params: {
          page: pagination.page,
          limit: pagination.limit,
          search: searchTerm,
          status: tab, // 'pending' or 'under_review'
          appliedClass: filterClass
        }
      });
      if (response.data.success) {
        setAdmissions(response.data.data);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching admissions:', error);
      showDialog('error', 'Failed to Load Applications', 'Could not fetch pending applications. Please try again.');
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

  const handleTabChange = (newTab) => {
    setTab(newTab);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleClassFilter = (e) => {
    setFilterClass(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleActionClick = (admission, action) => {
    setSelectedAdmission(admission);
    setActionType(action === 'approve' ? 'approve-and-enroll' : action);
    setActionData({
      reviewedBy: 'Admin',
      rejectionReason: '',
      interviewScheduled: '',
      interviewNotes: '',
      entranceTestScore: '',
      selectedClassId: '',
      section: '',
      rollNumber: ''
    });
    setShowActionModal(true);
  };

  const handleActionSubmit = async () => {
    try {
      const data = { ...actionData };

      if (actionType === 'approve-and-enroll') {
        let finalClassId = data.selectedClassId;
        if (!finalClassId) {
          const appliedClass = classes.find(c =>
            c.className === selectedAdmission.appliedClass &&
            c.section === selectedAdmission.appliedSection
          );
          if (appliedClass) {
            finalClassId = appliedClass.id;
          } else {
            showDialog('warning', 'Missing Information', 'Could not determine class assignment. Please select a class manually.');
            return;
          }
        }

        setIsSubmitting(true);
        const response = await axios.post(
          `/api/admissions/${selectedAdmission.applicationId}/approve-and-enroll`,
          {
            reviewedBy: data.reviewedBy,
            interviewScheduled: data.interviewScheduled,
            interviewNotes: data.interviewNotes,
            entranceTestScore: data.entranceTestScore,
            selectedClassId: finalClassId,
            section: data.selectedSection || selectedAdmission.appliedSection,
            rollNumber: data.rollNumber
          }
        );

        if (response.data.success) {
          setShowActionModal(false);
          fetchAdmissions();
          showDialog(
            'success',
            'Success',
            'Application approved and student enrolled successfully!',
            `Student ID: ${response.data.data.studentId}\nAdmission Number: ${response.data.data.admissionNumber}\nStudent Number: ${response.data.data.studentNumber}`
          );
        }
        return;
      }

      let status = '';
      if (actionType === 'reject') {
        status = 'rejected';
        if (!data.rejectionReason.trim()) {
          showDialog('warning', 'Missing Information', 'Please provide a rejection reason.');
          return;
        }
      } else if (actionType === 'review') {
        status = 'under_review';
      }

      setIsSubmitting(true);
      const response = await axios.put(
        `/api/admissions/${selectedAdmission.applicationId}/status`,
        { ...data, status }
      );

      if (response.data.success) {
        setShowActionModal(false);
        fetchAdmissions();
        const actionText = actionType === 'reject' ? 'rejected' : 'marked for review';
        showDialog('success', 'Success', `Application has been ${actionText} successfully.`, `Application ID: ${selectedAdmission.applicationId}`);
      }
    } catch (error) {
      console.error('Error updating admission:', error);
      showDialog('error', 'Update Failed', 'Failed to update admission status.', error.response?.data?.message || 'Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePageChange = (newPage) => setPagination(prev => ({ ...prev, page: newPage }));

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getActionButtons = (admission) => {
    const buttons = [
      <button
        key="view"
        onClick={() => navigate(`/admission/detail/${admission.applicationId}`)}
        className="btn-icon btn-view"
        title="View Details"
      >
        <Eye size={16} />
      </button>
    ];

    if (admission.status === 'pending') {
      buttons.push(
        <button
          key="review"
          onClick={() => handleActionClick(admission, 'review')}
          className="btn-icon btn-review"
          title="Start Review"
        >
          <AlertCircle size={16} />
        </button>
      );
    }

    buttons.push(
      <button
        key="approve-enroll"
        onClick={() => handleActionClick(admission, 'approve')}
        className="btn-icon btn-approve"
        title="Approve & Enroll (Creates Student Immediately)"
      >
        <CheckCircle size={16} />
      </button>,
      <button
        key="reject"
        onClick={() => handleActionClick(admission, 'reject')}
        className="btn-icon btn-reject"
        title="Reject"
      >
        <XCircle size={16} />
      </button>
    );

    return buttons;
  };

  return (
    <div className="admissions-list-container">
      <div className="page-header">
        <div className="header-left">
          <h1><Clock size={28} /> Pending Review</h1>
          <p className="subtitle">Applications awaiting a decision</p>
        </div>
        <div className="header-actions">
          <button onClick={fetchAdmissions} className="btn btn-secondary">
            <RefreshCw size={18} /> Refresh
          </button>
        </div>
      </div>

      {/* Tabs: Pending vs Under Review */}
      <div className="filters-section" style={{ marginBottom: '1rem' }}>
        <div className="filter-controls" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => handleTabChange('pending')}
              className={`btn ${tab === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
            >
              <Clock size={16} /> Pending
            </button>
            <button
              onClick={() => handleTabChange('under_review')}
              className={`btn ${tab === 'under_review' ? 'btn-primary' : 'btn-secondary'}`}
            >
              <AlertCircle size={16} /> Under Review
            </button>
          </div>
        </div>
      </div>

 <div style={{
  display: 'flex',
  flexWrap: 'wrap',
  gap: '12px',
  alignItems: 'center',
  marginBottom: '20px',
  padding: '14px 16px',
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '10px'
}}>
  {/* Search Box */}
  <div style={{ position: 'relative', width: '320px', height: '40px' }}>
    <Search
      size={20}
      style={{
        position: 'absolute',
        left: '12px',
        top: '50%',
        transform: 'translateY(-50%)',
        color: '#9ca3af',
        pointerEvents: 'none'
      }}
    />
    <input
      type="text"
      placeholder="Search by name, application ID, or phone..."
      value={searchTerm}
      onChange={handleSearch}
      style={{
        width: '100%',
        height: '100%',
        padding: '0 12px 0 40px',
        border: '1px solid #d1d5db',
        borderRadius: '8px',
        fontSize: '0.9rem',
        backgroundColor: '#ffffff',
        boxSizing: 'border-box',
        outline: 'none'
      }}
    />
  </div>

  {/* Filter Controls */}
  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>

    {/* Class Filter */}
    <div style={{
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      height: '40px',
      padding: '0 28px 0 10px',
      backgroundColor: '#ffffff',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      boxSizing: 'border-box'
    }}>
      <Filter size={16} style={{ color: '#6b7280', flexShrink: 0 }} />
      <select
        value={filterClass}
        onChange={handleClassFilter}
        style={{
          appearance: 'none',
          WebkitAppearance: 'none',
          MozAppearance: 'none',
          border: 'none',
          outline: 'none',
          background: 'transparent',
          fontSize: '0.875rem',
          color: '#374151',
          cursor: 'pointer',
          minWidth: '100px',
          height: '100%'
        }}
      >
        <option value="">All Classes</option>
        {classes.map(cls => (
          <option key={cls.id} value={cls.className}>{cls.className}</option>
        ))}
      </select>
      {/* Custom arrow */}
      <span style={{
        position: 'absolute',
        right: '10px',
        top: '50%',
        width: '8px',
        height: '8px',
        borderRight: '2px solid #9ca3af',
        borderBottom: '2px solid #9ca3af',
        transform: 'translateY(-65%) rotate(45deg)',
        pointerEvents: 'none'
      }} />
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
          <h3>No applications found</h3>
          <p>No {tab === 'pending' ? 'pending' : 'under-review'} applications match your search criteria.</p>
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
                  <th>Applied Date</th>
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
                      <div className="date-info"><Calendar size={14} /> {formatDate(admission.appliedAt)}</div>
                    </td>
                    <td>
                      <div className="action-buttons">{getActionButtons(admission)}</div>
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

      {/* Action Modal — same shape as AdmissionsList */}
      {showActionModal && (
        <div className="modal-overlay" onClick={() => !isSubmitting && setShowActionModal(false)}>
          <div className="modal-content-wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {actionType === 'approve-and-enroll' && '✅ Approve & Enroll Student'}
                {actionType === 'reject' && '❌ Reject Application'}
                {actionType === 'review' && '📋 Start Review'}
              </h3>
              <button className="modal-close" onClick={() => !isSubmitting && setShowActionModal(false)} disabled={isSubmitting}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="applicant-summary">
                <div className="summary-grid">
                  <div><strong>Applicant:</strong> {selectedAdmission?.firstName} {selectedAdmission?.lastName}</div>
                  <div>
                    <strong>Applied Class:</strong> {selectedAdmission?.appliedClass}
                    {selectedAdmission?.appliedSection && ` - Section ${selectedAdmission?.appliedSection}`}
                  </div>
                  <div><strong>Application ID:</strong> {selectedAdmission?.applicationId}</div>
                  <div><strong>Gender:</strong> {selectedAdmission?.gender}</div>
                </div>
              </div>

              {actionType === 'approve-and-enroll' && (
                <>
                  <div className="form-section-header"><h4>📚 Class Assignment</h4></div>
                  <div className="form-grid-2col">
                    <div className="form-group">
                      <label>Assign to Class (Optional - defaults to applied class)</label>
                      <select
                        value={actionData.selectedClassId || ''}
                        onChange={(e) => {
                          const classId = e.target.value;
                          const selectedClass = classes.find(c => c.id === parseInt(classId));
                          setActionData({
                            ...actionData,
                            selectedClassId: classId,
                            selectedClassName: selectedClass?.className || '',
                            section: selectedClass?.section || '',
                            availableSeats: selectedClass ? (selectedClass.capacity - (selectedClass.currentStudents || 0)) : 0
                          });
                        }}
                        disabled={isSubmitting}
                        className="form-select"
                      >
                        <option value="">
                          Use Applied Class: {selectedAdmission?.appliedClass}
                          {selectedAdmission?.appliedSection ? ` - Section ${selectedAdmission?.appliedSection}` : ''}
                        </option>
                        {classes
                          .filter(cls => {
                            const appliedClass = selectedAdmission?.appliedClass?.toUpperCase() || '';
                            const appliedCategory = appliedClass.includes('SS') ? 'Senior' : appliedClass.includes('JSS') ? 'Junior' : 'Primary';
                            return cls.classCategory === appliedCategory;
                          })
                          .map(cls => {
                            const availableSeats = cls.capacity - (cls.currentStudents || 0);
                            const isFull = availableSeats <= 0;
                            return (
                              <option key={cls.id} value={cls.id} disabled={isFull}>
                                {cls.className} {cls.section ? `- Section ${cls.section}` : ''} ({availableSeats} seats){isFull ? ' - FULL' : ''}
                              </option>
                            );
                          })}
                      </select>
                      {actionData.selectedClassId ? (
                        <div className="field-hint success">✓ {actionData.availableSeats || 0} seats available</div>
                      ) : (
                        <div className="field-hint">
                          Will use applied class: {selectedAdmission?.appliedClass}
                          {selectedAdmission?.appliedSection ? ` - Section ${selectedAdmission?.appliedSection}` : ''}
                        </div>
                      )}
                    </div>

                    <div className="form-group">
                      <label>Roll Number (Optional)</label>
                      <input
                        type="text"
                        value={actionData.rollNumber || ''}
                        onChange={(e) => setActionData({ ...actionData, rollNumber: e.target.value })}
                        placeholder="e.g., 001, 045"
                        disabled={isSubmitting}
                        className="form-input"
                      />
                      <div className="field-hint">Leave blank for auto-assignment</div>
                    </div>
                  </div>

                  {actionData.selectedClassId && actionData.selectedClassName !== selectedAdmission?.appliedClass && (
                    <div className="alert alert-warning">
                      <AlertCircle size={18} />
                      <div>
                        <strong>Class Change Notice</strong>
                        <p>Student applied for <strong>{selectedAdmission?.appliedClass}</strong> but will be assigned to <strong>{actionData.selectedClassName} {actionData.selectedSection ? `- Section ${actionData.selectedSection}` : ''}</strong></p>
                      </div>
                    </div>
                  )}

                  <div className="form-section-header"><h4>📝 Assessment Details</h4></div>
                  <div className="form-grid-2col">
                    <div className="form-group">
                      <label>Reviewed By</label>
                      <input
                        type="text"
                        value={actionData.reviewedBy}
                        onChange={(e) => setActionData({ ...actionData, reviewedBy: e.target.value })}
                        disabled={isSubmitting}
                        className="form-input"
                        placeholder="Enter reviewer name"
                      />
                    </div>
                    <div className="form-group">
                      <label>Interview Scheduled</label>
                      <input
                        type="datetime-local"
                        value={actionData.interviewScheduled}
                        onChange={(e) => setActionData({ ...actionData, interviewScheduled: e.target.value })}
                        disabled={isSubmitting}
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label>Entrance Test Score</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={actionData.entranceTestScore}
                        onChange={(e) => setActionData({ ...actionData, entranceTestScore: e.target.value })}
                        placeholder="Score out of 100"
                        disabled={isSubmitting}
                        className="form-input"
                      />
                      <div className="field-hint">Enter score from 0-100</div>
                    </div>
                    <div className="form-group full-width">
                      <label>Interview Notes</label>
                      <textarea
                        value={actionData.interviewNotes}
                        onChange={(e) => setActionData({ ...actionData, interviewNotes: e.target.value })}
                        rows="4"
                        placeholder="Add any observations or special notes..."
                        disabled={isSubmitting}
                        className="form-textarea"
                      />
                    </div>
                  </div>

                  <div className="alert alert-info">
                    <Info size={20} />
                    <div>
                      <strong>Approval Confirmation</strong>
                      <ul className="info-list">
                        <li>✓ Approve the application</li>
                        <li>✓ Create student record immediately</li>
                        <li>✓ Assign to: <strong>
                          {actionData.selectedClassName || selectedAdmission?.appliedClass}
                          {actionData.selectedSection || selectedAdmission?.appliedSection ? ` - Section ${actionData.selectedSection || selectedAdmission?.appliedSection}` : ''}
                        </strong></li>
                        <li>✓ Generate Student ID and Admission Number</li>
                        <li>✓ Enable PDF admission letter download</li>
                      </ul>
                    </div>
                  </div>
                </>
              )}

              {actionType === 'reject' && (
                <>
                  <div className="form-group">
                    <label>Reviewed By</label>
                    <input
                      type="text"
                      value={actionData.reviewedBy}
                      onChange={(e) => setActionData({ ...actionData, reviewedBy: e.target.value })}
                      disabled={isSubmitting}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Rejection Reason <span className="required">*</span></label>
                    <textarea
                      value={actionData.rejectionReason}
                      onChange={(e) => setActionData({ ...actionData, rejectionReason: e.target.value })}
                      rows="5"
                      placeholder="Please provide a detailed reason for rejection..."
                      disabled={isSubmitting}
                      className="form-textarea"
                    />
                  </div>
                </>
              )}

              {actionType === 'review' && (
                <div className="form-grid-2col">
                  <div className="form-group">
                    <label>Reviewed By</label>
                    <input
                      type="text"
                      value={actionData.reviewedBy}
                      onChange={(e) => setActionData({ ...actionData, reviewedBy: e.target.value })}
                      disabled={isSubmitting}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Interview Scheduled</label>
                    <input
                      type="datetime-local"
                      value={actionData.interviewScheduled}
                      onChange={(e) => setActionData({ ...actionData, interviewScheduled: e.target.value })}
                      disabled={isSubmitting}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Entrance Test Score</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={actionData.entranceTestScore}
                      onChange={(e) => setActionData({ ...actionData, entranceTestScore: e.target.value })}
                      placeholder="Score out of 100"
                      disabled={isSubmitting}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group full-width">
                    <label>Interview Notes</label>
                    <textarea
                      value={actionData.interviewNotes}
                      onChange={(e) => setActionData({ ...actionData, interviewNotes: e.target.value })}
                      rows="4"
                      placeholder="Add any notes or observations..."
                      disabled={isSubmitting}
                      className="form-textarea"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button onClick={() => setShowActionModal(false)} className="btn btn-secondary" disabled={isSubmitting}>
                <X size={18} /> Cancel
              </button>
              <button
                onClick={handleActionSubmit}
                className={`btn ${actionType === 'approve-and-enroll' ? 'btn-success' : actionType === 'reject' ? 'btn-danger' : 'btn-primary'}`}
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader size={18} className="spinner-inline" />}
                {actionType === 'approve-and-enroll' && (isSubmitting ? 'Approving...' : <><CheckCircle size={18} /> Approve & Enroll</>)}
                {actionType === 'reject' && (isSubmitting ? 'Rejecting...' : <><XCircle size={18} /> Reject Application</>)}
                {actionType === 'review' && (isSubmitting ? 'Processing...' : <><AlertCircle size={18} /> Start Review</>)}
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
                {dialog.type === 'success' && <CheckCircle className="dialog-icon success" size={48} />}
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

export default PendingReview;