from datetime import UTC, datetime

from fastapi_users.db import SQLAlchemyBaseUserTableUUID
from sqlalchemy import DateTime, Enum, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.billing.enums import BillingStatus, MarketplaceBillingMode
from app.database.base import Base


class User(SQLAlchemyBaseUserTableUUID, Base):
    __tablename__ = "users"

    # Marketplace profile
    name: Mapped[str | None] = mapped_column(
        String(120),
        nullable=True,
    )

    phone: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True,
        index=True,
    )

    role: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="both",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )

    billing_mode: Mapped[MarketplaceBillingMode] = mapped_column(
    Enum(
        MarketplaceBillingMode,
        name="billing_mode",
    ),
    nullable=False,
    default=MarketplaceBillingMode.CONNECTION_FEE,
    )

    billing_status: Mapped[BillingStatus] = mapped_column(
        Enum(
            BillingStatus,
            name="billing_status",
        ),
        nullable=False,
        default=BillingStatus.ACTIVE,
    )

    marketplace_listing_limit: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )
    
    #   RELATIONSHIP BETWEEN TABLES
    queries = relationship(
        "QueryHistory",
        back_populates="user",
    )

    llm_usage_logs = relationship(
        "LLMUsageLog",
        back_populates="user",
    )

    listings = relationship(
    "Listing",
    back_populates="seller",
    )

    wanted_posts = relationship(
        "WantedPost",
        back_populates="requester",
    )

    bought_transactions = relationship(
        "Transaction",
        foreign_keys="Transaction.buyer_id",
        back_populates="buyer",
    )

    sold_transactions = relationship(
        "Transaction",
        foreign_keys="Transaction.seller_id",
        back_populates="seller",
    )