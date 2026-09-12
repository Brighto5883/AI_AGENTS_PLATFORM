
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field


class DonationCreate(BaseModel):
    amount: Decimal = Field(
        gt=0,
        le=250_000,
        decimal_places=0,
    )
    phone_number: str = Field(
        min_length=10,
        max_length=20,
    )


class DonationResponse(BaseModel):
    payment_id: UUID
    amount: Decimal
    status: str
    provider: str
    checkout_request_id: str | None
    message: str


class PaymentStatusResponse(BaseModel):
    id: UUID
    amount: Decimal
    purpose: str
    status: str
    provider: str
    provider_reference: str | None
    checkout_request_id: str | None
    created_at: object
    completed_at: object | None
