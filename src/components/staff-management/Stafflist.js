import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Plus,          // for Plus
  Search,        // for Search
  Edit,          // for Edit
  Trash,         // for Trash
  Eye,           // for Eye
  Filter,        // for Filter
  User,          // for User (Lucide simplifies user icons to just 'User')
  Phone,         // for Phone
  Mail,          // for Mail
  CheckCircle,   // for CheckCircle
  XCircle        // for XCircle
} from 'lucide-react';
import './Stafflist.css';
import AppDialog from '../shared/AppDialog';
import { useAppDialog } from '../../hooks/useAppDialog';
const StaffList = () => {
  const navigate = useNavigate();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterStatus, setFilterStatus] = useState('active');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [departments, setDepartments] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
const { dialog, showDialog, closeDialog, handleDialogAction } = useAppDialog();
  // Nigerian school staff roles
  const roles = [
    'Principal',
    'Vice Principal (Admin)',
    'Vice Principal (Academic)',
    'Director of Studies',
    'Exams Officer',
    'Head of Department',
    'Senior Teacher',
    'Teacher',
    'Class Teacher',
    'Laboratory Technician',
    'Librarian',
    'Bursar',
    'Accountant',
    'School Secretary',
    'ICT Coordinator',
    'Guidance Counselor',
    'Sports Master/Mistress',
    'Security Officer',
    'School Nurse',
    'Cook',
    'Cleaner',
    'Driver',
    'Gardener',
    'PTA Staff'
  ];

  useEffect(() => {
    fetchStaff();
    fetchDepartments();
  }, [pagination.page, pagination.limit, searchTerm, filterRole, filterDepartment, filterStatus]);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/staff', {
        params: {
          page: pagination.page,
          limit: pagination.limit,
          search: searchTerm,
          role: filterRole,
          department: filterDepartment,
          status: filterStatus
        }
      });

      if (response.data.success) {
        setStaff(response.data.data);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
      showDialog('error', 'Failed to Load Staff', 'Could not load staff members. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPagination({ ...pagination, page: 1 });
  };

  const handleFilterRole = (e) => {
    setFilterRole(e.target.value);
    setPagination({ ...pagination, page: 1 });
  };

  const handleFilterDepartment = (e) => {
    setFilterDepartment(e.target.value);
    setPagination({ ...pagination, page: 1 });
  };

  const handleFilterStatus = (e) => {
    setFilterStatus(e.target.value);
    setPagination({ ...pagination, page: 1 });
  };

const handleDeleteClick = (staffMember) => {
  showDialog(
    'warning',
    'Confirm Deactivation',
    `Are you sure you want to deactivate ${staffMember.firstName} ${staffMember.lastName}?`,
    'This will set their status to inactive. They will no longer be able to access the system.',
    'Yes, Deactivate',
    async () => {
      try {
        const response = await axios.delete(`/api/staff/${staffMember.staffId}`);
        closeDialog();
        if (response.data.success) {
          fetchStaff();
        }
      } catch (error) {
        console.error('Error deleting staff:', error);
        closeDialog();
        showDialog('error', 'Deactivation Failed', 'Failed to deactivate staff member. Please try again.');
      }
    },
    true
  );
};

  const handlePageChange = (newPage) => {
    setPagination({ ...pagination, page: newPage });
  };

const getStatusBadge = (status) => {
  const badgeStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 10px',
    borderRadius: '16px',
    fontSize: '12px',
    fontWeight: 600
  };

  if (status === 'active') {
    return (
      <span style={{ ...badgeStyle, background: '#dcfce7', color: '#16a34a' }}>
        <CheckCircle size={14} /> Active
      </span>
    );
  }
  return (
    <span style={{ ...badgeStyle, background: '#fee2e2', color: '#dc2626' }}>
      <XCircle size={14} /> Inactive
    </span>
  );
};


  return (
    <div className="staff-list-container">
      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <h1><User /> Staff Management</h1>
          <p className="subtitle">Manage all staff members and their information</p>
        </div>
        <Link to="/staff/add" className="btn btn-primary btn-add">
          <Plus /> Add New Staff
        </Link>
      </div>

      {/* Filters and Search */}
<div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
  <div style={{ position: 'relative', flex: '1 1 260px', minWidth: '220px' }}>
    <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', color: '#9ca3af' }} />
    <input
      type="text"
      placeholder="Search by name, email, or staff ID..."
      value={searchTerm}
      onChange={handleSearch}
      style={{
        width: '100%',
        padding: '10px 12px 10px 38px',
        fontSize: '14px',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        outline: 'none',
        color: '#111827'
      }}
    />
  </div>

  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <Filter style={{ width: '16px', height: '16px', color: '#6b7280' }} />
      <select
        value={filterRole}
        onChange={handleFilterRole}
        style={{
          padding: '8px 10px',
          fontSize: '14px',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          color: '#111827',
          background: '#fff'
        }}
      >
        <option value="">All Roles</option>
        {roles.map(role => (
          <option key={role} value={role}>{role}</option>
        ))}
      </select>
    </div>

    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <select
        value={filterDepartment}
        onChange={handleFilterDepartment}
        style={{
          padding: '8px 10px',
          fontSize: '14px',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          color: '#111827',
          background: '#fff'
        }}
      >
        <option value="">All Departments</option>
        {departments.map(dept => (
          <option key={dept.id} value={dept.departmentName}>
            {dept.departmentName}
          </option>
        ))}
      </select>
    </div>

    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <select
        value={filterStatus}
        onChange={handleFilterStatus}
        style={{
          padding: '8px 10px',
          fontSize: '14px',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          color: '#111827',
          background: '#fff'
        }}
      >
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
        <option value="">All Status</option>
      </select>
    </div>
  </div>
</div>

      {/* Staff Table */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading staff members...</p>
        </div>
      ) : staff.length === 0 ? (
        <div className="empty-state">
          <User className="empty-icon" />
          <h3>No staff members found</h3>
          <p>Try adjusting your search or filters, or add a new staff member.</p>
          <Link to="/staff/add" className="btn btn-primary">
            <Plus /> Add First Staff Member
          </Link>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="staff-table">
              <thead>
                <tr>
                  <th>Staff ID</th>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Contact</th>
                  <th>Employment Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((member) => (
                  <tr key={member.id}>
                    <td>
                      <span className="staff-id">{member.staffId}</span>
                    </td>
                    <td>
                      <div className="staff-name-cell">
                        {member.profileImage ? (
                          <img src={member.profileImage} alt={member.firstName} className="staff-avatar" />
                        ) : (
                          <div className="staff-avatar-placeholder">
                            {member.firstName.charAt(0)}{member.lastName.charAt(0)}
                          </div>
                        )}
                        <div className="staff-name">
                          <span className="name-primary">
                            {member.firstName} {member.lastName}
                          </span>
                          {member.middleName && (
                            <span className="name-secondary">{member.middleName}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="role-badge">{member.role}</span>
                    </td>
                    <td>{member.department || 'N/A'}</td>
                    <td>
                      <div className="contact-info">
                        <div className="contact-item">
                          <Mail /> {member.email}
                        </div>
                        <div className="contact-item">
                          <Phone /> {member.phone}
                        </div>
                      </div>
                    </td>
                    <td>{new Date(member.employmentDate).toLocaleDateString()}</td>
                    <td>{getStatusBadge(member.status)}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => navigate(`/staff/profile/${member.staffId}`)}
                          className="btn-icon btn-view"
                          title="View Profile"
                        >
                          <Eye />
                        </button>
                        <button
                          onClick={() => navigate(`/staff/edit/${member.staffId}`)}
                          className="btn-icon btn-edit"
                          title="Edit Staff"
                        >
                          <Edit />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(member)}
                          className="btn-icon btn-delete"
                          title="Deactivate Staff"
                        >
                          <Trash />
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
                Previous
              </button>
              
              <div className="pagination-info">
                Page {pagination.page} of {pagination.pages} 
                <span className="total-count">({pagination.total} total)</span>
              </div>

              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="btn-pagination"
              >
                Next
              </button>
            </div>
          )}
        </>
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

export default StaffList;