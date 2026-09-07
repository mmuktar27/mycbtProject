import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft, Download, Eye, FileText, User, Users, BookOpen, Calendar,
  Phone, Mail, MapPin, Briefcase, Award, AlertCircle, CheckCircle,
  XCircle, Clock, Save, X, Loader, FileCheck, Heart, Globe,UserPlus
} from 'lucide-react';
import './AdmissionDetail.css';
import AdmissionActionModal from './AdmissionActionModal';
import AppDialog from '../shared/AppDialog';
import { useAppDialog } from '../../hooks/useAppDialog';
const AdmissionDetail = () => {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const [admission, setAdmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('personal'); // personal, guardian, academic, documents
  const [actionModal, setActionModal] = useState({
    isOpen: false,
    type: '', // approve, reject, review
    loading: false
  });
  const { dialog, showDialog, closeDialog, handleDialogAction } = useAppDialog();
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

const [classes, setClasses] = useState([]);

useEffect(() => {
  fetchAdmissionDetail();
  fetchClasses();
}, [applicationId]);

const fetchClasses = async () => {
  try {
    const response = await axios.get('/api/classes');
    if (response.data.success) setClasses(response.data.data);
  } catch (err) {
    console.error('Error fetching classes:', err);
  }
};

const handleActionClick = (type) => {
  const resolvedType = type === 'approve' ? 'approve-and-enroll' : type;
  setActionModal({ isOpen: true, type: resolvedType, loading: false });
  setFormData({
    reviewedBy: 'Admin',
    rejectionReason: '',
    interviewScheduled: '',
    entranceTestScore: '',
    interviewNotes: '',
    selectedClassId: '',
    rollNumber: ''
  });
};
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



  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
 const handleConvertToStudent = () => {
  setActionModal({ isOpen: true, type: 'convert-to-student', loading: false });
  setFormData({
    reviewedBy: 'Admin',
    rejectionReason: '',
    interviewScheduled: '',
    entranceTestScore: '',
    interviewNotes: '',
    selectedClassId: '',
    rollNumber: ''
  });
};

const handleActionSubmit = async () => {
  try {
    if (actionModal.type === 'approve-and-enroll') {
      let finalClassId = formData.selectedClassId;

      if (!finalClassId) {
        const appliedClass = classes.find(c =>
          c.className === admission.appliedClass && c.section === admission.appliedSection
        );
        if (appliedClass) {
          finalClassId = appliedClass.id;
        } else {
          showDialog('warning', 'Missing Information', 'Could not determine class assignment. Please select a class manually.');

          return;
        }
      }

      setActionModal(prev => ({ ...prev, loading: true }));

      const response = await axios.post(
        `/api/admissions/${applicationId}/approve-and-enroll`,
        {
          reviewedBy: formData.reviewedBy,
          interviewScheduled: formData.interviewScheduled,
          interviewNotes: formData.interviewNotes,
          entranceTestScore: formData.entranceTestScore,
          selectedClassId: finalClassId,
          section: formData.selectedSection || admission.appliedSection,
          rollNumber: formData.rollNumber
        }
      );

      if (response.data.success) {
        
        setActionModal({ isOpen: false, type: '', loading: false });
        fetchAdmissionDetail();
        showDialog(
  'success',
  'Student Enrolled',
  'The application was approved and the student has been enrolled.',
  `Student ID: ${response.data.data.studentId}\nAdmission Number: ${response.data.data.admissionNumber}\nStudent Number: ${response.data.data.studentNumber}`
);
      } else {
        setActionModal(prev => ({ ...prev, loading: false }));
      }
      return; // safe now — no shared finally to fight with
    }

    // reject / review path
    if (actionModal.type === 'reject' && !formData.rejectionReason.trim()) {
showDialog('warning', 'Missing Information', 'Please provide a rejection reason.');
      return;
    }
if (actionModal.type === 'convert-to-student') {
      let finalClassId = formData.selectedClassId;

      if (!finalClassId) {
        const appliedClass = classes.find(c =>
          c.className === admission.appliedClass && c.section === admission.appliedSection
        );
        if (appliedClass) {
          finalClassId = appliedClass.id;
        } else {
showDialog('warning', 'Missing Information', 'Could not determine class assignment. Please select a class manually.');
          return;
        }
      }

      setActionModal(prev => ({ ...prev, loading: true }));

      const response = await axios.post(
        `/api/admissions/${applicationId}/convert-to-student`,
        {
          selectedClassId: finalClassId,
          section: formData.selectedSection || admission.appliedSection,
          rollNumber: formData.rollNumber
        }
      );

      if (response.data.success) {
       
        setActionModal({ isOpen: false, type: '', loading: false });
        fetchAdmissionDetail();
        showDialog(
  'success',
  'Student Created',
  'The student record was created successfully.',
  `Student ID: ${response.data.data.studentId}\nAdmission Number: ${response.data.data.admissionNumber}\nStudent Number: ${response.data.data.studentNumber}`
);
      } else {
        setActionModal(prev => ({ ...prev, loading: false }));
      }
      return;
    }

    setActionModal(prev => ({ ...prev, loading: true }));

    const status = actionModal.type === 'reject' ? 'rejected' : 'under_review';
    const response = await axios.put(`/api/admissions/${applicationId}/status`, { ...formData, status });

    if (response.data.success) {

      setActionModal({ isOpen: false, type: '', loading: false });
      fetchAdmissionDetail();
      showDialog('success', 'Success', response.data.message);
    }
  } catch (err) {
    console.error('Error updating status:', err);
    setActionModal(prev => ({ ...prev, loading: false }));
    showDialog('error', 'Update Failed', err.response?.data?.message || 'Failed to update admission.');
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
      showDialog('error', 'Download Failed', 'Failed to download document.');
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

        {admission.status === 'approved' && !admission.studentId && (
  <button
    onClick={handleConvertToStudent}
    className="btn btn-primary"
    title="Convert this student to permanent enrollment"
  >
    <UserPlus size={18} />
    Convert to Student
  </button>
)}

{admission.studentId && (
  <div className="already-enrolled-note">
    <CheckCircle size={18} />
    Already enrolled — Student ID: {admission.studentId}
  </div>
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
        <button onClick={() => navigate('/admission/approved')} className="btn btn-secondary">
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
        <button onClick={() => navigate('/admission/approved')} className="btn btn-secondary">
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
        <button onClick={() => navigate('/admission/approved')} className="btn btn-secondary">
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


      <AdmissionActionModal
  isOpen={actionModal.isOpen}
  actionType={actionModal.type}
  selectedAdmission={admission}
  actionData={formData}
  setActionData={setFormData}
  classes={classes}
  isSubmitting={actionModal.loading}
  showClassAssignment={true}   // now matches AdmissionsList
  onClose={() => setActionModal({ ...actionModal, isOpen: false })}
  onSubmit={handleActionSubmit}
/>


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
    </div>
  );
};

export default AdmissionDetail;