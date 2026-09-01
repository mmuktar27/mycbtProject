import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  UserPlus, Search, Filter, Eye, CheckCircle, XCircle,
  Clock, AlertCircle, FileText, Calendar, Phone, Mail,
  ChevronLeft, ChevronRight, Download, RefreshCw, X,
  AlertTriangle, Info, Loader
} from 'lucide-react';
import './AdmissionsList.css';
import ExportModal from './ExportModal';
const AdmissionsList = () => {
  const navigate = useNavigate();
  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [classes, setClasses] = useState([]);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedAdmission, setSelectedAdmission] = useState(null);
  const [actionType, setActionType] = useState(''); // approve, reject, review
  const [actionData, setActionData] = useState({
    reviewedBy: '',
    rejectionReason: '',
    interviewScheduled: '',
    interviewNotes: '',
    entranceTestScore: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dialog state
  const [dialog, setDialog] = useState({
    isOpen: false,
    type: 'success', // success, error, info, warning, confirm
    title: '',
    message: '',
    details: '',
    actionLabel: 'Close',
    onAction: null,
    showCancel: false,
    actionLoading: false
  });

  useEffect(() => {
    fetchAdmissions();
    fetchClasses();
  }, [pagination.page, searchTerm, filterStatus, filterClass]);

  const fetchAdmissions = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admissions', {
        params: {
          page: pagination.page,
          limit: pagination.limit,
          search: searchTerm,
          status: filterStatus,
          appliedClass: filterClass
        }
      });

      if (response.data.success) {
        setAdmissions(response.data.data);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching admissions:', error);
      showDialog('error', 'Failed to Load Admissions', 'Could not fetch admission applications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await axios.get('/api/classes');
      if (response.data.success) {
                console.log('Classes loaded:', response.data.data); // ADD THIS LINE FOR DEBUGGING

        setClasses(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const showDialog = (type, title, message, details = '', actionLabel = 'Close', onAction = null, showCancel = false) => {
    setDialog({
      isOpen: true,
      type,
      title,
      message,
      details,
      actionLabel,
      onAction,
      showCancel,
      actionLoading: false
    });
  };

  const closeDialog = () => {
    setDialog({ ...dialog, isOpen: false });
  };

  const handleDialogAction = async () => {
    if (dialog.onAction) {
      setDialog({ ...dialog, actionLoading: true });
      await dialog.onAction();
      setDialog({ ...dialog, actionLoading: false });
    } else {
      closeDialog();
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPagination({ ...pagination, page: 1 });
  };

  const handleStatusFilter = (e) => {
    setFilterStatus(e.target.value);
    setPagination({ ...pagination, page: 1 });
  };

  const handleClassFilter = (e) => {
    setFilterClass(e.target.value);
    setPagination({ ...pagination, page: 1 });
  };

 const handleActionClick = (admission, action) => {
    setSelectedAdmission(admission);
    setActionType(action);
    
    // For approve action, change the label
    if (action === 'approve') {
        setActionType('approve-and-enroll'); // Use new merged action type
    }
    
    setActionData({
        reviewedBy: 'Admin', // Replace with actual user
        rejectionReason: '',
        interviewScheduled: '',
        interviewNotes: '',
        entranceTestScore: '',
        section: '', // NEW: for student enrollment
        rollNumber: '' // NEW: for student enrollment
    });
    setShowActionModal(true);
};



const handleActionSubmit = async () => {
    try {
        let status = '';
        const data = { ...actionData };

        // ==================== MERGED APPROVE & ENROLL ====================
        if (actionType === 'approve-and-enroll') {
            // NEW: Use applied class if no class selected
            let finalClassId = data.selectedClassId;
            
            if (!finalClassId) {
                // Find the applied class from the classes array
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

            // Call the NEW merged endpoint
            const response = await axios.post(
                `/api/admissions/${selectedAdmission.applicationId}/approve-and-enroll`,
                {
                    reviewedBy: data.reviewedBy,
                    interviewScheduled: data.interviewScheduled,
                    interviewNotes: data.interviewNotes,
                    entranceTestScore: data.entranceTestScore,
                    selectedClassId: finalClassId,  // Send the final class ID
                    section: data.selectedSection || selectedAdmission.appliedSection,
                    rollNumber: data.rollNumber
                }
            );

            if (response.data.success) {
                setShowActionModal(false);
                fetchAdmissions();

                // Show success with ACTUAL student number
                showDialog(
                    'success',
                    'Success',
                    `Application approved and student enrolled successfully!`,
                    `Student ID: ${response.data.data.studentId}\nAdmission Number: ${response.data.data.admissionNumber}\nStudent Number: ${response.data.data.studentNumber}`
                );
            }
            return;
        }

        // ==================== ORIGINAL ACTIONS (Reject, Review) ====================
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

            // Show success dialog
            const actionText = actionType === 'reject' ? 'rejected' : 'marked for review';
            showDialog(
                'success',
                'Success',
                `Application has been ${actionText} successfully.`,
                `Application ID: ${selectedAdmission.applicationId}`
            );
        }
    } catch (error) {
        console.error('Error updating admission:', error);
        showDialog(
            'error',
            'Update Failed',
            'Failed to update admission status.',
            error.response?.data?.message || 'Please try again.'
        );
    } finally {
        setIsSubmitting(false);
    }
};




  const handlePageChange = (newPage) => {
    setPagination({ ...pagination, page: newPage });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { icon: Clock, color: 'warning', text: 'Pending' },
      under_review: { icon: AlertCircle, color: 'info', text: 'Under Review' },
      approved: { icon: CheckCircle, color: 'success', text: 'Approved' },
      rejected: { icon: XCircle, color: 'danger', text: 'Rejected' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`badge badge-${config.color}`}>
        <Icon size={14} /> {config.text}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

 
const getActionButtons = (admission) => {
    const buttons = [];

    // View Details button (always available)
    buttons.push(
        <button
            key="view"
            onClick={() => navigate(`/admission/detail/${admission.applicationId}`)}
            className="btn-icon btn-view"
            title="View Details"
        >
            <Eye size={16} />
        </button>
    );

    // Status-specific actions
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

    if (admission.status === 'pending' || admission.status === 'under_review') {
        // ==================== MERGED BUTTON: APPROVE & ENROLL ====================
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
    }

    // NO MORE "Convert to Student" button - it's now part of approval
    // if (admission.status === 'approved') {
    //     buttons.push(
    //         <button
    //             key="convert"
    //             onClick={() => handleConvertToStudent(admission.applicationId)}
    //             className="btn-icon btn-convert"
    //             title="Convert to Student"
    //         >
    //             <UserPlus size={16} />
    //         </button>
    //     );
    // }

    return buttons;
};




  return (
    <div className="admissions-list-container">
      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <h1><FileText size={28} /> Admission Applications</h1>
          <p className="subtitle">Manage all admission applications</p>
        </div>
        <div className="header-actions">
          <button onClick={fetchAdmissions} className="btn btn-secondary">
            <RefreshCw size={18} /> Refresh
          </button>
          <button
            onClick={() => navigate('/admission/apply')}
            className="btn btn-primary"
          >
            <UserPlus size={18} /> New Application
          </button>

          <button 
  onClick={() => setShowExportModal(true)}
  className="btn btn-info"
  title="Export admissions to Excel, PDF, or CSV"
>
  <Download size={18} /> Export
</button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card pending">
          <Clock size={24} />
          <div className="stat-info">
            <h3>{admissions.filter(a => a.status === 'pending').length}</h3>
            <p>Pending</p>
          </div>
        </div>
        <div className="stat-card review">
          <AlertCircle size={24} />
          <div className="stat-info">
            <h3>{admissions.filter(a => a.status === 'under_review').length}</h3>
            <p>Under Review</p>
          </div>
        </div>
        <div className="stat-card approved">
          <CheckCircle size={24} />
          <div className="stat-info">
            <h3>{admissions.filter(a => a.status === 'approved').length}</h3>
            <p>Approved</p>
          </div>
        </div>
        <div className="stat-card rejected">
          <XCircle size={24} />
          <div className="stat-info">
            <h3>{admissions.filter(a => a.status === 'rejected').length}</h3>
            <p>Rejected</p>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="filters-section">
        <div className="search-box">
          <Search className="search-icon" size={20} />
          <input
            type="text"
            placeholder="Search by name, application ID, or phone..."
            value={searchTerm}
            onChange={handleSearch}
            className="search-input"
          />
        </div>

        <div className="filter-controls">
          <div className="filter-group">
            <Filter size={18} />
            <select value={filterStatus} onChange={handleStatusFilter} className="filter-select">
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="filter-group">
            <select value={filterClass} onChange={handleClassFilter} className="filter-select">
              <option value="">All Classes</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.className}>
                  {cls.className}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Applications Table */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading applications...</p>
        </div>
      ) : admissions.length === 0 ? (
        <div className="empty-state">
          <FileText size={64} className="empty-icon" />
          <h3>No applications found</h3>
          <p>No admission applications match your search criteria.</p>
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
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {admissions.map((admission) => (
                  <tr key={admission.id}>
                    <td>
                      <span className="application-id">{admission.applicationId}</span>
                    </td>
                    <td>
                      <div className="student-info">
                        {admission.passportPhoto ? (
                          <img
                            src={admission.passportPhoto}
                            alt={admission.firstName}
                            className="student-avatar"
                          />
                        ) : (
                          <div className="student-avatar-placeholder">
                            {admission.firstName.charAt(0)}
                            {admission.lastName.charAt(0)}
                          </div>
                        )}
                        <div className="student-name">
                          <span className="name-primary">
                            {admission.firstName} {admission.lastName}
                          </span>
                          {admission.middleName && (
                            <span className="name-secondary">{admission.middleName}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="class-badge">{admission.appliedClass}</span>
                    </td>
                    <td>
                      <div className="contact-info">
                        <div className="contact-item">
                          <Phone size={12} /> {admission.guardianPhone}
                        </div>
                        {admission.guardianEmail && (
                          <div className="contact-item">
                            <Mail size={12} /> {admission.guardianEmail}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="date-info">
                        <Calendar size={14} />
                        {formatDate(admission.appliedAt)}
                      </div>
                    </td>
                    <td>{getStatusBadge(admission.status)}</td>
                    <td>
                      <div className="action-buttons">
                        {getActionButtons(admission)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="pagination">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="btn-pagination"
              >
                <ChevronLeft size={18} /> Previous
              </button>

              <div className="pagination-info">
                Page {pagination.page} of {pagination.pages}
                <span className="total-count">({pagination.total} total)</span>
              </div>

              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="btn-pagination"
              >
                Next <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}

      {/* Action Modal */}
  {showActionModal && (
  <div className="modal-overlay" onClick={() => !isSubmitting && setShowActionModal(false)}>
    <div className="modal-content-wide" onClick={(e) => e.stopPropagation()}>
      <div className="modal-header">
        <h3>
          {actionType === 'approve-and-enroll' && '✅ Approve & Enroll Student'}
          {actionType === 'reject' && '❌ Reject Application'}
          {actionType === 'review' && '📋 Start Review'}
        </h3>
        <button 
          className="modal-close"
          onClick={() => !isSubmitting && setShowActionModal(false)}
          disabled={isSubmitting}
        >
          <X size={20} />
        </button>
      </div>
      
      <div className="modal-body">
        {/* Applicant Summary - Full Width */}
        <div className="applicant-summary">
          <div className="summary-grid">
            <div>
              <strong>Applicant:</strong> {selectedAdmission?.firstName}{' '}
              {selectedAdmission?.lastName}
            </div>
            <div>
              <strong>Applied Class:</strong> {selectedAdmission?.appliedClass} 
              {selectedAdmission?.appliedSection && ` - Section ${selectedAdmission?.appliedSection}`}
            </div>
            <div>
              <strong>Application ID:</strong> {selectedAdmission?.applicationId}
            </div>
            <div>
              <strong>Gender:</strong> {selectedAdmission?.gender}
            </div>
          </div>
        </div>

        {actionType === 'approve-and-enroll' && (
          <>
            {/* Class Assignment Section */}
            <div className="form-section-header">
              <h4>📚 Class Assignment</h4>
            </div>

            <div className="form-grid-2col">
{/* Class Selection */}
<div className="form-group">
  <label>
    Assign to Class (Optional - defaults to applied class)
  </label>
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
    const appliedCategory = appliedClass.includes('SS') ? 'Senior' :
                           appliedClass.includes('JSS') ? 'Junior' :
                           'Primary';
    return cls.classCategory === appliedCategory;
  })
  .map(cls => {
    const availableSeats = cls.capacity - (cls.currentStudents || 0);
    const isFull = availableSeats <= 0;
    
    return (
      <option 
        key={cls.id} 
        value={cls.id}
        disabled={isFull}
      >
        {cls.className} {cls.section ? `- Section ${cls.section}` : ''} 
        {' '}({availableSeats} seats)
        {isFull ? ' - FULL' : ''}
      </option>
    );
  })}
  </select>
  
  {actionData.selectedClassId ? (
    <div className="field-hint success">
      ✓ {actionData.availableSeats || 0} seats available
    </div>
  ) : (
    <div className="field-hint">
      Will use applied class: {selectedAdmission?.appliedClass}
      {selectedAdmission?.appliedSection ? ` - Section ${selectedAdmission?.appliedSection}` : ''}
    </div>
  )}
</div>

              {/* Roll Number */}
              <div className="form-group">
                <label>Roll Number (Optional)</label>
                <input
                  type="text"
                  value={actionData.rollNumber || ''}
                  onChange={(e) =>
                    setActionData({ ...actionData, rollNumber: e.target.value })
                  }
                  placeholder="e.g., 001, 045"
                  disabled={isSubmitting}
                  className="form-input"
                />
                <div className="field-hint">Leave blank for auto-assignment</div>
              </div>
            </div>

            {/* Warning if class changed */}
        {/* Warning if class changed */}
{actionData.selectedClassId && 
 actionData.selectedClassName !== selectedAdmission?.appliedClass && (
  <div className="alert alert-warning">
    <AlertCircle size={18} />
    <div>
      <strong>Class Change Notice</strong>
      <p>Student applied for <strong>{selectedAdmission?.appliedClass}</strong> but will be assigned to <strong>{actionData.selectedClassName} {actionData.selectedSection ? `- Section ${actionData.selectedSection}` : ''}</strong></p>
    </div>
  </div>
)}

            {/* Interview/Assessment Section */}
            <div className="form-section-header">
              <h4>📝 Assessment Details</h4>
            </div>

            <div className="form-grid-2col">
              <div className="form-group">
                <label>Reviewed By</label>
                <input
                  type="text"
                  value={actionData.reviewedBy}
                  onChange={(e) =>
                    setActionData({ ...actionData, reviewedBy: e.target.value })
                  }
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
                  onChange={(e) =>
                    setActionData({
                      ...actionData,
                      interviewScheduled: e.target.value
                    })
                  }
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
                  onChange={(e) =>
                    setActionData({
                      ...actionData,
                      entranceTestScore: e.target.value
                    })
                  }
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
                  onChange={(e) =>
                    setActionData({ ...actionData, interviewNotes: e.target.value })
                  }
                  rows="4"
                  placeholder="Add any observations or special notes..."
                  disabled={isSubmitting}
                  className="form-textarea"
                />
              </div>
            </div>

            {/* Info Box */}
            <div className="alert alert-info">
              <Info size={20} />
              <div>
                <strong>Approval Confirmation</strong>
                <ul className="info-list">
                  <li>✓ Approve the application</li>
                  <li>✓ Create student record immediately</li>
                  <li>✓ Assign to:<strong>
  {actionData.selectedClassName || selectedAdmission?.appliedClass}
  {actionData.selectedSection || selectedAdmission?.appliedSection 
    ? ` - Section ${actionData.selectedSection || selectedAdmission?.appliedSection}` 
    : ''}
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
                onChange={(e) =>
                  setActionData({ ...actionData, reviewedBy: e.target.value })
                }
                disabled={isSubmitting}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>
                Rejection Reason <span className="required">*</span>
              </label>
              <textarea
                value={actionData.rejectionReason}
                onChange={(e) =>
                  setActionData({ ...actionData, rejectionReason: e.target.value })
                }
                rows="5"
                placeholder="Please provide a detailed reason for rejection..."
                disabled={isSubmitting}
                className="form-textarea"
              />
            </div>
          </>
        )}

        {actionType === 'review' && (
          <>
            <div className="form-grid-2col">
              <div className="form-group">
                <label>Reviewed By</label>
                <input
                  type="text"
                  value={actionData.reviewedBy}
                  onChange={(e) =>
                    setActionData({ ...actionData, reviewedBy: e.target.value })
                  }
                  disabled={isSubmitting}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Interview Scheduled</label>
                <input
                  type="datetime-local"
                  value={actionData.interviewScheduled}
                  onChange={(e) =>
                    setActionData({
                      ...actionData,
                      interviewScheduled: e.target.value
                    })
                  }
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
                  onChange={(e) =>
                    setActionData({
                      ...actionData,
                      entranceTestScore: e.target.value
                    })
                  }
                  placeholder="Score out of 100"
                  disabled={isSubmitting}
                  className="form-input"
                />
              </div>

              <div className="form-group full-width">
                <label>Interview Notes</label>
                <textarea
                  value={actionData.interviewNotes}
                  onChange={(e) =>
                    setActionData({ ...actionData, interviewNotes: e.target.value })
                  }
                  rows="4"
                  placeholder="Add any notes or observations..."
                  disabled={isSubmitting}
                  className="form-textarea"
                />
              </div>
            </div>
          </>
        )}
      </div>

      <div className="modal-footer">
        <button
          onClick={() => setShowActionModal(false)}
          className="btn btn-secondary"
          disabled={isSubmitting}
        >
          <X size={18} /> Cancel
        </button>
        <button
          onClick={handleActionSubmit}
          className={`btn ${
            actionType === 'approve-and-enroll'
              ? 'btn-success'
              : actionType === 'reject'
              ? 'btn-danger'
              : 'btn-primary'
          }`}
          disabled={isSubmitting}
        >
          {isSubmitting && <Loader size={18} className="spinner-inline" />}
          {actionType === 'approve-and-enroll' && (
            isSubmitting ? 'Approving...' : (
              <>
                <CheckCircle size={18} /> Approve & Enroll
              </>
            )
          )}
          {actionType === 'reject' && (
            isSubmitting ? 'Rejecting...' : (
              <>
                <XCircle size={18} /> Reject Application
              </>
            )
          )}
          {actionType === 'review' && (
            isSubmitting ? 'Processing...' : (
              <>
                <AlertCircle size={18} /> Start Review
              </>
            )
          )}
        </button>
      </div>
    </div>
  </div>
)}

      {/* Dialog Component */}
      {dialog.isOpen && (
        <div className="dialog-overlay" onClick={closeDialog}>
          <div className="dialog-box" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-content">
              <div className="dialog-icon-container">
                {dialog.type === 'success' && <CheckCircle className="dialog-icon success" size={48} />}
                {dialog.type === 'error' && <AlertTriangle className="dialog-icon error" size={48} />}
                {dialog.type === 'warning' && <AlertCircle className="dialog-icon warning" size={48} />}
                {dialog.type === 'info' && <Info className="dialog-icon info" size={48} />}
                {dialog.type === 'confirm' && <AlertCircle className="dialog-icon confirm" size={48} />}
              </div>

              <h2 className="dialog-title">{dialog.title}</h2>
              <p className="dialog-message">{dialog.message}</p>
              
              {dialog.details && (
                <div className="dialog-details">
                  {dialog.details.split('\n').map((line, index) => (
                    <p key={index}>{line}</p>
                  ))}
                </div>
              )}
            </div>

            <div className="dialog-footer">
              {dialog.showCancel && (
                <button
                  className="btn btn-secondary"
                  onClick={closeDialog}
                  disabled={dialog.actionLoading}
                >
                  Cancel
                </button>
              )}
              <button
                className={`btn btn-${
                  dialog.type === 'success' ? 'success' :
                  dialog.type === 'error' ? 'danger' :
                  dialog.type === 'confirm' ? 'primary' :
                  'primary'
                }`}
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

      <ExportModal
  isOpen={showExportModal}
  onClose={() => setShowExportModal(false)}
  admissions={admissions}
  filters={{
    status: filterStatus,
    appliedClass: filterClass,
    search: searchTerm
  }}
/>
    </div>
  );
};

export default AdmissionsList;