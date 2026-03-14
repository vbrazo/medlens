from pydantic import BaseModel


class AdherenceResponse(BaseModel):
    weekly_adherence: float
    missed_doses: int
    total_scans: int
    verified_scans: int


class OverviewResponse(BaseModel):
    total_patients: int
    total_scans: int
    avg_adherence: float
    total_missed: int


class DailyPoint(BaseModel):
    date: str
    adherence: float
    scans: int
    missed: int


class PatientSummaryResponse(BaseModel):
    id: str
    email: str
    role: str
    total_scans: int
    adherence_rate: float
    missed_doses: int
    last_scan: str | None  # ISO string
