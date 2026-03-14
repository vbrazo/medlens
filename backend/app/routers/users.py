import math
from datetime import datetime, timedelta
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, require_admin
from app.core.security import hash_password
from app.database import get_db
from app.models.medication_log import MedicationLog
from app.models.user import User
from app.schemas.analytics import PaginatedPatients, PatientSummaryResponse
from app.schemas.auth import UserCreate, UserResponse, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])


# ── Internal helper ───────────────────────────────────────────────────────────

async def _user_summary(db: AsyncSession, user: User) -> PatientSummaryResponse:
    """Compute per-user adherence stats for the trailing 7-day window."""
    since = datetime.utcnow() - timedelta(days=7)

    total = (
        await db.scalar(
            select(func.count(MedicationLog.id)).where(MedicationLog.user_id == user.id)
        )
    ) or 0

    week_total = (
        await db.scalar(
            select(func.count(MedicationLog.id)).where(
                and_(MedicationLog.user_id == user.id, MedicationLog.timestamp >= since)
            )
        )
    ) or 0

    verified = (
        await db.scalar(
            select(func.count(MedicationLog.id)).where(
                and_(
                    MedicationLog.user_id == user.id,
                    MedicationLog.timestamp >= since,
                    MedicationLog.verified.is_(True),
                )
            )
        )
    ) or 0

    last = await db.scalar(
        select(func.max(MedicationLog.timestamp)).where(MedicationLog.user_id == user.id)
    )

    return PatientSummaryResponse(
        id=user.id,
        email=user.email,
        role=user.role,
        total_scans=total,
        adherence_rate=round(verified / week_total, 2) if week_total else 0.0,
        missed_doses=week_total - verified,
        last_scan=last.isoformat() if last else None,
    )


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.get("", response_model=PaginatedPatients)
async def list_users(
    page: int = Query(1, ge=1, description="Page number (1-based)"),
    page_size: int = Query(20, ge=1, le=100, description="Results per page (max 100)"),
    role: Literal["patient", "admin"] = Query("patient", description="Filter by role"),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    """List users filtered by role. Defaults to 'patient' for backward compatibility."""
    offset = (page - 1) * page_size

    total = (
        await db.scalar(select(func.count(User.id)).where(User.role == role))
    ) or 0

    result = await db.execute(
        select(User)
        .where(User.role == role)
        .order_by(User.created_at.desc())
        .offset(offset)
        .limit(page_size)
    )
    users = result.scalars().all()
    items = [await _user_summary(db, u) for u in users]

    return PaginatedPatients(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        pages=max(1, math.ceil(total / page_size)),
    )


@router.get("/{user_id}", response_model=PatientSummaryResponse)
async def get_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return await _user_summary(db, user)


@router.post("", response_model=UserResponse, status_code=201)
async def create_user(
    body: UserCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Email already registered")

    user = User(
        email=body.email,
        password_hash=hash_password(body.password),
        role=body.role,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    body: UserUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Email uniqueness check — skip if unchanged
    if body.email is not None and body.email != user.email:
        conflict = await db.execute(select(User).where(User.email == body.email))
        if conflict.scalar_one_or_none():
            raise HTTPException(status_code=409, detail="Email already registered")
        user.email = body.email

    if body.role is not None:
        user.role = body.role

    if body.password is not None:
        user.password_hash = hash_password(body.password)

    await db.commit()
    await db.refresh(user)
    return user


@router.delete("/{user_id}", status_code=204)
async def delete_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    await db.delete(user)
    await db.commit()
