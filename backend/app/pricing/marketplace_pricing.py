from decimal import Decimal

DEFAULT_BASE_FEE = Decimal("20.00")
DEFAULT_PRICE_THRESHOLD = Decimal("5000.00")
DEFAULT_THRESHOLD_FEE = Decimal("10.00")


CATEGORY_PRICING: dict[str, dict[str, Decimal]] = {
    "electronics": {
        "base_fee": Decimal("30.00"),
        "price_threshold": Decimal("10000.00"),
        "threshold_fee": Decimal("20.00"),
    },
    "food": {
        "base_fee": Decimal("10.00"),
        "price_threshold": Decimal("3000.00"),
        "threshold_fee": Decimal("10.00"),
    },
    "services": {
        "base_fee": Decimal("20.00"),
        "price_threshold": Decimal("5000.00"),
        "threshold_fee": Decimal("10.00"),
    },
    "furniture": {
        "base_fee": Decimal("30.00"),
        "price_threshold": Decimal("15000.00"),
        "threshold_fee": Decimal("20.00"),
    },
    "housing": {
        "base_fee": Decimal("50.00"),
        "price_threshold": Decimal("30000.00"),
        "threshold_fee": Decimal("50.00"),
    },
}


def get_service_fee(
    category: str,
    amount: Decimal | None,
) -> Decimal:
    normalized_category = category.strip().lower()

    pricing = CATEGORY_PRICING.get(
        normalized_category,
        {
            "base_fee": DEFAULT_BASE_FEE,
            "price_threshold": DEFAULT_PRICE_THRESHOLD,
            "threshold_fee": DEFAULT_THRESHOLD_FEE,
        },
    )

    fee = pricing["base_fee"]

    if (
    amount is not None
        and amount >= pricing["price_threshold"]
    ):
        fee += pricing["threshold_fee"]

    return fee