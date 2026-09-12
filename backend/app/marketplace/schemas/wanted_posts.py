from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.marketplace.schemas.contact import ContactablePublic


class WantedPostCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str = Field(min_length=1)
    category: str = Field(min_length=1, max_length=200)
    budget: Decimal | None = Field(default=None, gt=0)



    @field_validator("title", "description", "category")
    @classmethod
    def validate_text_fields(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("This field cannot be empty.")
        return value

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
    contact_unlocked: bool


    @field_validator("title", "description", "category")
    @classmethod
    def validate_update_text_fields(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        if not value:
            raise ValueError("This field cannot be empty.")
        return value

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
