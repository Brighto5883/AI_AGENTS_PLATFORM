"""add marketplace tables

Revision ID: 5f9a7c4daf7e
Revises: b3d2b10cca5f
Create Date: 2026-08-29

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql


revision: str = "5f9a7c4daf7e"
down_revision: str | Sequence[str] | None = "b3d2b10cca5f"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "listings",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "seller_id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
        ),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("price", sa.Numeric(12, 2), nullable=False),
        sa.Column("category", sa.String(length=100), nullable=False),
        sa.Column("image_path", sa.String(length=500), nullable=True),
        sa.Column("is_approved", sa.Boolean(), nullable=False),
        sa.Column("needs_review", sa.Boolean(), nullable=False),
        sa.Column("review_reason", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["seller_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        "ix_listings_seller_id",
        "listings",
        ["seller_id"],
    )
    op.create_index(
        "ix_listings_category",
        "listings",
        ["category"],
    )

    op.create_table(
        "wanted_posts",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "buyer_id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
        ),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("budget", sa.Numeric(12, 2), nullable=True),
        sa.Column("is_open", sa.Boolean(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["buyer_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        "ix_wanted_posts_buyer_id",
        "wanted_posts",
        ["buyer_id"],
    )

    op.create_table(
        "transactions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "listing_id",
            postgresql.UUID(as_uuid=True),
            nullable=True,
        ),
        sa.Column(
            "wanted_id",
            postgresql.UUID(as_uuid=True),
            nullable=True,
        ),
        sa.Column(
            "buyer_id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
        ),
        sa.Column(
            "seller_id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
        ),
        sa.Column("fee_paid", sa.Boolean(), nullable=False),
        sa.Column("fee_amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("paid_by", sa.String(length=10), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["listing_id"], ["listings.id"]),
        sa.ForeignKeyConstraint(["wanted_id"], ["wanted_posts.id"]),
        sa.ForeignKeyConstraint(["buyer_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["seller_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        "ix_transactions_listing_id",
        "transactions",
        ["listing_id"],
    )
    op.create_index(
        "ix_transactions_wanted_id",
        "transactions",
        ["wanted_id"],
    )
    op.create_index(
        "ix_transactions_buyer_id",
        "transactions",
        ["buyer_id"],
    )
    op.create_index(
        "ix_transactions_seller_id",
        "transactions",
        ["seller_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_transactions_seller_id", table_name="transactions")
    op.drop_index("ix_transactions_buyer_id", table_name="transactions")
    op.drop_index("ix_transactions_wanted_id", table_name="transactions")
    op.drop_index("ix_transactions_listing_id", table_name="transactions")
    op.drop_table("transactions")

    op.drop_index("ix_wanted_posts_buyer_id", table_name="wanted_posts")
    op.drop_table("wanted_posts")

    op.drop_index("ix_listings_category", table_name="listings")
    op.drop_index("ix_listings_seller_id", table_name="listings")
    op.drop_table("listings")
