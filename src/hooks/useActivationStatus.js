// hooks/useActivationStatus.js
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

// Fetch system ID
const fetchSystemId = async () => {
  const res = await axios.get('/api/system-id');
  if (!res.data.systemId) {
    throw new Error('System ID not found');
  }
  return res.data.systemId;
};

// Check activation status for a given systemId
const checkActivationStatus = async (systemId) => {
  const res = await axios.get(`/api/check-activation-status/${encodeURIComponent(systemId)}`);
  return res.data; // expect: { isActivated, activationKey, activatedAt, status }
};

// Main hook
export const useActivationStatus = () => {
  // Step 1 → Get systemId
  const systemIdQuery = useQuery({
    queryKey: ['systemId'],
    queryFn: fetchSystemId,
    staleTime: Infinity,
    retry: 2,
  });

  // Step 2 → Check activation when systemId is ready
  const activationQuery = useQuery({
    queryKey: ['activationStatus', systemIdQuery.data],
    queryFn: () => checkActivationStatus(systemIdQuery.data),
    enabled: !!systemIdQuery.data,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });

  return {
    isLoading: systemIdQuery.isLoading || activationQuery.isLoading,
    isError: systemIdQuery.isError || activationQuery.isError,
    error: systemIdQuery.error || activationQuery.error,
    systemId: systemIdQuery.data,
    ...(activationQuery.data || {}),
    // Provide a safe fallback function
    refetchActivation: activationQuery.refetch || (() => Promise.resolve()),
  };
};