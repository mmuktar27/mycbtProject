import React, { useState, useEffect } from 'react';


import { Modal, Button, Form, InputGroup, Alert, Spinner } from 'react-bootstrap';
import AlertModal from '../components/alertsModal' // Adjust path as needed

export default function ActivateButton({refetchActivation, isActivated, activatedAt,setAlertConfig,setShowAlertModal}) {
  const [showModal, setShowModal] = useState(false);
  const [systemId, setSystemId] = useState('Loading...');
  const [copied, setCopied] = useState(false);
  const [activationKey, setActivationKey] = useState('');

  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [activationDate, setActivationDate] = useState(null);

  // Get real system ID and check activation status
  useEffect(() => {
    const getSystemData = async () => {
      try {
        // Get real hardware ID
        const systemResponse = await fetch('/api/system-id');
        const systemData = await systemResponse.json();
        
        if (systemData.systemId) {
          setSystemId(systemData.systemId);
          
          // Check if this system is already activated
          const statusResponse = await fetch(`/api/check-activation-status/${systemData.systemId}`);
          const statusData = await statusResponse.json();
          
          if (statusData.isActivated) {
            setActivationKey(statusData.activationKey);
            setActivationDate(statusData.activatedAt);
          }
        } else {
          setSystemId('ERROR: Unable to retrieve system ID');
        }
      } catch (error) {
        console.error('Error fetching system data:', error);
        setSystemId('ERROR: Connection failed');
      } finally {
        setLoading(false);
      }
    };

    getSystemData();
  }, []);

  const handleShowModal = () => setShowModal(true);
  const handleCloseModal = () => {
    setShowModal(false);
    setCopied(false);
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(systemId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }).catch(err => {
      console.error('Failed to copy:', err);
      alert('Failed to copy to clipboard');
    });
  };

const handleActivate = async () => {
  if (!activationKey.trim()) {
    setAlertConfig({
      type: 'error',
      title: 'Activation Error!',
      message: `Please enter an activation key`
    });
    setShowAlertModal(true);
    return;
  }

  setActivating(true);

  try {
    const response = await fetch('/api/activate-system', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        systemId: systemId,
        activationKey: activationKey.trim().toUpperCase()
      })
    });

    const data = await response.json();

    if (data.success) {
      // Refetch activation status FIRST
      if (typeof refetchActivation === 'function') {
        await refetchActivation();
      }
      
      // THEN close the activation modal
      handleCloseModal();
      
      // THEN show success alert AFTER a small delay
      setTimeout(() => {
        setAlertConfig({
          type: 'success',
          title: 'Activation Successful!',
          message: '✅ System activated successfully!'
        });
        setShowAlertModal(true);
      }, 100); // Small delay to ensure modal is closed first

    } else {
      setAlertConfig({
        type: 'error',
        title: 'Activation Failed!',
        message: data.message || 'Invalid activation key! Please contact administrator.'
      });
      setShowAlertModal(true);
    }
  } catch (error) {
    console.error('Activation error:', error);
    setAlertConfig({
      type: 'error',
      title: 'Activation Failed!',
      message: '❌ Failed to activate system. Please check your connection and try again.'
    });
    setShowAlertModal(true);
  } finally {
    setActivating(false);
  }
};

  return (
    <>
      {/* Activate Button */}
      <Button 
        variant={isActivated ? "success" : "warning"}
        onClick={handleShowModal}
        className="px-4"
      >
        <i className={`fas ${isActivated ? 'fa-check-circle' : 'fa-key'} me-2`}></i>
        {isActivated ? 'Activated' : 'Activate'}
      </Button>

      {/* Activation Modal */}
      <Modal show={showModal} onHide={handleCloseModal} centered size="lg">
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>
            <i className="fas fa-shield-alt me-2"></i>
            System Activation
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {isActivated && (
            <Alert variant="success" className="d-flex align-items-center">
              <i className="fas fa-check-circle me-2 fs-4"></i>
              <div className="flex-grow-1">
                <strong>System is Activated!</strong>
                <p className="mb-0 small">
                  Activated on: {activationDate ? new Date(activationDate).toLocaleDateString() : activatedAt}
                </p>
              </div>
            </Alert>
          )}

          {/* System ID Section */}
          <div className="mb-4">
            <label className="form-label fw-bold">
              <i className="fas fa-desktop me-2"></i>
              Hardware System ID
            </label>
            <InputGroup>
              <Form.Control
                type="text"
                value={loading ? 'Loading...' : systemId}
                readOnly
                className="bg-light"
                style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
              />
              <Button 
                variant="outline-primary" 
                onClick={handleCopyToClipboard}
                title="Copy to clipboard"
                disabled={loading || systemId.includes('ERROR')}
              >
                <i className={`fas ${copied ? 'fa-check' : 'fa-copy'}`}></i>
              </Button>
            </InputGroup>
            {copied && (
              <small className="text-success">
                <i className="fas fa-check me-1"></i>
                Copied to clipboard!
              </small>
            )}
            <small className="text-muted d-block mt-2">
              <i className="fas fa-info-circle me-1"></i>
              This is your unique hardware ID. Share it with your administrator to receive an activation key.
            </small>
          </div>

          {/* Activation Key Input */}
          {!isActivated && (
            <div className="mb-3">
              <label className="form-label fw-bold">
                <i className="fas fa-key me-2"></i>
                Activation Key
              </label>
              <Form.Control
                type="text"
                placeholder="Enter your activation key (e.g., XXXX-XXXX-XXXX-XXXX)"
                value={activationKey}
                onChange={(e) => setActivationKey(e.target.value.toUpperCase())}
                className="mb-2"
                disabled={systemId.includes('ERROR') || activating}
                style={{ fontFamily: 'monospace' }}
              />
              <small className="text-muted">
                <i className="fas fa-lock me-1"></i>
                Enter the activation key provided by your administrator.
              </small>
            </div>
          )}

          {/* Status Information */}
          <div className="border rounded p-3 bg-light">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-muted">Status:</span>
              <span className={`badge ${isActivated ? 'bg-success' : 'bg-warning'}`}>
                {isActivated ? 'Activated' : 'Not Activated'}
              </span>
            </div>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-muted">Hardware ID:</span>
              <span className="badge bg-secondary" style={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>
                {loading ? 'Loading...' : systemId.substring(0, 20)}...
              </span>
            </div>
            {isActivated && activationKey && (
              <div className="d-flex justify-content-between align-items-center">
                <span className="text-muted">Activation Key:</span>
                <span className="badge bg-info text-dark" style={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>
                  {activationKey.substring(0, 8)}...
                </span>
              </div>
            )}
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Close
          </Button>
          {!isActivated && (
            <Button 
              variant="primary" 
              onClick={handleActivate}
              disabled={loading || systemId.includes('ERROR') || activating || !activationKey.trim()}
            >
              {activating ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Activating...
                </>
              ) : (
                <>
                  <i className="fas fa-check me-2"></i>
                  Activate Now
                </>
              )}
            </Button>
          )}
        </Modal.Footer>
      </Modal>


    </>
  );
}

// Usage in your navbar or parent component:
/*
import ActivateButton from './components/ActivateButton';

// In your navbar or wherever you want the button:
<ActivateButton />
*/