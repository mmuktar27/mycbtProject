import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AcademicYearContext = createContext(null);

export const AcademicYearProvider = ({ children }) => {
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchYears = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get('/api/academic-years');
      if (res.data.success) {
        setAcademicYears(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching academic years:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchYears(); }, [fetchYears]);

  // Derive the single current year / current term from the nested data
  const currentYear = academicYears.find(y => y.isCurrent) || null;
  const currentTerm = currentYear
    ? (currentYear.terms || []).find(t => t.isCurrent) || null
    : null;

  const getTermsForYear = useCallback(
    (yearLabel) => (academicYears.find(y => y.yearLabel === yearLabel)?.terms) || [],
    [academicYears]
  );

  const value = {
    academicYears,
    loading,
    error,
    currentYear,
    currentTerm,
    getTermsForYear,
    refetch: fetchYears
  };

  return (
    <AcademicYearContext.Provider value={value}>
      {children}
    </AcademicYearContext.Provider>
  );
};

export const useAcademicYears = () => {
  const ctx = useContext(AcademicYearContext);
  if (!ctx) throw new Error('useAcademicYears must be used inside AcademicYearProvider');
  return ctx;
};