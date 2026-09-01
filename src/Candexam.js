import React from 'react'
import axios from 'axios';

import { useEffect,useRef, useState } from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarXmark, faClock } from "@fortawesome/free-regular-svg-icons";
import { faBullseye, faCalculator } from '@fortawesome/free-solid-svg-icons';
import { useLocation } from 'react-router-dom';
import { Link } from "react-router-dom";

import Modal from 'react-bootstrap/Modal';

import { useNavigate} from 'react-router-dom';
import { useExam } from './hooks/useExam'; 
export default function Candexam() {

  const location = useLocation();
  const regNo = location?.state && location?.state?.regNo;
  const userinfo = location?.state && location?.state?.userinFor;
  const examID = location?.state && location?.state?.examID;
  const counTer= location?.state && location?.state?.counTer;

  const {
    questions,
    candidateSubjects,
    answered,
    isLoading,
    saveAnswer,
    isSaving,
    updateTimer,
  } = useExam(examID, regNo);


  console.log('questions')
    console.log(candidateSubjects)
      console.log(questions)
        console.log(answered)

  const [selectedSubject, setSelectedSubject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const qidRef = useRef(null); // Create a ref to the hidden input field

  const [isOptionA, setisOptionA] = useState(false);
  const [isOptionB, setisOptionB] = useState(false);
  const [isOptionC, setisOptionC] = useState(false);
  const [isOptionD, setisOptionD] = useState(false);

  const [show, setShow] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  
 // 120 minutes in seconds
  const [timeElapsed, setTimeElapsed] = useState(0);

  const [showEndExamModal, setshowEndExamModal] = useState(false);
  const handleCloseEndexammodal = () => setshowEndExamModal(false);
  const handleShowexamModal = () => {setshowEndExamModal(true);
    populateResults();
  }



  const [results, setResults] = useState([]);
  const [counter, setCounter] = useState(counTer);
  //const counter= counTer;
  const [showEndExamButton, setShowEndExamButton] = useState(false);
  // Function to update selectedQuestionIndex



 

 useEffect(() => {
  if (!isLoading && candidateSubjects.length > 0 && !selectedSubject) {
    setSelectedSubject(candidateSubjects[0]);
    setSelectedQuestionIndex(0);
  }
}, [isLoading, candidateSubjects, selectedSubject]);








  const selectRandomSubject = () => {
    if (candidateSubjects.length > 0) {
      const randomIndex = Math.floor(Math.random() * candidateSubjects.length);
      const randomSubject = candidateSubjects[randomIndex];
      setSelectedSubject(randomSubject);
    }
  };




const handleAnswerSelection = (selectedOption) => {
  if (!selectedSubject || !selectedQuestion) return;

  // Save to backend first
  saveAnswer({
    questionId: selectedQuestion.id,
    candid: regNo,
    subjId: selectedSubject.subjID,
    examID,
    selectedOption,
  });
  
  // UI will update through the useEffect below that watches 'answered'
};
  



  const handleSubjectSelect = (subject) => {
    setSelectedSubject(subject);
    const selectedSubjectQuestions = questions.filter(question => question.subjID === subject.subjID);
    if (selectedSubjectQuestions.length > 0) {
      setSelectedQuestionIndex(0);
    }
  };

  const handleQuestionSelection = (index) => {
    setSelectedQuestionIndex(index);
  };

  // Filter questions based on selected subject
 const filteredQuestions = selectedSubject 
    ? questions.filter(q => q.subjID === selectedSubject.subjID) 
    : [];

  const selectedQuestion = filteredQuestions[selectedQuestionIndex];


const isOptionSelected = (qid) => {
  const item = answered.find(item => item.qid === qid);
  return item && item.selectedOption !== null && item.selectedOption !== undefined;
};
let SelectedsubjquestionCount =0;

if (selectedSubject) {
  const selectedSubjectQuestions = questions.filter(question => question.subjID === selectedSubject.subjID);
  SelectedsubjquestionCount = selectedSubjectQuestions.length;
}







useEffect(() => {
  if (selectedQuestion) {
    const answeredQuestion = answered.find(
      item => item.qid === selectedQuestion.id
    );
    
    if (answeredQuestion?.selectedOption) {
      const option = answeredQuestion.selectedOption.toUpperCase();
      setisOptionA(option === 'A');
      setisOptionB(option === 'B');
      setisOptionC(option === 'C');
      setisOptionD(option === 'D');
    } else {
      setisOptionA(false);
      setisOptionB(false);
      setisOptionC(false);
      setisOptionD(false);
    }
  }
}, [selectedQuestion, answered]);


   const [showModal, setShowModal] = useState(false);


   const toggleModal = () => {
    setShowModal(!showModal);
  };


  const [expression, setExpression] = useState('');
  const [result, setResult] = useState('');

  const handleClick = (value) => {
    if (value === '=') {
      try {
        const evalResult = eval(expression);
        setResult(evalResult);
      } catch (error) {
        setResult('Error');
      }
    } else if (value === 'AC') {
      setExpression('');
      setResult('');
    } else {
      setExpression((prevExpression) => prevExpression + value);
    }
  };




 const navigate = useNavigate();
  const handleCompletedExam = () => {
    navigate('/completedexam', { 
      state: { regNo, result: results, questions } 
    });
    updateTimer({
      timeElapsed: counter,
      status: 'Submitted',
      examID,
      regNo
    });
  };




  // Handle countdown completion
 useEffect(() => {
    const timer = counter > 0 && setInterval(() => {
      setCounter(prev => prev - 1);
    }, 60000);
    
    if (counter <= 90) {
      setShowEndExamButton(true);
    }

    // Update timer in backend every minute
    if (counter > 0) {
      updateTimer({
        timeElapsed: counter,
        status: 'Ongoing',
        examID,
        regNo
      });
    }

    return () => clearInterval(timer);
  }, [counter]);

  // Handle exam completion
  useEffect(() => {
    if (counter <= 0) {
      updateTimer({
        timeElapsed: counter,
        status: 'Elapsed',
        examID,
        regNo
      });
      handleCompletedExam();
    }
  }, [counter]);







 useEffect(() => {
    const handleKeyPress = async (event) => {
      const key = event.key?.toLowerCase();

      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
      }

      switch (key) {
        case 'a':
        case 'b':
        case 'c':
        case 'd':
          handleAnswerSelection(key.toUpperCase());
          break;
        case 'n':
          handleNextQuestion();
          break;
        case 'p':
          handlePreviousQuestion();
          break;
        case 's':
          if (counter <= 60) {
            setshowEndExamModal(true);
            populateResults();
          }
          break;
        case 'y':
          if (showEndExamModal) {
            handleCompletedExam();
          }
          break;
        case 'r':
          if (showEndExamModal) {
            setshowEndExamModal(false);
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedSubject, selectedQuestion, selectedQuestionIndex, filteredQuestions, counter, showEndExamModal]);

 
 
 const populateResults = () => {
    const newResults = answered
      .map(answer => {
        const question = questions.find(
          q => q.id === answer.qid && q.subjID === answer.subjid
        );
        if (question) {
          return {
            qid: answer.qid,
            selectedoption: answer.selectedOption,
            answer: question.answer,
            grade: answer.selectedOption === question.answer ? 2.5 : 0
          };
        }
        return null;
      })
      .filter(Boolean);
    
    setResults(newResults);
  };
 

  // In fetchData function, update the state with answeredStatus


const renderedButtons = filteredQuestions.map((question, index) => {
  const questionNumber = index + 1;
  const isCurrentQuestion = index === selectedQuestionIndex;
  const isAnswered = isOptionSelected(question.id);
  
  // Determine button class based on state
  let buttonClass = 'btn btn-xs ';
  if (isCurrentQuestion) {
    buttonClass += 'btn-info'; // Current question = blue
  } else if (isAnswered) {
    buttonClass += 'btn-primary'; // Answered = primary color
  } else {
    buttonClass += 'btn-danger'; // Not answered = red
  }
  
  return (
    <button
      key={index}
      className={buttonClass}
      style={{ marginRight: '4px' }}
      type="button"
      onClick={() => handleQuestionSelection(index)}
    >
      {questionNumber}
    </button>
  );
});
 



const handlePreviousQuestion = () => {
  // If not the first question of current subject → go to previous question
  if (selectedQuestionIndex > 0) {
    handleQuestionSelection(selectedQuestionIndex - 1);
  } 
  // If at the FIRST question of current subject → move to previous subject
  else if (selectedSubject && candidateSubjects.length > 0) {
    const currentSubjectIndex = candidateSubjects.findIndex(
      subject => subject.subjID === selectedSubject.subjID
    );

    // If THERE IS a previous subject
    if (currentSubjectIndex > 0) {
      const prevSubject = candidateSubjects[currentSubjectIndex - 1];

      // Switch subject
      setSelectedSubject(prevSubject);

      // Find questions of the previous subject
      const prevSubjectQuestions = questions.filter(
        q => q.subjID === prevSubject.subjID
      );

      // Set index to LAST question of that subject
      setSelectedQuestionIndex(prevSubjectQuestions.length - 1);
    }
  }
};


const handleNextQuestion = () => {
  // If not at the last question of current subject, move to next question
  if (selectedQuestionIndex < filteredQuestions.length - 1) {
    handleQuestionSelection(selectedQuestionIndex + 1);
  } 
  // If at the last question of current subject, move to next subject
  else if (selectedSubject && candidateSubjects.length > 0) {
    const currentSubjectIndex = candidateSubjects.findIndex(
      subject => subject.subjID === selectedSubject.subjID
    );
    
    // Check if there's a next subject
    if (currentSubjectIndex < candidateSubjects.length - 1) {
      const nextSubject = candidateSubjects[currentSubjectIndex + 1];
      setSelectedSubject(nextSubject);
      setSelectedQuestionIndex(0); // Start from first question of next subject
    }
  }
};

const isLastQuestionOfLastSubject = () => {
  if (!selectedSubject || candidateSubjects.length === 0) return false;
  
  const currentSubjectIndex = candidateSubjects.findIndex(
    subject => subject.subjID === selectedSubject.subjID
  );
  
  const isLastSubject = currentSubjectIndex === candidateSubjects.length - 1;
  const isLastQuestion = selectedQuestionIndex === filteredQuestions.length - 1;
  
  return isLastSubject && isLastQuestion;
};

 const totalAnsweredQuestions = answered.filter(
    item => item.selectedOption !== null
  ).length;
  
  const totalQuestionsCount = questions.length;
  
  const questionCountPersubject = filteredQuestions.length;
  


  const isFirstQuestionOfFirstSubject = () => {
  if (!selectedSubject || candidateSubjects.length === 0) return false;

  const currentSubjectIndex = candidateSubjects.findIndex(
    subject => subject.subjID === selectedSubject.subjID
  );

  const isFirstSubject = currentSubjectIndex === 0;
  const isFirstQuestion = selectedQuestionIndex === 0;

  return isFirstSubject && isFirstQuestion;
};

  const totalAnsweredPersubjectQuestions = selectedSubject
    ? answered.filter(
        item => item.subjid === selectedSubject.subjID && item.selectedOption !== null
      ).length
    : 0;

  if (isLoading) {
    return (
      <div className="loading-container" style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <h3>Loading exam...</h3>
      </div>
    );
  }
  return (
    <>


 
      <div className="gray-bg pace-done" oncontextMenu="return false;">

        <div className="gray-bg pace-done" oncontextMenu={() => false}>
          <div className="pace pace-inactive">
            <div className="pace-progress" data-progress-text="100%" data-progress={99} style={{ transform: 'translate3d(100%, 0px, 0px)' }}>
              <div className="pace-progress-inner"></div>
            </div>
            <div className="pace-activity"></div>
          </div>
        </div>

        <div className="row wrapper border-bottom bg-primary page-heading" style={{ paddingTop: '20px' }}>
          <div className="col-md-8" style={{ textAlign: 'left' }}>

            {candidateSubjects.map((subject, index) => (
             

              <button className={`btn btn-sm ${selectedSubject === subject ? 'btn-info' : 'btn-success'} m-t-n-xs`} style={{ marginRight: 4 }} key={index} onClick={() => handleSubjectSelect(subject)}>
                <strong >{subject.subj}</strong>
              </button>
             

            ))}
            <button className="btn btn-success m-t-n-xs" type="button" onClick={handleShow}>
        <i className="fa fa-calculator" aria-hidden="true"> <FontAwesomeIcon icon={faCalculator} /></i>
      </button>
          </div>

          <div className="col-md-3">
      <i className="fa fa-fw fa-clock-o"> <FontAwesomeIcon icon={faClock} /></i> Timer
      <a className="btn btn-md btn-success">{counter}</a>

      {showEndExamButton && (
        <button className="btn btn-danger" style={{ marginLeft: '8px' }} onClick={handleShowexamModal}>End Exam</button>
      )}
          </div>
          <div _ngcontent-c4="" className="col-md-2">

          </div>
        </div>
        <div className="wrapper wrapper-content">
          <div className="row">
            <div className="col-md-10">
             {selectedSubject && (
  <div className="ibox float-e-margins">
    <div className="ibox-title">
      <div className="text-navy" style={{ display: 'block', fontWeight: 'bold', fontSize: 16, textAlign: 'left' }}>
        {selectedSubject.subj}
      </div>
      <div style={{ display: 'block', fontWeight: 'bold', textAlign: 'left' }}>
        Question {selectedQuestionIndex + 1} of {filteredQuestions.length}
      </div>
    </div>
    <div className="ibox-content" style={{ minHeight: '70vh' }}>
      <div className="row">
        <div className="col-md-12" style={{ minHeight: '63vh', maxHeight: '63vh', overflowY: 'scroll', borderBottom: '1px solid #E7EAEC', fontSize: 15, fontFamily: 'Times New Roman', textAlign: 'left' }}>
          {selectedQuestion ? (
            <div>
              <input ref={qidRef} id="qid" type="hidden" value={selectedQuestion.id} />
              <div style={{ fontFamily: 'Times New Roman', fontSize: 17, wordWrap: 'break-word' }}>
                <b>{selectedQuestion.subtitle ? selectedQuestion.subtitle.toUpperCase() : null}</b><br /><br />
                {selectedQuestion.question}<br />
              </div>
          {['A', 'B', 'C', 'D'].map((option) => (
  <div key={option} style={{ marginBottom: '10px', cursor: 'pointer' }}>
    <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', width: '100%' }}>
      <span style={{ display: 'inline-block', marginRight: 5, fontWeight: 'bold' }}> 
        ({option}) 
      </span>
      <input
        name="questionOption"
        style={{ width: 20, cursor: 'pointer', marginRight: 10 }}
        type="radio"
        value={option}
        checked={
          option === 'A' ? isOptionA : 
          option === 'B' ? isOptionB : 
          option === 'C' ? isOptionC : 
          isOptionD
        }
        onChange={() => handleAnswerSelection(option)}
      />
      <span style={{ display: 'inline-block', flex: 1 }}>
        {selectedQuestion[`opt${option}`]}
      </span>
    </label>
  </div>
))}
            </div>
          ) : (
            <p>No questions available for {selectedSubject.subj}.</p>
          )}
        </div>
      </div>
      
      {/* Navigation Buttons */}
      <div className="row" style={{ marginTop: 20 }}>
        <div className="col-md-2">
          <button 
            className="btn btn-w-m btn-primary" 
            type="button"
            onClick={handlePreviousQuestion}
            disabled={isFirstQuestionOfFirstSubject()}
            style={{ opacity: isFirstQuestionOfFirstSubject() ? 0.5 : 1 }}
          >
            PREVIOUS (P)
          </button>
        </div>
        <div className="col-md-8">
          <div style={{ textAlign: 'center' }}>
            {renderedButtons}
          </div>
        </div>
        <div className="col-md-2">
          <button 
            className="btn btn-w-m btn-primary" 
            type="button"
            onClick={handleNextQuestion}
            disabled={isLastQuestionOfLastSubject()}
                          style={{ opacity: isLastQuestionOfLastSubject() ? 0.5 : 1 }}
                        >
            NEXT (N)
          </button>
        </div>
      </div>
    </div>
  </div>
)}
     </div>



            <div className="col-md-2">
              <div className="ibox float-e-margins">
                <div className="ibox-title">
                  <h5>Candidate Details</h5>
                </div>
                <div className="ibox-content" style={{ minHeight: "70vh" }}>
                  <div>
                    <qr-code>
                      <img height="100" width="100" src="/qrcode.png" />
                    </qr-code>
                  </div>
                  <span>
                  
                  <img src={userinfo?.img} alt="Candidate Image" className="img rounded-circle" />
                  </span>
                  <h5 className="text-uppercase text-success"><b>{ userinfo.fullname}</b></h5>
                  <h5 className="text-uppercase text-success"><b>{regNo}</b></h5>
                  <h5>Seat No: 11</h5>
                  <h5><b>ATTEMPTED {totalAnsweredPersubjectQuestions} OF {questionCountPersubject} {selectedSubject ? <span className="text-navy">{selectedSubject.subj}</span> : null}</b></h5>
                  <h5><b>Total Questions Attempted:<br /> {totalAnsweredQuestions} OF {totalQuestionsCount}</b></h5>
                </div>
              </div>
            </div>
          </div>
   <Link
  to="/"
  className="btn btn-danger"
  style={{ fontSize: '0.8rem', padding: '4px 8px' }}
>
  Back to Dashboard
</Link>
        </div>
  
<div header="Calculator"  width="300" className="ng-tns-c5-0">
      <Modal show={show} onHide={handleClose} dialogClassName="modal-sm">
        
        <Modal.Body>
       <div className="calculator-container w-container">
          <div className="calc-background-field">
            <div className="formula">={result}</div>
            <div className="_100 calcelement">
              <div className="text-field-wrapper w-form">
                <form data-name="calculator io" id="wf-form-calculator-io" name="wf-form-calculator-io" noValidate className="ng-untouched ng-pristine ng-valid">
                  <input className="text-field w-input ng-untouched ng-pristine ng-valid" data-name="lcd" id="lcd" maxLength="256" name="lcd" pattern="[0-9-+*/.()]" placeholder="0" readOnly type="text" style={{ backgroundColor: 'rgb(66, 66, 66)' }} value={expression} />
                  </form>
                  </div>
                </div>
                <div className="_25 button calcelement" onClick={() => handleClick('(')}>(</div>
        <div className="_25 button calcelement" onClick={() => handleClick(')')}>)</div>
        <div className="_25 _50 button calcelement" onClick={() => handleClick('AC')}>AC</div>
        <div className="_25 bold button calcelement" onClick={() => handleClick('7')}>7</div>
        <div className="_25 bold button calcelement" onClick={() => handleClick('8')}>8</div>
        <div className="_25 bold button calcelement" onClick={() => handleClick('9')}>9</div>
        <div className="_25 button calcelement" onClick={() => handleClick('/')}>÷</div>
        <div className="_25 bold button calcelement" onClick={() => handleClick('4')}>4</div>
        <div className="_25 bold button calcelement" onClick={() => handleClick('5')}>5</div>
        <div className="_25 bold button calcelement" onClick={() => handleClick('6')}>6</div>
        <div className="_25 button calcelement" onClick={() => handleClick('*')}>x</div>
        <div className="_25 bold button calcelement" onClick={() => handleClick('1')}>1</div>
        <div className="_25 bold button calcelement" onClick={() => handleClick('2')}>2</div>
        <div className="_25 bold button calcelement" onClick={() => handleClick('3')}>3</div>
        <div className="_25 button calcelement" onClick={() => handleClick('-')}>-</div>
        <div className="_25 bold button calcelement" onClick={() => handleClick('0')}>0</div>
        <div className="_25 button calcelement" onClick={() => handleClick('.')}>.</div>
        <div className="_25 button calcelement" onClick={() => handleClick('=')}>=</div>
        <div className="_25 button calcelement" onClick={() => handleClick('+')}>+</div>
     </div>
            </div>
        
            <div className="ui-dialog-footer ui-widget-content ng-tns-c5-0">
      <p-footer className="_ngcontent-c4_">
        <button icon="fa-close" label="close" pbutton type="button" className="ui-button ui-widget ui-state-default ui-corner-all ui-button-text-icon-left">
          <span className="ui-button-icon-left ui-clickable fa fa-fw fa-close"></span>
          <span className="ui-button-text ui-clickable" onClick={handleClose}>Close</span>
        </button>
      </p-footer>
    </div>
        </Modal.Body>
      </Modal>

      </div>

      </div>


      <Modal show={showEndExamModal} onHide={handleCloseEndexammodal} dialogClassName="modal-sm">
        
        <Modal.Body>
    <div class="container mt-5">

   
      <h4>
        <strong>
          Are you sure you want to submit? 
          <p>Total number of questions answered: <span id="answered-questions">{totalAnsweredQuestions} OF {totalQuestionsCount}</span></p>
          If yes, click 
          <span style={{ color: 'red' }}> Y </span>. 
          Otherwise, click 
          <span style={{ color: 'green' }}> R </span> 
          to continue the exam.<br /> <br /><br />
        </strong>
      </h4>

  <div className="exam-buttons">
    <button className="btn continue-btn btn-success mr-2 btn-sm" style={{ marginRight: '4px' }} onClick={handleCloseEndexammodal}>Continue Exam (R)</button>
    <button className="btn end-btn btn-danger btn-sm" onClick={handleCompletedExam }> End Exam (Y)</button>
  </div>
</div>
        </Modal.Body>
      </Modal>
    </>
  );
}