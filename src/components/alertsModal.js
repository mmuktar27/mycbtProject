import React from 'react';
import { Modal } from 'react-bootstrap';

const AlertModal = ({ show, onHide, type = 'success', title, message }) => {
  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Body className="text-center py-5">
        <div className="mb-4">
          {type === 'success' ? (
            <div style={{ width: '80px', height: '80px', margin: '0 auto' }}>
              <div style={{
                width: '80px',
                height: '80px',
                position: 'relative',
                borderRadius: '50%',
                border: '4px solid #28a745',
                boxSizing: 'content-box'
              }}>
                <span style={{
                  height: '5px',
                  backgroundColor: '#28a745',
                  display: 'block',
                  borderRadius: '2px',
                  position: 'absolute',
                  zIndex: 10,
                  top: '46px',
                  left: '14px',
                  width: '25px',
                  transform: 'rotate(45deg)'
                }}></span>
                <span style={{
                  height: '5px',
                  backgroundColor: '#28a745',
                  display: 'block',
                  borderRadius: '2px',
                  position: 'absolute',
                  zIndex: 10,
                  top: '38px',
                  right: '8px',
                  width: '47px',
                  transform: 'rotate(-45deg)'
                }}></span>
              </div>
            </div>
          ) : (
            <div style={{ width: '80px', height: '80px', margin: '0 auto' }}>
              <div style={{
                width: '80px',
                height: '80px',
                position: 'relative',
                borderRadius: '50%',
                border: '4px solid #dc3545',
                boxSizing: 'content-box'
              }}>
                <span style={{
                  height: '5px',
                  backgroundColor: '#dc3545',
                  display: 'block',
                  borderRadius: '2px',
                  position: 'absolute',
                  zIndex: 10,
                  top: '37px',
                  left: '14px',
                  width: '47px',
                  transform: 'rotate(45deg)'
                }}></span>
                <span style={{
                  height: '5px',
                  backgroundColor: '#dc3545',
                  display: 'block',
                  borderRadius: '2px',
                  position: 'absolute',
                  zIndex: 10,
                  top: '37px',
                  left: '14px',
                  width: '47px',
                  transform: 'rotate(-45deg)'
                }}></span>
              </div>
            </div>
          )}
        </div>
        
        <h3 className={`mb-3 ${type === 'success' ? 'text-success' : 'text-danger'}`}>
          {title}
        </h3>
        
        <p className="text-muted mb-4" style={{ whiteSpace: 'pre-line' }}>
          {message}
        </p>
        
        <button 
          className={`btn px-4 ${type === 'success' ? 'btn-success' : 'btn-danger'}`}
          onClick={onHide}
        >
          Close
        </button>
      </Modal.Body>
    </Modal>
  );
};

export default AlertModal;