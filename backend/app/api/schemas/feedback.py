from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.core.enums import FeedbackCategory


class FeedbackCreate(BaseModel):
    category: FeedbackCategory
    message: str = Field(
        min_length=1,
        max_length=5000,
    )
    screen: str | None = Field(
        default=None,
        max_length=100,
    )

    @field_validator("message")
    @classmethod
    def validate_message(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Feedback message cannot be empty.")
        return value

    @field_validator("screen")
    @classmethod
    def normalize_screen(cls, value: str | None) -> str | None:
        return value.strip() if value and value.strip() else None


class FeedbackResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    category: FeedbackCategory
    message: str
    screen: str | None
    created_at: datetime