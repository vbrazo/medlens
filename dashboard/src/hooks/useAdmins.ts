import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {api} from '../api/client';
import {
  getMockAdmins,
  getMockAdminsPaginated,
  mockCreateAdmin,
  mockDeleteAdmin,
  mockUpdateAdmin,
} from '../api/mock';
import type {UserCreatePayload, UserUpdatePayload} from '../types';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

// ── Queries ───────────────────────────────────────────────────────────────────

/** Full list of admins (e.g. for Overview page). Uses first page in API mode. */
export function useAdmins() {
  return useQuery({
    queryKey: ['admins', 'list'],
    queryFn: USE_MOCK
      ? () => Promise.resolve(getMockAdmins())
      : () => api.admins.paginated(1, 500).then(res => res.items),
    placeholderData: prev => prev,
  });
}

/** Paginated list of admins — primary hook for the Admins management page. */
export function useAdminsPaginated(page: number, pageSize: number) {
  return useQuery({
    queryKey: ['admins', 'paginated', page, pageSize],
    queryFn: USE_MOCK
      ? () => getMockAdminsPaginated(page, pageSize)
      : () => api.admins.paginated(page, pageSize),
    placeholderData: prev => prev,
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────────

/** Admin: create a new admin user. */
export function useCreateAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: USE_MOCK
      ? (payload: UserCreatePayload) =>
          new Promise(resolve => setTimeout(() => resolve(mockCreateAdmin(payload)), 300))
      : (payload: UserCreatePayload) => api.admins.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({queryKey: ['admins']});
    },
  });
}

/** Admin: update another admin's email, role, or password. */
export function useUpdateAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: USE_MOCK
      ? ({id, payload}: {id: string; payload: UserUpdatePayload}) =>
          new Promise(resolve => setTimeout(() => resolve(mockUpdateAdmin(id, payload)), 300))
      : ({id, payload}: {id: string; payload: UserUpdatePayload}) =>
          api.admins.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({queryKey: ['admins']});
    },
  });
}

/** Admin: delete an admin user. */
export function useDeleteAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: USE_MOCK
      ? (id: string) =>
          new Promise<void>(resolve =>
            setTimeout(() => {
              mockDeleteAdmin(id);
              resolve();
            }, 300),
          )
      : (id: string) => api.admins.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({queryKey: ['admins']});
    },
  });
}
