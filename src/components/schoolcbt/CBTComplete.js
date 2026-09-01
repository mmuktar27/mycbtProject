// pages/cbt/CBTComplete.jsx
// Shown after a student submits their exam.
// Route: /cbt-complete
// If exam.showResultImmediately = true, shows their score breakdown.
// Otherwise shows a "submitted successfully" screen.

import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, Trophy, Clock, BookOpen, AlertCircle } from 'lucide-react';

export default function CBTComplete() {
    const location  = useLocation();
    const navigate  = useNavigate();
    const state     = location.state || {};

    const {
        auto           = false,   // true = time ran out
        showResult     = false,   // from exam config
        result         = null,    // result object from backend
        candidate      = {},
        exam           = {},
        totalAnswered  = 0,
        totalQuestions = 0,
    } = state;

    // Derive subject breakdown from result
    const subjectScores = result?.subjectScores
        ? (typeof result.subjectScores === 'string'
            ? JSON.parse(result.subjectScores)
            : result.subjectScores)
        : null;

    const gradeColor = { A: '#16a34a', B: '#2563eb', C: '#d97706', D: '#9333ea', F: '#dc2626' };
    const grade      = result?.grade || 'F';
    const passed     = result?.passed;
    const pct        = result?.percentage?.toFixed(1) ?? '—';

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #1e3a5f 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
        }}>
            <div style={{ width: '100%', maxWidth: '560px' }}>

                {/* ── Main card ── */}
                <div style={{
                    background: '#fff',
                    borderRadius: '20px',
                    overflow: 'hidden',
                    boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
                }}>

                    {/* Header band */}
                    <div style={{
                        background: auto
                            ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                            : passed === false
                                ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                                : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                        padding: '32px 28px',
                        textAlign: 'center',
                    }}>
                        <div style={{
                            width: '72px', height: '72px',
                            borderRadius: '50%',
                            background: 'rgba(255,255,255,0.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 16px',
                        }}>
                            {auto
                                ? <Clock size={36} color="#fff" />
                                : <CheckCircle size={36} color="#fff" />
                            }
                        </div>

                        <h1 style={{ color: '#fff', fontWeight: 900, fontSize: '1.5rem', marginBottom: '6px' }}>
                            {auto ? 'Time Up! Submitted Automatically' : 'Exam Submitted Successfully'}
                        </h1>
                        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>
                            {exam.title}
                        </p>
                    </div>

                    {/* Body */}
                    <div style={{ padding: '28px' }}>

                        {/* Candidate info strip */}
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '14px',
                            background: '#f8fafc', borderRadius: '10px',
                            padding: '14px 16px', marginBottom: '24px',
                        }}>
                            <div style={{
                                width: '44px', height: '44px', borderRadius: '50%',
                                background: '#6366f1',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 900, fontSize: '1.1rem', color: '#fff', flexShrink: 0,
                            }}>
                                {candidate.fullName?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e293b' }}>{candidate.fullName}</div>
                                <div style={{ fontSize: '0.78rem', color: '#64748b', fontFamily: 'monospace' }}>{candidate.regNo}</div>
                            </div>
                            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Questions answered</div>
                                <div style={{ fontWeight: 800, color: '#1e293b' }}>{totalAnswered} / {totalQuestions}</div>
                            </div>
                        </div>

                        {/* ── Show result immediately ── */}
                        {showResult && result ? (
                            <>
                                {/* Big score */}
                                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                                    <div style={{
                                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                        width: '100px', height: '100px', borderRadius: '50%',
                                        border: `5px solid ${gradeColor[grade] || '#64748b'}`,
                                        marginBottom: '12px',
                                    }}>
                                        <span style={{ fontWeight: 900, fontSize: '2rem', color: gradeColor[grade] || '#64748b' }}>
                                            {grade}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#1e293b', lineHeight: 1 }}>
                                        {pct}%
                                    </div>
                                    <div style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '4px' }}>
                                        {result.totalScore?.toFixed(1)} / {result.totalMarks?.toFixed(1)} marks
                                    </div>
                                    <div style={{
                                        display: 'inline-block', marginTop: '10px',
                                        padding: '6px 20px', borderRadius: '20px',
                                        background: passed ? '#f0fdf4' : '#fef2f2',
                                        color: passed ? '#16a34a' : '#dc2626',
                                        fontWeight: 800, fontSize: '0.9rem',
                                    }}>
                                        {passed ? '✓ PASS' : '✗ FAIL'}
                                    </div>
                                </div>

                                {/* Subject breakdown */}
                                {subjectScores && Array.isArray(subjectScores) && subjectScores.length > 0 && (
                                    <div style={{ marginBottom: '20px' }}>
                                        <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151', marginBottom: '10px' }}>
                                            <BookOpen size={14} style={{ verticalAlign: 'middle', marginRight: '5px' }} />
                                            Subject Breakdown
                                        </h3>
                                        {subjectScores.map((subj, i) => {
                                            const subPct = subj.percentage ?? (subj.totalMarks > 0 ? (subj.score / subj.totalMarks) * 100 : 0);
                                            return (
                                                <div key={i} style={{ marginBottom: '10px' }}>
                                                    <div style={{
                                                        display: 'flex', justifyContent: 'space-between',
                                                        fontSize: '0.82rem', marginBottom: '4px',
                                                    }}>
                                                        <span style={{ color: '#374151', fontWeight: 600 }}>{subj.subjectName}</span>
                                                        <span style={{ color: '#64748b' }}>
                                                            {subj.score?.toFixed(1)} / {subj.totalMarks?.toFixed(1)}
                                                            &nbsp;
                                                            <strong style={{ color: gradeColor[subj.grade] || '#64748b' }}>
                                                                ({subj.grade})
                                                            </strong>
                                                        </span>
                                                    </div>
                                                    <div style={{ background: '#e2e8f0', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                                                        <div style={{
                                                            width: `${Math.min(subPct, 100)}%`,
                                                            height: '100%',
                                                            background: subPct >= 70 ? '#10b981' : subPct >= 50 ? '#f59e0b' : '#ef4444',
                                                            borderRadius: '4px',
                                                            transition: 'width 0.8s ease',
                                                        }} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Time taken */}
                                {result.timeTaken && (
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: '8px',
                                        padding: '10px 14px', background: '#f8fafc',
                                        borderRadius: '8px', marginBottom: '20px',
                                        fontSize: '0.82rem', color: '#64748b',
                                    }}>
                                        <Clock size={14} />
                                        Time taken: <strong style={{ color: '#1e293b' }}>
                                            {Math.floor(result.timeTaken / 60)}m {result.timeTaken % 60}s
                                        </strong>
                                    </div>
                                )}
                            </>
                        ) : (
                            /* ── Result NOT shown immediately ── */
                            <div style={{
                                textAlign: 'center', padding: '24px',
                                background: '#f8fafc', borderRadius: '12px',
                                marginBottom: '20px',
                            }}>
                                <Trophy size={40} color="#6366f1" style={{ marginBottom: '12px' }} />
                                <h3 style={{ fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
                                    Your answers have been recorded
                                </h3>
                                <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: '1.6' }}>
                                    Results will be released by your invigilator.<br />
                                    Please do not close this browser.
                                </p>
                            </div>
                        )}

                        {/* Warning if auto-submitted */}
                        {auto && (
                            <div style={{
                                display: 'flex', gap: '10px', alignItems: 'flex-start',
                                padding: '12px 14px', background: '#fffbeb',
                                border: '1px solid #fde68a', borderRadius: '8px',
                                marginBottom: '20px', fontSize: '0.82rem', color: '#92400e',
                            }}>
                                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
                                <span>
                                    Your exam was submitted automatically because the time limit was reached.
                                    All answers you selected have been saved.
                                </span>
                            </div>
                        )}

                        {/* Footer note */}
                        <div style={{
                            textAlign: 'center', padding: '16px',
                            background: '#f0fdf4', borderRadius: '10px',
                            fontSize: '0.82rem', color: '#166534',
                        }}>
                            ✅ Your submission is confirmed. You may inform your supervisor.
                        </div>
                    </div>
                </div>

                {/* Small note outside card */}
                <p style={{
                    textAlign: 'center', color: 'rgba(255,255,255,0.35)',
                    fontSize: '0.75rem', marginTop: '20px',
                }}>
                    You can close this window now.
                </p>
            </div>
        </div>
    );
}