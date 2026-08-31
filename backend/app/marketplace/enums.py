from enum import StrEnum


class TransactionStatus(StrEnum):
    PENDING_PAYMENT = "pending_payment"
    PAID = "paid"
    FAILED = "failed"
    CANCELLED = "cancelled"
    EXPIRED = "expired"


class PaymentRequiredFrom(StrEnum):
    BUYER = "buyer"
    SELLER = "seller"
