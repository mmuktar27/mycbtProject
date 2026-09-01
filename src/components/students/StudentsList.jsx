import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Users, Search, Filter, Eye, Edit, Trash2, Download,
  Phone, Mail, Calendar, GraduationCap, ChevronLeft, 
  ChevronRight, RefreshCw, UserPlus, Upload
} from 'lucide-react';
import './StudentsList.css';

const StudentsList = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterStatus, setFilterStatus] = useState('active');
  const [filterType, setFilterType] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [classes, setClasses] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    fetchStudents();
    fetchClasses();
  }, [pagination.page, searchTerm, filterClass, filterStatus, filterType]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/students', {
        params: {
          page: pagination.page,
          limit: pagination.limit,
          search: searchTerm,
          currentClass: filterClass,
          status: filterStatus,
          admissionType: filterType
        }
      });

      if (response.data.success) {
        setStudents(response.data.data);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      alert('Failed to load students. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await axios.get('/api/classes');
      if (response.data.success) {
        setClasses(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPagination({ ...pagination, page: 1 });
  };

  const handleDeleteClick = (student) => {
    setSelectedStudent(student);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const response = await axios.put(`/api/students/${selectedStudent.studentId}`, {
        status: 'withdrawn'
      });

      if (response.data.success) {
        alert('Student status updated to withdrawn');
        setShowDeleteModal(false);
        fetchStudents();
      }
    } catch (error) {
      console.error('Error updating student:', error);
      alert('Failed to update student status');
    }
  };

  const handlePageChange = (newPage) => {
    setPagination({ ...pagination, page: newPage });
  };

  const handleExport = () => {
    // Implement CSV export
    const csv = convertToCSV(students);
    downloadCSV(csv, 'students.csv');
  };

  const convertToCSV = (data) => {
    const headers = [
      'Student ID', 'Admission Number', 'First Name', 'Last Name',
      'Class', 'Gender', 'Parent Phone', 'Status'
    ];
    
    const rows = data.map(s => [
      s.studentId,
      s.admissionNumber,
      s.firstName,
      s.lastName,
      s.currentClass,
      s.gender,
      s.parentPhone,
      s.status
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const downloadCSV = (csv, filename) => {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      active: 'success',
      graduated: 'info',
      transferred: 'warning',
      withdrawn: 'danger',
      expelled: 'danger'
    };

    return (
      <span className={`badge badge-${statusColors[status] || 'secondary'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="students-list-container">
      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <h1><Users size={28} /> Students</h1>
          <p className="subtitle">Manage all student records</p>
        </div>
        <div className="header-actions">
          <button onClick={handleExport} className="btn btn-secondary">
            <Download size={18} /> Export
          </button>
          <button onClick={() => navigate('/students/import')} className="btn btn-secondary">
            <Upload size={18} /> Import
          </button>
          <button onClick={fetchStudents} className="btn btn-secondary">
            <RefreshCw size={18} /> Refresh
          </button>
          <button onClick={() => navigate('/students/add')} className="btn btn-primary">
            <UserPlus size={18} /> Add Student
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="filters-section">
        <div className="search-box">
          <Search className="search-icon" size={20} />
          <input
            type="text"
            placeholder="Search by name, student ID, admission number, or phone..."
            value={searchTerm}
            onChange={handleSearch}
            className="search-input"
          />
        </div>

        <div className="filter-controls">
          <div className="filter-group">
            <Filter size={18} />
            <select 
              value={filterClass} 
              onChange={(e) => {
                setFilterClass(e.target.value);
                setPagination({ ...pagination, page: 1 });
              }} 
              className="filter-select"
            >
              <option value="">All Classes</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.className}>
                  {cls.className}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <select 
              value={filterStatus} 
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPagination({ ...pagination, page: 1 });
              }} 
              className="filter-select"
            >
              <option value="active">Active</option>
              <option value="graduated">Graduated</option>
              <option value="transferred">Transferred</option>
              <option value="withdrawn">Withdrawn</option>
              <option value="">All Status</option>
            </select>
          </div>

          <div className="filter-group">
            <select 
              value={filterType} 
              onChange={(e) => {
                setFilterType(e.target.value);
                setPagination({ ...pagination, page: 1 });
              }} 
              className="filter-select"
            >
              <option value="">All Types</option>
              <option value="New">New Admission</option>
              <option value="Transfer">Transfer</option>
              <option value="Bulk Import">Bulk Import</option>
            </select>
          </div>
        </div>
      </div>

      {/* Students Table */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading students...</p>
        </div>
      ) : students.length === 0 ? (
        <div className="empty-state">
          <Users size={64} className="empty-icon" />
          <h3>No students found</h3>
          <p>No students match your search criteria.</p>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="students-table">
              <thead>
                <tr>
                  <th>Student ID</th>
                  <th>Admission No.</th>
                  <th>Name</th>
                  <th>Class</th>
                  <th>Gender</th>
                  <th>Contact</th>
                  <th>Admission Date</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id}>
                    <td>
                      <span className="student-id">{student.studentId}</span>
                    </td>
                    <td>
                      <span className="admission-number">{student.admissionNumber}</span>
                    </td>
                    <td>
                      <div className="student-info">
                        {student.profileImage ? (
                          <img
                            src={student.profileImage}
                            alt={student.firstName}
                            className="student-avatar"
                          />
                        ) : (
                          <div className="student-avatar-placeholder">
                            {student.firstName.charAt(0)}
                            {student.lastName.charAt(0)}
                          </div>
                        )}
                        <div className="student-name">
                          <span className="name-primary">
                            {student.firstName} {student.lastName}
                          </span>
                          {student.middleName && (
                            <span className="name-secondary">{student.middleName}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="class-info">
                        <GraduationCap size={14} />
                        <span>{student.currentClass}</span>
                      </div>
                    </td>
                    <td>{student.gender}</td>
                    <td>
                      <div className="contact-info">
                        <div className="contact-item">
                          <Phone size={12} /> {student.parentPhone}
                        </div>
                        {student.parentEmail && (
                          <div className="contact-item">
                            <Mail size={12} /> {student.parentEmail}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="date-info">
                        <Calendar size={14} />
                        {formatDate(student.admissionDate)}
                      </div>
                    </td>
                    <td>
                      <span className="type-badge">{student.admissionType}</span>
                    </td>
                    <td>{getStatusBadge(student.status)}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => navigate(`/students/profile/${student.studentId}`)}
                          className="btn-icon btn-view"
                          title="View Profile"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => navigate(`/students/edit/${student.studentId}`)}
                          className="btn-icon btn-edit"
                          title="Edit Student"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(student)}
                          className="btn-icon btn-delete"
                          title="Withdraw Student"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="pagination">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="btn-pagination"
              >
                <ChevronLeft size={18} /> Previous
              </button>

              <div className="pagination-info">
                Page {pagination.page} of {pagination.pages}
                <span className="total-count">({pagination.total} students)</span>
              </div>

              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="btn-pagination"
              >
                Next <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Confirm Withdrawal</h3>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to mark <strong>{selectedStudent?.firstName} {selectedStudent?.lastName}</strong> as withdrawn?
              </p>
              <p className="warning-text">
                This will change their status to "Withdrawn". This action can be reversed by editing the student record.
              </p>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button onClick={handleDeleteConfirm} className="btn btn-danger">
                Yes, Withdraw Student
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentsList;