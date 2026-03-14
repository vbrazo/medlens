"""Unit tests for analytics helper functions."""
import uuid
from datetime import datetime, timedelta

import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.medication_log import MedicationLog
from app.models.user import User
from app.routers.analytics import _adherence_for, _week_start, _weekly_points
from tests.conftest import TestSessionLocal


class TestWeekStart:
    def test_returns_monday(self):
        start = _week_start()
        # Monday == weekday 0
        assert start.weekday() == 0

    def test_time_is_midnight(self):
        start = _week_start()
        assert start.hour == 0
        assert start.minute == 0
        assert start.second == 0

    def test_is_in_the_past_or_now(self):
        start = _week_start()
        assert start <= datetime.utcnow()

    def test_within_last_seven_days(self):
        start = _week_start()
        assert datetime.utcnow() - start <= timedelta(days=7)


class TestAdherenceHelpers:
    @pytest_asyncio.fixture
    async def db(self) -> AsyncSession:
        async with TestSessionLocal() as session:
            yield session

    @pytest_asyncio.fixture
    async def seeded_user(self, db: AsyncSession) -> User:
        user = User(
            id=str(uuid.uuid4()),
            email=f"helper-{uuid.uuid4().hex[:6]}@test.com",
            password_hash="x",
            role="patient",
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        return user

    async def test_adherence_empty_db_returns_zero(self, db: AsyncSession):
        result = await _adherence_for(db, user_id=None)
        assert result.weekly_adherence == 0.0
        assert result.total_scans >= 0

    async def test_weekly_returns_seven_points(self, db: AsyncSession):
        points = await _weekly_points(db, user_id=None)
        assert len(points) == 7

    async def test_weekly_day_names(self, db: AsyncSession):
        points = await _weekly_points(db, user_id=None)
        assert points[0].date == "Mon"
        assert points[6].date == "Sun"

    async def test_verified_log_increases_adherence(
        self, db: AsyncSession, seeded_user: User
    ):
        log = MedicationLog(
            id=str(uuid.uuid4()),
            user_id=seeded_user.id,
            medication_name="Aspirin",
            confidence=0.95,
            verified=True,
            timestamp=datetime.utcnow(),
        )
        db.add(log)
        await db.commit()

        result = await _adherence_for(db, user_id=seeded_user.id)
        assert result.weekly_adherence == 1.0
        assert result.verified_scans == 1
        assert result.missed_doses == 0

    async def test_unverified_log_counts_as_missed(
        self, db: AsyncSession, seeded_user: User
    ):
        log = MedicationLog(
            id=str(uuid.uuid4()),
            user_id=seeded_user.id,
            medication_name="Aspirin",
            confidence=0.3,
            verified=False,
            timestamp=datetime.utcnow(),
        )
        db.add(log)
        await db.commit()

        result = await _adherence_for(db, user_id=seeded_user.id)
        assert result.missed_doses >= 1
