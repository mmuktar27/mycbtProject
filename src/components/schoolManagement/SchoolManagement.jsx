import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Settings,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  School,
  Users,
  BookOpen,
  Clock,
  MapPin,
  Phone,
  Mail,
  Globe,
  ChevronDown,
  Check,
  AlertCircle,
  RefreshCw,Calendar
} from 'lucide-react';
import './SchoolManagement.css';
 import AcademicCalendar from './AcademicCalendar';
const SchoolManagement = () => {
  const [activeTab, setActiveTab] = useState('settings'); // settings, classes, departments
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // School Settings State
  const [schoolSettings, setSchoolSettings] = useState({
    schoolName: 'My School',
    motto: 'Excellence in Education',
    poBox: 'P.O. BOX 111 GEMBU,',
    address: '',
    city: '',
    state: '',
    country: 'Nigeria',
    location: '',
    phone: '',
    phoneNumber: '',
    email: '',
    website: '',
    principalName: '',
    principalEmail: '',
    registrarName: '',
    admissionOfficer: '',
    foundedYear: new Date().getFullYear(),
    registrationNumber: '',
    accreditationStatus: 'Accredited',
    academicYear: `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
    sessionStartDate: '',
    sessionEndDate: '',
    termDuration: 13,
    gradesSystem: 'A-F',
    passingScore: 40,
    attendanceThreshold: 75,
    maxStudentsPerClass: 50,
    schoolDays: 'Monday to Friday',
    schoolLogo: '',
    schoolBanner: ''
  });

  const [originalSettings, setOriginalSettings] = useState({});
  const [editingSettings, setEditingSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState('basic'); // basic, contact, academic, branding
  const [logoPreview, setLogoPreview] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);

  // Classes State
  const [classes, setClasses] = useState([]);
  const [newClass, setNewClass] = useState({
    className: '',
    classCategory: 'Junior', // Junior, Senior
    capacity: 40,
    classTeacher: '',
    section: 'A'
  });
  const [editingClassId, setEditingClassId] = useState(null);
  const [showClassForm, setShowClassForm] = useState(false);
// Subjects State
const [subjects, setSubjects] = useState([]);
const [newSubject, setNewSubject] = useState({
    subjectName: '',
    subjectCode: '',
    description: '',
    classCategory: 'All',      // All, Junior, Senior
    subjectType: 'Core',       // Core, Elective, Vocational
    department: '',
    isActive: 1
});
const [editingSubjectId, setEditingSubjectId] = useState(null);
const [showSubjectForm, setShowSubjectForm] = useState(false);
  // Departments State
  const [departments, setDepartments] = useState([]);
  const [newDepartment, setNewDepartment] = useState({
    departmentName: '',
    departmentHead: '',
    description: ''
  });
  const [editingDeptId, setEditingDeptId] = useState(null);
  const [showDeptForm, setShowDeptForm] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [settingsRes, classesRes, deptsRes,subjectsRes] = await Promise.all([
        axios.get('/api/school-settings'),
        axios.get('/api/classes'),
        axios.get('/api/departments'),
        axios.get('/api/school/subjects') 
      ]);

      if (settingsRes.data.success && settingsRes.data.data) {
        const settings = settingsRes.data.data;
        setSchoolSettings(settings);
        setOriginalSettings(settings);
        if (settings.schoolLogo) setLogoPreview(settings.schoolLogo);
        if (settings.schoolBanner) setBannerPreview(settings.schoolBanner);
      }

      if (classesRes.data.success) setClasses(classesRes.data.data);
      if (deptsRes.data.success) setDepartments(deptsRes.data.data);
      if (subjectsRes.data.success) setSubjects(subjectsRes.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      showError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const showError = (message) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(''), 3000);
  };

  // ==================== SCHOOL SETTINGS ====================

  const handleSettingsChange = (e) => {
    const { name, value } = e.target;
    setSchoolSettings({ ...schoolSettings, [name]: value });
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showError('Logo size should not exceed 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setSchoolSettings({
          ...schoolSettings,
          schoolLogo: reader.result
        });
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        showError('Banner size should not exceed 10MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setSchoolSettings({
          ...schoolSettings,
          schoolBanner: reader.result
        });
        setBannerPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveSchoolSettings = async () => {
    try {
      setLoading(true);
      
      const response = await axios.put('/api/school-settings', schoolSettings);
      
      if (response.data.success) {
        setOriginalSettings(response.data.data);
        setSchoolSettings(response.data.data);
        showSuccess('School settings saved successfully!');
        setEditingSettings(false);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      showError(error.response?.data?.message || 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const cancelEditingSettings = () => {
    setSchoolSettings(originalSettings);
    setEditingSettings(false);
    setSettingsTab('basic');
  };


  // ==================== SUBJECTS MANAGEMENT ====================

const handleSubjectChange = (e) => {
    const { name, value } = e.target;
    setNewSubject({ ...newSubject, [name]: value });
};

const saveSubject = async () => {
    if (!newSubject.subjectName || !newSubject.subjectCode) {
        showError('Subject name and code are required');
        return;
    }
    try {
        setLoading(true);
        if (editingSubjectId) {
            await axios.put(`/api/school/subjects/${editingSubjectId}`, newSubject);
            setSubjects(subjects.map(s =>
                s.id === editingSubjectId ? { ...newSubject, id: editingSubjectId } : s
            ));
            showSuccess('Subject updated successfully!');
        } else {
            const response = await axios.post('/api/school/subjects', newSubject);
            if (response.data.success) {
                await fetchAllData();
                showSuccess('Subject created successfully!');
            }
        }
        setNewSubject({ subjectName: '', subjectCode: '', description: '', classCategory: 'All', subjectType: 'Core', department: '', isActive: 1 });
        setShowSubjectForm(false);
        setEditingSubjectId(null);
    } catch (error) {
        showError(error.response?.data?.message || 'Failed to save subject');
    } finally {
        setLoading(false);
    }
};

const editSubject = (subjectData) => {
    setNewSubject(subjectData);
    setEditingSubjectId(subjectData.id);
    setShowSubjectForm(true);
};

const deleteSubject = async (subjectId) => {
    if (!window.confirm('Deactivate this subject?')) return;
    try {
        setLoading(true);
        await axios.delete(`/api/school/subjects/${subjectId}`);
        await fetchAllData();
        showSuccess('Subject deactivated!');
    } catch (error) {
        showError(error.response?.data?.message || 'Failed to delete subject');
    } finally {
        setLoading(false);
    }
};

const cancelSubjectForm = () => {
    setShowSubjectForm(false);
    setNewSubject({ subjectName: '', subjectCode: '', description: '', classCategory: 'All', subjectType: 'Core', department: '', isActive: 1 });
    setEditingSubjectId(null);
};
  const refreshSettings = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/school-settings');
      
      if (response.data.success && response.data.data) {
        setSchoolSettings(response.data.data);
        setOriginalSettings(response.data.data);
        showSuccess('Settings refreshed successfully!');
      }
    } catch (error) {
      console.error('Error refreshing settings:', error);
      showError('Failed to refresh settings');
    } finally {
      setLoading(false);
    }
  };

  // ==================== CLASSES MANAGEMENT ====================

  const handleClassChange = (e) => {
    const { name, value } = e.target;
    setNewClass({ ...newClass, [name]: value });
  };

  const saveClass = async () => {
    try {
      if (!newClass.className || !newClass.classCategory) {
        showError('Please fill in all required fields');
        return;
      }

      setLoading(true);

      if (editingClassId) {
        await axios.put(`/api/classes/${editingClassId}`, newClass);
        setClasses(classes.map(c => c.id === editingClassId ? { ...newClass, id: editingClassId } : c));
        showSuccess('Class updated successfully!');
      } else {
        const response = await axios.post('/api/classes', newClass);
        if (response.data.success) {
          setClasses([...classes, { ...newClass, id: response.data.data.id }]);
          showSuccess('Class created successfully!');
        }
      }

      setNewClass({ className: '', classCategory: 'Junior', capacity: 40, classTeacher: '', section: 'A' });
      setShowClassForm(false);
      setEditingClassId(null);
      fetchAllData();
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to save class');
    } finally {
      setLoading(false);
    }
  };

  const editClass = (classData) => {
    setNewClass(classData);
    setEditingClassId(classData.id);
    setShowClassForm(true);
  };

  const deleteClass = async (classId) => {
    if (!window.confirm('Are you sure you want to delete this class?')) return;

    try {
      setLoading(true);
      await axios.delete(`/api/classes/${classId}`);
      setClasses(classes.filter(c => c.id !== classId));
      showSuccess('Class deleted successfully!');
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to delete class');
    } finally {
      setLoading(false);
    }
  };

  const cancelClassForm = () => {
    setShowClassForm(false);
    setNewClass({ className: '', classCategory: 'Junior', capacity: 40, classTeacher: '', section: 'A' });
    setEditingClassId(null);
  };

  // ==================== DEPARTMENTS MANAGEMENT ====================

  const handleDeptChange = (e) => {
    const { name, value } = e.target;
    setNewDepartment({ ...newDepartment, [name]: value });
  };

  const saveDepartment = async () => {
    try {
      if (!newDepartment.departmentName) {
        showError('Department name is required');
        return;
      }

      setLoading(true);

      if (editingDeptId) {
        await axios.put(`/api/departments/${editingDeptId}`, newDepartment);
        setDepartments(departments.map(d => d.id === editingDeptId ? { ...newDepartment, id: editingDeptId } : d));
        showSuccess('Department updated successfully!');
      } else {
        const response = await axios.post('/api/departments', newDepartment);
        if (response.data.success) {
          setDepartments([...departments, { ...newDepartment, id: response.data.data.id }]);
          showSuccess('Department created successfully!');
        }
      }

      setNewDepartment({ departmentName: '', departmentHead: '', description: '' });
      setShowDeptForm(false);
      setEditingDeptId(null);
      fetchAllData();
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to save department');
    } finally {
      setLoading(false);
    }
  };

  const editDept = (deptData) => {
    setNewDepartment(deptData);
    setEditingDeptId(deptData.id);
    setShowDeptForm(true);
  };

  const deleteDept = async (deptId) => {
    if (!window.confirm('Are you sure you want to delete this department?')) return;

    try {
      setLoading(true);
      await axios.delete(`/api/departments/${deptId}`);
      setDepartments(departments.filter(d => d.id !== deptId));
      showSuccess('Department deleted successfully!');
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to delete department');
    } finally {
      setLoading(false);
    }
  };

  const cancelDeptForm = () => {
    setShowDeptForm(false);
    setNewDepartment({ departmentName: '', departmentHead: '', description: '' });
    setEditingDeptId(null);
  };

  // ==================== RENDER METHODS ====================

  const renderBasicInfoTab = () => (
    <div className="form-section">
      <h3>Basic Information</h3>
      
      <div className="form-group">
        <label>School Name <span className="required">*</span></label>
        <input
          type="text"
          name="schoolName"
          value={schoolSettings.schoolName}
          onChange={handleSettingsChange}
          placeholder="Enter school name"
        />
      </div>

      <div className="form-group">
        <label>School Motto</label>
        <input
          type="text"
          name="motto"
          value={schoolSettings.motto || ''}
          onChange={handleSettingsChange}
          placeholder="Enter school motto"
        />
      </div>

      <div className="form-group">
        <label>P.O. Box</label>
        <input
          type="text"
          name="poBox"
          value={schoolSettings.poBox || ''}
          onChange={handleSettingsChange}
          placeholder="P.O. BOX 111 GEMBU,"
        />
      </div>

      <div className="form-group">
        <label>Registration Number</label>
        <input
          type="text"
          name="registrationNumber"
          value={schoolSettings.registrationNumber || ''}
          onChange={handleSettingsChange}
          placeholder="Enter registration number"
        />
      </div>

      <div className="form-group">
        <label>Founded Year</label>
        <input
          type="number"
          name="foundedYear"
          value={schoolSettings.foundedYear || ''}
          onChange={handleSettingsChange}
          min="1900"
        />
      </div>

      <div className="form-group">
        <label>Accreditation Status</label>
        <select
          name="accreditationStatus"
          value={schoolSettings.accreditationStatus || 'Accredited'}
          onChange={handleSettingsChange}
        >
          <option value="Accredited">Accredited</option>
          <option value="Pending">Pending</option>
          <option value="Not Accredited">Not Accredited</option>
        </select>
      </div>
    </div>
  );

  const renderContactTab = () => (
    <div className="form-section">
      <h3><Phone /> Contact Information</h3>
      
      <div className="form-group">
        <label><MapPin /> Address</label>
        <input
          type="text"
          name="address"
          value={schoolSettings.address || ''}
          onChange={handleSettingsChange}
          placeholder="Street address"
        />
      </div>

      <div className="form-group">
        <label>City</label>
        <input
          type="text"
          name="city"
          value={schoolSettings.city || ''}
          onChange={handleSettingsChange}
          placeholder="City"
        />
      </div>

      <div className="form-group">
        <label>State</label>
        <input
          type="text"
          name="state"
          value={schoolSettings.state || ''}
          onChange={handleSettingsChange}
          placeholder="State/Province"
        />
      </div>

      <div className="form-group">
        <label>Country</label>
        <input
          type="text"
          name="country"
          value={schoolSettings.country || 'Nigeria'}
          onChange={handleSettingsChange}
        />
      </div>

      <div className="form-group">
        <label>Full Location (for letterhead)</label>
        <input
          type="text"
          name="location"
          value={schoolSettings.location || ''}
          onChange={handleSettingsChange}
          placeholder="Sardauna Local Government Area, Taraba State"
        />
      </div>

      <div className="form-group">
        <label><Phone /> Phone</label>
        <input
          type="tel"
          name="phone"
          value={schoolSettings.phone || ''}
          onChange={handleSettingsChange}
          placeholder="School phone number"
        />
      </div>

      <div className="form-group">
        <label><Phone /> Phone Number (Alternative)</label>
        <input
          type="tel"
          name="phoneNumber"
          value={schoolSettings.phoneNumber || ''}
          onChange={handleSettingsChange}
          placeholder="+234 XXX XXX XXXX"
        />
      </div>

      <div className="form-group">
        <label><Mail /> Email</label>
        <input
          type="email"
          name="email"
          value={schoolSettings.email || ''}
          onChange={handleSettingsChange}
          placeholder="School email"
        />
      </div>

      <div className="form-group">
        <label><Globe /> Website</label>
        <input
          type="url"
          name="website"
          value={schoolSettings.website || ''}
          onChange={handleSettingsChange}
          placeholder="https://example.com"
        />
      </div>
    </div>
  );
const renderSubjects = () => {
    const juniorSubjects = subjects.filter(s => s.classCategory === 'Junior' || s.classCategory === 'All');
    const seniorSubjects = subjects.filter(s => s.classCategory === 'Senior' || s.classCategory === 'All');

    const typeColors = {
        Core:       { background: '#e0f2fe', color: '#0369a1' },
        Elective:   { background: '#fef3c7', color: '#d97706' },
        Vocational: { background: '#f0fdf4', color: '#16a34a' },
        Practical:  { background: '#fdf4ff', color: '#9333ea' }
    };

    return (
        <div className="departments-container">
            <div className="departments-header">
                <h2><BookOpen size={22} /> Subject Management</h2>
                {!showSubjectForm && (
                    <button className="btn btn-primary" onClick={() => setShowSubjectForm(true)}>
                        <Plus size={18} /> Add Subject
                    </button>
                )}
            </div>

            {showSubjectForm && (
                <div className="dept-form-container">
                    <h3>{editingSubjectId ? 'Edit Subject' : 'Add New Subject'}</h3>
                    <div className="dept-form">
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Subject Name <span className="required">*</span></label>
                                <input
                                    type="text"
                                    name="subjectName"
                                    value={newSubject.subjectName}
                                    onChange={handleSubjectChange}
                                    placeholder="e.g., Mathematics"
                                />
                            </div>

                            <div className="form-group">
                                <label>Subject Code <span className="required">*</span></label>
                                <input
                                    type="text"
                                    name="subjectCode"
                                    value={newSubject.subjectCode}
                                    onChange={handleSubjectChange}
                                    placeholder="e.g., MATH, ENG, PHY"
                                    style={{ textTransform: 'uppercase' }}
                                    onBlur={e => setNewSubject(p => ({ ...p, subjectCode: e.target.value.toUpperCase() }))}
                                />
                            </div>

                            <div className="form-group">
                                <label>Class Level</label>
                                <select name="classCategory" value={newSubject.classCategory} onChange={handleSubjectChange}>
                                    <option value="All">All Classes (JSS &amp; SS)</option>
                                    <option value="Junior">Junior Secondary (JSS) Only</option>
                                    <option value="Senior">Senior Secondary (SS) Only</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Subject Type</label>
                                <select name="subjectType" value={newSubject.subjectType} onChange={handleSubjectChange}>
                                    <option value="Core">Core / Compulsory</option>
                                    <option value="Elective">Elective</option>
                                    <option value="Vocational">Vocational / Technical</option>
                                    <option value="Practical">Practical / Lab</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Department</label>
                                <select name="department" value={newSubject.department} onChange={handleSubjectChange}>
                                    <option value="">-- No Department --</option>
                                    {departments.map(d => (
                                        <option key={d.id} value={d.departmentName}>{d.departmentName}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group full-width">
                                <label>Description</label>
                                <textarea
                                    name="description"
                                    value={newSubject.description}
                                    onChange={handleSubjectChange}
                                    placeholder="Brief description of this subject..."
                                    rows="2"
                                />
                            </div>
                        </div>

                        <div className="form-actions">
                            <button className="btn btn-success" onClick={saveSubject} disabled={loading}>
                                <Save /> {editingSubjectId ? 'Update Subject' : 'Add Subject'}
                            </button>
                            <button className="btn btn-secondary" onClick={cancelSubjectForm}>
                                <X /> Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Summary strip */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
                {[
                    { label: 'Total Subjects', value: subjects.length, color: '#6366f1' },
                    { label: 'JSS Subjects', value: juniorSubjects.length, color: '#0ea5e9' },
                    { label: 'SS Subjects', value: seniorSubjects.length, color: '#f59e0b' },
                    { label: 'Core', value: subjects.filter(s => s.subjectType === 'Core').length, color: '#16a34a' },
                    { label: 'Elective', value: subjects.filter(s => s.subjectType === 'Elective').length, color: '#d97706' },
                ].map(stat => (
                    <div key={stat.label} style={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: '10px', padding: '12px 20px', minWidth: '110px', borderTop: `3px solid ${stat.color}` }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: stat.color }}>{stat.value}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Table */}
            {subjects.length === 0 ? (
                <div className="empty-state">
                    <BookOpen size={48} />
                    <p>No subjects added yet. Click "Add Subject" to get started.</p>
                </div>
            ) : (
                <div className="table-responsive">
                    <table className="classes-table">
                        <thead>
                            <tr>
                                <th>Subject Name</th>
                                <th>Code</th>
                                <th>Class Level</th>
                                <th>Type</th>
                                <th>Department</th>
                                <th>Description</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {subjects.map(sub => (
                                <tr key={sub.id}>
                                    <td><strong>{sub.subjectName}</strong></td>
                                    <td>
                                        <span style={{ fontFamily: 'monospace', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', fontSize: '0.82rem' }}>
                                            {sub.subjectCode}
                                        </span>
                                    </td>
                                    <td>{sub.classCategory}</td>
                                    <td>
                                        <span style={{
                                            ...typeColors[sub.subjectType],
                                            padding: '3px 10px', borderRadius: '20px',
                                            fontSize: '0.75rem', fontWeight: 700
                                        }}>
                                            {sub.subjectType || 'Core'}
                                        </span>
                                    </td>
                                    <td>{sub.department || '-'}</td>
                                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {sub.description || '-'}
                                    </td>
                                    <td className="actions">
                                        <button className="btn-icon edit" onClick={() => editSubject(sub)} title="Edit"><Edit2 size={16} /></button>
                                        <button className="btn-icon delete" onClick={() => deleteSubject(sub.id)} title="Deactivate"><Trash2 size={16} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
  const renderAcademicTab = () => (
    <>
      <div className="form-section">
        <h3><Clock /> Academic Year & Sessions</h3>
        
        <div className="form-group">
          <label>Academic Year</label>
          <input
            type="text"
            name="academicYear"
            value={schoolSettings.academicYear || ''}
            onChange={handleSettingsChange}
            placeholder="2024/2025"
          />
        </div>

        <div className="form-group">
          <label>Session Start Date</label>
          <input
            type="date"
            name="sessionStartDate"
            value={schoolSettings.sessionStartDate || ''}
            onChange={handleSettingsChange}
          />
        </div>

        <div className="form-group">
          <label>Session End Date</label>
          <input
            type="date"
            name="sessionEndDate"
            value={schoolSettings.sessionEndDate || ''}
            onChange={handleSettingsChange}
          />
        </div>

        <div className="form-group">
          <label>Term Duration (weeks)</label>
          <input
            type="number"
            name="termDuration"
            value={schoolSettings.termDuration || 13}
            onChange={handleSettingsChange}
            min="1"
            max="20"
          />
        </div>
      </div>

      <div className="form-section">
        <h3><BookOpen /> Academic Settings</h3>
        
        <div className="form-group">
          <label>Grading System</label>
          <select
            name="gradesSystem"
            value={schoolSettings.gradesSystem || 'A-F'}
            onChange={handleSettingsChange}
          >
            <option value="A-F">Letter Grades (A-F)</option>
            <option value="1-100">Numerical (1-100)</option>
          </select>
        </div>

        <div className="form-group">
          <label>Passing Score (%)</label>
          <input
            type="number"
            name="passingScore"
            value={schoolSettings.passingScore || 40}
            onChange={handleSettingsChange}
            min="0"
            max="100"
          />
        </div>

        <div className="form-group">
          <label>Attendance Threshold (%)</label>
          <input
            type="number"
            name="attendanceThreshold"
            value={schoolSettings.attendanceThreshold || 75}
            onChange={handleSettingsChange}
            min="0"
            max="100"
          />
        </div>

        <div className="form-group">
          <label>Max Students Per Class</label>
          <input
            type="number"
            name="maxStudentsPerClass"
            value={schoolSettings.maxStudentsPerClass || 50}
            onChange={handleSettingsChange}
            min="1"
          />
        </div>

        <div className="form-group">
          <label>School Days</label>
          <input
            type="text"
            name="schoolDays"
            value={schoolSettings.schoolDays || 'Monday to Friday'}
            onChange={handleSettingsChange}
            placeholder="Monday to Friday"
          />
        </div>
      </div>
    </>
  );

  const renderBrandingTab = () => (
    <div className="form-section">
      <h3>🎨 Branding</h3>
      
      <div className="branding-upload-container">
        {/* School Logo */}
        <div className="branding-item">
          <div className="logo-preview">
            {logoPreview ? (
              <img src={logoPreview} alt="School Logo" />
            ) : (
              <div className="logo-placeholder">
                <School size={40} />
                <p>No Logo</p>
              </div>
            )}
          </div>
          <div>
            <label>School Logo</label>
            <label htmlFor="schoolLogo" className="btn btn-secondary btn-small">
              Upload Logo
            </label>
            <input
              type="file"
              id="schoolLogo"
              accept="image/*"
              onChange={handleLogoChange}
              style={{ display: 'none' }}
            />
            <p className="help-text-small">Max: 5MB (PNG, JPG recommended)</p>
          </div>
        </div>

        {/* School Banner */}
        <div className="branding-item">
          <div className="banner-preview">
            {bannerPreview ? (
              <img src={bannerPreview} alt="School Banner" />
            ) : (
              <div className="banner-placeholder">
                <School size={40} />
                <p>No Banner</p>
              </div>
            )}
          </div>
          <div>
            <label>School Banner</label>
            <label htmlFor="schoolBanner" className="btn btn-secondary btn-small">
              Upload Banner
            </label>
            <input
              type="file"
              id="schoolBanner"
              accept="image/*"
              onChange={handleBannerChange}
              style={{ display: 'none' }}
            />
            <p className="help-text-small">Max: 10MB (Wide format recommended)</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSchoolSettings = () => (
    <div className="settings-container">
      <div className="settings-header">
        <h2><School /> School Information</h2>
        <div className="header-actions">
          {!editingSettings && (
            <>
              <button 
                className="btn btn-secondary"
                onClick={refreshSettings}
                disabled={loading}
              >
                <RefreshCw size={18} /> Refresh
              </button>
              <button 
                className="btn btn-primary"
                onClick={() => setEditingSettings(true)}
              >
                <Edit2 size={18} /> Edit Settings
              </button>
            </>
          )}
        </div>
      </div>

      {editingSettings ? (
        <div className="settings-form">
          {/* Settings Tabs */}
          <div className="settings-tabs">
            <button 
              className={`settings-tab ${settingsTab === 'basic' ? 'active' : ''}`}
              onClick={() => setSettingsTab('basic')}
            >
              Basic Info
            </button>
            <button 
              className={`settings-tab ${settingsTab === 'contact' ? 'active' : ''}`}
              onClick={() => setSettingsTab('contact')}
            >
              Contact
            </button>
            <button 
              className={`settings-tab ${settingsTab === 'academic' ? 'active' : ''}`}
              onClick={() => setSettingsTab('academic')}
            >
              Academic
            </button>
            <button 
              className={`settings-tab ${settingsTab === 'branding' ? 'active' : ''}`}
              onClick={() => setSettingsTab('branding')}
            >
              🎨 Branding
            </button>
          </div>

          {/* Tab Content */}
          <div className="settings-tab-content">
            {settingsTab === 'basic' && renderBasicInfoTab()}
            {settingsTab === 'contact' && renderContactTab()}
            {settingsTab === 'academic' && renderAcademicTab()}
            {settingsTab === 'branding' && renderBrandingTab()}
          </div>

          <div className="form-actions">
            <button 
              className="btn btn-success" 
              onClick={saveSchoolSettings}
              disabled={loading}
            >
              {loading ? 'Saving...' : <><Save /> Save Settings</>}
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={cancelEditingSettings}
              disabled={loading}
            >
              <X /> Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="settings-display">
          <div className="info-grid">
            <div className="info-item">
              <label>School Name</label>
              <p>{schoolSettings.schoolName}</p>
            </div>
            <div className="info-item">
              <label>Motto</label>
              <p>{schoolSettings.motto || 'Not set'}</p>
            </div>
            <div className="info-item">
              <label>P.O. Box</label>
              <p>{schoolSettings.poBox || 'Not set'}</p>
            </div>
            <div className="info-item">
              <label>Address</label>
              <p>{schoolSettings.address && schoolSettings.city ? `${schoolSettings.address}, ${schoolSettings.city}, ${schoolSettings.state}` : schoolSettings.location || 'Not set'}</p>
            </div>
            <div className="info-item">
              <label>Phone</label>
              <p>{schoolSettings.phone || schoolSettings.phoneNumber || 'Not set'}</p>
            </div>
            <div className="info-item">
              <label>Email</label>
              <p>{schoolSettings.email || 'Not set'}</p>
            </div>
            <div className="info-item">
              <label>Website</label>
              <p>{schoolSettings.website || 'Not set'}</p>
            </div>
            <div className="info-item">
              <label>Academic Year</label>
              <p>{schoolSettings.academicYear}</p>
            </div>
            <div className="info-item">
              <label>Founded Year</label>
              <p>{schoolSettings.foundedYear || 'Not set'}</p>
            </div>
            <div className="info-item">
              <label>Accreditation</label>
              <p><span className={`badge badge-${schoolSettings.accreditationStatus?.toLowerCase()}`}>{schoolSettings.accreditationStatus}</span></p>
            </div>
            <div className="info-item">
              <label>Grading System</label>
              <p>{schoolSettings.gradesSystem}</p>
            </div>
            <div className="info-item">
              <label>Passing Score</label>
              <p>{schoolSettings.passingScore}%</p>
            </div>
            <div className="info-item">
              <label>Max Students/Class</label>
              <p>{schoolSettings.maxStudentsPerClass}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderClasses = () => (
    <div className="classes-container">
      <div className="classes-header">
        <h2><BookOpen /> Class Management</h2>
        {!showClassForm && (
          <button 
            className="btn btn-primary"
            onClick={() => setShowClassForm(true)}
          >
            <Plus size={18} /> Add New Class
          </button>
        )}
      </div>

      {showClassForm && (
        <div className="class-form-container">
          <h3>{editingClassId ? 'Edit Class' : 'Create New Class'}</h3>
          <div className="class-form">
            <div className="form-grid">
              <div className="form-group">
                <label>Class Name <span className="required">*</span></label>
                <input
                  type="text"
                  name="className"
                  value={newClass.className}
                  onChange={handleClassChange}
                  placeholder="e.g., JSS 1, SS 2"
                />
              </div>

              <div className="form-group">
                <label>Category <span className="required">*</span></label>
                <select
                  name="classCategory"
                  value={newClass.classCategory}
                  onChange={handleClassChange}
                >
                  <option value="Junior">Junior Secondary</option>
                  <option value="Senior">Senior Secondary</option>
                  <option value="Primary">Primary</option>
                </select>
              </div>

              <div className="form-group">
                <label>Capacity</label>
                <input
                  type="number"
                  name="capacity"
                  value={newClass.capacity}
                  onChange={handleClassChange}
                  min="1"
                  max="100"
                />
              </div>

              <div className="form-group">
                <label>Class Section</label>
                <select
                  name="section"
                  value={newClass.section}
                  onChange={handleClassChange}
                >
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                  <option value="C">Section C</option>
                  <option value="D">Section D</option>
                  <option value="E">Section E</option>
                </select>
              </div>

              <div className="form-group full-width">
                <label>Class Teacher</label>
                <input
                  type="text"
                  name="classTeacher"
                  value={newClass.classTeacher}
                  onChange={handleClassChange}
                  placeholder="Assign class teacher (optional)"
                />
              </div>
            </div>

            <div className="form-actions">
              <button 
                className="btn btn-success" 
                onClick={saveClass}
                disabled={loading}
              >
                <Save /> {editingClassId ? 'Update Class' : 'Create Class'}
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={cancelClassForm}
              >
                <X /> Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="classes-list">
        {classes.length === 0 ? (
          <div className="empty-state">
            <BookOpen size={48} />
            <p>No classes created yet. Click "Add New Class" to get started.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="classes-table">
              <thead>
                <tr>
                  <th>Class Name</th>
                  <th>Category</th>
                  <th>Section</th>
                  <th>Capacity</th>
                  <th>Current Students</th>
                  <th>Class Teacher</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {classes.map(cls => (
                  <tr key={cls.id}>
                    <td><strong>{cls.className}</strong></td>
                    <td>{cls.classCategory}</td>
                    <td>{cls.section || '-'}</td>
                    <td>{cls.capacity}</td>
                    <td>
                      <span className={`occupancy ${cls.currentStudents >= cls.capacity ? 'full' : ''}`}>
                        {cls.currentStudents || 0}/{cls.capacity}
                      </span>
                    </td>
                    <td>{cls.classTeacher || '-'}</td>
                    <td className="actions">
                      <button 
                        className="btn-icon edit"
                        onClick={() => editClass(cls)}
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        className="btn-icon delete"
                        onClick={() => deleteClass(cls.id)}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  const renderDepartments = () => (
    <div className="departments-container">
      <div className="departments-header">
        <h2><Users /> Department Management</h2>
        {!showDeptForm && (
          <button 
            className="btn btn-primary"
            onClick={() => setShowDeptForm(true)}
          >
            <Plus size={18} /> Add Department
          </button>
        )}
      </div>

      {showDeptForm && (
        <div className="dept-form-container">
          <h3>{editingDeptId ? 'Edit Department' : 'Create New Department'}</h3>
          <div className="dept-form">
            <div className="form-grid">
              <div className="form-group">
                <label>Department Name <span className="required">*</span></label>
                <input
                  type="text"
                  name="departmentName"
                  value={newDepartment.departmentName}
                  onChange={handleDeptChange}
                  placeholder="e.g., Science, Languages, Arts"
                />
              </div>

              <div className="form-group">
                <label>Department Head</label>
                <input
                  type="text"
                  name="departmentHead"
                  value={newDepartment.departmentHead}
                  onChange={handleDeptChange}
                  placeholder="Head of department"
                />
              </div>

              <div className="form-group full-width">
                <label>Description</label>
                <textarea
                  name="description"
                  value={newDepartment.description}
                  onChange={handleDeptChange}
                  placeholder="Department description..."
                  rows="3"
                />
              </div>
            </div>

            <div className="form-actions">
              <button 
                className="btn btn-success" 
                onClick={saveDepartment}
                disabled={loading}
              >
                <Save /> {editingDeptId ? 'Update Department' : 'Create Department'}
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={cancelDeptForm}
              >
                <X /> Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="departments-list">
        {departments.length === 0 ? (
          <div className="empty-state">
            <Users size={48} />
            <p>No departments created yet. Click "Add Department" to get started.</p>
          </div>
        ) : (
          <div className="departments-grid">
            {departments.map(dept => (
              <div key={dept.id} className="department-card">
                <div className="dept-header">
                  <h3>{dept.departmentName}</h3>
                  <div className="dept-actions">
                    <button 
                      className="btn-icon edit"
                      onClick={() => editDept(dept)}
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      className="btn-icon delete"
                      onClick={() => deleteDept(dept.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                {dept.departmentHead && (
                  <p className="dept-head"><strong>Head:</strong> {dept.departmentHead}</p>
                )}
                {dept.description && (
                  <p className="dept-desc">{dept.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="school-management">
      {/* Messages */}
      {successMessage && (
        <div className="alert alert-success">
          <Check size={20} />
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="alert alert-error">
          <AlertCircle size={20} />
          {errorMessage}
        </div>
      )}

      {/* Header */}
      <div className="management-header">
        <h1><School /> School Management</h1>
        <p>Manage school settings, classes, and departments</p>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <Settings size={20} />
          School Settings
        </button>
        <button 
          className={`tab ${activeTab === 'classes' ? 'active' : ''}`}
          onClick={() => setActiveTab('classes')}
        >
          <BookOpen size={20} />
          Classes ({classes.length})
        </button>
          <button className={`tab ${activeTab === 'calendar' ? 'active' : ''}`}          onClick={() => setActiveTab('calendar')}>
     <Calendar size={20} /> Academic Calendar
  </button>
        <button 
          className={`tab ${activeTab === 'departments' ? 'active' : ''}`}
          onClick={() => setActiveTab('departments')}
        >
          <Users size={20} />
          Departments ({departments.length})
        </button>
        <button
    className={`tab ${activeTab === 'subjects' ? 'active' : ''}`}
    onClick={() => setActiveTab('subjects')}
>
    <BookOpen size={20} />
    Subjects ({subjects.length})
</button>
      </div>

      {/* Content */}
      <div className="tab-content">
        {activeTab === 'settings' && renderSchoolSettings()}
        {activeTab === 'classes' && renderClasses()}
        {activeTab === 'calendar' && <AcademicCalendar />}
        {activeTab === 'departments' && renderDepartments()}
        {activeTab === 'subjects' && renderSubjects()}
      </div>
    </div>
  );
};

export default SchoolManagement;