import {useQuery} from '@tanstack/react-query';
import {api} from '../api/client';
import {mockPatients} from '../api/mock';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export function usePatients() {
  return useQuery({
    queryKey: ['patients'],
    queryFn: USE_MOCK ? () => mockPatients : api.patients.list,
  });
}

export function usePatient(id: string) {
  return useQuery({
    queryKey: ['patients', id],
    queryFn: USE_MOCK
      ? () => mockPatients.find(p => p.id === id) ?? mockPatients[0]
      : () => api.patients.get(id),
    enabled: !!id,
  });
}
