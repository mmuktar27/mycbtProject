// pages/cbt/CreateExam.jsx
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Upload, Download, AlertCircle, CheckCircle, RefreshCw, BookOpen, Users, Settings } from 'lucide-react';
import * as XLSX from 'xlsx';

const API = '/api';

export default function CreateExam() {
    const [step, setStep] = useState(1); // 1=setup, 2=subjects, 3=questions, 4=candidates
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]); // school subjects
    const [alert, setAlert] = useState(null);
    const [loading, setLoading] = useState(false);
    const [exam, setExam] = useState(null); // created exam
    const [examSubjects, setExamSubjects] = useState([]); // subjects for this exam

    const [form, setForm] = useState({
        title: '',
        description: '',
        examType: 'internal',
        instructions: 'Answer all questions. Do not switch tabs during the exam.',
        totalTime: 60,
        shuffleQuestions: true,
        shuffleOptions: true,
        showResultImmediately: false,
        allowCalculator: false,
        passMark: 40,
        scoreMode: 'exam',
        linkedClassIds: [],
        createdBy: 'Admin'
    });

    const [subjectForm, setSubjectForm] = useState({
        subjectName: '', subjectCode: '', marksPerQuestion: 1, negativeMarking: 0
    });

    // Questions state
    const [questions, setQuestions] = useState([]);
    const [selectedSubjectId, setSelectedSubjectId] = useState(null);
    const [qForm, setQForm] = useState({
        cbtSubjectId: '', question: '', subtitle: '', optA: '', optB: '', optC: '', optD: '', answer: 'A', marks: 1, difficulty: 'medium'
    });
    const [showQForm, setShowQForm] = useState(false);
    const [editingQId, setEditingQId] = useState(null);

    // External candidates
    const [externalCandidates, setExternalCandidates] = useState([]);

    useEffect(() => { loadInitial(); }, []);

    async function loadInitial() {
        try {
            const [cRes, sRes] = await Promise.all([
                fetch(`${API}/classes`), fetch(`${API}/school/subjects`)
            ]);
            const [cData, sData] = await Promise.all([cRes.json(), sRes.json()]);
            if (cData.success) setClasses(cData.data);
            if (sData.success) setSubjects(sData.data);
        } catch (e) { showAlert('error', e.message); }
    }

    async function loadExamSubjects() {
        if (!exam) return;
        try {
            const res = await fetch(`${API}/cbt/exams/${exam.id}/subjects`);
            const data = await res.json();
            if (data.success) {
                setExamSubjects(data.data);
                if (data.data.length > 0 && !selectedSubjectId) setSelectedSubjectId(data.data[0].id);
            }
        } catch (e) {}
    }

    async function loadQuestions(subjId) {
        if (!exam) return;
        try {
            const res = await fetch(`${API}/cbt/exams/${exam.id}/questions?subjectId=${subjId || selectedSubjectId || ''}`);
            const data = await res.json();
            if (data.success) setQuestions(data.data);
        } catch (e) {}
    }

    function showAlert(type, msg) {
        setAlert({ type, msg });
        setTimeout(() => setAlert(null), 5000);
    }

    // ── STEP 1: Create Exam ──────────────────────────────────────

    async function createExam() {
        if (!form.title) return showAlert('error', 'Exam title is required');
        if (form.examType === 'internal' && form.linkedClassIds.length === 0) {
            return showAlert('error', 'Select at least one class for internal exam');
        }
        setLoading(true);
        try {
            const res = await fetch(`${API}/cbt/exams`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
            const data = await res.json();
            if (data.success) {
                // Fetch full exam
                const examRes = await fetch(`${API}/cbt/exams/${data.data.id}`);
                const examData = await examRes.json();
                setExam({ ...examData.data, id: data.data.id, examCode: data.data.examCode });
                showAlert('success', `Exam created! Code: ${data.data.examCode}`);
                setStep(2);
            } else {
                showAlert('error', data.message);
            }
        } catch (e) { showAlert('error', e.message); }
        setLoading(false);
    }

    // ── STEP 2: Add Subjects ─────────────────────────────────────

    async function addSubject() {
        if (!subjectForm.subjectName) return showAlert('error', 'Subject name required');
        try {
            const res = await fetch(`${API}/cbt/exams/${exam.id}/subjects`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(subjectForm)
            });
            const data = await res.json();
            if (data.success) {
                showAlert('success', 'Subject added');
                setSubjectForm({ subjectName: '', subjectCode: '', marksPerQuestion: 1, negativeMarking: 0 });
                await loadExamSubjects();
            } else showAlert('error', data.message);
        } catch (e) { showAlert('error', e.message); }
    }

    async function deleteSubject(subjectId) {
        if (!window.confirm('Delete this subject and all its questions?')) return;
        try {
            await fetch(`${API}/cbt/exams/${exam.id}/subjects/${subjectId}`, { method: 'DELETE' });
            await loadExamSubjects();
            if (selectedSubjectId === subjectId) setSelectedSubjectId(null);
        } catch (e) { showAlert('error', e.message); }
    }

    // ── STEP 3: Add Questions ────────────────────────────────────

    async function saveQuestion() {
        if (!qForm.question || !qForm.answer || !qForm.cbtSubjectId) {
            return showAlert('error', 'Subject, question text and answer are required');
        }
        setLoading(true);
        try {
            const url = editingQId ? `${API}/cbt/questions/${editingQId}` : `${API}/cbt/exams/${exam.id}/questions`;
            const method = editingQId ? 'PUT' : 'POST';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(qForm)
            });
            const data = await res.json();
            if (data.success) {
                showAlert('success', editingQId ? 'Question updated' : 'Question added');
                setQForm({ cbtSubjectId: qForm.cbtSubjectId, question: '', subtitle: '', optA: '', optB: '', optC: '', optD: '', answer: 'A', marks: 1, difficulty: 'medium' });
                setEditingQId(null);
                setShowQForm(false);
                await loadQuestions(qForm.cbtSubjectId);
            } else showAlert('error', data.message);
        } catch (e) { showAlert('error', e.message); }
        setLoading(false);
    }

    async function deleteQuestion(qid) {
        if (!window.confirm('Remove this question?')) return;
        await fetch(`${API}/cbt/questions/${qid}`, { method: 'DELETE' });
        await loadQuestions();
    }

    async function handleQuestionExcelUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const buffer = await file.arrayBuffer();
            const wb = XLSX.read(buffer);
            const ws = wb.Sheets[wb.SheetNames[0]];
            const raw = XLSX.utils.sheet_to_json(ws, { header: 1 });

            const headerIdx = raw.findIndex(r => r.some(c => String(c).toLowerCase().includes('question')));
            if (headerIdx === -1) return showAlert('error', 'Cannot find header row');

            const headers = raw[headerIdx].map(h => String(h).trim());
            const rows = raw.slice(headerIdx + 1).filter(r => r[0]);

            // Map headers to field names
            const fieldMap = {
                question: ['question'],
                subtitle: ['subtitle', 'passage'],
                optA: ['opta', 'option a', 'a'],
                optB: ['optb', 'option b', 'b'],
                optC: ['optc', 'option c', 'c'],
                optD: ['optd', 'option d', 'd'],
                answer: ['answer', 'correct'],
                marks: ['marks', 'mark', 'score'],
                difficulty: ['difficulty', 'level'],
                subjectName: ['subject', 'subjectname']
            };

            const getField = (obj, fieldKeys) => {
                for (const key of fieldKeys) {
                    const found = Object.keys(obj).find(k => k.toLowerCase() === key);
                    if (found) return obj[found];
                }
                return '';
            };

            const parsed = rows.map(row => {
                const obj = {};
                headers.forEach((h, i) => { obj[h] = row[i] !== undefined ? row[i] : ''; });
                return {
                    cbtSubjectId: selectedSubjectId,
                    subjectName: getField(obj, fieldMap.subjectName) || examSubjects.find(s => s.id === selectedSubjectId)?.subjectName,
                    question: String(getField(obj, fieldMap.question) || '').trim(),
                    subtitle: String(getField(obj, fieldMap.subtitle) || '').trim(),
                    optA: String(getField(obj, fieldMap.optA) || '').trim(),
                    optB: String(getField(obj, fieldMap.optB) || '').trim(),
                    optC: String(getField(obj, fieldMap.optC) || '').trim(),
                    optD: String(getField(obj, fieldMap.optD) || '').trim(),
                    answer: String(getField(obj, fieldMap.answer) || '').trim().toUpperCase(),
                    marks: parseFloat(getField(obj, fieldMap.marks)) || 1,
                    difficulty: String(getField(obj, fieldMap.difficulty) || 'medium').toLowerCase()
                };
            }).filter(q => q.question && q.answer);

            if (parsed.length === 0) return showAlert('error', 'No valid questions found');

            const res = await fetch(`${API}/cbt/exams/${exam.id}/questions/bulk`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ questions: parsed, cbtSubjectId: selectedSubjectId })
            });
            const data = await res.json();
            if (data.success) {
                showAlert('success', `Imported ${data.data.inserted} questions. Failed: ${data.data.failed.length}`);
                await loadQuestions();
            } else showAlert('error', data.message);
        } catch (err) { showAlert('error', 'Parse error: ' + err.message); }
        e.target.value = '';
    }

    function downloadQuestionTemplate() {
        const headers = ['question', 'subtitle', 'optA', 'optB', 'optC', 'optD', 'answer', 'marks', 'difficulty'];
        const sample = [
            ['What is the capital of Nigeria?', '', 'Lagos', 'Abuja', 'Kano', 'Ibadan', 'B', '1', 'easy'],
            ['Calculate: 15 × 4', '', '50', '55', '60', '65', 'C', '2', 'medium'],
        ];
        const ws = XLSX.utils.aoa_to_sheet([headers, ...sample]);
        ws['!cols'] = headers.map(() => ({ wch: 25 }));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Questions Template');
        XLSX.writeFile(wb, 'CBT_Questions_Template.xlsx');
    }

    // ── STEP 4: External Candidates ──────────────────────────────

    async function handleCandidateExcelUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const buffer = await file.arrayBuffer();
            const wb = XLSX.read(buffer);
            const ws = wb.Sheets[wb.SheetNames[0]];
            const parsed = XLSX.utils.sheet_to_json(ws);

            if (parsed.length === 0) return showAlert('error', 'No data found');

            // Map fullName from various column names
            const mapped = parsed.map(row => {
const fullName = row.fullName || row['Full Name *'] || row['Full Name'] || row['full name'] || row.name || row.Name || `${row.firstName || ''} ${row.lastName || ''}`.trim();                if (!fullName) return null;
                return {
                    fullName,
                    regNo: row.regNo || row['Reg Number'] || row['Reg No'] || row.registrationNumber || row['Registration Number'] || '',
                    email: row.email || row.Email || '',
                    phone: row.phone || row.Phone || row.phoneNumber || '',
                    ...row
                };
            }).filter(Boolean);

            setExternalCandidates(mapped);
            showAlert('success', `Loaded ${mapped.length} candidates. Review and upload.`);
        } catch (err) { showAlert('error', err.message); }
        e.target.value = '';
    }

    async function uploadExternalCandidates() {
        if (externalCandidates.length === 0) return showAlert('error', 'No candidates to upload');
        setLoading(true);
        try {
            const res = await fetch(`${API}/cbt/exams/${exam.id}/candidates/upload`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ candidates: externalCandidates })
            });
            const data = await res.json();
            if (data.success) {
                showAlert('success', `Registered ${data.data.registered} candidates`);
                setExternalCandidates([]);
            } else showAlert('error', data.message);
        } catch (e) { showAlert('error', e.message); }
        setLoading(false);
    }

    function downloadCandidateTemplate() {
        const headers = ['fullName', 'regNo', 'email', 'phone'];
        const sample = [
            ['John Doe', 'EXT001', 'john@example.com', '08012345678'],
            ['Jane Smith', 'EXT002', 'jane@example.com', '08087654321'],
        ];
        const ws = XLSX.utils.aoa_to_sheet([['Full Name *', 'Reg Number', 'Email', 'Phone'], ['fullName', 'regNo', 'email', 'phone'], ...sample]);
        ws['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 25 }, { wch: 15 }];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Candidates Template');
        XLSX.writeFile(wb, 'CBT_Candidates_Template.xlsx');
    }

    const stepLabels = ['Exam Setup', 'Subjects', 'Questions', 'Candidates'];

    return (
        <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '8px' }}>Create CBT Exam</h1>
            <p style={{ color: '#64748b', marginBottom: '24px' }}>Set up your exam step by step</p>

            {alert && (
                <div style={{ padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', background: alert.type === 'error' ? '#fef2f2' : '#f0fdf4', color: alert.type === 'error' ? '#dc2626' : '#16a34a', border: `1px solid ${alert.type === 'error' ? '#fecaca' : '#bbf7d0'}` }}>
                    {alert.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
                    {alert.msg}
                </div>
            )}

            {/* Step indicator */}
            <div style={{ display: 'flex', gap: '0', marginBottom: '32px', borderRadius: '10px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                {stepLabels.map((label, i) => {
                    const s = i + 1;
                    const active = step === s;
                    const done = step > s;
                    return (
                        <div key={s} onClick={() => exam && setStep(s)}
                            style={{ flex: 1, padding: '12px', textAlign: 'center', cursor: exam ? 'pointer' : 'default', background: active ? '#6366f1' : done ? '#e0e7ff' : '#f8fafc', color: active ? '#fff' : done ? '#6366f1' : '#94a3b8', fontWeight: active ? 700 : 500, fontSize: '0.85rem', transition: 'all 0.2s' }}>
                            <div style={{ fontSize: '1.1rem', marginBottom: '2px' }}>{done ? '✓' : s}</div>
                            {label}
                        </div>
                    );
                })}
            </div>

            {/* ── STEP 1: Setup ── */}
            {step === 1 && (
                <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px' }}>Exam Setup</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.875rem' }}>Exam Title *</label>
                            <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g., First Term Mathematics Examination" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.9rem' }} />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.875rem' }}>Exam Type</label>
                            <select value={form.examType} onChange={e => setForm(p => ({ ...p, examType: e.target.value }))} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <option value="internal">Internal (School Students)</option>
                                <option value="external">External (Outside Candidates)</option>
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.875rem' }}>Total Time (minutes)</label>
                            <input type="number" value={form.totalTime} onChange={e => setForm(p => ({ ...p, totalTime: parseInt(e.target.value) }))} min={5} max={360} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.875rem' }}>Pass Mark (%)</label>
                            <input type="number" value={form.passMark} onChange={e => setForm(p => ({ ...p, passMark: parseInt(e.target.value) }))} min={0} max={100} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.875rem' }}>Score Mode</label>
                            <select value={form.scoreMode} onChange={e => setForm(p => ({ ...p, scoreMode: e.target.value }))} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <option value="exam">Standalone Exam</option>
                                <option value="ca">Count as CA Score</option>
                                <option value="both">Both (Separate Records)</option>
                            </select>
                        </div>

                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.875rem' }}>Instructions</label>
                            <textarea value={form.instructions} onChange={e => setForm(p => ({ ...p, instructions: e.target.value }))} rows={3} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', resize: 'vertical' }} />
                        </div>

                        {/* Options */}
                        <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                            {[
                                { key: 'shuffleQuestions', label: 'Shuffle Questions' },
                                { key: 'shuffleOptions', label: 'Shuffle Options' },
                                { key: 'showResultImmediately', label: 'Show Result Immediately' },
                                { key: 'allowCalculator', label: 'Allow Calculator' },
                            ].map(opt => (
                                <label key={opt.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem' }}>
                                    <input type="checkbox" checked={!!form[opt.key]} onChange={e => setForm(p => ({ ...p, [opt.key]: e.target.checked }))} style={{ width: '16px', height: '16px' }} />
                                    {opt.label}
                                </label>
                            ))}
                        </div>

                        {/* Classes (internal) */}
                        {form.examType === 'internal' && (
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.875rem' }}>Select Classes *</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {classes.map(cls => (
                                        <label key={cls.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '20px', border: `1px solid ${form.linkedClassIds.includes(cls.id) ? '#6366f1' : '#e2e8f0'}`, background: form.linkedClassIds.includes(cls.id) ? '#e0e7ff' : '#fff', cursor: 'pointer', fontSize: '0.85rem' }}>
                                            <input type="checkbox" checked={form.linkedClassIds.includes(cls.id)}
                                                onChange={e => setForm(p => ({
                                                    ...p,
                                                    linkedClassIds: e.target.checked ? [...p.linkedClassIds, cls.id] : p.linkedClassIds.filter(id => id !== cls.id)
                                                }))} style={{ display: 'none' }} />
                                            {cls.className} {cls.section ? `(${cls.section})` : ''}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.875rem' }}>Created By</label>
                            <input value={form.createdBy} onChange={e => setForm(p => ({ ...p, createdBy: e.target.value }))} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                        </div>
                    </div>

                    <button onClick={createExam} disabled={loading} style={{ marginTop: '24px', padding: '12px 28px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {loading ? <RefreshCw size={16} /> : <Save size={16} />}
                        Create Exam & Continue
                    </button>
                </div>
            )}

            {/* ── STEP 2: Subjects ── */}
            {step === 2 && exam && (
                <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '4px' }}>Add Subjects</h2>
                    <p style={{ color: '#64748b', marginBottom: '20px', fontSize: '0.875rem' }}>Each subject can have its own set of questions</p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: '12px', alignItems: 'end', marginBottom: '20px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', fontWeight: 600 }}>Subject Name *</label>
                            <input value={subjectForm.subjectName} onChange={e => setSubjectForm(p => ({ ...p, subjectName: e.target.value }))}
                                placeholder="Mathematics" style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.875rem' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', fontWeight: 600 }}>Code</label>
                            <input value={subjectForm.subjectCode} onChange={e => setSubjectForm(p => ({ ...p, subjectCode: e.target.value }))}
                                placeholder="MATH" style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.875rem' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', fontWeight: 600 }}>Marks/Question</label>
                            <input type="number" value={subjectForm.marksPerQuestion} onChange={e => setSubjectForm(p => ({ ...p, marksPerQuestion: parseFloat(e.target.value) }))}
                                min={0.5} style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.875rem' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', fontWeight: 600 }}>Negative Marking</label>
                            <input type="number" value={subjectForm.negativeMarking} onChange={e => setSubjectForm(p => ({ ...p, negativeMarking: parseFloat(e.target.value) }))}
                                min={0} step={0.25} placeholder="0 = disabled" style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.875rem' }} />
                        </div>
                        <button onClick={addSubject} style={{ padding: '8px 16px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, whiteSpace: 'nowrap' }}>
                            <Plus size={14} /> Add
                        </button>
                    </div>

                    {/* Quick add from school subjects */}
                    {subjects.length > 0 && (
                        <div style={{ marginBottom: '20px' }}>
                            <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '8px' }}>Quick add from school subjects:</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {subjects.filter(s => !examSubjects.find(es => es.subjectName === s.subjectName)).map(s => (
                                    <button key={s.id} onClick={() => setSubjectForm(p => ({ ...p, subjectName: s.subjectName, subjectCode: s.subjectCode || '' }))}
                                        style={{ padding: '4px 10px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '20px', cursor: 'pointer', fontSize: '0.78rem' }}>
                                        + {s.subjectName}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {examSubjects.length > 0 && (
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                            <thead>
                                <tr style={{ background: '#f8fafc' }}>
                                    <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Subject</th>
                                    <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Code</th>
                                    <th style={{ padding: '10px 12px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>Questions</th>
                                    <th style={{ padding: '10px 12px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>Marks/Q</th>
                                    <th style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {examSubjects.map(s => (
                                    <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '10px 12px', fontWeight: 600 }}>{s.subjectName}</td>
                                        <td style={{ padding: '10px 12px', color: '#64748b' }}>{s.subjectCode || '-'}</td>
                                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>{s.questionCount}</td>
                                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>{s.marksPerQuestion}</td>
                                        <td style={{ padding: '10px 12px' }}>
                                            <button onClick={() => deleteSubject(s.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={14} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                        <button onClick={() => setStep(1)} style={{ padding: '10px 20px', background: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>← Back</button>
                        <button onClick={() => { loadExamSubjects(); setStep(3); }} disabled={examSubjects.length === 0}
                            style={{ padding: '10px 20px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}>
                            Next: Add Questions →
                        </button>
                    </div>
                </div>
            )}

            {/* ── STEP 3: Questions ── */}
            {step === 3 && exam && (
                <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <div>
                            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '4px' }}>Add Questions</h2>
                            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Add manually or upload via Excel</p>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={downloadQuestionTemplate} style={{ padding: '8px 14px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Download size={14} /> Template
                            </button>
                            <label style={{ padding: '8px 14px', background: '#10b981', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Upload size={14} /> Upload Excel
                                <input type="file" accept=".xlsx,.xls" hidden onChange={handleQuestionExcelUpload} />
                            </label>
                            <button onClick={() => { setShowQForm(true); setEditingQId(null); }} style={{ padding: '8px 14px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Plus size={14} /> Add Question
                            </button>
                        </div>
                    </div>

                    {/* Subject tabs */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                        {examSubjects.map(s => (
                            <button key={s.id} onClick={() => { setSelectedSubjectId(s.id); setQForm(p => ({ ...p, cbtSubjectId: s.id })); loadQuestions(s.id); }}
                                style={{ padding: '8px 16px', borderRadius: '20px', border: `2px solid ${selectedSubjectId === s.id ? '#6366f1' : '#e2e8f0'}`, background: selectedSubjectId === s.id ? '#e0e7ff' : '#fff', color: selectedSubjectId === s.id ? '#6366f1' : '#475569', fontWeight: selectedSubjectId === s.id ? 700 : 400, cursor: 'pointer', fontSize: '0.85rem' }}>
                                {s.subjectName} ({s.questionCount})
                            </button>
                        ))}
                    </div>

                    {/* Question form */}
                    {showQForm && (
                        <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '20px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
                            <h3 style={{ marginBottom: '16px', fontSize: '0.95rem', fontWeight: 700 }}>{editingQId ? 'Edit Question' : 'New Question'}</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.8rem', fontWeight: 600 }}>Subject *</label>
                                    <select value={qForm.cbtSubjectId} onChange={e => { setQForm(p => ({ ...p, cbtSubjectId: parseInt(e.target.value) })); setSelectedSubjectId(parseInt(e.target.value)); loadQuestions(parseInt(e.target.value)); }}
                                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                        <option value="">-- Select Subject --</option>
                                        {examSubjects.map(s => <option key={s.id} value={s.id}>{s.subjectName}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.8rem', fontWeight: 600 }}>Passage / Subtitle (optional)</label>
                                    <input value={qForm.subtitle} onChange={e => setQForm(p => ({ ...p, subtitle: e.target.value }))} placeholder="Context text above question..." style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0' }} />
                                </div>
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.8rem', fontWeight: 600 }}>Question *</label>
                                    <textarea value={qForm.question} onChange={e => setQForm(p => ({ ...p, question: e.target.value }))} rows={3} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', resize: 'vertical' }} />
                                </div>
                                {['A', 'B', 'C', 'D'].map(opt => (
                                    <div key={opt}>
                                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.8rem', fontWeight: 600 }}>Option {opt}</label>
                                        <input value={qForm[`opt${opt}`]} onChange={e => setQForm(p => ({ ...p, [`opt${opt}`]: e.target.value }))}
                                            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: `1px solid ${qForm.answer === opt ? '#10b981' : '#e2e8f0'}` }} />
                                    </div>
                                ))}
                                <div>
                                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.8rem', fontWeight: 600 }}>Correct Answer *</label>
                                    <select value={qForm.answer} onChange={e => setQForm(p => ({ ...p, answer: e.target.value }))} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                        {['A', 'B', 'C', 'D'].map(o => <option key={o} value={o}>Option {o}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.8rem', fontWeight: 600 }}>Marks</label>
                                    <input type="number" value={qForm.marks} onChange={e => setQForm(p => ({ ...p, marks: parseFloat(e.target.value) }))} min={0.5} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.8rem', fontWeight: 600 }}>Difficulty</label>
                                    <select value={qForm.difficulty} onChange={e => setQForm(p => ({ ...p, difficulty: e.target.value }))} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                        <option value="easy">Easy</option>
                                        <option value="medium">Medium</option>
                                        <option value="hard">Hard</option>
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                                <button onClick={saveQuestion} disabled={loading} style={{ padding: '10px 20px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}>
                                    {loading ? 'Saving...' : editingQId ? 'Update' : 'Save Question'}
                                </button>
                                <button onClick={() => { setShowQForm(false); setEditingQId(null); }} style={{ padding: '10px 20px', background: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
                            </div>
                        </div>
                    )}

                    {/* Questions list */}
                    {questions.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                            <BookOpen size={40} style={{ margin: '0 auto 12px' }} />
                            <p>No questions yet. Add manually or upload Excel.</p>
                        </div>
                    ) : (
                        <div>
                            {questions.map((q, i) => (
                                <div key={q.id} style={{ padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '10px', background: '#fff' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6366f1' }}>Q{i + 1}</span>
                                                <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '10px', background: q.difficulty === 'easy' ? '#dcfce7' : q.difficulty === 'hard' ? '#fee2e2' : '#fef3c7', color: q.difficulty === 'easy' ? '#16a34a' : q.difficulty === 'hard' ? '#dc2626' : '#d97706' }}>{q.difficulty}</span>
                                                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{q.marks} mark{q.marks !== 1 ? 's' : ''}</span>
                                            </div>
                                            <p style={{ margin: '0 0 8px', fontSize: '0.875rem' }}>{q.question}</p>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '0.8rem' }}>
                                                {['A', 'B', 'C', 'D'].map(opt => (
                                                    <span key={opt} style={{ padding: '4px 8px', borderRadius: '4px', background: q.answer === opt ? '#dcfce7' : '#f8fafc', color: q.answer === opt ? '#16a34a' : '#475569', fontWeight: q.answer === opt ? 700 : 400 }}>
                                                        ({opt}) {q[`opt${opt}`]}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '6px', marginLeft: '12px' }}>
                                            <button onClick={() => { setQForm({ ...q }); setEditingQId(q.id); setShowQForm(true); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6366f1' }}><BookOpen size={14} /></button>
                                            <button onClick={() => deleteQuestion(q.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                        <button onClick={() => setStep(2)} style={{ padding: '10px 20px', background: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>← Back</button>
                        <button onClick={() => setStep(4)} style={{ padding: '10px 20px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}>
                            {form.examType === 'external' ? 'Next: Add Candidates →' : 'Finish Setup →'}
                        </button>
                    </div>
                </div>
            )}

            {/* ── STEP 4: Candidates (External) / Summary (Internal) ── */}
            {step === 4 && exam && (
                <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0' }}>
                    {form.examType === 'external' ? (
                        <>
                            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '4px' }}>Upload Candidates</h2>
                            <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '20px' }}>Upload the list of external candidates who will sit this exam</p>

                            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                                <button onClick={downloadCandidateTemplate} style={{ padding: '10px 16px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem' }}>
                                    <Download size={14} /> Download Template
                                </button>
                                <label style={{ padding: '10px 16px', background: '#10b981', color: '#fff', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem' }}>
                                    <Upload size={14} /> Upload Excel
                                    <input type="file" accept=".xlsx,.xls" hidden onChange={handleCandidateExcelUpload} />
                                </label>
                            </div>

                            {externalCandidates.length > 0 && (
                                <>
                                    <p style={{ marginBottom: '12px', color: '#475569', fontSize: '0.875rem' }}><strong>{externalCandidates.length}</strong> candidates loaded. Preview:</p>
                                    <div style={{ maxHeight: '300px', overflow: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '16px' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                                            <thead style={{ background: '#f8fafc', position: 'sticky', top: 0 }}>
                                                <tr>
                                                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>#</th>
                                                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Full Name</th>
                                                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Reg No</th>
                                                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Email</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {externalCandidates.slice(0, 20).map((c, i) => (
                                                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                        <td style={{ padding: '8px 10px', color: '#94a3b8' }}>{i + 1}</td>
                                                        <td style={{ padding: '8px 10px', fontWeight: 600 }}>{c.fullName}</td>
                                                        <td style={{ padding: '8px 10px' }}>{c.regNo || '-'}</td>
                                                        <td style={{ padding: '8px 10px' }}>{c.email || '-'}</td>
                                                    </tr>
                                                ))}
                                                {externalCandidates.length > 20 && (
                                                    <tr><td colSpan={4} style={{ padding: '8px', textAlign: 'center', color: '#94a3b8', fontSize: '0.78rem' }}>...and {externalCandidates.length - 20} more</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                    <button onClick={uploadExternalCandidates} disabled={loading} style={{ padding: '10px 20px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}>
                                        {loading ? 'Uploading...' : `Upload ${externalCandidates.length} Candidates`}
                                    </button>
                                </>
                            )}
                        </>
                    ) : (
                        // Internal — show summary
                        <div style={{ textAlign: 'center', padding: '20px' }}>
                            <CheckCircle size={56} style={{ color: '#10b981', margin: '0 auto 16px' }} />
                            <h2 style={{ fontWeight: 800, marginBottom: '8px' }}>Exam Ready!</h2>
                            <p style={{ color: '#64748b', marginBottom: '20px' }}>Your exam has been set up. Students from the selected classes are automatically registered.</p>
                            <div style={{ display: 'inline-block', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '16px 32px', marginBottom: '24px' }}>
                                <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '4px' }}>Exam Code</p>
                                <p style={{ fontSize: '2rem', fontWeight: 900, color: '#16a34a', letterSpacing: '4px' }}>{exam.examCode}</p>
                                <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Share this code with students</p>
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                        <button onClick={() => setStep(3)} style={{ padding: '10px 20px', background: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>← Back</button>
                        <a href="/schoolcbt/active" style={{ padding: '10px 20px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, textDecoration: 'none' }}>
                            Go to Active Exams →
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
}