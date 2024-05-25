import React from 'react'
import Modal from 'react-bootstrap/Modal';


export default function ChallengeCompletedModal(props) {
  return (
    <div>

<Modal

  show={props.show}
  onHide={props.handleClose}
  dialogClassName="modal-80w"
  data={{background: 'grey'}}
  style={{
    borderRadius: 0,
    borderWidth: 0,
    boxShadow: 'none',
    marginTop: 0,
    marginRight: 'auto',
    marginBottom: 0,
    marginLeft: 'auto',
    width: '90vw' // Adjust as needed
  }}
>
<Modal.Body style={{ position: 'relative' }}>
        <img src={props.img} alt="GIF image" style={{ width: '100%' }} />
        <div style={{ position: 'absolute', top: '70%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', color: 'pink' }}>
          <h2><strong>Congratulations</strong></h2>
          <p>Challenge Completed</p>
        </div>
      </Modal.Body>
      </Modal>
    </div>
  )
}
