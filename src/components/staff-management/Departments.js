import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus,         // for Plus
  Edit,         // for Edit (Pencil is also a common alternative)
  Trash,        // for Trash (Trash2 is also popular)
  Building,     // for Building
  User,         // for User
  X,   Loader2,        // for X
  Save          // for Save
} from 'lucide-react';
import './Departments.css';
import AppDialog from '../shared/AppDialog';
import { useAppDialog } from '../../hooks/useAppDialog';
const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [formData, setFormData] = useState({
    departmentName: '',
    departmentHead: '',
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
const { dialog, showDialog, closeDialog, handleDialogAction } = useAppDialog();
  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/departments');
      if (response.data.success) {
        setDepartments(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    setIsEdit(false);
    setFormData({ departmentName: '', departmentHead: '', description: '' });
    setErrors({});
    setShowModal(true);
  };

  const handleEditClick = (dept) => {
    setIsEdit(true);
    setSelectedDept(dept);
    setFormData({
      departmentName: dept.departmentName,
      departmentHead: dept.departmentHead || '',
      description: dept.description || ''
    });
    setErrors({});
    setShowModal(true);
  };

const handleDeleteClick = (dept) => {
  showDialog(
    'danger',
    'Confirm Deletion',
    `Are you sure you want to delete "${dept.departmentName}"? This action cannot be undone.`,
    '',
    'Delete',
    async () => {
      try {
        await axios.delete(`/api/departments/${dept.id}`);
        closeDialog();
        fetchDepartments();
      } catch (error) {
        closeDialog();
        showDialog('error', 'Delete Failed', error.response?.data?.message || 'Failed to delete department.');
      }
    },
    true // showCancel
  );
};

const handleSubmit = async (e) => {
  e.preventDefault();

  if (!formData.departmentName.trim()) {
    setErrors({ departmentName: 'Department name is required' });
    return;
  }

  setSubmitting(true);
  try {
    if (isEdit) {
      await axios.put(`/api/departments/${selectedDept.id}`, formData);
      showDialog('success', 'Department Updated', 'The department was updated successfully.');
    } else {
      await axios.post('/api/departments', formData);
      showDialog('success', 'Department Created', 'The department was created successfully.');
    }
    setShowModal(false);
    fetchDepartments();
  } catch (error) {
    if (error.response?.status === 409) {
      setErrors({ departmentName: 'Department already exists' });
    } else {
      showDialog('error', 'Save Failed', 'Failed to save department.');
    }
  } finally {
    setSubmitting(false);
  }
};



  return (
    <div className="departments-container">
      <div className="page-header">
        <div className="header-left">
          <h1><Building /> Departments</h1>
          <p className="subtitle">Manage school departments and their heads</p>
        </div>
        <button onClick={handleAddClick} className="btn btn-primary">
          <Plus /> Add Department
        </button>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading departments...</p>
        </div>
      ) : (
        <div className="departments-grid">
          {departments.map((dept) => (
            <div key={dept.id} className="dept-card">
              <div className="dept-header">
                <h3>{dept.departmentName}</h3>
                <div className="dept-actions">
                  <button
  onClick={() => handleEditClick(dept)}
  style={{
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    background: '#fff',
    color: '#2563eb',
    cursor: 'pointer'
  }}
>
  <Edit size={16} />
</button>
<button
  onClick={() => handleDeleteClick(dept)}
  style={{
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    background: '#fff',
    color: '#dc2626',
    cursor: 'pointer'
  }}
>
  <Trash size={16} />
</button>
                </div>
              </div>
              <div className="dept-body">
                {dept.departmentHead && (
                  <p className="dept-head">
                    <User /> <strong>Head:</strong> {dept.departmentHead}
                  </p>
                )}
                {dept.description && (
                  <p className="dept-description">{dept.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
    {showModal && (
  <div
    onClick={() => setShowModal(false)}
    style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        background: '#fff',
        borderRadius: '10px',
        width: '90%',
        maxWidth: '480px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)'
      }}
    >
      <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb' }}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
          {isEdit ? 'Edit Department' : 'Add New Department'}
        </h3>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>
              Department Name <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              type="text"
              value={formData.departmentName}
              onChange={(e) => setFormData({ ...formData, departmentName: e.target.value })}
              style={{
                width: '100%',
                padding: '9px 12px',
                fontSize: '14px',
                border: `1px solid ${errors.departmentName ? '#dc2626' : '#e5e7eb'}`,
                borderRadius: '6px',
                outline: 'none'
              }}
            />
            {errors.departmentName && (
              <p style={{ color: '#dc2626', fontSize: '12px', margin: '4px 0 0' }}>
                {errors.departmentName}
              </p>
            )}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>
              Department Head
            </label>
            <input
              type="text"
              value={formData.departmentHead}
              onChange={(e) => setFormData({ ...formData, departmentHead: e.target.value })}
              style={{
                width: '100%',
                padding: '9px 12px',
                fontSize: '14px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                outline: 'none'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows="3"
              style={{
                width: '100%',
                padding: '9px 12px',
                fontSize: '14px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
            />
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            padding: '16px 24px',
            borderTop: '1px solid #e5e7eb'
          }}
        >
          <button
            type="button"
            onClick={() => setShowModal(false)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 16px',
              fontSize: '14px',
              fontWeight: 500,
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              background: '#fff',
              color: '#374151',
              cursor: 'pointer'
            }}
          >
            <X size={16} /> Cancel
          </button>
          <button
  type="submit"
  disabled={submitting}
  style={{
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '9px 16px',
    fontSize: '14px',
    fontWeight: 500,
    border: 'none',
    borderRadius: '6px',
    background: submitting ? '#93c5fd' : '#2563eb',
    color: '#fff',
    cursor: submitting ? 'not-allowed' : 'pointer'
  }}
>
  {submitting ? (
    <>
      <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
      {isEdit ? 'Updating...' : 'Creating...'}
    </>
  ) : (
    <>
      <Save size={16} /> {isEdit ? 'Update' : 'Create'}
    </>
  )}
</button>
        </div>
      </form>
    </div>
  </div>
)}

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

export default Departments;