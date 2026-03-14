from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    role: str = "patient"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: str
    email: str
    role: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ── Admin patient management ──────────────────────────────────────────────────

class UserCreate(BaseModel):
    """Admin-only: create a new user with explicit role."""
    email: EmailStr
    password: str = Field(..., min_length=8)
    role: Literal["patient", "admin"] = "patient"


class UserUpdate(BaseModel):
    """Admin-only: partial update — all fields are optional."""
    email: EmailStr | None = None
    password: str | None = Field(default=None, min_length=8)
    role: Literal["patient", "admin"] | None = None
