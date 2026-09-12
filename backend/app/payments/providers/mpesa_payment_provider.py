from base64 import b64encode
from datetime import datetime
from decimal import ROUND_DOWN
from zoneinfo import ZoneInfo

import httpx

from app.config.settings import settings
from app.payments.enums import PaymentProviderType
from app.payments.payment_provider import PaymentProvider
from app.utils.phone import normalize_kenyan_phone_number
from app.payments.payment_schemas import (
    PaymentInitiationResult,
    PaymentRequest,
    PaymentVerificationResult,
)


# ================================================================================================
class MpesaPaymentProvider(PaymentProvider):

    async def initiate_payment(
        self,
        request: PaymentRequest,
    ) -> PaymentInitiationResult:
        access_token = await self._get_access_token()

        timestamp = self._generate_timestamp()
        password = self._generate_password(timestamp)

        phone_number = normalize_kenyan_phone_number(
            request.phone_number
        )

        amount = int(
            request.amount.quantize(
                1,
                rounding=ROUND_DOWN,
            )
        )

        account_reference = str(request.reference_id).replace("-", "")[:12]
        transaction_description = {
            "platform_donation": "Platform donation",
            "marketplace_listing_fee": "Marketplace listing",
            "marketplace_connection_fee": "Marketplace connection",
        }.get(request.purpose, "Platform payment")[:13]

        payload = {
            "BusinessShortCode": settings.MPESA_SHORTCODE,
            "Password": password,
            "Timestamp": timestamp,
            "TransactionType": "CustomerPayBillOnline",
            "Amount": amount,
            "PartyA": phone_number,
            "PartyB": settings.MPESA_SHORTCODE,
            "PhoneNumber": phone_number,
            "CallBackURL": settings.MPESA_CALLBACK_URL,
            "AccountReference": account_reference,
            "TransactionDesc": transaction_description,
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                f"{settings.MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json",
                },
                json=payload,
            )

        response.raise_for_status()

        data = response.json()

        success = data.get("ResponseCode") == "0"

        return PaymentInitiationResult(
            success=success,
            provider=PaymentProviderType.MPESA,
            provider_reference=None,
            checkout_request_id=data.get("CheckoutRequestID"),
            message=(
                data.get("CustomerMessage")
                or data.get("ResponseDescription")
                or "M-Pesa payment request processed."
            ),
        )

# ====================================================================================
    async def verify_transaction(
        self,
        transaction_code: str,
    ) -> PaymentVerificationResult:
        raise NotImplementedError(
            "M-Pesa transaction verification is not implemented yet."
        )

# ================================================================================================
    async def _get_access_token(self) -> str:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(
                f"{settings.MPESA_BASE_URL}/oauth/v1/generate",
                params={
                    "grant_type": "client_credentials",
                },
                auth=(
                    settings.MPESA_CONSUMER_KEY,
                    settings.MPESA_CONSUMER_SECRET,
                ),
            )

        response.raise_for_status()

        data = response.json()

        return data["access_token"]

# =====================================================================================
    @staticmethod
    def _generate_timestamp() -> str:
        now = datetime.now(
            ZoneInfo("Africa/Nairobi")
        )

        return now.strftime("%Y%m%d%H%M%S")

# ====================================================================================
    @staticmethod
    def _generate_password(timestamp: str) -> str:
        raw_password = (
            f"{settings.MPESA_SHORTCODE}"
            f"{settings.MPESA_PASSKEY}"
            f"{timestamp}"
        )

        return b64encode(
            raw_password.encode()
        ).decode()

# =====================================================================================
