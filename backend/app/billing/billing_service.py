from dataclasses import dataclass
from decimal import Decimal

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.billing.enums import (
    BillingStatus,
    MarketplaceBillingMode,
)
from app.database.models.listing import Listing
from app.database.models.user import User
from app.pricing.marketplace_pricing_service import MarketplacePricingService


@dataclass(frozen=True)
class MarketplaceCapabilities:
    can_create_listing: bool
    requires_contact_scanning: bool
    requires_listing_payment: bool
    requires_connection_payment: bool
    subscription_listing_limit: int | None


@dataclass(frozen=True)
class ListingBillingDecision:
    can_create: bool
    requires_payment: bool
    requires_contact_scanning: bool
    listing_fee: Decimal | None
    subscription_listing_limit: int | None


class BillingService:
    def __init__(
        self,
        pricing_service: MarketplacePricingService,
    ):
        self.pricing_service = pricing_service
        

    def get_capabilities(
        self,
        user: User,
    ) -> MarketplaceCapabilities:

        if user.billing_status != BillingStatus.ACTIVE:
            return MarketplaceCapabilities(
                can_create_listing=False,
                requires_contact_scanning=False,
                requires_listing_payment=False,
                requires_connection_payment=False,
                subscription_listing_limit=None,
            )

        if user.billing_mode == MarketplaceBillingMode.CONNECTION_FEE:
            return MarketplaceCapabilities(
                can_create_listing=True,
                requires_contact_scanning=True,
                requires_listing_payment=False,
                requires_connection_payment=True,
                subscription_listing_limit=None,
            )

        if user.billing_mode == MarketplaceBillingMode.LISTING_FEE:
            return MarketplaceCapabilities(
                can_create_listing=True,
                requires_contact_scanning=False,
                requires_listing_payment=True,
                requires_connection_payment=False,
                subscription_listing_limit=None,
            )

        if user.billing_mode == MarketplaceBillingMode.SUBSCRIPTION:
            return MarketplaceCapabilities(
                can_create_listing=True,
                requires_contact_scanning=False,
                requires_listing_payment=False,
                requires_connection_payment=False,
                subscription_listing_limit=user.marketplace_listing_limit,
            )

        raise HTTPException(
            status_code=500,
            detail="Unsupported marketplace billing mode.",
        )

    def validate_listing_creation(
        self,
        user: User,
    ) -> MarketplaceCapabilities:

        capabilities = self.get_capabilities(user)

        if not capabilities.can_create_listing:
            raise HTTPException(
                status_code=403,
                detail=(
                    "Your marketplace billing status does not currently "
                    "allow you to create listings."
                ),
            )

        return capabilities

    def evaluate_listing_creation(
        self,
        user: User,
        category: str,
        price: Decimal,
    ) -> ListingBillingDecision:

        capabilities = self.validate_listing_creation(user)

        listing_fee: Decimal | None = None

        if capabilities.requires_listing_payment:
            listing_fee = self.pricing_service.get_service_fee(
                category=category,
                amount=price,
            )

        return ListingBillingDecision(
            can_create=capabilities.can_create_listing,
            requires_payment=capabilities.requires_listing_payment,
            requires_contact_scanning=capabilities.requires_contact_scanning,
            listing_fee=listing_fee,
            subscription_listing_limit=(
                capabilities.subscription_listing_limit
            ),
        )

    async def validate_subscription_quota(
        self,
        user: User,
        session: AsyncSession,
    ) -> None:

        if user.billing_mode != MarketplaceBillingMode.SUBSCRIPTION:
            return

        if user.marketplace_listing_limit is None:
            raise HTTPException(
                status_code=500,
                detail="Subscription listing limit is not configured.",
            )

        result = await session.execute(
            select(func.count(Listing.id)).where(
                Listing.seller_id == user.id,
                Listing.is_approved.is_(True),
            )
        )

        listing_count = result.scalar_one()

        if listing_count >= user.marketplace_listing_limit:
            raise HTTPException(
                status_code=403,
                detail=(
                    "You have reached your current marketplace listing "
                    "limit. Upgrade your plan or remove an existing listing."
                ),
            )