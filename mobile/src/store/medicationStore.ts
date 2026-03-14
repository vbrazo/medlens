import {create} from 'zustand';

export interface ScanRecord {
  medication: string;
  confidence: number;
  verified: boolean;
  timestamp: number;
}

interface MedicationState {
  scans: ScanRecord[];
  addScan: (result: Omit<ScanRecord, 'timestamp'>) => void;
  clearScans: () => void;
  adherenceRate: () => number;
}

export const useMedicationStore = create<MedicationState>((set, get) => ({
  scans: [],

  addScan: result =>
    set(state => ({
      scans: [{...result, timestamp: Date.now()}, ...state.scans],
    })),

  clearScans: () => set({scans: []}),

  adherenceRate: () => {
    const {scans} = get();
    if (!scans.length) {
      return 0;
    }
    return scans.filter(s => s.verified).length / scans.length;
  },
}));
