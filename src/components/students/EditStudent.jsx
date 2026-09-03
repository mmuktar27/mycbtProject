import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft, Save, User, Phone, Mail, MapPin,
  GraduationCap, Users, School, AlertCircle, CheckCircle
} from 'lucide-react';

const EditStudent = () => {
  const { studentId } = useParams(); // undefined when adding new
  const navigate = useNavigate();
  const isEditing = Boolean(studentId);

  const emptyForm = {
    firstName: '', lastName: '', middleName: '',
    dateOfBirth: '', gender: '', religion: '', bloodGroup: '',
    email: '', phone: '', parentPhone: '', parentEmail: '',
    address: '', stateOfOrigin: '', lga: '', nationality: 'Nigerian',
    currentClass: '', admissionClass: '', section: '', rollNumber: '',
    academicYear: `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
    guardianName: '', guardianRelationship: '', guardianPhone: '',
    guardianEmail: '', guardianAddress: '', guardianOccupation: '',
    previousSchool: '', previousClass: '', admissionType: 'New',
    admissionDate: new Date().toISOString().split('T')[0],
    status: 'active'
  };

  const [form, setForm] = useState(emptyForm);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingStudent, setFetchingStudent] = useState(isEditing);
  const [activeTab, setActiveTab] = useState('personal');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchClasses();
    if (isEditing) fetchStudent();
  }, [studentId]);

  const fetchClasses = async () => {
    try {
      const res = await axios.get('/api/classes');
      if (res.data.success) setClasses(res.data.data);
    } catch (err) {
      console.error('Failed to load classes');
    }
  };

  const fetchStudent = async () => {
    try {
      setFetchingStudent(true);
      const res = await axios.get(`/api/students/${studentId}`);
      if (res.data.success) {
        const s = res.data.data;
        setForm({
          firstName: s.firstName || '',
          lastName: s.lastName || '',
          middleName: s.middleName || '',
          dateOfBirth: s.dateOfBirth?.split('T')[0] || '',
          gender: s.gender || '',
          religion: s.religion || '',
          bloodGroup: s.bloodGroup || '',
          email: s.email || '',
          phone: s.phone || '',
          parentPhone: s.parentPhone || '',
          parentEmail: s.parentEmail || '',
          address: s.address || '',
          stateOfOrigin: s.stateOfOrigin || '',
          lga: s.lga || '',
          nationality: s.nationality || 'Nigerian',
          currentClass: s.currentClass || '',
          admissionClass: s.admissionClass || '',
          section: s.section || '',
          rollNumber: s.rollNumber || '',
          academicYear: s.academicYear || '',
          guardianName: s.guardianName || '',
          guardianRelationship: s.guardianRelationship || '',
          guardianPhone: s.guardianPhone || '',
          guardianEmail: s.guardianEmail || '',
          guardianAddress: s.guardianAddress || '',
          guardianOccupation: s.guardianOccupation || '',
          previousSchool: s.previousSchool || '',
          previousClass: s.previousClass || '',
          admissionType: s.admissionType || 'New',
          admissionDate: s.admissionDate?.split('T')[0] || '',
          status: s.status || 'active'
        });
      }
    } catch (err) {
      showError('Failed to load student data');
    } finally {
      setFetchingStudent(false);
    }
  };

  const showSuccess = (msg) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 4000); };
  const showError = (msg) => { setErrorMsg(msg); setTimeout(() => setErrorMsg(''), 5000); };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    // Basic validation
    const required = ['firstName', 'lastName', 'dateOfBirth', 'gender',
      'parentPhone', 'address', 'stateOfOrigin', 'lga',
      'currentClass', 'guardianName', 'guardianRelationship', 'guardianPhone'];
    const missing = required.filter(f => !form[f]);
    if (missing.length > 0) {
      showError(`Please fill in: ${missing.join(', ')}`);
      return;
    }

    try {
      setLoading(true);
      if (isEditing) {
        const res = await axios.put(`/api/students/${studentId}`, form);
        if (res.data.success) {
          showSuccess('Student updated successfully!');
          setTimeout(() => navigate(`/students/profile/${studentId}`), 1500);
        }
      } else {
        const res = await axios.post('/api/students/manual', form);
        if (res.data.success) {
          showSuccess('Student added successfully!');
          setTimeout(() => navigate('/students/all'), 1500);
        }
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to save student');
    } finally {
      setLoading(false);
    }
  };

  // ── Shared input/select styles ──────────────────────────────────────
  const inputStyle = {
    width: '100%', padding: '10px 12px',
    border: '1px solid #d1d5db', borderRadius: '8px',
    fontSize: '0.9rem', backgroundColor: '#ffffff',
    boxSizing: 'border-box', outline: 'none',
    fontFamily: 'inherit', color: '#111827'
  };
  const labelStyle = {
    display: 'block', marginBottom: '6px',
    fontSize: '0.85rem', fontWeight: '600', color: '#374151'
  };
  const fieldStyle = { marginBottom: '16px' };
  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '16px'
  };
  const sectionStyle = {
    background: '#f9fafb', border: '1px solid #e5e7eb',
    borderRadius: '10px', padding: '20px', marginBottom: '20px'
  };
  const sectionTitleStyle = {
    display: 'flex', alignItems: 'center', gap: '8px',
    fontSize: '1rem', fontWeight: '700', color: '#111827',
    marginBottom: '16px', paddingBottom: '10px',
    borderBottom: '1px solid #e5e7eb'
  };

  const tabs = [
    { id: 'personal', label: 'Personal', icon: <User size={16} /> },
    { id: 'contact', label: 'Contact', icon: <Phone size={16} /> },
    { id: 'guardian', label: 'Guardian', icon: <Users size={16} /> },
    { id: 'academic', label: 'Academic', icon: <School size={16} /> },
  ];

  if (fetchingStudent) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', color: '#6b7280' }}>
        <div style={{ width: '36px', height: '36px', border: '3px solid #e5e7eb', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: '12px' }} />
        <p>Loading student data...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '900px' }}>

      {/* Alerts */}
      {successMsg && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: '#dcfce7', border: '1px solid #86efac', borderRadius: '8px', color: '#166534', marginBottom: '16px', fontWeight: '600' }}>
          <CheckCircle size={18} /> {successMsg}
        </div>
      )}
      {errorMsg && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px', color: '#991b1b', marginBottom: '16px', fontWeight: '600' }}>
          <AlertCircle size={18} /> {errorMsg}
        </div>
      )}

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => navigate(isEditing ? `/students/profile/${studentId}` : '/students/all')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', border: '1px solid #d1d5db', borderRadius: '8px', background: '#fff', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}
          >
            <ArrowLeft size={16} /> Back
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: '#111827' }}>
              {isEditing ? 'Edit Student' : 'Add New Student'}
            </h1>
            {isEditing && <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: '#6b7280' }}>Student ID: {studentId}</p>}
          </div>
        </div>
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: loading ? '#93c5fd' : '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '0.9rem', fontWeight: '600' }}
        >
          <Save size={18} /> {loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Student'}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: '#f3f4f6', padding: '4px', borderRadius: '10px', flexWrap: 'wrap' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1, minWidth: '100px',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              padding: '9px 16px', border: 'none', borderRadius: '8px', cursor: 'pointer',
              fontSize: '0.875rem', fontWeight: '600', transition: 'all 0.15s',
              background: activeTab === tab.id ? '#ffffff' : 'transparent',
              color: activeTab === tab.id ? '#2563eb' : '#6b7280',
              boxShadow: activeTab === tab.id ? '0 1px 4px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ── PERSONAL TAB ── */}
      {activeTab === 'personal' && (
        <div style={sectionStyle}>
          <h3 style={sectionTitleStyle}><User size={18} /> Personal Information</h3>
          <div style={gridStyle}>
            <div style={fieldStyle}>
              <label style={labelStyle}>First Name <span style={{ color: '#dc2626' }}>*</span></label>
              <input style={inputStyle} name="firstName" value={form.firstName} onChange={handleChange} placeholder="First name" />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Last Name <span style={{ color: '#dc2626' }}>*</span></label>
              <input style={inputStyle} name="lastName" value={form.lastName} onChange={handleChange} placeholder="Last name" />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Middle Name</label>
              <input style={inputStyle} name="middleName" value={form.middleName} onChange={handleChange} placeholder="Middle name (optional)" />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Date of Birth <span style={{ color: '#dc2626' }}>*</span></label>
              <input style={inputStyle} type="date" name="dateOfBirth" value={form.dateOfBirth} onChange={handleChange} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Gender <span style={{ color: '#dc2626' }}>*</span></label>
              <select style={inputStyle} name="gender" value={form.gender} onChange={handleChange}>
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Religion</label>
              <select style={inputStyle} name="religion" value={form.religion} onChange={handleChange}>
                <option value="">Select religion</option>
                <option value="Islam">Islam</option>
                <option value="Christianity">Christianity</option>
                <option value="Traditional">Traditional</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Blood Group</label>
              <select style={inputStyle} name="bloodGroup" value={form.bloodGroup} onChange={handleChange}>
                <option value="">Select blood group</option>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Nationality</label>
              <input style={inputStyle} name="nationality" value={form.nationality} onChange={handleChange} placeholder="Nigerian" />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>State of Origin <span style={{ color: '#dc2626' }}>*</span></label>
              <input style={inputStyle} name="stateOfOrigin" value={form.stateOfOrigin} onChange={handleChange} placeholder="e.g. Taraba" />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>LGA <span style={{ color: '#dc2626' }}>*</span></label>
              <input style={inputStyle} name="lga" value={form.lga} onChange={handleChange} placeholder="Local Government Area" />
            </div>
            <div style={{ ...fieldStyle, gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Home Address <span style={{ color: '#dc2626' }}>*</span></label>
              <textarea style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} name="address" value={form.address} onChange={handleChange} placeholder="Full home address" />
            </div>
            {isEditing && (
              <div style={fieldStyle}>
                <label style={labelStyle}>Status</label>
                <select style={inputStyle} name="status" value={form.status} onChange={handleChange}>
                  <option value="active">Active</option>
                  <option value="graduated">Graduated</option>
                  <option value="transferred">Transferred</option>
                  <option value="withdrawn">Withdrawn</option>
                  <option value="expelled">Expelled</option>
                </select>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── CONTACT TAB ── */}
      {activeTab === 'contact' && (
        <div style={sectionStyle}>
          <h3 style={sectionTitleStyle}><Phone size={18} /> Contact Information</h3>
          <div style={gridStyle}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Student Phone</label>
              <input style={inputStyle} type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="Student phone number" />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Student Email</label>
              <input style={inputStyle} type="email" name="email" value={form.email} onChange={handleChange} placeholder="Student email" />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Parent Phone <span style={{ color: '#dc2626' }}>*</span></label>
              <input style={inputStyle} type="tel" name="parentPhone" value={form.parentPhone} onChange={handleChange} placeholder="Parent/guardian phone" />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Parent Email</label>
              <input style={inputStyle} type="email" name="parentEmail" value={form.parentEmail} onChange={handleChange} placeholder="Parent/guardian email" />
            </div>
          </div>
        </div>
      )}

      {/* ── GUARDIAN TAB ── */}
      {activeTab === 'guardian' && (
        <div style={sectionStyle}>
          <h3 style={sectionTitleStyle}><Users size={18} /> Guardian Information</h3>
          <div style={gridStyle}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Guardian Name <span style={{ color: '#dc2626' }}>*</span></label>
              <input style={inputStyle} name="guardianName" value={form.guardianName} onChange={handleChange} placeholder="Full name" />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Relationship <span style={{ color: '#dc2626' }}>*</span></label>
              <select style={inputStyle} name="guardianRelationship" value={form.guardianRelationship} onChange={handleChange}>
                <option value="">Select relationship</option>
                <option value="Father">Father</option>
                <option value="Mother">Mother</option>
                <option value="Uncle">Uncle</option>
                <option value="Aunt">Aunt</option>
                <option value="Brother">Brother</option>
                <option value="Sister">Sister</option>
                <option value="Grandparent">Grandparent</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Guardian Phone <span style={{ color: '#dc2626' }}>*</span></label>
              <input style={inputStyle} type="tel" name="guardianPhone" value={form.guardianPhone} onChange={handleChange} placeholder="Phone number" />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Guardian Email</label>
              <input style={inputStyle} type="email" name="guardianEmail" value={form.guardianEmail} onChange={handleChange} placeholder="Email (optional)" />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Occupation</label>
              <input style={inputStyle} name="guardianOccupation" value={form.guardianOccupation} onChange={handleChange} placeholder="e.g. Farmer, Teacher" />
            </div>
            <div style={{ ...fieldStyle, gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Guardian Address</label>
              <textarea style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} name="guardianAddress" value={form.guardianAddress} onChange={handleChange} placeholder="Leave blank if same as student" />
            </div>
          </div>
        </div>
      )}


    {/* ── ACADEMIC TAB ── */}
{activeTab === 'academic' && (
  <div style={sectionStyle}>
    <h3 style={sectionTitleStyle}><School size={18} /> Academic Information</h3>

    {/* Read-only info strip */}
    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px', padding: '12px 16px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px' }}>
      <span style={{ fontSize: '0.8rem', color: '#1e40af' }}>
        <strong>Admission No:</strong> {form.admissionNumber || '—'}
      </span>
      <span style={{ fontSize: '0.8rem', color: '#1e40af' }}>
        <strong>Admission Class:</strong> {form.admissionClass || '—'}
      </span>
      <span style={{ fontSize: '0.8rem', color: '#1e40af' }}>
        <strong>Academic Year:</strong> {form.academicYear || '—'}
      </span>
      <span style={{ fontSize: '0.8rem', color: '#1e40af' }}>
        <strong>Admission Date:</strong> {form.admissionDate || '—'}
      </span>
      <span style={{ fontSize: '0.8rem', color: '#1e40af' }}>
        <strong>Admission Type:</strong> {form.admissionType || '—'}
      </span>
    </div>

    <div style={gridStyle}>
      <div style={fieldStyle}>
        <label style={labelStyle}>Current Class <span style={{ color: '#dc2626' }}>*</span></label>
        <select style={inputStyle} name="currentClass" value={form.currentClass} onChange={handleChange}>
          <option value="">Select class</option>
          {classes.map(cls => (
            <option key={cls.id} value={cls.className}>{cls.className}</option>
          ))}
        </select>
      </div>
      <div style={fieldStyle}>
        <label style={labelStyle}>Section</label>
        <select style={inputStyle} name="section" value={form.section} onChange={handleChange}>
          <option value="">Select section</option>
          {['A', 'B', 'C', 'D', 'E'].map(s => (
            <option key={s} value={s}>Section {s}</option>
          ))}
        </select>
      </div>
      <div style={fieldStyle}>
        <label style={labelStyle}>Roll Number</label>
        <input style={inputStyle} name="rollNumber" value={form.rollNumber} onChange={handleChange} placeholder="Roll/seat number" />
      </div>
    </div>
  </div>
)}

      {/* Bottom Save Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
        <button
          onClick={() => navigate(isEditing ? `/students/profile/${studentId}` : '/students/all')}
          style={{ padding: '10px 20px', border: '1px solid #d1d5db', borderRadius: '8px', background: '#fff', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600', color: '#374151' }}
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: loading ? '#93c5fd' : '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '0.9rem', fontWeight: '600' }}
        >
          <Save size={18} /> {loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Student'}
        </button>
      </div>

    </div>
  );
};

export default EditStudent;