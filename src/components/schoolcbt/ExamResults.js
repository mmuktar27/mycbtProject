// pages/cbt/ExamResults.jsx
import React, { useState, useEffect } from 'react';
import { Download, FileSpreadsheet, RefreshCw, AlertCircle, CheckCircle, Trophy } from 'lucide-react';
import * as XLSX from 'xlsx';

const API = '/api';

export default function ExamResults() {
    const [exams, setExams] = useState([]);
    const [selectedExam, setSelectedExam] = useState(null);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState(null);
    const [filterClass, setFilterClass] = useState('');
    const [pushModal, setPushModal] = useState(false);
    const [pushConfig, setPushConfig] = useState({ sessionId: '', scoreMode: 'ca1' });
    const [resultSessions, setResultSessions] = useState([]);

    useEffect(() => { loadExams(); }, []);

    async function loadExams() {
        try {
            const res = await fetch(`${API}/cbt/exams`);
            const data = await res.json();
            if (data.success) setExams(data.data.filter(e => e.status === 'ended' || e.submittedCount > 0));
        } catch (e) { showAlert('error', e.message); }
    }

    async function loadResults(exam) {
        setSelectedExam(exam);
        setLoading(true);
        try {
            const res = await fetch(`${API}/cbt/exams/${exam.id}/results`);
            const data = await res.json();
            if (data.success) setResults(data.data.results);
            else showAlert('error', data.message);
        } catch (e) { showAlert('error', e.message); }
        setLoading(false);
    }

    async function computeResults(examId) {
        setLoading(true);
        try {
            const res = await fetch(`${API}/cbt/exams/${examId}/compute-results`, { method: 'POST' });
            const data = await res.json();
            if (data.success) { showAlert('success', `Computed ${data.data.computed} results`); await loadResults(selectedExam); }
        } catch (e) { showAlert('error', e.message); }
        setLoading(false);
    }

    function showAlert(type, msg) { setAlert({ type, msg }); setTimeout(() => setAlert(null), 5000); }

    async function downloadExcel() {
        if (!selectedExam) return;
        const res = await fetch(`${API}/cbt/exams/${selectedExam.id}/results/export`);
        const data = await res.json();
        if (!data.success) return showAlert('error', data.message);
        const ws = XLSX.utils.json_to_sheet(data.data.rows);
        ws['!cols'] = Object.keys(data.data.rows[0] || {}).map(k => ({ wch: Math.max(k.length + 2, 14) }));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Results');
        XLSX.writeFile(wb, `CBT_Results_${data.data.examTitle}.xlsx`);
    }

    function printResults() {
        const filtered = filterClass ? results.filter(r => r.className === filterClass) : results;
        const html = `<!DOCTYPE html><html><head><title>CBT Results</title>
        <style>body{font-family:Arial;font-size:11px}table{width:100%;border-collapse:collapse}
        th{background:#374151;color:#fff;padding:8px;font-size:10px}td{padding:7px 8px;border-bottom:1px solid #e5e7eb}
        tr:nth-child(even){background:#f9fafb}.pass{color:#15803d;font-weight:700}.fail{color:#dc2626;font-weight:700}
        h1{font-size:15px;text-align:center}.meta{text-align:center;color:#555;font-size:10px;margin-bottom:12px}</style></head>
        <body><h1>${selectedExam.title}</h1>
        <div class="meta">Code: ${selectedExam.examCode} | Generated: ${new Date().toLocaleString()}</div>
        <table><thead><tr><th>#</th><th>Name</th><th>Reg No</th><th>Class</th><th>Score</th><th>%</th><th>Grade</th><th>Result</th></tr></thead>
        <tbody>${filtered.map((r,i) => `<tr><td>${i+1}</td><td>${r.fullName}</td><td>${r.regNo}</td><td>${r.className||'-'}</td>
        <td>${r.totalScore?.toFixed(1)||'-'} / ${r.totalMarks?.toFixed(1)||'-'}</td><td>${r.percentage?.toFixed(1)||0}%</td>
        <td>${r.grade||'-'}</td><td class="${r.passed?'pass':'fail'}">${r.passed?'PASS':'FAIL'}</td></tr>`).join('')}</tbody></table>
        </body></html>`;
        const w = window.open('','_blank');
        w.document.write(html);
        w.document.close();
        w.onload = () => { w.focus(); w.print(); };
    }

    async function pushToResults() {
        if (!pushConfig.sessionId) return showAlert('error', 'Select a result session');
        setLoading(true);
        try {
            const res = await fetch(`${API}/cbt/exams/${selectedExam.id}/push-to-results`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pushConfig)
            });
            const data = await res.json();
            if (data.success) { showAlert('success', data.message); setPushModal(false); }
            else showAlert('error', data.message);
        } catch (e) { showAlert('error', e.message); }
        setLoading(false);
    }

    async function loadAndOpenPushModal() {
        const res = await fetch(`${API}/results/sessions`);
        const data = await res.json();
        if (data.success) setResultSessions(data.data.filter(s => s.status === 'open'));
        setPushModal(true);
    }

    const filtered = filterClass ? results.filter(r => r.className === filterClass) : results;
    const classes = [...new Set(results.map(r => r.className).filter(Boolean))];
    const gradeColor = { A: '#16a34a', B: '#2563eb', C: '#d97706', D: '#9333ea', F: '#dc2626' };

    return (
        <div style={{ padding: '24px', display: 'flex', gap: '24px' }}>
            <div style={{ width: '250px', flexShrink: 0 }}>
                <h2 style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '16px' }}>Exam Results</h2>
                {alert && (
                    <div style={{ padding: '10px 14px', borderRadius: '8px', marginBottom: '12px', display: 'flex', gap: '8px', background: alert.type === 'error' ? '#fef2f2' : '#f0fdf4', color: alert.type === 'error' ? '#dc2626' : '#16a34a', fontSize: '0.85rem' }}>
                        {alert.type === 'error' ? <AlertCircle size={14} /> : <CheckCircle size={14} />}
                        {alert.msg}
                    </div>
                )}
                {exams.length === 0 ? (
                    <p style={{ color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center', padding: '32px 0' }}>No completed exams yet.</p>
                ) : exams.map(exam => (
                    <div key={exam.id} onClick={() => loadResults(exam)}
                        style={{ padding: '14px', borderRadius: '10px', border: `2px solid ${selectedExam?.id === exam.id ? '#6366f1' : '#e2e8f0'}`, background: selectedExam?.id === exam.id ? '#eef2ff' : '#fff', cursor: 'pointer', marginBottom: '10px' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: '3px' }}>{exam.title}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{exam.submittedCount} submitted · {exam.examType}</div>
                    </div>
                ))}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
                {!selectedExam ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#94a3b8', flexDirection: 'column', gap: '12px' }}>
                        <Trophy size={56} /><p>Select an exam to view results</p>
                    </div>
                ) : loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40vh' }}>
                        <RefreshCw size={32} />
                    </div>
                ) : (
                    <>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', marginBottom: '16px' }}>
                            {[
                                { label: 'Total', value: filtered.length, color: '#6366f1', bg: '#eef2ff' },
                                { label: 'Passed', value: filtered.filter(r => r.passed).length, color: '#10b981', bg: '#f0fdf4' },
                                { label: 'Failed', value: filtered.filter(r => !r.passed).length, color: '#ef4444', bg: '#fef2f2' },
                                { label: 'Average', value: filtered.length ? (filtered.reduce((s,r) => s+r.percentage,0)/filtered.length).toFixed(1)+'%' : '-', color: '#3b82f6', bg: '#eff6ff' },
                                { label: 'Highest', value: filtered.length ? Math.max(...filtered.map(r=>r.percentage)).toFixed(1)+'%' : '-', color: '#f59e0b', bg: '#fffbeb' },
                            ].map(s => (
                                <div key={s.label} style={{ background: s.bg, borderRadius: '10px', padding: '14px', textAlign: 'center', border: `1px solid ${s.color}22` }}>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 900, color: s.color }}>{s.value}</div>
                                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{s.label}</div>
                                </div>
                            ))}
                        </div>

                        <div style={{ background: '#fff', borderRadius: '10px', padding: '12px 16px', border: '1px solid #e2e8f0', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                {classes.length > 0 && (
                                    <select value={filterClass} onChange={e => setFilterClass(e.target.value)} style={{ padding: '7px 10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.83rem' }}>
                                        <option value="">All Classes</option>
                                        {classes.map(c => <option key={c}>{c}</option>)}
                                    </select>
                                )}
                                <button onClick={() => computeResults(selectedExam.id)} style={{ padding: '7px 12px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <RefreshCw size={12} /> Recompute
                                </button>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={loadAndOpenPushModal} style={{ padding: '7px 14px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem' }}>
                                    → Push to CA/Exam Records
                                </button>
                                <button onClick={downloadExcel} style={{ padding: '7px 14px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <FileSpreadsheet size={13} /> Excel
                                </button>
                                <button onClick={printResults} style={{ padding: '7px 14px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Download size={13} /> Print / PDF
                                </button>
                            </div>
                        </div>

                        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
                                <thead style={{ background: '#f8fafc' }}>
                                    <tr>
                                        {['Pos','Name','Reg No','Class','Score','%','Grade','Status','Time'].map(h => (
                                            <th key={h} style={{ padding: '10px 14px', textAlign: 'left', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontWeight: 600, fontSize: '0.78rem' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((r, i) => (
                                        <tr key={r.candidateId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '10px 14px', fontWeight: 700, color: ['#f59e0b','#94a3b8','#cd7c2f'][i] || '#64748b' }}>
                                                {i < 3 ? ['🥇','🥈','🥉'][i] : i + 1}
                                            </td>
                                            <td style={{ padding: '10px 14px', fontWeight: 600 }}>{r.fullName}</td>
                                            <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: '#64748b', fontSize: '0.78rem' }}>{r.regNo}</td>
                                            <td style={{ padding: '10px 14px', color: '#64748b' }}>{r.className || '-'}</td>
                                            <td style={{ padding: '10px 14px' }}>{r.totalScore?.toFixed(1)} / {r.totalMarks?.toFixed(1)}</td>
                                            <td style={{ padding: '10px 14px', fontWeight: 700 }}>{r.percentage?.toFixed(1)}%</td>
                                            <td style={{ padding: '10px 14px' }}><span style={{ fontWeight: 800, color: gradeColor[r.grade] || '#64748b' }}>{r.grade}</span></td>
                                            <td style={{ padding: '10px 14px' }}>
                                                <span style={{ padding: '3px 10px', borderRadius: '10px', fontSize: '0.73rem', fontWeight: 700, background: r.passed ? '#f0fdf4' : '#fef2f2', color: r.passed ? '#16a34a' : '#dc2626' }}>
                                                    {r.passed ? 'PASS' : 'FAIL'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '10px 14px', color: '#94a3b8', fontSize: '0.78rem' }}>
                                                {r.timeTaken ? `${Math.floor(r.timeTaken/60)}m` : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                    {filtered.length === 0 && (
                                        <tr><td colSpan={9} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>No results. Click Recompute.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>

            {pushModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: '#fff', borderRadius: '12px', padding: '28px', width: '420px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
                        <h3 style={{ fontWeight: 800, marginBottom: '8px' }}>Push Scores to Result Records</h3>
                        <p style={{ fontSize: '0.83rem', color: '#64748b', marginBottom: '18px' }}>Automatically update student CA or Exam scores in an existing result session based on CBT performance.</p>
                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.83rem' }}>Target Session (open only)</label>
                        <select value={pushConfig.sessionId} onChange={e => setPushConfig(p => ({ ...p, sessionId: e.target.value }))}
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '14px' }}>
                            <option value="">-- Select Session --</option>
                            {resultSessions.map(s => <option key={s.sessionId} value={s.sessionId}>{s.className} - {s.subjectName} ({s.term})</option>)}
                        </select>
                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.83rem' }}>Map CBT score to</label>
                        <select value={pushConfig.scoreMode} onChange={e => setPushConfig(p => ({ ...p, scoreMode: e.target.value }))}
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                            <option value="ca1">CA 1 Score</option>
                            <option value="ca2">CA 2 Score</option>
                            <option value="ca3">CA 3 Score</option>
                            <option value="exam">Exam Score</option>
                        </select>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={pushToResults} disabled={loading} style={{ flex: 1, padding: '10px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}>
                                {loading ? 'Pushing...' : 'Push Scores'}
                            </button>
                            <button onClick={() => setPushModal(false)} style={{ padding: '10px 20px', background: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}