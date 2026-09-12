import hmac

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.settings import settings
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
    callback_token: str | None = Query(default=None, alias="token"),
    session: AsyncSession = Depends(get_async_session),
):
    expected_token = settings.MPESA_CALLBACK_TOKEN
    if expected_token is None and settings.APP_ENV.lower() == "production":
        raise HTTPException(status_code=503, detail="M-Pesa callback is not configured.")
    if expected_token is not None and not hmac.compare_digest(
        callback_token or "", expected_token
    ):
        raise HTTPException(status_code=403, detail="Invalid callback token.")
    await container.payment_service.process_mpesa_callback(
        callback=data.body.stk_callback,
        session=session,
    )

    await session.commit()

    return {
        "ResultCode": 0,
        "ResultDesc": "Callback processed successfully.",
    }