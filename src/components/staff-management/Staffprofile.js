import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';


import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  GraduationCap,
  Pencil,
  ArrowLeft,
  CheckCircle
} from "lucide-react";

import AppDialog from '../shared/AppDialog';
import { useAppDialog } from '../../hooks/useAppDialog';
import './Staffprofile.css';

const StaffProfile = () => {
  const { staffId } = useParams();
  const navigate = useNavigate();
  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);
const { dialog, showDialog, closeDialog, handleDialogAction } = useAppDialog();
  useEffect(() => {
    fetchStaffProfile();
  }, [staffId]);

  const fetchStaffProfile = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/staff/${staffId}`);
      if (response.data.success) {
        setStaff(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching staff profile:', error);
 // showDialog('error', 'Failed to Load Profile', 'Could not load the staff profile.');
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

  if (!staff) {
    return (
      <div className="error-container">
        <h2>Staff Member Not Found</h2>
        <Link to="/staff/all" className="btn btn-primary">
          <ArrowLeft /> Back to Staff List
        </Link>
      </div>
    );
  }

  return (
    <div className="staff-profile-container">
      <div className="profile-header">
        <button onClick={() => navigate('/staff/all')} className="btn-back">
          <ArrowLeft /> Back to List
        </button>
        <Link to={`/staff/edit/${staffId}`} className="btn btn-primary">
          <Pencil /> Edit Profile
        </Link>
      </div>

      <div className="profile-card">
        <div className="profile-banner">
          <div className="profile-image-section">
            {staff.profileImage ? (
              <img src={staff.profileImage} alt={staff.firstName} className="profile-image" />
            ) : (
              <div className="profile-image-placeholder">
                {staff.firstName.charAt(0)}{staff.lastName.charAt(0)}
              </div>
            )}
            {staff.status === 'active' && (
              <span className="status-badge active">
                <CheckCircle /> Active
              </span>
            )}
          </div>
          <div className="profile-header-info">
            <h1>{staff.firstName} {staff.middleName} {staff.lastName}</h1>
            <p className="role-title">{staff.role}</p>
            <p className="staff-id-display">Staff ID: {staff.staffId}</p>
          </div>
        </div>

        <div className="profile-content">
          <div className="info-section">
            <h3><User /> Personal Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Gender:</span>
                <span className="info-value">{staff.gender}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Date of Birth:</span>
                <span className="info-value">
                  {staff.dateOfBirth ? new Date(staff.dateOfBirth).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">State of Origin:</span>
                <span className="info-value">{staff.stateOfOrigin || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">LGA:</span>
                <span className="info-value">{staff.lga || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="info-section">
            <h3><Phone /> Contact Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label"><Mail /> Email:</span>
                <span className="info-value">{staff.email}</span>
              </div>
              <div className="info-item">
                <span className="info-label"><Phone /> Phone:</span>
                <span className="info-value">{staff.phone}</span>
              </div>
              <div className="info-item full-width">
                <span className="info-label"><MapPin /> Address:</span>
                <span className="info-value">{staff.address || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="info-section">
            <h3><GraduationCap /> Professional Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Qualification:</span>
                <span className="info-value">{staff.qualification || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Years of Experience:</span>
                <span className="info-value">{staff.yearsOfExperience || '0'} years</span>
              </div>
              <div className="info-item full-width">
                <span className="info-label">Specialization:</span>
                <span className="info-value">{staff.specialization || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="info-section">
            <h3><Briefcase /> Employment Details</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Department:</span>
                <span className="info-value">{staff.department || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Employment Type:</span>
                <span className="info-value">{staff.employmentType}</span>
              </div>
              <div className="info-item">
                <span className="info-label"><Calendar /> Employment Date:</span>
                <span className="info-value">
                  {new Date(staff.employmentDate).toLocaleDateString()}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Status:</span>
                <span className="info-value">
                  <span className={`status-pill ${staff.status}`}>{staff.status}</span>
                </span>
              </div>
              {staff.psn && (
      <div className="info-item">
        <span className="info-label">PSN:</span>
        <span className="info-value">{staff.psn}</span>
      </div>
    )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffProfile;