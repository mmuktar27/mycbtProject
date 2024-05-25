import logo from './logo.svg';
import './App.css';
import './webflow.css';
import './normalize.css';
import './javascript-calculator.css';
import './styles.inspinia.bundle.css';
import 'bootstrap/dist/css/bootstrap.min.css';
//import './bootstrap.min.css';

import { Routes, Route } from "react-router-dom"

import Home from './Home';

import Contact from './Contact';
import Candexam from './Candexam';
import CandID from './jamcand/CandID';
import Termspage from './jamcand/Termspage';
import CompletedExam from './jamcand/CompletedExam';
import CandidateList from './Ttest'
import CandHistory from './jamcand/CandHistory'

//challenge

import Cbtchallenge from './jamcand/Cbtchallenge';
import CandidForChallenge from './jamcand/CandidForChallenge'
import ChallengeTermspage from './jamcand/ChallengeTermspage';
import Certificate from './jamcand/Certificate';

//General cbt pages
import Generalcbt from './Generalcbt';
import Generalcbtlogin from './Generalcbtlogin';
import EndedGenquize from './EndedGenquize'



function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={ <Home /> } />
        <Route path="exams" element={ <Candexam /> } />
        <Route path="candid" element={ <CandID /> } />
        <Route path="contact" element={ <Contact /> } />
        <Route path="termspage" element={ <Termspage /> } />
        <Route path="completedexam" element={ <CompletedExam /> } />
        <Route path="test" element={ <CandidateList /> } />

        <Route path="candhistory" element={ <CandHistory /> } />

        <Route path="cbtchallenge" element={ <Cbtchallenge /> } />
        <Route path="candidforchallenge" element={ <CandidForChallenge /> } />
        <Route path="challengetermspage" element={ <ChallengeTermspage /> } />

        <Route path="certificate" element={ <Certificate /> } />

        <Route path="generalcbt" element={ <Generalcbt /> } />
        <Route path="generalcbtlogin" element={ <Generalcbtlogin /> } />
        <Route path="quizcompleted" element={ <EndedGenquize /> } />
      </Routes>
    </div>
  )
}


export default App
