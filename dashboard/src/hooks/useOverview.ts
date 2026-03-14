import {useQuery} from '@tanstack/react-query';
import {api} from '../api/client';
import {mockOverview, mockWeekly} from '../api/mock';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export function useOverviewStats() {
  return useQuery({
    queryKey: ['overview'],
    queryFn: USE_MOCK ? () => mockOverview : api.analytics.overview,
  });
}

export function useWeeklyTrend() {
  return useQuery({
    queryKey: ['weekly'],
    queryFn: USE_MOCK ? () => mockWeekly : api.analytics.weekly,
  });
}
