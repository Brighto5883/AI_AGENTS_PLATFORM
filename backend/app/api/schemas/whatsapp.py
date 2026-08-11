from datetime import datetime
from pydantic import BaseModel
from app.database.models.whatsapp_conversation import MessageDirection


class WhatsAppMessageResponse(BaseModel):
    id: str
    direction: MessageDirection
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


class ConversationThreadResponse(BaseModel):
    conversation_id: str
    customer_phone: str
    customer_name: str | None
    messages: list[WhatsAppMessageResponse]