import json
import logging

from redis.exceptions import RedisError

from app.cache import get_redis_client

logger = logging.getLogger(__name__)

CACHE_TTL_SECONDS = 300  # 5 minutes


def _cache_key(conversation_id: str) -> str:
    return f"conversation_history:{conversation_id}"


async def get_cached_history(
    conversation_id: str,
) -> list[dict] | None:
    """
    Get conversation history from Redis.

    Redis is only a cache. If Redis is unavailable or an error occurs,
    return None so the caller can fall back to PostgreSQL.
    """
    try:
        client = get_redis_client()

        if client is None:
            return None

        raw = await client.get(_cache_key(conversation_id))

        if not raw:
            return None

        return json.loads(raw)

    except Exception as exc:
        logger.warning(
            "Redis unavailable while reading conversation history "
            "(conversation_id=%s): %s",
            conversation_id,
            exc,
        )
        return None


async def set_cached_history(
    conversation_id: str,
    history: list[dict],
) -> None:
    """
    Store conversation history in Redis.

    Failure to cache must never break the application.
    """
    try:
        client = get_redis_client()

        if client is None:
            return

        await client.set(
            _cache_key(conversation_id),
            json.dumps(history),
            ex=CACHE_TTL_SECONDS,
        )

    except Exception as exc:
        logger.warning(
            "Redis unavailable while caching conversation history "
            "(conversation_id=%s): %s",
            conversation_id,
            exc,
        )


async def invalidate_history(conversation_id: str) -> None:
    """
    Remove cached conversation history.

    Failure to invalidate Redis must never break the application.
    PostgreSQL remains the source of truth.
    """
    try:
        client = get_redis_client()

        if client is None:
            return

        await client.delete(_cache_key(conversation_id))

    except Exception as exc:
        logger.warning(
            "Redis unavailable while invalidating conversation history "
            "(conversation_id=%s): %s",
            conversation_id,
            exc,
        )
