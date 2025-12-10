import React from 'react';
import { useLocation } from 'react-router-dom';
import { useNavigate} from 'react-router-dom';

import axios from 'axios';

import { useEffect, useState } from 'react';



export default function Termspage() {
  const [userinfo, setUserinfo] = useState('');
  const [examID, setExamsID] = useState(null);
  const [counter, setCounter] = useState(120);
  const location = useLocation();
  const regNo = location?.state && location?.state?.regNo;
  const navigate = useNavigate();

  // Generate a unique exam ID (Unix timestamp as integer)
const generateExamID = () => {
    const timestamp = Math.floor(Date.now() / 1000);
    return `EX-${timestamp}`; // Returns string like "EX-1765267873"
};
  // Fetch time counter for existing exam
  const fetchCounter = async (examID, regNo) => {
    if (!examID || !regNo) return;

    try {
      const response = await axios.get(`/api/gettimeCount/${examID}/${regNo}`);
      
      if (response.data && response.data.timeElapsed) {
        setCounter(response.data.timeElapsed);
        console.log('✅ Counter loaded:', response.data.timeElapsed);
      } else {
        // Default counter if not found
        setCounter(120);
        console.log('⚠️ No counter found, using default: 120');
      }
    } catch (error) {
      console.error('❌ Error fetching time count:', error.response ? error.response.data : error.message);
      setCounter(120); // Fallback to default
    }
  };

  // Check if user exists and load exam data
  const checkUser = async (regno) => {
    if (!regno) return;

    try {
      const response = await axios.get(`/api/get-candidate/${regno}`);

      if (response.data) {
        setUserinfo(response.data);
        console.log('✅ User info loaded:', response.data);

        // Check for existing ongoing exam
        const examsResponse = await axios.get(`/api/checkexams/${regno}`);

        if (examsResponse.data && examsResponse.data.examID) {
          // Existing exam found
          const existingExamID = examsResponse.data.examID;
          setExamsID(existingExamID);
          console.log('✅ Existing exam found:', existingExamID);
        } else {
          // No existing exam, generate new exam ID
          const newExamID = generateExamID();
          setExamsID(newExamID);
          console.log('✨ New exam ID generated:', newExamID);
        }
      } else {
        console.log('❌ Candidate not found');
      }
    } catch (error) {
      console.error('❌ Error checking user:', error.response ? error.response.data : error.message);
    }
  };

  // Create new exam
  const createExams = async (regNo, newExamID) => {
    try {
      const examData = {
        examID: newExamID,
        candID: regNo,
        status: 'Ongoing',
        timeElapse: 120
      };

      const response = await axios.post('/api/createexams', examData);

      if (response.data) {
        console.log('✅ Exam created successfully:', response.data);
        return true;
      } else {
        console.log('⚠️ Failed to create exam');
        return false;
      }
    } catch (error) {
      console.error('❌ Error creating exam:', error.response ? error.response.data : error.message);
      return false;
    }
  };

  // Check if exam exists or create new one
  const checkExams = async (regNo) => {
    if (!regNo || !examID) {
      console.error('❌ Missing regNo or examID');
      return;
    }

    try {
      const response = await axios.get(`/api/checkexams/${regNo}`);

      if (response.data && response.data.examID) {
        // Ongoing exam exists
        console.log('✅ Ongoing exam found, continuing...');
        navigate('/exams', { 
          state: { 
            regNo: regNo, 
            userinFor: userinfo, 
            examID: response.data.examID, 
            counTer: counter 
          } 
        });
      } else {
        // No ongoing exam, create new one
        console.log('📝 Creating new exam...');
        const created = await createExams(regNo, examID);
        
        if (created) {
          navigate('/exams', { 
            state: { 
              regNo: regNo, 
              userinFor: userinfo, 
              examID: examID, 
              counTer: counter 
            } 
          });
        } else {
          console.error('❌ Failed to create exam');
        }
      }
    } catch (error) {
      console.error('❌ Error checking exams:', error.response ? error.response.data : error.message);
    }
  };

  // Load user data on mount
  useEffect(() => {
    if (regNo) {
      checkUser(regNo);
    }
  }, [regNo]);

  // Load counter when examID is available
  useEffect(() => {
    if (examID && regNo) {
      fetchCounter(examID, regNo);
    }
  }, [examID, regNo]);

  // Handle start exam button click
  const handleStartExam = () => {
    if (!regNo || !examID) {
      console.error('❌ Cannot start exam: missing data');
      return;
    }

    checkExams(regNo);
  };

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
              <h2>Terms of Computer-Based Test (CBT) Exams</h2>
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
            <button 
              onClick={handleStartExam} 
              className="btn btn-success start-exam-btn" 
              style={{ marginTop: '20px' }}
              disabled={!examID || !userinfo}
            >
              {examID && userinfo ? 'Start Exam' : 'Loading...'}
            </button>
            <br /><br />
          </div>

          {/* Right Column */}
          <div className="col-md-3 border-left">
            {/* Image Placeholder */}
            <div className="circle-image-placeholder">
              {userinfo.img && (
                <img 
                  src={userinfo.img} 
                  alt="Candidate" 
                  className="img rounded-circle" 
                />
              )}
            </div>

            {/* Candidate Registration Number */}
            <div className="reg-no">{regNo}</div>

            {/* Navigation Description */}
            <div className="navigation-description">
              <h5>{userinfo.fullname}</h5>
              <h3>Navigation</h3>
              <p>
                <strong className="text-primary">Options:</strong> <br />
                <strong className="btn btn-xs btn-primary" style={{ marginRight: '4px' }}>A</strong>
                <strong className="btn btn-xs btn-primary" style={{ marginRight: '4px' }}>B</strong>
                <strong className="btn btn-xs btn-primary" style={{ marginRight: '4px' }}>C</strong>
                <strong className="btn btn-xs btn-primary" style={{ marginRight: '4px' }}>D</strong>
                <br />

                <strong className="text-primary">Submit:</strong> <br />
                <strong className="btn btn-xs btn-primary">S</strong>
                <br />

                <strong className="text-primary">End Exam:</strong> <br />
                <strong className="btn btn-xs btn-primary">Y</strong>
                <br />

                <strong className="text-primary">Next:</strong> <br />
                <strong className="btn btn-xs btn-primary">N</strong>
                <br />

                <strong className="text-primary">Previous:</strong> <br />
                <strong className="btn btn-xs btn-primary">P</strong>
                <br />
              </p>
              <p>The navigation keys are indicated above.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}