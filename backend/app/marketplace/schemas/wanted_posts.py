from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class WantedPostCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str = Field(min_length=1)
    budget: Decimal | None = Field(default=None, gt=0)


class WantedPostResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    buyer_id: UUID
    title: str
    description: str
    budget: Decimal | None
    is_open: bool
    created_at: datetime
