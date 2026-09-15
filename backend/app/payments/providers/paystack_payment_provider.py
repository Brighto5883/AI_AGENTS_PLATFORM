from decimal import ROUND_DOWN, Decimal
from uuid import uuid4

import httpx

from app.config.settings import settings
from app.payments.enums import PaymentProviderType
from app.payments.payment_provider import PaymentProvider
from app.payments.payment_schemas import (
    PaymentInitiationResult,
    PaymentRequest,
    PaymentVerificationResult,
)
from app.utils.phone import normalize_kenyan_phone_number


class PaystackPaymentProvider(PaymentProvider):

    BASE_URL = "https://api.paystack.co"

    async def initiate_payment(
        self,
        request: PaymentRequest,
    ) -> PaymentInitiationResult:
        if not settings.PAYSTACK_ENABLED:
            raise RuntimeError("Paystack payments are disabled.")

        if not settings.PAYSTACK_SECRET_KEY:
            raise RuntimeError(
                "PAYSTACK_SECRET_KEY is not configured."
            )

        paystack_reference = f"acs-{uuid4().hex}"

        phone_number = (
            "+"
            + normalize_kenyan_phone_number(
                request.phone_number,
            )
        )

        amount = int(
            request.amount.quantize(
                Decimal("1"),
                rounding=ROUND_DOWN,
            )
        )

        payload = {
            "email": request.payer_email,
            "amount": str(amount * 100),
            "currency": settings.PAYSTACK_CURRENCY,
            "reference": paystack_reference,
            "mobile_money": {
                "phone": phone_number,
                "provider": "mpesa",
            },
            "metadata": {
                "payment_id": str(request.reference_id),
                "purpose": request.purpose,
                "reference_type": request.reference_type,
                "reference_id": str(request.reference_id),
            },
        }

        async with httpx.AsyncClient(
            timeout=httpx.Timeout(30.0),
        ) as client:
            response = await client.post(
                f"{self.BASE_URL}/charge",
                headers={
                    "Authorization": (
                        f"Bearer {settings.PAYSTACK_SECRET_KEY}"
                    ),
                    "Content-Type": "application/json",
                },
                json=payload,
            )


        response.raise_for_status()

        data = response.json()
        charge = data.get("data") or {}

        reference = charge.get("reference")

        if not data.get("status") or not reference:
            return PaymentInitiationResult(
                success=False,
                provider=PaymentProviderType.PAYSTACK,
                provider_reference=None,
                checkout_request_id=None,
                message=(
                    data.get("message")
                    or "Paystack payment could not be initiated."
                ),
            )

        return PaymentInitiationResult(
            success=True,
            provider=PaymentProviderType.PAYSTACK,
            provider_reference=reference,
            checkout_request_id=reference,
            message=(
                charge.get("display_text")
                or data.get("message")
                or "M-PESA payment request initiated."
            ),
        )

    async def verify_transaction(
        self,
        transaction_code: str,
    ) -> PaymentVerificationResult:
        if not settings.PAYSTACK_ENABLED:
            raise RuntimeError("Paystack payments are disabled.")

        if not settings.PAYSTACK_SECRET_KEY:
            raise RuntimeError(
                "PAYSTACK_SECRET_KEY is not configured."
            )

        reference = transaction_code.strip()

        async with httpx.AsyncClient(
            timeout=httpx.Timeout(30.0),
        ) as client:
            response = await client.get(
                f"{self.BASE_URL}/transaction/verify/{reference}",
                headers={
                    "Authorization": (
                        f"Bearer {settings.PAYSTACK_SECRET_KEY}"
                    ),
                },
            )

        response.raise_for_status()

        data = response.json()
        transaction = data.get("data") or {}

        if not data.get("status"):
            return PaymentVerificationResult(
                verified=False,
                provider_reference=transaction.get("reference"),
                amount=None,
                message=(
                    data.get("message")
                    or "Paystack transaction verification failed."
                ),
            )

        status = transaction.get("status")
        reference = transaction.get("reference")

        raw_amount = transaction.get("amount")

        amount = (
            Decimal(str(raw_amount)) / Decimal("100")
            if raw_amount is not None
            else None
        )

        if status != "success":
            return PaymentVerificationResult(
                verified=False,
                provider_reference=reference,
                amount=amount,
                message=(
                    transaction.get("gateway_response")
                    or transaction.get("message")
                    or f"Paystack transaction status: {status}."
                ),
            )

        return PaymentVerificationResult(
            verified=True,
            provider_reference=reference,
            amount=amount,
            message="Paystack payment verified successfully.",
        )