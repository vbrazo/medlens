import type {
  PatientSummary,
  MedicationLog,
  AdherenceMetrics,
  OverviewStats,
  DailyPoint,
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

  if (!res.ok) {
    throw new Error(`${res.status} ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      req<{access_token: string}>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({email, password}),
      }),
  },

  patients: {
    list: () => req<PatientSummary[]>('/users'),
    get: (id: string) => req<PatientSummary>(`/users/${id}`),
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
