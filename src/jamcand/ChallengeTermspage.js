import React from 'react';
import { useLocation } from 'react-router-dom';
import { useNavigate} from 'react-router-dom';
import { Link } from "react-router-dom";
import axios from 'axios';
import logo from '../resources/logo.png';

import { useEffect, useState } from 'react';

export default function ChallengeTermspage() {
  const [userinfo, setUserinfo] = useState('');
  const [examID, setExamsID] = useState(1);
  const [counter, setCounter] = useState(120);
  const location = useLocation();
  const [challenges, setChallenges] = useState([]);
  const [completedchallenges, setCompletedcChallenges] = useState([]);
  const regNo = location.state && location.state.regNo;
  const navigate = useNavigate();
 
  

  const checkuser = async (regno) => {

    // Make an API call to check if the candidate exists
    const response = await axios.get(`/api/get-candidate/${regno}`); // Use backticks (`) for template literals

    if (response.data) {
        setUserinfo(response.data);
      const currentTime = new Date().getTime();
      // Convert milliseconds to seconds (Unix timestamp format)
      const unixTimeStamp = Math.floor(currentTime / 1000);
      const examID = unixTimeStamp;
      setExamsID(examID)

    } else {
        // Handle case when candidate doesn't exist
        console.log('Candidate not found');
    }
}


//check if there is ongoing exams
const checkCompletedChallenges = async (regNo) => {
  try {
    // Make an API call to retrieve completed challenges for the candidate
    const response = await axios.get(`/api/completedchallenges/${regNo}`); // Adjust the endpoint according to your API
    
    if (response.data) {
      console.log('Completed Challenges:', response.data);
      setCompletedcChallenges(response.data)
      
    } else {
      console.log('No completed challenges found for registration number:', regNo);
    }
  } catch (error) {
    // Handle API call errors
    console.error('Error retrieving completed challenges:', error.response ? error.response.data : error.message);
  }
};

//create Exams


useEffect(() => {
  checkCompletedChallenges(regNo); // Assuming regNo is defined somewhere
  checkuser(regNo);
   
}, [regNo]);

useEffect(() => {
  setCounter(120)// Assuming regNo is defined somewhere
  
 
},[]);

const handleStartChallenge= () => {
 //checkexams (regNo)
 if (challenges && completedchallenges) {
  const incompleteChallenges = challenges.filter(challenge => {
    // Check if the challenge ID is not in the completedChallenges array
    return !completedchallenges.row.find(completedChallenge => completedChallenge.id === challenge.id);
  });




 navigate('/cbtchallenge', { state: { regNo: regNo,userinFor: userinfo,examID: examID,counTer: counter,completedchallenges: completedchallenges,challenges:challenges,chid: incompleteChallenges[0].id} });

}


  //setChallenges(incompleteChallenges);
 //console.log(counter)
}

const getCurrentDate = () => {
  const currentDate = new Date();
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const month = months[currentDate.getMonth()];
  const day = String(currentDate.getDate()).padStart(2, '0');
  const year = currentDate.getFullYear();
  return `${month} ${day}, ${year}`;
};

const showcert = () => {
  navigate('/certificate', { state: { regNo: regNo,userinFor: userinfo, cdate:getCurrentDate() } });
}

useEffect(() => {
  // Fetch challenges from the database
  axios.get('/api/challenges')
    .then(response => {
     setChallenges(response.data.row);
     console.log(response.data)
    })
    .catch(error => {
      console.error('Error fetching challenges:', error);
    });
}, []);

const allChallengesCompleted = challenges.length === completedchallenges.length;

return (
  <div className="container" style={{ marginTop: '50px' }}>
    <div className="row">
      <div className="col-md-7 border-right">
        <div className="terms-container">
          <div className="challenge-terms-container text-center">
          <img className="card-img-top sm" src={logo} alt='app logo' style={{ width: '100px', height: 'auto' }} />
    
  <h2 className="mb-4">Terms</h2>
 
  <ol className="list-group list-group-numbered" style={{ textAlign: 'justify', margin: 'auto', maxWidth: '600px' }}>
  <p>
    By accessing and participating in the challenges on this platform, you agree to abide by the following terms and conditions:
  </p>
    <li className="list-group-item">
      <strong>Eligibility:</strong> Challenges are open to candidates who meet the eligibility criteria specified for each challenge.
    </li>
    <li className="list-group-item">
      <strong>Code of Conduct:</strong> Participants are expected to adhere to a high standard of conduct during challenges. Any form of cheating, plagiarism, or unethical behavior is strictly prohibited.
    </li>
    <li className="list-group-item">
      <strong>Intellectual Property:</strong> All submissions made during challenges remain the intellectual property of the participant. However, by submitting a solution, participants grant the platform the right to showcase, reproduce, and distribute their work for promotional or educational purposes.
    </li>
    <li className="list-group-item">
      <strong>Prizes and Rewards:</strong> Prizes and rewards, Certificate of completion will be awarded after completion of all challenges. The platform reserves the right to modify or cancel prizes at its discretion.
    </li>
    <li className="list-group-item">
      <strong>Disclaimer:</strong> The platform is not responsible for any technical issues, errors, or interruptions that may occur during challenges. Participation in challenges is at the participant's own risk.
    </li>
  </ol>
  <p className="mt-4">
    By participating in challenges, you acknowledge that you have read, understood, and agree to abide by these terms and conditions.
  </p>
</div>
      </div>
        <button className="btn btn-success start-exam-btn" style={{ marginTop: '20px' }} onClick={handleStartChallenge}>
          Start Challenge
        </button>
&nbsp;
{allChallengesCompleted && (
        <button className="btn btn-success start-exam-btn" style={{ marginTop: '20px' }} onClick={showcert}>
          Print Certificate
        </button>
      )}
        <br /><br />
      </div>
      <div className="col-md-5 border-left">
        {/* Your right column content */}
        <h2 className="mb-5">Challenges</h2>
        {challenges.map((challenge, index) => (
    <div key={index}>
        <ul>
            <li>
                <strong>{challenge.challengeName}</strong><br/>
                {challenge.description}
                <br />
              
               {completedchallenges.row && completedchallenges.row.find(completedchallenges => completedchallenges.challengeID === challenge.id) ? (
                    <p style={{ color: 'green' }}>Status: Completed</p>
                ) : (
                    <p style={{ color: 'red' }}>Status: Not Completed</p>
                )}
            </li>
        </ul>
    </div>
))}
      </div>
    </div>
  </div>
);
}
