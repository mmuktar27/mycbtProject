import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, Download, CheckCircle, ArrowLeft } from 'lucide-react';
import './ReceiptPrint.css';

const ReceiptPrint = () => {
  const { receiptNumber: encodedReceiptNumber } = useParams();
  const navigate = useNavigate();
  
  // ✅ Decode the receipt number
  const receiptNumber = encodedReceiptNumber ? decodeURIComponent(encodedReceiptNumber) : null;
  
  const [receipt, setReceipt] = useState(null);
  const [schoolInfo, setSchoolInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // ✅ Only fetch if receiptNumber exists
    if (receiptNumber) {
      fetchReceipt();
    } else {
      setLoading(false);
      setError('No receipt number provided');
    }
  }, [receiptNumber]);

  const fetchReceipt = async () => {
    try {
      console.log('Fetching receipt:', receiptNumber);
      
      const response = await fetch(`/api/fees/receipts/${encodeURIComponent(receiptNumber)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Receipt data received:', data);

      if (data.success) {
        setReceipt(data.data.payment);
        setSchoolInfo(data.data.schoolInfo);
        setError(null);
      } else {
        setError(data.message || 'Receipt not found');
        console.error('Receipt not found:', data.message);
      }
    } catch (error) {
      console.error('Error fetching receipt:', error);
      setError('Failed to load receipt: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="receipt-loading">
        <div className="spinner"></div>
        <p>Loading receipt...</p>
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="receipt-error">
        <h2>Receipt Not Found</h2>
        <p>{error || 'The requested receipt could not be found.'}</p>
        <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button onClick={() => navigate('/fees/history')} className="close-btn">
            <ArrowLeft size={16} /> Back to Payment History
          </button>
          <button onClick={() => window.close()} className="close-btn">
            Close Window
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="receipt-print-container">
      {/* Print Actions */}
      <div className="print-actions no-print">
        <button className="print-btn" onClick={handlePrint}>
          <Printer size={20} /> Print Receipt
        </button>
        <button className="download-btn" onClick={handleDownload}>
          <Download size={20} /> Save as PDF
        </button>
      </div>

      {/* Receipt Content */}
      <div className="receipt-content">
        {/* Header */}
        <div className="receipt-header">
          {schoolInfo?.schoolLogo && (
            <img src={schoolInfo.schoolLogo} alt="School Logo" className="school-logo" />
          )}
          <h1 className="school-name">{schoolInfo?.schoolName || 'SCHOOL NAME'}</h1>
          <div className="school-details">
            {schoolInfo?.address && <p>{schoolInfo.address}</p>}
            {schoolInfo?.location && <p>{schoolInfo.location}</p>}
            <p>
              {schoolInfo?.phoneNumber && `Tel: ${schoolInfo.phoneNumber}`}
              {schoolInfo?.phoneNumber && schoolInfo?.email && ' | '}
              {schoolInfo?.email && `Email: ${schoolInfo.email}`}
            </p>
          </div>
        </div>

        {/* Receipt Title */}
        <div className="receipt-title">
          <CheckCircle size={24} style={{ display: 'inline-block', marginRight: '8px', verticalAlign: 'middle' }} />
          PAYMENT RECEIPT
        </div>

        {/* Receipt Information */}
        <div className="receipt-info">
          <div className="info-row">
            <span className="info-label">Receipt Number</span>
            <span className="info-value">{receipt.receiptNumber}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Payment Date</span>
            <span className="info-value">
              {new Date(receipt.paymentDate).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
              })}
            </span>
          </div>
          <div className="info-row">
            <span className="info-label">Student Name</span>
            <span className="info-value">{receipt.studentName}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Student ID</span>
            <span className="info-value">{receipt.studentId}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Class</span>
            <span className="info-value">{receipt.className}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Academic Year</span>
            <span className="info-value">
              {receipt.academicYear} {receipt.term ? `- ${receipt.term}` : ''}
            </span>
          </div>
        </div>

        {/* Payment Details */}
        <div className="payment-details">
          <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem', fontWeight: '600' }}>Payment Details</h3>
          
          <div className="detail-row">
            <span className="detail-label">Fee Category</span>
            <span className="detail-value">{receipt.categoryName}</span>
          </div>
          
          <div className="detail-row">
            <span className="detail-label">Amount Due</span>
            <span className="detail-value">₦{receipt.amountDue.toLocaleString()}</span>
          </div>
          
          {receipt.discount > 0 && (
            <div className="detail-row">
              <span className="detail-label">Discount</span>
              <span className="detail-value" style={{ color: '#10b981' }}>
                -₦{receipt.discount.toLocaleString()}
                {receipt.discountReason && (
                  <span style={{ fontSize: '0.75rem', color: '#6b7280', display: 'block' }}>
                    ({receipt.discountReason})
                  </span>
                )}
              </span>
            </div>
          )}
          
          {receipt.lateFine > 0 && (
            <div className="detail-row">
              <span className="detail-label">Late Payment Fine</span>
              <span className="detail-value" style={{ color: '#ef4444' }}>
                +₦{receipt.lateFine.toLocaleString()}
              </span>
            </div>
          )}
          
          <div className="detail-row total-row">
            <span className="detail-label" style={{ fontSize: '1.125rem' }}>Amount Paid</span>
            <span className="detail-value total-value">₦{receipt.amountPaid.toLocaleString()}</span>
          </div>
          
          {receipt.balance !== 0 && (
            <div className="detail-row">
              <span className="detail-label">Balance</span>
              <span className="detail-value" style={{ color: receipt.balance > 0 ? '#ef4444' : '#10b981' }}>
                ₦{Math.abs(receipt.balance).toLocaleString()}
                {receipt.balance > 0 ? ' (Outstanding)' : ' (Overpayment)'}
              </span>
            </div>
          )}
          
          <div className="detail-row">
            <span className="detail-label">Payment Method</span>
            <span className="detail-value">{receipt.paymentMethod}</span>
          </div>
          
          {receipt.transactionReference && (
            <div className="detail-row">
              <span className="detail-label">Transaction Reference</span>
              <span className="detail-value">{receipt.transactionReference}</span>
            </div>
          )}
          
          {receipt.paidBy && (
            <div className="detail-row">
              <span className="detail-label">Paid By</span>
              <span className="detail-value">{receipt.paidBy}</span>
            </div>
          )}
          
          <div className="detail-row">
            <span className="detail-label">Received By</span>
            <span className="detail-value">{receipt.receivedBy}</span>
          </div>
          
          {receipt.remarks && (
            <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#f9fafb', borderRadius: '6px' }}>
              <span className="detail-label" style={{ display: 'block', marginBottom: '0.25rem' }}>Remarks</span>
              <span style={{ fontSize: '0.875rem', color: '#374151' }}>{receipt.remarks}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="receipt-footer">
          <div className="signature-section">
            <div className="signature-box">
              <div className="signature-line">Cashier's Signature</div>
            </div>
            <div className="signature-box">
              <div className="signature-line">Authorized Signature</div>
            </div>
          </div>

          <p className="receipt-note">
            This is an official receipt. Please retain for your records.
            <br />
            For any queries, please contact the accounts office.
          </p>

          <div style={{ marginTop: '2rem', padding: '1rem', background: '#f9fafb', borderRadius: '8px', textAlign: 'center' }}>
            <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>
              Generated on {new Date().toLocaleDateString('en-GB')} at {new Date().toLocaleTimeString('en-GB')}
            </p>
            <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0.25rem 0 0 0' }}>
              Receipt ID: {receipt.paymentId}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptPrint;