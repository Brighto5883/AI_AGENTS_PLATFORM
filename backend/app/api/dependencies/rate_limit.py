# app/api/dependencies/rate_limit.py
import asyncio
import logging
import time

from fastapi import Depends, HTTPException

from app.cache import get_redis_client
from app.database.users import current_active_user

logger = logging.getLogger(__name__)

REQUESTS_PER_MINUTE = 20  # tune per plan tier later


async def enforce_rate_limit(user=Depends(current_active_user)):  # noqa: B008
    client = get_redis_client()
    if client is None:
        return  # Redis down — fail open, don't block the platform over a cache outage

    try:
        key = f"ratelimit:{user.id}:{int(time.time() // 60)}"
        count = await client.incr(key)
        if count == 1:
            await client.expire(key, 60)

        if count > REQUESTS_PER_MINUTE:
            raise HTTPException(
                status_code=429,
                detail="Rate limit exceeded. Try again after One Minute.",
            )

    except HTTPException:
        raise  # this is a real, intentional rejection — let it propagate
    except Exception as e:
        # Redis itself failed (timeout, connection refused, etc.) — fail open,
        # never let infrastructure trouble block real traffic.
        logger.warning("Redis error in rate limiter; allowing request through", exc_info=True)
        return


async def wait_for_rate_limit_slot(
    phone: str, limit_per_minute: int = 10, max_wait_seconds: int = 45
):
    """
    Instead of rejecting outright, waits briefly for the current rate-limit
    window to clear, then proceeds. Only truly gives up if the wait itself
    is exceeded — protecting against abuse/loops, not against normal bursts.
    """
    client = get_redis_client()
    if client is None:
        return  # fail open, same as before

    waited = 0
    check_interval = 5

    while waited < max_wait_seconds:
        try:
            key = f"ratelimit:phone:{phone}:{int(time.time() // 60)}"
            count = await client.incr(key)
            if count == 1:
                await client.expire(key, 60)

            if count <= limit_per_minute:
                return  # got a slot, proceed normally

            await client.decr(key)  # don't consume a slot for a failed attempt

        except Exception as e:
            # Redis itself failed — fail open, don't block message processing
            # over an infrastructure hiccup.
            logger.warning("Redis error during rate-limit wait; allowing message through", exc_info=True)
            return

        await asyncio.sleep(check_interval)
        waited += check_interval

    raise ValueError(f"Rate limit wait exceeded for {phone} after {max_wait_seconds}s")

# async def enforce_phone_rate_limit(phone: str, limit_per_minute: int = 10):
#     """
#     Same fixed-window pattern as enforce_rate_limit, but keyed by WhatsApp
#     phone number instead of platform user_id — for unauthenticated inbound
#     traffic (the webhook), where there's no logged-in user to key against.
#     Called directly, not via Depends, since the phone number only becomes
#     known after parsing the webhook's JSON body.
#     """
#     client = get_redis_client()
#     if client is None:
#         return

#     key = f"ratelimit:phone:{phone}:{int(__import__('time').time() // 60)}"
#     count = await client.incr(key)
#     if count == 1:
#         await client.expire(key, 60)

#     if count > limit_per_minute:
#         raise ValueError(f"Rate limit exceeded for {phone}")
