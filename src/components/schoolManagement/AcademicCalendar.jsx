import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Calendar, Plus, Save, X, CheckCircle, AlertCircle,
    ChevronDown, ChevronUp, Clock, BookOpen, Flag, Trash2, Edit2
} from 'lucide-react';

// ── tiny helpers ─────────────────────────────────────────────────────────────

const fmt = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-NG', {
        day: 'numeric', month: 'short', year: 'numeric'
    });
};

const STATUS_STYLE = {
    active:    { background: '#dcfce7', color: '#166534', border: '#86efac' },
    completed: { background: '#f3f4f6', color: '#374151', border: '#d1d5db' },
    upcoming:  { background: '#eff6ff', color: '#1e40af', border: '#bfdbfe' },
};

const StatusBadge = ({ status, isCurrent }) => {
    const label = isCurrent ? 'Current' : (status || 'upcoming');
    const style = isCurrent
        ? { background: '#fef3c7', color: '#92400e', border: '#fcd34d' }
        : STATUS_STYLE[status] || STATUS_STYLE.upcoming;
    return (
        <span style={{
            display: 'inline-block', padding: '3px 10px', borderRadius: '999px',
            fontSize: '0.72rem', fontWeight: 700, border: `1px solid ${style.border}`,
            background: style.background, color: style.color, whiteSpace: 'nowrap'
        }}>
            {isCurrent ? '● Current' : label.charAt(0).toUpperCase() + label.slice(1)}
        </span>
    );
};

// ── main component ────────────────────────────────────────────────────────────

const AcademicCalendar = () => {
    const [years, setYears] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    // which year cards are expanded
    const [expanded, setExpanded] = useState({});

    // add-year form
    const [showAddYear, setShowAddYear] = useState(false);
    const [newYear, setNewYear] = useState({ yearLabel: '', startDate: '', endDate: '' });

    // edit-term inline state  { [termId]: { startDate, endDate, termName } }
    const [editingTerm, setEditingTerm] = useState(null);
    const [termForm, setTermForm] = useState({});

    // edit-year inline state
    const [editingYear, setEditingYear] = useState(null);
    const [yearForm, setYearForm] = useState({});

    const showSuccess = (msg) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 4000); };
    const showError   = (msg) => { setErrorMsg(msg);   setTimeout(() => setErrorMsg(''),   5000); };

    // ── fetch ───────────────────────────────────────────────────────────────
    const fetchYears = async () => {
        try {
            setLoading(true);
            const res = await axios.get('/api/academic-years');
            if (res.data.success) {
                setYears(res.data.data);
                // auto-expand the current year
                const cur = res.data.data.find(y => y.isCurrent);
                if (cur) setExpanded(e => ({ ...e, [cur.id]: true }));
            }
        } catch (err) {
            showError('Failed to load academic years');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchYears(); }, []);

    // ── add year ────────────────────────────────────────────────────────────
    const handleAddYear = async () => {
        if (!newYear.yearLabel || !newYear.startDate || !newYear.endDate) {
            showError('All fields are required');
            return;
        }
        try {
            setSaving(true);
            const res = await axios.post('/api/academic-years', newYear);
            if (res.data.success) {
                showSuccess(`Academic year ${newYear.yearLabel} created with 3 terms`);
                setNewYear({ yearLabel: '', startDate: '', endDate: '' });
                setShowAddYear(false);
                setExpanded(e => ({ ...e, [res.data.data.id]: true }));
                await fetchYears();
            }
        } catch (err) {
            showError(err.response?.data?.message || 'Failed to create academic year');
        } finally {
            setSaving(false);
        }
    };

    // ── set current term ────────────────────────────────────────────────────
    const handleSetCurrentTerm = async (termId, termName, yearLabel) => {
        if (!window.confirm(`Set "${termName} — ${yearLabel}" as the current active term?\n\nThis will deactivate any previously active term.`)) return;
        try {
            setSaving(true);
            const res = await axios.put(`/api/academic-years/set-current-term/${termId}`);
            if (res.data.success) {
                showSuccess(`${termName} (${yearLabel}) is now the active term`);
                await fetchYears();
            }
        } catch (err) {
            showError(err.response?.data?.message || 'Failed to set current term');
        } finally {
            setSaving(false);
        }
    };

    // ── complete term ───────────────────────────────────────────────────────
    const handleCompleteTerm = async (termId, termName) => {
        if (!window.confirm(`Mark "${termName}" as completed?`)) return;
        try {
            setSaving(true);
            const res = await axios.put(`/api/academic-years/terms/${termId}/complete`);
            if (res.data.success) {
                showSuccess(`${termName} marked as completed`);
                await fetchYears();
            }
        } catch (err) {
            showError(err.response?.data?.message || 'Failed to complete term');
        } finally {
            setSaving(false);
        }
    };

    // ── save term dates ─────────────────────────────────────────────────────
    const handleSaveTermDates = async (termId) => {
        try {
            setSaving(true);
            const res = await axios.put(`/api/academic-years/terms/${termId}`, termForm);
            if (res.data.success) {
                showSuccess('Term dates saved');
                setEditingTerm(null);
                await fetchYears();
            }
        } catch (err) {
            showError(err.response?.data?.message || 'Failed to save term dates');
        } finally {
            setSaving(false);
        }
    };

    // ── save year ───────────────────────────────────────────────────────────
    const handleSaveYear = async (yearId) => {
        try {
            setSaving(true);
            const res = await axios.put(`/api/academic-years/${yearId}`, yearForm);
            if (res.data.success) {
                showSuccess('Academic year updated');
                setEditingYear(null);
                await fetchYears();
            }
        } catch (err) {
            showError(err.response?.data?.message || 'Failed to update year');
        } finally {
            setSaving(false);
        }
    };

    // ── delete year ─────────────────────────────────────────────────────────
    const handleDeleteYear = async (yearId, yearLabel) => {
        if (!window.confirm(`Delete academic year "${yearLabel}"?\n\nAll 3 terms for this year will also be deleted. This cannot be undone.`)) return;
        try {
            setSaving(true);
            const res = await axios.delete(`/api/academic-years/${yearId}`);
            if (res.data.success) {
                showSuccess(`${yearLabel} deleted`);
                await fetchYears();
            }
        } catch (err) {
            showError(err.response?.data?.message || 'Failed to delete year');
        } finally {
            setSaving(false);
        }
    };

    // ── auto-fill yearLabel when both year dates are set ────────────────────
    const handleYearDateChange = (field, value) => {
        const updated = { ...newYear, [field]: value };
        if (updated.startDate && !newYear.yearLabel) {
            const y1 = new Date(updated.startDate).getFullYear();
            updated.yearLabel = `${y1}/${y1 + 1}`;
        }
        setNewYear(updated);
    };

    // ── shared styles ────────────────────────────────────────────────────────
    const inputStyle = {
        padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px',
        fontSize: '0.875rem', background: '#fff', outline: 'none',
        fontFamily: 'inherit', color: '#111827', boxSizing: 'border-box', width: '100%'
    };
    const btnPrimary = {
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        padding: '8px 16px', background: '#2563eb', color: '#fff',
        border: 'none', borderRadius: '8px', cursor: 'pointer',
        fontSize: '0.875rem', fontWeight: 600, opacity: saving ? 0.7 : 1
    };
    const btnSecondary = {
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        padding: '8px 16px', background: '#fff', color: '#374151',
        border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer',
        fontSize: '0.875rem', fontWeight: 600
    };
    const btnGhost = (color = '#374151') => ({
        display: 'inline-flex', alignItems: 'center', gap: '4px',
        padding: '5px 10px', background: 'transparent', color,
        border: `1px solid ${color}22`, borderRadius: '6px', cursor: 'pointer',
        fontSize: '0.78rem', fontWeight: 600
    });

    // ── summary bar (current term info) ─────────────────────────────────────
    const currentTerm = years.flatMap(y => y.terms || []).find(t => t.isCurrent);
    const currentYear = years.find(y => y.isCurrent);

    // ── render ───────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px', color: '#6b7280', gap: '12px' }}>
                <div style={{ width: '28px', height: '28px', border: '3px solid #e5e7eb', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                Loading academic calendar...
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '900px' }}>

            {/* Alerts */}
            {successMsg && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: '#dcfce7', border: '1px solid #86efac', borderRadius: '8px', color: '#166534', marginBottom: '16px', fontWeight: 600 }}>
                    <CheckCircle size={18} /> {successMsg}
                </div>
            )}
            {errorMsg && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px', color: '#991b1b', marginBottom: '16px', fontWeight: 600 }}>
                    <AlertCircle size={18} /> {errorMsg}
                </div>
            )}

            {/* Page header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={22} /> Academic Calendar
                    </h2>
                    <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#6b7280' }}>
                        Manage academic years and terms. Each year has 3 terms.
                    </p>
                </div>
                {!showAddYear && (
                    <button style={btnPrimary} onClick={() => setShowAddYear(true)}>
                        <Plus size={16} /> Add Academic Year
                    </button>
                )}
            </div>

            {/* Current term banner */}
            {currentTerm && currentYear && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '14px 20px', background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)', borderRadius: '10px', marginBottom: '24px', flexWrap: 'wrap', gap: '10px' }}>
                    <Flag size={20} color="#fff" />
                    <div>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#bfdbfe', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Currently Active</p>
                        <p style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#fff' }}>
                            {currentTerm.termName} &nbsp;·&nbsp; {currentYear.yearLabel}
                        </p>
                    </div>
                    {currentTerm.startDate && (
                        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: '#bfdbfe' }}>
                                {fmt(currentTerm.startDate)} – {fmt(currentTerm.endDate)}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Add year form */}
            {showAddYear && (
                <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '20px', marginBottom: '24px' }}>
                    <h3 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 700, color: '#111827' }}>
                        New Academic Year
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>
                                Year Start Date <span style={{ color: '#dc2626' }}>*</span>
                            </label>
                            <input
                                style={inputStyle} type="date"
                                value={newYear.startDate}
                                onChange={e => handleYearDateChange('startDate', e.target.value)}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>
                                Year End Date <span style={{ color: '#dc2626' }}>*</span>
                            </label>
                            <input
                                style={inputStyle} type="date"
                                value={newYear.endDate}
                                onChange={e => setNewYear(p => ({ ...p, endDate: e.target.value }))}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>
                                Year Label <span style={{ color: '#dc2626' }}>*</span>
                            </label>
                            <input
                                style={inputStyle} placeholder="e.g. 2024/2025"
                                value={newYear.yearLabel}
                                onChange={e => setNewYear(p => ({ ...p, yearLabel: e.target.value }))}
                            />
                        </div>
                    </div>
                    <p style={{ margin: '0 0 14px', fontSize: '0.78rem', color: '#6b7280' }}>
                        Three terms (First, Second, Third) will be created automatically. You can set their individual dates after.
                    </p>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button style={btnPrimary} onClick={handleAddYear} disabled={saving}>
                            <Save size={16} /> {saving ? 'Creating...' : 'Create Year'}
                        </button>
                        <button style={btnSecondary} onClick={() => { setShowAddYear(false); setNewYear({ yearLabel: '', startDate: '', endDate: '' }); }}>
                            <X size={16} /> Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Empty state */}
            {years.length === 0 && !showAddYear && (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af', border: '2px dashed #e5e7eb', borderRadius: '10px' }}>
                    <Calendar size={48} style={{ marginBottom: '12px', opacity: 0.4 }} />
                    <p style={{ margin: 0, fontWeight: 600, color: '#6b7280' }}>No academic years yet</p>
                    <p style={{ margin: '4px 0 0', fontSize: '0.875rem' }}>Click "Add Academic Year" to get started.</p>
                </div>
            )}

            {/* Year cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {years.map(year => {
                    const isExpanded = expanded[year.id];
                    const isEditingThisYear = editingYear === year.id;

                    return (
                        <div key={year.id} style={{
                            background: '#fff', border: year.isCurrent ? '2px solid #2563eb' : '1px solid #e5e7eb',
                            borderRadius: '12px', overflow: 'hidden',
                            boxShadow: year.isCurrent ? '0 0 0 4px rgba(37,99,235,0.08)' : 'none'
                        }}>
                            {/* Year header */}
                            <div
                                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', background: year.isCurrent ? '#eff6ff' : '#f9fafb', cursor: 'pointer', flexWrap: 'wrap' }}
                                onClick={() => setExpanded(e => ({ ...e, [year.id]: !e[year.id] }))}
                            >
                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                    <BookOpen size={18} color={year.isCurrent ? '#2563eb' : '#6b7280'} />
                                    {isEditingThisYear ? (
                                        <input
                                            style={{ ...inputStyle, width: '160px', fontSize: '1rem', fontWeight: 700 }}
                                            value={yearForm.yearLabel}
                                            onChange={e => setYearForm(p => ({ ...p, yearLabel: e.target.value }))}
                                            onClick={e => e.stopPropagation()}
                                        />
                                    ) : (
                                        <span style={{ fontSize: '1.1rem', fontWeight: 700, color: year.isCurrent ? '#1e40af' : '#111827' }}>
                                            {year.yearLabel}
                                        </span>
                                    )}
                                    <StatusBadge status={year.status} isCurrent={year.isCurrent} />
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={e => e.stopPropagation()}>
                                    {isEditingThisYear ? (
                                        <>
                                            <input style={{ ...inputStyle, width: '140px' }} type="date" value={yearForm.startDate}
                                                onChange={e => setYearForm(p => ({ ...p, startDate: e.target.value }))} />
                                            <span style={{ color: '#9ca3af' }}>–</span>
                                            <input style={{ ...inputStyle, width: '140px' }} type="date" value={yearForm.endDate}
                                                onChange={e => setYearForm(p => ({ ...p, endDate: e.target.value }))} />
                                            <button style={btnPrimary} onClick={() => handleSaveYear(year.id)} disabled={saving}>
                                                <Save size={14} />
                                            </button>
                                            <button style={btnSecondary} onClick={() => setEditingYear(null)}>
                                                <X size={14} />
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                                                {fmt(year.startDate)} – {fmt(year.endDate)}
                                            </span>
                                            <button style={btnGhost('#6b7280')} onClick={() => {
                                                setEditingYear(year.id);
                                                setYearForm({ yearLabel: year.yearLabel, startDate: year.startDate, endDate: year.endDate });
                                                setExpanded(e => ({ ...e, [year.id]: true }));
                                            }}>
                                                <Edit2 size={13} />
                                            </button>
                                            {!year.isCurrent && (
                                                <button style={btnGhost('#dc2626')} onClick={() => handleDeleteYear(year.id, year.yearLabel)}>
                                                    <Trash2 size={13} />
                                                </button>
                                            )}
                                        </>
                                    )}
                                    <span style={{ color: '#9ca3af', marginLeft: '4px' }}>
                                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                    </span>
                                </div>
                            </div>

                            {/* Terms */}
                            {isExpanded && (
                                <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {(year.terms || []).map(term => {
                                        const isEditingThisTerm = editingTerm === term.id;
                                        const termColor = term.isCurrent ? '#2563eb' : term.status === 'completed' ? '#6b7280' : '#374151';

                                        return (
                                            <div key={term.id} style={{
                                                display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap',
                                                padding: '12px 16px',
                                                background: term.isCurrent ? '#eff6ff' : term.status === 'completed' ? '#f9fafb' : '#fff',
                                                border: term.isCurrent ? '1px solid #bfdbfe' : '1px solid #f3f4f6',
                                                borderRadius: '8px'
                                            }}>
                                                {/* Term number circle */}
                                                <div style={{
                                                    width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    background: term.isCurrent ? '#2563eb' : term.status === 'completed' ? '#d1d5db' : '#e5e7eb',
                                                    color: term.isCurrent ? '#fff' : '#374151',
                                                    fontWeight: 700, fontSize: '0.85rem'
                                                }}>
                                                    {term.termNumber}
                                                </div>

                                                {/* Term name + status */}
                                                <div style={{ flex: 1, minWidth: '120px' }}>
                                                    <p style={{ margin: 0, fontWeight: 600, color: termColor, fontSize: '0.9rem' }}>
                                                        {term.termName}
                                                    </p>
                                                    <div style={{ marginTop: '3px' }}>
                                                        <StatusBadge status={term.status} isCurrent={term.isCurrent} />
                                                    </div>
                                                </div>

                                                {/* Dates — edit or display */}
                                                {isEditingThisTerm ? (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                        <input style={{ ...inputStyle, width: '150px' }} type="date"
                                                            value={termForm.startDate || ''}
                                                            onChange={e => setTermForm(p => ({ ...p, startDate: e.target.value }))} />
                                                        <span style={{ color: '#9ca3af' }}>–</span>
                                                        <input style={{ ...inputStyle, width: '150px' }} type="date"
                                                            value={termForm.endDate || ''}
                                                            onChange={e => setTermForm(p => ({ ...p, endDate: e.target.value }))} />
                                                        <button style={btnPrimary} onClick={() => handleSaveTermDates(term.id)} disabled={saving}>
                                                            <Save size={14} /> Save
                                                        </button>
                                                        <button style={btnSecondary} onClick={() => setEditingTerm(null)}>
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                        <span style={{ fontSize: '0.8rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <Clock size={13} />
                                                            {term.startDate
                                                                ? `${fmt(term.startDate)} – ${fmt(term.endDate)}`
                                                                : 'Dates not set'}
                                                        </span>

                                                        {/* Edit dates button */}
                                                        <button style={btnGhost('#374151')} onClick={() => {
                                                            setEditingTerm(term.id);
                                                            setTermForm({ startDate: term.startDate || '', endDate: term.endDate || '', termName: term.termName });
                                                        }}>
                                                            <Edit2 size={12} /> Dates
                                                        </button>

                                                        {/* Set as current — only show if not already current */}
                                                        {!term.isCurrent && term.status !== 'completed' && (
                                                            <button
                                                                style={btnGhost('#2563eb')}
                                                                onClick={() => handleSetCurrentTerm(term.id, term.termName, year.yearLabel)}
                                                                disabled={saving}
                                                            >
                                                                <Flag size={12} /> Set Current
                                                            </button>
                                                        )}

                                                        {/* Complete term — only show if it's the current active term */}
                                                        {term.isCurrent && term.status !== 'completed' && (
                                                            <button
                                                                style={btnGhost('#059669')}
                                                                onClick={() => handleCompleteTerm(term.id, term.termName)}
                                                                disabled={saving}
                                                            >
                                                                <CheckCircle size={12} /> End Term
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AcademicCalendar;