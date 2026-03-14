/**
 * Mock data for local development — used when VITE_USE_MOCK=true.
 * Replace with real API calls once the backend is running.
 * CRUD mutations operate against an in-memory store so changes
 * are reflected on the next query invalidation within the same session.
 */
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

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const mockWeekly: DailyPoint[] = DAYS.map(date => ({
  date,
  adherence: +(Math.random() * 0.4 + 0.6).toFixed(2),
  scans: Math.floor(Math.random() * 8 + 2),
  missed: Math.floor(Math.random() * 3),
}));

export const mockOverview: OverviewStats = {
  total_patients: 24,
  total_scans: 1_340,
  avg_adherence: 0.84,
  total_missed: 87,
};

export const mockAdherence: AdherenceMetrics = {
  weekly_adherence: 0.86,
  missed_doses: 2,
  total_scans: 42,
  verified_scans: 39,
};

const MEDICATIONS = ['Ibuprofen', 'Metformin', 'Lisinopril', 'Atorvastatin', 'Amlodipine'];

// ── In-memory patient store (supports CRUD in mock mode) ─────────────────────

const MOCK_PATIENTS_KEY = 'medlens_mock_patients';

function defaultPatientStore(): PatientSummary[] {
  return Array.from({length: 24}, (_, i) => ({
    id: `patient-${i + 1}`,
    email: `patient${i + 1}@clinic.example`,
    role: 'patient' as const,
    created_at: new Date(Date.now() - i * 86_400_000 * 10).toISOString(),
    total_scans: Math.floor(Math.random() * 80 + 10),
    adherence_rate: +(Math.random() * 0.5 + 0.5).toFixed(2),
    missed_doses: Math.floor(Math.random() * 10),
    last_scan: new Date(Date.now() - Math.random() * 86_400_000 * 3).toISOString(),
  }));
}

function loadPatientStore(): PatientSummary[] {
  if (typeof localStorage === 'undefined') return defaultPatientStore();
  try {
    const raw = localStorage.getItem(MOCK_PATIENTS_KEY);
    if (!raw) return defaultPatientStore();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || parsed.length === 0) return defaultPatientStore();
    const ok = parsed.every(
      (p: unknown) =>
        p != null &&
        typeof p === 'object' &&
        'id' in p &&
        'email' in p &&
        'role' in p &&
        'created_at' in p,
    );
    return ok ? (parsed as PatientSummary[]) : defaultPatientStore();
  } catch {
    return defaultPatientStore();
  }
}

function savePatientStore(store: PatientSummary[]): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(MOCK_PATIENTS_KEY, JSON.stringify(store));
  } catch {
    // ignore quota or other errors
  }
}

let _patientStore: PatientSummary[] = loadPatientStore();

/** Retrieve all mock patients (sorted newest-first). */
export function getMockPatients(): PatientSummary[] {
  return [..._patientStore].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

/** Paginated slice of the mock store. */
export function getMockPatientsPaginated(
  page: number,
  pageSize: number,
): PaginatedResponse<PatientSummary> {
  const sorted = getMockPatients();
  const total = sorted.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  return {
    items: sorted.slice(start, start + pageSize),
    total,
    page,
    page_size: pageSize,
    pages,
  };
}

/** Mock create — adds to the in-memory store. */
export function mockCreatePatient(payload: UserCreatePayload): PatientSummary {
  const newPatient: PatientSummary = {
    id: `mock-${Date.now()}`,
    email: payload.email,
    role: payload.role,
    created_at: new Date().toISOString(),
    total_scans: 0,
    adherence_rate: 0,
    missed_doses: 0,
    last_scan: null,
  };
  _patientStore = [newPatient, ..._patientStore];
  savePatientStore(_patientStore);
  return newPatient;
}

/** Mock update — patches matched patient. */
export function mockUpdatePatient(id: string, payload: UserUpdatePayload): PatientSummary {
  _patientStore = _patientStore.map(p =>
    p.id === id
      ? {
          ...p,
          ...(payload.email ? {email: payload.email} : {}),
          ...(payload.role ? {role: payload.role} : {}),
        }
      : p,
  );
  savePatientStore(_patientStore);
  return _patientStore.find(p => p.id === id)!;
}

/** Mock delete — removes matched patient. */
export function mockDeletePatient(id: string): void {
  _patientStore = _patientStore.filter(p => p.id !== id);
  savePatientStore(_patientStore);
}

// Keep backward-compat export used by OverviewPage
export const mockPatients = getMockPatients();

// ── In-memory admin store (supports CRUD in mock mode) ───────────────────────

const MOCK_ADMINS_KEY = 'medlens_mock_admins';

function defaultAdminStore(): PatientSummary[] {
  return Array.from({length: 3}, (_, i) => ({
    id: `admin-${i + 1}`,
    email: `admin${i + 1}@clinic.example`,
    role: 'admin' as const,
    created_at: new Date(Date.now() - i * 86_400_000 * 30).toISOString(),
    total_scans: 0,
    adherence_rate: 0,
    missed_doses: 0,
    last_scan: null,
  }));
}

function loadAdminStore(): PatientSummary[] {
  if (typeof localStorage === 'undefined') return defaultAdminStore();
  try {
    const raw = localStorage.getItem(MOCK_ADMINS_KEY);
    if (!raw) return defaultAdminStore();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || parsed.length === 0) return defaultAdminStore();
    const ok = parsed.every(
      (p: unknown) =>
        p != null &&
        typeof p === 'object' &&
        'id' in p &&
        'email' in p &&
        'role' in p &&
        'created_at' in p,
    );
    return ok ? (parsed as PatientSummary[]) : defaultAdminStore();
  } catch {
    return defaultAdminStore();
  }
}

function saveAdminStore(store: PatientSummary[]): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(MOCK_ADMINS_KEY, JSON.stringify(store));
  } catch {
    // ignore quota or other errors
  }
}

let _adminStore: PatientSummary[] = loadAdminStore();

/** Retrieve all mock admins (sorted newest-first). */
export function getMockAdmins(): PatientSummary[] {
  return [..._adminStore].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

/** Paginated slice of the admin mock store. */
export function getMockAdminsPaginated(
  page: number,
  pageSize: number,
): PaginatedResponse<PatientSummary> {
  const sorted = getMockAdmins();
  const total = sorted.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  return {
    items: sorted.slice(start, start + pageSize),
    total,
    page,
    page_size: pageSize,
    pages,
  };
}

/** Mock create admin — adds to the in-memory admin store. */
export function mockCreateAdmin(payload: UserCreatePayload): PatientSummary {
  const newAdmin: PatientSummary = {
    id: `mock-admin-${Date.now()}`,
    email: payload.email,
    role: 'admin',
    created_at: new Date().toISOString(),
    total_scans: 0,
    adherence_rate: 0,
    missed_doses: 0,
    last_scan: null,
  };
  _adminStore = [newAdmin, ..._adminStore];
  saveAdminStore(_adminStore);
  return newAdmin;
}

/** Mock update admin — patches matched admin. */
export function mockUpdateAdmin(id: string, payload: UserUpdatePayload): PatientSummary {
  _adminStore = _adminStore.map(a =>
    a.id === id
      ? {
          ...a,
          ...(payload.email ? {email: payload.email} : {}),
          ...(payload.role ? {role: payload.role} : {}),
        }
      : a,
  );
  saveAdminStore(_adminStore);
  return _adminStore.find(a => a.id === id)!;
}

/** Mock delete admin — removes matched admin. */
export function mockDeleteAdmin(id: string): void {
  _adminStore = _adminStore.filter(a => a.id !== id);
  saveAdminStore(_adminStore);
}

export function mockLogsForPatient(userId: string): MedicationLog[] {
  return Array.from({length: 20}, (_, i) => ({
    id: `log-${userId}-${i}`,
    user_id: userId,
    medication_name: MEDICATIONS[i % MEDICATIONS.length],
    confidence: +(Math.random() * 0.3 + 0.7).toFixed(2),
    verified: Math.random() > 0.15,
    timestamp: new Date(Date.now() - i * 3_600_000 * 8).toISOString(),
  }));
}
