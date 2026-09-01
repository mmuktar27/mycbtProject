import React, { useState, useEffect } from 'react';
import {
  Download, FileText, File, Sheet, X, Loader,
  Filter, CheckCircle, AlertCircle, Calendar, Home
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import './ExportModal.css';

const ExportModal = ({ isOpen, onClose, admissions, filters = {} }) => {
  const [exportFormat, setExportFormat] = useState('excel');
  const [selectedAdmissions, setSelectedAdmissions] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [schoolInfo, setSchoolInfo] = useState({
    schoolName: 'GOVERNMENT SECONDARY SCHOOL',
    poBox: 'P.O. BOX 111 GEMBU,',
    location: 'Sardauna Local Government Area, Taraba State',
    phoneNumber: '+234 XXX XXX XXXX',
    email: 'school@example.com',
     schoolLogo: null
  });
  const [admissionOfficer, setAdmissionOfficer] = useState('Admission Officer');
  const [admissionOfficerSignature, setAdmissionOfficerSignature] = useState(null); 
  const [exportOptions, setExportOptions] = useState({
    pageOrientation: 'portrait',
    selectedStatus: '',
    selectedClass: ''
  });

  // Fetch school info and admission officer on component mount
  useEffect(() => {
    if (isOpen) {
      fetchSchoolInfo();
      fetchAdmissionOfficer();
    }
  }, [isOpen]);

const fetchSchoolInfo = async () => {
  try {
    const response = await fetch('/api/school-settings');
    if (response.ok) {
      const data = await response.json();
      if (data.data) {
        setSchoolInfo({
          schoolName: data.data.schoolName || 'GOVERNMENT SECONDARY SCHOOL',
          poBox: data.data.poBox || 'P.O. BOX 111 GEMBU,',
          location: data.data.location || 'Sardauna Local Government Area, Taraba State',
          phoneNumber: data.data.phoneNumber || '+234 XXX XXX XXXX',
          email: data.data.email || 'school@example.com',
          schoolLogo: data.data.schoolLogo || null
        });
      }
    }
  } catch (error) {
    console.error('Error fetching school info:', error);
  }
};

const fetchAdmissionOfficer = async () => {
  try {
    // Try to get Admission Officer from staff
    const response = await fetch('/api/staff?role=Admission Officer&status=active&limit=1');
    if (response.ok) {
      const data = await response.json();
      if (data.success && data.data && data.data.length > 0) {
        const officer = data.data[0];
        setAdmissionOfficer(`${officer.firstName} ${officer.lastName}`);
        // ADD THIS - Set signature if available
        if (officer.signature) {
          setAdmissionOfficerSignature(officer.signature);
        }
        return;
      }
    }

    // If no Admission Officer, try Vice Principal
    const vpResponse = await fetch('/api/staff?role=Vice Principal (Admin)&status=active&limit=1');
    if (vpResponse.ok) {
      const vpData = await vpResponse.json();
      if (vpData.success && vpData.data && vpData.data.length > 0) {
        const vp = vpData.data[0];
        setAdmissionOfficer(`${vp.firstName} ${vp.lastName}`);
        // ADD THIS
        if (vp.signature) {
          setAdmissionOfficerSignature(vp.signature);
        }
        return;
      }
    }

    // If no Vice Principal, try Principal
    const principalResponse = await fetch('/api/staff?role=Principal&status=active&limit=1');
    if (principalResponse.ok) {
      const principalData = await principalResponse.json();
      if (principalData.success && principalData.data && principalData.data.length > 0) {
        const principal = principalData.data[0];
        setAdmissionOfficer(`${principal.firstName} ${principal.lastName}`);
        // ADD THIS
        if (principal.signature) {
          setAdmissionOfficerSignature(principal.signature);
        }
      }
    }
  } catch (error) {
    console.error('Error fetching admission officer:', error);
  }
};

  // Calculate student number based on class and academic year
  const calculateStudentNumber = (admission, allAdmissions) => {
    // Filter admissions from same class and academic year that were approved
    const sameClassYear = allAdmissions
      .filter(a => 
        a.appliedClass === admission.appliedClass && 
        a.academicYear === admission.academicYear &&
        a.status === 'approved'
      )
      .sort((a, b) => new Date(a.appliedAt) - new Date(b.appliedAt));
    
    // Find the index of current admission
    const index = sameClassYear.findIndex(a => a.id === admission.id);
    
    // Return student number (001, 002, etc.)
    return String(index + 1).padStart(3, '0');
  };

  if (!isOpen) return null;

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedAdmissions([]);
    } else {
      setSelectedAdmissions(admissions.map(a => a.id));
    }
    setSelectAll(!selectAll);
  };

  const handleSelectAdmission = (id) => {
    if (selectedAdmissions.includes(id)) {
      setSelectedAdmissions(selectedAdmissions.filter(aid => aid !== id));
      setSelectAll(false);
    } else {
      setSelectedAdmissions([...selectedAdmissions, id]);
    }
  };

  const getAdmissionsToExport = () => {
    let toExport = admissions;

    if (exportOptions.selectedStatus) {
      toExport = toExport.filter(a => a.status === exportOptions.selectedStatus);
    }

    if (exportOptions.selectedClass) {
      toExport = toExport.filter(a => a.appliedClass === exportOptions.selectedClass);
    }

    if (selectedAdmissions.length > 0) {
      toExport = toExport.filter(a => selectedAdmissions.includes(a.id));
    }

    return toExport;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Pending',
      under_review: 'Under Review',
      approved: 'Approved',
      rejected: 'Rejected'
    };
    return labels[status] || status;
  };

const getStudentNumber = (admission) => {
    // If student already enrolled (has studentNumber from API response)
    if (admission.studentNumber) {
        return admission.studentNumber;
    }
    
    // Otherwise pending - not yet enrolled
    return 'PENDING';
};

  const exportToExcel = async () => {
    try {
      setIsExporting(true);
      const data = getAdmissionsToExport();

      if (data.length === 0) {
        alert('No data to export. Please select at least one admission.');
        return;
      }

      const excelData = data.map((admission, index) => ({
        '#': index + 1,
        'Application ID': admission.applicationId,
        'First Name': admission.firstName,
        'Last Name': admission.lastName,
        'Middle Name': admission.middleName || '',
        'Date of Birth': admission.dateOfBirth,
        'Gender': admission.gender,
        'Email': admission.email || 'N/A',
        'Phone': admission.phone || 'N/A',
        'Address': admission.address,
        'State': admission.stateOfOrigin,
        'LGA': admission.lga,
        'Applied Class': admission.appliedClass,
        'Academic Year': admission.academicYear,
        'Guardian Name': admission.guardianName,
        'Guardian Phone': admission.guardianPhone,
        'Guardian Email': admission.guardianEmail || 'N/A',
        'Status': getStatusLabel(admission.status),
        'Applied Date': formatDate(admission.appliedAt),
        'Reviewed By': admission.reviewedBy || 'Pending',
        'Entrance Score': admission.entranceTestScore || 'N/A',
        'Interview Notes': admission.interviewNotes || 'N/A'
      }));

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Admissions');

      const colWidths = [
        { wch: 4 }, { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
        { wch: 8 }, { wch: 18 }, { wch: 14 }, { wch: 20 }, { wch: 12 },
        { wch: 10 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 14 }, { wch: 18 },
        { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 12 }, { wch: 20 }
      ];
      worksheet['!cols'] = colWidths;

      const fileName = `Admissions_List_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      alert(`✅ Exported ${data.length} admission(s) to Excel successfully!`);
      onClose();
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Failed to export to Excel: ' + error.message);
    } finally {
      setIsExporting(false);
    }
  };

// ==================== UPDATED generateAdmissionLetterPDF ====================
// REPLACE the entire generateAdmissionLetterPDF function in ExportModal.jsx

const generateAdmissionLetterPDF = (admission, doc, isFirstPage, allAdmissions) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPos = 15;
    const leftMargin = 20;
    const rightMargin = pageWidth - 20;

    // Get student number
    const studentNumber = admission.studentNumber || 'PENDING';
    
    // ===== KEY CHANGE: Use enrolled class/section from students table =====
    // Falls back to applied class/section if not enrolled
    const displayClass = admission.enrolledClass || admission.appliedClass;
    const displaySection = admission.enrolledSection || admission.appliedSection;

    // ==================== ADD WATERMARK LOGO ====================
    if (schoolInfo.schoolLogo) {
      try {
        // Set opacity for watermark effect
        doc.setGState(new doc.GState({ opacity: 0.1 }));
        doc.addImage(schoolInfo.schoolLogo, 'JPEG', pageWidth / 2 - 40, pageHeight / 2 - 50, 80, 100);
        doc.setGState(new doc.GState({ opacity: 1 }));
      } catch (error) {
        console.log('Could not add watermark:', error);
      }
    }

    // ==================== SCHOOL LETTERHEAD ====================

    // School logo/emblem (top left)
    if (schoolInfo.schoolLogo) {
      try {
        doc.addImage(schoolInfo.schoolLogo, 'JPEG', leftMargin, yPos, 20, 25);
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(1);
        doc.rect(leftMargin, yPos, 20, 25);
      } catch (error) {
        console.log('Could not add school logo, using placeholder:', error);
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(1);
        doc.rect(leftMargin, yPos, 20, 25);
        doc.setFontSize(7);
        doc.setFont(undefined, 'normal');
        doc.text('LOGO', leftMargin + 10, yPos + 12, { align: 'center' });
      }
    } else {
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(1);
      doc.rect(leftMargin, yPos, 20, 25);
      doc.setFontSize(7);
      doc.setFont(undefined, 'normal');
      doc.text('LOGO', leftMargin + 10, yPos + 12, { align: 'center' });
    }

    // School name (centered, large, bold)
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(schoolInfo.schoolName.toUpperCase(), pageWidth / 2, yPos + 5, { align: 'center' });

    // P.O. Box (green text, centered)
    doc.setFontSize(11);
    doc.setTextColor(0, 135, 81);
    doc.text(schoolInfo.poBox, pageWidth / 2, yPos + 13, { align: 'center' });

    // Location (centered)
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(schoolInfo.location, pageWidth / 2, yPos + 20, { align: 'center' });

    yPos += 35;

    // ==================== REFERENCE LINE ====================
    doc.setFontSize(10);
    doc.setFont(undefined, 'italic');
    doc.setTextColor(0, 0, 0);
    
    // Our Ref line
    doc.setDrawColor(0, 0, 0);
    doc.line(leftMargin, yPos, pageWidth / 2 - 5, yPos);
    doc.text('Our Ref:', leftMargin, yPos - 2);
    
    // Your Ref line
    doc.line(pageWidth / 2 + 5, yPos, rightMargin - 50, yPos);
    doc.text('Your Ref:', pageWidth / 2 + 5, yPos - 2);
    
    // Date line
    doc.line(rightMargin - 45, yPos, rightMargin, yPos);
    doc.text('Date:', rightMargin - 45, yPos - 2);
    doc.setFont(undefined, 'normal');
    doc.text(formatDate(new Date()), rightMargin - 30, yPos - 2);

    yPos += 2;

    // Decorative line (red-green) - SINGLE LINE
    doc.setDrawColor(255, 0, 0);
    doc.setLineWidth(2);
    doc.line(leftMargin, yPos, pageWidth / 2, yPos);
    doc.setDrawColor(0, 135, 81);
    doc.line(pageWidth / 2, yPos, rightMargin, yPos);

    yPos += 14;

    // ==================== ADMISSION LETTER TITLE ====================
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('ADMISSION LETTER', pageWidth / 2, yPos, { align: 'center' });

    yPos += 10;

    // ==================== STUDENT DETAILS WITH PASSPORT ====================
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    
    const fullName = `${admission.firstName} ${admission.middleName || ''} ${admission.lastName}`.trim();
    
    // Application ID
    doc.setFont(undefined, 'bold');
    doc.text('Application ID:', leftMargin, yPos);
    doc.setFont(undefined, 'normal');
    doc.text(admission.applicationId, leftMargin + 35, yPos);
    yPos += 7;
    
    // Student Name
    doc.setFont(undefined, 'bold');
    doc.text('Name:', leftMargin, yPos);
    doc.setFont(undefined, 'normal');
    doc.text(fullName, leftMargin + 18, yPos);
    
    // Add passport photo if available (right side)
    if (admission.profileImage || admission.passportPhoto) {
      try {
        const photoData = admission.profileImage || admission.passportPhoto;
        const photoX = rightMargin - 35;
        const photoY = yPos - 12;
        const photoWidth = 30;
        const photoHeight = 35;
        
        doc.addImage(photoData, 'JPEG', photoX, photoY, photoWidth, photoHeight);
        doc.setDrawColor(0, 0, 0);
        doc.rect(photoX, photoY, photoWidth, photoHeight);
      } catch (error) {
        console.log('Could not add passport photo:', error);
        const photoX = rightMargin - 35;
        const photoY = yPos - 12;
        doc.setDrawColor(0, 0, 0);
        doc.rect(photoX, photoY, 30, 35);
        doc.setFontSize(8);
        doc.text('PASSPORT', photoX + 15, photoY + 18, { align: 'center' });
      }
    }
    
    yPos += 7;
    
    // Date of Birth
    doc.setFont(undefined, 'bold');
    doc.text('Date of Birth:', leftMargin, yPos);
    doc.setFont(undefined, 'normal');
    doc.text(formatDate(admission.dateOfBirth), leftMargin + 32, yPos);
    yPos += 7;
    
    // ===== CLASS WITH SECTION (from students table) =====
    doc.setFont(undefined, 'bold');
    doc.text('Class:', leftMargin, yPos);
    doc.setFont(undefined, 'normal');
    
    // Build class display: "SS1 A" or "SS1" depending on what's available
    const classWithSection = displaySection 
      ? `${displayClass} ${displaySection}` 
      : displayClass;
    
    doc.text(classWithSection, leftMargin + 15, yPos);
    
    // Optional: Show if class was changed during enrollment
    if (admission.enrolledClass && admission.appliedClass && admission.enrolledClass !== admission.appliedClass) {
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`(changed from ${admission.appliedClass})`, leftMargin + 15, yPos + 4);
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);
    }
    yPos += 7;
    
    // Student Number in Register
    doc.setFont(undefined, 'bold');
    doc.text('Student No:', leftMargin, yPos);
    doc.setFont(undefined, 'normal');
    if (studentNumber === 'PENDING') {
        doc.setTextColor(255, 0, 0); // Red for pending
        doc.text('NOT YET ENROLLED', leftMargin + 28, yPos);
        doc.setTextColor(0, 0, 0); // Reset color
    } else {
        doc.text(studentNumber, leftMargin + 28, yPos);
    }
    yPos += 10;

    // ==================== PROVISIONAL OFFER ====================
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    
    const academicSession = admission.academicYear || `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`;
    const provisionalOfferText = `PROVISIONAL OFFER OF ADMISSION ${academicSession} ACADEMIC SESSION`;
    
    doc.text(provisionalOfferText, pageWidth / 2, yPos, { align: 'center' });
    const textWidth = doc.getTextWidth(provisionalOfferText);

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(pageWidth / 2 - textWidth / 2, yPos + 2, pageWidth / 2 + textWidth / 2, yPos + 2);
    yPos += 10;

    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    
    // Use enrolled class in the offer text
    const admittedClass = displayClass || 'SSS _______';
    const offerText = `With pleasure I wish to inform you that you have been offered provisional admission into ${admittedClass} of the school.`;
    doc.text(offerText, leftMargin, yPos, { maxWidth: rightMargin - leftMargin });
    yPos += 15;

    // ==================== ADMISSION REQUIREMENTS ====================
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('ADMISSION REQUIREMENTS', pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;

    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('Photocopies of:', leftMargin, yPos);
    yPos += 8;

    doc.setFont(undefined, 'normal');
    const requirements = [
      '1. BECE or testimonial certificate',
      '2. Two passport photographs',
      '3. Certificate of birth',
      '4. Office file',
      '5. One plastic bucket (both females and males)',
      '6. One big broom (both females and males)',
      '7. One hoe (for females) one cutlass (for males)',
      '8. National Identity Number (NIN)'
    ];

    requirements.forEach(req => {
      doc.text(req, leftMargin + 5, yPos);
      yPos += 7;
    });

    yPos += 15;

    // ==================== CLOSING & DIGITAL SIGNATURE ====================
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    
    doc.text('We look forward to welcoming you to our school community.', leftMargin, yPos);
    yPos += 15;

    // Digital signature section (right-aligned)
    const signatureX = pageWidth - 80;

    doc.setLineWidth(0.5);
    doc.setDrawColor(0, 0, 0);

    if (admissionOfficerSignature) {
      try {
        doc.addImage(admissionOfficerSignature, 'PNG', signatureX, yPos, 40, 15);
        yPos += 18;
      } catch (error) {
        console.log('Could not add signature image:', error);
        doc.line(signatureX, yPos + 10, signatureX + 50, yPos + 10);
        yPos += 15;
      }
    } else {
      doc.line(signatureX, yPos + 10, signatureX + 50, yPos + 10);
      yPos += 15;
    }

    doc.setFont(undefined, 'bold');
    doc.text(admissionOfficer, signatureX, yPos);
    yPos += 5;

    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.text('Admission Officer', signatureX, yPos);
  };

 
const exportToPDF = async () => {
    try {
        setIsExporting(true);
        const data = getAdmissionsToExport();

        if (data.length === 0) {
            alert('No data to export. Please select at least one admission.');
            return;
        }

        // Create PDF document
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        // ==================== FETCH STUDENT DATA FROM STUDENTS TABLE ====================
        // Enrich admission data with:
        // 1. Student numbers
        // 2. ENROLLED class (may be different from applied class)
        // 3. ENROLLED section (may be different from applied section)
        console.log(`📄 Exporting ${data.length} admissions, fetching student details...`);

        const enrichedData = await Promise.all(
            data.map(async (admission) => {
                try {
                    // Search for student using admissionSource = applicationId
                    // Students table stores admissionSource which links back to applicationId
                    const response = await fetch(`/api/students?search=${admission.applicationId}`);
                    const result = await response.json();
                    
                    if (result.success && result.data && result.data.length > 0) {
                        const student = result.data[0];
                        console.log(`✅ Found student for ${admission.applicationId}:`, {
                            studentId: student.studentId,
                            studentNumber: student.studentNumber,
                            currentClass: student.currentClass,      // ENROLLED class
                            section: student.section,                 // ENROLLED section
                            admissionClass: student.admissionClass    // Original applied class
                        });
                        
                        return {
                            ...admission,
                            studentNumber: student.studentNumber || 'PENDING',
                            // ===== KEY: Use enrolled class/section from students table =====
                            enrolledClass: student.currentClass || admission.appliedClass,
                            enrolledSection: student.section || admission.appliedSection,
                            // Keep applied for reference
                            appliedClass: admission.appliedClass,
                            appliedSection: admission.appliedSection
                        };
                    }
                    
                    // If not found as student yet, use applied class/section
                    console.log(`⏳ No student record yet for ${admission.applicationId} (status: ${admission.status})`);
                    return {
                        ...admission,
                        studentNumber: 'PENDING',
                        enrolledClass: admission.appliedClass,
                        enrolledSection: admission.appliedSection,
                        appliedClass: admission.appliedClass,
                        appliedSection: admission.appliedSection
                    };
                } catch (error) {
                    console.log('❌ Error fetching student for', admission.applicationId, error);
                    return {
                        ...admission,
                        studentNumber: 'PENDING',
                        enrolledClass: admission.appliedClass,
                        enrolledSection: admission.appliedSection,
                        appliedClass: admission.appliedClass,
                        appliedSection: admission.appliedSection
                    };
                }
            })
        );

        console.log(`📊 Enriched data - ready to generate ${enrichedData.length} letters with enrolled classes`);

        // Generate individual admission letters
        enrichedData.forEach((admission, index) => {
            if (index > 0) {
                doc.addPage(); // Add new page for each admission after the first
            }
            generateAdmissionLetterPDF(admission, doc, index === 0, enrichedData);
        });

        // Save PDF
        const fileName = `Admission_Letters_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);

        console.log(`✅ PDF saved:`, fileName);
        alert(`✅ Exported ${enrichedData.length} admission letter(s) to PDF successfully!`);
        onClose();
    } catch (error) {
        console.error('Error exporting to PDF:', error);
        alert('Failed to export to PDF: ' + error.message);
    } finally {
        setIsExporting(false);
    }
};


  const exportToCSV = async () => {
    try {
      setIsExporting(true);
      const data = getAdmissionsToExport();

      if (data.length === 0) {
        alert('No data to export. Please select at least one admission.');
        return;
      }

      const headers = [
        'Application ID', 'First Name', 'Last Name', 'Middle Name', 'Date of Birth', 'Gender',
        'Email', 'Phone', 'Address', 'State', 'LGA', 'Applied Class', 'Academic Year',
        'Guardian Name', 'Guardian Phone', 'Guardian Email', 'Status',
        'Applied Date', 'Reviewed By', 'Entrance Score', 'Interview Notes'
      ];

      const csvContent = [
        headers.join(','),
        ...data.map(admission =>
          [
            admission.applicationId, admission.firstName, admission.lastName,
            admission.middleName || '', admission.dateOfBirth, admission.gender,
            `"${admission.email || ''}"`, `"${admission.phone || ''}"`,
            `"${admission.address}"`, admission.stateOfOrigin, admission.lga,
            admission.appliedClass, admission.academicYear,
            `"${admission.guardianName}"`, `"${admission.guardianPhone}"`,
            `"${admission.guardianEmail || ''}"`, getStatusLabel(admission.status),
            formatDate(admission.appliedAt), admission.reviewedBy || 'Pending',
            admission.entranceTestScore || 'N/A', `"${admission.interviewNotes || ''}"`
          ].join(',')
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `Admissions_List_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      alert(`✅ Exported ${data.length} admission(s) to CSV successfully!`);
      onClose();
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      alert('Failed to export to CSV: ' + error.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExport = () => {
    if (exportFormat === 'excel') {
      exportToExcel();
    } else if (exportFormat === 'pdf') {
      exportToPDF();
    } else if (exportFormat === 'csv') {
      exportToCSV();
    }
  };

  const admissionsToExport = getAdmissionsToExport();
  const uniqueStatuses = [...new Set(admissions.map(a => a.status))];
  const uniqueClasses = [...new Set(admissions.map(a => a.appliedClass))];

  return (
    <div className="export-modal-overlay" onClick={onClose}>
      <div className="export-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="export-modal-header">
          <h2>Export Admissions</h2>
          <button className="export-close-btn" onClick={onClose} disabled={isExporting}>
            <X size={24} />
          </button>
        </div>

        <div className="export-modal-body">
          {/* Export Format Selection */}
          <div className="export-section">
            <h3>Select Export Format</h3>
            <div className="export-formats">
              <label className={`format-option ${exportFormat === 'excel' ? 'active' : ''}`}>
                <input
                  type="radio"
                  value="excel"
                  checked={exportFormat === 'excel'}
                  onChange={(e) => setExportFormat(e.target.value)}
                  disabled={isExporting}
                />
                <Sheet size={24} />
                <span>Excel List (.xlsx)</span>
              </label>

              <label className={`format-option ${exportFormat === 'pdf' ? 'active' : ''}`}>
                <input
                  type="radio"
                  value="pdf"
                  checked={exportFormat === 'pdf'}
                  onChange={(e) => setExportFormat(e.target.value)}
                  disabled={isExporting}
                />
                <FileText size={24} />
                <span>Admission Letters (.pdf)</span>
              </label>

              <label className={`format-option ${exportFormat === 'csv' ? 'active' : ''}`}>
                <input
                  type="radio"
                  value="csv"
                  checked={exportFormat === 'csv'}
                  onChange={(e) => setExportFormat(e.target.value)}
                  disabled={isExporting}
                />
                <File size={24} />
                <span>CSV List (.csv)</span>
              </label>
            </div>
          </div>

          {/* School Info Preview for PDF */}
          {exportFormat === 'pdf' && (
            <div className="export-section school-preview">
              <h3><Home size={18} /> School Information (Letterhead)</h3>
              <div className="school-info">
                <p><strong>School:</strong> {schoolInfo.schoolName}</p>
                <p><strong>P.O. Box:</strong> {schoolInfo.poBox}</p>
                <p><strong>Location:</strong> {schoolInfo.location}</p>
                <p><strong>Admission Officer:</strong> {admissionOfficer}</p>
                <p className="info-note">📄 Each admission will generate a separate letter with student data pre-filled and sequential numbering</p>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="export-section">
            <h3><Filter size={18} /> Filter Data</h3>
            <div className="export-filters">
              <div className="filter-group">
                <label>By Status</label>
                <select
                  value={exportOptions.selectedStatus}
                  onChange={(e) => setExportOptions({ ...exportOptions, selectedStatus: e.target.value })}
                  disabled={isExporting}
                >
                  <option value="">All Statuses</option>
                  {uniqueStatuses.map(status => (
                    <option key={status} value={status}>
                      {status.replace('_', ' ').toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>By Class</label>
                <select
                  value={exportOptions.selectedClass}
                  onChange={(e) => setExportOptions({ ...exportOptions, selectedClass: e.target.value })}
                  disabled={isExporting}
                >
                  <option value="">All Classes</option>
                  {uniqueClasses.map(cls => (
                    <option key={cls} value={cls}>
                      {cls}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Select Specific Admissions */}
          <div className="export-section">
            <div className="admissions-select-header">
              <h3>Select Admissions ({admissionsToExport.length} available)</h3>
              <label className="select-all-checkbox">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAll}
                  disabled={isExporting}
                />
                Select All
              </label>
            </div>

            <div className="admissions-list">
              {admissionsToExport.length === 0 ? (
                <p className="no-admissions">No admissions match the selected filters.</p>
              ) : (
                admissionsToExport.map((admission) => (
                  <div key={admission.id} className="admission-item">
                    <input
                      type="checkbox"
                      checked={selectedAdmissions.includes(admission.id)}
                      onChange={() => handleSelectAdmission(admission.id)}
                      disabled={isExporting}
                    />
                    <div className="admission-details">
                      <div className="admission-name">
                        {admission.firstName} {admission.lastName}
                      </div>
                      <div className="admission-meta">
                        <span className="app-id">{admission.applicationId}</span>
                        <span className="class-badge">{admission.appliedClass}</span>
                        <span className="year-badge">{admission.academicYear}</span>
                        <span className={`status-badge status-${admission.status}`}>
                          {getStatusLabel(admission.status)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Export Summary */}
          <div className="export-summary">
            <p>
              {exportFormat === 'pdf' ? (
                <>
                  📄 Generating {selectedAdmissions.length > 0 ? selectedAdmissions.length : admissionsToExport.length} individual admission letter(s) with sequential student numbers
                </>
              ) : (
                <>
                  📊 Exporting {selectedAdmissions.length > 0 ? selectedAdmissions.length : admissionsToExport.length} admission(s)
                </>
              )}
            </p>
          </div>
        </div>

        <div className="export-modal-footer">
          <button
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isExporting}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleExport}
            disabled={isExporting || (selectedAdmissions.length === 0 && admissionsToExport.length === 0)}
          >
            {isExporting ? (
              <>
                <Loader size={18} className="spinner-inline" />
                Exporting...
              </>
            ) : (
              <>
                <Download size={18} />
                {exportFormat === 'pdf' ? 'Generate Letters' : `Export ${exportFormat.toUpperCase()}`}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;