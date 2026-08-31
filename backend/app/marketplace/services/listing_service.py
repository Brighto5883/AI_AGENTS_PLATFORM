from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.models.listing import Listing
from app.marketplace.moderation.text_scanner import scan_text
from app.marketplace.schemas.listings import ListingCreate


class ListingService:

    async def create_listing(
        self,
        seller_id: UUID,
        data: ListingCreate,
        session: AsyncSession,
    ) -> Listing:

        moderation_result = scan_text(
            f"{data.title} {data.description}"
        )

        if not moderation_result["passed"]:
            raise HTTPException(
                status_code=400,
                detail={
                    "message": "Listing contains prohibited contact information.",
                    "reason": moderation_result["reason"],
                    "flagged": moderation_result["flagged"],
                },
            )

        listing = Listing(
            seller_id=seller_id,
            title=data.title,
            description=data.description,
            price=data.price,
            category=data.category,
            is_approved=True,
            needs_review=False,
        )

        session.add(listing)
        await session.commit()
        await session.refresh(listing)

        return listing

    async def list_approved_listings(
        self,
        session: AsyncSession,
    ) -> list[Listing]:

        result = await session.execute(
            select(Listing)
            .where(Listing.is_approved.is_(True))
            .order_by(Listing.created_at.desc())
        )

        return list(result.scalars().all())

    async def get_listing(
        self,
        listing_id: UUID,
        session: AsyncSession,
    ) -> Listing:

        listing = await session.get(Listing, listing_id)

        if listing is None:
            raise HTTPException(
                status_code=404,
                detail="Listing not found.",
            )

        return listing
