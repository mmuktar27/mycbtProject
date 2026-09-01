import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft, Download, Eye, FileText, User, Users, BookOpen, Calendar,
  Phone, Mail, MapPin, Briefcase, Award, AlertCircle, CheckCircle,
  XCircle, Clock, Save, X, Loader, FileCheck, Heart, Globe,UserPlus
} from 'lucide-react';
import './AdmissionDetail.css';

const AdmissionDetail = () => {
  const { applicationId } = useParams();
  const navigate = useNavigate();

  // State Management
  const [admission, setAdmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('personal'); // personal, guardian, academic, documents
  const [actionModal, setActionModal] = useState({
    isOpen: false,
    type: '', // approve, reject, review
    loading: false
  });
  const [formData, setFormData] = useState({
    reviewedBy: 'Admin',
    rejectionReason: '',
    interviewScheduled: '',
    entranceTestScore: '',
    interviewNotes: ''
  });

  useEffect(() => {
    fetchAdmissionDetail();
  }, [applicationId]);

  const fetchAdmissionDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`/api/admissions/${applicationId}`);

      if (response.data.success) {
        setAdmission(response.data.data);
        console.log('response data',response)
      } else {
        setError('Failed to load admission details');
      }
    } catch (err) {
      console.error('Error fetching admission:', err);
      setError(err.response?.data?.message || 'Failed to load admission details');
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = (type) => {
    setActionModal({ isOpen: true, type, loading: false });
    setFormData({
      reviewedBy: 'Admin',
      rejectionReason: '',
      interviewScheduled: '',
      entranceTestScore: '',
      interviewNotes: ''
    });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleActionSubmit = async () => {
    try {
      // Validation
      if (actionModal.type === 'reject' && !formData.rejectionReason.trim()) {
        alert('Please provide a rejection reason');
        return;
      }

      setActionModal({ ...actionModal, loading: true });

      let status = '';
      if (actionModal.type === 'approve') status = 'approved';
      else if (actionModal.type === 'reject') status = 'rejected';
      else if (actionModal.type === 'review') status = 'under_review';

      const response = await axios.put(
        `/api/admissions/${applicationId}/status`,
        { ...formData, status }
      );

      if (response.data.success) {
        alert(response.data.message);
        setActionModal({ isOpen: false, type: '', loading: false });
        fetchAdmissionDetail();
      }
    } catch (err) {
      console.error('Error updating status:', err);
      alert(err.response?.data?.message || 'Failed to update admission');
    } finally {
      setActionModal({ ...actionModal, loading: false });
    }
  };

  const handleConvertToStudent = async () => {
    if (!window.confirm('Are you sure you want to convert this approved admission to a student? This action cannot be undone.')) {
      return;
    }

    try {
      setActionModal({ ...actionModal, loading: true });

      const response = await axios.post(
        `/api/admissions/${applicationId}/convert-to-student`,
        {}
      );

      if (response.data.success) {
        alert(
          `Student created successfully!\n\nStudent ID: ${response.data.data.studentId}\nAdmission Number: ${response.data.data.admissionNumber}`
        );
        setActionModal({ isOpen: false, type: '', loading: false });
        fetchAdmissionDetail();
      }
    } catch (err) {
      console.error('Error converting to student:', err);
      alert(err.response?.data?.message || 'Failed to convert to student');
      setActionModal({ ...actionModal, loading: false });
    }
  };

  const downloadDocument = (documentData, fileName) => {
    if (!documentData) return;

    try {
      const link = document.createElement('a');
      link.href = documentData;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error downloading document:', err);
      alert('Failed to download document');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { icon: Clock, color: 'warning', label: 'Pending' },
      under_review: { icon: AlertCircle, color: 'info', label: 'Under Review' },
      approved: { icon: CheckCircle, color: 'success', label: 'Approved' },
      rejected: { icon: XCircle, color: 'danger', label: 'Rejected' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <div className={`status-badge badge-${config.color}`}>
        <Icon size={16} />
        <span>{config.label}</span>
      </div>
    );
  };

  const getActionButtons = () => {
    if (!admission) return null;

    return (
      <div className="action-buttons-group">
        {(admission.status === 'pending' || admission.status === 'under_review') && (
          <>
            <button
              onClick={() => handleActionClick('review')}
              className="btn btn-info"
              title="Start Review"
            >
              <AlertCircle size={18} />
              Start Review
            </button>
            <button
              onClick={() => handleActionClick('approve')}
              className="btn btn-success"
            >
              <CheckCircle size={18} />
              Approve
            </button>
            <button
              onClick={() => handleActionClick('reject')}
              className="btn btn-danger"
            >
              <XCircle size={18} />
              Reject
            </button>
          </>
        )}

        {admission.status === 'approved' && (
          <button
            onClick={handleConvertToStudent}
            className="btn btn-primary"
            title="Convert this student to permanent enrollment"
          >
            <UserPlus size={18} />
            Convert to Student
          </button>
        )}
      </div>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="admission-detail-container">
        <div className="loading-state">
          <Loader className="spinner" size={48} />
          <p>Loading admission details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admission-detail-container">
        <button onClick={() => navigate('/admissions')} className="btn btn-secondary">
          <ArrowLeft size={18} /> Back to Admissions
        </button>
        <div className="error-state">
          <XCircle size={48} />
          <h2>Error Loading Details</h2>
          <p>{error}</p>
          <button onClick={fetchAdmissionDetail} className="btn btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!admission) {
    return (
      <div className="admission-detail-container">
        <button onClick={() => navigate('/admissions')} className="btn btn-secondary">
          <ArrowLeft size={18} /> Back to Admissions
        </button>
        <div className="error-state">
          <FileText size={48} />
          <h2>Admission Not Found</h2>
          <p>The admission record you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admission-detail-container">
      {/* Header */}
      <div className="detail-header">
        <button onClick={() => navigate('/admissions')} className="btn btn-secondary">
          <ArrowLeft size={18} /> Back
        </button>

        <div className="header-info">
          <h1>Admission Application Details</h1>
          <p className="app-id">Application ID: {admission.applicationId}</p>
        </div>

        <div className="header-actions">
          {getStatusBadge(admission.status)}
        </div>
      </div>

      {/* Applicant Summary Card */}
      <div className="applicant-summary-card">
        <div className="applicant-avatar-section">
          {admission.passportPhoto ? (
            <img src={admission.passportPhoto} alt={admission.firstName} className="applicant-avatar" />
          ) : (
            <div className="applicant-avatar-placeholder">
              {admission.firstName.charAt(0)}
              {admission.lastName.charAt(0)}
            </div>
          )}
        </div>

        <div className="applicant-info-section">
          <div className="applicant-name">
            <h2>
              {admission.firstName} {admission.middleName && admission.middleName + ' '}
              {admission.lastName}
            </h2>
            <p className="applicant-class">{admission.appliedClass} {admission.appliedSection}</p>
          </div>

          <div className="applicant-quick-info">
            <div className="quick-info-item">
              <Calendar size={16} />
              <span>{formatDate(admission.appliedAt)}</span>
            </div>
            <div className="quick-info-item">
              <Heart size={16} />
              <span>{admission.dateOfBirth}</span>
            </div>
            <div className="quick-info-item">
              <Globe size={16} />
              <span>{admission.nationality}</span>
            </div>
          </div>
        </div>

        <div className="applicant-actions">
          {getActionButtons()}
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-navigation">
        <button
          className={`tab-button ${activeTab === 'personal' ? 'active' : ''}`}
          onClick={() => setActiveTab('personal')}
        >
          <User size={18} /> Personal Info
        </button>
        <button
          className={`tab-button ${activeTab === 'guardian' ? 'active' : ''}`}
          onClick={() => setActiveTab('guardian')}
        >
          <Users size={18} /> Guardian Info
        </button>
        <button
          className={`tab-button ${activeTab === 'academic' ? 'active' : ''}`}
          onClick={() => setActiveTab('academic')}
        >
          <BookOpen size={18} /> Academic Info
        </button>
        <button
          className={`tab-button ${activeTab === 'documents' ? 'active' : ''}`}
          onClick={() => setActiveTab('documents')}
        >
          <FileText size={18} /> Documents
        </button>
      </div>

      {/* Tab Content */}
      <div className="tabs-content">
        {/* Personal Information Tab */}
        {activeTab === 'personal' && (
          <div className="tab-pane personal-info">
            <h3>Personal Information</h3>
            <div className="info-grid">
              <div className="info-card">
                <label>First Name</label>
                <p>{admission.firstName}</p>
              </div>
              <div className="info-card">
                <label>Last Name</label>
                <p>{admission.lastName}</p>
              </div>
              <div className="info-card">
                <label>Middle Name</label>
                <p>{admission.middleName || 'N/A'}</p>
              </div>
              <div className="info-card">
                <label>Date of Birth</label>
                <p>{admission.dateOfBirth}</p>
              </div>
              <div className="info-card">
                <label>Gender</label>
                <p>{admission.gender}</p>
              </div>
              <div className="info-card">
                <label>Nationality</label>
                <p>{admission.nationality || 'Nigerian'}</p>
              </div>
              <div className="info-card">
                <label>Religion</label>
                <p>{admission.religion || 'N/A'}</p>
              </div>
              <div className="info-card">
                <label>Blood Group</label>
                <p>{admission.bloodGroup || 'N/A'}</p>
              </div>
            </div>

            <h3 style={{ marginTop: '30px' }}>Contact Information</h3>
            <div className="info-grid">
              <div className="info-card full-width">
                <label><Mail size={16} /> Email Address</label>
                <p>{admission.email || 'Not provided'}</p>
              </div>
              <div className="info-card">
                <label><Phone size={16} /> Phone Number</label>
                <p>{admission.phone || 'Not provided'}</p>
              </div>
              <div className="info-card full-width">
                <label><MapPin size={16} /> Residential Address</label>
                <p>{admission.address}</p>
              </div>
              <div className="info-card">
                <label>State of Origin</label>
                <p>{admission.stateOfOrigin}</p>
              </div>
              <div className="info-card">
                <label>Local Government Area</label>
                <p>{admission.lga}</p>
              </div>
            </div>
          </div>
        )}

        {/* Guardian Information Tab */}
        {activeTab === 'guardian' && (
          <div className="tab-pane guardian-info">
            <h3>Guardian / Parent Information</h3>
            <div className="info-grid">
              <div className="info-card full-width">
                <label><Users size={16} /> Guardian Name</label>
                <p>{admission.guardianName}</p>
              </div>
              <div className="info-card">
                <label>Relationship</label>
                <p>{admission.guardianRelationship}</p>
              </div>
              <div className="info-card">
                <label>Occupation</label>
                <p>{admission.guardianOccupation || 'Not provided'}</p>
              </div>
            </div>

            <h3 style={{ marginTop: '30px' }}>Guardian Contact Details</h3>
            <div className="info-grid">
              <div className="info-card">
                <label><Phone size={16} /> Phone Number</label>
                <p>{admission.guardianPhone}</p>
              </div>
              <div className="info-card">
                <label><Mail size={16} /> Email Address</label>
                <p>{admission.guardianEmail || 'Not provided'}</p>
              </div>
              <div className="info-card full-width">
                <label><MapPin size={16} /> Address</label>
                <p>{admission.guardianAddress || 'Same as student'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Academic Information Tab */}
        {activeTab === 'academic' && (
          <div className="tab-pane academic-info">
            <h3>Academic Information</h3>
            <div className="info-grid">
              <div className="info-card">
                <label><BookOpen size={16} /> Applied Class</label>
                <p className="class-badge-large">{admission.appliedClass}</p>
                   <p className="class-badge-large">{admission.appliedSection}</p>
              </div>
              <div className="info-card">
                <label>Academic Year</label>
                <p>{admission.academicYear}</p>
              </div>
              <div className="info-card">
                <label>Previous School</label>
                <p>{admission.previousSchool || 'Not provided'}</p>
              </div>
              <div className="info-card">
                <label>Previous Class</label>
                <p>{admission.previousClass || 'Not provided'}</p>
              </div>
            </div>

            {admission.entranceTestScore && (
              <>
                <h3 style={{ marginTop: '30px' }}>Entrance Examination Results</h3>
                <div className="info-grid">
                  <div className="info-card">
                    <label><Award size={16} /> Test Score</label>
                    <p className="score-display">{admission.entranceTestScore}/100</p>
                  </div>
                </div>
              </>
            )}

            {admission.interviewScheduled && (
              <>
                <h3 style={{ marginTop: '30px' }}>Interview Details</h3>
                <div className="info-grid">
                  <div className="info-card">
                    <label><Calendar size={16} /> Interview Date & Time</label>
                    <p>{formatDate(admission.interviewScheduled)}</p>
                  </div>
                  {admission.interviewNotes && (
                    <div className="info-card full-width">
                      <label>Interview Notes</label>
                      <p>{admission.interviewNotes}</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {admission.rejectionReason && (
              <>
                <h3 style={{ marginTop: '30px' }}>Rejection Details</h3>
                <div className="rejection-box">
                  <XCircle size={24} />
                  <div>
                    <p><strong>Reason for Rejection:</strong></p>
                    <p>{admission.rejectionReason}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Documents Tab */}
        {activeTab === 'documents' && (
          <div className="tab-pane documents-info">
            <h3>Uploaded Documents</h3>
            <div className="documents-grid">
              <div className="document-card">
                <div className="document-icon">
                  <FileCheck size={32} />
                </div>
                <h4>Passport Photo</h4>
                {admission.passportPhoto ? (
                  <>
                    <img src={admission.passportPhoto} alt="Passport" className="doc-preview" />
                    <button
                      onClick={() => downloadDocument(admission.passportPhoto, 'passport-photo')}
                      className="btn btn-small"
                    >
                      <Download size={14} /> Download
                    </button>
                  </>
                ) : (
                  <p className="not-provided">Not uploaded</p>
                )}
              </div>

              <div className="document-card">
                <div className="document-icon">
                  <FileText size={32} />
                </div>
                <h4>Birth Certificate</h4>
                {admission.birthCertificate ? (
                  <button
                    onClick={() => downloadDocument(admission.birthCertificate, 'birth-certificate')}
                    className="btn btn-small"
                  >
                    <Download size={14} /> Download
                  </button>
                ) : (
                  <p className="not-provided">Not uploaded</p>
                )}
              </div>

              <div className="document-card">
                <div className="document-icon">
                  <FileText size={32} />
                </div>
                <h4>Transfer Certificate</h4>
                {admission.transferCertificate ? (
                  <button
                    onClick={() => downloadDocument(admission.transferCertificate, 'transfer-certificate')}
                    className="btn btn-small"
                  >
                    <Download size={14} /> Download
                  </button>
                ) : (
                  <p className="not-provided">Not uploaded</p>
                )}
              </div>

              <div className="document-card">
                <div className="document-icon">
                  <FileText size={32} />
                </div>
                <h4>Medical Report</h4>
                {admission.medicalReport ? (
                  <button
                    onClick={() => downloadDocument(admission.medicalReport, 'medical-report')}
                    className="btn btn-small"
                  >
                    <Download size={14} /> Download
                  </button>
                ) : (
                  <p className="not-provided">Not uploaded</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Modal */}
      {actionModal.isOpen && (
        <div className="modal-overlay" onClick={() => !actionModal.loading && setActionModal({ ...actionModal, isOpen: false })}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {actionModal.type === 'approve' && <>
                  <CheckCircle size={24} /> Approve Application
                </>}
                {actionModal.type === 'reject' && <>
                  <XCircle size={24} /> Reject Application
                </>}
                {actionModal.type === 'review' && <>
                  <AlertCircle size={24} /> Start Review
                </>}
              </h2>
              <button
                className="close-button"
                onClick={() => !actionModal.loading && setActionModal({ ...actionModal, isOpen: false })}
                disabled={actionModal.loading}
              >
                <X size={24} />
              </button>
            </div>

            <div className="modal-body">
              <div className="applicant-summary-modal">
                <p><strong>Applicant:</strong> {admission.firstName} {admission.lastName}</p>
                <p><strong>Application ID:</strong> {admission.applicationId}</p>
                <p><strong>Applied Class:</strong> {admission.appliedClass}</p>
              </div>

              {/* Reviewed By */}
              <div className="form-group">
                <label>Reviewed By *</label>
                <input
                  type="text"
                  name="reviewedBy"
                  value={formData.reviewedBy}
                  onChange={handleFormChange}
                  placeholder="Your name or username"
                  disabled={actionModal.loading}
                />
              </div>

              {/* Rejection Reason - Only for Reject */}
              {actionModal.type === 'reject' && (
                <div className="form-group">
                  <label>Rejection Reason *</label>
                  <textarea
                    name="rejectionReason"
                    value={formData.rejectionReason}
                    onChange={handleFormChange}
                    placeholder="Please provide a detailed reason for rejection..."
                    rows="4"
                    disabled={actionModal.loading}
                  />
                </div>
              )}

              {/* Review/Approve Additional Info */}
              {(actionModal.type === 'review' || actionModal.type === 'approve') && (
                <>
                  <div className="form-group">
                    <label>Interview Scheduled</label>
                    <input
                      type="datetime-local"
                      name="interviewScheduled"
                      value={formData.interviewScheduled}
                      onChange={handleFormChange}
                      disabled={actionModal.loading}
                    />
                  </div>

                  <div className="form-group">
                    <label>Entrance Test Score (out of 100)</label>
                    <input
                      type="number"
                      name="entranceTestScore"
                      value={formData.entranceTestScore}
                      onChange={handleFormChange}
                      min="0"
                      max="100"
                      placeholder="Enter score"
                      disabled={actionModal.loading}
                    />
                  </div>

                  <div className="form-group">
                    <label>Interview Notes</label>
                    <textarea
                      name="interviewNotes"
                      value={formData.interviewNotes}
                      onChange={handleFormChange}
                      placeholder="Add any observations or notes from the interview..."
                      rows="3"
                      disabled={actionModal.loading}
                    />
                  </div>
                </>
              )}
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setActionModal({ ...actionModal, isOpen: false })}
                disabled={actionModal.loading}
              >
                Cancel
              </button>
              <button
                className={`btn ${
                  actionModal.type === 'approve'
                    ? 'btn-success'
                    : actionModal.type === 'reject'
                    ? 'btn-danger'
                    : 'btn-primary'
                }`}
                onClick={handleActionSubmit}
                disabled={actionModal.loading}
              >
                {actionModal.loading ? (
                  <>
                    <Loader size={18} className="spinner-small" />
                    Processing...
                  </>
                ) : (
                  <>
                    {actionModal.type === 'approve' && <>
                      <CheckCircle size={18} /> Approve
                    </>}
                    {actionModal.type === 'reject' && <>
                      <XCircle size={18} /> Reject
                    </>}
                    {actionModal.type === 'review' && <>
                      <AlertCircle size={18} /> Start Review
                    </>}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdmissionDetail;