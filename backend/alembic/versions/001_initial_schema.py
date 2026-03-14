"""Initial schema — users, medication_logs, prescriptions

Revision ID: 001
Revises:
Create Date: 2026-03-14
"""
from alembic import op
import sqlalchemy as sa

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("role", sa.String(20), nullable=False, server_default="patient"),
        sa.Column("created_at", sa.DateTime, nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("email", name="uq_users_email"),
    )

    op.create_table(
        "medication_logs",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("medication_name", sa.String(255), nullable=False),
        sa.Column("confidence", sa.Float, nullable=False),
        sa.Column("verified", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("timestamp", sa.DateTime, nullable=False, server_default=sa.func.now()),
        sa.Column("image_url", sa.String(1024), nullable=True),
    )
    op.create_index("ix_medication_logs_user_id", "medication_logs", ["user_id"])
    op.create_index("ix_medication_logs_timestamp", "medication_logs", ["timestamp"])

    op.create_table(
        "prescriptions",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("medication_name", sa.String(255), nullable=False),
        sa.Column("dosage", sa.String(100), nullable=False),
        sa.Column("frequency", sa.String(100), nullable=False),
    )
    op.create_index("ix_prescriptions_user_id", "prescriptions", ["user_id"])


def downgrade() -> None:
    op.drop_table("prescriptions")
    op.drop_table("medication_logs")
    op.drop_table("users")
