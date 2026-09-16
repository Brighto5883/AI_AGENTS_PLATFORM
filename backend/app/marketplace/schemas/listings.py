from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.database.models.listing import Listing
from app.marketplace.schemas.contact import ContactablePublic


class ListingCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str = Field(min_length=1)
    price: Decimal = Field(gt=0)
    category: str = Field(min_length=1, max_length=100)


    @field_validator("title", "description", "category")
    @classmethod
    def validate_text_fields(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("This field cannot be empty.")
        return value

class ListingUpdate(BaseModel):
    title: str | None = Field(
        default=None,
        min_length=1,
        max_length=200,
    )
    description: str | None = Field(
        default=None,
        min_length=1,
    )
    price: Decimal | None = Field(
        default=None,
        gt=0,
    )
    category: str | None = Field(
        default=None,
        min_length=1,
        max_length=100,
    )


    @field_validator("title", "description", "category")
    @classmethod
    def validate_update_text_fields(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        if not value:
            raise ValueError("This field cannot be empty.")
        return value

class ListingImageResponse(BaseModel):
    id: UUID
    original_filename: str
    content_type: str
    file_size: int
    display_order: int
    url: str


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
    is_active: bool
    needs_review: bool
    review_reason: str | None
    created_at: datetime
    sold_at: datetime | None
    scheduled_deletion_at: datetime | None
    images: list[ListingImageResponse]
    seller: ContactablePublic
    contact_unlocked: bool


@dataclass(frozen=True)
class ListingCreationResult:
    listing: Listing
    requires_payment: bool
    payment_amount: Decimal | None
    stored_image_keys: list[str]