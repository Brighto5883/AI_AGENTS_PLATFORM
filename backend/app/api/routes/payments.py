import logging
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.models.user import User
from app.database.session import get_async_session
from app.database.users import current_active_user
from app.payments.payment_schemas import (
    PaymentVerificationResult,
    VerifyTransactionRequest,
)

logger = logging.getLogger(__name__)


router = APIRouter(
    prefix="/payments",
    tags=["Payments"],
)

@router.post(
    "/{payment_id}/verify-transaction",
    response_model=PaymentVerificationResult,
)
async def verify_transaction(
    payment_id: UUID,
    data: VerifyTransactionRequest,
    authenticated_user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
): #-> Payment:
    # return await container.payment_service.verify_transaction(
    #     payment_id=payment_id,
    #     payer_id=authenticated_user.id,
    #     transaction_code=data.transaction_code,
    #     session=session,
    # )
    pass