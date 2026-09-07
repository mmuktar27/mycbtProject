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
import AdmissionActionModal from './AdmissionActionModal';
import AppDialog from '../shared/AppDialog';
import { useAppDialog } from '../../hooks/useAppDialog';



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

const { dialog, showDialog, closeDialog, handleDialogAction } = useAppDialog();

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
    <span className={`status-pill status-pill--${config.color}`}>
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

    {/* Status Filter */}
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
        value={filterStatus}
        onChange={handleStatusFilter}
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
        <option value="">All Status</option>
        <option value="pending">Pending</option>
        <option value="under_review">Under Review</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
      </select>
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

    {/* Class Filter */}
    <div style={{
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      height: '40px',
      padding: '0 28px 0 10px',
      backgroundColor: '#ffffff',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      boxSizing: 'border-box'
    }}>
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
                    <td>
  {getStatusBadge(admission.status)}
  {admission.status === 'approved' && admission.studentId && (
    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '4px' }}>
      ID: {admission.studentId}
    </div>
  )}
</td>
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
<AdmissionActionModal
  isOpen={showActionModal}
  actionType={actionType}
  selectedAdmission={selectedAdmission}
  actionData={actionData}
  setActionData={setActionData}
  classes={classes}
  isSubmitting={isSubmitting}
  onClose={() => setShowActionModal(false)}
  onSubmit={handleActionSubmit}
/>
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