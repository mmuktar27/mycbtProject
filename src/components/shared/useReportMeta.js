import { useState, useEffect } from 'react';
import axios from 'axios';

// Fetches the shared filter metadata (academic years + terms, classes,
// subjects, fee categories, staff roles, departments) that report pages
// use to populate their dropdowns. Backed by GET /api/reports/filters/meta.
export const useReportMeta = () => {
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchMeta = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/reports/filters/meta');
        if (isMounted && response.data.success) {
          setMeta(response.data.data);
        }
      } catch (err) {
        console.error('Error fetching report filter metadata:', err);
        if (isMounted) setError(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchMeta();
    return () => { isMounted = false; };
  }, []);

  return { meta, loading, error };
};