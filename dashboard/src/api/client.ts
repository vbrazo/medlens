import type {
  PatientSummary,
  MedicationLog,
  AdherenceMetrics,
  OverviewStats,
  DailyPoint,
  PaginatedResponse,
  UserCreatePayload,
  UserUpdatePayload,
} from '../types';

const BASE = import.meta.env.VITE_API_URL ?? '/api';

const TOKEN_KEY = 'medlens_token';

function token() {
  return localStorage.getItem(TOKEN_KEY);
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const t = token();
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(t ? {Authorization: `Bearer ${t}`} : {}),
      ...init?.headers,
    },
  });

  // Session expired or token revoked — clear storage and redirect to login
  if (res.status === 401) {
    localStorage.removeItem(TOKEN_KEY);
    window.location.replace('/login');
  }

  // 204 No Content — return undefined without trying to parse JSON
  if (res.status === 204) return undefined as T;

  if (!res.ok) {
    throw new Error(`${res.status} ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

export type RegisterResponse = {
  id: string;
  email: string;
  role: string;
  created_at: string;
};

export type UserResponse = RegisterResponse;

export const api = {
  auth: {
    login: (email: string, password: string) =>
      req<{access_token: string}>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({email, password}),
      }),
    register: (email: string, password: string, role: string = 'patient') =>
      req<RegisterResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({email, password, role}),
      }),
  },

  users: {
    /** Fetch the currently authenticated user's profile. */
    me: () => req<UserResponse>('/users/me'),
  },

  patients: {
    /** Paginated list of patients — role=patient filter applied. */
    paginated: (page: number, pageSize: number) =>
      req<PaginatedResponse<PatientSummary>>(
        `/users?role=patient&page=${page}&page_size=${pageSize}`,
      ),
    /** Single patient summary. */
    get: (id: string) => req<PatientSummary>(`/users/${id}`),
    /** Admin: create a new user. */
    create: (payload: UserCreatePayload) =>
      req<UserResponse>('/users', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    /** Admin: update email / role / password. */
    update: (id: string, payload: UserUpdatePayload) =>
      req<UserResponse>(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
    /** Admin: delete a patient. Returns void (204). */
    delete: (id: string) => req<void>(`/users/${id}`, {method: 'DELETE'}),
  },

  admins: {
    /** Paginated list of admin users — role=admin filter applied. */
    paginated: (page: number, pageSize: number) =>
      req<PaginatedResponse<PatientSummary>>(
        `/users?role=admin&page=${page}&page_size=${pageSize}`,
      ),
    /** Admin: create a new admin user. */
    create: (payload: UserCreatePayload) =>
      req<UserResponse>('/users', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    /** Admin: update another admin's email / role / password. */
    update: (id: string, payload: UserUpdatePayload) =>
      req<UserResponse>(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
    /** Admin: delete an admin user. Returns void (204). */
    delete: (id: string) => req<void>(`/users/${id}`, {method: 'DELETE'}),
  },

  logs: {
    list: () => req<MedicationLog[]>('/logs'),
    forPatient: (userId: string) => req<MedicationLog[]>(`/logs/${userId}`),
  },

  analytics: {
    overview: () => req<OverviewStats>('/analytics/overview'),
    adherence: () => req<AdherenceMetrics>('/analytics/adherence'),
    weekly: () => req<DailyPoint[]>('/analytics/weekly'),
    forPatient: (id: string) => req<AdherenceMetrics>(`/analytics/patient/${id}`),
    weeklyForPatient: (id: string) => req<DailyPoint[]>(`/analytics/patient/${id}/weekly`),
  },
};
