import React, { useState, useEffect } from 'react';

const QuestionsPerPage = 10;

const Pagination = ({ totalQuestions, onPageChange }) => {
  const totalPages = Math.ceil(totalQuestions / QuestionsPerPage);

  const handlePageChange = (page) => {
    onPageChange(page);
  };

  return (
    <div>
      {[...Array(totalPages)].map((_, index) => (
        <button key={index} onClick={() => handlePageChange(index + 1)} className='btn btn-info'>
          {index + 1}
        </button>
      ))}
    </div>
  );
};



const QuestionList = ({ questions, results ,startIndex }) => {
  // Step 1: Extract all unique subjIDs
  const uniqueSubjIDs = [...new Set(questions.map(question => question.subjID))];

  // Step 2: Generate a variable to hold questions based on subject
  const questionsBySubject = {};

  // Iterate through unique subject IDs and filter questions for each subject
  uniqueSubjIDs.forEach(subjID => {
    questionsBySubject[subjID] = questions.filter(question => question.subjID === subjID);
  });

  console.log(questions)
  // Step 3: Display all questions for each subjID
  return (
    <div>
      {uniqueSubjIDs.map(subjID => (
        <div key={subjID}>
          <h2>Subject ID: {subjID}</h2>
          {questionsBySubject[subjID].map((question, index) => {
            const serialNumber = startIndex + index + 1; // Adjusted serial number
            const userAnswer = results.find(result => result.qid === question.id)?.selectedoption || '';
            return (
              <div key={question.id}>
                <div style={{ fontFamily: 'Times New Roman', fontSize: 17, wordWrap: 'break-word', display: 'flex', alignItems: 'center' }}>
                  <p>
                    <strong>Question {question.sn}: &nbsp;{question.question}</strong>
                  </p>
                </div>
                <form style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ display: 'flex', alignItems: 'center' }}>
                    <input type="radio" style={{ width: 20, marginRight: 5 }} value="A" disabled checked={userAnswer === 'A'} />
                    {question.optA}
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center' }}>
                    <input type="radio" style={{ width: 20, marginRight: 5 }} value="B" disabled checked={userAnswer === 'B'} />
                    {question.optB}
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center' }}>
                    <input type="radio" style={{ width: 20, marginRight: 5 }} value="C" disabled checked={userAnswer === 'C'} />
                    {question.optC}
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center' }}>
                    <input type="radio" style={{ width: 20, marginRight: 5 }} value="D" disabled checked={userAnswer === 'D'} />
                    {question.optD}
                  </label>
                  <br />
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <p>
                      <strong>Correct Answer:</strong> {question.answer}
                    </p>{' '}
                    <br />
                    <br />{' '}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <p>
                      <strong>Hints:</strong> {question.desc}
                    </p>
                  </div>
                </form>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};




export default function ExamSummary({ questions, results }) {
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when questions change
  }, [questions]);

  const startIndex = (currentPage - 1) * QuestionsPerPage;
  const endIndex = Math.min(startIndex + QuestionsPerPage, questions.length);

  let currentSubject = null; // Variable to track the current subject
  let sn = 0; // Serial number counter
  
  const sortedQuestions = questions
    .sort((a, b) => {
      if (a.subjID < b.subjID) return -1;
      if (a.subjID > b.subjID) return 1;
      return 0;
    }).map((question) => {
      // If subject changes, reset serial number counter
      if (question.subjID !== currentSubject) {
        currentSubject = question.subjID;
        sn = 0; // Reset serial number counter
      }
      sn++; // Increment serial number counter
      return {
        ...question,
        sn: sn // Set serial number
      };
    });
  

  const currentQuestions = sortedQuestions.slice(startIndex, endIndex);
  


  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div>
   <QuestionList questions={currentQuestions} results={results} startIndex={startIndex} />
      <Pagination totalQuestions={questions.length} onPageChange={handlePageChange} />
    </div>
  );
}
