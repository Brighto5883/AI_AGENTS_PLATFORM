from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.api.schemas.enums import FeedbackCategory


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


class FeedbackResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    category: FeedbackCategory
    message: str
    screen: str | None
    created_at: datetime