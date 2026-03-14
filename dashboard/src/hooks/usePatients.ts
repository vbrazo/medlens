import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {api} from '../api/client';
import {
  getMockPatients,
  getMockPatientsPaginated,
  mockCreatePatient,
  mockDeletePatient,
  mockUpdatePatient,
} from '../api/mock';
import type {UserCreatePayload, UserUpdatePayload} from '../types';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

// ── Queries ───────────────────────────────────────────────────────────────────

/** Full list of patients (e.g. for Overview page). Uses first page in API mode. */
export function usePatients() {
  return useQuery({
    queryKey: ['patients', 'list'],
    queryFn: USE_MOCK
      ? () => Promise.resolve(getMockPatients())
      : () => api.patients.paginated(1, 500).then(res => res.items),
    placeholderData: prev => prev,
  });
}

/** Paginated list of patients — primary hook for the Patients management page. */
export function usePatientsPaginated(page: number, pageSize: number) {
  return useQuery({
    queryKey: ['patients', 'paginated', page, pageSize],
    queryFn: USE_MOCK
      ? () => getMockPatientsPaginated(page, pageSize)
      : () => api.patients.paginated(page, pageSize),
    placeholderData: prev => prev, // keep old data while fetching new page
  });
}

/** Single patient summary (used by PatientDetailPage). */
export function usePatient(id: string) {
  return useQuery({
    queryKey: ['patients', id],
    queryFn: USE_MOCK
      ? () => getMockPatients().find(p => p.id === id) ?? getMockPatients()[0]
      : () => api.patients.get(id),
    enabled: !!id,
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────────

/** Admin: create a new patient or admin user. */
export function useCreatePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: USE_MOCK
      ? (payload: UserCreatePayload) =>
          new Promise(resolve => setTimeout(() => resolve(mockCreatePatient(payload)), 300))
      : (payload: UserCreatePayload) => api.patients.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({queryKey: ['patients']});
    },
  });
}

/** Admin: update a user's email, role, or password. */
export function useUpdatePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: USE_MOCK
      ? ({id, payload}: {id: string; payload: UserUpdatePayload}) =>
          new Promise(resolve => setTimeout(() => resolve(mockUpdatePatient(id, payload)), 300))
      : ({id, payload}: {id: string; payload: UserUpdatePayload}) =>
          api.patients.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({queryKey: ['patients']});
    },
  });
}

/** Admin: delete a user. */
export function useDeletePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: USE_MOCK
      ? (id: string) =>
          new Promise<void>(resolve =>
            setTimeout(() => {
              mockDeletePatient(id);
              resolve();
            }, 300),
          )
      : (id: string) => api.patients.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({queryKey: ['patients']});
    },
  });
}
