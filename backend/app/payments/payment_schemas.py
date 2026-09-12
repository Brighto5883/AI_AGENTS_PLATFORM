
from dataclasses import dataclass
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field

from app.payments.enums import PaymentProviderType


@dataclass(frozen=True)
class PaymentRequest:
    payer_id: UUID
    amount: Decimal
    purpose: str
    reference_type: str
    reference_id: UUID
    provider: PaymentProviderType
    phone_number: str

@dataclass(frozen=True)
class PaymentInitiationResult:
    success: bool
    provider: PaymentProviderType
    provider_reference: str | None
    checkout_request_id: str | None
    message: str
    payment_id: UUID | None = None



class VerifyTransactionRequest(BaseModel):
    transaction_code: str = Field(
        min_length=8,
        max_length=20,
        pattern=r"^[A-Za-z0-9]+$",
    )

@dataclass(frozen=True)
class PaymentVerificationResult:
    verified: bool
    provider_reference: str | None
    amount: Decimal | None
    message: str
