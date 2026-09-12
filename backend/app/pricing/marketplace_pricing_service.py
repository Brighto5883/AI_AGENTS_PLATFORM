from decimal import Decimal

from app.pricing.marketplace_pricing import get_service_fee


class MarketplacePricingService:

    def get_service_fee(
        self,
        *,
        category: str,
        amount: Decimal | None,
    ) -> Decimal:
        return get_service_fee(
            category=category,
            amount=amount,
        )