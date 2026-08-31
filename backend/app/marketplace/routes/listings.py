from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.container import container
from app.database.models.user import User
from app.database.session import get_async_session
from app.database.users import current_active_user
from app.marketplace.schemas.listings import (
    ListingCreate,
    ListingResponse,
)

router = APIRouter(
    prefix="/marketplace/listings",
    tags=["Marketplace Listings"],
)


@router.post(
    "/",
    response_model=ListingResponse,
)
async def create_listing(
    data: ListingCreate,
    authenticated_user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
):
    return await container.listing_service.create_listing(
        seller_id=authenticated_user.id,
        data=data,
        session=session,
    )


@router.get(
    "/",
    response_model=list[ListingResponse],
)
async def list_listings(
    session: AsyncSession = Depends(get_async_session),
):
    return await container.listing_service.list_approved_listings(
        session=session,
    )


@router.get(
    "/{listing_id}",
    response_model=ListingResponse,
)
async def get_listing(
    listing_id: UUID,
    session: AsyncSession = Depends(get_async_session),
):
    return await container.listing_service.get_listing(
        listing_id=listing_id,
        session=session,
    )
