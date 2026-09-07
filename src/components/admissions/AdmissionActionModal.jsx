import React from 'react';
import {
  X, CheckCircle, XCircle, AlertCircle, Info, Loader
} from 'lucide-react';
import './AdmissionActionModal.css';

const AdmissionActionModal = ({
  isOpen,
  actionType,
  selectedAdmission,
  actionData,
  setActionData,
  classes,
  isSubmitting,
  onClose,
  onSubmit
}) => {
  if (!isOpen) return null;

  const titles = {
    'approve-and-enroll': '✅ Approve & Enroll Student',
    'convert-to-student': '🎓 Convert to Student',
    'reject': '❌ Reject Application',
    'review': '📋 Start Review'
  };

  const buttonClass = {
    'approve-and-enroll': 'admission-modal-btn-success',
    'convert-to-student': 'admission-modal-btn-success',
    'reject': 'admission-modal-btn-danger',
    'review': 'admission-modal-btn-primary'
  };

  const buttonLabel = {
    'approve-and-enroll': { idle: <><CheckCircle size={18} /> Approve & Enroll</>, busy: 'Approving...' },
    'convert-to-student': { idle: <><CheckCircle size={18} /> Convert to Student</>, busy: 'Converting...' },
    'reject': { idle: <><XCircle size={18} /> Reject Application</>, busy: 'Rejecting...' },
    'review': { idle: <><AlertCircle size={18} /> Start Review</>, busy: 'Processing...' }
  };

  const needsClassPicker = actionType === 'approve-and-enroll' || actionType === 'convert-to-student';

  return (
    <div className="admission-modal-overlay" onClick={() => !isSubmitting && onClose()}>
      <div className="admission-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="admission-modal-header">
          <h3>{titles[actionType] || ''}</h3>
          <button className="admission-modal-close" onClick={() => !isSubmitting && onClose()} disabled={isSubmitting}>
            <X size={20} />
          </button>
        </div>

        <div className="admission-modal-body">
          {/* Applicant Summary */}
          <div className="admission-modal-summary">
            <div className="admission-modal-summary-grid">
              <div><strong>Applicant:</strong> {selectedAdmission?.firstName} {selectedAdmission?.lastName}</div>
              <div>
                <strong>Applied Class:</strong> {selectedAdmission?.appliedClass}
                {selectedAdmission?.appliedSection && ` - Section ${selectedAdmission?.appliedSection}`}
              </div>
              <div><strong>Application ID:</strong> {selectedAdmission?.applicationId}</div>
              <div><strong>Gender:</strong> {selectedAdmission?.gender}</div>
            </div>
          </div>

          {needsClassPicker && (
            <ApproveAndEnrollFields
              actionData={actionData}
              setActionData={setActionData}
              classes={classes}
              selectedAdmission={selectedAdmission}
              isSubmitting={isSubmitting}
            />
          )}

          {actionType === 'reject' && (
            <RejectFields
              actionData={actionData}
              setActionData={setActionData}
              isSubmitting={isSubmitting}
            />
          )}

          {actionType === 'review' && (
            <ReviewFields
              actionData={actionData}
              setActionData={setActionData}
              isSubmitting={isSubmitting}
            />
          )}
        </div>

        <div className="admission-modal-footer">
          <button onClick={onClose} className="admission-modal-btn admission-modal-btn-secondary" disabled={isSubmitting}>
            <X size={18} /> Cancel
          </button>
          <button
            onClick={onSubmit}
            className={`admission-modal-btn ${buttonClass[actionType] || 'admission-modal-btn-primary'}`}
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader size={18} className="admission-modal-spinner-inline" />}
            {isSubmitting ? (buttonLabel[actionType]?.busy || 'Processing...') : (buttonLabel[actionType]?.idle || null)}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Review-specific fields ---
const ReviewFields = ({ actionData, setActionData, isSubmitting }) => (
  <div className="admission-modal-form-grid-2col">
    <div className="admission-modal-form-group">
      <label>Reviewed By</label>
      <input
        type="text"
        value={actionData.reviewedBy}
        onChange={(e) => setActionData({ ...actionData, reviewedBy: e.target.value })}
        disabled={isSubmitting}
        className="admission-modal-form-input"
      />
    </div>
    <div className="admission-modal-form-group">
      <label>Interview Scheduled</label>
      <input
        type="datetime-local"
        value={actionData.interviewScheduled}
        onChange={(e) => setActionData({ ...actionData, interviewScheduled: e.target.value })}
        disabled={isSubmitting}
        className="admission-modal-form-input"
      />
    </div>
    <div className="admission-modal-form-group">
      <label>Entrance Test Score</label>
      <input
        type="number"
        min="0"
        max="100"
        value={actionData.entranceTestScore}
        onChange={(e) => setActionData({ ...actionData, entranceTestScore: e.target.value })}
        placeholder="Score out of 100"
        disabled={isSubmitting}
        className="admission-modal-form-input"
      />
    </div>
    <div className="admission-modal-form-group admission-modal-full-width">
      <label>Interview Notes</label>
      <textarea
        value={actionData.interviewNotes}
        onChange={(e) => setActionData({ ...actionData, interviewNotes: e.target.value })}
        rows="4"
        placeholder="Add any notes or observations..."
        disabled={isSubmitting}
        className="admission-modal-form-textarea"
      />
    </div>
  </div>
);

// --- Reject-specific fields ---
const RejectFields = ({ actionData, setActionData, isSubmitting }) => (
  <div className="admission-modal-form-grid-2col">
    <div className="admission-modal-form-group admission-modal-full-width">
      <label>Rejection Reason <span className="admission-modal-required">*</span></label>
      <textarea
        value={actionData.rejectionReason}
        onChange={(e) => setActionData({ ...actionData, rejectionReason: e.target.value })}
        rows="4"
        placeholder="Explain why this application is being rejected..."
        disabled={isSubmitting}
        className="admission-modal-form-textarea"
      />
    </div>
  </div>
);

// --- Approve & Enroll / Convert to Student fields (class assignment) ---
const ApproveAndEnrollFields = ({ actionData, setActionData, classes, selectedAdmission, isSubmitting }) => {
  const matchingClasses = classes.filter(c => c.className === selectedAdmission?.appliedClass);
  const hasAutoMatch = matchingClasses.some(c => c.section === selectedAdmission?.appliedSection);

  return (
    <div className="admission-modal-form-grid-2col">
      {!hasAutoMatch && (
        <div className="admission-modal-alert admission-modal-alert-warning admission-modal-full-width">
          <AlertCircle size={20} />
          <div>
            <strong>Class assignment needed</strong>
            <p>We couldn't automatically match the applied class/section to an existing class. Please select one below.</p>
          </div>
        </div>
      )}

      <div className="admission-modal-form-group">
        <label>Assign to Class <span className="admission-modal-required">*</span></label>
        <select
          value={actionData.selectedClassId || ''}
          onChange={(e) => setActionData({ ...actionData, selectedClassId: e.target.value })}
          disabled={isSubmitting}
          className="admission-modal-form-select"
        >
          <option value="">-- Select a class --</option>
          {classes.map(cls => (
            <option key={cls.id} value={cls.id}>
              {cls.className} {cls.section ? `- ${cls.section}` : ''} ({cls.currentStudents}/{cls.capacity})
            </option>
          ))}
        </select>
      </div>

      <div className="admission-modal-form-group">
        <label>Roll Number</label>
        <input
          type="text"
          value={actionData.rollNumber || ''}
          onChange={(e) => setActionData({ ...actionData, rollNumber: e.target.value })}
          placeholder="Optional"
          disabled={isSubmitting}
          className="admission-modal-form-input"
        />
      </div>

      <div className="admission-modal-form-group">
        <label>Reviewed By</label>
        <input
          type="text"
          value={actionData.reviewedBy}
          onChange={(e) => setActionData({ ...actionData, reviewedBy: e.target.value })}
          disabled={isSubmitting}
          className="admission-modal-form-input"
        />
      </div>

      <div className="admission-modal-form-group">
        <label>Entrance Test Score</label>
        <input
          type="number"
          min="0"
          max="100"
          value={actionData.entranceTestScore}
          onChange={(e) => setActionData({ ...actionData, entranceTestScore: e.target.value })}
          placeholder="Score out of 100"
          disabled={isSubmitting}
          className="admission-modal-form-input"
        />
      </div>

      <div className="admission-modal-form-group admission-modal-full-width">
        <label>Interview Notes</label>
        <textarea
          value={actionData.interviewNotes}
          onChange={(e) => setActionData({ ...actionData, interviewNotes: e.target.value })}
          rows="3"
          placeholder="Add any notes or observations..."
          disabled={isSubmitting}
          className="admission-modal-form-textarea"
        />
      </div>
    </div>
  );
};

export default AdmissionActionModal;
export { ReviewFields, RejectFields, ApproveAndEnrollFields };