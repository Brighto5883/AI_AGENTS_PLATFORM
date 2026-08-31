from decimal import Decimal

DEFAULT_CONNECTION_FEE = Decimal("50.00")

CATEGORY_CONNECTION_FEES: dict[str, Decimal] = {
    "electronics": Decimal("50.00"),
    "vehicles": Decimal("200.00"),
    "real_estate": Decimal("500.00"),
    "services": Decimal("50.00"),
}


def get_connection_fee(category: str) -> Decimal:
    normalized_category = category.strip().lower()

    return CATEGORY_CONNECTION_FEES.get(
        normalized_category,
        DEFAULT_CONNECTION_FEE,
    )