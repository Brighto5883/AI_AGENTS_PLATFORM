import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.db import Base


class LLMUsageLog(Base):
    """
    One row per LLM completion attempt (success or failure), attributed
    to a user and an agent. Written from litellm's success/failure
    callbacks via app.llm.gateway.UsageLogger.
    """

    __tablename__ = "llm_usage_logs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True
    )
    user = relationship("User", back_populates="llm_usage_logs")

    # "whatsapp", "email", "road_design", "podcast", etc.
    agent_name: Mapped[str] = mapped_column(String(64), nullable=False, index=True)

    conversation_id: Mapped[str | None] = mapped_column(String(128), nullable=True, index=True)

    model: Mapped[str | None] = mapped_column(String(128), nullable=True)

    prompt_tokens: Mapped[int | None] = mapped_column(Integer, nullable=True)
    completion_tokens: Mapped[int | None] = mapped_column(Integer, nullable=True)
    total_tokens: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Numeric, not Float — this is money.
    cost: Mapped[float | None] = mapped_column(Numeric(12, 6), nullable=True)

    duration_seconds: Mapped[float | None] = mapped_column(Numeric(8, 3), nullable=True)

    # "success" | "failure"
    status: Mapped[str] = mapped_column(String(16), nullable=False, index=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )