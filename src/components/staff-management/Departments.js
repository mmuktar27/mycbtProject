import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus,         // for Plus
  Edit,         // for Edit (Pencil is also a common alternative)
  Trash,        // for Trash (Trash2 is also popular)
  Building,     // for Building
  User,         // for User
  X,            // for X
  Save          // for Save
} from 'lucide-react';
import './Departments.css';

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
  const [errors, setErrors] = useState({});

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
    setSelectedDept(dept);
    setShowDeleteModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.departmentName.trim()) {
      setErrors({ departmentName: 'Department name is required' });
      return;
    }

    try {
      if (isEdit) {
        await axios.put(`/api/departments/${selectedDept.id}`, formData);
        alert('Department updated successfully');
      } else {
        await axios.post('/api/departments', formData);
        alert('Department created successfully');
      }
      setShowModal(false);
      fetchDepartments();
    } catch (error) {
      if (error.response?.status === 409) {
        setErrors({ departmentName: 'Department already exists' });
      } else {
        alert('Failed to save department');
      }
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`/api/departments/${selectedDept.id}`);
      alert('Department deleted successfully');
      setShowDeleteModal(false);
      fetchDepartments();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete department');
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
                  <button onClick={() => handleEditClick(dept)} className="btn-icon btn-edit">
                    <Edit />
                  </button>
                  <button onClick={() => handleDeleteClick(dept)} className="btn-icon btn-delete">
                    <Trash />
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
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{isEdit ? 'Edit Department' : 'Add New Department'}</h3>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Department Name <span className="required">*</span></label>
                  <input
                    type="text"
                    value={formData.departmentName}
                    onChange={(e) => setFormData({...formData, departmentName: e.target.value})}
                    className={errors.departmentName ? 'error' : ''}
                  />
                  {errors.departmentName && <p className="error-message">{errors.departmentName}</p>}
                </div>
                <div className="form-group">
                  <label>Department Head</label>
                  <input
                    type="text"
                    value={formData.departmentHead}
                    onChange={(e) => setFormData({...formData, departmentHead: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows="3"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  <X /> Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Save /> {isEdit ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Confirm Deletion</h3>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete <strong>{selectedDept?.departmentName}</strong>?</p>
              <p className="warning-text">This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowDeleteModal(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={handleDelete} className="btn btn-danger">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Departments;