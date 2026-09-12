from dataclasses import dataclass
from decimal import Decimal

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.billing.enums import BillingStatus, MarketplaceBillingMode
from app.billing.schemas import MarketplaceBillingInfo, MarketplaceBillingPlan
from app.config.settings import settings
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
    def __init__(self, pricing_service: MarketplacePricingService) -> None:
        self.pricing_service = pricing_service

    @property
    def billing_enabled(self) -> bool:
        return settings.marketplace_billing_enabled

    def get_effective_mode(self, user: User) -> MarketplaceBillingMode | None:
        if not self.billing_enabled:
            return None
        return user.billing_mode

    def get_capabilities(self, user: User) -> MarketplaceCapabilities:
        # Launch phase: every marketplace user is temporarily free.
        if not self.billing_enabled:
            return MarketplaceCapabilities(
                can_create_listing=True,
                requires_contact_scanning=True,
                requires_listing_payment=False,
                requires_connection_payment=False,
                subscription_listing_limit=None,
            )

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
                requires_contact_scanning=True,
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

        raise HTTPException(status_code=500, detail="Unsupported marketplace billing mode.")

    def validate_listing_creation(self, user: User) -> MarketplaceCapabilities:
        capabilities = self.get_capabilities(user)
        if not capabilities.can_create_listing:
            raise HTTPException(
                status_code=403,
                detail="Your marketplace billing status does not currently allow you to create listings.",
            )
        return capabilities

    def evaluate_listing_creation(
        self,
        user: User,
        category: str,
        price: Decimal,
    ) -> ListingBillingDecision:
        capabilities = self.validate_listing_creation(user)
        listing_fee = None
        if capabilities.requires_listing_payment:
            listing_fee = self.pricing_service.get_listing_fee(
                category=category,
                amount=price,
            )
        return ListingBillingDecision(
            can_create=capabilities.can_create_listing,
            requires_payment=capabilities.requires_listing_payment,
            requires_contact_scanning=capabilities.requires_contact_scanning,
            listing_fee=listing_fee,
            subscription_listing_limit=capabilities.subscription_listing_limit,
        )

    def get_connection_fee(self) -> Decimal:
        return settings.marketplace_connection_fee

    def get_billing_info(self) -> MarketplaceBillingInfo:
        connection_fee = settings.marketplace_connection_fee
        plans = [
            MarketplaceBillingPlan(
                mode=MarketplaceBillingMode.SUBSCRIPTION,
                name="Marketplace Subscription",
                description="Monthly access with your marketplace contact available to other marketplace users.",
                monthly_fee=settings.marketplace_subscription_monthly_fee,
                connection_fee=Decimal("0.00"),
                includes_connection_fee=True,
                contact_access="Available to everyone in the marketplace.",
            ),
            MarketplaceBillingPlan(
                mode=MarketplaceBillingMode.CONNECTION_FEE,
                name="Pay per connection",
                description="Create listings without a listing fee and pay only when you connect with another user.",
                connection_fee=connection_fee,
                includes_connection_fee=False,
                contact_access="Unlocked after the connection fee is paid.",
            ),
            MarketplaceBillingPlan(
                mode=MarketplaceBillingMode.LISTING_FEE,
                name="Pay per listing",
                description="Pay a listing fee for each item you post. Once the listing is paid for, its contact is available to marketplace users without an additional connection fee.",
                listing_fee_per_item=settings.marketplace_listing_fee_per_item,
                connection_fee=Decimal("0.00"),
                includes_connection_fee=True,
                contact_access="Available to everyone in the marketplace after the listing fee is paid.",
            ),
        ]
        return MarketplaceBillingInfo(
            billing_enabled=self.billing_enabled,
            current_mode="free_launch" if not self.billing_enabled else settings.marketplace_default_billing_mode,
            currency=settings.marketplace_currency,
            notice_title=settings.marketplace_billing_notice_title,
            notice_message=settings.marketplace_billing_notice_message,
            plans=plans,
        )
