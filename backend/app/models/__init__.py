# Import all models so Alembic can discover them for autogenerate
from app.models.user import User
from app.models.medication_log import MedicationLog
from app.models.prescription import Prescription

__all__ = ["User", "MedicationLog", "Prescription"]
