from decimal import Decimal


def get_listing_fee(category: str, amount: Decimal | None) -> Decimal:
    # Listing pricing is configured as a per-item fee. The category/amount
    # arguments are retained so future tiered pricing can be introduced
    # without changing service or API contracts.
    del category, amount
    from app.config.settings import settings
    return settings.marketplace_listing_fee_per_item


def get_service_fee(category: str, amount: Decimal | None) -> Decimal:
    return get_listing_fee(category=category, amount=amount)
