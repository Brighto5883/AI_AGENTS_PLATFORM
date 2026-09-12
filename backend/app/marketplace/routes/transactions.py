from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.container import container
from app.database.models.transaction import Transaction
from app.database.models.user import User
from app.database.session import get_async_session
from app.database.users import current_active_user
from app.marketplace.schemas.transactions import (
    TransactionResponse,
)

router = APIRouter(
    prefix="/marketplace/transactions",
    tags=["Marketplace Transactions"],
)


@router.post(
    "/listings/{listing_id}/connect",
    response_model=TransactionResponse,
)
async def create_listing_connection(
    listing_id: UUID,
    authenticated_user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
):
    listing = await container.listing_service.get_listing(
        listing_id=listing_id,
        session=session,
    )

    return await container.transaction_service.create_listing_connection(
        listing=listing,
        initiator_id=authenticated_user.id,
        session=session,
    )

@router.post(
    "/{transaction_id}/request-other-party-to-pay",
    response_model=TransactionResponse,
)
async def request_other_party_to_pay(
    transaction_id: UUID,
    authenticated_user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
):
    transaction = await session.get(Transaction, transaction_id)

    if transaction is None:
        raise HTTPException(
            status_code=404,
            detail="Transaction not found.",
        )

    return await container.transaction_service.request_other_party_to_pay(
        transaction=transaction,
        user_id=authenticated_user.id,
        session=session,
    )

@router.post(
    "/{transaction_id}/decline-payment",
    response_model=TransactionResponse,
)
async def decline_payment_request(
    transaction_id: UUID,
    authenticated_user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
):
    transaction = await session.get(Transaction, transaction_id)

    if transaction is None:
        raise HTTPException(
            status_code=404,
            detail="Transaction not found.",
        )

    return await container.transaction_service.decline_payment_request(
        transaction=transaction,
        user_id=authenticated_user.id,
        session=session,
    )


