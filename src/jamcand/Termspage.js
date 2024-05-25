import React from 'react';
import { useLocation } from 'react-router-dom';
import { useNavigate} from 'react-router-dom';

import axios from 'axios';

import { useEffect, useState } from 'react';

export default function Termspage() {
  const [userinfo, setUserinfo] = useState('');
  const [examID, setExamsID] = useState(1);
  const [counter, setCounter] = useState(1);
  const location = useLocation();
  const regNo = location.state && location.state.regNo;
  const navigate = useNavigate();
 
  
  const fetchCounter = async (examID, regNo) => {
    try {
    const response = await axios.get(`/api/gettimeCount/${examID}/${regNo}`)
    if (response.data) {
     
      setCounter(response.data.timeElapsed)
     
    } else {
      // Handle case when timecount doesn't exist
      setCounter(120)
     
    }
  } catch (error) {
    // Handle API call errors
    console.error('Error checking time count:', error.response ? error.response.data : error.message);
  }
     
  };


  const checkuser = async (regno) => {

    // Make an API call to check if the candidate exists
    const response = await axios.get(`/api/get-candidate/${regno}`); // Use backticks (`) for template literals

    if (response.data) {
        setUserinfo(response.data);
        const exams= await axios.get(`/api/checkexams/${regNo}`); // Use backticks (`) for template literals

    if (exams.data && exams.data.examID) {
     
      setExamsID(exams.data.examID)
    } else {
      console.log('Exam ID:', exams.data.examID);
      const currentTime = new Date().getTime();
      // Convert milliseconds to seconds (Unix timestamp format)
      const unixTimeStamp = Math.floor(currentTime / 1000);
      const examID = unixTimeStamp;
      setExamsID(examID)
    }
    } else {
        // Handle case when candidate doesn't exist
        console.log('Candidate not found');
    }
}


//check if there is ongoing exams
const checkexams = async (regNo) => {
  try {
    // Make an API call to check if the candidate exists
    const response = await axios.get(`/api/checkexams/${regNo}`); // Use backticks (`) for template literals

    if (response.data && response.data.examID) {
      console.log('Exam ID:', response.data.examID);
      setExamsID(response.data.examID)
      navigate('/exams', { state: { regNo: regNo,userinFor: userinfo,examID: examID,counTer: counter} });
    } else {
      // Handle case when exam doesn't exist
      createExams(regNo)
      navigate('/exams', { state: { regNo: regNo,userinFor: userinfo, examID: examID,counTer: counter} });
      console.log('Exams not found for registration number:', examID);
    }
  } catch (error) {
    // Handle API call errors
    console.error('Error checking exams:', error.response ? error.response.data : error.message);
  }
};

//create Exams
const createExams = async (regNo) => {
  try {
    // Make an API call to create exams
  
    const candID = regNo;
    const status = 'Ongoing';
    const  timeElapse= 120;
    
    const response = await axios.post('/api/createexams', { examID, candID, status , timeElapse});

    if (response.data) {
      console.log('Exams created successfully:', response.data);
      setExamsID(examID)
    } else {
      console.log('Failed to create exams');
      setExamsID(examID)
    }
  } catch (error) {
    // Handle API call errors
    console.error('Error creating exams:', error.response ? error.response.data : error.message);
  }
};

useEffect(() => {
    checkuser(regNo); // Assuming regNo is defined somewhere

   
}, [regNo]);

useEffect(() => {
  fetchCounter(examID,regNo) // Assuming regNo is defined somewhere
  
 
}, [examID,regNo]);

const handleStartExam = () => {
 checkexams (regNo)

 //console.log(counter)
}

  return (
    <div>

<div className="container" style={{ marginTop: '50px' }}>
      <div className="row">
        {/* Left Column (Blank) */}
        <div className="col-md-2 border-right"></div>
        {/* Center Column */}
        <div className="col-md-7 border-right">
          {/* Terms Container */}
          <div className="terms-container">
            <h2>Terms of Computer-Based Test (CBT) Exams </h2>
            <p>
              By accessing and using this computer-based test (CBT) platform, you agree to be bound by these Terms and Conditions. Please read them carefully.
            </p>
            <h3>1. Acceptance of Terms</h3>
            <p>
              By accessing and using the CBT platform, you agree to be bound by these Terms and Conditions, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws.
            </p>
            <h3>2. Use License</h3>
            <p>
              Permission is granted to temporarily download one copy of the materials (information or software) on the CBT platform for personal, non-commercial transitory viewing only.
            </p>
            <h3>3. Disclaimer</h3>
            <p>
              The materials on the CBT platform are provided on an 'as is' basis. The CBT platform makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties.
            </p>
            <h3>4. Limitations</h3>
            <p>
              In no event shall the CBT platform or its suppliers be liable for any damages arising out of the use or inability to use the materials on the CBT platform.
            </p>
          </div>
          {/* Start Exam Button */}
          <button onClick={handleStartExam} className="btn btn-success start-exam-btn" style={{ marginTop: '20px' }}>Start Exam</button> <br /><br />
        </div>
       
         {/* Right Column */}
         <div className="col-md-3 border-left">
          {/* Image Placeholder */}
          <div className="circle-image-placeholder">
          <img src={userinfo.img} alt="Candidate Image" className="img rounded-circle" />

          </div>
          {/* Candidate Registration Number */}
          <div className="reg-no">{regNo}</div>
          {/* Description on navigation */}
          <div className="navigation-description">
            <h5>{userinfo.fullname}</h5>
            <h3>Navigation</h3>
            <p>
              <strong className="text-primary">Options:</strong> <br />
              <strong className={'btn btn-xs btn-primary'}  style={{ marginRight: '4px' }}>A</strong>
              <strong className={'btn btn-xs btn-primary'}  style={{ marginRight: '4px' }}>B</strong>
              <strong className={'btn btn-xs btn-primary'}  style={{ marginRight: '4px' }}>C</strong>
              <strong className={'btn btn-xs btn-primary'} style={{ marginRight: '4px' }} >D</strong><br />
              <strong className="text-primary">Submit:</strong> <br />
              <strong className={'btn btn-xs btn-primary'} >S</strong><br />
              <strong className="text-primary">End Exam:</strong> <br />
              <strong className={'btn btn-xs btn-primary'} >Y</strong><br />
              <strong className="text-primary">Next:</strong> <br />
              <strong className={'btn btn-xs btn-primary'} >N</strong><br />
              <strong className="text-primary">Previous:</strong> <br />
              <strong className={'btn btn-xs btn-primary'} >P</strong><br />
            </p>
            <p>
              The navigation keys are indicated above.
            </p>
          </div>
        </div>
      </div>
    </div>


    </div>
  )
}
