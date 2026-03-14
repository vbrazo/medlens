import uuid
from datetime import datetime

from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False, default="patient")
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow
    )

    logs: Mapped[list["MedicationLog"]] = relationship(  # noqa: F821
        "MedicationLog", back_populates="user", lazy="select"
    )
    prescriptions: Mapped[list["Prescription"]] = relationship(  # noqa: F821
        "Prescription", back_populates="user", lazy="select"
    )
