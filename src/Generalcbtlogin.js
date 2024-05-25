import React from 'react';
import { useLocation } from 'react-router-dom';
import { useNavigate} from 'react-router-dom';
import { Link } from "react-router-dom";
import axios from 'axios';

import { useEffect, useState } from 'react';

export default function Generalcbtlogin() {

  const [examID, setExamsID] = useState(1);
  const [counter, setCounter] = useState(0);
  const [subjectsID, setSubjectsID] = useState([]);

  const [subjects, setSubjects] = useState([]);

  const navigate = useNavigate();
 
  const [selectedSubjects, setSelectedSubjects] = useState([]);


  const handleCheckboxChange = (event, subjectId, subj) => {
    const isChecked = event.target.checked;
  
    if (isChecked) {
      // If checkbox is checked, add subjectId to selectedSubjects
      if (selectedSubjects.length < 4) {
        setSelectedSubjects(prevSelected => [...prevSelected, { subjID: subjectId, subj: subj }]);
        setSubjectsID(prevSelected => [...prevSelected, subjectId]);
      } else {
        // Show an alert or message indicating that only 4 subjects can be selected
        alert('You can select a maximum of 4 subjects');
        event.target.checked = false; // Uncheck the checkbox
      }
    } else {
      // If checkbox is unchecked, remove subjectId from selectedSubjects
      setSelectedSubjects(prevSelected => prevSelected.filter(item => item.subjID !== subjectId));
      setSubjectsID(prevSelected => prevSelected.filter(id => id !== subjectId));
    }
  };
  




//get all subjects or courses
const getSubjects = async () => {
    try {
      const response = await axios.get(`/api/subjects`);
      if (response.data) {
        console.log(response.data)
        setSubjects(response.data);
      } else {
        console.log('No subjects found');
      }
    } catch (error) {
      console.error('Error retrieving subjects:', error.response ? error.response.data : error.message);
    }
  };

  useEffect(() => {
    getSubjects();
  }, []);


useEffect(() => {
  if (selectedSubjects.length === 4) {
    setCounter(120);
  } else if (selectedSubjects.length === 3) {
    setCounter(90);
  } else if (selectedSubjects.length === 2) {
    setCounter(60);
  } else if (selectedSubjects.length === 1) {
    setCounter(30);
  } else {
    setCounter(0); // Set counter to 0 if no subjects selected
  }
  
  }, [selectedSubjects]);
  

const handleStartQuize = () => {

 navigate('/generalcbt', { state: {examID: examID,subjects:selectedSubjects,subjectsID: subjectsID, counter: counter} });

}

{console.log(counter)}
return (
    <div className="container" style={{ marginTop: '50px', display: 'flex', justifyContent: 'center' }}>
    <div className="col-md-7 border-right">
      <div className="terms-container">
        <div className="challenge-terms-container text-center">
          <h2 className="mb-4">Select Subjects</h2>
          <ul style={{ listStyleType: 'none', paddingLeft: '0' }}>
            {subjects.map(subject => (
              <li key={subject.id} style={{ textAlign: 'center' }}>
                <label>{subject.subj}</label> &nbsp;&nbsp;&nbsp;
                <input
                  type="checkbox"
                  checked={subjectsID.includes(subject.subjID)}
                  onChange={e => handleCheckboxChange(e, subject.subjID,subject.subj)}
                />
              </li>
            ))}
          </ul>
        </div>
      </div>
      <button className="btn btn-success start-exam-btn" style={{ marginTop: '20px' }} onClick={handleStartQuize}>
        Start Quiz
      </button>
      <br /><br />
    </div>
  </div>
);
}
