from collections.abc import Sequence
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.billing.billing_service import BillingService
from app.billing.enums import MarketplaceBillingMode
from app.database.models.listing import Listing
from app.database.models.user import User
from app.database.models.transaction import Transaction
from app.marketplace.enums import TransactionStatus
from app.marketplace.media.schemas import ImageUpload
from app.marketplace.moderation.text_scanner import scan_text
from app.marketplace.schemas.contact import ContactablePublic
from app.marketplace.schemas.listings import (
    ListingCreate,
    ListingCreationResult,
    ListingImageResponse,
    ListingResponse,
    ListingUpdate,
)
from app.marketplace.services.listing_image_service import ListingImageService


class ListingService:

    def __init__(
        self,
        billing_service: BillingService,
        listing_image_service: ListingImageService,
    ):
        self.billing_service = billing_service
        self.listing_image_service = listing_image_service

# ==================================================================================

    async def _validate_subscription_quota(
        self,
        *,
        seller_id: UUID,
        listing_limit: int | None,
        session: AsyncSession,
    ) -> None:
        if listing_limit is None:
            raise HTTPException(
                status_code=500,
                detail="Subscription listing limit is not configured.",
            )

        result = await session.execute(
            select(func.count(Listing.id)).where(
                Listing.seller_id == seller_id,
                Listing.is_approved.is_(True),
                Listing.is_active.is_(True),
            )
        )

        listing_count = result.scalar_one()

        if listing_count >= listing_limit:
            raise HTTPException(
                status_code=403,
                detail=(
                    "You have reached your current marketplace listing "
                    "limit. Upgrade your plan or mark an active listing "
                    "as sold before creating another one."
                ),
            )

    async def create_listing(
        self,
        seller: User,
        data: ListingCreate,
        images: Sequence[ImageUpload],
        session: AsyncSession,
    ) -> ListingCreationResult:

        billing_decision = (
            self.billing_service.evaluate_listing_creation(
                user=seller,
                category=data.category,
                price=data.price,
            )
        )

        if seller.billing_mode == MarketplaceBillingMode.SUBSCRIPTION and self.billing_service.billing_enabled:
            await self._validate_subscription_quota(
                seller_id=seller.id,
                listing_limit=billing_decision.subscription_listing_limit,
                session=session,
            )

        # Contact-information protection is a marketplace invariant.
        moderation_result = scan_text(
            f"{data.title} {data.description}"
        )

        if not moderation_result["passed"]:
            raise HTTPException(
                status_code=400,
                detail={
                    "message": (
                        "Listing contains prohibited contact "
                        "information."
                    ),
                    "reason": moderation_result["reason"],
                    "flagged": moderation_result["flagged"],
                },
            )

        listing = Listing(
            seller_id=seller.id,
            title=data.title,
            description=data.description,
            price=data.price,
            category=data.category,
            is_approved=not billing_decision.requires_payment,
            needs_review=False,
        )

    # We need the listing ID before creating ListingImage records.
        session.add(listing)

        await session.flush()

        _, stored_image_keys = (
            await self.listing_image_service.create_images(
                listing_id=listing.id,
                uploads=images,
                session=session,
                scan_for_contact=billing_decision.requires_contact_scanning,
            )
        )

        await session.flush()

         # Reload the listing with its images explicitly loaded.
        result = await session.execute(
            select(Listing)
            .options(selectinload(Listing.images), selectinload(Listing.seller))
            .where(Listing.id == listing.id)
        )

        listing = result.scalar_one()

        # Commit the complete listing creation transaction.
        await session.commit()

        return ListingCreationResult(
            listing=listing,
            requires_payment=billing_decision.requires_payment,
            payment_amount=billing_decision.listing_fee,
            stored_image_keys=stored_image_keys,
        )

# ==================================================================================
    async def list_approved_listings(
        self,
        session: AsyncSession,
        stmt,
    ) -> list[Listing]:

        result = await session.execute(
            stmt.options(selectinload(Listing.images), 
                            selectinload(Listing.seller))
        )

        return list(result.scalars().all())

# ==================================================================================
    async def get_listing(
        self,
        listing_id: UUID,
        session: AsyncSession,
        viewer_id: UUID | None = None,
    ) -> Listing:

        result = await session.execute(
            select(Listing)
            .options(selectinload(Listing.images), 
                        selectinload(Listing.seller))
            .where(Listing.id == listing_id)
        )

        listing = result.scalar_one_or_none()

        if listing is None:
            raise HTTPException(
                status_code=404,
                detail="Listing not found.",
            )

        if (
            viewer_id is not None
            and listing.seller_id != viewer_id
            and (not listing.is_approved or not listing.is_active)
        ):
            raise HTTPException(
                status_code=404,
                detail="Listing not found.",
            )

        return listing

# ==================================================================================
    async def to_listing_response(
        self,
        *,
        listing: Listing,
        viewer_id: UUID | None = None,
        session: AsyncSession | None = None,
    ) -> ListingResponse:

        images = []

        for image in listing.images:
            url = await self.listing_image_service.get_image_url(
                image=image,
            )

            images.append(
                ListingImageResponse(
                    id=image.id,
                    original_filename=image.original_filename,
                    content_type=image.content_type,
                    file_size=image.file_size,
                    display_order=image.display_order,
                    url=url,
                )
            )

        contact_unlocked = await self._is_contact_unlocked(
            listing=listing,
            viewer_id=viewer_id,
            session=session,
        )
        seller = listing.seller
        seller_contact = seller if contact_unlocked else ContactablePublic(
            id=seller.id,
            name=seller.name,
            phone=None,
        )

        return ListingResponse(
            id=listing.id,
            seller_id=listing.seller_id,
            title=listing.title,
            description=listing.description,
            price=listing.price,
            category=listing.category,
            image_path=listing.image_path,
            is_approved=listing.is_approved,
            is_active=listing.is_active,
            needs_review=listing.needs_review,
            review_reason=listing.review_reason,
            created_at=listing.created_at,
            images=images,
            seller=seller_contact,
            contact_unlocked=contact_unlocked,
        )

    async def _is_contact_unlocked(
        self,
        *,
        listing: Listing,
        viewer_id: UUID | None,
        session: AsyncSession | None,
    ) -> bool:
        if viewer_id == listing.seller_id:
            return True
        if not self.billing_service.billing_enabled:
            return True
        if listing.seller.billing_mode in {
            MarketplaceBillingMode.SUBSCRIPTION,
            MarketplaceBillingMode.LISTING_FEE,
        }:
            # Subscription users expose contact by plan. For pay-per-listing,
            # payment of the listing is what makes the listing publicly
            # contactable, represented by its approved state.
            return listing.is_approved
        if viewer_id is None or session is None:
            return False

        result = await session.execute(
            select(Transaction.id).where(
                Transaction.listing_id == listing.id,
                Transaction.initiator_id == viewer_id,
                Transaction.status == TransactionStatus.PAID,
            ).limit(1)
        )
        return result.scalar_one_or_none() is not None

# ==================================================================================
    async def list_my_listings(
        self,
        seller_id: UUID,
        session: AsyncSession,
    ) -> list[Listing]:
        result = await session.execute(
            select(Listing)
            .options(
                selectinload(Listing.images),
                selectinload(Listing.seller),
            )
            .where(Listing.seller_id == seller_id)
            .order_by(Listing.created_at.desc())
        )

        return list(result.scalars().all())

# ==================================================================================       
    async def mark_listing_sold(
        self,
        listing_id: UUID,
        seller_id: UUID,
        session: AsyncSession,
    ) -> Listing:
        listing = await self.get_listing(
            listing_id=listing_id,
            session=session,
        )

        if listing.seller_id != seller_id:
            raise HTTPException(
                status_code=403,
                detail="You do not own this listing.",
            )

        listing.is_active = False

        await session.commit()

        return listing
        
# ==================================================================================
    async def delete_listing(
        self,
        listing_id: UUID,
        seller_id: UUID,
        session: AsyncSession,
    ) -> None:
        listing = await self.get_listing(
            listing_id=listing_id,
            session=session,
        )

        if listing.seller_id != seller_id:
            raise HTTPException(
                status_code=403,
                detail="You do not own this listing.",
            )

        storage_keys = (
            await self.listing_image_service.get_storage_keys(
                listing_id=listing.id,
                session=session,
            )
        )

        await session.delete(listing)
        await session.commit()

        await self.listing_image_service.delete_storage_objects(
            storage_keys=storage_keys,
        )


# ==================================================================================
    async def update_listing(
        self,
        listing_id: UUID,
        seller_id: UUID,
        data: ListingUpdate,
        session: AsyncSession,
    ) -> Listing:
        listing = await self.get_listing(
            listing_id=listing_id,
            session=session,
        )

        if listing.seller_id != seller_id:
            raise HTTPException(
                status_code=403,
                detail="You do not own this listing.",
            )

        update_data = data.model_dump(exclude_unset=True)

        if not listing.is_approved and "price" in update_data:
            raise HTTPException(
                status_code=400,
                detail=(
                    "The price cannot be changed while this listing is "
                    "awaiting payment/approval."
                ),
            )

        if "title" in update_data or "description" in update_data:
            title = update_data.get("title", listing.title)
            description = update_data.get("description", listing.description)
            moderation_result = scan_text(f"{title} {description}")

            if not moderation_result["passed"]:
                raise HTTPException(
                    status_code=400,
                    detail={
                        "message": "Listing contains prohibited contact information.",
                        "reason": moderation_result["reason"],
                        "flagged": moderation_result["flagged"],
                    },
                )

        for field, value in update_data.items():
            setattr(listing, field, value)

        await session.commit()

        result = await session.execute(
            select(Listing)
            .options(
                selectinload(Listing.images),
                selectinload(Listing.seller),
            )
            .where(Listing.id == listing.id)
        )

        return result.scalar_one()

# ==================================================================================
    async def add_listing_images(
        self,
        listing_id: UUID,
        seller_id: UUID,
        images: Sequence[ImageUpload],
        session: AsyncSession,
    ) -> Listing:
        listing = await self.get_listing(
            listing_id=listing_id,
            session=session,
        )

        if listing.seller_id != seller_id:
            raise HTTPException(
                status_code=403,
                detail="You do not own this listing.",
            )

        seller = await session.get(User, seller_id)
        if seller is None:
            raise HTTPException(status_code=404, detail="User not found.")

        await self.listing_image_service.add_images(
            listing_id=listing.id,
            uploads=images,
            session=session,
            scan_for_contact=self.billing_service.get_capabilities(
                seller
            ).requires_contact_scanning,
        )

        await session.commit()

        result = await session.execute(
            select(Listing)
            .options(
                selectinload(Listing.images),
                selectinload(Listing.seller),
            )
            .where(Listing.id == listing.id)
        )

        return result.scalar_one()

