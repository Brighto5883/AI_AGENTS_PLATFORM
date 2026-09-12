"""add marketplace database changes

Revision ID: 633288b50c45
Revises: 2de6d5828cf1
Create Date: 2026-09-04 17:42:59.456819

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "633288b50c45"
down_revision: Union[str, Sequence[str], None] = "2de6d5828cf1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    # Create listing images table.
    op.create_table(
        "listing_images",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("listing_id", sa.UUID(), nullable=False),
        sa.Column("storage_key", sa.String(length=500), nullable=False),
        sa.Column("original_filename", sa.String(length=255), nullable=False),
        sa.Column("content_type", sa.String(length=100), nullable=False),
        sa.Column("file_size", sa.Integer(), nullable=False),
        sa.Column("display_order", sa.Integer(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["listing_id"],
            ["listings.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "listing_id",
            "display_order",
            name="uq_listing_image_display_order",
        ),
        sa.UniqueConstraint("storage_key"),
    )

    op.create_index(
        op.f("ix_listing_images_listing_id"),
        "listing_images",
        ["listing_id"],
        unique=False,
    )

    # Remove obsolete transaction payment fields.
    op.drop_constraint(
        op.f("uq_transactions_payment_reference"),
        "transactions",
        type_="unique",
    )

    op.drop_column(
        "transactions",
        "paid_at",
    )

    op.drop_column(
        "transactions",
        "payment_reference",
    )

    # Rename wanted_posts.buyer_id -> requester_id.
    op.drop_constraint(
        op.f("wanted_posts_buyer_id_fkey"),
        "wanted_posts",
        type_="foreignkey",
    )

    op.alter_column(
        "wanted_posts",
        "buyer_id",
        new_column_name="requester_id",
    )

    op.drop_index(
        op.f("ix_wanted_posts_buyer_id"),
        table_name="wanted_posts",
    )

    # Add wanted post category.
    op.add_column(
        "wanted_posts",
        sa.Column(
            "category",
            sa.String(length=100),
            nullable=False,
        ),
    )

    op.create_index(
        op.f("ix_wanted_posts_requester_id"),
        "wanted_posts",
        ["requester_id"],
        unique=False,
    )

    op.create_index(
        op.f("ix_wanted_posts_category"),
        "wanted_posts",
        ["category"],
        unique=False,
    )

    op.create_foreign_key(
        "fk_wanted_posts_requester_id_users",
        "wanted_posts",
        "users",
        ["requester_id"],
        ["id"],
    )


def downgrade() -> None:
    """Downgrade schema."""

    # Remove requester foreign key.
    op.drop_constraint(
        "fk_wanted_posts_requester_id_users",
        "wanted_posts",
        type_="foreignkey",
    )

    # Remove wanted post indexes.
    op.drop_index(
        op.f("ix_wanted_posts_category"),
        table_name="wanted_posts",
    )

    op.drop_index(
        op.f("ix_wanted_posts_requester_id"),
        table_name="wanted_posts",
    )

    # Remove category.
    op.drop_column(
        "wanted_posts",
        "category",
    )

    # Restore buyer_id name.
    op.alter_column(
        "wanted_posts",
        "requester_id",
        new_column_name="buyer_id",
    )

    op.create_index(
        op.f("ix_wanted_posts_buyer_id"),
        "wanted_posts",
        ["buyer_id"],
        unique=False,
    )

    op.create_foreign_key(
        op.f("wanted_posts_buyer_id_fkey"),
        "wanted_posts",
        "users",
        ["buyer_id"],
        ["id"],
    )

    # Restore obsolete transaction payment fields.
    op.add_column(
        "transactions",
        sa.Column(
            "payment_reference",
            sa.VARCHAR(length=255),
            autoincrement=False,
            nullable=True,
        ),
    )

    op.add_column(
        "transactions",
        sa.Column(
            "paid_at",
            postgresql.TIMESTAMP(timezone=True),
            autoincrement=False,
            nullable=True,
        ),
    )

    op.create_unique_constraint(
        op.f("uq_transactions_payment_reference"),
        "transactions",
        ["payment_reference"],
        postgresql_nulls_not_distinct=False,
    )

    # Remove listing images table.
    op.drop_index(
        op.f("ix_listing_images_listing_id"),
        table_name="listing_images",
    )

    op.drop_table("listing_images")