from fastapi import APIRouter, Depends, Header, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.container import container
from app.database.session import get_async_session

router = APIRouter(
    prefix="/payments/paystack",
    tags=["Paystack"],
)


@router.post("/webhook")
async def paystack_webhook(
    request: Request,
    x_paystack_signature: str | None = Header(
        default=None,
    ),
    session: AsyncSession = Depends(
        get_async_session,
    ),
):
    payload = await request.body()

    await container.payment_service.process_paystack_webhook(
        payload=payload,
        signature=x_paystack_signature,
        session=session,
    )

    await session.commit()

    return {"status": "ok"}