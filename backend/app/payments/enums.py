from enum import StrEnum


class PaymentProviderType(StrEnum):
    MPESA = "mpesa"


class PaymentStatus(StrEnum):
    PENDING = "pending"
    SUCCESSFUL = "successful"
    FAILED = "failed"
    CANCELLED = "cancelled"
    EXPIRED = "expired"
