import logging

import redis
import litellm
from litellm.caching import Cache

from app.settings import settings

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