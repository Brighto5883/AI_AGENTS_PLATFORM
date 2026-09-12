from decimal import Decimal

from app.pricing.marketplace_pricing import get_listing_fee


class MarketplacePricingService:
    def get_listing_fee(self, *, category: str, amount: Decimal | None) -> Decimal:
        return get_listing_fee(category=category, amount=amount)

    def get_connection_fee(self) -> Decimal:
        from app.config.settings import settings
        return settings.marketplace_connection_fee
