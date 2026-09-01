import React from 'react'
import axios from 'axios';
import { Link } from "react-router-dom";
import computerImage from "./resources/computer.png";
import cbtchallengeImage from "./resources/cbtChallenge.png"
import Modal from 'react-bootstrap/Modal';
import AlertModal from './components/alertsModal' // Adjust path as needed

import { Navbar, Nav, Container, Button } from 'react-bootstrap';

import { useEffect,useRef,useState } from 'react';
import generalcbtchallengeImage from "./resources/generalcbt.png";
import logo from './resources/logo.png';
import { useNavigate} from 'react-router-dom';

import ActivateButton from './activation/ActivateButton';
import { useActivationStatus } from './hooks/useActivationStatus';
import { useAdminShortcut } from './hooks/useAdminShortcut';
import NewLogo from './resources/mycbt-logo.svg';

function Home() {
const {
    isLoading:isloadingActivation,
    isError,  
    error,
    isActivated,
    activationKey,
    activatedAt,
    systemId,
    refetchActivation
  } = useActivationStatus();

  const [showRegModal, setshowRegModal] = useState(false);
  const handleCloseRegModal = () => setshowRegModal(false);
  const handleShowRegModal = () => setshowRegModal(true);
  const videoRef = useRef(null);
  const [showCameraModal, setShowCameraModal] = useState(false);
  
const [errors, setErrors] = useState({});

  const [showHistoryModal, setshowHistoryModal] = useState(false);
  const handleCloseHistoryModal = () => setshowHistoryModal(false);
  const handleShowHistoryModal = () => setshowHistoryModal(true);
  const [isLoading, setIsLoading] = useState(false);
const [showAlertModal, setShowAlertModal] = useState(false);
const [alertConfig, setAlertConfig] = useState({
  type: 'success',
  title: '',
  message: ''
});
  const navigate = useNavigate();
  const { showAdminLink } = useAdminShortcut();

  // Initialize useHistory hook
const TopNavbar = ({ handleShowRegModal, handleShowHistoryModal }) => {
  return (
    <Navbar bg="light" expand="lg" className="shadow-sm">
      <Container fluid>
        {/* Brand/Logo */}
    <Navbar.Brand href="#home" className="d-flex align-items-center gap-2">
  <img 
    src={logo} 
    alt="MyCBT Logo" 
    style={{ 
      height: '50px',
      width: '50px',
      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
    }} 
  />
  <span className="fw-bold text-primary" style={{ fontSize: '1.3rem', letterSpacing: '1px' }}>
    MyCBT
  </span>
</Navbar.Brand>

        {/* Toggle button for mobile */}
        <Navbar.Toggle aria-controls="basic-navbar-nav" />

        {/* Navbar content */}
        <Navbar.Collapse id="basic-navbar-nav">
          {/* Left side navigation items */}
          <Nav className="me-auto">
            <Nav.Link href="#home">Home</Nav.Link>
            <Nav.Link href="#about">About</Nav.Link>
            <Nav.Link href="#exams">Exams</Nav.Link>
          </Nav>

          {/* Right side buttons */}
          <Nav className="ms-auto  gap-2">
            <Button 
              variant="primary" 
              onClick={handleShowRegModal}
              className="me-2"
            >
              <i className="fas fa-user-plus me-1"></i>
              Register
            </Button>
            
            <Button 
              variant="success" 
              onClick={handleShowHistoryModal}
            >
              <i className="fas fa-history me-1"></i>
              History
            </Button>

             <ActivateButton refetchActivation={refetchActivation} isActivated={isActivated} activatedAt={activatedAt} setAlertConfig={setAlertConfig} setShowAlertModal={setShowAlertModal}/>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

  const handleContinue = async () => {
    //continue to users history page
    const userInput = document.querySelector('input[name="userregno"]').value;
 

    try {
      // Make an API call to check if the candidate exists
      const response = await axios.get(`/api/checkcandidate/${userInput}`); // Use backticks (`) for template literals
  
      if (response.data && response.data.candid) {
      //  console.log('Exam ID:', response.data.candid);
      navigate('/candhistory', { state: { regNo: userInput } });
      } else {
        // Handle case when exam doesn't exist
        alert('User does not exist!');
      }
    } catch (error) {
      // Handle API call errors
      console.error('Error checking exams:', error.response ? error.response.data : error.message);
    }
  };

  const [formData, setFormData] = useState({
      candregno: '',
      fullname: '',
      img: '',
      subj1: '',
      subj2: '',
      subj3: ''
    });
  
    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData({ ...formData, [name]: value });
    };
  
const handleSubmit = (e) => {
  e.preventDefault();
  
  // Initialize errors object
  const newErrors = {};
  
  // Validate required fields
  if (!formData.candregno || formData.candregno.trim() === '') {
    newErrors.candregno = 'Candidate Registration Number is required';
  }
  
  if (!formData.fullname || formData.fullname.trim() === '') {
    newErrors.fullname = 'Full Name is required';
  }
  
  if (!formData.img) {
    newErrors.img = 'Image is required';
  }
  
  if (!formData.subj1 || formData.subj1 === '') {
    newErrors.subj1 = 'Subject 1 is required';
  }
  
  if (!formData.subj2 || formData.subj2 === '') {
    newErrors.subj2 = 'Subject 2 is required';
  }
  
  if (!formData.subj3 || formData.subj3 === '') {
    newErrors.subj3 = 'Subject 3 is required';
  }
  
  // Check for duplicate subjects
  const subjects = [formData.subj1, formData.subj2, formData.subj3].filter(s => s !== '');
  const uniqueSubjects = new Set(subjects);
  
  if (subjects.length !== uniqueSubjects.size) {
    newErrors.subjects = 'You cannot select the same subject twice. Please choose different subjects.';
    
    if (formData.subj1 && (formData.subj1 === formData.subj2 || formData.subj1 === formData.subj3)) {
      newErrors.subj1 = 'Duplicate subject selected';
    }
    if (formData.subj2 && (formData.subj2 === formData.subj1 || formData.subj2 === formData.subj3)) {
      newErrors.subj2 = 'Duplicate subject selected';
    }
    if (formData.subj3 && (formData.subj3 === formData.subj1 || formData.subj3 === formData.subj2)) {
      newErrors.subj3 = 'Duplicate subject selected';
    }
  }
  
  // If there are errors, set them and stop submission
  if (Object.keys(newErrors).length > 0) {
    setErrors(newErrors);
    return;
  }
  
  // Clear errors if validation passes
  setErrors({});
  setIsLoading(true);
  
  // Map full subject names to their abbreviations
  const mappedFormData = {
    ...formData,
    subj1: mapSubjectAbbreviation(formData.subj1),
    subj2: mapSubjectAbbreviation(formData.subj2),
    subj3: mapSubjectAbbreviation(formData.subj3)
  };
  
  axios.post('/api/submitRegFormData', mappedFormData)
    .then(response => {
      console.log('Form data submitted successfully:', response.data);
      setIsLoading(false);
      handleCloseRegModal();
      
      // Show success alert
      setAlertConfig({
        type: 'success',
        title: 'Registration Successful!',
        message: `Your registration has been submitted successfully.\nRegistration Number: ${formData.candregno}`
      });
      setShowAlertModal(true);
      
      // Reset form
      setFormData({
        candregno: '',
        fullname: '',
        img: '',
        subj1: '',
        subj2: '',
        subj3: ''
      });
    })
    .catch(error => {
      console.error('Error submitting form data:', error);
      setIsLoading(false);
      
      // Show error alert
      setAlertConfig({
        type: 'error',
        title: 'Registration Failed!',
        message: error.response?.data?.message || 'Error submitting form data. Please try again.'
      });
      setShowAlertModal(true);
    });
};


    const subjects = [
      { full: 'Mathematics', abbreviation: 'MATH' },
      { full: 'Chemistry', abbreviation: 'CHEM' },
      { full: 'Biology', abbreviation: 'BIO' },
      { full: 'Physics', abbreviation: 'PHY' },
      { full: 'Agricultural Science', abbreviation: 'AGRI' },
      { full: 'Economics', abbreviation: 'ECO' },
      { full: 'Government', abbreviation: 'GOVT' },
      { full: 'Islamic Studies', abbreviation: 'IRS' },
      { full: 'Christian Religious Studies', abbreviation: 'CRS' },
      { full: 'History', abbreviation: 'HIST' }
    ];
  const mapSubjectAbbreviation = (fullSubjectName) => {
    const subject = subjects.find(subject => subject.full === fullSubjectName);
    return subject ? subject.abbreviation : '';
  };

const handleImageUpload = (e) => {
  const file = e.target.files[0];
  
  if (file) {
    // Convert file to base64 string
    const reader = new FileReader();
    reader.onloadend = () => {
      // reader.result contains the base64 string
      setFormData({ ...formData, img: reader.result });
    };
    reader.readAsDataURL(file);
  }
};

const handleCameraClick = async () => {
  try {
    setShowCameraModal(true);
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoRef.current.srcObject = stream;
  } catch (error) {
    console.error('Error accessing camera:', error);
  }
};

const handleCaptureClick = () => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = videoRef.current.videoWidth;
  canvas.height = videoRef.current.videoHeight;
  context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
  
  // This already returns a base64 string, which is correct
  const imageData = canvas.toDataURL('image/png');
  setFormData({ ...formData, img: imageData });
  
  // Stop the camera stream
  videoRef.current.srcObject.getTracks().forEach(track => track.stop());
  setShowCameraModal(false);
};


 if (!isActivated) {
    return (
      <div className="alert alert-warning">
        Your system is not activated. Please enter an activation key.
             <ActivateButton refetchActivation={refetchActivation} isActivated={isActivated} activatedAt={activatedAt} setAlertConfig={setAlertConfig} setShowAlertModal={setShowAlertModal}/>


 {showAdminLink && (
        <div style={{ 
          position: 'fixed', 
          bottom: '10px', 
          right: '10px', 
          zIndex: 9999 
        }}>
          <Link 
            to="/admin" 
            className="btn btn-sm btn-secondary"
            title="Press Ctrl+Alt+M to hide"
          >
            <i className="fas fa-cog me-1"></i>
            Admin
          </Link>
        </div>
      )}
                           </div>
    );
  }
  return (
    <div>
  <TopNavbar 
        handleShowRegModal={handleShowRegModal}
        handleShowHistoryModal={handleShowHistoryModal}
      />


    <div className="container mt-4">
      <div className="row">
        {/* Left column */}
        <div className="col-md-6" style={{ backgroundColor: '#D3D3D3' }}>
        <img className="card-img-top sm" src={logo} alt='app logo' style={{ width: '100px', height: 'auto' }} />
          <h3>MyCBT</h3>

          <br />
          <div style={{ textAlign: 'justify', margin: 'auto', maxWidth: '600px' }}>
    <p>
        <strong>Achieve Exam Success with MyCBT: Your Ultimate Preparation Companion</strong><br />
    
        MyCBT simplifies the process of studying for and taking JAMB CBT and other computer-based tests. It's the essential app for students seeking success.<br />
   
        <strong>Personalized Preparation:</strong> Tailor your preparation to your unique learning style with MyCBT's personalized approach, ensuring you're fully equipped for any exam.<br />

        <strong>Digital Excellence:</strong> As exams increasingly shift to digital platforms, MyCBT provides a simulated test environment that closely mirrors these conditions, preparing you for the digital landscape of modern exams.<br />

        <strong>Track Your Progress:</strong> Monitor your personal growth and track your journey towards success with MyCBT's progress tracking feature. See how far you've come and stay motivated to achieve your goals.<br />
    </p>

     <div className="alert alert-success">
      ✅ System activated!
      <br />
      <small>Key: {activationKey} | Activated: {activatedAt}</small>
    </div>

    {showAdminLink && (
        <div style={{ 
          position: 'fixed', 
          bottom: '10px', 
          right: '10px', 
          zIndex: 9999 
        }}>
          <Link 
            to="/admin" 
            className="btn btn-sm btn-secondary"
            title="Press Ctrl+Alt+M to hide"
          >
            <i className="fas fa-cog me-1"></i>
            Admin
          </Link>
        </div>
      )}
</div>

        </div>
        {/* Right column */}
        <div className="col-md-6">
  {/* Logo Section - Top Center */}


  {/* Main Cards Section */}
  <div className="row">
    <div className="col-md-4">
      <Link to="candid" style={{ textDecoration: 'none' }}>
        <div className="card border-0">
          <img 
            className="card-img-top w-100" 
            src={computerImage} 
            alt="jamb cbt" 
            style={{ width: '100%', height: '120px' }} 
          />
          <div className="card-body">
            <p className="card-text">CBT</p>
          </div>
        </div>
      </Link>
    </div>

    <div className="col-md-4">
      <Link to="candidforchallenge" style={{ textDecoration: 'none' }}>
        <div className="card border-0">
          <img 
            className="card-img-top w-100" 
            src={cbtchallengeImage} 
            alt="Card image cap" 
            style={{ width: '100%', height: '120px' }} 
          />
          <div className="card-body">
            <p className="card-text">CBT Training Challenge</p>
          </div>
        </div>
      </Link>
    </div>

    <div className="col-md-4">
      <Link to="generalcbtlogin" style={{ textDecoration: 'none' }}>
        <div className="card border-0">
          <img 
            className="card-img-top w-100" 
            src={generalcbtchallengeImage} 
            alt="Card image cap" 
            style={{ width: '100%', height: '120px' }} 
          />
          <div className="card-body">
            <p className="card-text">General CBT Practice</p>
          </div>
        </div>
      </Link>
    </div>
  </div>

  <hr style={{ borderTop: '3px solid #000' }} />

  {/* Coming Soon Section */}
  <div className="row">
    <div className="col-md-4">
      <div className="card">
        <img className="card-img-top" src="image_url" alt="Card image cap" />
        <div className="card-body">
          <p className="card-text">Coming Soon</p>
        </div>
      </div>
    </div>

    <div className="col-md-4">
      <div className="card">
        <img className="card-img-top" src="image_url" alt="Card image cap" />
        <div className="card-body">
          <p className="card-text">Coming Soon</p>
        </div>
      </div>
    </div>

    <div className="col-md-4">
      <div className="card">
        <img className="card-img-top" src="image_url" alt="Card image cap" />
        <div className="card-body">
          <p className="card-text">Coming Soon</p>
        </div>
      </div>
    </div>

     
  </div>
</div>
      </div>
    </div>
<Modal show={showRegModal} onHide={handleCloseRegModal} dialogClassName="modal-xl" size="xl">
  <Modal.Body>
    <div className="container">
      <h2>Registration Form</h2>
      <form onSubmit={handleSubmit} encType="multipart/form-data" maxSize={50 * 1024 * 1024}>
        <div className="row">
          <div className="col-md-6 mb-3">
            <label htmlFor="candregno" className="form-label">
              Candidate Registration Number <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              className={`form-control ${errors.candregno ? 'is-invalid' : ''}`}
              id="candregno"
              placeholder="e.g 20502764545HG"
              name="candregno"
              value={formData.candregno}
              onChange={handleChange}
              required
            />
            {errors.candregno && <div className="text-danger small mt-1">{errors.candregno}</div>}
          </div>

          <div className="col-md-6 mb-3">
            <label htmlFor="fullname" className="form-label">
              Full Name <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              className={`form-control ${errors.fullname ? 'is-invalid' : ''}`}
              id="fullname"
              name="fullname"
              value={formData.fullname}
              onChange={handleChange}
              required
            />
            {errors.fullname && <div className="text-danger small mt-1">{errors.fullname}</div>}
          </div>
        </div>

        <div className="row">
          <div className="col-md-6 mb-3">
            <label htmlFor="img" className="form-label">
              Upload Image <span className="text-danger">*</span>
            </label>
            <input
              type="file"
              className={`form-control ${errors.img ? 'is-invalid' : ''}`}
              id="img"
              name="img"
              accept="image/*"
              onChange={handleImageUpload}
              
            />
            {errors.img && <div className="text-danger small mt-1">{errors.img}</div>}
            {/* Display the uploaded image */}
          </div>

          <div className="col-md-6 mb-3">
            <label className="form-label">Take a Photo</label>
            <div className="d-flex">
              <button
                type="button"
                className="btn btn-primary me-2"
                onClick={handleCameraClick}
              >
                Open Camera
              </button>
            </div>

            {/* Display the captured image */}
            {formData.img && (
              <img
                src={formData.img}
                alt="Captured"
                className="img-thumbnail mt-2"
                style={{ maxWidth: '100px' }}
              />
            )}
          </div>
        </div>

        <p>Enlish Language is composary</p>

        <div className="row">
          <div className="col-md-4 mb-3">
            <label htmlFor="subj1" className="form-label">
              Subject 1 <span className="text-danger">*</span>
            </label>
            <select
              className={`form-select ${errors.subj1 ? 'is-invalid' : ''}`}
              id="subj1"
              name="subj1"
              value={formData.subj1}
              onChange={handleChange}
              required
            >
              <option value="">Select Subject</option>
              {subjects.map(subject => (
                <option key={subject.full} value={subject.full}>
                  {subject.full}
                </option>
              ))}
            </select>
            {errors.subj1 && <div className="text-danger small mt-1">{errors.subj1}</div>}
          </div>

          <div className="col-md-4 mb-3">
            <label htmlFor="subj2" className="form-label">
              Subject 2 <span className="text-danger">*</span>
            </label>
            <select
              className={`form-select ${errors.subj2 ? 'is-invalid' : ''}`}
              id="subj2"
              name="subj2"
              value={formData.subj2}
              onChange={handleChange}
              required
            >
              <option value="">Select Subject</option>
              {subjects.map(subject => (
                <option key={subject.full} value={subject.full}>
                  {subject.full}
                </option>
              ))}
            </select>
            {errors.subj2 && <div className="text-danger small mt-1">{errors.subj2}</div>}
          </div>

          <div className="col-md-4 mb-3">
            <label htmlFor="subj3" className="form-label">
              Subject 3 <span className="text-danger">*</span>
            </label>
            <select
              className={`form-select ${errors.subj3 ? 'is-invalid' : ''}`}
              id="subj3"
              name="subj3"
              value={formData.subj3}
              onChange={handleChange}
              required
            >
              <option value="">Select Subject</option>
              {subjects.map(subject => (
                <option key={subject.full} value={subject.full}>
                  {subject.full}
                </option>
              ))}
            </select>
            {errors.subj3 && <div className="text-danger small mt-1">{errors.subj3}</div>}
          </div>
        </div>

        {errors.subjects && <div className="text-danger small mb-3">{errors.subjects}</div>}

        <button type="submit" className="btn btn-primary" disabled={isLoading}>
          {isLoading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Loading...
            </>
          ) : (
            'Submit'
          )}
        </button>
        <button onClick={handleCloseRegModal}>
          Cancel
        </button>
      </form>
    </div>
  </Modal.Body>
</Modal>


      <Modal show={showCameraModal} onHide={() => setShowCameraModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Camera</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <video  className="img img-rounded"ref={videoRef} style={{ width: '100%' }} autoPlay />
        </Modal.Body>
        <Modal.Footer>
          <button type="button" className="btn btn-primary" onClick={handleCaptureClick}>Capture</button>
        </Modal.Footer>
      </Modal>


      <Modal show={showHistoryModal} onHide={() => setshowHistoryModal(false)} dialogClassName="modal-sm">
        <Modal.Header closeButton>
          <Modal.Title>History</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <form style={{ width: '100%' }}>
          <div className="mb-2">
          <label htmlFor="candregno" className="form-label">Candidate Registration Number</label>
            <input type='text' name='userregno'  className="form-control"  placeholder='e.g 20502764545HG' required/>
            </div>
          </form>
        </Modal.Body>
        <Modal.Footer>
          <button type="button" className="btn btn-primary" onClick={handleContinue}>Continue</button>
        </Modal.Footer>
      </Modal>

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

export default Home;