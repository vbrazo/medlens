from datetime import datetime

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, require_admin
from app.core.s3 import upload_image
from app.database import get_db
from app.models.medication_log import MedicationLog
from app.models.user import User
from app.schemas.log import LogCreate, LogResponse

router = APIRouter(prefix="/logs", tags=["logs"])


@router.post("", response_model=LogResponse, status_code=201)
async def create_log(
    body: LogCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    log = MedicationLog(
        user_id=current_user.id,
        medication_name=body.medication_name,
        confidence=body.confidence,
        verified=body.verified,
        timestamp=body.timestamp or datetime.utcnow(),
        image_url=body.image_url,
    )
    db.add(log)
    await db.commit()
    await db.refresh(log)
    return log


@router.post("/{log_id}/image", response_model=LogResponse)
async def attach_image(
    log_id: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload a scan image to S3 and attach the URL to the log."""
    result = await db.execute(select(MedicationLog).where(MedicationLog.id == log_id))
    log = result.scalar_one_or_none()
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    if log.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")

    url = upload_image(file.file, content_type=file.content_type or "image/jpeg")
    log.image_url = url
    await db.commit()
    await db.refresh(log)
    return log


@router.get("", response_model=list[LogResponse])
async def list_logs(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    result = await db.execute(
        select(MedicationLog).order_by(MedicationLog.timestamp.desc()).limit(500)
    )
    return result.scalars().all()


@router.get("/{user_id}", response_model=list[LogResponse])
async def patient_logs(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "admin" and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    result = await db.execute(
        select(MedicationLog)
        .where(MedicationLog.user_id == user_id)
        .order_by(MedicationLog.timestamp.desc())
    )
    return result.scalars().all()
