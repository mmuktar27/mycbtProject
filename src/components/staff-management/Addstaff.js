import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { 
  User, Mail, Phone, Users, Calendar, MapPin, GraduationCap,
  Briefcase, Lock, Camera, Save, X, Building
} from 'lucide-react';
import './Addstaff.css';
import AppDialog from '../shared/AppDialog';
import { useAppDialog } from '../../hooks/useAppDialog';

const AddStaff = () => {
  const navigate = useNavigate();
  const { staffId } = useParams();
  const isEdit = Boolean(staffId);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [departments, setDepartments] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [profilePreview, setProfilePreview] = useState(null);
  const { dialog, showDialog, closeDialog, handleDialogAction } = useAppDialog();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    email: '',
    phone: '',
    gender: '',
    dateOfBirth: '',
    address: '',
    stateOfOrigin: '',
    lga: '',
    qualification: '',
    yearsOfExperience: '',
    specialization: '',
    psn: '',
    role: '',
    department: '',
    employmentDate: '',
    employmentType: 'Full-time',
    password: '',
    confirmPassword: '',
    profileImage: '',
    signature: ''
  });

  const [errors, setErrors] = useState({});
  const [signaturePreview, setSignaturePreview] = useState(null);

  const nigerianStates = [
    'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue',
    'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu',
    'FCT', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi',
    'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun',
    'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
  ];

  const roles = [
    'Principal', 'Vice Principal (Admin)', 'Vice Principal (Academic)',
    'Director of Studies', 'Admission Officer', 'Exams Officer',
    'Head of Department', 'Senior Teacher', 'Teacher', 'Class Teacher',
    'Laboratory Technician', 'Librarian', 'Bursar', 'Accountant',
    'School Secretary', 'ICT Coordinator', 'Guidance Counselor',
    'Sports Master/Mistress', 'Security Officer', 'School Nurse', 'Cook',
    'Cleaner', 'Driver', 'Gardener', 'PTA Staff'
  ];

  const qualifications = [
    'SSCE', 'OND', 'NCE', 'HND', 'B.Ed', 'B.Sc', 'B.A', 'M.Ed', 'M.Sc', 'M.A', 'Ph.D', 'Other'
  ];

  const employmentTypes = ['Full-time', 'Part-time', 'Contract', 'Temporary', 'Intern'];

  useEffect(() => {
    fetchDepartments();
    if (isEdit) {
      fetchStaffData();
    }
  }, [staffId]);

  const fetchDepartments = async () => {
    try {
      const response = await axios.get('/api/departments');
      if (response.data.success) {
        setDepartments(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchStaffData = async () => {
    try {
      setInitialLoading(true);
      const response = await axios.get(`/api/staff/${staffId}`);
      if (response.data.success) {
        const s = response.data.data;
        setFormData({
          firstName: s.firstName || '',
          lastName: s.lastName || '',
          middleName: s.middleName || '',
          email: s.email || '',
          phone: s.phone || '',
          gender: s.gender || '',
          dateOfBirth: s.dateOfBirth ? s.dateOfBirth.split('T')[0] : '',
          address: s.address || '',
          stateOfOrigin: s.stateOfOrigin || '',
          lga: s.lga || '',
          qualification: s.qualification || '',
          yearsOfExperience: s.yearsOfExperience ?? '',
          specialization: s.specialization || '',
          psn: s.psn || '',
          role: s.role || '',
          department: s.department || '',
          employmentDate: s.employmentDate ? s.employmentDate.split('T')[0] : '',
          employmentType: s.employmentType || 'Full-time',
          password: '',
          confirmPassword: '',
          profileImage: s.profileImage || '',
          signature: s.signature || ''
        });
        if (s.profileImage) setProfilePreview(s.profileImage);
        if (s.signature) setSignaturePreview(s.signature);
      } else {
        showDialog('error', 'Not Found', 'Staff member could not be found.', '', 'OK', () => {
          closeDialog();
          navigate('/staff/all');
        });
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
      showDialog('error', 'Failed to Load', 'Could not load staff member details.', '', 'OK', () => {
        closeDialog();
        navigate('/staff/all');
      });
    } finally {
      setInitialLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors({ ...errors, profileImage: 'Image size should not exceed 5MB' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, profileImage: reader.result });
        setProfilePreview(reader.result);
        setErrors({ ...errors, profileImage: '' });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSignatureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrors({ ...errors, signature: 'Signature image size should not exceed 2MB' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, signature: reader.result });
        setSignaturePreview(reader.result);
        setErrors({ ...errors, signature: '' });
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[0-9]{11}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Phone number must be 11 digits';
    }
    if (!formData.gender) newErrors.gender = 'Gender is required';
    if (!formData.role) newErrors.role = 'Role is required';
    if (!formData.employmentDate) newErrors.employmentDate = 'Employment date is required';

    // Password: required on create, optional on edit (only validated if they typed one)
    if (!isEdit) {
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    } else if (formData.password) {
      if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      const firstError = document.querySelector('.error-message');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    try {
      setLoading(true);

      const { confirmPassword, password, ...rest } = formData;
      // Only include password in the payload if the user actually typed one —
      // on edit, an empty password field means "leave it unchanged"
      const dataToSend = password ? { ...rest, password } : rest;

      const response = isEdit
        ? await axios.put(`/api/staff/${staffId}`, dataToSend)
        : await axios.post('/api/staff', dataToSend);

      if (response.data.success) {
        showDialog(
          'success',
          isEdit ? 'Staff Member Updated' : 'Staff Member Added',
          isEdit ? 'The staff member was updated successfully.' : 'The staff member was added successfully.',
          '',
          'OK',
          () => {
            closeDialog();
            navigate(isEdit ? `/staff/profile/${staffId}` : '/staff/all');
          }
        );
      }
    } catch (error) {
      console.error('Error saving staff:', error);
      if (error.response?.status === 409) {
        setErrors({ email: 'Email already exists' });
      } else {
        showDialog('error', isEdit ? 'Failed to Update Staff' : 'Failed to Add Staff', 'Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading staff member...</p>
      </div>
    );
  }

  return (
    <div className="add-staff-container">
      <div className="page-header">
        <h1><User /> {isEdit ? 'Edit Staff Member' : 'Add New Staff Member'}</h1>
        <p className="subtitle">
          {isEdit ? 'Update the details below' : 'Fill in the details below to add a new staff member'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="staff-form">
        <div className="form-section">
          <div className="section-header"><Camera /> Profile Photo</div>
          <div className="profile-upload-section">
            <div className="profile-preview">
              {profilePreview ? (
                <img src={profilePreview} alt="Profile Preview" />
              ) : (
                <div className="profile-placeholder"><User /></div>
              )}
            </div>
            <div className="upload-controls">
              <label htmlFor="profileImage" className="btn btn-secondary">
                <Camera /> Choose Photo
              </label>
              <input type="file" id="profileImage" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
              <p className="help-text">Maximum file size: 5MB</p>
              {errors.profileImage && <p className="error-message">{errors.profileImage}</p>}
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="section-header"><User /> Personal Information</div>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="firstName">First Name <span className="required">*</span></label>
              <input type="text" id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} className={errors.firstName ? 'error' : ''} />
              {errors.firstName && <p className="error-message">{errors.firstName}</p>}
            </div>
            <div className="form-group">
              <label htmlFor="lastName">Last Name <span className="required">*</span></label>
              <input type="text" id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} className={errors.lastName ? 'error' : ''} />
              {errors.lastName && <p className="error-message">{errors.lastName}</p>}
            </div>
            <div className="form-group">
              <label htmlFor="middleName">Middle Name</label>
              <input type="text" id="middleName" name="middleName" value={formData.middleName} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label htmlFor="gender">Gender <span className="required">*</span></label>
              <select id="gender" name="gender" value={formData.gender} onChange={handleChange} className={errors.gender ? 'error' : ''}>
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
              {errors.gender && <p className="error-message">{errors.gender}</p>}
            </div>
            <div className="form-group">
              <label htmlFor="dateOfBirth"><Calendar /> Date of Birth</label>
              <input type="date" id="dateOfBirth" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} />
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="section-header"><Phone /> Contact Information</div>
          <div className="form-grid">
            <div className="form-group full-width">
              <label htmlFor="email"><Mail /> Email Address <span className="required">*</span></label>
              <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} className={errors.email ? 'error' : ''} placeholder="example@email.com" />
              {errors.email && <p className="error-message">{errors.email}</p>}
            </div>
            <div className="form-group">
              <label htmlFor="phone"><Phone /> Phone Number <span className="required">*</span></label>
              <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} className={errors.phone ? 'error' : ''} placeholder="08012345678" />
              {errors.phone && <p className="error-message">{errors.phone}</p>}
            </div>
            <div className="form-group full-width">
              <label htmlFor="address"><MapPin /> Address</label>
              <textarea id="address" name="address" value={formData.address} onChange={handleChange} rows="3" placeholder="Enter full address" />
            </div>
            <div className="form-group">
              <label htmlFor="stateOfOrigin">State of Origin</label>
              <select id="stateOfOrigin" name="stateOfOrigin" value={formData.stateOfOrigin} onChange={handleChange}>
                <option value="">Select State</option>
                {nigerianStates.map(state => <option key={state} value={state}>{state}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="lga">Local Government Area</label>
              <input type="text" id="lga" name="lga" value={formData.lga} onChange={handleChange} placeholder="Enter LGA" />
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="section-header"><GraduationCap /> Professional Information</div>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="qualification">Highest Qualification</label>
              <select id="qualification" name="qualification" value={formData.qualification} onChange={handleChange}>
                <option value="">Select Qualification</option>
                {qualifications.map(qual => <option key={qual} value={qual}>{qual}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="yearsOfExperience">Years of Experience</label>
              <input type="number" id="yearsOfExperience" name="yearsOfExperience" value={formData.yearsOfExperience} onChange={handleChange} min="0" placeholder="0" />
            </div>
            <div className="form-group full-width">
              <label htmlFor="specialization">Specialization/Subject Area</label>
              <input type="text" id="specialization" name="specialization" value={formData.specialization} onChange={handleChange} placeholder="e.g., Mathematics, English, etc." />
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="section-header"><Briefcase /> Employment Details</div>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="role">Role/Position <span className="required">*</span></label>
              <select id="role" name="role" value={formData.role} onChange={handleChange} className={errors.role ? 'error' : ''}>
                <option value="">Select Role</option>
                {roles.map(role => <option key={role} value={role}>{role}</option>)}
              </select>
              {errors.role && <p className="error-message">{errors.role}</p>}
            </div>
            <div className="form-group">
              <label htmlFor="department"><Building /> Department</label>
              <select id="department" name="department" value={formData.department} onChange={handleChange}>
                <option value="">Select Department</option>
                {departments.map(dept => <option key={dept.id} value={dept.departmentName}>{dept.departmentName}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="psn">PSN (Personnel Subhead Number)</label>
              <input type="text" id="psn" name="psn" value={formData.psn} onChange={handleChange} placeholder="e.g., PSN123456" />
            </div>
            <div className="form-group">
              <label htmlFor="employmentDate">Employment Date <span className="required">*</span></label>
              <input type="date" id="employmentDate" name="employmentDate" value={formData.employmentDate} onChange={handleChange} className={errors.employmentDate ? 'error' : ''} />
              {errors.employmentDate && <p className="error-message">{errors.employmentDate}</p>}
            </div>
            <div className="form-group">
              <label htmlFor="employmentType">Employment Type</label>
              <select id="employmentType" name="employmentType" value={formData.employmentType} onChange={handleChange}>
                {employmentTypes.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="section-header"><Camera /> Digital Signature (Optional)</div>
          <div className="signature-upload-section">
            <div className="signature-preview">
              {signaturePreview ? (
                <img src={signaturePreview} alt="Signature Preview" />
              ) : (
                <div className="signature-placeholder">
                  <User size={20} />
                  <p>Upload signature for official documents</p>
                </div>
              )}
            </div>
            <div className="upload-controls">
              <label htmlFor="signature" className="btn btn-secondary">
                <Camera /> Upload Signature
              </label>
              <input type="file" id="signature" accept="image/*" onChange={handleSignatureChange} style={{ display: 'none' }} />
              <p className="help-text">Upload a clear signature image. Maximum file size: 2MB</p>
              {errors.signature && <p className="error-message">{errors.signature}</p>}
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="section-header"><Lock /> Account Security</div>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="password">
                Password {isEdit ? <span style={{ fontWeight: 400, color: '#6b7280' }}>(leave blank to keep unchanged)</span> : <span className="required">*</span>}
              </label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={errors.password ? 'error' : ''}
                  placeholder={isEdit ? 'Leave blank to keep current password' : 'Minimum 6 characters'}
                />
                <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {errors.password && <p className="error-message">{errors.password}</p>}
            </div>
            <div className="form-group">
              <label htmlFor="confirmPassword">
                Confirm Password {!isEdit && <span className="required">*</span>}
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={errors.confirmPassword ? 'error' : ''}
                placeholder="Re-enter password"
              />
              {errors.confirmPassword && <p className="error-message">{errors.confirmPassword}</p>}
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate(isEdit ? `/staff/profile/${staffId}` : '/staff/all')}
            disabled={loading}
          >
            <X /> Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? (
              <><div className="spinner-small"></div> {isEdit ? 'Updating...' : 'Creating...'}</>
            ) : (
              <><Save /> {isEdit ? 'Update Staff Member' : 'Create Staff Member'}</>
            )}
          </button>
        </div>
      </form>

      <AppDialog
        isOpen={dialog.isOpen}
        type={dialog.type}
        title={dialog.title}
        message={dialog.message}
        details={dialog.details}
        actionLabel={dialog.actionLabel}
        onAction={dialog.onAction ? handleDialogAction : null}
        onClose={closeDialog}
        showCancel={dialog.showCancel}
        actionLoading={dialog.actionLoading}
      />
    </div>
  );
};

export default AddStaff;