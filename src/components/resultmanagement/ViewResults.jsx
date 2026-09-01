import React, { useState, useEffect } from 'react';
import { Eye, Download, RefreshCw, AlertCircle, BarChart3, Search } from 'lucide-react';
import * as XLSX from 'xlsx';
import './Results.css';

const API = '/api';

export default function ViewResults() {
    const [classes, setClasses] = useState([]);
    const [schoolSettings, setSchoolSettings] = useState({});
    const [filter, setFilter] = useState({ academicYear: '', term: 'First Term', classId: '' });
    const [broadsheet, setBroadsheet] = useState(null);
    const [studentView, setStudentView] = useState(null); // single student detail
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        Promise.all([
            fetch(`${API}/classes`).then(r => r.json()),
            fetch(`${API}/school-settings`).then(r => r.json())
        ]).then(([classData, settingsData]) => {
            if (classData.success) setClasses(classData.data);
            if (settingsData.success) {
                setSchoolSettings(settingsData.data);
                setFilter(prev => ({ ...prev, academicYear: settingsData.data.academicYear || '' }));
            }
        });
    }, []);

    function showAlert(type, msg) {
        setAlert({ type, msg });
        setTimeout(() => setAlert(null), 5000);
    }

    async function loadBroadsheet() {
        if (!filter.academicYear || !filter.term || !filter.classId) {
            return showAlert('error', 'Please select Academic Year, Term and Class');
        }
        setLoading(true);
        setBroadsheet(null);
        setStudentView(null);
        try {
            const params = new URLSearchParams(filter);
            const res = await fetch(`${API}/results/broadsheet?${params}`);
            const data = await res.json();
            if (data.success) {
                if (data.data.students.length === 0) showAlert('error', 'No approved results found for this selection');
                setBroadsheet(data.data);
            } else showAlert('error', data.message);
        } catch (e) { showAlert('error', e.message); }
        setLoading(false);
    }

    async function loadStudentDetail(studentId) {
        try {
            const params = new URLSearchParams({ academicYear: filter.academicYear, term: filter.term });
            const res = await fetch(`${API}/results/student/${studentId}?${params}`);
            const data = await res.json();
            if (data.success) setStudentView(data.data);
        } catch (e) { showAlert('error', e.message); }
    }

    function exportBroadsheet() {
        if (!broadsheet) return;
        const { sessions, students } = broadsheet;
        const headers = ['#', 'Student Name', ...sessions.map(s => s.subjectName), 'Total', 'Average', 'Position'];
        const rows = students.map((s, i) => {
            const row = [i + 1, s.studentName];
            sessions.forEach(sess => {
                const subj = s.subjects[sess.subjectName];
                row.push(subj ? subj.total : '-');
            });
            row.push(s.total.toFixed(1), s.average, s.overallPosition);
            return row;
        });

        const ws = XLSX.utils.aoa_to_sheet([
            [`BROADSHEET - ${filter.term} ${filter.academicYear}`],
            [`Class: ${classes.find(c => c.id == filter.classId)?.className || filter.classId}`],
            [],
            headers,
            ...rows
        ]);
        ws['!cols'] = headers.map(() => ({ wch: 18 }));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Broadsheet');
        XLSX.writeFile(wb, `Broadsheet_${filter.term}_${filter.academicYear}.xlsx`);
    }

    const filteredStudents = broadsheet?.students?.filter(s =>
        !searchTerm || s.studentName.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    return (
        <div className="results-page">
            <div className="results-header">
                <h1><BarChart3 size={24} /> View Results</h1>
                <p>View broadsheet and individual student performance</p>
            </div>

            {alert && (
                <div className={`results-alert ${alert.type}`}>
                    {alert.type === 'error' ? <AlertCircle size={16} /> : null}
                    {alert.msg}
                </div>
            )}

            {/* Filters */}
            <div className="results-card">
                <div className="results-form-grid">
                    <div className="form-group">
                        <label>Academic Year *</label>
                        <input value={filter.academicYear} onChange={e => setFilter(p => ({ ...p, academicYear: e.target.value }))} placeholder="2024/2025" />
                    </div>
                    <div className="form-group">
                        <label>Term *</label>
                        <select value={filter.term} onChange={e => setFilter(p => ({ ...p, term: e.target.value }))}>
                            <option>First Term</option>
                            <option>Second Term</option>
                            <option>Third Term</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Class *</label>
                        <select value={filter.classId} onChange={e => setFilter(p => ({ ...p, classId: e.target.value }))}>
                            <option value="">-- Select Class --</option>
                            {classes.map(c => <option key={c.id} value={c.id}>{c.className}</option>)}
                        </select>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                    <button className="btn-primary" onClick={loadBroadsheet} disabled={loading}>
                        {loading ? <RefreshCw size={16} className="spin" /> : <Eye size={16} />}
                        Load Broadsheet
                    </button>
                    {broadsheet && broadsheet.students.length > 0 && (
                        <button className="btn-outline" onClick={exportBroadsheet}>
                            <Download size={16} /> Export Excel
                        </button>
                    )}
                </div>
            </div>

            {/* Broadsheet */}
            {broadsheet && broadsheet.students.length > 0 && !studentView && (
                <div className="results-card">
                    <div className="broadsheet-header">
                        <h2>Class Broadsheet — {filter.term} {filter.academicYear}</h2>
                        <div className="search-box">
                            <Search size={16} />
                            <input placeholder="Search student..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                        </div>
                    </div>

                    <div className="stats-row">
                        <div className="stat-item"><span>Total Subjects</span><strong>{broadsheet.sessions.length}</strong></div>
                        <div className="stat-item"><span>Total Students</span><strong>{broadsheet.students.length}</strong></div>
                        <div className="stat-item"><span>Class Average</span>
                            <strong>
                                {broadsheet.students.length > 0
                                    ? (broadsheet.students.reduce((s, st) => s + parseFloat(st.average), 0) / broadsheet.students.length).toFixed(1)
                                    : '-'}
                            </strong>
                        </div>
                    </div>

                    <div className="results-table-wrapper">
                        <table className="results-table broadsheet-table">
                            <thead>
                                <tr>
                                    <th>Pos</th>
                                    <th>Student Name</th>
                                    {broadsheet.sessions.map(s => <th key={s.sessionId}>{s.subjectName}</th>)}
                                    <th>Total</th>
                                    <th>Average</th>
                                    <th>Action</th>
                                </tr>
                                <tr className="subheader-row">
                                    <th></th>
                                    <th></th>
                                    {broadsheet.sessions.map(s => <th key={s.sessionId} className="max-score">/{s.totalMaxScore}</th>)}
                                    <th></th>
                                    <th></th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStudents.map((s, i) => (
                                    <tr key={s.studentId}>
                                        <td className="position-cell">{s.overallPosition}</td>
                                        <td className="student-name-cell">{s.studentName}</td>
                                        {broadsheet.sessions.map(sess => {
                                            const subj = s.subjects[sess.subjectName];
                                            return (
                                                <td key={sess.sessionId} className={`score-td ${subj ? (subj.total >= sess.totalMaxScore * 0.4 ? 'pass' : 'fail') : ''}`}>
                                                    {subj ? (
                                                        <span title={`CA: ${subj.ca1 || 0}+${subj.ca2 || 0}+${subj.ca3 || 0}  Exam: ${subj.exam || 0}`}>
                                                            {subj.total?.toFixed(1)} <small className={`grade-badge grade-${subj.grade}`}>{subj.grade}</small>
                                                        </span>
                                                    ) : '-'}
                                                </td>
                                            );
                                        })}
                                        <td className="total-cell">{s.total.toFixed(1)}</td>
                                        <td className="avg-cell">{s.average}</td>
                                        <td>
                                            <button className="btn-sm" onClick={() => loadStudentDetail(s.studentId)}>
                                                <Eye size={12} /> Detail
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Student detail view */}
            {studentView && (
                <div className="results-card">
                    <div className="student-detail-header">
                        <button className="btn-outline" onClick={() => setStudentView(null)}>← Back to Broadsheet</button>
                        <h2>{studentView.student?.firstName} {studentView.student?.lastName} — Detailed Results</h2>
                    </div>
                    <div className="student-info-grid">
                        <div><span>Admission #:</span> <strong>{studentView.student?.admissionNumber}</strong></div>
                        <div><span>Class:</span> <strong>{studentView.student?.currentClass}</strong></div>
                        <div><span>Term:</span> <strong>{filter.term}</strong></div>
                        <div><span>Year:</span> <strong>{filter.academicYear}</strong></div>
                    </div>
                    <div className="results-table-wrapper">
                        <table className="results-table">
                            <thead>
                                <tr>
                                    <th>Subject</th>
                                    <th>CA 1</th>
                                    <th>CA 2</th>
                                    <th>CA 3</th>
                                    <th>Total CA</th>
                                    <th>Exam</th>
                                    <th>Total</th>
                                    <th>Grade</th>
                                    <th>Position</th>
                                    <th>Remark</th>
                                </tr>
                            </thead>
                            <tbody>
                                {studentView.results.map(r => (
                                    <tr key={r.id}>
                                        <td><strong>{r.subjectName}</strong></td>
                                        <td>{r.ca1Score ?? '-'}</td>
                                        <td>{r.ca2Score ?? '-'}</td>
                                        <td>{r.ca3Score ?? '-'}</td>
                                        <td>{r.totalCA ?? '-'}</td>
                                        <td>{r.examScore ?? '-'}</td>
                                        <td className={`total-cell ${r.totalScore >= r.totalMaxScore * 0.4 ? 'pass' : 'fail'}`}>
                                            {r.isAbsent ? 'ABS' : r.totalScore?.toFixed(1)}
                                        </td>
                                        <td className={`grade-cell grade-${r.grade}`}>{r.grade}</td>
                                        <td className="position-cell">{r.position}</td>
                                        <td>{r.remark}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colSpan={6}><strong>Totals</strong></td>
                                    <td className="total-cell"><strong>{studentView.results.reduce((s, r) => s + (r.totalScore || 0), 0).toFixed(1)}</strong></td>
                                    <td colSpan={3}>
                                        Average: <strong>{studentView.results.length > 0 ? (studentView.results.reduce((s, r) => s + (r.totalScore || 0), 0) / studentView.results.length).toFixed(2) : '-'}</strong>
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}