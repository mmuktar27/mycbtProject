import React, { useState, useEffect } from 'react';
import {
    FileText, Download, Printer, RefreshCw, AlertCircle,
    CheckCircle, Users, BookOpen, Filter, Eye, ChevronDown
} from 'lucide-react';
import jsPDF from 'jspdf';
import './Results.css';

const API = '/api';

export default function GenerateReportCards() {
    // ── Filter state ──
    const [academicYears, setAcademicYears] = useState([]);
    const [classes, setClasses]             = useState([]);
    const [students, setStudents]           = useState([]);

    const [selYear,  setSelYear]  = useState('');
    const [selTerm,  setSelTerm]  = useState('First Term');
    const [selClass, setSelClass] = useState('');
    const [selStudent, setSelStudent] = useState(''); // '' = all

    // ── Data state ──
    const [reportData, setReportData]   = useState([]);
    const [meta, setMeta]               = useState(null);
    const [schoolInfo, setSchoolInfo]   = useState(null);
    const [principal, setPrincipal]     = useState('The Principal');
    const [principalSig, setPrincipalSig] = useState(null);

    const [loading,   setLoading]   = useState(false);
    const [generating, setGenerating] = useState(false);
    const [alert, setAlert]         = useState(null);
    const [previewStudent, setPreviewStudent] = useState(null);

    // ── Grading lookup (for remark key) ──
    const gradeColors = { A:'#16a34a', B:'#2563eb', C:'#d97706', D:'#ea580c', F:'#dc2626' };

    useEffect(() => {
        fetchInit();
    }, []);

    useEffect(() => {
        if (selYear && selTerm) fetchClasses();
    }, [selYear, selTerm]);

    useEffect(() => {
        if (selYear && selTerm && selClass) fetchStudents();
        else setStudents([]);
    }, [selYear, selTerm, selClass]);

    // ── Fetch helpers ──
    async function fetchInit() {
        try {
            const [yearRes, schoolRes] = await Promise.all([
                fetch(`${API}/reportcards/academic-years`),
                fetch(`${API}/school-settings`)
            ]);
            const [yearData, schoolData] = await Promise.all([yearRes.json(), schoolRes.json()]);
            if (yearData.success)   setAcademicYears(yearData.data);
            if (schoolData.success) setSchoolInfo(schoolData.data);

            // Fetch principal for signature block
            const pRes = await fetch(`${API}/staff?role=Principal&status=active&limit=1`);
            const pData = await pRes.json();
            if (pData.success && pData.data?.length > 0) {
                const p = pData.data[0];
                setPrincipal(`${p.firstName} ${p.lastName}`);
                if (p.signature) setPrincipalSig(p.signature);
            }
        } catch (e) { showAlert('error', 'Failed to load initial data'); }
    }

    async function fetchClasses() {
        try {
            const res  = await fetch(`${API}/reportcards/classes?academicYear=${selYear}&term=${encodeURIComponent(selTerm)}`);
            const data = await res.json();
            if (data.success) setClasses(data.data);
        } catch (e) { showAlert('error', 'Failed to load classes'); }
    }

    async function fetchStudents() {
        try {
            const res  = await fetch(`${API}/reportcards/students?academicYear=${selYear}&term=${encodeURIComponent(selTerm)}&classId=${selClass}`);
            const data = await res.json();
            if (data.success) setStudents(data.data);
        } catch (e) { showAlert('error', 'Failed to load students'); }
    }

    async function fetchReportData() {
        if (!selYear || !selTerm || !selClass) return showAlert('error', 'Select year, term and class first');
        setLoading(true);
        try {
            let url = `${API}/reportcards/generate?academicYear=${selYear}&term=${encodeURIComponent(selTerm)}&classId=${selClass}`;
            if (selStudent) url += `&studentId=${selStudent}`;
            const res  = await fetch(url);
            const data = await res.json();
            if (data.success) {
                setReportData(data.data);
                setMeta(data.meta);
                if (data.data.length === 0) showAlert('error', 'No approved results found for this selection');
                else showAlert('success', `Loaded ${data.data.length} student(s) — ${data.meta.subjectCount} subject(s)`);
            } else showAlert('error', data.message);
        } catch (e) { showAlert('error', e.message); }
        setLoading(false);
    }

    function showAlert(type, msg) {
        setAlert({ type, msg });
        setTimeout(() => setAlert(null), 5000);
    }

    // ────────────────────────────────────────────────────────────────────────
    // PDF GENERATION  (mirrors ExportModal letterhead style)
    // ────────────────────────────────────────────────────────────────────────
    function generateReportCardPDF(student, doc, isFirst) {
        const pageWidth  = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const L = 15;   // left margin
        const R = pageWidth - 15; // right edge
        let y = 12;

        const school = schoolInfo || {};

        // ── WATERMARK ──
        if (school.schoolLogo) {
            try {
                doc.setGState(new doc.GState({ opacity: 0.08 }));
                doc.addImage(school.schoolLogo, 'JPEG', pageWidth / 2 - 40, pageHeight / 2 - 50, 80, 100);
                doc.setGState(new doc.GState({ opacity: 1.0 }));
            } catch (_) {}
        }

        // ── LOGO (top-left) ──
        if (school.schoolLogo) {
            try {
                doc.addImage(school.schoolLogo, 'JPEG', L, y, 22, 28);
                doc.setDrawColor(0); doc.setLineWidth(0.5);
                doc.rect(L, y, 22, 28);
            } catch (_) {
                doc.rect(L, y, 22, 28);
                doc.setFontSize(7); doc.text('LOGO', L + 11, y + 14, { align: 'center' });
            }
        } else {
            doc.setDrawColor(0); doc.setLineWidth(0.5);
            doc.rect(L, y, 22, 28);
            doc.setFontSize(7); doc.text('LOGO', L + 11, y + 14, { align: 'center' });
        }

        // ── SCHOOL NAME ──
        doc.setFontSize(15); doc.setFont(undefined, 'bold'); doc.setTextColor(0, 0, 0);
        doc.text((school.schoolName || 'SCHOOL NAME').toUpperCase(), pageWidth / 2, y + 7, { align: 'center' });

        // P.O. Box (green)
        doc.setFontSize(10); doc.setFont(undefined, 'normal'); doc.setTextColor(0, 135, 81);
        doc.text(school.poBox || '', pageWidth / 2, y + 14, { align: 'center' });

        // Location
        doc.setTextColor(0, 0, 0); doc.setFontSize(9);
        doc.text(school.location || '', pageWidth / 2, y + 20, { align: 'center' });

        y += 32;

        // ── REF / DATE BAR (same as admission letter) ──
        doc.setFontSize(9); doc.setFont(undefined, 'italic');
        doc.setDrawColor(0);
        doc.line(L, y, pageWidth / 2 - 5, y);
        doc.text('Our Ref:', L, y - 2);
        doc.line(pageWidth / 2 + 5, y, R - 45, y);
        doc.text('Your Ref:', pageWidth / 2 + 5, y - 2);
        doc.line(R - 40, y, R, y);
        doc.text('Date:', R - 40, y - 2);
        doc.setFont(undefined, 'normal');
        doc.text(new Date().toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' }), R - 26, y - 2);

        y += 2;

        // ── DECORATIVE LINE (red | green) ──
        doc.setLineWidth(2.5);
        doc.setDrawColor(220, 20, 60);
        doc.line(L, y, pageWidth / 2, y);
        doc.setDrawColor(0, 135, 81);
        doc.line(pageWidth / 2, y, R, y);
        doc.setLineWidth(0.5);
        y += 10;

        // ── TITLE ──
        doc.setFontSize(13); doc.setFont(undefined, 'bold'); doc.setTextColor(0, 0, 0);
        doc.text('STUDENT REPORT CARD', pageWidth / 2, y, { align: 'center' });
        const tw = doc.getTextWidth('STUDENT REPORT CARD');
        doc.line(pageWidth / 2 - tw / 2, y + 1, pageWidth / 2 + tw / 2, y + 1);
        y += 9;

        doc.setFontSize(10); doc.setFont(undefined, 'normal');
        doc.text(`${meta?.term || selTerm}  ·  ${meta?.academicYear || selYear} Academic Session`, pageWidth / 2, y, { align: 'center' });
        y += 8;

        // ── STUDENT DETAILS ROW ──
        const detailLeft  = L;
        const detailRight = R - 38;  // leave space for passport

        const detailLines = [
            ['Name:',        student.studentName],
            ['Class:',       `${meta?.className || ''} ${student.section ? `(${student.section})` : ''}`],
            ['Student No:',  student.studentNumber || 'N/A'],
            ['Gender:',      student.gender || 'N/A'],
            ['Date of Birth:', student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString('en-NG') : 'N/A'],
        ];

        const detailStartY = y;
        detailLines.forEach(([label, val]) => {
            doc.setFont(undefined, 'bold');   doc.setFontSize(9.5);
            doc.text(label, detailLeft, y);
            doc.setFont(undefined, 'normal');
            doc.text(String(val || ''), detailLeft + 32, y);
            y += 6;
        });

        // Passport photo (top-right)
        const photoX = R - 33;
        const photoY = detailStartY - 3;
        if (student.profileImage) {
            try {
                doc.addImage(student.profileImage, 'JPEG', photoX, photoY, 28, 33);
            } catch (_) {}
        }
        doc.setDrawColor(0); doc.rect(photoX, photoY, 28, 33);
        if (!student.profileImage) {
            doc.setFontSize(7); doc.text('PHOTO', photoX + 14, photoY + 17, { align: 'center' });
        }

        y += 4;

        // ── RESULTS TABLE ──
        doc.setFontSize(11); doc.setFont(undefined, 'bold');
        doc.text('ACADEMIC PERFORMANCE', pageWidth / 2, y, { align: 'center' });
        y += 7;

        // Table header
        const cols = {
            sn:       { x: L,       w: 8,  label: '#' },
            subject:  { x: L + 8,   w: 45, label: 'Subject' },
            ca:       { x: L + 53,  w: 18, label: 'CA Score' },
            exam:     { x: L + 71,  w: 18, label: 'Exam' },
            total:    { x: L + 89,  w: 18, label: 'Total' },
            maxScore: { x: L + 107, w: 18, label: 'Max' },
            grade:    { x: L + 125, w: 14, label: 'Grade' },
            remark:   { x: L + 139, w: 42, label: 'Remark' },
        };

        const rowH = 7;
        const tableRight = R;

        // Header background
        doc.setFillColor(30, 58, 138);
        doc.rect(L, y, tableRight - L, rowH, 'F');
        doc.setTextColor(255, 255, 255); doc.setFontSize(8.5); doc.setFont(undefined, 'bold');
        Object.values(cols).forEach(col => {
            doc.text(col.label, col.x + col.w / 2, y + 5, { align: 'center' });
        });
        y += rowH;
        doc.setTextColor(0, 0, 0);

        student.subjects.forEach((sub, idx) => {
            // Alternating row shading
            if (idx % 2 === 0) {
                doc.setFillColor(240, 244, 255);
                doc.rect(L, y, tableRight - L, rowH, 'F');
            }

            doc.setFont(undefined, 'normal'); doc.setFontSize(8.5);
            doc.text(String(idx + 1), cols.sn.x + cols.sn.w / 2, y + 5, { align: 'center' });
            doc.text(sub.subjectName || '', cols.subject.x + 2, y + 5);

            const totalCA = (sub.ca1Score || 0) + (sub.ca2Score || 0) + (sub.ca3Score || 0);
            doc.text(sub.isAbsent ? 'ABS' : String(totalCA.toFixed(0)), cols.ca.x + cols.ca.w / 2, y + 5, { align: 'center' });
            doc.text(sub.isAbsent ? 'ABS' : String(sub.examScore ?? '-'), cols.exam.x + cols.exam.w / 2, y + 5, { align: 'center' });

            // Total with pass/fail colour
            const passMark = (sub.totalMaxScore || 100) * 0.4;
            const total = sub.totalScore || 0;
            doc.setTextColor(...(sub.isAbsent ? [150, 150, 150] : total >= passMark ? [22, 101, 52] : [185, 28, 28]));
            doc.setFont(undefined, 'bold');
            doc.text(sub.isAbsent ? 'ABS' : String(total.toFixed(0)), cols.total.x + cols.total.w / 2, y + 5, { align: 'center' });
            doc.setTextColor(0, 0, 0); doc.setFont(undefined, 'normal');

            doc.text(String(sub.totalMaxScore || 100), cols.maxScore.x + cols.maxScore.w / 2, y + 5, { align: 'center' });

            // Grade badge colour
            const gradeHex = gradeColors[sub.grade] || '#374151';
            const [gr, gg, gb] = hexToRgb(gradeHex);
            doc.setTextColor(gr, gg, gb); doc.setFont(undefined, 'bold');
            doc.text(sub.grade || '-', cols.grade.x + cols.grade.w / 2, y + 5, { align: 'center' });
            doc.setTextColor(0, 0, 0); doc.setFont(undefined, 'normal');

            doc.text(sub.remark || '-', cols.remark.x + 2, y + 5);

            // Row border
            doc.setDrawColor(200, 210, 230); doc.setLineWidth(0.2);
            doc.line(L, y + rowH, tableRight, y + rowH);

            y += rowH;
        });

        // Table border
        doc.setDrawColor(30, 58, 138); doc.setLineWidth(0.5);
        doc.rect(L, y - (student.subjects.length * rowH) - rowH, tableRight - L, (student.subjects.length + 1) * rowH);

        y += 5;

        // ── SUMMARY BOX ──
        doc.setFillColor(240, 249, 240);
        doc.rect(L, y, tableRight - L, 22, 'F');
        doc.setDrawColor(22, 101, 52); doc.rect(L, y, tableRight - L, 22);

        doc.setFont(undefined, 'bold'); doc.setFontSize(9); doc.setTextColor(0, 0, 0);
        const summaryItems = [
            ['Total Score:', String(student.grandTotal?.toFixed(0) || '0')],
            ['Average:', String(student.average || '0')],
            ['Percentage:', `${student.percentage || '0'}%`],
            ['Position:', `${student.overallPosition || '-'} / ${student.classSize || '-'}`],
            ['Subjects:', String(student.subjectCount || 0)],
        ];
        const colW = (tableRight - L) / summaryItems.length;
        summaryItems.forEach(([label, val], i) => {
            const sx = L + i * colW + 4;
            doc.setFont(undefined, 'normal'); doc.setFontSize(8); doc.setTextColor(80, 80, 80);
            doc.text(label, sx, y + 7);
            doc.setFont(undefined, 'bold'); doc.setFontSize(11); doc.setTextColor(0, 0, 0);
            doc.text(val, sx, y + 17);
        });

        y += 28;

        // ── GRADING KEY ──
        doc.setFontSize(8); doc.setFont(undefined, 'bold'); doc.setTextColor(0);
        doc.text('Grading Key:', L, y);
        const grades = [
            ['A: 70–100', '#16a34a'],
            ['B: 60–69', '#2563eb'],
            ['C: 50–59', '#d97706'],
            ['D: 40–49', '#ea580c'],
            ['F: 0–39', '#dc2626'],
        ];
        let gx = L + 28;
        grades.forEach(([label, hex]) => {
            const [r, g, b] = hexToRgb(hex);
            doc.setTextColor(r, g, b); doc.setFont(undefined, 'normal');
            doc.text(label, gx, y);
            gx += 26;
        });
        doc.setTextColor(0);
        y += 8;

        // ── REMARKS / TEACHERS COMMENTS ──
        doc.setFontSize(9); doc.setFont(undefined, 'bold');
        doc.text("Class Teacher's Remarks:", L, y);
        y += 5;
        doc.setFont(undefined, 'normal');
        doc.setDrawColor(180); doc.setLineWidth(0.3);
        for (let i = 0; i < 2; i++) {
            doc.line(L, y + 1, R, y + 1);
            y += 7;
        }
        y += 5;

        // ── SIGNATURE BLOCK (mirrors admission letter) ──
        const sigX = R - 60;

        if (principalSig) {
            try {
                doc.addImage(principalSig, 'PNG', sigX, y, 40, 14);
                y += 16;
            } catch (_) {
                doc.setDrawColor(0); doc.line(sigX, y + 10, sigX + 50, y + 10);
                y += 14;
            }
        } else {
            doc.setDrawColor(0); doc.setLineWidth(0.5);
            doc.line(sigX, y + 8, sigX + 50, y + 8);
            y += 12;
        }

        doc.setFont(undefined, 'bold'); doc.setFontSize(9);
        doc.text(principal, sigX, y);
        y += 5;
        doc.setFont(undefined, 'normal'); doc.setFontSize(8);
        doc.text('Principal / Head of School', sigX, y);

        y += 10;

        // ── FOOTER LINE ──
        doc.setDrawColor(220, 20, 60); doc.setLineWidth(1.5);
        doc.line(L, y, pageWidth / 2, y);
        doc.setDrawColor(0, 135, 81);
        doc.line(pageWidth / 2, y, R, y);
    }

    // Helper: #rrggbb → [r,g,b]
    function hexToRgb(hex) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return [r, g, b];
    }

    async function handleGeneratePDF() {
        if (reportData.length === 0) return showAlert('error', 'Load report data first');
        setGenerating(true);
        try {
            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            reportData.forEach((student, idx) => {
                if (idx > 0) doc.addPage();
                generateReportCardPDF(student, doc, idx === 0);
            });
            const className = meta?.className?.replace(/\s+/g, '_') || 'Class';
            doc.save(`ReportCards_${className}_${selTerm.replace(/\s+/g, '_')}_${selYear}.pdf`);
            showAlert('success', `Generated ${reportData.length} report card(s) successfully!`);
        } catch (e) {
            console.error(e);
            showAlert('error', 'PDF generation failed: ' + e.message);
        }
        setGenerating(false);
    }

    // ── Preview card (in-browser) ──
    const PreviewCard = ({ student }) => (
        <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:'12px', padding:'20px', marginTop:'16px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'12px' }}>
                <div>
                    <h3 style={{ margin:0, fontSize:'1rem', color:'#1e3a8a' }}>{student.studentName}</h3>
                    <p style={{ margin:'2px 0 0', fontSize:'0.8rem', color:'#64748b' }}>
                        {meta?.className} {student.section ? `· Section ${student.section}` : ''} · Student No: {student.studentNumber || 'N/A'}
                    </p>
                </div>
                <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:'1.4rem', fontWeight:800, color:'#1e3a8a' }}>
                        {student.overallPosition}<span style={{ fontSize:'0.75rem', color:'#64748b' }}>/{student.classSize}</span>
                    </div>
                    <div style={{ fontSize:'0.75rem', color:'#64748b' }}>Class Position</div>
                </div>
            </div>

            {/* Mini stats */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px', marginBottom:'14px' }}>
                {[
                    { label:'Grand Total', val:student.grandTotal?.toFixed(0) },
                    { label:'Average', val:student.average },
                    { label:'Percentage', val:`${student.percentage}%` },
                ].map(s => (
                    <div key={s.label} style={{ background:'#f8fafc', borderRadius:'8px', padding:'8px', textAlign:'center' }}>
                        <div style={{ fontSize:'1.1rem', fontWeight:700, color:'#1e3a8a' }}>{s.val}</div>
                        <div style={{ fontSize:'0.72rem', color:'#64748b' }}>{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Subjects table */}
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.8rem' }}>
                <thead>
                    <tr style={{ background:'#1e3a8a', color:'#fff' }}>
                        {['Subject','CA','Exam','Total','Max','Grade','Remark'].map(h => (
                            <th key={h} style={{ padding:'5px 6px', textAlign:'center' }}>{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {student.subjects.map((sub, i) => {
                        const totalCA = (sub.ca1Score||0)+(sub.ca2Score||0)+(sub.ca3Score||0);
                        const passMark = (sub.totalMaxScore||100)*0.4;
                        return (
                            <tr key={i} style={{ background: i%2===0 ? '#f0f4ff' : '#fff' }}>
                                <td style={{ padding:'4px 6px' }}>{sub.subjectName}</td>
                                <td style={{ padding:'4px 6px', textAlign:'center' }}>{sub.isAbsent ? 'ABS' : totalCA.toFixed(0)}</td>
                                <td style={{ padding:'4px 6px', textAlign:'center' }}>{sub.isAbsent ? 'ABS' : (sub.examScore ?? '-')}</td>
                                <td style={{ padding:'4px 6px', textAlign:'center', fontWeight:700,
                                    color: sub.isAbsent ? '#aaa' : sub.totalScore >= passMark ? '#16a34a' : '#dc2626' }}>
                                    {sub.isAbsent ? 'ABS' : sub.totalScore}
                                </td>
                                <td style={{ padding:'4px 6px', textAlign:'center', color:'#64748b' }}>{sub.totalMaxScore}</td>
                                <td style={{ padding:'4px 6px', textAlign:'center', fontWeight:700,
                                    color: gradeColors[sub.grade] || '#374151' }}>{sub.grade || '-'}</td>
                                <td style={{ padding:'4px 6px', color:'#64748b' }}>{sub.remark || '-'}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );

    return (
        <div className="results-page">
            <div className="results-header">
                <h1><FileText size={24} /> Generate Report Cards</h1>
                <p>Generate and print student report cards for approved results</p>
            </div>

            {alert && (
                <div className={`results-alert ${alert.type}`}>
                    {alert.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
                    {alert.msg}
                </div>
            )}

            {/* ── FILTER PANEL ── */}
            <div className="results-card" style={{ marginBottom:'16px' }}>
                <h3 style={{ marginBottom:'16px', display:'flex', alignItems:'center', gap:'8px' }}>
                    <Filter size={18} /> Select Report Parameters
                </h3>
                <div className="results-form-grid">
                    <div className="form-group">
                        <label>Academic Year *</label>
                        <select value={selYear} onChange={e => { setSelYear(e.target.value); setSelClass(''); setReportData([]); }}>
                            <option value="">-- Select Year --</option>
                            {academicYears.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Term *</label>
                        <select value={selTerm} onChange={e => { setSelTerm(e.target.value); setSelClass(''); setReportData([]); }}>
                            <option>First Term</option>
                            <option>Second Term</option>
                            <option>Third Term</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Class *</label>
                        <select value={selClass} onChange={e => { setSelClass(e.target.value); setSelStudent(''); setReportData([]); }}>
                            <option value="">-- Select Class --</option>
                            {classes.map(c => (
                                <option key={`${c.classId}-${c.academicYear}-${c.term}`} value={c.classId}>
                                    {c.className} ({c.subjectCount} subjects)
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Student (optional)</label>
                        <select value={selStudent} onChange={e => { setSelStudent(e.target.value); setReportData([]); }}>
                            <option value="">All Students</option>
                            {students.map(s => <option key={s.studentId} value={s.studentId}>{s.studentName}</option>)}
                        </select>
                    </div>
                </div>
                <div style={{ display:'flex', gap:'12px', marginTop:'8px', flexWrap:'wrap' }}>
                    <button className="btn-primary" onClick={fetchReportData} disabled={loading || !selYear || !selClass}>
                        {loading ? <RefreshCw size={16} className="spin" /> : <BookOpen size={16} />}
                        {loading ? 'Loading...' : 'Load Report Data'}
                    </button>
                    {reportData.length > 0 && (
                        <>
                            <button className="btn-success" onClick={handleGeneratePDF} disabled={generating}>
                                {generating ? <RefreshCw size={16} className="spin" /> : <Download size={16} />}
                                {generating ? 'Generating...' : `Download PDF (${reportData.length} card${reportData.length > 1 ? 's' : ''})`}
                            </button>
                            <button className="btn-outline" onClick={() => window.print()}>
                                <Printer size={16} /> Print
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* ── RESULTS PREVIEW ── */}
            {reportData.length > 0 && meta && (
                <div className="results-card">
                    {/* Meta strip */}
                    <div style={{ display:'flex', gap:'12px', flexWrap:'wrap', marginBottom:'16px' }}>
                        {[
                            { label:'Class', val: meta.className },
                            { label:'Term', val: meta.term },
                            { label:'Year', val: meta.academicYear },
                            { label:'Students', val: reportData.length },
                            { label:'Subjects', val: meta.subjectCount },
                        ].map(s => (
                            <div key={s.label} style={{ background:'#f0f4ff', borderRadius:'8px', padding:'8px 16px',
                                borderTop:'3px solid #1e3a8a', minWidth:'90px' }}>
                                <div style={{ fontSize:'1.2rem', fontWeight:800, color:'#1e3a8a' }}>{s.val}</div>
                                <div style={{ fontSize:'0.72rem', color:'#64748b' }}>{s.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Student cards list */}
                    <h3 style={{ marginBottom:'0', display:'flex', alignItems:'center', gap:'8px' }}>
                        <Users size={18} /> Student Preview
                        <span style={{ fontSize:'0.8rem', color:'#64748b', fontWeight:400 }}>
                            — Click a student to expand
                        </span>
                    </h3>

                    {reportData.map(student => (
                        <div key={student.studentId}>
                            <div
                                onClick={() => setPreviewStudent(previewStudent === student.studentId ? null : student.studentId)}
                                style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                                    padding:'10px 14px', marginTop:'8px', background:'#f8fafc',
                                    borderRadius:'8px', cursor:'pointer', border:'1px solid #e2e8f0',
                                    transition:'background 0.15s' }}
                            >
                                <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                                    <div style={{ width:'32px', height:'32px', borderRadius:'50%',
                                        background:'#1e3a8a', display:'flex', alignItems:'center',
                                        justifyContent:'center', color:'#fff', fontSize:'0.8rem', fontWeight:700 }}>
                                        {student.overallPosition}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight:600 }}>{student.studentName}</div>
                                        <div style={{ fontSize:'0.78rem', color:'#64748b' }}>
                                            {student.studentId} · {student.subjectCount} subjects
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display:'flex', alignItems:'center', gap:'16px' }}>
                                    <div style={{ textAlign:'right' }}>
                                        <div style={{ fontWeight:700, color:'#1e3a8a' }}>Avg: {student.average}</div>
                                        <div style={{ fontSize:'0.75rem', color:'#64748b' }}>{student.percentage}%</div>
                                    </div>
                                    <ChevronDown size={16} style={{
                                        transform: previewStudent === student.studentId ? 'rotate(180deg)' : 'none',
                                        transition: 'transform 0.2s', color:'#94a3b8'
                                    }} />
                                </div>
                            </div>
                            {previewStudent === student.studentId && <PreviewCard student={student} />}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}