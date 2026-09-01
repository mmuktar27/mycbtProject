import React, { useState, useEffect, useCallback } from 'react';
import { Upload, Download, Save, Plus, Trash2, AlertCircle, CheckCircle, RefreshCw, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import './Results.css';

const API = '/api';

export default function EnterCAResults() {
    const [step, setStep] = useState(1); // 1=configure session, 2=enter results
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [schoolSettings, setSchoolSettings] = useState({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [alert, setAlert] = useState(null);

    // Session config
    const [config, setConfig] = useState({
        academicYear: '',
        term: 'First Term',
        classId: '',
        className: '',
        subjectId: '',
        subjectName: '',
        caCount: 1,
        caMaxScore: 10,
        examMaxScore: 60,
        totalMaxScore: 100,
        createdBy: 'Admin'
    });

    // Active session
    const [activeSession, setActiveSession] = useState(null);
    const [results, setResults] = useState([]);
    const [isDirty, setIsDirty] = useState(false);
const [templateModal, setTemplateModal] = useState(false);
const [templateCols, setTemplateCols] = useState({ ca1: true, ca2: true, ca3: true, exam: true });
    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        const total = (config.caCount * config.caMaxScore) + config.examMaxScore;
        setConfig(prev => ({ ...prev, totalMaxScore: total }));
    }, [config.caCount, config.caMaxScore, config.examMaxScore]);

    async function loadInitialData() {
        try {
            const [classRes, subjectRes, settingsRes, sessionRes] = await Promise.all([
                fetch(`${API}/classes`),
                fetch(`${API}/results/subjects`),
                fetch(`${API}/school-settings`),
                fetch(`${API}/results/sessions`)
            ]);
            const [classData, subjectData, settingsData, sessionData] = await Promise.all([
                classRes.json(), subjectRes.json(), settingsRes.json(), sessionRes.json()
            ]);
            if (classData.success) setClasses(classData.data);
            if (subjectData.success) setSubjects(subjectData.data);
            if (settingsData.success) {
                setSchoolSettings(settingsData.data);
                setConfig(prev => ({ ...prev, academicYear: settingsData.data.academicYear || '' }));
            }
            if (sessionData.success) setSessions(sessionData.data);
        } catch (e) {
            showAlert('error', 'Failed to load data: ' + e.message);
        }
    }

    function showAlert(type, msg) {
        setAlert({ type, msg });
        setTimeout(() => setAlert(null), 5000);
    }

    async function createSession() {
        if (!config.classId || !config.subjectId || !config.academicYear) {
            return showAlert('error', 'Please fill all required fields');
        }
        setLoading(true);
        try {
            const res = await fetch(`${API}/results/sessions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });
            const data = await res.json();
            if (data.success) {
                showAlert('success', `Session created! ${data.data.studentsAdded} students loaded.`);
                await loadSession(data.data.sessionId);
                await loadInitialData();
            } else {
                showAlert('error', data.message);
            }
        } catch (e) {
            showAlert('error', e.message);
        }
        setLoading(false);
    }

    async function loadSession(sessionId) {
        setLoading(true);
        try {
            const [sessRes, resRes] = await Promise.all([
                fetch(`${API}/results/sessions/${sessionId}`),
                fetch(`${API}/results/sessions/${sessionId}/results`)
            ]);
            const [sessData, resData] = await Promise.all([sessRes.json(), resRes.json()]);
            if (sessData.success) setActiveSession(sessData.data);
            if (resData.success) setResults(resData.data);
            setStep(2);
            setIsDirty(false);
        } catch (e) {
            showAlert('error', e.message);
        }
        setLoading(false);
    }

    function handleScoreChange(resultId, field, value) {
        setResults(prev => prev.map(r => r.resultId === resultId ? { ...r, [field]: value } : r));
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
            const res = await fetch(`${API}/results/sessions/${activeSession.sessionId}/bulk-update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ results: payload })
            });
            const data = await res.json();
            if (data.success) {
                showAlert('success', `Saved! ${data.data.updated} records updated.`);
                await loadSession(activeSession.sessionId);
            } else {
                showAlert('error', data.message);
            }
        } catch (e) {
            showAlert('error', e.message);
        }
        setSaving(false);
    }

    async function submitForApproval() {
        if (!activeSession) return;
        if (!window.confirm('Submit results for approval? You will not be able to edit after submission.')) return;
        setSaving(true);
        try {
            const res = await fetch(`${API}/results/sessions/${activeSession.sessionId}/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ submittedBy: config.createdBy })
            });
            const data = await res.json();
            if (data.success) {
                showAlert('success', 'Results submitted for approval!');
                await loadSession(activeSession.sessionId);
            } else {
                showAlert('error', data.message);
            }
        } catch (e) {
            showAlert('error', e.message);
        }
        setSaving(false);
    }

function downloadTemplate(cols = null) {
    if (!activeSession || results.length === 0) return showAlert('error', 'No results to download');
    const caCount = activeSession.caCount || 1;
    const include = cols || templateCols;

    const headers = ['studentId', 'studentName'];
    if (include.ca1) headers.push('ca1Score');
    if (caCount >= 2 && include.ca2) headers.push('ca2Score');
    if (caCount >= 3 && include.ca3) headers.push('ca3Score');
    if (include.exam) headers.push('examScore');
    headers.push('isAbsent');

    const rows = results.map(r => {
        const row = [r.studentId, r.studentName];
        // Pre-fill existing scores so user can see what's already saved
        if (include.ca1) row.push(r.ca1Score || '');
        if (caCount >= 2 && include.ca2) row.push(r.ca2Score || '');
        if (caCount >= 3 && include.ca3) row.push(r.ca3Score || '');
        if (include.exam) row.push(r.examScore || '');
        row.push(r.isAbsent ? 'YES' : '');
        return row;
    });

    const includedCols = Object.entries(include).filter(([,v]) => v).map(([k]) => k).join(', ');
    const infoRows = [
        [`Subject: ${activeSession.subjectName}`, `Class: ${activeSession.className}`, `Term: ${activeSession.term}`, `Year: ${activeSession.academicYear}`],
        [`CA Max Score: ${activeSession.caMaxScore} each`, `Exam Max Score: ${activeSession.examMaxScore}`, `Total Max: ${activeSession.totalMaxScore}`, 'isAbsent: YES or leave blank'],
        [`Columns in this template: ${includedCols}`, 'Blank cells = not yet entered', '', ''],
        [],
        headers,
        ...rows
    ];

    const ws = XLSX.utils.aoa_to_sheet(infoRows);
    ws['!cols'] = headers.map(() => ({ wch: 20 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Results Template');
    const colLabel = Object.entries(include).filter(([,v])=>v).map(([k])=>k.toUpperCase()).join('_');
    XLSX.writeFile(wb, `Template_${activeSession.subjectName}_${activeSession.term}_${colLabel}.xlsx`);
    setTemplateModal(false);
}

 async function handleExcelUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    try {
        const buffer = await file.arrayBuffer();
        const wb = XLSX.read(buffer);
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json(ws, { header: 1 });

        let headerIdx = raw.findIndex(r => r.some(c => String(c).toLowerCase() === 'studentid'));
        if (headerIdx === -1) return showAlert('error', 'Cannot find header row. Make sure the template is used.');

        const headers = raw[headerIdx].map(h => String(h).trim().toLowerCase());
        const dataRows = raw.slice(headerIdx + 1).filter(r => r[0]);

        // Detect which score columns are actually in THIS file
        const hasCA1  = headers.includes('ca1score');
        const hasCA2  = headers.includes('ca2score');
        const hasCA3  = headers.includes('ca3score');
        const hasExam = headers.includes('examscore');
        const hasAbsent = headers.includes('isabsent');

        const parsed = dataRows.map(row => {
            const obj = {};
            headers.forEach((h, i) => { obj[h] = row[i] !== undefined ? row[i] : ''; });
            const result = { studentId: String(obj['studentid'] || '').trim() };
            // Only include fields that exist in the uploaded file
            if (hasCA1)   result.ca1Score  = obj['ca1score']  !== '' ? parseFloat(obj['ca1score'])  : undefined;
            if (hasCA2)   result.ca2Score  = obj['ca2score']  !== '' ? parseFloat(obj['ca2score'])  : undefined;
            if (hasCA3)   result.ca3Score  = obj['ca3score']  !== '' ? parseFloat(obj['ca3score'])  : undefined;
            if (hasExam)  result.examScore = obj['examscore'] !== '' ? parseFloat(obj['examscore']) : undefined;
            if (hasAbsent) result.isAbsent = String(obj['isabsent'] || '').toUpperCase() === 'YES' ? 1 : 0;
            return result;
        }).filter(r => r.studentId);

        if (parsed.length === 0) return showAlert('error', 'No valid data rows found');

        // MERGE: only overwrite fields present in the file, preserve everything else
        setResults(prev => prev.map(r => {
            const match = parsed.find(p => p.studentId === r.studentId);
            if (!match) return r;
            const updated = { ...r };
            if (match.ca1Score  !== undefined) updated.ca1Score  = match.ca1Score;
            if (match.ca2Score  !== undefined) updated.ca2Score  = match.ca2Score;
            if (match.ca3Score  !== undefined) updated.ca3Score  = match.ca3Score;
            if (match.examScore !== undefined) updated.examScore = match.examScore;
            if (match.isAbsent  !== undefined) updated.isAbsent  = match.isAbsent;
            return updated;
        }));

        setIsDirty(true);
        const colsLoaded = [hasCA1&&'CA1', hasCA2&&'CA2', hasCA3&&'CA3', hasExam&&'Exam'].filter(Boolean).join(', ');
        showAlert('success', `Loaded ${parsed.length} rows. Columns updated: ${colsLoaded}. Review and click Save.`);
    } catch (err) {
        showAlert('error', 'Failed to parse Excel: ' + err.message);
    }
    e.target.value = '';
}

    const caCount = activeSession ? activeSession.caCount : config.caCount;
    const isReadOnly = activeSession && (activeSession.status === 'approved' || activeSession.status === 'submitted');

    // Existing sessions for this class/term
    const filteredSessions = sessions.filter(s =>
        (!config.academicYear || s.academicYear === config.academicYear) &&
        (s.term === config.term || !config.term)
    );

    return (
        <div className="results-page">
            <div className="results-header">
                <h1><FileSpreadsheet size={24} /> Enter CA Results</h1>
                <p>Enter or upload Continuous Assessment scores for your class</p>
            </div>

            {alert && (
                <div className={`results-alert ${alert.type}`}>
                    {alert.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
                    {alert.msg}
                </div>
            )}

            {/* ── Step 1: Configure ── */}
            {step === 1 && (
                <div className="results-card">
                    <h2>Configure Result Session</h2>
                    <div className="results-form-grid">
                        <div className="form-group">
                            <label>Academic Year *</label>
                            <input value={config.academicYear} onChange={e => setConfig(p => ({ ...p, academicYear: e.target.value }))} placeholder="2024/2025" />
                        </div>
                        <div className="form-group">
                            <label>Term *</label>
                            <select value={config.term} onChange={e => setConfig(p => ({ ...p, term: e.target.value }))}>
                                <option>First Term</option>
                                <option>Second Term</option>
                                <option>Third Term</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Class *</label>
                            <select value={config.classId} onChange={e => {
                                const cls = classes.find(c => c.id == e.target.value);
                                setConfig(p => ({ ...p, classId: e.target.value, className: cls?.className || '' }));
                            }}>
                                <option value="">-- Select Class --</option>
                                {classes.map(c => <option key={c.id} value={c.id}>{c.className} {c.section ? `(${c.section})` : ''}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Subject *</label>
                            <select value={config.subjectId} onChange={e => {
                                const sub = subjects.find(s => s.id == e.target.value);
                                setConfig(p => ({ ...p, subjectId: e.target.value, subjectName: sub?.subjectName || '' }));
                            }}>
                                <option value="">-- Select Subject --</option>
                                {subjects.map(s => <option key={s.id} value={s.id}>{s.subjectName} ({s.subjectCode})</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Number of CA Tests</label>
                            <select value={config.caCount} onChange={e => setConfig(p => ({ ...p, caCount: parseInt(e.target.value) }))}>
                                <option value={1}>1 CA Test</option>
                                <option value={2}>2 CA Tests</option>
                                <option value={3}>3 CA Tests</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Max Score Per CA</label>
                            <input type="number" value={config.caMaxScore} onChange={e => setConfig(p => ({ ...p, caMaxScore: parseFloat(e.target.value) }))} />
                        </div>
                        <div className="form-group">
                            <label>Max Exam Score</label>
                            <input type="number" value={config.examMaxScore} onChange={e => setConfig(p => ({ ...p, examMaxScore: parseFloat(e.target.value) }))} />
                        </div>
                        <div className="form-group">
                            <label>Total Max Score</label>
                            <input type="number" value={config.totalMaxScore} readOnly className="readonly-input" />
                        </div>
                        <div className="form-group">
                            <label>Entered By</label>
                            <input value={config.createdBy} onChange={e => setConfig(p => ({ ...p, createdBy: e.target.value }))} placeholder="Your name" />
                        </div>
                    </div>
                    <button className="btn-primary" onClick={createSession} disabled={loading}>
                        {loading ? <RefreshCw size={16} className="spin" /> : <Plus size={16} />}
                        Create Session & Load Students
                    </button>

                    {/* Open existing sessions */}
                    {filteredSessions.length > 0 && (
                        <div className="existing-sessions">
                            <h3>Or Open Existing Session</h3>
                            <table className="sessions-table">
                                <thead>
                                    <tr><th>Class</th><th>Subject</th><th>Term</th><th>Status</th><th>Action</th></tr>
                                </thead>
                                <tbody>
                                    {filteredSessions.map(s => (
                                        <tr key={s.sessionId}>
                                            <td>{s.className}</td>
                                            <td>{s.subjectName}</td>
                                            <td>{s.term}</td>
                                            <td><span className={`status-badge ${s.status}`}>{s.status}</span></td>
                                            <td><button className="btn-sm" onClick={() => loadSession(s.sessionId)}>Open</button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ── Step 2: Enter Results ── */}
            {step === 2 && activeSession && (
                <div className="results-card">
                    <div className="session-info-bar">
                        <div>
                            <strong>{activeSession.className}</strong> &nbsp;|&nbsp;
                            <strong>{activeSession.subjectName}</strong> &nbsp;|&nbsp;
                            {activeSession.term} {activeSession.academicYear}
                        </div>
                        <div className="session-actions">
                            <span className={`status-badge ${activeSession.status}`}>{activeSession.status}</span>
                            {activeSession.status === 'open' && (
    <div style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'0.85rem' }}>
        <label style={{ color:'#64748b', whiteSpace:'nowrap' }}>CA Tests:</label>
        <select
            value={activeSession.caCount}
            onChange={async e => {
                const newCount = parseInt(e.target.value);
                try {
                    const res = await fetch(`${API}/results/sessions/${activeSession.sessionId}/update-ca`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ caCount: newCount })
                    });
                    const data = await res.json();
                    if (data.success) {
    setActiveSession(p => ({ ...p, caCount: newCount, totalMaxScore: (newCount * p.caMaxScore) + p.examMaxScore }));
    
    // ADD THIS: clear removed CA scores from local state too
    if (newCount < 3) {
        setResults(prev => prev.map(r => ({ ...r, ca3Score: null })));
    }
    if (newCount < 2) {
        setResults(prev => prev.map(r => ({ ...r, ca2Score: null })));
    }
    
    showAlert('success', `Updated to ${newCount} CA test(s). Total max is now ${(newCount * activeSession.caMaxScore) + activeSession.examMaxScore}`);
} else {
                        showAlert('error', data.message);
                    }
                } catch(err) { showAlert('error', err.message); }
            }}
            style={{ padding:'3px 8px', borderRadius:'6px', border:'1px solid #e2e8f0', fontSize:'0.85rem' }}
        >
            <option value={1}>1 CA</option>
            <option value={2}>2 CA</option>
            <option value={3}>3 CA</option>
        </select>
    </div>
)}
                            <button className="btn-outline" onClick={() => { setStep(1); setActiveSession(null); }}>← Back</button>
                            {!isReadOnly && (
                                <>
                                    <label className="btn-outline" style={{ cursor: 'pointer' }}>
                                        <Upload size={14} /> Import Excel
                                        <input type="file" accept=".xlsx,.xls" hidden onChange={handleExcelUpload} />
                                    </label>
<button className="btn-outline" onClick={() => setTemplateModal(true)}>
                                        <Download size={14} /> Download Template
                                    </button>
                                    <button className="btn-primary" onClick={saveAll} disabled={saving || !isDirty}>
                                        {saving ? <RefreshCw size={14} className="spin" /> : <Save size={14} />}
                                        Save All
                                    </button>
                                    <button className="btn-success" onClick={submitForApproval} disabled={saving}>
                                        <CheckCircle size={14} /> Submit for Approval
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="score-limits-bar">
<span>CA Max: <strong>{activeSession.caMaxScore}</strong> × {activeSession.caCount} = <strong>{activeSession.caMaxScore * activeSession.caCount}</strong> &nbsp;|&nbsp;</span>
                        <span>Exam Max: <strong>{activeSession.examMaxScore}</strong> &nbsp;|&nbsp;</span>
                        <span>Total Max: <strong>{activeSession.totalMaxScore}</strong> &nbsp;|&nbsp;</span>
                        <span>Students: <strong>{results.length}</strong></span>
                    </div>

                    <div className="results-table-wrapper">
                        <table className="results-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Student Name</th>
                                    <th>CA 1 <small>/{activeSession.caMaxScore}</small></th>
                                    {caCount >= 2 && <th>CA 2 <small>/{activeSession.caMaxScore}</small></th>}
                                    {caCount >= 3 && <th>CA 3 <small>/{activeSession.caMaxScore}</small></th>}
                                    <th>Total CA <small>/{caCount * activeSession.caMaxScore}</small></th>
                                    <th>Exam <small>/{activeSession.examMaxScore}</small></th>
                                    <th>Total <small>/{activeSession.totalMaxScore}</small></th>
                                    <th>Grade</th>
                                    <th>Pos</th>
                                    <th>Absent</th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.map((r, idx) => {
                                    const ca1 = parseFloat(r.ca1Score) || 0;
                                    const ca2 = caCount >= 2 ? (parseFloat(r.ca2Score) || 0) : 0;
                                    const ca3 = caCount >= 3 ? (parseFloat(r.ca3Score) || 0) : 0;
                                    const exam = parseFloat(r.examScore) || 0;
                                    const totalCA = ca1 + ca2 + ca3;
                                    const total = totalCA + exam;
                                    return (
                                        <tr key={r.resultId} className={r.isAbsent ? 'absent-row' : ''}>
                                            <td>{idx + 1}</td>
                                            <td className="student-name-cell">
                                                <div>{r.studentName}</div>
                                                <small className="student-id">{r.studentId}</small>
                                            </td>
                                            <td>
                                                {isReadOnly ? <span>{r.ca1Score || '-'}</span> :
                                                    <input type="number" className="score-input" value={r.ca1Score || ''} min={0} max={activeSession.caMaxScore}
                                                        onChange={e => handleScoreChange(r.resultId, 'ca1Score', e.target.value)} disabled={r.isAbsent} />}
                                            </td>
                                            {caCount >= 2 && (
                                                <td>{isReadOnly ? <span>{r.ca2Score || '-'}</span> :
                                                    <input type="number" className="score-input" value={r.ca2Score || ''} min={0} max={activeSession.caMaxScore}
                                                        onChange={e => handleScoreChange(r.resultId, 'ca2Score', e.target.value)} disabled={r.isAbsent} />}
                                                </td>
                                            )}
                                            {caCount >= 3 && (
                                                <td>{isReadOnly ? <span>{r.ca3Score || '-'}</span> :
                                                    <input type="number" className="score-input" value={r.ca3Score || ''} min={0} max={activeSession.caMaxScore}
                                                        onChange={e => handleScoreChange(r.resultId, 'ca3Score', e.target.value)} disabled={r.isAbsent} />}
                                                </td>
                                            )}
                                            <td className="computed-cell">{r.isAbsent ? '-' : totalCA.toFixed(1)}</td>
                                            <td>
                                                {isReadOnly ? <span>{r.examScore || '-'}</span> :
                                                    <input type="number" className="score-input" value={r.examScore || ''} min={0} max={activeSession.examMaxScore}
                                                        onChange={e => handleScoreChange(r.resultId, 'examScore', e.target.value)} disabled={r.isAbsent} />}
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
                            {activeSession.status === 'submitted' && ' Waiting for admin approval.'}
                            {activeSession.status === 'approved' && ` Approved by ${activeSession.approvedBy}.`}
                        </div>
                    )}
                </div>
            )}


            {/* Template Column Picker Modal */}
{templateModal && activeSession && (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ background:'#fff', borderRadius:'12px', padding:'28px', minWidth:'320px', boxShadow:'0 8px 32px rgba(0,0,0,0.2)' }}>
            <h3 style={{ marginBottom:'8px' }}>Choose Template Columns</h3>
            <p style={{ fontSize:'0.85rem', color:'#64748b', marginBottom:'16px' }}>
                Select which score columns to include. Existing saved scores will be pre-filled so you don't lose them.
            </p>
            {[
                { key:'ca1', label:'CA 1 Score' },
                { key:'ca2', label:'CA 2 Score', hide: activeSession.caCount < 2 },
                { key:'ca3', label:'CA 3 Score', hide: activeSession.caCount < 3 },
                { key:'exam', label:'Exam Score' },
            ].filter(c => !c.hide).map(col => (
                <label key={col.key} style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'12px', cursor:'pointer', fontSize:'0.95rem' }}>
                    <input
                        type="checkbox"
                        checked={templateCols[col.key]}
                        onChange={e => setTemplateCols(p => ({ ...p, [col.key]: e.target.checked }))}
                        style={{ width:'16px', height:'16px' }}
                    />
                    {col.label}
                    {/* Show how many already have scores */}
                    <span style={{ fontSize:'0.78rem', color:'#94a3b8', marginLeft:'auto' }}>
                        {results.filter(r => r[`${col.key}Score`] > 0).length}/{results.length} filled
                    </span>
                </label>
            ))}
            <div style={{ display:'flex', gap:'10px', marginTop:'20px' }}>
                <button className="btn-primary" onClick={() => downloadTemplate(templateCols)}
                    disabled={!Object.values(templateCols).some(Boolean)}>
                    <Download size={14} /> Download
                </button>
                <button className="btn-outline" onClick={() => setTemplateModal(false)}>Cancel</button>
            </div>
        </div>
    </div>
)}
        </div>
    );
}