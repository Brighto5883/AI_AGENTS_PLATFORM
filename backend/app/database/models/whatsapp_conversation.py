# Data layer — a real place for conversations to live
import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Text, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.db import Base
import enum


class MessageDirection(str, enum.Enum):
    INBOUND = "inbound"   # from customer
    OUTBOUND = "outbound" # sent by us / drafted by AI


class MessageType(str, enum.Enum):
    TEXT = "text"
    AUDIO = "audio"
    IMAGE = "image"  # added now so the enum doesn't need a second migration when Phase G continues into images

class WhatsAppConversation(Base):
    __tablename__ = "whatsapp_conversations"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    customer_phone: Mapped[str] = mapped_column(String, index=True)
    customer_name: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    messages: Mapped[list["WhatsAppMessage"]] = relationship(
        back_populates="conversation", order_by="WhatsAppMessage.created_at"
    )


class WhatsAppMessage(Base):
    __tablename__ = "whatsapp_messages"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    conversation_id: Mapped[str] = mapped_column(ForeignKey("whatsapp_conversations.id"), index=True)
    direction: Mapped[MessageDirection] = mapped_column(SAEnum(MessageDirection))
    message_type: Mapped[MessageType] = mapped_column(SAEnum(MessageType), default=MessageType.TEXT)
    content: Mapped[str] = mapped_column(Text)  # transcript for audio, description for image, raw text otherwise
    whatsapp_message_id: Mapped[str | None] = mapped_column(String, unique=True, nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    conversation: Mapped["WhatsAppConversation"] = relationship(back_populates="messages")