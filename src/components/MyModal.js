
import React from 'react'
import Modal from 'react-bootstrap/Modal';

export default function MyModal(props) {
  return (
    <div>
    <Modal show={props.show} onHide={props.onHide} dialogClassName="modal-sm">
      <Modal.Body>
        <div>
          {props.body}
          <div className="exam-buttons">
            <button className="btn continue-btn btn-success mr-2 btn-sm" style={{ marginRight: '4px' }} onClick={props.onHide}>Continue</button>

          </div>
        </div>
      </Modal.Body>
    </Modal>
  </div>
  )
}
