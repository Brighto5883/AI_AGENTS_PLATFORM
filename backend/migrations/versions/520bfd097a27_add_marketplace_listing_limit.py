"""add marketplace billing fields

Revision ID: 520bfd097a27
Revises: 90b5eb3d6caa
Create Date: 2026-08-31 17:09:34.528831

"""

from typing import Sequence

import sqlalchemy as sa
from alembic import op


revision: str = "520bfd097a27"
down_revision: str | Sequence[str] | None = "90b5eb3d6caa"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    billing_mode_enum = sa.Enum(
        "CONNECTION_FEE",
        "LISTING_FEE",
        "SUBSCRIPTION",
        name="billing_mode",
    )

    billing_status_enum = sa.Enum(
        "ACTIVE",
        "PAST_DUE",
        "PENDING",
        "EXPIRED",
        "SUSPENDED",
        name="billing_status",
    )

    billing_mode_enum.create(op.get_bind(), checkfirst=True)
    billing_status_enum.create(op.get_bind(), checkfirst=True)

    op.add_column(
        "users",
        sa.Column(
            "billing_mode",
            billing_mode_enum,
            nullable=True,
        ),
    )

    op.add_column(
        "users",
        sa.Column(
            "billing_status",
            billing_status_enum,
            nullable=True,
        ),
    )

    op.add_column(
        "users",
        sa.Column(
            "marketplace_listing_limit",
            sa.Integer(),
            nullable=True,
        ),
    )

    op.execute(
        """
        UPDATE users
        SET
            billing_mode = 'CONNECTION_FEE',
            billing_status = 'ACTIVE'
        WHERE billing_mode IS NULL
        """
    )

    op.alter_column(
        "users",
        "billing_mode",
        existing_type=billing_mode_enum,
        nullable=False,
    )

    op.alter_column(
        "users",
        "billing_status",
        existing_type=billing_status_enum,
        nullable=False,
    )


def downgrade() -> None:
    op.drop_column(
        "users",
        "marketplace_listing_limit",
    )

    op.drop_column(
        "users",
        "billing_status",
    )

    op.drop_column(
        "users",
        "billing_mode",
    )

    billing_status_enum = sa.Enum(
        "ACTIVE",
        "PAST_DUE",
        "PENDING",
        "EXPIRED",
        "SUSPENDED",
        name="billing_status",
    )

    billing_mode_enum = sa.Enum(
        "CONNECTION_FEE",
        "LISTING_FEE",
        "SUBSCRIPTION",
        name="billing_mode",
    )

    billing_status_enum.drop(op.get_bind(), checkfirst=True)
    billing_mode_enum.drop(op.get_bind(), checkfirst=True)