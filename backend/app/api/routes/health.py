from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.cache import get_redis_client
from app.database.session import get_async_session

router = APIRouter(prefix="/health", tags=["Health"])


@router.get("/")
async def liveness() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/ready")
async def readiness(
    session: AsyncSession = Depends(get_async_session),
) -> dict[str, str | bool]:
    try:
        await session.execute(text("SELECT 1"))
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Database is unavailable.") from exc

    result: dict[str, str | bool] = {
        "status": "ready",
        "database": True,
    }

    redis_client = get_redis_client()
    if redis_client is not None:
        try:
            await redis_client.ping()
            result["redis"] = True
        except Exception:
            # Redis is currently optional; report degraded state without
            # making the whole application unready.
            result["redis"] = False

    return result
