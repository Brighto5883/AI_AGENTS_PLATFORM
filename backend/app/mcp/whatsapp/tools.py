# app/mcp/whatsapp/tools.py

from sqlalchemy.ext.asyncio import AsyncSession

from app.mcp.whatsapp.resources import (
    get_business_faqs,
    get_customer_profile,
    get_writing_style,
)


async def get_conversation_context(db: AsyncSession, conversation_id: str) -> dict:
    """
    Gathers everything the agent's own LLM needs to draft, classify,
    summarize, or suggest a follow-up. No reasoning happens here —
    this is a data assembly step only.
    """
    return {
        "customer_profile": await get_customer_profile(db, conversation_id),
        # "conversation_history": await get_recent_conversation(db, conversation_id), - stripped
        # off because memory_service nows supplies the invokation with conversation history
        "business_faqs": get_business_faqs(),
        "writing_style": get_writing_style(),
    }