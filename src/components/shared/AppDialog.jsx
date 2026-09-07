import React from 'react';
import { CheckCircle, AlertTriangle, AlertCircle, Info, Loader, X } from 'lucide-react';
import './AppDialog.css'; // reuse your existing dialog-* class names here

const ICONS = {
  success: { Icon: CheckCircle, className: 'success' },
  error: { Icon: AlertTriangle, className: 'error' },
  warning: { Icon: AlertCircle, className: 'warning' },
  info: { Icon: Info, className: 'info' },
  confirm: { Icon: AlertCircle, className: 'confirm' }
};

const BUTTON_VARIANT = {
  success: 'success',
  error: 'danger',
  confirm: 'primary',
  warning: 'primary',
  info: 'primary'
};

const AppDialog = ({
  isOpen,
  type = 'info',
  title,
  message,
  details = '',
  actionLabel = 'Close',
  onAction = null,
  onClose,
  showCancel = false,
  actionLoading = false
}) => {
  if (!isOpen) return null;

  const { Icon } = ICONS[type] || ICONS.info;

  const handleAction = () => {
    if (onAction) {
      onAction();
    } else {
      onClose();
    }
  };

  return (
    <div className="dialog-overlay" onClick={() => !actionLoading && onClose()}>
      <div className="dialog-box" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-content">
          <div className="dialog-icon-container">
            <Icon className={`dialog-icon ${type}`} size={48} />
          </div>

          <h2 className="dialog-title">{title}</h2>
          {message && <p className="dialog-message">{message}</p>}

          {details && (
            <div className="dialog-details">
              {details.split('\n').map((line, index) => (
                <p key={index}>{line}</p>
              ))}
            </div>
          )}
        </div>

        <div className="dialog-footer">
          {showCancel && (
            <button
              className="btn btn-secondary"
              onClick={onClose}
              disabled={actionLoading}
            >
              Cancel
            </button>
          )}
          <button
            className={`btn btn-${BUTTON_VARIANT[type] || 'primary'}`}
            onClick={handleAction}
            disabled={actionLoading}
          >
            {actionLoading && <Loader size={18} className="spinner-inline" />}
            {actionLoading ? 'Processing...' : actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppDialog;