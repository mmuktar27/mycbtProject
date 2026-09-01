import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Search,
  Filter,
  Download,
  Printer,
  AlertCircle,
  CheckCircle,
  XCircle,
  Calendar,
  User,
  CreditCard,
  Receipt,
  Plus,
  X,
  Info
} from 'lucide-react';
import './FeeCollect.css';
import { useNavigate } from 'react-router-dom';
const FeeCollect = () => {
    const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [feeBreakdown, setFeeBreakdown] = useState(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [schoolSettings, setSchoolSettings] = useState(null);
  const [academicYears, setAcademicYears] = useState([]);
  const [academicYear, setAcademicYear] = useState('');
  const [term, setTerm] = useState('1st Term');
  
  const [paymentData, setPaymentData] = useState({
    categoryId: '',
    amountPaid: '',
    paymentMethod: 'Cash',
    transactionReference: '',
    paidBy: '',
    receivedBy: '',
    remarks: '',
    discount: 0,
    discountReason: ''
  });

  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);

  // Generate academic years based on current year
  const generateAcademicYears = (currentAcademicYear) => {
    if (!currentAcademicYear) {
      const currentYear = new Date().getFullYear();
      currentAcademicYear = `${currentYear}/${currentYear + 1}`;
    }

    const startYear = parseInt(currentAcademicYear.split('/')[0]);
    const years = [];
    
    // Generate 10 years before current year
    for (let i = 10; i > 0; i--) {
      const year = startYear - i;
      years.push(`${year}/${year + 1}`);
    }
    
    years.push(currentAcademicYear);
    
    // Add 5 years after current year
    for (let i = 1; i <= 5; i++) {
      const year = startYear + i;
      years.push(`${year}/${year + 1}`);
    }
    
    return years;
  };

  // Fetch school settings
  const fetchSchoolSettings = async () => {
    try {
      const response = await fetch('/api/school-settings');
      const data = await response.json();
      if (data.success) {
        setSchoolSettings(data.data);
        const years = generateAcademicYears(data.data.academicYear);
        setAcademicYears(years);
        setAcademicYear(data.data.academicYear);
      }
    } catch (error) {
      console.error('Error fetching school settings:', error);
      const currentYear = new Date().getFullYear();
      const fallbackYear = `${currentYear}/${currentYear + 1}`;
      const years = generateAcademicYears(fallbackYear);
      setAcademicYears(years);
      setAcademicYear(fallbackYear);
    }
  };

  useEffect(() => {
    fetchSchoolSettings();
  }, []);

  // Search students
  const handleSearch = async (value) => {
    setSearchTerm(value);
    
    if (value.length < 2) {
      setShowResults(false);
      return;
    }

    try {
      const response = await fetch(
        `/api/students?search=${value}&limit=10`
      );
      const data = await response.json();
      
      if (data.success) {
        setSearchResults(data.data);
        setShowResults(true);
      }
    } catch (error) {
      console.error('Error searching students:', error);
    }
  };

  // Select student
  const selectStudent = async (student) => {
    setSelectedStudent(student);
    setShowResults(false);
    setSearchTerm(`${student.firstName} ${student.lastName} - ${student.studentId}`);
    
    // Fetch fee breakdown
    await fetchFeeBreakdown(student.studentId);
  };

  // Fetch fee breakdown
  const fetchFeeBreakdown = async (studentId) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/fees/student-summary/${studentId}?academicYear=${academicYear}&term=${term}`
      );
      const data = await response.json();
      
      if (data.success) {
        setFeeBreakdown(data.data);
      }
    } catch (error) {
      console.error('Error fetching fee breakdown:', error);
      alert('Failed to fetch fee details');
    } finally {
      setLoading(false);
    }
  };

  // Refetch when academic year or term changes
  useEffect(() => {
    if (selectedStudent && academicYear) {
      fetchFeeBreakdown(selectedStudent.studentId);
    }
  }, [academicYear, term]);

  // Handle payment submission
  const handlePayment = async (e) => {
    e.preventDefault();
    
    if (!selectedStudent || !paymentData.categoryId) {
      alert('Please select a student and fee category');
      return;
    }

    if (!paymentData.amountPaid || parseFloat(paymentData.amountPaid) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (!paymentData.receivedBy) {
      alert('Please enter who received the payment');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/fees/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: selectedStudent.studentId,
          academicYear: academicYear,
          term: term,
          categoryId: parseInt(paymentData.categoryId),
          amountPaid: parseFloat(paymentData.amountPaid),
          paymentMethod: paymentData.paymentMethod,
          transactionReference: paymentData.transactionReference,
          paidBy: paymentData.paidBy || `${selectedStudent.guardianName}`,
          receivedBy: paymentData.receivedBy,
          remarks: paymentData.remarks,
          discount: parseFloat(paymentData.discount) || 0,
          discountReason: paymentData.discountReason
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(`Payment successful! Receipt Number: ${data.data.receiptNumber}`);
        
        // Reset form
        setPaymentData({
          categoryId: '',
          amountPaid: '',
          paymentMethod: 'Cash',
          transactionReference: '',
          paidBy: '',
          receivedBy: '',
          remarks: '',
          discount: 0,
          discountReason: ''
        });
        
        setShowPaymentForm(false);
        
        // Refresh fee breakdown
        await fetchFeeBreakdown(selectedStudent.studentId);
        
        // Open receipt in new window
        // Instead of window.open(), use:
   navigate(`/fees/receipts/${data.data.receiptNumber}`);;
      } else {
        alert(`Payment failed: ${data.message}`);
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Failed to process payment');
    } finally {
      setLoading(false);
    }
  };

  const initiatePayment = (feeItem) => {
    setPaymentData({
      ...paymentData,
      categoryId: feeItem.categoryId,
      amountPaid: feeItem.finalAmount.toString(),
      paidBy: selectedStudent?.guardianName || ''
    });
    setShowPaymentForm(true);
  };

  return (
    <div className="fee-collect-container">
      <div className="fee-collect-header">
        <div className="header-left">
          <DollarSign className="header-icon" />
          <div>
            <h1>Collect Fees</h1>
            <p>Process student fee payments</p>
          </div>
        </div>
        <div className="header-right">
          <select 
            value={academicYear} 
            onChange={(e) => setAcademicYear(e.target.value)}
            className="year-select"
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
          <select 
            value={term} 
            onChange={(e) => setTerm(e.target.value)}
            className="term-select"
          >
            <option value="1st Term">1st Term</option>
            <option value="2nd Term">2nd Term</option>
            <option value="3rd Term">3rd Term</option>
          </select>
        </div>
      </div>

      {/* Student Search */}
      <div className="search-section">
        <div className="search-box">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Search student by name, ID, or admission number..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="search-input"
          />
          {selectedStudent && (
            <button
              className="clear-btn"
              onClick={() => {
                setSelectedStudent(null);
                setSearchTerm('');
                setFeeBreakdown(null);
              }}
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showResults && searchResults.length > 0 && (
          <div className="search-results">
            {searchResults.map((student) => (
              <div
                key={student.studentId}
                className="search-result-item"
                onClick={() => selectStudent(student)}
              >
                <div className="student-info">
                  <p className="student-name">
                    {student.firstName} {student.lastName}
                  </p>
                  <p className="student-details">
                    {student.studentId} • {student.currentClass} • {student.admissionNumber}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      )}

      {/* Student Fee Breakdown */}
      {feeBreakdown && !loading && (
        <div className="fee-breakdown-section">
          {/* Student Info Card */}
          <div className="student-info-card">
            <div className="info-header">
              <User className="info-icon" />
              <h3>Student Information</h3>
            </div>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Name:</span>
                <span className="info-value">
                  {feeBreakdown.student.firstName} {feeBreakdown.student.lastName}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Student ID:</span>
                <span className="info-value">{feeBreakdown.student.studentId}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Class:</span>
                <span className="info-value">{feeBreakdown.student.className}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Admission No:</span>
                <span className="info-value">{feeBreakdown.student.admissionNumber}</span>
              </div>
            </div>
          </div>

          {/* Fee Summary */}
          <div className="fee-summary-cards">
            <div className="summary-card total-due">
              <div className="card-icon">
                <DollarSign />
              </div>
              <div className="card-content">
                <p className="card-label">Total Due</p>
                <p className="card-value">₦{feeBreakdown.summary.totalDue.toLocaleString()}</p>
              </div>
            </div>
            <div className="summary-card total-paid">
              <div className="card-icon">
                <CheckCircle />
              </div>
              <div className="card-content">
                <p className="card-label">Total Paid</p>
                <p className="card-value">₦{feeBreakdown.summary.totalPaid.toLocaleString()}</p>
              </div>
            </div>
            <div className="summary-card balance">
              <div className="card-icon">
                <AlertCircle />
              </div>
              <div className="card-content">
                <p className="card-label">Balance</p>
                <p className="card-value">₦{feeBreakdown.summary.balance.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* No Fees Message */}
          {feeBreakdown.feeBreakdown.length === 0 && (
            <div className="no-fees-message">
              <Info size={48} className="info-icon-large" />
              <h3>No Fee Structure Found</h3>
              <p>
                There are no fees configured for <strong>{feeBreakdown.student.className}</strong> in{' '}
                <strong>{academicYear}</strong>
                {term && ` - ${term}`}.
              </p>
              <p className="help-text">
                Please go to <strong>Fee Structure Management</strong> to set up fees for this class.
              </p>
            </div>
          )}

          {/* Fee Items Table */}
          {feeBreakdown.feeBreakdown.length > 0 && (
            <div className="fee-items-table">
              <h3>Fee Breakdown</h3>
              <table>
                <thead>
                  <tr>
                    <th>Fee Category</th>
                    <th>Original Amount</th>
                    <th>Exemption</th>
                    <th>Final Amount</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {feeBreakdown.feeBreakdown.map((item) => {
                    // Calculate paid amount for this category
                    const paidForCategory = feeBreakdown.payments
                      .filter(p => p.categoryId === item.categoryId)
                      .reduce((sum, p) => sum + p.amountPaid, 0);
                    
                    const isPaid = paidForCategory >= item.finalAmount;
                    const isPartiallyPaid = paidForCategory > 0 && paidForCategory < item.finalAmount;

                    return (
                      <tr key={item.id}>
                        <td>
                          <strong>{item.categoryName}</strong>
                          {item.exemption && (
                            <div className="exemption-badge">
                              {item.exemption.type} - {item.exemption.percentage}% off
                            </div>
                          )}
                        </td>
                        <td>₦{item.originalAmount.toLocaleString()}</td>
                        <td>
                          {item.exemption ? (
                            <span className="exemption-amount">
                              -₦{item.exemption.discount.toLocaleString()}
                            </span>
                          ) : (
                            <span className="no-exemption">None</span>
                          )}
                        </td>
                        <td>
                          <strong>₦{item.finalAmount.toLocaleString()}</strong>
                        </td>
                        <td>
                          {isPaid ? (
                            <span className="status-badge paid">
                              <CheckCircle size={14} /> Paid
                            </span>
                          ) : isPartiallyPaid ? (
                            <span className="status-badge partial">
                              <AlertCircle size={14} /> Partial (₦{paidForCategory.toLocaleString()})
                            </span>
                          ) : (
                            <span className="status-badge unpaid">
                              <XCircle size={14} /> Unpaid
                            </span>
                          )}
                        </td>
                        <td>
                          {!isPaid && (
                            <button
                              className="pay-btn"
                              onClick={() => initiatePayment(item)}
                            >
                              <Plus size={16} /> Pay
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Payment History */}
          {feeBreakdown.payments.length > 0 && (
            <div className="payment-history">
              <h3>Payment History</h3>
              <table>
                <thead>
                  <tr>
                    <th>Receipt No.</th>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Received By</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {feeBreakdown.payments.map((payment) => (
                    <tr key={payment.paymentId}>
                      <td>{payment.receiptNumber}</td>
                      <td>{new Date(payment.paymentDate).toLocaleDateString()}</td>
                      <td>{payment.categoryName}</td>
                      <td>₦{payment.amountPaid.toLocaleString()}</td>
                      <td>{payment.paymentMethod}</td>
                      <td>{payment.receivedBy}</td>
                      <td>
                        <button
                          className="view-receipt-btn"
                          onClick={() => window.open(`/fees/receipts/${payment.receiptNumber}`, '_blank')}
                        >
                          <Receipt size={16} /> Receipt
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Payment Form Modal */}
      {showPaymentForm && (
        <div className="modal-overlay">
          <div className="payment-modal">
            <div className="modal-header">
              <h2>Record Payment</h2>
              <button
                className="close-modal-btn"
                onClick={() => setShowPaymentForm(false)}
              >
                <X />
              </button>
            </div>

            <form onSubmit={handlePayment} className="payment-form">
              <div className="form-group">
                <label>Fee Category</label>
                <select
                  value={paymentData.categoryId}
                  onChange={(e) => setPaymentData({ ...paymentData, categoryId: e.target.value })}
                  required
                >
                  <option value="">Select category</option>
                  {feeBreakdown?.feeBreakdown.map((fee) => (
                    <option key={fee.categoryId} value={fee.categoryId}>
                      {fee.categoryName} - ₦{fee.finalAmount.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Amount Paid *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={paymentData.amountPaid}
                    onChange={(e) => setPaymentData({ ...paymentData, amountPaid: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Payment Method *</label>
                  <select
                    value={paymentData.paymentMethod}
                    onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
                    required
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Card">Card</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Mobile Money">Mobile Money</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Transaction Reference</label>
                <input
                  type="text"
                  value={paymentData.transactionReference}
                  onChange={(e) => setPaymentData({ ...paymentData, transactionReference: e.target.value })}
                  placeholder="Bank reference, receipt number, etc."
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Paid By</label>
                  <input
                    type="text"
                    value={paymentData.paidBy}
                    onChange={(e) => setPaymentData({ ...paymentData, paidBy: e.target.value })}
                    placeholder="Name of person paying"
                  />
                </div>

                <div className="form-group">
                  <label>Received By *</label>
                  <input
                    type="text"
                    value={paymentData.receivedBy}
                    onChange={(e) => setPaymentData({ ...paymentData, receivedBy: e.target.value })}
                    required
                    placeholder="Name of staff receiving payment"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Discount Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={paymentData.discount}
                    onChange={(e) => setPaymentData({ ...paymentData, discount: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Discount Reason</label>
                  <input
                    type="text"
                    value={paymentData.discountReason}
                    onChange={(e) => setPaymentData({ ...paymentData, discountReason: e.target.value })}
                    placeholder="Reason for discount"
                    disabled={!paymentData.discount || paymentData.discount === '0'}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Remarks</label>
                <textarea
                  value={paymentData.remarks}
                  onChange={(e) => setPaymentData({ ...paymentData, remarks: e.target.value })}
                  rows="3"
                  placeholder="Additional notes"
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowPaymentForm(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Process Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!selectedStudent && !loading && (
        <div className="empty-state">
          <Search size={64} className="empty-icon" />
          <h3>Search for a Student</h3>
          <p>Enter a student's name, ID, or admission number to view their fee details</p>
        </div>
      )}
    </div>
  );
};

export default FeeCollect;