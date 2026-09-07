import React, { useState, useEffect } from 'react';
import { Upload, Download, Save, RefreshCw, AlertCircle, CheckCircle, BookOpen } from 'lucide-react';
import * as XLSX from 'xlsx';
import './Results.css';
import AppDialog from '../shared/AppDialog';
import { useAppDialog } from '../../hooks/useAppDialog';
const API = '/api';

export default function EnterExamResults() {
    const [sessions, setSessions] = useState([]);
    const [activeSession, setActiveSession] = useState(null);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [alert, setAlert] = useState(null);
    const [isDirty, setIsDirty] = useState(false);
    const [filterYear, setFilterYear] = useState('');
    const [filterTerm, setFilterTerm] = useState('');
    const [filterClass, setFilterClass] = useState('');
const { dialog, showDialog, closeDialog, handleDialogAction } = useAppDialog();
    useEffect(() => { loadSessions(); }, []);

    async function loadSessions() {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filterYear) params.append('academicYear', filterYear);
            if (filterTerm) params.append('term', filterTerm);
            const res = await fetch(`${API}/results/sessions?${params}`);
            const data = await res.json();
            if (data.success) setSessions(data.data.filter(s => s.status === 'open' || s.status === 'submitted' || s.status === 'approved'));
        } catch (e) { showAlert('error', e.message); }
        setLoading(false);
    }

    async function openSession(sessionId) {
        setLoading(true);
        try {
            const [sRes, rRes] = await Promise.all([
                fetch(`${API}/results/sessions/${sessionId}`),
                fetch(`${API}/results/sessions/${sessionId}/results`)
            ]);
            const [sData, rData] = await Promise.all([sRes.json(), rRes.json()]);
            if (sData.success) setActiveSession(sData.data);
            if (rData.success) setResults(rData.data);
            setIsDirty(false);
        } catch (e) { showAlert('error', e.message); }
        setLoading(false);
    }

    function showAlert(type, msg) {
        setAlert({ type, msg });
        setTimeout(() => setAlert(null), 5000);
    }

    function handleExamChange(resultId, value) {
        setResults(prev => prev.map(r => r.resultId === resultId ? { ...r, examScore: value } : r));
        setIsDirty(true);
    }

    function handleAbsentToggle(resultId) {
        setResults(prev => prev.map(r => r.resultId === resultId ? { ...r, isAbsent: !r.isAbsent } : r));
        setIsDirty(true);
    }

    async function saveAll() {
        if (!activeSession) return;
        setSaving(true);
        try {
            const payload = results.map(r => ({
                studentId: r.studentId,
                ca1Score: r.ca1Score || 0,
                ca2Score: r.ca2Score || 0,
                ca3Score: r.ca3Score || 0,
                examScore: r.examScore || 0,
                isAbsent: r.isAbsent ? 1 : 0
            }));
            console.log('Payload being sent:', JSON.stringify(payload.slice(0,2)));
            const res = await fetch(`${API}/results/sessions/${activeSession.sessionId}/bulk-update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ results: payload })
            });
            const data = await res.json();
            if (data.success) {
                showAlert('success', `Saved! ${data.data.updated} records updated.`);
                await openSession(activeSession.sessionId);
            } else showAlert('error', data.message);
        } catch (e) { showAlert('error', e.message); }
        setSaving(false);
    }

function submitForApproval() {
    if (!activeSession) return;
    showDialog(
        'warning',
        'Submit for Approval',
        'Submit exam results for approval?',
        '',
        'Submit',
        async () => {
            setSaving(true);
            try {
                if (isDirty) {
                    const payload = results.map(r => ({
                        studentId: r.studentId,
                        ca1Score: r.ca1Score !== null && r.ca1Score !== undefined ? parseFloat(r.ca1Score) || 0 : 0,
                        ca2Score: r.ca2Score !== null && r.ca2Score !== undefined ? parseFloat(r.ca2Score) || 0 : 0,
                        ca3Score: r.ca3Score !== null && r.ca3Score !== undefined ? parseFloat(r.ca3Score) || 0 : 0,
                        examScore: r.examScore !== null && r.examScore !== undefined ? parseFloat(r.examScore) || 0 : 0,
                        isAbsent: r.isAbsent ? 1 : 0
                    }));
                    const saveRes = await fetch(`${API}/results/sessions/${activeSession.sessionId}/bulk-update`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ results: payload })
                    });
                    const saveData = await saveRes.json();
                    if (!saveData.success) {
                        closeDialog();
                        showAlert('error', 'Failed to save scores before submission: ' + saveData.message);
                        setSaving(false);
                        return;
                    }
                }

                const res = await fetch(`${API}/results/sessions/${activeSession.sessionId}/submit`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ submittedBy: 'Teacher' })
                });
                const data = await res.json();
                closeDialog();
                if (data.success) {
                    showAlert('success', 'Scores saved and submitted for approval!');
                    await openSession(activeSession.sessionId);
                } else showAlert('error', data.message);
            } catch (e) {
                closeDialog();
                showAlert('error', e.message);
            }
            setSaving(false);
        },
        true
    );
}

    function downloadTemplate() {
        if (!activeSession || results.length === 0) return showAlert('error', 'Load a session first');
        const headers = ['studentId', 'studentName', 'examScore', 'isAbsent'];
        const rows = results.map(r => [r.studentId, r.studentName, '', '']);
        const infoRows = [
            [`Subject: ${activeSession.subjectName}`, `Class: ${activeSession.className}`, `Term: ${activeSession.term}`],
            [`Exam Max Score: ${activeSession.examMaxScore}`, 'isAbsent: YES or leave blank', 'Do NOT change studentId column'],
            [],
            headers,
            ...rows
        ];
        const ws = XLSX.utils.aoa_to_sheet(infoRows);
        ws['!cols'] = [{ wch: 20 }, { wch: 30 }, { wch: 15 }, { wch: 12 }];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Exam Template');
        XLSX.writeFile(wb, `Exam_Template_${activeSession.subjectName}_${activeSession.term}.xlsx`);
    }

    async function handleExcelUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const buffer = await file.arrayBuffer();
            const wb = XLSX.read(buffer);
            const ws = wb.Sheets[wb.SheetNames[0]];
            const raw = XLSX.utils.sheet_to_json(ws, { header: 1 });
            const headerIdx = raw.findIndex(r => r.some(c => String(c).toLowerCase() === 'studentid'));
            if (headerIdx === -1) return showAlert('error', 'Header row not found. Use the provided template.');
            const headers = raw[headerIdx].map(h => String(h).trim());
            const dataRows = raw.slice(headerIdx + 1).filter(r => r[0]);

            const parsed = dataRows.map(row => {
                const obj = {};
                headers.forEach((h, i) => { obj[h] = row[i] !== undefined ? row[i] : ''; });
                return {
                    studentId: String(obj.studentId || '').trim(),
                    examScore: parseFloat(obj.examScore) || 0,
                    isAbsent: String(obj.isAbsent || '').toUpperCase() === 'YES' ? 1 : 0
                };
            }).filter(r => r.studentId);

            if (!parsed.length) return showAlert('error', 'No valid rows found');

            setResults(prev => prev.map(r => {
                const match = parsed.find(p => p.studentId === r.studentId);
                if (match) return { ...r, examScore: match.examScore, isAbsent: match.isAbsent };
                return r;
            }));
            setIsDirty(true);
            showAlert('success', `Loaded ${parsed.length} rows. Review and click Save.`);
        } catch (err) {
            showAlert('error', 'Failed to parse Excel: ' + err.message);
        }
        e.target.value = '';
    }

    const isReadOnly = activeSession && (activeSession.status === 'approved' || activeSession.status === 'submitted');

    // Unique classes from sessions
    const classOptions = [...new Set(sessions.map(s => s.className))];

    const filteredSessions = sessions.filter(s =>
        (!filterYear || s.academicYear === filterYear) &&
        (!filterTerm || s.term === filterTerm) &&
        (!filterClass || s.className === filterClass)
    );

    return (
        <div className="results-page">
            <div className="results-header">
                <h1><BookOpen size={24} /> Enter Exam Results</h1>
                <p>Record exam scores for submitted or open result sessions</p>
            </div>

            {alert && (
                <div className={`results-alert ${alert.type}`}>
                    {alert.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
                    {alert.msg}
                </div>
            )}

            <div className="results-layout">
                {/* Session list panel */}
                <div className="sessions-panel">
                    <div className="panel-header">
                        <h3>Sessions</h3>
                        <button className="btn-icon" onClick={loadSessions} disabled={loading}>
                            <RefreshCw size={14} className={loading ? 'spin' : ''} />
                        </button>
                    </div>
                    <div className="filter-row">
                        <select value={filterTerm} onChange={e => setFilterTerm(e.target.value)}>
                            <option value="">All Terms</option>
                            <option>First Term</option>
                            <option>Second Term</option>
                            <option>Third Term</option>
                        </select>
                        <select value={filterClass} onChange={e => setFilterClass(e.target.value)}>
                            <option value="">All Classes</option>
                            {classOptions.map(c => <option key={c}>{c}</option>)}
                        </select>
                    </div>
                    <div className="session-list">
                        {filteredSessions.length === 0 ? (
                            <p className="empty-state">No sessions found. Create one via Enter CA Results.</p>
                        ) : filteredSessions.map(s => (
                            <div
                                key={s.sessionId}
                                className={`session-item ${activeSession?.sessionId === s.sessionId ? 'active' : ''}`}
                                onClick={() => openSession(s.sessionId)}
                            >
                                <div className="session-item-title">{s.subjectName}</div>
                                <div className="session-item-meta">{s.className} · {s.term}</div>
                                <div className="session-item-meta">{s.academicYear}</div>
                                <span className={`status-badge ${s.status}`}>{s.status}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Results entry panel */}
                <div className="entry-panel">
                    {!activeSession ? (
                        <div className="select-session-placeholder">
                            <BookOpen size={48} />
                            <p>Select a session from the left to enter exam scores</p>
                        </div>
                    ) : (
                        <>
                            <div className="session-info-bar">
                                <div>
                                    <strong>{activeSession.className}</strong> &nbsp;|&nbsp;
                                    <strong>{activeSession.subjectName}</strong> &nbsp;|&nbsp;
                                    {activeSession.term} {activeSession.academicYear}
                                </div>
                                <div className="session-actions">
                                    <span className={`status-badge ${activeSession.status}`}>{activeSession.status}</span>
                                    {!isReadOnly && (
                                        <>
                                            <label className="btn-outline" style={{ cursor: 'pointer' }}>
                                                <Upload size={14} /> Import Excel
                                                <input type="file" accept=".xlsx,.xls" hidden onChange={handleExcelUpload} />
                                            </label>
                                            <button className="btn-outline" onClick={downloadTemplate}>
                                                <Download size={14} /> Template
                                            </button>
                                            <button className="btn-primary" onClick={saveAll} disabled={saving || !isDirty}>
                                                {saving ? <RefreshCw size={14} className="spin" /> : <Save size={14} />}
                                                Save
                                            </button>
                                            <button className="btn-success" onClick={submitForApproval} disabled={saving}>
                                                <CheckCircle size={14} /> Submit
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="score-limits-bar">
                                <span>Exam Max: <strong>{activeSession.examMaxScore}</strong> &nbsp;|&nbsp;</span>
                                <span>CA Max: <strong>{activeSession.caCount * activeSession.caMaxScore}</strong> &nbsp;|&nbsp;</span>
                                <span>Total Max: <strong>{activeSession.totalMaxScore}</strong> &nbsp;|&nbsp;</span>
                                <span>Students: <strong>{results.length}</strong></span>
                            </div>

                            <div className="results-table-wrapper">
                                <table className="results-table">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Student Name</th>
                                            <th>Total CA <small>/{activeSession.caCount * activeSession.caMaxScore}</small></th>
                                            <th>Exam Score <small>/{activeSession.examMaxScore}</small></th>
                                            <th>Total <small>/{activeSession.totalMaxScore}</small></th>
                                            <th>Grade</th>
                                            <th>Position</th>
                                            <th>Absent</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {results.map((r, idx) => {
                                            const totalCA = (parseFloat(r.ca1Score) || 0) + (parseFloat(r.ca2Score) || 0) + (parseFloat(r.ca3Score) || 0);
                                            const exam = parseFloat(r.examScore) || 0;
                                            const total = totalCA + exam;
                                            return (
                                                <tr key={r.resultId} className={r.isAbsent ? 'absent-row' : ''}>
                                                    <td>{idx + 1}</td>
                                                    <td className="student-name-cell">
                                                        <div>{r.studentName}</div>
                                                        <small className="student-id">{r.studentId}</small>
                                                    </td>
                                                    <td className="computed-cell">{r.isAbsent ? '-' : totalCA.toFixed(1)}</td>
                                                    <td>
                                                        {isReadOnly ? <span>{r.examScore || '-'}</span> :
                                                            <input type="number" className="score-input" value={r.examScore || ''}
                                                                min={0} max={activeSession.examMaxScore}
                                                                onChange={e => handleExamChange(r.resultId, e.target.value)}
                                                                disabled={r.isAbsent} />}
                                                    </td>
                                                    <td className={`computed-cell total-cell ${total >= (activeSession.totalMaxScore * 0.4) ? 'pass' : 'fail'}`}>
                                                        {r.isAbsent ? 'ABS' : total.toFixed(1)}
                                                    </td>
                                                    <td className={`grade-cell grade-${r.grade || 'F'}`}>{r.grade || '-'}</td>
                                                    <td className="position-cell">{r.position || '-'}</td>
                                                    <td>
                                                        {isReadOnly ? (r.isAbsent ? 'YES' : '') :
                                                            <input type="checkbox" checked={!!r.isAbsent} onChange={() => handleAbsentToggle(r.resultId)} />}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {isReadOnly && (
                                <div className="readonly-notice">
                                    <AlertCircle size={16} /> Results are {activeSession.status} and cannot be edited.
                                    {activeSession.status === 'approved' && ` Approved by ${activeSession.approvedBy || 'Admin'}.`}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

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
  actionLoading={dialog.actionLoading || saving}
/>
        </div>
    );
}