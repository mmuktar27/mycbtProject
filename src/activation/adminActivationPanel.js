

import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, InputGroup, Alert, Spinner } from 'react-bootstrap';

import AlertModal from '../components/alertsModal' // Adjust path as needed


export function AdminActivationPanel() {
  const [systemId, setSystemId] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [generatedKey, setGeneratedKey] = useState('');
  const [generating, setGenerating] = useState(false);
  const [activationsList, setActivationsList] = useState([]);
  const [loading, setLoading] = useState(true);
const [showAlertModal, setShowAlertModal] = useState(false);
const [alertConfig, setAlertConfig] = useState({
  type: 'success',
  title: '',
  message: ''
});
  useEffect(() => {
    loadActivations();
  }, []);

  const loadActivations = async () => {
    try {
      const response = await fetch('/api/admin/activations-list');
      const data = await response.json();
      if (data.success) {
        setActivationsList(data.activations);
      }
    } catch (error) {
      console.error('Error loading activations:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateKey = async () => {
    if (!systemId.trim() || !adminPassword.trim()) {
     // alert('Please enter both System ID and Admin Password');
       setAlertConfig({
        type: 'error',
        title: 'Failed!',
        message:  'Please enter both System ID and Admin Password'
      });
      setShowAlertModal(true);
      return;
    }

    setGenerating(true);

    try {
      const response = await fetch('/api/admin/generate-activation-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          systemId: systemId.trim(),
          adminPassword: adminPassword
        })
      });

      const data = await response.json();

      if (data.success) {
        setGeneratedKey(data.activationKey);
        //alert('✅ Activation key generated successfully!');
          setAlertConfig({
        type: 'success',
        title: 'Activation key generated Successful!',
        message: '✅ Activation key generated successfully!'
      });
      setShowAlertModal(true);
        loadActivations(); // Refresh list
      } else {
        alert(`❌ ${data.message || 'Failed to generate key'}`);
      }
    } catch (error) {
      console.error('Key generation error:', error);
     // alert('❌ Failed to generate key. Please try again.');
       setAlertConfig({
        type: 'error',
        title: ' Failed to generate key!',
        message:  '❌ Failed to generate key. Please try again.'
      });
      setShowAlertModal(true);
    } finally {
      setGenerating(false);
    }
  };

  const copyKey = (key) => {
    navigator.clipboard.writeText(key);
    alert('✅ Activation key copied to clipboard!');
  };

  return (
    <div className="container mt-5">
      <div className="row">
        <div className="col-md-6">
          <div className="card shadow">
            <div className="card-header bg-danger text-white">
              <h4 className="mb-0">
                <i className="fas fa-user-shield me-2"></i>
                Admin - Generate Activation Key
              </h4>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label fw-bold">System ID:</label>
                <input
                  type="text"
                  className="form-control"
                  value={systemId}
                  onChange={(e) => setSystemId(e.target.value.toUpperCase())}
                  placeholder="Enter system ID from user"
                  style={{ fontFamily: 'monospace' }}
                />
              </div>
              <div className="mb-3">
                <label className="form-label fw-bold">Admin Password:</label>
                <input
                  type="password"
                  className="form-control"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Enter admin password"
                />
              </div>
              <button 
                className="btn btn-danger w-100" 
                onClick={generateKey}
                disabled={generating}
              >
                {generating ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <i className="fas fa-key me-2"></i>
                    Generate Activation Key
                  </>
                )}
              </button>

              {generatedKey && (
                <div className="alert alert-success mt-3">
                  <strong>Activation Key Generated:</strong>
                  <div className="d-flex justify-content-between align-items-center mt-2">
                    <code style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{generatedKey}</code>
                    <Button 
                      variant="outline-success" 
                      size="sm"
                      onClick={() => copyKey(generatedKey)}
                    >
                      <i className="fas fa-copy"></i>
                    </Button>
                  </div>
                  <small className="text-muted d-block mt-2">
                    Send this key to the user for system activation.
                  </small>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card shadow">
            <div className="card-header bg-info text-white">
              <h4 className="mb-0">
                <i className="fas fa-list me-2"></i>
                Active Systems
              </h4>
            </div>
            <div className="card-body" style={{ maxHeight: '500px', overflowY: 'auto' }}>
              {loading ? (
                <div className="text-center">
                  <Spinner animation="border" />
                </div>
              ) : activationsList.length === 0 ? (
                <p className="text-muted text-center">No activated systems yet</p>
              ) : (
                <div className="list-group">
                  {activationsList.map((activation, index) => (
                    <div key={index} className="list-group-item">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h6 className="mb-1">
                            <i className="fas fa-desktop me-2 text-primary"></i>
                            System {index + 1}
                          </h6>
                          <p className="mb-1 small text-muted" style={{ fontFamily: 'monospace' }}>
                            ID: {activation.systemId}
                          </p>
                          <p className="mb-0 small text-success">
                            <i className="fas fa-check-circle me-1"></i>
                            {activation.status === 'active' ? 'Active' : 'Inactive'}
                          </p>
                        </div>
                        <Button 
                          variant="outline-secondary" 
                          size="sm"
                          onClick={() => copyKey(activation.activationKey)}
                        >
                          <i className="fas fa-copy"></i>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>


       <AlertModal 
  show={showAlertModal}
  onHide={() => setShowAlertModal(false)}
  type={alertConfig.type}
  title={alertConfig.title}
  message={alertConfig.message}
/>
    </div>
  );
}