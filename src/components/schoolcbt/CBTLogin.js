// pages/cbt/CBTLogin.jsx
// This is the standalone page students visit to login and take the exam.
// Route: /cbt-login  (accessible on local network from other PCs)

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Monitor, AlertCircle } from 'lucide-react';

const API = '/api';

export default function CBTLogin() {
    const [examCode, setExamCode] = useState('');
    const [regNo, setRegNo]       = useState('');
    const [pin, setPin]           = useState('');
    const [loading, setLoading]   = useState(false);
    const [error, setError]       = useState('');
    const navigate = useNavigate();

    async function handleLogin(e) {
        e.preventDefault();
        if (!examCode || !regNo) { setError('Exam code and Reg No are required'); return; }
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`${API}/cbt/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ examCode: examCode.toUpperCase().trim(), regNo: regNo.trim(), pin: pin.trim() })
            });
            const data = await res.json();
            if (data.success) {
                // Store session in sessionStorage (clears when tab closes)
                sessionStorage.setItem('cbt_session', JSON.stringify(data.data));
                navigate('/cbt-exam');
            } else {
                setError(data.message || 'Login failed');
            }
        } catch (e) {
            setError('Cannot connect to server. Check your network connection.');
        }
        setLoading(false);
    }

    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e40af 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ width: '100%', maxWidth: '420px' }}>
                {/* Logo area */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', background: 'rgba(255,255,255,0.15)', borderRadius: '16px', marginBottom: '16px' }}>
                        <Monitor size={32} color="#fff" />
                    </div>
                    <h1 style={{ color: '#fff', fontWeight: 900, fontSize: '1.6rem', marginBottom: '6px' }}>CBT Examination</h1>
                    <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.9rem' }}>Enter your details to begin the exam</p>
                </div>

                {/* Login card */}
                <div style={{ background: '#fff', borderRadius: '16px', padding: '32px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
                    {error && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', fontSize: '0.85rem', marginBottom: '20px' }}>
                            <AlertCircle size={15} />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin}>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#374151', marginBottom: '6px' }}>
                                Exam Code *
                            </label>
                            <input
                                value={examCode}
                                onChange={e => setExamCode(e.target.value.toUpperCase())}
                                placeholder="e.g. ABC123"
                                maxLength={6}
                                style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '2px solid #e2e8f0', fontSize: '1.2rem', fontWeight: 800, letterSpacing: '4px', textAlign: 'center', outline: 'none', textTransform: 'uppercase', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                                onFocus={e => e.target.style.borderColor = '#6366f1'}
                                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                            />
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#374151', marginBottom: '6px' }}>
                                Student ID / Reg Number *
                            </label>
                            <input
                                value={regNo}
                                onChange={e => setRegNo(e.target.value)}
                                placeholder="Enter your student ID"
                                style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '2px solid #e2e8f0', fontSize: '1rem', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                                onFocus={e => e.target.style.borderColor = '#6366f1'}
                                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                            />
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#374151', marginBottom: '6px' }}>
                                PIN <span style={{ fontWeight: 400, color: '#94a3b8' }}>(external candidates only)</span>
                            </label>
                            <input
                                value={pin}
                                onChange={e => setPin(e.target.value)}
                                placeholder="6-digit PIN"
                                type="password"
                                maxLength={6}
                                style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '2px solid #e2e8f0', fontSize: '1rem', outline: 'none', letterSpacing: '4px', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                                onFocus={e => e.target.style.borderColor = '#6366f1'}
                                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                            />
                        </div>

                        <button type="submit" disabled={loading}
                            style={{ width: '100%', padding: '14px', background: loading ? '#a5b4fc' : '#6366f1', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 800, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.2s', letterSpacing: '0.5px' }}>
                            {loading ? 'Verifying...' : 'Start Exam →'}
                        </button>
                    </form>

                    <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.78rem', color: '#94a3b8' }}>
                        Do not close this tab once the exam has started.
                    </p>
                </div>

                <p style={{ textAlign: 'center', marginTop: '20px', color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>
                    Having issues? Contact your exam supervisor.
                </p>
            </div>
        </div>
    );
}