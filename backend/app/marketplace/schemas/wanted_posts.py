from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.marketplace.schemas.contact import ContactablePublic


class WantedPostCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str = Field(min_length=1)
    category: str = Field(min_length=1, max_length=200)
    budget: Decimal | None = Field(default=None, gt=0)


class WantedPostResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    requester_id: UUID
    title: str
    description: str
    category: str
    budget: Decimal | None
    is_open: bool
    created_at: datetime
    requester: ContactablePublic

class WantedPostUpdate(BaseModel):
    title: str | None = Field(
        default=None,
        min_length=1,
        max_length=200,
    )
    description: str | None = Field(
        default=None,
        min_length=1,
    )
    category: str | None = Field(
        default=None,
        min_length=1,
        max_length=100,
    )
    budget: Decimal | None = Field(
        default=None,
        gt=0,
    )
