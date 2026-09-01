// pages/cbt/CandExam.jsx
// Student exam-taking page — reads session from sessionStorage set by CBTLogin.jsx
// Route: /cbt-exam

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Calculator, ChevronLeft, ChevronRight, Send, AlertCircle, CheckCircle, X } from 'lucide-react';

const API = '/api';

export default function SchoolCandExam() {
    const navigate = useNavigate();

    // ── Load session from storage ──────────────────────────────
    const sessionData = JSON.parse(sessionStorage.getItem('cbt_session') || '{}');
    const { candidate, exam, subjects: rawSubjects, questions: rawQuestions, answers: savedAnswers, timeRemaining: initialTime } = sessionData;

    // Redirect if no session
    useEffect(() => {
        if (!candidate || !exam) {
            navigate('/schoolcbt-login');
        }
    }, []);

 

    // ── State ──────────────────────────────────────────────────
    const [selectedSubject, setSelectedSubject] = useState(rawSubjects?.[0] || null);
    const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
    const [answered, setAnswered] = useState(() => {
        // Initialize from saved answers
        const map = {};
        (savedAnswers || []).forEach(a => { map[a.questionId] = a.selectedOption; });
        return map;
    });

    const [timeLeft, setTimeLeft] = useState(initialTime || exam.totalTime * 60); // seconds
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [showCalc, setShowCalc] = useState(false);
    const [calcExpr, setCalcExpr] = useState('');
    const [calcResult, setCalcResult] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [examPaused, setExamPaused] = useState(false);
    const [showEndButton, setShowEndButton] = useState(false);

    const timerRef = useRef(null);
    const saveQueueRef = useRef({});
    const lastTimerSaveRef = useRef(Date.now());

    // ── Questions filtered by subject ─────────────────────────
    const allQuestions = rawQuestions || [];
    const subjects = rawSubjects || [];

    const filteredQuestions = selectedSubject
        ? allQuestions.filter(q => q.cbtSubjectId === selectedSubject.id)
        : [];

    const selectedQuestion = filteredQuestions[selectedQuestionIndex] || null;

    // ── Timer ─────────────────────────────────────────────────
    useEffect(() => {
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                const next = prev - 1;

                // Show end button when 10 minutes left
                if (next <= 600) setShowEndButton(true);

                // Auto-submit when time is up
                if (next <= 0) {
                    clearInterval(timerRef.current);
                    handleSubmit(true);
                    return 0;
                }

                // Save timer to backend every 30 seconds
                const now = Date.now();
                if (now - lastTimerSaveRef.current >= 30000) {
                    lastTimerSaveRef.current = now;
                    fetch(`${API}/cbt/timer`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ candidateId: candidate.candidateId, timeRemaining: next, status: 'Ongoing' })
                    }).catch(() => {});
                }

                return next;
            });
        }, 1000);

        return () => clearInterval(timerRef.current);
    }, []);

    // Poll for exam status (paused/ended by admin) every 15s
    useEffect(() => {
        const poll = setInterval(async () => {
            try {
                const res = await fetch(`${API}/cbt/exams/${exam.id}/status`);
                const data = await res.json();
                if (data.success) {
                    if (data.data.status === 'paused') setExamPaused(true);
                    else if (data.data.status === 'ended') handleSubmit(true);
                    else setExamPaused(false);
                }
            } catch (e) {}
        }, 15000);
        return () => clearInterval(poll);
    }, []);


    
    // ── Save answer ───────────────────────────────────────────
    const saveAnswer = useCallback(async (questionId, cbtSubjectId, selectedOption) => {
        // Optimistically update UI
        setAnswered(prev => ({ ...prev, [questionId]: selectedOption }));

        // Queue save
        saveQueueRef.current[questionId] = { questionId, cbtSubjectId, selectedOption };

        try {
            await fetch(`${API}/cbt/answer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    candidateId: candidate.candidateId,
                    examId: exam.id,
                    questionId,
                    cbtSubjectId,
                    selectedOption
                })
            });
        } catch (e) {
            // Answer is queued, will retry on next save
        }
    }, [candidate, exam]);

    const handleAnswerSelect = (option) => {
        if (!selectedQuestion) return;
        saveAnswer(selectedQuestion.id, selectedQuestion.cbtSubjectId, option);
    };

    // ── Navigation ─────────────────────────────────────────────
    const handleSubjectSelect = (subject) => {
        setSelectedSubject(subject);
        setSelectedQuestionIndex(0);
    };

    const handleNextQuestion = () => {
        if (selectedQuestionIndex < filteredQuestions.length - 1) {
            setSelectedQuestionIndex(i => i + 1);
        } else {
            // Move to next subject
            const currentIdx = subjects.findIndex(s => s.id === selectedSubject?.id);
            if (currentIdx < subjects.length - 1) {
                setSelectedSubject(subjects[currentIdx + 1]);
                setSelectedQuestionIndex(0);
            }
        }
    };

    const handlePreviousQuestion = () => {
        if (selectedQuestionIndex > 0) {
            setSelectedQuestionIndex(i => i - 1);
        } else {
            const currentIdx = subjects.findIndex(s => s.id === selectedSubject?.id);
            if (currentIdx > 0) {
                const prevSubject = subjects[currentIdx - 1];
                setSelectedSubject(prevSubject);
                const prevQuestions = allQuestions.filter(q => q.cbtSubjectId === prevSubject.id);
                setSelectedQuestionIndex(prevQuestions.length - 1);
            }
        }
    };

    const isFirstQuestion = () => {
        const idx = subjects.findIndex(s => s.id === selectedSubject?.id);
        return idx === 0 && selectedQuestionIndex === 0;
    };

    const isLastQuestion = () => {
        const idx = subjects.findIndex(s => s.id === selectedSubject?.id);
        return idx === subjects.length - 1 && selectedQuestionIndex === filteredQuestions.length - 1;
    };

    // ── Keyboard shortcuts ─────────────────────────────────────
    useEffect(() => {
        const handleKey = (e) => {
            if (['INPUT','TEXTAREA'].includes(e.target.tagName)) return;
            switch (e.key.toLowerCase()) {
                case 'a': handleAnswerSelect('A'); break;
                case 'b': handleAnswerSelect('B'); break;
                case 'c': handleAnswerSelect('C'); break;
                case 'd': handleAnswerSelect('D'); break;
                case 'n': handleNextQuestion(); break;
                case 'p': handlePreviousQuestion(); break;
                case 's': if (showEndButton) setShowSubmitModal(true); break;
                case 'y': if (showSubmitModal) handleSubmit(false); break;
                case 'r': if (showSubmitModal) setShowSubmitModal(false); break;
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [selectedQuestion, selectedQuestionIndex, showSubmitModal, showEndButton, filteredQuestions]);

    // ── Submit ─────────────────────────────────────────────────
    const handleSubmit = async (auto = false) => {
        if (submitting) return;
        clearInterval(timerRef.current);
        setSubmitting(true);
        setShowSubmitModal(false);

        try {
            const res = await fetch(`${API}/cbt/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    candidateId: candidate.candidateId,
                    examId: exam.id,
                    timeRemaining: timeLeft
                })
            });
            const data = await res.json();
            sessionStorage.removeItem('cbt_session');

            if (data.success && exam.showResultImmediately && data.data) {
                sessionStorage.setItem('cbt_result', JSON.stringify({ result: data.data, candidate, exam }));
            }

            navigate('/schoolcbt-complete', {
                state: {
                    auto,
                    showResult: exam.showResultImmediately,
                    result: data.data,
                    candidate,
                    exam,
                    totalAnswered: Object.keys(answered).length,
                    totalQuestions: allQuestions.length
                }
            });
        } catch (e) {
            setSubmitting(false);
            alert('Submission failed. Please try again or contact supervisor.');
        }
    };

    // ── Calculator ─────────────────────────────────────────────
    const calcClick = (val) => {
        if (val === '=') {
            try { setCalcResult(String(eval(calcExpr))); }
            catch { setCalcResult('Error'); }
        } else if (val === 'AC') {
            setCalcExpr(''); setCalcResult('');
        } else if (val === '⌫') {
            setCalcExpr(p => p.slice(0, -1));
        } else {
            setCalcExpr(p => p + val);
        }
    };

    // ── Stats ──────────────────────────────────────────────────
    const totalAnswered = Object.keys(answered).length;
    const totalQs = allQuestions.length;
    const answeredInSubject = selectedSubject
        ? allQuestions.filter(q => q.cbtSubjectId === selectedSubject.id && answered[q.id]).length
        : 0;
    const totalInSubject = filteredQuestions.length;

    // ── Timer display ──────────────────────────────────────────
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const timerColor = timeLeft <= 300 ? '#ef4444' : timeLeft <= 600 ? '#f59e0b' : '#10b981';

    const selectedOption = selectedQuestion ? answered[selectedQuestion.id] : null;
   if (!candidate || !exam) return null;
    return (
        <div style={{ minHeight: '100vh', background: '#f1f5f9', display: 'flex', flexDirection: 'column' }}>

            {/* Exam paused overlay */}
            {examPaused && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ width: '60px', height: '60px', background: '#f59e0b', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <AlertCircle size={28} color="#fff" />
                    </div>
                    <h2 style={{ color: '#fff', fontWeight: 800, fontSize: '1.5rem' }}>Exam Paused</h2>
                    <p style={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center' }}>The invigilator has paused the exam.<br />Please wait.</p>
                </div>
            )}

            {/* Top bar */}
            <div style={{ background: '#1e1b4b', color: '#fff', padding: '0 20px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
                {/* Subject tabs */}
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', overflowX: 'auto' }}>
                    {subjects.map(subj => (
                        <button key={subj.id} onClick={() => handleSubjectSelect(subj)}
                            style={{ padding: '6px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem', whiteSpace: 'nowrap', transition: 'all 0.15s', background: selectedSubject?.id === subj.id ? '#6366f1' : 'rgba(255,255,255,0.12)', color: '#fff' }}>
                            {subj.subjectName}
                            <span style={{ marginLeft: '6px', fontSize: '0.7rem', opacity: 0.75 }}>
                                ({allQuestions.filter(q => q.cbtSubjectId === subj.id && answered[q.id]).length}/{allQuestions.filter(q => q.cbtSubjectId === subj.id).length})
                            </span>
                        </button>
                    ))}
                </div>

                {/* Right controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                    {exam.allowCalculator && (
                        <button onClick={() => setShowCalc(p => !p)}
                            style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Calculator size={14} /> Calc
                        </button>
                    )}

                    {/* Timer */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.1)', padding: '6px 14px', borderRadius: '20px' }}>
                        <Clock size={14} color={timerColor} />
                        <span style={{ fontWeight: 800, fontSize: '1.05rem', color: timerColor, fontVariantNumeric: 'tabular-nums' }}>
                            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                        </span>
                    </div>

                    {showEndButton && (
                        <button onClick={() => setShowSubmitModal(true)}
                            style={{ padding: '6px 16px', background: '#ef4444', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>
                            Submit (S)
                        </button>
                    )}
                </div>
            </div>

            {/* Main content */}
            <div style={{ flex: 1, display: 'flex', gap: '0', overflow: 'hidden' }}>

                {/* Question area */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    {selectedQuestion ? (
                        <>
                            {/* Question header */}
                            <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ fontSize: '0.85rem', color: '#6366f1', fontWeight: 800 }}>
                                    {selectedSubject?.subjectName}
                                </span>
                                <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                                    Question {selectedQuestionIndex + 1} of {filteredQuestions.length}
                                </span>
                                {selectedQuestion.marks > 1 && (
                                    <span style={{ fontSize: '0.75rem', padding: '2px 8px', background: '#eef2ff', color: '#6366f1', borderRadius: '10px', fontWeight: 600 }}>
                                        {selectedQuestion.marks} marks
                                    </span>
                                )}
                            </div>

                            {/* Question body */}
                            <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
                                {selectedQuestion.subtitle && (
                                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px 16px', marginBottom: '20px', fontSize: '0.95rem', lineHeight: '1.7', fontFamily: 'Georgia, serif', color: '#374151' }}>
                                        {selectedQuestion.subtitle}
                                    </div>
                                )}

                                <p style={{ fontSize: '1.05rem', lineHeight: '1.75', fontFamily: 'Georgia, Times New Roman, serif', color: '#1e293b', marginBottom: '28px', fontWeight: 500 }}>
                                    {selectedQuestionIndex + 1}. &nbsp;{selectedQuestion.question}
                                </p>

                                {/* Options */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {['A', 'B', 'C', 'D'].map(opt => {
                                        const isSelected = selectedOption === opt;
                                        const optText = selectedQuestion[`opt${opt}`];
                                        if (!optText && optText !== 0) return null;
                                        return (
                                            <label key={opt} onClick={() => handleAnswerSelect(opt)}
                                                style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '14px 18px', borderRadius: '10px', border: `2px solid ${isSelected ? '#6366f1' : '#e2e8f0'}`, background: isSelected ? '#eef2ff' : '#fff', cursor: 'pointer', transition: 'all 0.15s', userSelect: 'none' }}>
                                                {/* Radio circle */}
                                                <div style={{ width: '22px', height: '22px', borderRadius: '50%', border: `2px solid ${isSelected ? '#6366f1' : '#cbd5e1'}`, background: isSelected ? '#6366f1' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px', transition: 'all 0.15s' }}>
                                                    {isSelected && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fff' }} />}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <span style={{ fontWeight: 700, color: isSelected ? '#6366f1' : '#475569', marginRight: '8px', fontSize: '0.9rem' }}>({opt})</span>
                                                    <span style={{ fontSize: '0.95rem', color: isSelected ? '#3730a3' : '#374151', lineHeight: '1.5' }}>{optText}</span>
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Navigation bar */}
                            <div style={{ background: '#fff', borderTop: '1px solid #e2e8f0', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <button onClick={handlePreviousQuestion} disabled={isFirstQuestion()}
                                    style={{ padding: '9px 18px', background: isFirstQuestion() ? '#f1f5f9' : '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: isFirstQuestion() ? 'not-allowed' : 'pointer', color: isFirstQuestion() ? '#94a3b8' : '#374151', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', opacity: isFirstQuestion() ? 0.5 : 1 }}>
                                    <ChevronLeft size={16} /> Prev (P)
                                </button>

                                {/* Question number buttons */}
                                <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'center', maxHeight: '72px', overflowY: 'auto' }}>
                                    {filteredQuestions.map((q, idx) => {
                                        const isAnswered = !!answered[q.id];
                                        const isCurrent = idx === selectedQuestionIndex;
                                        return (
                                            <button key={q.id} onClick={() => setSelectedQuestionIndex(idx)}
                                                style={{ width: '30px', height: '30px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem', transition: 'all 0.1s', background: isCurrent ? '#6366f1' : isAnswered ? '#10b981' : '#ef4444', color: '#fff' }}>
                                                {idx + 1}
                                            </button>
                                        );
                                    })}
                                </div>

                                <button onClick={handleNextQuestion} disabled={isLastQuestion()}
                                    style={{ padding: '9px 18px', background: isLastQuestion() ? '#f1f5f9' : '#6366f1', border: 'none', borderRadius: '8px', cursor: isLastQuestion() ? 'not-allowed' : 'pointer', color: isLastQuestion() ? '#94a3b8' : '#fff', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', opacity: isLastQuestion() ? 0.5 : 1 }}>
                                    Next (N) <ChevronRight size={16} />
                                </button>
                            </div>
                        </>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: '#94a3b8' }}>
                            Select a subject above to begin
                        </div>
                    )}
                </div>

                {/* Right sidebar — candidate info */}
                <div style={{ width: '220px', background: '#fff', borderLeft: '1px solid #e2e8f0', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '16px', flexShrink: 0, overflowY: 'auto' }}>
                    {/* Candidate info */}
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', fontSize: '1.3rem', fontWeight: 800, color: '#fff' }}>
                            {candidate.fullName?.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1e293b' }}>{candidate.fullName}</div>
                        <div style={{ fontSize: '0.75rem', color: '#6366f1', fontFamily: 'monospace', marginTop: '2px' }}>{candidate.regNo}</div>
                        {candidate.className && <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>{candidate.className}</div>}
                    </div>

                    {/* Exam info */}
                    <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '12px', fontSize: '0.78rem' }}>
                        <div style={{ fontWeight: 700, color: '#374151', marginBottom: '6px', fontSize: '0.8rem' }}>{exam.title}</div>
                        <div style={{ color: '#64748b', marginBottom: '4px' }}>Duration: <strong>{exam.totalTime} min</strong></div>
                        <div style={{ color: '#64748b' }}>Pass mark: <strong>{exam.passMark}%</strong></div>
                    </div>

                    {/* Progress */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b', marginBottom: '6px' }}>
                            <span>Overall</span>
                            <span style={{ fontWeight: 700, color: '#6366f1' }}>{totalAnswered}/{totalQs}</span>
                        </div>
                        <div style={{ background: '#e2e8f0', borderRadius: '4px', height: '6px', overflow: 'hidden', marginBottom: '10px' }}>
                            <div style={{ width: `${totalQs > 0 ? (totalAnswered / totalQs) * 100 : 0}%`, height: '100%', background: '#6366f1', borderRadius: '4px', transition: 'width 0.3s' }} />
                        </div>
                        {selectedSubject && (
                            <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '4px' }}>
                                    <span>{selectedSubject.subjectName}</span>
                                    <span>{answeredInSubject}/{totalInSubject}</span>
                                </div>
                                <div style={{ background: '#e2e8f0', borderRadius: '4px', height: '4px', overflow: 'hidden' }}>
                                    <div style={{ width: `${totalInSubject > 0 ? (answeredInSubject / totalInSubject) * 100 : 0}%`, height: '100%', background: '#10b981', borderRadius: '4px', transition: 'width 0.3s' }} />
                                </div>
                            </>
                        )}
                    </div>

                    {/* Legend */}
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        <div style={{ fontWeight: 700, marginBottom: '6px', color: '#374151' }}>Legend</div>
                        {[
                            { color: '#6366f1', label: 'Current' },
                            { color: '#10b981', label: 'Answered' },
                            { color: '#ef4444', label: 'Unanswered' },
                        ].map(l => (
                            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: l.color, flexShrink: 0 }} />
                                {l.label}
                            </div>
                        ))}
                    </div>

                    {/* Keyboard shortcuts */}
                    <div style={{ fontSize: '0.68rem', color: '#94a3b8', lineHeight: '1.8' }}>
                        <div style={{ fontWeight: 700, marginBottom: '4px', color: '#64748b', fontSize: '0.72rem' }}>Shortcuts</div>
                        <div><kbd style={{ background: '#f1f5f9', padding: '1px 4px', borderRadius: '3px', fontSize: '0.65rem' }}>A B C D</kbd> Select option</div>
                        <div><kbd style={{ background: '#f1f5f9', padding: '1px 4px', borderRadius: '3px', fontSize: '0.65rem' }}>N / P</kbd> Next / Prev</div>
                        {showEndButton && <div><kbd style={{ background: '#f1f5f9', padding: '1px 4px', borderRadius: '3px', fontSize: '0.65rem' }}>S</kbd> Submit exam</div>}
                    </div>

                    {/* Submit button */}
                    {showEndButton && (
                        <button onClick={() => setShowSubmitModal(true)}
                            style={{ padding: '10px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem', marginTop: 'auto' }}>
                            End Exam
                        </button>
                    )}
                </div>
            </div>

            {/* Calculator modal */}
            {showCalc && (
                <div style={{ position: 'fixed', bottom: '80px', right: '20px', zIndex: 500, background: '#1e1b4b', borderRadius: '16px', padding: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', width: '220px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.85rem' }}>Calculator</span>
                        <button onClick={() => setShowCalc(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={16} /></button>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '10px', marginBottom: '10px', textAlign: 'right' }}>
                        <div style={{ color: '#94a3b8', fontSize: '0.75rem', minHeight: '16px' }}>{calcExpr || '0'}</div>
                        <div style={{ color: '#fff', fontWeight: 700, fontSize: '1.2rem', minHeight: '24px' }}>{calcResult || ''}</div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                        {[
                            '7','8','9','÷',
                            '4','5','6','×',
                            '1','2','3','-',
                            '0','.','=','+',
                            '(',')','⌫','AC'
                        ].map(btn => (
                            <button key={btn} onClick={() => calcClick(btn === '÷' ? '/' : btn === '×' ? '*' : btn)}
                                style={{ padding: '10px 0', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', background: btn === 'AC' ? '#ef4444' : btn === '=' ? '#6366f1' : ['÷','×','-','+'].includes(btn) ? '#4338ca' : 'rgba(255,255,255,0.1)', color: '#fff', transition: 'opacity 0.1s' }}>
                                {btn}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Submit confirmation modal */}
            {showSubmitModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: '#fff', borderRadius: '16px', padding: '32px', maxWidth: '440px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
                        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                            <div style={{ width: '56px', height: '56px', background: '#fef2f2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                                <Send size={24} color="#ef4444" />
                            </div>
                            <h2 style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: '6px' }}>Submit Exam?</h2>
                            <p style={{ color: '#64748b', fontSize: '0.9rem' }}>This action cannot be undone.</p>
                        </div>

                        {/* Summary */}
                        <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '16px', marginBottom: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.875rem' }}>
                                <span style={{ color: '#64748b' }}>Answered</span>
                                <span style={{ fontWeight: 700, color: '#10b981' }}>{totalAnswered} of {totalQs}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                                <span style={{ color: '#64748b' }}>Unanswered</span>
                                <span style={{ fontWeight: 700, color: totalQs - totalAnswered > 0 ? '#ef4444' : '#10b981' }}>{totalQs - totalAnswered}</span>
                            </div>
                            {totalQs - totalAnswered > 0 && (
                                <div style={{ marginTop: '10px', padding: '8px 12px', background: '#fef2f2', borderRadius: '6px', fontSize: '0.8rem', color: '#dc2626' }}>
                                    ⚠️ You have {totalQs - totalAnswered} unanswered question{totalQs - totalAnswered !== 1 ? 's' : ''}
                                </div>
                            )}
                        </div>

                        <div style={{ fontSize: '0.82rem', color: '#64748b', textAlign: 'center', marginBottom: '20px' }}>
                            Press <kbd style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>Y</kbd> to submit &nbsp;|&nbsp;
                            Press <kbd style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>R</kbd> to continue
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={() => setShowSubmitModal(false)}
                                style={{ flex: 1, padding: '12px', background: '#f1f5f9', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', color: '#374151' }}>
                                Continue Exam (R)
                            </button>
                            <button onClick={() => handleSubmit(false)} disabled={submitting}
                                style={{ flex: 1, padding: '12px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}>
                                {submitting ? 'Submitting...' : 'Submit Now (Y)'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}