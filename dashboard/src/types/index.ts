export interface Patient {
  id: string;
  email: string;
  role: 'patient' | 'admin';
  created_at: string;
}

export interface PatientSummary extends Patient {
  total_scans: number;
  adherence_rate: number;
  missed_doses: number;
  last_scan: string | null;
}

export interface MedicationLog {
  id: string;
  user_id: string;
  medication_name: string;
  confidence: number;
  verified: boolean;
  timestamp: string;
  image_url?: string;
}

export interface AdherenceMetrics {
  weekly_adherence: number;
  missed_doses: number;
  total_scans: number;
  verified_scans: number;
}

export interface DailyPoint {
  date: string;     // "Mon", "Tue", etc.
  adherence: number; // 0–1
  scans: number;
  missed: number;
}

export interface OverviewStats {
  total_patients: number;
  total_scans: number;
  avg_adherence: number;
  total_missed: number;
}
