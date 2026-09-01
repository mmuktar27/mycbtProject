import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  User, Phone, Mail, MapPin, Calendar, GraduationCap,
  Users, FileText, Edit, ArrowLeft, CheckCircle, School
} from 'lucide-react';
import './Studentprofile.css';

const StudentProfile = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentProfile();
  }, [studentId]);

  const fetchStudentProfile = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/students/${studentId}`);
      if (response.data.success) {
        setStudent(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching student:', error);
      alert('Failed to load student profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="error-container">
        <h2>Student Not Found</h2>
        <button onClick={() => navigate('/students/all')} className="btn btn-primary">
          <ArrowLeft size={18} /> Back to Students
        </button>
      </div>
    );
  }

  return (
    <div className="student-profile-container">
      <div className="profile-header-actions">
        <button onClick={() => navigate('/students/all')} className="btn-back">
          <ArrowLeft size={18} /> Back
        </button>
        <button onClick={() => navigate(`/students/edit/${studentId}`)} className="btn btn-primary">
          <Edit size={18} /> Edit Profile
        </button>
      </div>

      <div className="profile-card">
        <div className="profile-banner">
          <div className="profile-image-section">
            {student.profileImage ? (
              <img src={student.profileImage} alt={student.firstName} className="profile-image" />
            ) : (
              <div className="profile-image-placeholder">
                {student.firstName.charAt(0)}{student.lastName.charAt(0)}
              </div>
            )}
            {student.status === 'active' && (
              <span className="status-badge active">
                <CheckCircle size={16} /> Active
              </span>
            )}
          </div>
          <div className="profile-header-info">
            <h1>{student.firstName} {student.middleName} {student.lastName}</h1>
            <p className="student-class"><GraduationCap size={18} /> {student.currentClass}</p>
            <div className="student-ids">
              <span className="id-badge">ID: {student.studentId}</span>
              <span className="id-badge">Admission No: {student.admissionNumber}</span>
            </div>
          </div>
        </div>

        <div className="profile-content">
          <div className="info-section">
            <h3><User size={20} /> Personal Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Date of Birth:</span>
                <span className="info-value">{new Date(student.dateOfBirth).toLocaleDateString()}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Gender:</span>
                <span className="info-value">{student.gender}</span>
              </div>
              <div className="info-item">
                <span className="info-label">State of Origin:</span>
                <span className="info-value">{student.stateOfOrigin}</span>
              </div>
              <div className="info-item">
                <span className="info-label">LGA:</span>
                <span className="info-value">{student.lga}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Nationality:</span>
                <span className="info-value">{student.nationality}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Religion:</span>
                <span className="info-value">{student.religion || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Blood Group:</span>
                <span className="info-value">{student.bloodGroup || 'N/A'}</span>
              </div>
              <div className="info-item full-width">
                <span className="info-label"><MapPin size={14} /> Address:</span>
                <span className="info-value">{student.address}</span>
              </div>
            </div>
          </div>

          <div className="info-section">
            <h3><Phone size={20} /> Contact Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label"><Phone size={14} /> Student Phone:</span>
                <span className="info-value">{student.phone || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="info-label"><Mail size={14} /> Student Email:</span>
                <span className="info-value">{student.email || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="info-label"><Phone size={14} /> Parent Phone:</span>
                <span className="info-value">{student.parentPhone}</span>
              </div>
              <div className="info-item">
                <span className="info-label"><Mail size={14} /> Parent Email:</span>
                <span className="info-value">{student.parentEmail || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="info-section">
            <h3><Users size={20} /> Guardian Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Guardian Name:</span>
                <span className="info-value">{student.guardianName}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Relationship:</span>
                <span className="info-value">{student.guardianRelationship}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Guardian Phone:</span>
                <span className="info-value">{student.guardianPhone}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Guardian Email:</span>
                <span className="info-value">{student.guardianEmail || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Occupation:</span>
                <span className="info-value">{student.guardianOccupation || 'N/A'}</span>
              </div>
              <div className="info-item full-width">
                <span className="info-label">Guardian Address:</span>
                <span className="info-value">{student.guardianAddress || 'Same as student'}</span>
              </div>
            </div>
          </div>

          <div className="info-section">
            <h3><School size={20} /> Academic Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Current Class:</span>
                <span className="info-value">{student.currentClass}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Admission Class:</span>
                <span className="info-value">{student.admissionClass}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Section:</span>
                <span className="info-value">{student.section || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Roll Number:</span>
                <span className="info-value">{student.rollNumber || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Academic Year:</span>
                <span className="info-value">{student.academicYear}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Admission Date:</span>
                <span className="info-value">{new Date(student.admissionDate).toLocaleDateString()}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Admission Type:</span>
                <span className="info-value">{student.admissionType}</span>
              </div>
              {student.previousSchool && (
                <>
                  <div className="info-item">
                    <span className="info-label">Previous School:</span>
                    <span className="info-value">{student.previousSchool}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Previous Class:</span>
                    <span className="info-value">{student.previousClass}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;