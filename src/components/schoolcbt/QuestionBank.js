// pages/cbt/QuestionBank.jsx
import React, { useState, useEffect } from 'react';
import { Plus, Search, Upload, Download, AlertCircle, CheckCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
const API = '/api';

export default function QuestionBank() {
    const [questions, setQuestions] = useState([]);
    const [exams, setExams] = useState([]);
    const [examSubjects, setExamSubjects] = useState([]);
    const [alert, setAlert] = useState(null);
    const [filters, setFilters] = useState({ subjectName: '', difficulty: '', search: '' });
    const [showForm, setShowForm] = useState(false);
    const [importModal, setImportModal] = useState(false);
    const [importExam, setImportExam] = useState({ examId: '', subjectId: '' });
    const [selectedIds, setSelectedIds] = useState([]);
    const [form, setForm] = useState({ subjectName:'',subjectCode:'',question:'',subtitle:'',optA:'',optB:'',optC:'',optD:'',answer:'A',marks:1,difficulty:'medium',createdBy:'Admin' });

    useEffect(() => { loadQuestions(); loadExams(); }, []);

    async function loadQuestions() {
        const params = new URLSearchParams();
        if (filters.subjectName) params.append('subjectName', filters.subjectName);
        if (filters.difficulty) params.append('difficulty', filters.difficulty);
        if (filters.search) params.append('search', filters.search);
        const res = await fetch(`${API}/cbt/question-bank?${params}`);
        const data = await res.json();
        if (data.success) setQuestions(data.data);
    }

    async function loadExams() {
        const res = await fetch(`${API}/cbt/exams`);
        const data = await res.json();
        if (data.success) setExams(data.data.filter(e => e.status === 'draft'));
    }

    async function loadExamSubjects(examId) {
        if (!examId) return;
        const res = await fetch(`${API}/cbt/exams/${examId}/subjects`);
        const data = await res.json();
        if (data.success) setExamSubjects(data.data);
    }

    function showAlert(type, msg) { setAlert({ type, msg }); setTimeout(() => setAlert(null), 5000); }

    async function saveQuestion() {
        if (!form.subjectName || !form.question || !form.answer) return showAlert('error', 'Subject, question and answer required');
        const res = await fetch(`${API}/cbt/question-bank`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(form) });
        const data = await res.json();
        if (data.success) { showAlert('success','Saved'); setShowForm(false); loadQuestions(); }
        else showAlert('error', data.message);
    }

    async function handleBulkUpload(e) {
        const file = e.target.files[0]; if (!file) return;
        const buffer = await file.arrayBuffer();
        const rows = XLSX.utils.sheet_to_json(XLSX.read(buffer).Sheets[XLSX.read(buffer).SheetNames[0]]);
        let added = 0;
        for (const row of rows) {
            if (!row.question || !row.answer) continue;
            await fetch(`${API}/cbt/question-bank`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ subjectName:row.subjectName||row.subject||'General', subjectCode:row.subjectCode||'', question:String(row.question), subtitle:row.subtitle||'', optA:row.optA||row['Option A']||'', optB:row.optB||row['Option B']||'', optC:row.optC||row['Option C']||'', optD:row.optD||row['Option D']||'', answer:String(row.answer).toUpperCase(), marks:parseFloat(row.marks)||1, difficulty:row.difficulty||'medium', createdBy:'Admin' }) });
            added++;
        }
        showAlert('success', `Added ${added} questions`); loadQuestions(); e.target.value='';
    }

    async function importToExam() {
        if (!importExam.examId || !importExam.subjectId || selectedIds.length === 0) return showAlert('error', 'Select exam, subject and questions');
        const res = await fetch(`${API}/cbt/exams/${importExam.examId}/import-from-bank`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ questionIds:selectedIds, cbtSubjectId:parseInt(importExam.subjectId) }) });
        const data = await res.json();
        if (data.success) { showAlert('success',`Imported ${data.data.imported}`); setImportModal(false); setSelectedIds([]); }
        else showAlert('error', data.message);
    }

    function downloadTemplate() {
        const ws = XLSX.utils.aoa_to_sheet([
            ['subjectName','subjectCode','question','subtitle','optA','optB','optC','optD','answer','marks','difficulty'],
            ['Mathematics','MATH','What is 5 × 8?','','35','40','45','50','B','1','easy'],
        ]);
        ws['!cols'] = Array(11).fill({ wch: 20 });
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Template');
        XLSX.writeFile(wb, 'QuestionBank_Template.xlsx');
    }

    const subjects = [...new Set(questions.map(q => q.subjectName))];
    const diffColor = { easy:'#16a34a', medium:'#d97706', hard:'#dc2626' };
    const diffBg   = { easy:'#f0fdf4', medium:'#fffbeb', hard:'#fef2f2' };

    return (
        <div style={{ padding:'24px' }}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px',flexWrap:'wrap',gap:'12px' }}>
                <div><h1 style={{ fontWeight:800,fontSize:'1.3rem',marginBottom:'2px' }}>Question Bank</h1><p style={{ color:'#64748b',fontSize:'0.85rem',margin:0 }}>{questions.length} questions</p></div>
                <div style={{ display:'flex',gap:'8px',flexWrap:'wrap' }}>
                    <button onClick={downloadTemplate} style={{ padding:'8px 14px',background:'#f1f5f9',border:'1px solid #e2e8f0',borderRadius:'8px',cursor:'pointer',fontSize:'0.82rem',display:'flex',alignItems:'center',gap:'5px' }}><Download size={13}/>Template</button>
                    <label style={{ padding:'8px 14px',background:'#10b981',color:'#fff',borderRadius:'8px',cursor:'pointer',fontSize:'0.82rem',display:'flex',alignItems:'center',gap:'5px' }}><Upload size={13}/>Bulk Upload<input type="file" accept=".xlsx,.xls" hidden onChange={handleBulkUpload}/></label>
                    {selectedIds.length > 0 && <button onClick={() => setImportModal(true)} style={{ padding:'8px 14px',background:'#6366f1',color:'#fff',border:'none',borderRadius:'8px',cursor:'pointer',fontWeight:700,fontSize:'0.82rem' }}>Import {selectedIds.length} to Exam</button>}
                    <button onClick={() => setShowForm(true)} style={{ padding:'8px 16px',background:'#6366f1',color:'#fff',border:'none',borderRadius:'8px',cursor:'pointer',fontWeight:700,display:'flex',alignItems:'center',gap:'5px' }}><Plus size={14}/>Add Question</button>
                </div>
            </div>

            {alert && <div style={{ padding:'10px 16px',borderRadius:'8px',marginBottom:'16px',display:'flex',gap:'8px',background:alert.type==='error'?'#fef2f2':'#f0fdf4',color:alert.type==='error'?'#dc2626':'#16a34a',border:`1px solid ${alert.type==='error'?'#fecaca':'#bbf7d0'}`,fontSize:'0.85rem' }}>{alert.type==='error'?<AlertCircle size={14}/>:<CheckCircle size={14}/>}{alert.msg}</div>}

            {showForm && (
                <div style={{ background:'#fff',border:'1px solid #e2e8f0',borderRadius:'12px',padding:'20px',marginBottom:'20px' }}>
                    <h3 style={{ fontWeight:700,marginBottom:'14px',fontSize:'0.95rem' }}>New Question</h3>
                    <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px' }}>
                        <div><label style={{ display:'block',marginBottom:'3px',fontSize:'0.78rem',fontWeight:600 }}>Subject *</label><input value={form.subjectName} onChange={e=>setForm(p=>({...p,subjectName:e.target.value}))} style={{ width:'100%',padding:'8px',borderRadius:'6px',border:'1px solid #e2e8f0' }}/></div>
                        <div><label style={{ display:'block',marginBottom:'3px',fontSize:'0.78rem',fontWeight:600 }}>Code</label><input value={form.subjectCode} onChange={e=>setForm(p=>({...p,subjectCode:e.target.value}))} style={{ width:'100%',padding:'8px',borderRadius:'6px',border:'1px solid #e2e8f0' }}/></div>
                        <div style={{ gridColumn:'1/-1' }}><label style={{ display:'block',marginBottom:'3px',fontSize:'0.78rem',fontWeight:600 }}>Question *</label><textarea value={form.question} onChange={e=>setForm(p=>({...p,question:e.target.value}))} rows={3} style={{ width:'100%',padding:'8px',borderRadius:'6px',border:'1px solid #e2e8f0',resize:'vertical' }}/></div>
                        {['A','B','C','D'].map(o=><div key={o}><label style={{ display:'block',marginBottom:'3px',fontSize:'0.78rem',fontWeight:600 }}>Option {o}</label><input value={form[`opt${o}`]} onChange={e=>setForm(p=>({...p,[`opt${o}`]:e.target.value}))} style={{ width:'100%',padding:'8px',borderRadius:'6px',border:`1px solid ${form.answer===o?'#10b981':'#e2e8f0'}` }}/></div>)}
                        <div><label style={{ display:'block',marginBottom:'3px',fontSize:'0.78rem',fontWeight:600 }}>Answer</label><select value={form.answer} onChange={e=>setForm(p=>({...p,answer:e.target.value}))} style={{ width:'100%',padding:'8px',borderRadius:'6px',border:'1px solid #e2e8f0' }}>{['A','B','C','D'].map(o=><option key={o}>{o}</option>)}</select></div>
                        <div><label style={{ display:'block',marginBottom:'3px',fontSize:'0.78rem',fontWeight:600 }}>Difficulty</label><select value={form.difficulty} onChange={e=>setForm(p=>({...p,difficulty:e.target.value}))} style={{ width:'100%',padding:'8px',borderRadius:'6px',border:'1px solid #e2e8f0' }}>{['easy','medium','hard'].map(d=><option key={d}>{d}</option>)}</select></div>
                    </div>
                    <div style={{ display:'flex',gap:'10px',marginTop:'14px' }}>
                        <button onClick={saveQuestion} style={{ padding:'9px 20px',background:'#6366f1',color:'#fff',border:'none',borderRadius:'8px',cursor:'pointer',fontWeight:700 }}>Save</button>
                        <button onClick={()=>setShowForm(false)} style={{ padding:'9px 18px',background:'#f1f5f9',border:'none',borderRadius:'8px',cursor:'pointer' }}>Cancel</button>
                    </div>
                </div>
            )}

            <div style={{ display:'flex',gap:'10px',marginBottom:'14px',flexWrap:'wrap' }}>
                <div style={{ position:'relative',flex:1,minWidth:'180px' }}><Search size={13} style={{ position:'absolute',left:'10px',top:'50%',transform:'translateY(-50%)',color:'#94a3b8' }}/><input value={filters.search} onChange={e=>setFilters(p=>({...p,search:e.target.value}))} onKeyDown={e=>e.key==='Enter'&&loadQuestions()} placeholder="Search..." style={{ width:'100%',padding:'8px 10px 8px 30px',borderRadius:'8px',border:'1px solid #e2e8f0',fontSize:'0.83rem' }}/></div>
                <select value={filters.subjectName} onChange={e=>{setFilters(p=>({...p,subjectName:e.target.value}));setTimeout(loadQuestions,50);}} style={{ padding:'8px 10px',borderRadius:'8px',border:'1px solid #e2e8f0',fontSize:'0.83rem' }}><option value="">All Subjects</option>{subjects.map(s=><option key={s}>{s}</option>)}</select>
                <select value={filters.difficulty} onChange={e=>{setFilters(p=>({...p,difficulty:e.target.value}));setTimeout(loadQuestions,50);}} style={{ padding:'8px 10px',borderRadius:'8px',border:'1px solid #e2e8f0',fontSize:'0.83rem' }}><option value="">All Levels</option>{['easy','medium','hard'].map(d=><option key={d}>{d}</option>)}</select>
                <button onClick={loadQuestions} style={{ padding:'8px 14px',background:'#6366f1',color:'#fff',border:'none',borderRadius:'8px',cursor:'pointer',fontSize:'0.83rem' }}>Search</button>
            </div>

            {questions.length > 0 && <div style={{ marginBottom:'8px',fontSize:'0.78rem',color:'#64748b',display:'flex',alignItems:'center',gap:'8px' }}><input type="checkbox" checked={selectedIds.length===questions.length} onChange={e=>setSelectedIds(e.target.checked?questions.map(q=>q.id):[])}/> Select all ({selectedIds.length} selected)</div>}

            {questions.length === 0 ? (
                <div style={{ textAlign:'center',padding:'48px',color:'#94a3b8',background:'#f8fafc',borderRadius:'12px',fontSize:'0.9rem' }}>No questions yet. Add or bulk upload.</div>
            ) : questions.map(q=>(
                <div key={q.id} style={{ background:'#fff',border:`2px solid ${selectedIds.includes(q.id)?'#6366f1':'#e2e8f0'}`,borderRadius:'10px',padding:'14px',marginBottom:'8px',display:'flex',gap:'12px',alignItems:'flex-start' }}>
                    <input type="checkbox" checked={selectedIds.includes(q.id)} onChange={e=>setSelectedIds(p=>e.target.checked?[...p,q.id]:p.filter(id=>id!==q.id))} style={{ marginTop:'3px',flexShrink:0 }}/>
                    <div style={{ flex:1 }}>
                        <div style={{ display:'flex',gap:'6px',marginBottom:'6px',flexWrap:'wrap' }}>
                            <span style={{ fontSize:'0.7rem',fontWeight:700,padding:'2px 8px',borderRadius:'10px',background:'#eef2ff',color:'#6366f1' }}>{q.subjectName}</span>
                            <span style={{ fontSize:'0.7rem',padding:'2px 8px',borderRadius:'10px',background:diffBg[q.difficulty],color:diffColor[q.difficulty],fontWeight:700 }}>{q.difficulty}</span>
                            <span style={{ fontSize:'0.7rem',color:'#94a3b8' }}>{q.marks} mark · used {q.usageCount}×</span>
                        </div>
                        <p style={{ margin:'0 0 8px',fontSize:'0.875rem' }}>{q.question}</p>
                        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'3px',fontSize:'0.77rem' }}>
                            {['A','B','C','D'].map(o=><span key={o} style={{ padding:'3px 7px',borderRadius:'4px',background:q.answer===o?'#f0fdf4':'#f8fafc',color:q.answer===o?'#16a34a':'#475569',fontWeight:q.answer===o?700:400 }}>({o}) {q[`opt${o}`]}</span>)}
                        </div>
                    </div>
                </div>
            ))}

            {importModal && (
                <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center' }}>
                    <div style={{ background:'#fff',borderRadius:'12px',padding:'28px',width:'380px',boxShadow:'0 8px 32px rgba(0,0,0,0.2)' }}>
                        <h3 style={{ fontWeight:800,marginBottom:'16px' }}>Import {selectedIds.length} Questions to Exam</h3>
                        <label style={{ display:'block',marginBottom:'5px',fontWeight:600,fontSize:'0.82rem' }}>Target Exam (draft only)</label>
                        <select value={importExam.examId} onChange={e=>{setImportExam(p=>({...p,examId:e.target.value,subjectId:''}));loadExamSubjects(e.target.value);}} style={{ width:'100%',padding:'9px',borderRadius:'8px',border:'1px solid #e2e8f0',marginBottom:'12px' }}>
                            <option value="">-- Select Exam --</option>{exams.map(e=><option key={e.id} value={e.id}>{e.title}</option>)}
                        </select>
                        <label style={{ display:'block',marginBottom:'5px',fontWeight:600,fontSize:'0.82rem' }}>Target Subject</label>
                        <select value={importExam.subjectId} onChange={e=>setImportExam(p=>({...p,subjectId:e.target.value}))} style={{ width:'100%',padding:'9px',borderRadius:'8px',border:'1px solid #e2e8f0',marginBottom:'18px' }}>
                            <option value="">-- Select Subject --</option>{examSubjects.map(s=><option key={s.id} value={s.id}>{s.subjectName}</option>)}
                        </select>
                        <div style={{ display:'flex',gap:'10px' }}>
                            <button onClick={importToExam} style={{ flex:1,padding:'10px',background:'#6366f1',color:'#fff',border:'none',borderRadius:'8px',cursor:'pointer',fontWeight:700 }}>Import</button>
                            <button onClick={()=>setImportModal(false)} style={{ padding:'10px 18px',background:'#f1f5f9',border:'none',borderRadius:'8px',cursor:'pointer' }}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}