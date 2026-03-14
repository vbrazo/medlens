from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, require_admin
from app.database import get_db
from app.models.medication_log import MedicationLog
from app.models.user import User
from app.schemas.analytics import AdherenceResponse, DailyPoint, OverviewResponse

router = APIRouter(prefix="/analytics", tags=["analytics"])

DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]


def _week_start() -> datetime:
    now = datetime.utcnow()
    return now - timedelta(days=now.weekday(), hours=now.hour, minutes=now.minute, seconds=now.second)


async def _adherence_for(db: AsyncSession, user_id: str | None) -> AdherenceResponse:
    since = _week_start()
    where = MedicationLog.timestamp >= since
    if user_id:
        where = and_(where, MedicationLog.user_id == user_id)

    total = (await db.scalar(select(func.count(MedicationLog.id)).where(where))) or 0
    verified = (
        await db.scalar(
            select(func.count(MedicationLog.id)).where(
                and_(where, MedicationLog.verified.is_(True))
            )
        )
    ) or 0
    return AdherenceResponse(
        weekly_adherence=round(verified / total, 2) if total else 0.0,
        missed_doses=total - verified,
        total_scans=total,
        verified_scans=verified,
    )


async def _weekly_points(db: AsyncSession, user_id: str | None) -> list[DailyPoint]:
    points = []
    start = _week_start()
    for i in range(7):
        day_start = start + timedelta(days=i)
        day_end = day_start + timedelta(days=1)
        where = and_(
            MedicationLog.timestamp >= day_start,
            MedicationLog.timestamp < day_end,
        )
        if user_id:
            where = and_(where, MedicationLog.user_id == user_id)

        total = (await db.scalar(select(func.count(MedicationLog.id)).where(where))) or 0
        verified = (
            await db.scalar(
                select(func.count(MedicationLog.id)).where(
                    and_(where, MedicationLog.verified.is_(True))
                )
            )
        ) or 0
        points.append(
            DailyPoint(
                date=DAY_NAMES[i],
                adherence=round(verified / total, 2) if total else 0.0,
                scans=total,
                missed=total - verified,
            )
        )
    return points


@router.get("/overview", response_model=OverviewResponse)
async def overview(db: AsyncSession = Depends(get_db), _: User = Depends(require_admin)):
    since = _week_start()

    total_patients = (
        await db.scalar(select(func.count(User.id)).where(User.role == "patient"))
    ) or 0
    total_scans = (await db.scalar(select(func.count(MedicationLog.id)))) or 0

    week_total = (
        await db.scalar(
            select(func.count(MedicationLog.id)).where(MedicationLog.timestamp >= since)
        )
    ) or 0
    week_verified = (
        await db.scalar(
            select(func.count(MedicationLog.id)).where(
                and_(
                    MedicationLog.timestamp >= since,
                    MedicationLog.verified.is_(True),
                )
            )
        )
    ) or 0

    return OverviewResponse(
        total_patients=total_patients,
        total_scans=total_scans,
        avg_adherence=round(week_verified / week_total, 2) if week_total else 0.0,
        total_missed=week_total - week_verified,
    )


@router.get("/adherence", response_model=AdherenceResponse)
async def adherence(db: AsyncSession = Depends(get_db), _: User = Depends(require_admin)):
    return await _adherence_for(db, user_id=None)


@router.get("/weekly", response_model=list[DailyPoint])
async def weekly_trend(db: AsyncSession = Depends(get_db), _: User = Depends(require_admin)):
    return await _weekly_points(db, user_id=None)


@router.get("/patient/{user_id}", response_model=AdherenceResponse)
async def patient_adherence(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "admin" and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    return await _adherence_for(db, user_id=user_id)


@router.get("/patient/{user_id}/weekly", response_model=list[DailyPoint])
async def patient_weekly(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "admin" and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    return await _weekly_points(db, user_id=user_id)
