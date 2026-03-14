from datetime import datetime

import strawberry


@strawberry.type
class PatientType:
    id: str
    email: str
    role: str
    created_at: datetime
    total_scans: int
    adherence_rate: float
    missed_doses: int
    last_scan: str | None


@strawberry.type
class LogType:
    id: str
    user_id: str
    medication_name: str
    confidence: float
    verified: bool
    timestamp: datetime
    image_url: str | None


@strawberry.type
class AdherenceType:
    weekly_adherence: float
    missed_doses: int
    total_scans: int
    verified_scans: int


@strawberry.type
class DailyPointType:
    date: str
    adherence: float
    scans: int
    missed: int


@strawberry.type
class OverviewType:
    total_patients: int
    total_scans: int
    avg_adherence: float
    total_missed: int
