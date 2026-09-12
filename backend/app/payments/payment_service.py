
from datetime import UTC, datetime
from decimal import Decimal
from uuid import UUID, uuid4

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.models.payment import Payment
from app.payments.enums import PaymentProviderType, PaymentStatus
from app.payments.payment_callback_schemas import MpesaStkCallback
from app.payments.payment_provider import PaymentProvider
from app.payments.payment_schemas import (
    PaymentInitiationResult,
    PaymentRequest,
    PaymentVerificationResult,
)
from app.payments.payment_success_action import PaymentSuccessAction


class PaymentService:

    STANDALONE_PAYMENT_PURPOSES = {
        "platform_donation",
    }

    def __init__(
        self,
        providers: dict[
            PaymentProviderType,
            PaymentProvider,
        ],
        payment_success_handlers: list[PaymentSuccessAction],
    ) -> None:
        self.providers = providers
        self.payment_success_handlers = payment_success_handlers

# ================================================================================================
    async def initiate_payment(
        self,
        *,
        request: PaymentRequest,
        session: AsyncSession,
    ) -> PaymentInitiationResult:

        provider = self.providers.get(request.provider)

        if provider is None:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Payment provider '{request.provider}' "
                    "is not supported."
                ),
            )

        payment = Payment(
            id=uuid4(),
            payer_id=request.payer_id,
            amount=request.amount,
            purpose=request.purpose,
            reference_type=request.reference_type,
            reference_id=request.reference_id,
            provider=request.provider,
            status=PaymentStatus.PENDING,
            created_at=datetime.now(UTC),
        )

        session.add(payment)

        await session.flush()

        try:
            result = await provider.initiate_payment(request)
        except Exception:
            payment.status = PaymentStatus.FAILED
            await session.flush()
            raise

        payment.checkout_request_id = result.checkout_request_id

        if not result.success:
            payment.status = PaymentStatus.FAILED
            payment.completed_at = datetime.now(UTC)

        await session.flush()

        return PaymentInitiationResult(
            success=result.success,
            provider=result.provider,
            provider_reference=result.provider_reference,
            checkout_request_id=result.checkout_request_id,
            message=result.message,
            payment_id=payment.id,
        )

# ================================================================================================
    async def get_payment(
        self,
        *,
        payment_id: UUID,
        session: AsyncSession,
    ) -> Payment:

        result = await session.execute(
            select(Payment).where(Payment.id == payment_id)
        )

        payment = result.scalar_one_or_none()

        if payment is None:
            raise HTTPException(
                status_code=404,
                detail="Payment not found.",
            )

        return payment

# ================================================================================================
    async def get_user_payment(
        self,
        *,
        payment_id: UUID,
        payer_id: UUID,
        session: AsyncSession,
    ) -> Payment:

        result = await session.execute(
            select(Payment).where(
                Payment.id == payment_id,
                Payment.payer_id == payer_id,
            )
        )

        payment = result.scalar_one_or_none()

        if payment is None:
            raise HTTPException(
                status_code=404,
                detail="Payment not found.",
            )

        return payment

# ================================================================================================
    async def process_mpesa_callback(
        self,
        *,
        callback: MpesaStkCallback,
        session: AsyncSession,
    ) -> Payment:
        print(
            "M-Pesa callback:",
            callback.model_dump(),
        )

        result = await session.execute(
            select(Payment).where(
                Payment.checkout_request_id
                == callback.checkout_request_id
            )
        )

        payment = result.scalar_one_or_none()

        if payment is not None:
            print(
                f"M-Pesa callback received: "
                f"payment_id={payment.id}, "
                f"result_code={callback.result_code}"
            )

        if payment is None:
            raise HTTPException(
                status_code=404,
                detail="Payment not found.",
            )

        # M-Pesa callbacks may be delivered more than once.
        if payment.status != PaymentStatus.PENDING:
            return payment

        if callback.result_code == 0:
            payment.status = PaymentStatus.SUCCESSFUL

            print(f"Payment {payment.id} → SUCCESSFUL") 

            receipt_number = self._get_callback_metadata_value(
                callback,
                "MpesaReceiptNumber",
            )

            if receipt_number is not None:
                payment.provider_reference = str(
                    receipt_number
                )

            payment.completed_at = datetime.now(UTC)

            await session.flush()

            await self._execute_success_action(
                payment=payment,
                session=session,
            )

        else:
            payment.status = PaymentStatus.FAILED

            print(
                f"Payment {payment.id} marked FAILED "
                f"(result_code={callback.result_code})"
            )

            payment.completed_at = datetime.now(UTC)
        
            await session.flush()

        return payment

# ================================================================================================
    @staticmethod
    def _get_callback_metadata_value(
        callback: MpesaStkCallback,
        name: str,
    ) -> str | int | Decimal | None:

        if callback.callback_metadata is None:
            return None

        for item in callback.callback_metadata.item:
            if item.name == name:
                return item.value

        return None

# ================================================================================================
    async def _execute_success_action(
        self,
        *,
        payment: Payment,
        session: AsyncSession,
    ) -> None:

        for handler in self.payment_success_handlers:
            if handler.supports(payment):
                await handler.execute(
                    payment=payment,
                    session=session,
                )
                return

        if payment.purpose in self.STANDALONE_PAYMENT_PURPOSES:
            return

        raise ValueError(
            f"No payment success action registered for "
            f"purpose '{payment.purpose}'."
        )

# ================================================================================================
    async def verify_transaction(
        self,
        *,
        payment_id: UUID,
        payer_id: UUID,
        transaction_code: str,
        session: AsyncSession,
    ) -> PaymentVerificationResult:
        payment = await self.get_user_payment(
            payment_id=payment_id,
            payer_id=payer_id,
            session=session,
        )

        # We only allow recovery of a payment whose final outcome
        # has not yet been established.
        if payment.status != PaymentStatus.PENDING:
            return PaymentVerificationResult(
                verified=False,
                provider_reference=payment.provider_reference,
                amount=payment.amount,
                message="This payment is no longer awaiting verification.",
            )

        provider = self.providers.get(payment.provider)

        if provider is None:
            raise HTTPException(
                status_code=400,
                detail="Payment provider is not available.",
            )

        # WIRE THE RIGHT API SERVICE HERE ONCE THE TILL IS APPROVED
        verification = await provider.verify_transaction(
            transaction_code=transaction_code.strip().upper(),
        )

        if not verification.verified:
            return verification

        if verification.amount is None:
            return PaymentVerificationResult(
                verified=False,
                provider_reference=verification.provider_reference,
                amount=None,
                message="M-Pesa verification did not return the transaction amount.",
            )

        if verification.amount != payment.amount:
            return PaymentVerificationResult(
                verified=False,
                provider_reference=verification.provider_reference,
                amount=verification.amount,
                message="The M-Pesa transaction amount does not match this payment.",
            )

        if verification.provider_reference is None:
            return PaymentVerificationResult(
                verified=False,
                provider_reference=None,
                amount=verification.amount,
                message="M-Pesa verification did not return a transaction reference.",
            )

        # provider_reference is UNIQUE in our Payment model.
        # This prevents the same M-Pesa receipt from being attached
        # to multiple payments.
        payment.provider_reference = verification.provider_reference
        payment.status = PaymentStatus.SUCCESSFUL
        payment.completed_at = datetime.now(UTC)

        await session.flush()

        await self._execute_success_action(
            payment=payment,
            session=session,
        )

        return PaymentVerificationResult(
            verified=True,
            provider_reference=payment.provider_reference,
            amount=payment.amount,
            message="Payment verified successfully.",
        )