from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.container import container
from app.database.models.user import User
from app.database.session import get_async_session
from app.database.users import current_active_user
from app.marketplace.schemas.transactions import (
    TransactionCreate,
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
    data: TransactionCreate,
    authenticated_user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
):
    listing = await container.listing_service.get_listing(
        listing_id=listing_id,
        session=session,
    )

    return await container.transaction_service.create_connection(
        listing=listing,
        initiator_id=authenticated_user.id,
        request_other_party_to_pay=data.request_other_party_to_pay,
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