import {useQuery} from '@tanstack/react-query';
import {api} from '../api/client';
import {mockLogsForPatient, mockAdherence, mockWeekly} from '../api/mock';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export function usePatientLogs(userId: string) {
  return useQuery({
    queryKey: ['logs', userId],
    queryFn: USE_MOCK
      ? () => mockLogsForPatient(userId)
      : () => api.logs.forPatient(userId),
    enabled: !!userId,
  });
}

export function usePatientAdherence(userId: string) {
  return useQuery({
    queryKey: ['adherence', userId],
    queryFn: USE_MOCK
      ? () => mockAdherence
      : () => api.analytics.forPatient(userId),
    enabled: !!userId,
  });
}

export function usePatientWeekly(userId: string) {
  return useQuery({
    queryKey: ['weekly', userId],
    queryFn: USE_MOCK
      ? () => mockWeekly
      : () => api.analytics.weeklyForPatient(userId),
    enabled: !!userId,
  });
}
