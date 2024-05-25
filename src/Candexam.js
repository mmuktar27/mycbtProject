import React from 'react'
import axios from 'axios';

import { useEffect,useRef, useState } from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarXmark, faClock } from "@fortawesome/free-regular-svg-icons";
import { faBullseye, faCalculator } from '@fortawesome/free-solid-svg-icons';
import { useLocation } from 'react-router-dom';

import Modal from 'react-bootstrap/Modal';

import { useNavigate} from 'react-router-dom';

export default function Candexam() {

  const location = useLocation();
  const regNo = location.state && location.state.regNo;
  const userinfo = location.state && location.state.userinFor;
  const examID = location.state && location.state.examID;
  const counTer= location.state && location.state.counTer;
  const [questions, setQuestions] = useState([]);
  const [candidateSubjects, setCandidateSubjects] = useState([]);
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


  const [answered, setanswered] = useState([]);

  const [results, setResults] = useState([]);
  const [counter, setCounter] = useState(counTer);
  //const counter= counTer;
  const [showEndExamButton, setShowEndExamButton] = useState(false);
  // Function to update selectedQuestionIndex


{/* 
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
*/}
  useEffect(() => {
  
    fetchData(examID,regNo);
  

  }, [examID,regNo]);

  useEffect(() => {
    // Select a random subject once the candidateSubjects array is populated
    if (!loading && candidateSubjects.length > 0) {
      selectRandomSubject();
    }
  }, [loading, candidateSubjects]);


  const fetchData = async (examID, regNo) => {
    try {
      // Fetch questions data
      const questionsResponse = await axios.get(`/api/exam-questions/${regNo}`);
      const questionsData = questionsResponse.data;
  
      // Fetch answered questions data
      const answeredResponse = await axios.get(`/api/getAnswer/${examID}/${regNo}`);
      const answeredData = answeredResponse.data;
  
      // Set state based on the responses
      setanswered(answeredData);
      setCandidateSubjects(questionsData.candidateSubjects);
      setQuestions(questionsData.questions);

   

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      // Handle error or set appropriate state
    }
  };


  const updateAnswers = async (examID, regNo) => {
    try {
      // Fetch questions data
  
      // Fetch answered questions data
      const answeredResponse = await axios.get(`/api/getAnswer/${examID}/${regNo}`);
      const answeredData = answeredResponse.data;
  
      // Set state based on the responses
      setanswered(answeredData);
    } catch (error) {
      console.error('Error fetching data:', error);
      // Handle error or set appropriate state
    }
  };
  


  const selectRandomSubject = () => {
    if (candidateSubjects.length > 0) {
      const randomIndex = Math.floor(Math.random() * candidateSubjects.length);
      const randomSubject = candidateSubjects[randomIndex];
      setSelectedSubject(randomSubject);
    }
  };


  const handleAnswerSelect = (subjId, questionId, selectedOption) => {
    setSelectedOptions(prevOptions => {
      const subjectIndex = prevOptions.findIndex(option => option.subjId === subjId);
      if (subjectIndex === -1) {
        return [...prevOptions, { subjId, options: [{ questionId, selectedOption }] }];
      } else {
        return prevOptions.map(option => {
          if (option.subjId === subjId) {
            const questionIndex = option.options.findIndex(q => q.questionId === questionId);
            if (questionIndex === -1) {
              return { ...option, options: [...option.options, { questionId, selectedOption }] };
            } else {
              return {
                ...option,
                options: option.options.map(q => {
                  return q.questionId === questionId ? { ...q, selectedOption } : q;
                })
              };
            }
          }
          return option;
        });
      }
    });
  };

  const updateOptions=(option)=> {

    if (option== 'A'){
      setisOptionA(true)

      setisOptionB(false)
      setisOptionC(false)
      setisOptionD(false)
     }
     else if (option== 'B'){
      setisOptionB(true)

      setisOptionA(false)
      setisOptionC(false)
      setisOptionD(false)
     }
     else if (option== 'C'){
      setisOptionC(true)

      setisOptionB(false)
      setisOptionA(false)
      setisOptionD(false)
     }
     else if (option== 'D'){
      setisOptionD(true)

      setisOptionB(false)
      setisOptionC(false)
      setisOptionA(false)
     }else{
      setisOptionA(false)
      setisOptionB(false)
      setisOptionC(false)
      setisOptionD(false)
     }
  }

  const handleAnswerSelection = (subjId, questionId, selectedOption, candid,examID, event= null) => {
    // Make a GET request to check if the user has already selected an option
    axios.get(`/api/checkAnswer/${questionId}/${candid}/${subjId}/${examID}`)
      .then(response => {
        const existingAnswer = response.data;
        if (existingAnswer) {
          // If an existing answer is found, update it
          axios.put(`/api/saveAnswer/${existingAnswer.id}`, {
            selectedOption: selectedOption
          })
            .then(response => {
              // Handle success, if needed

           if(event !=null){
            setisOptionA(selectedOption === 'A');
            setisOptionB(selectedOption === 'B');
            setisOptionC(selectedOption === 'C');
            setisOptionD(selectedOption === 'D');
           }
                
                updateAnswers(examID,candid);
                    console.log('Selected option updated successfully:', response.data);
            })
            .catch(error => {
              // Handle error
              console.error('Error updating selected option:', error);
            });
        } else {
          // If no existing answer is found, insert a new record
          axios.post('/api/saveAnswer', {
            qid: questionId,
            canid: candid,
            subjid: subjId,
            examID: examID,
            selectedOption: selectedOption,
          })
            .then(response => {
              // Handle success, if needed
              if(event !=null){
                setisOptionA(selectedOption === 'A');
                setisOptionB(selectedOption === 'B');
                setisOptionC(selectedOption === 'C');
                setisOptionD(selectedOption === 'D');
               }

              updateAnswers(examID,candid);
              console.log('Selected option saved successfully:', response.data);
            })
            .catch(error => {
              // Handle error
              console.error('Error saving selected option:', error);
            });
        }
      })
      .catch(error => {
        // Handle error
        console.error('Error checking existing answer:', error);
      });
  };
  
  
  // Function to retrieve the user's selected option for a question from the backend
const getSelectedOption = (subjId, questionId) => {
  // Make an API call to retrieve the selected option from the backend
  axios.get(`/api/getAnswer?subjId=${subjId}&questionId=${questionId}`)
  .then(response => {
    // Handle success, update the UI with the retrieved selected option
    const selectedOption = response.data.selectedOption;
    console.log('Retrieved selected option:', selectedOption);
    // Update UI logic here...
  })
  .catch(error => {
    // Handle error
    console.error('Error retrieving selected option:', error);
  });
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

    const selectedQuestion = filteredQuestions[index];
    if (selectedQuestion) {
      // Retrieve the user's selected options for the current question from the answered array
      const answeredQuestion = answered.find(item => item.qid === selectedQuestion.id);
      if (answeredQuestion) {
        // Update the state variables for options based on the user's previous selection
        updateOptions(answeredQuestion.selectedOption);
      } else {
        // If the user hasn't answered this question yet, reset the state variables for options
        setisOptionA(false);
        setisOptionB(false);
        setisOptionC(false);
        setisOptionD(false);
      }
    }

  };

  // Filter questions based on selected subject
  const filteredQuestions = selectedSubject ? questions.filter(question => {
    return question.subjID === selectedSubject.subjID;
  }) : [];

  const isOptionSelected = (qid) => {

    
    const item = answered.find(item => item.qid === qid);

    if(!item){
      console.log('im a false')
      return false
      
    }else{
      console.log('im a true')
      return true
    }

};

let SelectedsubjquestionCount =0;

if (selectedSubject) {
  const selectedSubjectQuestions = questions.filter(question => question.subjID === selectedSubject.subjID);
  SelectedsubjquestionCount = selectedSubjectQuestions.length;
}






const selectedQuestion = filteredQuestions[selectedQuestionIndex];

useEffect(() => {
  if (selectedQuestion) {
    updateAnswers(examID,regNo);
    handleloadingofqnumbers(selectedQuestion.id);
  }
}, [selectedQuestion,examID,regNo]);

const handleloadingofqnumbers = (qid) => {
  const item = answered.find(item => item.qid === qid);
  console.log(item);
  if (item) {
    console.log('Item found:', item.selectedOption);
    if (item.selectedOption === 'A') {
      setisOptionA(true);
      setisOptionB(false);
      setisOptionC(false);
      setisOptionD(false);
    } else if (item.selectedOption === 'B') {
      setisOptionB(true);
      setisOptionA(false);
      setisOptionC(false);
      setisOptionD(false);
    } else if (item.selectedOption === 'C') {
      setisOptionC(true);
      setisOptionB(false);
      setisOptionA(false);
      setisOptionD(false);
    } else if (item.selectedOption === 'D') {
      setisOptionD(true);
      setisOptionB(false);
      setisOptionC(false);
      setisOptionA(false);
    } else {
      setisOptionA(false);
      setisOptionB(false);
      setisOptionC(false);
      setisOptionD(false);
    }
  } else {
    console.log('Item not found');
  }
};

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

  const totalAnsweredQuestions = answered.filter(item => item.selectedOption !== null).length;
  const questionCountPersubject = filteredQuestions.length;
 const totalQuestionsCount = questions.length;

 const totalAnsweredPersubjectQuestions = selectedSubject ? answered
 .filter(item => item.subjid === selectedSubject.subjID) // Filter by subjId of the selected subject
 .filter(item => item.selectedOption !== null) // Filter items where selectedOption is not null
 .length // Count the filtered items
 : 0;


 const navigate = useNavigate();
  const handleCompletedExam = () => {
    navigate('/completedexam', { state: { regNo: regNo, result: results, questions: questions } });
    updateTimerState(counter,'Submitted')
   
  };


  // Update timer state in the database
  const updateTimerState = (newTimeElapsed,status,examID,regNo) => {
    axios.put('/api/updateTimerState', { newTimeElapsed ,status,examID,regNo})
      .then(() => {
        console.log('Timer state updated successfully');
      })
      .catch(error => {
        console.error('Error updating timer state:', error);
      });
  };
 // Handle countdown


  // Handle countdown completion
  useEffect(() => {
    if (counter <=0) {
      handleCompletedExam();
      updateTimerState(counter,'Elapsed',examID,regNo);
    }
  }, [counter]);



  // Third Attempts
useEffect(() => {
    const timer =
      counter > 0 && setInterval(() => setCounter(counter - 1), 60000);
      updateTimerState(counter,'Ongoing',examID,regNo)
     if(counter<= 60){
      setShowEndExamButton(true);
     }

    return () => clearInterval(timer);
  }, [counter]);


  useEffect(() => {
    const handleKeyPress = (event) => {
      const key = event.key.toLowerCase();

      switch (key) {
        case 'a':
        case 'b':
        case 'c':
        case 'd':
          if(key==='a'){
            // alert(key)
 
             setisOptionA(true)
             setisOptionB(false)
             setisOptionC(false)
             setisOptionD(false)
            // console.log(isOptionA)
            }else if(key==='b'){
             setisOptionA(false)
             setisOptionB(true)
             setisOptionC(false)
             setisOptionD(false)
            }else if (key==='c'){
             setisOptionA(false)
             setisOptionB(false)
             setisOptionC(true)
             setisOptionD(false)
            }else{
             setisOptionA(false)
             setisOptionB(false)
             setisOptionC(false)
             setisOptionD(true)
            }  
          handleAnswerSelection(selectedSubject.subjID, selectedQuestion.id, key, regNo, examID);
          break;
          case 's':
            if (counter < 60) {
            setshowEndExamModal(true);
          }
          populateResults();
            break;
          case 'y':
            if (showEndExamModal) {
              handleCompletedExam();
            }
            break;
          case 'r':
            if (showEndExamModal) {
            handleCloseEndexammodal();
          }
            break;
        case 'n':
          if (selectedQuestionIndex < filteredQuestions.length - 1) {
            handleQuestionSelection(selectedQuestionIndex + 1);
          }
          break;
        case 'p':
          // Trigger previous
          if (selectedQuestionIndex > 0) {
            handleQuestionSelection(selectedQuestionIndex - 1);
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [selectedSubject, selectedQuestion, regNo, examID, selectedQuestionIndex, filteredQuestions,counter]); // Add all dependencies

 
 
  function populateResults() {
    const results = [];

    answered.forEach(answer => {
        const question = questions.find(q => q.id === answer.qid && q.subjID === answer.subjid);
        if (question) {
            const grade = answer.selectedOption === question.answer ? 2.5 : 0;
            results.push({
                qid: answer.qid,
                selectedoption: answer.selectedOption,
                answer: question.answer,
                grade: grade
            });
        }
    });

setResults(results);
}

 

  // In fetchData function, update the state with answeredStatus


  const renderedButtons = filteredQuestions.map((question, index) => {
    const questionNumber = index + 1;
   // const buttonColor = index === selectedQuestionIndex ? 'btn-info' : (answered ? 'btn-primary' : 'btn-danger');
  
    return (
      <button
        key={index}
        className={`btn btn-xs ${isOptionSelected(question.id) ? 'btn-primary' : 'btn-danger'}`}
        style={{ marginRight: '4px' }}
        type="button"
        onClick={() => handleQuestionSelection(index)}
      >
        {questionNumber}
      </button>
    );
  });
 
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
                    <div className="text-navy" style={{ display: 'block', fontWeight: 'bold', fontSize: 16, textAlign: 'left' }}>{selectedSubject.subj}</div>
                    <div style={{ display: 'block', fontWeight: 'bold', textAlign: 'left' }}>Question {selectedQuestionIndex + 1}</div>
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
            <div key={option}>
              <span style={{ display: 'inline-block', marginRight: 5 }}> ({option}) </span>
              <span style={{ display: 'inline-block', marginRight: 5 }}>
                <input
                  name="questionOption"
                  style={{ width: 20 }}
                  type="radio"
                  value={option}
                  checked={option === 'A' ? isOptionA : (option === 'B' ? isOptionB : (option === 'C' ? isOptionC : isOptionD))}

                  onChange={() => handleAnswerSelection(selectedSubject.subjID, selectedQuestion.id, option,regNo,examID,'event')}
                />
              </span>
              <span style={{ display: 'inline-block', cursor: 'pointer' }}>{selectedQuestion[`opt${option}`]}</span>
            </div>
          ))}
       
        
        {/* Similar divs for options B, C, and D */}
      </div>
    ) : (
      <p>No questions available for {selectedSubject.subj}.</p>
    )}
  
      
                </div>
                    </div>
                    <div className="row" style={{ marginTop: 20 }}>
                      <div className="col-md-2">
                        <button className="btn btn-w-m btn-primary" type="button">PREVIOUS</button>
                      </div>
                      <div _ngcontent-c4="" className="col-md-8">



                      
      <div >

      
 
{renderedButtons}  </div>
                      </div>
                      <div className="col-md-2">
                        <button className="btn btn-w-m btn-primary" type="button">NEXT</button>
                      </div>
                    </div>
                  </div>
                </div>)}
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
                  
                  <img src={userinfo.img} alt="Candidate Image" className="img rounded-circle" />
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