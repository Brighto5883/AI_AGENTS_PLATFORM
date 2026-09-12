from abc import ABC, abstractmethod

from app.payments.payment_schemas import (
    PaymentInitiationResult,
    PaymentRequest,
    PaymentVerificationResult,
)


class PaymentProvider(ABC):

    @abstractmethod
    async def initiate_payment(
        self,
        request: PaymentRequest,
    ) -> PaymentInitiationResult:
        raise NotImplementedError

    @abstractmethod
    async def verify_transaction(
        self,
        transaction_code: str,
    ) -> PaymentVerificationResult:
        raise NotImplementedError
