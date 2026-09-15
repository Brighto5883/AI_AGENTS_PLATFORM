from enum import StrEnum


class PaymentProviderType(StrEnum):
    MPESA = "mpesa"
    PAYSTACK = "paystack"


class PaymentStatus(StrEnum):
    PENDING = "pending"
    SUCCESSFUL = "successful"
    FAILED = "failed"
    CANCELLED = "cancelled"
    EXPIRED = "expired"
