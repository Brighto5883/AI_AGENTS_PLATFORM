from decimal import Decimal
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.container import container
from app.database.models.listing import Listing
from app.database.models.user import User
from app.database.session import get_async_session
from app.database.users import current_active_user
from app.marketplace.media.schemas import ImageUpload
from app.marketplace.schemas.listings import (
    ListingCreate,
    ListingResponse,
    ListingUpdate,
)

router = APIRouter(
    prefix="/marketplace/listings",
    tags=["Marketplace Listings"],
)

# ==================================================================================
@router.post(
    "/",
    response_model=ListingResponse,
)
async def create_listing(
    title: Annotated[str, Form()],
    description: Annotated[str, Form()],
    price: Annotated[Decimal, Form()],
    category: Annotated[str, Form()],
    images: Annotated[
        list[UploadFile] | None,
        File(),
    ] = None,
    authenticated_user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
):
    data = ListingCreate(
        title=title,
        description=description,
        price=price,
        category=category,
    )

    uploads: list[ImageUpload] = []

    if images is not None:
        uploads = [
            ImageUpload(
                file=image.file,
                original_filename=image.filename or 'image',
                content_type=image.content_type or '',
            )
            for image in images
        ]

    result = await container.listing_service.create_listing(
        seller=authenticated_user,
        data=data,
        images=uploads,
        session=session,
    )

    return await container.listing_service.to_listing_response(
        listing=result.listing,
    )
# ==================================================================================
@router.get("/")
async def list_listings(
    search: str | None = None,
    category: str | None = None,
    min_price: float | None = Query(None, ge=0),
    max_price: float | None = Query(None, ge=0),
    sort: str = Query(
        "recent",
        pattern="^(recent|price_asc|price_desc)$",
    ),
    limit: int = Query(20, ge=1, le=50),
    offset: int = Query(0, ge=0),
    authenticated_user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
):
    stmt = select(Listing).where(
        Listing.is_approved.is_(True),
        Listing.is_active.is_(True),
    )

    if search:
        like = f"%{search}%"
        stmt = stmt.where(
            or_(
                Listing.title.ilike(like),
                Listing.description.ilike(like),
            )
        )

    if category:
        stmt = stmt.where(Listing.category == category)

    if min_price is not None:
        stmt = stmt.where(Listing.price >= min_price)

    if max_price is not None:
        stmt = stmt.where(Listing.price <= max_price)

    if sort == "price_asc":
        stmt = stmt.order_by(Listing.price.asc())
    elif sort == "price_desc":
        stmt = stmt.order_by(Listing.price.desc())
    else:
        stmt = stmt.order_by(Listing.created_at.desc())

    stmt = stmt.offset(offset).limit(limit)

    listings = await container.listing_service.list_approved_listings(
        session=session,
        stmt=stmt
    )

    return {
        "items": [await container.listing_service.to_listing_response(listing=listing) for listing in listings],
        "next_offset": offset + len(listings),
        'has_more': len(listings) == limit,
    }
# ==================================================================================
@router.get(
    "/my-listings",
    response_model=list[ListingResponse],
)
async def get_my_listings(
    authenticated_user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
):
    listings = await container.listing_service.list_my_listings(
        seller_id=authenticated_user.id,
        session=session,
    )

    return [
        await container.listing_service.to_listing_response(
            listing=listing,
        )
        for listing in listings
    ]
# ==================================================================================
@router.patch(
    "/{listing_id}/sold",
    response_model=ListingResponse,
)
async def mark_listing_sold(
    listing_id: UUID,
    authenticated_user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
):
    listing = await container.listing_service.mark_listing_sold(
        listing_id=listing_id,
        seller_id=authenticated_user.id,
        session=session,
    )

    return await container.listing_service.to_listing_response(
        listing=listing,
    )
# ===================================================================================
@router.patch(
    "/{listing_id}",
    response_model=ListingResponse,
)
async def update_listing(
    listing_id: UUID,
    data: ListingUpdate,
    authenticated_user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
):
    listing = await container.listing_service.update_listing(
        listing_id=listing_id,
        seller_id=authenticated_user.id,
        data=data,
        session=session,
    )

    return await container.listing_service.to_listing_response(
        listing=listing,
    )

# ==================================================================================
@router.delete(
    "/{listing_id}/images/{image_id}",
    status_code=204,
)
async def delete_listing_image(
    listing_id: UUID,
    image_id: UUID,
    authenticated_user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
):
    listing = await container.listing_service.get_listing(
        listing_id=listing_id,
        session=session,
    )

    if listing.seller_id != authenticated_user.id:
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to modify this listing.",
        )

    await container.listing_image_service.delete_image(
        image_id=image_id,
        listing_id=listing_id,
        session=session,
    )

# ==================================================================================
@router.post(
    "/{listing_id}/images",
    response_model=ListingResponse,
)
async def add_listing_images(
    listing_id: UUID,
    images: Annotated[
        list[UploadFile] | None,
        File(),
    ] = None,
    authenticated_user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
):
    uploads: list[ImageUpload] = []

    if images is not None:
        uploads = [
            ImageUpload(
                file=image.file,
                original_filename=image.filename or "image",
                content_type=image.content_type or "",
            )
            for image in images
        ]

    listing = await container.listing_service.add_listing_images(
        listing_id=listing_id,
        seller_id=authenticated_user.id,
        images=uploads,
        session=session,
    )

    return await container.listing_service.to_listing_response(
        listing=listing,
    )


# ==================================================================================
@router.get(
    "/{listing_id}",
    response_model=ListingResponse,
)
async def get_listing(
    listing_id: UUID,
    authenticated_user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
):
    listing = await container.listing_service.get_listing(
        listing_id=listing_id,
        session=session,
    )
    return await container.listing_service.to_listing_response(
        listing =listing
    )
# ==================================================================================
@router.delete(
    "/{listing_id}",
    status_code=204,
)
async def delete_listing(
    listing_id: UUID,
    authenticated_user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
):
    await container.listing_service.delete_listing(
        listing_id=listing_id,
        seller_id=authenticated_user.id,
        session=session,
    )

