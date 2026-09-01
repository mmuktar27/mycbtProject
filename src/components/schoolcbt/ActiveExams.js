// pages/cbt/ActiveExams.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Monitor, Clock, Wifi, RefreshCw, LogOut, AlertCircle, CheckCircle } from 'lucide-react';

const API = '/api';

export default function ActiveExams() {
    const [exams, setExams] = useState([]);
    const [selectedExam, setSelectedExam] = useState(null);
    const [liveStatus, setLiveStatus] = useState(null);
    const [networkInfo, setNetworkInfo] = useState(null);
    const [alert, setAlert] = useState(null);
    const [loading, setLoading] = useState(false);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const pollRef = useRef(null);

    useEffect(() => { loadExams(); loadNetworkInfo(); }, []);

    useEffect(() => {
        clearInterval(pollRef.current);
        if (selectedExam && autoRefresh) {
            pollRef.current = setInterval(() => loadLiveStatus(selectedExam.id, true), 10000);
        }
        return () => clearInterval(pollRef.current);
    }, [selectedExam, autoRefresh]);

    async function loadExams() {
        try {
            const res = await fetch(`${API}/cbt/exams`);
            const data = await res.json();
            if (data.success) setExams(data.data.filter(e => ['draft','active','paused'].includes(e.status)));
        } catch (e) { showAlert('error', e.message); }
    }

    async function loadNetworkInfo() {
        try {
            const res = await fetch(`${API}/cbt/network-info`);
            const data = await res.json();
            if (data.success) setNetworkInfo(data.data);
        } catch (e) {}
    }

    async function loadLiveStatus(examId, silent = false) {
        if (!silent) setLoading(true);
        try {
            const res = await fetch(`${API}/cbt/exams/${examId}/status`);
            const data = await res.json();
            if (data.success) setLiveStatus(data.data);
        } catch (e) { if (!silent) showAlert('error', e.message); }
        if (!silent) setLoading(false);
    }

    function showAlert(type, msg) {
        setAlert({ type, msg });
        setTimeout(() => setAlert(null), 5000);
    }

    async function doExamAction(action, examId, confirmMsg) {
        if (confirmMsg && !window.confirm(confirmMsg)) return;
        setLoading(true);
        try {
            const res = await fetch(`${API}/cbt/exams/${examId}/${action}`, { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                showAlert('success', data.message || `Done`);
                await loadExams();
                if (action === 'end') { setSelectedExam(null); setLiveStatus(null); }
                else await loadLiveStatus(examId);
            } else showAlert('error', data.message);
        } catch (e) { showAlert('error', e.message); }
        setLoading(false);
    }

    async function forceSubmit(candidateId, examId) {
        if (!window.confirm('Force submit this candidate?')) return;
        try {
            const res = await fetch(`${API}/cbt/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ candidateId, examId, timeRemaining: 0 })
            });
            const data = await res.json();
            if (data.success) { showAlert('success', 'Submitted'); await loadLiveStatus(examId); }
        } catch (e) { showAlert('error', e.message); }
    }

    const statusColor = { draft: '#94a3b8', active: '#10b981', paused: '#f59e0b', ended: '#6366f1' };
    const statusBg   = { draft: '#f8fafc',  active: '#f0fdf4', paused: '#fffbeb', ended: '#eef2ff' };

    return (
        <div style={{ padding: '24px', display: 'flex', gap: '24px' }}>
            {/* Sidebar */}
            <div style={{ width: '280px', flexShrink: 0 }}>
                <h2 style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '16px' }}>Manage Exams</h2>

                {alert && (
                    <div style={{ padding: '10px 14px', borderRadius: '8px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', background: alert.type === 'error' ? '#fef2f2' : '#f0fdf4', color: alert.type === 'error' ? '#dc2626' : '#16a34a', fontSize: '0.85rem', border: `1px solid ${alert.type === 'error' ? '#fecaca' : '#bbf7d0'}` }}>
                        {alert.type === 'error' ? <AlertCircle size={14} /> : <CheckCircle size={14} />}
                        {alert.msg}
                    </div>
                )}

                {networkInfo && networkInfo.addresses.length > 0 && (
                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '12px', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                            <Wifi size={13} color="#16a34a" />
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#16a34a' }}>Student Login URLs</span>
                        </div>
                        {networkInfo.addresses.map((ip, i) => (
                            <div key={i} style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: '#047857', wordBreak: 'break-all' }}>
                                http://{ip}:{networkInfo.port}/cbt-login
                            </div>
                        ))}
                        <p style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '6px', marginBottom: 0 }}>Same network only</p>
                    </div>
                )}

                {exams.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px 16px', color: '#94a3b8', background: '#f8fafc', borderRadius: '10px', fontSize: '0.85rem' }}>
                        <Monitor size={32} style={{ margin: '0 auto 8px' }} />
                        No active exams.<br />
                        <a href="/cbt/create" style={{ color: '#6366f1' }}>+ Create one</a>
                    </div>
                ) : exams.map(exam => (
                    <div key={exam.id} onClick={() => { setSelectedExam(exam); loadLiveStatus(exam.id); }}
                        style={{ padding: '14px', borderRadius: '10px', border: `2px solid ${selectedExam?.id === exam.id ? '#6366f1' : '#e2e8f0'}`, background: selectedExam?.id === exam.id ? '#eef2ff' : '#fff', cursor: 'pointer', marginBottom: '10px', transition: 'all 0.15s' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{exam.title}</div>
                            <span style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: '10px', background: statusBg[exam.status], color: statusColor[exam.status], fontWeight: 700, whiteSpace: 'nowrap', marginLeft: '6px' }}>{exam.status}</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#6366f1', fontWeight: 700, letterSpacing: '2px', marginTop: '4px' }}>{exam.examCode}</div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '3px' }}>
                            {exam.candidateCount} candidates · {exam.totalTime} min
                        </div>
                    </div>
                ))}
            </div>

            {/* Main panel */}
            <div style={{ flex: 1, minWidth: 0 }}>
                {!selectedExam ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#94a3b8', flexDirection: 'column', gap: '12px' }}>
                        <Monitor size={56} /><p>Select an exam to monitor</p>
                    </div>
                ) : (
                    <>
                        {/* Header controls */}
                        <div style={{ background: '#fff', borderRadius: '12px', padding: '18px 20px', border: '1px solid #e2e8f0', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                            <div>
                                <h2 style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '2px' }}>{selectedExam.title}</h2>
                                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                    Code: <strong style={{ color: '#6366f1', fontSize: '1rem', letterSpacing: '3px' }}>{selectedExam.examCode}</strong>
                                    &nbsp;·&nbsp;{selectedExam.totalTime} min · {selectedExam.examType}
                                </span>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                {selectedExam.status === 'draft' && (
                                    <button onClick={() => doExamAction('start', selectedExam.id, 'Start exam now? Candidates can login immediately.')} disabled={loading}
                                        style={{ padding: '8px 16px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Play size={14} /> Start Exam
                                    </button>
                                )}
                                {selectedExam.status === 'active' && (
                                    <>
                                        <button onClick={() => doExamAction('pause', selectedExam.id)}
                                            style={{ padding: '8px 16px', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Pause size={14} /> Pause
                                        </button>
                                        <button onClick={() => doExamAction('end', selectedExam.id, 'End exam for ALL candidates? This cannot be undone.')} disabled={loading}
                                            style={{ padding: '8px 16px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Square size={14} /> End Exam
                                        </button>
                                    </>
                                )}
                                {selectedExam.status === 'paused' && (
                                    <>
                                        <div style={{ padding: '8px 14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', fontSize: '0.85rem', color: '#92400e', fontWeight: 600 }}>
                                            ⏸ PAUSED — Students cannot answer
                                        </div>
                                        <button onClick={() => doExamAction('pause', selectedExam.id)}
                                            style={{ padding: '8px 16px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Play size={14} /> Resume
                                        </button>
                                        <button onClick={() => doExamAction('end', selectedExam.id, 'End exam permanently?')} disabled={loading}
                                            style={{ padding: '8px 16px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Square size={14} /> End
                                        </button>
                                    </>
                                )}
                                <button onClick={() => loadLiveStatus(selectedExam.id)} disabled={loading}
                                    style={{ padding: '8px 10px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer' }}>
                                    <RefreshCw size={14} />
                                </button>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', cursor: 'pointer', color: '#64748b' }}>
                                    <input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)} />
                                    Auto (10s)
                                </label>
                            </div>
                        </div>

                        {/* Stats */}
                        {liveStatus && (
                            <>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
                                    {[
                                        { label: 'Total', value: liveStatus.total, color: '#6366f1', bg: '#eef2ff' },
                                        { label: 'Active Now', value: liveStatus.active, color: '#10b981', bg: '#f0fdf4' },
                                        { label: 'Submitted', value: liveStatus.submitted, color: '#3b82f6', bg: '#eff6ff' },
                                        { label: 'Not Logged In', value: liveStatus.registered, color: '#f59e0b', bg: '#fffbeb' },
                                    ].map(s => (
                                        <div key={s.label} style={{ background: s.bg, borderRadius: '10px', padding: '16px', textAlign: 'center', border: `1px solid ${s.color}25` }}>
                                            <div style={{ fontSize: '2rem', fontWeight: 900, color: s.color }}>{s.value}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{s.label}</div>
                                        </div>
                                    ))}
                                </div>

                                {/* Progress bar */}
                                <div style={{ background: '#fff', borderRadius: '10px', padding: '14px 18px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#64748b', marginBottom: '8px' }}>
                                        <span>Exam Progress</span>
                                        <span>{liveStatus.submitted} / {liveStatus.total} submitted ({liveStatus.total > 0 ? Math.round((liveStatus.submitted / liveStatus.total) * 100) : 0}%)</span>
                                    </div>
                                    <div style={{ background: '#e2e8f0', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                                        <div style={{ width: `${liveStatus.total > 0 ? (liveStatus.submitted / liveStatus.total) * 100 : 0}%`, height: '100%', background: '#10b981', borderRadius: '4px', transition: 'width 0.5s' }} />
                                    </div>
                                </div>

                                {/* Active candidates live table */}
                                <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                                    <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: selectedExam.status === 'active' ? '#10b981' : '#94a3b8' }} />
                                        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0 }}>
                                            Active Candidates ({liveStatus.activeCandidates?.length || 0})
                                        </h3>
                                    </div>
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
                                            <thead style={{ background: '#f8fafc' }}>
                                                <tr>
                                                    {['Name','Reg No','Class','Time Left','Started At','Action'].map(h => (
                                                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontWeight: 600, fontSize: '0.78rem' }}>{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(liveStatus.activeCandidates || []).map(c => {
                                                    const mins = c.timeRemaining != null ? Math.floor(c.timeRemaining / 60) : '-';
                                                    const urgent = typeof mins === 'number' && mins <= 10;
                                                    return (
                                                        <tr key={c.candidateId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                            <td style={{ padding: '10px 14px', fontWeight: 600 }}>{c.fullName}</td>
                                                            <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: '#64748b' }}>{c.regNo}</td>
                                                            <td style={{ padding: '10px 14px', color: '#64748b' }}>{c.className || '-'}</td>
                                                            <td style={{ padding: '10px 14px' }}>
                                                                <span style={{ color: urgent ? '#ef4444' : '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                    <Clock size={12} />{mins}m
                                                                </span>
                                                            </td>
                                                            <td style={{ padding: '10px 14px', color: '#94a3b8', fontSize: '0.75rem' }}>
                                                                {c.startedAt ? new Date(c.startedAt).toLocaleTimeString() : '-'}
                                                            </td>
                                                            <td style={{ padding: '10px 14px' }}>
                                                                <button onClick={() => forceSubmit(c.candidateId, selectedExam.id)}
                                                                    title="Force submit this candidate"
                                                                    style={{ padding: '4px 10px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer', color: '#ef4444', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                    <LogOut size={11} /> Submit
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                                {(!liveStatus.activeCandidates || liveStatus.activeCandidates.length === 0) && (
                                                    <tr><td colSpan={6} style={{ padding: '28px', textAlign: 'center', color: '#94a3b8' }}>No candidates currently active</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}