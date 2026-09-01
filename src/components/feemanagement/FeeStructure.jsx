import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Settings,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import './FeeStructure.css';

// Custom Dialog Component
const Dialog = ({ isOpen, onClose, onConfirm, title, message, type = 'danger' }) => {
  if (!isOpen) return null;

  return (
    <div className="dialog-overlay">
      <div className="dialog-content">
        <div className="dialog-header">
          <AlertCircle className={`dialog-icon ${type}`} size={24} />
          <h3>{title}</h3>
        </div>
        <div className="dialog-body">
          <p>{message}</p>
        </div>
        <div className="dialog-actions">
          <button className="dialog-btn dialog-btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button 
            className={`dialog-btn dialog-btn-confirm ${type}`} 
            onClick={onConfirm}
          >
            {type === 'danger' ? 'Delete' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Toast Notification Component
const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast toast-${type}`}>
      {type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
      <span>{message}</span>
      <button className="toast-close" onClick={onClose}>
        <X size={16} />
      </button>
    </div>
  );
};

const FeeStructure = () => {
  const [activeTab, setActiveTab] = useState('categories');
  const [categories, setCategories] = useState([]);
  const [structures, setStructures] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('category');
  const [editingItem, setEditingItem] = useState(null);

  // Dialog state
  const [dialog, setDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'danger',
    onConfirm: () => {}
  });

  // Toast state
  const [toast, setToast] = useState({
    show: false,
    message: '',
    type: 'success'
  });

  const [categoryForm, setCategoryForm] = useState({
    categoryName: '',
    description: ''
  });
const [schoolSettings, setSchoolSettings] = useState(null);
const [academicYears, setAcademicYears] = useState([]);
  const [structureForm, setStructureForm] = useState({
    academicYear: '2024/2025',
    className: '',
    classId: '',
    term: '',
    categoryId: '',
    amount: '',
    dueDate: '',
    isCompulsory: 1,
    installmentAllowed: 0,
    maxInstallments: 1,
    latePaymentFine: 0,
    gracePeriodDays: 0
  });

  const [filters, setFilters] = useState({
    academicYear: '2024/2025',
    className: '',
    term: ''
  });

  // Toast helper
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const closeToast = () => {
    setToast({ ...toast, show: false });
  };

  // Dialog helper
  const showDialog = (title, message, onConfirm, type = 'danger') => {
    setDialog({
      isOpen: true,
      title,
      message,
      type,
      onConfirm
    });
  };

  const closeDialog = () => {
    setDialog({ ...dialog, isOpen: false });
  };
 const generateAcademicYears = (currentAcademicYear) => {
    if (!currentAcademicYear) {
      // Fallback to current date if no school settings
      const currentYear = new Date().getFullYear();
      currentAcademicYear = `${currentYear}/${currentYear + 1}`;
    }

    // Extract the starting year from format "2024/2025"
    const startYear = parseInt(currentAcademicYear.split('/')[0]);
    
    const years = [];
    
    // Generate 10 years before current year
    for (let i = 10; i > 0; i--) {
      const year = startYear - i;
      years.push(`${year}/${year + 1}`);
    }
    
    // Add current year
    years.push(currentAcademicYear);
    
    // Add 5 years after current year
    for (let i = 1; i <= 5; i++) {
      const year = startYear + i;
      years.push(`${year}/${year + 1}`);
    }
    
    return years;
  };
  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/fees/categories');
      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      showToast('Failed to fetch categories', 'error');
    }
  };

  // Fetch structures
  const fetchStructures = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.academicYear) params.append('academicYear', filters.academicYear);
      if (filters.className) params.append('className', filters.className);
      if (filters.term) params.append('term', filters.term);

      const response = await fetch(`/api/fees/structures?${params}`);
      const data = await response.json();
      if (data.success) {
        setStructures(data.data);
      }
    } catch (error) {
      console.error('Error fetching structures:', error);
      showToast('Failed to fetch fee structures', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch classes
  const fetchClasses = async () => {
    try {
      const response = await fetch('/api/classes');
      const data = await response.json();
      if (data.success) {
        setClasses(data.data);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
      showToast('Failed to fetch classes', 'error');
    }
  };
 const fetchSchoolSettings = async () => {
    try {
      const response = await fetch('/api/school-settings');
      const data = await response.json();
      if (data.success) {
        setSchoolSettings(data.data);
        const years = generateAcademicYears(data.data.academicYear);
        setAcademicYears(years);
        
        // Set the current academic year as default
        setFilters(prev => ({
          ...prev,
          academicYear: data.data.academicYear
        }));
        setStructureForm(prev => ({
          ...prev,
          academicYear: data.data.academicYear
        }));
      }
    } catch (error) {
      console.error('Error fetching school settings:', error);
      // Fallback: generate years based on current date
      const currentYear = new Date().getFullYear();
      const fallbackYear = `${currentYear}/${currentYear + 1}`;
      const years = generateAcademicYears(fallbackYear);
      setAcademicYears(years);
      setFilters(prev => ({ ...prev, academicYear: fallbackYear }));
      setStructureForm(prev => ({ ...prev, academicYear: fallbackYear }));
    }
  };
  useEffect(() => {
    fetchSchoolSettings();
    fetchCategories();

    fetchClasses();
  }, []);

  useEffect(() => {
    if (activeTab === 'structures') {
      fetchStructures();
    }
  }, [activeTab, filters]);

  // Handle create/edit category
  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = editingItem
        ? `/api/fees/categories/${editingItem.id}`
        : '/api/fees/categories';

      const response = await fetch(url, {
        method: editingItem ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(categoryForm),
      });

      const data = await response.json();

      if (data.success) {
        showToast(
          editingItem ? 'Category updated successfully!' : 'Category created successfully!'
        );
        setShowModal(false);
        resetCategoryForm();
        fetchCategories();
      } else {
        showToast(`Error: ${data.message}`, 'error');
      }
    } catch (error) {
      console.error('Error saving category:', error);
      showToast('Failed to save category', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle create/edit structure
  const handleStructureSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = editingItem
        ? `/api/fees/structures/${editingItem.id}`
        : '/api/fees/structures';

      const response = await fetch(url, {
        method: editingItem ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...structureForm,
          amount: parseFloat(structureForm.amount),
          latePaymentFine: parseFloat(structureForm.latePaymentFine || 0),
          gracePeriodDays: parseInt(structureForm.gracePeriodDays || 0),
          maxInstallments: parseInt(structureForm.maxInstallments || 1),
          categoryId: parseInt(structureForm.categoryId),
          classId: parseInt(structureForm.classId) || null
        }),
      });

      const data = await response.json();

      if (data.success) {
        showToast(
          editingItem ? 'Fee structure updated successfully!' : 'Fee structure created successfully!'
        );
        setShowModal(false);
        resetStructureForm();
        fetchStructures();
      } else {
        showToast(`Error: ${data.message}`, 'error');
      }
    } catch (error) {
      console.error('Error saving structure:', error);
      showToast('Failed to save fee structure', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Delete category
  const confirmDeleteCategory = (id) => {
    showDialog(
      'Delete Category',
      'Are you sure you want to delete this category? This action cannot be undone.',
      async () => {
        closeDialog();
        try {
          const response = await fetch(`/api/fees/categories/${id}`, {
            method: 'DELETE',
          });

          const data = await response.json();

          if (data.success) {
            showToast('Category deleted successfully!');
            fetchCategories();
          } else {
            showToast(`Error: ${data.message}`, 'error');
          }
        } catch (error) {
          console.error('Error deleting category:', error);
          showToast('Failed to delete category', 'error');
        }
      }
    );
  };

  // Delete structure
  const confirmDeleteStructure = (id) => {
    showDialog(
      'Delete Fee Structure',
      'Are you sure you want to delete this fee structure? This action cannot be undone.',
      async () => {
        closeDialog();
        try {
          const response = await fetch(`/api/fees/structures/${id}`, {
            method: 'DELETE',
          });

          const data = await response.json();

          if (data.success) {
            showToast('Fee structure deleted successfully!');
            fetchStructures();
          } else {
            showToast(`Error: ${data.message}`, 'error');
          }
        } catch (error) {
          console.error('Error deleting structure:', error);
          showToast('Failed to delete fee structure', 'error');
        }
      }
    );
  };

  // Edit category
  const editCategory = (category) => {
    setEditingItem(category);
    setCategoryForm({
      categoryName: category.categoryName,
      description: category.description || ''
    });
    setModalType('category');
    setShowModal(true);
  };

  // Edit structure
  const editStructure = (structure) => {
    setEditingItem(structure);
    setStructureForm({
      academicYear: structure.academicYear,
      className: structure.className,
      classId: structure.classId || '',
      term: structure.term || '',
      categoryId: structure.categoryId,
      amount: structure.amount,
      dueDate: structure.dueDate || '',
      isCompulsory: structure.isCompulsory,
      installmentAllowed: structure.installmentAllowed,
      maxInstallments: structure.maxInstallments,
      latePaymentFine: structure.latePaymentFine,
      gracePeriodDays: structure.gracePeriodDays
    });
    setModalType('structure');
    setShowModal(true);
  };

  // Reset forms
  const resetCategoryForm = () => {
    setCategoryForm({
      categoryName: '',
      description: ''
    });
    setEditingItem(null);
  };

  const resetStructureForm = () => {
    setStructureForm({
      academicYear: schoolSettings?.academicYear || '',
      className: '',
      classId: '',
      term: '',
      categoryId: '',
      amount: '',
      dueDate: '',
      isCompulsory: 1,
      installmentAllowed: 0,
      maxInstallments: 1,
      latePaymentFine: 0,
      gracePeriodDays: 0
    });
    setEditingItem(null);
  };

  const openCategoryModal = () => {
    resetCategoryForm();
    setModalType('category');
    setShowModal(true);
  };

  const openStructureModal = () => {
    resetStructureForm();
    setModalType('structure');
    setShowModal(true);
  };

  return (
    <div className="fee-structure-container">
      <div className="fee-structure-header">
        <div className="header-left">
          <Settings className="header-icon" />
          <div>
            <h1>Fee Structure Management</h1>
            <p>Configure fee categories and class-wise fee structures</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <button
          className={`tab-btn ${activeTab === 'categories' ? 'active' : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          Fee Categories
        </button>
        <button
          className={`tab-btn ${activeTab === 'structures' ? 'active' : ''}`}
          onClick={() => setActiveTab('structures')}
        >
          Fee Structures
        </button>
      </div>

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div className="categories-section">
          <div className="section-header">
            <h2>Fee Categories</h2>
            <button className="add-btn" onClick={openCategoryModal}>
              <Plus size={20} /> Add Category
            </button>
          </div>

          <div className="categories-grid">
            {categories.map((category) => (
              <div key={category.id} className="category-card">
                <div className="category-header">
                  <h3>{category.categoryName}</h3>
                  <div className="category-actions">
                    <button
                      className="edit-btn-small"
                      onClick={() => editCategory(category)}
                      title="Edit"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      className="delete-btn-small"
                      onClick={() => confirmDeleteCategory(category.id)}
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                {category.description && (
                  <p className="category-description">{category.description}</p>
                )}
                <div className="category-footer">
                  <span className={`status-badge ${category.isActive ? 'active' : 'inactive'}`}>
                    {category.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            ))}

            {categories.length === 0 && (
              <div className="empty-state-categories">
                <AlertCircle size={48} />
                <p>No fee categories created yet</p>
                <button className="add-btn" onClick={openCategoryModal}>
                  <Plus size={20} /> Create First Category
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Structures Tab */}
      {activeTab === 'structures' && (
        <div className="structures-section">
          <div className="section-header">
            <h2>Fee Structures</h2>
            <button className="add-btn" onClick={openStructureModal}>
              <Plus size={20} /> Add Fee Structure
            </button>
          </div>

          {/* Filters */}
          <div className="filters-container">
            <div className="filter-group">
              <label>Academic Year</label>
                 <select
                value={filters.academicYear}
                onChange={(e) => setFilters({ ...filters, academicYear: e.target.value })}
              >
                {academicYears.length === 0 ? (
                  <option value="">Loading...</option>
                ) : (
                  academicYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                      {schoolSettings && year === schoolSettings.academicYear && ' (Current)'}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div className="filter-group">
              <label>Class</label>
              <select
                value={filters.className}
                onChange={(e) => setFilters({ ...filters, className: e.target.value })}
              >
                <option value="">All Classes</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.className}>
                    {cls.className}
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label>Term</label>
              <select
                value={filters.term}
                onChange={(e) => setFilters({ ...filters, term: e.target.value })}
              >
                <option value="">All Terms</option>
                <option value="1st Term">1st Term</option>
                <option value="2nd Term">2nd Term</option>
                <option value="3rd Term">3rd Term</option>
              </select>
            </div>
          </div>

          {/* Structures Table */}
          <div className="structures-table">
            <table>
              <thead>
                <tr>
                  <th>Class</th>
                  <th>Fee Category</th>
                  <th>Term</th>
                  <th>Amount</th>
                  <th>Due Date</th>
                  <th>Compulsory</th>
                  <th>Installments</th>
                  <th>Late Fine</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {structures.map((structure) => (
                  <tr key={structure.id}>
                    <td><strong>{structure.className}</strong></td>
                    <td>{structure.categoryName}</td>
                    <td>{structure.term || 'All Terms'}</td>
                    <td><strong>₦{structure.amount.toLocaleString()}</strong></td>
                    <td>
                      {structure.dueDate
                        ? new Date(structure.dueDate).toLocaleDateString()
                        : 'No deadline'}
                    </td>
                    <td>
                      {structure.isCompulsory ? (
                        <span className="badge-yes">Yes</span>
                      ) : (
                        <span className="badge-no">No</span>
                      )}
                    </td>
                    <td>
                      {structure.installmentAllowed ? (
                        <span className="badge-yes">Up to {structure.maxInstallments}</span>
                      ) : (
                        <span className="badge-no">No</span>
                      )}
                    </td>
                    <td>
                      {structure.latePaymentFine > 0
                        ? `₦${structure.latePaymentFine.toLocaleString()}`
                        : 'None'}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="edit-btn-small"
                          onClick={() => editStructure(structure)}
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          className="delete-btn-small"
                          onClick={() => confirmDeleteStructure(structure.id)}
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {structures.length === 0 && !loading && (
              <div className="empty-state">
                <AlertCircle size={48} />
                <p>No fee structures found</p>
                <button className="add-btn" onClick={openStructureModal}>
                  <Plus size={20} /> Create Fee Structure
                </button>
              </div>
            )}

            {loading && (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading...</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>
                {editingItem ? 'Edit' : 'Add'}{' '}
                {modalType === 'category' ? 'Fee Category' : 'Fee Structure'}
              </h2>
              <button
                className="close-modal-btn"
                onClick={() => {
                  setShowModal(false);
                  modalType === 'category' ? resetCategoryForm() : resetStructureForm();
                }}
              >
                <X />
              </button>
            </div>

            {/* Category Form */}
            {modalType === 'category' && (
              <form onSubmit={handleCategorySubmit} className="modal-form">
                <div className="form-group">
                  <label>Category Name *</label>
                  <input
                    type="text"
                    value={categoryForm.categoryName}
                    onChange={(e) =>
                      setCategoryForm({ ...categoryForm, categoryName: e.target.value })
                    }
                    placeholder="e.g., Tuition Fee, Lab Fee, Sports Fee"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={categoryForm.description}
                    onChange={(e) =>
                      setCategoryForm({ ...categoryForm, description: e.target.value })
                    }
                    rows="3"
                    placeholder="Optional description"
                  />
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => {
                      setShowModal(false);
                      resetCategoryForm();
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="submit-btn" disabled={loading}>
                    <Save size={16} />
                    {loading ? 'Saving...' : editingItem ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            )}

            {/* Structure Form */}
            {modalType === 'structure' && (
              <form onSubmit={handleStructureSubmit} className="modal-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Academic Year *</label>
                 <select
  value={structureForm.academicYear}
  onChange={(e) =>
    setStructureForm({ ...structureForm, academicYear: e.target.value })
  }
  required
>
  {academicYears.length === 0 ? (
    <option value="">Loading...</option>
  ) : (
    academicYears.map((year) => (
      <option key={year} value={year}>
        {year}
        {schoolSettings && year === schoolSettings.academicYear && ' (Current)'}
      </option>
    ))
  )}
</select>
                  </div>

                  <div className="form-group">
                    <label>Class *</label>
                    <select
                      value={structureForm.classId}
                      onChange={(e) => {
                        const selectedClass = classes.find(c => c.id === parseInt(e.target.value));
                        setStructureForm({
                          ...structureForm,
                          classId: e.target.value,
                          className: selectedClass ? selectedClass.className : ''
                        });
                      }}
                      required
                    >
                      <option value="">Select class</option>
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.className}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Fee Category *</label>
                    <select
                      value={structureForm.categoryId}
                      onChange={(e) =>
                        setStructureForm({ ...structureForm, categoryId: e.target.value })
                      }
                      required
                    >
                      <option value="">Select category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.categoryName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Term</label>
                    <select
                      value={structureForm.term}
                      onChange={(e) =>
                        setStructureForm({ ...structureForm, term: e.target.value })
                      }
                    >
                      <option value="">All Terms</option>
                      <option value="1st Term">1st Term</option>
                      <option value="2nd Term">2nd Term</option>
                      <option value="3rd Term">3rd Term</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Amount (₦) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={structureForm.amount}
                      onChange={(e) =>
                        setStructureForm({ ...structureForm, amount: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Due Date</label>
                    <input
                      type="date"
                      value={structureForm.dueDate}
                      onChange={(e) =>
                        setStructureForm({ ...structureForm, dueDate: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={structureForm.isCompulsory === 1}
                        onChange={(e) =>
                          setStructureForm({
                            ...structureForm,
                            isCompulsory: e.target.checked ? 1 : 0,
                          })
                        }
                      />
                      Compulsory Fee
                    </label>
                  </div>

                  <div className="form-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={structureForm.installmentAllowed === 1}
                        onChange={(e) =>
                          setStructureForm({
                            ...structureForm,
                            installmentAllowed: e.target.checked ? 1 : 0,
                          })
                        }
                      />
                      Allow Installments
                    </label>
                  </div>
                </div>

                {structureForm.installmentAllowed === 1 && (
                  <div className="form-group">
                    <label>Maximum Installments</label>
                    <input
                      type="number"
                      min="1"
                      value={structureForm.maxInstallments}
                      onChange={(e) =>
                        setStructureForm({ ...structureForm, maxInstallments: e.target.value })
                      }
                    />
                  </div>
                )}

                <div className="form-row">
                  <div className="form-group">
                    <label>Late Payment Fine (₦)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={structureForm.latePaymentFine}
                      onChange={(e) =>
                        setStructureForm({ ...structureForm, latePaymentFine: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Grace Period (Days)</label>
                    <input
                      type="number"
                      value={structureForm.gracePeriodDays}
                      onChange={(e) =>
                        setStructureForm({ ...structureForm, gracePeriodDays: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => {
                      setShowModal(false);
                      resetStructureForm();
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="submit-btn" disabled={loading}>
                    <Save size={16} />
                    {loading ? 'Saving...' : editingItem ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Dialog Component */}
      <Dialog
        isOpen={dialog.isOpen}
        onClose={closeDialog}
        onConfirm={dialog.onConfirm}
        title={dialog.title}
        message={dialog.message}
        type={dialog.type}
      />

      {/* Toast Notification */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={closeToast}
        />
      )}
    </div>
  );
};

export default FeeStructure;