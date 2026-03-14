/**
 * Mock data for local development — used when VITE_USE_MOCK=true.
 * Replace with real API calls once the backend is running.
 */
import type {
  PatientSummary,
  MedicationLog,
  AdherenceMetrics,
  OverviewStats,
  DailyPoint,
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

export const mockPatients: PatientSummary[] = Array.from({length: 12}, (_, i) => ({
  id: `patient-${i + 1}`,
  email: `patient${i + 1}@clinic.example`,
  role: 'patient' as const,
  created_at: new Date(Date.now() - i * 86_400_000 * 10).toISOString(),
  total_scans: Math.floor(Math.random() * 80 + 10),
  adherence_rate: +(Math.random() * 0.5 + 0.5).toFixed(2),
  missed_doses: Math.floor(Math.random() * 10),
  last_scan: new Date(Date.now() - Math.random() * 86_400_000 * 3).toISOString(),
}));

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
