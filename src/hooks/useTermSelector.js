// src/hooks/useTermSelector.js
import { useState, useEffect } from 'react';
import { useAcademicYears } from '../context/AcademicYearContext';

export const useTermSelector = () => {
  const { academicYears, loading, currentYear, currentTerm, getTermsForYear } = useAcademicYears();

  const [academicYear, setAcademicYear] = useState('');
  const [termId, setTermId] = useState('');

  // Default to current year/term once data loads
  useEffect(() => {
    if (!loading && currentYear && !academicYear) {
      setAcademicYear(currentYear.yearLabel);
    }
  }, [loading, currentYear, academicYear]);

  useEffect(() => {
    if (!loading && currentTerm && !termId && academicYear === currentYear?.yearLabel) {
      setTermId(String(currentTerm.id));
    }
  }, [loading, currentTerm, termId, academicYear, currentYear]);

  const terms = getTermsForYear(academicYear);
  const selectedTerm = terms.find(t => String(t.id) === String(termId));

  const changeYear = (yearLabel) => {
    setAcademicYear(yearLabel);
    setTermId(''); // reset term when year changes, so a stale termId from another year can't leak through
  };

  return {
    academicYears,
    loading,
    academicYear,
    setAcademicYear: changeYear,
    termId,
    setTermId,
    terms,
    termName: selectedTerm ? selectedTerm.termName : ''
  };
};