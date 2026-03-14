from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class LogCreate(BaseModel):
    medication_name: str
    confidence: float = Field(ge=0.0, le=1.0)
    verified: bool
    timestamp: datetime | None = None
    image_url: str | None = None


class LogResponse(BaseModel):
    id: str
    user_id: str
    medication_name: str
    confidence: float
    verified: bool
    timestamp: datetime
    image_url: str | None

    model_config = ConfigDict(from_attributes=True)
