import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarXmark, faClock } from "@fortawesome/free-regular-svg-icons";
import { faBook, faBullseye, faCalculator } from '@fortawesome/free-solid-svg-icons';
import { useLocation } from 'react-router-dom';
import Modal from 'react-bootstrap/Modal';
import { useNavigate} from 'react-router-dom';

import MyModal from '../components/MyModal';
import ChallengeCompletedModal from '../components/ChallengeCompletedModal';
import { event } from 'jquery';

//import trophy from './trophy1.webp'
import wllogo1 from '../components/wllogo1.gif'
import wllogo2 from '../components/wllogo2.gif'
import wllogo3 from '../components/wllogo3.gif'
import trophy from '../components/trophy1.webp'
import trophy2 from '../components/trophy2.webp'


export default function Cbtchallenge() {
  const navigate = useNavigate();
  const location = useLocation();
  const regNo = location.state && location.state.regNo;
  const userinfo = location.state && location.state.userinFor;
  const examID = location.state && location.state.examID;

  
//setting for logo
const [compLogo, setCompLogo]= useState(trophy)
 // const counTer= location.state && location.state.counTer;
  const [completedChallenges, setCompletedChallenges] = useState(location.state && location.state.completedchallenges);
  const [challenges, setChallenges] = useState(location.state && location.state.challenges);
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

  const [activeChallenge, setActiveChallenge] = useState(location.state && location.state.chid)

  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  

  //challenge 2 modal
  const [userInput, setUserInput] = useState('');
  const [showCh2Modal, setShowCh2Modal] = useState(false);

  const handleCh2ModalClose = () => setShowCh2Modal(false);
  const handleShowCh2Modal = () => setShowCh2Modal(true);
//challenge 3

const [showCh3Modal, setShowCh3Modal] = useState(false);
const handleCh3ModalClose = () => setShowCh3Modal(false);
const handleShowCh3Modal = () => setShowCh3Modal(true);

 //end exam challenge using mouse ch10 Clicking on 'End Exam' Button and also clicking endexam button on the Modal Dialog
 const [ch10Count, setCh10Count] = useState({'end': 0,'fend': 0});

 //challenge 11 keyboard and mouse
 const [ch11Count, setCh11Count] = useState({'kboard': 0,'mouse': 0});
//challenge 7 count
const [ch7Count, setCh7Count] = useState({'count': 0});
 // 120 minutes in seconds
  const [timeElapsed, setTimeElapsed] = useState(120);

  const [showEndExamModal, setshowEndExamModal] = useState(false);
  const handleCloseEndexammodal = (event=null) => {setshowEndExamModal(false);

   
    if(activeChallenge==11){

      if (event.type === 'click') {
    
        // Increment 'end' count only when clicked by mouse
        setCh11Count(prevState => ({ ...prevState, mouse: ++prevState.mouse }));
      //  if (ch11Count['kboard'] >=1 && ch11Count['mouse'] >= 1 ){
          checks();
         // handleCloseEndexammodal();
       // }
    }
   
  }
  }
  
  const handleShowexamModal = (event) => {
   
   if(activeChallenge==10){
    if (event.type === 'click') {
  
      // Increment 'end' count only when clicked by mouse
      setCh10Count(prevState => ({ ...prevState, end: ++prevState.end }));
  }}

    setshowEndExamModal(true)};


  const [answered, setanswered] = useState([
    { qid: 1, subjid: 'ENG', selectedoption: 'B' },
    // Add more objects if needed
  ]);



  const [challengeCount, setChallengeCount] = useState(0);
  const [counter, setCounter] = useState(70);

  //challenge id 4
  const [ch4Count, setCh4Count]= useState({ 'p': 0, 'n': 0 })

  //challenge 5 checks
  const [ch5checks, setCh5Checks]= useState({ 'a': 0, 'b': 0, 'c': 0, 'd': 0 })

  //challenge 6 count
  const [ch6checks, setCh6Checks]= useState({ 'a': 0, 'b': 0, 'c': 0, 'd': 0 })
//
//checks for challenge 8
const [ch8checks, setCh8Checks]= useState({ 's': 0, 'y': 0})

//checks for challenge 9
const [ch9checks, setCh9Checks]= useState({ 's': 0, 'r': 0 })

//challenge 12 checks
const [ch12Count, setCh12Count]= useState({ 'add': 0, 'sub': 0 , 'div': 0 , 'mult': 0, 'ac': 0  })

  //const counter= counTer;
  const [showEndExamButton, setShowEndExamButton] = useState(false);
  // Function to update selectedQuestionIndex
  //

//


//challenge 4 modal
  const [showWelcomemodal, setshowwelcommodal] = useState(false);
  const handleCloseWelcomemodal = () => {setshowwelcommodal(false)
    if(activeChallenge==2 ){
      handleShowCh2Modal();
    }

    if(activeChallenge==3 ){
      handleShowCh3Modal();
    }
  
  }
  const handleshowWelcomemodal = () => setshowwelcommodal(true);



  //challenge completed modal
  const [showChallengeCompModal, setShowChallengeCompModal] = useState(false);
  const handleCloseChallengeCompModal = () => {setShowChallengeCompModal(false)
    handleshowWelcomemodal();
  };
  const handleshowChallengeCompModal = () => setShowChallengeCompModal(true);

 

  const fetchData = async (examID, regNo) => {
    try {
      // Fetch questions data
      const questionsResponse = await axios.get(`/api/exam-questions/${regNo}`);
      const questionsData = questionsResponse.data;
  
  
      
      setCandidateSubjects(questionsData.candidateSubjects);
      setQuestions(questionsData.questions);

   

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      // Handle error or set appropriate state
    }
  };


  
  useEffect(() => {
  
    fetchData(examID,regNo);

    // Set the default value for answered state

  }, [examID,regNo]);
  
  useEffect(() => {
    if (challenges && completedChallenges) {
      const incompleteChallenges = challenges.filter(challenge => {
        // Check if the challenge ID is not in the completedChallenges array
        return !completedChallenges.row.find(completedChallenge => completedChallenge.id === challenge.id);
      });
      setChallenges(incompleteChallenges);
      
    }
  }, []);



  useEffect(() => {
    // Select a random subject once the candidateSubjects array is populated
    if (!loading && candidateSubjects.length > 0) {
      selectRandomSubject();
    }
  }, [loading, candidateSubjects]);






  

  const selectRandomSubject = () => {
    if (candidateSubjects.length > 0) {
      const randomIndex = Math.floor(Math.random() * candidateSubjects.length);
      const randomSubject = candidateSubjects[randomIndex];
      setSelectedSubject(randomSubject);
    }
  };




  const storeCompletedChallenges = async (CompletedChallenges) => {
    try {
        const response = await axios.post('/api/storeCompChallenges', CompletedChallenges);
        console.log(response.data.message); // Assuming the server sends back a message
    } catch (error) {
        console.error('Error storing challenges:', error);
        // Handle error or set appropriate state
    }
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


 

  const handleAnswerSelection = (subjId, questionId, selectedOption, candid, examID, event) => {
    // Check if the user has already selected an option for this question
    
    if(activeChallenge==6){
        if (event.type === 'click') {
            let key = selectedOption.toLowerCase()
            // Increment 'end' count only when clicked by mouse
            setCh6Checks(prevState => ({ ...prevState, [key]: prevState[key] + 1 }));

            if (ch6checks['a'] >=1 && ch6checks['b'] >= 1 && ch6checks['c'] >=1  && ch6checks['d']>=1 ) {
                const isChallengeCompleted = completedChallenges.row.some(challenge => challenge.challengeID === activeChallenge);
                if (!isChallengeCompleted) {
                    const updatedCompletedChallenges = {
                        ...completedChallenges,
                        row: [
                            ...completedChallenges.row,
                            { candID: regNo, challengeID: activeChallenge, completionDate: getCurrentDate() }
                        ]
                    };
                    setCompletedChallenges(updatedCompletedChallenges);

                    const updatedChallenges = challenges.filter(challenge => challenge.id !== activeChallenge);
                    setChallenges(updatedChallenges);
                    setActiveChallenge(updatedChallenges[0].id);
                   handleshowChallengeCompModal();
                   
                }
            }
        }
    }
    if (event.type === 'change') {
      updateOptions(selectedOption)
    }
    //
    const existingAnswerIndex = answered.findIndex(answer => answer.qid === questionId);

    // If the provided question ID already exists, alert
    if (existingAnswerIndex !== -1) {
     
      setanswered(prevAnswered => {
       
            const updatedAnswered = [...prevAnswered];
            updatedAnswered[existingAnswerIndex] = { ...updatedAnswered[existingAnswerIndex], selectedoption: selectedOption };
            return updatedAnswered;
        });
       
     
    }else{
      const newRow = { qid: questionId, subjid: subjId, selectedoption: selectedOption}; // Change values as needed

// Update the state by spreading the existing array and adding the new row
      setanswered(prevState => [...prevState, newRow]);
      if (event.type === 'change') {
        updateOptions(selectedOption)
      }
    
    }

   // alert(event.type)
};

  //ch5 checks function

  const checksforCh5 = (option)=> {
    
    setCh5Checks(prevCounts => ({
      ...prevCounts,
      [option.toLowerCase()]: prevCounts[option.toLowerCase()] + 1
  }));

  }


  const handleSubjectSelect = (subject) => {
    setSelectedSubject(subject);
    const selectedSubjectQuestions = questions.filter(question => question.subjID === subject.subjID);
    if (selectedSubjectQuestions.length > 0) {
      setSelectedQuestionIndex(0);
    }
  };

  const handleQuestionSelection = (index,event) => {
    setSelectedQuestionIndex(index);
    if(activeChallenge==7){
      if (event.type == 'click') {
    
        // Increment 'end' count only when clicked by mouse
        setCh7Count(prevState => ({ ...prevState, count: prevState.count + 1 }));

        if( ch7Count['count'] >=10 ){

          checks();
        }
    }}
    const selectedQuestion = filteredQuestions[index];
    if (selectedQuestion) {
      // Retrieve the user's selected options for the current question from the answered array
      const answeredQuestion = answered.find(item => item.qid === selectedQuestion.id);
      if (answeredQuestion) {
        // Update the state variables for options based on the user's previous selection
        updateOptions(answeredQuestion.selectedoption);
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
    //updateAnswers(selectedQuestion.);
    handleloadingofqnumbers(selectedQuestion.id);
  }
}, [selectedQuestion]);

const handleloadingofqnumbers = (qid) => {
  const item = answered.find(item => item.qid === qid);
  console.log(item);
  if (item) {
    console.log('Item found:', item.selectedoption);
    if (item.selectedoption === 'A') {
      setisOptionA(true);
      setisOptionB(false);
      setisOptionC(false);
      setisOptionD(false);
    } else if (item.selectedoption === 'B') {
      setisOptionB(true);
      setisOptionA(false);
      setisOptionC(false);
      setisOptionD(false);
    } else if (item.selectedoption === 'C') {
      setisOptionC(true);
      setisOptionB(false);
      setisOptionA(false);
      setisOptionD(false);
    } else if (item.selectedoption === 'D') {
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
        if(activeChallenge=== 12){
          if(ch12Count['add'] >=1 && ch12Count['sub'] >= 1 && ch12Count['div'] >= 1 && ch12Count['mult'] >= 1 && ch12Count['ac'] >= 1){

            checks();
            handleCloseEndexammodal();
          }else{
            if (expression.includes('*') ) {
              setCh12Count(prevCounts => ({
                ...prevCounts,
                ['mult']: ++prevCounts['mult']
            }));
            
            }else if(expression.includes('+') ){
              setCh12Count(prevCounts => ({
                ...prevCounts,
                ['add']: ++prevCounts['add']
            }));
          
            }else if(expression.includes('-')){
              setCh12Count(prevCounts => ({
                ...prevCounts,
                ['sub']: ++prevCounts['sub']
            }));
          
            }else if(expression.includes('/')){
              setCh12Count(prevCounts => ({
                ...prevCounts,
                ['div']: ++prevCounts['div']
            }));

            }
          }
         
        }
        const evalResult = eval(expression);
        setResult(evalResult);
      } catch (error) {
        setResult('Error');
      }
    } else if (value === 'AC') {
      setCh12Count(prevCounts => ({
        ...prevCounts,
        ['ac']: ++prevCounts['ac']
    }));
      setExpression('');
      setResult('');
    } else {
      setExpression((prevExpression) => prevExpression + value);

    //  console.log(expression)
    }
  };

 


  const totalAnsweredQuestions = answered.filter(item => item.selectedoption !== null).length;
  const questionCountPersubject = filteredQuestions.length;
 const totalQuestionsCount = questions.length;

 const totalAnsweredPersubjectQuestions = selectedSubject ? answered
 .filter(item => item.subjid === selectedSubject.subjID) // Filter by subjId of the selected subject
 .filter(item => item.selectedoption !== null) // Filter items where selectedOption is not null
 .length // Count the filtered items
 : 0;



  const handleCompletedExam = (event) => {


    if(activeChallenge==10){
      if (event.type === 'click') {
    
        // Increment 'end' count only when clicked by mouse
        setCh10Count(prevState => ({ ...prevState, fend: ++prevState.fend }));

        if(ch10Count['end'] >=1 && ch10Count['fend'] >= 1){
          checks();
          handleCloseEndexammodal();
        }
    }}

    if(activeChallenge==11){
      if (event.type === 'click') {
    
        // Increment 'end' count only when clicked by mouse
        setCh11Count(prevState => ({ ...prevState, mouse: ++prevState.mouse}));

        if( ch11Count['kboard'] >=1 && ch11Count['mouse'] >= 1){

          checks();
          handleCloseEndexammodal();
        }
    }}
 
    //   navigate('/completedexam', { state: { regNo: regNo } });
   // updateTimerState(counter,'Submitted')
   
  };


  // Update timer state in the database
  const updateTimerState = (newtimeElapse) => {
    setCounter(newtimeElapse)
  };
 // Handle countdown


  // Handle countdown completion
  useEffect(() => {
    if (counter <=0) {
      handleCompletedExam();
      updateTimerState(counter);
    }
  }, [counter]);


  useEffect(() => {
    if(showChallengeCompModal===false){
      handleshowWelcomemodal();
    }
    
   if(activeChallenge===1){
    if (validateQuestionsPerSubject()) {
      // Proceed with submitting the exam or any other action
     checks();
    
     console.log(validateQuestionsPerSubject())
    } else {
      // Display a message or take appropriate action to prompt the student to answer more questions
      console.log('Please answer at least 5 questions for each subject before submitting the exam.');
    }
  }
   
  }, [activeChallenge]);



  // Third Attempts
useEffect(() => {
    const timer =
      counter > 0 && setInterval(() => setCounter(counter - 1), 60000);
      updateTimerState(counter)
 
if(counter<=60 || activeChallenge==10){
  setShowEndExamButton(true);
}
    return () => clearInterval(timer);
  }, [counter]);


  useEffect(() => {
    //handle selection of logo
if(activeChallenge === 1){
  setCompLogo(trophy)

}else if(activeChallenge === 2){
  setCompLogo(wllogo1)
}else if(activeChallenge === 3){
  setCompLogo(wllogo1)
}else if (activeChallenge === 4){
  setCompLogo(wllogo1)
}else if(activeChallenge === 5){
  setCompLogo(wllogo2)
}else if(activeChallenge === 6){
  setCompLogo(wllogo2)
}else if(activeChallenge === 7){
  setCompLogo(wllogo2)
}else if(activeChallenge === 8){
  setCompLogo(wllogo2)
}else if(activeChallenge === 9){
  setCompLogo(wllogo3)
}else if (activeChallenge === 10){
  setCompLogo(wllogo3)
}else if (activeChallenge === 11){
  setCompLogo(wllogo3)
}else{
  setCompLogo(trophy2)
}
  }, [activeChallenge]);
 
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
           
        handleAnswerSelection(selectedSubject.subjID, selectedQuestion.id, key, regNo, examID, event);
     
          checksforCh5(key)
          if (activeChallenge==5){
            if (ch5checks['a'] >=1 && ch5checks['b'] >= 1 && ch5checks['c'] >=1  && ch5checks['d']>=1 ) {
              const isChallengeCompleted = completedChallenges.row.some(challenge => challenge.challengeID === activeChallenge);
              if (!isChallengeCompleted) {
                  const updatedCompletedChallenges = {
                      ...completedChallenges,
                      row: [
                          ...completedChallenges.row,
                          { candID: regNo, challengeID: activeChallenge, completionDate: getCurrentDate() }
                      ]
                  };
                  setCompletedChallenges(updatedCompletedChallenges);
        
                  const updatedChallenges = challenges.filter(challenge => challenge.id !== activeChallenge);
                  setChallenges(updatedChallenges);
                  setActiveChallenge(updatedChallenges[0].id)
                 
                  handleshowChallengeCompModal();
                }
            }
          }
          break;
          case 's':
            if (counter < 60) {
            setshowEndExamModal(true);
          }
          if(activeChallenge===8){
            
          setCh8Checks(prevCounts => ({
            ...prevCounts,
            ['s']: ++prevCounts['s']

        }));
        setshowEndExamModal(true);
      }

        if(activeChallenge===9){
            setCh9Checks(prevCounts => ({
              ...prevCounts,
              ['s']: ++prevCounts['s']

          }));
          setshowEndExamModal(true);
        }

        if(activeChallenge===11){
          setCh11Count(prevCounts => ({
            ...prevCounts,
            ['kboard']: ++prevCounts['kboard'] 

        }));
        setshowEndExamModal(true);
      }
            break;
          case 'y':
            if (showEndExamModal) {
              handleCompletedExam();
            }
            if(activeChallenge===8){
              setCh8Checks(prevCounts => ({
                ...prevCounts,
                ['y']: ++prevCounts['y']
            }));
            if (ch8checks['s'] >=1 && ch8checks['y'] >= 1 ){
              checks();
              handleCloseEndexammodal();
            }
          }
            break;
          case 'r':

        
            if (showEndExamModal) {
            handleCloseEndexammodal();
          }
          if(activeChallenge===9){
            setCh9Checks(prevCounts => ({
              ...prevCounts,
              ['r']: ++prevCounts['r']
          }));
          if (ch9checks['s'] >=1 && ch9checks['r'] >= 1 ){
            checks();
          }
        }
            break;
        case 'n':
          
        if(activeChallenge === 4){

          setCh4Count(prevCounts => ({
            ...prevCounts,
            ['n']: prevCounts['n'] + 1
        }));
          //setCh4Count(ch4Count + 1)
          // handleshowWelcomemodal();
          navigateQuestions(activeChallenge,ch4Count);
         
         // console.log(ch4Count)
           if (selectedQuestionIndex < filteredQuestions.length - 1) {
             handleQuestionSelection(selectedQuestionIndex + 1);
           }
        }else{
          if (selectedQuestionIndex < filteredQuestions.length - 1) {
            handleQuestionSelection(selectedQuestionIndex + 1);
          }
        }
          
          break;
        case 'p':
          // Trigger previous
          if(activeChallenge === 4){
          //  setCh4Count(ch4Count + 1)
          setCh4Count(prevCounts => ({
            ...prevCounts,
            ['p']: prevCounts['p'] + 1
        }));
            navigateQuestions(activeChallenge,ch4Count);
            if (selectedQuestionIndex > 0) {
              handleQuestionSelection(selectedQuestionIndex - 1);
            }
          }else{
            if (selectedQuestionIndex > 0) {
              handleQuestionSelection(selectedQuestionIndex - 1);
            }
          }
         
          break;
          case 't':
            //handleShowCh2Modal();
            handleShowCh3Modal();
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

 // const [challengeCount, setChallengeCount] = useState(0);
  
  // In fetchData function, update the state with answeredStatus


  const getButtonClassName = (questionId) => {
    return `btn btn-xs ${isOptionSelected(questionId) ? 'btn-primary' : 'btn-danger'}`;
  };
  
  const renderedButtons = filteredQuestions.map((question, index) => {
    const questionNumber = index + 1;
  
    return (
      <button
        key={index}
        className={getButtonClassName(question.id)}
        style={{ marginRight: '4px' }}
        type="button"
        onClick={(event) => handleQuestionSelection(index,event)}
      >
        {questionNumber}
      </button>
    );
  });






const callwelcomeModal  = () => {


  let key=activeChallenge;
  let body =""

  switch (key) {
    case 1:
      body = (
        <div dangerouslySetInnerHTML={{ __html: "<p>Welcome to challenge 1</p><p><strong>Subject Diversity Challenge</strong></p><small>Hints:</small><br /> <p>Answer atleast 10 questions from each subject <p/>" }} />
      ); // Corrected call
      //setCompLogo(trophy)
    break;
    case 2:
      body = (
        <div dangerouslySetInnerHTML={{ __html: "<p>Welcome to challenge 2</p><p><strong>Subject Proficiency Challenge</strong></p><small>Hints:</small><br /> <p>Identify total unanswered questions <p/>" }} />
      ); // Corrected call
    
     // setCompLogo(wllogo1)
    break;
    case 3:
      body = (
        <div dangerouslySetInnerHTML={{ __html: "<p>Welcome to challenge 3</p><p><strong>Time Awareness Challenge</strong></p><small>Hints:</small><br /> <p>Identify the current time <p/>" }} />
      ); // Corrected call
    
     // setCompLogo(wllogo1)
    break;
    case 4:
      body = (
        <div dangerouslySetInnerHTML={{ __html: "<p>Welcome to challenge 4</p><p><strong>Navigation Proficiency Challenge</strong></p><small>Hints:</small><br /> <p>Navigate through atleast 10 questions using both N and P character on your keyboard <p/>" }} />
      ); // Corrected call
      //setCompLogo(wllogo1)
      break;
      case 5:
        body = (
          <div dangerouslySetInnerHTML={{ __html: "<p>Welcome to challenge 5</p><p><strong>Keyboard Option Selection Challenge</strong></p><small>Hints:</small><br /> <p>Select option A,B,C,D using keyboard<p/>" }} />
        ); // Corrected call

       // setCompLogo(wllogo2)
    
        break;
      case 6:
        body = (
          <div dangerouslySetInnerHTML={{ __html: "<p>Welcome to challenge 6</p><p><strong>Mouse Option Selection Challenge</strong></p><small>Hints:</small><br /> <p> Answer atleast 10 questions, also ensure that you have selected each option(A,B,C,D) aleast once using mouse only<p/>" }} />
        ); // Corrected call
      
        //setCompLogo(wllogo2)
        break;
      case 7:
        body = (
          <div dangerouslySetInnerHTML={{ __html: "<p>Welcome to challenge 7</p><p><strong>Mouse Navigation Challenge</strong></p><small>Hints:</small><br /> <p>Navigate throug atleast 10 questions by clicking on the question number using the mouse<p/>" }} />
        ); // Corrected call
      
        break;
    case 8:
       body = (
        <div dangerouslySetInnerHTML={{ __html: "<p>Welcome to challenge 8</p><p><strong>Keyboard Submission and Exam End Challenge</strong></p><small>Hints:</small><br /> <p>used keyboard letter S to end exam and letter y to confirm end exam<p/>" }} />
      ); // Corrected call
    
     // setCompLogo(wllogo2)
      break;
    case 9:
       body = (
        <div dangerouslySetInnerHTML={{ __html: "<p>Welcome to challenge 9</p><p><strong>Keyboard Submission and Continue Exam Challenge</strong></p><small>Hints:</small><br /> <p>Using the keyboard click on letter S to submit and letter R to continue exam<p/>" }} />
      ); // Corrected call
    
      // Trigger previous
      //setCompLogo(wllogo3)
      break;
      case 10:
         body = (
          <div dangerouslySetInnerHTML={{ __html: "<p>Welcome to challenge 10</p><p><strong>Mouse End Exam Challenge</strong></p><small>Hints:</small><br /> <p>End exam using mouse only<p/>" }} />
        ); // Corrected call
      
      break;
      case 11:
        body = (
         <div dangerouslySetInnerHTML={{ __html: "<p>Welcome to challenge 11</p><p><strong>Keyboard Submit and Mouse Continue Challenge</strong></p><small>Hints:</small><br /> <p>Submit using letter S and then click continue using Mouse <p/>" }} />
       ); // Corrected call
      // setCompLogo(wllogo3)
     break;
     case 12:
      body = (
       <div dangerouslySetInnerHTML={{ __html: "<p>Welcome to challenge 12</p><p><strong>Calculator Warrior Challenge</strong></p><small>Hints:</small><br /> <p>Using the calculator perform Multiplication, Addition, Subtraction, Division and clear screen using AC <p/>" }} />
     ); // Corrected call
     //setCompLogo(trophy2)
   break;
    default:
      break;
  }

 
  return (
    <MyModal
      show={showWelcomemodal} // Corrected prop
      onHide={handleCloseWelcomemodal}
      body={body}
    />
  );
};



const navigateQuestions = (challengeID, chCount = null) => {

  if (chCount !== null && chCount['p'] >= 5 && chCount['n'] >= 5) {
      const isChallengeCompleted = completedChallenges.row.some(challenge => challenge.challengeID === challengeID);
      if (!isChallengeCompleted) {
          const updatedCompletedChallenges = {
              ...completedChallenges,
              row: [
                  ...completedChallenges.row,
                  { candID: regNo, challengeID: challengeID, completionDate: getCurrentDate() }
              ]
          };
          const upchallenge={ candID: regNo, challengeID: activeChallenge, completionDate: getCurrentDate() }
        
          setCompletedChallenges(updatedCompletedChallenges);
          storeCompletedChallenges(upchallenge);

          const updatedChallenges = challenges.filter(challenge => challenge.id !== challengeID);
          setChallenges(updatedChallenges);
          setActiveChallenge(updatedChallenges[0].id)

         
      }
      handleshowChallengeCompModal();
  } else if (chCount === null) {
      const isChallengeCompleted = completedChallenges.row.some(challenge => challenge.challengeID === challengeID);
      if (!isChallengeCompleted) {
          const updatedCompletedChallenges = {
              ...completedChallenges,
              row: [
                  ...completedChallenges.row,
                  { candID: regNo, challengeID: challengeID, completionDate: getCurrentDate() }
              ]
          };
          const upchallenge={ candID: regNo, challengeID: activeChallenge, completionDate: getCurrentDate() }
        
          setCompletedChallenges(updatedCompletedChallenges);
          storeCompletedChallenges(upchallenge);
          const updatedChallenges = challenges.filter(challenge => challenge.id !== challengeID);
          setChallenges(updatedChallenges);
          setActiveChallenge(updatedChallenges[0].id)
         
      }
      handleshowChallengeCompModal();
  }
};


  
  // Function to get the current date in the format "MM/DD/YYYY"
  const getCurrentDate = () => {
    const currentDate = new Date();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    const year = currentDate.getFullYear();
    return `${month}/${day}/${year}`;
  };
  

  const checks = () => {
    const isChallengeCompleted = completedChallenges.row.some(challenge => challenge.challengeID === activeChallenge);
    if (!isChallengeCompleted) {
        const updatedCompletedChallenges = {
            ...completedChallenges,
            row: [
                ...completedChallenges.row,
                { candID: regNo, challengeID: activeChallenge, completionDate: getCurrentDate() }
            ]
        };
        const upchallenge={ candID: regNo, challengeID: activeChallenge, completionDate: getCurrentDate() }
        setCompletedChallenges(updatedCompletedChallenges);
        storeCompletedChallenges(upchallenge);
        const updatedChallenges = challenges.filter(challenge => challenge.id !== activeChallenge);
        setChallenges(updatedChallenges);
        setActiveChallenge(updatedChallenges[0].id)
        
//handle selection of logo
if(activeChallenge === 1){
  setCompLogo(trophy)

}else if(activeChallenge === 2){
  setCompLogo(wllogo1)
}else if(activeChallenge === 3){
  setCompLogo(wllogo1)
}else if (activeChallenge === 4){
  setCompLogo(wllogo1)
}else if(activeChallenge === 5){
  setCompLogo(wllogo2)
}else if(activeChallenge === 6){
  setCompLogo(wllogo2)
}else if(activeChallenge === 7){
  setCompLogo(wllogo2)
}else if(activeChallenge === 8){
  setCompLogo(wllogo2)
}else if(activeChallenge === 9){
  setCompLogo(wllogo3)
}else if (activeChallenge === 10){
  setCompLogo(wllogo3)
}else if (activeChallenge === 11){
  setCompLogo(wllogo3)
}else{
  setCompLogo(trophy2)
}

        handleshowChallengeCompModal();
      }    }


      //challenge 1 validation function
      const chModal = (handleSubmit,showModal,handleModalClose, someText) => {
        return (
          <Modal show={showModal} onHide={handleModalClose}>
            <Modal.Header closeButton>
              <Modal.Title>{someText}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <input type="text" value={userInput} onChange={handleInputChange} />
            </Modal.Body>
            <Modal.Footer>
              <button className="btn btn-info" onClick={handleModalClose}>
                Close
              </button>
              <button className="btn btn-primary" onClick={handleSubmit}>
                Submit
              </button>
            </Modal.Footer>
          </Modal>
        );
      };

      // Function to check if the student has answered at least 5 questions for each subject
      const validateQuestionsPerSubject = () => {
        // Initialize an object to store the count of answered questions per subject
        const answeredQuestionsPerSubject = {};
      
        // Iterate through the answered questions array
        answered.forEach(answer => {
          // Increment the count for the corresponding subject
          answeredQuestionsPerSubject[answer.subjid] = (answeredQuestionsPerSubject[answer.subjid] || 0) + 1;
        });
      
        // Check if there are at least 5 questions answered for each subject
        const subjectsWithInsufficientQuestions = Object.keys(answeredQuestionsPerSubject).filter(subject => answeredQuestionsPerSubject[subject] < 5);
      console.log(subjectsWithInsufficientQuestions)
        // Return true if all subjects have at least 5 answered questions, false otherwise
        return subjectsWithInsufficientQuestions.length === 0;
      };

// Usage example:




// challenge 2

  // Function to handle user input change
  const handleInputChange = (event) => {
    setUserInput(event.target.value);
  };


 // Function to handle submission and comparison
 const handleSubmitCh2 = () => {
  // Convert userInput to a number
  const userValue = parseInt(userInput);

  // Compare userValue with the total unanswered questions
  const totalUnansweredQuestions = identifyTotalUnansweredQuestions();

  if (!isNaN(userValue) && userValue === totalUnansweredQuestions) {
    
    checks();
  } else {
    alert('Sorry, your input does not match the total unanswered questions.');
  }

  // Close the modal
  handleCh2ModalClose();
};

 // Function to identify total unanswered questions
 const identifyTotalUnansweredQuestions = () => {
  // Count the total number of questions
  const totalQuestions = questions.length;
  // Count the number of answered questions
  const answeredQuestions = answered.length;
  // Calculate the number of unanswered questions
  const unansweredQuestions = totalQuestions - answeredQuestions;

  return unansweredQuestions;
};

//handle ch 3 

const handleSubmitCh3 = () => {
  // Convert userInput to a number
  const userValue = parseInt(userInput);

  // Compare userValue with the total unanswered questions
 if (counter ==userValue){
  handleCh3ModalClose()
  handleshowChallengeCompModal();
  checks();


 }else{
  alert('incorect time')
 }

};


{console.log(compLogo)

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
&nbsp;&nbsp;&nbsp;
      <button className="btn btn-success m-t-n-xs" type="button" onClick={handleshowWelcomemodal}>
        <i className="fa fa-calculator" aria-hidden="true"> <FontAwesomeIcon icon={faBook} /></i>
      </button>
          </div>

          <div className="col-md-3">
      <i className="fa fa-fw fa-clock-o"> <FontAwesomeIcon icon={faClock} /></i> Timer
      <a className="btn btn-md btn-success">{counter}</a>

      { (activeChallenge === 10 || showEndExamButton) && (
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
          <b>      </b><br /><br />
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
                onChange={(event) => handleAnswerSelection(selectedSubject.subjID, selectedQuestion.id, option, regNo, examID, event)}
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


      <Modal show={showEndExamModal} onHide={(event) => handleCloseEndexammodal(event)} dialogClassName="modal-sm">
        
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
    <button className="btn continue-btn btn-success mr-2 btn-sm" style={{ marginRight: '4px' }} onClick={(event) => handleCloseEndexammodal(event)}
>Continue Exam (R)</button>
    <button className="btn end-btn btn-danger btn-sm" onClick={handleCompletedExam }> End Exam (Y)</button>
  </div>
</div>
        </Modal.Body>
      </Modal>
  
      {<ChallengeCompletedModal
      show={showChallengeCompModal}
      img={compLogo}
      handleClose={handleCloseChallengeCompModal}
      />}


      <div>
      {chModal(handleSubmitCh2,showCh2Modal,handleCh2ModalClose, 'Enter your guess')}

      {chModal(handleSubmitCh3,showCh3Modal,handleCh3ModalClose, 'Enter your guess')}
      {callwelcomeModal()}
      </div>
    </>
  );
}