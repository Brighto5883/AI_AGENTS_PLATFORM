"""add paystack payment provider

Revision ID: 2468cef36cb2
Revises: 931114d333c2
Create Date: 2026-09-14 08:47:36.189693

"""

from collections.abc import Sequence

from alembic import op

# revision identifiers, used by Alembic.
revision: str = '2468cef36cb2'
down_revision: str | Sequence[str] | None = "931114d333c2"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute(
        "ALTER TYPE payment_provider ADD VALUE IF NOT EXISTS 'PAYSTACK'"
    )


def downgrade() -> None:
    # PostgreSQL does not support directly removing an enum value.
    # A downgrade would require recreating the enum type.
    pass
