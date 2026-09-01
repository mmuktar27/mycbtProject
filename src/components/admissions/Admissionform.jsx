import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  GraduationCap,
  Users,
  Camera,
  Upload,
  Save,
  X
} from "lucide-react";
import './AdmissionForm.css';

const AdmissionForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [classes, setClasses] = useState([]);
  
  const [formData, setFormData] = useState({
    // Student Information
    firstName: '',
    lastName: '',
    middleName: '',
    dateOfBirth: '',
    gender: '',
    email: '',
    phone: '',
    address: '',
    stateOfOrigin: '',
    lga: '',
    nationality: 'Nigerian',
    religion: '',
    bloodGroup: '',
    profileImage: '',
    
    // Guardian Information
    guardianName: '',
    guardianRelationship: '',
    guardianPhone: '',
    guardianEmail: '',
    guardianAddress: '',
    guardianOccupation: '',
    
    // Academic Information
    appliedClass: '',
     appliedClassId: '',        // NEW: Store the class ID
    appliedSection: '', 
    previousSchool: '',
    previousClass: '',
    academicYear: new Date().getFullYear() + '/' + (new Date().getFullYear() + 1),
    
    // Documents
    birthCertificate: '',
    transferCertificate: '',
    medicalReport: '',
    passportPhoto: ''
  });

  const [errors, setErrors] = useState({});
  const [profilePreview, setProfilePreview] = useState(null);

const [availableSections, setAvailableSections] = useState([]);
const [selectedClassData, setSelectedClassData] = useState(null);
  const nigerianStates = [
    'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue',
    'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu',
    'FCT', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi',
    'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun',
    'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
  ];

  const guardianRelationships = [
    'Father', 'Mother', 'Guardian', 'Uncle', 'Aunt', 
    'Grandfather', 'Grandmother', 'Brother', 'Sister', 'Other'
  ];

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  const religions = ['Christianity', 'Islam', 'Traditional', 'Other'];

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const response = await axios.get('/api/classes');
      if (response.data.success) {

        console.log('response',response)
        setClasses(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };


const handleChange = (e) => {
    const { name, value } = e.target;
    
    // NEW: Handle class selection differently
    if (name === 'appliedClass') {
        // Find the selected class object
        const selected = classes.find(cls => cls.id.toString() === value);
        
        if (selected) {
            setFormData({ 
                ...formData, 
                appliedClass: selected.className,      // Store readable name
                appliedClassId: selected.id,            // Store ID
                appliedSection: selected.section || ''  // Store section if available
            });
            setSelectedClassData(selected);
            
            // Extract available sections from selected class
            const sections = selected.section ? [selected.section] : ['A', 'B', 'C'];
            setAvailableSections(sections);
        }
    } else {
        setFormData({ ...formData, [name]: value });
    }
    
    if (errors[name]) {
        setErrors({ ...errors, [name]: '' });
    }
};


  const handleImageChange = (e, fieldName) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors({ ...errors, [fieldName]: 'File size should not exceed 5MB' });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, [fieldName]: reader.result });
        if (fieldName === 'profileImage' || fieldName === 'passportPhoto') {
          setProfilePreview(reader.result);
        }
        setErrors({ ...errors, [fieldName]: '' });
      };
      reader.readAsDataURL(file);
    }
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
      if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
      if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
      if (!formData.gender) newErrors.gender = 'Gender is required';
      if (!formData.address.trim()) newErrors.address = 'Address is required';
      if (!formData.stateOfOrigin) newErrors.stateOfOrigin = 'State of origin is required';
      if (!formData.lga.trim()) newErrors.lga = 'LGA is required';
    }

    if (step === 2) {
      if (!formData.guardianName.trim()) newErrors.guardianName = 'Guardian name is required';
      if (!formData.guardianRelationship) newErrors.guardianRelationship = 'Relationship is required';
      if (!formData.guardianPhone.trim()) {
        newErrors.guardianPhone = 'Guardian phone is required';
      } else if (!/^[0-9]{11}$/.test(formData.guardianPhone.replace(/\s/g, ''))) {
        newErrors.guardianPhone = 'Phone must be 11 digits';
      }
    }

    
if (step === 3) {
    if (!formData.appliedClass) newErrors.appliedClass = 'Applied class is required';
    if (!formData.appliedClassId) newErrors.appliedClass = 'Applied class is required';
    if (availableSections.length > 0 && !formData.appliedSection) {
        newErrors.appliedSection = 'Section is required';
    }
}

    return newErrors;
  };

  const handleNext = () => {
    const stepErrors = validateStep(currentStep);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    setCurrentStep(currentStep + 1);
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const stepErrors = validateStep(currentStep);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }

    try {
      setLoading(true);
      const submissionData = {
            ...formData,
            appliedClass: formData.appliedClass,  // Keep the readable name for display
            appliedClassId: formData.appliedClassId,  // Add the ID
        };
      const response = await axios.post('/api/admissions/apply', submissionData);

      if (response.data.success) {
        alert(`Application submitted successfully!\nApplication ID: ${response.data.data.applicationId}`);
        navigate('/admission/pending');
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      alert('Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="step-indicator">
      <div className={`step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
        <div className="step-number">1</div>
        <div className="step-label">Student Info</div>
      </div>
      <div className="step-line"></div>
      <div className={`step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
        <div className="step-number">2</div>
        <div className="step-label">Guardian Info</div>
      </div>
      <div className="step-line"></div>
      <div className={`step ${currentStep >= 3 ? 'active' : ''} ${currentStep > 3 ? 'completed' : ''}`}>
        <div className="step-number">3</div>
        <div className="step-label">Academic Info</div>
      </div>
      <div className="step-line"></div>
      <div className={`step ${currentStep >= 4 ? 'active' : ''}`}>
        <div className="step-number">4</div>
        <div className="step-label">Documents</div>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="form-step">
      <h3><User /> Student Information</h3>
      
      <div className="profile-upload-section">
        <div className="profile-preview">
          {profilePreview ? (
            <img src={profilePreview} alt="Profile" />
          ) : (
            <div className="profile-placeholder"><User /></div>
          )}
        </div>
        <div className="upload-controls">
          <label htmlFor="passportPhoto" className="btn btn-secondary">
            <Camera /> Upload Photo
          </label>
          <input
            type="file"
            id="passportPhoto"
            accept="image/*"
            onChange={(e) => handleImageChange(e, 'passportPhoto')}
            style={{ display: 'none' }}
          />
          <p className="help-text">Recent passport photograph (max 5MB)</p>
          {errors.passportPhoto && <p className="error-message">{errors.passportPhoto}</p>}
        </div>
      </div>

      <div className="form-grid">
        <div className="form-group">
          <label>First Name <span className="required">*</span></label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            className={errors.firstName ? 'error' : ''}
          />
          {errors.firstName && <p className="error-message">{errors.firstName}</p>}
        </div>

        <div className="form-group">
          <label>Last Name <span className="required">*</span></label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            className={errors.lastName ? 'error' : ''}
          />
          {errors.lastName && <p className="error-message">{errors.lastName}</p>}
        </div>

        <div className="form-group">
          <label>Middle Name</label>
          <input
            type="text"
            name="middleName"
            value={formData.middleName}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label><Calendar /> Date of Birth <span className="required">*</span></label>
          <input
            type="date"
            name="dateOfBirth"
            value={formData.dateOfBirth}
            onChange={handleChange}
            className={errors.dateOfBirth ? 'error' : ''}
          />
          {errors.dateOfBirth && <p className="error-message">{errors.dateOfBirth}</p>}
        </div>

        <div className="form-group">
          <label>Gender <span className="required">*</span></label>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className={errors.gender ? 'error' : ''}
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
          {errors.gender && <p className="error-message">{errors.gender}</p>}
        </div>

        <div className="form-group">
          <label><Mail /> Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="student@email.com"
          />
        </div>

        <div className="form-group">
          <label><Phone /> Phone Number</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="08012345678"
          />
        </div>

        <div className="form-group">
          <label>Religion</label>
          <select name="religion" value={formData.religion} onChange={handleChange}>
            <option value="">Select Religion</option>
            {religions.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label>Blood Group</label>
          <select name="bloodGroup" value={formData.bloodGroup} onChange={handleChange}>
            <option value="">Select Blood Group</option>
            {bloodGroups.map(bg => <option key={bg} value={bg}>{bg}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label>State of Origin <span className="required">*</span></label>
          <select
            name="stateOfOrigin"
            value={formData.stateOfOrigin}
            onChange={handleChange}
            className={errors.stateOfOrigin ? 'error' : ''}
          >
            <option value="">Select State</option>
            {nigerianStates.map(state => <option key={state} value={state}>{state}</option>)}
          </select>
          {errors.stateOfOrigin && <p className="error-message">{errors.stateOfOrigin}</p>}
        </div>

        <div className="form-group">
          <label>Local Government Area <span className="required">*</span></label>
          <input
            type="text"
            name="lga"
            value={formData.lga}
            onChange={handleChange}
            className={errors.lga ? 'error' : ''}
            placeholder="Enter LGA"
          />
          {errors.lga && <p className="error-message">{errors.lga}</p>}
        </div>

        <div className="form-group">
          <label>Nationality</label>
          <input
            type="text"
            name="nationality"
            value={formData.nationality}
            onChange={handleChange}
          />
        </div>

        <div className="form-group full-width">
          <label><MapPin /> Residential Address <span className="required">*</span></label>
          <textarea
            name="address"
            value={formData.address}
            onChange={handleChange}
            className={errors.address ? 'error' : ''}
            rows="3"
            placeholder="Enter full residential address"
          />
          {errors.address && <p className="error-message">{errors.address}</p>}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="form-step">
      <h3><Users /> Parent/Guardian Information</h3>
      <div className="form-grid">
        <div className="form-group">
          <label>Guardian Name <span className="required">*</span></label>
          <input
            type="text"
            name="guardianName"
            value={formData.guardianName}
            onChange={handleChange}
            className={errors.guardianName ? 'error' : ''}
          />
          {errors.guardianName && <p className="error-message">{errors.guardianName}</p>}
        </div>

        <div className="form-group">
          <label>Relationship <span className="required">*</span></label>
          <select
            name="guardianRelationship"
            value={formData.guardianRelationship}
            onChange={handleChange}
            className={errors.guardianRelationship ? 'error' : ''}
          >
            <option value="">Select Relationship</option>
            {guardianRelationships.map(rel => 
              <option key={rel} value={rel}>{rel}</option>
            )}
          </select>
          {errors.guardianRelationship && <p className="error-message">{errors.guardianRelationship}</p>}
        </div>

        <div className="form-group">
          <label><Phone /> Guardian Phone <span className="required">*</span></label>
          <input
            type="tel"
            name="guardianPhone"
            value={formData.guardianPhone}
            onChange={handleChange}
            className={errors.guardianPhone ? 'error' : ''}
            placeholder="08012345678"
          />
          {errors.guardianPhone && <p className="error-message">{errors.guardianPhone}</p>}
        </div>

        <div className="form-group">
          <label><Mail /> Guardian Email</label>
          <input
            type="email"
            name="guardianEmail"
            value={formData.guardianEmail}
            onChange={handleChange}
            placeholder="guardian@email.com"
          />
        </div>

        <div className="form-group">
          <label>Occupation</label>
          <input
            type="text"
            name="guardianOccupation"
            value={formData.guardianOccupation}
            onChange={handleChange}
            placeholder="Guardian's occupation"
          />
        </div>

        <div className="form-group full-width">
          <label><MapPin /> Guardian Address</label>
          <textarea
            name="guardianAddress"
            value={formData.guardianAddress}
            onChange={handleChange}
            rows="3"
            placeholder="Guardian's residential address (if different from student)"
          />
        </div>
      </div>
    </div>
  );


const renderStep3 = () => (
    <div className="form-step">
        <h3><GraduationCap /> Academic Information</h3>
        <div className="form-grid">
            {/* ==================== CLASS SELECTION ====================*/}
            <div className="form-group">
                <label>Applied Class <span className="required">*</span></label>
                <select
                    name="appliedClass"
                    value={selectedClassData?.id || ''}
                    onChange={handleChange}
                    className={errors.appliedClass ? 'error' : ''}
                >
                    <option value="">Select Class</option>
                    {classes.map(cls => (
                        <option key={cls.id} value={cls.id}>
                            {cls.className} 
                            {cls.section ? ` (Section ${cls.section})` : ''} 
                            - {cls.currentStudents}/{cls.capacity} students
                        </option>
                    ))}
                </select>
                {errors.appliedClass && <p className="error-message">{errors.appliedClass}</p>}
            </div>

            {/* ==================== SECTION SELECTION (NEW) ====================*/}
            {selectedClassData && availableSections.length > 0 && (
                <div className="form-group">
                    <label>Section <span className="required">*</span></label>
                    <select
                        name="appliedSection"
                        value={formData.appliedSection}
                        onChange={handleChange}
                        className={errors.appliedSection ? 'error' : ''}
                    >
                        <option value="">Select Section</option>
                        {availableSections.map(section => (
                            <option key={section} value={section}>
                                Section {section}
                            </option>
                        ))}
                    </select>
                    {errors.appliedSection && <p className="error-message">{errors.appliedSection}</p>}
                </div>
            )}

            {/* ==================== CLASS INFO DISPLAY (NEW) ====================*/}
            {selectedClassData && (
                <div className="class-info-card full-width">
                    <div className="info-row">
                        <span className="info-label">Class:</span>
                        <span className="info-value">{selectedClassData.className}</span>
                    </div>
                    <div className="info-row">
                        <span className="info-label">Category:</span>
                        <span className="info-value">{selectedClassData.classCategory}</span>
                    </div>
                    <div className="info-row">
                        <span className="info-label">Class Teacher:</span>
                        <span className="info-value">{selectedClassData.classTeacher || 'Not assigned'}</span>
                    </div>
                    <div className="info-row">
                        <span className="info-label">Capacity:</span>
                        <span className="info-value">
                            {selectedClassData.currentStudents}/{selectedClassData.capacity} students
                            {selectedClassData.currentStudents >= selectedClassData.capacity && 
                                <span className="status-full"> (FULL)</span>
                            }
                        </span>
                    </div>
                </div>
            )}

            <div className="form-group">
                <label>Academic Year</label>
                <input
                    type="text"
                    name="academicYear"
                    value={formData.academicYear}
                    onChange={handleChange}
                    placeholder="2024/2025"
                />
            </div>

            <div className="form-group">
                <label>Previous School</label>
                <input
                    type="text"
                    name="previousSchool"
                    value={formData.previousSchool}
                    onChange={handleChange}
                    placeholder="Name of previous school"
                />
            </div>

            <div className="form-group">
                <label>Previous Class</label>
                <input
                    type="text"
                    name="previousClass"
                    value={formData.previousClass}
                    onChange={handleChange}
                    placeholder="Last class attended"
                />
            </div>
        </div>
    </div>
);

  const renderStep4 = () => (
    <div className="form-step">
      <h3><Upload /> Upload Documents</h3>
      <div className="documents-upload-grid">
        <div className="document-upload-item">
          <label><Upload /> Birth Certificate</label>
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => handleImageChange(e, 'birthCertificate')}
          />
          {formData.birthCertificate && <span className="file-uploaded">✓ Uploaded</span>}
        </div>

        <div className="document-upload-item">
          <label><Upload /> Transfer Certificate (if applicable)</label>
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => handleImageChange(e, 'transferCertificate')}
          />
          {formData.transferCertificate && <span className="file-uploaded">✓ Uploaded</span>}
        </div>

        <div className="document-upload-item">
          <label><Upload /> Medical Report</label>
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => handleImageChange(e, 'medicalReport')}
          />
          {formData.medicalReport && <span className="file-uploaded">✓ Uploaded</span>}
        </div>
      </div>
      <p className="help-text">All documents should be clear scans or photos (PDF or images, max 5MB each)</p>
    </div>
  );

 return (
  <div className="admission-form-container">
    <div className="page-header">
      <h1>Admission Application Form</h1>
      <p className="subtitle">Complete all steps to submit your application</p>
    </div>

    {renderStepIndicator()}

    <div className="admission-form">
      {currentStep === 1 && renderStep1()}
      {currentStep === 2 && renderStep2()}
      {currentStep === 3 && renderStep3()}
      {currentStep === 4 && renderStep4()}

      <div className="form-actions">
        {currentStep > 1 && (
          <button type="button" onClick={handlePrevious} className="btn btn-secondary">
            <X /> Previous
          </button>
        )}
        {currentStep < 4 ? (
          <button type="button" onClick={handleNext} className="btn btn-primary">
            Next →
          </button>
        ) : (
          <button type="button" onClick={handleSubmit} className="btn btn-success" disabled={loading}>
            {loading ? 'Submitting...' : <><Save /> Submit Application</>}
          </button>
        )}
      </div>
    </div>
  </div>
);
};

export default AdmissionForm;