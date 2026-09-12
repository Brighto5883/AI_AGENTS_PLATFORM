import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.models.user import User
from app.database.session import get_async_session
from app.database.users import current_active_user
from app.utils.phone import normalize_kenyan_phone_number as normalize_phone_number
from app.core.container import container
from app.marketplace.schemas.payments import MarketplacePaymentCreate
from app.payments.payment_schemas import (
    PaymentInitiationResult,
    PaymentRequest,
    PaymentVerificationResult,
    VerifyTransactionRequest,
)

logger = logging.getLogger(__name__)


router = APIRouter(
    prefix="/payments",
    tags=["Payments"],
)

@router.post(
    "/{payment_id}/verify-transaction",
    response_model=PaymentVerificationResult,
)
async def verify_transaction(
    payment_id: UUID,
    data: VerifyTransactionRequest,
    authenticated_user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
): #-> Payment:
    try:
        result = await container.payment_service.verify_transaction(
            payment_id=payment_id,
            payer_id=authenticated_user.id,
            transaction_code=data.transaction_code,
            session=session,
        )
        await session.commit()
        return result
    except HTTPException:
        await session.rollback()
        raise
    except NotImplementedError as exc:
        await session.rollback()
        raise HTTPException(
            status_code=501,
            detail="Transaction-code verification is not available yet.",
        ) from exc
    except Exception as exc:
        await session.rollback()
        logger.exception(
            "Failed to verify payment transaction",
            extra={"payment_id": str(payment_id)},
        )
        raise HTTPException(
            status_code=502,
            detail="Unable to verify the payment transaction.",
        ) from exc

@router.post("/marketplace/listings/{listing_id}", response_model=PaymentInitiationResult)
async def initiate_listing_payment(
    listing_id: UUID,
    data: MarketplacePaymentCreate,
    authenticated_user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
):
    listing = await container.listing_service.get_listing(listing_id, session)
    if listing.seller_id != authenticated_user.id:
        raise HTTPException(status_code=403, detail="You do not own this listing.")
    if listing.is_approved:
        raise HTTPException(status_code=400, detail="This listing has already been paid for or approved.")
    decision = container.billing_service.evaluate_listing_creation(
        user=authenticated_user, category=listing.category, price=listing.price
    )
    if not decision.requires_payment or decision.listing_fee is None:
        raise HTTPException(status_code=400, detail="This listing does not require payment.")
    try:
        phone_number = normalize_phone_number(data.phone_number)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid Kenyan phone number.") from exc

    request = PaymentRequest(
        payer_id=authenticated_user.id, amount=decision.listing_fee,
        purpose="marketplace_listing_fee", reference_type="listing",
        reference_id=listing.id, provider=PaymentProviderType.MPESA,
        phone_number=phone_number,
    )
    return await container.payment_service.initiate_payment(request=request, session=session)


@router.post("/marketplace/transactions/{transaction_id}", response_model=PaymentInitiationResult)
async def initiate_connection_payment(
    transaction_id: UUID,
    data: MarketplacePaymentCreate,
    authenticated_user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
):
    transaction = await container.transaction_service.get_transaction_for_participant(
        transaction_id=transaction_id, user_id=authenticated_user.id, session=session
    )
    if transaction.status.value != "pending_payment":
        raise HTTPException(status_code=400, detail="This connection is not awaiting payment.")
    if transaction.payment_required_from.value == "buyer" and transaction.buyer_id != authenticated_user.id:
        raise HTTPException(status_code=403, detail="You are not the required payer for this connection.")
    if transaction.payment_required_from.value == "seller" and transaction.seller_id != authenticated_user.id:
        raise HTTPException(status_code=403, detail="You are not the required payer for this connection.")
    try:
        phone_number = normalize_phone_number(data.phone_number)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid Kenyan phone number.") from exc

    request = PaymentRequest(
        payer_id=authenticated_user.id, amount=transaction.fee_amount,
        purpose="marketplace_connection_fee", reference_type="transaction",
        reference_id=transaction.id, provider=PaymentProviderType.MPESA,
        phone_number=phone_number,
    )
    return await container.payment_service.initiate_payment(request=request, session=session)
