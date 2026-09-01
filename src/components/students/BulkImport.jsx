import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Upload, Download, FileText, CheckCircle, XCircle,
  AlertTriangle, ArrowLeft, FileSpreadsheet
} from 'lucide-react';
import './BulkImport.css';

const BulkImport = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [academicYear, setAcademicYear] = useState(
    new Date().getFullYear() + '/' + (new Date().getFullYear() + 1)
  );

  const downloadTemplate = () => {
    const headers = [
      'firstName', 'lastName', 'middleName', 'dateOfBirth', 'gender',
      'email', 'phone', 'parentPhone', 'parentEmail', 'address',
      'stateOfOrigin', 'lga', 'nationality', 'religion', 'bloodGroup',
      'currentClass', 'admissionClass', 'section', 'rollNumber',
      'guardianName', 'guardianRelationship', 'guardianPhone',
      'guardianEmail', 'guardianAddress', 'guardianOccupation',
      'previousSchool', 'previousClass'
    ];

    const sampleData = [
      [
        'John', 'Doe', 'Michael', '2010-05-15', 'Male',
        'john@email.com', '08012345678', '08098765432', 'parent@email.com',
        '123 Main Street, Lagos', 'Lagos', 'Ikeja', 'Nigerian', 'Christianity', 'O+',
        'JSS 1', 'JSS 1', 'A', '1',
        'Mr. Doe', 'Father', '08098765432',
        'parent@email.com', '123 Main Street, Lagos', 'Engineer',
        'ABC Primary School', 'Primary 6'
      ]
    ];

    const csv = [headers, ...sampleData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_import_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        alert('Please upload a CSV file');
        return;
      }
      setFile(selectedFile);
      setFileName(selectedFile.name);
      parseCSV(selectedFile);
    }
  };

  const parseCSV = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      const students = [];
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          const values = lines[i].split(',').map(v => v.trim());
          const student = {};
          headers.forEach((header, index) => {
            student[header] = values[index] || '';
          });
          students.push(student);
        }
      }
      
      setPreview({
        total: students.length,
        sample: students.slice(0, 5),
        data: students
      });
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!preview) {
      alert('Please upload a file first');
      return;
    }

    if (!academicYear) {
      alert('Please select academic year');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post('/api/students/bulk-import', {
        students: preview.data,
        academicYear: academicYear
      });

      if (response.data.success) {
        setImportResult(response.data.data);
      }
    } catch (error) {
      console.error('Error importing students:', error);
      alert('Import failed. Please check the file format and try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetImport = () => {
    setFile(null);
    setFileName('');
    setPreview(null);
    setImportResult(null);
  };

  return (
    <div className="bulk-import-container">
      <div className="page-header">
        <button onClick={() => navigate('/students/all')} className="btn-back">
          <ArrowLeft size={18} /> Back
        </button>
        <h1><Upload size={28} /> Bulk Import Students</h1>
        <p className="subtitle">Import multiple students from CSV file</p>
      </div>

      {!importResult ? (
        <>
          <div className="import-instructions">
            <h3><FileText size={20} /> Instructions</h3>
            <ol>
              <li>Download the CSV template below</li>
              <li>Fill in student information (one student per row)</li>
              <li>Ensure all required fields are complete</li>
              <li>Upload the completed CSV file</li>
              <li>Review the preview</li>
              <li>Click "Import Students" to complete</li>
            </ol>
            <button onClick={downloadTemplate} className="btn btn-primary">
              <Download size={18} /> Download Template
            </button>
          </div>

          <div className="upload-section">
            <h3>Upload CSV File</h3>
            <div className="academic-year-selector">
              <label>Academic Year:</label>
              <input
                type="text"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                placeholder="2024/2025"
              />
            </div>

            <div className="file-upload-area">
              <input
                type="file"
                id="csvFile"
                accept=".csv"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <label htmlFor="csvFile" className="upload-box">
                {fileName ? (
                  <>
                    <FileSpreadsheet size={48} className="upload-icon" />
                    <p className="file-name">{fileName}</p>
                    <p className="upload-hint">Click to change file</p>
                  </>
                ) : (
                  <>
                    <Upload size={48} className="upload-icon" />
                    <p>Click to upload or drag and drop</p>
                    <p className="upload-hint">CSV files only</p>
                  </>
                )}
              </label>
            </div>
          </div>

          {preview && (
            <div className="preview-section">
              <h3><FileText size={20} /> Preview</h3>
              <div className="preview-stats">
                <div className="preview-stat">
                  <FileSpreadsheet size={24} />
                  <div>
                    <h4>{preview.total}</h4>
                    <p>Total Records</p>
                  </div>
                </div>
              </div>

              <div className="preview-table">
                <h4>Sample Data (first 5 rows):</h4>
                <table>
                  <thead>
                    <tr>
                      <th>First Name</th>
                      <th>Last Name</th>
                      <th>Date of Birth</th>
                      <th>Gender</th>
                      <th>Class</th>
                      <th>Parent Phone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.sample.map((student, index) => (
                      <tr key={index}>
                        <td>{student.firstName}</td>
                        <td>{student.lastName}</td>
                        <td>{student.dateOfBirth}</td>
                        <td>{student.gender}</td>
                        <td>{student.currentClass}</td>
                        <td>{student.parentPhone}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="import-actions">
                <button onClick={resetImport} className="btn btn-secondary">
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  className="btn btn-success"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="spinner-small"></div> Importing...
                    </>
                  ) : (
                    <>
                      <Upload size={18} /> Import {preview.total} Students
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="import-result">
          <div className="result-header">
            <CheckCircle size={48} className="result-icon success" />
            <h2>Import Complete</h2>
          </div>

          <div className="result-stats">
            <div className="result-stat success">
              <CheckCircle size={24} />
              <div>
                <h3>{importResult.imported.length}</h3>
                <p>Successfully Imported</p>
              </div>
            </div>
            <div className="result-stat failed">
              <XCircle size={24} />
              <div>
                <h3>{importResult.failed.length}</h3>
                <p>Failed</p>
              </div>
            </div>
            <div className="result-stat total">
              <FileSpreadsheet size={24} />
              <div>
                <h3>{importResult.total}</h3>
                <p>Total Processed</p>
              </div>
            </div>
          </div>

          {importResult.imported.length > 0 && (
            <div className="result-section">
              <h3><CheckCircle size={20} /> Successfully Imported</h3>
              <div className="result-list">
                {importResult.imported.map((item, index) => (
                  <div key={index} className="result-item success">
                    <CheckCircle size={16} />
                    <span>Row {item.row}: {item.name} - ID: {item.studentId}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {importResult.failed.length > 0 && (
            <div className="result-section">
              <h3><AlertTriangle size={20} /> Failed Imports</h3>
              <div className="result-list">
                {importResult.failed.map((item, index) => (
                  <div key={index} className="result-item failed">
                    <XCircle size={16} />
                    <div>
                      <p>Row {item.row}: {item.name}</p>
                      <p className="error-detail">{item.error}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="result-actions">
            <button onClick={resetImport} className="btn btn-secondary">
              Import More
            </button>
            <button
              onClick={() => navigate('/students/all')}
              className="btn btn-primary"
            >
              View All Students
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkImport;