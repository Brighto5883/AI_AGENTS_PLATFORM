# Data layer — an AI-proposed reply, awaiting (or having received) human review
import uuid
from datetime import UTC, datetime
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy import Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.enums import DraftStatus
from app.database.base import Base

if TYPE_CHECKING:
    from app.database.models.whatsapp_conversation import (
        WhatsAppConversation,
        WhatsAppMessage,
    )

class DraftReply(Base):
    __tablename__ = "draft_replies"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))

    conversation_id: Mapped[str] = mapped_column(
        ForeignKey("whatsapp_conversations.id"), index=True
    )

    # Owner of this platform service. Nullable for legacy/external WhatsApp
    # conversations that are not associated with a registered platform user.
    user_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    trigger_message_id: Mapped[str] = mapped_column(
        ForeignKey("whatsapp_messages.id"), index=True
    )

    draft_content: Mapped[str] = mapped_column(Text)
    edited_content: Mapped[str | None] = mapped_column(Text, nullable=True)

    status: Mapped[DraftStatus] = mapped_column(
        SAEnum(DraftStatus), default=DraftStatus.PENDING, index=True
    )

    reviewed_by: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("users.id"), 
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    conversation: Mapped["WhatsAppConversation"] = relationship()
    trigger_message: Mapped["WhatsAppMessage"] = relationship()