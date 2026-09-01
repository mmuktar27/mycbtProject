import logo from './logo.svg';
import './App.css';
import './webflow.css';
import './normalize.css';
import './javascript-calculator.css';
import './styles.inspinia.bundle.css';
import 'bootstrap/dist/css/bootstrap.min.css';
//import './bootstrap.min.css';

import { Routes, Route,Navigate  } from "react-router-dom"

import Home from './Home';

import Contact from './Contact';
import Candexam from './Candexam';
import CandID from './jamcand/CandID';
import Termspage from './jamcand/Termspage';
import CompletedExam from './jamcand/CompletedExam';
import CandidateList from './Ttest'
import CandHistory from './jamcand/CandHistory'
import SuperAdmin from './superAdmin';
import Admin from './adminPanel/adminPanel';
//challenge

import Cbtchallenge from './jamcand/Cbtchallenge';
import CandidForChallenge from './jamcand/CandidForChallenge'
import ChallengeTermspage from './jamcand/ChallengeTermspage';
import Certificate from './jamcand/Certificate';

//General cbt pages
import Generalcbt from './Generalcbt';
import Generalcbtlogin from './Generalcbtlogin';
import EndedGenquize from './EndedGenquize'

////////////////////newwww
import MainLayout from './components/MainLayout';
import Dashboard from './components/Dashboard';

import StaffList from './components/staff-management/Stafflist'; // or wherever your StaffList.js file is located
import StaffProfile from './components/staff-management/Staffprofile';
import Departments from './components/staff-management/Departments';
import AddStaff from './components/staff-management/Addstaff';

import AdmissionsList from './components/admissions/AdmissionsList';
import Admissionform from './components/admissions/Admissionform';

import StudentList from './components/students/StudentsList';
import StudentProfile from './components/students/StudentProfile';
import BulkImport from './components/students/BulkImport';
import SchoolManagement from './components/schoolManagement/SchoolManagement';
import AdmissionDetail from './components/admissions/Admissiondetail';


import FeeCollect from './components/feemanagement/FeeCollect';
import FeeStructure from './components/feemanagement/FeeStructure';
import PaymentHistory from './components/feemanagement/PaymentHistory';
import FeeDefaulters from './components/feemanagement/FeeDefaulters';
import ReceiptPrint from './components/feemanagement/ReceiptPrint';


import EnterCAResults   from './components/resultmanagement/EnterCAResults';
import EnterExamResults from './components/resultmanagement/EnterExamResults';
import ViewResults      from './components/resultmanagement/ViewResults';
import ApproveResults   from './components/resultmanagement/ApproveResults';
import GenerateReportCards from './components/resultmanagement/GenerateReportCards';



import CreateExam   from './components/schoolcbt/CreateExam';
import ActiveExams  from './components/schoolcbt/ActiveExams';
import ExamResults  from './components/schoolcbt/ExamResults';
import QuestionBank from './components/schoolcbt/QuestionBank';
import CBTLogin     from './components/schoolcbt/CBTLogin';
import CBTComplete      from './components/schoolcbt/CBTComplete';
import SchoolCandExam from './components/schoolcbt/SchoolCandExam';
// Student Management
//const StudentList = () => <div className="page-container"><h1>All Students</h1><p>Student list will be displayed here</p></div>;
const AddStudent = () => <div className="page-container"><h1>Add New Student</h1><p>Add student form will be here</p></div>;
//const StudentProfile = () => <div className="page-container"><h1>Student Profile</h1><p>Student profile details</p></div>;
//const BulkImport = () => <div className="page-container"><h1>Bulk Import Students</h1><p>Import multiple students</p></div>;

// Admission Processing
const NewApplications = () => <div className="page-container"><h1>New Applications</h1><p>New admission applications</p></div>;
const PendingReview = () => <div className="page-container"><h1>Pending Review</h1><p>Applications pending review</p></div>;
const ApprovedApplications = () => <div className="page-container"><h1>Approved Applications</h1><p>Approved applications</p></div>;
const RejectedApplications = () => <div className="page-container"><h1>Rejected Applications</h1><p>Rejected applications</p></div>;


// Results Management
const EnterResultsCA = () => <div className="page-container"><h1>Enter CA Results</h1><p>Continuous assessment entry</p></div>;
const EnterResultsExam = () => <div className="page-container"><h1>Enter Exam Results</h1><p>Exam results entry</p></div>;
//const ViewResults = () => <div className="page-container"><h1>View Results</h1><p>View student results</p></div>;
//const ApproveResults = () => <div className="page-container"><h1>Approve Results</h1><p>Approve submitted results</p></div>;

// Report Cards
//const GenerateReportCards = () => <div className="page-container"><h1>Generate Report Cards</h1><p>Generate student report cards</p></div>;
const PrintReportCards = () => <div className="page-container"><h1>Print Report Cards</h1><p>Print report cards</p></div>;
const ReportTemplates = () => <div className="page-container"><h1>Report Templates</h1><p>Manage report card templates</p></div>;


// Staff Management


// Attendance
const MarkAttendance = () => <div className="page-container"><h1>Mark Attendance</h1><p>Mark student attendance</p></div>;
const ViewAttendance = () => <div className="page-container"><h1>View Attendance</h1><p>View attendance records</p></div>;
const AttendanceReports = () => <div className="page-container"><h1>Attendance Reports</h1><p>Attendance reports and statistics</p></div>;

// Reports
const StudentReports = () => <div className="page-container"><h1>Student Reports</h1><p>Various student reports</p></div>;
const FinancialReports = () => <div className="page-container"><h1>Financial Reports</h1><p>Financial reports and analysis</p></div>;
const AcademicReports = () => <div className="page-container"><h1>Academic Reports</h1><p>Academic performance reports</p></div>;
const AttendanceReportsPage = () => <div className="page-container"><h1>Attendance Reports</h1><p>Attendance statistics</p></div>;

// Backup
const CreateBackup = () => <div className="page-container"><h1>Create Backup</h1><p>Create data backup</p></div>;
const RestoreData = () => <div className="page-container"><h1>Restore Data</h1><p>Restore from backup</p></div>;
const BackupHistory = () => <div className="page-container"><h1>Backup History</h1><p>View backup history</p></div>;
const BackupSettings = () => <div className="page-container"><h1>Backup Settings</h1><p>Configure backup settings</p></div>;




function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={ <Home /> } />






 <Route path="/maindashboard" element={
  <MainLayout>
    <Dashboard />
  </MainLayout>
} />

<Route path="/admission/detail/:applicationId" element={<AdmissionDetail />} />
 <Route path="school-management" element={<MainLayout><SchoolManagement /></MainLayout>} />
        {/* Student Management Routes */}
        <Route path="/students" element={<MainLayout><Navigate to="/students/all" replace /></MainLayout>} />
        <Route path="/students/all" element={<MainLayout><StudentList /></MainLayout>} />
        <Route path="/students/add" element={<MainLayout><AddStudent /></MainLayout>} />
        <Route path="/students/profile" element={<MainLayout><StudentProfile /></MainLayout>} />
        <Route path="/students/import" element={<MainLayout><BulkImport /></MainLayout>} />

        {/* Admission Processing Routes */}
        <Route path="/admission" element={<MainLayout><Navigate to="/admission/new" replace /></MainLayout>} />
        <Route path="/admission/new" element={<MainLayout><Admissionform /></MainLayout>} />
        <Route path="/admission/pending" element={<MainLayout><PendingReview /></MainLayout>} />
        <Route path="/admission/approved" element={<MainLayout><AdmissionsList /></MainLayout>} />
        <Route path="/admission/rejected" element={<MainLayout><RejectedApplications /></MainLayout>} />

        {/* Fee Collection Routes */}
        <Route path="/fees" element={<MainLayout><Navigate to="/fees/collect" replace /></MainLayout>} />
        <Route path="/fees/collect" element={<MainLayout><FeeCollect  /></MainLayout>} />
        <Route path="/fees/structure" element={<MainLayout><FeeStructure  /></MainLayout>} />
        <Route path="/fees/history" element={<MainLayout><PaymentHistory  /></MainLayout>} />
       {/* Receipt with layout (for viewing) */}
<Route path="/fees/receipts" element={<MainLayout><ReceiptPrint /></MainLayout>} />

{/* Receipt without layout (for printing) */}
<Route path="/fees/receipts/print/:receiptNumber" element={<ReceiptPrint />} />
        <Route path="/fees/defaulters" element={<MainLayout><FeeDefaulters  /></MainLayout>} />

        {/* Results Management Routes */}
        <Route path="/results" element={<MainLayout><Navigate to="/results/ca" replace /></MainLayout>} />
        <Route path="/results/ca" element={<MainLayout><EnterCAResults  /></MainLayout>} />
        <Route path="/results/exam" element={<MainLayout><EnterExamResults /></MainLayout>} />
        <Route path="/results/view" element={<MainLayout><ViewResults /></MainLayout>} />
        <Route path="/results/approve" element={<MainLayout><ApproveResults /></MainLayout>} />

        {/* Report Cards Routes */}
        <Route path="/reportcards" element={<MainLayout><Navigate to="/reportcards/generate" replace /></MainLayout>} />
        <Route path="/reportcards/generate" element={<MainLayout><GenerateReportCards  /></MainLayout>} />
        <Route path="/reportcards/print" element={<MainLayout><PrintReportCards /></MainLayout>} />
        <Route path="/reportcards/templates" element={<MainLayout><ReportTemplates /></MainLayout>} />

        {/* CBT Exams Routes */}
        <Route path="/schoolcbt" element={<MainLayout><Navigate to="/schoolcbt/create" replace /></MainLayout>} />
        <Route path="/schoolcbt/create" element={<MainLayout><CreateExam /></MainLayout>} />
        <Route path="/schoolcbt/active" element={<MainLayout><ActiveExams /></MainLayout>} />
        <Route path="/schoolcbt/results" element={<MainLayout><ExamResults /></MainLayout>} />
        <Route path="/schoolcbt/questions" element={<MainLayout><QuestionBank /></MainLayout>} />
        <Route path="/schoolcbt-complete" element={<CBTComplete />} />
         <Route path="/schoolcbt/exams" element={<SchoolCandExam />} />
          <Route path="/schoolcbt/login" element={<CBTLogin />} />



        {/* Staff Management Routes */}
        <Route path="/staff" element={<MainLayout><Navigate to="/staff/all" replace /></MainLayout>} />
        <Route path="/staff/all" element={<MainLayout><StaffList /></MainLayout>} />
        <Route path="/staff/add" element={<MainLayout><AddStaff /></MainLayout>} />
<Route path="/staff/profile/:staffId" element={<MainLayout><StaffProfile /></MainLayout>} />
        <Route path="/staff/departments" element={<MainLayout><Departments /></MainLayout>} />

        {/* Attendance Routes */}
        <Route path="/attendance" element={<MainLayout><Navigate to="/attendance/mark" replace /></MainLayout>} />
        <Route path="/attendance/mark" element={<MainLayout><MarkAttendance /></MainLayout>} />
        <Route path="/attendance/view" element={<MainLayout><ViewAttendance /></MainLayout>} />
        <Route path="/attendance/reports" element={<MainLayout><AttendanceReports /></MainLayout>} />

        {/* Reports Routes */}
        <Route path="/reports" element={<MainLayout><Navigate to="/reports/students" replace /></MainLayout>} />
        <Route path="/reports/students" element={<MainLayout><StudentReports /></MainLayout>} />
        <Route path="/reports/financial" element={<MainLayout><FinancialReports /></MainLayout>} />
        <Route path="/reports/academic" element={<MainLayout><AcademicReports /></MainLayout>} />
        <Route path="/reports/attendance" element={<MainLayout><AttendanceReportsPage /></MainLayout>} />

        {/* Backup Routes */}
        <Route path="/backup" element={<MainLayout><Navigate to="/backup/create" replace /></MainLayout>} />
        <Route path="/backup/create" element={<MainLayout><CreateBackup /></MainLayout>} />
        <Route path="/backup/restore" element={<MainLayout><RestoreData /></MainLayout>} />
        <Route path="/backup/history" element={<MainLayout><BackupHistory /></MainLayout>} />
        <Route path="/backup/settings" element={<MainLayout><BackupSettings /></MainLayout>} />









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
        <Route path="/superadmin" element={<SuperAdmin />} />
           <Route path="/admin" element={<Admin />} />

      </Routes>
    </div>
  )
}


export default App
