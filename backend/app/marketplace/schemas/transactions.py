from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.marketplace.enums import (
    PaymentRequiredFrom,
    TransactionStatus,
)


class TransactionCreate(BaseModel):
    request_other_party_to_pay: bool = False

class TransactionResponse(BaseModel):

    model_config = ConfigDict(from_attributes=True)

    id: UUID

    listing_id: UUID | None

    wanted_id: UUID | None

    buyer_id: UUID

    seller_id: UUID

    initiator_id: UUID

    fee_amount: Decimal

    payment_required_from: PaymentRequiredFrom

    payer_id: UUID | None

    status: TransactionStatus

    payment_reference: str | None

    paid_at: datetime | None

    created_at: datetime

