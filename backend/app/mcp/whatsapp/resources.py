# app/mcp/whatsapp/resources.py

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.models.whatsapp_conversation import (
    WhatsAppConversation,
    WhatsAppMessage,
)

BUSINESS_FAQS = {
    "hours": "We are open Monday to Friday, 8am to 5pm EAT.",
    "pricing": "Pricing depends on the service tier — ask and I'll route you to sales.",
}

WRITING_STYLE_NOTES = (
    "Keep replies short (2-4 sentences), warm, and direct. "
    "Avoid corporate jargon. Use the customer's name when known."
)


async def get_customer_profile(db: AsyncSession, conversation_id: str) -> dict:
    convo = await db.get(WhatsAppConversation, conversation_id)
    if not convo:
        return {"error": f"No conversation found for id={conversation_id}"}
    return {
        "customer_name": convo.customer_name,
        "customer_phone": convo.customer_phone,
        "conversation_started": convo.created_at.isoformat(),
    }


async def get_recent_conversation(db: AsyncSession, conversation_id: str, limit: int = 10) -> list[dict]:
    stmt = (
        select(WhatsAppMessage)
        .where(WhatsAppMessage.conversation_id == conversation_id)
        .order_by(WhatsAppMessage.created_at.desc())
        .limit(limit)
    )
    result = await db.execute(stmt)
    messages = result.scalars().all()
    return [
        {"direction": m.direction.value, "content": m.content, "at": m.created_at.isoformat()}
        for m in reversed(messages)
    ]


def get_business_faqs() -> dict:
    return BUSINESS_FAQS


def get_writing_style() -> str:
    return WRITING_STYLE_NOTES