from fastapi import APIRouter, Depends

from app.billing.schemas import MarketplaceBillingInfo
from app.core.container import container
from app.database.models.user import User
from app.database.users import current_active_user

router = APIRouter(
    prefix="/marketplace/billing",
    tags=["Marketplace Billing"],
)


@router.get("/info", response_model=MarketplaceBillingInfo)
async def get_marketplace_billing_info(
    authenticated_user: User = Depends(current_active_user),
) -> MarketplaceBillingInfo:
    del authenticated_user
    return container.billing_service.get_billing_info()
