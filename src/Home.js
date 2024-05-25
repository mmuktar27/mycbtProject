import React from 'react'
import axios from 'axios';
import { Link } from "react-router-dom";
import computerImage from "./resources/computer.png";
import cbtchallengeImage from "./resources/cbtChallenge.png"
import Modal from 'react-bootstrap/Modal';


import { useEffect,useRef,useState } from 'react';
import generalcbtchallengeImage from "./resources/generalcbt.png";
import logo from './resources/logo.png';
import { useNavigate} from 'react-router-dom';

function Home() {

  const [showRegModal, setshowRegModal] = useState(false);
  const handleCloseRegModal = () => setshowRegModal(false);
  const handleShowRegModal = () => setshowRegModal(true);
  const videoRef = useRef(null);
  const [showCameraModal, setShowCameraModal] = useState(false);
  


  const [showHistoryModal, setshowHistoryModal] = useState(false);
  const handleCloseHistoryModal = () => setshowHistoryModal(false);
  const handleShowHistoryModal = () => setshowHistoryModal(true);

  const navigate = useNavigate();

  // Initialize useHistory hook

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
        // Optionally, you can handle success actions here
      })
      .catch(error => {
        console.error('Error submitting form data:', error);
        // Optionally, you can handle error actions here
      });
      // You can handle form submission logic here
      console.log(mappedFormData);
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
      // Create a new Blob object
      const blob = new Blob([file], { type: file.type });
      
      // Update form data with the Blob object
      setFormData({ ...formData, img: blob });
    
  };
  
  
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
    const imageData = canvas.toDataURL('image/png');
    setFormData({ ...formData, img: imageData });
    videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    setShowCameraModal(false);
  };

  return (
    <div>
      <h1>This is the home page</h1>
      <button className='btn btn-primary' onClick={handleShowRegModal}>Register</button>
      <button className='btn btn-success' onClick={handleShowHistoryModal} >History</button>
      <Link to="exams">Click to view our exams page</Link> <br/><br/>
      <Link to="candid">Click to view our candid page</Link>
      <Link to="test">Click to view our test page</Link>

    <div className="container">
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
</div>

        </div>
        {/* Right column */}
        <div className="col-md-6" >
          
          
          <div className="row">
            <div className="col-md-4">
            <Link to="candid" style={{ textDecoration: 'none' }}>
              <div className="card border-0" >
                <img className="card-img-top  w-100" src={computerImage} alt="jamb cbt" style={{ width: '100%', height: '120px' }} />
                <div className="card-body">
                  <p className="card-text">Jamb CBT</p>
                </div>
              </div> </Link>
            </div>
           
            <div className="col-md-4">
            <Link to="candidforchallenge" style={{ textDecoration: 'none' }}>
              <div className="card border-0">
                <img className="card-img-top w-100" src={cbtchallengeImage} alt="Card image cap" style={{ width: '100%', height: '120px' }} />
                <div className="card-body">
                  <p className="card-text">Jamb CBT Challenge</p>
                </div>
              </div></Link>
            </div>
            <div className="col-md-4">
            <Link to="generalcbtlogin" style={{ textDecoration: 'none' }}>
              <div className="card border-0" >
                <img className="card-img-top  w-100" src={generalcbtchallengeImage} alt="Card image cap"  style={{ width: '100%', height: '120px' }} />
                <div className="card-body">
                  <p className="card-text">General CBT Practice</p>
                </div>
              </div></Link>
            </div>
          </div>
          <hr style={{borderTop: '3px solid #000'}} />
          <div className="row">
            <div className="col-md-4">
              <div className="card">
                <img className="card-img-top" src="image_url" alt="Card image cap" />
                <div className="card-body">
                  <p className="card-text">Text below the image</p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card">
                <img className="card-img-top" src="image_url" alt="Card image cap" />
                <div className="card-body">
                  <p className="card-text">Text below the image</p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card">
                <img className="card-img-top" src="image_url" alt="Card image cap" />
                <div className="card-body">
                  <p className="card-text">Text below the image</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <Modal show={showRegModal} onHide={handleCloseRegModal} dialogClassName="modal-md">
    
        <Modal.Body>
        <div className="container">
      <h2>Registration Form</h2>
      <form onSubmit={handleSubmit} encType="multipart/form-data" maxSize={50 * 1024 * 1024}>
        <div className="mb-3">
          <label htmlFor="candregno" className="form-label">Candidate Registration Number</label>
          <input type="text" className="form-control" id="candregno" placeholder='e.g 20502764545HG' name="candregno" value={formData.candregno} onChange={handleChange} />
        </div>
        <div className="mb-3">
          <label htmlFor="fullname" className="form-label">Full Name</label>
          <input type="text" className="form-control" id="fullname" name="fullname" value={formData.fullname} onChange={handleChange} />
        </div>
    
        <div className="mb-3">
          <label htmlFor="img" className="form-label">Upload Image</label>
          <input type="file" className="form-control" id="img" name="img" accept="image/*" onChange={handleImageUpload} />
          {/* Display the uploaded image */}
       
        </div>
        <div className="mb-3">
          <label className="form-label">Take a Photo</label>
          <div className="d-flex">
            <button type="button" className="btn btn-primary me-2" onClick={handleCameraClick}>Open Camera</button>

          </div>
       
          {/* Display the captured image */}
          {formData.img && (
          <img src={formData.img} alt="Captured" className="img-thumbnail mt-2" style={{ maxWidth: '100px' }} />
        )}
        </div>
        <p >Enlish Language is composary</p>
        <div className="mb-3">
          <label htmlFor="subj1" className="form-label">Subject 1</label>
          <select className="form-select" id="subj1" name="subj1" value={formData.subj1} onChange={handleChange}>
  <option value="">Select Subject</option>
  {subjects.map(subject => (
    <option key={subject.full} value={subject.full}>{subject.full}</option>
  ))}
</select>
        </div>
        <div className="mb-3">
          <label htmlFor="subj2" className="form-label">Subject 2</label>
          <select className="form-select" id="subj2" name="subj2" value={formData.subj2} onChange={handleChange}>
  <option value="">Select Subject</option>
  {subjects.map(subject => (
    <option key={subject.full} value={subject.full}>{subject.full}</option>
  ))}
</select>
        </div>
        <div className="mb-3">
          <label htmlFor="subj3" className="form-label">Subject 3</label>
          <select className="form-select" id="subj3" name="subj3" value={formData.subj3} onChange={handleChange}>
  <option value="">Select Subject</option>
  {subjects.map(subject => (
    <option key={subject.full} value={subject.full}>{subject.full}</option>
  ))}
</select>
        </div>
     
        <button type="submit" className="btn btn-primary">Submit</button>
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
    </div>
  );
}

export default Home;