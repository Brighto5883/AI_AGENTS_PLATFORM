import uuid
from datetime import UTC, datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.db import Base
from app.marketplace.enums import PaymentRequiredFrom, TransactionStatus


class Transaction(Base):

    __tablename__ = "transactions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    listing_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("listings.id"),
        nullable=True,
        index=True,
    )

    wanted_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("wanted_posts.id"),
        nullable=True,
        index=True,
    )

    buyer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    seller_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    initiator_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    fee_amount: Mapped[float] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )

    payment_required_from: Mapped[PaymentRequiredFrom] = mapped_column(
        Enum(
            PaymentRequiredFrom,
            name="payment_required_from",
        ),
        nullable=False,
    )

    payer_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True,
        index=True,
    )

    status: Mapped[TransactionStatus] = mapped_column(
        Enum(
            TransactionStatus,
            name="transaction_status",
        ),
        nullable=False,
        default=TransactionStatus.PENDING_PAYMENT,
    )

    payment_reference: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
        unique=True,
    )

    paid_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )

    listing = relationship("Listing")

    wanted_post = relationship("WantedPost")

    buyer = relationship(
        "User",
        foreign_keys=[buyer_id],
        back_populates="bought_transactions",
    )

    seller = relationship(
        "User",
        foreign_keys=[seller_id],
        back_populates="sold_transactions",
    )

    initiator = relationship(
        "User",
        foreign_keys=[initiator_id],
    )

    payer = relationship(
        "User",
        foreign_keys=[payer_id],
    )
