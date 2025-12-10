import { useQuery } from '@tanstack/react-query';

export function useCandidate(regNo) {
  return useQuery({
    queryKey: ['candidate', regNo],
    queryFn: async () => {
      if (!regNo) {
        return null;
      }

      const response = await fetch(`/api/get-candidate/${regNo}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch candidate');
      }

      return response.json();
    },
    enabled: !!regNo, // Only run query if regNo exists
    staleTime: 5 * 60 * 1000, // Data stays fresh for 5 minutes
    retry: 2
  });
}