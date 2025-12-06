import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from 'react-bootstrap/Modal';
import { Link } from 'react-router-dom';
import logo from './resources/logo.png';

function SuperAdmin() {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [students, setStudents] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Modal states
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
  const [showEditQuestionModal, setShowEditQuestionModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  // Form states
  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user'
  });

  const [questionForm, setQuestionForm] = useState({
    subject: '',
    question: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctAnswer: '',
    explanation: ''
  });

  const subjects = [
    { full: 'Mathematics', abbreviation: 'MATH' },
    { full: 'Chemistry', abbreviation: 'CHEM' },
    { full: 'Biology', abbreviation: 'BIO' },
    { full: 'Physics', abbreviation: 'PHY' },
    { full: 'Agricultural Science', abbreviation: 'AGRI' },
    { full: 'Economics', abbreviation: 'ECO' },
    { full: 'Government', abbreviation: 'GOVT' },
    { full: 'Islamic Studies', abbreviation: 'IRS' },
    { full: 'Christian Religious Studies', abbreviation: 'CRS' },
    { full: 'History', abbreviation: 'HIST' },
    { full: 'English Language', abbreviation: 'ENG' }
  ];

  // Fetch data based on active tab
  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'users') {
        const response = await axios.get('/api/users');
        setUsers(response.data);
      } else if (activeTab === 'students') {
        const response = await axios.get('/api/students');
        setStudents(response.data);
      } else if (activeTab === 'questions') {
        const response = await axios.get('/api/questions');
        setQuestions(response.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  // User handlers
  const handleUserChange = (e) => {
    const { name, value } = e.target;
    setUserForm({ ...userForm, [name]: value });
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/users', userForm);
      alert('User added successfully');
      setShowAddUserModal(false);
      setUserForm({ username: '', email: '', password: '', role: 'user' });
      fetchData();
    } catch (error) {
      console.error('Error adding user:', error);
      alert('Failed to add user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await axios.delete(`/api/users/${userId}`);
        alert('User deleted successfully');
        fetchData();
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Failed to delete user');
      }
    }
  };

  // Question handlers
  const handleQuestionChange = (e) => {
    const { name, value } = e.target;
    setQuestionForm({ ...questionForm, [name]: value });
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/questions', questionForm);
      alert('Question added successfully');
      setShowAddQuestionModal(false);
      setQuestionForm({
        subject: '',
        question: '',
        optionA: '',
        optionB: '',
        optionC: '',
        optionD: '',
        correctAnswer: '',
        explanation: ''
      });
      fetchData();
    } catch (error) {
      console.error('Error adding question:', error);
      alert('Failed to add question');
    }
  };

  const handleEditQuestion = (question) => {
    setSelectedQuestion(question);
    setQuestionForm({
      subject: question.subject,
      question: question.question,
      optionA: question.optionA,
      optionB: question.optionB,
      optionC: question.optionC,
      optionD: question.optionD,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation || ''
    });
    setShowEditQuestionModal(true);
  };

  const handleUpdateQuestion = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/questions/${selectedQuestion._id}`, questionForm);
      alert('Question updated successfully');
      setShowEditQuestionModal(false);
      fetchData();
    } catch (error) {
      console.error('Error updating question:', error);
      alert('Failed to update question');
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      try {
        await axios.delete(`/api/questions/${questionId}`);
        alert('Question deleted successfully');
        fetchData();
      } catch (error) {
        console.error('Error deleting question:', error);
        alert('Failed to delete question');
      }
    }
  };

  return (
    <div className="container-fluid" style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      {/* Header */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <div className="container-fluid">
          <img src={logo} alt='app logo' style={{ width: '50px', height: 'auto' }} className="me-2" />
          <span className="navbar-brand">MyCBT - Super Admin</span>
          <Link to="/" className="btn btn-outline-light btn-sm ms-auto">Back to Home</Link>
        </div>
      </nav>

      <div className="container mt-4">
        <h2 className="mb-4">Super Admin Dashboard</h2>

        {/* Tab Navigation */}
        <ul className="nav nav-tabs mb-4">
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              View Users
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'students' ? 'active' : ''}`}
              onClick={() => setActiveTab('students')}
            >
              View Students
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'questions' ? 'active' : ''}`}
              onClick={() => setActiveTab('questions')}
            >
              Manage Questions
            </button>
          </li>
        </ul>

        {/* Loading State */}
        {loading && (
          <div className="text-center my-5">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {!loading && activeTab === 'users' && (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4>Users Management</h4>
              <button className="btn btn-primary" onClick={() => setShowAddUserModal(true)}>
                Add New User
              </button>
            </div>
            <div className="table-responsive">
              <table className="table table-striped table-hover">
                <thead className="table-dark">
                  <tr>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user._id}>
                      <td>{user.username}</td>
                      <td>{user.email}</td>
                      <td><span className="badge bg-info">{user.role}</span></td>
                      <td>
                        <button 
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDeleteUser(user._id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Students Tab */}
        {!loading && activeTab === 'students' && (
          <div>
            <h4 className="mb-3">Registered Students</h4>
            <div className="table-responsive">
              <table className="table table-striped table-hover">
                <thead className="table-dark">
                  <tr>
                    <th>Reg No</th>
                    <th>Full Name</th>
                    <th>Subject 1</th>
                    <th>Subject 2</th>
                    <th>Subject 3</th>
                    <th>Registration Date</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(student => (
                    <tr key={student._id}>
                      <td>{student.candregno}</td>
                      <td>{student.fullname}</td>
                      <td><span className="badge bg-success">{student.subj1}</span></td>
                      <td><span className="badge bg-success">{student.subj2}</span></td>
                      <td><span className="badge bg-success">{student.subj3}</span></td>
                      <td>{new Date(student.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Questions Tab */}
        {!loading && activeTab === 'questions' && (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4>Questions Management</h4>
              <button className="btn btn-primary" onClick={() => setShowAddQuestionModal(true)}>
                Add New Question
              </button>
            </div>
            <div className="row">
              {questions.map(question => (
                <div key={question._id} className="col-md-12 mb-3">
                  <div className="card">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="flex-grow-1">
                          <span className="badge bg-primary mb-2">{question.subject}</span>
                          <p className="card-text"><strong>Q:</strong> {question.question}</p>
                          <p className="mb-1"><strong>A)</strong> {question.optionA}</p>
                          <p className="mb-1"><strong>B)</strong> {question.optionB}</p>
                          <p className="mb-1"><strong>C)</strong> {question.optionC}</p>
                          <p className="mb-1"><strong>D)</strong> {question.optionD}</p>
                          <p className="mt-2"><strong>Correct Answer:</strong> <span className="badge bg-success">{question.correctAnswer}</span></p>
                        </div>
                        <div className="ms-3">
                          <button 
                            className="btn btn-sm btn-warning me-2"
                            onClick={() => handleEditQuestion(question)}
                          >
                            Edit
                          </button>
                          <button 
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDeleteQuestion(question._id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      <Modal show={showAddUserModal} onHide={() => setShowAddUserModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add New User</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <form onSubmit={handleAddUser}>
            <div className="mb-3">
              <label className="form-label">Username</label>
              <input 
                type="text" 
                className="form-control" 
                name="username"
                value={userForm.username}
                onChange={handleUserChange}
                required 
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input 
                type="email" 
                className="form-control" 
                name="email"
                value={userForm.email}
                onChange={handleUserChange}
                required 
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Password</label>
              <input 
                type="password" 
                className="form-control" 
                name="password"
                value={userForm.password}
                onChange={handleUserChange}
                required 
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Role</label>
              <select 
                className="form-select" 
                name="role"
                value={userForm.role}
                onChange={handleUserChange}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
                <option value="superadmin">Super Admin</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary w-100">Add User</button>
          </form>
        </Modal.Body>
      </Modal>

      {/* Add Question Modal */}
      <Modal show={showAddQuestionModal} onHide={() => setShowAddQuestionModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Add New Question</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <form onSubmit={handleAddQuestion}>
            <div className="mb-3">
              <label className="form-label">Subject</label>
              <select 
                className="form-select" 
                name="subject"
                value={questionForm.subject}
                onChange={handleQuestionChange}
                required
              >
                <option value="">Select Subject</option>
                {subjects.map(subject => (
                  <option key={subject.abbreviation} value={subject.abbreviation}>
                    {subject.full}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-3">
              <label className="form-label">Question</label>
              <textarea 
                className="form-control" 
                name="question"
                rows="3"
                value={questionForm.question}
                onChange={handleQuestionChange}
                required 
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Option A</label>
              <input 
                type="text" 
                className="form-control" 
                name="optionA"
                value={questionForm.optionA}
                onChange={handleQuestionChange}
                required 
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Option B</label>
              <input 
                type="text" 
                className="form-control" 
                name="optionB"
                value={questionForm.optionB}
                onChange={handleQuestionChange}
                required 
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Option C</label>
              <input 
                type="text" 
                className="form-control" 
                name="optionC"
                value={questionForm.optionC}
                onChange={handleQuestionChange}
                required 
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Option D</label>
              <input 
                type="text" 
                className="form-control" 
                name="optionD"
                value={questionForm.optionD}
                onChange={handleQuestionChange}
                required 
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Correct Answer</label>
              <select 
                className="form-select" 
                name="correctAnswer"
                value={questionForm.correctAnswer}
                onChange={handleQuestionChange}
                required
              >
                <option value="">Select Correct Answer</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
              </select>
            </div>
            <div className="mb-3">
              <label className="form-label">Explanation (Optional)</label>
              <textarea 
                className="form-control" 
                name="explanation"
                rows="2"
                value={questionForm.explanation}
                onChange={handleQuestionChange}
              />
            </div>
            <button type="submit" className="btn btn-primary w-100">Add Question</button>
          </form>
        </Modal.Body>
      </Modal>

      {/* Edit Question Modal */}
      <Modal show={showEditQuestionModal} onHide={() => setShowEditQuestionModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Question</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <form onSubmit={handleUpdateQuestion}>
            <div className="mb-3">
              <label className="form-label">Subject</label>
              <select 
                className="form-select" 
                name="subject"
                value={questionForm.subject}
                onChange={handleQuestionChange}
                required
              >
                <option value="">Select Subject</option>
                {subjects.map(subject => (
                  <option key={subject.abbreviation} value={subject.abbreviation}>
                    {subject.full}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-3">
              <label className="form-label">Question</label>
              <textarea 
                className="form-control" 
                name="question"
                rows="3"
                value={questionForm.question}
                onChange={handleQuestionChange}
                required 
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Option A</label>
              <input 
                type="text" 
                className="form-control" 
                name="optionA"
                value={questionForm.optionA}
                onChange={handleQuestionChange}
                required 
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Option B</label>
              <input 
                type="text" 
                className="form-control" 
                name="optionB"
                value={questionForm.optionB}
                onChange={handleQuestionChange}
                required 
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Option C</label>
              <input 
                type="text" 
                className="form-control" 
                name="optionC"
                value={questionForm.optionC}
                onChange={handleQuestionChange}
                required 
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Option D</label>
              <input 
                type="text" 
                className="form-control" 
                name="optionD"
                value={questionForm.optionD}
                onChange={handleQuestionChange}
                required 
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Correct Answer</label>
              <select 
                className="form-select" 
                name="correctAnswer"
                value={questionForm.correctAnswer}
                onChange={handleQuestionChange}
                required
              >
                <option value="">Select Correct Answer</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
              </select>
            </div>
            <div className="mb-3">
              <label className="form-label">Explanation (Optional)</label>
              <textarea 
                className="form-control" 
                name="explanation"
                rows="2"
                value={questionForm.explanation}
                onChange={handleQuestionChange}
              />
            </div>
            <button type="submit" className="btn btn-primary w-100">Update Question</button>
          </form>
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default SuperAdmin;