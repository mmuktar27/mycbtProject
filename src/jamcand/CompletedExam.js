import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLocation} from 'react-router-dom';
import ExamSummary from './ExamSummary';
const CompletedExam = () => {

const location = useLocation();
const regNo = location.state && location.state.regNo;

const [results, setResult] = useState(location.state && location.state.result)
const [questions,  setQuestions]= useState(location.state && location.state.questions)
const [showResults, setShowResults] = useState(false);

const [showSummary, setShowSummary] = useState(false);

const [totalGrade, setTotalGrade] = useState(0)
function calculateTotalGrade(results) {
  let totalGrade = 0;

  results.forEach(result => {
      totalGrade += result.grade;
  });

  return totalGrade;
}

const handleviewResult = () => {
  const totalGrade = calculateTotalGrade(results);
  setTotalGrade(totalGrade)
  if(showResults===false){
    setShowResults(true)  
  }else{
    setShowResults(false)  
  }
 
}



const handleviewSummary = () => {
  if(showSummary===false ){
    setShowSummary(true)
  }else{
    setShowSummary(false)
  }
 
}
function organizeResultsBySubject() {
  const resultsBySubject = {};
  results.forEach(result => {
      const question = questions.find(question => question.id === result.qid);
      if (question) {
          const { subjID } = question;
          if (!resultsBySubject[subjID]) {
              resultsBySubject[subjID] = [];
          }
          resultsBySubject[subjID].push(result);
      }
  });
  return resultsBySubject;
}
    // Display results by subject
// Display overall grade for each subject
const renderedResultsBySubject = Object.entries(organizeResultsBySubject()).map(([subject, subjectResults]) => {
  // Calculate total grade for the subject
  const totalGradeForSubject = subjectResults.reduce((total, result) => total + result.grade, 0);

  return (
      <div key={subject}>
          <h3>{subject}</h3>
          <p>Total Points: {totalGradeForSubject}</p>
      </div>
  );
});

const handleshowresult = () => {

}

  return (
    <div>
  {/* Blue background navbar */}
  <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
    {/* Empty space to push the back button to the right */}
    <div style={{ width: '20vh', margin: '0 auto' }}>

    </div>
    <br/>  <br/>  <br/>  
  </nav>

  {/* Container for candidate details */}
  <div className="container mt-5">
    <div class="card card-outline-secondary">
      <div class="card-body">
        {/* Back button */}
        <div className="float-right mb-4">
          <button className="btn btn-danger">
            <Link to="/candid" className="text-white">Back</Link>
          </button>
        </div>

        {/* Rounded image and candidate name */}
        <div className="text-center">
          <img src="/Profileavatar.jpeg" className="rounded-circle" alt="Candidate" width="150" height="150" />
          <h2>candidateName</h2>
          <h3>{regNo}</h3>
        </div>

        {/* Text informing student */}
        <div className="text-center mt-4">
          <p>You have completed your exam.</p>
          <button onClick={handleviewResult} className='btn btn-info'>View Result</button>
          <div>
          {showResults &&(
          <>
          <h4>Overall Result</h4>
          <p>{totalGrade} Points</p>
          <h4>Result By Subjects</h4>
          {renderedResultsBySubject}
          <button className="btn btn-info" onClick={handleviewSummary}>
                  View Summary
                </button>
         
                </>
          )}
        </div>
        {showSummary &&(
<>
<h1>Exam Summary</h1>
            <ExamSummary questions={questions} results={results} />
</>
        )}
          </div>
        </div>
      </div>
    </div>
  </div>

  );
};

export default CompletedExam;
