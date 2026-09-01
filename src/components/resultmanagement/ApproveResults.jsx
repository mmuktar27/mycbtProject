import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Eye, RefreshCw, AlertCircle, ClipboardCheck } from 'lucide-react';
import './Results.css';

const API = '/api';

export default function ApproveResults() {
    const [sessions, setSessions] = useState([]);
    const [activeSession, setActiveSession] = useState(null);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [alert, setAlert] = useState(null);
    const [approvedBy, setApprovedBy] = useState('Admin');
    const [rejectionReason, setRejectionReason] = useState('');
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [filterTerm, setFilterTerm] = useState('');
    const [filterYear, setFilterYear] = useState('');
    const [stats, setStats] = useState({});

    useEffect(() => {
        loadPendingApprovals();
        loadStats();
    }, [filterTerm, filterYear]);

    async function loadPendingApprovals() {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filterTerm) params.append('term', filterTerm);
            if (filterYear) params.append('academicYear', filterYear);
            const res = await fetch(`${API}/results/pending-approval?${params}`);
            const data = await res.json();
            if (data.success) setSessions(data.data);
        } catch (e) { showAlert('error', e.message); }
        setLoading(false);
    }

    async function loadStats() {
        try {
            const params = new URLSearchParams();
            if (filterYear) params.append('academicYear', filterYear);
            if (filterTerm) params.append('term', filterTerm);
            const res = await fetch(`${API}/results/statistics?${params}`);
            const data = await res.json();
            if (data.success) setStats(data.data);
        } catch (e) { }
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
        } catch (e) { showAlert('error', e.message); }
        setLoading(false);
    }

    function showAlert(type, msg) {
        setAlert({ type, msg });
        setTimeout(() => setAlert(null), 6000);
    }

    async function handleApprove() {
        if (!activeSession) return;
        if (!window.confirm(`Approve results for ${activeSession.subjectName} - ${activeSession.className}?`)) return;
        setProcessing(true);
        try {
            const res = await fetch(`${API}/results/sessions/${activeSession.sessionId}/approve`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'approve', approvedBy })
            });
            const data = await res.json();
            if (data.success) {
                showAlert('success', '✅ Results approved successfully!');
                setActiveSession(null);
                setResults([]);
                await loadPendingApprovals();
                await loadStats();
            } else showAlert('error', data.message);
        } catch (e) { showAlert('error', e.message); }
        setProcessing(false);
    }

    async function handleReject() {
        if (!rejectionReason.trim()) return showAlert('error', 'Please provide a rejection reason');
        setProcessing(true);
        try {
            const res = await fetch(`${API}/results/sessions/${activeSession.sessionId}/approve`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'reject', approvedBy, rejectionReason })
            });
            const data = await res.json();
            if (data.success) {
                showAlert('success', 'Results rejected and returned for revision.');
                setActiveSession(null);
                setResults([]);
                setShowRejectModal(false);
                setRejectionReason('');
                await loadPendingApprovals();
                await loadStats();
            } else showAlert('error', data.message);
        } catch (e) { showAlert('error', e.message); }
        setProcessing(false);
    }

    const passCount = results.filter(r => !r.isAbsent && r.totalScore >= 40).length;
    const failCount = results.filter(r => !r.isAbsent && r.totalScore < 40).length;
    const absentCount = results.filter(r => r.isAbsent).length;
    const average = results.length > 0
        ? (results.filter(r => !r.isAbsent).reduce((s, r) => s + (r.totalScore || 0), 0) / (results.filter(r => !r.isAbsent).length || 1)).toFixed(2)
        : '-';

    return (
        <div className="results-page">
            <div className="results-header">
                <h1><ClipboardCheck size={24} /> Approve Results</h1>
                <p>Review and approve submitted result sessions</p>
            </div>

            {alert && (
                <div className={`results-alert ${alert.type}`}>
                    {alert.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
                    {alert.msg}
                </div>
            )}

            {/* Stats cards */}
            <div className="stats-cards">
                <div className="stat-card blue">
                    <div className="stat-number">{stats.totalSessions || 0}</div>
                    <div className="stat-label">Total Sessions</div>
                </div>
                <div className="stat-card orange">
                    <div className="stat-number">{stats.submittedSessions || 0}</div>
                    <div className="stat-label">Pending Approval</div>
                </div>
                <div className="stat-card green">
                    <div className="stat-number">{stats.approvedSessions || 0}</div>
                    <div className="stat-label">Approved</div>
                </div>
                <div className="stat-card gray">
                    <div className="stat-number">{stats.openSessions || 0}</div>
                    <div className="stat-label">Open / Draft</div>
                </div>
            </div>

            <div className="results-layout">
                {/* Pending sessions panel */}
                <div className="sessions-panel">
                    <div className="panel-header">
                        <h3>Pending Approvals</h3>
                        <button className="btn-icon" onClick={loadPendingApprovals} disabled={loading}>
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
                    </div>
                    <div className="session-list">
                        {loading ? (
                            <div className="loading-state"><RefreshCw size={20} className="spin" /></div>
                        ) : sessions.length === 0 ? (
                            <div className="empty-state">
                                <CheckCircle size={32} color="#22c55e" />
                                <p>No sessions pending approval</p>
                            </div>
                        ) : sessions.map(s => (
                            <div
                                key={s.sessionId}
                                className={`session-item pending ${activeSession?.sessionId === s.sessionId ? 'active' : ''}`}
                                onClick={() => openSession(s.sessionId)}
                            >
                                <div className="session-item-title">{s.subjectName}</div>
                                <div className="session-item-meta">{s.className} · {s.term}</div>
                                <div className="session-item-meta">{s.academicYear}</div>
                                <div className="session-item-meta">Submitted by: {s.createdBy}</div>
                                <span className="status-badge submitted">Pending</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Review panel */}
                <div className="entry-panel">
                    {!activeSession ? (
                        <div className="select-session-placeholder">
                            <ClipboardCheck size={48} />
                            <p>Select a session from the left to review</p>
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
                                    <div className="form-group inline">
                                        <label>Approved By:</label>
                                        <input value={approvedBy} onChange={e => setApprovedBy(e.target.value)} style={{ width: '160px' }} />
                                    </div>
                                    <button className="btn-danger-outline" onClick={() => setShowRejectModal(true)} disabled={processing}>
                                        <XCircle size={14} /> Reject
                                    </button>
                                    <button className="btn-success" onClick={handleApprove} disabled={processing}>
                                        {processing ? <RefreshCw size={14} className="spin" /> : <CheckCircle size={14} />}
                                        Approve
                                    </button>
                                </div>
                            </div>

                            {/* Summary statistics */}
                            <div className="review-stats">
                                <div className="rev-stat"><span>Students</span><strong>{results.length}</strong></div>
                                <div className="rev-stat pass"><span>Passed</span><strong>{passCount}</strong></div>
                                <div className="rev-stat fail"><span>Failed</span><strong>{failCount}</strong></div>
                                <div className="rev-stat absent"><span>Absent</span><strong>{absentCount}</strong></div>
                                <div className="rev-stat"><span>Class Avg</span><strong>{average}</strong></div>
                                <div className="rev-stat">
                                    <span>Pass Rate</span>
                                    <strong>{results.length > 0 ? ((passCount / (results.length - absentCount || 1)) * 100).toFixed(0) : 0}%</strong>
                                </div>
                            </div>

                            {/* Grade distribution */}
                            <div className="grade-distribution">
                                {['A', 'B', 'C', 'D', 'F'].map(g => {
                                    const cnt = results.filter(r => r.grade === g).length;
                                    const pct = results.length > 0 ? (cnt / results.length * 100).toFixed(0) : 0;
                                    return (
                                        <div key={g} className={`grade-dist-item grade-${g}`}>
                                            <div className="grade-dist-bar" style={{ height: `${pct}%` }}></div>
                                            <div className="grade-dist-label">{g}</div>
                                            <div className="grade-dist-count">{cnt}</div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Results table */}
                            <div className="results-table-wrapper">
                                <table className="results-table">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Student Name</th>
                                            <th>CA 1</th>
                                            <th>CA 2</th>
                                            <th>CA 3</th>
                                            <th>Total CA</th>
                                            <th>Exam</th>
                                            <th>Total</th>
                                            <th>Grade</th>
                                            <th>Pos</th>
                                            <th>Remark</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {results.map((r, idx) => (
                                            <tr key={r.resultId} className={r.isAbsent ? 'absent-row' : ''}>
                                                <td>{idx + 1}</td>
                                                <td className="student-name-cell">
                                                    <div>{r.studentName}</div>
                                                    <small className="student-id">{r.studentId}</small>
                                                </td>
                                                <td>{r.ca1Score ?? '-'}</td>
                                                <td>{r.ca2Score ?? '-'}</td>
                                                <td>{r.ca3Score ?? '-'}</td>
                                                <td>{r.totalCA ?? '-'}</td>
                                                <td>{r.examScore ?? '-'}</td>
                                                <td className={`total-cell ${!r.isAbsent && r.totalScore >= 40 ? 'pass' : 'fail'}`}>
                                                    {r.isAbsent ? 'ABS' : r.totalScore?.toFixed(1)}
                                                </td>
                                                <td className={`grade-cell grade-${r.grade || 'F'}`}>{r.grade || '-'}</td>
                                                <td className="position-cell">{r.position || '-'}</td>
                                                <td>{r.remark || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="modal-overlay">
                    <div className="modal-box">
                        <h3><XCircle size={20} color="#ef4444" /> Reject Results</h3>
                        <p>Provide a reason for rejection. The teacher will be able to re-edit and resubmit.</p>
                        <textarea
                            rows={4}
                            value={rejectionReason}
                            onChange={e => setRejectionReason(e.target.value)}
                            placeholder="e.g. Some scores exceed the maximum allowed. Please verify and resubmit."
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '12px' }}
                        />
                        <div className="modal-actions">
                            <button className="btn-outline" onClick={() => { setShowRejectModal(false); setRejectionReason(''); }}>Cancel</button>
                            <button className="btn-danger" onClick={handleReject} disabled={processing}>
                                {processing ? <RefreshCw size={14} className="spin" /> : <XCircle size={14} />}
                                Confirm Rejection
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}