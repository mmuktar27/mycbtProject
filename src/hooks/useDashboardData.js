// hooks/useDashboardData.js
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const fetchDashboardStats = async (academicYear) => {
  const res = await axios.get('/api/dashboard/stats', { params: { academicYear } });
  return res.data?.data || {};
};

const fetchRecentActivities = async () => {
  const res = await axios.get('/api/dashboard/activities/recent', { params: { limit: 5 } });
  return res.data?.data || [];
};

const fetchUpcomingEvents = async () => {
  const res = await axios.get('/api/dashboard/events/upcoming', { params: { limit: 5 } });
  return res.data?.data || [];
};

export const useDashboardData = (academicYear) => {
  const statsQuery = useQuery({
    queryKey: ['dashboard', 'stats', academicYear],
    queryFn: () => fetchDashboardStats(academicYear),
    staleTime: 2 * 60 * 1000,
  });

  const activitiesQuery = useQuery({
    queryKey: ['dashboard', 'activities'],
    queryFn: fetchRecentActivities,
    staleTime: 60 * 1000,
  });

  const eventsQuery = useQuery({
    queryKey: ['dashboard', 'events'],
    queryFn: fetchUpcomingEvents,
    staleTime: 5 * 60 * 1000,
  });

  return {
    isLoading: statsQuery.isLoading || activitiesQuery.isLoading || eventsQuery.isLoading,
    isError: statsQuery.isError || activitiesQuery.isError || eventsQuery.isError,
    stats: statsQuery.data || {},
    recentActivities: activitiesQuery.data || [],
    upcomingEvents: eventsQuery.data || [],
  };
};