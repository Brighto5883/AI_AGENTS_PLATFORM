
import logging
from decimal import Decimal
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.container import container
from app.database.models.user import User
from app.database.session import get_async_session
from app.database.users import current_active_user
from app.payments.donation_schemas import (
    DonationCreate,
    DonationResponse,
    PaymentStatusResponse,
)
from app.payments.enums import PaymentProviderType
from app.payments.payment_schemas import PaymentRequest
from app.utils.phone import normalize_kenyan_phone_number

logger = logging.getLogger(__name__)


router = APIRouter(
    prefix="/payments",
    tags=["Payments"],
)


@router.post(
    "/donations",
    response_model=DonationResponse,
)
async def create_donation(
    data: DonationCreate,
    authenticated_user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
):
    try:
        normalized_phone = normalize_kenyan_phone_number(
            data.phone_number
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail="Invalid Kenyan phone number.",
        ) from exc

    payment_id = uuid4()

    request = PaymentRequest(
        payer_id=authenticated_user.id,
        amount=Decimal(data.amount),
        purpose="platform_donation",
        reference_type="donation",
        reference_id=payment_id,
        provider=PaymentProviderType.MPESA,
        phone_number=normalized_phone,
    )

    try:
        result = await container.payment_service.initiate_payment(
            request=request,
            session=session,
        )

        await session.commit()

    except HTTPException:
        await session.rollback()
        raise

    except Exception as exc :
        await session.rollback()
        logger.exception("Failed to initiate M-Pesa donation")
        raise HTTPException(
            status_code=502,
            detail="Unable to initiate the M-Pesa payment.",
        ) from exc

    if result.payment_id is None:
        await session.rollback()
        raise HTTPException(
            status_code=500,
            detail="Payment was created without a payment ID.",
        )

    return DonationResponse(
        payment_id=result.payment_id,
        amount=data.amount,
        status=(
            "pending"
            if result.success
            else "failed"
        ),
        provider=result.provider.value,
        checkout_request_id=result.checkout_request_id,
        message=result.message,
    )


@router.get(
    "/{payment_id}",
    response_model=PaymentStatusResponse,
)
async def get_payment_status(
    payment_id: UUID,
    authenticated_user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
):
    payment = await container.payment_service.get_user_payment(
        payment_id=payment_id,
        payer_id=authenticated_user.id,
        session=session,
    )

    return PaymentStatusResponse(
        id=payment.id,
        amount=payment.amount,
        purpose=payment.purpose,
        status=payment.status.value,
        provider=payment.provider.value,
        provider_reference=payment.provider_reference,
        checkout_request_id=payment.checkout_request_id,
        created_at=payment.created_at,
        completed_at=payment.completed_at,
    )
