import logging

import redis
import redis.asyncio as aioredis

import litellm
from litellm.caching import Cache

from app.config.settings import settings


logger = logging.getLogger(__name__)

# Internal flag
_CACHE_ENABLED = False


def configure_cache():
    """
    Configure LiteLLM caching.

    If Redis is unavailable, disable caching and allow the application
    to continue normally.
    """

    global _CACHE_ENABLED

    # Always begin with cache disabled.
    litellm.cache = None
    _CACHE_ENABLED = False

    if not settings.ENABLE_CACHE:
        logger.info("LiteLLM cache disabled via settings.")
        return

    try:
        client = redis.Redis(
            host=settings.REDIS_HOST,
            port=settings.REDIS_PORT,
            socket_connect_timeout=1,
            socket_timeout=1,
        )

        client.ping()

        litellm.cache = Cache(
            type="redis",
            host=settings.REDIS_HOST,
            port=settings.REDIS_PORT,
        )

        _CACHE_ENABLED = True

        logger.info("LiteLLM Redis cache enabled.")

    except Exception as e:

        logger.warning(
            f"Redis unavailable. Running without cache. ({e})"
        )

        litellm.cache = None
        _CACHE_ENABLED = False


def is_cache_enabled():
    return _CACHE_ENABLED


_redis_client: aioredis.Redis | None = None


def get_redis_client() -> aioredis.Redis | None:
    """
    A dedicated async Redis connection for application-level caching
    (e.g. conversation history in memory/redis.py) — separate from
    LiteLLM's own internal response cache configured above.
    """
    global _redis_client
    
    if _redis_client is None and settings.ENABLE_CACHE:
        _redis_client = aioredis.Redis(
            host=settings.REDIS_HOST,
            port=settings.REDIS_PORT,
            socket_connect_timeout=1,
            socket_timeout=1,
        )
    return _redis_client