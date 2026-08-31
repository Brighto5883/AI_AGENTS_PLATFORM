from sqlalchemy import select

from app.database.models.whatsapp_conversation import MessageDirection, WhatsAppMessage


async def fetch_recent_messages(conversation_id: str, session, limit: int = 10) -> list[dict]:
    """
    Returns the last `limit` messages for a conversation, oldest first,
    shaped as LangChain-style role/content dicts ready to seed graph state.
    """
    result = await session.execute(
        select(WhatsAppMessage)
        .where(WhatsAppMessage.conversation_id == conversation_id)
        .order_by(WhatsAppMessage.created_at.desc())
        .limit(limit)
    )
    messages = list(reversed(result.scalars().all()))

    return [
        {
            "role": "user" if m.direction == MessageDirection.INBOUND else "assistant",
            "content": m.content,
        }
        for m in messages
    ]
