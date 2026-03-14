"""
Shared test fixtures for the MedLens backend.

Database strategy: SQLite in-memory via aiosqlite.
All models use standard SQL types, so SQLite is a valid test target.
Each test module that requests `async_client` gets a fresh, empty DB.
"""
import uuid
from collections.abc import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.security import create_access_token, hash_password
from app.database import Base, get_db
from app.main import app
from app.models.medication_log import MedicationLog
from app.models.user import User

# ── In-memory SQLite (async) ──────────────────────────────────────────────────
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
)
TestSessionLocal = async_sessionmaker(test_engine, expire_on_commit=False)


# ── Override get_db ───────────────────────────────────────────────────────────
async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
    async with TestSessionLocal() as session:
        yield session


app.dependency_overrides[get_db] = override_get_db


# ── Schema lifecycle ──────────────────────────────────────────────────────────
@pytest_asyncio.fixture(scope="session", autouse=True)
async def create_tables():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


# ── HTTP client ───────────────────────────────────────────────────────────────
@pytest_asyncio.fixture
async def async_client() -> AsyncGenerator[AsyncClient, None]:
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        yield client


# ── Seed helpers ──────────────────────────────────────────────────────────────
async def _create_user(role: str) -> tuple[User, str]:
    """Create a user in the test DB and return (user, jwt_token)."""
    async with TestSessionLocal() as session:
        user = User(
            id=str(uuid.uuid4()),
            email=f"{role}-{uuid.uuid4().hex[:6]}@test.com",
            password_hash=hash_password("password123"),
            role=role,
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
    return user, create_access_token(user.id)


@pytest_asyncio.fixture
async def admin_user() -> tuple[User, str]:
    return await _create_user("admin")


@pytest_asyncio.fixture
async def patient_user() -> tuple[User, str]:
    return await _create_user("patient")


@pytest_asyncio.fixture
async def sample_log(patient_user: tuple[User, str]) -> MedicationLog:
    """Seed one verified MedicationLog for the patient fixture user."""
    user, _ = patient_user
    async with TestSessionLocal() as session:
        log = MedicationLog(
            id=str(uuid.uuid4()),
            user_id=user.id,
            medication_name="Ibuprofen",
            confidence=0.93,
            verified=True,
        )
        session.add(log)
        await session.commit()
        await session.refresh(log)
    return log
