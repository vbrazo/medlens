#!/usr/bin/env python3
"""
Seed the database with default users for local development.
Run from backend directory: python scripts/seed.py
Requires: migrations applied (alembic upgrade head), DATABASE_URL in .env
Idempotent: skips users that already exist (by email).
"""
import asyncio
import sys
from pathlib import Path

# Ensure backend root is on path when running scripts/seed.py
_backend_root = Path(__file__).resolve().parent.parent
if str(_backend_root) not in sys.path:
    sys.path.insert(0, str(_backend_root))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.database import AsyncSessionLocal
from app.models.user import User

SEED_USERS = [
    {"email": "admin@medlens.io", "password": "admin123", "role": "admin"},
    {"email": "patient@medlens.io", "password": "patient123", "role": "patient"},
]


async def seed_users(session: AsyncSession) -> tuple[int, int]:
    created = 0
    skipped = 0
    for data in SEED_USERS:
        result = await session.execute(select(User).where(User.email == data["email"]))
        if result.scalar_one_or_none() is not None:
            skipped += 1
            continue
        user = User(
            email=data["email"],
            password_hash=hash_password(data["password"]),
            role=data["role"],
        )
        session.add(user)
        created += 1
    await session.commit()
    return created, skipped


async def main() -> None:
    async with AsyncSessionLocal() as session:
        created, skipped = await seed_users(session)
    print(f"Seed complete: {created} user(s) created, {skipped} already existed.")
    for u in SEED_USERS:
        print(f"  - {u['email']} / {u['password']} (role={u['role']})")


if __name__ == "__main__":
    asyncio.run(main())
