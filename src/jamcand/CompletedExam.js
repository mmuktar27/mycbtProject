import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import ExamSummary from './ExamSummary';
import { useCandidate } from '../hooks/useCandidate';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

const CompletedExam = () => {
  const location = useLocation();
  const regNo = location?.state?.regNo;

  const { data: candidate, isLoading, error, isError } = useCandidate(regNo);

  const [results, setResult] = useState(location.state?.result || []);
  const [questions, setQuestions] = useState(location.state?.questions || []);
  const [showResults, setShowResults] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [totalGrade, setTotalGrade] = useState(0);

  useEffect(() => {
    console.log('candidate:', candidate);
  }, [candidate]);

  const calculateTotalGrade = (results) => {
    return results.reduce((total, result) => total + result.grade, 0);
  };

  const handleViewResult = () => {
    const grade = calculateTotalGrade(results);
    setTotalGrade(grade);
    setShowResults(!showResults);
  };

  const handleViewSummary = () => {
    setShowSummary(!showSummary);
  };

  const organizeResultsBySubject = () => {
    const resultsBySubject = {};
    results.forEach((result) => {
      const question = questions.find((q) => q.id === result.qid);
      if (question) {
        const { subjID } = question;
        if (!resultsBySubject[subjID]) {
          resultsBySubject[subjID] = [];
        }
        resultsBySubject[subjID].push(result);
      }
    });
    return resultsBySubject;
  };

  const renderedResultsBySubject = Object.entries(organizeResultsBySubject()).map(
    ([subject, subjectResults]) => {
      const totalGradeForSubject = subjectResults.reduce(
        (total, result) => total + result.grade,
        0
      );

      return (
        <div key={subject} className="mb-3 p-3 border rounded bg-light">
          <h5 className="text-primary mb-2">{subject}</h5>
          <p className="mb-0">
            <strong>Total Points:</strong> {totalGradeForSubject}
          </p>
        </div>
      );
    }
  );

  const chartData = Object.entries(organizeResultsBySubject()).map(
    ([subject, subjectResults]) => ({
      subject: subject,
      totalPoints: subjectResults.reduce((total, result) => total + result.grade, 0),
      numberOfQuestions: subjectResults.length,
    })
  );

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger" role="alert">
          Error loading candidate data: {error?.message || 'Unknown error'}
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100" style={{ backgroundColor: '#f8f9fa' }}>
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
        <div className="container">
          <span className="navbar-brand mb-0 h1">Exam Completed</span>
        </div>
      </nav>

      <div className="container mt-5 pb-5">
        <div className="card shadow-sm border-0">
          <div className="card-body p-4">
            <div className="d-flex justify-content-end mb-3">
              <Link to="/" className="btn btn-danger">
                Back to Dashboard
              </Link>
            </div>

            <div className="text-center mb-4">
              <img
                src={candidate?.img || 'https://via.placeholder.com/150'}
                className="rounded-circle shadow-sm mb-3"
                alt="Candidate"
                width="150"
                height="150"
                style={{ objectFit: 'cover', border: '4px solid #007bff' }}
              />
              <h2 className="mb-2">{candidate?.fullname || 'N/A'}</h2>
              <h5 className="text-muted">{regNo}</h5>
            </div>

            <div className="text-center mt-4">
              <div className="alert alert-success" role="alert">
                <h5 className="alert-heading mb-0">
                  🎉 Congratulations! You have completed your exam.
                </h5>
              </div>

              <button
                onClick={handleViewResult}
                className="btn btn-primary btn-lg mt-3 px-5"
              >
                {showResults ? 'Hide Results' : 'View Results'}
              </button>

              {showResults && (
                <div className="mt-4 animate-fade-in">
                  <div className="card bg-primary text-white mb-4 shadow-sm">
                    <div className="card-body">
                      <h4 className="mb-2">Overall Score</h4>
                      <h1 className="display-3 mb-0">{totalGrade}</h1>
                      <p className="mb-0">Total Points</p>
                    </div>
                  </div>

                  {chartData.length > 0 && (
                    <div className="card mb-4 shadow-sm">
                      <div className="card-body">
                        <h4 className="card-title mb-4">Performance by Subject</h4>
                        <ResponsiveContainer width="100%" height={400}>
                          <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                              dataKey="subject"
                              angle={-45}
                              textAnchor="end"
                              height={100}
                              interval={0}
                            />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="totalPoints" fill="#007bff" name="Total Points" />
                            <Bar
                              dataKey="numberOfQuestions"
                              fill="#28a745"
                              name="Number of Questions"
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  <div className="card shadow-sm">
                    <div className="card-body">
                      <h4 className="card-title mb-4">Results by Subject</h4>
                      {renderedResultsBySubject}
                    </div>
                  </div>

                  <button
                    className="btn btn-info btn-lg mt-4 px-5"
                    onClick={handleViewSummary}
                  >
                    {showSummary ? 'Hide Summary' : 'View Detailed Summary'}
                  </button>
                </div>
              )}

              {showSummary && (
                <div className="mt-4 animate-fade-in">
                  <div className="card shadow-sm">
                    <div className="card-body">
                      <h3 className="card-title mb-4">📋 Detailed Exam Summary</h3>
                      <ExamSummary questions={questions} results={results} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fadeIn 0.5s ease-in-out;
        }

        .card {
          transition: transform 0.2s ease-in-out;
        }

        .card:hover {
          transform: translateY(-2px);
        }

        .btn {
          transition: all 0.3s ease;
        }

        .btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }
      `}</style>
    </div>
  );
};

export default CompletedExam;