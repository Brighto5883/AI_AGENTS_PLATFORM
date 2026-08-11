from app.memory.postgres import fetch_recent_messages
from app.memory.redis import get_cached_history, invalidate_history, set_cached_history


class MemoryService:
    """
    Prepares everything the agent needs to know before a single invocation.
    Postgres is the source of truth (correctly reflects human edits/rejections
    since it's built from WhatsAppMessage, not raw graph state). Redis is a
    short-TTL cache in front of it — never a substitute source of truth.
    """

    def __init__(self, history_limit: int = 10):
        self.history_limit = history_limit

    async def prepare_context(self, conversation_id: str, session) -> dict:
        cached = await get_cached_history(conversation_id)
        if cached is not None:
            return {"history": cached}

        history = await fetch_recent_messages(
            conversation_id, session, limit=self.history_limit
        )
        await set_cached_history(conversation_id, history)
        return {"history": history}

    async def invalidate(self, conversation_id: str) -> None:
        """
        Call whenever a new message (inbound or outbound) is persisted,
        so stale cached history never outlives the conversation it describes.
        Thin wrapper — the actual Redis operation lives in memory/redis.py;
        this keeps callers talking to MemoryService only, never reaching
        past it into the cache module directly.
        """
        await invalidate_history(conversation_id)
