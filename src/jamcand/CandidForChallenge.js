import React, { useState}from 'react';
import { useNavigate} from 'react-router-dom';
import axios from 'axios';


export default function CandidForChallenge() {

  
    const [regNo, setRegNo] = useState('');
    const [candidateExists, setCandidateExists] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showAlert, setShowAlert] = useState(false);
    const navigate = useNavigate();
    const handleSubmit = async (event) => {
      event.preventDefault();
      setIsLoading(true);
  
      try {

       
        // Make an API call to check if the candidate exists
        const response = await axios.post('/api/check-candidate', { regNo });
  
        if (response.data.exists) {
          // If candidate exists, navigate to the terms page
         navigate('/challengetermspage' , { state: { regNo: regNo } });
        } else {
          // Handle case when candidate doesn't exist
          //alert('Candidate does not exist!!!')
        setShowAlert(true); 
          console.log('Candidate not found');
        }
      } catch (error) {
        console.error('Error checking candidate in DB:', error);
        // Handle error
      } finally {
        setIsLoading(false);
      }
    };
  
  return (
    <>
  
   
    

    <div style={{ backgroundColor: '#add8e6' }} className="container-fluid d-flex justify-content-center align-items-center vh-100 ">
   
    
    
    <div className="row">
   
      <div className="col">
      {showAlert && (
        <div className="alert alert-danger" role="alert">
          Candidate does not exist
        </div>
      )}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input type="text" style={{ marginBottom: '1.5px' }} className="form-control" placeholder="Enter Your Reg No" value={regNo}
          onChange={(e) => {setRegNo(e.target.value); setShowAlert(false)}}/>
          </div>
          <div className="form-group d-flex justify-content-center">
          <button type="submit" className="btn btn-success" style={{ width: '100%' }}>
          {isLoading ? 'Loading...' : 'Submit'}
        </button>
      </div>
  
        </form>
      </div>
    </div>
  </div>
  </>
  )
}
