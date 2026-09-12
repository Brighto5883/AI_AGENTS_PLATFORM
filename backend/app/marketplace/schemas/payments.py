from pydantic import BaseModel, Field


class MarketplacePaymentCreate(BaseModel):
    phone_number: str = Field(min_length=10, max_length=20)
