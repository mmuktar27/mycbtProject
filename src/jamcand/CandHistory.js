import { useLocation } from 'react-router-dom';

import axios from 'axios';
import React, { useEffect, useState } from 'react'

export default function CandHistory() {

    const location = useLocation();
    const regNo = location.state && location.state.regNo;
    const [exams, setExams] = useState([]);




    

    const fetchData = async (regNo) => {
        //continue to users history page
     
    
        try {
          // Make an API call to check if the candidate exists
          const response = await axios.get(`/api/getexams/${regNo}`); // Use backticks (`) for template literals
      
          if (response.data) {
          //  console.log('Exam ID:', response.data.candid);
          setExams(response.data.row)
            console.log(response.data)
          } else {
            // Handle case when exam doesn't exist
            alert('User does not exist!');
          }
        } catch (error) {
          // Handle API call errors
          console.error('Error checking exams:', error.response ? error.response.data : error.message);
        }
      };
      useEffect(() => {
     fetchData(regNo)
      }, [regNo]);

      const getStatusColor = (status) => {
        switch (status) {
          case 'Ongoing':
            return 'lightblue'; // Example color for ongoing status
          case 'submitted':
            return 'lightgreen'; // Example color for submitted status
          case 'Elapse':
            return 'lightyellow'; // Example color for elapsed status
          default:
            return 'lightgray'; // Default color
        }
      };

    
  return (
    <div className="container" >
 
      {exams.map((item, index) => (
        <div className="row justify-content-center mt-4" >
         <div key={item.id} className="card bg-light mb-3"  style={{ maxWidth: '400px', backgroundColor: 'blue'}}>
          <div className="card-body" style={{backgroundColor: getStatusColor(item.status)}}>
       
            <h5 className="card-text">Exam ID: {item.examID}</h5>
            <p className="card-text">Time Elapsed: {item.timeElapse}</p>
            <p className="card-text">Candidate ID: {item.candID}</p>
            <p className="card-text">Status: {item.status}</p>{console.log(getStatusColor(item.status))}
            {item.status === 'Submitted' || item.status === 'Elapse' ? (
                <button className="btn btn-primary">View Result</button>
              ) : null}
          </div>
          </div>
          </div>
      ))}
    </div>  
  )
}
