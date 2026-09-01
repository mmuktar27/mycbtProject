import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import React, { useEffect, useState } from 'react';

export default function CandHistory() {
  const location = useLocation();
  const navigate = useNavigate();
  const regNo = location.state && location.state.regNo;
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async (regNo) => {
    try {
      const response = await axios.get(`/api/getexams/${regNo}`);
      
      if (response.data) {
        setExams(response.data.row);
        console.log(response.data);
      } else {
        alert('User does not exist!');
      }
    } catch (error) {
      console.error('Error checking exams:', error.response ? error.response.data : error.message);
    }
  };

  useEffect(() => {
    fetchData(regNo);
  }, [regNo]);

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'ongoing':
        return '#e3f2fd'; // Light blue for ongoing
      case 'submitted':
        return '#e8f5e9'; // Light green for submitted
      case 'elapse':
        return '#fff9c4'; // Light yellow for elapsed
      default:
        return '#f5f5f5'; // Light gray default
    }
  };

  const handleViewResult = async (examID, candID) => {
    setLoading(true);
    try {
      // Fetch the exam results
      const response = await axios.get(`/api/exam-results/${examID}/${candID}`);
      
      if (response.data) {
        const { results, questions } = response.data;
        
        // Navigate to CompletedExam component with the data
        navigate('/completedexam', {
          state: {
            regNo: candID,
            result: results,
            questions: questions
          }
        });
      } else {
        alert('No results found for this exam!');
      }
    } catch (error) {
      console.error('Error fetching exam results:', error);
      alert('Failed to load exam results. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      <div className="row mb-4">
        <div className="col-12">
          <h2 className="text-center">Exam History</h2>
          <p className="text-center text-muted">Candidate: {regNo}</p>
        </div>
      </div>

      {exams.length === 0 ? (
        <div className="alert alert-info text-center" role="alert">
          No exam history found.
        </div>
      ) : (
        exams.map((item, index) => (
          <div key={item.examID || index} className="row justify-content-center mb-3">
            <div className="col-md-6 col-lg-5">
              <div className="card shadow-sm">
                <div 
                  className="card-body" 
                  style={{ backgroundColor: getStatusColor(item.status) }}
                >
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <h5 className="card-title mb-0">Exam #{item.examID}</h5>
                    <span 
                      className={`badge ${
                        item.status.toLowerCase() === 'submitted' 
                          ? 'bg-success' 
                          : item.status.toLowerCase() === 'ongoing'
                          ? 'bg-primary'
                          : 'bg-warning'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                  
                  <div className="mb-2">
                    <strong>Time Elapsed:</strong> {item.timeElapse} minutes
                  </div>
                  <div className="mb-3">
                    <strong>Candidate ID:</strong> {item.candID}
                  </div>
                  
                  {(item.status.toLowerCase() === 'submitted' || item.status.toLowerCase() === 'elapse') && (
                    <button 
                      className="btn btn-primary w-100"
                      onClick={() => handleViewResult(item.examID, item.candID)}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Loading...
                        </>
                      ) : (
                        'View Result'
                      )}
                    </button>
                  )}
                  
                  {item.status.toLowerCase() === 'ongoing' && (
                    <button 
                      className="btn btn-success w-100"
                      onClick={() => navigate('/exam', { 
                        state: { 
                          regNo: item.candID, 
                          examID: item.examID 
                        } 
                      })}
                    >
                      Continue Exam
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))
      )}

      <div className="row justify-content-center mt-4">
        <div className="col-md-6 col-lg-5">
          <button 
            className="btn btn-secondary w-100"
            onClick={() => navigate('/', { state: { regNo } })}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}