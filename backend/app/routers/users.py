from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, require_admin
from app.database import get_db
from app.models.medication_log import MedicationLog
from app.models.user import User
from app.schemas.analytics import PatientSummaryResponse
from app.schemas.auth import UserResponse

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.get("", response_model=list[PatientSummaryResponse])
async def list_patients(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    since = datetime.utcnow() - timedelta(days=7)

    result = await db.execute(select(User).where(User.role == "patient"))
    patients = result.scalars().all()

    summaries = []
    for p in patients:
        total = (
            await db.scalar(
                select(func.count(MedicationLog.id)).where(MedicationLog.user_id == p.id)
            )
        ) or 0
        week_total = (
            await db.scalar(
                select(func.count(MedicationLog.id)).where(
                    and_(MedicationLog.user_id == p.id, MedicationLog.timestamp >= since)
                )
            )
        ) or 0
        verified = (
            await db.scalar(
                select(func.count(MedicationLog.id)).where(
                    and_(
                        MedicationLog.user_id == p.id,
                        MedicationLog.timestamp >= since,
                        MedicationLog.verified.is_(True),
                    )
                )
            )
        ) or 0
        last = await db.scalar(
            select(func.max(MedicationLog.timestamp)).where(MedicationLog.user_id == p.id)
        )
        summaries.append(
            PatientSummaryResponse(
                id=p.id,
                email=p.email,
                role=p.role,
                total_scans=total,
                adherence_rate=round(verified / week_total, 2) if week_total else 0.0,
                missed_doses=week_total - verified,
                last_scan=last.isoformat() if last else None,
            )
        )
    return summaries


@router.get("/{user_id}", response_model=PatientSummaryResponse)
async def get_patient(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    """Reuse the list logic for a single patient — convenience endpoint."""
    patients = await list_patients(db=db, _=_)
    match = next((p for p in patients if p.id == user_id), None)
    if not match:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Patient not found")
    return match
