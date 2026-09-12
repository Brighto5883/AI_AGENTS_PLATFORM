from enum import StrEnum


class MarketplaceBillingMode(StrEnum):
    CONNECTION_FEE = "connection_fee"
    LISTING_FEE = "listing_fee"
    SUBSCRIPTION = "subscription"


class BillingStatus(StrEnum):
    ACTIVE = "active"
    PAST_DUE = "past_due"
    PENDING = "pending"
    EXPIRED = "expired"
    SUSPENDED = "suspended"
