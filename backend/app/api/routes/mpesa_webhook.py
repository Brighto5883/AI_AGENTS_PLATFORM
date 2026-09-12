from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.container import container
from app.database.session import get_async_session
from app.payments.payment_callback_schemas import (
    MpesaCallbackRequest,
)

router = APIRouter(
    prefix="/payments/mpesa",
    tags=["MPesa"],
)


@router.post("/callback")
async def mpesa_callback(
    data: MpesaCallbackRequest,
    session: AsyncSession = Depends(get_async_session),
):
    await container.payment_service.process_mpesa_callback(
        callback=data.body.stk_callback,
        session=session,
    )

    await session.commit()

    return {
        "ResultCode": 0,
        "ResultDesc": "Callback processed successfully.",
    }