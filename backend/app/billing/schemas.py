from decimal import Decimal

from pydantic import BaseModel

from app.billing.enums import MarketplaceBillingMode


class MarketplaceBillingPlan(BaseModel):
    mode: MarketplaceBillingMode
    name: str
    description: str
    monthly_fee: Decimal | None = None
    listing_fee_per_item: Decimal | None = None
    connection_fee: Decimal | None = None
    includes_connection_fee: bool
    contact_access: str


class MarketplaceBillingInfo(BaseModel):
    billing_enabled: bool
    current_mode: str
    currency: str
    notice_title: str
    notice_message: str
    plans: list[MarketplaceBillingPlan]
