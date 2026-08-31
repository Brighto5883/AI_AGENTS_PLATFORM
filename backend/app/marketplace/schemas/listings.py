from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ListingCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str = Field(min_length=1)
    price: Decimal = Field(gt=0)
    category: str = Field(min_length=1, max_length=100)


class ListingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    seller_id: UUID
    title: str
    description: str
    price: Decimal
    category: str
    image_path: str | None
    is_approved: bool
    needs_review: bool
    review_reason: str | None
    created_at: datetime
