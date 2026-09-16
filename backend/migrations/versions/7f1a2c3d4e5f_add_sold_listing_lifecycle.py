"""add sold listing lifecycle fields

Revision ID: 7f1a2c3d4e5f
Revises: 2468cef36cb2
Create Date: 2026-09-16 17:30:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "7f1a2c3d4e5f"
down_revision: str | Sequence[str] | None = "2468cef36cb2"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "listings",
        sa.Column(
            "sold_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
    )
    op.add_column(
        "listings",
        sa.Column(
            "scheduled_deletion_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
    )
    op.create_index(
        "ix_listings_scheduled_deletion_at",
        "listings",
        ["scheduled_deletion_at"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_listings_scheduled_deletion_at",
        table_name="listings",
    )
    op.drop_column("listings", "scheduled_deletion_at")
    op.drop_column("listings", "sold_at")
