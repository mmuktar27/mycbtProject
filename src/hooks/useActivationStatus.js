// hooks/useActivationStatus.js
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useState, useEffect, useRef } from 'react';

const CACHE_KEY = 'activationStatus';
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
const BG_SYNC_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

// Fetch system ID
const fetchSystemId = async () => {
  try {
    const res = await axios.get('/api/system-id');
    if (!res.data?.systemId) {
      throw new Error('System ID not found');
    }
    return res.data.systemId;
  } catch (err) {
    console.error('Failed to fetch system ID:', err.message);
    throw err;
  }
};

// Check activation status
const checkActivationStatus = async (systemId) => {
  try {
    const res = await axios.get(
      `/api/check-activation-status/${encodeURIComponent(systemId)}`
    );
    return {
      isActivated: res.data?.isActivated || false,
      activationKey: res.data?.activationKey || null,
      activatedAt: res.data?.activatedAt || null,
      status: res.data?.status || null,
      timestamp: Date.now(),
    };
  } catch (err) {
    console.error('Failed to fetch activation status:', err.message);
    throw err;
  }
};

// Local storage utilities
// NOTE: cache is not keyed by systemId. Fine for a single-machine desktop
// app; if this app can ever run across multiple machines sharing the same
// browser profile/storage, key this by systemId to avoid showing one
// machine's cached activation state on another.
const getStoredActivation = () => {
  try {
    const stored = localStorage.getItem(CACHE_KEY);
    if (!stored) return null;

    const data = JSON.parse(stored);
    const age = Date.now() - (data.timestamp || 0);

    if (age > CACHE_EXPIRY_MS) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    return data;
  } catch (err) {
    console.warn('Failed to read activation cache:', err.message);
    localStorage.removeItem(CACHE_KEY);
    return null;
  }
};

const setStoredActivation = (data) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('Failed to cache activation status:', err.message);
  }
};

// Main hook
export const useActivationStatus = () => {
  const queryClient = useQueryClient();
  const [cachedData, setCachedData] = useState(() => getStoredActivation());
  const bgSyncTimeoutRef = useRef(null);

  // Fetch system ID
  const systemIdQuery = useQuery({
    queryKey: ['systemId'],
    queryFn: fetchSystemId,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 2,
  });

  // Fetch activation status
  // NOTE: onSuccess/onError are NOT supported on useQuery in React Query v5
  // (removed, not deprecated — they're silently ignored if you pass them).
  // Persisting to localStorage/local state has to happen via an effect
  // watching `data`, below.
  const activationQuery = useQuery({
    queryKey: ['activationStatus', systemIdQuery.data],
    queryFn: () => checkActivationStatus(systemIdQuery.data),
    enabled: !!systemIdQuery.data,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
    retry: 1,
  });

  // Persist every successful fetch (initial or background) to localStorage
  // and to local state. This is the piece that was silently broken by the
  // v5 onSuccess removal — without it, the cache never updates past the
  // very first value written to localStorage.
  useEffect(() => {
    if (activationQuery.data) {
      setStoredActivation(activationQuery.data);
      setCachedData(activationQuery.data);
    }
  }, [activationQuery.data]);

  useEffect(() => {
    if (activationQuery.error) {
      console.error('Activation status query error:', activationQuery.error.message);
    }
  }, [activationQuery.error]);

  // Background sync effect
  useEffect(() => {
    if (!systemIdQuery.data) return;

    const scheduleBgSync = () => {
      bgSyncTimeoutRef.current = setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: ['activationStatus', systemIdQuery.data],
        });
        scheduleBgSync();
      }, BG_SYNC_INTERVAL_MS);
    };

    scheduleBgSync();

    return () => {
      if (bgSyncTimeoutRef.current) {
        clearTimeout(bgSyncTimeoutRef.current);
      }
    };
  }, [systemIdQuery.data, queryClient]);

  // Determine which data to display: fresh data wins, cached data is the
  // fallback while fresh data is unavailable (loading, error, or not yet fetched).
  const displayData = activationQuery.data || cachedData || {};

  const getStatus = () => {
    if (!activationQuery.data && cachedData) {
      return { ...cachedData, isCached: true };
    }
    return {
      ...displayData,
      isCached: !activationQuery.data && !!cachedData,
    };
  };

  const status = getStatus();

  // "Loading" should only be true when we have genuinely nothing to show —
  // if we already have a cached value, paint it immediately and let fresh
  // data replace it silently in the background. This is the fix for the
  // "user sees a loading state before seeing activated/not" issue.
  const hasNothingToShow = !cachedData && !activationQuery.data;
  const isLoading = (systemIdQuery.isLoading || activationQuery.isLoading) && hasNothingToShow;

  return {
    // State flags
    isLoading,
    isError: (systemIdQuery.isError || activationQuery.isError) && hasNothingToShow,
    isCached: status.isCached,
    error: systemIdQuery.error || activationQuery.error,

    // Data
    systemId: systemIdQuery.data,
    isActivated: status.isActivated || false,
    activationKey: status.activationKey || null,
    activatedAt: status.activatedAt || null,
    status: status.status || null,
    timestamp: status.timestamp || null,

    // Actions
    refetchActivation: async () => {
      try {
        localStorage.removeItem(CACHE_KEY);
        setCachedData(null);
        await activationQuery.refetch();
      } catch (err) {
        console.error('Manual refetch failed:', err.message);
      }
    },

    // Debug utility
    clearCache: () => {
      localStorage.removeItem(CACHE_KEY);
      setCachedData(null);
      queryClient.removeQueries({ queryKey: ['activationStatus'] });
    },
  };
};