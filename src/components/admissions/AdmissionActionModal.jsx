import React from 'react';
import {
  X, CheckCircle, XCircle, AlertCircle, Info, Loader
} from 'lucide-react';

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

  return (
    <div className="modal-overlay" onClick={() => !isSubmitting && onClose()}>
      <div className="modal-content-wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            {actionType === 'approve-and-enroll' && '✅ Approve & Enroll Student'}
            {actionType === 'reject' && '❌ Reject Application'}
            {actionType === 'review' && '📋 Start Review'}
          </h3>
          <button className="modal-close" onClick={() => !isSubmitting && onClose()} disabled={isSubmitting}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Applicant Summary */}
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

        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-secondary" disabled={isSubmitting}>
            <X size={18} /> Cancel
          </button>
          <button
            onClick={onSubmit}
            className={`btn ${
              actionType === 'approve-and-enroll' ? 'btn-success'
              : actionType === 'reject' ? 'btn-danger'
              : 'btn-primary'
            }`}
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
  );
};

// --- Review-specific fields, split out on its own so it's easy to reuse/test ---
const ReviewFields = ({ actionData, setActionData, isSubmitting }) => (
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
);

// Stubs — move the reject/approve JSX blocks from AdmissionsList.js into these
const RejectFields = ({ actionData, setActionData, isSubmitting }) => { /* ...reject fields JSX... */ };
const ApproveAndEnrollFields = ({ actionData, setActionData, classes, selectedAdmission, isSubmitting }) => { /* ...approve fields JSX... */ };

export default AdmissionActionModal;
export { ReviewFields, RejectFields, ApproveAndEnrollFields };